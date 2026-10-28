import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { FIXTURES, DEFAULT_FIXTURE } from './fixtures';
import './tw.css';

// Tailwind parity check. For every Tailwind variant (src/bits/tw) and each of its fixtures,
// the CSS original and the Tailwind version render in two same-sized iframes (so neither's
// styles can leak into the other), then every element's computed style is compared, ::before
// and ::after included. Animations and transitions are compared as declared values, then
// switched off so the rest compares at rest. Static states only: :hover and :focus aren't
// exercised; use props and data attributes in fixtures to reach other states.
//
// Open /tw-check.html (add ?only=Name to check one). Results are also on window.__twReport.

const ORIGINALS = import.meta.glob('../../bits/*.jsx');
const VARIANTS = import.meta.glob('../../bits/tw/*.jsx');
const nameOf = key => key.split('/').pop().replace('.jsx', '');
const NAMES = Object.keys(VARIANTS).map(nameOf).sort();
const params = new URLSearchParams(location.search);

// ---------- Frame: render one side ----------

function Frame() {
  const [mod, setMod] = useState(null);
  const Component = mod?.default;
  const name = params.get('name');
  const fixture = (FIXTURES[name] ?? [DEFAULT_FIXTURE])[Number(params.get('fixture'))];

  useEffect(() => {
    const load = params.get('frame') === 'tw' ? VARIANTS[`../../bits/tw/${name}.jsx`] : ORIGINALS[`../../bits/${name}.jsx`];
    load().then(setMod);
  }, [name]);

  useEffect(() => {
    if (!Component) return;
    // Let effects, fonts and a few frames settle before the parent reads styles.
    document.fonts.ready.then(() => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(() => (window.__ready = true), fixture.settle ?? 400))));
  }, [Component, fixture]);

  if (!Component) return null;
  return (
    <div id="stage" style={{ position: 'relative', width: fixture.width ?? 560, height: fixture.height ?? 360, overflow: 'hidden' }}>
      {fixture.render ? fixture.render(Component, mod) : <Component {...fixture.props} />}
    </div>
  );
}

// ---------- Parent: compare ----------

const ANIMATED = /^(animation|transition)/;
const TRANSFORMS = new Set(['transform', 'translate', 'rotate', 'scale']);

// translate, rotate and scale apply before transform; Tailwind uses the first three, plain
// CSS usually uses transform. Compare the combined matrix. Percentages in translate resolve
// against the element's own box (Tailwind's -translate-1/2 is translate: -50% -50%).
function matrix(cs, box) {
  const m = new DOMMatrix();
  if (cs.translate !== 'none') {
    const [x = '0', y = '0', z = '0'] = cs.translate.split(' ');
    const length = (v, size) => (v.endsWith('%') ? (parseFloat(v) / 100) * size : parseFloat(v));
    m.translateSelf(length(x, box.w), length(y, box.h), parseFloat(z));
  }
  if (cs.rotate !== 'none') {
    const parts = cs.rotate.split(' ');
    const angle = parseFloat(parts[parts.length - 1]) * (parts[parts.length - 1].endsWith('rad') ? 180 / Math.PI : parts[parts.length - 1].endsWith('turn') ? 360 : 1);
    if (parts.length === 1) m.rotateSelf(angle);
    else if (parts[0] === 'x') m.rotateAxisAngleSelf(1, 0, 0, angle);
    else if (parts[0] === 'y') m.rotateAxisAngleSelf(0, 1, 0, angle);
    else if (parts[0] === 'z') m.rotateSelf(angle);
    else m.rotateAxisAngleSelf(parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2]), angle);
  }
  if (cs.scale !== 'none') {
    const [x, y = x, z = '1'] = cs.scale.split(' ');
    m.scaleSelf(parseFloat(x), parseFloat(y), parseFloat(z));
  }
  if (cs.transform !== 'none') m.multiplySelf(new DOMMatrix(cs.transform));
  return Array.from(m.toFloat64Array(), v => (Math.abs(v) < 1e-6 ? 0 : Math.round(v * 1000) / 1000)).join(',');
}

// Tailwind composes shadows from several layers; empty ones are transparent zero shadows.
const shadows = value =>
  value === 'none'
    ? 'none'
    : value
        .split(/,(?![^(]*\))/)
        .map(s => s.trim())
        .filter(s => !/^rgba\(0, 0, 0, 0\)( 0px){2,4}( inset)?$/.test(s))
        .join(', ') || 'none';

const round = value => value.replace(/-?\d*\.\d+/g, n => String(Math.round(parseFloat(n) * 100) / 100));

function snapshot(doc, el, pseudo, animated) {
  const cs = doc.defaultView.getComputedStyle(el, pseudo);
  const out = {};
  for (let i = 0; i < cs.length; i++) {
    const prop = cs[i];
    if (prop.startsWith('--') || ANIMATED.test(prop) !== animated || TRANSFORMS.has(prop)) continue;
    let value = cs.getPropertyValue(prop);
    if (prop === 'box-shadow') value = shadows(value);
    // Generated images (data: URLs) can differ per mount, e.g. random particle tiles.
    if (value.includes('url("data:')) value = value.replace(/url\("data:[^"]*"\)/g, 'url(data)');
    // Tailwind's transition-transform also lists translate, rotate and scale (its transform utilities use them).
    if (prop === 'transition-property') value = [...new Set(value.split(', ').map(p => (['translate', 'rotate', 'scale'].includes(p) ? 'transform' : p)))].join(', ');
    out[prop] = round(value);
  }
  if (!animated) out['transform (combined)'] = matrix(cs, !pseudo && el.offsetWidth !== undefined ? { w: el.offsetWidth, h: el.offsetHeight } : { w: parseFloat(cs.width) || 0, h: parseFloat(cs.height) || 0 });
  // Lists repeat to cover every property, so "0.15s, 0.15s" equals "0.15s".
  for (const prop of Object.keys(out)) {
    if (!ANIMATED.test(prop)) continue;
    const items = out[prop].split(/,(?![^(]*\))/).map(v => v.trim());
    if (items.every(v => v === items[0])) out[prop] = items[0];
  }
  // A border or outline that has no width draws nothing, whatever its style and colour
  // (Preflight's border: 0 solid vs a plain border: 0).
  for (const prop of Object.keys(out)) {
    const m = prop.match(/^(border-.+|outline)-width$/);
    if (m && out[prop] === '0px') out[`${m[1]}-style`] = out[`${m[1]}-color`] = '-';
  }
  if (out['outline-style'] === 'none') out['outline-style'] = out['outline-color'] = out['outline-width'] = '-';
  // Any radius this big is a pill (rounded-full is calc(infinity * 1px)).
  for (const prop of Object.keys(out)) if (/radius$/.test(prop) && parseFloat(out[prop]) >= 999) out[prop] = 'pill';
  return out;
}

function elements(doc) {
  return [...doc.body.querySelectorAll('*')].filter(el => !['SCRIPT', 'STYLE', 'LINK'].includes(el.tagName) && el.id !== 'root');
}

const label = el => `${el.tagName.toLowerCase()}${el.id && el.id !== 'stage' ? `#${el.id}` : ''}${el.getAttribute('aria-label') ? `[${el.getAttribute('aria-label')}]` : ''}`;

function read(doc) {
  const els = elements(doc);
  const pass = animated =>
    els.map(el => ({
      el: snapshot(doc, el, null, animated),
      before: snapshot(doc, el, '::before', animated),
      after: snapshot(doc, el, '::after', animated)
    }));
  const animation = pass(true);
  const freeze = doc.createElement('style');
  freeze.textContent = '*, *::before, *::after { animation: none !important; transition: none !important; }';
  doc.head.appendChild(freeze);
  const rest = pass(false);
  freeze.remove();
  return { tags: els.map(el => el.tagName), labels: els.map(label), styles: rest.map((r, i) => ({ el: { ...animation[i].el, ...r.el }, before: { ...animation[i].before, ...r.before }, after: { ...animation[i].after, ...r.after } })) };
}

// Equal, or the same apart from numbers within a quarter pixel (sizes measured from text that
// is mid-animation can differ by a sub-pixel between the two frames).
const NUMBER = /-?\d*\.?\d+(e[+-]?\d+)?/g;
function close(a, b) {
  if (a === b) return true;
  if (a === undefined || b === undefined || a.replace(NUMBER, '#') !== b.replace(NUMBER, '#')) return false;
  const x = a.match(NUMBER) ?? [];
  const y = b.match(NUMBER) ?? [];
  return x.every((n, i) => Math.abs(parseFloat(n) - parseFloat(y[i])) <= 0.25);
}

// The sr-only pattern: absolutely positioned, overflow hidden, and clipped to nothing (by clip or
// clip-path) or shrunk to 1px. Tables can't shrink to 1px, so the clip counts on its own.
const hidden = st =>
  st.position === 'absolute' &&
  st['overflow-x'] === 'hidden' &&
  ((st.width === '1px' && st.height === '1px') || st.clip === 'rect(0px, 0px, 0px, 0px)' || st['clip-path'] === 'inset(50%)');

function diff(a, b) {
  if (a.tags.join() !== b.tags.join()) return [{ where: 'structure', prop: 'elements', css: a.tags.join(' '), tw: b.tags.join(' ') }];
  const out = [];
  a.styles.forEach((style, i) => {
    // Visually hidden on both sides (sr-only and friends): the details don't matter.
    if (hidden(style.el) && hidden(b.styles[i].el)) return;
    for (const part of ['el', 'before', 'after']) {
      const x = style[part];
      const y = b.styles[i][part];
      // Pseudo-elements that exist on neither side don't count.
      if (part !== 'el' && x.content === 'none' && y.content === 'none') continue;
      for (const prop of new Set([...Object.keys(x), ...Object.keys(y)])) {
        if (!close(x[prop], y[prop])) out.push({ where: `${i}:${a.labels[i]}${part === 'el' ? '' : `::${part}`}`, prop, css: x[prop], tw: y[prop] });
      }
    }
  });
  return out;
}

const frame = (side, name, index, fixture) =>
  new Promise(resolve => {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = `width:${(fixture.width ?? 560) + 20}px;height:${(fixture.height ?? 360) + 20}px;border:0;`;
    iframe.src = `/tw-check.html?frame=${side}&name=${name}&fixture=${index}`;
    document.getElementById('frames').appendChild(iframe);
    const started = Date.now();
    const poll = () => {
      if (iframe.contentWindow?.__ready) resolve(iframe);
      else if (Date.now() - started > 15000) resolve(iframe);
      else setTimeout(poll, 50);
    };
    poll();
  });

function Parent() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(true);
  // ?only=A,B checks just those.
  const onlyParam = params.get('only');

  useEffect(() => {
    let live = true;
    (async () => {
      const all = [];
      for (const name of NAMES.filter(n => !onlyParam || onlyParam.split(',').includes(n))) {
        const fixtures = FIXTURES[name] ?? [DEFAULT_FIXTURE];
        for (let i = 0; i < fixtures.length; i++) {
          const [css, tw] = await Promise.all([frame('css', name, i, fixtures[i]), frame('tw', name, i, fixtures[i])]);
          const diffs = css.contentWindow.__ready && tw.contentWindow.__ready ? diff(read(css.contentDocument), read(tw.contentDocument)) : [{ where: 'load', prop: 'timeout', css: String(!!css.contentWindow.__ready), tw: String(!!tw.contentWindow.__ready) }];
          all.push({ name, fixture: fixtures[i].label ?? `#${i}`, diffs });
          if (!params.has('keep')) css.remove(), tw.remove();
          if (live) setResults([...all]);
        }
      }
      window.__twReport = all.map(r => ({ name: r.name, fixture: r.fixture, diffs: r.diffs.length, all: r.diffs }));
      if (live) setRunning(false);
    })();
    return () => {
      live = false;
    };
  }, [onlyParam]);

  const failing = results.filter(r => r.diffs.length);
  return (
    <main style={{ padding: 24, display: 'grid', gap: 16 }}>
      <h1 style={{ margin: 0, fontSize: 22 }}>Tailwind parity</h1>
      <p style={{ margin: 0, color: '#94b0c2' }} role="status">
        {running ? `Checking… ${results.length} done` : `${results.length - failing.length}/${results.length} fixtures match`} · {NAMES.length} Tailwind variants
      </p>
      <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
        <tbody>
          {results.map(r => (
            <tr key={`${r.name}-${r.fixture}`} style={{ borderTop: '1px solid #333c57', verticalAlign: 'top' }}>
              <td style={{ padding: '6px 12px 6px 0', whiteSpace: 'nowrap' }}>{r.name}</td>
              <td style={{ padding: '6px 12px 6px 0', color: '#94b0c2' }}>{r.fixture}</td>
              <td style={{ padding: '6px 0', color: r.diffs.length ? '#ef7d57' : '#38b764' }}>
                {r.diffs.length ? `${r.diffs.length} differences` : 'match'}
                {r.diffs.slice(0, 12).map((d, i) => (
                  <div key={i} style={{ color: '#f4f4f4', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
                    {d.where} {d.prop}: <span style={{ color: '#73eff7' }}>{d.css}</span> → <span style={{ color: '#ffcd75' }}>{d.tw}</span>
                  </div>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div id="frames" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }} />
    </main>
  );
}

// Reuse the root when hot reload re-runs this module.
window.__twCheckRoot ??= createRoot(document.getElementById('root'));
window.__twCheckRoot.render(params.has('frame') ? <Frame /> : <Parent />);
