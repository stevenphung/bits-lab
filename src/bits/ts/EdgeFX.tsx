import { useEffect, useInsertionEffect, useRef, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A frame with a live edge. Wrap any card and pick an edge: "ants" marches a pixel dashed
// border around it like a selection box; "energy" runs a stepped band of colour round and
// round the frame; "glow" lights the stretch of border nearest the pointer; "glare" sweeps a
// flash of light across the surface. Show it always or only on hover and focus. The content
// is untouched; reduced motion freezes the edge.

const STYLE_ID = 'bl-edge-fx';
const CSS = `
/* theme tokens */
.bl-edge { --bl-a: #73eff7; --bl-bg: #1a1c2c; --bl-glare: rgba(244,244,244,0.22); }
:where(.light, [data-theme="light"]) .bl-edge, .bl-edge:where(.light, [data-theme="light"]) { --bl-a: #167f8f; --bl-bg: #f4f1e8; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-edge, :where(.light, [data-theme="light"]) .bl-edge:where(.dark, [data-theme="dark"]) { --bl-a: #73eff7; --bl-bg: #1a1c2c; --bl-glare: rgba(244,244,244,0.22); }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-edge, .bl-edge:where([data-theme="system"]) { --bl-a: #167f8f; --bl-bg: #f4f1e8; } }
/* theme tokens end */
@property --bl-edge-turn { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
.bl-edge { --bl-on: 1; position: relative; display: block; box-sizing: border-box; padding: var(--bl-w); border-radius: var(--bl-radius); background: var(--bl-line); isolation: isolate; }
.bl-edge__body { position: relative; z-index: 1; height: 100%; overflow: hidden; border-radius: calc(var(--bl-radius) - var(--bl-w)); background: var(--bl-bg); }
.bl-edge__ring { position: absolute; inset: 0; z-index: 0; border-radius: inherit; opacity: var(--bl-on); transition: opacity 200ms steps(3); pointer-events: none; }
.bl-edge[data-active="hover"] { --bl-on: 0; }
.bl-edge[data-active="hover"]:hover, .bl-edge[data-active="hover"]:focus-within { --bl-on: 1; }
.bl-edge[data-mode="ants"] .bl-edge__ring { background:
  linear-gradient(90deg, var(--bl-a) 50%, var(--bl-b) 0) 0 0 / var(--bl-dash) var(--bl-w) repeat-x,
  linear-gradient(90deg, var(--bl-a) 50%, var(--bl-b) 0) 0 100% / var(--bl-dash) var(--bl-w) repeat-x,
  linear-gradient(0deg, var(--bl-a) 50%, var(--bl-b) 0) 0 0 / var(--bl-w) var(--bl-dash) repeat-y,
  linear-gradient(0deg, var(--bl-a) 50%, var(--bl-b) 0) 100% 0 / var(--bl-w) var(--bl-dash) repeat-y;
  animation: bl-edge-march var(--bl-speed) steps(4) infinite; }
.bl-edge[data-mode="energy"] .bl-edge__ring { background: conic-gradient(from var(--bl-edge-turn), transparent 0 55%, var(--bl-b) 70%, var(--bl-a) 80%, transparent 92%); animation: bl-edge-spin var(--bl-speed) steps(36) infinite; }
.bl-edge[data-mode="glow"] .bl-edge__ring { background: radial-gradient(circle var(--bl-reach) at var(--bl-x, 50%) var(--bl-y, -40%), var(--bl-a), var(--bl-b) 45%, transparent 75%); }
.bl-edge[data-mode="glow"][data-active="hover"] { --bl-on: 0; }
.bl-edge[data-mode="glow"][data-lit] { --bl-on: 1; }
.bl-edge__glare { position: absolute; inset: 0; z-index: 2; border-radius: inherit; overflow: hidden; pointer-events: none; }
.bl-edge__glare::before { content: ""; position: absolute; top: -50%; bottom: -50%; left: 0; width: 40%; background: linear-gradient(100deg, transparent, var(--bl-glare), transparent); transform: translateX(-150%) skewX(-12deg); }
.bl-edge[data-mode="glare"]:hover .bl-edge__glare::before, .bl-edge[data-mode="glare"]:focus-within .bl-edge__glare::before, .bl-edge[data-mode="glare"][data-active="always"] .bl-edge__glare::before { animation: bl-edge-glare var(--bl-speed) steps(12) infinite; }
@keyframes bl-edge-march { to { background-position: var(--bl-dash) 0, calc(var(--bl-dash) * -1) 100%, 0 calc(var(--bl-dash) * -1), 100% var(--bl-dash); } }
@keyframes bl-edge-spin { to { --bl-edge-turn: 360deg; } }
@keyframes bl-edge-glare { 0% { transform: translateX(-150%) skewX(-12deg); } 60%, 100% { transform: translateX(350%) skewX(-12deg); } }
@media (prefers-reduced-motion: reduce) { .bl-edge .bl-edge__ring, .bl-edge .bl-edge__glare::before { animation: none !important; transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface EdgeFXProps {
  /** The card inside the frame. */
  children?: ReactNode;
  /** Marching pixel dashes, a band circling the frame, a pointer-following light, or a flash across the surface. */
  mode?: 'ants' | 'energy' | 'glow' | 'glare';
  /** Hover also lights it while focus is inside. */
  active?: 'always' | 'hover';
  /** Edge thickness in px. */
  width?: number;
  radius?: number;
  /** Dash length for ants, in px. */
  dash?: number;
  /** Cycle speed multiplier. */
  speed?: number;
  /** How far from the card the glow notices the pointer, in px. */
  reach?: number;
  color?: string;
  secondColor?: string;
  /** The resting edge. */
  lineColor?: string;
  backgroundColor?: string;
  glareColor?: string;
  className?: string;
  style?: CSSProperties;
}

export default function EdgeFX({
  children,
  mode = 'ants',
  active = 'always',
  width = 3,
  radius = 14,
  dash = 12,
  speed = 0.8,
  reach = 160,
  color,
  secondColor = '#41a6f6',
  lineColor = '#333c57',
  backgroundColor,
  glareColor,
  className = '',
  style
}: EdgeFXProps) {
  useStyles();
  const rootRef = useRef<HTMLDivElement>(null);

  // Glow follows the pointer anywhere near the card, not just on it.
  useEffect(() => {
    if (mode !== 'glow') return undefined;
    const root = rootRef.current!;
    let raf = 0;
    const onMove = (event: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = root.getBoundingClientRect();
        const x = event.clientX - r.left;
        const y = event.clientY - r.top;
        const near = x > -reach && y > -reach && x < r.width + reach && y < r.height + reach;
        root.style.setProperty('--bl-x', `${x.toFixed(0)}px`);
        root.style.setProperty('--bl-y', `${y.toFixed(0)}px`);
        root.toggleAttribute('data-lit', near);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, [mode, reach]);

  return (
    <div
      ref={rootRef}
      className={`bl-edge ${className}`}
      data-mode={mode}
      data-active={active}
      style={{ '--bl-w': `${width}px`, '--bl-radius': `${radius}px`, '--bl-dash': `${dash}px`, '--bl-speed': `${speed * (mode === 'energy' ? 4 : mode === 'glare' ? 3 : 1)}s`, '--bl-reach': `${reach}px`, '--bl-a': color, '--bl-b': mode === 'ants' ? lineColor : secondColor, '--bl-line': lineColor, '--bl-bg': backgroundColor, '--bl-glare': glareColor, ...style } as CSSVars}
    >
      <span className="bl-edge__ring" aria-hidden="true" />
      <div className="bl-edge__body">{children}</div>
      {mode === 'glare' && <span className="bl-edge__glare" aria-hidden="true" />}
    </div>
  );
}
