import { useEffect, useId, useInsertionEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// End-of-game screen. The title drops in letter by letter, the stats tally up one row at a
// time into a total, then a CONTINUE? countdown runs down; when it hits zero the screen
// settles on a final message. Continue and Quit are real buttons (Esc quits). Click while
// it tallies to skip ahead. Rename the title and stats and it is a playful 404 or 500 page.

export interface GameOverStat {
  label: ReactNode;
  value: number;
}

export interface GameOverProps {
  title?: string;
  subtitle?: ReactNode;
  /** Rows that tally up one at a time. */
  stats?: GameOverStat[];
  totalLabel?: string;
  /** Defaults to the sum of the stat values. */
  total?: number;
  /** CONTINUE? seconds; 0 turns the countdown off. */
  countdown?: number;
  continueLabel?: string;
  quitLabel?: string;
  /** Shown when the countdown reaches zero. */
  finalMessage?: string;
  onContinue?: () => void;
  onQuit?: () => void;
  onTimeout?: () => void;
  /** Tally time per row in ms. */
  tallyDuration?: number;
  /** Fixed full-screen dialog (Esc quits) instead of filling the parent. */
  fixed?: boolean;
  /** Focus Continue once it appears; defaults to fixed. */
  autoFocus?: boolean;
  /** Change to play it again. */
  replayKey?: string | number;
  minHeight?: number;
  titleSize?: number;
  backgroundColor?: string;
  titleColor?: string;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  lineColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  shadowColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

const STYLE_ID = 'bl-game-over';
const CSS = `
.bl-go { position: relative; display: grid; place-content: center; justify-items: center; gap: 22px; width: 100%; height: 100%; min-height: var(--bl-min-h); padding: 28px 16px; box-sizing: border-box; overflow: hidden; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); text-align: center; }
.bl-go[data-fixed] { position: fixed; inset: 0; z-index: 2000; min-height: 0; }
.bl-go__title { display: flex; flex-wrap: wrap; justify-content: center; margin: 0; color: var(--bl-title); font-size: var(--bl-title-size); font-weight: 400; line-height: 1.2; text-shadow: 0.08em 0.08em 0 var(--bl-shadow); }
.bl-go__title span { display: inline-block; animation: bl-go-drop 520ms cubic-bezier(.3,1.5,.5,1) both; animation-delay: calc(var(--i) * 80ms); }
.bl-go__sub { margin: -8px 0 0; color: var(--bl-muted); font-size: 11px; line-height: 1.6; }
.bl-go__stats { display: grid; gap: 10px; min-width: min(320px, 100%); margin: 0; font-size: 11px; }
.bl-go__row { display: flex; justify-content: space-between; gap: 24px; animation: bl-go-in 200ms steps(2) both; }
.bl-go__row dt { color: var(--bl-muted); }
.bl-go__row dd { margin: 0; font-variant-numeric: tabular-nums; }
.bl-go__row[data-total] { padding-top: 10px; border-top: 3px dotted var(--bl-line); color: var(--bl-accent); font-size: 13px; }
.bl-go__row[data-total] dt { color: inherit; }
.bl-go__continue { display: grid; gap: 10px; justify-items: center; min-height: 64px; font-size: 13px; }
.bl-go__count { color: var(--bl-accent); font-size: 32px; animation: bl-go-tick 1s steps(1) both; }
.bl-go__count[data-low] { color: var(--bl-title); }
.bl-go__final { color: var(--bl-muted); font-size: 12px; line-height: 1.6; animation: bl-go-in 300ms steps(3) both; }
.bl-go__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; }
.bl-go__btn { padding: 12px 18px; border: 0; background: var(--bl-btn); color: var(--bl-btn-ink); font: inherit; font-size: 11px; text-transform: uppercase; cursor: pointer; box-shadow: 0 0 0 3px var(--bl-shadow), inset -3px -3px 0 rgba(0,0,0,0.3), inset 3px 3px 0 rgba(255,255,255,0.25); }
.bl-go__btn[data-secondary] { background: transparent; color: var(--bl-ink); box-shadow: 0 0 0 3px var(--bl-line); }
.bl-go__btn:hover { filter: brightness(1.15); }
.bl-go__btn:active { transform: translateY(3px); }
.bl-go__btn:focus-visible { outline: 3px solid var(--bl-accent); outline-offset: 5px; }
.bl-go__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-go-drop { from { opacity: 0; transform: translateY(-1.4em); } }
@keyframes bl-go-in { from { opacity: 0; } }
@keyframes bl-go-tick { from { transform: scale(1.5); } 30% { transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .bl-go__title span, .bl-go__row, .bl-go__count, .bl-go__final { animation: none; }
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

const format = (value: number) => Math.round(value).toLocaleString('en-US');

export default function GameOver({
  title = 'GAME OVER',
  subtitle,
  stats = [],
  totalLabel = 'Total',
  total,
  countdown = 9,
  continueLabel = 'Continue',
  quitLabel = 'Quit',
  finalMessage = 'Thanks for playing!',
  onContinue,
  onQuit,
  onTimeout,
  tallyDuration = 700,
  fixed = false,
  autoFocus = fixed,
  replayKey,
  minHeight = 420,
  titleSize = 40,
  backgroundColor = '#0b0b14',
  titleColor = '#b13e53',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  accentColor = '#ffcd75',
  lineColor = '#333c57',
  buttonColor = '#38b764',
  buttonTextColor = '#0b0b14',
  shadowColor = '#000000',
  fontFamily = '"Press Start 2P", ui-monospace, monospace',
  className = '',
  style
}: GameOverProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const sum = total ?? stats.reduce((acc, row) => acc + (Number(row.value) || 0), 0);

  // One timeline: title, one slot per stat row, the total, then the countdown seconds.
  const plan = useMemo(() => {
    const titleEnd = [...title].length * 80 + 520;
    const rows = [...stats.map(row => Number(row.value) || 0), sum].map((value, i) => ({ value, start: titleEnd + i * (tallyDuration + 220) }));
    const tallyEnd = titleEnd + rows.length * (tallyDuration + 220);
    return { rows, tallyEnd, end: tallyEnd + countdown * 1000 };
  }, [title, stats, sum, tallyDuration, countdown]);

  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(0);
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    startRef.current = performance.now() - (reduced ? plan.tallyEnd : 0);
    setElapsed(reduced ? plan.tallyEnd : 0);
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(plan.end, now - startRef.current);
      setElapsed(t);
      if (t < plan.end) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [plan, replayKey]);

  const tallied = elapsed >= plan.tallyEnd;
  const timedOut = countdown > 0 && elapsed >= plan.end;
  const secondsLeft = Math.max(0, countdown - Math.floor((elapsed - plan.tallyEnd) / 1000));

  const skipTally = () => {
    if (!tallied) startRef.current = performance.now() - plan.tallyEnd;
  };

  const timeoutRef = useRef(onTimeout);
  timeoutRef.current = onTimeout;
  useEffect(() => {
    if (timedOut) timeoutRef.current?.();
  }, [timedOut]);

  const continueRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (tallied && autoFocus) continueRef.current?.focus({ preventScroll: true });
  }, [tallied, autoFocus]);

  const quitRef = useRef(onQuit);
  quitRef.current = onQuit;
  useEffect(() => {
    if (!fixed) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') quitRef.current?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [fixed]);

  const rows = plan.rows.map(row => {
    if (elapsed < row.start) return null;
    const progress = Math.min(1, (elapsed - row.start) / tallyDuration);
    // Ease out so the last digits settle slowly, like a real tally.
    return { shown: row.value * (1 - (1 - progress) ** 3) };
  });
  const totalRow = rows[rows.length - 1];

  return (
    <div
      className={`bl-go ${className}`}
      data-fixed={fixed || undefined}
      role={fixed ? 'dialog' : 'region'}
      aria-modal={fixed || undefined}
      aria-labelledby={`${uid}-title`}
      onClick={skipTally}
      style={{
        '--bl-min-h': `${minHeight}px`,
        '--bl-title-size': `${titleSize}px`,
        '--bl-bg': backgroundColor,
        '--bl-title': titleColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-accent': accentColor,
        '--bl-line': lineColor,
        '--bl-btn': buttonColor,
        '--bl-btn-ink': buttonTextColor,
        '--bl-shadow': shadowColor,
        '--bl-font': fontFamily,
        ...style
      } as CSSVars}
    >
      <h2 id={`${uid}-title`} className="bl-go__title" aria-label={title}>
        {[...title].map((ch, i) => (
          <span key={`${replayKey}-${i}`} aria-hidden="true" style={{ '--i': i } as CSSVars}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </h2>
      {subtitle && <p className="bl-go__sub">{subtitle}</p>}
      {(stats.length > 0 || total != null) && (
        <dl className="bl-go__stats">
          {stats.map((row, i) =>
            rows[i] ? (
              <div key={i} className="bl-go__row">
                <dt>{row.label}</dt>
                <dd>{format(rows[i].shown)}</dd>
              </div>
            ) : null
          )}
          {totalRow && (
            <div className="bl-go__row" data-total="">
              <dt>{totalLabel}</dt>
              <dd>{format(totalRow.shown)}</dd>
            </div>
          )}
        </dl>
      )}
      <div className="bl-go__continue">
        {tallied && countdown > 0 && !timedOut && (
          <>
            <span aria-hidden="true">CONTINUE?</span>
            <span key={secondsLeft} className="bl-go__count" data-low={secondsLeft <= 3 || undefined} aria-hidden="true">
              {secondsLeft}
            </span>
          </>
        )}
        {timedOut && <p className="bl-go__final">{finalMessage}</p>}
      </div>
      {tallied && (
        <div className="bl-go__actions">
          <button ref={continueRef} type="button" className="bl-go__btn" onClick={() => onContinue?.()}>
            {continueLabel}
          </button>
          <button type="button" className="bl-go__btn" data-secondary="" onClick={() => onQuit?.()}>
            {quitLabel}
          </button>
        </div>
      )}
      <p className="bl-go__sr" aria-live="polite">
        {tallied ? `${totalLabel}: ${format(sum)}.${countdown > 0 && !timedOut ? ` Continue? ${countdown} seconds to decide.` : ''}` : ''}
        {timedOut ? ` ${finalMessage}` : ''}
      </p>
    </div>
  );
}
