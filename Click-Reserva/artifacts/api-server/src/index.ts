import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";

const port = Number(process.env["PORT"] || 10000);

async function bootstrap() {
  try {
    logger.info("Verificando usuário mestre...");
    const email = "coordenador@escola.pr.gov.br";
    
    // Verifica se você já existe
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    
    if (!existing) {
      logger.info("Criando usuário de coordenadora automaticamente...");
      await db.insert(usersTable).values({
        name: "Simone Vitoriano",
        email: email,
        passwordHash: hashPassword("coordenador123"),
        role: "coordinator",
        registrationStatus: "approved",
        isActive: true
      });
      logger.info("✅ Usuário Simone criado com sucesso!");
    } else {
      logger.info("Usuário já existe no banco.");
    }
  } catch (err) {
    logger.error({ err }, "Erro no auto-cadastro");
  }
}

app.listen(port, () => {
  logger.info({ port }, "🚀 Servidor ClickReserva Online!");
  bootstrap(); // Roda a criação automática
});
