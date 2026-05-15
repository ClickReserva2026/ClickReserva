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
      // Removemos o @workspace/db daqui para que o esbuild resolva os arquivos .ts
      external: ['pg-native', 'pg'], 
      banner: {
        // Truque para resolver problemas de caminhos no Node ESM
        js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
      },
    });

    const srcDir = '../clickreserva/dist';
    const destDir = './dist/public';
    if (fs.existsSync(srcDir)) {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const { execSync } = await import('child_process');
      execSync(`cp -R ${srcDir}/* ${destDir}/`);
    }
    console.log('✅ Build Unificado Concluído!');
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}
build();
