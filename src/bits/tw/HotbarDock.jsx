import { useEffect, useInsertionEffect, useRef, useState } from 'react';

const STYLE_ID = 'bl-hotbar-dock-tw';
const CSS = `
/* theme tokens */
.bl-hotbar { --bl-bg: #1a1c2c; --bl-slot-bg: #333c57; --bl-hover: #3d4766; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #0b0b14; --bl-select: #f4f4f4; --bl-accent: #73eff7; --bl-tip: #0b0b14; }
:where(.light, [data-theme="light"]) .bl-hotbar, .bl-hotbar:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-slot-bg: #ddd4c0; --bl-hover: #ddd4c0; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #e2dacb; --bl-select: #1a1c2c; --bl-accent: #167f8f; --bl-tip: #e2dacb; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-hotbar, :where(.light, [data-theme="light"]) .bl-hotbar:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-slot-bg: #333c57; --bl-hover: #3d4766; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #0b0b14; --bl-select: #f4f4f4; --bl-accent: #73eff7; --bl-tip: #0b0b14; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-hotbar, .bl-hotbar:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-slot-bg: #ddd4c0; --bl-hover: #ddd4c0; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #e2dacb; --bl-select: #1a1c2c; --bl-accent: #167f8f; --bl-tip: #e2dacb; } }
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
// A game hotbar that works as a dock. Slots swell as the pointer passes over them, the selected
// slot wears a thick pixel frame, and items can show a stack count. Pick a slot by clicking it,
// with the number keys 1–9 (anywhere on the page, unless you're typing), with the scroll wheel
// while hovering, or with the arrow keys inside the bar. Each slot names itself above when
// hovered or focused. Reduced motion keeps slots their normal size.

export default function HotbarDock({
  items = [],
  value,
  defaultValue,
  onChange,
  magnify = 1.5,
  range = 110,
  hotkeys = true,
  wheel = true,
  label = 'Hotbar',
  slotSize = 52,
  gap = 6,
  padding = 8,
  radius = 10,
  backgroundColor,
  slotColor,
  hoverColor,
  textColor,
  mutedColor,
  lineColor,
  selectColor,
  accentColor,
  tooltipColor,
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const [inner, setInner] = useState(defaultValue ?? items[0]?.id);
  const selected = value ?? inner;
  const barRef = useRef(null);
  const [focusIndex, setFocusIndex] = useState(() => Math.max(0, items.findIndex(item => item.id === (value ?? defaultValue ?? items[0]?.id))));

  const pick = id => {
    if (id === selected) return;
    if (value === undefined) setInner(id);
    onChange?.(id, items.find(item => item.id === id));
  };
  const pickRef = useRef(pick);
  pickRef.current = pick;

  // Number keys, anywhere, unless focus is in something you type into.
  useEffect(() => {
    if (!hotkeys) return undefined;
    const onKey = event => {
      const t = event.target;
      if (event.metaKey || event.ctrlKey || event.altKey || t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      const n = Number(event.key);
      if (n >= 1 && n <= Math.min(9, items.length)) pickRef.current(items[n - 1].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkeys, items]);

  // Magnify by distance from the pointer; the wheel cycles the selection while hovering.
  useEffect(() => {
    const bar = barRef.current;
    const slots = () => [...bar.querySelectorAll('.bl-hotbar__slot')];
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const onMove = event => {
      if (reduced) return;
      slots().forEach(slot => {
        const r = slot.getBoundingClientRect();
        const d = Math.abs(event.clientX - (r.left + r.width / 2));
        const k = Math.max(0, 1 - d / range);
        // Smooth falloff: full size under the pointer, easing to normal at `range` px away.
        slot.style.setProperty('--m', (1 + (magnify - 1) * k * k * (3 - 2 * k)).toFixed(3));
      });
    };
    const onLeave = () => slots().forEach(slot => slot.style.setProperty('--m', '1'));
    const onWheel = event => {
      if (!wheel || !items.length) return;
      event.preventDefault();
      const step = Math.sign(event.deltaY || event.deltaX);
      const at = Math.max(0, items.findIndex(item => item.id === selected));
      pickRef.current(items[(at + step + items.length) % items.length].id);
    };
    bar.addEventListener('pointermove', onMove);
    bar.addEventListener('pointerleave', onLeave);
    bar.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      bar.removeEventListener('pointermove', onMove);
      bar.removeEventListener('pointerleave', onLeave);
      bar.removeEventListener('wheel', onWheel);
    };
  }, [magnify, range, wheel, items, selected]);

  // Arrow keys move focus along the bar (one tab stop for the whole bar).
  const onKeyDown = event => {
    const moves = { ArrowRight: 1, ArrowLeft: -1, Home: -1e9, End: 1e9 };
    if (moves[event.key] === undefined) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(items.length - 1, focusIndex + moves[event.key]));
    setFocusIndex(next);
    barRef.current.querySelectorAll('.bl-hotbar__slot')[next]?.focus();
  };

  return (
    <div
      ref={barRef}
      className={`bl-hotbar inline-flex items-end gap-(--bl-gap) rounded-(--bl-radius) bg-(--bl-bg) p-(--bl-pad) font-(family-name:--bl-font) shadow-[0_0_0_3px_var(--bl-line),0_12px_28px_-14px_rgba(0,0,0,0.85)] ${className}`}
      role="toolbar"
      aria-label={label}
      onKeyDown={onKeyDown}
      style={{ '--bl-slot': `${slotSize}px`, '--bl-gap': `${gap}px`, '--bl-pad': `${padding}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-slot-bg': slotColor, '--bl-hover': hoverColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-line': lineColor, '--bl-select': selectColor, '--bl-accent': accentColor, '--bl-tip': tooltipColor, '--bl-font': fontFamily, ...style }}
    >
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          className="bl-hotbar__slot group/slot relative my-0 mx-[calc((var(--m)_-_1)_*_var(--bl-slot)_/_2)] grid size-(--bl-slot) origin-bottom cursor-pointer place-items-center rounded-[6px] border-0 bg-(--bl-slot-bg) p-0 text-(--bl-ink) shadow-[inset_0_0_0_2px_rgba(0,0,0,0.35)] [--m:1] [transform:scale(var(--m))] [transition:transform_90ms_linear,margin_90ms_linear] hover:bg-(--bl-hover) focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-(--bl-accent) focus-visible:outline-solid aria-pressed:bg-(--bl-hover) aria-pressed:shadow-[inset_0_0_0_2px_rgba(0,0,0,0.35),0_0_0_3px_var(--bl-select),0_0_0_5px_rgba(0,0,0,0.6)] motion-reduce:[transition:none]"
          aria-pressed={item.id === selected}
          aria-label={`${item.label}${item.count != null ? `, ${item.count}` : ''}${hotkeys && i < 9 ? ` (key ${i + 1})` : ''}`}
          tabIndex={i === focusIndex ? 0 : -1}
          onFocus={() => setFocusIndex(i)}
          onClick={() => pick(item.id)}
        >
          {hotkeys && i < 9 && (
            <span className="pointer-events-none absolute top-0.5 left-1 text-[9px] leading-none text-(--bl-muted)" aria-hidden="true">
              {i + 1}
            </span>
          )}
          <span className="pointer-events-none grid h-[70%] w-[70%] place-items-center [&>img]:block [&>img]:h-full [&>img]:w-full [&>img]:[image-rendering:pixelated] [&>svg]:block [&>svg]:h-full [&>svg]:w-full [&>svg]:[image-rendering:pixelated]" aria-hidden="true">
            {item.icon}
          </span>
          {item.count != null && (
            <span className="pointer-events-none absolute right-[3px] bottom-0.5 text-[11px] leading-none font-bold text-(--bl-ink) [text-shadow:1px_1px_0_#000]" aria-hidden="true">
              {item.count}
            </span>
          )}
          <span className="pointer-events-none absolute bottom-[calc(100%_+_8px)] left-1/2 origin-bottom rounded-[6px] bg-(--bl-tip) px-2 py-1 text-[12px] whitespace-nowrap text-(--bl-ink) opacity-0 [transform:translateX(-50%)_scale(calc(1_/_var(--m)))] [transition:opacity_120ms_steps(2)] group-hover/slot:opacity-100 group-focus-visible/slot:opacity-100" aria-hidden="true">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
