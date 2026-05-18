import { Router, type IRouter } from "express";
import { eq, and, ne } from "drizzle-orm";
import { db, reservationsTable, usersTable, roomsTable, absencesTable, systemConfigTable, blockedSlotsTable } from "@workspace/db";
import {
  sendReservationSubmitted,
  sendReservationApproved,
  sendReservationRejected,
  sendReservationCancelled,
} from "../email";
import { createNotification } from "./notifications";
import {
  GetReservationsResponse,
  GetReservationsQueryParams,
  CreateReservationBody,
  GetReservationParams,
  GetReservationResponse,
  CancelReservationParams,
  CancelReservationResponse,
  ConfirmPresenceParams,
  ConfirmPresenceResponse,
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

async function buildReservationResponse(res: typeof reservationsTable.$inferSelect, professor: typeof usersTable.$inferSelect | null, room: typeof roomsTable.$inferSelect | null) {
  return {
    id: res.id,
    professorId: res.professorId,
    professorName: professor?.name ?? "Desconhecido",
    roomId: res.roomId,
    roomNumber: room?.number ?? "?",
    roomName: room?.name ?? "Desconhecida",
    date: res.date,
    startTime: res.startTime,
    endTime: res.endTime,
    subject: res.subject,
    classGroup: res.classGroup,
    status: res.status,
    confirmedPresence: res.confirmedPresence,
    confirmedAt: res.confirmedAt?.toISOString() ?? null,
    tabletQuantity: res.tabletQuantity ?? 0, // ← TABLET
    createdAt: res.createdAt.toISOString(),
  };
}

async function checkAndRecordAbsences() {
  const [config] = await db.select().from(systemConfigTable);
  const toleranceMinutes = config?.toleranceMinutes ?? 15;
  const absenceLimit = config?.absenceLimitForBlock ?? 3;

  const now = new Date();

  const confirmed = await db.select().from(reservationsTable)
    .where(and(eq(reservationsTable.status, "confirmed"), eq(reservationsTable.confirmedPresence, false)));

  for (const reservation of confirmed) {
    const startDateTime = new Date(`${reservation.date}T${reservation.startTime}:00-03:00`);
    const deadlineMs = startDateTime.getTime() + toleranceMinutes * 60 * 1000;

    if (now.getTime() > deadlineMs) {
      await db.update(reservationsTable).set({ status: "no_show" }).where(eq(reservationsTable.id, reservation.id));

      const existing = await db.select().from(absencesTable).where(eq(absencesTable.reservationId, reservation.id));
      if (existing.length === 0) {
        await db.insert(absencesTable).values({
          professorId: reservation.professorId,
          reservationId: reservation.id,
          absenceDate: reservation.date,
        });

        const [prof] = await db.select().from(usersTable).where(eq(usersTable.id, reservation.professorId));
        if (prof) {
          const newTotal = prof.totalAbsences + 1;
          const shouldBlock = newTotal >= absenceLimit;
          await db.update(usersTable).set({
            totalAbsences: newTotal,
            ...(shouldBlock && !prof.blocked ? {
              blocked: true,
              blockedAt: now,
              blockReason: `Bloqueado automaticamente em ${now.toLocaleDateString("pt-BR")} por ${newTotal} falta(s) sem confirmação de presença.`,
            } : {}),
          }).where(eq(usersTable.id, reservation.professorId));
        }
      }
    }
  }
}

// ── GET /reservations ────────────────────────────────────────────
router.get("/reservations", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "Usuário não encontrado" });
    return;
  }

  const isCoordinator = user.role === "coordinator" || user.role === "admin";
  const query = GetReservationsQueryParams.safeParse(req.query);
  await checkAndRecordAbsences();

  const allReservations = await db.select().from(reservationsTable);
  let filtered = allReservations;

  if (!isCoordinator) {
    filtered = filtered.filter(r => r.professorId === userId);
  }

  if (query.success) {
    if (query.data.date) filtered = filtered.filter(r => r.date === query.data.date);
    if (query.data.roomId) filtered = filtered.filter(r => r.roomId === query.data.roomId);
    if (query.data.professorId && isCoordinator) filtered = filtered.filter(r => r.professorId === Number(query.data.professorId));
    if (query.data.status) filtered = filtered.filter(r => r.status === query.data.status);
  }

  const professors = await db.select().from(usersTable);
  const rooms = await db.select().from(roomsTable);

  const results = await Promise.all(filtered.map(async (r) => {
    const prof = professors.find(p => p.id === r.professorId) ?? null;
    const room = rooms.find(rm => rm.id === r.roomId) ?? null;
    return buildReservationResponse(r, prof, room);
  }));

  res.json(GetReservationsResponse.parse(results));
});

// ── POST /reservations ───────────────────────────────────────────
router.post("/reservations", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const parsed = CreateReservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", message: parsed.error.message });
    return;
  }

  const [professor] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!professor) { res.status(401).json({ error: "Professor não encontrado" }); return; }
  if (professor.blocked) {
    res.status(409).json({ error: "Professor bloqueado", message: professor.blockReason ?? "Você está bloqueado e não pode fazer reservas." });
    return;
  }

  const { roomId, date, startTime, endTime, subject, classGroup, tabletQuantity = 0 } = parsed.data; // ← TABLET

  // Validação extra de segurança
  if (tabletQuantity < 0 || tabletQuantity > 30) { // ← TABLET
    res.status(400).json({ error: "Quantidade de tablets deve ser entre 0 e 30." }); // ← TABLET
    return; // ← TABLET
  } // ← TABLET

  const targetProfessorId = (professor.role === "coordinator" || professor.role === "admin") && parsed.data.professorId
    ? parsed.data.professorId : userId;

  const existing = await db.select().from(reservationsTable)
    .where(and(eq(reservationsTable.roomId, roomId), eq(reservationsTable.date, date)));

  const conflict = existing.find(r =>
    r.status !== "cancelled" && r.status !== "rejected" && (
      (startTime >= r.startTime && startTime < r.endTime) ||
      (endTime > r.startTime && endTime <= r.endTime) ||
      (startTime <= r.startTime && endTime >= r.endTime)
    )
  );
  if (conflict) {
    res.status(409).json({ error: "Conflito de horário", message: "Já existe uma reserva para esta sala neste horário." });
    return;
  }

  const blockedSlots = await db.select().from(blockedSlotsTable);
  const blocked
