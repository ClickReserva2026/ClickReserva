import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, absencesTable, usersTable } from "@workspace/db";
import { GetAbsencesResponse, GetAbsencesQueryParams } from "@workspace/api-zod";

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

router.get("/absences", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const query = GetAbsencesQueryParams.safeParse(req.query);

  const allAbsences = await db.select().from(absencesTable).orderBy(absencesTable.absenceDate);
  const professors = await db.select().from(usersTable);

  let filtered = allAbsences;
  if (query.success && query.data.professorId) {
    filtered = filtered.filter(a => a.professorId === query.data.professorId);
  }

  const results = filtered.map(a => {
    const prof = professors.find(p => p.id === a.professorId);
    return {
      id: a.id,
      professorId: a.professorId,
      professorName: prof?.name ?? "Desconhecido",
      reservationId: a.reservationId,
      absenceDate: a.absenceDate,
      recordedAt: a.recordedAt.toISOString(),
    };
  });

  res.json(GetAbsencesResponse.parse(results));
});

export default router;
