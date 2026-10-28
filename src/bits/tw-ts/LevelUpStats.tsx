import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// "What changed since last time", shown like an RPG level-up screen. Each stat counts from its
// old value to its new one, with a ▲ or ▼ change coloured by whether that direction is good for
// it (more revenue is good, more churn is not). Rows step in one after another; a banner appears
// when most changes are good. Numbers are real text; reduced motion shows the final values.

const STYLE_ID = 'bl-level-up-stats-tw';
const CSS = `
/* theme tokens */
.bl-lvlup { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-good: #a7f070; --bl-bad: #ef7d57; --bl-gold: #ffcd75; }
:where(.light, [data-theme="light"]) .bl-lvlup, .bl-lvlup:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-good: #2f7d22; --bl-bad: #c4502a; --bl-gold: #a86a12; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-lvlup, :where(.light, [data-theme="light"]) .bl-lvlup:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-good: #a7f070; --bl-bad: #ef7d57; --bl-gold: #ffcd75; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-lvlup, .bl-lvlup:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-good: #2f7d22; --bl-bad: #c4502a; --bl-gold: #a86a12; } }
/* theme tokens end */
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

function formatter(format: LevelUpFormat | undefined, locale: string | undefined, currency: string): (value: number) => string {
  if (typeof format === 'function') return format;
  const options: Intl.NumberFormatOptions = format === 'percent' ? { style: 'percent', maximumFractionDigits: 1 } : format === 'currency' ? { style: 'currency', currency, maximumFractionDigits: 0 } : format === 'compact' ? { notation: 'compact', maximumFractionDigits: 1 } : { maximumFractionDigits: 1 };
  const intl = new Intl.NumberFormat(locale, options);
  return (value: number) => intl.format(value);
}

export type LevelUpFormat = 'number' | 'percent' | 'currency' | 'compact' | ((value: number) => string);

export interface LevelUpStat {
  label: string;
  from: number;
  to: number;
  format?: LevelUpFormat;
  /** Which way is good for this stat. */
  goodDirection?: 'up' | 'down' | 'neutral';
}

export interface LevelUpStatsProps {
  stats?: LevelUpStat[];
  title?: string;
  period?: string;
  /** Shown when most changes are good; empty to hide. */
  banner?: string;
  /** Count time in ms. */
  duration?: number;
  trigger?: 'view' | 'mount';
  locale?: string;
  currency?: string;
  width?: number;
  backgroundColor?: string;
  chipColor?: string;
  lineColor?: string;
  textColor?: string;
  mutedColor?: string;
  goodColor?: string;
  badColor?: string;
  goldColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
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
}: LevelUpStatsProps) {
  useStyles();
  const rootRef = useRef<HTMLElement>(null);
  const [t, setT] = useState(0);
  const [started, setStarted] = useState(trigger === 'mount');

  useEffect(() => {
    if (started) return undefined;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setStarted(true), { threshold: 0.3 });
    observer.observe(rootRef.current!);
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
    const tick = (now: number) => {
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
      className={`bl-lvlup grid gap-2.5 p-4 w-[min(var(--bl-w),100%)] box-border bg-(--bl-bg) text-(--bl-ink) font-(family-name:--bl-font) text-[14px] shadow-[inset_0_0_0_3px_var(--bl-line),6px_6px_0_rgba(0,0,0,0.45)] ${className}`}
      aria-label={`${title}, ${period}`}
      style={{ '--bl-w': `${width}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-good': goodColor, '--bl-bad': badColor, '--bl-gold': goldColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-1.5">
        <p className="m-0 text-[15px] font-extrabold">{title}</p>
        <span className="text-[12px] text-(--bl-muted)">{period}</span>
      </div>
      {banner && started && t === 1 && goodCount > badCount && <span className="animate-[bl-lvlup-banner_600ms_steps(4)_both] [justify-self:start] bg-(--bl-gold) px-2.5 py-1 text-[12px] font-black tracking-[0.1em] text-[#0b0b14] motion-reduce:animate-none">{banner}</span>}
      <ul className="m-0 grid list-none gap-1 p-0">
        {started &&
          rows.map((row, i) => (
            <li key={row.label} className="grid animate-[bl-lvlup-row_320ms_steps(3)_calc(var(--i)_*_110ms)_both] grid-cols-[1fr_auto_auto] items-center gap-3 bg-(--bl-chip) px-2.5 py-2 motion-reduce:animate-none" style={{ '--i': i } as CSSVars}>
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
