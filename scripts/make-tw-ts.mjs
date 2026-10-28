// Builds src/bits/tw-ts/<Name>.tsx from the TypeScript original (src/bits/ts/<Name>.tsx) and the
// Tailwind variant (src/bits/tw/<Name>.jsx): it keeps every type from the former and takes the
// styling from the latter, i.e. each element's className and style attributes (matched in
// order, the markup being identical), the STYLE_ID / CSS / useStyles injection and the header
// comment. Run npm run check:tw afterwards; it type-checks the result and confirms it matches
// its tw twin.
//
//   node scripts/make-tw-ts.mjs Name [Name...]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default ?? traverseModule;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function scan(code, typescript) {
  const ast = parse(code, { sourceType: 'module', plugins: typescript ? ['jsx', 'typescript'] : ['jsx'] });
  const out = { elements: [], props: [], decls: {}, useStyles: null, useStylesCalls: [], reactImport: null };
  traverse(ast, {
    JSXOpeningElement(p) {
      const attrs = {};
      for (const a of p.node.attributes) if (a.type === 'JSXAttribute' && ['className', 'style'].includes(a.name.name)) attrs[a.name.name] = a;
      out.elements.push({ node: p.node, attrs });
    },
    // className in a props object (spread onto an element later).
    ObjectProperty(p) {
      if (!p.node.computed && p.node.key.name === 'className') out.props.push(p.node.value);
    },
    VariableDeclaration(p) {
      if (!p.parentPath.isProgram()) return;
      const name = p.node.declarations[0].id.name;
      if (name === 'STYLE_ID' || name === 'CSS' || name === 'STYLES') out.decls[name] = p.node;
    },
    FunctionDeclaration(p) {
      if (p.parentPath.isProgram() && p.node.id?.name === 'useStyles') out.useStyles = p.node;
    },
    CallExpression(p) {
      if (p.node.callee.name === 'useStyles' && p.parentPath.isExpressionStatement()) out.useStylesCalls.push(p.parentPath.node);
    },
    ImportDeclaration(p) {
      if (p.node.source.value === 'react') out.reactImport = p.node;
    }
  });
  return out;
}

// The // comment block right after the imports (and the CSSVars helper type).
function header(code) {
  const lines = code.split('\n');
  let i = 0;
  while (i < lines.length && (/^(import|type CSSVars)/.test(lines[i]) || lines[i] === '')) i++;
  let j = i;
  while (j < lines.length && lines[j].startsWith('//')) j++;
  const start = lines.slice(0, i).join('\n').length + (i ? 1 : 0);
  return { start, end: start + lines.slice(i, j).join('\n').length, text: lines.slice(i, j).join('\n') };
}

for (const name of process.argv.slice(2)) {
  const twCode = fs.readFileSync(path.join(root, 'src/bits/tw', `${name}.jsx`), 'utf8');
  const tsCode = fs.readFileSync(path.join(root, 'src/bits/ts', `${name}.tsx`), 'utf8');
  const jsCode = fs.readFileSync(path.join(root, 'src/bits', `${name}.jsx`), 'utf8');
  const tw = scan(twCode, false);
  const ts = scan(tsCode, true);
  const js = scan(jsCode, false);
  if (tw.elements.length !== ts.elements.length) throw new Error(`${name}: ${tw.elements.length} JSX elements in tw, ${ts.elements.length} in ts`);
  const hasCSSVars = tsCode.includes('type CSSVars');
  const edits = [];
  const src = (code, node) => code.slice(node.start, node.end);

  const attrName = a => (a.type === 'JSXAttribute' ? a.name.name : null);
  tw.elements.forEach((el, i) => {
    const target = ts.elements[i];
    const styling = attr => {
      let text = src(twCode, attr);
      // Custom properties need the cast in TypeScript.
      if (attrName(attr) === 'style' && hasCSSVars && /'--/.test(text) && text.endsWith('}}')) text = `${text.slice(0, -2)}} as CSSVars}`;
      return text;
    };
    // Styling attributes the Tailwind version dropped.
    for (const name of ['className', 'style']) if (target.attrs[name] && !el.attrs[name]) edits.push({ start: target.attrs[name].start, end: target.attrs[name].end, text: '' });
    // Walk the Tailwind element's attributes in order: replace styling the target has, and
    // insert new styling right after the nearest preceding attribute the target shares.
    let anchor = target.node.name.end;
    let pending = '';
    const flush = () => {
      if (pending) edits.push({ start: anchor, end: anchor, text: pending });
      pending = '';
    };
    for (const attr of el.node.attributes) {
      const name = attrName(attr);
      if (name === 'className' || name === 'style') {
        // Unchanged from the JavaScript original: keep the TypeScript attribute (and its casts) as is.
        const same = js.elements[i]?.attrs[name] && src(jsCode, js.elements[i].attrs[name]) === src(twCode, attr);
        if (same && target.attrs[name]) {
          flush();
          anchor = target.attrs[name].end;
          continue;
        }
        if (target.attrs[name]) {
          flush();
          edits.push({ start: target.attrs[name].start, end: target.attrs[name].end, text: styling(attr) });
          anchor = target.attrs[name].end;
        } else pending += ` ${styling(attr)}`;
        continue;
      }
      const match = target.node.attributes.find(t => (name ? attrName(t) === name : t.type === attr.type && src(tsCode, t) === src(twCode, attr)));
      if (match) {
        flush();
        anchor = match.end;
      }
    }
    flush();
  });

  tw.props.forEach((value, i) => {
    if (ts.props[i]) edits.push({ start: ts.props[i].start, end: ts.props[i].end, text: src(twCode, value) });
  });
  for (const key of ['STYLE_ID', 'CSS', 'STYLES']) {
    if (ts.decls[key]) edits.push({ start: ts.decls[key].start, end: ts.decls[key].end, text: tw.decls[key] ? src(twCode, tw.decls[key]) : '' });
  }
  if (ts.useStyles && !tw.useStyles) {
    edits.push({ start: ts.useStyles.start, end: ts.useStyles.end, text: '' });
    for (const call of ts.useStylesCalls) edits.push({ start: call.start, end: call.end, text: '' });
  }
  if (ts.reactImport && !tw.reactImport?.specifiers.some(s => s.imported?.name === 'useInsertionEffect')) {
    const spec = ts.reactImport.specifiers.find(s => s.imported?.name === 'useInsertionEffect');
    if (spec) {
      const after = tsCode.slice(spec.end).match(/^\s*,\s*/);
      edits.push({ start: spec.start, end: spec.end + (after ? after[0].length : 0), text: '' });
    }
  }
  const twHeader = header(twCode);
  const tsHeader = header(tsCode);
  // A header where the original had none needs its own paragraph.
  edits.push({ start: tsHeader.start, end: tsHeader.end, text: tsHeader.text || !twHeader.text ? twHeader.text : `${twHeader.text}\n\n` });

  let out = tsCode;
  for (const e of edits.sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  // Tidy blank lines left by removals.
  out = out.replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(path.join(root, 'src/bits/tw-ts', `${name}.tsx`), out);
  console.log(`wrote src/bits/tw-ts/${name}.tsx`);
}
