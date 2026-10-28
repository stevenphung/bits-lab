import { useInsertionEffect, useRef, useState } from 'react';

// A card whose overlay slides in from the side the pointer entered, and leaves toward the
// side it exited, so moving across a grid feels like the overlay follows you. Keyboard focus
// brings the overlay up from the bottom. The overlay is ordinary content (titles, links),
// readable and focusable at all times.

const STYLE_ID = 'bl-direction-hover';
const CSS = `
.bl-dh { position: relative; overflow: hidden; border-radius: var(--bl-radius); isolation: isolate; outline: none; }
.bl-dh:focus-visible { box-shadow: 0 0 0 3px var(--bl-accent); }
.bl-dh__base { display: block; transition: transform var(--bl-dur) cubic-bezier(.2,.9,.25,1); }
.bl-dh[data-open] .bl-dh__base { transform: scale(var(--bl-zoom)); }
.bl-dh__overlay { position: absolute; inset: 0; z-index: 1; display: flex; flex-direction: column; justify-content: flex-end; padding: 16px; box-sizing: border-box; background: var(--bl-overlay); color: var(--bl-ink); transform: translate(var(--bl-x, 0), var(--bl-y, 100%)); transition: transform var(--bl-dur) cubic-bezier(.2,.9,.25,1); }
.bl-dh[data-open] .bl-dh__overlay { transform: translate(0, 0); }
.bl-dh[data-instant] .bl-dh__overlay { transition: none; }
@media (prefers-reduced-motion: reduce) { .bl-dh__overlay { transform: none; opacity: 0; transition: opacity 150ms; } .bl-dh[data-open] .bl-dh__overlay { opacity: 1; } .bl-dh__base { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const OFFSETS = { top: ['0', '-100%'], right: ['100%', '0'], bottom: ['0', '100%'], left: ['-100%', '0'] };

// Which edge a point is nearest to, correcting for the card's aspect ratio.
function edgeOf(rect, x, y) {
  const dx = (x - rect.left - rect.width / 2) / (rect.width / 2);
  const dy = (y - rect.top - rect.height / 2) / (rect.height / 2);
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'bottom' : 'top';
}

export default function DirectionHover({
  children,
  overlay,
  duration = 320,
  zoom = 1.06,
  radius = 14,
  overlayColor = 'linear-gradient(to top, rgba(11,11,20,0.92), rgba(11,11,20,0.55))',
  textColor = '#f4f4f4',
  accentColor = '#73eff7',
  className = '',
  style,
  ...rest
}) {
  useStyles();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState('bottom');
  const [instant, setInstant] = useState(false);

  // Park the overlay on the entry side without animating, then slide it in.
  const enter = event => {
    const side = edgeOf(ref.current.getBoundingClientRect(), event.clientX, event.clientY);
    setInstant(true);
    setFrom(side);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setInstant(false);
        setOpen(true);
      })
    );
  };
  const leave = event => {
    setFrom(edgeOf(ref.current.getBoundingClientRect(), event.clientX, event.clientY));
    setOpen(false);
  };

  const [x, y] = OFFSETS[from];

  return (
    <div
      ref={ref}
      className={`bl-dh ${className}`}
      data-open={open || undefined}
      data-instant={instant || undefined}
      onPointerEnter={event => event.pointerType === 'mouse' && enter(event)}
      onPointerLeave={event => event.pointerType === 'mouse' && leave(event)}
      onFocus={() => {
        setFrom('bottom');
        setOpen(true);
      }}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      style={{ '--bl-x': x, '--bl-y': y, '--bl-dur': `${duration}ms`, '--bl-zoom': zoom, '--bl-radius': `${radius}px`, '--bl-overlay': overlayColor, '--bl-ink': textColor, '--bl-accent': accentColor, ...style }}
      {...rest}
    >
      <div className="bl-dh__base">{children}</div>
      <div className="bl-dh__overlay">{overlay}</div>
    </div>
  );
}
