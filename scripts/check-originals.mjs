// Guards the "original, not ported" rule (quality bar item 10) against the React Bits catalog:
//   1. no Bits Lab component shares a name with a React Bits component,
//   2. no Bits Lab component's props overlap a React Bits component's props too closely
//      (matching APIs are the clearest sign that a component was modelled on another one).
// The React Bits sources are local-only, so check 2 runs only where src/reactbits exists. Check 1
// falls back to scripts/reactbits-names.json (names only, refreshed on every local run).
//
//   npm run check:originals
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { COMPONENTS } = await import(pathToFileURL(path.join(root, 'src/meta.js')).href);
const catalogPath = path.join(root, 'src/reactbits/catalog.json');
const namesPath = path.join(root, 'scripts/reactbits-names.json');
const local = fs.existsSync(catalogPath);

// Props every component has, or that are too generic to say anything about where it came from.
const GENERIC = new Set(['className', 'style', 'children', 'text', 'color', 'label', 'title', 'items', 'width', 'height', 'size', 'duration', 'delay', 'speed', 'radius', 'onChange', 'value', 'defaultValue', 'as', 'fontFamily', 'fontSize', 'backgroundColor', 'textColor']);
// Flag when at least this many specific props match and they make up this share of the smaller set.
const MIN_SHARED = 4;
const MIN_SHARE = 0.5;
// Overlaps a person has looked at and judged to be shared vocabulary, not a shared design.
const REVIEWED = {
  'RollingNumber/Counter': 'Intl number-format options (locale, format, prefix, suffix) and a stagger every digit roller has',
  'TextOnPath/TextLoop': 'generic text-motion words (path, direction, fontWeight, letterSpacing, pauseOnHover)'
};

let rbItems;
if (local) {
  rbItems = JSON.parse(fs.readFileSync(catalogPath, 'utf8')).items;
  fs.writeFileSync(namesPath, JSON.stringify(rbItems.map(item => item.name).sort(), null, 2) + '\n');
} else if (fs.existsSync(namesPath)) {
  rbItems = JSON.parse(fs.readFileSync(namesPath, 'utf8')).map(name => ({ name }));
} else {
  console.log('originals: no React Bits catalog or names list, skipped');
  process.exit(0);
}

// The destructured props of a file's default export (a function declaration or arrow).
function propsOf(file) {
  const ast = parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx', 'typescript'] });
  const body = ast.program.body;
  const exported = body.find(node => node.type === 'ExportDefaultDeclaration')?.declaration;
  let fn = exported;
  if (exported?.type === 'Identifier') {
    for (const node of body) {
      const decl = node.type === 'ExportNamedDeclaration' ? node.declaration : node;
      if (decl?.type === 'FunctionDeclaration' && decl.id?.name === exported.name) fn = decl;
      if (decl?.type === 'VariableDeclaration') for (const d of decl.declarations) if (d.id.name === exported.name) fn = d.init;
    }
  }
  while (fn && fn.type === 'CallExpression') fn = fn.arguments[0]; // forwardRef(…), memo(…)
  const param = fn?.params?.[0];
  if (param?.type !== 'ObjectPattern') return new Set();
  return new Set(param.properties.filter(p => p.type === 'ObjectProperty').map(p => p.key.name ?? p.key.value).filter(name => name && !GENERIC.has(name)));
}

const norm = name => name.toLowerCase().replace(/[^a-z0-9]/g, '');
const rbNames = new Map(rbItems.map(item => [norm(item.name), item.name]));
let failed = false;

for (const c of COMPONENTS) {
  const clash = rbNames.get(norm(c.name));
  if (clash) (failed = true), console.error(`name: ${c.name} has the same name as React Bits ${clash}`);
}

if (local) {
  const rbProps = rbItems.map(item => ({ name: item.name, props: propsOf(path.join(root, 'src/reactbits', item.name, item.entry)) }));
  for (const c of COMPONENTS) {
    const mine = propsOf(path.join(root, c.file));
    if (mine.size < MIN_SHARED) continue;
    for (const rb of rbProps) {
      const shared = [...mine].filter(p => rb.props.has(p));
      if (REVIEWED[`${c.name}/${rb.name}`]) continue;
      if (shared.length >= MIN_SHARED && shared.length / Math.min(mine.size, rb.props.size) >= MIN_SHARE) {
        failed = true;
        console.error(`props: ${c.name} shares ${shared.length} specific props with React Bits ${rb.name}: ${shared.join(', ')}`);
      }
    }
  }
}

console.log(`originals: ${COMPONENTS.length} Bits Lab components checked against ${rbItems.length} React Bits names${local ? ' and props' : ' (props skipped: no local catalog)'}`);
process.exit(failed ? 1 : 0);
