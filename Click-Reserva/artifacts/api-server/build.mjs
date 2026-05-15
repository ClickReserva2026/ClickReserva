import * as esbuild from 'esbuild';
import fs from 'fs';

async function build() {
  try {
    await esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node24',
      outfile: 'dist/index.mjs',
      sourcemap: true,
      // Marcamos as libs do workspace como externas para o Node resolver no runtime
      // Isso evita que o esbuild tente entrar em pastas que ele não entende
      external: [
        'pg-native', 
        'pg', 
        '@workspace/db', 
        '@workspace/shared',
        'drizzle-orm',
        'zod',
        'express'
      ],
    });

    // Parte de cópia do frontend (mantemos igual)
    const srcDir = '../clickreserva/dist';
    const destDir = './dist/public';
    if (fs.existsSync(srcDir)) {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const { execSync } = await import('child_process');
      execSync(`cp -R ${srcDir}/* ${destDir}/`);
    }
    console.log('✅ Build concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}
build();
