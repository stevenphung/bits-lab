import { useInsertionEffect, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version; only the
// keyframes ship as a small injected style, so it works without editing your CSS.
//
// Prompt suggestions for an empty chat. A few chips from your pool stagger in; "More ideas"
// sends them out and deals a fresh, shuffled set (never repeating the ones on screen).
// Each chip is a button that hands its text to onPick. Icons optional.

const STYLE_ID = 'bl-suggestion-chips-tw';
const CSS = `
/* theme tokens */
.bl-chips { --bl-chip: #262b44; --bl-hover: #2e3552; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-chips, .bl-chips:where(.light, [data-theme="light"]) { --bl-chip: #ebe5d8; --bl-hover: #e0d8c6; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-chips, :where(.light, [data-theme="light"]) .bl-chips:where(.dark, [data-theme="dark"]) { --bl-chip: #262b44; --bl-hover: #2e3552; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-chips, .bl-chips:where([data-theme="system"]) { --bl-chip: #ebe5d8; --bl-hover: #e0d8c6; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-accent: #167f8f; } }
/* theme tokens end */
@keyframes bl-chips-in { from { opacity: 0; transform: translateY(10px) scale(0.92); } }
@keyframes bl-chips-out { to { opacity: 0; transform: translateY(-6px) scale(0.95); } }
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
    <div className={`bl-chips grid w-full gap-3 font-(family-name:--bl-font) [justify-items:var(--bl-align)] ${className}`} style={{ '--bl-align': align === 'start' ? 'start' : 'center', '--bl-justify': align === 'start' ? 'flex-start' : 'center', '--bl-stagger': `${stagger}ms`, '--bl-chip': chipColor, '--bl-hover': hoverColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-radius': `${radius}px`, '--bl-font': fontFamily, ...style } as CSSVars}>
      <ul className="group/chips flex flex-wrap gap-2 [justify-content:var(--bl-justify)]" aria-label={label} data-leaving={leaving || undefined}>
        {shown.map((item, i) => (
          <li key={`${round}-${item.text}`}>
            <button type="button" className="inline-flex max-w-full animate-[bl-chips-in_420ms_cubic-bezier(.3,1.4,.5,1)_both] cursor-pointer items-center gap-2 rounded-(--bl-radius) bg-(--bl-chip) px-3.5 py-[9px] text-left text-[14px] leading-[1.35] text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line)] transition-[background-color,box-shadow,transform] duration-150 ease-[ease] [animation-delay:calc(var(--i)*var(--bl-stagger))] hover:-translate-y-px hover:bg-(--bl-hover) hover:shadow-[0_0_0_1px_var(--bl-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) group-data-[leaving]/chips:pointer-events-none group-data-[leaving]/chips:animate-[bl-chips-out_180ms_ease-in_both] group-data-[leaving]/chips:[animation-delay:calc(var(--i)*30ms)] motion-reduce:animate-none motion-reduce:group-data-[leaving]/chips:animate-none" style={{ '--i': i } as CSSVars} onClick={() => onPick?.(item.text, item)}>
              {item.icon && (
                <span className="grid flex-none place-items-center" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              {item.label ?? item.text}
            </button>
          </li>
        ))}
      </ul>
      {suggestions.length > count && (
        <button type="button" className="group/more inline-flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[13px] text-(--bl-muted) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-(--bl-accent)" onClick={shuffle}>
          <svg className="transition-transform duration-400 ease-[cubic-bezier(.3,1.4,.5,1)] group-active/more:-rotate-180" width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11.5 5.5A5 5 0 0 0 2.6 4.4M2.5 8.5a5 5 0 0 0 8.9 1.1M2.5 2v2.5H5M11.5 12V9.5H9" />
          </svg>
          {moreLabel}
        </button>
      )}
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
