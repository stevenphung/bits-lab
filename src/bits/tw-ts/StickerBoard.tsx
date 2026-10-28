import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A corkboard of stickers. Drag one and it lifts and tilts; drop it and it slaps down with a
// little wobble and lands on top of the pile. Hover a sticker and its corner peels up. Rotate
// with Shift + scroll (or the keyboard), and the layout can persist in localStorage. Every
// sticker is a focusable button: arrows move it (Shift for bigger steps), [ and ] rotate,
// and each move is announced.

const STYLE_ID = 'bl-sticker-board-tw';
const CSS = `
@keyframes bl-sticker-slap { 0% { transform: scale(1.08); } 45% { transform: scale(0.94) rotate(2deg); } 100% { transform: none; } }
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
      className={`relative h-(--bl-h) w-full touch-none overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) ${className}`}
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
            className="group/sticker absolute top-0 left-0 w-(--s) cursor-grab touch-none border-0 bg-none p-0 outline-none [transform:translate(var(--x),var(--y))_rotate(var(--r))] [filter:drop-shadow(0_4px_6px_rgba(0,0,0,0.35))] [transition:transform_380ms_cubic-bezier(.3,1.5,.5,1),filter_200ms] data-[dragging]:cursor-grabbing data-[dragging]:[filter:drop-shadow(0_18px_18px_rgba(0,0,0,0.45))] data-[dragging]:[transition:filter_200ms] motion-reduce:[transition:none]"
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
            <span className="relative block overflow-hidden rounded-(--bl-sticker-radius) bg-(--bl-paper) shadow-[0_0_0_4px_var(--bl-paper)] [transition:transform_300ms_cubic-bezier(.3,1.5,.5,1)] [&>img]:block [&>img]:h-auto [&>img]:w-full [&>svg]:block [&>svg]:h-auto [&>svg]:w-full group-data-[dragging]/sticker:[transform:scale(1.08)_rotate(-3deg)] group-focus-visible/sticker:shadow-[0_0_0_4px_var(--bl-paper),0_0_0_7px_var(--bl-accent)] group-data-[landed]/sticker:animate-[bl-sticker-slap_420ms_cubic-bezier(.3,1.6,.5,1)] motion-reduce:[transition:none] motion-reduce:group-data-[landed]/sticker:animate-none motion-reduce:group-data-[dragging]/sticker:[transform:none]">
              {typeof sticker.content === 'string' ? <img src={sticker.content} alt="" draggable={false} /> : sticker.content}
              <span className="pointer-events-none absolute -right-1 -bottom-1 size-0 rounded-tl-[6px] bg-[linear-gradient(135deg,transparent_50%,var(--bl-peel)_50%,color-mix(in_srgb,var(--bl-peel)_70%,#000))] shadow-[-2px_-2px_4px_rgba(0,0,0,0.25)] [transition:width_220ms_cubic-bezier(.3,1.4,.5,1),height_220ms_cubic-bezier(.3,1.4,.5,1)] group-hover/sticker:size-[26%] group-focus-visible/sticker:size-[26%] motion-reduce:[transition:none]" aria-hidden="true" />
            </span>
          </button>
        );
      })}
      <p id={`${uid}-help`} className="sr-only">
        Drag stickers to move them. With a sticker focused, arrow keys move it, Shift for bigger steps, square brackets rotate it, Enter brings it to the front.
      </p>
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
