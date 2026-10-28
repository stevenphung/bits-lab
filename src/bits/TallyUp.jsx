import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// A number that climbs to its value while a bar of pixel blocks fills toward a goal. Milestone
// notches flash as the count passes them, and the "arcade" curve counts in chunky steps with a
// bump on each one, like a score tallying up. Starts when it scrolls into view (or at mount).
// Screen readers get the final figure once; reduced motion shows it straight away.

const STYLE_ID = 'bl-tally-up';
const CSS = `
.bl-tally { display: grid; gap: 10px; width: 100%; max-width: var(--bl-w); font-family: var(--bl-font); color: var(--bl-ink); }
.bl-tally__head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.bl-tally__caption { color: var(--bl-muted); font-size: 14px; }
.bl-tally__figure { display: inline-flex; align-items: baseline; gap: 6px; font-size: var(--bl-size); font-weight: 700; line-height: 1; font-variant-numeric: tabular-nums; }
.bl-tally__figure[data-bump] { animation: bl-tally-bump 160ms steps(2); }
.bl-tally__unit { color: var(--bl-muted); font-size: 0.45em; font-weight: 600; }
.bl-tally__bar { position: relative; display: grid; grid-template-columns: repeat(var(--bl-blocks), minmax(0, 1fr)); gap: var(--bl-gap); height: var(--bl-bar-h); }
.bl-tally__block { background: var(--bl-track); transition: background-color 120ms steps(1); }
.bl-tally__block[data-on] { background: var(--bl-fill); box-shadow: inset 0 -3px 0 rgba(0,0,0,0.25); }
.bl-tally__bar[data-done] .bl-tally__block[data-on] { animation: bl-tally-flash 600ms steps(3); }
.bl-tally__notch { position: absolute; top: -5px; bottom: -5px; left: var(--x); width: 2px; margin-left: -1px; background: var(--bl-muted); opacity: 0.6; }
.bl-tally__notch[data-passed] { background: var(--bl-accent); opacity: 1; animation: bl-tally-notch 500ms steps(4); }
.bl-tally__goal { color: var(--bl-muted); font-size: 12px; text-align: right; font-variant-numeric: tabular-nums; }
.bl-tally__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-tally-bump { 50% { transform: translateY(-3px); } }
@keyframes bl-tally-flash { 33% { background: var(--bl-accent); } }
@keyframes bl-tally-notch { 50% { transform: scaleY(1.6); } }
@media (prefers-reduced-motion: reduce) { .bl-tally__figure[data-bump], .bl-tally__bar[data-done] .bl-tally__block[data-on], .bl-tally__notch[data-passed] { animation: none; } .bl-tally__block { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function TallyUp({
  value = 0,
  goal,
  start = 0,
  duration = 1600,
  curve = 'ease',
  steps = 12,
  blocks = 20,
  milestones = [],
  trigger = 'view',
  locale,
  format,
  unit = '',
  caption = '',
  showGoal = true,
  onReach,
  width = 420,
  fontSize = 48,
  barHeight = 14,
  gap = 3,
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  trackColor = '#262b44',
  fillColor = '#38b764',
  accentColor = '#ffcd75',
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const rootRef = useRef(null);
  const figureRef = useRef(null);
  const reachRef = useRef(onReach);
  reachRef.current = onReach;
  const [shown, setShown] = useState(start);
  const [done, setDone] = useState(false);
  const target = goal ?? value;
  const fmt = new Intl.NumberFormat(locale, format);

  useEffect(() => {
    const root = rootRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let begun = 0;
    let lastStep = -1;
    setDone(false);

    const finish = () => {
      setShown(value);
      setDone(true);
      reachRef.current?.(value);
    };
    const tick = now => {
      if (!begun) begun = now;
      const t = Math.min(1, (now - begun) / duration);
      let k;
      if (curve === 'steps') {
        // Chunky arcade count: jump in equal steps, bumping the figure on each one.
        const step = Math.min(steps, Math.floor(t * steps + 1e-9));
        k = step / steps;
        if (step !== lastStep) {
          lastStep = step;
          const figure = figureRef.current;
          if (figure && step > 0) {
            delete figure.dataset.bump;
            void figure.offsetWidth;
            figure.dataset.bump = '';
          }
        }
      } else k = 1 - Math.pow(1 - t, 3);
      setShown(start + (value - start) * k);
      if (t < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    const run = () => {
      if (reduced) finish();
      else raf = requestAnimationFrame(tick);
    };

    if (trigger === 'mount') {
      run();
      return () => cancelAnimationFrame(raf);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      run();
    }, { threshold: 0.4 });
    observer.observe(root);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, start, duration, curve, steps, trigger]);

  // Round to the precision the formatter shows, so the figure doesn't jitter with decimals.
  const decimals = format?.maximumFractionDigits ?? format?.minimumFractionDigits ?? 0;
  const display = fmt.format(Number(shown.toFixed(decimals)));
  const share = target ? Math.max(0, Math.min(1, shown / target)) : 0;
  const lit = Math.round(share * blocks);

  return (
    <div
      ref={rootRef}
      className={`bl-tally ${className}`}
      style={{ '--bl-w': `${width}px`, '--bl-size': `${fontSize}px`, '--bl-bar-h': `${barHeight}px`, '--bl-gap': `${gap}px`, '--bl-blocks': blocks, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-track': trackColor, '--bl-fill': fillColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      <div className="bl-tally__head" aria-hidden="true">
        <span ref={figureRef} className="bl-tally__figure">
          {display}
          {unit && <span className="bl-tally__unit">{unit}</span>}
        </span>
        {caption && <span className="bl-tally__caption">{caption}</span>}
      </div>
      <div className="bl-tally__bar" data-done={done || undefined} aria-hidden="true">
        {Array.from({ length: blocks }, (_, i) => (
          <span key={i} className="bl-tally__block" data-on={i < lit || undefined} />
        ))}
        {target > 0 &&
          milestones
            .filter(m => m > 0 && m < target)
            .map(m => <span key={m} className="bl-tally__notch" data-passed={shown >= m || undefined} style={{ '--x': `${(m / target) * 100}%` }} />)}
      </div>
      {showGoal && goal != null && (
        <span className="bl-tally__goal" aria-hidden="true">
          of {fmt.format(goal)}
          {unit && ` ${unit}`}
        </span>
      )}
      <span className="bl-tally__sr" role="status">
        {done ? `${caption ? `${caption}: ` : ''}${fmt.format(value)}${unit ? ` ${unit}` : ''}${goal != null ? ` of ${fmt.format(goal)}` : ''}` : ''}
      </span>
    </div>
  );
}
