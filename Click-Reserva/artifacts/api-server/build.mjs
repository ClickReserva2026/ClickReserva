import * as esbuild from 'esbuild';
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

async function build() {
  try {
    console.log('Preparing internal copies...');
    
    // Limpa e copia a lib/db para dentro de src/db
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
      alias: {
        '@workspace/db': './src/db',
      },
      // Resolve o problema de importar "./app" sem ".ts"
      resolveExtensions: ['.ts', '.js', '.mjs'],
      external: [
        'pg-native', 
        'pg', 
        'drizzle-orm',
        'drizzle-zod', // Adicionado aqui!
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
    
    console.log('✅ Build Concluído com Sucesso!');
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}
build();
