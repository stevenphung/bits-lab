import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A radial context menu. Right-click (or long-press on touch) inside the area and the
// actions fan out in a ring around the pointer. Then either click one, or flick: keep the
// button held, move toward an action and release. The centre names the action you're
// pointing at. Keyboard: the ContextMenu key or Shift+F10 opens it, arrows go round the
// ring, Enter picks, Esc closes.

export interface OrbItem {
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export interface ContextOrbProps {
  /** Actions, clockwise from the top. */
  items?: OrbItem[];
  /** The area that opens the menu. */
  children?: ReactNode;
  onSelect?: (item: OrbItem, index: number) => void;
  radius?: number;
  itemSize?: number;
  hubSize?: number;
  /** Pointer distance before aiming starts, in px. */
  deadZone?: number;
  /** Touch hold time in ms. */
  longPress?: number;
  label?: string;
  /** Hub text before an action is aimed at. */
  hint?: string;
  backgroundColor?: string;
  textColor?: string;
  lineColor?: string;
  accentColor?: string;
  dangerColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

const STYLE_ID = 'bl-context-orb';
const CSS = `
/* theme tokens */
.bl-corb-area { --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-corb-area, .bl-corb-area:where(.light, [data-theme="light"]) { --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-corb-area, :where(.light, [data-theme="light"]) .bl-corb-area:where(.dark, [data-theme="dark"]) { --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-corb-area, .bl-corb-area:where([data-theme="system"]) { --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-corb-area { position: relative; outline: none; -webkit-touch-callout: none; }
.bl-corb-area:focus-visible { outline: 2px dashed var(--bl-accent); outline-offset: 4px; }
.bl-corb { position: fixed; z-index: 1800; width: 0; height: 0; font-family: var(--bl-font); }
.bl-corb__hub { position: absolute; left: 0; top: 0; display: grid; place-items: center; width: var(--bl-hub); height: var(--bl-hub); margin: calc(var(--bl-hub) / -2) 0 0 calc(var(--bl-hub) / -2); border-radius: 50%; background: var(--bl-bg); color: var(--bl-ink); box-shadow: 0 0 0 1px var(--bl-line), 0 0 0 calc(var(--bl-radius) + var(--bl-item) / 2 + 10px) color-mix(in srgb, var(--bl-bg) 55%, transparent); font-size: 11px; font-weight: 600; text-align: center; line-height: 1.2; padding: 6px; box-sizing: border-box; animation: bl-corb-hub 260ms cubic-bezier(.3,1.4,.5,1) both; }
.bl-corb__item { position: absolute; left: 0; top: 0; display: grid; place-items: center; width: var(--bl-item); height: var(--bl-item); margin: calc(var(--bl-item) / -2) 0 0 calc(var(--bl-item) / -2); padding: 0; border: 0; border-radius: 50%; background: var(--bl-bg); color: var(--bl-ink); box-shadow: 0 0 0 1px var(--bl-line), 0 10px 24px -10px rgba(0,0,0,0.8); cursor: pointer; transform: translate(var(--x), var(--y)); animation: bl-corb-item 380ms cubic-bezier(.3,1.5,.5,1) both; animation-delay: calc(var(--i) * 25ms); transition: box-shadow 120ms, scale 160ms cubic-bezier(.3,1.6,.5,1); }
.bl-corb__item > * { pointer-events: none; }
.bl-corb__item[data-active] { scale: 1.18; box-shadow: 0 0 0 2px var(--bl-accent), 0 10px 24px -10px rgba(0,0,0,0.8); }
.bl-corb__item[data-danger][data-active] { box-shadow: 0 0 0 2px var(--bl-danger), 0 10px 24px -10px rgba(0,0,0,0.8); }
.bl-corb__item:disabled { opacity: 0.35; cursor: not-allowed; }
.bl-corb__item:focus-visible { outline: none; }
.bl-corb[data-closing] .bl-corb__item, .bl-corb[data-closing] .bl-corb__hub { animation: bl-corb-out 140ms ease-in both; }
@keyframes bl-corb-hub { from { transform: scale(0.3); opacity: 0; } }
@keyframes bl-corb-item { from { transform: translate(0, 0) scale(0.2); opacity: 0; } }
@keyframes bl-corb-out { to { opacity: 0; scale: 0.6; } }
@media (prefers-reduced-motion: reduce) { .bl-corb__item, .bl-corb__hub { animation: bl-corb-fade 120ms both; transition: none; } }
@keyframes bl-corb-fade { from { opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function ContextOrb({
  items = [],
  children,
  onSelect,
  radius = 78,
  itemSize = 48,
  hubSize = 64,
  deadZone = 26,
  longPress = 450,
  label = 'Actions',
  hint = 'Pick an action',
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  lineColor = '#333c57',
  accentColor,
  dangerColor = '#ef7d57',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: ContextOrbProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const areaRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; closing: boolean } | null>(null);
  const [active, setActive] = useState(-1);
  const gesture = useRef({ held: false, moved: false, x: 0, y: 0, keyboard: false });
  const pressTimer = useRef<ReturnType<typeof setTimeout> | number>(0);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | number>(0);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeRef = useRef(active);
  activeRef.current = active;

  const angleOf = (i: number) => -Math.PI / 2 + (i / items.length) * Math.PI * 2;

  const open = (x: number, y: number, { held = false, keyboard = false }: { held?: boolean; keyboard?: boolean } = {}) => {
    // Keep the whole ring on screen.
    const reach = radius + itemSize / 2 + 8;
    const cx = Math.max(reach, Math.min(window.innerWidth - reach, x));
    const cy = Math.max(reach, Math.min(window.innerHeight - reach, y));
    clearTimeout(closeTimer.current);
    gesture.current = { held, moved: false, x: cx, y: cy, keyboard };
    setActive(keyboard ? items.findIndex(item => !item.disabled) : -1);
    setMenu({ x: cx, y: cy, closing: false });
  };

  const close = (refocus = false) => {
    setMenu(current => (current ? { ...current, closing: true } : null));
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMenu(null), 160);
    if (refocus) areaRef.current?.focus({ preventScroll: true });
  };

  const choose = (index: number) => {
    const item = items[index];
    if (!item || item.disabled) return;
    item.onSelect?.();
    onSelect?.(item, index);
    close(gesture.current.keyboard);
  };

  // Which action the pointer is aiming at (none inside the dead zone).
  const aim = (clientX: number, clientY: number) => {
    const { x, y } = gesture.current;
    const dx = clientX - x;
    const dy = clientY - y;
    if (Math.hypot(dx, dy) < deadZone) return -1;
    const angle = Math.atan2(dy, dx);
    let best = -1;
    let bestGap = Infinity;
    items.forEach((item, i) => {
      if (item.disabled) return;
      const gap = Math.abs(Math.atan2(Math.sin(angle - angleOf(i)), Math.cos(angle - angleOf(i))));
      if (gap < bestGap) {
        bestGap = gap;
        best = i;
      }
    });
    return best;
  };

  useEffect(() => {
    if (!menu || menu.closing) return undefined;
    const onMove = (event: PointerEvent) => {
      const index = aim(event.clientX, event.clientY);
      if (index >= 0) gesture.current.moved = true;
      setActive(index);
    };
    const onUp = (event: PointerEvent) => {
      // A held press that travelled to an action selects it on release (the flick).
      if (gesture.current.held && gesture.current.moved) {
        const index = aim(event.clientX, event.clientY);
        if (index >= 0) choose(index);
        else close();
      }
      gesture.current.held = false;
    };
    const onDown = (event: PointerEvent) => {
      // Inside the ring, a fresh press means "click to choose", not a flick.
      if ((event.target as Element).closest?.('.bl-corb')) gesture.current.held = false;
      else close();
    };
    const onKey = (event: KeyboardEvent) => {
      const step = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 0;
      if (step) {
        event.preventDefault();
        gesture.current.keyboard = true;
        setActive(current => {
          let next = current;
          for (let n = 0; n < items.length; n++) {
            next = (next + step + items.length) % items.length;
            if (!items[next].disabled) return next;
          }
          return current;
        });
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (activeRef.current >= 0) choose(activeRef.current);
      } else if (event.key === 'Escape' || event.key === 'Tab') {
        event.preventDefault();
        close(true);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey);
    const dismiss = () => close();
    window.addEventListener('scroll', dismiss, { passive: true, capture: true });
    window.addEventListener('blur', dismiss);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', dismiss, { capture: true });
      window.removeEventListener('blur', dismiss);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu, items]);

  // Keep keyboard focus on the highlighted action so screen readers announce it.
  useEffect(() => {
    if (menu && !menu.closing && gesture.current.keyboard && active >= 0) itemRefs.current[active]?.focus({ preventScroll: true });
  }, [menu, active]);

  const onContextMenu = (event: ReactMouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    clearTimeout(pressTimer.current);
    open(event.clientX, event.clientY, { held: event.button === 2 || (event.nativeEvent as PointerEvent).pointerType === 'touch' });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'touch') return;
    const { clientX, clientY } = event;
    clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => open(clientX, clientY, { held: true }), longPress);
    const cancel = (move: PointerEvent | null) => {
      if (!move || Math.hypot(move.clientX - clientX, move.clientY - clientY) > 10) {
        clearTimeout(pressTimer.current);
        window.removeEventListener('pointermove', cancel);
        window.removeEventListener('pointerup', cancel);
      }
    };
    window.addEventListener('pointermove', cancel);
    window.addEventListener('pointerup', () => cancel(null), { once: true });
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
      event.preventDefault();
      const rect = areaRef.current!.getBoundingClientRect();
      open(rect.left + rect.width / 2, rect.top + rect.height / 2, { keyboard: true });
    }
  };

  useEffect(
    () => () => {
      clearTimeout(pressTimer.current);
      clearTimeout(closeTimer.current);
    },
    []
  );

  const current = items[active];

  return (
    <div
      ref={areaRef}
      className={`bl-corb-area ${className}`}
      tabIndex={0}
      aria-haspopup="menu"
      aria-expanded={!!menu && !menu.closing}
      aria-keyshortcuts="Shift+F10"
      onContextMenu={onContextMenu}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      style={{ '--bl-accent': accentColor, ...style } as CSSVars}
    >
      {children}
      {menu &&
        createPortal(
          <div
            className="bl-corb"
            data-closing={menu.closing || undefined}
            style={{
              left: menu.x,
              top: menu.y,
              '--bl-item': `${itemSize}px`,
              '--bl-hub': `${hubSize}px`,
              '--bl-radius': `${radius}px`,
              '--bl-bg': backgroundColor,
              '--bl-ink': textColor,
              '--bl-line': lineColor,
              '--bl-accent': accentColor ?? 'var(--bl-accent)',
              '--bl-danger': dangerColor,
              '--bl-font': fontFamily
            } as CSSVars}
          >
            <div className="bl-corb__hub" aria-hidden="true">
              {current ? current.label : hint}
            </div>
            <div role="menu" aria-label={label} id={`${uid}-menu`}>
              {items.map((item, i) => {
                const a = angleOf(i);
                return (
                  <button
                    key={item.label}
                    ref={node => {
                      itemRefs.current[i] = node;
                    }}
                    type="button"
                    role="menuitem"
                    className="bl-corb__item"
                    tabIndex={i === active ? 0 : -1}
                    aria-label={item.label}
                    disabled={item.disabled}
                    data-active={i === active || undefined}
                    data-danger={item.danger || undefined}
                    style={{ '--x': `${(Math.cos(a) * radius).toFixed(1)}px`, '--y': `${(Math.sin(a) * radius).toFixed(1)}px`, '--i': i } as CSSVars}
                    onPointerEnter={() => setActive(i)}
                    onClick={() => choose(i)}
                  >
                    {item.icon ?? item.label.slice(0, 1)}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
