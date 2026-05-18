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

  // Coluna tablet_quantity na tabela reservations
  await pool.query(`
    ALTER TABLE reservations
      ADD COLUMN IF NOT EXISTS tablet_quantity INTEGER NOT NULL DEFAULT 0
  `);
  console.log("✅ Coluna tablet_quantity verificada/adicionada com sucesso!");

  // Coluna updated_at na tabela reservations
  await pool.query(`
    ALTER TABLE reservations
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW()
  `);
  console.log("✅ Coluna updated_at verificada/adicionada com sucesso!");

} catch (err) {
  console.error("❌ Erro na migração:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
