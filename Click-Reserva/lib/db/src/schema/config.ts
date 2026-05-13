import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const systemConfigTable = pgTable("system_config", {
  id: serial("id").primaryKey(),
  absenceLimitForBlock: integer("absence_limit_for_block").notNull().default(3),
  toleranceMinutes: integer("tolerance_minutes").notNull().default(15),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSystemConfigSchema = createInsertSchema(systemConfigTable).omit({ id: true, updatedAt: true });
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
export type SystemConfig = typeof systemConfigTable.$inferSelect;
