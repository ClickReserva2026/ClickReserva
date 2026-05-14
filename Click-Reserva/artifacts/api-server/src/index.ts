import app from "./app";
import { logger } from "./lib/logger";
import { startEmailCron } from "./email-cron";
import { exec } from "child_process";

const port = Number(process.env["PORT"] || 10000);

app.listen(port, () => {
  logger.info({ port }, "🚀 Servidor ClickReserva Online!");
  
  // Comando para criar/atualizar as tabelas do banco de dados automaticamente
  // Isso habilita o cadastro de professores que estava falhando
  exec("pnpm run db:push", { cwd: "/opt/render/project/src/Click-Reserva/artifacts/api-server" }, (error, stdout, stderr) => {
    if (error) {
      logger.error("Erro ao sincronizar banco: " + error.message);
      return;
    }
    logger.info("✅ Banco de dados sincronizado e tabelas prontas!");
  });

  try {
    startEmailCron();
  } catch (e) {
    logger.error("Aviso: Cron de e-mail não iniciado.");
  }
});
