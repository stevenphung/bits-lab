import { useEffect, useId, useMemo, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// An animated ranking bar chart over time ("bar chart race"). Values glide smoothly between
// time steps, bars slide past each other as ranks change, and the scale rescales to the
// leader. Every bar carries its name and value (identity never rides on color alone), color
// follows the entity, not its rank, and a big period label shows where you are. Play/pause,
// a scrubber, and a hidden table of the current step for screen readers. Pauses off-screen;
// under reduced motion it doesn't autoplay or animate between steps.

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
      className={`relative w-full max-w-(--bl-w) font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
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
          <p id={`${uid}-title`} className="m-0 mb-1 text-[15px] font-bold">
            {title}
          </p>
          {subtitle && <p className="m-0 mb-3 text-[13px] text-(--bl-muted)">{subtitle}</p>}
        </figcaption>
      )}
      <div className="relative mt-[22px] h-[calc(var(--bl-rows)*var(--bl-row))]" aria-hidden="true">
        <div className="pointer-events-none absolute -top-5 right-(--bl-value-w) bottom-0 left-(--bl-name-w)">
          {ticks.map(v => (
            <div key={v} className="absolute top-0 bottom-0 w-px bg-(--bl-grid) [transition:left_300ms_linear] motion-reduce:[transition:none] [&_span]:absolute [&_span]:top-0 [&_span]:left-1 [&_span]:text-[11px] [&_span]:whitespace-nowrap [&_span]:text-(--bl-dim) [&_span]:tabular-nums" style={{ left: `${(v / max) * 100}%` }}>
              <span>{format(v)}</span>
            </div>
          ))}
        </div>
        {series.map(s => {
          const rank = ranked[s.name];
          const row = rows[rank];
          const out = rank >= top;
          return (
            <div key={s.name} className="absolute inset-x-0 top-0 flex h-(--bl-row) items-center [transform:translateY(calc(var(--rank)*var(--bl-row)))] [transition:transform_var(--bl-swap)_cubic-bezier(.3,1,.4,1),opacity_300ms] data-[out]:opacity-0 motion-reduce:[transition:none]" data-out={out || undefined} style={{ '--rank': Math.min(rank, top), '--c': colorOf[s.name], '--frac': out ? 0 : row.value / max }}>
              <span className="box-border flex-[0_0_var(--bl-name-w)] overflow-hidden pr-2.5 text-right text-[13px] font-semibold text-ellipsis whitespace-nowrap text-(--bl-ink)">{s.name}</span>
              <span className="relative mr-(--bl-value-w) h-[calc(var(--bl-row)_-_8px)] min-w-0 flex-1">
                <span className="block h-full w-[calc(var(--frac)*100%)] min-w-[2px] rounded-r-[4px] bg-(--c)" />
                <span className="absolute top-1/2 left-[calc(var(--frac)*100%_+_6px)] [transform:translateY(-50%)] text-[12px] whitespace-nowrap text-(--bl-muted) tabular-nums">{format(row.value)}</span>
              </span>
            </div>
          );
        })}
        <span className="pointer-events-none absolute right-(--bl-value-w) bottom-1 [font-size:clamp(28px,7vw,56px)] leading-none font-extrabold tracking-[-0.02em] text-(--bl-period)">{period}</span>
      </div>
      <div className="mt-3.5 flex items-center gap-3">
        <button type="button" className="grid size-9 flex-none cursor-pointer place-items-center rounded-[50%] border-0 bg-(--bl-accent) p-0 text-(--bl-on-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-ink)" aria-label={playing ? 'Pause' : t >= last ? 'Replay' : 'Play'} onClick={togglePlay}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            {playing ? <path d="M3 2h3v10H3zM8 2h3v10H8z" /> : <path d="M3.5 1.8v10.4L12 7z" />}
          </svg>
        </button>
        <input
          className="min-w-0 flex-1 accent-(--bl-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-ink)"
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
        <span className="min-w-[4ch] flex-none text-right text-[13px] text-(--bl-muted) tabular-nums" aria-hidden="true">
          {period}
        </span>
      </div>
      {/* The current step as a table, for screen readers (not live, so it doesn't chatter). */}
      <table className="sr-only">
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
