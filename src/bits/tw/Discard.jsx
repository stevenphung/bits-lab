import { useEffect, useInsertionEffect, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A satisfying way to throw something away. Set `discarded` and the content gets fed through a
// shredder into falling strips, crumpled into a ball and tossed, or torn in two with a jagged
// edge, then calls onDiscarded so you can remove it. Until then it's just your content. The
// copies used for the effect are hidden from screen readers; reduced motion simply fades it.

const STYLE_ID = 'bl-discard-tw';
const CSS = `
@keyframes bl-discard-strip { 20% { transform: translateY(6%); } to { transform: translateY(160%) rotate(calc(var(--s) * 6deg)); opacity: 0; } }
@keyframes bl-discard-tear { 25% { transform: translateX(calc(var(--s) * 4%)) rotate(calc(var(--s) * 2deg)); } to { transform: translate(calc(var(--s) * 40%), 70%) rotate(calc(var(--s) * 18deg)); opacity: 0; } }
@keyframes bl-discard-crumple { 40% { transform: scale(0.55) rotate(-25deg); border-radius: 40%; filter: brightness(0.8) contrast(1.4); } 60% { transform: scale(0.3) rotate(40deg); border-radius: 50%; } to { transform: translate(120%, -60%) scale(0.12) rotate(220deg); border-radius: 50%; opacity: 0; } }
@keyframes bl-discard-fade { to { opacity: 0; } }
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
function tearEdges(teeth) {
  const zig = Array.from({ length: teeth + 1 }, (_, i) => [50 + (i % 2 ? 4 : -4), (i / teeth) * 100]);
  const line = zig.map(([x, y]) => `${x}% ${y}%`).join(', ');
  const back = [...zig].reverse().map(([x, y]) => `${x}% ${y}%`).join(', ');
  return [`polygon(0 0, ${line}, 0 100%)`, `polygon(100% 0, 100% 100%, ${back})`];
}

export default function Discard({ children, discarded = false, effect = 'shred', strips = 8, duration = 900, onDiscarded, className = '', style }) {
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
  let pieces = [];
  if (playing) {
    if (effect === 'shred') pieces = Array.from({ length: strips }, (_, i) => ({ '--l': `${(i / strips) * 100}%`, '--r': `${((i + 1) / strips) * 100}%`, '--i': i, '--s': i % 2 ? 1 : -1 }));
    else if (effect === 'tear') pieces = tearEdges(10).map((edge, i) => ({ '--edge': edge, '--s': i ? 1 : -1 }));
    else pieces = [{}];
  }

  return (
    <div className={`group/dis relative ${className}`} data-effect={effect} style={{ '--bl-dur': `${duration}ms`, ...style }}>
      <div className="data-[hidden]:invisible" data-hidden={playing || undefined}>
        {children}
      </div>
      {playing && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {pieces.map((vars, i) => (
            <div key={i} className="absolute inset-0 overflow-hidden group-data-[effect=shred]/dis:animate-[bl-discard-strip_var(--bl-dur)_cubic-bezier(.5,0,.8,.4)_calc(var(--i)_*_25ms)_both] group-data-[effect=shred]/dis:[clip-path:inset(0_calc(100%_-_var(--r))_0_var(--l))] group-data-[effect=tear]/dis:animate-[bl-discard-tear_var(--bl-dur)_cubic-bezier(.4,0,.7,.5)_both] group-data-[effect=tear]/dis:[clip-path:var(--edge)] group-data-[effect=crumple]/dis:animate-[bl-discard-crumple_var(--bl-dur)_steps(9)_both] group-data-[effect=fade]/dis:animate-[bl-discard-fade_var(--bl-dur)_ease_both] motion-reduce:animate-[bl-discard-fade_200ms_ease_both]! motion-reduce:[clip-path:none]!" style={vars}>
              {children}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
