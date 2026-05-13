import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, reservationsTable, usersTable, roomsTable, absencesTable } from "@workspace/db";
import {
  GetDashboardStatsResponse,
  GetTodayScheduleResponse,
  CheckConflictsQueryParams,
  CheckConflictsResponse,
} from "@workspace/api-zod";

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

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const today = new Date().toISOString().split("T")[0];
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().split("T")[0];

  const [professors, rooms, reservations, absences] = await Promise.all([
    db.select().from(usersTable),
    db.select().from(roomsTable),
    db.select().from(reservationsTable),
    db.select().from(absencesTable),
  ]);

  const totalProfessors = professors.filter(p => p.role === "professor").length;
  const activeProfessors = professors.filter(p => p.role === "professor" && p.isActive).length;
  const blockedProfessors = professors.filter(p => p.blocked).length;
  const totalRooms = rooms.length;
  const activeRooms = rooms.filter(r => r.isActive).length;

  const todayReservations = reservations.filter(r => r.date === today && r.status !== "cancelled").length;
  const weekReservations = reservations.filter(r => r.date >= weekStartStr && r.date <= today && r.status !== "cancelled").length;
  const pendingReservations = reservations.filter(r => r.status === "confirmed" && !r.confirmedPresence).length;

  const stats = {
    totalProfessors,
    activeProfessors,
    totalRooms,
    activeRooms,
    todayReservations,
    weekReservations,
    pendingReservations,
    blockedProfessors,
    totalAbsences: absences.length,
  };

  res.json(GetDashboardStatsResponse.parse(stats));
});

router.get("/dashboard/today", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const today = new Date().toISOString().split("T")[0];

  const todayReservations = await db.select().from(reservationsTable)
    .where(and(eq(reservationsTable.date, today)));

  const professors = await db.select().from(usersTable);
  const rooms = await db.select().from(roomsTable);

  const results = todayReservations
    .filter(r => r.status !== "cancelled")
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
    .map(r => {
      const prof = professors.find(p => p.id === r.professorId);
      const room = rooms.find(rm => rm.id === r.roomId);
      return {
        id: r.id,
        professorId: r.professorId,
        professorName: prof?.name ?? "Desconhecido",
        roomId: r.roomId,
        roomNumber: room?.number ?? "?",
        roomName: room?.name ?? "Desconhecida",
        date: r.date,
        startTime: r.startTime,
        endTime: r.endTime,
        subject: r.subject,
        classGroup: r.classGroup,
        status: r.status,
        confirmedPresence: r.confirmedPresence,
        confirmedAt: r.confirmedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      };
    });

  res.json(GetTodayScheduleResponse.parse(results));
});

router.get("/dashboard/conflicts", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const query = CheckConflictsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: "Parâmetros inválidos", message: query.error.message });
    return;
  }

  const { roomId, date, startTime, endTime, excludeId } = query.data;

  const existing = await db.select().from(reservationsTable)
    .where(and(eq(reservationsTable.roomId, roomId), eq(reservationsTable.date, date)));

  const professors = await db.select().from(usersTable);
  const rooms = await db.select().from(roomsTable);

  const conflict = existing.find(r =>
    r.status !== "cancelled" &&
    r.id !== excludeId &&
    (
      (startTime >= r.startTime && startTime < r.endTime) ||
      (endTime > r.startTime && endTime <= r.endTime) ||
      (startTime <= r.startTime && endTime >= r.endTime)
    )
  );

  if (conflict) {
    const prof = professors.find(p => p.id === conflict.professorId);
    const room = rooms.find(rm => rm.id === conflict.roomId);
    res.json(CheckConflictsResponse.parse({
      hasConflict: true,
      conflictingReservation: {
        id: conflict.id,
        professorId: conflict.professorId,
        professorName: prof?.name ?? "Desconhecido",
        roomId: conflict.roomId,
        roomNumber: room?.number ?? "?",
        roomName: room?.name ?? "Desconhecida",
        date: conflict.date,
        startTime: conflict.startTime,
        endTime: conflict.endTime,
        subject: conflict.subject,
        classGroup: conflict.classGroup,
        status: conflict.status,
        confirmedPresence: conflict.confirmedPresence,
        confirmedAt: conflict.confirmedAt?.toISOString() ?? null,
        createdAt: conflict.createdAt.toISOString(),
      },
    }));
  } else {
    res.json(CheckConflictsResponse.parse({ hasConflict: false, conflictingReservation: null }));
  }
});

export default router;
