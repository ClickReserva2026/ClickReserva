async function runMigrationPatch() {
  try {
    const { db } = await import("./lib/db");
    // Garante que exista uma 'escola' configurada para o sistema não ler 'vazio'
    await db.execute(sql`
      INSERT INTO schools (id, name, address) 
      VALUES (1, 'C.E. Prof. Mário B.T. Braga', 'Endereço da Escola')
      ON CONFLICT (id) DO NOTHING;
    `);
    logger.info("Registro base da escola verificado.");
  } catch (e) {
    logger.error("Erro ao verificar registro base, mas o sistema seguirá.");
  }
}
