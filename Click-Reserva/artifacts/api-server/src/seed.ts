  import app from "./app";
import { logger } from "./lib/logger";
import { startEmailCron } from "./email-cron";

// Configuração da porta
const port = Number(process.env["PORT"] || 10000);

// Iniciamos o servidor PRIMEIRO para o Render não dar "Exited Early"
const server = app.listen(port, () => {
  logger.info({ port }, "🚀 Servidor ClickReserva Online!");
  
  // Rodar o processo de banco de dados em segundo plano
  configurarBancoSilencioso();
  
  // Iniciar tarefas de e-mail
  try {
    startEmailCron();
  } catch (e) {
    logger.error("Erro ao iniciar Cron de e-mail");
  }
});

async function configurarBancoSilencioso() {
  try {
    logger.info("Tentando conectar ao banco de dados...");
    
    // Importações dinâmicas para evitar que o servidor quebre se o arquivo sumir
    const { db } = await import("./lib/db");
    const { hashPassword } = await import("./lib/auth");
    const { sql } = await import("drizzle-orm");

    // Criação manual da tabela de usuários caso o banco esteja vazio
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

    const senhaSimone = await hashPassword("mudar123");

    // Insere você como professora aprovada
    await db.execute(sql`
      INSERT INTO users (name, email, password, role, registration_status, is_active)
      VALUES ('Simone Vitoriano de Barros', 'simone.vitoriano.barros@escola.pr.gov.br', ${senhaSimone}, 'professor', 'approved', true)
      ON CONFLICT (email) DO NOTHING;
    `);

    logger.info("✅ Usuário de contingência verificado/criado.");
  } catch (error) {
    logger.error("O servidor continuará rodando, mas houve um problema no banco: " + error);
  }
}
