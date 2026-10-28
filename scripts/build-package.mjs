// Builds the npm package in packages/bits-lab/dist from the JavaScript + CSS components:
//   - one ES module per component (JSX compiled, "use client" on top for Next.js),
//   - TypeScript declarations emitted from the TypeScript variants in src/bits/ts,
//   - index.js / index.d.ts re-exporting every component and its named exports.
//
//   npm run build:package
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transform } from 'esbuild';
import { parse } from '@babel/parser';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkgDir = path.join(root, 'packages/bits-lab');
const dist = path.join(pkgDir, 'dist');
const { COMPONENTS } = await import(pathToFileURL(path.join(root, 'src/meta.js')).href);

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

// The names a module exports: value exports, type-only exports, and what its default is.
function exportsOf(source, plugins) {
  const body = parse(source, { sourceType: 'module', plugins }).program.body;
  const values = [];
  const types = [];
  let defaultName = null;
  for (const node of body) {
    if (node.type === 'ExportDefaultDeclaration') {
      const d = node.declaration;
      defaultName = d.type === 'Identifier' ? d.name : (d.id?.name ?? null);
    }
    if (node.type !== 'ExportNamedDeclaration') continue;
    const d = node.declaration;
    const into = node.exportKind === 'type' || /^TS(Interface|TypeAlias)Declaration$/.test(d?.type) ? types : values;
    if (d?.id) into.push(d.id.name);
    if (d?.declarations) for (const v of d.declarations) into.push(v.id.name);
    for (const s of node.specifiers ?? []) (s.exportKind === 'type' ? types : into).push(s.exported.name);
  }
  return { values, types, defaultName };
}

const seen = new Set();
const separate = [];
const indexJs = [];
const indexDts = [];
// Exported in several files (small helpers like isLand); left to the per-component entry points.
const skipped = [];
const claim = (name, file) => {
  if (seen.has(name)) return skipped.push(`${name} (${file})`), false;
  seen.add(name);
  return true;
};

for (const c of COMPONENTS) {
  const base = path.basename(c.file, '.jsx');
  const source = fs.readFileSync(path.join(root, c.file), 'utf8');
  const { code } = await transform(source, { loader: 'jsx', jsx: 'automatic', format: 'esm', target: 'es2020', legalComments: 'none' });
  fs.writeFileSync(path.join(dist, `${base}.js`), `'use client';\n${code}`);
  // Components with dependencies (GravityBox needs matter-js) stay out of the index, so importing
  // from "bits-lab" never pulls in a package the app didn't install. They have their own entry.
  if (c.dependencies?.length) {
    separate.push(c.name);
    continue;
  }

  const js = exportsOf(source, ['jsx']);
  const ts = exportsOf(fs.readFileSync(path.join(root, 'src/bits/ts', `${base}.tsx`), 'utf8'), ['jsx', 'typescript']);
  const names = js.values.filter(name => claim(name, base));
  // The default is exported under the component's name, unless it is already a named export
  // (ToggleKit's default is Switch, ExpandCard's is ExpandCardGrid).
  const withDefault = !js.values.includes(js.defaultName) && claim(c.name, base);
  const specifiers = [...(withDefault ? [`default as ${c.name}`] : []), ...names];
  indexJs.push(`export { ${specifiers.join(', ')} } from './${base}.js';`);
  const typeNames = ts.types.filter(name => claim(name, base));
  indexDts.push(`export { ${[...specifiers, ...typeNames.map(name => `type ${name}`)].join(', ')} } from './${base}.js';`);
}

fs.writeFileSync(path.join(dist, 'index.js'), `'use client';\n${indexJs.join('\n')}\n`);
fs.writeFileSync(path.join(dist, 'index.d.ts'), `${indexDts.join('\n')}\n`);

// Declarations from the TypeScript variants, which share names and props with the JavaScript ones.
const tsconfig = path.join(root, 'tsconfig.package.json');
fs.writeFileSync(
  tsconfig,
  JSON.stringify({
    extends: './tsconfig.variants.json',
    compilerOptions: { noEmit: false, declaration: true, emitDeclarationOnly: true, rootDir: 'src/bits/ts', outDir: 'packages/bits-lab/dist' },
    include: ['src/bits/ts/*.tsx']
  })
);
try {
  execFileSync(path.join(root, 'node_modules/.bin/tsc'), ['-p', tsconfig], { stdio: 'inherit' });
} finally {
  fs.rmSync(tsconfig);
}

const missing = COMPONENTS.filter(c => !fs.existsSync(path.join(dist, `${path.basename(c.file, '.jsx')}.d.ts`)));
if (missing.length) throw new Error(`no declarations for ${missing.map(c => c.name).join(', ')}`);
console.log(`package: ${COMPONENTS.length} components built to packages/bits-lab/dist (own entry only: ${separate.join(', ')})${skipped.length ? ` (left out of the index as duplicates: ${skipped.join(', ')})` : ''}`);
