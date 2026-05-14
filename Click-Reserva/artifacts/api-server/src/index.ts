import app from "./app";
import { logger } from "./lib/logger";
import { seedDatabase } from "./seed";
import { startEmailCron } from "./email-cron";
import { sql } from "drizzle-orm";

async function runMigrationPatch() {
  try {
    // Carregamos o DB de forma dinâmica para o Build não reclamar do caminho
    const dbModule = await import("./lib/db");
    const db = dbModule.db;

    logger.info("Sincronizando banco de dados...");

    await db.execute(sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='registration_status') THEN
          ALTER TABLE users ADD COLUMN registration_status TEXT DEFAULT 'approved';
        END IF;

        UPDATE users SET registration_status = 'approved' WHERE registration_status IS NULL;
      END $$;
    `);
    
    logger.info("Banco sincronizado!");
  } catch (error) {
    logger.error("Aviso: O patch automático será tentado novamente na próxima inicialização.");
  }
}

const rawPort = process.env["PORT"];
if (!rawPort) {
  throw new Error("PORT environment variable is required");
}

const port = Number(rawPort);

app.listen(port, async () => {
  logger.info({ port }, "Server listening");
  
  // Executa a correção silenciosamente
  runMigrationPatch().catch(() => {});
  
  // MANTENHA COMENTADO: Isso garante que seus dados não sejam apagados
  // seedDatabase(); 
  
  startEmailCron();
});
