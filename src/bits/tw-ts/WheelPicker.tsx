import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

const STYLE_ID = 'bl-wheel-picker-tw';
const CSS = `
/* theme tokens */
.bl-wheel { --bl-bg: #1a1c2c; --bl-band: rgba(115,239,247,0.08); --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-wheel, .bl-wheel:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-band: rgba(22,127,143,0.08); --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-wheel, :where(.light, [data-theme="light"]) .bl-wheel:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-band: rgba(115,239,247,0.08); --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-wheel, .bl-wheel:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-band: rgba(22,127,143,0.08); --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-accent: #167f8f; } }
/* theme tokens end */
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
  /** A barrel look: slats, shading, side rails and a deeper curve. */
  drum?: boolean;
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
  drum = false,
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
      className={`bl-wheel group/wheel data-[drum]:[perspective:280px] data-[drum]:before:pointer-events-none data-[drum]:before:absolute data-[drum]:before:inset-y-0 data-[drum]:before:z-2 data-[drum]:before:w-2 data-[drum]:before:bg-[linear-gradient(var(--bl-line),var(--bl-muted)_50%,var(--bl-line))] data-[drum]:before:content-[''] data-[drum]:after:pointer-events-none data-[drum]:after:absolute data-[drum]:after:inset-y-0 data-[drum]:after:z-2 data-[drum]:after:w-2 data-[drum]:after:bg-[linear-gradient(var(--bl-line),var(--bl-muted)_50%,var(--bl-line))] data-[drum]:after:content-[''] data-[drum]:before:left-0 data-[drum]:after:right-0 relative inline-block h-[calc(var(--bl-row)_*_var(--bl-visible))] w-(--bl-w) cursor-grab touch-none overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) font-(family-name:--bl-font) text-(length:--bl-size) text-(--bl-ink) shadow-[inset_0_0_0_1px_var(--bl-line)] outline-none select-none [perspective:600px] focus-visible:shadow-[inset_0_0_0_2px_var(--bl-accent)] data-[dragging]:cursor-grabbing ${className}`}
      role="spinbutton"
      data-drum={drum || undefined}
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.max(0, n - 1)}
      aria-valuenow={index}
      aria-valuetext={opts[index]?.label ?? ''}
      style={{ '--bl-w': `${width}px`, '--bl-row': `${rowHeight}px`, '--bl-visible': visible, '--bl-step': `${stepDeg}deg`, '--bl-radius-z': `${radiusZ.toFixed(1)}px`, '--bl-size': `${fontSize}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-band': bandColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <span className="pointer-events-none absolute top-1/2 right-1.5 left-1.5 -mt-[calc(var(--bl-row)_/_2)] h-(--bl-row) rounded-[8px] bg-(--bl-band) shadow-[inset_0_0_0_1px_var(--bl-line)] group-data-[drum]/wheel:z-1 group-data-[drum]/wheel:bg-transparent group-data-[drum]/wheel:shadow-[inset_0_0_0_2px_var(--bl-accent)]" aria-hidden="true" />
      <div className="absolute inset-0 [transform-style:preserve-3d]" aria-hidden="true">
        {opts.map((o, i) => {
          const k = i - pos;
          if (Math.abs(k) > visible / 2 + 1) return null;
          return (
            <span key={String(o.value)} className="absolute top-1/2 right-0 left-0 -mt-[calc(var(--bl-row)_/_2)] group-data-[drum]/wheel:bg-(--bl-bg) group-data-[drum]/wheel:shadow-[inset_0_1px_0_var(--bl-line)] grid h-(--bl-row) place-items-center whitespace-nowrap text-(--bl-muted) opacity-[calc(1_-_var(--far)_*_0.75)] [backface-visibility:hidden] [transform:rotateX(calc(var(--k)_*_var(--bl-step)_*_-1))_translateZ(var(--bl-radius-z))] data-[current]:font-bold data-[current]:text-(--bl-ink)" data-current={i === shown || undefined} style={{ '--k': k.toFixed(3), '--far': Math.min(1, Math.abs(k) / (visible / 2 + 0.5)).toFixed(3) } as CSSVars}>
              {o.label}
            </span>
          );
        })}
      </div>
      {drum && <span className="pointer-events-none absolute inset-0 z-1 bg-[linear-gradient(rgba(0,0,0,0.5),transparent_32%,rgba(255,255,255,0.06)_50%,transparent_68%,rgba(0,0,0,0.5))]" aria-hidden="true" />}
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--bl-bg),transparent_38%,transparent_62%,var(--bl-bg))]" aria-hidden="true" />
    </div>
  );
}
