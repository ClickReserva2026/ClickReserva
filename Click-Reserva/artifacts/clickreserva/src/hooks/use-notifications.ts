// frontend/src/hooks/use-notifications.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── Tipos ────────────────────────────────────────────────────────
export interface AppNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  reservationId: number | null;
  read: boolean;
  createdAt: string;
}

// ── Helpers de fetch ─────────────────────────────────────────────
const base = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

async function fetchNotifications(): Promise<AppNotification[]> {
  const res = await fetch(`${base}/api/notifications`, { credentials: "include" });
  if (!res.ok) throw new Error("Erro ao buscar notificações");
  return res.json();
}

async function fetchUnreadCount(): Promise<number> {
  const res = await fetch(`${base}/api/notifications/unread-count`, {
    credentials: "include",
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.count ?? 0;
}

async function markAsRead(id: number): Promise<void> {
  await fetch(`${base}/api/notifications/${id}/read`, {
    method: "POST",
    credentials: "include",
  });
}

async function markAllAsRead(): Promise<void> {
  await fetch(`${base}/api/notifications/read-all`, {
    method: "POST",
    credentials: "include",
  });
}

async function deleteNotification(id: number): Promise<void> {
  await fetch(`${base}/api/notifications/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
}

// ── Hook principal ───────────────────────────────────────────────
export function useNotifications() {
  const queryClient = useQueryClient();

  // Lista completa — revalida a cada 30s
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  // Badge (não lidas) — revalida a cada 30s
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: fetchUnreadCount,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  // Marcar uma como lida
  const readMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  // Marcar todas como lidas
  const readAllMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  // Deletar uma notificação
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: (id: number) => readMutation.mutate(id),
    markAllAsRead: () => readAllMutation.mutate(),
    deleteNotification: (id: number) => deleteMutation.mutate(id),
  };
}
