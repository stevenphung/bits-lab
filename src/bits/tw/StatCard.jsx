import { useEffect, useId, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A KPI card. The value rolls to each new number, a signed delta vs a named period sits under
// it with an arrow (green or red depending on whether up is good here, never color alone),
// and a 12-point sparkline shows the trend with the current point marked. Hover the line for
// a crosshair and a value-first tooltip. Screen readers get the value, delta and a one-line
// trend summary.

export function formatStat(value, format = 'compact', { locale, currency = 'USD' } = {}) {
  if (typeof format === 'function') return format(value);
  const options =
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
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  const [hover, setHover] = useState(null);
  const sparkRef = useRef(null);
  const fmt = v => formatStat(v, format, { locale, currency });

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
    const tick = now => {
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

  const onMove = event => {
    const rect = sparkRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(n - 1, Math.round(x * (n - 1)))));
  };

  const summary = n > 1 ? `Trend: from ${fmt(trend[0])} to ${fmt(trend[n - 1])}, low ${fmt(lo)}, high ${fmt(hi)}.` : '';

  return (
    <div
      className={`relative box-border grid w-full max-w-(--bl-w) gap-1.5 rounded-(--bl-radius) bg-(--bl-bg) px-[18px] pt-4 pb-3.5 font-(family-name:--bl-font) text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line)] ${className}`}
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
      }}
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
          <span className="pointer-events-none absolute -mt-1 -ml-1 size-2 rounded-[50%] shadow-[0_0_0_2px_var(--bl-bg)]" style={{ left: `${pts[at][0]}%`, top: `${(pts[at][1] / 40) * 100}%`, background: at === n - 1 ? accentColor : textColor }} />
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
