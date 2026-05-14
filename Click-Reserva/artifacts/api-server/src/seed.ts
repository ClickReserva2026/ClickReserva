import { db } from "./lib/db";
import { users } from "@workspace/db/schema";
import { hashPassword } from "./lib/auth"; // ou o caminho correto da sua função de hash

export async function seedDatabase() {
  console.log("Iniciando semeadura de professores...");
  
  await db.insert(users).values([
    {
      name: "Coordenador Geral",
      email: "coordenador@escola.pr.gov.br",
      password: await hashPassword("senha123"),
      role: "coordinator",
      registrationStatus: "approved",
      isActive: true,
    },
    {
      name: "Simone Vitoriano de Barros",
      email: "simone.vitoriano.barros@escola.pr.gov.br",
      password: await hashPassword("mudar123"),
      role: "professor",
      registrationStatus: "approved",
      isActive: true,
    }
  ]).onConflictDoNothing(); // Isso evita erro se você rodar o seed duas vezes

  console.log("Professores semeados com sucesso!");
}
