import { useEffect, useId, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Goal rings. One or several concentric progress rings, each filling from the top with a
// rounded end and a soft same-hue gradient over a lighter track of its own color. The centre
// shows the focused ring's value; hovering or focusing a ring or its legend row highlights it.
// Values are exposed as meters, so the chart never relies on color alone.

// Validated categorical steps for a dark surface (all-pairs safe for up to three rings).
const DEFAULT_COLORS = ['#3987e5', '#d95926', '#199e70'];

const percent = ring => Math.max(0, Math.min(1, ring.value / (ring.max || 100)));
const defaultFormat = ring => `${Math.round(percent(ring) * 100)}%`;

export default function RingProgress({
  rings = [{ value: 72, label: 'Progress' }],
  size = 180,
  thickness = 14,
  gap = 6,
  duration = 1100,
  stagger = 120,
  startAngle = 0,
  gradient = true,
  showLegend,
  centerLabel,
  formatValue = defaultFormat,
  colors = DEFAULT_COLORS,
  trackOpacity = 0.18,
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  hoverColor = 'rgba(255,255,255,0.06)',
  focusColor = '#73eff7',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [drawn, setDrawn] = useState(false);
  const [focus, setFocus] = useState(null);
  const legend = showLegend ?? rings.length > 1;

  // Start empty, then fill on the next tick so the first render animates in.
  useEffect(() => {
    const timer = setTimeout(() => setDrawn(true), 30);
    return () => clearTimeout(timer);
  }, []);

  const view = 100;
  const center = view / 2;
  const unit = view / size;
  const stroke = thickness * unit;
  const step = (thickness + gap) * unit;
  const shown = focus ?? 0;
  const primary = rings[shown];
  // Fit the centre text inside the innermost ring: about 0.62em per character, with margin.
  const inner = size - 2 * rings.length * (thickness + gap) + 2 * gap;
  const centerText = primary ? String(formatValue(primary)) : '';
  const valueSize = Math.max(12, Math.min(Math.round(size * 0.17), Math.floor((inner * 0.78) / Math.max(2, centerText.length * 0.62))));

  return (
    <div
      className={`group/ring relative inline-flex max-w-full flex-wrap items-center justify-center gap-[22px] font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      data-focus={focus !== null || undefined}
      style={{
        '--bl-size': `${size}px`,
        '--bl-dur': `${duration}ms`,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-hover': hoverColor,
        '--bl-focus': focusColor,
        '--bl-font': fontFamily,
        '--bl-value-size': `${valueSize}px`,
        ...style
      }}
    >
      <div className="relative aspect-square w-(--bl-size) max-w-full flex-none [&_svg]:block [&_svg]:h-full [&_svg]:w-full [&_svg]:overflow-visible">
        <svg viewBox={`0 0 ${view} ${view}`} aria-hidden="true">
          <defs>
            {rings.map((ring, i) => {
              const c = ring.color ?? colors[i % colors.length];
              return (
                <linearGradient key={i} id={`${uid}-g${i}`} x1="0" y1="0" x2="1" y2="1">
                  {/* CSS (not the attribute) so color-mix() is understood. */}
                  <stop offset="0" style={{ stopColor: `color-mix(in srgb, ${c} 70%, white)` }} />
                  <stop offset="1" style={{ stopColor: c }} />
                </linearGradient>
              );
            })}
          </defs>
          {rings.map((ring, i) => {
            const c = ring.color ?? colors[i % colors.length];
            const r = center - stroke / 2 - i * step;
            if (r <= stroke / 2) return null;
            const circumference = 2 * Math.PI * r;
            const fraction = drawn ? percent(ring) : 0;
            const transform = `rotate(${startAngle - 90} ${center} ${center})`;
            return (
              <g key={i} className="group/layer" data-focused={focus === i || undefined} onPointerEnter={() => setFocus(i)} onPointerLeave={() => setFocus(null)}>
                <circle className="fill-none transition-opacity duration-200 ease-[ease] group-data-[focus]/ring:group-[:not([data-focused])]/layer:opacity-30" cx={center} cy={center} r={r} stroke={c} strokeOpacity={trackOpacity} strokeWidth={stroke} />
                <circle
                  className="fill-none [stroke-linecap:round] [transition:stroke-dashoffset_var(--bl-dur)_cubic-bezier(.2,.9,.25,1)_var(--bl-delay),opacity_200ms] data-[empty]:opacity-0 group-data-[focus]/ring:group-[:not([data-focused])]/layer:opacity-30 motion-reduce:[transition:opacity_200ms]"
                  cx={center}
                  cy={center}
                  r={r}
                  stroke={gradient ? `url(#${uid}-g${i})` : c}
                  strokeWidth={stroke}
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - fraction)}
                  transform={transform}
                  data-empty={fraction === 0 || undefined}
                  style={{ '--bl-delay': `${i * stagger}ms` }}
                />
                <circle className="cursor-default fill-none stroke-transparent [pointer-events:stroke]" cx={center} cy={center} r={r} strokeWidth={step} />
              </g>
            );
          })}
        </svg>
        {primary && (
          <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
            <div className="text-(length:--bl-value-size) leading-[1.05] font-bold">{formatValue(primary)}</div>
            <div className="mt-1 text-[12px] text-(--bl-muted)">{focus === null && centerLabel !== undefined ? centerLabel : primary.label}</div>
          </div>
        )}
      </div>
      {legend ? (
        <ul className="m-0 grid list-none gap-1 p-0">
          {rings.map((ring, i) => (
            <li
              key={i}
              className="grid cursor-default grid-cols-[14px_auto_auto] items-center gap-2.5 rounded-[8px] px-2.5 py-1.5 outline-none hover:bg-(--bl-hover) focus-visible:bg-(--bl-hover) focus-visible:shadow-[inset_0_0_0_2px_var(--bl-focus)] data-[focused]:bg-(--bl-hover)"
              tabIndex={0}
              role="meter"
              aria-label={ring.label ?? `Ring ${i + 1}`}
              aria-valuemin={0}
              aria-valuemax={ring.max || 100}
              aria-valuenow={ring.value}
              aria-valuetext={formatValue(ring)}
              data-focused={focus === i || undefined}
              onPointerEnter={() => setFocus(i)}
              onPointerLeave={() => setFocus(null)}
              onFocus={() => setFocus(i)}
              onBlur={() => setFocus(null)}
            >
              <span className="h-1 w-3.5 rounded-[2px]" style={{ background: ring.color ?? colors[i % colors.length] }} aria-hidden="true" />
              <span className="text-[13px] text-(--bl-muted)">{ring.label ?? `Ring ${i + 1}`}</span>
              <span className="[justify-self:end] text-[14px] font-bold tabular-nums">{formatValue(ring)}</span>
            </li>
          ))}
        </ul>
      ) : (
        primary && (
          <span
            role="meter"
            aria-label={primary.label ?? 'Progress'}
            aria-valuemin={0}
            aria-valuemax={primary.max || 100}
            aria-valuenow={primary.value}
            aria-valuetext={formatValue(primary)}
            style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
          />
        )
      )}
    </div>
  );
}
