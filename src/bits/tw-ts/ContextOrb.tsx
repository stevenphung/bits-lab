import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
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

const STYLE_ID = 'bl-context-orb-tw';
const CSS = `
@keyframes bl-corb-hub { from { transform: scale(0.3); opacity: 0; } }
@keyframes bl-corb-item { from { transform: translate(0, 0) scale(0.2); opacity: 0; } }
@keyframes bl-corb-out { to { opacity: 0; scale: 0.6; } }
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
  accentColor = '#73eff7',
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
      className={`relative outline-none [-webkit-touch-callout:none] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-dashed focus-visible:outline-(--bl-accent) ${className}`}
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
            className="bl-corb group/orb fixed z-1800 size-0 font-(family-name:--bl-font)"
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
              '--bl-accent': accentColor,
              '--bl-danger': dangerColor,
              '--bl-font': fontFamily
            } as CSSVars}
          >
            <div className="absolute top-0 left-0 m-[calc(var(--bl-hub)/-2)_0_0_calc(var(--bl-hub)/-2)] box-border grid size-(--bl-hub) animate-[bl-corb-hub_260ms_cubic-bezier(.3,1.4,.5,1)_both] place-items-center rounded-[50%] bg-(--bl-bg) p-1.5 text-center text-[11px] leading-[1.2] font-semibold text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line),0_0_0_calc(var(--bl-radius)_+_var(--bl-item)/2_+_10px)_color-mix(in_srgb,var(--bl-bg)_55%,transparent)] group-data-[closing]/orb:animate-[bl-corb-out_140ms_ease-in_both] motion-reduce:animate-[bl-corb-fade_120ms_both]" aria-hidden="true">
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
                    className="absolute top-0 left-0 m-[calc(var(--bl-item)/-2)_0_0_calc(var(--bl-item)/-2)] grid size-(--bl-item) animate-[bl-corb-item_380ms_cubic-bezier(.3,1.5,.5,1)_both] cursor-pointer place-items-center rounded-[50%] border-0 bg-(--bl-bg) p-0 text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line),0_10px_24px_-10px_rgba(0,0,0,0.8)] [transform:translate(var(--x),var(--y))] [animation-delay:calc(var(--i)*25ms)] [transition:box-shadow_120ms,scale_160ms_cubic-bezier(.3,1.6,.5,1)] *:pointer-events-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-35 data-[active]:scale-118 data-[active]:shadow-[0_0_0_2px_var(--bl-accent),0_10px_24px_-10px_rgba(0,0,0,0.8)] data-[danger]:data-[active]:shadow-[0_0_0_2px_var(--bl-danger),0_10px_24px_-10px_rgba(0,0,0,0.8)] group-data-[closing]/orb:animate-[bl-corb-out_140ms_ease-in_both] motion-reduce:animate-[bl-corb-fade_120ms_both] motion-reduce:[transition:none]"
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
