import { Router } from "express";
import { db } from "@workspace/db";
import { reservationsTable, usersTable } from "@workspace/db/schema";
import { and, gte, lte, eq } from "drizzle-orm";
import { Request, Response } from "express";

const router = Router();

function requireAuth(req: Request, res: Response, next: () => void) {
  const session = (req as any).session;
  if (!session?.userId) { res.status(401).json({ message: "Não autenticado." }); return; }
  next();
}

router.get("/reports/monthly", requireAuth as any, async (req: Request, res: Response): Promise<void> => {
  try {
    const session = (req as any).session;
    const userId: number = session.userId;

    const monthParam = req.query.month as string | undefined;
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const month = monthParam ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const [year, monthNum] = month.split("-").map(Number);
    const startDate = `${month}-01`;
    const lastDay = new Date(year, monthNum, 0).getDate();
    const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

    const [currentUser] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!currentUser) { res.status(401).json({ message: "Usuário não encontrado." }); return; }

    const isCoordinator = currentUser.role === "coordinator" || currentUser.role === "admin";

    const allReservations = await db
      .select({
        professorId: reservationsTable.professorId,
        status: reservationsTable.status,
        date: reservationsTable.date,
      })
      .from(reservationsTable)
      .where(and(gte(reservationsTable.date, startDate), lte(reservationsTable.date, endDate)));

    const allProfessors = await db.select().from(usersTable);

    const buildStats = (professorId: number) => {
      const rs = allReservations.filter(r => r.professorId === professorId);
      return {
        total: rs.length,
        confirmadas: rs.filter(r => r.status === "confirmed").length,
        realizadas: rs.filter(r => r.status === "realized").length,
        canceladas: rs.filter(r => r.status === "cancelled").length,
        faltou: rs.filter(r => r.status === "no_show").length,
        aguardando: rs.filter(r => r.status === "pending").length,
        recusadas: rs.filter(r => r.status === "rejected").length,
      };
    };

    if (isCoordinator) {
      const data = allProfessors
        .filter(p => p.role === "professor" || p.role === "coordinator" || p.role === "admin")
        .map(p => ({ professorId: p.id, professorName: p.name, role: p.role, ...buildStats(p.id) }))
        .filter(s => s.total > 0)
        .sort((a, b) => b.realizadas - a.realizadas);
      res.json({ month, data });
    } else {
      const stats = buildStats(userId);
      const prof = allProfessors.find(p => p.id === userId);
      res.json({ month, data: [{ professorId: userId, professorName: prof?.name ?? "", role: currentUser.role, ...stats }] });
    }
  } catch (err) {
    console.error("[reports] Erro:", err);
    res.status(500).json({ message: "Erro interno." });
  }
});

export default router;
