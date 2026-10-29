import { useInsertionEffect, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

const STYLE_ID = 'bl-window-pile-tw';
const CSS = `
/* theme tokens */
.bl-pile { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-pile, .bl-pile:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-pile, :where(.light, [data-theme="light"]) .bl-pile:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-pile, .bl-pile:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; } }
/* theme tokens end */
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
      className={`bl-pile relative m-0 h-(--bl-h) w-[min(var(--bl-w),100%)] list-none p-0 font-(family-name:--bl-font) text-[13px] text-(--bl-ink) ${className}`}
      aria-label={label}
      onPointerLeave={() => setHot(null)}
      style={{ '--bl-w': `${width}px`, '--bl-h': `${height}px`, '--bl-win': `${windowWidth}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      {windows.map((win, i) => (
        <li
          key={win.id}
          className="group/win absolute top-(--y) left-(--x) z-(--z) w-(--bl-win) max-w-[calc(100%-var(--x))] data-[hot]:z-99"
          data-hot={hot === win.id ? '' : undefined}
          style={{ '--x': `${i * spread}px`, '--y': `${i * rise + 6}px`, '--z': i + 1, '--r': `${TILT[i % TILT.length]}deg` } as CSSVars}
          onPointerEnter={() => setHot(win.id)}
        >
          <button type="button" className="grid w-full cursor-pointer border-0 bg-(--bl-bg) p-0 text-left text-inherit shadow-[inset_0_0_0_2px_var(--bl-line),4px_4px_0_rgba(0,0,0,0.35)] [transform:rotate(var(--r))] [transition:transform_160ms_steps(2)] group-data-[hot]/win:shadow-[inset_0_0_0_2px_var(--bl-accent),6px_8px_0_rgba(0,0,0,0.4)] group-data-[hot]/win:[transform:translate(-2px,-6px)_rotate(0deg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid motion-reduce:[transition:none] motion-reduce:group-data-[hot]/win:[transform:rotate(var(--r))]" onFocus={() => setHot(win.id)} onBlur={() => setHot(h => (h === win.id ? null : h))} onClick={() => onSelect?.(win)}>
            <span className="flex items-center gap-1 bg-(--bl-chip) px-2 py-1.5 group-data-[hot]/win:bg-(--bl-accent) group-data-[hot]/win:text-[#0b0b14]">
              <span className="size-2 flex-none bg-current opacity-50" aria-hidden="true" />
              <span className="size-2 flex-none bg-current opacity-50" aria-hidden="true" />
              <span className="size-2 flex-none bg-current opacity-50" aria-hidden="true" />
              <span className="ml-1 overflow-hidden font-extrabold text-ellipsis whitespace-nowrap">{win.title}</span>
            </span>
            <span className="grid [align-content:start] gap-1.5 p-2.5 leading-[1.4] text-(--bl-muted)" style={{ minHeight: windowHeight - 30 }}>
              {win.body ??
                LINES.slice(0, 3).map((_, k) => (
                  <span key={k} className="block h-1.5 bg-(--bl-line)" aria-hidden="true" style={{ width: LINES[(i + k) % LINES.length] }} />
                ))}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
