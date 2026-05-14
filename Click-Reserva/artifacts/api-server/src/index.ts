import app from "./app";
import { logger } from "./lib/logger";
import { seedDatabase } from "./seed";
import { startEmailCron } from "./email-cron";
import { sql } from "drizzle-orm";
import { db } from "./lib/db"; // Importamos o db aqui em cima, de forma tradicional

async function runMigrationPatch() {
  try {
    logger.info("Sincronizando colunas da tabela de usuários...");

    // Comando SQL direto e reto para criar as colunas que faltam
    await db.execute(sql`
      DO $$ 
      BEGIN 
        -- Garante a coluna registration_status
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='registration_status') THEN
          ALTER TABLE users ADD COLUMN registration_status TEXT DEFAULT 'approved';
        END IF;

        -- Garante a coluna total_absences
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='total_absences') THEN
          ALTER TABLE users ADD COLUMN total_absences INTEGER DEFAULT 0;
        END IF;
        
        -- Atualiza nulos para approved
        UPDATE users SET registration_status = 'approved' WHERE registration_status IS NULL;
      END $$;
    `);
    
    logger.info("Banco de dados sincronizado com sucesso!");
  } catch (error) {
    logger.error({ error }, "Erro no patch (as colunas podem já existir)");
  }
}

const rawPort = process.env["PORT"];
if (!rawPort) {
  throw new Error("PORT environment variable is required");
}

const port = Number(rawPort);

app.listen(port, async () => {
  logger.info({ port }, "Server listening");
  
  // Rodamos o patch assim que o servidor ligar
  await runMigrationPatch();
  
  // COMENTADO para não apagar seus dados reais
  // seedDatabase(); 
  
  startEmailCron();
});
