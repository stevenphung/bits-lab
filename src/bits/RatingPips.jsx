import { useInsertionEffect, useRef, useState } from 'react';

// A row of pixel heart containers (or stars, or gems), for ratings or health. Hover to preview,
// click to set, click the same pip again to clear; half pips if you want them. Pips that fill
// pop like a pickup. Keyboard users get a slider: arrows step, Home and End jump. Read-only, it
// becomes a picture of the value with a plain-language label. Reduced motion skips the pop.

const STYLE_ID = 'bl-rating-pips';
const CSS = `
/* theme tokens */
.bl-pips { --bl-full: #b13e53; --bl-empty: #333c57; --bl-preview: #ef7d57; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-pips, .bl-pips:where(.light, [data-theme="light"]) { --bl-empty: #ddd4c0; --bl-preview: #c4502a; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-pips, :where(.light, [data-theme="light"]) .bl-pips:where(.dark, [data-theme="dark"]) { --bl-full: #b13e53; --bl-empty: #333c57; --bl-preview: #ef7d57; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-pips, .bl-pips:where([data-theme="system"]) { --bl-empty: #ddd4c0; --bl-preview: #c4502a; --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-pips { display: inline-flex; gap: var(--bl-gap); padding: 4px; border-radius: 8px; outline: none; touch-action: manipulation; }
.bl-pips[data-interactive] { cursor: pointer; }
.bl-pips:focus-visible { box-shadow: 0 0 0 2px var(--bl-accent); }
.bl-pips__pip { position: relative; width: var(--bl-size); height: var(--bl-size); }
.bl-pips__pip svg { position: absolute; inset: 0; width: 100%; height: 100%; shape-rendering: crispEdges; }
.bl-pips__empty, .bl-pips__full { position: absolute; inset: 0; }
.bl-pips__empty { color: var(--bl-empty); }
.bl-pips__full { color: var(--bl-full); clip-path: inset(0 calc(100% - var(--fill) * 100%) 0 0); }
.bl-pips__pip[data-pop] .bl-pips__full { animation: bl-pips-pop 320ms steps(4); }
.bl-pips[data-preview] .bl-pips__full { color: var(--bl-preview); }
@keyframes bl-pips-pop { 40% { transform: scale(1.35) translateY(-12%); } }
@media (prefers-reduced-motion: reduce) { .bl-pips__pip[data-pop] .bl-pips__full { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// 8×8 pixel icons, with a darker outline row so they read on any background.
const ICONS = {
  heart: ['.XX..XX.', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '...XX...', '........'],
  star: ['...XX...', '...XX...', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '.XXXXXX.', '.XX..XX.', 'X......X'],
  gem: ['..XXXX..', '.XXXXXX.', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '...XX...', '........']
};

function Icon({ shape }) {
  const rows = ICONS[shape] ?? ICONS.heart;
  return (
    <svg viewBox="0 0 8 8" aria-hidden="true">
      {rows.map((row, y) => [...row].map((ch, x) => (ch === 'X' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" /> : null)))}
      {/* A highlight pixel, so filled pips look like little gems of colour. */}
      <rect x="1" y="1" width="1" height="1" fill="rgba(255,255,255,0.55)" />
    </svg>
  );
}

export default function RatingPips({
  value: controlled,
  defaultValue = 0,
  onChange,
  max = 5,
  allowHalf = true,
  clearable = true,
  readOnly = false,
  icon = 'heart',
  label = 'Rating',
  size = 28,
  gap = 4,
  fullColor,
  emptyColor,
  previewColor,
  accentColor,
  className = '',
  style
}) {
  useStyles();
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const [preview, setPreview] = useState(null);
  const [popFrom, setPopFrom] = useState(-1);
  const [round, setRound] = useState(0);
  const rootRef = useRef(null);
  const step = allowHalf ? 0.5 : 1;
  const shown = preview ?? value;

  const set = next => {
    const v = Math.max(0, Math.min(max, next));
    if (v === value) return;
    if (v > value) {
      setPopFrom(Math.floor(value));
      setRound(r => r + 1);
    }
    if (controlled === undefined) setInner(v);
    onChange?.(v);
  };

  // Which value the pointer is over: whole pips, or halves when allowed.
  const at = event => {
    const pips = [...rootRef.current.querySelectorAll('.bl-pips__pip')];
    for (let i = 0; i < pips.length; i++) {
      const r = pips[i].getBoundingClientRect();
      if (event.clientX <= r.right + gap / 2) return allowHalf && event.clientX < r.left + r.width / 2 ? i + 0.5 : i + 1;
    }
    return max;
  };

  const say = v => `${v} of ${max}`;
  if (readOnly) {
    return (
      <span className={`bl-pips ${className}`} role="img" aria-label={`${label}: ${say(value)}`} style={{ '--bl-size': `${size}px`, '--bl-gap': `${gap}px`, '--bl-full': fullColor, '--bl-empty': emptyColor, '--bl-preview': previewColor, '--bl-accent': accentColor, ...style }}>
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className="bl-pips__pip" style={{ '--fill': Math.max(0, Math.min(1, value - i)) }}>
            <span className="bl-pips__empty">
              <Icon shape={icon} />
            </span>
            <span className="bl-pips__full">
              <Icon shape={icon} />
            </span>
          </span>
        ))}
      </span>
    );
  }

  return (
    <span
      ref={rootRef}
      className={`bl-pips ${className}`}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={say(value)}
      data-interactive=""
      data-preview={preview !== null || undefined}
      onPointerMove={event => event.pointerType === 'mouse' && setPreview(at(event))}
      onPointerLeave={() => setPreview(null)}
      onClick={event => {
        const v = at(event);
        set(clearable && v === value ? 0 : v);
        setPreview(null);
      }}
      onKeyDown={event => {
        const moves = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, Home: -max, End: max };
        if (moves[event.key] === undefined) return;
        event.preventDefault();
        set(value + moves[event.key]);
      }}
      style={{ '--bl-size': `${size}px`, '--bl-gap': `${gap}px`, '--bl-full': fullColor, '--bl-empty': emptyColor, '--bl-preview': previewColor, '--bl-accent': accentColor, ...style }}
    >
      {Array.from({ length: max }, (_, i) => (
        <span key={`${i}-${i >= popFrom && i < value ? round : 0}`} className="bl-pips__pip" data-pop={(i >= popFrom && i < value && round > 0) || undefined} style={{ '--fill': Math.max(0, Math.min(1, shown - i)) }}>
          <span className="bl-pips__empty">
            <Icon shape={icon} />
          </span>
          <span className="bl-pips__full">
            <Icon shape={icon} />
          </span>
        </span>
      ))}
    </span>
  );
}
