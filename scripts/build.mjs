// Builds dist/frame-probe.js and dist/frame-probe.min.js from src, with the package version stamped in.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { transform } from 'esbuild';
const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
const src = readFileSync('src/frame-probe.js', 'utf8').replaceAll('__VERSION__', version);
mkdirSync('dist', { recursive: true });
writeFileSync('dist/frame-probe.js', src);
const min = await transform(src, { minify: true, legalComments: 'inline', target: 'es2017' });
writeFileSync('dist/frame-probe.min.js', min.code);
console.log(`built frame-probe v${version} (min ${min.code.length} B)`);
