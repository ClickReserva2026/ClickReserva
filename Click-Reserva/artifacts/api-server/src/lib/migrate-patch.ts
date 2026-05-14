import postgres from 'postgres';

export async function runMigrationPatch() {
  const sql = postgres(process.env.DATABASE_URL!, {
    ssl: 'require',
    max: 1,
  });

  try {
    console.log('[migrate-patch] Iniciando patch do schema...');

    // Patch tabela users
    await sql`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS total_absences INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS block_reason TEXT,
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true,
        ADD COLUMN IF NOT EXISTS registration_status TEXT NOT NULL DEFAULT 'approved',
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS phone TEXT,
        ADD COLUMN IF NOT EXISTS subject TEXT,
        ADD COLUMN IF NOT EXISTS department TEXT
    `;

    // Patch tabela reservations
    await sql`
      ALTER TABLE reservations
        ADD COLUMN IF NOT EXISTS confirmed_presence BOOLEAN NOT NULL DEFAULT false,
        ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS justification_note TEXT,
        ADD COLUMN IF NOT EXISTS justified_at TIMESTAMP,
        ADD COLUMN IF NOT EXISTS justified_by_user_id INTEGER REFERENCES users(id)
    `;

    // Tabela rooms
    await sql`
      CREATE TABLE IF NOT EXISTS rooms (
        id SERIAL PRIMARY KEY,
        number TEXT NOT NULL,
        name TEXT NOT NULL,
        capacity INTEGER,
        type TEXT NOT NULL DEFAULT 'sala',
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Tabela absences
    await sql`
      CREATE TABLE IF NOT EXISTS absences (
        id SERIAL PRIMARY KEY,
        professor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reservation_id INTEGER REFERENCES reservations(id),
        absence_date TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Tabela system_config
    await sql`
      CREATE TABLE IF NOT EXISTS system_config (
        id SERIAL PRIMARY KEY,
        tolerance_minutes INTEGER NOT NULL DEFAULT 15,
        absence_limit_for_block INTEGER NOT NULL DEFAULT 3,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      INSERT INTO system_config (tolerance_minutes, absence_limit_for_block)
      SELECT 15, 3
      WHERE NOT EXISTS (SELECT 1 FROM system_config)
    `;

    // Tabela blocked_slots
    await sql`
      CREATE TABLE IF NOT EXISTS blocked_slots (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES rooms(id),
        date TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `;

    // Tabela password_reset_requests
    await sql`DROP TABLE IF EXISTS password_reset_requests`;
    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        fulfilled_at TIMESTAMP
      )
    `;

    console.log('[migrate-patch] ✅ Patch aplicado com sucesso!');
  } catch (err) {
    console.error('[migrate-patch] ❌ Erro:', err);
  } finally {
    await sql.end();
  }
}
