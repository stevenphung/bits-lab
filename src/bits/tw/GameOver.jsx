import { useEffect, useId, useInsertionEffect, useMemo, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// End-of-game screen. The title drops in letter by letter, the stats tally up one row at a
// time into a total, then a CONTINUE? countdown runs down; when it hits zero the screen
// settles on a final message. Continue and Quit are real buttons (Esc quits). Click while
// it tallies to skip ahead. Rename the title and stats and it is a playful 404 or 500 page.

const STYLE_ID = 'bl-game-over-tw';
const CSS = `
@keyframes bl-go-drop { from { opacity: 0; transform: translateY(-1.4em); } }
@keyframes bl-go-in { from { opacity: 0; } }
@keyframes bl-go-tick { from { transform: scale(1.5); } 30% { transform: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const format = value => Math.round(value).toLocaleString('en-US');

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
}) {
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
    const tick = now => {
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

  const continueRef = useRef(null);
  useEffect(() => {
    if (tallied && autoFocus) continueRef.current?.focus({ preventScroll: true });
  }, [tallied, autoFocus]);

  const quitRef = useRef(onQuit);
  quitRef.current = onQuit;
  useEffect(() => {
    if (!fixed) return undefined;
    const onKey = event => {
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
      className={`relative box-border grid h-full min-h-(--bl-min-h) w-full place-content-center justify-items-center gap-[22px] overflow-hidden bg-(--bl-bg) px-4 py-7 text-center font-(family-name:--bl-font) text-(--bl-ink) data-[fixed]:fixed data-[fixed]:inset-0 data-[fixed]:z-2000 data-[fixed]:min-h-0 ${className}`}
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
      }}
    >
      <h2 id={`${uid}-title`} className="m-0 flex flex-wrap justify-center text-(length:--bl-title-size) leading-[1.2] font-normal text-(--bl-title) [text-shadow:0.08em_0.08em_0_var(--bl-shadow)] *:inline-block *:animate-[bl-go-drop_520ms_cubic-bezier(.3,1.5,.5,1)_both] *:[animation-delay:calc(var(--i)*80ms)] motion-reduce:*:animate-none" aria-label={title}>
        {[...title].map((ch, i) => (
          <span key={`${replayKey}-${i}`} aria-hidden="true" style={{ '--i': i }}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </h2>
      {subtitle && <p className="-mt-2 mb-0 text-[11px] leading-[1.6] text-(--bl-muted)">{subtitle}</p>}
      {(stats.length > 0 || total != null) && (
        <dl className="m-0 grid min-w-[min(320px,100%)] gap-2.5 text-[11px]">
          {stats.map((row, i) =>
            rows[i] ? (
              <div key={i} className="flex animate-[bl-go-in_200ms_steps(2)_both] justify-between gap-6 [&_dd]:m-0 [&_dd]:tabular-nums [&_dt]:text-(--bl-muted) data-[total]:border-t-3 data-[total]:border-dotted data-[total]:border-(--bl-line) data-[total]:pt-2.5 data-[total]:text-[13px] data-[total]:text-(--bl-accent) data-[total]:[&_dt]:text-inherit motion-reduce:animate-none">
                <dt>{row.label}</dt>
                <dd>{format(rows[i].shown)}</dd>
              </div>
            ) : null
          )}
          {totalRow && (
            <div className="flex animate-[bl-go-in_200ms_steps(2)_both] justify-between gap-6 [&_dd]:m-0 [&_dd]:tabular-nums [&_dt]:text-(--bl-muted) data-[total]:border-t-3 data-[total]:border-dotted data-[total]:border-(--bl-line) data-[total]:pt-2.5 data-[total]:text-[13px] data-[total]:text-(--bl-accent) data-[total]:[&_dt]:text-inherit motion-reduce:animate-none" data-total="">
              <dt>{totalLabel}</dt>
              <dd>{format(totalRow.shown)}</dd>
            </div>
          )}
        </dl>
      )}
      <div className="grid min-h-16 justify-items-center gap-2.5 text-[13px]">
        {tallied && countdown > 0 && !timedOut && (
          <>
            <span aria-hidden="true">CONTINUE?</span>
            <span key={secondsLeft} className="animate-[bl-go-tick_1s_steps(1)_both] text-[32px] text-(--bl-accent) data-[low]:text-(--bl-title) motion-reduce:animate-none" data-low={secondsLeft <= 3 || undefined} aria-hidden="true">
              {secondsLeft}
            </span>
          </>
        )}
        {timedOut && <p className="animate-[bl-go-in_300ms_steps(3)_both] text-[12px] leading-[1.6] text-(--bl-muted) motion-reduce:animate-none">{finalMessage}</p>}
      </div>
      {tallied && (
        <div className="flex flex-wrap justify-center gap-3.5">
          <button ref={continueRef} type="button" className="cursor-pointer border-0 bg-(--bl-btn) px-[18px] py-3 text-[11px] text-(--bl-btn-ink) uppercase shadow-[0_0_0_3px_var(--bl-shadow),inset_-3px_-3px_0_rgba(0,0,0,0.3),inset_3px_3px_0_rgba(255,255,255,0.25)] hover:[filter:brightness(1.15)] focus-visible:outline-3 focus-visible:outline-offset-5 focus-visible:outline-(--bl-accent) focus-visible:outline-solid active:[transform:translateY(3px)] data-[secondary]:bg-transparent data-[secondary]:text-(--bl-ink) data-[secondary]:shadow-[0_0_0_3px_var(--bl-line)]" onClick={() => onContinue?.()}>
            {continueLabel}
          </button>
          <button type="button" className="cursor-pointer border-0 bg-(--bl-btn) px-[18px] py-3 text-[11px] text-(--bl-btn-ink) uppercase shadow-[0_0_0_3px_var(--bl-shadow),inset_-3px_-3px_0_rgba(0,0,0,0.3),inset_3px_3px_0_rgba(255,255,255,0.25)] hover:[filter:brightness(1.15)] focus-visible:outline-3 focus-visible:outline-offset-5 focus-visible:outline-(--bl-accent) focus-visible:outline-solid active:[transform:translateY(3px)] data-[secondary]:bg-transparent data-[secondary]:text-(--bl-ink) data-[secondary]:shadow-[0_0_0_3px_var(--bl-line)]" data-secondary="" onClick={() => onQuit?.()}>
            {quitLabel}
          </button>
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {tallied ? `${totalLabel}: ${format(sum)}.${countdown > 0 && !timedOut ? ` Continue? ${countdown} seconds to decide.` : ''}` : ''}
        {timedOut ? ` ${finalMessage}` : ''}
      </p>
    </div>
  );
}
