import { useInsertionEffect } from 'react';

// Empty states as small pixel scenes: an empty chest (no items), a quiet campfire (no messages),
// a closed shop (no results), an unplugged cable (offline) and a lost map (not found). Each has
// a gentle loop (dust, flicker, a swinging sign, a spark, a bobbing "?"), a title, a line of
// help and an optional action. The scene is decorative; the text carries the meaning. Reduced
// motion holds every scene still.

const STYLE_ID = 'bl-empty-scenes';
const CSS = `
/* theme tokens */
.bl-empty { --bl-bg: #1a1c2c; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-empty, .bl-empty:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-empty, :where(.light, [data-theme="light"]) .bl-empty:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-empty, .bl-empty:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-empty { display: grid; justify-items: center; gap: 10px; width: min(var(--bl-w), 100%); padding: 22px 18px; box-sizing: border-box; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); font-size: 14px; text-align: center; box-shadow: inset 0 0 0 3px var(--bl-line); }
.bl-empty__art { display: block; width: var(--bl-art); height: auto; overflow: visible; }
.bl-empty__fx { transform-box: view-box; }
.bl-empty__fx[data-fx="rise"] rect { animation: bl-empty-rise 2400ms steps(6) infinite; animation-delay: calc(var(--i) * 700ms); opacity: 0; }
.bl-empty__fx[data-fx="flicker"] { animation: bl-empty-flick 700ms steps(1) infinite; animation-delay: calc(var(--i) * -350ms); }
.bl-empty__fx[data-fx="swing"] { transform-origin: 16px 8px; animation: bl-empty-swing 1800ms steps(4) infinite alternate; }
.bl-empty__fx[data-fx="spark"] rect { animation: bl-empty-flick 500ms steps(1) infinite; animation-delay: calc(var(--i) * -130ms); }
.bl-empty__fx[data-fx="bob"] { animation: bl-empty-bob 1000ms steps(2) infinite; }
.bl-empty__title { margin: 0; font-size: 16px; font-weight: 800; }
.bl-empty__text { max-width: 34ch; margin: 0; color: var(--bl-muted); line-height: 1.45; }
.bl-empty__btn { margin-top: 4px; padding: 8px 14px; border: 0; background: var(--bl-accent); color: #0b0b14; font: inherit; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: inset -2px -2px 0 rgba(0,0,0,0.25); }
.bl-empty__btn:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
@keyframes bl-empty-rise { 0% { opacity: 0; transform: translateY(0); } 30% { opacity: 1; } 100% { opacity: 0; transform: translateY(-5px); } }
@keyframes bl-empty-flick { 50% { opacity: 0; } }
@keyframes bl-empty-swing { from { transform: rotate(-5deg); } to { transform: rotate(5deg); } }
@keyframes bl-empty-bob { 50% { transform: translateY(-1px); } }
@media (prefers-reduced-motion: reduce) { .bl-empty__fx, .bl-empty__fx rect { animation: none !important; } .bl-empty__fx[data-fx="rise"] rect { opacity: 1; } .bl-empty__fx[data-alt] { opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const INK = {
  o: '#0b0b14',
  w: '#a0703c',
  W: '#6b4423',
  g: '#ffcd75',
  G: '#ef7d57',
  r: '#b13e53',
  p: '#f4f4f4',
  d: '#333c57',
  s: '#566c86',
  m: '#94b0c2',
  n: '#38b764',
  P: '#f4e4c1',
  D: '#d9b98a'
};

// Each scene is drawn on a 32 × 20 grid as [colour, x, y, width, height] rects, plus looping layers.
const SCENES = {
  chest: {
    title: 'Nothing in here yet',
    text: 'Items you collect will show up in this chest.',
    art: [
      ['d', 7, 18, 18, 1],
      ['o', 10, 3, 12, 1], ['o', 9, 4, 1, 4], ['o', 22, 4, 1, 4], ['w', 10, 4, 12, 3], ['W', 11, 5, 10, 1], ['g', 10, 7, 12, 1],
      ['o', 8, 8, 16, 1], ['o', 8, 9, 1, 8], ['o', 23, 9, 1, 8], ['o', 8, 17, 16, 1],
      ['o', 9, 9, 14, 1], ['g', 9, 10, 14, 1], ['w', 9, 11, 14, 6], ['W', 10, 13, 12, 1], ['W', 10, 15, 12, 1],
      ['g', 15, 10, 2, 3], ['o', 15, 11, 2, 1]
    ],
    fx: [{ fx: 'rise', rects: [['m', 12, 7, 1, 1], ['m', 16, 6, 1, 1], ['m', 19, 7, 1, 1]] }]
  },
  campfire: {
    title: 'No messages',
    text: 'It’s quiet around the fire. New messages will land here.',
    art: [
      ['d', 5, 19, 22, 1],
      ['s', 7, 17, 2, 2], ['m', 7, 17, 1, 1], ['s', 23, 17, 2, 2], ['m', 23, 17, 1, 1],
      ['o', 9, 15, 14, 1], ['o', 9, 16, 1, 2], ['o', 22, 16, 1, 2], ['w', 10, 16, 12, 1], ['W', 10, 17, 12, 1], ['o', 9, 18, 14, 1]
    ],
    fx: [
      { fx: 'flicker', i: 0, rects: [['G', 14, 10, 4, 5], ['G', 13, 12, 6, 3], ['G', 15, 8, 1, 2], ['g', 15, 11, 2, 4], ['p', 15, 13, 2, 2]] },
      { fx: 'flicker', i: 1, rects: [['G', 14, 11, 4, 4], ['G', 13, 13, 6, 2], ['G', 16, 9, 1, 2], ['g', 15, 12, 2, 3], ['p', 15, 14, 2, 1]] },
      { fx: 'rise', rects: [['m', 16, 6, 1, 1], ['m', 15, 4, 1, 1], ['m', 17, 2, 1, 1]] }
    ]
  },
  shop: {
    title: 'No results',
    text: 'The shop has nothing for that search. Try other words or clear a filter.',
    art: [
      ['d', 4, 19, 24, 1],
      ['o', 5, 3, 22, 1], ...Array.from({ length: 11 }, (_, i) => [i % 2 ? 'p' : 'r', 5 + i * 2, 4, 2, 2]), ['o', 5, 6, 22, 1],
      ['W', 7, 7, 1, 11], ['W', 24, 7, 1, 11],
      ['s', 8, 7, 16, 7], ['d', 8, 9, 16, 1], ['d', 8, 11, 16, 1], ['d', 8, 13, 16, 1],
      ['o', 6, 14, 20, 1], ['w', 7, 15, 18, 3], ['W', 7, 16, 18, 1], ['o', 6, 18, 20, 1]
    ],
    fx: [{ fx: 'swing', rects: [['m', 13, 7, 1, 3], ['m', 18, 7, 1, 3], ['o', 11, 10, 10, 1], ['o', 11, 14, 10, 1], ['o', 11, 11, 1, 3], ['o', 20, 11, 1, 3], ['p', 12, 11, 8, 3], ['r', 13, 12, 6, 1]] }]
  },
  offline: {
    title: 'You’re offline',
    text: 'The cable came loose. We’ll reconnect as soon as you’re back.',
    art: [
      ['d', 0, 10, 3, 2], ['o', 3, 9, 1, 4], ['o', 4, 8, 6, 1], ['o', 4, 13, 6, 1], ['s', 4, 9, 6, 4], ['m', 5, 9, 4, 1], ['m', 10, 10, 2, 1], ['m', 10, 12, 2, 1],
      ['o', 20, 7, 6, 1], ['o', 20, 14, 6, 1], ['o', 19, 8, 1, 6], ['o', 26, 8, 1, 6], ['s', 20, 8, 6, 6], ['m', 21, 8, 4, 1], ['o', 20, 10, 2, 1], ['o', 20, 12, 2, 1], ['d', 27, 10, 5, 2]
    ],
    fx: [{ fx: 'spark', rects: [['g', 15, 9, 1, 1], ['G', 14, 12, 1, 1], ['g', 16, 11, 1, 1], ['p', 17, 10, 1, 1]] }]
  },
  lost: {
    title: 'Page not found',
    text: 'This trail leads nowhere. Head back to the map.',
    art: [
      ['o', 5, 3, 22, 1], ['o', 5, 16, 22, 1], ['o', 4, 4, 1, 12], ['o', 27, 4, 1, 12], ['P', 5, 4, 22, 12], ['D', 12, 4, 1, 12], ['D', 19, 4, 1, 12],
      ['n', 7, 6, 2, 2], ['n', 23, 12, 2, 2], ['n', 9, 5, 1, 1],
      ['r', 7, 14, 1, 1], ['r', 9, 13, 1, 1], ['r', 11, 12, 1, 1], ['r', 13, 11, 1, 1], ['r', 15, 10, 1, 1], ['r', 17, 10, 1, 1]
    ],
    fx: [{ fx: 'bob', rects: [['o', 20, 5, 3, 1], ['o', 22, 6, 1, 1], ['o', 21, 7, 1, 1], ['o', 21, 9, 1, 1]] }]
  }
};

const rect = ([key, x, y, width, height], i) => <rect key={i} x={x} y={y} width={width} height={height} fill={INK[key]} style={{ '--i': i }} />;

export default function EmptyScenes({
  scene = 'chest',
  title,
  message,
  action,
  actionLabel,
  onAction,
  width = 360,
  artWidth = 160,
  backgroundColor,
  lineColor,
  textColor,
  mutedColor,
  accentColor,
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const data = SCENES[scene] ?? SCENES.chest;
  const heading = title ?? data.title;

  return (
    <section
      className={`bl-empty ${className}`}
      aria-label={heading}
      data-scene={scene}
      style={{ '--bl-w': `${width}px`, '--bl-art': `${artWidth}px`, '--bl-bg': backgroundColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      <svg className="bl-empty__art" viewBox="0 0 32 20" shapeRendering="crispEdges" aria-hidden="true">
        {data.art.map(rect)}
        {data.fx.map((layer, i) => (
          <g key={i} className="bl-empty__fx" data-fx={layer.fx} data-alt={layer.i ? '' : undefined} style={{ '--i': layer.i ?? 0 }}>
            {layer.rects.map(rect)}
          </g>
        ))}
      </svg>
      <p className="bl-empty__title">{heading}</p>
      <p className="bl-empty__text">{message ?? data.text}</p>
      {action ??
        (actionLabel && (
          <button type="button" className="bl-empty__btn" onClick={onAction}>
            {actionLabel}
          </button>
        ))}
    </section>
  );
}
