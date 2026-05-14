import app from "./app";
import { logger } from "./lib/logger";
import { startEmailCron } from "./email-cron";
import { sql } from "drizzle-orm";

async function forceResetAndSeed() {
  try {
    const dbModule = await import("./lib/db");
    const authModule = await import("./lib/auth");
    const db = dbModule.db;
    const hashPassword = authModule.hashPassword;

    logger.info("Limpando tabelas e criando usuários oficiais...");

    // 1. Limpa as tabelas para evitar erros de estrutura
    await db.execute(sql`DROP TABLE IF EXISTS password_reset_requests CASCADE;`);
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE;`);

    // 2. O Drizzle recriará as tabelas automaticamente ou via seed
    // Mas vamos inserir via SQL puro para garantir que funcione AGORA
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        registration_status TEXT DEFAULT 'approved',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    const senhaCoord = await hashPassword("senha123");
    const senhaSimone = await hashPassword("mudar123");

    await db.execute(sql`
      INSERT INTO users (name, email, password, role, registration_status, is_active)
      VALUES 
      ('Coordenador Geral', 'coordenador@escola.pr.gov.br', ${senhaCoord}, 'coordinator', 'approved', true),
      ('Simone Vitoriano de Barros', 'simone.vitoriano.barros@escola.pr.gov.br', ${senhaSimone}, 'professor', 'approved', true)
      ON CONFLICT (email) DO NOTHING;
    `);

    logger.info("Usuários criados com sucesso!");
  } catch (error) {
    logger.error({ error }, "Erro no processo de inicialização");
  }
}

const port = Number(process.env["PORT"] || 10000);

app.listen(port, async () => {
  logger.info({ port }, "Server listening");
  
  // Roda a criação dos usuários
  await forceResetAndSeed();
  
  startEmailCron();
});
