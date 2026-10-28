import { Children, useEffect, useInsertionEffect, useRef, useState } from 'react';

// A deck of cards you deal through. The top card sits on a slightly fanned pile; drag or swipe
// it past the edge and it flies off, spinning a little the way you threw it, then slides under
// the bottom of the deck. The arrow buttons (or the Left and Right keys) deal forward and back.
// Each card stays in the page; the deck says which card is on top. Reduced motion swaps cards
// without the flight.

const STYLE_ID = 'bl-card-deck';
const CSS = `
/* theme tokens */
.bl-deck { --bl-card: #262b44; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-chip: rgba(255,255,255,0.08); --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-deck, .bl-deck:where(.light, [data-theme="light"]) { --bl-card: #ebe5d8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-chip: rgba(26,28,44,0.08); --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-deck, :where(.light, [data-theme="light"]) .bl-deck:where(.dark, [data-theme="dark"]) { --bl-card: #262b44; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-chip: rgba(255,255,255,0.08); --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-deck, .bl-deck:where([data-theme="system"]) { --bl-card: #ebe5d8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-chip: rgba(26,28,44,0.08); --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-deck { display: grid; justify-items: center; gap: 14px; font-family: var(--bl-font); color: var(--bl-ink); }
.bl-deck__pile { position: relative; width: var(--bl-w); max-width: 100%; height: var(--bl-h); touch-action: pan-y; outline: none; }
.bl-deck__pile:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 8px; border-radius: var(--bl-radius); }
.bl-deck__card { position: absolute; inset: 0; overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-card); box-shadow: 0 0 0 2px var(--bl-line), 0 10px 22px -12px rgba(0,0,0,0.8); transform: translate(calc(var(--d) * var(--bl-offset)), calc(var(--d) * var(--bl-offset))) rotate(calc(var(--d) * var(--bl-fan) * var(--side))); transition: transform 360ms cubic-bezier(.3,1.3,.5,1), opacity 300ms; user-select: none; }
.bl-deck__card[data-top] { cursor: grab; }
.bl-deck__card[data-dragging] { cursor: grabbing; transition: none; }
.bl-deck__card[data-hidden] { opacity: 0; }
.bl-deck__card[data-flying] { transition: transform 420ms cubic-bezier(.4,0,.6,1), opacity 420ms; opacity: 0; }
.bl-deck__bar { display: flex; align-items: center; gap: 12px; font-size: 14px; color: var(--bl-muted); }
.bl-deck__btn { display: grid; place-items: center; width: 38px; height: 38px; padding: 0; border: 0; border-radius: 10px; background: var(--bl-chip); color: var(--bl-ink); cursor: pointer; }
.bl-deck__btn:hover { background: var(--bl-line); }
.bl-deck__btn:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-deck__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.bl-deck__count { min-width: 64px; text-align: center; font-variant-numeric: tabular-nums; }
@media (prefers-reduced-motion: reduce) { .bl-deck__card { transition: none !important; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

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
  cardColor,
  textColor,
  mutedColor,
  lineColor,
  chipColor,
  accentColor,
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
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
      className={`bl-deck ${className}`}
      style={{ '--bl-w': `${width}px`, '--bl-h': `${height}px`, '--bl-offset': `${offset}px`, '--bl-fan': `${fan}deg`, '--bl-radius': `${radius}px`, '--bl-card': cardColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-line': lineColor, '--bl-chip': chipColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      <div ref={pileRef} className="bl-deck__pile" role="group" aria-roledescription="card deck" aria-label={`${label}: card ${n ? top + 1 : 0} of ${n}`} tabIndex={0} onKeyDown={onKeyDown}>
        {cards.map((card, i) => {
          // Depth in the pile: 0 is the top card.
          const d = (i - top + n) % n;
          const isTop = d === 0;
          const fly = flying && flying.index === i;
          const transform = fly ? `translate(${flying.dx}px, ${flying.dy}px) rotate(${flying.spin}deg)` : isTop && drag ? `translate(${drag.dx}px, ${drag.dy * 0.4}px) rotate(${drag.dx * 0.06}deg)` : undefined;
          return (
            <div
              key={card.key ?? i}
              className="bl-deck__card"
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
      <div className="bl-deck__bar">
        <button type="button" className="bl-deck__btn" aria-label="Previous card" disabled={!loop && top === 0} onClick={() => go(-1)}>
          <Arrow flip />
        </button>
        <span className="bl-deck__count" aria-live="polite">
          {n ? top + 1 : 0} / {n}
        </span>
        <button type="button" className="bl-deck__btn" aria-label="Next card" disabled={!loop && top === n - 1} onClick={() => go(1)}>
          <Arrow />
        </button>
      </div>
    </div>
  );
}
