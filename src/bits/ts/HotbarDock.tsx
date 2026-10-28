import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A game hotbar that works as a dock. Slots swell as the pointer passes over them, the selected
// slot wears a thick pixel frame, and items can show a stack count. Pick a slot by clicking it,
// with the number keys 1–9 (anywhere on the page, unless you're typing), with the scroll wheel
// while hovering, or with the arrow keys inside the bar. Each slot names itself above when
// hovered or focused. Reduced motion keeps slots their normal size.

const STYLE_ID = 'bl-hotbar-dock';
const CSS = `
.bl-hotbar { display: inline-flex; align-items: flex-end; gap: var(--bl-gap); padding: var(--bl-pad); border-radius: var(--bl-radius); background: var(--bl-bg); box-shadow: 0 0 0 3px var(--bl-line), 0 12px 28px -14px rgba(0,0,0,0.85); font-family: var(--bl-font); }
.bl-hotbar__slot { --m: 1; position: relative; display: grid; place-items: center; width: var(--bl-slot); height: var(--bl-slot); padding: 0; border: 0; border-radius: 6px; background: var(--bl-slot-bg); color: var(--bl-ink); box-shadow: inset 0 0 0 2px rgba(0,0,0,0.35); cursor: pointer; transform: scale(var(--m)); transform-origin: 50% 100%; margin: 0 calc((var(--m) - 1) * var(--bl-slot) / 2); transition: transform 90ms linear, margin 90ms linear; }
.bl-hotbar__slot:hover { background: var(--bl-hover); }
.bl-hotbar__slot:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 3px; }
.bl-hotbar__slot[aria-pressed="true"] { background: var(--bl-hover); box-shadow: inset 0 0 0 2px rgba(0,0,0,0.35), 0 0 0 3px var(--bl-select), 0 0 0 5px rgba(0,0,0,0.6); }
.bl-hotbar__icon { display: grid; place-items: center; width: 70%; height: 70%; pointer-events: none; }
.bl-hotbar__icon > img, .bl-hotbar__icon > svg { display: block; width: 100%; height: 100%; image-rendering: pixelated; }
.bl-hotbar__key { position: absolute; top: 2px; left: 4px; color: var(--bl-muted); font-size: 9px; line-height: 1; pointer-events: none; }
.bl-hotbar__count { position: absolute; right: 3px; bottom: 2px; color: var(--bl-ink); font-size: 11px; font-weight: 700; line-height: 1; text-shadow: 1px 1px 0 #000; pointer-events: none; }
.bl-hotbar__tip { position: absolute; bottom: calc(100% + 8px); left: 50%; padding: 4px 8px; border-radius: 6px; background: var(--bl-tip); color: var(--bl-ink); font-size: 12px; white-space: nowrap; transform: translateX(-50%) scale(calc(1 / var(--m))); transform-origin: 50% 100%; opacity: 0; pointer-events: none; transition: opacity 120ms steps(2); }
.bl-hotbar__slot:hover .bl-hotbar__tip, .bl-hotbar__slot:focus-visible .bl-hotbar__tip { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .bl-hotbar__slot { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface HotbarItem {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Stack count shown in the corner. */
  count?: number;
}

export interface HotbarDockProps {
  items?: HotbarItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string, item: HotbarItem | undefined) => void;
  /** Size of the slot under the pointer. */
  magnify?: number;
  /** How far the swell reaches, in px. */
  range?: number;
  /** Number keys 1–9 pick a slot (not while typing). */
  hotkeys?: boolean;
  /** Scrolling over the bar cycles the selection. */
  wheel?: boolean;
  label?: string;
  slotSize?: number;
  gap?: number;
  padding?: number;
  radius?: number;
  backgroundColor?: string;
  slotColor?: string;
  hoverColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  selectColor?: string;
  accentColor?: string;
  tooltipColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

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
  backgroundColor = '#1a1c2c',
  slotColor = '#333c57',
  hoverColor = '#3d4766',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = '#0b0b14',
  selectColor = '#f4f4f4',
  accentColor = '#73eff7',
  tooltipColor = '#0b0b14',
  fontFamily = 'inherit',
  className = '',
  style
}: HotbarDockProps) {
  useStyles();
  const [inner, setInner] = useState(defaultValue ?? items[0]?.id);
  const selected = value ?? inner;
  const barRef = useRef<HTMLDivElement>(null);
  const [focusIndex, setFocusIndex] = useState(() => Math.max(0, items.findIndex(item => item.id === (value ?? defaultValue ?? items[0]?.id))));

  const pick = (id: string) => {
    if (id === selected) return;
    if (value === undefined) setInner(id);
    onChange?.(id, items.find(item => item.id === id));
  };
  const pickRef = useRef(pick);
  pickRef.current = pick;

  // Number keys, anywhere, unless focus is in something you type into.
  useEffect(() => {
    if (!hotkeys) return undefined;
    const onKey = (event: KeyboardEvent) => {
      const t = event.target as HTMLElement;
      if (event.metaKey || event.ctrlKey || event.altKey || t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      const n = Number(event.key);
      if (n >= 1 && n <= Math.min(9, items.length)) pickRef.current(items[n - 1].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hotkeys, items]);

  // Magnify by distance from the pointer; the wheel cycles the selection while hovering.
  useEffect(() => {
    const bar = barRef.current!;
    const slots = () => [...bar.querySelectorAll<HTMLElement>('.bl-hotbar__slot')];
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const onMove = (event: PointerEvent) => {
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
    const onWheel = (event: WheelEvent) => {
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
  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, Home: -1e9, End: 1e9 };
    if (moves[event.key] === undefined) return;
    event.preventDefault();
    const next = Math.max(0, Math.min(items.length - 1, focusIndex + moves[event.key]));
    setFocusIndex(next);
    barRef.current!.querySelectorAll<HTMLElement>('.bl-hotbar__slot')[next]?.focus();
  };

  return (
    <div
      ref={barRef}
      className={`bl-hotbar ${className}`}
      role="toolbar"
      aria-label={label}
      onKeyDown={onKeyDown}
      style={{ '--bl-slot': `${slotSize}px`, '--bl-gap': `${gap}px`, '--bl-pad': `${padding}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-slot-bg': slotColor, '--bl-hover': hoverColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-line': lineColor, '--bl-select': selectColor, '--bl-accent': accentColor, '--bl-tip': tooltipColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          className="bl-hotbar__slot"
          aria-pressed={item.id === selected}
          aria-label={`${item.label}${item.count != null ? `, ${item.count}` : ''}${hotkeys && i < 9 ? ` (key ${i + 1})` : ''}`}
          tabIndex={i === focusIndex ? 0 : -1}
          onFocus={() => setFocusIndex(i)}
          onClick={() => pick(item.id)}
        >
          {hotkeys && i < 9 && (
            <span className="bl-hotbar__key" aria-hidden="true">
              {i + 1}
            </span>
          )}
          <span className="bl-hotbar__icon" aria-hidden="true">
            {item.icon}
          </span>
          {item.count != null && (
            <span className="bl-hotbar__count" aria-hidden="true">
              {item.count}
            </span>
          )}
          <span className="bl-hotbar__tip" aria-hidden="true">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
