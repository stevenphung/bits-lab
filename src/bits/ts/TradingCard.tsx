import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A collectible card with real shine. It tilts toward the pointer, a glare slides across it as
// it turns, and rarer cards carry a holographic foil that shifts through stepped rainbow bands
// as you tilt. The frame colour says how rare it is. Give it a back and it flips over on click
// or Enter. The card is a button when it flips; its name, rarity and stats are plain text.
// Reduced motion keeps it flat, with no tilt, foil drift or flip animation.

const STYLE_ID = 'bl-trading-card';
const CSS = `
/* theme tokens */
.bl-tcard { --bl-card: #262b44; --bl-back: #29366f; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-tcard, .bl-tcard:where(.light, [data-theme="light"]) { --bl-card: #ebe5d8; --bl-back: #dfe3f0; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-tcard, :where(.light, [data-theme="light"]) .bl-tcard:where(.dark, [data-theme="dark"]) { --bl-card: #262b44; --bl-back: #29366f; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-tcard, .bl-tcard:where([data-theme="system"]) { --bl-card: #ebe5d8; --bl-back: #dfe3f0; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-tcard { --rx: 0deg; --ry: 0deg; --gx: 50%; --gy: 50%; --shift: 0.5; display: inline-block; width: var(--bl-w); perspective: 900px; font-family: var(--bl-font); color: var(--bl-ink); }
.bl-tcard__flip { position: relative; display: block; width: 100%; aspect-ratio: 5 / 7; margin: 0; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; transform: rotateX(var(--rx)) rotateY(calc(var(--ry) + var(--turn))); transform-style: preserve-3d; transition: transform 500ms cubic-bezier(.3,1.2,.4,1); cursor: default; }
.bl-tcard[data-flippable] .bl-tcard__flip { cursor: pointer; }
.bl-tcard[data-tilting] .bl-tcard__flip { transition: transform 80ms linear; }
.bl-tcard__flip:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 6px; border-radius: var(--bl-radius); }
.bl-tcard__face { position: absolute; inset: 0; display: grid; grid-template-rows: auto 1fr auto; gap: 8px; overflow: hidden; padding: 10px; border-radius: var(--bl-radius); background: var(--bl-card); box-shadow: inset 0 0 0 4px var(--bl-frame), inset 0 0 0 6px rgba(0,0,0,0.35), 0 18px 34px -16px rgba(0,0,0,0.9); backface-visibility: hidden; }
.bl-tcard__back { transform: rotateY(180deg); place-items: center; grid-template-rows: 1fr; background: var(--bl-back); }
.bl-tcard__head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 4px 6px 0; }
.bl-tcard__name { font-size: 15px; font-weight: 700; line-height: 1.2; }
.bl-tcard__rarity { color: var(--bl-frame); font-size: 10px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.bl-tcard__art { position: relative; overflow: hidden; border-radius: 6px; background: #0b0b14; box-shadow: inset 0 0 0 2px rgba(0,0,0,0.5); }
.bl-tcard__art > img { display: block; width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; }
.bl-tcard__stats { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 4px; padding: 0 2px 2px; }
.bl-tcard__stat { display: grid; justify-items: center; padding: 4px 2px; border-radius: 4px; background: rgba(0,0,0,0.3); }
.bl-tcard__stat-label { color: var(--bl-muted); font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; }
.bl-tcard__stat-value { font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
.bl-tcard__foil { position: absolute; inset: 0; border-radius: inherit; background: repeating-linear-gradient(115deg, #ef7d57 0 8%, #ffcd75 8% 16%, #a7f070 16% 24%, #73eff7 24% 32%, #41a6f6 32% 40%, #b13e53 40% 48%); background-size: 260% 260%; background-position: calc(var(--shift) * 100%) calc(var(--shift) * 60%); mix-blend-mode: color-dodge; opacity: var(--bl-foil); pointer-events: none; }
.bl-tcard__glare { position: absolute; inset: 0; border-radius: inherit; background: radial-gradient(circle at var(--gx) var(--gy), rgba(255,255,255,0.45), transparent 45%); mix-blend-mode: overlay; opacity: 0; transition: opacity 200ms; pointer-events: none; }
.bl-tcard[data-tilting] .bl-tcard__glare { opacity: 1; }
@media (prefers-reduced-motion: reduce) { .bl-tcard__flip { transition: none; transform: rotateY(var(--turn)); } .bl-tcard__glare { display: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const RARITY: Record<string, { frame: string; foil: number }> = {
  common: { frame: '#94b0c2', foil: 0 },
  rare: { frame: '#41a6f6', foil: 0.25 },
  epic: { frame: '#b13e53', foil: 0.4 },
  legendary: { frame: '#ffcd75', foil: 0.55 }
};

export interface TradingCardProps {
  name?: string;
  image?: string;
  imageAlt?: string;
  /** Frame colour and how strong the holo foil is (common has none). */
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  stats?: { label: string; value: ReactNode }[];
  /** With a back, the card is a button that flips. */
  back?: ReactNode;
  flipped?: boolean;
  onFlip?: (flipped: boolean) => void;
  /** Maximum tilt toward the pointer, in degrees. */
  tilt?: number;
  width?: number;
  radius?: number;
  cardColor?: string;
  backColor?: string;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  frameColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function TradingCard({
  name = '',
  image,
  imageAlt = '',
  rarity = 'rare',
  stats = [],
  back,
  flipped: controlled,
  onFlip,
  tilt = 14,
  width = 240,
  radius = 14,
  cardColor,
  backColor,
  textColor,
  mutedColor,
  accentColor,
  frameColor,
  fontFamily = 'inherit',
  className = '',
  style
}: TradingCardProps) {
  useStyles();
  const rootRef = useRef<HTMLDivElement>(null);
  const [inner, setInner] = useState(false);
  const flipped = controlled ?? inner;
  const tier = RARITY[rarity] ?? RARITY.rare;

  useEffect(() => {
    const root = rootRef.current!;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf = 0;
    const onMove = (event: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = root.getBoundingClientRect();
        const x = (event.clientX - r.left) / r.width;
        const y = (event.clientY - r.top) / r.height;
        root.style.setProperty('--ry', `${((x - 0.5) * tilt * 2).toFixed(2)}deg`);
        root.style.setProperty('--rx', `${((0.5 - y) * tilt * 2).toFixed(2)}deg`);
        root.style.setProperty('--gx', `${(x * 100).toFixed(1)}%`);
        root.style.setProperty('--gy', `${(y * 100).toFixed(1)}%`);
        root.style.setProperty('--shift', ((x + y) / 2).toFixed(3));
        root.dataset.tilting = '';
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      ['--rx', '--ry', '--gx', '--gy', '--shift'].forEach(p => root.style.removeProperty(p));
      delete root.dataset.tilting;
    };
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, [tilt]);

  const flip = () => {
    if (!back) return;
    if (controlled === undefined) setInner(f => !f);
    onFlip?.(!flipped);
  };

  const face = (
    <span className="bl-tcard__face">
      <span className="bl-tcard__head">
        <span className="bl-tcard__name">{name}</span>
        <span className="bl-tcard__rarity">{rarity}</span>
      </span>
      <span className="bl-tcard__art">{image && <img src={image} alt={imageAlt} draggable={false} />}</span>
      {stats.length > 0 && (
        // Spans, not a <dl>: the card can be a button, which only takes inline content.
        <span className="bl-tcard__stats" role="list">
          {stats.map(s => (
            <span key={s.label} className="bl-tcard__stat" role="listitem">
              <span className="bl-tcard__stat-label">{s.label}</span>
              <span className="bl-tcard__stat-value">{s.value}</span>
            </span>
          ))}
        </span>
      )}
      {tier.foil > 0 && <span className="bl-tcard__foil" aria-hidden="true" />}
      <span className="bl-tcard__glare" aria-hidden="true" />
    </span>
  );

  const Tag = (back ? 'button' : 'div') as ElementType;
  return (
    <div
      ref={rootRef}
      className={`bl-tcard ${className}`}
      data-flippable={back ? '' : undefined}
      style={{ '--bl-w': `${width}px`, '--bl-radius': `${radius}px`, '--bl-card': cardColor, '--bl-back': backColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-frame': frameColor ?? tier.frame, '--bl-foil': tier.foil, '--turn': flipped ? '180deg' : '0deg', '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <Tag
        className="bl-tcard__flip"
        type={back ? 'button' : undefined}
        aria-pressed={back ? flipped : undefined}
        aria-label={back ? `${name}, ${rarity} card. ${flipped ? 'Showing the back' : 'Showing the front'}; press to flip.` : undefined}
        onClick={back ? flip : undefined}
      >
        {face}
        {back && (
          <span className="bl-tcard__face bl-tcard__back" aria-hidden={!flipped || undefined}>
            {back}
          </span>
        )}
      </Tag>
    </div>
  );
}
