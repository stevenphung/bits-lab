import { Children, useEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A deck of cards you deal through. The top card sits on a slightly fanned pile; drag or swipe
// it past the edge and it flies off, spinning a little the way you threw it, then slides under
// the bottom of the deck. The arrow buttons (or the Left and Right keys) deal forward and back.
// Each card stays in the page; the deck says which card is on top. Reduced motion swaps cards
// without the flight.

const Arrow = ({ flip }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
    <path d="M6 3l5 5-5 5" />
  </svg>
);

export default function CardDeck({
  children,
  width = 280,
  height = 380,
  visible = 4,
  offset = 6,
  fan = 2.5,
  threshold = 0.3,
  loop = true,
  onChange,
  label = 'Card deck',
  radius = 16,
  cardColor = '#262b44',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = '#333c57',
  chipColor = 'rgba(255,255,255,0.08)',
  accentColor = '#73eff7',
  fontFamily = 'inherit',
  className = '',
  style
}) {
  const cards = Children.toArray(children);
  const n = cards.length;
  const [top, setTop] = useState(0);
  const [flying, setFlying] = useState(null); // { index, dx, dy, spin }
  const [drag, setDrag] = useState(null); // { x, y, dx, dy }
  const pileRef = useRef(null);
  const changeRef = useRef(onChange);
  changeRef.current = onChange;

  useEffect(() => {
    if (top >= n && n) setTop(0);
  }, [n, top]);

  const go = (step, throwX = step * 1, throwY = 0) => {
    if (!n || flying) return;
    const next = loop ? (top + step + n) % n : Math.max(0, Math.min(n - 1, top + step));
    if (next === top) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (step > 0 && !reduced) {
      // The top card flies off the way it was thrown, then the deck moves on.
      const w = pileRef.current?.offsetWidth ?? width;
      setFlying({ index: top, dx: Math.sign(throwX || 1) * w * 1.4, dy: throwY * 0.5, spin: Math.sign(throwX || 1) * 24 });
      setTimeout(() => {
        setFlying(null);
        setTop(next);
        changeRef.current?.(next);
      }, 380);
    } else {
      setTop(next);
      changeRef.current?.(next);
    }
  };

  const onPointerDown = event => {
    if (event.button > 0 || flying) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDrag({ x: event.clientX, y: event.clientY, dx: 0, dy: 0 });
  };
  const onPointerMove = event => {
    if (!drag) return;
    setDrag(d => ({ ...d, dx: event.clientX - d.x, dy: event.clientY - d.y }));
  };
  const onPointerUp = () => {
    if (!drag) return;
    const w = pileRef.current?.offsetWidth ?? width;
    const far = Math.abs(drag.dx) > w * threshold;
    setDrag(null);
    if (far) go(1, drag.dx, drag.dy);
  };

  const onKeyDown = event => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
    }
  };

  return (
    <div
      className={`grid justify-items-center gap-3.5 font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      style={{ '--bl-w': `${width}px`, '--bl-h': `${height}px`, '--bl-offset': `${offset}px`, '--bl-fan': `${fan}deg`, '--bl-radius': `${radius}px`, '--bl-card': cardColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-line': lineColor, '--bl-chip': chipColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      <div ref={pileRef} className="relative h-(--bl-h) w-(--bl-w) max-w-full touch-pan-y outline-none focus-visible:rounded-(--bl-radius) focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" role="group" aria-roledescription="card deck" aria-label={`${label}: card ${n ? top + 1 : 0} of ${n}`} tabIndex={0} onKeyDown={onKeyDown}>
        {cards.map((card, i) => {
          // Depth in the pile: 0 is the top card.
          const d = (i - top + n) % n;
          const isTop = d === 0;
          const fly = flying && flying.index === i;
          const transform = fly ? `translate(${flying.dx}px, ${flying.dy}px) rotate(${flying.spin}deg)` : isTop && drag ? `translate(${drag.dx}px, ${drag.dy * 0.4}px) rotate(${drag.dx * 0.06}deg)` : undefined;
          return (
            <div
              key={card.key ?? i}
              className="absolute inset-0 overflow-hidden rounded-(--bl-radius) bg-(--bl-card) shadow-[0_0_0_2px_var(--bl-line),0_10px_22px_-12px_rgba(0,0,0,0.8)] select-none [transform:translate(calc(var(--d)_*_var(--bl-offset)),calc(var(--d)_*_var(--bl-offset)))_rotate(calc(var(--d)_*_var(--bl-fan)_*_var(--side)))] [transition:transform_360ms_cubic-bezier(.3,1.3,.5,1),opacity_300ms] data-[top]:cursor-grab data-[dragging]:cursor-grabbing data-[dragging]:[transition:none] data-[hidden]:opacity-0 data-[flying]:opacity-0 data-[flying]:[transition:transform_420ms_cubic-bezier(.4,0,.6,1),opacity_420ms] motion-reduce:[transition:none]!"
              data-top={isTop || undefined}
              data-dragging={(isTop && drag) || undefined}
              data-flying={fly || undefined}
              data-hidden={d >= visible || undefined}
              aria-hidden={!isTop || undefined}
              inert={!isTop || undefined}
              onPointerDown={isTop ? onPointerDown : undefined}
              onPointerMove={isTop ? onPointerMove : undefined}
              onPointerUp={isTop ? onPointerUp : undefined}
              onPointerCancel={isTop ? onPointerUp : undefined}
              style={{ '--d': Math.min(d, visible), '--side': d % 2 ? -1 : 1, zIndex: fly ? n + 1 : n - d, transform }}
            >
              {card}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 text-[14px] text-(--bl-muted)">
        <button type="button" className="grid size-[38px] cursor-pointer place-items-center rounded-[10px] border-0 bg-(--bl-chip) p-0 text-(--bl-ink) hover:bg-(--bl-line) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous card" disabled={!loop && top === 0} onClick={() => go(-1)}>
          <Arrow flip />
        </button>
        <span className="min-w-16 text-center tabular-nums" aria-live="polite">
          {n ? top + 1 : 0} / {n}
        </span>
        <button type="button" className="grid size-[38px] cursor-pointer place-items-center rounded-[10px] border-0 bg-(--bl-chip) p-0 text-(--bl-ink) hover:bg-(--bl-line) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next card" disabled={!loop && top === n - 1} onClick={() => go(1)}>
          <Arrow />
        </button>
      </div>
    </div>
  );
}
