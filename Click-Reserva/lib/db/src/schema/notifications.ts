// packages/db/src/schema/notifications.ts
// Adicione este arquivo e exporte-o no schema/index.ts

import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";

// Referência circular evitada usando o nome da tabela diretamente
export const notificationsTable = pgTable("notifications", {
  id:            serial("id").primaryKey(),
  userId:        integer("user_id").notNull(),           // destinatário
  type:          text("type").notNull(),                 // ver tipos abaixo
  title:         text("title").notNull(),
  message:       text("message").notNull(),
  reservationId: integer("reservation_id"),              // link opcional
  read:          boolean("read").notNull().default(false),
  createdAt:     timestamp("created_at").notNull().defaultNow(),
});

// Tipos possíveis de notificação:
// "reservation_submitted"  → professor criou uma reserva (aviso para coordenador)
// "reservation_approved"   → coordenador aprovou (aviso para professor)
// "reservation_rejected"   → coordenador recusou (aviso para professor)
// "reservation_cancelled"  → reserva cancelada (aviso para professor)
// "reservation_reminder"   → lembrete antes da aula (aviso para professor)
// "no_show"                → falta registrada (aviso para professor)

export type NotificationType =
  | "reservation_submitted"
  | "reservation_approved"
  | "reservation_rejected"
  | "reservation_cancelled"
  | "reservation_reminder"
  | "no_show";
