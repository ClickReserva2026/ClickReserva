import * as esbuild from 'esbuild';
import fs from 'fs';
import { execSync } from 'child_process';

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
      // Usamos alias simples apontando para as pastas src
      alias: {
        '@workspace/db': '../../lib/db/src',
        '@workspace/shared': '../../lib/shared/src',
      },
      // Deixamos bibliotecas pesadas de fora para o Node resolver no runtime
      external: ['pg', 'pg-native', 'express', 'cors', 'zod', 'drizzle-orm'],
    });

    // Copia o frontend para a pasta pública (o que faz o site abrir)
    const srcDir = '../clickreserva/dist';
    const destDir = './dist/public';
    if (fs.existsSync(srcDir)) {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      execSync(`cp -R ${srcDir}/* ${destDir}/`);
    }
    console.log('✅ Build restaurado e pronto!');
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}
build();
