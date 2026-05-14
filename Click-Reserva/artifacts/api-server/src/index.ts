import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const port = Number(process.env["PORT"] || 10000);

async function bootstrap() {
  try {
    const email = "coordenador@escola.pr.gov.br";
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    
    if (!existing) {
      logger.info("Criando usuário inicial...");
      // Usando uma senha simples que o sistema aceita sem precisar do bcript agora
      await db.insert(usersTable).values({
        name: "Simone Vitoriano",
        email: email,
        passwordHash: "coordenador123", 
        role: "coordinator",
        registrationStatus: "approved",
        isActive: true
      });
      logger.info("✅ Usuário criado!");
    }
  } catch (err) {
    logger.error("Erro no bootstrap, mas o servidor vai ligar mesmo assim.");
  }
}

app.listen(port, () => {
  logger.info({ port }, "🚀 Servidor ClickReserva Online!");
  bootstrap();
});
