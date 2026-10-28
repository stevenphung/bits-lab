import { useId, useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type KeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tabs with an indicator that stretches toward the next tab before catching up, like a
// caterpillar. Pill or underline style. Overflowing tab rows scroll, fade at the edges and
// keep the active tab in view. Full ARIA tabs pattern: arrows, Home/End, automatic or
// manual activation, and optional panels.

const STYLE_ID = 'bl-slide-tabs';
const CSS = `
.bl-stabs { min-width: 0; max-width: 100%; font-family: var(--bl-font); color: var(--bl-ink); }
.bl-stabs__scroller { position: relative; overflow-x: auto; scrollbar-width: none; -webkit-mask-image: linear-gradient(to right, transparent 0, #000 var(--bl-fade-l), #000 calc(100% - var(--bl-fade-r)), transparent 100%); mask-image: linear-gradient(to right, transparent 0, #000 var(--bl-fade-l), #000 calc(100% - var(--bl-fade-r)), transparent 100%); }
.bl-stabs__scroller::-webkit-scrollbar { display: none; }
.bl-stabs__list { position: relative; display: inline-flex; gap: var(--bl-gap); min-width: 100%; padding: var(--bl-pad); border-radius: var(--bl-radius); background: var(--bl-track); box-sizing: border-box; }
.bl-stabs[data-variant="underline"] .bl-stabs__list { background: transparent; padding: 0; box-shadow: inset 0 -1px 0 var(--bl-line); border-radius: 0; }
.bl-stabs__indicator { position: absolute; top: var(--bl-pad); bottom: var(--bl-pad); border-radius: calc(var(--bl-radius) - var(--bl-pad) / 2); background: var(--bl-active-bg); box-shadow: 0 1px 3px rgba(0,0,0,0.3); pointer-events: none; }
.bl-stabs[data-variant="underline"] .bl-stabs__indicator { top: auto; bottom: 0; height: 3px; border-radius: 3px; background: var(--bl-accent); box-shadow: none; }
.bl-stabs__tab { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: 8px; flex: 0 0 auto; padding: 9px 16px; border: 0; border-radius: calc(var(--bl-radius) - var(--bl-pad) / 2); background: transparent; color: var(--bl-muted); font: inherit; font-size: var(--bl-size); font-weight: 600; white-space: nowrap; cursor: pointer; transition: color 200ms; }
.bl-stabs[data-variant="underline"] .bl-stabs__tab { padding: 12px 14px; }
.bl-stabs__tab:hover { color: var(--bl-ink); }
.bl-stabs__tab[aria-selected="true"] { color: var(--bl-active-ink); }
.bl-stabs[data-variant="underline"] .bl-stabs__tab[aria-selected="true"] { color: var(--bl-ink); }
.bl-stabs__tab:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: -2px; }
.bl-stabs__panel { padding-top: 18px; outline: none; }
.bl-stabs__panel:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 4px; }
@media (prefers-reduced-motion: reduce) { .bl-stabs__indicator { transition: none !important; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface TabItem {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  /** Panel content; give items content to render a linked tab panel. */
  content?: ReactNode;
}

export interface SlideTabsProps {
  items?: TabItem[];
  /** Controlled selected id. */
  value?: string;
  /** Uncontrolled starting id (defaults to the first item). */
  defaultValue?: string;
  onChange?: (id: string, item: TabItem) => void;
  variant?: 'pill' | 'underline';
  /** Leading edge moves first and the trailing edge follows. */
  stretch?: boolean;
  /** Arrow keys select immediately, or only move focus until Enter/Space. */
  activation?: 'automatic' | 'manual';
  /** Slide length, in ms. */
  duration?: number;
  /** Accessible name of the tab list. */
  label?: string;
  fontSize?: number;
  gap?: number;
  padding?: number;
  radius?: number;
  textColor?: string;
  mutedColor?: string;
  trackColor?: string;
  lineColor?: string;
  activeColor?: string;
  activeTextColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function SlideTabs({
  items = [],
  value,
  defaultValue,
  onChange,
  variant = 'pill',
  stretch = true,
  activation = 'automatic',
  duration = 380,
  label = 'Tabs',
  fontSize = 14,
  gap = 2,
  padding = 4,
  radius = 12,
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  trackColor = 'rgba(255,255,255,0.06)',
  lineColor = 'rgba(255,255,255,0.12)',
  activeColor = '#f4f4f4',
  activeTextColor = '#1a1c2c',
  accentColor = '#73eff7',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: SlideTabsProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState(defaultValue ?? items[0]?.id);
  const selected = value ?? inner;
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const last = useRef<{ left: number; right: number } | null>(null);
  const [fades, setFades] = useState([0, 0]);
  const selectedIndex = Math.max(0, items.findIndex(item => item.id === selected));

  const select = (index: number) => {
    const id = items[index].id;
    if (value === undefined) setInner(id);
    onChange?.(id, items[index]);
  };

  // Place the indicator. Moving right, the right edge leads and the left edge follows (and
  // the reverse moving left), so it stretches toward the target before settling.
  const place = (animate = true) => {
    const tab = tabRefs.current[selectedIndex];
    const indicator = indicatorRef.current;
    if (!tab || !indicator) return;
    const left = tab.offsetLeft;
    const right = tab.offsetParent!.clientWidth - (tab.offsetLeft + tab.offsetWidth);
    const prev = last.current;
    if (!animate || !prev) indicator.style.transition = 'none';
    else {
      const movingRight = left > prev.left;
      const lead = `${duration * 0.6}ms cubic-bezier(.3,.8,.3,1)`;
      const follow = `${duration}ms cubic-bezier(.5,0,.2,1) ${stretch ? duration * 0.18 : 0}ms`;
      indicator.style.transition = movingRight ? `right ${lead}, left ${follow}` : `left ${lead}, right ${follow}`;
    }
    indicator.style.left = `${left}px`;
    indicator.style.right = `${right}px`;
    last.current = { left, right };
  };

  const updateFades = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const next = [el.scrollLeft > 2 ? 28 : 0, el.scrollLeft + el.clientWidth < el.scrollWidth - 2 ? 28 : 0];
    setFades(prev => (prev[0] === next[0] && prev[1] === next[1] ? prev : next));
  };

  useLayoutEffect(() => {
    place(true);
    const tab = tabRefs.current[selectedIndex];
    const scroller = scrollerRef.current;
    if (tab && scroller && scroller.scrollWidth > scroller.clientWidth) {
      const target = tab.offsetLeft - (scroller.clientWidth - tab.offsetWidth) / 2;
      scroller.scrollTo({ left: target, behavior: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, variant]);

  useLayoutEffect(() => {
    const observer = new ResizeObserver(() => {
      place(false);
      updateFades();
    });
    observer.observe(scrollerRef.current!);
    tabRefs.current.forEach(tab => tab && observer.observe(tab));
    updateFades();
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, selectedIndex]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const current = focusIndex ?? selectedIndex;
    const keys: Record<string, number> = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: items.length - 1 };
    if (!(event.key in keys)) {
      if ((event.key === 'Enter' || event.key === ' ') && activation === 'manual' && focusIndex != null) {
        event.preventDefault();
        select(focusIndex);
      }
      return;
    }
    event.preventDefault();
    const next = (keys[event.key] + items.length) % items.length;
    setFocusIndex(next);
    tabRefs.current[next]?.focus();
    if (activation === 'automatic') select(next);
  };

  const panel = items[selectedIndex]?.content;

  return (
    <div
      className={`bl-stabs ${className}`}
      data-variant={variant}
      style={{
        '--bl-gap': `${gap}px`,
        '--bl-pad': variant === 'pill' ? `${padding}px` : '0px',
        '--bl-radius': `${radius}px`,
        '--bl-size': `${fontSize}px`,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-track': trackColor,
        '--bl-line': lineColor,
        '--bl-active-bg': activeColor,
        '--bl-active-ink': activeTextColor,
        '--bl-accent': accentColor,
        '--bl-font': fontFamily,
        '--bl-fade-l': `${fades[0]}px`,
        '--bl-fade-r': `${fades[1]}px`,
        ...style
      } as CSSVars}
    >
      <div ref={scrollerRef} className="bl-stabs__scroller" onScroll={updateFades}>
        <div className="bl-stabs__list" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
          <span ref={indicatorRef} className="bl-stabs__indicator" aria-hidden="true" />
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={node => {
                tabRefs.current[index] = node;
              }}
              id={`${uid}-tab-${index}`}
              className="bl-stabs__tab"
              role="tab"
              type="button"
              aria-selected={index === selectedIndex}
              aria-controls={item.content !== undefined ? `${uid}-panel` : undefined}
              tabIndex={index === (focusIndex ?? selectedIndex) ? 0 : -1}
              onClick={() => {
                setFocusIndex(index);
                select(index);
              }}
              onBlur={event => !event.currentTarget.parentElement!.contains(event.relatedTarget) && setFocusIndex(null)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {panel !== undefined && (
        <div id={`${uid}-panel`} className="bl-stabs__panel" role="tabpanel" aria-labelledby={`${uid}-tab-${selectedIndex}`} tabIndex={0}>
          {panel}
        </div>
      )}
    </div>
  );
}
