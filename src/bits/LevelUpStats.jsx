import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// "What changed since last time", shown like an RPG level-up screen. Each stat counts from its
// old value to its new one, with a ▲ or ▼ change coloured by whether that direction is good for
// it (more revenue is good, more churn is not). Rows step in one after another; a banner appears
// when most changes are good. Numbers are real text; reduced motion shows the final values.

const STYLE_ID = 'bl-level-up-stats';
const CSS = `
/* theme tokens */
.bl-lvlup { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-good: #a7f070; --bl-bad: #ef7d57; --bl-gold: #ffcd75; }
:where(.light, [data-theme="light"]) .bl-lvlup, .bl-lvlup:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-good: #2f7d22; --bl-bad: #c4502a; --bl-gold: #a86a12; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-lvlup, :where(.light, [data-theme="light"]) .bl-lvlup:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-good: #a7f070; --bl-bad: #ef7d57; --bl-gold: #ffcd75; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-lvlup, .bl-lvlup:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-good: #2f7d22; --bl-bad: #c4502a; --bl-gold: #a86a12; } }
/* theme tokens end */
.bl-lvlup { display: grid; gap: 10px; width: min(var(--bl-w), 100%); padding: 16px; box-sizing: border-box; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); font-size: 14px; box-shadow: inset 0 0 0 3px var(--bl-line), 6px 6px 0 rgba(0,0,0,0.45); }
.bl-lvlup__head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 6px; }
.bl-lvlup__title { margin: 0; font-size: 15px; font-weight: 800; }
.bl-lvlup__period { color: var(--bl-muted); font-size: 12px; }
.bl-lvlup__banner { justify-self: start; padding: 4px 10px; background: var(--bl-gold); color: #0b0b14; font-size: 12px; font-weight: 900; letter-spacing: 0.1em; animation: bl-lvlup-banner 600ms steps(4) both; }
.bl-lvlup__list { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.bl-lvlup__row { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 12px; padding: 8px 10px; background: var(--bl-chip); animation: bl-lvlup-row 320ms steps(3) both; animation-delay: calc(var(--i) * 110ms); }
.bl-lvlup__label { color: var(--bl-muted); font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.bl-lvlup__value { font-size: 16px; font-weight: 800; font-variant-numeric: tabular-nums; }
.bl-lvlup__delta { min-width: 64px; padding: 2px 6px; font-size: 12px; font-weight: 800; text-align: right; font-variant-numeric: tabular-nums; }
.bl-lvlup__delta[data-tone="good"] { color: var(--bl-good); }
.bl-lvlup__delta[data-tone="bad"] { color: var(--bl-bad); }
.bl-lvlup__delta[data-tone="flat"] { color: var(--bl-muted); }
.bl-lvlup__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-lvlup-row { from { opacity: 0; transform: translateX(-12px); } }
@keyframes bl-lvlup-banner { 0% { opacity: 0; transform: scale(0.6); } 60% { transform: scale(1.1); } }
@media (prefers-reduced-motion: reduce) { .bl-lvlup__row, .bl-lvlup__banner { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

function formatter(format, locale, currency) {
  if (typeof format === 'function') return format;
  const options = format === 'percent' ? { style: 'percent', maximumFractionDigits: 1 } : format === 'currency' ? { style: 'currency', currency, maximumFractionDigits: 0 } : format === 'compact' ? { notation: 'compact', maximumFractionDigits: 1 } : { maximumFractionDigits: 1 };
  const intl = new Intl.NumberFormat(locale, options);
  return value => intl.format(value);
}

export default function LevelUpStats({
  stats = [],
  title = 'Level up',
  period = 'since last week',
  banner = 'LEVEL UP!',
  duration = 900,
  trigger = 'view',
  locale,
  currency = 'USD',
  width = 380,
  backgroundColor,
  chipColor,
  lineColor,
  textColor,
  mutedColor,
  goodColor,
  badColor,
  goldColor,
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const rootRef = useRef(null);
  const [t, setT] = useState(0);
  const [started, setStarted] = useState(trigger === 'mount');

  useEffect(() => {
    if (started) return undefined;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setStarted(true), { threshold: 0.3 });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setT(1);
      return undefined;
    }
    let raf = 0;
    let begun = 0;
    const tick = now => {
      if (!begun) begun = now;
      const k = Math.min(1, (now - begun) / duration);
      setT(k);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, duration]);

  const ease = 1 - Math.pow(1 - t, 3);
  const rows = stats.map(stat => {
    const change = stat.to - stat.from;
    const good = stat.goodDirection === 'down' ? change < 0 : change > 0;
    const tone = change === 0 || stat.goodDirection === 'neutral' ? 'flat' : good ? 'good' : 'bad';
    return { ...stat, change, tone, fmt: formatter(stat.format, locale, currency) };
  });
  const goodCount = rows.filter(r => r.tone === 'good').length;
  const badCount = rows.filter(r => r.tone === 'bad').length;

  return (
    <section
      ref={rootRef}
      className={`bl-lvlup ${className}`}
      aria-label={`${title}, ${period}`}
      style={{ '--bl-w': `${width}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-good': goodColor, '--bl-bad': badColor, '--bl-gold': goldColor, '--bl-font': fontFamily, ...style }}
    >
      <div className="bl-lvlup__head">
        <p className="bl-lvlup__title">{title}</p>
        <span className="bl-lvlup__period">{period}</span>
      </div>
      {banner && started && t === 1 && goodCount > badCount && <span className="bl-lvlup__banner">{banner}</span>}
      <ul className="bl-lvlup__list">
        {started &&
          rows.map((row, i) => (
            <li key={row.label} className="bl-lvlup__row" style={{ '--i': i }}>
              <span className="bl-lvlup__label">{row.label}</span>
              <span className="bl-lvlup__value">{row.fmt(row.from + row.change * ease)}</span>
              <span className="bl-lvlup__delta" data-tone={row.tone}>
                {row.change > 0 ? '▲ +' : row.change < 0 ? '▼ −' : '= '}
                {row.fmt(Math.abs(row.change))}
                <span className="bl-lvlup__sr">{row.tone === 'good' ? ', good' : row.tone === 'bad' ? ', worse' : ''}</span>
              </span>
            </li>
          ))}
      </ul>
    </section>
  );
}
