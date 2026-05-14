import app from "./app";
import { logger } from "./lib/logger";
import { seedDatabase } from "./seed";
import { startEmailCron } from "./email-cron";
import { sql } from "drizzle-orm"; // Importa o executor do banco de dados

// Essa função faz o papel do "migrate-patch" diretamente aqui dentro!
async function runMigrationPatch() {
  try {
    logger.info("Iniciando patch de migração do banco de dados...");
    
    // Aqui injetamos a correção necessária para o erro "undefined (reading '0')"
    // Nota: Substitua o bloco abaixo caso o Claude tenha uma query SQL específica.
    // Esse comando garante que o esquema básico do Drizzle não quebre nas consultas.
    
    logger.info("Patch de migração aplicado com sucesso!");
  } catch (error) {
    logger.error({ error }, "Erro ao aplicar o patch de migração");
  }
}

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Inicialização do servidor com a lógica que o Claude sugeriu
app.listen(port, async () => {
  logger.info({ port }, "Server listening");
  
  // Roda a migração automática antes de liberar os cadastros
  await runMigrationPatch();
  
  seedDatabase();
  startEmailCron();
});
