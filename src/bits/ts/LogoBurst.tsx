import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// "Works with everything you use": a centre tile (your product) that bursts its integrations out
// into a ring, overshooting a little before they settle. It plays when scrolled into view, on
// mount, or on hover (and keyboard focus), with a replay when it is done. Logos are a labelled
// list; each tile has a visible-on-hover name. Reduced motion shows the ring in place.

const STYLE_ID = 'bl-logo-burst';
const CSS = `
/* theme tokens */
.bl-burst { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-burst, .bl-burst:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-burst, :where(.light, [data-theme="light"]) .bl-burst:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-burst, .bl-burst:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-burst { position: relative; width: var(--bl-box); max-width: 100%; aspect-ratio: 1; color: var(--bl-ink); font-family: var(--bl-font); font-size: 12px; }
.bl-burst__ring { position: absolute; inset: 0; margin: 0; padding: 0; list-style: none; }
.bl-burst__ring::before { content: ''; position: absolute; top: 50%; left: 50%; width: calc(var(--bl-r) * 2); height: calc(var(--bl-r) * 2); box-sizing: border-box; border: 2px dashed var(--bl-line); border-radius: 50%; opacity: 0; transform: translate(-50%, -50%) scale(0.2); transition: transform 400ms steps(5), opacity 400ms steps(5); }
.bl-burst[data-out] .bl-burst__ring::before { opacity: 1; transform: translate(-50%, -50%); }
.bl-burst__logo { position: absolute; top: 50%; left: 50%; display: grid; place-items: center; width: var(--bl-tile); height: var(--bl-tile); background: var(--bl-chip); opacity: 0; transform: translate(-50%, -50%) scale(0.2); box-shadow: inset 0 0 0 2px var(--bl-line), 3px 3px 0 rgba(0,0,0,0.35); }
.bl-burst[data-out] .bl-burst__logo { animation: bl-burst-out 560ms steps(7) both; animation-delay: calc(var(--i) * 45ms); }
.bl-burst__logo img, .bl-burst__logo svg { width: 60%; height: 60%; object-fit: contain; image-rendering: pixelated; }
.bl-burst__name { position: absolute; top: calc(100% + 4px); left: 50%; padding: 2px 6px; background: var(--bl-bg); font-weight: 800; white-space: nowrap; opacity: 0; transform: translateX(-50%); pointer-events: none; box-shadow: inset 0 0 0 2px var(--bl-line); }
.bl-burst__logo:hover .bl-burst__name { opacity: 1; z-index: 1; }
.bl-burst__core { position: absolute; top: 50%; left: 50%; z-index: 1; display: grid; place-items: center; width: calc(var(--bl-tile) * 1.5); height: calc(var(--bl-tile) * 1.5); background: var(--bl-accent); color: #0b0b14; font-weight: 900; transform: translate(-50%, -50%); box-shadow: inset -3px -3px 0 rgba(0,0,0,0.25), 4px 4px 0 rgba(0,0,0,0.4); }
.bl-burst[data-out] .bl-burst__core { animation: bl-burst-kick 300ms steps(3); }
.bl-burst__replay { position: absolute; right: 0; bottom: 0; padding: 4px 8px; border: 0; background: var(--bl-chip); color: var(--bl-ink); font: inherit; font-weight: 800; cursor: pointer; box-shadow: inset 0 0 0 2px var(--bl-line); }
.bl-burst__replay:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
@keyframes bl-burst-out { 0% { opacity: 0; transform: translate(-50%, -50%) scale(0.2); } 70% { opacity: 1; transform: translate(-50%, -50%) translate(calc(var(--x) * 1.12), calc(var(--y) * 1.12)); } 100% { opacity: 1; transform: translate(-50%, -50%) translate(var(--x), var(--y)); } }
@keyframes bl-burst-kick { 50% { transform: translate(-50%, -50%) scale(0.86); } }
@media (prefers-reduced-motion: reduce) { .bl-burst__logo, .bl-burst[data-out] .bl-burst__logo { animation: none; opacity: 1; transform: translate(-50%, -50%) translate(var(--x), var(--y)); } .bl-burst__ring::before { transition: none; opacity: 1; transform: translate(-50%, -50%); } .bl-burst[data-out] .bl-burst__core { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface BurstLogo {
  id?: string;
  label: string;
  /** A node or an image URL. */
  icon?: ReactNode;
}

export type BurstTrigger = 'view' | 'mount' | 'hover';

export interface LogoBurstProps {
  logos?: BurstLogo[];
  center?: ReactNode;
  trigger?: BurstTrigger;
  /** Show a Replay button once it has played. */
  replay?: boolean;
  label?: string;
  radius?: number;
  tileSize?: number;
  backgroundColor?: string;
  chipColor?: string;
  lineColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
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
}: LogoBurstProps) {
  useStyles();
  const rootRef = useRef<HTMLDivElement>(null);
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
    observer.observe(rootRef.current as Element);
    return () => observer.disconnect();
  }, [trigger, out]);

  const hover = trigger === 'hover' ? { onPointerEnter: () => setOut(true), onPointerLeave: () => setOut(false), onFocus: () => setOut(true), onBlur: () => setOut(false) } : {};

  return (
    <div
      ref={rootRef}
      className={`bl-burst ${className}`}
      data-out={out ? '' : undefined}
      {...hover}
      style={{ '--bl-box': `${radius * 2 + tileSize + 40}px`, '--bl-r': `${radius}px`, '--bl-tile': `${tileSize}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <ul key={round} className="bl-burst__ring" aria-label={label}>
        {logos.map((logo, i) => {
          const angle = -Math.PI / 2 + (i / Math.max(1, logos.length)) * Math.PI * 2;
          return (
            <li key={logo.id ?? i} className="bl-burst__logo" tabIndex={trigger === 'hover' ? 0 : undefined} style={{ '--i': i, '--x': `${Math.round(Math.cos(angle) * radius)}px`, '--y': `${Math.round(Math.sin(angle) * radius)}px` } as CSSVars}>
              {typeof logo.icon === 'string' ? <img src={logo.icon} alt="" /> : logo.icon}
              <span className="bl-burst__name">{logo.label}</span>
            </li>
          );
        })}
      </ul>
      <span className="bl-burst__core" aria-hidden="true">
        {center}
      </span>
      {replay && trigger !== 'hover' && out && (
        <button type="button" className="bl-burst__replay" onClick={() => setRound(r => r + 1)}>
          Replay
        </button>
      )}
    </div>
  );
}
