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
      // IGNORAMOS as libs do workspace no build para não travar
      external: [
        'pg', 
        'pg-native', 
        '@workspace/db', 
        '@workspace/shared', 
        'express', 
        'cors', 
        'zod', 
        'drizzle-orm'
      ],
    });

    // Esta parte garante que o frontend apareça no navegador
    const srcDir = '../clickreserva/dist';
    const destDir = './dist/public';
    if (fs.existsSync(srcDir)) {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      execSync(`cp -R ${srcDir}/* ${destDir}/`);
    }
    console.log('✅ Build restaurado! O site deve abrir agora.');
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}
build();
