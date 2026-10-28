// Checks the Tailwind variants against the CSS originals:
//   1. every src/bits/tw/<Name>.jsx has a TypeScript twin in src/bits/tw-ts, and vice versa,
//   2. the TypeScript twins pass a strict type check (tsconfig.tw.json),
//   3. logic drift: with className and style attributes and the CSS injection (STYLE_ID, CSS,
//      useStyles) removed, each Tailwind variant parses to exactly the same code as its original.
//      Only the styling may differ; state, effects, handlers, markup and strings may not,
//   4. with types stripped, each tw-ts file compiles to exactly the same code as its tw twin.
// How the two versions actually look is checked separately, in the browser: /tw-check.html
// renders both and diffs every computed style.
//
//   npm run check:tw
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transformSync } from 'esbuild';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';

const traverse = traverseModule.default ?? traverseModule;
const generate = generateModule.default ?? generateModule;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { COMPONENTS } = await import(pathToFileURL(path.join(root, 'src/meta.js')).href);
const twDir = path.join(root, 'src/bits/tw');
const twTsDir = path.join(root, 'src/bits/tw-ts');
let failed = false;

const names = name => fs.readdirSync(name).filter(f => /\.(jsx|tsx)$/.test(f)).map(f => f.replace(/\.(jsx|tsx)$/, ''));
const tw = new Set(names(twDir));
const twTs = new Set(names(twTsDir));
const known = new Set(COMPONENTS.map(c => c.name));

for (const name of tw) if (!twTs.has(name)) (failed = true), console.error(`missing: tw-ts/${name}.tsx (twin of tw/${name}.jsx)`);
for (const name of twTs) if (!tw.has(name)) (failed = true), console.error(`missing: tw/${name}.jsx (twin of tw-ts/${name}.tsx)`);
for (const name of tw) if (!known.has(name)) (failed = true), console.error(`unknown: tw/${name}.jsx is not a Bits Lab original in src/meta.js`);

if (twTs.size) {
  try {
    execFileSync(path.join(root, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.tw.json'], { cwd: root, stdio: 'inherit' });
    console.log('types: strict check passed');
  } catch {
    failed = true;
    console.error('types: strict check failed');
  }
}

// Everything but the styling, as compact code.
function logic(code) {
  const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
  traverse(ast, {
    JSXAttribute(p) {
      if (p.node.name.name === 'className' || p.node.name.name === 'style') p.remove();
    },
    // className in a props object that gets spread onto an element is styling too.
    ObjectProperty(p) {
      if (!p.node.computed && p.node.key.name === 'className') p.remove();
    },
    VariableDeclarator(p) {
      if (['STYLE_ID', 'CSS', 'STYLES'].includes(p.node.id.name) && p.parentPath.parentPath.isProgram()) p.parentPath.remove();
    },
    FunctionDeclaration(p) {
      if (p.node.id?.name === 'useStyles' && p.parentPath.isProgram()) p.remove();
    },
    CallExpression(p) {
      if (p.node.callee.name === 'useStyles' && p.parentPath.isExpressionStatement()) p.parentPath.remove();
    },
    ImportSpecifier(p) {
      if (p.node.imported.name !== 'useInsertionEffect') return;
      // An import left with nothing in it goes too (the Tailwind version drops the line).
      if (p.parentPath.node.specifiers.length === 1) p.parentPath.remove();
      else p.remove();
    }
  });
  return generate(ast, { comments: false, compact: true }).code;
}

const strip = (code, loader) => transformSync(code, { loader, jsx: 'automatic', format: 'esm', target: 'es2022', minifyWhitespace: true, minifySyntax: false }).code;

const report = (label, a, b) => {
  let i = 0;
  while (i < a.length && a[i] === b[i]) i++;
  console.error(label);
  console.error(`  original: …${a.slice(Math.max(0, i - 80), i + 80)}…`);
  console.error(`  tailwind: …${b.slice(Math.max(0, i - 80), i + 80)}…`);
};

// Classes the code looks up (querySelector('.bl-x'), closest('.bl-x'), classList…): any .bl-*
// selector in a string outside the stylesheet.
function hooks(code) {
  const found = new Set();
  const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
  const scan = text => {
    for (const m of text.matchAll(/\.(bl-[a-z0-9_-]+)/gi)) found.add(m[1]);
  };
  traverse(ast, {
    VariableDeclarator(p) {
      if (p.node.id.name === 'CSS' || p.node.id.name === 'STYLES') p.skip();
    },
    JSXAttribute(p) {
      if (p.node.name.name === 'className') p.skip();
    },
    ObjectProperty(p) {
      if (!p.node.computed && p.node.key.name === 'className') p.skip();
    },
    StringLiteral(p) {
      scan(p.node.value);
    },
    TemplateElement(p) {
      scan(p.node.value.raw);
    }
  });
  // classList.contains('bl-x') names a class without the dot.
  for (const m of code.matchAll(/classList\.\w+\(\s*['"`](bl-[a-z0-9_-]+)/gi)) found.add(m[1]);
  return found;
}

// The raw source of every className attribute.
function classNames(code) {
  const out = [];
  const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
  traverse(ast, {
    JSXAttribute(p) {
      if (p.node.name.name === 'className') out.push(code.slice(p.node.value.start, p.node.value.end));
    },
    ObjectProperty(p) {
      if (!p.node.computed && p.node.key.name === 'className') out.push(code.slice(p.node.value.start, p.node.value.end));
    }
  });
  return out.join(' ');
}

let sameLogic = 0;
let sameTypes = 0;
for (const component of COMPONENTS) {
  if (!tw.has(component.name)) continue;
  const originalCode = fs.readFileSync(path.join(root, component.file), 'utf8');
  const variantCode = fs.readFileSync(path.join(twDir, `${component.name}.jsx`), 'utf8');
  const original = logic(originalCode);
  const variant = logic(variantCode);
  if (original === variant) sameLogic++;
  else (failed = true), report(`logic drift: tw/${component.name}.jsx differs from ${path.basename(component.file)} beyond styling`, original, variant);

  // The code still looks these classes up, so the Tailwind markup must keep them (unstyled).
  const markup = classNames(variantCode);
  for (const hook of hooks(originalCode)) {
    if (!new RegExp(`(^|[\\s"'\`])${hook}($|[\\s"'\`])`).test(markup)) (failed = true), console.error(`missing hook: tw/${component.name}.jsx has no "${hook}" class, but the code looks it up`);
  }

  if (!twTs.has(component.name)) continue;
  const js = strip(fs.readFileSync(path.join(twDir, `${component.name}.jsx`), 'utf8'), 'jsx');
  const ts = strip(fs.readFileSync(path.join(twTsDir, `${component.name}.tsx`), 'utf8'), 'tsx');
  if (js === ts) sameTypes++;
  else (failed = true), report(`drift: tw-ts/${component.name}.tsx differs from tw/${component.name}.jsx`, js, ts);
}

console.log(`logic: ${sameLogic}/${tw.size} Tailwind variants match their original beyond styling`);
console.log(`drift: ${sameTypes}/${twTs.size} tw-ts variants match their tw source`);
console.log(`coverage: ${tw.size}/${COMPONENTS.length} originals have Tailwind variants`);
process.exit(failed ? 1 : 0);
