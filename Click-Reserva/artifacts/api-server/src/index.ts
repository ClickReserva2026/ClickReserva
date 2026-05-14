import app from "./app";
import { logger } from "./lib/logger";
import { startEmailCron } from "./email-cron";
import { db } from "./lib/db";
import { sql } from "drizzle-orm";

const port = Number(process.env["PORT"] || 10000);

app.listen(port, async () => {
  logger.info({ port }, "🚀 Servidor ClickReserva Online!");

  // Sincronização manual via SQL para garantir que as tabelas existam
  try {
    logger.info("Verificando estrutura do banco de dados...");
    
    // Cria a tabela de professores/usuários se não existir
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

    // Cria a tabela de pedidos de senha (o erro 500 que você viu)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS password_reset_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL
      );
    `);

    logger.info("✅ Estrutura de tabelas verificada com sucesso!");
  } catch (err) {
    logger.error("Aviso na verificação de tabelas: " + err);
  }

  try {
    startEmailCron();
  } catch (e) {
    logger.error("Erro no Cron de e-mail");
  }
});
