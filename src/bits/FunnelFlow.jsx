import { useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

// A funnel as a flow. Each stage is a bar sized by its count, joined to the next by a band
// that narrows to match, and particles stream through the bands: the share that converts
// carries on, the rest peel off and fall away. Conversion between stages sits on each band.
// Hover a stage, or focus the chart and use the arrow keys, to read its numbers. Screen
// readers get a summary and a table; particles pause off-screen and stop for reduced motion.

const STYLE_ID = 'bl-funnel-flow';
const CSS = `
/* theme tokens */
.bl-funnel { --bl-bar: #3b5dc9; --bl-bar-active: #73eff7; --bl-band: rgba(59,93,201,0.22); --bl-band-active: rgba(115,239,247,0.22); --bl-particle: #a5c8ff; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-chip: #1a1c2c; --bl-tip: #262b44; --bl-line: #333c57; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-funnel, .bl-funnel:where(.light, [data-theme="light"]) { --bl-bar-active: #167f8f; --bl-band-active: rgba(22,127,143,0.22); --bl-particle: #3b5dc9; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-chip: #f4f1e8; --bl-tip: #ebe5d8; --bl-line: #cfc4ad; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-funnel, :where(.light, [data-theme="light"]) .bl-funnel:where(.dark, [data-theme="dark"]) { --bl-bar: #3b5dc9; --bl-bar-active: #73eff7; --bl-band: rgba(59,93,201,0.22); --bl-band-active: rgba(115,239,247,0.22); --bl-particle: #a5c8ff; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-chip: #1a1c2c; --bl-tip: #262b44; --bl-line: #333c57; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-funnel, .bl-funnel:where([data-theme="system"]) { --bl-bar-active: #167f8f; --bl-band-active: rgba(22,127,143,0.22); --bl-particle: #3b5dc9; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-chip: #f4f1e8; --bl-tip: #ebe5d8; --bl-line: #cfc4ad; --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-funnel { position: relative; width: 100%; font-family: var(--bl-font); color: var(--bl-ink); }
.bl-funnel:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 4px; border-radius: 8px; }
.bl-funnel__svg { display: block; width: 100%; overflow: visible; }
.bl-funnel__bar { fill: var(--bl-bar); transition: fill 150ms; }
.bl-funnel__band { fill: var(--bl-band); transition: fill 150ms; }
.bl-funnel__stage[data-active] .bl-funnel__bar { fill: var(--bl-bar-active); }
.bl-funnel__stage[data-active] + .bl-funnel__band, .bl-funnel__band[data-active] { fill: var(--bl-band-active); }
.bl-funnel__hit { fill: transparent; cursor: default; }
.bl-funnel__label { fill: var(--bl-muted); font-size: 12px; }
.bl-funnel__value { fill: var(--bl-ink); font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; }
.bl-funnel__rate { fill: var(--bl-ink); font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums; }
.bl-funnel__chip { fill: var(--bl-chip); }
.bl-funnel__dot { fill: var(--bl-particle); }
.bl-funnel__tip { position: absolute; z-index: 2; top: 0; left: 0; min-width: 140px; padding: 8px 10px; border-radius: 8px; background: var(--bl-tip); color: var(--bl-ink); font-size: 13px; line-height: 1.45; box-shadow: 0 0 0 1px var(--bl-line), 0 10px 24px -10px rgba(0,0,0,0.8); pointer-events: none; transform: translate(-50%, calc(-100% - 10px)); }
.bl-funnel__tip strong { display: block; font-size: 16px; font-variant-numeric: tabular-nums; }
.bl-funnel__tip span { color: var(--bl-muted); }
.bl-funnel__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function FunnelFlow({
  stages = [],
  height = 280,
  barWidth = 18,
  particles = true,
  rate = 40,
  particleSize = 3,
  locale = 'en-US',
  label = 'Conversion funnel',
  barColor,
  activeColor,
  bandColor,
  bandActiveColor,
  particleColor,
  textColor,
  mutedColor,
  chipColor,
  tooltipColor,
  lineColor,
  accentColor,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const rootRef = useRef(null);
  const dotsRef = useRef(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState(-1);
  const count = new Intl.NumberFormat(locale);
  const pct = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 });

  useLayoutEffect(() => {
    const root = rootRef.current;
    const measure = () => setWidth(Math.max(240, root.clientWidth));
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(root);
    return () => resize.disconnect();
  }, []);

  // Geometry: label space on top, bars centred on a midline, heights scaled to the first stage.
  const top = 46;
  const plot = height - top - 8;
  const mid = top + plot / 2;
  const max = Math.max(1, ...stages.map(s => s.value));
  const n = stages.length;
  const pad = barWidth / 2 + 4;
  const step = n > 1 ? (width - pad * 2) / (n - 1) : 0;
  const geo = stages.map((s, i) => {
    const h = Math.max(2, (s.value / max) * plot);
    return { x: n > 1 ? pad + i * step : width / 2, h, y0: mid - h / 2, y1: mid + h / 2 };
  });
  const conv = i => (stages[i].value ? stages[i + 1].value / stages[i].value : 0);
  const geoRef = useRef(geo);
  geoRef.current = geo;

  useEffect(() => {
    const layer = dotsRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!particles || reduced || n < 2 || !layer) return undefined;
    const ns = 'http://www.w3.org/2000/svg';
    const live = [];
    let visible = true;
    let raf = 0;
    let last = 0;
    let carry = 0;
    const speed = 0.55; // bands per second

    const spawn = () => {
      const node = document.createElementNS(ns, 'circle');
      node.setAttribute('r', String(particleSize));
      node.setAttribute('class', 'bl-funnel__dot');
      layer.appendChild(node);
      live.push({ node, band: 0, t: 0, lane: Math.random() - 0.5, drop: null });
    };
    // Decide at each band whether this particle converts, so the flow matches the rates.
    const decide = p => {
      p.drop = Math.random() > conv(p.band) ? { at: 0.25 + Math.random() * 0.5, vy: 0, dy: 0 } : null;
    };

    const tick = now => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      carry += rate * dt;
      while (carry >= 1) {
        carry -= 1;
        spawn();
        decide(live[live.length - 1]);
      }
      const g = geoRef.current;
      for (let i = live.length - 1; i >= 0; i--) {
        const p = live[i];
        p.t += speed * dt * (p.drop && p.t > p.drop.at ? 0.4 : 1);
        if (p.t >= 1 && !(p.drop && p.t > p.drop.at)) {
          p.band += 1;
          p.t -= 1;
          if (p.band >= n - 1) {
            p.node.remove();
            live.splice(i, 1);
            continue;
          }
          decide(p);
        }
        const a = g[p.band];
        const b = g[p.band + 1];
        const e = p.t * p.t * (3 - 2 * p.t);
        const x = a.x + (b.x - a.x) * Math.min(1, p.t);
        const halfH = (a.h + (b.h - a.h) * e) / 2;
        let y = mid + p.lane * halfH * 1.8 * 0.95;
        let opacity = 0.9;
        if (p.drop && p.t > p.drop.at) {
          p.drop.vy += 520 * dt;
          p.drop.dy += p.drop.vy * dt;
          y += p.drop.dy;
          opacity = Math.max(0, 0.9 - p.drop.dy / 90);
          if (opacity <= 0) {
            p.node.remove();
            live.splice(i, 1);
            continue;
          }
        }
        p.node.setAttribute('cx', x.toFixed(1));
        p.node.setAttribute('cy', y.toFixed(1));
        p.node.setAttribute('opacity', opacity.toFixed(2));
      }
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    observer.observe(layer.ownerSVGElement);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    start();
    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      live.forEach(p => p.node.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [particles, rate, particleSize, n, stages.map(s => s.value).join(), height, width]);

  const onKey = event => {
    if (!n) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      setActive(a => Math.min(n - 1, a + 1));
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      setActive(a => Math.max(0, a < 0 ? 0 : a - 1));
    } else if (event.key === 'Home') setActive(0);
    else if (event.key === 'End') setActive(n - 1);
    else if (event.key === 'Escape') setActive(-1);
  };

  const describe = i => `${stages[i].label}: ${count.format(stages[i].value)}${i ? `, ${pct.format(conv(i - 1))} of ${stages[i - 1].label}, ${pct.format(stages[0].value ? stages[i].value / stages[0].value : 0)} of ${stages[0].label}` : ''}`;
  const summary = n > 1 ? `${label}. ${n} stages from ${count.format(stages[0].value)} ${stages[0].label} to ${count.format(stages[n - 1].value)} ${stages[n - 1].label}, ${pct.format(stages[0].value ? stages[n - 1].value / stages[0].value : 0)} overall.` : label;
  const tip = active >= 0 ? geo[active] : null;

  return (
    <div
      ref={rootRef}
      className={`bl-funnel ${className}`}
      tabIndex={0}
      role="group"
      aria-label={`${summary} Use the arrow keys to read each stage.`}
      onKeyDown={onKey}
      onBlur={() => setActive(-1)}
      style={{ '--bl-bar': barColor, '--bl-bar-active': activeColor, '--bl-band': bandColor, '--bl-band-active': bandActiveColor, '--bl-particle': particleColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-chip': chipColor, '--bl-tip': tooltipColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      <svg className="bl-funnel__svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" onPointerLeave={() => setActive(-1)}>
        {geo.map((g, i) => (
          <g key={`${i}-${stages[i].label}`}>
            <g className="bl-funnel__stage" data-active={active === i || undefined} onPointerEnter={() => setActive(i)}>
              <rect className="bl-funnel__hit" x={g.x - Math.max(barWidth, step / 2) / 2} y={0} width={Math.max(barWidth, step / 2)} height={height} />
              <rect className="bl-funnel__bar" x={g.x - barWidth / 2} y={g.y0} width={barWidth} height={g.h} rx={4} />
            </g>
            {i < n - 1 && (
              <path
                className="bl-funnel__band"
                data-active={active === i + 1 || undefined}
                d={`M${g.x + barWidth / 2} ${g.y0} C${(g.x + geo[i + 1].x) / 2} ${g.y0} ${(g.x + geo[i + 1].x) / 2} ${geo[i + 1].y0} ${geo[i + 1].x - barWidth / 2} ${geo[i + 1].y0} L${geo[i + 1].x - barWidth / 2} ${geo[i + 1].y1} C${(g.x + geo[i + 1].x) / 2} ${geo[i + 1].y1} ${(g.x + geo[i + 1].x) / 2} ${g.y1} ${g.x + barWidth / 2} ${g.y1}Z`}
              />
            )}
          </g>
        ))}
        <g ref={dotsRef} />
        {geo.map((g, i) => {
          const anchor = n > 1 && i === 0 ? 'start' : n > 1 && i === n - 1 ? 'end' : 'middle';
          const tx = anchor === 'start' ? g.x - barWidth / 2 : anchor === 'end' ? g.x + barWidth / 2 : g.x;
          return (
            <g key={`label-${i}`}>
              <text className="bl-funnel__label" x={tx} y={14} textAnchor={anchor}>
                {stages[i].label}
              </text>
              <text className="bl-funnel__value" x={tx} y={34} textAnchor={anchor}>
                {count.format(stages[i].value)}
              </text>
            </g>
          );
        })}
        {geo.slice(0, -1).map((g, i) => {
          const cx = (g.x + geo[i + 1].x) / 2;
          return (
            <g key={`rate-${i}`}>
              <rect className="bl-funnel__chip" x={cx - 26} y={mid - 11} width={52} height={22} rx={11} />
              <text className="bl-funnel__rate" x={cx} y={mid + 4} textAnchor="middle">
                {pct.format(conv(i))}
              </text>
            </g>
          );
        })}
      </svg>
      {tip && (
        <div className="bl-funnel__tip" style={{ left: Math.min(width - 70, Math.max(70, tip.x)), top: Math.max(56, tip.y0) }}>
          <span>{stages[active].label}</span>
          <strong>{count.format(stages[active].value)}</strong>
          {active > 0 && (
            <span>
              {pct.format(conv(active - 1))} of previous · {pct.format(stages[0].value ? stages[active].value / stages[0].value : 0)} of total
            </span>
          )}
        </div>
      )}
      <span className="bl-funnel__sr" aria-live="polite">
        {active >= 0 ? describe(active) : ''}
      </span>
      <table className="bl-funnel__sr">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Stage</th>
            <th scope="col">Count</th>
            <th scope="col">From previous</th>
          </tr>
        </thead>
        <tbody>
          {stages.map((s, i) => (
            <tr key={`${i}-${s.label}`}>
              <th scope="row">{s.label}</th>
              <td>{count.format(s.value)}</td>
              <td>{i ? pct.format(conv(i - 1)) : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
