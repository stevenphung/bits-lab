import { useId, useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type KeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

const STYLE_ID = 'bl-slide-tabs-tw';
const CSS = `
/* theme tokens */
.bl-stabs { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-track: rgba(255,255,255,0.06); --bl-line: rgba(255,255,255,0.12); --bl-active-bg: #f4f4f4; --bl-active-ink: #1a1c2c; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-stabs, .bl-stabs:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-track: rgba(26,28,44,0.06); --bl-line: rgba(26,28,44,0.12); --bl-active-bg: #1a1c2c; --bl-active-ink: #f4f4f4; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-stabs, :where(.light, [data-theme="light"]) .bl-stabs:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-track: rgba(255,255,255,0.06); --bl-line: rgba(255,255,255,0.12); --bl-active-bg: #f4f4f4; --bl-active-ink: #1a1c2c; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-stabs, .bl-stabs:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-track: rgba(26,28,44,0.06); --bl-line: rgba(26,28,44,0.12); --bl-active-bg: #1a1c2c; --bl-active-ink: #f4f4f4; --bl-accent: #167f8f; } }
/* theme tokens end */
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
  textColor,
  mutedColor,
  trackColor,
  lineColor,
  activeColor,
  activeTextColor,
  accentColor,
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
      className={`bl-stabs group/tabs max-w-full min-w-0 font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
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
      <div ref={scrollerRef} className="relative overflow-x-auto [scrollbar-width:none] [mask-image:linear-gradient(to_right,transparent_0,#000_var(--bl-fade-l),#000_calc(100%_-_var(--bl-fade-r)),transparent_100%)] [&::-webkit-scrollbar]:hidden" onScroll={updateFades}>
        <div className="relative box-border inline-flex min-w-full gap-(--bl-gap) rounded-(--bl-radius) bg-(--bl-track) p-(--bl-pad) group-data-[variant=underline]/tabs:rounded-none group-data-[variant=underline]/tabs:bg-transparent group-data-[variant=underline]/tabs:p-0 group-data-[variant=underline]/tabs:shadow-[inset_0_-1px_0_var(--bl-line)]" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
          <span ref={indicatorRef} className="pointer-events-none absolute top-(--bl-pad) bottom-(--bl-pad) rounded-[calc(var(--bl-radius)_-_var(--bl-pad)/2)] bg-(--bl-active-bg) shadow-[0_1px_3px_rgba(0,0,0,0.3)] group-data-[variant=underline]/tabs:top-auto group-data-[variant=underline]/tabs:bottom-0 group-data-[variant=underline]/tabs:h-[3px] group-data-[variant=underline]/tabs:rounded-[3px] group-data-[variant=underline]/tabs:bg-(--bl-accent) group-data-[variant=underline]/tabs:shadow-none motion-reduce:transition-none!" aria-hidden="true" />
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={node => {
                tabRefs.current[index] = node;
              }}
              id={`${uid}-tab-${index}`}
              className="relative z-1 inline-flex flex-none cursor-pointer items-center gap-2 rounded-[calc(var(--bl-radius)_-_var(--bl-pad)/2)] border-0 bg-transparent px-4 py-[9px] text-(length:--bl-size) font-semibold whitespace-nowrap text-(--bl-muted) transition-[color] duration-200 ease-[ease] hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--bl-accent) aria-selected:text-(--bl-active-ink) group-data-[variant=underline]/tabs:px-3.5 group-data-[variant=underline]/tabs:py-3 group-data-[variant=underline]/tabs:aria-selected:text-(--bl-ink)"
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
        <div id={`${uid}-panel`} className="pt-[18px] outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--bl-accent)" role="tabpanel" aria-labelledby={`${uid}-tab-${selectedIndex}`} tabIndex={0}>
          {panel}
        </div>
      )}
    </div>
  );
}
