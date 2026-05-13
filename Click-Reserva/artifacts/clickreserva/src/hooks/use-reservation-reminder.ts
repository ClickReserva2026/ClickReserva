import { useEffect, useRef, useCallback } from "react";
import { useGetReservations, getGetReservationsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

const UPCOMING_WINDOW_MIN = 3;
const UPCOMING_WINDOW_MAX = 12;
const PRESENCE_REPEAT_MS = 5 * 60 * 1_000;
const CHECK_INTERVAL_MS = 30_000;

function parseBRDateTime(date: string, time: string): Date | null {
  try {
    const d = date.substring(0, 10);
    const [h, m] = time.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return null;
    return new Date(`${d}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00-03:00`);
  } catch {
    return null;
  }
}

function minutesUntil(dt: Date): number {
  return (dt.getTime() - Date.now()) / 60_000;
}

async function requestNotificationPermission(): Promise<void> {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

function fireNotification(tag: string, title: string, body: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag,
      requireInteraction: true,
      silent: false,
    });
    n.onclick = () => { window.focus(); n.close(); };
  } catch { }
}

export function useReservationReminder() {
  const { user } = useAuth();
  const { toast } = useToast();

  const upcomingNotified = useRef<Set<number>>(new Set());
  const presenceLastFired = useRef<Map<number, number>>(new Map());
  const permissionRequested = useRef(false);

  const queryParams = user?.role === "coordinator" ? {} : { professorId: user?.id };
  const queryKey = getGetReservationsQueryKey(queryParams);

  const { data: reservations } = useGetReservations(
    queryParams,
    { query: { queryKey, enabled: !!user, refetchInterval: CHECK_INTERVAL_MS } }
  );

  const checkReminders = useCallback(() => {
    if (!user || !reservations) return;

    const now = Date.now();

    for (const r of reservations) {
      const start = parseBRDateTime(r.date, r.startTime);
      const end = parseBRDateTime(r.date, r.endTime);
      if (!start || !end) continue;

      const minsUntilStart = minutesUntil(start);

      if (r.status === "confirmed" && !r.confirmedPresence) {
        if (!upcomingNotified.current.has(r.id) &&
            minsUntilStart >= UPCOMING_WINDOW_MIN &&
            minsUntilStart <= UPCOMING_WINDOW_MAX) {
          upcomingNotified.current.add(r.id);

          const minsLabel = Math.round(minsUntilStart);
          const title = `⏰ Aula em ${minsLabel} minuto${minsLabel !== 1 ? "s" : ""}!`;
          const body = `${r.subject} — ${r.roomName}\n${r.startTime}–${r.endTime} | ${r.classGroup}`;

          fireNotification(`upcoming-${r.id}`, title, body);
          toast({ title, description: `${r.subject} na ${r.roomName} às ${r.startTime}`, duration: 20_000 });
        }

        if (minsUntilStart <= 0 && now < end.getTime()) {
          const lastFired = presenceLastFired.current.get(r.id) ?? 0;
          const elapsed = now - lastFired;

          if (elapsed >= PRESENCE_REPEAT_MS) {
            presenceLastFired.current.set(r.id, now);

            const minsIn = Math.round(-minsUntilStart);
            const title = `📋 Confirme sua presença!`;
            const body = lastFired === 0
              ? `${r.subject} na ${r.roomName} começou. Acesse o sistema e confirme sua presença.`
              : `${r.subject} na ${r.roomName} — já se passaram ${minsIn} minuto${minsIn !== 1 ? "s" : ""}. Confirme sua presença!`;

            fireNotification(`presence-${r.id}-${Math.floor(now / PRESENCE_REPEAT_MS)}`, title, body);
            toast({ title, description: `${r.subject} na ${r.roomName} às ${r.startTime}`, duration: 20_000 });
          }
        }
      } else {
        presenceLastFired.current.delete(r.id);
      }
    }
  }, [reservations, user, toast]);

  useEffect(() => {
    if (!user) return;

    if (!permissionRequested.current) {
      permissionRequested.current = true;
      requestNotificationPermission();
    }

    checkReminders();
    const interval = setInterval(checkReminders, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, checkReminders]);
}
