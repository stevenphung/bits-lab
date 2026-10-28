import { Fragment, useEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// An endless banner. The items scroll past at a steady speed; scroll the page and the line
// surges with your scroll (and leans into it), flipping direction when you scroll back up, then
// eases back to cruising. Drag it to scrub. Hovering pauses it, and there's a pause button,
// since motion that keeps going needs one. Screen readers get the items once as a list; reduced
// motion shows the line still.

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
}) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const setRef = useRef(null);
  const [copies, setCopies] = useState(2);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // Enough copies of the set to cover the viewport twice, so the wrap is never visible.
  useEffect(() => {
    const viewport = viewportRef.current;
    const set = setRef.current;
    const fit = () => setCopies(Math.max(2, Math.ceil((viewport.clientWidth * 2) / Math.max(1, set.offsetWidth)) + 1));
    const resize = new ResizeObserver(fit);
    resize.observe(viewport);
    resize.observe(set);
    return () => resize.disconnect();
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const set = setRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;
    const sign = direction === 'right' ? -1 : 1;
    let offset = 0;
    let surge = 0; // extra speed from scrolling, in units of `speed`, signed
    let lastY = window.scrollY;
    let hovered = false;
    let drag = null;
    let visible = true;
    let raf = 0;
    let last = 0;

    const tick = now => {
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
    const onDown = event => {
      if (!draggable || event.button > 0) return;
      drag = { x: event.clientX, offset };
      viewport.dataset.dragging = '';
      try {
        viewport.setPointerCapture(event.pointerId);
      } catch {
        // The pointer is gone already; the drag still follows it while it stays over the line.
      }
    };
    const onMove = event => {
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

  const renderSet = (key, ref) => (
    <div key={key} ref={ref} className="flex flex-none items-center gap-(--bl-gap) pr-(--bl-gap) whitespace-nowrap">
      {items.map((item, i) => (
        <Fragment key={i}>
          <span className="inline-flex items-center gap-[0.4em]">{item}</span>
          {separator && (
            <span className="text-(--bl-accent)" aria-hidden="true">
              {separator}
            </span>
          )}
        </Fragment>
      ))}
    </div>
  );

  return (
    <div
      className={`relative flex items-center gap-2 overflow-hidden bg-(--bl-bg) px-0 py-(--bl-pad) font-(family-name:--bl-font) text-(length:--bl-size) text-(--bl-ink) ${className}`}
      style={{ '--bl-gap': `${gap}px`, '--bl-fade': `${fade}px`, '--bl-pad': `${padding}px`, '--bl-size': `${fontSize}px`, '--bl-bg': backgroundColor, '--bl-ink': textColor, '--bl-accent': accentColor, '--bl-chip': chipColor, '--bl-font': fontFamily, ...style }}
    >
      <ul className="sr-only" aria-label={label}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <div ref={viewportRef} className="min-w-0 flex-1 cursor-grab touch-pan-y overflow-hidden [-webkit-mask-image:linear-gradient(90deg,transparent,#000_var(--bl-fade),#000_calc(100%_-_var(--bl-fade)),transparent)] [mask-image:linear-gradient(90deg,transparent,#000_var(--bl-fade),#000_calc(100%_-_var(--bl-fade)),transparent)] data-[dragging]:cursor-grabbing" aria-hidden="true">
        <div ref={trackRef} className="flex w-max will-change-transform">
          {Array.from({ length: copies }, (_, i) => renderSet(i, i === 0 ? setRef : undefined))}
        </div>
      </div>
      {showPause && (
        <button type="button" className="mr-2 grid size-[30px] flex-none cursor-pointer place-items-center rounded-[8px] border-0 bg-(--bl-chip) p-0 text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" aria-pressed={paused} aria-label={paused ? `Play ${label}` : `Pause ${label}`} onClick={() => setPaused(p => !p)}>
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
