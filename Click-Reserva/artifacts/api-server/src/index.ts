import app from "./app";
import { logger } from "./lib/logger";
// Usando o nome oficial que você confirmou no package.json
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema"; 
import { eq } from "drizzle-orm";

const port = Number(process.env["PORT"] || 10000);

async function inicializarAcesso() {
  try {
    const email = "coordenador@escola.pr.gov.br";
    // Tenta verificar se o usuário mestre já existe
    const usuario = await db.select().from(usersTable).where(eq(usersTable.email, email));
    
    if (usuario.length === 0) {
      logger.info("Criando usuário mestre inicial...");
      await db.insert(usersTable).values({
        name: "Simone Vitoriano",
        email: email,
        passwordHash: "coordenador123",
        role: "coordinator",
        registrationStatus: "approved",
        isActive: true
      });
      logger.info("✅ Coordenadora Simone pronta para o primeiro acesso!");
    }
  } catch (err) {
    // Se as tabelas ainda não existirem, o logger avisa sem derrubar o servidor
    logger.error("Aguardando sincronização do banco de dados...");
  }
}

app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "🚀 ClickReserva Online via Workspace!");
  inicializarAcesso();
});
