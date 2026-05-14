import app from "./app";
import { logger } from "./lib/logger";
import { startEmailCron } from "./email-cron";
import { runMigrationPatch } from "./lib/migrate-patch";

const port = Number(process.env["PORT"] || 10000);

app.listen(port, async () => {
  logger.info({ port }, "🚀 Servidor ClickReserva Online!");

  try {
    await runMigrationPatch();
  } catch (e) {
    logger.error("Erro ao aplicar migrate-patch");
  }

  try {
    startEmailCron();
  } catch (e) {
    logger.error("Erro no Cron de e-mail");
  }
});
