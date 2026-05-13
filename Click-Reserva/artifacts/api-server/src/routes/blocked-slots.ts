import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, blockedSlotsTable, roomsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

function requireCoordinator(req: any, res: any): number | null {
  const session = req.session as Record<string, unknown>;
  const userId = session.userId as number | undefined;
  if (!userId) {
    res.status(401).json({ error: "Não autenticado" });
    return null;
  }
  return userId;
}

async function buildSlotResponse(slot: typeof blockedSlotsTable.$inferSelect, room: typeof roomsTable.$inferSelect | null) {
  return {
    id: slot.id,
    roomId: slot.roomId ?? null,
    roomNumber: room?.number ?? null,
    roomName: room?.name ?? null,
    date: slot.date ?? null,
    startTime: slot.startTime,
    endTime: slot.endTime,
    reason: slot.reason,
    createdAt: slot.createdAt.toISOString(),
  };
}

router.get("/blocked-slots", async (req, res): Promise<void> => {
  const session = req.session as Record<string, unknown>;
  if (!session.userId) {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }

  const slots = await db.select().from(blockedSlotsTable);
  const rooms = await db.select().from(roomsTable);

  const results = await Promise.all(slots.map(async (slot) => {
    const room = slot.roomId ? (rooms.find(r => r.id === slot.roomId) ?? null) : null;
    return buildSlotResponse(slot, room);
  }));

  res.json(results);
});

router.post("/blocked-slots", async (req, res): Promise<void> => {
  const userId = requireCoordinator(req, res);
  if (!userId) return;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || (user.role !== "coordinator" && user.role !== "admin")) {
    res.status(403).json({ error: "Apenas coordenadores podem criar bloqueios." });
    return;
  }

  const { roomId, date, startTime, endTime, reason } = req.body;
  if (!startTime || !endTime || !reason) {
    res.status(400).json({ error: "Campos obrigatórios: startTime, endTime, reason" });
    return;
  }

  const [slot] = await db.insert(blockedSlotsTable).values({
    roomId: roomId ?? null,
    date: date ?? null,
    startTime,
    endTime,
    reason,
  }).returning();

  const room = roomId ? (await db.select().from(roomsTable).where(eq(roomsTable.id, roomId)))[0] ?? null : null;

  res.status(201).json(await buildSlotResponse(slot, room));
});

router.delete("/blocked-slots/:slotId", async (req, res): Promise<void> => {
  const userId = requireCoordinator(req, res);
  if (!userId) return;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || (user.role !== "coordinator" && user.role !== "admin")) {
    res.status(403).json({ error: "Apenas coordenadores podem remover bloqueios." });
    return;
  }

  const slotId = parseInt(req.params.slotId, 10);
  if (isNaN(slotId)) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [slot] = await db.select().from(blockedSlotsTable).where(eq(blockedSlotsTable.id, slotId));
  if (!slot) {
    res.status(404).json({ error: "Bloqueio não encontrado" });
    return;
  }

  await db.delete(blockedSlotsTable).where(eq(blockedSlotsTable.id, slotId));
  res.json({ success: true, message: "Bloqueio removido com sucesso." });
});

export default router;
