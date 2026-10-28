import { Children, useEffect, useInsertionEffect, useRef, useState } from 'react';

// Vertical scroll drives a horizontal gallery: the section pins, and the track slides
// sideways as you scroll, with optional snapping to each item, a progress bar and a counter.
// Focusing an item scrolls it into view. Under reduced motion it becomes a plain
// swipeable row with CSS scroll snap.

const STYLE_ID = 'bl-horizontal-track';
const CSS = `
.bl-htrack { position: relative; height: var(--bl-len); }
.bl-htrack__stage { position: sticky; top: 0; height: var(--bl-stage); display: flex; flex-direction: column; justify-content: center; overflow: hidden; }
.bl-htrack__header { padding: 0 var(--bl-pad); margin-bottom: 20px; }
.bl-htrack__row { display: flex; gap: var(--bl-gap); width: max-content; padding: 0 var(--bl-pad); transform: translate3d(calc(var(--bl-x) * -1px), 0, 0); will-change: transform; }
.bl-htrack__item { flex: 0 0 auto; width: var(--bl-item); max-width: calc(100vw - var(--bl-pad) * 2); outline: none; }
.bl-htrack__item:focus-visible { box-shadow: 0 0 0 3px var(--bl-accent); }
.bl-htrack__footer { display: flex; align-items: center; gap: 16px; padding: 22px var(--bl-pad) 0; color: var(--bl-muted); font: 600 13px/1 var(--bl-font); font-variant-numeric: tabular-nums; }
.bl-htrack__bar { flex: 1; height: 4px; border-radius: var(--bl-bar-radius); background: var(--bl-track); overflow: hidden; }
.bl-htrack__fill { height: 100%; background: var(--bl-accent); transform-origin: left; transform: scaleX(var(--bl-p)); }
@media (prefers-reduced-motion: reduce) {
  .bl-htrack { height: auto; }
  .bl-htrack__stage { position: relative; height: auto; padding: 32px 0; }
  .bl-htrack__row { transform: none; width: auto; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 12px; }
  .bl-htrack__item { scroll-snap-align: start; }
  .bl-htrack__footer { display: none; }
}
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

function scrollParent(node) {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) return el;
  }
  return window;
}

export default function HorizontalTrack({
  children,
  header,
  itemWidth = 420,
  gap = 24,
  padding = 48,
  stageHeight = '100vh',
  snap = true,
  showProgress = true,
  label = 'Gallery',
  accentColor = '#ffcd75',
  mutedColor = '#94b0c2',
  trackColor = 'rgba(148,176,194,0.2)',
  barRadius = 2,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const rowRef = useRef(null);
  const [length, setLength] = useState(null);
  const [current, setCurrent] = useState(0);
  const items = Children.toArray(children);
  const geometry = useRef({ travel: 0, scroller: null });

  // Scroll offset (in the scroll container) at which the section starts and the travel distance.
  const sectionStart = () => {
    const { scroller } = geometry.current;
    const rect = rootRef.current.getBoundingClientRect();
    if (scroller === window) return rect.top + window.scrollY;
    return rect.top - scroller.getBoundingClientRect().top + scroller.scrollTop;
  };
  const scrollTo = (top, smooth = true) => {
    const { scroller } = geometry.current;
    scroller.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    const row = rowRef.current;
    const scroller = scrollParent(root);
    geometry.current.scroller = scroller;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    let frame = 0;
    let idle = 0;
    let lastIndex = -1;

    const measure = () => {
      const travel = Math.max(0, row.scrollWidth - stage.clientWidth);
      geometry.current.travel = travel;
      setLength(prev => (prev === travel + stage.clientHeight ? prev : travel + stage.clientHeight));
    };

    const update = () => {
      frame = 0;
      const { travel } = geometry.current;
      const rect = root.getBoundingClientRect();
      const viewTop = scroller === window ? 0 : scroller.getBoundingClientRect().top;
      const progress = travel ? Math.min(1, Math.max(0, (viewTop - rect.top) / travel)) : 0;
      root.style.setProperty('--bl-x', (progress * travel).toFixed(1));
      root.style.setProperty('--bl-p', progress.toFixed(4));
      const step = row.children[1] ? row.children[1].offsetLeft - row.children[0].offsetLeft : 1;
      const index = Math.min(row.children.length - 1, Math.round((progress * travel) / step));
      if (index !== lastIndex) {
        lastIndex = index;
        setCurrent(index);
      }
    };

    // After scrolling settles inside the pinned range, glide to the nearest item.
    const settle = () => {
      const { travel } = geometry.current;
      const start = sectionStart();
      const offset = (scroller === window ? window.scrollY : scroller.scrollTop) - start;
      if (offset <= 2 || offset >= travel - 2) return;
      const lefts = [...row.children].map(child => Math.min(travel, child.offsetLeft - row.children[0].offsetLeft));
      const nearest = lefts.reduce((best, x) => (Math.abs(x - offset) < Math.abs(best - offset) ? x : best), lefts[0]);
      if (Math.abs(nearest - offset) > 2) scrollTo(start + nearest);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
      if (snap) {
        clearTimeout(idle);
        idle = setTimeout(settle, 140);
      }
    };

    const observer = new ResizeObserver(() => {
      measure();
      onScroll();
    });
    observer.observe(stage);
    observer.observe(row);
    measure();
    update();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(idle);
      observer.disconnect();
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snap, items.length]);

  // Keyboard users tab through items; move the page so the focused one is on screen.
  const onFocus = (event, index) => {
    if (!event.target.matches(':focus-visible')) return;
    const row = rowRef.current;
    const { travel, scroller } = geometry.current;
    if (!scroller || !travel) return;
    const x = Math.min(travel, row.children[index].offsetLeft - row.children[0].offsetLeft);
    scrollTo(sectionStart() + x);
  };

  return (
    <section
      ref={rootRef}
      className={`bl-htrack ${className}`}
      aria-label={label}
      style={{
        '--bl-len': length == null ? stageHeight : `${length}px`,
        '--bl-stage': stageHeight,
        '--bl-item': `${itemWidth}px`,
        '--bl-gap': `${gap}px`,
        '--bl-pad': `${padding}px`,
        '--bl-accent': accentColor,
        '--bl-muted': mutedColor,
        '--bl-track': trackColor,
        '--bl-bar-radius': `${barRadius}px`,
        '--bl-font': fontFamily,
        '--bl-x': 0,
        '--bl-p': 0,
        ...style
      }}
    >
      <div ref={stageRef} className="bl-htrack__stage">
        {header && <div className="bl-htrack__header">{header}</div>}
        <div ref={rowRef} className="bl-htrack__row" role="list">
          {items.map((child, index) => (
            <div
              key={child.key ?? index}
              className="bl-htrack__item"
              role="listitem"
              tabIndex={0}
              aria-label={`${index + 1} of ${items.length}`}
              onFocus={event => onFocus(event, index)}
            >
              {child}
            </div>
          ))}
        </div>
        {showProgress && items.length > 1 && (
          <div className="bl-htrack__footer" aria-hidden="true">
            <span>
              {String(current + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </span>
            <div className="bl-htrack__bar">
              <div className="bl-htrack__fill" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
