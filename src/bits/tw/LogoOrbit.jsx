import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Logos orbiting a central brand mark on concentric rings. Logos are shared out across the
// rings by circumference, alternate rings turn the other way, and every logo stays upright.
// Hovering (or focusing) the orbit pauses it and names the logo under the pointer. Scales
// with its container, pauses off-screen and holds still under reduced motion.

const STYLE_ID = 'bl-logo-orbit-tw';
const CSS = `
/* theme tokens */
.bl-orbit { --bl-bg: #1a1c2c; --bl-item-bg: #262b44; --bl-center-bg: #333c57; --bl-line: rgba(148,176,194,0.25); --bl-accent: #73eff7; --bl-ink: #f4f4f4; }
:where(.light, [data-theme="light"]) .bl-orbit, .bl-orbit:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-item-bg: #ebe5d8; --bl-center-bg: #ddd4c0; --bl-line: rgba(86,108,134,0.25); --bl-accent: #167f8f; --bl-ink: #1a1c2c; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-orbit, :where(.light, [data-theme="light"]) .bl-orbit:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-item-bg: #262b44; --bl-center-bg: #333c57; --bl-line: rgba(148,176,194,0.25); --bl-accent: #73eff7; --bl-ink: #f4f4f4; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-orbit, .bl-orbit:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-item-bg: #ebe5d8; --bl-center-bg: #ddd4c0; --bl-line: rgba(86,108,134,0.25); --bl-accent: #167f8f; --bl-ink: #1a1c2c; } }
/* theme tokens end */
@keyframes bl-orbit-spin { to { rotate: 360deg; } }
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
function distribute(n, radii) {
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
}) {
  useStyles();
  const rootRef = useRef(null);
  const [offscreen, setOffscreen] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting));
    io.observe(rootRef.current);
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
      className={`bl-orbit group/orbit @container relative mx-auto aspect-square w-[min(var(--bl-size),100%)] font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
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
      }}
    >
      {showTracks && radii.map((r, k) => <div key={`t${k}`} className="pointer-events-none absolute top-1/2 left-1/2 size-[calc(var(--bl-r)*2cqi)] [transform:translate(-50%,-50%)] rounded-[50%] border border-dashed border-(--bl-line)" style={{ '--bl-r': r }} aria-hidden="true" />)}
      <div className="absolute top-1/2 left-1/2 grid size-(--bl-center) [transform:translate(-50%,-50%)] place-items-center rounded-[50%] bg-(--bl-center-bg) shadow-[0_0_0_1px_var(--bl-line),0_0_60px_-10px_var(--bl-accent)]">{center}</div>
      <ul className="m-0 list-none p-0">
        {groups.map((group, k) => {
          // Outer rings move slower (same angular speed would look frantic at the edge).
          const ringStyle = { '--bl-dur': `${duration * (1 + k * 0.5)}s`, '--bl-dir': k % 2 ? 'reverse' : 'normal', '--bl-cdir': k % 2 ? 'normal' : 'reverse', '--bl-r': radii[k] };
          if (!group.length) return null;
          return (
            <li key={k} className="pointer-events-none absolute inset-0 animate-[bl-orbit-spin_var(--bl-dur)_linear_infinite] [animation-direction:var(--bl-dir)] group-data-[pausable]/orbit:group-hover/orbit:[animation-play-state:paused] group-data-[pausable]/orbit:group-focus-within/orbit:[animation-play-state:paused] group-data-[paused]/orbit:[animation-play-state:paused] motion-reduce:animate-none" style={ringStyle}>
              <ul className="m-0 list-none p-0">
                {group.map((logo, i) => (
                  <li key={logo.id ?? logo.label ?? i} className="absolute top-1/2 left-1/2 size-0 [transform:rotate(var(--bl-a))_translateX(calc(var(--bl-r)*1cqi))_rotate(calc(var(--bl-a)*-1))]" style={{ '--bl-a': `${(360 / group.length) * i + k * 17}deg` }}>
                    <span className="group/logo pointer-events-auto absolute top-0 left-0 m-[calc(var(--bl-item)/-2)_0_0_calc(var(--bl-item)/-2)] grid size-(--bl-item) animate-[bl-orbit-spin_var(--bl-dur)_linear_infinite] place-items-center rounded-(--bl-item-radius) bg-(--bl-item-bg) shadow-[0_0_0_1px_var(--bl-line),0_8px_20px_-10px_rgba(0,0,0,0.6)] outline-none [animation-direction:var(--bl-cdir)] [transition:box-shadow_160ms,scale_160ms] *:max-h-[62%] *:max-w-[62%] hover:scale-115 hover:shadow-[0_0_0_2px_var(--bl-accent),0_8px_24px_-8px_rgba(0,0,0,0.6)] focus-visible:scale-115 focus-visible:shadow-[0_0_0_2px_var(--bl-accent),0_8px_24px_-8px_rgba(0,0,0,0.6)] group-data-[pausable]/orbit:group-hover/orbit:[animation-play-state:paused] group-data-[pausable]/orbit:group-focus-within/orbit:[animation-play-state:paused] group-data-[paused]/orbit:[animation-play-state:paused] motion-reduce:animate-none" tabIndex={0} aria-label={logo.label} role="img">
                      {logo.icon}
                      {logo.label && (
                        <span className="pointer-events-none absolute bottom-[calc(100%_+_6px)] left-1/2 rounded-[6px] bg-(--bl-ink) px-2 py-[3px] text-[12px] whitespace-nowrap text-(--bl-bg) opacity-0 [transform:translateX(-50%)] transition-opacity duration-120 ease-[ease] group-hover/logo:opacity-100 group-focus-visible/logo:opacity-100" aria-hidden="true">
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
