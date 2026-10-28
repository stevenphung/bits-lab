import { useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type MouseEvent as ReactMouseEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

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

const STYLE_ID = 'bl-mobile-tab-bar';
const CSS = `
.bl-tabbar { position: relative; display: flex; width: 100%; box-sizing: border-box; padding: 8px 8px calc(8px + env(safe-area-inset-bottom, 0px)); background: var(--bl-bg); color: var(--bl-muted); font-family: var(--bl-font); box-shadow: 0 -1px 0 var(--bl-line); }
.bl-tabbar[data-floating] { width: auto; margin: 0 12px 12px; padding-bottom: 8px; border-radius: 999px; box-shadow: 0 0 0 1px var(--bl-line), 0 16px 40px -16px rgba(0,0,0,0.8); }
.bl-tabbar[data-fixed] { position: fixed; left: 0; right: 0; bottom: 0; z-index: 30; }
.bl-tabbar__blob { position: absolute; top: 8px; bottom: calc(8px + env(safe-area-inset-bottom, 0px)); left: var(--bl-l, 0px); right: var(--bl-r, 0px); border-radius: 999px; background: var(--bl-blob); transition: left var(--bl-lead-l) cubic-bezier(.3,1.2,.5,1) var(--bl-delay-l), right var(--bl-lead-r) cubic-bezier(.3,1.2,.5,1) var(--bl-delay-r); pointer-events: none; }
.bl-tabbar[data-floating] .bl-tabbar__blob { bottom: 8px; }
.bl-tabbar__tab { position: relative; z-index: 1; flex: 1 1 0; display: grid; justify-items: center; align-content: center; gap: 2px; min-width: 0; min-height: 48px; padding: 6px 4px; border: 0; border-radius: 999px; background: transparent; color: inherit; font: inherit; font-size: 11px; font-weight: 600; cursor: pointer; -webkit-tap-highlight-color: transparent; transition: color 200ms; }
.bl-tabbar__tab[aria-current="page"] { color: var(--bl-active); }
.bl-tabbar__tab:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: -4px; }
.bl-tabbar__icon { position: relative; display: grid; place-items: center; width: 26px; height: 26px; }
.bl-tabbar__icon > * { max-width: 100%; max-height: 100%; }
.bl-tabbar__tab[data-bounce] .bl-tabbar__icon { animation: bl-tabbar-bounce 520ms cubic-bezier(.3,1.6,.5,1); }
.bl-tabbar__label { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bl-tabbar[data-labels="active"] .bl-tabbar__label { display: grid; grid-template-rows: 0fr; opacity: 0; transition: grid-template-rows 260ms cubic-bezier(.3,1.2,.5,1), opacity 200ms; }
.bl-tabbar[data-labels="active"] .bl-tabbar__label > span { min-height: 0; overflow: hidden; }
.bl-tabbar[data-labels="active"] .bl-tabbar__tab[aria-current="page"] .bl-tabbar__label { grid-template-rows: 1fr; opacity: 1; }
.bl-tabbar__badge { position: absolute; top: -4px; right: -9px; min-width: 16px; height: 16px; padding: 0 4px; box-sizing: border-box; border-radius: 999px; background: var(--bl-badge); color: #fff; font-size: 10px; font-weight: 700; line-height: 16px; text-align: center; box-shadow: 0 0 0 2px var(--bl-bg); }
.bl-tabbar__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-tabbar-bounce { 0% { transform: scale(1); } 30% { transform: scale(0.8) translateY(2px); } 60% { transform: scale(1.18) translateY(-3px); } 100% { transform: none; } }
@media (prefers-reduced-motion: reduce) { .bl-tabbar__blob { transition: none; } .bl-tabbar__tab[data-bounce] .bl-tabbar__icon { animation: none; } .bl-tabbar[data-labels="active"] .bl-tabbar__label { transition: none; } }
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
  backgroundColor = '#1a1c2c',
  textColor = '#94b0c2',
  activeColor = '#0b0b14',
  blobColor = '#73eff7',
  lineColor = '#333c57',
  accentColor = '#f4f4f4',
  badgeColor = '#b13e53',
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
      className={`bl-tabbar ${className}`}
      aria-label={label}
      data-labels={labels}
      data-floating={floating || undefined}
      data-fixed={fixed || undefined}
      style={{ '--bl-bg': backgroundColor, '--bl-active': activeColor, '--bl-blob': blobColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-badge': badgeColor, '--bl-font': fontFamily, color: textColor, ...style } as CSSVars}
    >
      <span className="bl-tabbar__blob" aria-hidden="true" />
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          ref={node => {
            tabRefs.current[tab.id] = node;
          }}
          type="button"
          className="bl-tabbar__tab"
          aria-current={tab.id === current ? 'page' : undefined}
          aria-label={tab.badge ? `${tab.label}, ${tab.badge} new` : undefined}
          data-bounce={bounce === tab.id || undefined}
          onAnimationEnd={() => bounce === tab.id && setBounce(null)}
          onClick={event => choose(tab, event)}
          onKeyDown={event => onKeyDown(event, i)}
        >
          <span className="bl-tabbar__icon" aria-hidden="true">
            {tab.icon}
            {tab.badge ? <span className="bl-tabbar__badge">{tab.badge}</span> : null}
          </span>
          <span className="bl-tabbar__label">
            <span>{tab.label}</span>
          </span>
        </button>
      ))}
    </nav>
  );
}
