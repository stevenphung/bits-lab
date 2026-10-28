import { useInsertionEffect, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Loading indicators drawn in pixels, all pure CSS and stepped like old hardware. "blocks"
// chases a light round a 3×3 grid, "bar" bounces a bright segment along a row, "dots" hop in
// turn, "hourglass" drains and flips, and "orbit" spins four pixels round a centre. Each is a
// status with a text label for screen readers. Reduced motion swaps the motion for a slow glow.

const STYLE_ID = 'bl-pixel-spinners';
const CSS = `
/* theme tokens */
.bl-spin { --bl-off: #333c57; --bl-muted: #94b0c2; }
:where(.light, [data-theme="light"]) .bl-spin, .bl-spin:where(.light, [data-theme="light"]) { --bl-off: #ddd4c0; --bl-muted: #566c86; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-spin, :where(.light, [data-theme="light"]) .bl-spin:where(.dark, [data-theme="dark"]) { --bl-off: #333c57; --bl-muted: #94b0c2; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-spin, .bl-spin:where([data-theme="system"]) { --bl-off: #ddd4c0; --bl-muted: #566c86; } }
/* theme tokens end */
.bl-spin { display: inline-grid; gap: 8px; justify-items: center; color: var(--bl-on); font-family: var(--bl-font); font-size: 12px; }
.bl-spin__art { position: relative; display: grid; gap: var(--bl-gap); }
.bl-spin__px { width: var(--bl-cell); height: var(--bl-cell); background: var(--bl-off); }
.bl-spin__label { color: var(--bl-muted); }
.bl-spin__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

/* blocks: a 3×3 grid, the ring of eight lights up in turn */
.bl-spin[data-type="blocks"] .bl-spin__art { grid-template-columns: repeat(3, var(--bl-cell)); }
.bl-spin[data-type="blocks"] .bl-spin__px[data-ring] { animation: bl-spin-chase var(--bl-speed) steps(1) infinite; animation-delay: calc(var(--i) * var(--bl-speed) / 8 - var(--bl-speed)); }

/* bar: a row of eight, the bright one bounces */
.bl-spin[data-type="bar"] .bl-spin__art { grid-auto-flow: column; }
.bl-spin__runner { position: absolute; top: 0; left: 0; width: var(--bl-cell); height: var(--bl-cell); background: var(--bl-on); animation: bl-spin-run calc(var(--bl-speed) / 2) steps(7) infinite alternate; }

/* dots: three hop in turn */
.bl-spin[data-type="dots"] .bl-spin__art { grid-auto-flow: column; align-items: end; height: calc(var(--bl-cell) * 3); }
.bl-spin[data-type="dots"] .bl-spin__px { background: var(--bl-on); animation: bl-spin-hop var(--bl-speed) steps(4) infinite; animation-delay: calc(var(--i) * var(--bl-speed) / 6); }

/* hourglass: drains top to bottom, then flips */
.bl-spin[data-type="hourglass"] .bl-spin__art { animation: bl-spin-flip var(--bl-speed) steps(1) infinite; }
.bl-spin[data-type="hourglass"] svg { display: block; width: calc(var(--bl-cell) * 7); height: calc(var(--bl-cell) * 9); shape-rendering: crispEdges; }
.bl-spin__glass { fill: var(--bl-off); }
.bl-spin__sand-top { fill: var(--bl-on); animation: bl-spin-drain var(--bl-speed) steps(4) infinite; transform-origin: 50% 44%; }
.bl-spin__sand-bottom { fill: var(--bl-on); animation: bl-spin-fill var(--bl-speed) steps(4) infinite; transform-origin: 50% 100%; }

/* orbit: four pixels round a centre */
.bl-spin[data-type="orbit"] .bl-spin__art { width: calc(var(--bl-cell) * 5); height: calc(var(--bl-cell) * 5); animation: bl-spin-turn var(--bl-speed) steps(8) infinite; }
.bl-spin[data-type="orbit"] .bl-spin__px { position: absolute; background: var(--bl-on); }
.bl-spin[data-type="orbit"] .bl-spin__px:nth-child(1) { left: calc(var(--bl-cell) * 2); top: 0; }
.bl-spin[data-type="orbit"] .bl-spin__px:nth-child(2) { right: 0; top: calc(var(--bl-cell) * 2); opacity: 0.75; }
.bl-spin[data-type="orbit"] .bl-spin__px:nth-child(3) { left: calc(var(--bl-cell) * 2); bottom: 0; opacity: 0.5; }
.bl-spin[data-type="orbit"] .bl-spin__px:nth-child(4) { left: 0; top: calc(var(--bl-cell) * 2); opacity: 0.25; }

@keyframes bl-spin-chase { 0%, 12% { background: var(--bl-on); } 13%, 100% { background: var(--bl-off); } }
@keyframes bl-spin-run { to { transform: translateX(calc((var(--bl-cell) + var(--bl-gap)) * 7)); } }
@keyframes bl-spin-hop { 0%, 60%, 100% { transform: none; } 30% { transform: translateY(calc(var(--bl-cell) * -2)); } }
@keyframes bl-spin-drain { from { transform: scaleY(1); } to { transform: scaleY(0); } }
@keyframes bl-spin-fill { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes bl-spin-flip { 0%, 92% { transform: none; } 93%, 100% { transform: rotate(180deg); } }
@keyframes bl-spin-turn { to { transform: rotate(360deg); } }
@keyframes bl-spin-glow { 50% { opacity: 0.45; } }
@media (prefers-reduced-motion: reduce) { .bl-spin .bl-spin__art, .bl-spin .bl-spin__px, .bl-spin .bl-spin__sand-top, .bl-spin .bl-spin__sand-bottom { animation: none !important; } .bl-spin .bl-spin__runner { animation: none !important; } .bl-spin .bl-spin__art { animation: bl-spin-glow 2.4s ease-in-out infinite !important; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Order the eight outer cells of a 3×3 grid clockwise from the top-left.
const RING = [0, 1, 2, 5, 8, 7, 6, 3];

function Art({ type }: { type: string }) {
  if (type === 'blocks') {
    return Array.from({ length: 9 }, (_, cell) => {
      const i = RING.indexOf(cell);
      return <span key={cell} className="bl-spin__px" data-ring={i >= 0 || undefined} style={{ '--i': i } as CSSVars} />;
    });
  }
  if (type === 'bar') {
    // A dim row of eight with one bright runner sliding along it and back.
    return (
      <>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="bl-spin__px" />
        ))}
        <span className="bl-spin__runner" />
      </>
    );
  }
  if (type === 'dots') return Array.from({ length: 3 }, (_, i) => <span key={i} className="bl-spin__px" style={{ '--i': i } as CSSVars} />);
  if (type === 'orbit') return Array.from({ length: 4 }, (_, i) => <span key={i} className="bl-spin__px" />);
  return (
    <svg viewBox="0 0 7 9" aria-hidden="true">
      <path className="bl-spin__glass" d="M0 0h7v1h-1v2h-1v1h-1v1h1v1h1v2h1v1H0V8h1V6h1V5h1V4H2V3H1V1H0z" />
      <rect className="bl-spin__sand-top" x="2" y="1" width="3" height="3" />
      <rect className="bl-spin__sand-bottom" x="1" y="6" width="5" height="2" />
    </svg>
  );
}

export interface PixelSpinnersProps {
  type?: 'blocks' | 'bar' | 'dots' | 'hourglass' | 'orbit';
  /** Announced to screen readers (and shown with showLabel). */
  label?: string;
  showLabel?: boolean;
  /** Pixel size. */
  cell?: number;
  gap?: number;
  /** Seconds per cycle. */
  speed?: number;
  /** Lit pixels. */
  color?: string;
  /** Unlit pixels. */
  dimColor?: string;
  mutedColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function PixelSpinners({
  type = 'blocks',
  label = 'Loading',
  showLabel = false,
  cell = 6,
  gap = 2,
  speed = 1.2,
  color = '#73eff7',
  dimColor,
  mutedColor,
  fontFamily = 'inherit',
  className = '',
  style
}: PixelSpinnersProps) {
  useStyles();
  return (
    <span
      className={`bl-spin ${className}`}
      role="status"
      data-type={type}
      style={{ '--bl-cell': `${cell}px`, '--bl-gap': `${gap}px`, '--bl-speed': `${speed}s`, '--bl-on': color, '--bl-off': dimColor, '--bl-muted': mutedColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <span className="bl-spin__art" aria-hidden="true">
        <Art type={type} />
      </span>
      {showLabel ? <span className="bl-spin__label">{label}</span> : <span className="bl-spin__sr">{label}</span>}
    </span>
  );
}
