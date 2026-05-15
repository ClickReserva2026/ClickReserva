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
      // Ensinamos o esbuild a ler a pasta do banco de dados
      alias: {
        '@workspace/db': '../../lib/db/src',
      },
      // Deixamos apenas as bibliotecas puras de fora
      external: [
        'pg-native', 
        'pg', 
        '@workspace/shared',
        'drizzle-orm',
        'zod',
        'express',
        'cors',
        'pino',
        'pino-pretty'
      ],
    });

    const srcDir = '../clickreserva/dist';
    const destDir = './dist/public';
    if (fs.existsSync(srcDir)) {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const { execSync } = await import('child_process');
      execSync(`cp -R ${srcDir}/* ${destDir}/`);
    }
    console.log('✅ Build Unificado e Corrigido!');
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}
build();
