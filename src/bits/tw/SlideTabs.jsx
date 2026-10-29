import { useId, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

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

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Tabs with an indicator that stretches toward the next tab before catching up, like a
// caterpillar. Pill or underline style. Overflowing tab rows scroll, fade at the edges and
// keep the active tab in view. Full ARIA tabs pattern: arrows, Home/End, automatic or
// manual activation, and optional panels. In pill style the pill can also be dragged to a tab.

export default function SlideTabs({
  items = [],
  value,
  defaultValue,
  onChange,
  variant = 'pill',
  stretch = true,
  activation = 'automatic',
  dragToSwitch = true,
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
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState(defaultValue ?? items[0]?.id);
  const selected = value ?? inner;
  const [focusIndex, setFocusIndex] = useState(null);
  const scrollerRef = useRef(null);
  const tabRefs = useRef([]);
  const indicatorRef = useRef(null);
  const last = useRef(null);
  const [fades, setFades] = useState([0, 0]);
  const selectedIndex = Math.max(0, items.findIndex(item => item.id === selected));

  const select = index => {
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
    const right = tab.offsetParent.clientWidth - (tab.offsetLeft + tab.offsetWidth);
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
    observer.observe(scrollerRef.current);
    tabRefs.current.forEach(tab => tab && observer.observe(tab));
    updateFades();
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, selectedIndex]);

  const onKeyDown = event => {
    const current = focusIndex ?? selectedIndex;
    const keys = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: items.length - 1 };
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


  // Drag the pill (pill style only): it follows the pointer, and letting go selects the tab
  // nearest its centre. A drag needs 4px of movement, so a plain click still just clicks.
  const drag = useRef(null);
  const dragged = useRef(false);
  const [dragging, setDragging] = useState(false);
  const canDrag = dragToSwitch && variant === 'pill';

  const onPointerDown = event => {
    const tab = event.target.closest('[role="tab"]');
    const indicator = indicatorRef.current;
    if (!canDrag || event.button !== 0 || !tab || !indicator || tabRefs.current.indexOf(tab) !== selectedIndex) return;
    drag.current = { x: event.clientX, id: event.pointerId, left: indicator.offsetLeft, pill: indicator.offsetWidth, moved: false, target: selectedIndex };
  };

  const onPointerMove = event => {
    const d = drag.current;
    const indicator = indicatorRef.current;
    if (!d || d.id !== event.pointerId || !indicator) return;
    const dx = event.clientX - d.x;
    if (!d.moved) {
      if (Math.abs(dx) < 4) return;
      d.moved = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      setDragging(true);
    }
    const tabs = tabRefs.current.filter(Boolean);
    const first = tabs[0];
    const end = tabs[tabs.length - 1];
    const width = indicator.offsetParent.clientWidth;
    const left = Math.min(Math.max(d.left + dx, first.offsetLeft), end.offsetLeft + end.offsetWidth - d.pill);
    indicator.style.transition = 'none';
    indicator.style.left = `${left}px`;
    indicator.style.right = `${width - left - d.pill}px`;
    last.current = { left, right: width - left - d.pill };
    const centre = left + d.pill / 2;
    d.target = tabs.reduce((best, tab, i) => (Math.abs(tab.offsetLeft + tab.offsetWidth / 2 - centre) < Math.abs(tabs[best].offsetLeft + tabs[best].offsetWidth / 2 - centre) ? i : best), 0);
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.moved) return;
    // Swallow the click this release produces (if any), then forget about it.
    dragged.current = true;
    setTimeout(() => {
      dragged.current = false;
    }, 0);
    setDragging(false);
    if (d.target === selectedIndex) place(true);
    else {
      setFocusIndex(d.target);
      select(d.target);
    }
    tabRefs.current[d.target]?.focus({ preventScroll: true });
  };

  const panel = items[selectedIndex]?.content;

  return (
    <div
      className={`bl-stabs group/tabs max-w-full min-w-0 font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      data-variant={variant}
      data-draggable={canDrag || undefined}
      data-dragging={dragging || undefined}
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
      }}
    >
      <div ref={scrollerRef} className="relative overflow-x-auto [scrollbar-width:none] [mask-image:linear-gradient(to_right,transparent_0,#000_var(--bl-fade-l),#000_calc(100%_-_var(--bl-fade-r)),transparent_100%)] [&::-webkit-scrollbar]:hidden" onScroll={updateFades}>
        <div className="relative box-border inline-flex min-w-full group-data-[dragging]/tabs:cursor-grabbing group-data-[dragging]/tabs:select-none gap-(--bl-gap) rounded-(--bl-radius) bg-(--bl-track) p-(--bl-pad) group-data-[variant=underline]/tabs:rounded-none group-data-[variant=underline]/tabs:bg-transparent group-data-[variant=underline]/tabs:p-0 group-data-[variant=underline]/tabs:shadow-[inset_0_-1px_0_var(--bl-line)]" role="tablist" aria-label={label} onKeyDown={onKeyDown} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          <span ref={indicatorRef} className="pointer-events-none absolute top-(--bl-pad) bottom-(--bl-pad) rounded-[calc(var(--bl-radius)_-_var(--bl-pad)/2)] bg-(--bl-active-bg) shadow-[0_1px_3px_rgba(0,0,0,0.3)] group-data-[variant=underline]/tabs:top-auto group-data-[variant=underline]/tabs:bottom-0 group-data-[variant=underline]/tabs:h-[3px] group-data-[variant=underline]/tabs:rounded-[3px] group-data-[variant=underline]/tabs:bg-(--bl-accent) group-data-[variant=underline]/tabs:shadow-none motion-reduce:transition-none!" aria-hidden="true" />
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={node => {
                tabRefs.current[index] = node;
              }}
              id={`${uid}-tab-${index}`}
              className="relative z-1 inline-flex flex-none cursor-pointer items-center gap-2 rounded-[calc(var(--bl-radius)_-_var(--bl-pad)/2)] border-0 bg-transparent px-4 py-[9px] text-(length:--bl-size) font-semibold whitespace-nowrap text-(--bl-muted) transition-[color] duration-200 ease-[ease] hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--bl-accent) aria-selected:text-(--bl-active-ink) group-data-[variant=underline]/tabs:px-3.5 group-data-[variant=underline]/tabs:py-3 group-data-[variant=underline]/tabs:aria-selected:text-(--bl-ink) group-data-[draggable]/tabs:aria-selected:cursor-grab group-data-[draggable]/tabs:aria-selected:touch-pan-y group-data-[dragging]/tabs:cursor-grabbing group-data-[dragging]/tabs:select-none"
              role="tab"
              type="button"
              aria-selected={index === selectedIndex}
              aria-controls={item.content !== undefined ? `${uid}-panel` : undefined}
              tabIndex={index === (focusIndex ?? selectedIndex) ? 0 : -1}
              onClick={() => {
                // The click that ends a drag has already been handled.
                if (dragged.current) {
                  dragged.current = false;
                  return;
                }
                setFocusIndex(index);
                select(index);
              }}
              onBlur={event => !event.currentTarget.parentElement.contains(event.relatedTarget) && setFocusIndex(null)}
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
