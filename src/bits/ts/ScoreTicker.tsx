import { useEffect, useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Arcade score counter. Every digit is a mechanical drum that only rolls forward (9 wraps
// through to 0), each gain pops up as "+250" with an optional "×3 COMBO" tag, big gains
// shake the panel, and beating the high score flashes a banner. Screen readers hear the
// settled score, not every tick.

export interface ScoreTickerProps {
  /** The score; drums roll forward to it, decreases roll back. */
  value?: number;
  /** Zero-padded width; caps at all nines. */
  digits?: number;
  label?: string;
  /** Shows HI, and beating it flashes NEW HIGH SCORE. */
  highScore?: number;
  /** Above 1, gain popups add "×N COMBO". */
  combo?: number;
  showPopups?: boolean;
  /** Smallest gain that shakes the panel. */
  shakeAt?: number;
  /** Roll time in ms. */
  duration?: number;
  /** Digit size in px. */
  size?: number;
  textColor?: string;
  dimColor?: string;
  mutedColor?: string;
  panelColor?: string;
  edgeColor?: string;
  drumColor?: string;
  accentColor?: string;
  comboColor?: string;
  highColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

interface Pop {
  id: number;
  gain: number;
  combo: number;
}

const STYLE_ID = 'bl-score-ticker';
const CSS = `
.bl-score { display: inline-grid; justify-items: center; gap: 10px; max-width: 100%; color: var(--bl-ink); font-family: var(--bl-font); }
.bl-score__label { display: flex; gap: 1.6em; font-size: calc(var(--bl-size) * 0.3); letter-spacing: 0.12em; color: var(--bl-muted); }
.bl-score__label b { color: var(--bl-high); font-weight: inherit; }
.bl-score__panel { position: relative; display: inline-flex; gap: calc(var(--bl-size) * 0.1); max-width: 100%; padding: calc(var(--bl-size) * 0.2); background: var(--bl-panel); box-shadow: 0 0 0 3px var(--bl-edge), 6px 6px 0 3px rgba(0,0,0,0.45); }
.bl-score__drum { position: relative; width: 0.8em; height: 1.2em; overflow: hidden; font-size: var(--bl-size); line-height: 1.2em; text-align: center; background: var(--bl-drum); box-shadow: inset 0 0.12em 0 rgba(0,0,0,0.45), inset 0 -0.08em 0 rgba(255,255,255,0.06); }
.bl-score__drum::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(rgba(0,0,0,0.45), transparent 30%, transparent 70%, rgba(0,0,0,0.45)); }
.bl-score__drum[data-lead] { color: var(--bl-dim); }
.bl-score__strip { display: block; transition: transform var(--bl-dur) cubic-bezier(.25,1.35,.5,1); }
.bl-score__strip > span { display: block; height: 1.2em; }
.bl-score__pops { position: absolute; left: 50%; top: 0; width: 0; pointer-events: none; }
.bl-score__pop { position: absolute; left: 0; bottom: 4px; white-space: nowrap; font-size: calc(var(--bl-size) * 0.36); color: var(--bl-accent); text-shadow: 2px 2px 0 rgba(0,0,0,0.6); animation: bl-score-pop 1100ms steps(12) forwards; }
.bl-score__pop em { margin-left: 0.6em; font-style: normal; color: var(--bl-combo); }
.bl-score__banner { min-height: 1.3em; font-size: calc(var(--bl-size) * 0.32); color: var(--bl-high); }
.bl-score__banner[data-show] { animation: bl-score-flash 0.5s steps(1) 6; }
.bl-score__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-score-pop { 0% { transform: translate(-50%, 10px); opacity: 0; } 15% { transform: translate(-50%, -4px); opacity: 1; } 100% { transform: translate(-50%, -44px); opacity: 0; } }
@keyframes bl-score-fade { 0%, 70% { transform: translate(-50%, -8px); opacity: 1; } 100% { transform: translate(-50%, -8px); opacity: 0; } }
@keyframes bl-score-flash { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .bl-score__strip { transition: none; }
  .bl-score__pop { animation: bl-score-fade 1100ms linear forwards; }
  .bl-score__banner[data-show] { animation: none; }
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

const STRIP = Array.from({ length: 30 }, (_, i) => i % 10);
const clampScore = (value: number, digits: number) => Math.max(0, Math.min(10 ** digits - 1, Math.floor(value || 0)));
const digitsOf = (value: number, digits: number) => String(value).padStart(digits, '0').split('').map(Number);

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
}: ScoreTickerProps) {
  useStyles();
  const score = clampScore(value, digits);
  const current = digitsOf(score, digits);
  // Drum positions on a 0–9 ×3 strip: the middle copy is "home"; forward wraps use the third.
  const [drums, setDrums] = useState(() => current.map(d => ({ pos: 10 + d, still: false })));
  const [pops, setPops] = useState<Pop[]>([]);
  const [newHigh, setNewHigh] = useState(false);
  const [spoken, setSpoken] = useState(score);
  const previous = useRef(score);
  const panelRef = useRef<HTMLDivElement>(null);
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
  const settle = (k: number) => {
    setDrums(list => list.map((drum, i) => (i === k && drum.pos >= 20 ? { pos: drum.pos - 10, still: true } : drum)));
    requestAnimationFrame(() =>
      requestAnimationFrame(() => setDrums(list => list.map((drum, i) => (i === k && drum.still ? { ...drum, still: false } : drum))))
    );
  };

  const firstNonZero = current.findIndex(d => d !== 0);
  const best = highScore != null ? Math.max(highScore, score) : null;

  return (
    <div
      className={`bl-score ${className}`}
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
      } as CSSVars}
    >
      <div className="bl-score__label" aria-hidden="true">
        <span>{label}</span>
        {best != null && (
          <span>
            HI <b>{String(best).padStart(digits, '0')}</b>
          </span>
        )}
      </div>
      <div ref={panelRef} className="bl-score__panel" aria-hidden="true">
        {drums.map((drum, k) => (
          <span key={k} className="bl-score__drum" data-lead={(firstNonZero === -1 ? k < digits - 1 : k < firstNonZero) || undefined}>
            <span
              className="bl-score__strip"
              style={{ transform: `translateY(${-drum.pos * 1.2}em)`, transition: drum.still ? 'none' : undefined }}
              onTransitionEnd={() => settle(k)}
            >
              {STRIP.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </span>
          </span>
        ))}
        <span className="bl-score__pops">
          {pops.map(pop => (
            <span key={pop.id} className="bl-score__pop" onAnimationEnd={() => setPops(list => list.filter(p => p.id !== pop.id))}>
              +{pop.gain.toLocaleString('en-US')}
              {pop.combo > 1 && <em>×{pop.combo} COMBO</em>}
            </span>
          ))}
        </span>
      </div>
      <div className="bl-score__banner" data-show={newHigh || undefined} aria-hidden="true">
        {newHigh ? 'NEW HIGH SCORE!' : ''}
      </div>
      <span className="bl-score__sr" role="status">
        {label} {spoken.toLocaleString('en-US')}
        {newHigh ? '. New high score!' : ''}
      </span>
    </div>
  );
}
