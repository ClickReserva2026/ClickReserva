import { pgTable, text, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { reservationsTable } from "./reservations";

export const absencesTable = pgTable("absences", {
  id: serial("id").primaryKey(),
  professorId: integer("professor_id").notNull().references(() => usersTable.id),
  reservationId: integer("reservation_id").notNull().references(() => reservationsTable.id),
  absenceDate: date("absence_date").notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAbsenceSchema = createInsertSchema(absencesTable).omit({ id: true, recordedAt: true });
export type InsertAbsence = z.infer<typeof insertAbsenceSchema>;
export type Absence = typeof absencesTable.$inferSelect;
