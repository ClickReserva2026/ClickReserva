import { db } from "./lib/db";
import { users } from "@workspace/db/schema";
import { hashPassword } from "./lib/auth";

export async function seedDatabase() {
  try {
    const senhaSimone = await hashPassword("mudar123");
    const senhaCoord = await hashPassword("senha123");

    await db.insert(users).values([
      {
        name: "Simone Vitoriano de Barros",
        email: "simone.vitoriano.barros@escola.pr.gov.br",
        password: senhaSimone,
        role: "professor",
        registrationStatus: "approved",
        isActive: true,
      },
      {
        name: "Coordenador Geral",
        email: "coordenador@escola.pr.gov.br",
        password: senhaCoord,
        role: "coordinator",
        registrationStatus: "approved",
        isActive: true,
      }
    ]).onConflictDoNothing();

    console.log("✅ Seed finalizado com sucesso!");
  } catch (error) {
    console.error("❌ Erro ao rodar seed:", error);
  }
}
