import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Segmented HP / XP / mana bar. Damage drops the bar at once and a ghost bar drains after a beat;
// healing shows the target first and the bar fills up to it. Pulses when critically low.
// Exposed as role="meter" with the current value.

const STYLE_ID = 'bl-health-bar-tw';
const CSS = `
/* theme tokens */
.bl-hp { --bl-track: #1a1c2c; --bl-label: #f4f4f4; }
:where(.light, [data-theme="light"]) .bl-hp, .bl-hp:where(.light, [data-theme="light"]) { --bl-track: #f4f1e8; --bl-label: #1a1c2c; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-hp, :where(.light, [data-theme="light"]) .bl-hp:where(.dark, [data-theme="dark"]) { --bl-track: #1a1c2c; --bl-label: #f4f4f4; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-hp, .bl-hp:where([data-theme="system"]) { --bl-track: #f4f1e8; --bl-label: #1a1c2c; } }
/* theme tokens end */
@keyframes bl-hp-shimmer { to { transform: translateX(100%); } }
@keyframes bl-hp-pulse { 50% { box-shadow: 0 -3px 0 0 var(--bl-low), 0 3px 0 0 var(--bl-low), -3px 0 0 0 var(--bl-low), 3px 0 0 0 var(--bl-low); } }
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
      className={`bl-hp group/hp grid gap-1.5 [font-family:var(--bl-font,'Press_Start_2P',ui-monospace,monospace)] text-(--bl-label) ${className}`}
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
        <div className="flex items-baseline justify-between gap-3 text-[10px] uppercase" aria-hidden="true">
          <span>{label}</span>
          {showValue && (
            <span className="tabular-nums">
              {Math.round(current)}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className="relative m-[3px] h-(--bl-height) overflow-hidden bg-(--bl-track) shadow-[0_-3px_0_0_#0b0b14,0_3px_0_0_#0b0b14,-3px_0_0_0_#0b0b14,3px_0_0_0_#0b0b14] group-data-[critical]/hp:animate-[bl-hp-pulse_0.8s_steps(2)_infinite] motion-reduce:group-data-[critical]/hp:animate-none"
        role="meter"
        aria-label={label || 'Health'}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(current)}
        aria-valuetext={`${Math.round(current)} of ${max}${critical ? ', critical' : ''}`}
      >
        {/* On damage the ghost trails behind; on heal it leads. */}
        <div className="absolute inset-[0_auto_0_0] bg-(--bl-ghost) group-data-[mode=damage]/hp:[transition:width_var(--bl-drain)_cubic-bezier(.4,0,.2,1)_var(--bl-delay)] group-data-[mode=heal]/hp:[transition:width_80ms_steps(2)] motion-reduce:transition-none!" style={{ width: `${ratio * 100}%` }} />
        <div className="absolute inset-[0_auto_0_0] bg-(--bl-fill) shadow-[inset_0_calc(var(--bl-height)/4)_0_0_rgba(255,255,255,0.22),inset_0_calc(var(--bl-height)/-4)_0_0_rgba(0,0,0,0.18)] group-data-[mode=damage]/hp:[transition:width_80ms_steps(2)] group-data-[mode=heal]/hp:[transition:width_var(--bl-drain)_cubic-bezier(.2,.8,.2,1)_var(--bl-delay)] group-data-[flash]/hp:[filter:brightness(2.2)_saturate(0.4)] motion-reduce:transition-none!" style={{ width: `${ratio * 100}%` }} />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,transparent_30%,rgba(255,255,255,0.55)_50%,transparent_70%)] [transform:translateX(-100%)] group-data-[shimmer]/hp:animate-[bl-hp-shimmer_700ms_steps(8)_1] motion-reduce:group-data-[shimmer]/hp:animate-none" key={shimmer} />
        {segments > 1 && <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_right,transparent_0_calc(100%/var(--bl-segments)_-_3px),#0b0b14_calc(100%/var(--bl-segments)_-_3px)_calc(100%/var(--bl-segments)))]" />}
      </div>
    </div>
  );
}
