// server/src/routes/notifications.ts

import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, notificationsTable, usersTable } from "@workspace/db";

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

// ── GET /notifications ───────────────────────────────────────────
// Retorna as últimas 50 notificações do usuário logado
router.get("/notifications", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);

  res.json(notifications);
});

// ── GET /notifications/unread-count ─────────────────────────────
// Retorna apenas o número de não lidas (usado pelo badge)
router.get("/notifications/unread-count", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const unread = await db
    .select()
    .from(notificationsTable)
    .where(and(
      eq(notificationsTable.userId, userId),
      eq(notificationsTable.read, false),
    ));

  res.json({ count: unread.length });
});

// ── POST /notifications/:id/read ────────────────────────────────
// Marca uma notificação como lida
router.post("/notifications/:id/read", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [notification] = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.id, id));

  if (!notification) { res.status(404).json({ error: "Notificação não encontrada" }); return; }
  if (notification.userId !== userId) { res.status(403).json({ error: "Sem permissão" }); return; }

  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(eq(notificationsTable.id, id));

  res.json({ success: true });
});

// ── POST /notifications/read-all ────────────────────────────────
// Marca todas as notificações do usuário como lidas
router.post("/notifications/read-all", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  await db
    .update(notificationsTable)
    .set({ read: true })
    .where(and(
      eq(notificationsTable.userId, userId),
      eq(notificationsTable.read, false),
    ));

  res.json({ success: true });
});

// ── DELETE /notifications/:id ────────────────────────────────────
// Remove uma notificação
router.delete("/notifications/:id", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [notification] = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.id, id));

  if (!notification) { res.status(404).json({ error: "Notificação não encontrada" }); return; }
  if (notification.userId !== userId) { res.status(403).json({ error: "Sem permissão" }); return; }

  await db.delete(notificationsTable).where(eq(notificationsTable.id, id));
  res.json({ success: true });
});

export default router;


// ═══════════════════════════════════════════════════════════════════════════
// HELPER — createNotification
// Use esta função em qualquer rota que precise criar uma notificação in-app.
// Importe onde precisar: import { createNotification } from "./notifications"
// ═══════════════════════════════════════════════════════════════════════════

export async function createNotification(opts: {
  userId: number;
  type: string;
  title: string;
  message: string;
  reservationId?: number;
}): Promise<void> {
  try {
    await db.insert(notificationsTable).values({
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      message: opts.message,
      reservationId: opts.reservationId ?? null,
      read: false,
    });
  } catch (err) {
    console.error("[createNotification] erro ao salvar:", err);
  }
}
