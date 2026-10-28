import { useId, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A tag field. Type and press Enter or a comma to add a chip; paste "a, b, c" to add many at
// once; Backspace on an empty field selects the last chip, and again removes it. Suggestions
// filter as you type (a proper combobox: arrows, Enter, Esc). Chips spring in and shrink out,
// a duplicate makes its twin shake, and every change is announced.

const STYLE_ID = 'bl-tag-input-tw';
const CSS = `
/* theme tokens */
.bl-tags { --bl-bg: #1a1c2c; --bl-chip: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-dim: #566c86; --bl-line: #333c57; --bl-accent: #73eff7; --bl-error: #ef7d57; }
:where(.light, [data-theme="light"]) .bl-tags, .bl-tags:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ddd4c0; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-dim: #8a96a3; --bl-line: #cfc4ad; --bl-accent: #167f8f; --bl-error: #c4502a; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-tags, :where(.light, [data-theme="light"]) .bl-tags:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-dim: #566c86; --bl-line: #333c57; --bl-accent: #73eff7; --bl-error: #ef7d57; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-tags, .bl-tags:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ddd4c0; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-dim: #8a96a3; --bl-line: #cfc4ad; --bl-accent: #167f8f; --bl-error: #c4502a; } }
/* theme tokens end */
@keyframes bl-tags-in { from { transform: scale(0.4); opacity: 0; } }
@keyframes bl-tags-out { to { transform: scale(0.4); opacity: 0; } }
@keyframes bl-tags-shake { 20%, 60% { transform: translateX(-4px); } 40%, 80% { transform: translateX(4px); } }
@keyframes bl-tags-menu { from { opacity: 0; transform: translateY(-4px); } }
@keyframes bl-tags-fade { to { opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const SPLIT = /[,;\n\t]+/;

export default function TagInput({
  value,
  defaultValue = [],
  onValueChange,
  suggestions = [],
  allowCustom = true,
  max = Infinity,
  validate,
  label = 'Tags',
  placeholder = 'Add a tag…',
  hint = 'Enter or comma to add. Paste a list to add many.',
  width = 520,
  backgroundColor,
  chipColor,
  textColor,
  mutedColor,
  dimColor,
  lineColor,
  accentColor,
  errorColor,
  radius = 12,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState(defaultValue);
  const tags = value ?? inner;
  const tagsRef = useRef(tags);
  tagsRef.current = tags;
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [selected, setSelected] = useState(-1);
  const [leaving, setLeaving] = useState([]);
  const [shake, setShake] = useState(null);
  const [error, setError] = useState('');
  const [announce, setAnnounce] = useState('');
  const inputRef = useRef(null);

  const commit = next => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  const query = text.trim().toLowerCase();
  const matches = suggestions.filter(s => !tags.some(t => t.toLowerCase() === s.toLowerCase()) && (!query || s.toLowerCase().includes(query))).slice(0, 8);
  const showMenu = open && matches.length > 0 && (query.length > 0 || suggestions.length > 0);

  // Adds every new, valid tag from a list; reports duplicates and problems.
  const add = raw => {
    const next = [...tags];
    const added = [];
    let problem = '';
    for (const piece of raw) {
      const tag = piece.trim();
      if (!tag) continue;
      const twin = next.findIndex(t => t.toLowerCase() === tag.toLowerCase());
      if (twin >= 0) {
        setShake(next[twin]);
        problem = `"${tag}" is already added.`;
        continue;
      }
      if (!allowCustom && !suggestions.some(s => s.toLowerCase() === tag.toLowerCase())) {
        problem = `"${tag}" isn't one of the options.`;
        continue;
      }
      const verdict = validate?.(tag);
      if (verdict === false || typeof verdict === 'string') {
        problem = typeof verdict === 'string' ? verdict : `"${tag}" isn't allowed.`;
        continue;
      }
      if (next.length >= max) {
        problem = `You can add up to ${max}.`;
        break;
      }
      const canonical = suggestions.find(s => s.toLowerCase() === tag.toLowerCase()) ?? tag;
      next.push(canonical);
      added.push(canonical);
    }
    if (added.length) {
      commit(next);
      setAnnounce(`Added ${added.join(', ')}. ${next.length} tags.`);
    }
    setError(problem);
    if (problem && !added.length) setAnnounce(problem);
    return added.length > 0;
  };

  const remove = index => {
    const tag = tags[index];
    if (tag === undefined) return;
    setSelected(-1);
    // Let it shrink out first, then drop it.
    setLeaving(list => [...list, tag]);
    setTimeout(() => {
      setLeaving(list => list.filter(t => t !== tag));
      // Read (and immediately update) the latest tags: several chips can finish shrinking in
      // the same tick, before React has re-rendered with the previous removal.
      const next = tagsRef.current.filter(t => t !== tag);
      tagsRef.current = next;
      commit(next);
    }, window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 120 : 180);
    setAnnounce(`Removed ${tag}.`);
    setError('');
    inputRef.current?.focus();
  };

  const onKeyDown = event => {
    if (event.key === 'ArrowDown' && matches.length) {
      event.preventDefault();
      setOpen(true);
      setHighlight(h => (showMenu ? (h + 1) % matches.length : 0));
    } else if (event.key === 'ArrowUp' && showMenu) {
      event.preventDefault();
      setHighlight(h => (h - 1 + matches.length) % matches.length);
    } else if (event.key === 'Enter' || event.key === ',') {
      if (event.key === 'Enter' && showMenu && matches[highlight]) {
        event.preventDefault();
        if (add([matches[highlight]])) setText('');
        setHighlight(0);
        return;
      }
      if (text.trim()) {
        event.preventDefault();
        if (add([text])) setText('');
      } else if (event.key === ',') event.preventDefault();
    } else if (event.key === 'Escape') {
      setOpen(false);
      setSelected(-1);
    } else if (event.key === 'Backspace' && !text) {
      if (selected >= 0) remove(selected);
      else if (tags.length) setSelected(tags.length - 1);
    } else if (event.key === 'ArrowLeft' && !text && tags.length) {
      setSelected(s => (s < 0 ? tags.length - 1 : Math.max(0, s - 1)));
    } else if (event.key === 'ArrowRight' && selected >= 0) {
      setSelected(s => (s >= tags.length - 1 ? -1 : s + 1));
    } else {
      setSelected(-1);
    }
  };

  const onPaste = event => {
    const pasted = event.clipboardData.getData('text');
    if (!SPLIT.test(pasted)) return;
    event.preventDefault();
    add(pasted.split(SPLIT));
  };

  const mark = option => {
    if (!query) return option;
    const at = option.toLowerCase().indexOf(query);
    return (
      <>
        {option.slice(0, at)}
        <mark>{option.slice(at, at + query.length)}</mark>
        {option.slice(at + query.length)}
      </>
    );
  };

  return (
    <div
      className={`bl-tags relative w-full max-w-(--bl-w) font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      style={{
        '--bl-w': `${width}px`,
        '--bl-bg': backgroundColor,
        '--bl-chip': chipColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-dim': dimColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-error': errorColor,
        '--bl-radius': `${radius}px`,
        '--bl-font': fontFamily,
        ...style
      }}
    >
      <label className="mb-1.5 block text-[13px] font-semibold text-(--bl-muted)" htmlFor={`${uid}-input`}>
        {label}
      </label>
      <div className="box-border flex min-h-11 cursor-text flex-wrap items-center gap-1.5 rounded-(--bl-radius) bg-(--bl-bg) px-2 py-1.5 shadow-[inset_0_0_0_1px_var(--bl-line)] transition-shadow duration-150 ease-[ease] not-data-[invalid]:focus-within:shadow-[inset_0_0_0_2px_var(--bl-accent)] data-[invalid]:shadow-[inset_0_0_0_2px_var(--bl-error)]" data-invalid={error ? '' : undefined} onClick={() => inputRef.current?.focus()}>
        <ul className="m-0 contents list-none p-0" aria-label={`${label}: ${tags.length} selected`}>
          {tags.map((tag, i) => (
            <li
              key={tag}
              className="inline-flex max-w-full animate-[bl-tags-in_340ms_cubic-bezier(.3,1.6,.5,1)_both] items-center gap-1 rounded-full bg-(--bl-chip) py-1 pr-1 pl-2.5 text-[13px] font-semibold text-(--bl-ink) data-[leaving]:animate-[bl-tags-out_180ms_ease-in_forwards] data-[selected]:shadow-[0_0_0_2px_var(--bl-accent)] data-[shake]:animate-[bl-tags-shake_360ms_ease] motion-reduce:animate-none motion-reduce:data-[leaving]:animate-[bl-tags-fade_120ms_forwards] motion-reduce:data-[shake]:animate-none"
              data-selected={i === selected || undefined}
              data-leaving={leaving.includes(tag) || undefined}
              data-shake={shake === tag || undefined}
              onAnimationEnd={() => shake === tag && setShake(null)}
            >
              <span className="overflow-hidden text-ellipsis whitespace-nowrap">{tag}</span>
              <button type="button" className="grid size-5 cursor-pointer place-items-center rounded-[50%] border-0 bg-transparent p-0 text-(--bl-muted) hover:bg-[rgba(255,255,255,0.12)] hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" aria-label={`Remove ${tag}`} onClick={() => remove(i)}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <path d="M2 2l6 6M8 2 2 8" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
        <input
          ref={inputRef}
          id={`${uid}-input`}
          className="h-[30px] min-w-20 flex-[1_0_80px] border-0 bg-transparent px-1 text-[14px] text-inherit outline-none placeholder:text-(--bl-dim)"
          role="combobox"
          aria-expanded={showMenu}
          aria-controls={`${uid}-menu`}
          aria-autocomplete="list"
          aria-activedescendant={showMenu ? `${uid}-opt-${highlight}` : undefined}
          aria-describedby={`${uid}-hint`}
          aria-invalid={error ? true : undefined}
          value={text}
          placeholder={tags.length >= max ? '' : placeholder}

          onChange={event => {
            setText(event.target.value);
            setOpen(true);
            setHighlight(0);
            setError('');
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setSelected(-1);
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
        />
      </div>
      {showMenu && (
        <ul id={`${uid}-menu`} className="absolute top-[calc(100%_+_6px)] right-0 left-0 z-20 m-0 max-h-[220px] animate-[bl-tags-menu_160ms_ease-out] list-none overflow-y-auto rounded-(--bl-radius) bg-(--bl-bg) p-[5px] shadow-[0_0_0_1px_var(--bl-line),0_18px_40px_-18px_rgba(0,0,0,0.85)] motion-reduce:animate-none" role="listbox" aria-label={`${label} suggestions`}>
          {matches.map((option, i) => (
            <li
              key={option}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={i === highlight}
              className="cursor-pointer rounded-[calc(var(--bl-radius)*0.6)] px-2.5 py-2 text-[14px] aria-selected:bg-(--bl-chip) [&_mark]:bg-transparent [&_mark]:font-bold [&_mark]:text-(--bl-accent)"
              onPointerEnter={() => setHighlight(i)}
              onPointerDown={event => {
                event.preventDefault();
                if (add([option])) setText('');
              }}
            >
              {mark(option)}
            </li>
          ))}
        </ul>
      )}
      <p id={`${uid}-hint`} className="mt-1.5 mb-0 min-h-[1.3em] text-[12px] text-(--bl-dim) data-[error]:text-(--bl-error)" data-error={error ? '' : undefined}>
        {error || hint}
      </p>
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
