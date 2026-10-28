import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Segmented HP / XP / mana bar. Damage drops the bar at once and a ghost bar drains after a beat;
// healing shows the target first and the bar fills up to it. Pulses when critically low.
// Exposed as role="meter" with the current value.

const STYLE_ID = 'bl-health-bar';
const CSS = `
/* theme tokens */
.bl-hp { --bl-track: #1a1c2c; --bl-label: #f4f4f4; }
:where(.light, [data-theme="light"]) .bl-hp, .bl-hp:where(.light, [data-theme="light"]) { --bl-track: #f4f1e8; --bl-label: #1a1c2c; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-hp, :where(.light, [data-theme="light"]) .bl-hp:where(.dark, [data-theme="dark"]) { --bl-track: #1a1c2c; --bl-label: #f4f4f4; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-hp, .bl-hp:where([data-theme="system"]) { --bl-track: #f4f1e8; --bl-label: #1a1c2c; } }
/* theme tokens end */
.bl-hp { display: grid; gap: 6px; font-family: var(--bl-font, "Press Start 2P", ui-monospace, monospace); color: var(--bl-label); }
.bl-hp__head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-size: 10px; text-transform: uppercase; }
.bl-hp__value { font-variant-numeric: tabular-nums; }
.bl-hp__track {
  position: relative; height: var(--bl-height); margin: 3px; background: var(--bl-track); overflow: hidden;
  box-shadow: 0 -3px 0 0 #0b0b14, 0 3px 0 0 #0b0b14, -3px 0 0 0 #0b0b14, 3px 0 0 0 #0b0b14;
}
.bl-hp__ghost, .bl-hp__fill { position: absolute; inset: 0 auto 0 0; }
.bl-hp__ghost { background: var(--bl-ghost); }
.bl-hp__fill { background: var(--bl-fill); box-shadow: inset 0 calc(var(--bl-height) / 4) 0 0 rgba(255, 255, 255, 0.22), inset 0 calc(var(--bl-height) / -4) 0 0 rgba(0, 0, 0, 0.18); }
.bl-hp[data-mode="damage"] .bl-hp__fill { transition: width 80ms steps(2); }
.bl-hp[data-mode="damage"] .bl-hp__ghost { transition: width var(--bl-drain) cubic-bezier(.4, 0, .2, 1) var(--bl-delay); }
.bl-hp[data-mode="heal"] .bl-hp__ghost { transition: width 80ms steps(2); }
.bl-hp[data-mode="heal"] .bl-hp__fill { transition: width var(--bl-drain) cubic-bezier(.2, .8, .2, 1) var(--bl-delay); }
.bl-hp[data-flash] .bl-hp__fill { filter: brightness(2.2) saturate(0.4); }
.bl-hp__segments {
  position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(to right, transparent 0 calc(100% / var(--bl-segments) - 3px), #0b0b14 calc(100% / var(--bl-segments) - 3px) calc(100% / var(--bl-segments)));
}
.bl-hp__shimmer { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%); transform: translateX(-100%); }
.bl-hp[data-shimmer] .bl-hp__shimmer { animation: bl-hp-shimmer 700ms steps(8) 1; }
.bl-hp[data-critical] .bl-hp__track { animation: bl-hp-pulse 0.8s steps(2) infinite; }
@keyframes bl-hp-shimmer { to { transform: translateX(100%); } }
@keyframes bl-hp-pulse { 50% { box-shadow: 0 -3px 0 0 var(--bl-low), 0 3px 0 0 var(--bl-low), -3px 0 0 0 var(--bl-low), 3px 0 0 0 var(--bl-low); } }
@media (prefers-reduced-motion: reduce) {
  .bl-hp .bl-hp__fill, .bl-hp .bl-hp__ghost { transition: none !important; }
  .bl-hp[data-critical] .bl-hp__track, .bl-hp[data-shimmer] .bl-hp__shimmer { animation: none; }
}
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const clamp = (value, max) => Math.min(max, Math.max(0, value));

export default function HealthBar({
  value = 72,
  max = 100,
  label = 'HP',
  segments = 10,
  height = 20,
  color = '#38b764',
  lowColor = '#b13e53',
  damageColor = '#f4f4f4',
  healColor = '#a7f070',
  trackColor,
  labelColor,
  lowThreshold = 0.25,
  delay = 350,
  drainDuration = 600,
  showValue = true,
  fontFamily,
  className = '',
  style
}) {
  useStyles();
  const current = clamp(value, max);
  const previous = useRef(current);
  const [mode, setMode] = useState('damage');
  const [flash, setFlash] = useState(false);
  const [shimmer, setShimmer] = useState(0);

  useEffect(() => {
    if (current === previous.current) return undefined;
    const damage = current < previous.current;
    previous.current = current;
    setMode(damage ? 'damage' : 'heal');
    if (damage) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 140);
      return () => clearTimeout(timer);
    }
    setShimmer(count => count + 1);
    return undefined;
  }, [current]);

  const ratio = max > 0 ? current / max : 0;
  const critical = ratio > 0 && ratio <= lowThreshold;
  const fill = critical ? lowColor : color;

  return (
    <div
      className={`bl-hp ${className}`}
      data-mode={mode}
      data-flash={flash || undefined}
      data-critical={critical || undefined}
      data-shimmer={shimmer ? '' : undefined}
      style={{
        '--bl-height': `${height}px`,
        '--bl-fill': fill,
        '--bl-ghost': mode === 'damage' ? damageColor : healColor,
        '--bl-track': trackColor,
        '--bl-label': labelColor,
        '--bl-low': lowColor,
        '--bl-segments': Math.max(1, segments),
        '--bl-delay': `${delay}ms`,
        '--bl-drain': `${drainDuration}ms`,
        ...(fontFamily ? { '--bl-font': fontFamily } : null),
        ...style
      }}
    >
      {(label || showValue) && (
        <div className="bl-hp__head" aria-hidden="true">
          <span>{label}</span>
          {showValue && (
            <span className="bl-hp__value">
              {Math.round(current)}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className="bl-hp__track"
        role="meter"
        aria-label={label || 'Health'}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(current)}
        aria-valuetext={`${Math.round(current)} of ${max}${critical ? ', critical' : ''}`}
      >
        {/* On damage the ghost trails behind; on heal it leads. */}
        <div className="bl-hp__ghost" style={{ width: `${ratio * 100}%` }} />
        <div className="bl-hp__fill" style={{ width: `${ratio * 100}%` }} />
        <div className="bl-hp__shimmer" key={shimmer} />
        {segments > 1 && <div className="bl-hp__segments" />}
      </div>
    </div>
  );
}
