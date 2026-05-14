import app from "./app";
import { logger } from "./lib/logger";
import { seedDatabase } from "./seed";
import { startEmailCron } from "./email-cron";
import { sql } from "drizzle-orm";

// AJUSTE DE CAMINHO: Buscando o banco de dados na pasta correta
// @ts-ignore
import { db } from "../../../lib/db/src/index"; 

async function runMigrationPatch() {
  try {
    logger.info("Sincronizando colunas da tabela de usuários...");

    // Comando SQL para garantir que a tela de professores funcione
    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='registration_status') THEN
          ALTER TABLE users ADD COLUMN registration_status TEXT DEFAULT 'approved';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='total_absences') THEN
          ALTER TABLE users ADD COLUMN total_absences INTEGER DEFAULT 0;
        END IF;
        
        UPDATE users SET registration_status = 'approved' WHERE registration_status IS NULL;
      END $$;
    `);
    
    logger.info("Banco de dados sincronizado!");
  } catch (error) {
    logger.error({ error }, "Aviso: O patch encontrou um detalhe ou as colunas já existem.");
  }
}

const rawPort = process.env["PORT"];
if (!rawPort) {
  throw new Error("PORT environment variable is required");
}

const port = Number(rawPort);

app.listen(port, async () => {
  logger.info({ port }, "Server listening");
  
  // Tenta rodar a correção
  await runMigrationPatch();
  
  // Comentado para preservar seus dados
  // seedDatabase(); 
  
  startEmailCron();
});
