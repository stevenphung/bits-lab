import { useEffect, useInsertionEffect, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A satisfying way to throw something away. Set `discarded` and the content gets fed through a
// shredder into falling strips, crumpled into a ball and tossed, or torn in two with a jagged
// edge, then calls onDiscarded so you can remove it. Until then it's just your content. The
// copies used for the effect are hidden from screen readers; reduced motion simply fades it.

const STYLE_ID = 'bl-discard';
const CSS = `
.bl-discard { position: relative; }
.bl-discard__live[data-hidden] { visibility: hidden; }
.bl-discard__fx { position: absolute; inset: 0; pointer-events: none; }
.bl-discard__piece { position: absolute; inset: 0; overflow: hidden; }
.bl-discard[data-effect="shred"] .bl-discard__piece { clip-path: inset(0 calc(100% - var(--r)) 0 var(--l)); animation: bl-discard-strip var(--bl-dur) cubic-bezier(.5,0,.8,.4) both; animation-delay: calc(var(--i) * 25ms); }
.bl-discard[data-effect="tear"] .bl-discard__piece { clip-path: var(--edge); animation: bl-discard-tear var(--bl-dur) cubic-bezier(.4,0,.7,.5) both; }
.bl-discard[data-effect="crumple"] .bl-discard__piece { animation: bl-discard-crumple var(--bl-dur) steps(9) both; }
.bl-discard[data-effect="fade"] .bl-discard__piece { animation: bl-discard-fade var(--bl-dur) ease both; }
@keyframes bl-discard-strip { 20% { transform: translateY(6%); } to { transform: translateY(160%) rotate(calc(var(--s) * 6deg)); opacity: 0; } }
@keyframes bl-discard-tear { 25% { transform: translateX(calc(var(--s) * 4%)) rotate(calc(var(--s) * 2deg)); } to { transform: translate(calc(var(--s) * 40%), 70%) rotate(calc(var(--s) * 18deg)); opacity: 0; } }
@keyframes bl-discard-crumple { 40% { transform: scale(0.55) rotate(-25deg); border-radius: 40%; filter: brightness(0.8) contrast(1.4); } 60% { transform: scale(0.3) rotate(40deg); border-radius: 50%; } to { transform: translate(120%, -60%) scale(0.12) rotate(220deg); border-radius: 50%; opacity: 0; } }
@keyframes bl-discard-fade { to { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .bl-discard .bl-discard__piece { animation: bl-discard-fade 200ms ease both !important; clip-path: none !important; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// A jagged tear line down the middle: zigzag x positions for each step down the card.
function tearEdges(teeth: number) {
  const zig = Array.from({ length: teeth + 1 }, (_, i) => [50 + (i % 2 ? 4 : -4), (i / teeth) * 100]);
  const line = zig.map(([x, y]) => `${x}% ${y}%`).join(', ');
  const back = [...zig].reverse().map(([x, y]) => `${x}% ${y}%`).join(', ');
  return [`polygon(0 0, ${line}, 0 100%)`, `polygon(100% 0, 100% 100%, ${back})`];
}

export interface DiscardProps {
  /** The thing to throw away. */
  children?: ReactNode;
  /** Set to play the effect. */
  discarded?: boolean;
  /** Falling strips, a balled-up toss, or torn in two. */
  effect?: 'shred' | 'crumple' | 'tear';
  /** Shredder strips. */
  strips?: number;
  /** Effect length in ms. */
  duration?: number;
  /** Called when the effect has finished: remove the content here. */
  onDiscarded?: () => void;
  className?: string;
  style?: CSSProperties;
}

export default function Discard({ children, discarded = false, effect = 'shred', strips = 8, duration = 900, onDiscarded, className = '', style }: DiscardProps) {
  useStyles();
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!discarded) {
      setPlaying(false);
      return undefined;
    }
    setPlaying(true);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const total = reduced ? 220 : duration + (effect === 'shred' ? strips * 25 : 0);
    const id = setTimeout(() => onDiscarded?.(), total);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discarded]);

  // Reduced motion turns every effect into a fade in CSS, so the pieces are the same either way.
  let pieces: CSSVars[] = [];
  if (playing) {
    if (effect === 'shred') pieces = Array.from({ length: strips }, (_, i) => ({ '--l': `${(i / strips) * 100}%`, '--r': `${((i + 1) / strips) * 100}%`, '--i': i, '--s': i % 2 ? 1 : -1 }));
    else if (effect === 'tear') pieces = tearEdges(10).map((edge, i) => ({ '--edge': edge, '--s': i ? 1 : -1 }));
    else pieces = [{}];
  }

  return (
    <div className={`bl-discard ${className}`} data-effect={effect} style={{ '--bl-dur': `${duration}ms`, ...style } as CSSVars}>
      <div className="bl-discard__live" data-hidden={playing || undefined}>
        {children}
      </div>
      {playing && (
        <div className="bl-discard__fx" aria-hidden="true">
          {pieces.map((vars, i) => (
            <div key={i} className="bl-discard__piece" style={vars}>
              {children}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
