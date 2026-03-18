import { build } from 'esbuild';
import { mkdirSync } from 'fs';

mkdirSync('dist', { recursive: true });

await build({
  entryPoints: ['src/index.tsx'],
  bundle: true,
  outfile: 'dist/_worker.js',
  format: 'esm',
  platform: 'node',
  external: ['cloudflare:*', '__STATIC_CONTENT_MANIFEST', 'node:*'],
  jsx: 'automatic',
  jsxImportSource: 'hono/jsx',
  minify: true,
});

console.log('Build complete → dist/_worker.js');
