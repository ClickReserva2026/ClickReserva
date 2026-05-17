import { Router, type IRouter } from "express";
import { eq, and, ne } from "drizzle-orm";
import { db, reservationsTable, usersTable, roomsTable, absencesTable, systemConfigTable, blockedSlotsTable } from "@workspace/db";
import {
  sendReservationSubmitted,
  sendReservationApproved,
  sendReservationRejected,
  sendReservationCancelled,
} from "../email";
import { createNotification } from "./notifications"; // ← LINHA NOVA
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

  const { roomId, date, startTime, endTime, subject, classGroup } = parsed.data;
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
  const blocked = blockedSlots.find(slot => {
    const roomMatch = slot.roomId === null || slot.roomId === roomId;
    const dateMatch = slot.date === null || slot.date === date;
    if (!roomMatch || !dateMatch) return false;
    return (
      (startTime >= slot.startTime && startTime < slot.endTime) ||
      (endTime > slot.startTime && endTime <= slot.endTime) ||
      (startTime <= slot.startTime && endTime >= slot.endTime)
    );
  });
  if (blocked) {
    res.status(409).json({ error: "Horário bloqueado", message: `Este horário está bloqueado: ${blocked.reason}` });
    return;
  }

  const initialStatus = (professor.role === "coordinator" || professor.role === "admin") ? "confirmed" : "pending";

  const [reservation] = await db.insert(reservationsTable).values({
    professorId: targetProfessorId,
    roomId, date, startTime, endTime, subject, classGroup,
    status: initialStatus,
  }).returning();

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, roomId));
  res.status(201).json(GetReservationResponse.parse(await buildReservationResponse(reservation, professor, room ?? null)));

  const [d, m, y] = [date.slice(8, 10), date.slice(5, 7), date.slice(0, 4)];
  const dateFormatted = `${d}/${m}/${y}`;
  const targetProf = targetProfessorId !== userId
    ? (await db.select().from(usersTable).where(eq(usersTable.id, targetProfessorId)))[0] ?? professor
    : professor;

  if (initialStatus === "pending") {
    // Email para o professor
    if (targetProf.email) {
      sendReservationSubmitted({
        to: targetProf.email,
        professorName: targetProf.name,
        subject, classGroup,
        roomName: room?.name ?? "Sala",
        date: dateFormatted,
        startTime, endTime,
      }).catch(() => {});
    }

    // Notificação in-app para o professor
    await createNotification({
      userId: targetProfessorId,
      type: "reservation_submitted",
      title: "📋 Reserva enviada para aprovação",
      message: `${subject} — ${classGroup} em ${dateFormatted} das ${startTime} às ${endTime}. Aguardando aprovação.`,
      reservationId: reservation.id,
    });

    // Notificação in-app para todos os coordenadores
    const coordinators = await db.select().from(usersTable).where(eq(usersTable.role, "coordinator"));
    for (const coord of coordinators) {
      await createNotification({
        userId: coord.id,
        type: "reservation_submitted",
        title: "📋 Nova solicitação de reserva",
        message: `${targetProf.name} solicitou ${subject} — ${classGroup} em ${dateFormatted} das ${startTime} às ${endTime}.`,
        reservationId: reservation.id,
      });
    }
  }
});

// ── GET /reservations/:reservationId ────────────────────────────
router.get("/reservations/:reservationId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.reservationId) ? req.params.reservationId[0] : req.params.reservationId;
  const params = GetReservationParams.safeParse({ reservationId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "ID inválido" }); return; }

  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, params.data.reservationId));
  if (!reservation) { res.status(404).json({ error: "Reserva não encontrada" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const isCoordinator = user?.role === "coordinator" || user?.role === "admin";
  if (!isCoordinator && reservation.professorId !== userId) {
    res.status(403).json({ error: "Sem permissão para ver esta reserva." });
    return;
  }

  const [professor] = await db.select().from(usersTable).where(eq(usersTable.id, reservation.professorId));
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, reservation.roomId));
  res.json(GetReservationResponse.parse(await buildReservationResponse(reservation, professor ?? null, room ?? null)));
});

// ── DELETE /reservations/:reservationId ─────────────────────────
router.delete("/reservations/:reservationId", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.reservationId) ? req.params.reservationId[0] : req.params.reservationId;
  const params = CancelReservationParams.safeParse({ reservationId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "ID inválido" }); return; }

  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, params.data.reservationId));
  if (!reservation) { res.status(404).json({ error: "Reserva não encontrada" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (reservation.professorId !== userId && user?.role !== "coordinator" && user?.role !== "admin") {
    res.status(403).json({ error: "Sem permissão para cancelar esta reserva" });
    return;
  }

  await db.update(reservationsTable).set({ status: "cancelled" }).where(eq(reservationsTable.id, params.data.reservationId));
  res.json(CancelReservationResponse.parse({ success: true, message: "Reserva cancelada com sucesso." }));

  const cancelledByCoordinator = (user?.role === "coordinator" || user?.role === "admin") && reservation.professorId !== userId;
  const [prof] = await db.select().from(usersTable).where(eq(usersTable.id, reservation.professorId));
  const [rm] = await db.select().from(roomsTable).where(eq(roomsTable.id, reservation.roomId));
  const [d, m, y] = [reservation.date.slice(8,10), reservation.date.slice(5,7), reservation.date.slice(0,4)];
  const dateFormatted = `${d}/${m}/${y}`;

  // Email para o professor (cancelado pelo coord OU pelo próprio)
  if (prof?.email) {
    sendReservationCancelled({
      to: prof.email,
      professorName: prof.name,
      subject: reservation.subject,
      classGroup: reservation.classGroup,
      roomName: rm?.name ?? "Sala",
      date: dateFormatted,
      startTime: reservation.startTime,
      endTime: reservation.endTime,
      cancelledByCoordinator,
    }).catch(() => {});
  }

  // Notificação in-app para o professor (apenas se cancelado pelo coordenador)
  if (cancelledByCoordinator && prof) {
    await createNotification({
      userId: prof.id,
      type: "reservation_cancelled",
      title: "🚫 Reserva cancelada pela coordenação",
      message: `${reservation.subject} — ${reservation.classGroup} em ${dateFormatted} das ${reservation.startTime} às ${reservation.endTime} foi cancelada.`,
      reservationId: reservation.id,
    });
  }
});

// ── POST /reservations/:reservationId/confirm-presence ──────────
router.post("/reservations/:reservationId/confirm-presence", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const rawId = Array.isArray(req.params.reservationId) ? req.params.reservationId[0] : req.params.reservationId;
  const params = ConfirmPresenceParams.safeParse({ reservationId: parseInt(rawId, 10) });
  if (!params.success) { res.status(400).json({ error: "ID inválido" }); return; }

  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, params.data.reservationId));
  if (!reservation) { res.status(404).json({ error: "Reserva não encontrada" }); return; }

  const [confirmer] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  const isCoordinator = confirmer?.role === "coordinator" || confirmer?.role === "admin";

  if (!isCoordinator && reservation.professorId !== userId) {
    res.status(403).json({ error: "Esta reserva não é sua." }); return;
  }
  if (reservation.confirmedPresence) {
    res.status(400).json({ error: "Presença já confirmada anteriormente." }); return;
  }
  if (!["confirmed"].includes(reservation.status)) {
    res.status(400).json({ error: "Esta reserva não está ativa ou confirmada." }); return;
  }

  const [config] = await db.select().from(systemConfigTable);
  const toleranceMinutes = config?.toleranceMinutes ?? 15;
  const now = new Date();
  const startDateTime = new Date(`${reservation.date}T${reservation.startTime}:00-03:00`);
  const endDateTime = new Date(`${reservation.date}T${reservation.endTime}:00-03:00`);

  if (!isCoordinator) {
    if (now < startDateTime) {
      res.status(400).json({ error: `A reserva ainda não começou. Volte às ${reservation.startTime}.` }); return;
    }
    if (now > endDateTime) {
      res.status(400).json({ error: "O horário da reserva já encerrou. Não é possível confirmar presença." }); return;
    }
  }

  await db.update(reservationsTable).set({
    confirmedPresence: true,
    confirmedAt: now,
    status: "realized",
  }).where(eq(reservationsTable.id, params.data.reservationId));

  res.json(ConfirmPresenceResponse.parse({ success: true, message: "Presença confirmada com sucesso!" }));
});

// ── POST /reservations/:reservationId/approve ────────────────────
router.post("/reservations/:reservationId/approve", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || (user.role !== "coordinator" && user.role !== "admin")) {
    res.status(403).json({ error: "Apenas coordenadores podem aprovar reservas." }); return;
  }

  const rawId = Array.isArray(req.params.reservationId) ? req.params.reservationId[0] : req.params.reservationId;
  const reservationId = parseInt(rawId, 10);
  if (isNaN(reservationId)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, reservationId));
  if (!reservation) { res.status(404).json({ error: "Reserva não encontrada" }); return; }
  if (reservation.status !== "pending") { res.status(400).json({ error: "Apenas reservas pendentes podem ser aprovadas." }); return; }

  const [updated] = await db.update(reservationsTable)
    .set({ status: "confirmed" })
    .where(eq(reservationsTable.id, reservationId))
    .returning();

  const [professor] = await db.select().from(usersTable).where(eq(usersTable.id, updated.professorId));
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, updated.roomId));
  res.json(await buildReservationResponse(updated, professor ?? null, room ?? null));

  const [d, m, y] = [updated.date.slice(8,10), updated.date.slice(5,7), updated.date.slice(0,4)];
  const dateFormatted = `${d}/${m}/${y}`;

  // Email
  if (professor?.email) {
    sendReservationApproved({
      to: professor.email,
      professorName: professor.name,
      subject: updated.subject,
      classGroup: updated.classGroup,
      roomName: room?.name ?? "Sala",
      date: dateFormatted,
      startTime: updated.startTime,
      endTime: updated.endTime,
    }).catch(() => {});
  }

  // Notificação in-app
  if (professor) {
    await createNotification({
      userId: professor.id,
      type: "reservation_approved",
      title: "✅ Reserva aprovada!",
      message: `${updated.subject} — ${updated.classGroup} em ${dateFormatted} das ${updated.startTime} às ${updated.endTime} foi aprovada pela coordenação.`,
      reservationId: updated.id,
    });
  }
});

// ── POST /reservations/:reservationId/reject ─────────────────────
router.post("/reservations/:reservationId/reject", async (req, res): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || (user.role !== "coordinator" && user.role !== "admin")) {
    res.status(403).json({ error: "Apenas coordenadores podem recusar reservas." }); return;
  }

  const rawId = Array.isArray(req.params.reservationId) ? req.params.reservationId[0] : req.params.reservationId;
  const reservationId = parseInt(rawId, 10);
  if (isNaN(reservationId)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, reservationId));
  if (!reservation) { res.status(404).json({ error: "Reserva não encontrada" }); return; }
  if (reservation.status !== "pending") { res.status(400).json({ error: "Apenas reservas pendentes podem ser recusadas." }); return; }

  const [updated] = await db.update(reservationsTable)
    .set({ status: "rejected" })
    .where(eq(reservationsTable.id, reservationId))
    .returning();

  const [professor] = await db.select().from(usersTable).where(eq(usersTable.id, updated.professorId));
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, updated.roomId));
  res.json(await buildReservationResponse(updated, professor ?? null, room ?? null));

  const [d, m, y] = [updated.date.slice(8,10), updated.date.slice(5,7), updated.date.slice(0,4)];
  const dateFormatted = `${d}/${m}/${y}`;

  // Email
  if (professor?.email) {
    sendReservationRejected({
      to: professor.email,
      professorName: professor.name,
      subject: updated.subject,
      classGroup: updated.classGroup,
      roomName: room?.name ?? "Sala",
      date: dateFormatted,
      startTime: updated.startTime,
      endTime: updated.endTime,
    }).catch(() => {});
  }

  // Notificação in-app
  if (professor) {
    await createNotification({
      userId: professor.id,
      type: "reservation_rejected",
      title: "❌ Reserva recusada",
      message: `${updated.subject} — ${updated.classGroup} em ${dateFormatted} das ${updated.startTime} às ${updated.endTime} foi recusada pela coordenação.`,
      reservationId: updated.id,
    });
  }
});

// ── POST /reservations/:reservationId/justify ────────────────────
router.post("/reservations/:reservationId/justify", async (req: any, res: any): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [actor] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!actor || (actor.role !== "coordinator" && actor.role !== "admin")) {
    res.status(403).json({ error: "Apenas coordenadores ou administradores podem justificar reservas." }); return;
  }

  const reservationId = parseInt(req.params.reservationId, 10);
  if (isNaN(reservationId)) { res.status(400).json({ error: "ID inválido" }); return; }

  const note = (req.body?.note ?? "").trim();
  if (!note) { res.status(400).json({ error: "A justificativa não pode estar vazia." }); return; }

  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, reservationId));
  if (!reservation) { res.status(404).json({ error: "Reserva não encontrada" }); return; }

  if (reservation.status !== "no_show" && reservation.status !== "justified") {
    res.status(400).json({ error: "Apenas reservas com falta podem ser justificadas." }); return;
  }

  const wasNoShow = reservation.status === "no_show";

  const [updated] = await db.update(reservationsTable)
    .set({
      status: "justified",
      justificationNote: note,
      justifiedAt: new Date(),
      justifiedByUserId: userId,
    })
    .where(eq(reservationsTable.id, reservationId))
    .returning();

  if (wasNoShow) {
    const [prof] = await db.select().from(usersTable).where(eq(usersTable.id, reservation.professorId));
    if (prof && prof.totalAbsences > 0) {
      await db.update(usersTable)
        .set({ totalAbsences: prof.totalAbsences - 1 })
        .where(eq(usersTable.id, reservation.professorId));
    }
  }

  const [professor] = await db.select().from(usersTable).where(eq(usersTable.id, updated.professorId));
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, updated.roomId));
  res.json({
    ...(await buildReservationResponse(updated, professor ?? null, room ?? null)),
    justificationNote: updated.justificationNote,
    justifiedAt: updated.justifiedAt?.toISOString() ?? null,
    justifiedByUserId: updated.justifiedByUserId,
  });
});

// ── GET /no-shows ────────────────────────────────────────────────
router.get("/no-shows", async (req: any, res: any): Promise<void> => {
  const userId = requireAuth(req, res);
  if (!userId) return;

  const [actor] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!actor || (actor.role !== "coordinator" && actor.role !== "admin")) {
    res.status(403).json({ error: "Acesso restrito." }); return;
  }

  const { or, desc } = await import("drizzle-orm");
  const reservations = await db.select().from(reservationsTable)
    .where(or(eq(reservationsTable.status, "no_show"), eq(reservationsTable.status, "justified")))
    .orderBy(desc(reservationsTable.date));

  const allUsers = await db.select().from(usersTable);
  const allRooms = await db.select().from(roomsTable);

  const result = reservations.map(r => {
    const professor = allUsers.find(u => u.id === r.professorId) ?? null;
    const room = allRooms.find(rm => rm.id === r.roomId) ?? null;
    return {
      id: r.id,
      professorId: r.professorId,
      professorName: professor?.name ?? "Desconhecido",
      roomId: r.roomId,
      roomNumber: room?.number ?? "?",
      roomName: room?.name ?? "Desconhecida",
      date: r.date,
      startTime: r.startTime,
      endTime: r.endTime,
      subject: r.subject,
      classGroup: r.classGroup,
      status: r.status,
      justificationNote: r.justificationNote ?? null,
      justifiedAt: r.justifiedAt?.toISOString() ?? null,
      justifiedByUserId: r.justifiedByUserId ?? null,
      createdAt: r.createdAt.toISOString(),
    };
  });

  res.json(result);
});

export { checkAndRecordAbsences };
export default router;
