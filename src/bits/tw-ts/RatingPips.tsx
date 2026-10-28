import { useInsertionEffect, useRef, useState, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A row of pixel heart containers (or stars, or gems), for ratings or health. Hover to preview,
// click to set, click the same pip again to clear; half pips if you want them. Pips that fill
// pop like a pickup. Keyboard users get a slider: arrows step, Home and End jump. Read-only, it
// becomes a picture of the value with a plain-language label. Reduced motion skips the pop.

const STYLE_ID = 'bl-rating-pips-tw';
const CSS = `
/* theme tokens */
.bl-pips { --bl-full: #b13e53; --bl-empty: #333c57; --bl-preview: #ef7d57; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-pips, .bl-pips:where(.light, [data-theme="light"]) { --bl-empty: #ddd4c0; --bl-preview: #c4502a; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-pips, :where(.light, [data-theme="light"]) .bl-pips:where(.dark, [data-theme="dark"]) { --bl-full: #b13e53; --bl-empty: #333c57; --bl-preview: #ef7d57; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-pips, .bl-pips:where([data-theme="system"]) { --bl-empty: #ddd4c0; --bl-preview: #c4502a; --bl-accent: #167f8f; } }
/* theme tokens end */
@keyframes bl-pips-pop { 40% { transform: scale(1.35) translateY(-12%); } }
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
const ICONS: Record<string, string[]> = {
  heart: ['.XX..XX.', 'XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '...XX...', '........'],
  star: ['...XX...', '...XX...', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '.XXXXXX.', '.XX..XX.', 'X......X'],
  gem: ['..XXXX..', '.XXXXXX.', 'XXXXXXXX', 'XXXXXXXX', '.XXXXXX.', '..XXXX..', '...XX...', '........']
};

function Icon({ shape }: { shape: string }) {
  const rows = ICONS[shape] ?? ICONS.heart;
  return (
    <svg viewBox="0 0 8 8" aria-hidden="true">
      {rows.map((row, y) => [...row].map((ch, x) => (ch === 'X' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" /> : null)))}
      {/* A highlight pixel, so filled pips look like little gems of colour. */}
      <rect x="1" y="1" width="1" height="1" fill="rgba(255,255,255,0.55)" />
    </svg>
  );
}

export interface RatingPipsProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** How many pips. */
  max?: number;
  allowHalf?: boolean;
  /** Clicking the current value clears it. */
  clearable?: boolean;
  /** A picture of the value instead of an input. */
  readOnly?: boolean;
  icon?: 'heart' | 'star' | 'gem';
  /** Accessible name. */
  label?: string;
  size?: number;
  gap?: number;
  fullColor?: string;
  emptyColor?: string;
  previewColor?: string;
  accentColor?: string;
  className?: string;
  style?: CSSProperties;
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
}: RatingPipsProps) {
  useStyles();
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const [preview, setPreview] = useState<number | null>(null);
  const [popFrom, setPopFrom] = useState(-1);
  const [round, setRound] = useState(0);
  const rootRef = useRef<HTMLSpanElement>(null);
  const step = allowHalf ? 0.5 : 1;
  const shown = preview ?? value;

  const set = (next: number) => {
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
  const at = (event: { clientX: number }) => {
    const pips = [...rootRef.current!.querySelectorAll('.bl-pips__pip')];
    for (let i = 0; i < pips.length; i++) {
      const r = pips[i].getBoundingClientRect();
      if (event.clientX <= r.right + gap / 2) return allowHalf && event.clientX < r.left + r.width / 2 ? i + 0.5 : i + 1;
    }
    return max;
  };

  const say = (v: number) => `${v} of ${max}`;
  if (readOnly) {
    return (
      <span className={`bl-pips group/pips inline-flex touch-manipulation gap-(--bl-gap) rounded-[8px] p-1 outline-none focus-visible:shadow-[0_0_0_2px_var(--bl-accent)] data-[interactive]:cursor-pointer ${className}`} role="img" aria-label={`${label}: ${say(value)}`} style={{ '--bl-size': `${size}px`, '--bl-gap': `${gap}px`, '--bl-full': fullColor, '--bl-empty': emptyColor, '--bl-preview': previewColor, '--bl-accent': accentColor, ...style } as CSSVars}>
        {Array.from({ length: max }, (_, i) => (
          <span key={i} className="bl-pips__pip group/pip relative size-(--bl-size) [&_svg]:absolute [&_svg]:inset-0 [&_svg]:h-full [&_svg]:w-full [&_svg]:[shape-rendering:crispEdges]" style={{ '--fill': Math.max(0, Math.min(1, value - i)) } as CSSVars}>
            <span className="absolute inset-0 text-(--bl-empty)">
              <Icon shape={icon} />
            </span>
            <span className="absolute inset-0 text-(--bl-full) [clip-path:inset(0_calc(100%_-_var(--fill)_*_100%)_0_0)] group-data-[preview]/pips:text-(--bl-preview) group-data-[pop]/pip:animate-[bl-pips-pop_320ms_steps(4)] motion-reduce:group-data-[pop]/pip:animate-none">
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
      className={`bl-pips group/pips inline-flex touch-manipulation gap-(--bl-gap) rounded-[8px] p-1 outline-none focus-visible:shadow-[0_0_0_2px_var(--bl-accent)] data-[interactive]:cursor-pointer ${className}`}
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
        const moves: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, Home: -max, End: max };
        if (moves[event.key] === undefined) return;
        event.preventDefault();
        set(value + moves[event.key]);
      }}
      style={{ '--bl-size': `${size}px`, '--bl-gap': `${gap}px`, '--bl-full': fullColor, '--bl-empty': emptyColor, '--bl-preview': previewColor, '--bl-accent': accentColor, ...style } as CSSVars}
    >
      {Array.from({ length: max }, (_, i) => (
        <span key={`${i}-${i >= popFrom && i < value ? round : 0}`} className="bl-pips__pip group/pip relative size-(--bl-size) [&_svg]:absolute [&_svg]:inset-0 [&_svg]:h-full [&_svg]:w-full [&_svg]:[shape-rendering:crispEdges]" data-pop={(i >= popFrom && i < value && round > 0) || undefined} style={{ '--fill': Math.max(0, Math.min(1, shown - i)) } as CSSVars}>
          <span className="absolute inset-0 text-(--bl-empty)">
            <Icon shape={icon} />
          </span>
          <span className="absolute inset-0 text-(--bl-full) [clip-path:inset(0_calc(100%_-_var(--fill)_*_100%)_0_0)] group-data-[preview]/pips:text-(--bl-preview) group-data-[pop]/pip:animate-[bl-pips-pop_320ms_steps(4)] motion-reduce:group-data-[pop]/pip:animate-none">
            <Icon shape={icon} />
          </span>
        </span>
      ))}
    </span>
  );
}
