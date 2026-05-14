import app from "./app";
import { logger } from "./lib/logger";
// Usamos o caminho relativo para chegar na pasta que você encontrou
import { db } from "../../lib/db"; 
import { startEmailCron } from "./email-cron";

const port = Number(process.env["PORT"] || 10000);

app.listen(port, "0.0.0.0", () => {
  logger.info({ port }, "🚀 Sistema ClickReserva Totalmente Online!");
  
  try {
    startEmailCron();
    console.log("Banco de dados conectado via /lib/db");
  } catch (e) {
    logger.error("Erro ao iniciar serviços secundários");
  }
});
