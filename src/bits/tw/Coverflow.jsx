import { Children, useEffect, useInsertionEffect, useRef, useState } from 'react';

const STYLE_ID = 'bl-coverflow-tw';
const CSS = `
/* theme tokens */
.bl-cover { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-chip: rgba(255,255,255,0.08); --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-cover, .bl-cover:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-chip: rgba(26,28,44,0.08); --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-cover, :where(.light, [data-theme="light"]) .bl-cover:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-chip: rgba(255,255,255,0.08); --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-cover, .bl-cover:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-chip: rgba(26,28,44,0.08); --bl-accent: #167f8f; } }
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

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A 3D shelf. The chosen item faces you in the middle; its neighbours turn away and step back
// on either side like records in a crate. Drag or swipe to flick through, scroll sideways with a
// wheel or trackpad, click an item at the side to bring it forward, or use the arrow keys and
// buttons. The current item is announced; items off to the side are inert. Reduced motion slides
// without the turn.

const Arrow = ({ flip }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
    <path d="M6 3l5 5-5 5" />
  </svg>
);

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
}) {
  useStyles();
  const items = Children.toArray(children);
  const n = items.length;
  const [inner, setInner] = useState(defaultIndex);
  const index = Math.max(0, Math.min(n - 1, controlled ?? inner));
  const [drag, setDrag] = useState(null); // { x, shift } shift in items
  const stageRef = useRef(null);
  const wheelRef = useRef(0);
  // A drag ends with a click on whatever item is under the pointer; that click is swallowed.
  const draggedRef = useRef(false);

  const select = next => {
    const clamped = Math.max(0, Math.min(n - 1, next));
    if (clamped === index) return;
    if (controlled === undefined) setInner(clamped);
    onChange?.(clamped);
  };
  const selectRef = useRef(select);
  selectRef.current = select;

  // Sideways wheel or trackpad: one item per notch-worth of scroll.
  useEffect(() => {
    const stage = stageRef.current;
    const onWheel = event => {
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

  const onPointerDown = event => {
    if (event.button > 0) return;
    setDrag({ x: event.clientX, shift: 0, moved: false });
  };
  const onPointerMove = event => {
    if (!drag) return;
    if (!drag.moved && Math.abs(event.clientX - drag.x) > 6) stageRef.current.setPointerCapture?.(event.pointerId);
    setDrag(d => ({ ...d, shift: (event.clientX - d.x) / (itemWidth * spacing), moved: d.moved || Math.abs(event.clientX - d.x) > 6 }));
  };
  const onPointerUp = () => {
    if (!drag) return;
    draggedRef.current = drag.moved;
    if (drag.moved) select(index - Math.round(drag.shift));
    setDrag(null);
  };
  const onKeyDown = event => {
    const moves = { ArrowRight: 1, ArrowLeft: -1, Home: -n, End: n };
    if (moves[event.key] === undefined) return;
    event.preventDefault();
    select(index + moves[event.key]);
  };

  return (
    <div
      className={`bl-cover grid w-full justify-items-center gap-3.5 font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      style={{ '--bl-h': `${height}px`, '--bl-item': `${itemWidth}px`, '--bl-spacing': spacing, '--bl-angle': `${angle}deg`, '--bl-depth': `${depth}px`, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-line': lineColor, '--bl-chip': chipColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      <div
        ref={stageRef}
        className="group/cover relative h-(--bl-h) w-full touch-pan-y overflow-hidden outline-none [perspective:1100px] focus-visible:rounded-[12px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--bl-accent) focus-visible:outline-solid"
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
        <span className="pointer-events-none absolute right-[10%] bottom-[6%] left-[10%] h-[14%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(0,0,0,0.55),transparent)]" aria-hidden="true" />
        {items.map((item, i) => {
          // Offset from the centre in items (live while dragging), its distance, and which side.
          const o = i - index + (drag?.moved ? drag.shift : 0);
          const a = Math.min(Math.abs(o), range);
          if (Math.abs(o) > range + 1) return null;
          const active = i === index;
          return (
            <div
              key={item.key ?? i}
              className="absolute top-1/2 left-1/2 ml-[calc(var(--bl-item)_/_-2)] w-(--bl-item) cursor-pointer [transform-style:preserve-3d] [transform:translateY(-50%)_translateX(calc(var(--o)_*_var(--bl-item)_*_var(--bl-spacing)))_translateZ(calc(var(--a)_*_var(--bl-depth)_*_-1))_rotateY(calc(var(--s)_*_var(--bl-angle)_*_-1))] [filter:brightness(calc(1_-_var(--a)_*_0.18))] [transition:transform_420ms_cubic-bezier(.2,.8,.2,1),filter_420ms] data-[active]:cursor-default group-data-[dragging]/cover:[transition:none] motion-reduce:[transition:none] motion-reduce:[transform:translateY(-50%)_translateX(calc(var(--o)_*_var(--bl-item)_*_1.05))]"
              data-active={active || undefined}
              aria-hidden={!active || undefined}
              inert={!active || undefined}
              onClick={() => {
                if (draggedRef.current) draggedRef.current = false;
                else select(i);
              }}
              style={{ '--o': o.toFixed(3), '--a': a.toFixed(3), '--s': Math.max(-1, Math.min(1, o)).toFixed(3), zIndex: 100 - Math.round(a * 10) }}
            >
              {item}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 text-[14px] text-(--bl-muted)">
        <button type="button" className="grid size-[38px] cursor-pointer place-items-center rounded-[10px] border-0 bg-(--bl-chip) p-0 text-(--bl-ink) hover:bg-(--bl-line) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous" disabled={index === 0} onClick={() => select(index - 1)}>
          <Arrow flip />
        </button>
        <span className="min-w-16 text-center tabular-nums" aria-live="polite">
          {index + 1} / {n}
        </span>
        <button type="button" className="grid size-[38px] cursor-pointer place-items-center rounded-[10px] border-0 bg-(--bl-chip) p-0 text-(--bl-ink) hover:bg-(--bl-line) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next" disabled={index === n - 1} onClick={() => select(index + 1)}>
          <Arrow />
        </button>
      </div>
    </div>
  );
}
