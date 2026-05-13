import { Router } from "express";
import { db } from "@workspace/db";
import { feedbackTable, usersTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod/v4";

function requireAuth(req: any, res: any): number | null {
  const session = req.session as Record<string, unknown>;
  const userId = session.userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Não autenticado" });
    return null;
  }
  return userId;
}

const router = Router();

const CreateFeedbackBody = z.object({
  rating: z.number().int().min(1).max(5),
  category: z.enum(["sistema", "sala", "processo", "outro"]),
  message: z.string().min(5).max(1000),
  isAnonymous: z.boolean().optional().default(false),
});

router.post("/feedback", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const body = CreateFeedbackBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: "Dados inválidos.", details: body.error.issues });
    return;
  }

  const [inserted] = await db.insert(feedbackTable).values({
    professorId: userId,
    rating: body.data.rating,
    category: body.data.category,
    message: body.data.message,
    isAnonymous: body.data.isAnonymous ?? false,
  }).returning();

  res.status(201).json(inserted);
});

router.get("/feedback", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(401).json({ error: "Não autorizado." }); return; }

  if (user.role === "coordinator" || user.role === "admin") {
    const rows = await db
      .select({
        id: feedbackTable.id,
        professorId: feedbackTable.professorId,
        professorName: usersTable.name,
        rating: feedbackTable.rating,
        category: feedbackTable.category,
        message: feedbackTable.message,
        isAnonymous: feedbackTable.isAnonymous,
        createdAt: feedbackTable.createdAt,
      })
      .from(feedbackTable)
      .leftJoin(usersTable, eq(feedbackTable.professorId, usersTable.id))
      .orderBy(desc(feedbackTable.createdAt));

    res.json(rows.map(r => ({
      ...r,
      professorName: r.isAnonymous ? "Anônimo" : (r.professorName ?? "—"),
    })));
  } else {
    const rows = await db
      .select()
      .from(feedbackTable)
      .where(eq(feedbackTable.professorId, userId))
      .orderBy(desc(feedbackTable.createdAt));
    res.json(rows);
  }
});

router.delete("/feedback/:id", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || (user.role !== "coordinator" && user.role !== "admin")) {
    res.status(403).json({ error: "Apenas coordenadores podem remover feedback." });
    return;
  }

  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido." }); return; }

  await db.delete(feedbackTable).where(eq(feedbackTable.id, id));
  res.json({ success: true });
});

export default router;
