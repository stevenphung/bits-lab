import { useInsertionEffect, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// "Too many tabs" as a pile of overlapping retro windows. The highlight follows the pointer (or
// keyboard focus): the window under it rises to the top with a lit title bar. Each window is a
// button, so onSelect can open the real thing. Windows without a body get placeholder lines.
// Reduced motion keeps the highlight but drops the lift.

const STYLE_ID = 'bl-window-pile';
const CSS = `
/* theme tokens */
.bl-pile { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-pile, .bl-pile:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-pile, :where(.light, [data-theme="light"]) .bl-pile:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-pile, .bl-pile:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-pile { position: relative; width: min(var(--bl-w), 100%); height: var(--bl-h); margin: 0; padding: 0; color: var(--bl-ink); font-family: var(--bl-font); font-size: 13px; list-style: none; }
.bl-pile__item { position: absolute; top: var(--y); left: var(--x); z-index: var(--z); width: var(--bl-win); max-width: calc(100% - var(--x)); }
.bl-pile__item[data-hot] { z-index: 99; }
.bl-pile__win { display: grid; width: 100%; padding: 0; border: 0; background: var(--bl-bg); color: inherit; font: inherit; text-align: left; cursor: pointer; transform: rotate(var(--r)); box-shadow: inset 0 0 0 2px var(--bl-line), 4px 4px 0 rgba(0,0,0,0.35); transition: transform 160ms steps(2); }
.bl-pile__item[data-hot] .bl-pile__win { transform: translate(-2px, -6px) rotate(0deg); box-shadow: inset 0 0 0 2px var(--bl-accent), 6px 8px 0 rgba(0,0,0,0.4); }
.bl-pile__win:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-pile__bar { display: flex; align-items: center; gap: 4px; padding: 6px 8px; background: var(--bl-chip); }
.bl-pile__item[data-hot] .bl-pile__bar { background: var(--bl-accent); color: #0b0b14; }
.bl-pile__btn { width: 8px; height: 8px; flex: none; background: currentColor; opacity: 0.5; }
.bl-pile__title { overflow: hidden; margin-left: 4px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.bl-pile__body { display: grid; gap: 6px; padding: 10px; align-content: start; color: var(--bl-muted); line-height: 1.4; }
.bl-pile__line { display: block; height: 6px; background: var(--bl-line); }
@media (prefers-reduced-motion: reduce) { .bl-pile__win { transition: none; } .bl-pile__item[data-hot] .bl-pile__win { transform: rotate(var(--r)); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const TILT = [-2, 1.5, -1, 2, -1.5, 1];
const LINES = ['82%', '64%', '90%', '48%'];

export interface PileWindow {
  id: string;
  title: string;
  /** Placeholder lines when left out. */
  body?: ReactNode;
}

export interface WindowPileProps {
  /** Back to front. */
  windows?: PileWindow[];
  onSelect?: (window: PileWindow) => void;
  label?: string;
  /** Offset between windows, in px. */
  spread?: number;
  windowWidth?: number;
  windowHeight?: number;
  width?: number;
  backgroundColor?: string;
  chipColor?: string;
  lineColor?: string;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function WindowPile({
  windows = [],
  onSelect,
  label = 'Open windows',
  spread = 34,
  windowWidth = 220,
  windowHeight = 104,
  width = 420,
  backgroundColor,
  chipColor,
  lineColor,
  textColor,
  mutedColor,
  accentColor,
  fontFamily = 'inherit',
  className = '',
  style
}: WindowPileProps) {
  useStyles();
  const [hot, setHot] = useState<string | null>(null);
  const rise = spread * 0.5 + 18;
  const height = windowHeight + Math.max(0, windows.length - 1) * rise + 12;

  return (
    <ul
      className={`bl-pile ${className}`}
      aria-label={label}
      onPointerLeave={() => setHot(null)}
      style={{ '--bl-w': `${width}px`, '--bl-h': `${height}px`, '--bl-win': `${windowWidth}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      {windows.map((win, i) => (
        <li
          key={win.id}
          className="bl-pile__item"
          data-hot={hot === win.id ? '' : undefined}
          style={{ '--x': `${i * spread}px`, '--y': `${i * rise + 6}px`, '--z': i + 1, '--r': `${TILT[i % TILT.length]}deg` } as CSSVars}
          onPointerEnter={() => setHot(win.id)}
        >
          <button type="button" className="bl-pile__win" onFocus={() => setHot(win.id)} onBlur={() => setHot(h => (h === win.id ? null : h))} onClick={() => onSelect?.(win)}>
            <span className="bl-pile__bar">
              <span className="bl-pile__btn" aria-hidden="true" />
              <span className="bl-pile__btn" aria-hidden="true" />
              <span className="bl-pile__btn" aria-hidden="true" />
              <span className="bl-pile__title">{win.title}</span>
            </span>
            <span className="bl-pile__body" style={{ minHeight: windowHeight - 30 }}>
              {win.body ??
                LINES.slice(0, 3).map((_, k) => (
                  <span key={k} className="bl-pile__line" aria-hidden="true" style={{ width: LINES[(i + k) % LINES.length] }} />
                ))}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
