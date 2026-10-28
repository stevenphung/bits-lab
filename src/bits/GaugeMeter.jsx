import { useId, useInsertionEffect, useLayoutEffect, useRef } from 'react';

// An analog gauge. The needle swings to each new value on a real spring (it overshoots and
// settles), the value arc fills in the color of the zone it's in, and labelled ticks run
// round the dial. The center shows the value, unit and the zone's name with an icon, so the
// state never rests on color alone. Exposed as a meter. Holds still under reduced motion.

const STYLE_ID = 'bl-gauge-meter';
const CSS = `
/* theme tokens */
.bl-gauge { --bl-tick: #566c86; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; }
:where(.light, [data-theme="light"]) .bl-gauge, .bl-gauge:where(.light, [data-theme="light"]) { --bl-tick: #8a96a3; --bl-ink: #1a1c2c; --bl-muted: #566c86; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-gauge, :where(.light, [data-theme="light"]) .bl-gauge:where(.dark, [data-theme="dark"]) { --bl-tick: #566c86; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-gauge, .bl-gauge:where([data-theme="system"]) { --bl-tick: #8a96a3; --bl-ink: #1a1c2c; --bl-muted: #566c86; } }
/* theme tokens end */
.bl-gauge { position: relative; display: grid; justify-items: center; width: min(var(--bl-size), 100%); color: var(--bl-ink); font-family: var(--bl-font); }
.bl-gauge__dial { position: relative; width: 100%; }
.bl-gauge svg { display: block; width: 100%; height: auto; overflow: visible; }
.bl-gauge__track { fill: none; stroke: var(--bl-track); stroke-linecap: round; }
.bl-gauge__fill { fill: none; stroke-linecap: round; transition: stroke 300ms; }
.bl-gauge__zone { fill: none; stroke-width: 3; opacity: 0.55; }
.bl-gauge__tick { stroke: var(--bl-tick); stroke-linecap: round; }
.bl-gauge__num { fill: var(--bl-muted); font-size: 9px; font-variant-numeric: tabular-nums; text-anchor: middle; dominant-baseline: middle; }

.bl-gauge__readout { position: absolute; left: 0; right: 0; top: var(--bl-readout); display: grid; justify-items: center; gap: 3px; text-align: center; pointer-events: none; }
.bl-gauge__value { font-size: calc(var(--bl-size) * 0.11); font-weight: 650; line-height: 1; }
.bl-gauge__unit { margin-left: 2px; color: var(--bl-muted); font-size: 0.5em; font-weight: 600; }
.bl-gauge__state { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; background: color-mix(in srgb, var(--bl-zone) 18%, transparent); color: var(--bl-zone); font-size: 12px; font-weight: 700; }
.bl-gauge__label { margin-top: 8px; color: var(--bl-muted); font-size: 13px; font-weight: 600; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Status colors (fixed) with icons, so a zone is never just a color.
export const DEFAULT_ZONES = [
  { to: 60, color: '#0ca30c', label: 'Normal', icon: 'check' },
  { to: 85, color: '#fab219', label: 'High', icon: 'warn' },
  { to: 100, color: '#d03b3b', label: 'Critical', icon: 'alert' }
];

const ICONS = {
  check: 'M2.5 6.5 5 9l4.5-5.5',
  warn: 'M6 2.5v4M6 9h.01',
  alert: 'M6 2 10.5 10h-9zM6 5.5v2M6 9h.01'
};

const CX = 100;
const CY = 100;

export default function GaugeMeter({
  value = 0,
  min = 0,
  max = 100,
  zones = DEFAULT_ZONES,
  label,
  unit = '',
  format = v => Math.round(v).toLocaleString(),
  sweep = 240,
  majorTicks = 5,
  minorTicks = 4,
  stiffness = 140,
  damping = 11,
  size = 260,
  thickness = 12,
  trackColor = '#262b44',
  tickColor,
  textColor,
  mutedColor,
  needleColor = '#f4f4f4',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const needleRef = useRef(null);
  const fillRef = useRef(null);
  const physics = useRef({ x: null, v: 0 });
  const R = 78;
  const clamp = v => Math.max(min, Math.min(max, v));
  const frac = v => (clamp(v) - min) / (max - min || 1);
  const angleOf = p => -sweep / 2 + p * sweep;
  const point = (deg, r) => [CX + r * Math.sin((deg * Math.PI) / 180), CY - r * Math.cos((deg * Math.PI) / 180)];
  const arc = (p0, p1, r) => {
    const [x0, y0] = point(angleOf(p0), r);
    const [x1, y1] = point(angleOf(p1), r);
    const large = (p1 - p0) * sweep > 180 ? 1 : 0;
    return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  };
  const arcLength = (Math.PI * R * sweep) / 180;
  const zoneOf = v => zones.find(z => clamp(v) <= z.to) ?? zones[zones.length - 1];
  const zone = zoneOf(value);

  // Spring the needle (and the fill) toward the value; real elapsed time, small substeps.
  // The spring owns these two attributes (React never writes them), and the first placement
  // happens before paint, so there's no frame at the wrong angle.
  useLayoutEffect(() => {
    const target = frac(value);
    const state = physics.current;
    const apply = p => {
      needleRef.current?.setAttribute('transform', `rotate(${angleOf(p).toFixed(2)} ${CX} ${CY})`);
      fillRef.current?.setAttribute('stroke-dashoffset', String(arcLength * (1 - Math.max(0, Math.min(1, p)))));
    };
    if (state.x === null || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      state.x = target;
      state.v = 0;
      apply(target);
      return undefined;
    }
    let frame = 0;
    let last = performance.now();
    const tick = now => {
      let dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      while (dt > 0) {
        const h = Math.min(dt, 1 / 240);
        state.v += (-stiffness * (state.x - target) - damping * state.v) * h;
        state.x += state.v * h;
        dt -= h;
      }
      apply(state.x);
      if (Math.abs(state.x - target) > 0.0005 || Math.abs(state.v) > 0.0005) frame = requestAnimationFrame(tick);
      else {
        state.x = target;
        apply(target);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, min, max, sweep, stiffness, damping]);

  const ticks = [];
  const total = majorTicks * (minorTicks + 1);
  for (let i = 0; i <= total; i++) {
    const p = i / total;
    const major = i % (minorTicks + 1) === 0;
    const a = angleOf(p);
    const [x0, y0] = point(a, R - thickness / 2 - 4);
    const [x1, y1] = point(a, R - thickness / 2 - (major ? 11 : 7));
    ticks.push(<line key={`t${i}`} className="bl-gauge__tick" x1={x0} y1={y0} x2={x1} y2={y1} strokeWidth={major ? 1.6 : 1} />);
    if (major) {
      const [tx, ty] = point(a, R - thickness / 2 - 20);
      ticks.push(
        <text key={`n${i}`} className="bl-gauge__num" x={tx} y={ty}>
          {format(min + p * (max - min))}
        </text>
      );
    }
  }

  let from = 0;
  const bands = zones.map((z, i) => {
    const p0 = from;
    const p1 = frac(z.to);
    from = p1;
    return p1 > p0 ? <path key={i} className="bl-gauge__zone" d={arc(p0, p1, R + thickness / 2 + 4)} stroke={z.color} /> : null;
  });

  // Leave room under the pivot for the readout, inside the arc's open bottom.
  const lowest = Math.max(...[angleOf(0), angleOf(1)].map(a => point(a, R + thickness)[1]), CY + 58);
  const viewHeight = Math.ceil(lowest + 6);
  const text = `${format(clamp(value))}${unit ? ` ${unit}` : ''}`;

  return (
    <div
      className={`bl-gauge ${className}`}
      role="meter"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={clamp(value)}
      aria-valuetext={`${text}, ${zone?.label ?? ''}`}
      aria-labelledby={label ? `${uid}-label` : undefined}
      style={{
        '--bl-size': `${size}px`,
        '--bl-readout': `${((CY + 14) / viewHeight) * 100}%`,
        '--bl-track': trackColor,
        '--bl-tick': tickColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-zone': zone?.color,
        '--bl-font': fontFamily,
        ...style
      }}
    >
      <div className="bl-gauge__dial">
        <svg viewBox={`0 0 200 ${viewHeight}`} aria-hidden="true">
          {bands}
          <path className="bl-gauge__track" d={arc(0, 1, R)} strokeWidth={thickness} />
          <path ref={fillRef} className="bl-gauge__fill" d={arc(0, 1, R)} strokeWidth={thickness} stroke={zone?.color} strokeDasharray={arcLength} />
          {ticks}
          <g ref={needleRef}>
            <path d={`M${CX - 3} ${CY} L${CX} ${CY - R + thickness / 2 + 2} L${CX + 3} ${CY} Z`} fill={needleColor} />
          </g>
          <circle cx={CX} cy={CY} r={7} fill={needleColor} />
          <circle cx={CX} cy={CY} r={3} fill={trackColor} />
        </svg>
        <div className="bl-gauge__readout">
          <span className="bl-gauge__value" aria-hidden="true">
            {format(clamp(value))}
            {unit && <span className="bl-gauge__unit">{unit}</span>}
          </span>
          {zone && (
            <span className="bl-gauge__state" aria-hidden="true">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={ICONS[zone.icon] ?? ICONS.check} />
              </svg>
              {zone.label}
            </span>
          )}
        </div>
      </div>
      {label && (
        <div id={`${uid}-label`} className="bl-gauge__label">
          {label}
        </div>
      )}
    </div>
  );
}
