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
      // O segredo está aqui: mapeamos o nome para o caminho físico
      alias: {
        '@workspace/db': '../../lib/db/src/index.ts',
      },
      // Mantemos apenas o que é driver de sistema como externo
      external: ['pg-native', 'pg'],
    });

    const srcDir = '../clickreserva/dist';
    const destDir = './dist/public';
    if (fs.existsSync(srcDir)) {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const { execSync } = await import('child_process');
      execSync(`cp -R ${srcDir}/* ${destDir}/`);
    }
    console.log('✅ Build com Alias concluído!');
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}
build();
