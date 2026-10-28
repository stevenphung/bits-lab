import { useEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A collectible card with real shine. It tilts toward the pointer, a glare slides across it as
// it turns, and rarer cards carry a holographic foil that shifts through stepped rainbow bands
// as you tilt. The frame colour says how rare it is. Give it a back and it flips over on click
// or Enter. The card is a button when it flips; its name, rarity and stats are plain text.
// Reduced motion keeps it flat, with no tilt, foil drift or flip animation.

const RARITY = {
  common: { frame: '#94b0c2', foil: 0 },
  rare: { frame: '#41a6f6', foil: 0.25 },
  epic: { frame: '#b13e53', foil: 0.4 },
  legendary: { frame: '#ffcd75', foil: 0.55 }
};

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
  cardColor = '#262b44',
  backColor = '#29366f',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  accentColor = '#73eff7',
  frameColor,
  fontFamily = 'inherit',
  className = '',
  style
}) {
  const rootRef = useRef(null);
  const [inner, setInner] = useState(false);
  const flipped = controlled ?? inner;
  const tier = RARITY[rarity] ?? RARITY.rare;

  useEffect(() => {
    const root = rootRef.current;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    let raf = 0;
    const onMove = event => {
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
    <span className="absolute inset-0 grid gap-2 overflow-hidden rounded-(--bl-radius) p-2.5 shadow-[inset_0_0_0_4px_var(--bl-frame),inset_0_0_0_6px_rgba(0,0,0,0.35),0_18px_34px_-16px_rgba(0,0,0,0.9)] [backface-visibility:hidden] grid-rows-[auto_1fr_auto] bg-(--bl-card)">
      <span className="flex items-baseline justify-between gap-2 px-1.5 pt-1 pb-0">
        <span className="text-[15px] leading-[1.2] font-bold">{name}</span>
        <span className="text-[10px] font-bold tracking-[0.08em] text-(--bl-frame) uppercase">{rarity}</span>
      </span>
      <span className="relative overflow-hidden rounded-[6px] bg-[#0b0b14] shadow-[inset_0_0_0_2px_rgba(0,0,0,0.5)] [&>img]:block [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>img]:[image-rendering:pixelated]">{image && <img src={image} alt={imageAlt} draggable={false} />}</span>
      {stats.length > 0 && (
        // Spans, not a <dl>: the card can be a button, which only takes inline content.
        <span className="grid auto-cols-[minmax(0,1fr)] grid-flow-col gap-1 px-0.5 pt-0 pb-0.5" role="list">
          {stats.map(s => (
            <span key={s.label} className="grid justify-items-center rounded-[4px] bg-[rgba(0,0,0,0.3)] px-0.5 py-1" role="listitem">
              <span className="text-[9px] tracking-[0.06em] text-(--bl-muted) uppercase">{s.label}</span>
              <span className="text-[14px] font-bold tabular-nums">{s.value}</span>
            </span>
          ))}
        </span>
      )}
      {tier.foil > 0 && <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[repeating-linear-gradient(115deg,#ef7d57_0_8%,#ffcd75_8%_16%,#a7f070_16%_24%,#73eff7_24%_32%,#41a6f6_32%_40%,#b13e53_40%_48%)] bg-size-[260%_260%] bg-[position:calc(var(--shift)_*_100%)_calc(var(--shift)_*_60%)] opacity-(--bl-foil) mix-blend-color-dodge" aria-hidden="true" />}
      <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_var(--gx)_var(--gy),rgba(255,255,255,0.45),transparent_45%)] opacity-0 mix-blend-overlay [transition:opacity_200ms] group-data-[tilting]/tc:opacity-100 motion-reduce:hidden" aria-hidden="true" />
    </span>
  );

  const Tag = back ? 'button' : 'div';
  return (
    <div
      ref={rootRef}
      className={`group/tc inline-block w-(--bl-w) font-(family-name:--bl-font) text-(--bl-ink) [--gx:50%] [--gy:50%] [--rx:0deg] [--ry:0deg] [--shift:0.5] [perspective:900px] ${className}`}
      data-flippable={back ? '' : undefined}
      style={{ '--bl-w': `${width}px`, '--bl-radius': `${radius}px`, '--bl-card': cardColor, '--bl-back': backColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-frame': frameColor ?? tier.frame, '--bl-foil': tier.foil, '--turn': flipped ? '180deg' : '0deg', '--bl-font': fontFamily, ...style }}
    >
      <Tag
        className="relative m-0 block aspect-[5/7] w-full cursor-default border-0 bg-transparent p-0 text-left text-inherit [transform-style:preserve-3d] [transform:rotateX(var(--rx))_rotateY(calc(var(--ry)_+_var(--turn)))] [transition:transform_500ms_cubic-bezier(.3,1.2,.4,1)] group-data-[flippable]/tc:cursor-pointer group-data-[tilting]/tc:[transition:transform_80ms_linear] focus-visible:rounded-(--bl-radius) focus-visible:outline-2 focus-visible:outline-offset-[6px] focus-visible:outline-(--bl-accent) focus-visible:outline-solid motion-reduce:[transition:none] motion-reduce:[transform:rotateY(var(--turn))]"
        type={back ? 'button' : undefined}
        aria-pressed={back ? flipped : undefined}
        aria-label={back ? `${name}, ${rarity} card. ${flipped ? 'Showing the back' : 'Showing the front'}; press to flip.` : undefined}
        onClick={back ? flip : undefined}
      >
        {face}
        {back && (
          <span className="absolute inset-0 grid gap-2 overflow-hidden rounded-(--bl-radius) p-2.5 shadow-[inset_0_0_0_4px_var(--bl-frame),inset_0_0_0_6px_rgba(0,0,0,0.35),0_18px_34px_-16px_rgba(0,0,0,0.9)] [backface-visibility:hidden] grid-rows-[1fr] place-items-center bg-(--bl-back) [transform:rotateY(180deg)]" aria-hidden={!flipped || undefined}>
            {back}
          </span>
        )}
      </Tag>
    </div>
  );
}
