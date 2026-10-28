// Checks the TypeScript variants in src/bits/ts against their JavaScript sources in src/bits:
//   1. every Bits Lab original in src/meta.js has a variant,
//   2. the variants pass a strict type check (tsconfig.variants.json),
//   3. with types stripped, each variant compiles to exactly the same code as its .jsx source,
//      so the two can never drift apart in behavior.
//
//   npm run check:ts
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transformSync } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { COMPONENTS } = await import(pathToFileURL(path.join(root, 'src/meta.js')).href);
let failed = false;

const missing = COMPONENTS.filter(c => !fs.existsSync(path.join(root, 'src/bits/ts', `${c.name}.tsx`)));
if (missing.length) {
  failed = true;
  console.error(`Missing TypeScript variants: ${missing.map(c => c.name).join(', ')}`);
}

try {
  execFileSync(path.join(root, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.variants.json'], { cwd: root, stdio: 'inherit' });
  console.log('types: strict check passed');
} catch {
  failed = true;
  console.error('types: strict check failed');
}

const strip = (code, loader) => transformSync(code, { loader, jsx: 'automatic', format: 'esm', target: 'es2022', minifyWhitespace: true, minifySyntax: false }).code;

let same = 0;
for (const component of COMPONENTS) {
  const tsFile = path.join(root, 'src/bits/ts', `${component.name}.tsx`);
  if (!fs.existsSync(tsFile)) continue;
  const js = strip(fs.readFileSync(path.join(root, component.file), 'utf8'), 'jsx');
  const ts = strip(fs.readFileSync(tsFile, 'utf8'), 'tsx');
  if (js === ts) {
    same++;
    continue;
  }
  failed = true;
  let i = 0;
  while (i < js.length && js[i] === ts[i]) i++;
  console.error(`drift: ${component.name}.tsx differs from ${path.basename(component.file)} at char ${i}`);
  console.error(`  jsx: …${js.slice(Math.max(0, i - 60), i + 80)}…`);
  console.error(`  tsx: …${ts.slice(Math.max(0, i - 60), i + 80)}…`);
}
console.log(`drift: ${same}/${COMPONENTS.length} variants match their JavaScript source`);
process.exit(failed ? 1 : 0);
