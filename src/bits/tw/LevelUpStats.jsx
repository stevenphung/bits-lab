import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// "What changed since last time", shown like an RPG level-up screen. Each stat counts from its
// old value to its new one, with a ▲ or ▼ change coloured by whether that direction is good for
// it (more revenue is good, more churn is not). Rows step in one after another; a banner appears
// when most changes are good. Numbers are real text; reduced motion shows the final values.

const STYLE_ID = 'bl-level-up-stats-tw';
const CSS = `
@keyframes bl-lvlup-row { from { opacity: 0; transform: translateX(-12px); } }
@keyframes bl-lvlup-banner { 0% { opacity: 0; transform: scale(0.6); } 60% { transform: scale(1.1); } }
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
  backgroundColor = '#1a1c2c',
  chipColor = '#262b44',
  lineColor = '#333c57',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  goodColor = '#a7f070',
  badColor = '#ef7d57',
  goldColor = '#ffcd75',
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
      className={`grid gap-2.5 p-4 w-[min(var(--bl-w),100%)] box-border bg-(--bl-bg) text-(--bl-ink) font-(family-name:--bl-font) text-[14px] shadow-[inset_0_0_0_3px_var(--bl-line),6px_6px_0_rgba(0,0,0,0.45)] ${className}`}
      aria-label={`${title}, ${period}`}
      style={{ '--bl-w': `${width}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-good': goodColor, '--bl-bad': badColor, '--bl-gold': goldColor, '--bl-font': fontFamily, ...style }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-1.5">
        <p className="m-0 text-[15px] font-extrabold">{title}</p>
        <span className="text-[12px] text-(--bl-muted)">{period}</span>
      </div>
      {banner && started && t === 1 && goodCount > badCount && <span className="animate-[bl-lvlup-banner_600ms_steps(4)_both] [justify-self:start] bg-(--bl-gold) px-2.5 py-1 text-[12px] font-black tracking-[0.1em] text-[#0b0b14] motion-reduce:animate-none">{banner}</span>}
      <ul className="m-0 grid list-none gap-1 p-0">
        {started &&
          rows.map((row, i) => (
            <li key={row.label} className="grid animate-[bl-lvlup-row_320ms_steps(3)_calc(var(--i)_*_110ms)_both] grid-cols-[1fr_auto_auto] items-center gap-3 bg-(--bl-chip) px-2.5 py-2 motion-reduce:animate-none" style={{ '--i': i }}>
              <span className="text-[12px] font-bold tracking-[0.04em] text-(--bl-muted) uppercase">{row.label}</span>
              <span className="text-[16px] font-extrabold tabular-nums">{row.fmt(row.from + row.change * ease)}</span>
              <span className="min-w-16 px-1.5 py-0.5 text-right text-[12px] font-extrabold tabular-nums data-[tone=bad]:text-(--bl-bad) data-[tone=flat]:text-(--bl-muted) data-[tone=good]:text-(--bl-good)" data-tone={row.tone}>
                {row.change > 0 ? '▲ +' : row.change < 0 ? '▼ −' : '= '}
                {row.fmt(Math.abs(row.change))}
                <span className="sr-only">{row.tone === 'good' ? ', good' : row.tone === 'bad' ? ', worse' : ''}</span>
              </span>
            </li>
          ))}
      </ul>
    </section>
  );
}
