import { Router } from "express";
import { db, roomsTable, usersTable } from "@workspace/db";
import { count } from "drizzle-orm";
import { hashPassword } from "./auth";

const router = Router();

router.post("/internal/setup", async (req, res) => {
  const token = req.headers["x-setup-token"];
  if (token !== "clickreserva-init-2026") {
    return res.status(403).json({ error: "Forbidden" });
  }

  const results: string[] = [];

  try {
    const [roomCount] = await db.select({ value: count() }).from(roomsTable);
    if ((roomCount?.value ?? 0) === 0) {
      await db.insert(roomsTable).values([
        { number: "LAB-01", name: "Laboratório de Informática 1", capacity: 30, computers: 25, isActive: true, description: "Laboratório principal com computadores para uso geral" },
        { number: "LAB-02", name: "Laboratório de Informática 2", capacity: 30, computers: 25, isActive: true, description: "Laboratório secundário com computadores para uso geral" },
        { number: "LAB-03", name: "Laboratório de Informática 3", capacity: 25, computers: 20, isActive: true, description: "Laboratório com computadores para projetos especiais" },
        { number: "LAB-04", name: "Laboratório Multimídia", capacity: 20, computers: 15, isActive: true, description: "Laboratório equipado para atividades multimídia" },
      ]);
      results.push("4 salas criadas");
    } else {
      results.push(`Salas já existem (${roomCount?.value})`);
    }

    const [userCount] = await db.select({ value: count() }).from(usersTable);
    results.push(`Usuários existentes: ${userCount?.value}`);

    await db.insert(usersTable).values({
      name: "Coordenador",
      email: "coordenador@escola.pr.gov.br",
      passwordHash: hashPassword("coordenador123"),
      role: "coordinator",
      isActive: true,
      blocked: false,
    }).onConflictDoNothing();
    results.push("Coordenador padrão garantido");

    // Ensure the school coordinator account exists
    const { eq } = await import("drizzle-orm");
    const existing = await db.select({ id: usersTable.id }).from(usersTable)
      .where(eq(usersTable.email, "svbarros.adm@gmail.com"));
    if (existing.length === 0) {
      await db.insert(usersTable).values({
        name: "Simone Vitoriano de Barros",
        email: "svbarros.adm@gmail.com",
        passwordHash: hashPassword("Bento2705@"),
        role: "coordinator",
        isActive: true,
        blocked: false,
      });
      results.push("Conta svbarros criada como coordenadora");
    } else {
      await db.update(usersTable)
        .set({ role: "coordinator", passwordHash: hashPassword("Bento2705@"), isActive: true })
        .where(eq(usersTable.email, "svbarros.adm@gmail.com"));
      results.push("Conta svbarros atualizada para coordenadora");
    }

    return res.json({ ok: true, results });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "Erro desconhecido", results });
  }
});

export default router;
