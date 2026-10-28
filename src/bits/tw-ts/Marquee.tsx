import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

const STYLE_ID = 'bl-marquee-wall-tw';
const CSS = `
/* theme tokens */
.bl-mwall { --bl-ink: #f4f4f4; --bl-accent: #73eff7; --bl-chip: rgba(255,255,255,0.08); }
:where(.light, [data-theme="light"]) .bl-mwall, .bl-mwall:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-accent: #167f8f; --bl-chip: rgba(26,28,44,0.08); }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-mwall, :where(.light, [data-theme="light"]) .bl-mwall:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-accent: #73eff7; --bl-chip: rgba(255,255,255,0.08); }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-mwall, .bl-mwall:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-accent: #167f8f; --bl-chip: rgba(26,28,44,0.08); } }
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

function Lane({ items, index, vertical, speed, variance, alternate, slow, paused }: LaneProps) {
  const laneRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const [copies, setCopies] = useState(2);

  useEffect(() => {
    const lane = laneRef.current!;
    const set = setRef.current!;
    const fit = () => {
      const view = vertical ? lane.clientHeight : lane.clientWidth;
      const one = (vertical ? set.offsetHeight : set.offsetWidth) || 1;
      setCopies(Math.max(2, Math.ceil(view / one) + 1));
    };
    const resize = new ResizeObserver(fit);
    resize.observe(lane);
    resize.observe(set);
    return () => resize.disconnect();
  }, [vertical]);

  useEffect(() => {
    const lane = laneRef.current!;
    const track = trackRef.current!;
    const set = setRef.current!;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    // Neighbouring lanes run opposite ways, each a touch faster or slower than the last.
    const dir = alternate && index % 2 ? -1 : 1;
    const own = speed * (1 + (((index * 37) % 7) / 6 - 0.5) * variance);
    let offset = 0;
    let rate = 1;
    let hovered = false;
    let visible = true;
    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      const goal = pausedRef.current ? 0 : hovered ? slow : 1;
      rate += (goal - rate) * Math.min(1, dt * 6);
      const size = (vertical ? set.offsetHeight : set.offsetWidth) || 1;
      offset = (((offset + dir * own * rate * dt) % size) + size) % size;
      track.style.transform = vertical ? `translateY(${-offset.toFixed(2)}px)` : `translateX(${-offset.toFixed(2)}px)`;
      raf = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const onEnter = () => {
      hovered = true;
      lane.dataset.focus = '';
    };
    const onLeave = () => {
      hovered = false;
      delete lane.dataset.focus;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    observer.observe(lane);
    document.addEventListener('visibilitychange', start);
    lane.addEventListener('pointerenter', onEnter);
    lane.addEventListener('pointerleave', onLeave);
    start();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener('visibilitychange', start);
      lane.removeEventListener('pointerenter', onEnter);
      lane.removeEventListener('pointerleave', onLeave);
      track.style.transform = '';
    };
  }, [index, vertical, speed, variance, alternate, slow]);

  return (
    <div ref={laneRef} className="group/lane overflow-hidden [-webkit-mask-image:linear-gradient(90deg,transparent,#000_var(--bl-fade),#000_calc(100%_-_var(--bl-fade)),transparent)] [mask-image:linear-gradient(90deg,transparent,#000_var(--bl-fade),#000_calc(100%_-_var(--bl-fade)),transparent)] group-data-[vertical]/mw:min-w-0 group-data-[vertical]/mw:flex-1 group-data-[vertical]/mw:[-webkit-mask-image:linear-gradient(180deg,transparent,#000_var(--bl-fade),#000_calc(100%_-_var(--bl-fade)),transparent)] group-data-[vertical]/mw:[mask-image:linear-gradient(180deg,transparent,#000_var(--bl-fade),#000_calc(100%_-_var(--bl-fade)),transparent)]">
      <div ref={trackRef} className="flex w-max will-change-transform group-data-[vertical]/mw:w-auto group-data-[vertical]/mw:flex-col">
        {Array.from({ length: copies }, (_, c) => (
          <div key={c} ref={c === 0 ? setRef : undefined} className="flex flex-none gap-(--bl-gap) pr-(--bl-gap) group-data-[vertical]/mw:flex-col group-data-[vertical]/mw:pr-0 group-data-[vertical]/mw:pb-(--bl-gap)">
            {items.map((item, i) => (
              <div key={i} className="flex-none [transition:transform_220ms_steps(3),opacity_220ms_steps(3)] group-data-[focus]/lane:opacity-(--bl-dim) group-data-[focus]/lane:hover:opacity-100 group-data-[focus]/lane:hover:[transform:scale(1.06)] motion-reduce:[transition:none]">
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface LaneProps {
  items: ReactNode[];
  index: number;
  vertical: boolean;
  speed: number;
  variance: number;
  alternate: boolean;
  slow: number;
  paused: boolean;
}

export interface MarqueeProps {
  /** Logos or cards, dealt round-robin into lanes. */
  items?: ReactNode[];
  lanes?: number;
  /** Lanes run up and down instead of across. */
  vertical?: boolean;
  /** px per second. */
  speed?: number;
  /** How much lane speeds differ (0–1). */
  variance?: number;
  /** Neighbouring lanes run opposite ways. */
  alternate?: boolean;
  /** Speed of a hovered lane, 0–1 (0 stops it). */
  slow?: number;
  /** Opacity of the other items in a hovered lane. */
  dim?: number;
  gap?: number;
  /** Edge fade in px. */
  fade?: number;
  /** Height of a vertical wall in px. */
  height?: number;
  showPause?: boolean;
  /** Name of the items list for screen readers, and of the pause button. */
  label?: string;
  textColor?: string;
  accentColor?: string;
  chipColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function Marquee({
  items = [],
  lanes = 2,
  vertical = false,
  speed = 40,
  variance = 0.3,
  alternate = true,
  slow = 0.15,
  dim = 0.45,
  gap = 16,
  fade = 56,
  height = 420,
  showPause = true,
  label = 'Featured',
  textColor,
  accentColor,
  chipColor,
  fontFamily = 'inherit',
  className = '',
  style
}: MarqueeProps) {
  useStyles();
  const [paused, setPaused] = useState(false);
  // Deal the items round-robin into lanes, so each lane gets a mix.
  const count = Math.max(1, Math.min(lanes, items.length || 1));
  const dealt = Array.from({ length: count }, (_, l) => items.filter((_, i) => i % count === l));

  return (
    <div
      className={`bl-mwall group/mw relative grid gap-2.5 font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      data-vertical={vertical || undefined}
      style={{ '--bl-gap': `${gap}px`, '--bl-fade': `${fade}px`, '--bl-h': `${height}px`, '--bl-dim': dim, '--bl-ink': textColor, '--bl-accent': accentColor, '--bl-chip': chipColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <ul className="sr-only" aria-label={label}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <div className="flex flex-col gap-(--bl-gap) group-data-[vertical]/mw:h-(--bl-h) group-data-[vertical]/mw:flex-row" aria-hidden="true">
        {dealt.map((laneItems, l) => (
          <Lane key={l} items={laneItems} index={l} vertical={vertical} speed={speed} variance={variance} alternate={alternate} slow={slow} paused={paused} />
        ))}
      </div>
      {showPause && (
        <button type="button" className="grid size-[30px] cursor-pointer place-items-center rounded-[8px] border-0 bg-(--bl-chip) p-0 text-(--bl-ink) [justify-self:end] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" aria-pressed={paused} aria-label={paused ? `Play ${label}` : `Pause ${label}`} onClick={() => setPaused(p => !p)}>
          {paused ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M3 1.5v9l7-4.5z" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
              <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
