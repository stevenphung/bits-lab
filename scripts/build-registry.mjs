// Emits a shadcn-compatible registry to public/r, like reactbits.dev/r/<Name>-<Variant>.json.
// Install a component from the running app with: npx shadcn@latest add <origin>/r/<Name>.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function buildRegistry() {
  // Cache-bust so edits to meta.js are picked up while the dev server runs.
  const metaUrl = `${pathToFileURL(path.join(root, 'src/meta.js')).href}?t=${Date.now()}`;
  const { COMPONENTS } = await import(metaUrl);
  const outDir = path.join(root, 'public/r');
  fs.mkdirSync(outDir, { recursive: true });

  const items = COMPONENTS.map(component => {
    const fileName = path.basename(component.file);
    return {
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      name: component.name,
      type: 'registry:component',
      title: component.name,
      description: component.description,
      dependencies: component.dependencies,
      categories: [component.category],
      files: [
        {
          path: `${component.name}/${fileName}`,
          type: 'registry:component',
          content: fs.readFileSync(path.join(root, component.file), 'utf8')
        }
      ]
    };
  });

  // TypeScript variants live in src/bits/ts and install as <Name>-TS (strict-checked by npm run check:ts).
  for (const component of COMPONENTS) {
    const tsFile = path.join(root, 'src/bits/ts', `${component.name}.tsx`);
    if (!fs.existsSync(tsFile)) continue;
    items.push({
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      name: `${component.name}-TS`,
      type: 'registry:component',
      title: `${component.name} (TypeScript)`,
      description: component.description,
      dependencies: component.dependencies,
      categories: [component.category],
      files: [
        {
          path: `${component.name}/${component.name}.tsx`,
          type: 'registry:component',
          content: fs.readFileSync(tsFile, 'utf8')
        }
      ]
    });
  }

  // Tailwind variants live in src/bits/tw (JavaScript) and src/bits/tw-ts (TypeScript) and install
  // as <Name>-TW and <Name>-TS-TW (checked by npm run check:tw).
  for (const component of COMPONENTS) {
    for (const [dir, ext, suffix, label] of [
      ['tw', 'jsx', 'TW', 'Tailwind'],
      ['tw-ts', 'tsx', 'TS-TW', 'TypeScript, Tailwind']
    ]) {
      const file = path.join(root, 'src/bits', dir, `${component.name}.${ext}`);
      if (!fs.existsSync(file)) continue;
      items.push({
        $schema: 'https://ui.shadcn.com/schema/registry-item.json',
        name: `${component.name}-${suffix}`,
        type: 'registry:component',
        title: `${component.name} (${label})`,
        description: `${component.description} Needs Tailwind CSS v4.`,
        dependencies: component.dependencies,
        categories: [component.category],
        files: [
          {
            path: `${component.name}/${component.name}.${ext}`,
            type: 'registry:component',
            content: fs.readFileSync(file, 'utf8')
          }
        ]
      });
    }
  }

  for (const item of items) {
    fs.writeFileSync(path.join(outDir, `${item.name}.json`), `${JSON.stringify(item, null, 2)}\n`);
  }

  const index = {
    $schema: 'https://ui.shadcn.com/schema/registry.json',
    name: 'react-bit-re',
    homepage: 'http://localhost:5173',
    items: items.map(({ $schema, files, ...item }) => ({
      ...item,
      files: files.map(({ content, ...file }) => file)
    }))
  };
  fs.writeFileSync(path.join(outDir, 'registry.json'), `${JSON.stringify(index, null, 2)}\n`);
  return items.length;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const count = await buildRegistry();
  console.log(`registry: wrote ${count} items to public/r`);
}
