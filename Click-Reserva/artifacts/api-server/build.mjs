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
      banner: {
        js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
      },
      alias: {
        '@workspace/db': '../../lib/db/src',
        '@workspace/shared': '../../lib/shared/src',
      },
      resolveExtensions: ['.ts', '.js'],
      external: [
        'pg',
        'pg-native',
        'express',
        'cors',
        'zod',
        'drizzle-orm',
        'pino',
        'pino-http',
        'pino-pretty',
      ],
    });

    const srcDir = '../clickreserva/dist';
    const destDir = './dist/public';
    if (fs.existsSync(srcDir)) {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      execSync(`cp -R ${srcDir}/* ${destDir}/`);
    }

    console.log('✅ Build restaurado com resolução de extensões!');
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}

build();
