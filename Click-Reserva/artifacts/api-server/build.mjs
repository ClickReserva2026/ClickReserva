import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

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
        '@workspace/db': '../../lib/db/src',
        '@workspace/shared': '../../lib/shared/src',
      },
      // Este plugin resolve o problema do "./app" vs "./app.ts"
      plugins: [{
        name: 'resolve-ts-extension',
        setup(build) {
          build.onResolve({ filter: /^\.\.?\// }, (args) => {
            if (args.importer.includes('lib/db') || args.importer.includes('lib/shared')) {
              const tsPath = path.resolve(args.resolveDir, args.path + '.ts');
              if (fs.existsSync(tsPath)) return { path: tsPath };
              const tsIndexPath = path.resolve(args.resolveDir, args.path, 'index.ts');
              if (fs.existsSync(tsIndexPath)) return { path: tsIndexPath };
            }
          });
        },
      }],
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

    const srcDir = '../clickreserva/dist';
    const destDir = './dist/public';
    if (fs.existsSync(srcDir)) {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const { execSync } = await import('child_process');
      execSync(`cp -R ${srcDir}/* ${destDir}/`);
    }
    console.log('✅ Build com Plugin Concluído!');
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}
build();
