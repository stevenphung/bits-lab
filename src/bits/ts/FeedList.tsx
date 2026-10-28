import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A live activity feed. New entries slide in at the top with a brief flash, entries that drop
// off fold away, and every timestamp keeps itself fresh ("just now", "4 min ago"). With
// `onSelect`, the feed becomes a list you can move through with the arrow keys and pick from with
// Enter or a click. New entries are announced politely; reduced motion skips the slides.

const STYLE_ID = 'bl-feed-list';
const CSS = `
/* theme tokens */
.bl-feed { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-hover: rgba(255,255,255,0.05); --bl-chip: rgba(255,255,255,0.07); --bl-line: #333c57; --bl-accent: #73eff7; --bl-flash: rgba(115,239,247,0.14); }
:where(.light, [data-theme="light"]) .bl-feed, .bl-feed:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-hover: rgba(26,28,44,0.05); --bl-chip: rgba(26,28,44,0.07); --bl-line: #cfc4ad; --bl-accent: #167f8f; --bl-flash: rgba(22,127,143,0.14); }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-feed, :where(.light, [data-theme="light"]) .bl-feed:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-hover: rgba(255,255,255,0.05); --bl-chip: rgba(255,255,255,0.07); --bl-line: #333c57; --bl-accent: #73eff7; --bl-flash: rgba(115,239,247,0.14); }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-feed, .bl-feed:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-hover: rgba(26,28,44,0.05); --bl-chip: rgba(26,28,44,0.07); --bl-line: #cfc4ad; --bl-accent: #167f8f; --bl-flash: rgba(22,127,143,0.14); } }
/* theme tokens end */
.bl-feed { margin: 0; padding: 6px; list-style: none; width: 100%; max-width: var(--bl-w); max-height: var(--bl-max-h); overflow-y: auto; box-sizing: border-box; border-radius: var(--bl-radius); background: var(--bl-bg); font-family: var(--bl-font); color: var(--bl-ink); box-shadow: inset 0 0 0 1px var(--bl-line); outline: none; }
.bl-feed:focus-visible { box-shadow: inset 0 0 0 2px var(--bl-accent); }
.bl-feed__item { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 280ms cubic-bezier(.3,.8,.3,1), opacity 220ms; }
.bl-feed__item[data-leaving] { grid-template-rows: 0fr; opacity: 0; }
.bl-feed__row { display: grid; grid-template-columns: auto 1fr auto; align-items: start; gap: 12px; min-height: 0; overflow: hidden; padding: 10px 12px; border-radius: 10px; }
.bl-feed__item[data-new] .bl-feed__row { animation: bl-feed-in 420ms cubic-bezier(.2,.9,.3,1.2) both; }
.bl-feed__item[data-selectable] .bl-feed__row { cursor: pointer; }
.bl-feed__item[data-selectable]:hover .bl-feed__row { background: var(--bl-hover); }
.bl-feed__item[data-active] .bl-feed__row { background: var(--bl-hover); box-shadow: inset 3px 0 0 var(--bl-accent); }
.bl-feed__icon { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 8px; background: var(--bl-chip); color: var(--tone, var(--bl-accent)); }
.bl-feed__text { display: grid; gap: 2px; min-width: 0; }
.bl-feed__title { font-size: 14px; font-weight: 600; line-height: 1.35; }
.bl-feed__body { color: var(--bl-muted); font-size: 13px; line-height: 1.4; }
.bl-feed__time { color: var(--bl-muted); font-size: 12px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.bl-feed__empty { padding: 18px 12px; color: var(--bl-muted); font-size: 14px; text-align: center; }
.bl-feed__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-feed-in { 0% { opacity: 0; transform: translateY(-10px); background: var(--bl-flash); } 60% { background: var(--bl-flash); } }
@media (prefers-reduced-motion: reduce) { .bl-feed__item { transition: none; } .bl-feed__item[data-new] .bl-feed__row { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// "just now", "4 min ago", "3 h ago", or the date.
function ago(time: Date | number | string, now: number, locale?: string) {
  const s = Math.round((now - new Date(time).getTime()) / 1000);
  if (s < 45) return 'just now';
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  if (s < 3600) return rtf.format(-Math.round(s / 60), 'minute');
  if (s < 86400) return rtf.format(-Math.round(s / 3600), 'hour');
  if (s < 604800) return rtf.format(-Math.round(s / 86400), 'day');
  return new Date(time).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

export interface FeedItem {
  id: string | number;
  title: string;
  body?: ReactNode;
  icon?: ReactNode;
  /** When it happened; shown as a relative time. */
  time?: Date | number | string;
  /** Icon colour. */
  tone?: string;
}

export interface FeedListProps {
  /** Newest first. */
  items?: FeedItem[];
  /** Makes the feed a listbox you can move through and pick from. */
  onSelect?: (item: FeedItem) => void;
  max?: number;
  label?: string;
  emptyLabel?: string;
  /** Relative-time language. */
  locale?: string;
  width?: number;
  maxHeight?: number;
  radius?: number;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  hoverColor?: string;
  chipColor?: string;
  lineColor?: string;
  accentColor?: string;
  flashColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function FeedList({
  items = [],
  onSelect,
  max = 50,
  label = 'Activity',
  emptyLabel = 'Nothing yet.',
  locale,
  width = 480,
  maxHeight = 420,
  radius = 14,
  backgroundColor,
  textColor,
  mutedColor,
  hoverColor,
  chipColor,
  lineColor,
  accentColor,
  flashColor,
  fontFamily = 'inherit',
  className = '',
  style
}: FeedListProps) {
  useStyles();
  const shown = items.slice(0, max);
  const [rows, setRows] = useState(() => shown.map(item => ({ item, state: 'idle' })));
  const [now, setNow] = useState(() => Date.now());
  const [active, setActive] = useState(0);
  const [announce, setAnnounce] = useState('');
  const known = useRef(new Set(shown.map(i => i.id)));
  const listRef = useRef<HTMLUListElement>(null);
  const selectable = typeof onSelect === 'function';
  const uid = `bl-feed-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // Merge the new list in: new ids flash in at their place, missing ones fold away, then go.
  useEffect(() => {
    const ids = new Set(shown.map(i => i.id));
    const added = shown.filter(i => !known.current.has(i.id));
    known.current = ids;
    setRows(prev => {
      const leaving = prev.filter(r => !ids.has(r.item.id)).map(r => ({ ...r, state: 'leaving' }));
      const next = shown.map(item => ({ item, state: added.includes(item) ? 'new' : 'idle' }));
      // Keep each leaving row where it was, so the fold happens in place.
      leaving.forEach(r => {
        const at = prev.findIndex(p => p.item.id === r.item.id);
        next.splice(Math.min(at, next.length), 0, r);
      });
      return next;
    });
    if (added.length) setAnnounce(added.length === 1 ? `New: ${added[0].title}` : `${added.length} new items`);
    const id = setTimeout(() => setRows(prev => prev.filter(r => r.state !== 'leaving')), 320);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown.map(i => i.id).join('|')]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const live = rows.filter(r => r.state !== 'leaving');
  const current = Math.min(active, Math.max(0, live.length - 1));

  const onKeyDown = (event: ReactKeyboardEvent<HTMLUListElement>) => {
    if (!selectable || !live.length) return;
    const moves: Record<string, number> = { ArrowDown: 1, ArrowUp: -1, Home: -1e9, End: 1e9 };
    if (moves[event.key] !== undefined) {
      event.preventDefault();
      const next = Math.max(0, Math.min(live.length - 1, current + moves[event.key]));
      setActive(next);
      listRef.current?.querySelector(`#${uid}-${next}`)?.scrollIntoView({ block: 'nearest' });
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect!(live[current].item);
    }
  };

  return (
    <>
      <ul
        ref={listRef}
        className={`bl-feed ${className}`}
        role={selectable ? 'listbox' : 'list'}
        aria-label={label}
        aria-activedescendant={selectable && live.length ? `${uid}-${current}` : undefined}
        tabIndex={selectable ? 0 : undefined}
        onKeyDown={onKeyDown}
        style={{ '--bl-w': `${width}px`, '--bl-max-h': `${maxHeight}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-hover': hoverColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-flash': flashColor, '--bl-font': fontFamily, ...style } as CSSVars}
      >
        {rows.map(({ item, state }) => {
          const i = live.findIndex(r => r.item.id === item.id);
          return (
            <li
              key={item.id}
              id={i >= 0 ? `${uid}-${i}` : undefined}
              className="bl-feed__item"
              role={selectable ? 'option' : undefined}
              aria-selected={selectable ? i === current : undefined}
              aria-hidden={state === 'leaving' || undefined}
              data-new={state === 'new' || undefined}
              data-leaving={state === 'leaving' || undefined}
              data-selectable={selectable || undefined}
              data-active={(selectable && i === current) || undefined}
              onClick={selectable && i >= 0 ? () => {
                setActive(i);
                onSelect!(item);
              } : undefined}
              style={{ '--tone': item.tone } as CSSVars}
            >
              <div className="bl-feed__row">
                <span className="bl-feed__icon" aria-hidden="true">
                  {item.icon ?? '•'}
                </span>
                <span className="bl-feed__text">
                  <span className="bl-feed__title">{item.title}</span>
                  {item.body && <span className="bl-feed__body">{item.body}</span>}
                </span>
                {item.time != null && (
                  <time className="bl-feed__time" dateTime={new Date(item.time).toISOString()}>
                    {ago(item.time, now, locale)}
                  </time>
                )}
              </div>
            </li>
          );
        })}
        {!live.length && <li className="bl-feed__empty">{emptyLabel}</li>}
      </ul>
      <span className="bl-feed__sr" aria-live="polite">
        {announce}
      </span>
    </>
  );
}
