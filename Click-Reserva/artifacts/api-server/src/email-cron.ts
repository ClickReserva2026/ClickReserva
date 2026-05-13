import { db } from "@workspace/db";
import { reservationsTable, usersTable, roomsTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";
import { sendReservationReminder } from "./email";

const REMIND_MINUTES = [10, 5, 1];
const INTERVAL_MS = 60_000;
const sentReminders = new Map<string, boolean>();

function getKey(reservationId: number, minutesBefore: number): string {
  return `${reservationId}-${minutesBefore}`;
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

async function checkAndSendReminders() {
  if (!process.env.RESEND_API_KEY) return;

  try {
    const now = new Date();
    const todayBR = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const dateStr = `${todayBR.getFullYear()}-${String(todayBR.getMonth() + 1).padStart(2, "0")}-${String(todayBR.getDate()).padStart(2, "0")}`;

    const reservations = await db
      .select({
        id: reservationsTable.id,
        date: reservationsTable.date,
        startTime: reservationsTable.startTime,
        endTime: reservationsTable.endTime,
        subject: reservationsTable.subject,
        classGroup: reservationsTable.classGroup,
        status: reservationsTable.status,
        professorEmail: usersTable.email,
        professorName: usersTable.name,
        roomName: roomsTable.name,
      })
      .from(reservationsTable)
      .leftJoin(usersTable, eq(reservationsTable.professorId, usersTable.id))
      .leftJoin(roomsTable, eq(reservationsTable.roomId, roomsTable.id))
      .where(
        and(
          eq(reservationsTable.date, dateStr),
          eq(reservationsTable.status, "confirmed"),
        )
      );

    for (const r of reservations) {
      if (!r.professorEmail || !r.professorName || !r.roomName) continue;

      const start = new Date(`${r.date}T${r.startTime}:00-03:00`);
      const minsUntil = (start.getTime() - now.getTime()) / 60_000;

      for (const mins of REMIND_MINUTES) {
        const key = getKey(r.id, mins);
        if (sentReminders.has(key)) continue;

        if (minsUntil > 0 && minsUntil <= mins + 0.8 && minsUntil >= mins - 0.8) {
          sentReminders.set(key, true);

          console.info(`[email-cron] Enviando lembrete ${mins}min para ${r.professorEmail} (reserva #${r.id} — ${r.subject} às ${r.startTime})`);

          const result = await sendReservationReminder({
            to: r.professorEmail,
            professorName: r.professorName,
            subject: r.subject,
            roomName: r.roomName,
            date: formatDate(r.date),
            startTime: r.startTime,
            endTime: r.endTime,
            classGroup: r.classGroup,
            minutesBefore: mins,
          });

          if (result.ok) {
            console.info(`[email-cron] ✓ E-mail enviado para ${r.professorEmail}`);
          } else {
            console.error(`[email-cron] ✗ Falha ao enviar para ${r.professorEmail}:`, result.error);
            sentReminders.delete(key);
          }
        }
      }
    }

    for (const key of sentReminders.keys()) {
      const idStr = key.split("-")[0];
      const id = parseInt(idStr, 10);
      if (!reservations.find(r => r.id === id)) {
        sentReminders.delete(key);
      }
    }
  } catch (err) {
    console.error("[email-cron] Erro geral:", err);
  }
}

export function startEmailCron() {
  if (!process.env.RESEND_API_KEY) {
    console.info("[email-cron] RESEND_API_KEY não configurado — e-mails desativados.");
    return;
  }
  console.info("[email-cron] ✓ Lembretes por e-mail ativados (10min, 5min, 1min antes).");
  checkAndSendReminders();
  setInterval(checkAndSendReminders, INTERVAL_MS);
}
