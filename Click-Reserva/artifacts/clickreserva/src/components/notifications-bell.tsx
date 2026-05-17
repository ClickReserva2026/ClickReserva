// frontend/src/components/notifications-bell.tsx
//
// Adicione <NotificationsBell /> no header mobile do main-layout.tsx:
//
//   <header ...>
//     <div className="flex items-center gap-3">
//       <button onClick={...}><Menu /></button>
//       <BrandLogo compact />
//     </div>
//     <NotificationsBell />   ← aqui
//   </header>

import { useState } from "react";
import { Bell, X, Trash2, CheckCheck, Calendar } from "lucide-react";
import { useNotifications, type AppNotification } from "@/hooks/use-notifications";
import { useLocation } from "wouter";

// ── Ícone por tipo de notificação ────────────────────────────────
function typeIcon(type: string): string {
  const map: Record<string, string> = {
    reservation_submitted:  "📋",
    reservation_approved:   "✅",
    reservation_rejected:   "❌",
    reservation_cancelled:  "🚫",
    reservation_reminder:   "⏰",
    no_show:                "⚠️",
  };
  return map[type] ?? "🔔";
}

// ── Cor do item por tipo ─────────────────────────────────────────
function typeBorder(type: string): string {
  const map: Record<string, string> = {
    reservation_approved:  "#059669",
    reservation_rejected:  "#dc2626",
    reservation_cancelled: "#b45309",
    reservation_reminder:  "#2563eb",
    no_show:               "#d97706",
    reservation_submitted: "#6b7280",
  };
  return map[type] ?? "#6b7280";
}

// ── Formata data relativa ────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1)  return "agora mesmo";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `há ${h}h`;
  const d = Math.floor(h / 24);
  return `há ${d} dia${d > 1 ? "s" : ""}`;
}

// ── Item individual ──────────────────────────────────────────────
function NotificationItem({
  notification,
  onRead,
  onDelete,
  onNavigate,
}: {
  notification: AppNotification;
  onRead: () => void;
  onDelete: () => void;
  onNavigate: () => void;
}) {
  return (
    <div
      style={{
        borderLeft: `3px solid ${typeBorder(notification.type)}`,
        background: notification.read ? "transparent" : "#f0fdf4",
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 8,
        position: "relative",
        cursor: notification.reservationId ? "pointer" : "default",
      }}
      onClick={() => {
        if (!notification.read) onRead();
        if (notification.reservationId) onNavigate();
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{typeIcon(notification.type)}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: "0 0 2px",
            fontSize: 13,
            fontWeight: notification.read ? 500 : 700,
            color: "#111827",
            lineHeight: 1.3,
          }}>
            {notification.title}
          </p>
          <p style={{
            margin: "0 0 4px",
            fontSize: 12,
            color: "#6b7280",
            lineHeight: 1.4,
          }}>
            {notification.message}
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#9ca3af" }}>
            {relativeTime(notification.createdAt)}
            {!notification.read && (
              <span style={{
                display: "inline-block",
                width: 6, height: 6,
                borderRadius: "50%",
                background: "#059669",
                marginLeft: 6,
                verticalAlign: "middle",
              }} />
            )}
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#d1d5db", padding: 2, flexShrink: 0,
          }}
          aria-label="Remover notificação"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────
export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  function handleNavigate(n: AppNotification) {
    setOpen(false);
    if (n.reservationId) setLocation(`/reservas`);
  }

  return (
    <>
      {/* ── Botão do sino ── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Notificações"
        style={{
          position: "relative",
          background: "rgba(255,255,255,0.15)",
          border: "none",
          borderRadius: 8,
          padding: "6px 8px",
          cursor: "pointer",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: -4, right: -4,
            background: "#ef4444",
            color: "white",
            fontSize: 10,
            fontWeight: 700,
            borderRadius: 10,
            minWidth: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
            lineHeight: 1,
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── Backdrop ── */}
      {open && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.35)",
            zIndex: 200,
          }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Drawer de notificações ── */}
      {open && (
        <div style={{
          position: "fixed",
          top: 0, right: 0, bottom: 0,
          width: "min(360px, 100vw)",
          background: "white",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
        }}>
          {/* Header do drawer */}
          <div style={{
            background: "linear-gradient(135deg, #064e3b, #059669)",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Bell size={18} color="white" />
              <span style={{ color: "white", fontWeight: 700, fontSize: 16 }}>
                Notificações
              </span>
              {unreadCount > 0 && (
                <span style={{
                  background: "#ef4444",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 10,
                  padding: "1px 7px",
                }}>
                  {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    borderRadius: 6,
                    padding: "5px 8px",
                    color: "white",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                  title="Marcar todas como lidas"
                >
                  <CheckCheck size={14} />
                  Todas lidas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: "none", border: "none",
                  color: "white", cursor: "pointer", padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
            {isLoading && (
              <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 14, marginTop: 40 }}>
                Carregando...
              </p>
            )}
            {!isLoading && notifications.length === 0 && (
              <div style={{ textAlign: "center", marginTop: 60 }}>
                <Bell size={40} color="#d1d5db" style={{ margin: "0 auto 12px" }} />
                <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>
                  Nenhuma notificação ainda.
                </p>
              </div>
            )}
            {notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={() => markAsRead(n.id)}
                onDelete={() => deleteNotification(n.id)}
                onNavigate={() => handleNavigate(n)}
              />
            ))}
          </div>

          {/* Rodapé */}
          <div style={{
            padding: "10px 16px",
            borderTop: "1px solid #f3f4f6",
            textAlign: "center",
            flexShrink: 0,
          }}>
            <p style={{ margin: 0, fontSize: 11, color: "#d1d5db" }}>
              Atualiza automaticamente a cada 30s
            </p>
          </div>
        </div>
      )}
    </>
  );
}
