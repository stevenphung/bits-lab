import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// A moving wall of logos or cards, in lanes. Each lane loops on its own, neighbours run in
// opposite directions at slightly different speeds, and lanes can run across or up and down.
// Hover an item and its lane eases to a stop while the item steps forward and the rest of the
// lane dims, so the thing you're looking at holds still enough to read. Drag a lane to scrub it;
// let go and it coasts with momentum before settling back to its pace. A pause button
// stops everything; screen readers get each item once; reduced motion shows the lanes still.

const STYLE_ID = 'bl-marquee-wall';
const CSS = `
/* theme tokens */
.bl-mwall { --bl-ink: #f4f4f4; --bl-accent: #73eff7; --bl-chip: rgba(255,255,255,0.08); }
:where(.light, [data-theme="light"]) .bl-mwall, .bl-mwall:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-accent: #167f8f; --bl-chip: rgba(26,28,44,0.08); }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-mwall, :where(.light, [data-theme="light"]) .bl-mwall:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-accent: #73eff7; --bl-chip: rgba(255,255,255,0.08); }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-mwall, .bl-mwall:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-accent: #167f8f; --bl-chip: rgba(26,28,44,0.08); } }
/* theme tokens end */
.bl-mwall { position: relative; display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px; color: var(--bl-ink); font-family: var(--bl-font); }
.bl-mwall__lanes { display: flex; flex-direction: column; gap: var(--bl-gap); min-width: 0; }
.bl-mwall[data-vertical] .bl-mwall__lanes { flex-direction: row; height: var(--bl-h); }
.bl-mwall__lane { overflow: hidden; -webkit-mask-image: linear-gradient(90deg, transparent, #000 var(--bl-fade), #000 calc(100% - var(--bl-fade)), transparent); mask-image: linear-gradient(90deg, transparent, #000 var(--bl-fade), #000 calc(100% - var(--bl-fade)), transparent); }
.bl-mwall[data-vertical] .bl-mwall__lane { flex: 1; min-width: 0; -webkit-mask-image: linear-gradient(180deg, transparent, #000 var(--bl-fade), #000 calc(100% - var(--bl-fade)), transparent); mask-image: linear-gradient(180deg, transparent, #000 var(--bl-fade), #000 calc(100% - var(--bl-fade)), transparent); }
.bl-mwall__track { display: flex; width: max-content; will-change: transform; }
.bl-mwall[data-vertical] .bl-mwall__track { flex-direction: column; width: auto; }
.bl-mwall__set { display: flex; flex: none; gap: var(--bl-gap); padding-right: var(--bl-gap); }
.bl-mwall[data-vertical] .bl-mwall__set { flex-direction: column; padding: 0 0 var(--bl-gap); }
.bl-mwall[data-scrub] .bl-mwall__lane { cursor: grab; touch-action: pan-y; }
.bl-mwall[data-scrub][data-vertical] .bl-mwall__lane { touch-action: pan-x; }
.bl-mwall__lane[data-dragging] { cursor: grabbing; user-select: none; }
.bl-mwall__item { flex: none; transition: transform 220ms steps(3), opacity 220ms steps(3); }
.bl-mwall__lane[data-focus] .bl-mwall__item { opacity: var(--bl-dim); }
.bl-mwall__lane[data-focus] .bl-mwall__item:hover { opacity: 1; transform: scale(1.06); }
.bl-mwall__pause { justify-self: end; display: grid; place-items: center; width: 30px; height: 30px; padding: 0; border: 0; border-radius: 8px; background: var(--bl-chip); color: var(--bl-ink); cursor: pointer; }
.bl-mwall__pause:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-mwall__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .bl-mwall__item { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

function Lane({ items, index, vertical, speed, variance, alternate, slow, paused, scrub }) {
  const laneRef = useRef(null);
  const trackRef = useRef(null);
  const setRef = useRef(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const [copies, setCopies] = useState(2);

  useEffect(() => {
    const lane = laneRef.current;
    const set = setRef.current;
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
    const lane = laneRef.current;
    const track = trackRef.current;
    const set = setRef.current;
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

    const tick = now => {
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
    let drag = null;
    let fling = 0;
    const along = (event) => (vertical ? event.clientY : event.clientX);
    const onDown = (event) => {
      if (!scrub || event.button !== 0) return;
      drag = { last: along(event), time: event.timeStamp, v: 0, moved: 0 };
      fling = 0;
    };
    const onMove = (event) => {
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
        const swallow = (event) => {
          event.preventDefault();
          event.stopPropagation();
        };
        lane.addEventListener('click', swallow, { capture: true, once: true });
        setTimeout(() => lane.removeEventListener('click', swallow, { capture: true }), 0);
      }
    };
    // Images and links inside a lane would start a native drag (and cancel the pointer).
    const onDragStart = event => scrub && event.preventDefault();
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
    <div ref={laneRef} className="bl-mwall__lane">
      <div ref={trackRef} className="bl-mwall__track">
        {Array.from({ length: copies }, (_, c) => (
          <div key={c} ref={c === 0 ? setRef : undefined} className="bl-mwall__set">
            {items.map((item, i) => (
              <div key={i} className="bl-mwall__item">
                {item}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
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
}) {
  useStyles();
  const [paused, setPaused] = useState(false);
  // Deal the items round-robin into lanes, so each lane gets a mix.
  const count = Math.max(1, Math.min(lanes, items.length || 1));
  const dealt = Array.from({ length: count }, (_, l) => items.filter((_, i) => i % count === l));

  return (
    <div
      className={`bl-mwall ${className}`}
      data-vertical={vertical || undefined}
      data-scrub={scrub || undefined}
      style={{ '--bl-gap': `${gap}px`, '--bl-fade': `${fade}px`, '--bl-h': `${height}px`, '--bl-dim': dim, '--bl-ink': textColor, '--bl-accent': accentColor, '--bl-chip': chipColor, '--bl-font': fontFamily, ...style }}
    >
      <ul className="bl-mwall__sr" aria-label={label}>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      <div className="bl-mwall__lanes" aria-hidden="true">
        {dealt.map((laneItems, l) => (
          <Lane key={l} items={laneItems} index={l} vertical={vertical} speed={speed} variance={variance} alternate={alternate} slow={slow} paused={paused} scrub={scrub} />
        ))}
      </div>
      {showPause && (
        <button type="button" className="bl-mwall__pause" aria-pressed={paused} aria-label={paused ? `Play ${label}` : `Pause ${label}`} onClick={() => setPaused(p => !p)}>
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
