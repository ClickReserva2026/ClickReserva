import * as esbuild from 'esbuild';
import { copy } from 'esbuild-plugin-copy';
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
      external: [
        'pg-native',
        '@workspace/db',
        '@workspace/db/schema',
        'drizzle-orm'
      ],
      plugins: [
        copy({
          resolveFrom: 'cwd',
          assets: {
            from: ['../clickreserva/dist/**/*'],
            to: ['./dist/public'],
          },
        }),
      ],
    });

    console.log('✅ Frontend copiado para dist/public');
    console.log('✅ Build concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}

build();
