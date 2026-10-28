import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Logos orbiting a central brand mark on concentric rings. Logos are shared out across the
// rings by circumference, alternate rings turn the other way, and every logo stays upright.
// Hovering (or focusing) the orbit pauses it and names the logo under the pointer. Scales
// with its container, pauses off-screen and holds still under reduced motion.

export interface OrbitLogo {
  id?: string;
  /** Names the logo on hover and for screen readers. */
  label: string;
  icon: ReactNode;
}

export interface LogoOrbitProps {
  logos?: OrbitLogo[];
  /** Your brand mark in the middle. */
  center?: ReactNode;
  rings?: number;
  /** Max box size in px; it scales down to its container. */
  size?: number;
  /** Inner ring radius as a percentage of the box width. */
  innerRadius?: number;
  /** Distance between rings, as a percentage of the box width. */
  ringGap?: number;
  itemSize?: number;
  centerSize?: number;
  /** Seconds per turn for the inner ring. */
  duration?: number;
  pauseOnHover?: boolean;
  showTracks?: boolean;
  label?: string;
  backgroundColor?: string;
  itemColor?: string;
  centerColor?: string;
  lineColor?: string;
  accentColor?: string;
  textColor?: string;
  itemRadius?: number;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

const STYLE_ID = 'bl-logo-orbit';
const CSS = `
/* theme tokens */
.bl-orbit { --bl-bg: #1a1c2c; --bl-item-bg: #262b44; --bl-center-bg: #333c57; --bl-line: rgba(148,176,194,0.25); --bl-accent: #73eff7; --bl-ink: #f4f4f4; }
:where(.light, [data-theme="light"]) .bl-orbit, .bl-orbit:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-item-bg: #ebe5d8; --bl-center-bg: #ddd4c0; --bl-line: rgba(86,108,134,0.25); --bl-accent: #167f8f; --bl-ink: #1a1c2c; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-orbit, :where(.light, [data-theme="light"]) .bl-orbit:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-item-bg: #262b44; --bl-center-bg: #333c57; --bl-line: rgba(148,176,194,0.25); --bl-accent: #73eff7; --bl-ink: #f4f4f4; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-orbit, .bl-orbit:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-item-bg: #ebe5d8; --bl-center-bg: #ddd4c0; --bl-line: rgba(86,108,134,0.25); --bl-accent: #167f8f; --bl-ink: #1a1c2c; } }
/* theme tokens end */
.bl-orbit { position: relative; width: min(var(--bl-size), 100%); aspect-ratio: 1; margin: 0 auto; container-type: inline-size; color: var(--bl-ink); font-family: var(--bl-font); }
.bl-orbit__ring { position: absolute; inset: 0; animation: bl-orbit-spin var(--bl-dur) linear infinite; animation-direction: var(--bl-dir); pointer-events: none; }
.bl-orbit__track { position: absolute; left: 50%; top: 50%; width: calc(var(--bl-r) * 2cqi); height: calc(var(--bl-r) * 2cqi); border-radius: 50%; border: 1px dashed var(--bl-line); transform: translate(-50%, -50%); pointer-events: none; }
.bl-orbit__item { position: absolute; left: 50%; top: 50%; width: 0; height: 0; transform: rotate(var(--bl-a)) translateX(calc(var(--bl-r) * 1cqi)) rotate(calc(var(--bl-a) * -1)); }
.bl-orbit__logo { position: absolute; left: 0; top: 0; display: grid; place-items: center; width: var(--bl-item); height: var(--bl-item); margin: calc(var(--bl-item) / -2) 0 0 calc(var(--bl-item) / -2); border-radius: var(--bl-item-radius); background: var(--bl-item-bg); box-shadow: 0 0 0 1px var(--bl-line), 0 8px 20px -10px rgba(0,0,0,0.6); pointer-events: auto; outline: none; animation: bl-orbit-spin var(--bl-dur) linear infinite; animation-direction: var(--bl-cdir); transition: box-shadow 160ms, scale 160ms; }
.bl-orbit__logo > * { max-width: 62%; max-height: 62%; }
.bl-orbit__logo:hover, .bl-orbit__logo:focus-visible { scale: 1.15; box-shadow: 0 0 0 2px var(--bl-accent), 0 8px 24px -8px rgba(0,0,0,0.6); }
.bl-orbit__tip { position: absolute; left: 50%; bottom: calc(100% + 6px); padding: 3px 8px; border-radius: 6px; background: var(--bl-ink); color: var(--bl-bg); font-size: 12px; white-space: nowrap; transform: translateX(-50%); opacity: 0; pointer-events: none; transition: opacity 120ms; }
.bl-orbit__logo:hover .bl-orbit__tip, .bl-orbit__logo:focus-visible .bl-orbit__tip { opacity: 1; }
.bl-orbit__center { position: absolute; left: 50%; top: 50%; display: grid; place-items: center; width: var(--bl-center); height: var(--bl-center); border-radius: 50%; transform: translate(-50%, -50%); background: var(--bl-center-bg); box-shadow: 0 0 0 1px var(--bl-line), 0 0 60px -10px var(--bl-accent); }
.bl-orbit[data-pausable]:hover :is(.bl-orbit__ring, .bl-orbit__logo), .bl-orbit[data-pausable]:focus-within :is(.bl-orbit__ring, .bl-orbit__logo), .bl-orbit[data-paused] :is(.bl-orbit__ring, .bl-orbit__logo) { animation-play-state: paused; }
.bl-orbit__list { margin: 0; padding: 0; list-style: none; }
@keyframes bl-orbit-spin { to { rotate: 360deg; } }
@media (prefers-reduced-motion: reduce) { .bl-orbit__ring, .bl-orbit__logo { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Share n logos across rings in proportion to each ring's circumference.
function distribute(n: number, radii: number[]) {
  const total = radii.reduce((a, b) => a + b, 0);
  const counts = radii.map(r => Math.floor((n * r) / total));
  let left = n - counts.reduce((a, b) => a + b, 0);
  for (let i = radii.length - 1; left > 0; i = (i - 1 + radii.length) % radii.length, left--) counts[i]++;
  return counts;
}

export default function LogoOrbit({
  logos = [],
  center,
  rings = 2,
  size = 480,
  innerRadius = 24,
  ringGap = 16,
  itemSize = 52,
  centerSize = 96,
  duration = 40,
  pauseOnHover = true,
  showTracks = true,
  label = 'Integrations',
  backgroundColor,
  itemColor,
  centerColor,
  lineColor,
  accentColor,
  textColor,
  itemRadius = 14,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: LogoOrbitProps) {
  useStyles();
  const rootRef = useRef<HTMLDivElement>(null);
  const [offscreen, setOffscreen] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting));
    io.observe(rootRef.current!);
    return () => io.disconnect();
  }, []);

  // Radii as a percentage of the box width (half-width is 50).
  const radii = Array.from({ length: Math.max(1, rings) }, (_, k) => innerRadius + k * ringGap);
  const counts = distribute(logos.length, radii);
  let next = 0;
  const groups = counts.map(count => {
    const group = logos.slice(next, next + count);
    next += count;
    return group;
  });

  return (
    <div
      ref={rootRef}
      className={`bl-orbit ${className}`}
      role="group"
      aria-label={label}
      data-pausable={pauseOnHover || undefined}
      data-paused={offscreen || undefined}
      style={{
        '--bl-size': `${size}px`,
        // Tiles shrink with the box on small screens (cqi resolves against the orbit).
        '--bl-item': `min(${itemSize}px, 12cqi)`,
        '--bl-center': `min(${centerSize}px, 22cqi)`,
        '--bl-item-radius': `${itemRadius}px`,
        '--bl-bg': backgroundColor,
        '--bl-item-bg': itemColor,
        '--bl-center-bg': centerColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-ink': textColor,
        '--bl-font': fontFamily,
        ...style
      } as CSSVars}
    >
      {showTracks && radii.map((r, k) => <div key={`t${k}`} className="bl-orbit__track" style={{ '--bl-r': r } as CSSVars} aria-hidden="true" />)}
      <div className="bl-orbit__center">{center}</div>
      <ul className="bl-orbit__list">
        {groups.map((group, k) => {
          // Outer rings move slower (same angular speed would look frantic at the edge).
          const ringStyle: CSSVars = { '--bl-dur': `${duration * (1 + k * 0.5)}s`, '--bl-dir': k % 2 ? 'reverse' : 'normal', '--bl-cdir': k % 2 ? 'normal' : 'reverse', '--bl-r': radii[k] };
          if (!group.length) return null;
          return (
            <li key={k} className="bl-orbit__ring" style={ringStyle}>
              <ul className="bl-orbit__list">
                {group.map((logo, i) => (
                  <li key={logo.id ?? logo.label ?? i} className="bl-orbit__item" style={{ '--bl-a': `${(360 / group.length) * i + k * 17}deg` } as CSSVars}>
                    <span className="bl-orbit__logo" tabIndex={0} aria-label={logo.label} role="img">
                      {logo.icon}
                      {logo.label && (
                        <span className="bl-orbit__tip" aria-hidden="true">
                          {logo.label}
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
