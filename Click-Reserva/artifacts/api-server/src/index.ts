import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable } from "../../lib/db"; 
import { eq } from "drizzle-orm";

const port = Number(process.env["PORT"] || 10000);

async function autoSetup() {
  try {
    logger.info("Verificando banco de dados...");
    
    // Tenta criar o usuário mestre direto no banco (sem passar pela web)
    const email = "coordenador@escola.pr.gov.br";
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    
    if (!existing) {
      await db.insert(usersTable).values({
        name: "Simone Vitoriano",
        email: email,
        passwordHash: "coordenador123", 
        role: "coordinator",
        registrationStatus: "approved",
        isActive: true
      });
      logger.info("✅ Usuário Simone criado com sucesso via servidor!");
    }
  } catch (err) {
    logger.error("Erro no autoSetup (provavelmente tabelas não existem ainda)");
  }
}

app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "🚀 Sistema ClickReserva Online!");
  autoSetup(); // Isso roda dentro do Render, onde não existe bloqueio de navegador
});
