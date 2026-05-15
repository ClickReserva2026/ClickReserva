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
      // Mapeamos o prefixo do pacote para a pasta src da lib
      alias: {
        '@workspace/db': '../../lib/db/src',
      },
      external: ['pg-native', 'pg'],
    });

    const srcDir = '../clickreserva/dist';
    const destDir = './dist/public';
    if (fs.existsSync(srcDir)) {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const { execSync } = await import('child_process');
      execSync(`cp -R ${srcDir}/* ${destDir}/`);
    }
    console.log('✅ Build Corrigido com Sucesso!');
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}
build();
