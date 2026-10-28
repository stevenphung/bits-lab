import { useEffect, useId, useInsertionEffect, useMemo, useRef, useState } from 'react';

// An animated ranking bar chart over time ("bar chart race"). Values glide smoothly between
// time steps, bars slide past each other as ranks change, and the scale rescales to the
// leader. Every bar carries its name and value (identity never rides on color alone), color
// follows the entity, not its rank, and a big period label shows where you are. Play/pause,
// a scrubber, and a hidden table of the current step for screen readers. Pauses off-screen;
// under reduced motion it doesn't autoplay or animate between steps.

const STYLE_ID = 'bl-bar-race';
const CSS = `
.bl-race { position: relative; width: 100%; max-width: var(--bl-w); color: var(--bl-ink); font-family: var(--bl-font); }
.bl-race__title { margin: 0 0 4px; font-size: 15px; font-weight: 700; }
.bl-race__sub { margin: 0 0 12px; color: var(--bl-muted); font-size: 13px; }
.bl-race__plot { position: relative; height: calc(var(--bl-rows) * var(--bl-row)); margin-top: 22px; }
.bl-race__grid { position: absolute; top: -20px; bottom: 0; left: var(--bl-name-w); right: var(--bl-value-w); pointer-events: none; }
.bl-race__tick { position: absolute; top: 0; bottom: 0; width: 1px; background: var(--bl-grid); transition: left 300ms linear; }
.bl-race__tick span { position: absolute; top: 0; left: 4px; color: var(--bl-dim); font-size: 11px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.bl-race__bar { position: absolute; left: 0; right: 0; top: 0; display: flex; align-items: center; height: var(--bl-row); transform: translateY(calc(var(--rank) * var(--bl-row))); transition: transform var(--bl-swap) cubic-bezier(.3,1,.4,1), opacity 300ms; }
.bl-race__bar[data-out] { opacity: 0; }
.bl-race__name { flex: 0 0 var(--bl-name-w); box-sizing: border-box; padding-right: 10px; overflow: hidden; color: var(--bl-ink); font-size: 13px; font-weight: 600; text-align: right; text-overflow: ellipsis; white-space: nowrap; }
.bl-race__track { position: relative; flex: 1; min-width: 0; height: calc(var(--bl-row) - 8px); margin-right: var(--bl-value-w); }
.bl-race__fill { display: block; height: 100%; width: calc(var(--frac) * 100%); min-width: 2px; border-radius: 0 4px 4px 0; background: var(--c); }
.bl-race__value { position: absolute; top: 50%; left: calc(var(--frac) * 100% + 6px); transform: translateY(-50%); color: var(--bl-muted); font-size: 12px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.bl-race__period { position: absolute; right: var(--bl-value-w); bottom: 4px; color: var(--bl-period); font-size: clamp(28px, 7vw, 56px); font-weight: 800; line-height: 1; letter-spacing: -0.02em; pointer-events: none; }
.bl-race__controls { display: flex; align-items: center; gap: 12px; margin-top: 14px; }
.bl-race__play { flex: 0 0 auto; display: grid; place-items: center; width: 36px; height: 36px; padding: 0; border: 0; border-radius: 50%; background: var(--bl-accent); color: var(--bl-on-accent); cursor: pointer; }
.bl-race__play:focus-visible, .bl-race__scrub:focus-visible { outline: 2px solid var(--bl-ink); outline-offset: 2px; }
.bl-race__scrub { flex: 1; min-width: 0; accent-color: var(--bl-accent); }
.bl-race__now { flex: 0 0 auto; min-width: 4ch; color: var(--bl-muted); font-size: 13px; font-variant-numeric: tabular-nums; text-align: right; }
.bl-race__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .bl-race__bar, .bl-race__tick { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Validated categorical slots for the dark surface (fixed order, never cycled). Entities
// past the eighth share a neutral grey; their direct labels keep them identifiable.
export const RACE_COLORS = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];
const OVERFLOW_COLOR = '#566c86';

const niceStep = max => {
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw || 1));
  const n = raw / mag;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag;
};

export default function BarRace({
  series = [],
  steps = [],
  title,
  subtitle,
  top = 8,
  stepDuration = 1200,
  autoPlay = true,
  loop = false,
  format = v => Math.round(v).toLocaleString(),
  rowHeight = 34,
  nameWidth = 110,
  colors = RACE_COLORS,
  width = 720,
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  dimColor = '#566c86',
  gridColor = 'rgba(148,176,194,0.14)',
  periodColor = 'rgba(148,176,194,0.28)',
  accentColor = '#73eff7',
  onAccentColor = '#0b0b14',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  label = 'Bar chart race',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const last = Math.max(0, steps.length - 1);
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  tRef.current = t;
  const [playing, setPlaying] = useState(false);
  const rootRef = useRef(null);
  const visible = useRef(true);
  const reduced = useRef(false);

  // Color follows the entity's position in `series`, so a rank change never repaints it.
  const colorOf = useMemo(() => {
    const map = {};
    series.forEach((s, i) => {
      map[s.name] = s.color ?? colors[i] ?? OVERFLOW_COLOR;
    });
    return map;
  }, [series, colors]);

  useEffect(() => {
    reduced.current = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (autoPlay && !reduced.current) setPlaying(true);
    const io = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
    });
    io.observe(rootRef.current);
    return () => io.disconnect();
  }, [autoPlay]);

  // Advance time continuously while playing (and on screen).
  useEffect(() => {
    if (!playing) return undefined;
    let frame = 0;
    let prev = performance.now();
    const tick = now => {
      const dt = Math.min(100, now - prev);
      prev = now;
      if (visible.current) {
        let next = tRef.current + dt / stepDuration;
        if (next >= last) {
          if (!loop) {
            setT(last);
            setPlaying(false);
            return;
          }
          next = 0;
        }
        tRef.current = next;
        setT(next);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, stepDuration, last, loop]);

  const i0 = Math.floor(t);
  const i1 = Math.min(last, i0 + 1);
  const f = t - i0;
  const rows = series
    .map(s => ({ name: s.name, value: (s.values[i0] ?? 0) * (1 - f) + (s.values[i1] ?? 0) * f }))
    .sort((a, b) => b.value - a.value);
  const ranked = Object.fromEntries(rows.map((row, i) => [row.name, i]));
  const shown = rows.slice(0, top);
  const max = Math.max(1e-9, shown[0]?.value ?? 1) * 1.04;
  const step = niceStep(max);
  const ticks = Array.from({ length: Math.floor(max / step) + 1 }, (_, i) => i * step).filter(v => v <= max);
  const period = steps[Math.round(t)] ?? '';
  const settled = steps[Math.min(last, Math.round(t))];

  const togglePlay = () => {
    if (!playing && t >= last) setT(0);
    setPlaying(p => !p);
  };

  return (
    <figure
      ref={rootRef}
      className={`bl-race ${className}`}
      aria-labelledby={title ? `${uid}-title` : undefined}
      aria-label={title ? undefined : label}
      style={{
        '--bl-w': `${width}px`,
        '--bl-row': `${rowHeight}px`,
        '--bl-rows': Math.min(top, series.length),
        '--bl-name-w': `${nameWidth}px`,
        '--bl-value-w': '64px',
        '--bl-swap': `${Math.min(600, stepDuration * 0.5)}ms`,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-dim': dimColor,
        '--bl-grid': gridColor,
        '--bl-period': periodColor,
        '--bl-accent': accentColor,
        '--bl-on-accent': onAccentColor,
        '--bl-font': fontFamily,
        margin: 0,
        ...style
      }}
    >
      {title && (
        <figcaption>
          <p id={`${uid}-title`} className="bl-race__title">
            {title}
          </p>
          {subtitle && <p className="bl-race__sub">{subtitle}</p>}
        </figcaption>
      )}
      <div className="bl-race__plot" aria-hidden="true">
        <div className="bl-race__grid">
          {ticks.map(v => (
            <div key={v} className="bl-race__tick" style={{ left: `${(v / max) * 100}%` }}>
              <span>{format(v)}</span>
            </div>
          ))}
        </div>
        {series.map(s => {
          const rank = ranked[s.name];
          const row = rows[rank];
          const out = rank >= top;
          return (
            <div key={s.name} className="bl-race__bar" data-out={out || undefined} style={{ '--rank': Math.min(rank, top), '--c': colorOf[s.name], '--frac': out ? 0 : row.value / max }}>
              <span className="bl-race__name">{s.name}</span>
              <span className="bl-race__track">
                <span className="bl-race__fill" />
                <span className="bl-race__value">{format(row.value)}</span>
              </span>
            </div>
          );
        })}
        <span className="bl-race__period">{period}</span>
      </div>
      <div className="bl-race__controls">
        <button type="button" className="bl-race__play" aria-label={playing ? 'Pause' : t >= last ? 'Replay' : 'Play'} onClick={togglePlay}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            {playing ? <path d="M3 2h3v10H3zM8 2h3v10H8z" /> : <path d="M3.5 1.8v10.4L12 7z" />}
          </svg>
        </button>
        <input
          className="bl-race__scrub"
          type="range"
          min={0}
          max={last}
          step={0.01}
          value={t}
          aria-label="Time"
          aria-valuetext={String(settled ?? '')}
          onChange={event => {
            setPlaying(false);
            setT(Number(event.target.value));
          }}
        />
        <span className="bl-race__now" aria-hidden="true">
          {period}
        </span>
      </div>
      {/* The current step as a table, for screen readers (not live, so it doesn't chatter). */}
      <table className="bl-race__sr">
        <caption>
          {title ?? label}, {settled}
        </caption>
        <thead>
          <tr>
            <th scope="col">Rank</th>
            <th scope="col">Name</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {series
            .map(s => ({ name: s.name, value: s.values[Math.min(last, Math.round(t))] ?? 0 }))
            .sort((a, b) => b.value - a.value)
            .slice(0, top)
            .map((row, i) => (
              <tr key={row.name}>
                <td>{i + 1}</td>
                <th scope="row">{row.name}</th>
                <td>{format(row.value)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </figure>
  );
}
