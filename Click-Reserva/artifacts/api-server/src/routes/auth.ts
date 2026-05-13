import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable, passwordResetRequestsTable } from "@workspace/db";
import { LoginBody, GetMeResponse, LoginResponse } from "@workspace/api-zod";
import { z } from "zod";
import crypto from "crypto";

const RegisterBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "clickreserva-salt").digest("hex");
}

import { ESCOLA as ESCOLA_CONFIG } from "../escola.config";


function isAllowedEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return ESCOLA_CONFIG.emailDominiosPermitidos.some(d => lower.endsWith(d)) ||
    ESCOLA_CONFIG.emailPalavrasPermitidas.some(p => lower.includes(p));
}

function userToResponse(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    blocked: user.blocked,
    totalAbsences: user.totalAbsences,
  };
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", message: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));

  if (!user || user.passwordHash !== hashPassword(password)) {
    res.status(401).json({ error: "Credenciais inválidas", message: "E-mail ou senha incorretos." });
    return;
  }

  if (user.registrationStatus === "pending") {
    res.status(401).json({ error: "Cadastro pendente", message: "Seu cadastro está aguardando aprovação do coordenador." });
    return;
  }

  if (user.registrationStatus === "rejected") {
    res.status(401).json({ error: "Cadastro recusado", message: "Seu cadastro foi recusado. Entre em contato com o coordenador." });
    return;
  }

  if (!user.isActive) {
    res.status(401).json({ error: "Conta inativa", message: "Sua conta está desativada. Contate o coordenador." });
    return;
  }

  const session = req.session as Record<string, unknown>;
  session.userId = user.id;

  const response = LoginResponse.parse({ user: userToResponse(user) });
  res.json(response);
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", message: "Verifique os campos e tente novamente." });
    return;
  }

  const { name, email, password } = parsed.data;

  if (!isAllowedEmail(email)) {
    res.status(400).json({
      error: "E-mail não permitido",
      message: ESCOLA_CONFIG.emailErroMensagem,
    });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    if (existing.registrationStatus === "pending") {
      res.status(409).json({ error: "Cadastro já enviado", message: "Seu cadastro já está aguardando aprovação do coordenador." });
    } else {
      res.status(409).json({ error: "E-mail já cadastrado", message: "Este e-mail já está em uso. Faça login." });
    }
    return;
  }

  await db.insert(usersTable).values({
    name,
    email: email.toLowerCase(),
    passwordHash: hashPassword(password),
    role: "professor",
    isActive: false,
    blocked: false,
    registrationStatus: "pending",
  });

  res.status(202).json({ pending: true, message: "Cadastro enviado! Aguarde a aprovação do coordenador para acessar o sistema." });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const session = req.session as Record<string, unknown>;
  session.userId = undefined;
  res.json({ success: true, message: "Logout realizado com sucesso." });
});

router.post("/auth/reset-request", async (req, res): Promise<void> => {
  const { email } = req.body ?? {};
  if (!email || typeof email !== "string") {
    res.status(400).json({ error: "E-mail inválido" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user) {
    res.status(404).json({ error: "E-mail não encontrado", message: "Nenhum cadastro com este e-mail." });
    return;
  }

  if (user.registrationStatus === "pending") {
    res.status(400).json({ error: "Cadastro pendente", message: "Seu cadastro ainda não foi aprovado. Aguarde a aprovação para acessar o sistema." });
    return;
  }

  if (user.registrationStatus === "rejected") {
    res.status(400).json({ error: "Cadastro recusado", message: "Seu cadastro foi recusado. Entre em contato com o coordenador diretamente." });
    return;
  }

  const existing = await db.select().from(passwordResetRequestsTable)
    .where(and(eq(passwordResetRequestsTable.userId, user.id), eq(passwordResetRequestsTable.status, "pending")));

  if (existing.length > 0) {
    res.json({ success: true, message: "Pedido já enviado. Aguarde o coordenador definir sua nova senha." });
    return;
  }

  await db.insert(passwordResetRequestsTable).values({ userId: user.id });

  res.json({ success: true, message: "Pedido de redefinição enviado! O coordenador irá definir uma nova senha para você." });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const session = req.session as Record<string, unknown>;
  const userId = session.userId as number | undefined;

  if (!userId) {
    res.status(401).json({ error: "Não autenticado", message: "Faça login para continuar." });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  if (!user) {
    res.status(401).json({ error: "Usuário não encontrado", message: "Faça login novamente." });
    return;
  }

  const response = GetMeResponse.parse(userToResponse(user));
  res.json(response);
});

export { hashPassword };
export default router;
