import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// A wall of testimonials in several marquee rows that drift in alternating directions at
// slightly different speeds. Hovering or focusing a row pauses it, and the card under the
// pointer lifts and shows its full quote. A Pause button stops all motion (moving content
// must be pausable), rows fade at the edges, and under reduced motion each row becomes a
// plain horizontal scroller. Only the first copy of each row is exposed to screen readers.

const STYLE_ID = 'bl-testimonial-wall';
const CSS = `
.bl-wall { position: relative; display: grid; gap: var(--bl-gap); width: 100%; color: var(--bl-ink); font-family: var(--bl-font); }
.bl-wall__row { position: relative; overflow: hidden; padding: 14px 0; -webkit-mask-image: linear-gradient(90deg, transparent, #000 var(--bl-fade), #000 calc(100% - var(--bl-fade)), transparent); mask-image: linear-gradient(90deg, transparent, #000 var(--bl-fade), #000 calc(100% - var(--bl-fade)), transparent); }
.bl-wall__track { display: flex; width: max-content; animation: bl-wall-scroll var(--bl-dur, 60s) linear infinite; animation-direction: var(--bl-dir, normal); }
.bl-wall__set { display: flex; flex: 0 0 auto; align-items: flex-start; gap: var(--bl-gap); margin: 0; padding: 0 var(--bl-gap) 0 0; list-style: none; }
.bl-wall__row:hover .bl-wall__track, .bl-wall__row:focus-within .bl-wall__track, .bl-wall[data-paused] .bl-wall__track { animation-play-state: paused; }
.bl-wall__card { position: relative; display: grid; gap: 12px; width: var(--bl-card-w); margin: 0; padding: 18px; box-sizing: border-box; border-radius: var(--bl-radius); background: var(--bl-card); box-shadow: 0 0 0 1px var(--bl-line); outline: none; transition: transform 220ms cubic-bezier(.2,.9,.25,1.2), box-shadow 220ms; }
.bl-wall__card:hover, .bl-wall__card:focus-visible { z-index: 1; transform: translateY(-4px) scale(1.03); box-shadow: 0 0 0 2px var(--bl-accent), 0 18px 40px -18px rgba(0,0,0,0.7); }
.bl-wall__quote { margin: 0; color: var(--bl-ink); font-size: 15px; line-height: 1.55; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: var(--bl-lines); overflow: hidden; }
.bl-wall__card:hover .bl-wall__quote, .bl-wall__card:focus-visible .bl-wall__quote { -webkit-line-clamp: unset; }
.bl-wall__who { display: flex; align-items: center; gap: 10px; min-width: 0; }
.bl-wall__avatar { flex: 0 0 auto; display: grid; place-items: center; width: 36px; height: 36px; overflow: hidden; border-radius: 50%; background: var(--bl-line); }
.bl-wall__avatar img { width: 100%; height: 100%; object-fit: cover; }
.bl-wall__name { display: block; font-size: 14px; font-weight: 700; font-style: normal; }
.bl-wall__role { display: block; color: var(--bl-muted); font-size: 13px; }
.bl-wall__pause { justify-self: end; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 0; border-radius: 999px; background: var(--bl-card); color: var(--bl-muted); font: inherit; font-size: 13px; cursor: pointer; box-shadow: 0 0 0 1px var(--bl-line); }
.bl-wall__pause:hover { color: var(--bl-ink); }
.bl-wall__pause:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
@keyframes bl-wall-scroll { to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) {
  .bl-wall__row { overflow-x: auto; -webkit-mask-image: none; mask-image: none; }
  .bl-wall__track { animation: none; }
  .bl-wall__set[aria-hidden] { display: none; }
  .bl-wall__pause { display: none; }
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

function Card({ item, hidden }) {
  return (
    <li>
      <figure className="bl-wall__card" tabIndex={hidden ? -1 : 0}>
        <blockquote className="bl-wall__quote">{item.quote}</blockquote>
        <figcaption className="bl-wall__who">
          {item.avatar && <span className="bl-wall__avatar">{typeof item.avatar === 'string' ? <img src={item.avatar} alt="" /> : item.avatar}</span>}
          <span>
            <cite className="bl-wall__name">{item.name}</cite>
            {item.role && <span className="bl-wall__role">{item.role}</span>}
          </span>
        </figcaption>
      </figure>
    </li>
  );
}

// Moves at `speed` px/s whatever the row's length, by timing the loop from its width.
function Row({ items, reverse, speed }) {
  const setRef = useRef(null);
  const [duration, setDuration] = useState(60);
  useEffect(() => {
    const node = setRef.current;
    const measure = () => setDuration(Math.max(8, node.offsetWidth / speed));
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    measure();
    return () => resize.disconnect();
  }, [speed]);
  return (
    <div className="bl-wall__row">
      <div className="bl-wall__track" style={{ '--bl-dur': `${duration}s`, '--bl-dir': reverse ? 'reverse' : 'normal' }}>
        <ul ref={setRef} className="bl-wall__set">
          {items.map((item, i) => (
            <Card key={i} item={item} />
          ))}
        </ul>
        <ul className="bl-wall__set" aria-hidden="true">
          {items.map((item, i) => (
            <Card key={i} item={item} hidden />
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function TestimonialWall({
  testimonials = [],
  rows = 3,
  speed = 30,
  cardWidth = 300,
  lines = 4,
  gap = 16,
  fade = 80,
  showPause = true,
  pauseLabel = 'Pause',
  playLabel = 'Play',
  label = 'What people say',
  backgroundColor = '#1a1c2c',
  cardColor = '#262b44',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = '#333c57',
  accentColor = '#73eff7',
  radius = 14,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const [paused, setPaused] = useState(false);
  const rowCount = Math.max(1, Math.min(rows, testimonials.length || 1));
  // Deal the quotes into rows, each row starting at a different place so rows don't match.
  const perRow = Math.max(3, Math.ceil(testimonials.length / rowCount));
  const dealt = Array.from({ length: rowCount }, (_, r) =>
    testimonials.length ? Array.from({ length: perRow }, (_, i) => testimonials[(r * perRow + i) % testimonials.length]) : []
  );

  return (
    <section
      className={`bl-wall ${className}`}
      aria-label={label}
      data-paused={paused || undefined}
      style={{
        '--bl-gap': `${gap}px`,
        '--bl-fade': `${fade}px`,
        '--bl-card-w': `min(${cardWidth}px, 80vw)`,
        '--bl-lines': lines,
        '--bl-bg': backgroundColor,
        '--bl-card': cardColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-radius': `${radius}px`,
        '--bl-font': fontFamily,
        ...style
      }}
    >
      {dealt.map((items, r) => (
        <Row key={r} items={items} reverse={r % 2 === 1} speed={speed * (1 + (r % 3) * 0.18)} />
      ))}
      {showPause && (
        <button type="button" className="bl-wall__pause" onClick={() => setPaused(p => !p)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            {paused ? <path d="M3 1.5v9l7.5-4.5z" /> : <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" />}
          </svg>
          {paused ? playLabel : pauseLabel}
        </button>
      )}
    </section>
  );
}
