import { useEffect, useId, useInsertionEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ⌘K command palette. Fuzzy search with highlighted matches, grouped results, nested pages
// (an item can open its own list), recently used items, and a list that animates its height
// as results change. Accessible combobox: the input owns focus, arrows move the active
// option, Enter runs it, Backspace on an empty query goes back a page, Esc closes.

const STYLE_ID = 'bl-command-palette';
const CSS = `
.bl-cmdk__backdrop { position: fixed; inset: 0; z-index: 1300; background: var(--bl-backdrop); animation: bl-cmdk-fade 160ms ease; }
.bl-cmdk { position: fixed; z-index: 1301; top: 14vh; left: 50%; width: min(var(--bl-w), calc(100vw - 24px)); transform: translateX(-50%); overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); box-shadow: 0 0 0 1px var(--bl-line), 0 30px 80px -20px rgba(0,0,0,0.7); animation: bl-cmdk-in 200ms cubic-bezier(.2,.9,.25,1.1); }
@keyframes bl-cmdk-in { from { opacity: 0; transform: translateX(-50%) scale(0.96); } }
@keyframes bl-cmdk-fade { from { opacity: 0; } }
.bl-cmdk__top { display: flex; align-items: center; gap: 8px; padding: 0 16px; border-bottom: 1px solid var(--bl-line); }
.bl-cmdk__crumb { flex: 0 0 auto; padding: 4px 8px; border-radius: 6px; background: var(--bl-chip); color: var(--bl-ink); font-size: 12px; font-weight: 600; white-space: nowrap; }
.bl-cmdk__input { flex: 1; min-width: 0; height: 54px; border: 0; background: transparent; color: inherit; font: inherit; font-size: 16px; outline: none; }
.bl-cmdk__input::placeholder { color: var(--bl-muted); }
.bl-cmdk__list { height: var(--bl-list-h); max-height: var(--bl-max-h); overflow-y: auto; overscroll-behavior: contain; transition: height 180ms cubic-bezier(.2,.8,.2,1); scroll-padding: 8px; }
.bl-cmdk__inner { padding: 6px; }
.bl-cmdk__heading { padding: 10px 10px 6px; color: var(--bl-muted); font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.bl-cmdk__item { display: flex; align-items: center; gap: 12px; min-height: 42px; padding: 0 10px; border-radius: calc(var(--bl-radius) * 0.6); cursor: pointer; user-select: none; }
.bl-cmdk__item[aria-selected="true"] { background: var(--bl-active); }
.bl-cmdk__item[aria-selected="true"] .bl-cmdk__icon { color: var(--bl-accent); }
.bl-cmdk__icon { flex: 0 0 auto; display: grid; place-items: center; width: 24px; color: var(--bl-muted); }
.bl-cmdk__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bl-cmdk__label mark { background: none; color: var(--bl-accent); font-weight: 700; }
.bl-cmdk__hint { color: var(--bl-muted); font-size: 13px; white-space: nowrap; }
.bl-cmdk__keys { display: flex; gap: 4px; }
.bl-cmdk__keys kbd { min-width: 20px; padding: 2px 5px; border-radius: 5px; background: var(--bl-chip); color: var(--bl-muted); font: 600 11px/16px var(--bl-font); text-align: center; }
.bl-cmdk__empty { padding: 28px 16px; color: var(--bl-muted); text-align: center; }
.bl-cmdk__foot { display: flex; gap: 14px; justify-content: flex-end; padding: 8px 14px; border-top: 1px solid var(--bl-line); color: var(--bl-muted); font-size: 12px; }
.bl-cmdk__foot kbd { margin-right: 4px; padding: 1px 5px; border-radius: 4px; background: var(--bl-chip); font: inherit; }
@media (prefers-reduced-motion: reduce) { .bl-cmdk, .bl-cmdk__backdrop { animation: none; } .bl-cmdk__list { transition: none; } }
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
export function fuzzyMatch(query, text) {
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

function Highlight({ text, indices }) {
  if (!indices?.length) return text;
  const set = new Set(indices);
  const parts = [];
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

const readRecent = key => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? [];
  } catch {
    return [];
  }
};
const writeRecent = (key, ids) => {
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // Storage can be unavailable (private mode); recents just won't persist.
  }
};

function collect(groups, map = new Map()) {
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
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = 'rgba(255,255,255,0.1)',
  activeColor = 'rgba(115,239,247,0.12)',
  accentColor = '#73eff7',
  chipColor = 'rgba(255,255,255,0.08)',
  backdropColor = 'rgba(8,8,16,0.55)',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  showFooter = true
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [innerOpen, setInnerOpen] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const [query, setQuery] = useState('');
  const [pages, setPages] = useState([]);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState([]);
  const [listHeight, setListHeight] = useState(0);
  const inputRef = useRef(null);
  const innerRef = useRef(null);
  const listRef = useRef(null);
  const restoreRef = useRef(null);

  const setOpen = next => {
    if (controlledOpen === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (!hotkey) return;
    const onKey = event => {
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
    restoreRef.current = document.activeElement;
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
  const pageGroups = page ? page.items : groups;

  const results = useMemo(() => {
    const q = query.trim();
    const out = [];
    if (!q) {
      if (!page && recent.length) {
        const items = recent.map(id => allItems.get(id)).filter(Boolean);
        if (items.length) out.push({ heading: 'Recent', items: items.map(item => ({ item, indices: [] })) });
      }
      pageGroups.forEach(group => out.push({ heading: group.heading, items: group.items.map(item => ({ item, indices: [] })) }));
      return out;
    }
    pageGroups.forEach(group => {
      const matches = group.items
        .map(item => {
          const label = fuzzyMatch(q, item.label);
          const keyword = (item.keywords ?? []).map(k => fuzzyMatch(q, k)).filter(Boolean).sort((a, b) => b.score - a.score)[0];
          if (!label && !keyword) return null;
          return { item, indices: label?.indices ?? [], score: Math.max(label?.score ?? -Infinity, (keyword?.score ?? -Infinity) * 0.8) };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score);
      if (matches.length) out.push({ heading: group.heading, items: matches, best: matches[0].score });
    });
    return out.sort((a, b) => b.best - a.best);
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

  const run = entry => {
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

  const onKeyDown = event => {
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
      }}
    >
      <div className="bl-cmdk__backdrop" onClick={() => setOpen(false)} />
      <div className="bl-cmdk" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="bl-cmdk__top">
          {pages.map(p => (
            <span key={p.id} className="bl-cmdk__crumb">
              {p.label}
            </span>
          ))}
          <input
            ref={inputRef}
            className="bl-cmdk__input"
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
        <div ref={listRef} className="bl-cmdk__list" id={`${uid}-list`} role="listbox" aria-label="Results">
          <div ref={innerRef} className="bl-cmdk__inner">
            {!flat.length && <div className="bl-cmdk__empty">{emptyText}</div>}
            {results.map(group => (
              <div key={group.heading ?? 'group'} role="group" aria-label={group.heading}>
                {group.heading && (
                  <div className="bl-cmdk__heading" aria-hidden="true">
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
                      className="bl-cmdk__item"
                      role="option"
                      aria-selected={index === activeIndex}
                      onPointerMove={() => index !== activeIndex && setActive(index)}
                      onClick={() => run(entry)}
                    >
                      {item.icon && <span className="bl-cmdk__icon">{item.icon}</span>}
                      <span className="bl-cmdk__label">
                        <Highlight text={item.label} indices={entry.indices} />
                      </span>
                      {item.hint && <span className="bl-cmdk__hint">{item.hint}</span>}
                      {item.items && <span className="bl-cmdk__hint" aria-hidden="true">›</span>}
                      {item.shortcut && (
                        <span className="bl-cmdk__keys" aria-label={`Shortcut ${item.shortcut.join(' ')}`}>
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
          <div className="bl-cmdk__foot" aria-hidden="true">
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
