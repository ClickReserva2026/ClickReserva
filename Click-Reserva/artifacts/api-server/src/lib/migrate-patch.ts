import pkg from 'pg';
const { Pool } = pkg;

export async function runMigrationPatch() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    console.log('[migrate-patch] Iniciando patch do schema...');

    await client.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS total_absences INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS block_reason TEXT,
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS registration_status TEXT NOT NULL DEFAULT 'approved',
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS phone TEXT,
        ADD COLUMN IF NOT EXISTS subject TEXT,
        ADD COLUMN IF NOT EXISTS department TEXT;
    `);

    console.log('[migrate-patch] ✅ Patch aplicado com sucesso!');
  } catch (err) {
    console.error('[migrate-patch] ❌ Erro:', err);
  } finally {
    client.release();
    await pool.end();
  }
}
