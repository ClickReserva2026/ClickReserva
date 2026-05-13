import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, roomsTable } from "@workspace/db";
import {
  GetRoomsResponse,
  GetRoomParams,
  GetRoomResponse,
  CreateRoomBody,
  UpdateRoomParams,
  UpdateRoomBody,
  UpdateRoomResponse,
  DeleteRoomParams,
  DeleteRoomResponse,
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

router.get("/rooms", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const rooms = await db.select().from(roomsTable).orderBy(roomsTable.number);
  res.json(GetRoomsResponse.parse(rooms.map(r => ({
    id: r.id,
    number: r.number,
    name: r.name,
    capacity: r.capacity,
    computers: r.computers,
    isActive: r.isActive,
    description: r.description ?? null,
  }))));
});

router.post("/rooms", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const parsed = CreateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", message: parsed.error.message });
    return;
  }

  const [room] = await db.insert(roomsTable).values({
    number: parsed.data.number,
    name: parsed.data.name,
    capacity: parsed.data.capacity,
    computers: parsed.data.computers,
    isActive: parsed.data.isActive ?? true,
    description: parsed.data.description ?? null,
  }).returning();

  res.status(201).json(GetRoomResponse.parse({
    id: room.id,
    number: room.number,
    name: room.name,
    capacity: room.capacity,
    computers: room.computers,
    isActive: room.isActive,
    description: room.description ?? null,
  }));
});

router.get("/rooms/:roomId", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = GetRoomParams.safeParse({ roomId: parseInt(req.params.roomId as string, 10) });
  if (!params.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, params.data.roomId));
  if (!room) {
    res.status(404).json({ error: "Sala não encontrada" });
    return;
  }

  res.json(GetRoomResponse.parse({
    id: room.id,
    number: room.number,
    name: room.name,
    capacity: room.capacity,
    computers: room.computers,
    isActive: room.isActive,
    description: room.description ?? null,
  }));
});

router.put("/rooms/:roomId", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = UpdateRoomParams.safeParse({ roomId: parseInt(req.params.roomId as string, 10) });
  if (!params.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const parsed = UpdateRoomBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Dados inválidos", message: parsed.error.message });
    return;
  }

  const [room] = await db.update(roomsTable).set({
    number: parsed.data.number,
    name: parsed.data.name,
    capacity: parsed.data.capacity,
    computers: parsed.data.computers,
    isActive: parsed.data.isActive ?? true,
    description: parsed.data.description ?? null,
  }).where(eq(roomsTable.id, params.data.roomId)).returning();

  if (!room) {
    res.status(404).json({ error: "Sala não encontrada" });
    return;
  }

  res.json(UpdateRoomResponse.parse({
    id: room.id,
    number: room.number,
    name: room.name,
    capacity: room.capacity,
    computers: room.computers,
    isActive: room.isActive,
    description: room.description ?? null,
  }));
});

router.delete("/rooms/:roomId", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = DeleteRoomParams.safeParse({ roomId: parseInt(req.params.roomId as string, 10) });
  if (!params.success) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const [room] = await db.delete(roomsTable).where(eq(roomsTable.id, params.data.roomId)).returning();
  if (!room) {
    res.status(404).json({ error: "Sala não encontrada" });
    return;
  }

  res.json(DeleteRoomResponse.parse({ success: true, message: "Sala removida com sucesso." }));
});

export default router;
