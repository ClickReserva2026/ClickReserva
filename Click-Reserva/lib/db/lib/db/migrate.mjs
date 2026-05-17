// lib/db/migrate.mjs
// Script de migração direto via SQL — sem prompts interativos.
// Executado automaticamente no build do Render.

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER NOT NULL,
      type          TEXT NOT NULL,
      title         TEXT NOT NULL,
      message       TEXT NOT NULL,
      reservation_id INTEGER,
      read          BOOLEAN NOT NULL DEFAULT false,
      created_at    TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `);
  console.log("✅ Tabela notifications criada/verificada com sucesso!");
} catch (err) {
  console.error("❌ Erro na migração:", err.message);
  process.exit(1);
} finally {
  await pool.end();
}
