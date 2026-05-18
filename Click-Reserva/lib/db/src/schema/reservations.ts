import { pgTable, text, serial, boolean, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { roomsTable } from "./rooms";

export const reservationsTable = pgTable("reservations", {
  id: serial("id").primaryKey(),
  professorId: integer("professor_id").notNull().references(() => usersTable.id),
  roomId: integer("room_id").notNull().references(() => roomsTable.id),
  date: date("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  subject: text("subject").notNull(),
  classGroup: text("class_group").notNull(),
  status: text("status").notNull().default("confirmed"),
  confirmedPresence: boolean("confirmed_presence").notNull().default(false),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  justificationNote: text("justification_note"),
  justifiedAt: timestamp("justified_at", { withTimezone: true }),
  justifiedByUserId: integer("justified_by_user_id"),
  tabletQuantity: integer("tablet_quantity").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertReservationSchema = createInsertSchema(reservationsTable)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    tabletQuantity: z.number().int().min(0).max(30).default(0),
  });

export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservationsTable.$inferSelect;
