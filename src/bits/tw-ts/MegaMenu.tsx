import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type AnimationEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A navigation bar whose dropdowns share one panel. Moving between triggers doesn't close
// and reopen anything: the panel slides under the new trigger, resizes to fit its content,
// and the content crossfades in from the side you moved toward. Hover with intent delays,
// or click; Down/Enter opens and moves into the panel, Left/Right walk the triggers, Esc
// closes and returns focus. The panel stays on screen; on narrow screens it spans the width.

export interface MegaMenuItem {
  label: string;
  /** Opens the shared panel with this content. */
  content?: ReactNode;
  /** A plain link when there is no content. */
  href?: string;
}

export interface MegaMenuProps {
  items?: MegaMenuItem[];
  /** Hover intent before opening, in ms. */
  openDelay?: number;
  /** Grace period before closing after the pointer leaves, in ms. */
  closeDelay?: number;
  /** Space between the bar and the panel. */
  gap?: number;
  maxPanelWidth?: number;
  /** Slide and resize time between triggers, in ms. */
  duration?: number;
  label?: string;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  hoverColor?: string;
  lineColor?: string;
  accentColor?: string;
  radius?: number;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

interface Pane {
  index: number;
  state: 'in' | 'out';
  dir: number;
  key: string;
}

const STYLE_ID = 'bl-mega-menu-tw';
const CSS = `
/* theme tokens */
.bl-mega { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-hover: rgba(255,255,255,0.06); --bl-line: #333c57; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-mega, .bl-mega:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-hover: rgba(26,28,44,0.06); --bl-line: #cfc4ad; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-mega, :where(.light, [data-theme="light"]) .bl-mega:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-hover: rgba(255,255,255,0.06); --bl-line: #333c57; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-mega, .bl-mega:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-hover: rgba(26,28,44,0.06); --bl-line: #cfc4ad; --bl-accent: #167f8f; } }
/* theme tokens end */
@keyframes bl-mega-in { from { opacity: 0; transform: translateX(var(--bl-px, 0px)) translateY(-6px) scale(0.97); } }
@keyframes bl-mega-out { to { opacity: 0; transform: translateX(var(--bl-px, 0px)) translateY(-6px) scale(0.97); } }
@keyframes bl-mega-pane-in { from { opacity: 0; transform: translateX(calc(var(--bl-dir) * 36px)); } }
@keyframes bl-mega-pane-out { to { opacity: 0; transform: translateX(calc(var(--bl-dir) * -36px)); } }
@keyframes bl-mega-fade { from { opacity: 0; } }
@keyframes bl-mega-fade-out { to { opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const Chevron = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M2 3.5 5 6.5 8 3.5" />
  </svg>
);

export default function MegaMenu({
  items = [],
  openDelay = 90,
  closeDelay = 220,
  gap = 10,
  maxPanelWidth = 640,
  duration = 320,
  label = 'Main',
  backgroundColor,
  textColor,
  mutedColor,
  hoverColor,
  lineColor,
  accentColor,
  radius = 14,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: MegaMenuProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const rootRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const triggerRefs = useRef<(HTMLElement | null)[]>([]);
  const paneRefs = useRef<Record<string, HTMLDivElement>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | number>(0);
  const [active, setActive] = useState(-1);
  const [panes, setPanes] = useState<Pane[]>([]);
  const [closing, setClosing] = useState(false);
  const [fresh, setFresh] = useState(true);

  const openAt = (index: number) => {
    clearTimeout(timer.current);
    if (index === active && !closing) return;
    const from = closing ? -1 : active;
    setClosing(false);
    setFresh(from < 0);
    setActive(index);
    // Keep the outgoing pane for its exit animation; slide toward the direction of travel.
    const dir = from < 0 ? 0 : index > from ? 1 : -1;
    setPanes(list => [...list.filter(p => p.index !== index && p.index === from).map((p): Pane => ({ ...p, state: 'out', dir })), { index, state: 'in', dir, key: `${index}-${Date.now()}` }]);
  };

  const close = (refocus = false) => {
    clearTimeout(timer.current);
    if (active < 0) return;
    if (refocus) triggerRefs.current[active]?.focus();
    setClosing(true);
  };

  const scheduleOpen = (index: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => openAt(index), active >= 0 && !closing ? 0 : openDelay);
  };
  const scheduleClose = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => close(), closeDelay);
  };

  // Size and place the shared panel for the active content.
  useLayoutEffect(() => {
    if (active < 0) return undefined;
    const place = () => {
      const root = rootRef.current;
      const pane = paneRefs.current[panes[panes.length - 1]?.key];
      const trigger = triggerRefs.current[active];
      if (!root || !pane || !trigger) return;
      // Size and clamp against the viewport, so the panel can be wider than the nav itself.
      const rootBox = root.getBoundingClientRect();
      const vw = document.documentElement.clientWidth;
      const narrow = vw < 640;
      root.toggleAttribute('data-narrow', narrow);
      root.style.setProperty('--bl-full', `${vw - 16}px`);
      const w = narrow ? vw - 16 : Math.min(pane.offsetWidth, vw - 16);
      const h = pane.offsetHeight;
      const t = trigger.getBoundingClientRect();
      const center = t.left + t.width / 2 - rootBox.left;
      const x = Math.max(8, Math.min(vw - 8 - w, rootBox.left + center - w / 2)) - rootBox.left;
      root.style.setProperty('--bl-pw', `${w}px`);
      root.style.setProperty('--bl-ph', `${h}px`);
      root.style.setProperty('--bl-px', `${x}px`);
      root.style.setProperty('--bl-cx', `${center - 5}px`);
    };
    place();
    const resize = new ResizeObserver(place);
    Object.values(paneRefs.current).forEach(node => node && resize.observe(node));
    resize.observe(rootRef.current!);
    window.addEventListener('resize', place);
    // After the first frame, let size and position animate between triggers.
    const frame = requestAnimationFrame(() => setFresh(false));
    return () => {
      resize.disconnect();
      window.removeEventListener('resize', place);
      cancelAnimationFrame(frame);
    };
  }, [active, panes]);

  // Drop finished exit panes; finish closing.
  const onPaneEnd = (key: string) => setPanes(list => list.filter(p => p.key !== key || p.state !== 'out'));
  const onViewportEnd = (event: AnimationEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || !closing) return;
    setActive(-1);
    setPanes([]);
    setClosing(false);
    setFresh(true);
  };

  // Esc and clicks outside close it.
  useEffect(() => {
    if (active < 0) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true);
    };
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, closing]);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Opening from the keyboard moves focus into the panel once it has rendered.
  const focusPending = useRef(false);
  const focusPanel = () => {
    focusPending.current = true;
  };
  useEffect(() => {
    if (!focusPending.current) return;
    const target = viewportRef.current?.querySelector<HTMLElement>('[data-state="in"] a, [data-state="in"] button');
    if (target) {
      focusPending.current = false;
      target.focus();
    }
  }, [panes]);

  const onTriggerKey = (event: ReactKeyboardEvent<HTMLElement>, index: number) => {
    const triggers = items.map((_, i) => i).filter(i => items[i].content);
    if (event.key === 'ArrowDown' && items[index].content) {
      event.preventDefault();
      openAt(index);
      focusPanel();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const all = triggerRefs.current.filter(Boolean) as HTMLElement[];
      const at = all.indexOf(event.currentTarget);
      const next = all[(at + (event.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length];
      next?.focus();
      const nextIndex = triggerRefs.current.indexOf(next!);
      if (active >= 0 && !closing && triggers.includes(nextIndex)) openAt(nextIndex);
    }
  };

  const showing = active >= 0;

  return (
    <nav
      ref={rootRef}
      className={`bl-mega group/mega relative font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      aria-label={label}
      onPointerLeave={event => event.pointerType === 'mouse' && scheduleClose()}
      style={{
        '--bl-gap': `${gap}px`,
        '--bl-max-w': `${maxPanelWidth}px`,
        '--bl-dur': `${duration}ms`,
        '--bl-ease': 'cubic-bezier(.3,1.15,.5,1)',
        '--bl-bg': backgroundColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-hover': hoverColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-radius': `${radius}px`,
        '--bl-font': fontFamily,
        ...style
      } as CSSVars}
    >
      <ul className="m-0 flex list-none flex-wrap items-center gap-1 p-0">
        {items.map((item, i) => (
          <li key={item.label}>
            {item.content ? (
              <button
                ref={node => {
                  triggerRefs.current[i] = node;
                }}
                type="button"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-transparent px-3.5 py-[9px] text-[14px] font-semibold text-(--bl-muted) no-underline transition-[color,background-color] duration-150 ease-[ease] hover:bg-(--bl-hover) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) aria-expanded:bg-(--bl-hover) aria-expanded:text-(--bl-ink) [&_svg]:[transition:transform_220ms_cubic-bezier(.3,1.4,.5,1)] aria-expanded:[&_svg]:[transform:rotate(180deg)]"
                aria-expanded={showing && !closing && active === i}
                aria-controls={`${uid}-panel`}
                onPointerEnter={event => event.pointerType === 'mouse' && scheduleOpen(i)}
                onClick={() => (showing && !closing && active === i ? close() : openAt(i))}
                onKeyDown={event => onTriggerKey(event, i)}
              >
                {item.label}
                <Chevron />
              </button>
            ) : (
              <a
                ref={node => {
                  triggerRefs.current[i] = node;
                }}
                href={item.href}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-transparent px-3.5 py-[9px] text-[14px] font-semibold text-(--bl-muted) no-underline transition-[color,background-color] duration-150 ease-[ease] hover:bg-(--bl-hover) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) aria-expanded:bg-(--bl-hover) aria-expanded:text-(--bl-ink) [&_svg]:[transition:transform_220ms_cubic-bezier(.3,1.4,.5,1)] aria-expanded:[&_svg]:[transform:rotate(180deg)]"
                onPointerEnter={event => event.pointerType === 'mouse' && showing && scheduleClose()}
                onKeyDown={event => onTriggerKey(event, i)}
              >
                {item.label}
              </a>
            )}
          </li>
        ))}
      </ul>
      {showing && (
        <>
          <div
            ref={viewportRef}
            id={`${uid}-panel`}
            className="peer/vp absolute top-[calc(100%_+_var(--bl-gap))] left-0 z-40 h-[var(--bl-ph,0px)] w-[var(--bl-pw,0px)] origin-top animate-[bl-mega-in_220ms_cubic-bezier(.2,.9,.25,1)] overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) shadow-[0_0_0_1px_var(--bl-line),0_30px_60px_-30px_rgba(0,0,0,0.85)] [transform:translateX(var(--bl-px,0px))] [transition:width_var(--bl-dur)_var(--bl-ease),height_var(--bl-dur)_var(--bl-ease),transform_var(--bl-dur)_var(--bl-ease)] data-[closing]:animate-[bl-mega-out_160ms_ease-in_forwards] data-[fresh]:[transition:none] motion-reduce:[animation-name:bl-mega-fade] motion-reduce:[transition:none] motion-reduce:data-[closing]:[animation-name:bl-mega-fade-out]"
            data-closing={closing || undefined}
            data-fresh={fresh || undefined}
            onPointerEnter={() => clearTimeout(timer.current)}
            onAnimationEnd={onViewportEnd}
            onKeyDown={event => {
              if (event.key === 'Escape') close(true);
            }}
          >
            {panes.map(pane => (
              <div
                key={pane.key}
                ref={node => {
                  if (node) paneRefs.current[pane.key] = node;
                  else delete paneRefs.current[pane.key];
                }}
                className="absolute top-0 left-0 box-border w-max max-w-(--bl-max-w) p-[18px] data-[state=in]:animate-[bl-mega-pane-in_var(--bl-dur)_var(--bl-ease)_both] data-[state=out]:pointer-events-none data-[state=out]:animate-[bl-mega-pane-out_calc(var(--bl-dur)*0.6)_ease_both] group-data-[narrow]/mega:w-(--bl-full) group-data-[narrow]/mega:max-w-none motion-reduce:data-[state]:[animation-name:bl-mega-fade]"
                data-state={pane.state}
                style={{ '--bl-dir': pane.dir } as CSSVars}
                aria-hidden={pane.state === 'out' || undefined}
                inert={pane.state === 'out' || undefined}
                onAnimationEnd={event => event.target === event.currentTarget && pane.state === 'out' && onPaneEnd(pane.key)}
              >
                {items[pane.index]?.content}
              </div>
            ))}
          </div>
          <span className="pointer-events-none absolute top-[calc(100%_+_var(--bl-gap)_-_5px)] left-0 z-41 size-2.5 bg-(--bl-bg) shadow-[-1px_-1px_0_0_var(--bl-line)] [transform:translateX(var(--bl-cx,0px))_rotate(45deg)] [transition:transform_var(--bl-dur)_var(--bl-ease)] peer-data-[fresh]/vp:[transition:none] data-[closing]:opacity-0 data-[closing]:[transition:opacity_120ms] motion-reduce:[transition:none]" aria-hidden="true" data-closing={closing || undefined} />
        </>
      )}
    </nav>
  );
}
