import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A wall of testimonials in several marquee rows that drift in alternating directions at
// slightly different speeds. Hovering or focusing a row pauses it, and the card under the
// pointer lifts and shows its full quote. A Pause button stops all motion (moving content
// must be pausable), rows fade at the edges, and under reduced motion each row becomes a
// plain horizontal scroller. Only the first copy of each row is exposed to screen readers.

const STYLE_ID = 'bl-testimonial-wall-tw';
const CSS = `
@keyframes bl-wall-scroll { to { transform: translateX(-50%); } }
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
      <figure className="group/card relative m-0 box-border grid w-(--bl-card-w) gap-3 rounded-(--bl-radius) bg-(--bl-card) p-[18px] shadow-[0_0_0_1px_var(--bl-line)] outline-none [transition:transform_220ms_cubic-bezier(.2,.9,.25,1.2),box-shadow_220ms] hover:z-1 hover:[transform:translateY(-4px)_scale(1.03)] hover:shadow-[0_0_0_2px_var(--bl-accent),0_18px_40px_-18px_rgba(0,0,0,0.7)] focus-visible:z-1 focus-visible:[transform:translateY(-4px)_scale(1.03)] focus-visible:shadow-[0_0_0_2px_var(--bl-accent),0_18px_40px_-18px_rgba(0,0,0,0.7)]" tabIndex={hidden ? -1 : 0}>
        <blockquote className="m-0 [display:-webkit-box] overflow-hidden text-[15px] leading-[1.55] text-(--bl-ink) [-webkit-box-orient:vertical] [-webkit-line-clamp:var(--bl-lines)] group-hover/card:[-webkit-line-clamp:unset] group-focus-visible/card:[-webkit-line-clamp:unset]">{item.quote}</blockquote>
        <figcaption className="flex min-w-0 items-center gap-2.5">
          {item.avatar && <span className="grid size-9 flex-none place-items-center overflow-hidden rounded-[50%] bg-(--bl-line) [&_img]:h-full [&_img]:w-full [&_img]:object-cover">{typeof item.avatar === 'string' ? <img src={item.avatar} alt="" /> : item.avatar}</span>}
          <span>
            <cite className="block text-[14px] font-bold not-italic">{item.name}</cite>
            {item.role && <span className="block text-[13px] text-(--bl-muted)">{item.role}</span>}
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
    <div className="group/row relative overflow-hidden py-3.5 [mask-image:linear-gradient(90deg,transparent,#000_var(--bl-fade),#000_calc(100%_-_var(--bl-fade)),transparent)] motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]">
      <div className="flex w-max animate-[bl-wall-scroll_var(--bl-dur,60s)_linear_infinite] [animation-direction:var(--bl-dir,normal)] group-hover/row:[animation-play-state:paused] group-focus-within/row:[animation-play-state:paused] group-data-[paused]/wall:[animation-play-state:paused] motion-reduce:animate-none" style={{ '--bl-dur': `${duration}s`, '--bl-dir': reverse ? 'reverse' : 'normal' }}>
        <ul ref={setRef} className="m-0 flex flex-none list-none items-start gap-(--bl-gap) py-0 pr-(--bl-gap) pl-0 motion-reduce:aria-hidden:hidden">
          {items.map((item, i) => (
            <Card key={i} item={item} />
          ))}
        </ul>
        <ul className="m-0 flex flex-none list-none items-start gap-(--bl-gap) py-0 pr-(--bl-gap) pl-0 motion-reduce:aria-hidden:hidden" aria-hidden="true">
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
      className={`group/wall relative grid w-full gap-(--bl-gap) font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
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
        <button type="button" className="inline-flex cursor-pointer items-center gap-1.5 [justify-self:end] rounded-full border-0 bg-(--bl-card) px-3 py-1.5 text-[13px] text-(--bl-muted) shadow-[0_0_0_1px_var(--bl-line)] hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) motion-reduce:hidden" onClick={() => setPaused(p => !p)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            {paused ? <path d="M3 1.5v9l7.5-4.5z" /> : <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" />}
          </svg>
          {paused ? playLabel : pauseLabel}
        </button>
      )}
    </section>
  );
}
