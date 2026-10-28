// Checks that the three templates (src/templates) use every Bits Lab component: each one is
// imported from src/bits and rendered (or called, for function APIs like toast()) somewhere.
//
//   npm run check:templates
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { COMPONENTS } = await import(pathToFileURL(path.join(root, 'src/meta.js')).href);
const dir = path.join(root, 'src/templates');
const files = fs.readdirSync(dir).filter(file => /Template\.jsx$/.test(file));
const used = new Map();

for (const file of files) {
  const source = fs.readFileSync(path.join(dir, file), 'utf8');
  for (const [, names, module] of source.matchAll(/import ([^;]+?) from '\.\.\/bits\/(\w+)'/g)) {
    // Every local name the import binds: the default and any { named, other as alias }.
    const locals = names.replace(/[{}]/g, ',').split(',').map(part => part.trim().split(/\s+as\s+/).pop()).filter(Boolean);
    if (locals.some(local => new RegExp(`<${local}[\\s/>]|\\b${local}\\(`).test(source))) {
      used.set(module, [...(used.get(module) ?? []), file.replace('Template.jsx', '')]);
    }
  }
}

const missing = COMPONENTS.filter(c => !used.has(path.basename(c.file, '.jsx')));
for (const c of missing) console.error(`templates: ${c.name} is not used by any template`);
const counts = files.map(file => `${file.replace('Template.jsx', '')} ${[...used.values()].filter(list => list.includes(file.replace('Template.jsx', ''))).length}`);
console.log(`templates: ${COMPONENTS.length - missing.length}/${COMPONENTS.length} components used (${counts.join(', ')})`);
process.exit(missing.length ? 1 : 0);
