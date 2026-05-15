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
      alias: {
        // Apontamos o prefixo para a pasta física das libs
        '@workspace/db': '../../lib/db/src',
        '@workspace/shared': '../../lib/shared/src',
      },
      // Resolve o problema das extensões .ts automaticamente
      resolveExtensions: ['.ts', '.js'],
      external: [
        'pg-native', 
        'pg', 
        'drizzle-orm',
        'drizzle-zod',
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
    console.log('✅ Build concluído!');
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}
build();
