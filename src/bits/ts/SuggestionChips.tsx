import { useInsertionEffect, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Prompt suggestions for an empty chat. A few chips from your pool stagger in; "More ideas"
// sends them out and deals a fresh, shuffled set (never repeating the ones on screen).
// Each chip is a button that hands its text to onPick. Icons optional.

const STYLE_ID = 'bl-suggestion-chips';
const CSS = `
/* theme tokens */
.bl-chips { --bl-chip: #262b44; --bl-hover: #2e3552; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-chips, .bl-chips:where(.light, [data-theme="light"]) { --bl-chip: #ebe5d8; --bl-hover: #e0d8c6; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-chips, :where(.light, [data-theme="light"]) .bl-chips:where(.dark, [data-theme="dark"]) { --bl-chip: #262b44; --bl-hover: #2e3552; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-chips, .bl-chips:where([data-theme="system"]) { --bl-chip: #ebe5d8; --bl-hover: #e0d8c6; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-chips { display: grid; justify-items: var(--bl-align); gap: 12px; width: 100%; font-family: var(--bl-font); }
.bl-chips__list { display: flex; flex-wrap: wrap; justify-content: var(--bl-justify); gap: 8px; margin: 0; padding: 0; list-style: none; }
.bl-chips__chip { display: inline-flex; align-items: center; gap: 8px; max-width: 100%; padding: 9px 14px; border: 0; border-radius: var(--bl-radius); background: var(--bl-chip); color: var(--bl-ink); font: inherit; font-size: 14px; line-height: 1.35; text-align: left; cursor: pointer; box-shadow: 0 0 0 1px var(--bl-line); animation: bl-chips-in 420ms cubic-bezier(.3,1.4,.5,1) both; animation-delay: calc(var(--i) * var(--bl-stagger)); transition: background-color 150ms, box-shadow 150ms, transform 150ms; }
.bl-chips__chip:hover { background: var(--bl-hover); box-shadow: 0 0 0 1px var(--bl-accent); transform: translateY(-1px); }
.bl-chips__chip:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-chips__list[data-leaving] .bl-chips__chip { animation: bl-chips-out 180ms ease-in both; animation-delay: calc(var(--i) * 30ms); pointer-events: none; }
.bl-chips__icon { flex: 0 0 auto; display: grid; place-items: center; }
.bl-chips__more { display: inline-flex; align-items: center; gap: 6px; padding: 6px 10px; border: 0; border-radius: 999px; background: transparent; color: var(--bl-muted); font: inherit; font-size: 13px; cursor: pointer; }
.bl-chips__more:hover { color: var(--bl-ink); }
.bl-chips__more:focus-visible { outline: 2px solid var(--bl-accent); }
.bl-chips__more svg { transition: transform 400ms cubic-bezier(.3,1.4,.5,1); }
.bl-chips__more:active svg { transform: rotate(-180deg); }
.bl-chips__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-chips-in { from { opacity: 0; transform: translateY(10px) scale(0.92); } }
@keyframes bl-chips-out { to { opacity: 0; transform: translateY(-6px) scale(0.95); } }
@media (prefers-reduced-motion: reduce) { .bl-chips__chip, .bl-chips__list[data-leaving] .bl-chips__chip { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface Suggestion {
  /** Text handed to onPick. */
  text: string;
  /** What the chip shows (defaults to text). */
  label?: ReactNode;
  icon?: ReactNode;
}

export interface SuggestionChipsProps {
  /** The pool to deal from. */
  suggestions?: (string | Suggestion)[];
  /** How many show at once. */
  count?: number;
  onPick?: (text: string, item: Suggestion) => void;
  moreLabel?: string;
  align?: 'center' | 'start';
  /** Entrance delay per chip in ms. */
  stagger?: number;
  /** Accessible name of the list. */
  label?: string;
  chipColor?: string;
  hoverColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  accentColor?: string;
  radius?: number;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

const asItem = (s: string | Suggestion): Suggestion => (typeof s === 'string' ? { text: s } : s);

// Deal `count` items, avoiding the ones currently shown when the pool allows.
function deal(pool: (string | Suggestion)[], count: number, avoid: string[] = []) {
  const fresh = pool.filter(item => !avoid.includes(asItem(item).text));
  const source = fresh.length >= count ? fresh : pool;
  const shuffled = [...source];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count).map(asItem);
}

export default function SuggestionChips({
  suggestions = [],
  count = 4,
  onPick,
  moreLabel = 'More ideas',
  align = 'center',
  stagger = 60,
  label = 'Suggestions',
  chipColor,
  hoverColor,
  textColor,
  mutedColor,
  lineColor,
  accentColor,
  radius = 999,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: SuggestionChipsProps) {
  useStyles();
  const [shown, setShown] = useState<Suggestion[]>(() => suggestions.slice(0, count).map(asItem));
  const [round, setRound] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [announce, setAnnounce] = useState('');

  const shuffle = () => {
    if (leaving) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const next = deal(suggestions, count, shown.map(s => s.text));
    const swap = () => {
      setShown(next);
      setRound(r => r + 1);
      setLeaving(false);
      setAnnounce(`New suggestions: ${next.map(s => s.text).join('; ')}`);
    };
    if (reduced) swap();
    else {
      setLeaving(true);
      setTimeout(swap, 180 + shown.length * 30);
    }
  };

  return (
    <div className={`bl-chips ${className}`} style={{ '--bl-align': align === 'start' ? 'start' : 'center', '--bl-justify': align === 'start' ? 'flex-start' : 'center', '--bl-stagger': `${stagger}ms`, '--bl-chip': chipColor, '--bl-hover': hoverColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-radius': `${radius}px`, '--bl-font': fontFamily, ...style } as CSSVars}>
      <ul className="bl-chips__list" aria-label={label} data-leaving={leaving || undefined}>
        {shown.map((item, i) => (
          <li key={`${round}-${item.text}`}>
            <button type="button" className="bl-chips__chip" style={{ '--i': i } as CSSVars} onClick={() => onPick?.(item.text, item)}>
              {item.icon && (
                <span className="bl-chips__icon" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label ?? item.text}
            </button>
          </li>
        ))}
      </ul>
      {suggestions.length > count && (
        <button type="button" className="bl-chips__more" onClick={shuffle}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11.5 5.5A5 5 0 0 0 2.6 4.4M2.5 8.5a5 5 0 0 0 8.9 1.1M2.5 2v2.5H5M11.5 12V9.5H9" />
          </svg>
          {moreLabel}
        </button>
      )}
      <span className="bl-chips__sr" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
