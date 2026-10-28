import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A spinning drum of options, like a slot reel or a date picker. Flick it and it coasts, slows
// and clicks into place on the nearest option; scroll it with a wheel; or focus it and use the
// arrow keys, Page Up/Down, Home and End. Options curve away above and below the selection.
// Screen readers get a spin button that says the current option. Reduced motion snaps without
// coasting.

const STYLE_ID = 'bl-wheel-picker';
const CSS = `
/* theme tokens */
.bl-wheel { --bl-bg: #1a1c2c; --bl-band: rgba(115,239,247,0.08); --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-wheel, .bl-wheel:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-band: rgba(22,127,143,0.08); --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-wheel, :where(.light, [data-theme="light"]) .bl-wheel:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-band: rgba(115,239,247,0.08); --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-wheel, .bl-wheel:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-band: rgba(22,127,143,0.08); --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-wheel { position: relative; display: inline-block; width: var(--bl-w); height: calc(var(--bl-row) * var(--bl-visible)); overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); font-size: var(--bl-size); box-shadow: inset 0 0 0 1px var(--bl-line); cursor: grab; touch-action: none; user-select: none; outline: none; perspective: 600px; }
.bl-wheel:focus-visible { box-shadow: inset 0 0 0 2px var(--bl-accent); }
.bl-wheel[data-dragging] { cursor: grabbing; }
.bl-wheel__band { position: absolute; left: 6px; right: 6px; top: 50%; height: var(--bl-row); margin-top: calc(var(--bl-row) / -2); border-radius: 8px; background: var(--bl-band); box-shadow: inset 0 0 0 1px var(--bl-line); pointer-events: none; }
.bl-wheel__drum { position: absolute; inset: 0; transform-style: preserve-3d; }
.bl-wheel__opt { position: absolute; left: 0; right: 0; top: 50%; height: var(--bl-row); margin-top: calc(var(--bl-row) / -2); display: grid; place-items: center; color: var(--bl-muted); white-space: nowrap; backface-visibility: hidden; transform: rotateX(calc(var(--k) * var(--bl-step) * -1)) translateZ(var(--bl-radius-z)); opacity: calc(1 - var(--far) * 0.75); }
.bl-wheel__opt[data-current] { color: var(--bl-ink); font-weight: 700; }
.bl-wheel__fade { position: absolute; inset: 0; background: linear-gradient(var(--bl-bg), transparent 38%, transparent 62%, var(--bl-bg)); pointer-events: none; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const asOption = (o: string | number | WheelOption): WheelOption => (typeof o === 'object' && o !== null ? o : { value: o, label: String(o) });

export interface WheelOption {
  value: string | number;
  label: string;
}

export interface WheelPickerProps {
  options?: (string | number | WheelOption)[];
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (value: string | number, option: WheelOption) => void;
  /** Rows shown; odd numbers work best. */
  visible?: number;
  rowHeight?: number;
  width?: number;
  /** Accessible name. */
  label?: string;
  fontSize?: number;
  radius?: number;
  backgroundColor?: string;
  bandColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function WheelPicker({
  options = [],
  value,
  defaultValue,
  onChange,
  visible = 5,
  rowHeight = 40,
  width = 140,
  label = 'Pick an option',
  fontSize = 18,
  radius = 14,
  backgroundColor,
  bandColor,
  textColor,
  mutedColor,
  lineColor,
  accentColor,
  fontFamily = 'inherit',
  className = '',
  style
}: WheelPickerProps) {
  useStyles();
  const opts = options.map(asOption);
  const n = opts.length;
  const indexOf = (v: unknown) => Math.max(0, opts.findIndex(o => o.value === v));
  const [inner, setInner] = useState(() => indexOf(value ?? defaultValue ?? opts[0]?.value));
  const index = value !== undefined ? indexOf(value) : Math.min(inner, Math.max(0, n - 1));
  // Where the drum is, in rows; it follows the finger and coasts, then rests on `index`.
  const [pos, setPos] = useState(index);
  const rootRef = useRef<HTMLDivElement>(null);
  const motion = useRef<{ raf: number; v: number; drag: { y: number; start: number; at: number; last: number } | null }>({ raf: 0, v: 0, drag: null });

  const commit = (i: number) => {
    const next = Math.max(0, Math.min(n - 1, i));
    if (value === undefined) setInner(next);
    if (next !== index) onChange?.(opts[next].value, opts[next]);
    return next;
  };
  const commitRef = useRef(commit);
  commitRef.current = commit;

  // Settle on the controlled or chosen index whenever it changes from outside a drag.
  useEffect(() => {
    if (!motion.current.drag && !motion.current.raf) setPos(index);
  }, [index]);

  useEffect(() => {
    const root = rootRef.current!;
    const m = motion.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // The drum position in rows, shared by dragging, coasting and key presses.
    let p = index;
    const clamp = (v: number) => Math.max(-0.4, Math.min(n - 0.6, v));
    const show = (v: number) => {
      p = v;
      setPos(v);
    };

    // Coast with friction and spring into the nearest row, or (with a target) spring to it.
    const settle = (target?: number) => {
      cancelAnimationFrame(m.raf);
      let last = performance.now();
      const step = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (target === undefined && Math.abs(m.v) > 1.2) {
          m.v *= Math.exp(-dt * 3.2);
          show(clamp(p + m.v * dt));
        } else {
          const goal = target ?? Math.round(Math.max(0, Math.min(n - 1, p)));
          m.v = 0;
          const next = p + (goal - p) * Math.min(1, dt * 14);
          if (Math.abs(goal - next) < 0.002) {
            show(goal);
            m.raf = 0;
            commitRef.current(goal);
            return;
          }
          show(next);
        }
        m.raf = requestAnimationFrame(step);
      };
      m.raf = requestAnimationFrame(step);
    };
    const jump = (i: number) => {
      const target = Math.max(0, Math.min(n - 1, i));
      m.v = 0;
      if (reduced) {
        cancelAnimationFrame(m.raf);
        m.raf = 0;
        show(target);
        commitRef.current(target);
      } else settle(target);
    };

    const onDown = (event: PointerEvent) => {
      if (event.button > 0) return;
      cancelAnimationFrame(m.raf);
      m.raf = 0;
      root.setPointerCapture?.(event.pointerId);
      m.drag = { y: event.clientY, start: p, at: performance.now(), last: event.clientY };
      m.v = 0;
      root.dataset.dragging = '';
    };
    const onMove = (event: PointerEvent) => {
      if (!m.drag) return;
      const now = performance.now();
      const dy = event.clientY - m.drag.y;
      const dt = Math.max(1, now - m.drag.at) / 1000;
      m.v = (-(event.clientY - m.drag.last) / rowHeight / dt) * 0.6 + m.v * 0.4;
      m.drag.at = now;
      m.drag.last = event.clientY;
      show(clamp(m.drag.start - dy / rowHeight));
    };
    const onUp = () => {
      if (!m.drag) return;
      m.drag = null;
      delete root.dataset.dragging;
      if (reduced) m.v = 0;
      settle();
    };
    let wheelAcc = 0;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      wheelAcc += event.deltaY;
      if (Math.abs(wheelAcc) >= 30) {
        jump(Math.round(p) + Math.sign(wheelAcc));
        wheelAcc = 0;
      }
    };
    const onKey = (event: KeyboardEvent) => {
      const page = Math.max(1, visible - 1);
      const moves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, PageDown: page, PageUp: -page, Home: -1e9, End: 1e9 };
      if (moves[event.key] === undefined) return;
      event.preventDefault();
      jump(Math.round(p) + moves[event.key]);
    };

    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(m.raf);
      m.raf = 0;
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, rowHeight, visible, index]);

  // Each row sits on a cylinder: the angle per row is set so `visible` rows fill the half-turn.
  const stepDeg = 180 / (visible + 1);
  const radiusZ = rowHeight / 2 / Math.tan(((stepDeg / 2) * Math.PI) / 180);
  const shown = Math.round(Math.max(0, Math.min(n - 1, pos)));

  return (
    <div
      ref={rootRef}
      className={`bl-wheel ${className}`}
      role="spinbutton"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.max(0, n - 1)}
      aria-valuenow={index}
      aria-valuetext={opts[index]?.label ?? ''}
      style={{ '--bl-w': `${width}px`, '--bl-row': `${rowHeight}px`, '--bl-visible': visible, '--bl-step': `${stepDeg}deg`, '--bl-radius-z': `${radiusZ.toFixed(1)}px`, '--bl-size': `${fontSize}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-band': bandColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <span className="bl-wheel__band" aria-hidden="true" />
      <div className="bl-wheel__drum" aria-hidden="true">
        {opts.map((o, i) => {
          const k = i - pos;
          if (Math.abs(k) > visible / 2 + 1) return null;
          return (
            <span key={String(o.value)} className="bl-wheel__opt" data-current={i === shown || undefined} style={{ '--k': k.toFixed(3), '--far': Math.min(1, Math.abs(k) / (visible / 2 + 0.5)).toFixed(3) } as CSSVars}>
              {o.label}
            </span>
          );
        })}
      </div>
      <span className="bl-wheel__fade" aria-hidden="true" />
    </div>
  );
}
