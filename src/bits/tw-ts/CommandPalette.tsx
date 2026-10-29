import { useEffect, useId, useInsertionEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type KeyboardEvent, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// ⌘K command palette. Fuzzy search with highlighted matches, grouped results, nested pages
// (an item can open its own list), recently used items, and a list that animates its height
// as results change. Accessible combobox: the input owns focus, arrows move the active
// option, Enter runs it, Backspace on an empty query goes back a page, Esc closes.

const STYLE_ID = 'bl-command-palette-tw';
const CSS = `
/* theme tokens */
.bl-cmdk-theme { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: rgba(255,255,255,0.1); --bl-active: rgba(115,239,247,0.12); --bl-accent: #73eff7; --bl-chip: rgba(255,255,255,0.08); --bl-backdrop: rgba(8,8,16,0.55); }
:where(.light, [data-theme="light"]) .bl-cmdk-theme, .bl-cmdk-theme:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: rgba(26,28,44,0.1); --bl-active: rgba(22,127,143,0.12); --bl-accent: #167f8f; --bl-chip: rgba(26,28,44,0.08); }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-cmdk-theme, :where(.light, [data-theme="light"]) .bl-cmdk-theme:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: rgba(255,255,255,0.1); --bl-active: rgba(115,239,247,0.12); --bl-accent: #73eff7; --bl-chip: rgba(255,255,255,0.08); --bl-backdrop: rgba(8,8,16,0.55); }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-cmdk-theme, .bl-cmdk-theme:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: rgba(26,28,44,0.1); --bl-active: rgba(22,127,143,0.12); --bl-accent: #167f8f; --bl-chip: rgba(26,28,44,0.08); } }
/* theme tokens end */
@keyframes bl-cmdk-in { from { opacity: 0; transform: translateX(-50%) scale(0.96); } }
@keyframes bl-cmdk-fade { from { opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Subsequence fuzzy match. Rewards consecutive letters, word starts and early matches.
export interface CommandItem {
  id: string;
  label: string;
  icon?: ReactNode;
  /** Muted text on the right. */
  hint?: ReactNode;
  /** Keys shown as kbd chips, e.g. ["⌘", "S"]. */
  shortcut?: string[];
  /** Extra words the search matches (not highlighted). */
  keywords?: string[];
  onSelect?: (item: CommandItem) => void;
  /** Keep the palette open after running this item. */
  keepOpen?: boolean;
  /** Turns the item into a nested page. */
  items?: CommandGroup[];
  /** Search placeholder while this item's page is open. */
  placeholder?: string;
}

export interface CommandGroup {
  heading?: string;
  items: CommandItem[];
}

export interface FuzzyResult {
  score: number;
  /** Indices of matched characters in the text. */
  indices: number[];
}

interface Entry {
  item: CommandItem;
  indices: number[];
  score?: number;
}

interface ResultGroup {
  heading?: string;
  items: Entry[];
  best?: number;
}

export interface CommandPaletteProps {
  groups?: CommandGroup[];
  /** Controlled open state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** ⌘/Ctrl + this key toggles the palette; null disables it. */
  hotkey?: string | null;
  placeholder?: string;
  emptyText?: ReactNode;
  /** localStorage key for recently used items; null disables recents. */
  recentKey?: string | null;
  maxRecent?: number;
  /** Width, in px. */
  width?: number;
  /** Max list height before it scrolls, in px. */
  maxListHeight?: number;
  radius?: number;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  activeColor?: string;
  accentColor?: string;
  chipColor?: string;
  backdropColor?: string;
  fontFamily?: string;
  /** Key hints footer. */
  showFooter?: boolean;
}

export function fuzzyMatch(query: string, text: string): FuzzyResult | null {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q) return { score: 0, indices: [] };
  let score = 0;
  let from = 0;
  let previous = -2;
  const indices = [];
  for (const char of q) {
    if (char === ' ') continue;
    const at = t.indexOf(char, from);
    if (at < 0) return null;
    const wordStart = at === 0 || /[\s\-_/.]/.test(t[at - 1]);
    score += 1 + (at === previous + 1 ? 3 : 0) + (wordStart ? 2 : 0) - at * 0.01;
    indices.push(at);
    previous = at;
    from = at + 1;
  }
  if (t.startsWith(q)) score += 4;
  return { score, indices };
}

function Highlight({ text, indices }: { text: string; indices: number[] }) {
  if (!indices?.length) return text;
  const set = new Set(indices);
  const parts: ReactNode[] = [];
  let run = '';
  let marked = false;
  [...text].forEach((char, i) => {
    const hit = set.has(i);
    if (hit !== marked && run) {
      parts.push(marked ? <mark key={i}>{run}</mark> : run);
      run = '';
    }
    marked = hit;
    run += char;
  });
  if (run) parts.push(marked ? <mark key="end">{run}</mark> : run);
  return parts;
}

const readRecent = (key: string): string[] => {
  try {
    return JSON.parse(localStorage.getItem(key) as string) ?? [];
  } catch {
    return [];
  }
};
const writeRecent = (key: string, ids: string[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // Storage can be unavailable (private mode); recents just won't persist.
  }
};

function collect(groups: CommandGroup[], map = new Map<string, CommandItem>()) {
  for (const group of groups) {
    for (const item of group.items) {
      map.set(item.id, item);
      if (item.items) collect(item.items, map);
    }
  }
  return map;
}

export default function CommandPalette({
  groups = [],
  open: controlledOpen,
  onOpenChange,
  hotkey = 'k',
  placeholder = 'Type a command or search…',
  emptyText = 'No results found.',
  recentKey = 'bl-command-palette-recent',
  maxRecent = 4,
  width = 620,
  maxListHeight = 360,
  radius = 14,
  backgroundColor,
  textColor,
  mutedColor,
  lineColor,
  activeColor,
  accentColor,
  chipColor,
  backdropColor,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  showFooter = true
}: CommandPaletteProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const [query, setQuery] = useState('');
  const [pages, setPages] = useState<CommandItem[]>([]);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [listHeight, setListHeight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (!hotkey) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === hotkey) {
        event.preventDefault();
        setOpen(!openRef.current);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotkey]);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    setQuery('');
    setPages([]);
    setActive(0);
    if (recentKey) setRecent(readRecent(recentKey));
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previous;
      restoreRef.current?.focus?.({ preventScroll: true });
    };
  }, [open, recentKey]);

  const allItems = useMemo(() => collect(groups), [groups]);
  const page = pages[pages.length - 1];
  const pageGroups = page ? page.items! : groups;

  const results = useMemo(() => {
    const q = query.trim();
    const out: ResultGroup[] = [];
    if (!q) {
      if (!page && recent.length) {
        const items = recent.map(id => allItems.get(id)).filter(Boolean) as CommandItem[];
        if (items.length) out.push({ heading: 'Recent', items: items.map(item => ({ item, indices: [] })) });
      }
      pageGroups.forEach(group => out.push({ heading: group.heading, items: group.items.map(item => ({ item, indices: [] })) }));
      return out;
    }
    pageGroups.forEach(group => {
      const matches = group.items
        .map((item): Entry | null => {
          const label = fuzzyMatch(q, item.label);
          const keyword = ((item.keywords ?? []).map(k => fuzzyMatch(q, k)).filter(Boolean) as FuzzyResult[]).sort((a, b) => b.score - a.score)[0];
          if (!label && !keyword) return null;
          return { item, indices: label?.indices ?? [], score: Math.max(label?.score ?? -Infinity, (keyword?.score ?? -Infinity) * 0.8) };
        })
        .filter(Boolean as unknown as (entry: Entry | null) => entry is Entry)
        .sort((a, b) => b.score! - a.score!);
      if (matches.length) out.push({ heading: group.heading, items: matches, best: matches[0].score });
    });
    return out.sort((a, b) => b.best! - a.best!);
  }, [query, pageGroups, page, recent, allItems]);

  const flat = results.flatMap(group => group.items);
  const activeIndex = Math.min(active, Math.max(0, flat.length - 1));

  useEffect(() => setActive(0), [query, pages.length]);

  useLayoutEffect(() => {
    if (!open || !innerRef.current) return;
    const observer = new ResizeObserver(() => setListHeight(innerRef.current?.offsetHeight ?? 0));
    observer.observe(innerRef.current);
    setListHeight(innerRef.current.offsetHeight);
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector(`#${uid}-opt-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, uid]);

  const run = (entry: Entry | undefined) => {
    if (!entry) return;
    const { item } = entry;
    if (item.items) {
      setPages(prev => [...prev, item]);
      setQuery('');
      return;
    }
    if (recentKey) {
      const next = [item.id, ...recent.filter(id => id !== item.id)].slice(0, maxRecent);
      setRecent(next);
      writeRecent(recentKey, next);
    }
    item.onSelect?.(item);
    if (!item.keepOpen) setOpen(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!flat.length) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      setActive((activeIndex + step + flat.length) % flat.length);
    } else if (event.key === 'Home' && !query) {
      event.preventDefault();
      setActive(0);
    } else if (event.key === 'End' && !query) {
      event.preventDefault();
      setActive(flat.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      run(flat[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      if (pages.length) setPages(prev => prev.slice(0, -1));
      else setOpen(false);
    } else if (event.key === 'Backspace' && !query && pages.length) {
      event.preventDefault();
      setPages(prev => prev.slice(0, -1));
    } else if (event.key === 'Tab') {
      event.preventDefault();
    }
  };

  if (!open || typeof document === 'undefined') return null;

  let optionIndex = -1;
  return createPortal(
    <div
      className="bl-cmdk-theme"
      style={{
        '--bl-w': `${width}px`,
        '--bl-radius': `${radius}px`,
        '--bl-bg': backgroundColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-line': lineColor,
        '--bl-active': activeColor,
        '--bl-accent': accentColor,
        '--bl-chip': chipColor,
        '--bl-backdrop': backdropColor,
        '--bl-font': fontFamily,
        '--bl-max-h': `${maxListHeight}px`,
        '--bl-list-h': `${listHeight}px`
      } as CSSVars}
    >
      <div className="fixed inset-0 z-1300 animate-[bl-cmdk-fade_160ms_ease] bg-(--bl-backdrop) motion-reduce:animate-none" onClick={() => setOpen(false)} />
      <div className="fixed top-[14vh] left-1/2 z-1301 w-[min(var(--bl-w),calc(100vw_-_24px))] animate-[bl-cmdk-in_200ms_cubic-bezier(.2,.9,.25,1.1)] overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) font-(family-name:--bl-font) text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line),0_30px_80px_-20px_rgba(0,0,0,0.7)] [transform:translateX(-50%)] motion-reduce:animate-none" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="flex items-center gap-2 border-b border-solid border-(--bl-line) px-4">
          {pages.map(p => (
            <span key={p.id} className="flex-none rounded-[6px] bg-(--bl-chip) px-2 py-1 text-[12px] font-semibold whitespace-nowrap text-(--bl-ink)">
              {p.label}
            </span>
          ))}
          <input
            ref={inputRef}
            className="h-[54px] min-w-0 flex-1 border-0 bg-transparent text-[16px] text-inherit outline-none placeholder:text-(--bl-muted)"
            role="combobox"
            aria-expanded="true"
            aria-controls={`${uid}-list`}
            aria-activedescendant={flat.length ? `${uid}-opt-${activeIndex}` : undefined}
            aria-autocomplete="list"
            autoComplete="off"
            spellCheck={false}
            placeholder={page?.placeholder ?? placeholder}
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
          />
        </div>
        <div ref={listRef} className="h-(--bl-list-h) max-h-(--bl-max-h) scroll-p-2 overflow-y-auto overscroll-contain [transition:height_180ms_cubic-bezier(.2,.8,.2,1)] motion-reduce:[transition:none]" id={`${uid}-list`} role="listbox" aria-label="Results">
          <div ref={innerRef} className="p-1.5">
            {!flat.length && <div className="px-4 py-7 text-center text-(--bl-muted)">{emptyText}</div>}
            {results.map(group => (
              <div key={group.heading ?? 'group'} role="group" aria-label={group.heading}>
                {group.heading && (
                  <div className="px-2.5 pt-2.5 pb-1.5 text-[11px] font-bold tracking-[0.06em] text-(--bl-muted) uppercase" aria-hidden="true">
                    {group.heading}
                  </div>
                )}
                {group.items.map(entry => {
                  optionIndex += 1;
                  const index = optionIndex;
                  const { item } = entry;
                  return (
                    <div
                      key={`${group.heading}-${item.id}`}
                      id={`${uid}-opt-${index}`}
                      className="group/item flex min-h-[42px] cursor-pointer items-center gap-3 rounded-[calc(var(--bl-radius)*0.6)] px-2.5 select-none aria-selected:bg-(--bl-active)"
                      role="option"
                      aria-selected={index === activeIndex}
                      onPointerMove={() => index !== activeIndex && setActive(index)}
                      onClick={() => run(entry)}
                    >
                      {item.icon && <span className="grid w-6 flex-none place-items-center text-(--bl-muted) group-aria-selected/item:text-(--bl-accent)">{item.icon}</span>}
                      <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap [&_mark]:bg-transparent [&_mark]:font-bold [&_mark]:text-(--bl-accent)">
                        <Highlight text={item.label} indices={entry.indices} />
                      </span>
                      {item.hint && <span className="text-[13px] whitespace-nowrap text-(--bl-muted)">{item.hint}</span>}
                      {item.items && <span className="text-[13px] whitespace-nowrap text-(--bl-muted)" aria-hidden="true">›</span>}
                      {item.shortcut && (
                        <span className="flex gap-1 [&_kbd]:min-w-5 [&_kbd]:rounded-[5px] [&_kbd]:bg-(--bl-chip) [&_kbd]:px-[5px] [&_kbd]:py-0.5 [&_kbd]:text-center [&_kbd]:[font:600_11px/16px_var(--bl-font)] [&_kbd]:text-(--bl-muted)" aria-label={`Shortcut ${item.shortcut.join(' ')}`}>
                          {item.shortcut.map(key => (
                            <kbd key={key}>{key}</kbd>
                          ))}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        {showFooter && (
          <div className="flex justify-end gap-3.5 border-t border-solid border-(--bl-line) px-3.5 py-2 text-[12px] text-(--bl-muted) [&_kbd]:mr-1 [&_kbd]:rounded-[4px] [&_kbd]:bg-(--bl-chip) [&_kbd]:px-[5px] [&_kbd]:py-px [&_kbd]:[font:inherit]" aria-hidden="true">
            <span>
              <kbd>↑↓</kbd>navigate
            </span>
            <span>
              <kbd>↵</kbd>select
            </span>
            <span>
              <kbd>esc</kbd>
              {pages.length ? 'back' : 'close'}
            </span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
