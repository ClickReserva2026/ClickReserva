import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, systemConfigTable, usersTable } from "@workspace/db";
import { GetConfigResponse, UpdateConfigBody, UpdateConfigResponse } from "@workspace/api-zod";
import { sendReservationReminder } from "../email";

const router: IRouter = Router();

function requireAuth(req: any, res: any): number | null {
  const session = req.session as Record<string, unknown>;
  const userId = session.userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Não autenticado" });
    return null;
  }
  return userId;
}

async function requireCoordinator(req: any, res: any): Promise<boolean> {
  const userId = requireAuth(req, res);
  if (!userId) return false;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || (user.role !== "coordinator" && user.role !== "admin")) {
    res.status(403).json({ error: "Acesso restrito ao coordenador" });
    return false;
  }
  return true;
}

async function getOrCreateConfig() {
  const configs = await db.select().from(systemConfigTable);
  if (configs.length > 0) return configs[0];

  const [config] = await db.insert(systemConfigTable).values({
    absenceLimitForBlock: 3,
    toleranceMinutes: 15,
  }).returning();
  return config;
}

router.get("/config", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const config = await getOrCreateConfig();
  res.json(GetConfigResponse.parse({
    absenceLimitForBlock: config.absenceLimitForBlock,
    toleranceMinutes: config.toleranceMinutes,
  }));
});

router.put("/config", async (req, res): Promise<void> => {
  if (!(await requireCoordinator(req, res))) return;

  const parsed = UpdateConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", message: parsed.error.message });
    return;
  }

  const config = await getOrCreateConfig();
  const [updated] = await db.update(systemConfigTable).set({
    absenceLimitForBlock: parsed.data.absenceLimitForBlock,
    toleranceMinutes: parsed.data.toleranceMinutes,
  }).where(eq(systemConfigTable.id, config.id)).returning();

  res.json(UpdateConfigResponse.parse({
    absenceLimitForBlock: updated.absenceLimitForBlock,
    toleranceMinutes: updated.toleranceMinutes,
  }));
});

router.post("/config/test-email", async (req, res): Promise<void> => {
  if (!(await requireCoordinator(req, res))) return;

  const userId = requireAuth(req, res);
  if (!userId) return;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(401).json({ error: "Não autenticado" }); return; }

  if (!process.env.RESEND_API_KEY) {
    res.status(400).json({ error: "RESEND_API_KEY não configurado no servidor." });
    return;
  }

  const today = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const result = await sendReservationReminder({
    to: user.email,
    professorName: user.name,
    subject: "Informática Aplicada",
    roomName: "Laboratório de Informática",
    date: today,
    startTime: "14:00",
    endTime: "15:00",
    classGroup: "2º A",
    minutesBefore: 10,
  });

  if (result.ok) {
    res.json({ success: true, message: `E-mail de teste enviado para ${user.email}` });
  } else {
    res.status(500).json({ error: `Falha ao enviar e-mail: ${result.error}` });
  }
});

export default router;
