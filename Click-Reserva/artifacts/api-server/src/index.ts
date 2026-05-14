  import app from "./app";
import { logger } from "./lib/logger";
import { seedDatabase } from "./seed";
import { startEmailCron } from "./email-cron";
import { sql } from "drizzle-orm";
// @ts-ignore
import { db } from "./lib/db"; 

async function runMigrationPatch() {
  try {
    logger.info("Iniciando patch de compatibilidade da tabela de usuários...");

    // Este comando SQL resolve o erro 'reading 0' ao garantir a coluna de status
    await db.execute(sql`
      DO $$ 
      BEGIN 
        -- Cria a coluna de status caso ela não exista
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='registration_status') THEN
          ALTER TABLE users ADD COLUMN registration_status TEXT DEFAULT 'approved';
        END IF;

        -- Garante que o coordenador atual esteja com status aprovado para aparecer na lista
        UPDATE users SET registration_status = 'approved' WHERE registration_status IS NULL;
      END $$;
    `);
    
    logger.info("Tabela de usuários sincronizada com sucesso!");
  } catch (error) {
    logger.error({ error }, "Aviso: O patch automático encontrou uma divergência, mas o servidor seguirá tentando.");
  }
}

const rawPort = process.env["PORT"];
if (!rawPort) {
  throw new Error("PORT environment variable is required");
}

const port = Number(rawPort);

app.listen(port, async () => {
  logger.info({ port }, "Server listening");
  
  try {
    // Executa a correção assim que o servidor ligar
    await runMigrationPatch();
    
    // Deixamos o Seed comentado para não resetar seus dados reais
    // seedDatabase(); 
    
    startEmailCron();
  } catch (initError) {
    logger.error({ initError }, "Erro durante a inicialização");
  }
});
