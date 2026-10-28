import { useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Arcade score counter. Every digit is a mechanical drum that only rolls forward (9 wraps
// through to 0), each gain pops up as "+250" with an optional "×3 COMBO" tag, big gains
// shake the panel, and beating the high score flashes a banner. Screen readers hear the
// settled score, not every tick.

const STYLE_ID = 'bl-score-ticker-tw';
const CSS = `
@keyframes bl-score-pop { 0% { transform: translate(-50%, 10px); opacity: 0; } 15% { transform: translate(-50%, -4px); opacity: 1; } 100% { transform: translate(-50%, -44px); opacity: 0; } }
@keyframes bl-score-fade { 0%, 70% { transform: translate(-50%, -8px); opacity: 1; } 100% { transform: translate(-50%, -8px); opacity: 0; } }
@keyframes bl-score-flash { 50% { opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const STRIP = Array.from({ length: 30 }, (_, i) => i % 10);
const clampScore = (value, digits) => Math.max(0, Math.min(10 ** digits - 1, Math.floor(value || 0)));
const digitsOf = (value, digits) => String(value).padStart(digits, '0').split('').map(Number);

export default function ScoreTicker({
  value = 0,
  digits = 7,
  label = 'SCORE',
  highScore,
  combo = 1,
  showPopups = true,
  shakeAt = 1000,
  duration = 600,
  size = 40,
  textColor = '#f4f4f4',
  dimColor = '#333c57',
  mutedColor = '#94b0c2',
  panelColor = '#1a1c2c',
  edgeColor = '#566c86',
  drumColor = '#0b0b14',
  accentColor = '#ffcd75',
  comboColor = '#ef7d57',
  highColor = '#73eff7',
  fontFamily = '"Press Start 2P", ui-monospace, monospace',
  className = '',
  style
}) {
  useStyles();
  const score = clampScore(value, digits);
  const current = digitsOf(score, digits);
  // Drum positions on a 0–9 ×3 strip: the middle copy is "home"; forward wraps use the third.
  const [drums, setDrums] = useState(() => current.map(d => ({ pos: 10 + d, still: false })));
  const [pops, setPops] = useState([]);
  const [newHigh, setNewHigh] = useState(false);
  const [spoken, setSpoken] = useState(score);
  const previous = useRef(score);
  const panelRef = useRef(null);
  const popId = useRef(0);

  useLayoutEffect(() => {
    const from = previous.current;
    previous.current = score;
    if (from === score) return;
    const before = digitsOf(from, digits);
    setDrums(list =>
      current.map((d, k) => {
        const place = 10 ** (digits - 1 - k);
        const turns = Math.floor(score / place) - Math.floor(from / place);
        if (turns <= 0) return { pos: 10 + d, still: false };
        // Roll forward from where the drum is now (it may still be mid-wrap), through the
        // wrap if the digit went down. An unchanged digit stays put.
        const steps = (d - before[k] + 10) % 10;
        const target = list[k].pos + steps;
        return { pos: target > 29 ? target - 10 : target, still: false };
      })
    );
    const gain = score - from;
    if (gain > 0 && showPopups) {
      popId.current += 1;
      setPops(list => [...list.slice(-4), { id: popId.current, gain, combo }]);
    }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (gain >= shakeAt && !reduced) {
      panelRef.current?.animate(
        [{ transform: 'none' }, { transform: 'translate(-3px, 2px)' }, { transform: 'translate(3px, -2px)' }, { transform: 'none' }],
        { duration: 240, easing: 'steps(3)' }
      );
    }
    if (highScore != null && from <= highScore && score > highScore) setNewHigh(true);
    if (highScore != null && score <= highScore) setNewHigh(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  // Announce the score once it has settled for a moment.
  useEffect(() => {
    const timer = setTimeout(() => setSpoken(score), 700);
    return () => clearTimeout(timer);
  }, [score]);

  // After a forward wrap finishes, jump back to the home copy without animating, then turn
  // the transition back on a frame later (in the same frame it would animate the jump).
  const settle = k => {
    setDrums(list => list.map((drum, i) => (i === k && drum.pos >= 20 ? { pos: drum.pos - 10, still: true } : drum)));
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setDrums(list => list.map((drum, i) => (i === k && drum.still ? { ...drum, still: false } : drum))))
    );
  };

  const firstNonZero = current.findIndex(d => d !== 0);
  const best = highScore != null ? Math.max(highScore, score) : null;

  return (
    <div
      className={`inline-grid max-w-full justify-items-center gap-2.5 font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      style={{
        '--bl-size': `${size}px`,
        '--bl-ink': textColor,
        '--bl-dim': dimColor,
        '--bl-muted': mutedColor,
        '--bl-panel': panelColor,
        '--bl-edge': edgeColor,
        '--bl-drum': drumColor,
        '--bl-accent': accentColor,
        '--bl-combo': comboColor,
        '--bl-high': highColor,
        '--bl-dur': `${duration}ms`,
        '--bl-font': fontFamily,
        ...style
      }}
    >
      <div className="flex gap-[1.6em] [font-size:calc(var(--bl-size)*0.3)] tracking-[0.12em] text-(--bl-muted) [&_b]:[font-weight:inherit] [&_b]:text-(--bl-high)" aria-hidden="true">
        <span>{label}</span>
        {best != null && (
          <span>
            HI <b>{String(best).padStart(digits, '0')}</b>
          </span>
        )}
      </div>
      <div ref={panelRef} className="relative inline-flex max-w-full gap-[calc(var(--bl-size)*0.1)] bg-(--bl-panel) p-[calc(var(--bl-size)*0.2)] shadow-[0_0_0_3px_var(--bl-edge),6px_6px_0_3px_rgba(0,0,0,0.45)]" aria-hidden="true">
        {drums.map((drum, k) => (
          <span key={k} className="relative h-[1.2em] w-[0.8em] overflow-hidden bg-(--bl-drum) text-center text-(length:--bl-size) leading-[1.2em] shadow-[inset_0_0.12em_0_rgba(0,0,0,0.45),inset_0_-0.08em_0_rgba(255,255,255,0.06)] after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(rgba(0,0,0,0.45),transparent_30%,transparent_70%,rgba(0,0,0,0.45))] data-[lead]:text-(--bl-dim)" data-lead={(firstNonZero === -1 ? k < digits - 1 : k < firstNonZero) || undefined}>
            <span
              className="block [transition:transform_var(--bl-dur)_cubic-bezier(.25,1.35,.5,1)] *:block *:h-[1.2em] motion-reduce:[transition:none]"
              style={{ transform: `translateY(${-drum.pos * 1.2}em)`, transition: drum.still ? 'none' : undefined }}
              onTransitionEnd={() => settle(k)}
            >
              {STRIP.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </span>
          </span>
        ))}
        <span className="pointer-events-none absolute top-0 left-1/2 w-0">
          {pops.map(pop => (
            <span key={pop.id} className="absolute bottom-1 left-0 animate-[bl-score-pop_1100ms_steps(12)_forwards] [font-size:calc(var(--bl-size)*0.36)] whitespace-nowrap text-(--bl-accent) [text-shadow:2px_2px_0_rgba(0,0,0,0.6)] [&_em]:ml-[0.6em] [&_em]:text-(--bl-combo) [&_em]:not-italic motion-reduce:animate-[bl-score-fade_1100ms_linear_forwards]" onAnimationEnd={() => setPops(list => list.filter(p => p.id !== pop.id))}>
              +{pop.gain.toLocaleString('en-US')}
              {pop.combo > 1 && <em>×{pop.combo} COMBO</em>}
            </span>
          ))}
        </span>
      </div>
      <div className="min-h-[1.3em] [font-size:calc(var(--bl-size)*0.32)] text-(--bl-high) data-[show]:animate-[bl-score-flash_0.5s_steps(1)_6] motion-reduce:data-[show]:animate-none" data-show={newHigh || undefined} aria-hidden="true">
        {newHigh ? 'NEW HIGH SCORE!' : ''}
      </div>
      <span className="sr-only" role="status">
        {label} {spoken.toLocaleString('en-US')}
        {newHigh ? '. New high score!' : ''}
      </span>
    </div>
  );
}
