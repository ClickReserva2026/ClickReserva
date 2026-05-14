import app from "./app";
import { logger } from "./lib/logger";
import { startEmailCron } from "./email-cron";
import { sql } from "drizzle-orm";

async function inicializarBanco() {
  try {
    const dbModule = await import("./lib/db");
    const authModule = await import("./lib/auth");
    const db = dbModule.db;
    const hashPassword = authModule.hashPassword;

    logger.info("Iniciando configuração de segurança do banco...");

    // Criar a tabela de usuários se ela não existir (Garante que o site não quebre)
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

    // Criar os usuários oficiais
    const senhaCoord = await hashPassword("senha123");
    const senhaSimone = await hashPassword("mudar123");

    await db.execute(sql`
      INSERT INTO users (name, email, password, role, registration_status, is_active)
      VALUES 
      ('Coordenador Geral', 'coordenador@escola.pr.gov.br', ${senhaCoord}, 'coordinator', 'approved', true),
      ('Simone Vitoriano de Barros', 'simone.vitoriano.barros@escola.pr.gov.br', ${senhaSimone}, 'professor', 'approved', true)
      ON CONFLICT (email) DO NOTHING;
    `);

    logger.info("✅ Banco de dados pronto e usuários configurados!");
  } catch (error) {
    // Se der erro, o servidor não "morre", ele apenas pula a etapa e tenta ligar o site
    logger.error("Aviso: Pulei a etapa de semente de dados, mas tentando ligar o servidor...");
  }
}

const port = Number(process.env["PORT"] || 10000);

app.listen(port, async () => {
  logger.info({ port }, "Servidor ClickReserva iniciado");
  
  // Tenta configurar o banco em segundo plano para não travar a inicialização
  inicializarBanco().catch(err => logger.error("Erro na inicialização silenciosa"));
  
  startEmailCron();
});
