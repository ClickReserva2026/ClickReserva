import * as esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

async function build() {
  try {
    // 1. O Build do Servidor
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
      ]
    });

    // 2. Copiar o Frontend manualmente (substituindo o plugin que falhou)
    const srcDir = '../clickreserva/dist';
    const destDir = './dist/public';

    if (fs.existsSync(srcDir)) {
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      
      // Comando simples para copiar pastas no Linux (Render usa Linux)
      const { execSync } = await import('child_process');
      execSync(`cp -R ${srcDir}/* ${destDir}/`);
      
      console.log('✅ Frontend copiado manualmente para dist/public');
    }

    console.log('✅ Build concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro no build:', error);
    process.exit(1);
  }
}

build();
