import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A row you swipe to act on, like a mail list or a toast. Drag it sideways to uncover the
// actions underneath; let go part way and it rests open, swipe all the way and the first action
// on that side fires and the row slides off. Keyboard and screen-reader users get the same
// actions as plain buttons in an "Actions" menu on the row. Reduced motion opens and closes
// without sliding.

const STYLE_ID = 'bl-swipe-actions-tw';
const CSS = `
@keyframes bl-swipe-collapse { to { height: 0; opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface SwipeAction {
  label: string;
  icon?: ReactNode;
  /** Background colour of the action. */
  color?: string;
  onSelect?: () => void;
}

export interface SwipeActionsProps {
  children?: ReactNode;
  /** Revealed by swiping right; the first fires on a full swipe. */
  leftActions?: SwipeAction[];
  /** Revealed by swiping left; the first fires on a full swipe. */
  rightActions?: SwipeAction[];
  /** Swiping past 60% fires the first action and slides the row away. */
  fullSwipe?: boolean;
  actionWidth?: number;
  /** Name of the keyboard actions menu. */
  label?: string;
  radius?: number;
  backgroundColor?: string;
  underColor?: string;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function SwipeActions({
  children,
  leftActions = [],
  rightActions = [],
  fullSwipe = true,
  actionWidth = 76,
  label = 'Actions',
  radius = 12,
  backgroundColor = '#262b44',
  underColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  accentColor = '#73eff7',
  fontFamily = 'inherit',
  className = '',
  style
}: SwipeActionsProps) {
  useStyles();
  const rootRef = useRef<HTMLDivElement>(null);
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [gone, setGone] = useState(false);
  const [menu, setMenu] = useState(false);
  const drag = useRef<{ start: number; from: number; moved: boolean } | null>(null);
  const leftW = leftActions.length * actionWidth;
  const rightW = rightActions.length * actionWidth;

  const fire = (action: SwipeAction, slideOff: boolean) => {
    if (slideOff) {
      const w = rootRef.current?.offsetWidth ?? 400;
      setX(Math.sign(x || (action === leftActions[0] ? 1 : -1)) * w);
      setGone(true);
    } else setX(0);
    setMenu(false);
    action.onSelect?.();
  };

  useEffect(() => {
    if (!menu) return undefined;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setMenu(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [menu]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button > 0 || gone || (event.target as Element).closest('button')) return;
    drag.current = { start: event.clientX, from: x, moved: false };
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = event.clientX - d.start;
    if (!d.moved && Math.abs(dx) > 6) {
      d.moved = true;
      setDragging(true);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }
    if (!d.moved) return;
    const w = rootRef.current!.offsetWidth;
    // Only the sides that have actions can open; past them the row resists a little.
    const max = leftActions.length ? (fullSwipe ? w : leftW) : 0;
    const min = rightActions.length ? -(fullSwipe ? w : rightW) : 0;
    let next = d.from + dx;
    if (next > leftW && !fullSwipe) next = leftW + (next - leftW) * 0.25;
    if (next < -rightW && !fullSwipe) next = -rightW + (next + rightW) * 0.25;
    setX(Math.max(min, Math.min(max, next)));
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    setDragging(false);
    const w = rootRef.current!.offsetWidth;
    if (fullSwipe && x > w * 0.6 && leftActions[0]) fire(leftActions[0], true);
    else if (fullSwipe && x < -w * 0.6 && rightActions[0]) fire(rightActions[0], true);
    else if (x > leftW / 2 && leftW) setX(leftW);
    else if (x < -rightW / 2 && rightW) setX(-rightW);
    else setX(0);
  };

  const all = [...leftActions, ...rightActions];
  const actionButton = (action: SwipeAction, i: number, tab: number) => (
    <button key={`${action.label}-${i}`} type="button" className="grid w-(--bl-action) cursor-pointer place-items-center content-center gap-1 border-0 bg-[var(--tone,#333c57)] px-1.5 py-0 text-[12px] font-bold text-white focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" tabIndex={tab} style={{ '--tone': action.color } as CSSVars} onClick={() => fire(action, false)}>
      {action.icon && <span aria-hidden="true">{action.icon}</span>}
      {action.label}
    </button>
  );

  return (
    <div
      ref={rootRef}
      className={`group/sw relative touch-pan-y overflow-hidden rounded-(--bl-radius) bg-(--bl-under) font-(family-name:--bl-font) text-(--bl-ink) data-[gone]:animate-[bl-swipe-collapse_260ms_ease_200ms_forwards] motion-reduce:data-[gone]:hidden motion-reduce:data-[gone]:animate-none ${className}`}
      data-dragging={dragging || undefined}
      data-gone={gone || undefined}
      style={{ '--x': `${x}px`, '--bl-action': `${actionWidth}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-under': underColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      {/* The swipe-revealed buttons are for pointers; keyboard users reach the same actions through the menu. */}
      <div className="absolute top-0 bottom-0 flex data-[side=left]:left-0 data-[side=right]:right-0 data-[side=right]:flex-row-reverse" data-side="left" aria-hidden="true">
        {leftActions.map((a, i) => actionButton(a, i, -1))}
      </div>
      <div className="absolute top-0 bottom-0 flex data-[side=left]:left-0 data-[side=right]:right-0 data-[side=right]:flex-row-reverse" data-side="right" aria-hidden="true">
        {rightActions.map((a, i) => actionButton(a, i, -1))}
      </div>
      <div className="relative z-1 flex cursor-grab items-center gap-2.5 bg-(--bl-bg) select-none [transform:translateX(var(--x))] [transition:transform_320ms_cubic-bezier(.3,1.2,.5,1)] group-data-[dragging]/sw:cursor-grabbing group-data-[dragging]/sw:[transition:none] group-data-[gone]/sw:[transition:transform_240ms_ease-in] motion-reduce:[transition:none]!" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <div className="min-w-0 flex-1">{children}</div>
        {all.length > 0 && (
          <button type="button" className="mr-2 grid size-8 flex-none cursor-pointer place-items-center rounded-[8px] border-0 bg-transparent p-0 text-(--bl-muted) opacity-0 group-hover/sw:opacity-70 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid aria-expanded:opacity-100 aria-expanded:outline-2 aria-expanded:outline-(--bl-accent) aria-expanded:outline-solid" aria-expanded={menu} aria-label={label} onClick={() => setMenu(m => !m)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <rect x="2" y="7" width="3" height="3" />
              <rect x="7" y="7" width="3" height="3" />
              <rect x="12" y="7" width="3" height="3" />
            </svg>
          </button>
        )}
      </div>
      {menu && (
        <div className="absolute top-1/2 right-12 z-2 flex gap-1.5 [transform:translateY(-50%)] [&_button]:h-8 [&_button]:w-auto [&_button]:rounded-[8px] [&_button]:px-3" role="group" aria-label={label}>
          {all.map((a, i) => actionButton(a, i, 0))}
        </div>
      )}
    </div>
  );
}
