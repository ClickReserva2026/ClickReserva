import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const port = Number(process.env["PORT"] || 10000);

async function inicializarAcesso() {
  try {
    const email = "coordenador@escola.pr.gov.br";
    const usuario = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    if (usuario.length === 0) {
      logger.info("Criando usuário mestre inicial...");
      await db.insert(usersTable).values({
        name: "Simone Vitoriano",
        email,
        passwordHash: "coordenador123",
        role: "coordinator",
        registrationStatus: "approved",
        isActive: true,
      });
      logger.info("✅ Coordenadora Simone pronta!");
    }
  } catch (err) {
    logger.error("Aviso: Tabelas ainda não existem ou erro de conexão.");
  }
}

app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "🚀 ClickReserva Online!");
  inicializarAcesso();
});
