// Docs for AI coding tools, generated from the catalog: public/llms.txt (an index, per llmstxt.org),
// public/llms-full.txt (everything in one file) and public/docs/<Name>.md (one page per component:
// install, usage, props with types and defaults, notes and accessibility). The npm package gets the
// same pages with relative links (packages/bits-lab/llms.txt and docs/).
//
// Sources: src/meta.js (names, categories, descriptions), the demo configs in src/catalog*.jsx
// (curated prop notes and usage, read statically), the TypeScript variants (prop types and their
// doc comments) and the JavaScript originals (defaults).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from '@babel/parser';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://bits-lab.vercel.app';

// ---------- catalog: docs rows and usage per slug ----------

function walk(node, visit) {
  if (!node || typeof node.type !== 'string') return;
  visit(node);
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) value.forEach(child => walk(child, visit));
    else if (value && typeof value.type === 'string') walk(value, visit);
  }
}

const keyName = prop => (prop.key.type === 'Identifier' ? prop.key.name : prop.key.value);

function text(node, src) {
  if (node.type === 'StringLiteral') return node.value;
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) return node.quasis.map(q => q.value.cooked).join('');
  return src.slice(node.start, node.end);
}

function readCatalog() {
  const demos = {};
  for (const file of fs.readdirSync(path.join(root, 'src')).filter(f => /^catalog.*\.jsx$/.test(f))) {
    const src = fs.readFileSync(path.join(root, 'src', file), 'utf8');
    const ast = parse(src, { sourceType: 'module', plugins: ['jsx'] });
    walk(ast.program, node => {
      if (node.type !== 'ObjectProperty' || node.value.type !== 'ObjectExpression') return;
      const fields = Object.fromEntries(node.value.properties.filter(p => p.type === 'ObjectProperty').map(p => [keyName(p), p.value]));
      if (!fields.docs || !fields.usage) return;
      demos[keyName(node)] = {
        docs: fields.docs.elements.map(row => row.elements.map(cell => text(cell, src))),
        usage: text(fields.usage, src)
      };
    });
  }
  return demos;
}

// ---------- props: types from the TypeScript variant, defaults from the original ----------

// Text between a bracket at `open` and its partner, ignoring brackets inside strings and comments.
function block(src, open) {
  const pairs = { '{': '}', '(': ')', '[': ']' };
  const stack = [];
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === "'" || c === '"' || c === '`') {
      for (i++; i < src.length && src[i] !== c; i++) if (src[i] === '\\') i++;
    } else if (c === '/' && src[i + 1] === '/') {
      i = src.indexOf('\n', i);
    } else if (c === '/' && src[i + 1] === '*') {
      i = src.indexOf('*/', i) + 1;
    } else if (pairs[c]) {
      stack.push(pairs[c]);
    } else if (c === stack[stack.length - 1]) {
      stack.pop();
      if (!stack.length) return src.slice(open + 1, i);
    }
  }
  throw new Error('unbalanced');
}

// Split on a separator at bracket depth 0.
function splitTop(body, sep) {
  const out = [];
  let depth = 0;
  let start = 0;
  let quote = null;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
    } else if (c === "'" || c === '"' || c === '`') quote = c;
    else if ('{([<'.includes(c) && !(c === '<' && body[i + 1] === '=')) depth++;
    else if ('})]'.includes(c) || (c === '>' && body[i - 1] !== '=')) depth = Math.max(0, depth - 1);
    else if (c === sep && depth === 0) {
      out.push(body.slice(start, i));
      start = i + 1;
    }
  }
  out.push(body.slice(start));
  return out;
}

function propTypes(ts, iface) {
  const m = ts.match(new RegExp(`export interface ${iface}(?: extends ([^{]+))? \\{`));
  if (!m) return { props: [], extends: null };
  const body = block(ts, m.index + m[0].length - 1);
  const props = [];
  let note = '';
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    const doc = line.match(/^\/\*\*\s*(.*?)\s*\*\/$/);
    if (doc) {
      note = doc[1];
      continue;
    }
    const prop = line.match(/^([\w$]+)(\??):\s*(.*?);?$/);
    if (prop) {
      props.push({ name: prop[1], optional: prop[2] === '?', type: prop[3], note });
      note = '';
    } else if (line && !line.startsWith('*') && !line.startsWith('/*')) {
      // A type that runs over several lines: append it to the previous prop.
      if (props.length) props[props.length - 1].type += ' ' + line.replace(/;$/, '');
    }
  }
  return { props, extends: m[1]?.trim() ?? null };
}

function defaults(js, fn) {
  const m = js.match(new RegExp(`export (?:default )?function ${fn}\\(\\{`));
  if (!m) return {};
  const body = block(js, m.index + m[0].length - 1);
  const out = {};
  for (const part of splitTop(body, ',')) {
    // Params without a default are recorded too (as null), so callers know the prop exists.
    const p = part.trim().match(/^([\w$]+)(?:\s*=\s*([\s\S]+))?$/);
    if (p) out[p[1]] = p[2] ? p[2].trim().replace(/\s+/g, ' ') : null;
  }
  return out;
}

// Other exported types in the TypeScript variant (item shapes, unions), as declared.
function extraTypes(ts) {
  const out = [];
  const re = /^export (interface|type) (\w+)/gm;
  let m;
  while ((m = re.exec(ts))) {
    if (/Props$/.test(m[2])) continue;
    let end;
    if (m[1] === 'interface') {
      const open = ts.indexOf('{', m.index);
      end = open + block(ts, open).length + 2;
    } else {
      end = ts.indexOf(';\n', m.index) + 1;
    }
    out.push(ts.slice(m.index, end));
  }
  return out;
}

// ---------- pages ----------

const cell = s => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

function page(c, demo, category, { link }) {
  const base = path.basename(c.file, '.jsx');
  const ts = fs.readFileSync(path.join(root, 'src/bits/ts', `${base}.tsx`), 'utf8');
  const js = fs.readFileSync(path.join(root, c.file), 'utf8');
  // What the package exports from this file, and one props table per exported component.
  const named = [...js.matchAll(/^export (?:function|const) (\w+)/gm)].map(m => m[1]);
  const defaultName = js.match(/^export default function (\w+)/m)?.[1];
  const specifiers = [...(defaultName && !named.includes(defaultName) ? [c.name] : []), ...named];
  const tables = [...ts.matchAll(/^export interface (\w+)Props\b/gm)].map(m => {
    // The package exports a default under the component's name (AchievementToaster as AchievementToast).
    const component = m[1] === defaultName && !named.includes(defaultName) ? c.name : m[1];
    return { component, ...propTypes(ts, `${m[1]}Props`), defs: defaults(js, m[1]) };
  });
  const themed = js.includes('/* theme tokens */') || js.includes('/* light overrides */');
  const own = c.dependencies?.length > 0;
  const lines = [];

  lines.push(`# ${c.name}`, '', `> ${c.description}`, '');
  lines.push(`Category: ${category}. Live demo: ${SITE}/${c.category}/${c.slug}`, '');

  lines.push('## Install', '', '```bash', `npm install bits-lab${own ? ` ${c.dependencies.join(' ')}` : ''}`, '```', '');
  lines.push('```jsx', own ? `import ${c.name} from "bits-lab/${base}";` : `import { ${specifiers.join(', ')} } from "bits-lab";\n// or from its own entry: "bits-lab/${base}"`, '```', '');
  lines.push('Or copy the source into your project (JavaScript, TypeScript, CSS or Tailwind variant):', '');
  lines.push('```bash', `npx shadcn@latest add ${SITE}/r/${c.name}.json      # JavaScript + CSS`, `npx shadcn@latest add ${SITE}/r/${c.name}-TS.json   # TypeScript`, `npx shadcn@latest add ${SITE}/r/${c.name}-TW.json   # Tailwind v4`, `npx shadcn@latest add ${SITE}/r/${c.name}-TS-TW.json # TypeScript + Tailwind`, '```', '');

  if (demo?.usage) lines.push('## Usage', '', '```jsx', demo.usage.trim().replace(/from "\.\/(\w+)"/g, 'from "bits-lab/$1"'), '```', '');

  const rows = demo?.docs ?? [];
  const a11y = rows.find(r => /^accessibility$/i.test(r[0]));
  const notes = rows.filter(r => r !== a11y);
  if (notes.length) {
    lines.push('## Key props', '', '| Prop | Type | Default | Notes |', '|---|---|---|---|');
    for (const [p, t, d, n] of notes) lines.push(`| ${cell(p)} | ${cell(t)} | ${cell(d)} | ${cell(n)} |`);
    lines.push('');
  }

  for (const t of tables) {
    if (!t.props.length) continue;
    const heading = tables.length > 1 ? `## Props: ${t.component}` : '## All props';
    lines.push(heading, '', `From the TypeScript types${t.extends ? ` (also accepts everything from \`${t.extends}\`)` : ''}. Every prop is optional unless marked required.`, '', '| Prop | Type | Default | Description |', '|---|---|---|---|');
    for (const p of t.props) {
      const d = t.defs[p.name] ? `\`${cell(t.defs[p.name])}\`` : themed && /Color$/.test(p.name) && p.name in t.defs ? 'theme' : '-';
      lines.push(`| \`${p.name}\`${p.optional ? '' : ' (required)'} | \`${cell(p.type)}\` | ${d} | ${cell(p.note)} |`);
    }
    lines.push('');
  }

  const types = extraTypes(ts);
  if (types.length) lines.push('## Types', '', '```ts', types.join('\n\n'), '```', '');

  if (a11y) lines.push('## Accessibility', '', a11y[3], '');

  lines.push('## Styling', '');
  lines.push('- Styles are injected by the component; there is no stylesheet to import. `className` and `style` go on the root element.');
  if (themed) lines.push('- Light mode: put `data-theme="light"` (or the `light` class) on `<html>` or any ancestor; `data-theme="system"` follows the OS. Colour props override the theme.');
  else lines.push('- Colours come from props (or are part of the design); it looks the same in light and dark themes.');
  lines.push('- Respects `prefers-reduced-motion`. Every file starts with `"use client"`, so it works in the Next.js App Router.', '');
  lines.push(`See also: [all components](${link('llms.txt')}).`, '');
  return lines.join('\n');
}

function gettingStarted(count, link) {
  return `# Bits Lab: getting started

> Game feel for real products: ${count} original React components that bring game design to everyday software, in a playful 8-bit style. React 19, no dependencies, styles included.

## Install

\`\`\`bash
npm install bits-lab
\`\`\`

\`\`\`jsx
import { QuestLog, AchievementToast, achievement } from "bits-lab";
// Each component also has its own entry: import Toaster, { toast } from "bits-lab/ToastStack";
\`\`\`

- No setup: each component injects its own styles. There is no CSS file to import and no Tailwind config.
- TypeScript types are included. Every file starts with \`"use client"\` (Next.js App Router ready).
- GravityBox needs \`matter-js\` and is only available from \`bits-lab/GravityBox\`.

## Copy the source instead

Every component is in a shadcn-compatible registry in four variants:

\`\`\`bash
npx shadcn@latest add ${SITE}/r/<Name>.json        # JavaScript + injected CSS
npx shadcn@latest add ${SITE}/r/<Name>-TS.json     # TypeScript
npx shadcn@latest add ${SITE}/r/<Name>-TW.json     # Tailwind CSS v4 utilities
npx shadcn@latest add ${SITE}/r/<Name>-TS-TW.json  # TypeScript + Tailwind
\`\`\`

## Conventions

- Props are optional with sensible defaults. Controlled/uncontrolled pairs follow React: \`value\` / \`defaultValue\` / \`onValueChange\` (or \`open\` / \`defaultOpen\` / \`onOpenChange\`, and so on).
- Colours are props ending in \`Color\` (\`accentColor\`, \`textColor\`, …). Sizes are numbers in px.
- \`className\` and \`style\` go on the root element.
- Components follow WAI-ARIA patterns, work with the keyboard and respect \`prefers-reduced-motion\`.

## Light mode

Put \`data-theme="light"\` (or the \`light\` class) on \`<html>\` or any wrapper. \`data-theme="system"\` follows the OS; a nested \`dark\` class switches back. Toasts, dialogs and menus render into \`<body>\`, so theme \`<html>\` or \`<body>\` for them. Screen-like components (terminals, game screens, video) stay dark by design.

## Picking a component

Bits Lab maps game patterns to product moments: onboarding as a quest (QuestLog, SideQuests), milestones as achievements (AchievementToast), progress as meters (HealthBar, LevelMap), risky actions as hold-to-confirm (HoldToConfirm), loading with tips (PixelLoader), empty states as scenes (EmptyScenes), and agent UIs (AgentCard, ReplyActions, PartyFormation). The full list is in [llms.txt](${link('llms.txt')}).
`;
}

export async function buildDocs() {
  const metaUrl = `${pathToFileURL(path.join(root, 'src/meta.js')).href}?t=${Date.now()}`;
  const { COMPONENTS, CATEGORIES } = await import(metaUrl);
  const demos = readCatalog();
  const missing = COMPONENTS.filter(c => !demos[c.slug]).map(c => c.name);
  if (missing.length) throw new Error(`docs: no catalog docs for ${missing.join(', ')}`);
  const categoryName = slug => CATEGORIES.find(cat => cat.slug === slug)?.name ?? slug;

  const targets = [
    { dir: path.join(root, 'public'), link: file => `${SITE}/${file}` },
    { dir: path.join(root, 'packages/bits-lab'), link: file => file, package: true }
  ];
  for (const target of targets) {
    const docsDir = path.join(target.dir, 'docs');
    fs.rmSync(docsDir, { recursive: true, force: true });
    fs.mkdirSync(docsDir, { recursive: true });
    const pageLink = target.package ? file => (file === 'llms.txt' ? '../llms.txt' : `../${file}`) : target.link;
    const pages = COMPONENTS.map(c => [c, page(c, demos[c.slug], categoryName(c.category), { link: pageLink })]);
    for (const [c, md] of pages) fs.writeFileSync(path.join(docsDir, `${c.name}.md`), md);
    fs.writeFileSync(path.join(docsDir, 'getting-started.md'), gettingStarted(COMPONENTS.length, pageLink));

    const index = [
      '# Bits Lab',
      '',
      `> Game feel for real products: ${COMPONENTS.length} original React components (React 19, no dependencies, styles included) that bring game design to everyday software: onboarding as a quest, milestones as achievements, progress bars, combos, streaks, hold-to-confirm, pixel empty states and agent UIs, plus everything around them, in a playful 8-bit style.`,
      '',
      'Install with `npm install bits-lab` and import by name (`import { QuestLog } from "bits-lab"`), or copy one component\'s source with `npx shadcn@latest add ' + SITE + '/r/<Name>.json` (`-TS`, `-TW` and `-TS-TW` variants too). Styles are injected; light mode is `data-theme="light"` on `<html>`.',
      '',
      '## Docs',
      '',
      `- [Getting started](${target.link('docs/getting-started.md')}): install, conventions, light mode and how to pick a component`,
      ''
    ];
    for (const cat of CATEGORIES) {
      const items = COMPONENTS.filter(c => c.category === cat.slug);
      if (!items.length) continue;
      index.push(`## ${cat.name}`, '');
      for (const c of items) index.push(`- [${c.name}](${target.link(`docs/${c.name}.md`)}): ${c.description}`);
      index.push('');
    }
    if (!target.package) index.push('## Optional', '', `- [Everything in one file](${target.link('llms-full.txt')}): all component pages concatenated`, '');
    fs.writeFileSync(path.join(target.dir, 'llms.txt'), index.join('\n'));
    // The one-file version is for the site only; the package keeps its pages separate.
    if (!target.package) fs.writeFileSync(path.join(target.dir, 'llms-full.txt'), [gettingStarted(COMPONENTS.length, pageLink), ...pages.map(([, md]) => md)].join('\n---\n\n'));
  }
  return COMPONENTS.length;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const n = await buildDocs();
  console.log(`docs: wrote llms.txt, llms-full.txt and ${n} component pages to public/ (and llms.txt + pages to packages/bits-lab/)`);
}
