import { useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type MouseEvent as ReactMouseEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A mobile bottom tab bar. The active tab sits on a blob that stretches toward the next tab
// and then catches up, like a drop of liquid; the newly active icon gives a little bounce
// (with an optional real vibration where the device supports it). Labels can show on the
// active tab only or on all of them; badges mark unread counts. Left/Right move between
// tabs, and the bar respects the phone's safe area.

export interface MobileTab {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Unread count or marker. */
  badge?: ReactNode;
  /** Fires when the active tab is tapped again (e.g. scroll to top). */
  onReselect?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
}

export interface MobileTabBarProps {
  tabs?: MobileTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (id: string, tab: MobileTab) => void;
  /** Show every label, or only the active one. */
  labels?: 'active' | 'always';
  /** A floating pill instead of a full-width bar. */
  floating?: boolean;
  /** Fixed to the bottom of the viewport. */
  fixed?: boolean;
  /** A short vibration on change, where supported. */
  haptics?: boolean;
  /** How much the blob stretches between tabs. */
  stretch?: number;
  label?: string;
  backgroundColor?: string;
  textColor?: string;
  activeColor?: string;
  blobColor?: string;
  lineColor?: string;
  accentColor?: string;
  badgeColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

const STYLE_ID = 'bl-mobile-tab-bar-tw';
const CSS = `
/* theme tokens */
.bl-tabbar { --bl-tab-ink: #94b0c2; --bl-bg: #1a1c2c; --bl-active: #0b0b14; --bl-blob: #73eff7; --bl-line: #333c57; --bl-accent: #f4f4f4; --bl-badge: #b13e53; }
:where(.light, [data-theme="light"]) .bl-tabbar, .bl-tabbar:where(.light, [data-theme="light"]) { --bl-tab-ink: #566c86; --bl-bg: #f4f1e8; --bl-active: #e2dacb; --bl-blob: #167f8f; --bl-line: #cfc4ad; --bl-accent: #1a1c2c; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-tabbar, :where(.light, [data-theme="light"]) .bl-tabbar:where(.dark, [data-theme="dark"]) { --bl-tab-ink: #94b0c2; --bl-bg: #1a1c2c; --bl-active: #0b0b14; --bl-blob: #73eff7; --bl-line: #333c57; --bl-accent: #f4f4f4; --bl-badge: #b13e53; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-tabbar, .bl-tabbar:where([data-theme="system"]) { --bl-tab-ink: #566c86; --bl-bg: #f4f1e8; --bl-active: #e2dacb; --bl-blob: #167f8f; --bl-line: #cfc4ad; --bl-accent: #1a1c2c; } }
/* theme tokens end */
@keyframes bl-tabbar-bounce { 0% { transform: scale(1); } 30% { transform: scale(0.8) translateY(2px); } 60% { transform: scale(1.18) translateY(-3px); } 100% { transform: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function MobileTabBar({
  tabs = [],
  value,
  defaultValue,
  onValueChange,
  labels = 'active',
  floating = false,
  fixed = false,
  haptics = false,
  stretch = 1,
  label = 'Main',
  backgroundColor,
  textColor,
  activeColor,
  blobColor,
  lineColor,
  accentColor,
  badgeColor,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: MobileTabBarProps) {
  useStyles();
  const [inner, setInner] = useState<string | undefined>(defaultValue ?? tabs[0]?.id);
  const current = value !== undefined ? value : inner;
  const [bounce, setBounce] = useState<string | null>(null);
  const rootRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const last = useRef<number | null>(null);

  // Place the blob. The edge in the direction of travel leads; the other edge follows late,
  // which stretches the blob into a drop shape mid-move.
  useLayoutEffect(() => {
    const root = rootRef.current;
    const place = (animate = true) => {
      const tab = tabRefs.current[current as string];
      if (!root || !tab) return;
      const width = root.clientWidth;
      const left = tab.offsetLeft;
      const right = width - (tab.offsetLeft + tab.offsetWidth);
      const previous = last.current;
      const goingRight = previous != null && left > previous;
      const lead = `${Math.round(260 / stretch)}ms`;
      const tail = `${Math.round(420 * stretch)}ms`;
      const delay = `${Math.round(70 * stretch)}ms`;
      root.style.setProperty('--bl-lead-l', animate ? (goingRight ? tail : lead) : '0ms');
      root.style.setProperty('--bl-lead-r', animate ? (goingRight ? lead : tail) : '0ms');
      root.style.setProperty('--bl-delay-l', animate && goingRight ? delay : '0ms');
      root.style.setProperty('--bl-delay-r', animate && !goingRight ? delay : '0ms');
      root.style.setProperty('--bl-l', `${left}px`);
      root.style.setProperty('--bl-r', `${right}px`);
      last.current = left;
    };
    place(last.current !== null);
    const resize = new ResizeObserver(() => place(false));
    resize.observe(root!);
    return () => resize.disconnect();
  }, [current, tabs.length, labels, stretch]);

  const choose = (tab: MobileTab, event: ReactMouseEvent<HTMLButtonElement>) => {
    if (tab.id === current) {
      tab.onReselect?.(event);
      return;
    }
    if (value === undefined) setInner(tab.id);
    onValueChange?.(tab.id, tab);
    setBounce(tab.id);
    // Browsers only allow vibration after a real tap; skip it otherwise.
    if (haptics && navigator.userActivation?.hasBeenActive !== false && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) navigator.vibrate?.(8);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = tabs[(index + step + tabs.length) % tabs.length];
    tabRefs.current[next.id]?.focus();
  };

  return (
    <nav
      ref={rootRef}
      className={`bl-tabbar group/bar relative box-border flex w-full bg-(--bl-bg) px-2 pt-2 pb-[calc(8px_+_env(safe-area-inset-bottom,0px))] font-(family-name:--bl-font) text-(--bl-muted) shadow-[0_-1px_0_var(--bl-line)] data-[fixed]:fixed data-[fixed]:inset-x-0 data-[fixed]:bottom-0 data-[fixed]:z-30 data-[floating]:mx-3 data-[floating]:mt-0 data-[floating]:mb-3 data-[floating]:w-auto data-[floating]:rounded-full data-[floating]:pb-2 data-[floating]:shadow-[0_0_0_1px_var(--bl-line),0_16px_40px_-16px_rgba(0,0,0,0.8)] ${className}`}
      aria-label={label}
      data-labels={labels}
      data-floating={floating || undefined}
      data-fixed={fixed || undefined}
      style={{ '--bl-bg': backgroundColor, '--bl-active': activeColor, '--bl-blob': blobColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-badge': badgeColor, '--bl-font': fontFamily, color: textColor ?? 'var(--bl-tab-ink)', ...style } as CSSVars}
    >
      <span className="pointer-events-none absolute top-2 right-[var(--bl-r,0px)] bottom-[calc(8px_+_env(safe-area-inset-bottom,0px))] left-[var(--bl-l,0px)] rounded-full bg-(--bl-blob) [transition:left_var(--bl-lead-l)_cubic-bezier(.3,1.2,.5,1)_var(--bl-delay-l),right_var(--bl-lead-r)_cubic-bezier(.3,1.2,.5,1)_var(--bl-delay-r)] group-data-[floating]/bar:bottom-2 motion-reduce:[transition:none]" aria-hidden="true" />
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          ref={node => {
            tabRefs.current[tab.id] = node;
          }}
          type="button"
          className="group/tab relative z-1 grid min-h-12 min-w-0 flex-[1_1_0] cursor-pointer content-center justify-items-center gap-0.5 rounded-full border-0 bg-transparent px-1 py-1.5 text-[11px] font-semibold text-inherit [-webkit-tap-highlight-color:transparent] transition-[color] duration-200 ease-[ease] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-(--bl-accent) aria-[current=page]:text-(--bl-active)"
          aria-current={tab.id === current ? 'page' : undefined}
          aria-label={tab.badge ? `${tab.label}, ${tab.badge} new` : undefined}
          data-bounce={bounce === tab.id || undefined}
          onAnimationEnd={() => bounce === tab.id && setBounce(null)}
          onClick={event => choose(tab, event)}
          onKeyDown={event => onKeyDown(event, i)}
        >
          <span className="relative grid size-[26px] place-items-center *:max-h-full *:max-w-full group-data-[bounce]/tab:animate-[bl-tabbar-bounce_520ms_cubic-bezier(.3,1.6,.5,1)] motion-reduce:group-data-[bounce]/tab:animate-none" aria-hidden="true">
            {tab.icon}
            {tab.badge ? <span className="absolute -top-1 -right-[9px] box-border h-4 min-w-4 rounded-full bg-(--bl-badge) px-1 text-center text-[10px] leading-4 font-bold text-white shadow-[0_0_0_2px_var(--bl-bg)]">{tab.badge}</span> : null}
          </span>
          <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap group-data-[labels=active]/bar:grid group-data-[labels=active]/bar:grid-rows-[0fr] group-data-[labels=active]/bar:opacity-0 group-data-[labels=active]/bar:[transition:grid-template-rows_260ms_cubic-bezier(.3,1.2,.5,1),opacity_200ms] group-data-[labels=active]/bar:*:min-h-0 group-data-[labels=active]/bar:*:overflow-hidden group-data-[labels=active]/bar:group-aria-[current=page]/tab:grid-rows-[1fr] group-data-[labels=active]/bar:group-aria-[current=page]/tab:opacity-100 motion-reduce:group-data-[labels=active]/bar:[transition:none]">
            <span>{tab.label}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}
