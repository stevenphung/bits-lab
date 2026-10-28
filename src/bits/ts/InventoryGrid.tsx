import { useCallback, useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type KeyboardEvent, type PointerEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Game inventory grid. Drag items between slots (mouse, pen or touch): dropping on an empty slot
// moves, on the same item merges stacks up to `maxStack`, on anything else swaps.
// Keyboard: arrows move, Enter/Space picks up and drops, Escape cancels. Changes are announced.
// Items: { id, name, icon, count?, rarity?: 'common'|'uncommon'|'rare'|'epic'|'legendary', description? }

const STYLE_ID = 'bl-inventory';
const CSS = `
.bl-inv { position: relative; display: inline-grid; max-width: 100%; gap: 6px; padding: 12px; background: var(--bl-panel); font-family: var(--bl-font, "Press Start 2P", ui-monospace, monospace);
  grid-template-columns: repeat(var(--bl-cols), var(--bl-fit)); touch-action: none;
  box-shadow: 0 -4px 0 0 #0b0b14, 0 4px 0 0 #0b0b14, -4px 0 0 0 #0b0b14, 4px 0 0 0 #0b0b14, 8px 8px 0 4px rgba(11,11,20,0.4); }
.bl-inv__slot { position: relative; display: grid; place-items: center; width: var(--bl-fit); height: var(--bl-fit); padding: 0; border: 0; background: var(--bl-slot-bg); cursor: grab;
  box-shadow: inset 3px 3px 0 0 rgba(0,0,0,0.45), inset -3px -3px 0 0 rgba(255,255,255,0.08), inset 0 0 0 3px var(--bl-rarity, transparent); }
.bl-inv__slot[data-empty] { cursor: default; }
.bl-inv__slot:focus-visible { outline: 3px solid #f4f4f4; outline-offset: 1px; z-index: 1; }
.bl-inv__slot[data-over] { background: var(--bl-hover); }
.bl-inv__slot[data-source] > .bl-inv__item { opacity: 0.25; }
.bl-inv__slot[data-held] { box-shadow: inset 0 0 0 3px var(--bl-accent); animation: bl-inv-held 0.6s steps(2) infinite; }
.bl-inv__slot[data-landed] > .bl-inv__item { animation: bl-inv-pop 260ms steps(4); }
.bl-inv__slot[data-rarity="legendary"]::after { content: ""; position: absolute; inset: 3px; pointer-events: none; background: linear-gradient(115deg, transparent 35%, rgba(255,205,117,0.35) 50%, transparent 65%); background-size: 250% 100%; animation: bl-inv-shine 2.4s steps(12) infinite; }
.bl-inv__item { display: grid; place-items: center; width: 78%; height: 78%; pointer-events: none; }
.bl-inv__item > * { max-width: 100%; max-height: 100%; }
.bl-inv__count { position: absolute; right: 4px; bottom: 3px; color: #f4f4f4; font-size: 10px; line-height: 1; text-shadow: 2px 2px 0 #0b0b14; pointer-events: none; }
.bl-inv__ghost { position: fixed; z-index: 9999; display: grid; place-items: center; width: var(--bl-fit); height: var(--bl-fit); pointer-events: none; transform: translate(-50%, -50%) scale(1.15); filter: drop-shadow(4px 4px 0 rgba(11,11,20,0.55)); }
.bl-inv__tip { position: absolute; z-index: 2; min-width: 180px; max-width: 240px; padding: 10px 12px; background: #0b0b14; color: #f4f4f4; pointer-events: none;
  box-shadow: 0 0 0 3px var(--bl-tip-border, #5d275d); transform: translate(-50%, calc(-100% - 10px)); }
.bl-inv__tip-name { margin: 0 0 6px; font-size: 10px; line-height: 1.4; color: var(--bl-tip-color, #f4f4f4); text-transform: uppercase; }
.bl-inv__tip-meta { margin: 0 0 6px; font-size: 8px; color: #94b0c2; text-transform: uppercase; }
.bl-inv__tip-desc { margin: 0; font: 13px/1.35 var(--bl-body, ui-monospace, monospace); color: #94b0c2; }
.bl-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-inv-pop { 0% { transform: scale(0.6); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
@keyframes bl-inv-held { 50% { box-shadow: inset 0 0 0 3px transparent; } }
@keyframes bl-inv-shine { from { background-position: 150% 0; } to { background-position: -150% 0; } }
@media (prefers-reduced-motion: reduce) {
  .bl-inv__slot[data-held], .bl-inv__slot[data-landed] > .bl-inv__item, .bl-inv__slot[data-rarity="legendary"]::after { animation: none; }
}
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface InventoryItem {
  /** Items with the same id stack. */
  id: string;
  name: string;
  icon?: ReactNode;
  count?: number;
  rarity?: Rarity;
  /** Shown in the tooltip. */
  description?: ReactNode;
}

export type InventorySlot = InventoryItem | null;
export type MoveAction = 'moved' | 'merged' | 'swapped';

export interface InventoryGridProps {
  /** Slots, left to right; null is an empty slot. */
  items?: InventorySlot[];
  columns?: number;
  /** Slot size, in px (shrinks to fit narrow containers). */
  slotSize?: number;
  /** Same-id items merge up to this count; the rest stays behind. */
  maxStack?: number;
  panelColor?: string;
  slotColor?: string;
  hoverColor?: string;
  /** Highlight for the held item. */
  accentColor?: string;
  /** Accessible name of the grid. */
  label?: string;
  fontFamily?: string;
  /** Called after every move. */
  onChange?: (slots: InventorySlot[], move: { from: number; to: number; action: MoveAction }) => void;
  className?: string;
  style?: CSSProperties;
}

export const RARITY_COLORS: Record<Rarity, string> = { common: '#94b0c2', uncommon: '#38b764', rare: '#41a6f6', epic: '#c447a6', legendary: '#ffcd75' };

const describe = (item: InventorySlot) => (item ? `${item.name}${item.count! > 1 ? ` ×${item.count}` : ''}${item.rarity ? `, ${item.rarity}` : ''}` : 'empty');

// Returns the next slot array after moving `from` onto `to`, plus what happened.
export function moveItem(slots: InventorySlot[], from: number, to: number, maxStack = 64): { slots: InventorySlot[]; action: MoveAction | null } {
  const next = [...slots];
  const source = next[from];
  const target = next[to];
  if (!source || from === to) return { slots, action: null };
  if (!target) {
    next[to] = source;
    next[from] = null;
    return { slots: next, action: 'moved' };
  }
  if (target.id === source.id && (target.count ?? 1) < maxStack) {
    const total = (target.count ?? 1) + (source.count ?? 1);
    next[to] = { ...target, count: Math.min(maxStack, total) };
    next[from] = total > maxStack ? { ...source, count: total - maxStack } : null;
    return { slots: next, action: 'merged' };
  }
  next[to] = source;
  next[from] = target;
  return { slots: next, action: 'swapped' };
}

export default function InventoryGrid({
  items = [],
  columns = 6,
  slotSize = 64,
  maxStack = 64,
  panelColor = '#333c57',
  slotColor = '#1a1c2c',
  hoverColor = '#29366f',
  accentColor = '#ffcd75',
  label = 'Inventory',
  fontFamily,
  onChange,
  className = '',
  style
}: InventoryGridProps) {
  useStyles();
  const [slots, setSlots] = useState<InventorySlot[]>(items);
  const [focus, setFocus] = useState(0);
  const [held, setHeld] = useState<number | null>(null);
  const [drag, setDrag] = useState<{ index: number; x: number; y: number } | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [landed, setLanded] = useState<{ index: number | null; key: number }>({ index: null, key: 0 });
  const [hover, setHover] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => setSlots(items), [items]);

  // Shrink slots to fit narrow containers (grid padding 12px ×2, gaps 6px, notch border 8px).
  const [fit, setFit] = useState(slotSize);
  useEffect(() => {
    const parent = gridRef.current?.parentElement;
    if (!parent) return undefined;
    const measure = () => {
      const available = parent.clientWidth - 24 - 8 - (columns - 1) * 6;
      setFit(Math.max(28, Math.min(slotSize, Math.floor(available / columns))));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(parent);
    measure();
    return () => observer.disconnect();
  }, [slotSize, columns]);

  const commit = useCallback(
    (from: number, to: number) => {
      const { slots: next, action } = moveItem(slots, from, to, maxStack);
      if (!action) return;
      setSlots(next);
      setLanded(current => ({ index: to, key: current.key + 1 }));
      setAnnouncement(`${slots[from]?.name} ${action} to slot ${to + 1}.`);
      onChange?.(next, { from, to, action });
    },
    [slots, maxStack, onChange]
  );

  const focusSlot = (index: number) => {
    setFocus(index);
    slotRefs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns };
    if (moves[event.key] !== undefined) {
      event.preventDefault();
      const next = index + moves[event.key];
      if (next >= 0 && next < slots.length) focusSlot(next);
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      focusSlot(event.key === 'Home' ? 0 : slots.length - 1);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (held === null) {
        if (!slots[index]) return;
        setHeld(index);
        setAnnouncement(`Picked up ${describe(slots[index])}. Move with arrow keys, press Enter to drop.`);
      } else {
        commit(held, index);
        if (held === index) setAnnouncement('Put back.');
        setHeld(null);
      }
      return;
    }
    if (event.key === 'Escape' && held !== null) {
      setHeld(null);
      setAnnouncement('Cancelled.');
    }
  };

  // Pointer drag with a small threshold so a tap still just focuses the slot.
  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, index: number) => {
    if (!slots[index] || event.button > 0) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const el = event.currentTarget;
    el.setPointerCapture(event.pointerId);
    let dragging = false;

    const slotAt = (x: number, y: number) => {
      const target = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-slot-index]');
      return target && gridRef.current?.contains(target) ? Number(target.dataset.slotIndex) : null;
    };
    const move = (e: globalThis.PointerEvent) => {
      if (!dragging && Math.hypot(e.clientX - startX, e.clientY - startY) < 5) return;
      dragging = true;
      setDrag({ index, x: e.clientX, y: e.clientY });
      setOver(slotAt(e.clientX, e.clientY));
      setHover(null);
    };
    const up = (e: globalThis.PointerEvent) => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      if (dragging) {
        const to = e.type === 'pointerup' ? slotAt(e.clientX, e.clientY) : null;
        if (to !== null) commit(index, to);
      }
      setDrag(null);
      setOver(null);
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  };

  const tipItem = hover !== null && !drag ? slots[hover] : null;
  const tipEl = hover !== null ? slotRefs.current[hover] : null;
  const gridRect = gridRef.current?.getBoundingClientRect();
  const tipRect = tipEl?.getBoundingClientRect();

  return (
    <div
      ref={gridRef}
      role="grid"
      aria-label={label}
      className={`bl-inv ${className}`}
      style={{
        '--bl-cols': columns,
        '--bl-fit': `${fit}px`,
        '--bl-panel': panelColor,
        '--bl-slot-bg': slotColor,
        '--bl-hover': hoverColor,
        '--bl-accent': accentColor,
        ...(fontFamily ? { '--bl-font': fontFamily } : null),
        ...style
      } as CSSVars}
    >
      {slots.map((item, index) => (
        <button
          key={index}
          ref={el => {
            slotRefs.current[index] = el;
          }}
          type="button"
          role="gridcell"
          className="bl-inv__slot"
          data-slot-index={index}
          data-empty={!item || undefined}
          data-rarity={item?.rarity}
          data-over={(drag && over === index) || undefined}
          data-source={drag?.index === index || undefined}
          data-held={held === index || undefined}
          data-landed={landed.index === index ? landed.key : undefined}
          tabIndex={focus === index ? 0 : -1}
          aria-label={`Slot ${index + 1}: ${describe(item)}`}
          style={{ '--bl-rarity': item?.rarity ? RARITY_COLORS[item.rarity] : undefined } as CSSVars}
          onFocus={() => {
            setFocus(index);
            setHover(index);
          }}
          onBlur={() => setHover(current => (current === index ? null : current))}
          onPointerEnter={() => setHover(index)}
          onPointerLeave={() => setHover(current => (current === index ? null : current))}
          onPointerDown={event => onPointerDown(event, index)}
          onKeyDown={event => onKeyDown(event, index)}
        >
          {item && (
            <span className="bl-inv__item" key={landed.index === index ? landed.key : 'item'}>
              {item.icon}
            </span>
          )}
          {item?.count! > 1 && <span className="bl-inv__count">{item!.count}</span>}
        </button>
      ))}

      {tipItem && tipRect && gridRect && (
        <div
          className="bl-inv__tip"
          role="tooltip"
          style={{
            left: tipRect.left - gridRect.left + tipRect.width / 2,
            top: tipRect.top - gridRect.top,
            '--bl-tip-color': RARITY_COLORS[tipItem.rarity!] ?? '#f4f4f4',
            '--bl-tip-border': RARITY_COLORS[tipItem.rarity!] ?? '#5d275d'
          } as CSSVars}
        >
          <p className="bl-inv__tip-name">{tipItem.name}</p>
          <p className="bl-inv__tip-meta">
            {tipItem.rarity ?? 'common'}
            {tipItem.count! > 1 ? ` · ×${tipItem.count}` : ''}
          </p>
          {tipItem.description && <p className="bl-inv__tip-desc">{tipItem.description}</p>}
        </div>
      )}

      {drag && slots[drag.index] && (
        <div className="bl-inv__ghost" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <span className="bl-inv__item">{slots[drag.index]!.icon}</span>
        </div>
      )}
      <span className="bl-sr" aria-live="assertive">
        {announcement}
      </span>
    </div>
  );
}
