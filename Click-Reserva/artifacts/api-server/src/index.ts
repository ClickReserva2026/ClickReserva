import app from "./app";
import { logger } from "./lib/logger";
import { startEmailCron } from "./email-cron";

const port = Number(process.env["PORT"] || 10000);

// Ligamos o servidor primeiro para o Render aceitar o deploy
app.listen(port, () => {
  logger.info({ port }, "🚀 Servidor ClickReserva Online!");
  
  try {
    startEmailCron();
  } catch (e) {
    logger.error("Erro no Cron de e-mail, mas o sistema segue ativo.");
  }
});
