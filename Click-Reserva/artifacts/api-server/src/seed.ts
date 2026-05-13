import { db, roomsTable, usersTable } from "@workspace/db";
import { count } from "drizzle-orm";
import { logger } from "./lib/logger";
import { hashPassword } from "./routes/auth";

const DEFAULT_ROOMS = [
  { number: "LAB-01", name: "Laboratório de Informática 1", capacity: 30, computers: 25, isActive: true, description: "Laboratório principal com computadores para uso geral" },
  { number: "LAB-02", name: "Laboratório de Informática 2", capacity: 30, computers: 25, isActive: true, description: "Laboratório secundário com computadores para uso geral" },
  { number: "LAB-03", name: "Laboratório de Informática 3", capacity: 25, computers: 20, isActive: true, description: "Laboratório com computadores para projetos especiais" },
  { number: "LAB-04", name: "Laboratório Multimídia", capacity: 20, computers: 15, isActive: true, description: "Laboratório equipado para atividades multimídia" },
];

const DEFAULT_COORDINATOR = {
  name: "Coordenador",
  email: "coordenador@escola.pr.gov.br",
  password: "coordenador123",
  role: "coordinator" as const,
};

export async function seedDatabase() {
  try {
    const [roomCount] = await db.select({ value: count() }).from(roomsTable);
    if ((roomCount?.value ?? 0) === 0) {
      await db.insert(roomsTable).values(DEFAULT_ROOMS);
      logger.info("Salas padrão criadas com sucesso.");
    }

    const [userCount] = await db.select({ value: count() }).from(usersTable);
    if ((userCount?.value ?? 0) === 0) {
      await db.insert(usersTable).values({
        name: DEFAULT_COORDINATOR.name,
        email: DEFAULT_COORDINATOR.email,
        passwordHash: hashPassword(DEFAULT_COORDINATOR.password),
        role: DEFAULT_COORDINATOR.role,
        isActive: true,
        blocked: false,
      });
      logger.info("Coordenador padrão criado com sucesso.");
    }
  } catch (err) {
    logger.error({ err }, "Erro ao executar seed do banco de dados.");
  }
}
