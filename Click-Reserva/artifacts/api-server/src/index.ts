async function runMigrationPatch() {
  try {
    const { db } = await import("./lib/db");
    const { sql } = await import("drizzle-orm");

    logger.info("Sincronizando colunas da tabela de usuários...");

    // Este comando força o banco a ter exatamente o que o seu 'users.ts' pede
    await db.execute(sql`
      DO $$ 
      BEGIN 
        -- Garante a coluna registration_status (essencial para a tela de professores)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='registration_status') THEN
          ALTER TABLE users ADD COLUMN registration_status TEXT DEFAULT 'approved';
        END IF;

        -- Garante a coluna total_absences
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='total_absences') THEN
          ALTER TABLE users ADD COLUMN total_absences INTEGER DEFAULT 0;
        END IF;

        -- Garante que o Coordenador tenha o status 'approved' para não sumir da lista
        UPDATE users SET registration_status = 'approved' WHERE registration_status IS NULL;
      END $$;
    `);
    
    logger.info("Banco de dados sincronizado com sucesso!");
  } catch (error) {
    logger.error({ error }, "Aviso: O patch encontrou um detalhe, mas tentará seguir.");
  }
}
