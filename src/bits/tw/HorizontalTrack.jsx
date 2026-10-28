import { Children, useEffect, useInsertionEffect, useRef, useState } from 'react';

const STYLE_ID = 'bl-horizontal-track-tw';
const CSS = `
/* theme tokens */
.bl-htrack { --bl-accent: #ffcd75; --bl-muted: #94b0c2; --bl-track: rgba(148,176,194,0.2); }
:where(.light, [data-theme="light"]) .bl-htrack, .bl-htrack:where(.light, [data-theme="light"]) { --bl-accent: #a86a12; --bl-muted: #566c86; --bl-track: rgba(86,108,134,0.2); }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-htrack, :where(.light, [data-theme="light"]) .bl-htrack:where(.dark, [data-theme="dark"]) { --bl-accent: #ffcd75; --bl-muted: #94b0c2; --bl-track: rgba(148,176,194,0.2); }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-htrack, .bl-htrack:where([data-theme="system"]) { --bl-accent: #a86a12; --bl-muted: #566c86; --bl-track: rgba(86,108,134,0.2); } }
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

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Vertical scroll drives a horizontal gallery: the section pins, and the track slides
// sideways as you scroll, with optional snapping to each item, a progress bar and a counter.
// Focusing an item scrolls it into view. Under reduced motion it becomes a plain
// swipeable row with CSS scroll snap.

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
  accentColor,
  mutedColor,
  trackColor,
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
      className={`bl-htrack relative h-(--bl-len) motion-reduce:h-auto ${className}`}
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
      <div ref={stageRef} className="sticky top-0 flex h-(--bl-stage) flex-col justify-center overflow-hidden motion-reduce:relative motion-reduce:h-auto motion-reduce:py-8">
        {header && <div className="mb-5 px-(--bl-pad)">{header}</div>}
        <div ref={rowRef} className="flex w-max gap-(--bl-gap) px-(--bl-pad) [transform:translate3d(calc(var(--bl-x)*-1px),0,0)] will-change-transform motion-reduce:w-auto motion-reduce:snap-x motion-reduce:snap-mandatory motion-reduce:overflow-x-auto motion-reduce:pb-3 motion-reduce:[transform:none]" role="list">
          {items.map((child, index) => (
            <div
              key={child.key ?? index}
              className="w-(--bl-item) max-w-[calc(100vw_-_var(--bl-pad)*2)] flex-none outline-none focus-visible:shadow-[0_0_0_3px_var(--bl-accent)] motion-reduce:snap-start"
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
          <div className="flex items-center gap-4 px-(--bl-pad) pt-[22px] font-(family-name:--bl-font) text-[13px] leading-none font-semibold text-(--bl-muted) tabular-nums motion-reduce:hidden" aria-hidden="true">
            <span>
              {String(current + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-(--bl-bar-radius) bg-(--bl-track)">
              <div className="h-full origin-left bg-(--bl-accent) [transform:scaleX(var(--bl-p))]" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
