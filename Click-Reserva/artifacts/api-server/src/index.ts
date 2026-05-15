import app from "./app";
import { logger } from "./lib/logger";
import { db, usersTable } from "@workspace/db"; // Use o apelido, não o caminho ../../
import { eq } from "drizzle-orm";

const port = Number(process.env["PORT"] || 10000);

app.listen(port, "0.0.0.0", async () => {
  logger.info({ port }, "🚀 ClickReserva Online!");
  try {
    const email = "coordenador@escola.pr.gov.br";
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      await db.insert(usersTable).values({
        name: "Simone Vitoriano",
        email,
        passwordHash: "coordenador123", // Lembre-se de trocar depois!
        role: "coordinator",
        registrationStatus: "approved",
        isActive: true
      });
      logger.info("✅ Simone cadastrada!");
    }
  } catch (e) {
    logger.error("Sincronizando banco de dados...");
  }
});
