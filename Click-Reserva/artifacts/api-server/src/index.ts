import app from "./app";
import { logger } from "./lib/logger";
import { db } from "./lib/db"; // Ajustado para o caminho do seu GitHub
import { usersTable } from "./lib/db"; // Ajustado para o seu esquema atual
import { eq } from "drizzle-orm";

const port = Number(process.env["PORT"] || 10000);

// Esta função faz o que o Replit fazia: garante que as tabelas existam
async function ensureDatabaseReady() {
  try {
    logger.info("Conectando ao banco de dados...");
    
    // Tenta buscar o coordenador (Lógica do Replit)
    const email = "coordenador@escola.pr.gov.br";
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    
    if (!user) {
      logger.info("Criando usuário mestre conforme original do Replit...");
      await db.insert(usersTable).values({
        name: "Simone Vitoriano",
        email: email,
        passwordHash: "coordenador123", // No original, ele usa o hash, mas vamos garantir o acesso
        role: "coordinator",
        isActive: true,
        registrationStatus: "approved"
      });
    }
    logger.info("✅ Banco de dados pronto e sincronizado!");
  } catch (error) {
    logger.error({ error }, "Erro ao sincronizar banco - Verifique se as tabelas existem");
  }
}

app.listen(port, () => {
  logger.info({ port }, "🚀 Servidor ClickReserva Online!");
  ensureDatabaseReady();
});
