import { useEffect, useId, useInsertionEffect, useState } from 'react';

// Goal rings. One or several concentric progress rings, each filling from the top with a
// rounded end and a soft same-hue gradient over a lighter track of its own color. The centre
// shows the focused ring's value; hovering or focusing a ring or its legend row highlights it.
// Values are exposed as meters, so the chart never relies on color alone.

const STYLE_ID = 'bl-ring-progress';
const CSS = `
.bl-ring { position: relative; display: inline-flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 22px; max-width: 100%; color: var(--bl-ink); font-family: var(--bl-font); }
.bl-ring__figure { position: relative; flex: 0 0 auto; width: var(--bl-size); max-width: 100%; aspect-ratio: 1; }
.bl-ring__figure svg { display: block; width: 100%; height: 100%; overflow: visible; }
.bl-ring__arc { fill: none; stroke-linecap: round; transition: stroke-dashoffset var(--bl-dur) cubic-bezier(.2,.9,.25,1) var(--bl-delay), opacity 200ms; }
.bl-ring__track { fill: none; transition: opacity 200ms; }
/* A zero-length arc would still draw its round caps as a dot, so hide it. */
.bl-ring .bl-ring__arc[data-empty] { opacity: 0; }
.bl-ring__hit { fill: none; stroke: transparent; cursor: default; pointer-events: stroke; }
.bl-ring[data-focus] .bl-ring__layer:not([data-focused]) .bl-ring__arc, .bl-ring[data-focus] .bl-ring__layer:not([data-focused]) .bl-ring__track { opacity: 0.3; }
.bl-ring__center { position: absolute; inset: 0; display: grid; place-content: center; text-align: center; pointer-events: none; }
.bl-ring__value { font-size: var(--bl-value-size); font-weight: 700; line-height: 1.05; }
.bl-ring__label { margin-top: 4px; color: var(--bl-muted); font-size: 12px; }
.bl-ring__legend { display: grid; gap: 4px; margin: 0; padding: 0; list-style: none; }
.bl-ring__item { display: grid; grid-template-columns: 14px auto auto; align-items: center; gap: 10px; padding: 6px 10px; border-radius: 8px; outline: none; cursor: default; }
.bl-ring__item:hover, .bl-ring__item:focus-visible, .bl-ring__item[data-focused] { background: var(--bl-hover); }
.bl-ring__item:focus-visible { box-shadow: inset 0 0 0 2px var(--bl-focus); }
.bl-ring__key { width: 14px; height: 4px; border-radius: 2px; }
.bl-ring__name { color: var(--bl-muted); font-size: 13px; }
.bl-ring__num { justify-self: end; font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; }
@media (prefers-reduced-motion: reduce) { .bl-ring__arc { transition: opacity 200ms; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

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
  useStyles();
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
      className={`bl-ring ${className}`}
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
      <div className="bl-ring__figure">
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
              <g key={i} className="bl-ring__layer" data-focused={focus === i || undefined} onPointerEnter={() => setFocus(i)} onPointerLeave={() => setFocus(null)}>
                <circle className="bl-ring__track" cx={center} cy={center} r={r} stroke={c} strokeOpacity={trackOpacity} strokeWidth={stroke} />
                <circle
                  className="bl-ring__arc"
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
                <circle className="bl-ring__hit" cx={center} cy={center} r={r} strokeWidth={step} />
              </g>
            );
          })}
        </svg>
        {primary && (
          <div className="bl-ring__center">
            <div className="bl-ring__value">{formatValue(primary)}</div>
            <div className="bl-ring__label">{focus === null && centerLabel !== undefined ? centerLabel : primary.label}</div>
          </div>
        )}
      </div>
      {legend ? (
        <ul className="bl-ring__legend">
          {rings.map((ring, i) => (
            <li
              key={i}
              className="bl-ring__item"
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
              <span className="bl-ring__key" style={{ background: ring.color ?? colors[i % colors.length] }} aria-hidden="true" />
              <span className="bl-ring__name">{ring.label ?? `Ring ${i + 1}`}</span>
              <span className="bl-ring__num">{formatValue(ring)}</span>
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
