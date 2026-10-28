import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A corkboard of stickers. Drag one and it lifts and tilts; drop it and it slaps down with a
// little wobble and lands on top of the pile. Hover a sticker and its corner peels up. Rotate
// with Shift + scroll (or the keyboard), and the layout can persist in localStorage. Every
// sticker is a focusable button: arrows move it (Shift for bigger steps), [ and ] rotate,
// and each move is announced.

const STYLE_ID = 'bl-sticker-board';
const CSS = `
.bl-stickers { position: relative; width: 100%; height: var(--bl-h); overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-bg); touch-action: none; }
.bl-sticker { position: absolute; left: 0; top: 0; width: var(--s); padding: 0; border: 0; background: none; cursor: grab; touch-action: none; transform: translate(var(--x), var(--y)) rotate(var(--r)); transition: transform 380ms cubic-bezier(.3,1.5,.5,1), filter 200ms; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35)); outline: none; }
.bl-sticker[data-dragging] { cursor: grabbing; transition: filter 200ms; filter: drop-shadow(0 18px 18px rgba(0,0,0,0.45)); }
.bl-sticker__body { position: relative; display: block; overflow: hidden; border-radius: var(--bl-sticker-radius); background: var(--bl-paper); box-shadow: 0 0 0 4px var(--bl-paper); transition: transform 300ms cubic-bezier(.3,1.5,.5,1); }
.bl-sticker[data-dragging] .bl-sticker__body { transform: scale(1.08) rotate(-3deg); }
.bl-sticker__body > img, .bl-sticker__body > svg { display: block; width: 100%; height: auto; }
.bl-sticker__peel { position: absolute; right: -4px; bottom: -4px; width: 0; height: 0; background: linear-gradient(135deg, transparent 50%, var(--bl-peel) 50%, color-mix(in srgb, var(--bl-peel) 70%, #000)); border-top-left-radius: 6px; box-shadow: -2px -2px 4px rgba(0,0,0,0.25); transition: width 220ms cubic-bezier(.3,1.4,.5,1), height 220ms cubic-bezier(.3,1.4,.5,1); pointer-events: none; }
.bl-sticker:hover .bl-sticker__peel, .bl-sticker:focus-visible .bl-sticker__peel { width: 26%; height: 26%; }
.bl-sticker:focus-visible .bl-sticker__body { box-shadow: 0 0 0 4px var(--bl-paper), 0 0 0 7px var(--bl-accent); }
.bl-sticker[data-landed] .bl-sticker__body { animation: bl-sticker-slap 420ms cubic-bezier(.3,1.6,.5,1); }
.bl-stickers__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-sticker-slap { 0% { transform: scale(1.08); } 45% { transform: scale(0.94) rotate(2deg); } 100% { transform: none; } }
@media (prefers-reduced-motion: reduce) { .bl-sticker, .bl-sticker__body, .bl-sticker__peel { transition: none; } .bl-sticker[data-landed] .bl-sticker__body { animation: none; } .bl-sticker[data-dragging] .bl-sticker__body { transform: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface Sticker {
  id: string;
  /** Accessible name. */
  label?: string;
  /** An image URL or any node. */
  content?: ReactNode;
  x?: number;
  y?: number;
  /** Starting rotation in degrees. */
  rotate?: number;
  /** Width in px. */
  size?: number;
}

/** Position (px), rotation (deg) and stacking order per sticker id. */
export type StickerLayout = Record<string, { x: number; y: number; r: number; z: number }>;

export interface StickerBoardProps {
  stickers?: Sticker[];
  height?: number;
  /** Save the layout in localStorage under this key. */
  storageKey?: string;
  onChange?: (layout: StickerLayout) => void;
  radius?: number;
  stickerRadius?: number;
  backgroundColor?: string;
  /** The sticker's white edge. */
  paperColor?: string;
  peelColor?: string;
  accentColor?: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

const load = (key?: string): StickerLayout | null => {
  try {
    return key ? JSON.parse(localStorage.getItem(key) ?? 'null') : null;
  } catch {
    return null;
  }
};

export default function StickerBoard({
  stickers = [],
  height = 420,
  storageKey,
  onChange,
  radius = 16,
  stickerRadius = 12,
  backgroundColor = '#5d275d',
  paperColor = '#f4f4f4',
  peelColor = '#e8e8e8',
  accentColor = '#73eff7',
  label = 'Sticker board',
  className = '',
  style
}: StickerBoardProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const boardRef = useRef<HTMLDivElement>(null);
  // Layout per sticker: position (px), rotation (deg) and stacking order.
  const [layout, setLayout] = useState<StickerLayout>(() => {
    const saved = load(storageKey);
    return Object.fromEntries(stickers.map((s, i) => [s.id, saved?.[s.id] ?? { x: s.x ?? 20 + i * 40, y: s.y ?? 20 + i * 30, r: s.rotate ?? 0, z: i }]));
  });
  const [dragging, setDragging] = useState<string | null>(null);
  const [landed, setLanded] = useState<string | null>(null);
  const [announce, setAnnounce] = useState('');
  const drag = useRef<{ id: string; startX: number; startY: number; x: number; y: number; moved: boolean } | null>(null);

  // Persist and report.
  useEffect(() => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(layout));
      } catch {
        // Storage is full or blocked; the board still works for this visit.
      }
    }
    onChange?.(layout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, storageKey]);

  const topZ = () => Math.max(0, ...Object.values(layout).map(l => l.z)) + 1;

  // Keep a sticker inside the board: at least `inside` of it visible (drags may peek off).
  const clamp = (id: string, x: number, y: number, inside = 0.5) => {
    const board = boardRef.current;
    const node = board?.querySelector<HTMLElement>(`[data-id="${id}"]`);
    if (!board || !node) return { x, y };
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    const out = (1 - inside) * 0.6;
    return { x: Math.max(-w * out, Math.min(board.clientWidth - w * inside, x)), y: Math.max(-h * out, Math.min(board.clientHeight - h * inside, y)) };
  };

  // Pull stickers back inside when the board is (or becomes) narrower than their positions.
  useEffect(() => {
    const board = boardRef.current!;
    const fit = () =>
      setLayout(current => {
        let changed = false;
        const next = { ...current };
        Object.entries(current).forEach(([id, l]) => {
          const { x, y } = clamp(id, l.x, l.y, 1);
          if (x !== l.x || y !== l.y) {
            next[id] = { ...l, x, y };
            changed = true;
          }
        });
        return changed ? next : current;
      });
    const resize = new ResizeObserver(fit);
    resize.observe(board);
    return () => resize.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (id: string, patch: Partial<StickerLayout[string]>) => setLayout(current => ({ ...current, [id]: { ...current[id], ...patch } }));

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    if (event.button !== 0) return;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointers can't be captured; the sticker still follows the moves.
    }
    event.currentTarget.focus({ preventScroll: true });
    drag.current = { id, startX: event.clientX, startY: event.clientY, x: layout[id].x, y: layout[id].y, moved: false };
    update(id, { z: topZ() });
    setDragging(id);
  };

  const onPointerMove = (event: ReactPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.startX;
    const dy = event.clientY - d.startY;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    update(d.id, clamp(d.id, d.x + dx, d.y + dy));
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    setDragging(null);
    setLanded(d.id);
    const name = stickers.find(s => s.id === d.id)?.label ?? 'Sticker';
    if (d.moved) setAnnounce(`${name} placed.`);
  };

  const onWheel = (event: WheelEvent, id: string) => {
    if (!event.shiftKey) return;
    event.preventDefault();
    update(id, { r: (layout[id].r + Math.sign(event.deltaY || event.deltaX) * 8) % 360 });
  };

  const onKeyDown = (event: ReactKeyboardEvent, id: string, name: string) => {
    const step = event.shiftKey ? 32 : 8;
    const l = layout[id];
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[event.key as keyof typeof moves]) {
      event.preventDefault();
      const [dx, dy] = moves[event.key as keyof typeof moves];
      const next = clamp(id, l.x + dx, l.y + dy);
      update(id, { ...next, z: topZ() });
      setAnnounce(`${name} moved to ${Math.round(next.x)}, ${Math.round(next.y)}.`);
    } else if (event.key === '[' || event.key === ']') {
      event.preventDefault();
      const r = (l.r + (event.key === ']' ? 15 : -15)) % 360;
      update(id, { r });
      setAnnounce(`${name} rotated to ${Math.round(r)} degrees.`);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      update(id, { z: topZ() });
      setLanded(id);
      setAnnounce(`${name} brought to the front.`);
    }
  };

  // Wheel listeners must be non-passive to stop the page scrolling while rotating.
  useEffect(() => {
    const board = boardRef.current!;
    const handler = (event: WheelEvent) => {
      const node = (event.target as Element).closest?.('[data-id]');
      if (node && event.shiftKey) onWheel(event, node.getAttribute('data-id')!);
    };
    board.addEventListener('wheel', handler, { passive: false });
    return () => board.removeEventListener('wheel', handler);
  });

  return (
    <div
      ref={boardRef}
      className={`bl-stickers ${className}`}
      role="group"
      aria-label={label}
      aria-describedby={`${uid}-help`}
      style={{ '--bl-h': `${height}px`, '--bl-radius': `${radius}px`, '--bl-sticker-radius': `${stickerRadius}px`, '--bl-bg': backgroundColor, '--bl-paper': paperColor, '--bl-peel': peelColor, '--bl-accent': accentColor, ...style } as CSSVars}
    >
      {stickers.map(sticker => {
        const l = layout[sticker.id];
        const name = sticker.label ?? 'Sticker';
        return (
          <button
            key={sticker.id}
            type="button"
            data-id={sticker.id}
            className="bl-sticker"
            aria-label={name}
            data-dragging={dragging === sticker.id || undefined}
            data-landed={landed === sticker.id || undefined}
            onAnimationEnd={() => landed === sticker.id && setLanded(null)}
            style={{ '--x': `${l.x}px`, '--y': `${l.y}px`, '--r': `${l.r}deg`, '--s': `${sticker.size ?? 120}px`, zIndex: l.z } as CSSVars}
            onPointerDown={event => onPointerDown(event, sticker.id)}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={event => onKeyDown(event, sticker.id, name)}
          >
            <span className="bl-sticker__body">
              {typeof sticker.content === 'string' ? <img src={sticker.content} alt="" draggable={false} /> : sticker.content}
              <span className="bl-sticker__peel" aria-hidden="true" />
            </span>
          </button>
        );
      })}
      <p id={`${uid}-help`} className="bl-stickers__sr">
        Drag stickers to move them. With a sticker focused, arrow keys move it, Shift for bigger steps, square brackets rotate it, Enter brings it to the front.
      </p>
      <span className="bl-stickers__sr" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
