import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A KPI card. The value rolls to each new number, a signed delta vs a named period sits under
// it with an arrow (green or red depending on whether up is good here, never color alone),
// and a 12-point sparkline shows the trend with the current point marked. Hover the line for
// a crosshair and a value-first tooltip. Screen readers get the value, delta and a one-line
// trend summary.

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

const STYLE_ID = 'bl-stat-card';
const CSS = `
.bl-stat { position: relative; display: grid; gap: 6px; width: 100%; max-width: var(--bl-w); box-sizing: border-box; padding: 16px 18px 14px; border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); box-shadow: 0 0 0 1px var(--bl-line); }
.bl-stat__top { display: flex; align-items: center; gap: 8px; color: var(--bl-muted); font-size: 13px; font-weight: 600; }
.bl-stat__icon { display: grid; place-items: center; width: 22px; height: 22px; }
.bl-stat__value { font-size: var(--bl-size); font-weight: 650; line-height: 1.1; letter-spacing: -0.01em; }
.bl-stat__delta { display: flex; align-items: center; gap: 6px; font-size: 13px; }
.bl-stat__chip { display: inline-flex; align-items: center; gap: 3px; font-weight: 700; color: var(--bl-delta); }
.bl-stat__period { color: var(--bl-muted); }
.bl-stat__spark { position: relative; height: var(--bl-spark-h); margin-top: 6px; }
.bl-stat__spark svg { display: block; width: 100%; height: 100%; overflow: visible; }
.bl-stat__line { fill: none; stroke: var(--bl-trend); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.bl-stat__area { fill: var(--bl-trend); opacity: 0.1; }
.bl-stat__cross { stroke: var(--bl-muted); stroke-width: 1; vector-effect: non-scaling-stroke; }
.bl-stat__tip { position: absolute; bottom: calc(100% + 6px); padding: 5px 8px; border-radius: 7px; background: var(--bl-ink); color: var(--bl-bg); font-size: 12px; line-height: 1.3; white-space: nowrap; pointer-events: none; transform: translateX(-50%); }
.bl-stat__tip b { display: block; font-size: 13px; }
.bl-stat__dot { position: absolute; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 50%; box-shadow: 0 0 0 2px var(--bl-bg); pointer-events: none; }
.bl-stat__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
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
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = '#333c57',
  trendColor = '#566c86',
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
  const deltaColor = good == null ? mutedColor : good ? goodColor : badColor;
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
      className={`bl-stat ${className}`}
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
      <div className="bl-stat__top">
        {icon && (
          <span className="bl-stat__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        <span id={`${uid}-label`}>{label}</span>
      </div>
      <div className="bl-stat__value" aria-hidden="true">
        {fmt(shown)}
      </div>
      <span className="bl-stat__sr">{fmt(value)}</span>
      {change != null && (
        <div className="bl-stat__delta">
          <span className="bl-stat__chip">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {direction === 'up' ? <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" /> : direction === 'down' ? <path d="M6 2v8M2.5 6.5 6 10l3.5-3.5" /> : <path d="M2 6h8" />}
            </svg>
            <span className="bl-stat__sr">{direction === 'up' ? 'Up' : direction === 'down' ? 'Down' : 'No change'}</span>
            {deltaText}
          </span>
          <span className="bl-stat__period">{period}</span>
        </div>
      )}
      {n > 1 && (
        <div ref={sparkRef} className="bl-stat__spark" onPointerMove={onMove} onPointerLeave={() => setHover(null)} aria-hidden="true">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none">
            <path className="bl-stat__area" d={area} />
            <path className="bl-stat__line" d={line} />
            {hover != null && <line className="bl-stat__cross" x1={pts[hover][0]} x2={pts[hover][0]} y1={0} y2={40} />}
          </svg>
          <span className="bl-stat__dot" style={{ left: `${pts[at][0]}%`, top: `${(pts[at][1] / 40) * 100}%`, background: at === n - 1 ? accentColor : textColor }} />
          {hover != null && (
            <span className="bl-stat__tip" style={{ left: `${Math.max(12, Math.min(88, pts[hover][0]))}%` }}>
              <b>{fmt(trend[hover])}</b>
              {trendLabels?.[hover] ?? `Point ${hover + 1} of ${n}`}
            </span>
          )}
        </div>
      )}
      {summary && <span className="bl-stat__sr">{summary}</span>}
    </div>
  );
}
