import { Children, useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactElement, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A 3D shelf. The chosen item faces you in the middle; its neighbours turn away and step back
// on either side like records in a crate. Drag or swipe to flick through, scroll sideways with a
// wheel or trackpad, click an item at the side to bring it forward, or use the arrow keys and
// buttons. The current item is announced; items off to the side are inert. Reduced motion slides
// without the turn.

const STYLE_ID = 'bl-coverflow';
const CSS = `
/* theme tokens */
.bl-cover { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-chip: rgba(255,255,255,0.08); --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-cover, .bl-cover:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-chip: rgba(26,28,44,0.08); --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-cover, :where(.light, [data-theme="light"]) .bl-cover:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-chip: rgba(255,255,255,0.08); --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-cover, .bl-cover:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-chip: rgba(26,28,44,0.08); --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-cover { display: grid; gap: 14px; justify-items: center; width: 100%; font-family: var(--bl-font); color: var(--bl-ink); }
.bl-cover__stage { position: relative; width: 100%; height: var(--bl-h); perspective: 1100px; touch-action: pan-y; outline: none; overflow: hidden; }
.bl-cover__stage:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 4px; border-radius: 12px; }
.bl-cover__item { position: absolute; top: 50%; left: 50%; width: var(--bl-item); margin-left: calc(var(--bl-item) / -2); transform: translateY(-50%) translateX(calc(var(--o) * var(--bl-item) * var(--bl-spacing))) translateZ(calc(var(--a) * var(--bl-depth) * -1)) rotateY(calc(var(--s) * var(--bl-angle) * -1)); transition: transform 420ms cubic-bezier(.2,.8,.2,1), filter 420ms; transform-style: preserve-3d; cursor: pointer; filter: brightness(calc(1 - var(--a) * 0.18)); }
.bl-cover__item[data-active] { cursor: default; }
.bl-cover__stage[data-dragging] .bl-cover__item { transition: none; }
.bl-cover__floor { position: absolute; left: 10%; right: 10%; bottom: 6%; height: 14%; border-radius: 50%; background: radial-gradient(closest-side, rgba(0,0,0,0.55), transparent); pointer-events: none; }
.bl-cover__bar { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--bl-muted); }
.bl-cover__btn { display: grid; place-items: center; width: 38px; height: 38px; padding: 0; border: 0; border-radius: 10px; background: var(--bl-chip); color: var(--bl-ink); cursor: pointer; }
.bl-cover__btn:hover { background: var(--bl-line); }
.bl-cover__btn:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-cover__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.bl-cover__count { min-width: 64px; text-align: center; font-variant-numeric: tabular-nums; }
@media (prefers-reduced-motion: reduce) { .bl-cover__item { transition: none; transform: translateY(-50%) translateX(calc(var(--o) * var(--bl-item) * 1.05)); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const Arrow = ({ flip }: { flip?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
    <path d="M6 3l5 5-5 5" />
  </svg>
);

export interface CoverflowProps {
  children?: ReactNode;
  index?: number;
  defaultIndex?: number;
  onChange?: (index: number) => void;
  itemWidth?: number;
  height?: number;
  /** Overlap between items (share of the item width). */
  spacing?: number;
  /** How far side items turn, in degrees. */
  angle?: number;
  /** How far side items step back, in px. */
  depth?: number;
  /** Items rendered on each side. */
  range?: number;
  label?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  chipColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function Coverflow({
  children,
  index: controlled,
  defaultIndex = 0,
  onChange,
  itemWidth = 220,
  height = 320,
  spacing = 0.55,
  angle = 55,
  depth = 120,
  range = 4,
  label = 'Gallery',
  textColor,
  mutedColor,
  lineColor,
  chipColor,
  accentColor,
  fontFamily = 'inherit',
  className = '',
  style
}: CoverflowProps) {
  useStyles();
  const items = Children.toArray(children);
  const n = items.length;
  const [inner, setInner] = useState(defaultIndex);
  const index = Math.max(0, Math.min(n - 1, controlled ?? inner));
  const [drag, setDrag] = useState<{ x: number; shift: number; moved: boolean } | null>(null); // { x, shift } shift in items
  const stageRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef(0);
  // A drag ends with a click on whatever item is under the pointer; that click is swallowed.
  const draggedRef = useRef(false);

  const select = (next: number) => {
    const clamped = Math.max(0, Math.min(n - 1, next));
    if (clamped === index) return;
    if (controlled === undefined) setInner(clamped);
    onChange?.(clamped);
  };
  const selectRef = useRef(select);
  selectRef.current = select;

  // Sideways wheel or trackpad: one item per notch-worth of scroll.
  useEffect(() => {
    const stage = stageRef.current!;
    const onWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.shiftKey ? event.deltaY : 0;
      if (!delta) return;
      event.preventDefault();
      wheelRef.current += delta;
      if (Math.abs(wheelRef.current) > 60) {
        selectRef.current(index + Math.sign(wheelRef.current));
        wheelRef.current = 0;
      }
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [index]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button > 0) return;
    setDrag({ x: event.clientX, shift: 0, moved: false });
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    if (!drag.moved && Math.abs(event.clientX - drag.x) > 6) stageRef.current!.setPointerCapture?.(event.pointerId);
    setDrag(d => ({ ...d!, shift: (event.clientX - d!.x) / (itemWidth * spacing), moved: d!.moved || Math.abs(event.clientX - d!.x) > 6 }));
  };
  const onPointerUp = () => {
    if (!drag) return;
    draggedRef.current = drag.moved;
    if (drag.moved) select(index - Math.round(drag.shift));
    setDrag(null);
  };
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, Home: -n, End: n };
    if (moves[event.key] === undefined) return;
    event.preventDefault();
    select(index + moves[event.key]);
  };

  return (
    <div
      className={`bl-cover ${className}`}
      style={{ '--bl-h': `${height}px`, '--bl-item': `${itemWidth}px`, '--bl-spacing': spacing, '--bl-angle': `${angle}deg`, '--bl-depth': `${depth}px`, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-line': lineColor, '--bl-chip': chipColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <div
        ref={stageRef}
        className="bl-cover__stage"
        role="group"
        aria-roledescription="carousel"
        aria-label={`${label}: item ${index + 1} of ${n}`}
        tabIndex={0}
        data-dragging={drag?.moved || undefined}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="bl-cover__floor" aria-hidden="true" />
        {items.map((item, i) => {
          // Offset from the centre in items (live while dragging), its distance, and which side.
          const o = i - index + (drag?.moved ? drag.shift : 0);
          const a = Math.min(Math.abs(o), range);
          if (Math.abs(o) > range + 1) return null;
          const active = i === index;
          return (
            <div
              key={(item as ReactElement).key ?? i}
              className="bl-cover__item"
              data-active={active || undefined}
              aria-hidden={!active || undefined}
              inert={!active || undefined}
              onClick={() => {
                if (draggedRef.current) draggedRef.current = false;
                else select(i);
              }}
              style={{ '--o': o.toFixed(3), '--a': a.toFixed(3), '--s': Math.max(-1, Math.min(1, o)).toFixed(3), zIndex: 100 - Math.round(a * 10) } as CSSVars}
            >
              {item}
            </div>
          );
        })}
      </div>
      <div className="bl-cover__bar">
        <button type="button" className="bl-cover__btn" aria-label="Previous" disabled={index === 0} onClick={() => select(index - 1)}>
          <Arrow flip />
        </button>
        <span className="bl-cover__count" aria-live="polite">
          {index + 1} / {n}
        </span>
        <button type="button" className="bl-cover__btn" aria-label="Next" disabled={index === n - 1} onClick={() => select(index + 1)}>
          <Arrow />
        </button>
      </div>
    </div>
  );
}
