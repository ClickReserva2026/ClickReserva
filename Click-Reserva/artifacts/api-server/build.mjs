import * as esbuild from 'esbuild';
import fs from 'fs';

async function build() {
  try {
    await esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true, // Isso vai juntar tudo em um arquivo só
      platform: 'node',
      format: 'esm',
      target: 'node24',
      outfile: 'dist/index.mjs',
      sourcemap: true,
      // Deixamos apenas o que é impossível de juntar
      external: ['pg-native', 'pg'], 
      loader: { '.ts': 'ts' },
    });

    const srcDir = '../clickreserva/dist';
    const destDir = './dist/public';
    if (fs.existsSync(srcDir)) {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const { execSync } = await import('child_process');
      execSync(`cp -R ${srcDir}/* ${destDir}/`);
    }
    console.log('✅ Build Completo e Unificado!');
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}
build();
