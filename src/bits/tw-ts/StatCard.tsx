import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

export type StatFormat = 'compact' | 'currency' | 'percent' | 'number' | ((value: number) => string);

export interface StatCardProps {
  label?: string;
  value?: number;
  /** The previous value; the delta is computed from it. */
  previous?: number;
  /** Or pass the delta directly (0.12 = +12%). */
  delta?: number;
  /** What the delta compares to. */
  period?: string;
  /** Whether up is good (green) or bad (red). */
  goodDirection?: 'up' | 'down' | 'neutral';
  format?: StatFormat;
  currency?: string;
  locale?: string;
  /** Sparkline points (12 is ideal). */
  trend?: number[];
  trendLabels?: string[];
  icon?: ReactNode;
  /** Roll duration in ms. */
  duration?: number;
  width?: number;
  valueSize?: number;
  sparkHeight?: number;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  trendColor?: string;
  accentColor?: string;
  goodColor?: string;
  badColor?: string;
  radius?: number;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

const STYLE_ID = 'bl-stat-card-tw';
const CSS = `
/* theme tokens */
.bl-stat { --bl-muted: #94b0c2; --bl-ink: #f4f4f4; --bl-bg: #1a1c2c; --bl-line: #333c57; --bl-trend: #566c86; }
:where(.light, [data-theme="light"]) .bl-stat, .bl-stat:where(.light, [data-theme="light"]) { --bl-muted: #566c86; --bl-ink: #1a1c2c; --bl-bg: #f4f1e8; --bl-line: #cfc4ad; --bl-trend: #8a96a3; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-stat, :where(.light, [data-theme="light"]) .bl-stat:where(.dark, [data-theme="dark"]) { --bl-muted: #94b0c2; --bl-ink: #f4f4f4; --bl-bg: #1a1c2c; --bl-line: #333c57; --bl-trend: #566c86; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-stat, .bl-stat:where([data-theme="system"]) { --bl-muted: #566c86; --bl-ink: #1a1c2c; --bl-bg: #f4f1e8; --bl-line: #cfc4ad; --bl-trend: #8a96a3; } }
/* theme tokens end */
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export function formatStat(value: number, format: StatFormat = 'compact', { locale, currency = 'USD' }: { locale?: string; currency?: string } = {}): string {
  if (typeof format === 'function') return format(value);
  const options: Intl.NumberFormatOptions =
    format === 'currency'
      ? { style: 'currency', currency, currencyDisplay: 'narrowSymbol', notation: Math.abs(value) >= 10000 ? 'compact' : 'standard', maximumFractionDigits: Math.abs(value) >= 10000 ? 1 : 2 }
      : format === 'percent'
        ? { style: 'percent', maximumFractionDigits: 1 }
        : format === 'compact'
          ? { notation: Math.abs(value) >= 10000 ? 'compact' : 'standard', maximumFractionDigits: Math.abs(value) >= 10000 ? 1 : 0 }
          : { maximumFractionDigits: 2 };
  return new Intl.NumberFormat(locale, options).format(value);
}

export default function StatCard({
  label = 'Metric',
  value = 0,
  previous,
  delta,
  period = 'vs last period',
  goodDirection = 'up',
  format = 'compact',
  currency = 'USD',
  locale,
  trend = [],
  trendLabels,
  icon,
  duration = 900,
  width = 300,
  valueSize = 34,
  sparkHeight = 44,
  backgroundColor,
  textColor,
  mutedColor,
  lineColor,
  trendColor,
  accentColor = '#3987e5',
  goodColor = '#0ca30c',
  badColor = '#e66767',
  radius = 14,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: StatCardProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  const [hover, setHover] = useState<number | null>(null);
  const sparkRef = useRef<HTMLDivElement>(null);
  const fmt = (v: number) => formatStat(v, format, { locale, currency });

  // Roll from the number on screen to the new value.
  useEffect(() => {
    const from = shownRef.current;
    if (from === value) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !duration) {
      shownRef.current = value;
      setShown(value);
      return undefined;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - p) ** 3;
      const v = from + (value - from) * eased;
      shownRef.current = v;
      setShown(v);
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  const change = delta ?? (previous != null && previous !== 0 ? (value - previous) / Math.abs(previous) : null);
  const direction = change == null || change === 0 ? 'flat' : change > 0 ? 'up' : 'down';
  const good = goodDirection === 'neutral' || direction === 'flat' ? null : direction === goodDirection;
  const deltaColor = good == null ? (mutedColor ?? 'var(--bl-muted)') : good ? goodColor : badColor;
  const deltaText = change == null ? '' : `${change > 0 ? '+' : change < 0 ? '−' : ''}${new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(Math.abs(change))}`;

  // Sparkline geometry in a 100 × 40 box.
  const n = trend.length;
  const lo = Math.min(...trend);
  const hi = Math.max(...trend);
  const span = hi - lo || 1;
  const pts = trend.map((v, i) => [n > 1 ? (i / (n - 1)) * 100 : 50, 38 - ((v - lo) / span) * 34]);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');
  const area = n > 1 ? `${line} L100 40 L0 40 Z` : '';
  const at = hover ?? n - 1;

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = sparkRef.current!.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(x * (n - 1)))));
  };

  const summary = n > 1 ? `Trend: from ${fmt(trend[0])} to ${fmt(trend[n - 1])}, low ${fmt(lo)}, high ${fmt(hi)}.` : '';

  return (
    <div
      className={`bl-stat relative box-border grid w-full max-w-(--bl-w) gap-1.5 rounded-(--bl-radius) bg-(--bl-bg) px-[18px] pt-4 pb-3.5 font-(family-name:--bl-font) text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line)] ${className}`}
      role="group"
      aria-labelledby={`${uid}-label`}
      style={{
        '--bl-w': `${width}px`,
        '--bl-size': `${valueSize}px`,
        '--bl-spark-h': `${sparkHeight}px`,
        '--bl-bg': backgroundColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-line': lineColor,
        '--bl-trend': trendColor,
        '--bl-delta': deltaColor,
        '--bl-radius': `${radius}px`,
        '--bl-font': fontFamily,
        ...style
      } as CSSVars}
    >
      <div className="flex items-center gap-2 text-[13px] font-semibold text-(--bl-muted)">
        {icon && (
          <span className="grid size-[22px] place-items-center" aria-hidden="true">
            {icon}
          </span>
        )}
        <span id={`${uid}-label`}>{label}</span>
      </div>
      <div className="text-(length:--bl-size) leading-[1.1] font-[650] tracking-[-0.01em]" aria-hidden="true">
        {fmt(shown)}
      </div>
      <span className="sr-only">{fmt(value)}</span>
      {change != null && (
        <div className="flex items-center gap-1.5 text-[13px]">
          <span className="inline-flex items-center gap-[3px] font-bold text-(--bl-delta)">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {direction === 'up' ? <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" /> : direction === 'down' ? <path d="M6 2v8M2.5 6.5 6 10l3.5-3.5" /> : <path d="M2 6h8" />}
            </svg>
            <span className="sr-only">{direction === 'up' ? 'Up' : direction === 'down' ? 'Down' : 'No change'}</span>
            {deltaText}
          </span>
          <span className="text-(--bl-muted)">{period}</span>
        </div>
      )}
      {n > 1 && (
        <div ref={sparkRef} className="relative mt-1.5 h-(--bl-spark-h) [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:overflow-visible" onPointerMove={onMove} onPointerLeave={() => setHover(null)} aria-hidden="true">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none">
            <path className="fill-(--bl-trend) opacity-10" d={area} />
            <path className="fill-none stroke-(--bl-trend) stroke-2 [stroke-linecap:round] [stroke-linejoin:round] [vector-effect:non-scaling-stroke]" d={line} />
            {hover != null && <line className="stroke-(--bl-muted) stroke-1 [vector-effect:non-scaling-stroke]" x1={pts[hover][0]} x2={pts[hover][0]} y1={0} y2={40} />}
          </svg>
          <span className="pointer-events-none absolute -mt-1 -ml-1 size-2 rounded-[50%] shadow-[0_0_0_2px_var(--bl-bg)]" style={{ left: `${pts[at][0]}%`, top: `${(pts[at][1] / 40) * 100}%`, background: at === n - 1 ? accentColor : (textColor ?? 'var(--bl-ink)') }} />
          {hover != null && (
            <span className="pointer-events-none absolute bottom-[calc(100%_+_6px)] rounded-[7px] bg-(--bl-ink) px-2 py-[5px] text-[12px] leading-[1.3] whitespace-nowrap text-(--bl-bg) [transform:translateX(-50%)] [&_b]:block [&_b]:text-[13px]" style={{ left: `${Math.max(12, Math.min(88, pts[hover][0]))}%` }}>
              <b>{fmt(trend[hover])}</b>
              {trendLabels?.[hover] ?? `Point ${hover + 1} of ${n}`}
            </span>
          )}
        </div>
      )}
      {summary && <span className="sr-only">{summary}</span>}
    </div>
  );
}
