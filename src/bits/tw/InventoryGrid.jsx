import { useCallback, useEffect, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Game inventory grid. Drag items between slots (mouse, pen or touch): dropping on an empty slot
// moves, on the same item merges stacks up to `maxStack`, on anything else swaps.
// Keyboard: arrows move, Enter/Space picks up and drops, Escape cancels. Changes are announced.
// Items: { id, name, icon, count?, rarity?: 'common'|'uncommon'|'rare'|'epic'|'legendary', description? }

const STYLE_ID = 'bl-inventory-tw';
const CSS = `
/* theme tokens */
.bl-inv { --bl-panel: #333c57; --bl-slot-bg: #1a1c2c; --bl-hover: #29366f; --bl-accent: #ffcd75; }
:where(.light, [data-theme="light"]) .bl-inv, .bl-inv:where(.light, [data-theme="light"]) { --bl-panel: #ddd4c0; --bl-slot-bg: #f4f1e8; --bl-hover: #d6dcef; --bl-accent: #a86a12; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-inv, :where(.light, [data-theme="light"]) .bl-inv:where(.dark, [data-theme="dark"]) { --bl-panel: #333c57; --bl-slot-bg: #1a1c2c; --bl-hover: #29366f; --bl-accent: #ffcd75; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-inv, .bl-inv:where([data-theme="system"]) { --bl-panel: #ddd4c0; --bl-slot-bg: #f4f1e8; --bl-hover: #d6dcef; --bl-accent: #a86a12; } }
/* theme tokens end */
@keyframes bl-inv-pop { 0% { transform: scale(0.6); } 60% { transform: scale(1.2); } 100% { transform: scale(1); } }
@keyframes bl-inv-held { 50% { box-shadow: inset 0 0 0 3px transparent; } }
@keyframes bl-inv-shine { from { background-position: 150% 0; } to { background-position: -150% 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export const RARITY_COLORS = { common: '#94b0c2', uncommon: '#38b764', rare: '#41a6f6', epic: '#c447a6', legendary: '#ffcd75' };

const describe = item => (item ? `${item.name}${item.count > 1 ? ` ×${item.count}` : ''}${item.rarity ? `, ${item.rarity}` : ''}` : 'empty');

// Returns the next slot array after moving `from` onto `to`, plus what happened.
export function moveItem(slots, from, to, maxStack = 64) {
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
  panelColor,
  slotColor,
  hoverColor,
  accentColor,
  label = 'Inventory',
  fontFamily,
  onChange,
  className = '',
  style
}) {
  useStyles();
  const [slots, setSlots] = useState(items);
  const [focus, setFocus] = useState(0);
  const [held, setHeld] = useState(null);
  const [drag, setDrag] = useState(null);
  const [over, setOver] = useState(null);
  const [landed, setLanded] = useState({ index: null, key: 0 });
  const [hover, setHover] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const gridRef = useRef(null);
  const slotRefs = useRef([]);

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
    (from, to) => {
      const { slots: next, action } = moveItem(slots, from, to, maxStack);
      if (!action) return;
      setSlots(next);
      setLanded(current => ({ index: to, key: current.key + 1 }));
      setAnnouncement(`${slots[from]?.name} ${action} to slot ${to + 1}.`);
      onChange?.(next, { from, to, action });
    },
    [slots, maxStack, onChange]
  );

  const focusSlot = index => {
    setFocus(index);
    slotRefs.current[index]?.focus();
  };

  const onKeyDown = (event, index) => {
    const moves = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns };
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
  const onPointerDown = (event, index) => {
    if (!slots[index] || event.button > 0) return;
    const startX = event.clientX;
    const startY = event.clientY;
    const el = event.currentTarget;
    el.setPointerCapture(event.pointerId);
    let dragging = false;

    const slotAt = (x, y) => {
      const target = document.elementFromPoint(x, y)?.closest('[data-slot-index]');
      return target && gridRef.current?.contains(target) ? Number(target.dataset.slotIndex) : null;
    };
    const move = e => {
      if (!dragging && Math.hypot(e.clientX - startX, e.clientY - startY) < 5) return;
      dragging = true;
      setDrag({ index, x: e.clientX, y: e.clientY });
      setOver(slotAt(e.clientX, e.clientY));
      setHover(null);
    };
    const up = e => {
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
      className={`bl-inv relative inline-grid max-w-full touch-none grid-cols-[repeat(var(--bl-cols),var(--bl-fit))] gap-1.5 bg-(--bl-panel) p-3 [font-family:var(--bl-font,'Press_Start_2P',ui-monospace,monospace)] shadow-[0_-4px_0_0_#0b0b14,0_4px_0_0_#0b0b14,-4px_0_0_0_#0b0b14,4px_0_0_0_#0b0b14,8px_8px_0_4px_rgba(11,11,20,0.4)] ${className}`}
      style={{
        '--bl-cols': columns,
        '--bl-fit': `${fit}px`,
        '--bl-panel': panelColor,
        '--bl-slot-bg': slotColor,
        '--bl-hover': hoverColor,
        '--bl-accent': accentColor,
        ...(fontFamily ? { '--bl-font': fontFamily } : null),
        ...style
      }}
    >
      {slots.map((item, index) => (
        <button
          key={index}
          ref={el => {
            slotRefs.current[index] = el;
          }}
          type="button"
          role="gridcell"
          className="group/slot relative grid size-(--bl-fit) cursor-grab place-items-center border-0 bg-(--bl-slot-bg) p-0 shadow-[inset_3px_3px_0_0_rgba(0,0,0,0.45),inset_-3px_-3px_0_0_rgba(255,255,255,0.08),inset_0_0_0_3px_var(--bl-rarity,transparent)] focus-visible:z-1 focus-visible:outline-3 focus-visible:outline-offset-1 focus-visible:outline-[#f4f4f4] focus-visible:outline-solid data-[empty]:cursor-default data-[held]:animate-[bl-inv-held_0.6s_steps(2)_infinite] data-[held]:shadow-[inset_0_0_0_3px_var(--bl-accent)] data-[over]:bg-(--bl-hover) data-[rarity=legendary]:after:pointer-events-none data-[rarity=legendary]:after:absolute data-[rarity=legendary]:after:inset-[3px] data-[rarity=legendary]:after:animate-[bl-inv-shine_2.4s_steps(12)_infinite] data-[rarity=legendary]:after:bg-[linear-gradient(115deg,transparent_35%,rgba(255,205,117,0.35)_50%,transparent_65%)] data-[rarity=legendary]:after:bg-[length:250%_100%] motion-reduce:data-[held]:animate-none motion-reduce:data-[rarity=legendary]:after:animate-none"
          data-slot-index={index}
          data-empty={!item || undefined}
          data-rarity={item?.rarity}
          data-over={(drag && over === index) || undefined}
          data-source={drag?.index === index || undefined}
          data-held={held === index || undefined}
          data-landed={landed.index === index ? landed.key : undefined}
          tabIndex={focus === index ? 0 : -1}
          aria-label={`Slot ${index + 1}: ${describe(item)}`}
          style={{ '--bl-rarity': item?.rarity ? RARITY_COLORS[item.rarity] : undefined }}
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
            <span className="pointer-events-none grid size-[78%] place-items-center *:max-h-full *:max-w-full group-data-[landed]/slot:animate-[bl-inv-pop_260ms_steps(4)] group-data-[source]/slot:opacity-25 motion-reduce:group-data-[landed]/slot:animate-none" key={landed.index === index ? landed.key : 'item'}>
              {item.icon}
            </span>
          )}
          {item?.count > 1 && <span className="pointer-events-none absolute right-1 bottom-[3px] text-[10px] leading-none text-[#f4f4f4] [text-shadow:2px_2px_0_#0b0b14]">{item.count}</span>}
        </button>
      ))}

      {tipItem && tipRect && gridRect && (
        <div
          className="pointer-events-none absolute z-2 max-w-[240px] min-w-[180px] bg-[#0b0b14] px-3 py-2.5 text-[#f4f4f4] shadow-[0_0_0_3px_var(--bl-tip-border,#5d275d)] [transform:translate(-50%,calc(-100%_-_10px))]"
          role="tooltip"
          style={{
            left: tipRect.left - gridRect.left + tipRect.width / 2,
            top: tipRect.top - gridRect.top,
            '--bl-tip-color': RARITY_COLORS[tipItem.rarity] ?? '#f4f4f4',
            '--bl-tip-border': RARITY_COLORS[tipItem.rarity] ?? '#5d275d'
          }}
        >
          <p className="m-0 mb-1.5 text-[10px] leading-[1.4] text-[var(--bl-tip-color,#f4f4f4)] uppercase">{tipItem.name}</p>
          <p className="m-0 mb-1.5 text-[8px] text-[#94b0c2] uppercase">
            {tipItem.rarity ?? 'common'}
            {tipItem.count > 1 ? ` · ×${tipItem.count}` : ''}
          </p>
          {tipItem.description && <p className="m-0 [font:13px/1.35_var(--bl-body,ui-monospace,monospace)] text-[#94b0c2]">{tipItem.description}</p>}
        </div>
      )}

      {drag && slots[drag.index] && (
        <div className="pointer-events-none fixed z-9999 grid size-(--bl-fit) place-items-center [filter:drop-shadow(4px_4px_0_rgba(11,11,20,0.55))] [transform:translate(-50%,-50%)_scale(1.15)]" style={{ left: drag.x, top: drag.y }} aria-hidden="true">
          <span className="pointer-events-none grid size-[78%] place-items-center *:max-h-full *:max-w-full group-data-[landed]/slot:animate-[bl-inv-pop_260ms_steps(4)] group-data-[source]/slot:opacity-25 motion-reduce:group-data-[landed]/slot:animate-none">{slots[drag.index].icon}</span>
        </div>
      )}
      <span className="sr-only" aria-live="assertive">
        {announcement}
      </span>
    </div>
  );
}
