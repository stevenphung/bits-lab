import { useId, useInsertionEffect, useRef, useState } from 'react';

// A tag field. Type and press Enter or a comma to add a chip; paste "a, b, c" to add many at
// once; Backspace on an empty field selects the last chip, and again removes it. Suggestions
// filter as you type (a proper combobox: arrows, Enter, Esc). Chips spring in and shrink out,
// a duplicate makes its twin shake, and every change is announced.

const STYLE_ID = 'bl-tag-input';
const CSS = `
/* theme tokens */
.bl-tags { --bl-bg: #1a1c2c; --bl-chip: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-dim: #566c86; --bl-line: #333c57; --bl-accent: #73eff7; --bl-error: #ef7d57; }
:where(.light, [data-theme="light"]) .bl-tags, .bl-tags:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ddd4c0; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-dim: #8a96a3; --bl-line: #cfc4ad; --bl-accent: #167f8f; --bl-error: #c4502a; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-tags, :where(.light, [data-theme="light"]) .bl-tags:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-dim: #566c86; --bl-line: #333c57; --bl-accent: #73eff7; --bl-error: #ef7d57; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-tags, .bl-tags:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ddd4c0; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-dim: #8a96a3; --bl-line: #cfc4ad; --bl-accent: #167f8f; --bl-error: #c4502a; } }
/* theme tokens end */
.bl-tags { position: relative; width: 100%; max-width: var(--bl-w); font-family: var(--bl-font); color: var(--bl-ink); }
.bl-tags__label { display: block; margin-bottom: 6px; color: var(--bl-muted); font-size: 13px; font-weight: 600; }
.bl-tags__field { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: 44px; padding: 6px 8px; box-sizing: border-box; border-radius: var(--bl-radius); background: var(--bl-bg); box-shadow: inset 0 0 0 1px var(--bl-line); cursor: text; transition: box-shadow 150ms; }
.bl-tags__field:focus-within { box-shadow: inset 0 0 0 2px var(--bl-accent); }
.bl-tags__field[data-invalid] { box-shadow: inset 0 0 0 2px var(--bl-error); }
.bl-tags__list { display: contents; margin: 0; padding: 0; list-style: none; }
.bl-tags__chip { display: inline-flex; align-items: center; gap: 4px; max-width: 100%; padding: 4px 4px 4px 10px; border-radius: 999px; background: var(--bl-chip); color: var(--bl-ink); font-size: 13px; font-weight: 600; animation: bl-tags-in 340ms cubic-bezier(.3,1.6,.5,1) both; }
.bl-tags__chip[data-selected] { box-shadow: 0 0 0 2px var(--bl-accent); }
.bl-tags__chip[data-leaving] { animation: bl-tags-out 180ms ease-in forwards; }
.bl-tags__chip[data-shake] { animation: bl-tags-shake 360ms ease; }
.bl-tags__text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bl-tags__x { display: grid; place-items: center; width: 20px; height: 20px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--bl-muted); cursor: pointer; }
.bl-tags__x:hover { background: rgba(255,255,255,0.12); color: var(--bl-ink); }
.bl-tags__x:focus-visible { outline: 2px solid var(--bl-accent); }
.bl-tags__input { flex: 1 0 80px; min-width: 80px; height: 30px; padding: 0 4px; border: 0; background: transparent; color: inherit; font: inherit; font-size: 14px; outline: none; }
.bl-tags__input::placeholder { color: var(--bl-dim); }
.bl-tags__menu { position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 20; max-height: 220px; margin: 0; padding: 5px; overflow-y: auto; border-radius: var(--bl-radius); background: var(--bl-bg); box-shadow: 0 0 0 1px var(--bl-line), 0 18px 40px -18px rgba(0,0,0,0.85); list-style: none; animation: bl-tags-menu 160ms ease-out; }
.bl-tags__option { padding: 8px 10px; border-radius: calc(var(--bl-radius) * 0.6); font-size: 14px; cursor: pointer; }
.bl-tags__option[aria-selected="true"] { background: var(--bl-chip); }
.bl-tags__option mark { background: none; color: var(--bl-accent); font-weight: 700; }
.bl-tags__hint { min-height: 1.3em; margin: 6px 0 0; color: var(--bl-dim); font-size: 12px; }
.bl-tags__hint[data-error] { color: var(--bl-error); }
.bl-tags__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-tags-in { from { transform: scale(0.4); opacity: 0; } }
@keyframes bl-tags-out { to { transform: scale(0.4); opacity: 0; } }
@keyframes bl-tags-shake { 20%, 60% { transform: translateX(-4px); } 40%, 80% { transform: translateX(4px); } }
@keyframes bl-tags-menu { from { opacity: 0; transform: translateY(-4px); } }
@media (prefers-reduced-motion: reduce) { .bl-tags__chip, .bl-tags__chip[data-shake], .bl-tags__menu { animation: none; } .bl-tags__chip[data-leaving] { animation: bl-tags-fade 120ms forwards; } }
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
      className={`bl-tags ${className}`}
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
      <label className="bl-tags__label" htmlFor={`${uid}-input`}>
        {label}
      </label>
      <div className="bl-tags__field" data-invalid={error ? '' : undefined} onClick={() => inputRef.current?.focus()}>
        <ul className="bl-tags__list" aria-label={`${label}: ${tags.length} selected`}>
          {tags.map((tag, i) => (
            <li
              key={tag}
              className="bl-tags__chip"
              data-selected={i === selected || undefined}
              data-leaving={leaving.includes(tag) || undefined}
              data-shake={shake === tag || undefined}
              onAnimationEnd={() => shake === tag && setShake(null)}
            >
              <span className="bl-tags__text">{tag}</span>
              <button type="button" className="bl-tags__x" aria-label={`Remove ${tag}`} onClick={() => remove(i)}>
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
          className="bl-tags__input"
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
        <ul id={`${uid}-menu`} className="bl-tags__menu" role="listbox" aria-label={`${label} suggestions`}>
          {matches.map((option, i) => (
            <li
              key={option}
              id={`${uid}-opt-${i}`}
              role="option"
              aria-selected={i === highlight}
              className="bl-tags__option"
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
      <p id={`${uid}-hint`} className="bl-tags__hint" data-error={error ? '' : undefined}>
        {error || hint}
      </p>
      <span className="bl-tags__sr" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
