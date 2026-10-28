import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A row you swipe to act on, like a mail list or a toast. Drag it sideways to uncover the
// actions underneath; let go part way and it rests open, swipe all the way and the first action
// on that side fires and the row slides off. Keyboard and screen-reader users get the same
// actions as plain buttons in an "Actions" menu on the row. Reduced motion opens and closes
// without sliding.

const STYLE_ID = 'bl-swipe-actions';
const CSS = `
/* theme tokens */
.bl-swipe { --bl-bg: #262b44; --bl-under: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-swipe, .bl-swipe:where(.light, [data-theme="light"]) { --bl-bg: #ebe5d8; --bl-under: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-swipe, :where(.light, [data-theme="light"]) .bl-swipe:where(.dark, [data-theme="dark"]) { --bl-bg: #262b44; --bl-under: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-swipe, .bl-swipe:where([data-theme="system"]) { --bl-bg: #ebe5d8; --bl-under: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-swipe { position: relative; overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-under); font-family: var(--bl-font); color: var(--bl-ink); touch-action: pan-y; }
.bl-swipe[data-gone] { animation: bl-swipe-collapse 260ms 200ms ease forwards; }
.bl-swipe__side { position: absolute; top: 0; bottom: 0; display: flex; }
.bl-swipe__side[data-side="left"] { left: 0; }
.bl-swipe__side[data-side="right"] { right: 0; flex-direction: row-reverse; }
.bl-swipe__action { display: grid; place-items: center; align-content: center; gap: 4px; width: var(--bl-action); padding: 0 6px; border: 0; background: var(--tone, #333c57); color: #fff; font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
.bl-swipe__action:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: -4px; }
.bl-swipe__row { position: relative; z-index: 1; display: flex; align-items: center; gap: 10px; background: var(--bl-bg); transform: translateX(var(--x)); transition: transform 320ms cubic-bezier(.3,1.2,.5,1); cursor: grab; user-select: none; }
.bl-swipe[data-dragging] .bl-swipe__row { transition: none; cursor: grabbing; }
.bl-swipe[data-gone] .bl-swipe__row { transition: transform 240ms ease-in; }
.bl-swipe__content { flex: 1; min-width: 0; }
.bl-swipe__menu { flex: none; display: grid; place-items: center; width: 32px; height: 32px; margin-right: 8px; padding: 0; border: 0; border-radius: 8px; background: transparent; color: var(--bl-muted); cursor: pointer; opacity: 0; }
.bl-swipe:hover .bl-swipe__menu { opacity: 0.7; }
.bl-swipe__menu:focus-visible, .bl-swipe__menu[aria-expanded="true"] { opacity: 1; outline: 2px solid var(--bl-accent); }
.bl-swipe__list { position: absolute; z-index: 2; top: 50%; right: 48px; display: flex; gap: 6px; transform: translateY(-50%); }
.bl-swipe__list .bl-swipe__action { width: auto; height: 32px; padding: 0 12px; border-radius: 8px; }
@keyframes bl-swipe-collapse { to { height: 0; opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .bl-swipe__row, .bl-swipe[data-gone] .bl-swipe__row { transition: none; } .bl-swipe[data-gone] { animation: none; display: none; } }
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
  backgroundColor,
  underColor,
  textColor,
  mutedColor,
  accentColor,
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
    <button key={`${action.label}-${i}`} type="button" className="bl-swipe__action" tabIndex={tab} style={{ '--tone': action.color } as CSSVars} onClick={() => fire(action, false)}>
      {action.icon && <span aria-hidden="true">{action.icon}</span>}
      {action.label}
    </button>
  );

  return (
    <div
      ref={rootRef}
      className={`bl-swipe ${className}`}
      data-dragging={dragging || undefined}
      data-gone={gone || undefined}
      style={{ '--x': `${x}px`, '--bl-action': `${actionWidth}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-under': underColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      {/* The swipe-revealed buttons are for pointers; keyboard users reach the same actions through the menu. */}
      <div className="bl-swipe__side" data-side="left" aria-hidden="true">
        {leftActions.map((a, i) => actionButton(a, i, -1))}
      </div>
      <div className="bl-swipe__side" data-side="right" aria-hidden="true">
        {rightActions.map((a, i) => actionButton(a, i, -1))}
      </div>
      <div className="bl-swipe__row" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
        <div className="bl-swipe__content">{children}</div>
        {all.length > 0 && (
          <button type="button" className="bl-swipe__menu" aria-expanded={menu} aria-label={label} onClick={() => setMenu(m => !m)}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <rect x="2" y="7" width="3" height="3" />
              <rect x="7" y="7" width="3" height="3" />
              <rect x="12" y="7" width="3" height="3" />
            </svg>
          </button>
        )}
      </div>
      {menu && (
        <div className="bl-swipe__list" role="group" aria-label={label}>
          {all.map((a, i) => actionButton(a, i, 0))}
        </div>
      )}
    </div>
  );
}
