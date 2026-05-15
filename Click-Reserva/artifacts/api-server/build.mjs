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
      // Aqui está o segredo: não tentamos ler o código fonte das libs
      // Deixamos o Node resolver isso depois de instalado
      external: [
        'pg-native', 
        'pg', 
        '@workspace/db', 
        '@workspace/shared',
        'drizzle-orm',
        'zod',
        'express',
        'cors'
      ],
    });

    const srcDir = '../clickreserva/dist';
    const destDir = './dist/public';
    if (fs.existsSync(srcDir)) {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const { execSync } = await import('child_process');
      execSync(`cp -R ${srcDir}/* ${destDir}/`);
    }
    console.log('✅ Build do Servidor Concluído!');
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}
build();
