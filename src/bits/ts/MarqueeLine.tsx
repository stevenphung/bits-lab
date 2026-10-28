import { Fragment, useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type Ref } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// An endless banner. The items scroll past at a steady speed; scroll the page and the line
// surges with your scroll (and leans into it), flipping direction when you scroll back up, then
// eases back to cruising. Drag it to scrub. Hovering pauses it, and there's a pause button,
// since motion that keeps going needs one. Screen readers get the items once as a list; reduced
// motion shows the line still.

const STYLE_ID = 'bl-marquee-line';
const CSS = `
.bl-marquee { position: relative; display: flex; align-items: center; gap: 8px; overflow: hidden; padding: var(--bl-pad) 0; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); font-size: var(--bl-size); }
.bl-marquee__viewport { flex: 1; min-width: 0; overflow: hidden; cursor: grab; touch-action: pan-y; -webkit-mask-image: linear-gradient(90deg, transparent, #000 var(--bl-fade), #000 calc(100% - var(--bl-fade)), transparent); mask-image: linear-gradient(90deg, transparent, #000 var(--bl-fade), #000 calc(100% - var(--bl-fade)), transparent); }
.bl-marquee__viewport[data-dragging] { cursor: grabbing; }
.bl-marquee__track { display: flex; width: max-content; will-change: transform; }
.bl-marquee__set { display: flex; flex: none; align-items: center; gap: var(--bl-gap); padding-right: var(--bl-gap); white-space: nowrap; }
.bl-marquee__item { display: inline-flex; align-items: center; gap: 0.4em; }
.bl-marquee__sep { color: var(--bl-accent); }
.bl-marquee__pause { flex: none; display: grid; place-items: center; width: 30px; height: 30px; margin-right: 8px; padding: 0; border: 0; border-radius: 8px; background: var(--bl-chip); color: var(--bl-ink); cursor: pointer; }
.bl-marquee__pause:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-marquee__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface MarqueeLineProps {
  /** What scrolls past. */
  items?: ReactNode[];
  /** Cruising speed in px per second. */
  speed?: number;
  direction?: 'left' | 'right';
  /** Scroll surge: up to this many times cruising speed (scrolling up can reverse it). */
  boost?: number;
  /** Lean in degrees at full surge. */
  skew?: number;
  separator?: ReactNode;
  pauseOnHover?: boolean;
  /** Drag to scrub. */
  draggable?: boolean;
  /** A pause button; motion that runs for more than 5 seconds needs one. */
  showPause?: boolean;
  /** Name of the items list for screen readers, and of the pause button. */
  label?: string;
  gap?: number;
  /** Width of the faded edges in px. */
  fade?: number;
  padding?: number;
  fontSize?: number;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  chipColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function MarqueeLine({
  items = [],
  speed = 60,
  direction = 'left',
  boost = 6,
  skew = 8,
  separator = '✦',
  pauseOnHover = true,
  draggable = true,
  showPause = true,
  label = 'Announcements',
  gap = 28,
  fade = 48,
  padding = 14,
  fontSize = 22,
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  accentColor = '#ffcd75',
  chipColor = 'rgba(255,255,255,0.08)',
  fontFamily = 'inherit',
  className = '',
  style
}: MarqueeLineProps) {
  useStyles();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Enough copies of the set to cover the viewport twice, so the wrap is never visible.
  useEffect(() => {
    const viewport = viewportRef.current!;
    const set = setRef.current!;
    const fit = () => setCopies(Math.max(2, Math.ceil((viewport.clientWidth * 2) / Math.max(1, set.offsetWidth)) + 1));
    const resize = new ResizeObserver(fit);
    resize.observe(viewport);
    resize.observe(set);
    return () => resize.disconnect();
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current!;
    const track = trackRef.current!;
    const set = setRef.current!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;
    const sign = direction === 'right' ? -1 : 1;
    let offset = 0;
    let surge = 0; // extra speed from scrolling, in units of `speed`, signed
    let lastY = window.scrollY;
    let hovered = false;
    let drag: { x: number; offset: number } | null = null;
    let visible = true;
    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      const y = window.scrollY;
      const scrolled = (y - lastY) / Math.max(dt, 0.001);
      lastY = y;
      // Scroll speed in px/s becomes a surge of up to `boost` times cruising speed, then decays.
      const kick = Math.max(-boost, Math.min(boost, scrolled / 400));
      if (Math.abs(kick) > Math.abs(surge)) surge = kick;
      surge *= Math.exp(-dt * 2.5);
      const holding = pausedRef.current || (pauseOnHover && hovered);
      // Scrolling down speeds the line up; scrolling up slows it and, past a point, reverses it.
      if (!drag && !holding) offset += sign * speed * (1 + surge) * dt;
      const width = set.offsetWidth || 1;
      offset = ((offset % width) + width) % width;
      const lean = holding ? 0 : Math.max(-1, Math.min(1, surge / boost)) * skew * sign;
      track.style.transform = `translateX(${-offset.toFixed(2)}px) skewX(${(-lean).toFixed(2)}deg)`;
      raf = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      lastY = window.scrollY;
      raf = requestAnimationFrame(tick);
    };

    const onEnter = () => (hovered = true);
    const onLeave = () => (hovered = false);
    const onDown = (event: PointerEvent) => {
      if (!draggable || event.button > 0) return;
      drag = { x: event.clientX, offset };
      viewport.dataset.dragging = '';
      try {
        viewport.setPointerCapture(event.pointerId);
      } catch {
        // The pointer is gone already; the drag still follows it while it stays over the line.
      }
    };
    const onMove = (event: PointerEvent) => {
      if (drag) offset = drag.offset - (event.clientX - drag.x);
    };
    const onUp = () => {
      drag = null;
      delete viewport.dataset.dragging;
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    observer.observe(viewport);
    const onVisibility = () => start();
    document.addEventListener('visibilitychange', onVisibility);
    viewport.addEventListener('pointerenter', onEnter);
    viewport.addEventListener('pointerleave', onLeave);
    viewport.addEventListener('pointerdown', onDown);
    viewport.addEventListener('pointermove', onMove);
    viewport.addEventListener('pointerup', onUp);
    viewport.addEventListener('pointercancel', onUp);
    start();
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      viewport.removeEventListener('pointerenter', onEnter);
      viewport.removeEventListener('pointerleave', onLeave);
      viewport.removeEventListener('pointerdown', onDown);
      viewport.removeEventListener('pointermove', onMove);
      viewport.removeEventListener('pointerup', onUp);
      viewport.removeEventListener('pointercancel', onUp);
      track.style.transform = '';
    };
  }, [speed, direction, boost, skew, pauseOnHover, draggable]);

  const renderSet = (key: number, ref?: Ref<HTMLDivElement>) => (
    <div key={key} ref={ref} className="bl-marquee__set">
      {items.map((item, i) => (
        <Fragment key={i}>
          <span className="bl-marquee__item">{item}</span>
          {separator && (
            <span className="bl-marquee__sep" aria-hidden="true">
              {separator}
            </span>
          )}
        </Fragment>
      ))}
    </div>
  );

  return (
    <div
      className={`bl-marquee ${className}`}
      style={{ '--bl-gap': `${gap}px`, '--bl-fade': `${fade}px`, '--bl-pad': `${padding}px`, '--bl-size': `${fontSize}px`, '--bl-bg': backgroundColor, '--bl-ink': textColor, '--bl-accent': accentColor, '--bl-chip': chipColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <ul className="bl-marquee__sr" aria-label={label}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <div ref={viewportRef} className="bl-marquee__viewport" aria-hidden="true">
        <div ref={trackRef} className="bl-marquee__track">
          {Array.from({ length: copies }, (_, i) => renderSet(i, i === 0 ? setRef : undefined))}
        </div>
      </div>
      {showPause && (
        <button type="button" className="bl-marquee__pause" aria-pressed={paused} aria-label={paused ? `Play ${label}` : `Pause ${label}`} onClick={() => setPaused(p => !p)}>
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
