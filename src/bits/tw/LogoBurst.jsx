import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// "Works with everything you use": a centre tile (your product) that bursts its integrations out
// into a ring, overshooting a little before they settle. It plays when scrolled into view, on
// mount, or on hover (and keyboard focus), with a replay when it is done. Logos are a labelled
// list; each tile has a visible-on-hover name. Reduced motion shows the ring in place.

const STYLE_ID = 'bl-logo-burst-tw';
const CSS = `
/* theme tokens */
.bl-burst { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-burst, .bl-burst:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-burst, :where(.light, [data-theme="light"]) .bl-burst:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-burst, .bl-burst:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-accent: #167f8f; } }
/* theme tokens end */
@keyframes bl-burst-out { 0% { opacity: 0; transform: translate(-50%, -50%) scale(0.2); } 70% { opacity: 1; transform: translate(-50%, -50%) translate(calc(var(--x) * 1.12), calc(var(--y) * 1.12)); } 100% { opacity: 1; transform: translate(-50%, -50%) translate(var(--x), var(--y)); } }
@keyframes bl-burst-kick { 50% { transform: translate(-50%, -50%) scale(0.86); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function LogoBurst({
  logos = [],
  center = 'B',
  trigger = 'view',
  replay = true,
  label = 'Integrations',
  radius = 120,
  tileSize = 48,
  backgroundColor,
  chipColor,
  lineColor,
  textColor,
  accentColor,
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const rootRef = useRef(null);
  const [out, setOut] = useState(trigger === 'mount');
  const [round, setRound] = useState(0);

  useEffect(() => {
    if (trigger !== 'view' || out) return;
    if (typeof IntersectionObserver === 'undefined') {
      setOut(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setOut(true);
      },
      { threshold: 0.4 }
    );
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [trigger, out]);

  const hover = trigger === 'hover' ? { onPointerEnter: () => setOut(true), onPointerLeave: () => setOut(false), onFocus: () => setOut(true), onBlur: () => setOut(false) } : {};

  return (
    <div
      ref={rootRef}
      className={`bl-burst group/burst relative aspect-square w-(--bl-box) max-w-full font-(family-name:--bl-font) text-[12px] text-(--bl-ink) ${className}`}
      data-out={out ? '' : undefined}
      {...hover}
      style={{ '--bl-box': `${radius * 2 + tileSize + 40}px`, '--bl-r': `${radius}px`, '--bl-tile': `${tileSize}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      <ul key={round} className="absolute inset-0 m-0 list-none p-0 before:absolute before:top-1/2 before:left-1/2 before:box-border before:size-[calc(var(--bl-r)*2)] before:rounded-[50%] before:border-2 before:border-dashed before:border-(--bl-line) before:opacity-0 before:[transform:translate(-50%,-50%)_scale(0.2)] before:[transition:transform_400ms_steps(5),opacity_400ms_steps(5)] before:content-[''] group-data-[out]/burst:before:opacity-100 group-data-[out]/burst:before:[transform:translate(-50%,-50%)] motion-reduce:before:[transition:none] motion-reduce:before:opacity-100! motion-reduce:before:[transform:translate(-50%,-50%)]!" aria-label={label}>
        {logos.map((logo, i) => {
          const angle = -Math.PI / 2 + (i / Math.max(1, logos.length)) * Math.PI * 2;
          return (
            <li key={logo.id ?? i} className="group/logo absolute top-1/2 left-1/2 grid size-(--bl-tile) place-items-center bg-(--bl-chip) opacity-0 shadow-[inset_0_0_0_2px_var(--bl-line),3px_3px_0_rgba(0,0,0,0.35)] [transform:translate(-50%,-50%)_scale(0.2)] group-data-[out]/burst:animate-[bl-burst-out_560ms_steps(7)_calc(var(--i)_*_45ms)_both] [&_img]:size-[60%] [&_img]:object-contain [&_img]:[image-rendering:pixelated] [&_svg]:size-[60%] [&_svg]:object-contain [&_svg]:[image-rendering:pixelated] motion-reduce:animate-none! motion-reduce:opacity-100! motion-reduce:[transform:translate(-50%,-50%)_translate(var(--x),var(--y))]!" tabIndex={trigger === 'hover' ? 0 : undefined} style={{ '--i': i, '--x': `${Math.round(Math.cos(angle) * radius)}px`, '--y': `${Math.round(Math.sin(angle) * radius)}px` }}>
              {typeof logo.icon === 'string' ? <img src={logo.icon} alt="" /> : logo.icon}
              <span className="pointer-events-none absolute top-[calc(100%+4px)] left-1/2 bg-(--bl-bg) px-1.5 py-0.5 font-extrabold whitespace-nowrap opacity-0 shadow-[inset_0_0_0_2px_var(--bl-line)] [transform:translateX(-50%)] group-hover/logo:z-1 group-hover/logo:opacity-100">{logo.label}</span>
            </li>
          );
        })}
      </ul>
      <span className="absolute top-1/2 left-1/2 z-1 grid size-[calc(var(--bl-tile)*1.5)] place-items-center bg-(--bl-accent) font-black text-[#0b0b14] shadow-[inset_-3px_-3px_0_rgba(0,0,0,0.25),4px_4px_0_rgba(0,0,0,0.4)] [transform:translate(-50%,-50%)] group-data-[out]/burst:animate-[bl-burst-kick_300ms_steps(3)] motion-reduce:animate-none!" aria-hidden="true">
        {center}
      </span>
      {replay && trigger !== 'hover' && out && (
        <button type="button" className="absolute right-0 bottom-0 cursor-pointer border-0 bg-(--bl-chip) px-2 py-1 font-extrabold text-(--bl-ink) shadow-[inset_0_0_0_2px_var(--bl-line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" onClick={() => setRound(r => r + 1)}>
          Replay
        </button>
      )}
    </div>
  );
}
