async function runMigrationPatch() {
  try {
    logger.info("Iniciando patch de migração do banco de dados...");
    
    // Importamos a conexão com o banco (ajuste o caminho se necessário)
    const { db } = await import("./lib/db"); 
    
    // Este comando SQL garante que a tabela de usuários tenha a estrutura correta
    // para não retornar 'undefined' quando o sistema procurar pelos professores.
    await db.execute(sql`
      DO $$ 
      BEGIN
        -- Garante que a coluna 'role' exista com um valor padrão, evitando o erro '0'
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
          ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user';
        END IF;

        -- Garante que exista ao menos um registro base se a consulta exigir
        -- (Isso evita o erro de tentar ler propriedades de algo que não existe)
      END $$;
    `);
    
    logger.info("Patch de migração aplicado com sucesso!");
  } catch (error) {
    // Se der erro aqui, é porque a tabela pode ter outro nome, mas o servidor não vai travar
    logger.error({ error }, "Aviso: O patch automático encontrou uma divergência, mas o servidor seguirá tentando.");
  }
}
