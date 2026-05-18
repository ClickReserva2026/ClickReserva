// lib/db/migrate.mjs
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  // Tabela notifications
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id             SERIAL PRIMARY KEY,
      user_id        INTEGER NOT NULL,
      type           TEXT NOT NULL,
      title          TEXT NOT NULL,
      message        TEXT NOT NULL,
      reservation_id INTEGER,
      read           BOOLEAN NOT NULL DEFAULT false,
      created_at     TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log("✅ Tabela notifications criada/verificada com sucesso!");

  // Colunas que faltam na tabela reservations
  await pool.query(`
    ALTER TABLE reservations
      ADD COLUMN IF NOT EXISTS tablet_quantity INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  `);
  console.log("✅ Colunas tablet_quantity e updated_at verificadas/adicionadas!");

  // Colunas que faltam na tabela rooms
  await pool.query(`
    ALTER TABLE rooms
      ADD COLUMN IF NOT EXISTS computers INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS description TEXT,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
  `);
  console.log("✅ Colunas da tabela rooms verificadas/adicionadas!");

  // Inserir salas (ignora se já existir pelo número)
  const salas = [
    { number: "LAB - 01", name: "Laboratório Informática - Bloco 01",  capacity: 30, computers: 30 },
    { number: "LAB - 02", name: "Laboratório Informática - Bloco 01",  capacity: 30, computers: 30 },
    { number: "LAB - 03", name: "Laboratório Chromebook - Bloco 02",   capacity: 30, computers: 30 },
    { number: "LAB - 04", name: "Auditório - Bloco 02",                capacity: 50, computers: 1  },
    { number: "LAB - 05", name: "Laboratório Programação - Bloco 02",  capacity: 30, computers: 20 },
    { number: "LAB - 06", name: "Laboratório de Ciências - Bloco 02",  capacity: 30, computers: 20 },
    { number: "LAB - 07", name: "Laboratório Chromebook - Bloco 02",   capacity: 30, computers: 20 },
    { number: "LAB - 08", name: "Brinquedoteca - Bloco 02",            capacity: 30, computers: 1  },
    { number: "LAB - 09", name: "Tablets Individual",                  capacity: 30, computers: 30 },
  ];

  for (const sala of salas) {
    await pool.query(`
      INSERT INTO rooms (number, name, capacity, computers, is_active)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (number) DO UPDATE SET
        name      = EXCLUDED.name,
        capacity  = EXCLUDED.capacity,
        computers = EXCLUDED.computers
    `, [sala.number, sala.name, sala.capacity, sala.computers]);
  }
  console.log("✅ 9 salas inseridas/atualizadas com sucesso!");

} catch (err) {
  console.error("❌ Erro na migração:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
