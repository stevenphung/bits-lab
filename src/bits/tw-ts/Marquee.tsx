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

function Lane({ items, index, vertical, speed, variance, alternate, slow, paused, scrub }: LaneProps) {
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
      const goal = pausedRef.current || drag ? 0 : hovered ? slow : 1;
      rate += (goal - rate) * Math.min(1, dt * 6);
      const size = (vertical ? set.offsetHeight : set.offsetWidth) || 1;
      fling = drag ? 0 : Math.abs(fling) < 4 ? 0 : fling * Math.exp(-dt * 2.5);
      offset = (((offset + dir * own * rate * dt + fling * dt) % size) + size) % size;
      track.style.transform = vertical ? `translateY(${-offset.toFixed(2)}px)` : `translateX(${-offset.toFixed(2)}px)`;
      raf = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    // Drag to scrub: the lane follows the pointer, then coasts on the release speed and settles
    // back into its own pace. A drag that moved swallows the click, so links don't fire.
    let drag: { last: number; time: number; v: number; moved: number } | null = null;
    let fling = 0;
    const along = (event: PointerEvent) => (vertical ? event.clientY : event.clientX);
    const onDown = (event: PointerEvent) => {
      if (!scrub || event.button !== 0) return;
      drag = { last: along(event), time: event.timeStamp, v: 0, moved: 0 };
      fling = 0;
    };
    const onMove = (event: PointerEvent) => {
      if (!drag) return;
      const p = along(event);
      const d = p - drag.last;
      const dt = Math.max(1, event.timeStamp - drag.time);
      drag.moved += Math.abs(d);
      if (drag.moved > 4 && lane.dataset.dragging === undefined) {
        lane.dataset.dragging = '';
        lane.setPointerCapture?.(event.pointerId);
      }
      drag.v = drag.v * 0.6 + ((-d / dt) * 1000) * 0.4;
      offset -= d;
      drag.last = p;
      drag.time = event.timeStamp;
      start();
    };
    const onUp = () => {
      if (!drag) return;
      fling = Math.max(-3000, Math.min(3000, drag.v));
      const moved = drag.moved;
      drag = null;
      delete lane.dataset.dragging;
      if (moved > 4) {
        const swallow = (event: MouseEvent) => {
          event.preventDefault();
          event.stopPropagation();
        };
        lane.addEventListener('click', swallow, { capture: true, once: true });
        setTimeout(() => lane.removeEventListener('click', swallow, { capture: true }), 0);
      }
    };
    // Images and links inside a lane would start a native drag (and cancel the pointer).
    const onDragStart = (event: DragEvent) => scrub && event.preventDefault();
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
    lane.addEventListener('pointerdown', onDown);
    lane.addEventListener('pointermove', onMove);
    lane.addEventListener('pointerup', onUp);
    lane.addEventListener('pointercancel', onUp);
    lane.addEventListener('dragstart', onDragStart);
    start();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener('visibilitychange', start);
      lane.removeEventListener('pointerenter', onEnter);
      lane.removeEventListener('pointerleave', onLeave);
      lane.removeEventListener('pointerdown', onDown);
      lane.removeEventListener('pointermove', onMove);
      lane.removeEventListener('pointerup', onUp);
      lane.removeEventListener('pointercancel', onUp);
      lane.removeEventListener('dragstart', onDragStart);
      track.style.transform = '';
    };
  }, [index, vertical, speed, variance, alternate, slow, scrub]);

  return (
    <div ref={laneRef} className="group/lane group-data-[scrub]/mw:cursor-grab group-data-[scrub]/mw:[touch-action:pan-y] group-data-[scrub]/mw:group-data-[vertical]/mw:[touch-action:pan-x] data-[dragging]:cursor-grabbing data-[dragging]:select-none overflow-hidden [-webkit-mask-image:linear-gradient(90deg,transparent,#000_var(--bl-fade),#000_calc(100%_-_var(--bl-fade)),transparent)] [mask-image:linear-gradient(90deg,transparent,#000_var(--bl-fade),#000_calc(100%_-_var(--bl-fade)),transparent)] group-data-[vertical]/mw:min-w-0 group-data-[vertical]/mw:flex-1 group-data-[vertical]/mw:[-webkit-mask-image:linear-gradient(180deg,transparent,#000_var(--bl-fade),#000_calc(100%_-_var(--bl-fade)),transparent)] group-data-[vertical]/mw:[mask-image:linear-gradient(180deg,transparent,#000_var(--bl-fade),#000_calc(100%_-_var(--bl-fade)),transparent)]">
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
  scrub: boolean;
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
  /** Drag a lane to scrub it, with momentum on release. */
  scrub?: boolean;
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
  slow = 0,
  scrub = true,
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
      className={`bl-mwall group/mw grid-cols-[minmax(0,1fr)] relative grid gap-2.5 font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      data-vertical={vertical || undefined}
      data-scrub={scrub || undefined}
      style={{ '--bl-gap': `${gap}px`, '--bl-fade': `${fade}px`, '--bl-h': `${height}px`, '--bl-dim': dim, '--bl-ink': textColor, '--bl-accent': accentColor, '--bl-chip': chipColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <ul className="sr-only" aria-label={label}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <div className="flex min-w-0 flex-col gap-(--bl-gap) group-data-[vertical]/mw:h-(--bl-h) group-data-[vertical]/mw:flex-row" aria-hidden="true">
        {dealt.map((laneItems, l) => (
          <Lane key={l} items={laneItems} index={l} vertical={vertical} speed={speed} variance={variance} alternate={alternate} slow={slow} paused={paused} scrub={scrub} />
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
