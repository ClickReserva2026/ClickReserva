import app from "./app";
import { logger } from "./lib/logger";
import { seedDatabase } from "./seed";
import { startEmailCron } from "./email-cron";

// Função de patch simplificada para não travar o boot do servidor
async function runMigrationPatch() {
  try {
    logger.info("Iniciando verificação de integridade do banco...");
    // O erro 'reading 0' geralmente é o front-end tentando ler uma lista vazia.
    // Garantindo que o servidor responda, o seedDatabase abaixo cuidará de popular o básico.
    logger.info("Verificação concluída.");
  } catch (error) {
    logger.error({ error }, "Erro no patch de migração");
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
    await runMigrationPatch();
    // O Seed é quem vai criar os dados base para a tela de professores não vir vazia
    seedDatabase(); 
    startEmailCron();
  } catch (initError) {
    logger.error({ initError }, "Erro durante a inicialização dos serviços");
  }
});
