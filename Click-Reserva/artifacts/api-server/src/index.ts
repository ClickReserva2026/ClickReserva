import app from "./app";
import { logger } from "./lib/logger";
// Importações limpas usando o mapeamento oficial do seu monorepo
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema"; 
import { eq } from "drizzle-orm";

const port = Number(process.env["PORT"] || 10000);

app.listen(port, "0.0.0.0", async () => {
  logger.info({ port }, "🚀 ClickReserva Online!");
  
  try {
    const email = "coordenador@escola.pr.gov.br";
    // Tenta verificar se você já existe
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    
    if (!user) {
      await db.insert(usersTable).values({
        name: "Simone Vitoriano",
        email: email,
        passwordHash: "coordenador123",
        role: "coordinator",
        registrationStatus: "approved",
        isActive: true
      });
      logger.info("✅ Usuário mestre criado!");
    }
  } catch (e) {
    logger.error("Aguardando tabelas...");
  }
});
