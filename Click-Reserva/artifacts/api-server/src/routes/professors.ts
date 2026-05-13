import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, usersTable, passwordResetRequestsTable } from "@workspace/db";
import {
  GetProfessorsResponse,
  GetProfessorParams,
  GetProfessorResponse,
  CreateProfessorBody,
  UpdateProfessorParams,
  UpdateProfessorBody,
  UpdateProfessorResponse,
  UnblockProfessorParams,
  UnblockProfessorResponse,
} from "@workspace/api-zod";
import { hashPassword } from "./auth";
import { sendRegistrationApproved, sendRegistrationRejected, sendPasswordReset } from "../email";

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

function userToResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    blocked: user.blocked,
    totalAbsences: user.totalAbsences,
    blockedAt: user.blockedAt?.toISOString() ?? null,
    blockReason: user.blockReason ?? null,
    isActive: user.isActive,
  };
}

router.get("/professors", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const professors = await db.select().from(usersTable).orderBy(usersTable.name);
  res.json(GetProfessorsResponse.parse(professors.map(userToResponse)));
});

router.post("/professors", async (req, res): Promise<void> => {
  if (!(await requireCoordinator(req, res))) return;

  const parsed = CreateProfessorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", message: parsed.error.message });
    return;
  }

  const { name, email, password, role } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    res.status(409).json({ error: "E-mail já cadastrado" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    name,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    role: role ?? "professor",
  }).returning();

  res.status(201).json(GetProfessorResponse.parse(userToResponse(user)));
});

router.get("/professors/pending", async (req, res): Promise<void> => {
  if (!(await requireCoordinator(req, res))) return;

  const pending = await db.select().from(usersTable)
    .where(eq(usersTable.registrationStatus, "pending"))
    .orderBy(usersTable.createdAt);

  res.json(pending.map(userToResponse));
});

router.get("/professors/rejected", async (req, res): Promise<void> => {
  if (!(await requireCoordinator(req, res))) return;

  const rejected = await db.select().from(usersTable)
    .where(eq(usersTable.registrationStatus, "rejected"))
    .orderBy(usersTable.createdAt);

  res.json(rejected.map(userToResponse));
});

router.get("/professors/reset-requests", async (req, res): Promise<void> => {
  if (!(await requireCoordinator(req, res))) return;

  const requests = await db
    .select({
      id: passwordResetRequestsTable.id,
      status: passwordResetRequestsTable.status,
      createdAt: passwordResetRequestsTable.createdAt,
      fulfilledAt: passwordResetRequestsTable.fulfilledAt,
      userId: usersTable.id,
      userName: usersTable.name,
      userEmail: usersTable.email,
    })
    .from(passwordResetRequestsTable)
    .innerJoin(usersTable, eq(passwordResetRequestsTable.userId, usersTable.id))
    .orderBy(desc(passwordResetRequestsTable.createdAt));

  res.json(requests);
});

router.post("/professors/reset-requests/:requestId/fulfill", async (req, res): Promise<void> => {
  if (!(await requireCoordinator(req, res))) return;

  const rawId = Array.isArray(req.params.requestId) ? req.params.requestId[0] : req.params.requestId;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const { newPassword } = req.body ?? {};
  if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 6) {
    res.status(400).json({ error: "Senha inválida", message: "A nova senha deve ter ao menos 6 caracteres." });
    return;
  }

  const [request] = await db.select().from(passwordResetRequestsTable).where(eq(passwordResetRequestsTable.id, id));
  if (!request) { res.status(404).json({ error: "Pedido não encontrado" }); return; }

  await db.update(usersTable).set({ passwordHash: hashPassword(newPassword.trim()) }).where(eq(usersTable.id, request.userId));

  await db.update(passwordResetRequestsTable).set({
    status: "fulfilled",
    fulfilledAt: new Date(),
  }).where(eq(passwordResetRequestsTable.id, id));

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, request.userId));
  res.json({ success: true, message: `Senha de ${user?.name ?? "usuário"} atualizada com sucesso.` });

  // Notificar professor por e-mail — senha redefinida
  if (user?.email) {
    sendPasswordReset({ to: user.email, name: user.name, newPassword: newPassword.trim() }).catch(() => {});
  }
});

router.get("/professors/:professorId", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const rawId = Array.isArray(req.params.professorId) ? req.params.professorId[0] : req.params.professorId;
  const params = GetProfessorParams.safeParse({ professorId: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.professorId));
  if (!user) {
    res.status(404).json({ error: "Professor não encontrado" });
    return;
  }

  res.json(GetProfessorResponse.parse(userToResponse(user)));
});

router.put("/professors/:professorId", async (req, res): Promise<void> => {
  if (!(await requireCoordinator(req, res))) return;

  const rawId = Array.isArray(req.params.professorId) ? req.params.professorId[0] : req.params.professorId;
  const params = UpdateProfessorParams.safeParse({ professorId: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const parsed = UpdateProfessorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", message: parsed.error.message });
    return;
  }

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.email !== undefined) updates.email = parsed.data.email.toLowerCase();
  if (parsed.data.isActive !== undefined) updates.isActive = parsed.data.isActive;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, params.data.professorId)).returning();
  if (!user) {
    res.status(404).json({ error: "Professor não encontrado" });
    return;
  }

  res.json(UpdateProfessorResponse.parse(userToResponse(user)));
});

router.post("/professors/:professorId/approve", async (req, res): Promise<void> => {
  if (!(await requireCoordinator(req, res))) return;

  const rawId = Array.isArray(req.params.professorId) ? req.params.professorId[0] : req.params.professorId;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [user] = await db.update(usersTable).set({
    registrationStatus: "approved",
    isActive: true,
  }).where(eq(usersTable.id, id)).returning();

  if (!user) { res.status(404).json({ error: "Usuário não encontrado" }); return; }
  res.json({ success: true, message: `Cadastro de ${user.name} aprovado.` });

  // Notificar professor por e-mail — cadastro aprovado
  if (user.email) {
    sendRegistrationApproved({ to: user.email, name: user.name }).catch(() => {});
  }
});

router.post("/professors/:professorId/reject", async (req, res): Promise<void> => {
  if (!(await requireCoordinator(req, res))) return;

  const rawId = Array.isArray(req.params.professorId) ? req.params.professorId[0] : req.params.professorId;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [user] = await db.update(usersTable).set({
    registrationStatus: "rejected",
    isActive: false,
  }).where(eq(usersTable.id, id)).returning();

  if (!user) { res.status(404).json({ error: "Usuário não encontrado" }); return; }
  res.json({ success: true, message: `Cadastro de ${user.name} recusado.` });

  // Notificar professor por e-mail — cadastro recusado
  if (user.email) {
    sendRegistrationRejected({ to: user.email, name: user.name }).catch(() => {});
  }
});

router.post("/professors/:professorId/change-role", async (req, res): Promise<void> => {
  if (!(await requireCoordinator(req, res))) return;

  const rawId = Array.isArray(req.params.professorId) ? req.params.professorId[0] : req.params.professorId;
  const id = parseInt(rawId, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const { role } = req.body ?? {};
  if (!["professor", "coordinator", "admin"].includes(role)) {
    res.status(400).json({ error: "Perfil inválido. Use: professor, coordinator ou admin." });
    return;
  }

  const [user] = await db.update(usersTable).set({ role }).where(eq(usersTable.id, id)).returning();
  if (!user) { res.status(404).json({ error: "Usuário não encontrado" }); return; }

  res.json({ success: true, message: `Perfil de ${user.name} atualizado para ${role}.` });
});

router.post("/professors/:professorId/unblock", async (req, res): Promise<void> => {
  if (!(await requireCoordinator(req, res))) return;

  const rawId = Array.isArray(req.params.professorId) ? req.params.professorId[0] : req.params.professorId;
  const params = UnblockProfessorParams.safeParse({ professorId: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [user] = await db.update(usersTable).set({
    blocked: false,
    blockedAt: null,
    blockReason: null,
    totalAbsences: 0,
  }).where(eq(usersTable.id, params.data.professorId)).returning();

  if (!user) {
    res.status(404).json({ error: "Professor não encontrado" });
    return;
  }

  res.json(UnblockProfessorResponse.parse({ success: true, message: "Professor desbloqueado com sucesso." }));
});

export default router;
