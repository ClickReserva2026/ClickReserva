import app from "./app";
import { logger } from "./lib/logger";
import { startEmailCron } from "./email-cron";
import { seedDatabase } from "./seed"; // Importa a função que criamos acima

const port = Number(process.env["PORT"] || 10000);

app.listen(port, async () => {
  logger.info({ port }, "🚀 Servidor ClickReserva Online");

  // Roda o cadastro dos professores em segundo plano
  seedDatabase().catch((err) => {
    logger.error("Erro silencioso no seed: " + err);
  });

  try {
    startEmailCron();
  } catch (e) {
    logger.error("Erro no Cron de e-mail");
  }
});
