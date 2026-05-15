 import * as esbuild from 'esbuild';
import fs from 'fs';
import { execSync } from 'child_process';

async function build() {
  try {
    console.log('preparing internal copies...');
    
    // 1. Limpa e copia a lib/db para dentro de src/db para facilitar a vida do esbuild
    if (fs.existsSync('./src/db')) fs.rmSync('./src/db', { recursive: true });
    execSync('cp -R ../../lib/db/src ./src/db');

    await esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      target: 'node24',
      outfile: 'dist/index.mjs',
      sourcemap: true,
      // Agora o alias aponta para a cópia local!
      alias: {
        '@workspace/db': './src/db',
      },
      external: [
        'pg-native', 
        'pg', 
        'drizzle-orm',
        'zod',
        'express',
        'cors',
        'pino',
        'pino-pretty'
      ],
    });

    // Cópia do frontend
    const srcDir = '../clickreserva/dist';
    const destDir = './dist/public';
    if (fs.existsSync(srcDir)) {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      execSync(`cp -R ${srcDir}/* ${destDir}/`);
    }
    
    console.log('✅ Build com Cópia Local Concluído!');
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}
build();
