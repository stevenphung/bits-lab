import { useEffect, useInsertionEffect, useRef, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A frame with a live edge. Wrap any card and pick an edge: "ants" marches a pixel dashed
// border around it like a selection box; "energy" runs a stepped band of colour round and
// round the frame; "glow" lights the stretch of border nearest the pointer; "glare" sweeps a
// flash of light across the surface. Show it always or only on hover and focus. The content
// is untouched; reduced motion freezes the edge.

const STYLE_ID = 'bl-edge-fx-tw';
const CSS = `
/* theme tokens */
.bl-edge { --bl-a: #73eff7; --bl-bg: #1a1c2c; --bl-glare: rgba(244,244,244,0.22); }
:where(.light, [data-theme="light"]) .bl-edge, .bl-edge:where(.light, [data-theme="light"]) { --bl-a: #167f8f; --bl-bg: #f4f1e8; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-edge, :where(.light, [data-theme="light"]) .bl-edge:where(.dark, [data-theme="dark"]) { --bl-a: #73eff7; --bl-bg: #1a1c2c; --bl-glare: rgba(244,244,244,0.22); }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-edge, .bl-edge:where([data-theme="system"]) { --bl-a: #167f8f; --bl-bg: #f4f1e8; } }
/* theme tokens end */
@property --bl-edge-turn { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
@keyframes bl-edge-march { to { background-position: var(--bl-dash) 0, calc(var(--bl-dash) * -1) 100%, 0 calc(var(--bl-dash) * -1), 100% var(--bl-dash); } }
@keyframes bl-edge-spin { to { --bl-edge-turn: 360deg; } }
@keyframes bl-edge-glare { 0% { transform: translateX(-150%) skewX(-12deg); } 60%, 100% { transform: translateX(350%) skewX(-12deg); } }
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
      className={`bl-edge group/edge relative isolate box-border block rounded-(--bl-radius) bg-(--bl-line) p-(--bl-w) [--bl-on:1] data-[active=hover]:[--bl-on:0] data-[active=hover]:focus-within:[--bl-on:1] data-[active=hover]:hover:[--bl-on:1] [&[data-mode=glow][data-active=hover]:not([data-lit])]:[--bl-on:0]! [&[data-mode=glow][data-lit]]:[--bl-on:1]! ${className}`}
      data-mode={mode}
      data-active={active}
      style={{ '--bl-w': `${width}px`, '--bl-radius': `${radius}px`, '--bl-dash': `${dash}px`, '--bl-speed': `${speed * (mode === 'energy' ? 4 : mode === 'glare' ? 3 : 1)}s`, '--bl-reach': `${reach}px`, '--bl-a': color, '--bl-b': mode === 'ants' ? lineColor : secondColor, '--bl-line': lineColor, '--bl-bg': backgroundColor, '--bl-glare': glareColor, ...style } as CSSVars}
    >
      <span className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-(--bl-on) [transition:opacity_200ms_steps(3)] group-data-[mode=ants]/edge:animate-[bl-edge-march_var(--bl-speed)_steps(4)_infinite] group-data-[mode=ants]/edge:[background:linear-gradient(90deg,var(--bl-a)_50%,var(--bl-b)_0)_0_0/var(--bl-dash)_var(--bl-w)_repeat-x,linear-gradient(90deg,var(--bl-a)_50%,var(--bl-b)_0)_0_100%/var(--bl-dash)_var(--bl-w)_repeat-x,linear-gradient(0deg,var(--bl-a)_50%,var(--bl-b)_0)_0_0/var(--bl-w)_var(--bl-dash)_repeat-y,linear-gradient(0deg,var(--bl-a)_50%,var(--bl-b)_0)_100%_0/var(--bl-w)_var(--bl-dash)_repeat-y] group-data-[mode=energy]/edge:animate-[bl-edge-spin_var(--bl-speed)_steps(36)_infinite] group-data-[mode=energy]/edge:[background:conic-gradient(from_var(--bl-edge-turn),transparent_0_55%,var(--bl-b)_70%,var(--bl-a)_80%,transparent_92%)] group-data-[mode=glow]/edge:[background:radial-gradient(circle_var(--bl-reach)_at_var(--bl-x,50%)_var(--bl-y,-40%),var(--bl-a),var(--bl-b)_45%,transparent_75%)] motion-reduce:animate-none! motion-reduce:[transition:none]" aria-hidden="true" />
      <div className="relative z-1 h-full overflow-hidden rounded-[calc(var(--bl-radius)_-_var(--bl-w))] bg-(--bl-bg)">{children}</div>
      {mode === 'glare' && <span className="pointer-events-none absolute inset-0 z-2 overflow-hidden rounded-[inherit] before:absolute before:-top-1/2 before:-bottom-1/2 before:left-0 before:w-[40%] before:bg-[linear-gradient(100deg,transparent,var(--bl-glare),transparent)] before:[transform:translateX(-150%)_skewX(-12deg)] before:content-[''] group-focus-within/edge:before:animate-[bl-edge-glare_var(--bl-speed)_steps(12)_infinite] group-hover/edge:before:animate-[bl-edge-glare_var(--bl-speed)_steps(12)_infinite] group-data-[active=always]/edge:before:animate-[bl-edge-glare_var(--bl-speed)_steps(12)_infinite] motion-reduce:before:animate-none!" aria-hidden="true" />}
    </div>
  );
}
