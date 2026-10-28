import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

// Click-to-edit text. The value reads as plain text with a pencil on hover; click it (or
// press Enter on it) and it turns into a field that grows and shrinks smoothly with what you
// type, with save and cancel buttons popping in beside it. Enter saves, Escape cancels, and
// blurring saves by default. onSave may return a promise (it shows "Saving…") or throw to
// reject the change; validate can block bad input with a message. Results are announced.

const STYLE_ID = 'bl-inline-edit';
const CSS = `
/* theme tokens */
.bl-ie { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-hover: rgba(255,255,255,0.07); --bl-field: #0b0b14; --bl-chip: #333c57; --bl-accent: #73eff7; --bl-on-accent: #0b0b14; --bl-error: #ef7d57; }
:where(.light, [data-theme="light"]) .bl-ie, .bl-ie:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-hover: rgba(26,28,44,0.07); --bl-field: #e2dacb; --bl-chip: #ddd4c0; --bl-accent: #167f8f; --bl-error: #c4502a; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-ie, :where(.light, [data-theme="light"]) .bl-ie:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-hover: rgba(255,255,255,0.07); --bl-field: #0b0b14; --bl-chip: #333c57; --bl-accent: #73eff7; --bl-on-accent: #0b0b14; --bl-error: #ef7d57; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-ie, .bl-ie:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-hover: rgba(26,28,44,0.07); --bl-field: #e2dacb; --bl-chip: #ddd4c0; --bl-accent: #167f8f; --bl-error: #c4502a; } }
/* theme tokens end */
.bl-ie { position: relative; display: inline-flex; align-items: center; gap: 6px; max-width: 100%; font-family: var(--bl-font); font-size: var(--bl-size); color: var(--bl-ink); vertical-align: middle; }
.bl-ie__box { position: relative; box-sizing: border-box; width: var(--bl-box-w); max-width: 100%; min-width: var(--bl-min-w); transition: width 200ms cubic-bezier(.3,1.2,.5,1); }
.bl-ie__display { display: flex; align-items: center; gap: 8px; box-sizing: border-box; width: 100%; padding: 6px 10px; border: 0; border-radius: var(--bl-radius); background: transparent; color: inherit; font: inherit; text-align: left; cursor: text; transition: background-color 150ms; }
.bl-ie__display:hover { background: var(--bl-hover); }
.bl-ie__display:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 1px; }
.bl-ie__text { overflow: hidden; white-space: pre; text-overflow: ellipsis; }
.bl-ie__text[data-empty] { color: var(--bl-muted); font-style: italic; }
.bl-ie__pencil { flex: none; display: grid; color: var(--bl-muted); opacity: 0; transition: opacity 150ms; }
.bl-ie__display:hover .bl-ie__pencil, .bl-ie__display:focus-visible .bl-ie__pencil { opacity: 1; }
.bl-ie__input { display: block; box-sizing: border-box; width: 100%; margin: 0; padding: 6px 10px; border: 0; border-radius: var(--bl-radius); background: var(--bl-field); color: inherit; font: inherit; box-shadow: inset 0 0 0 2px var(--bl-accent); outline: none; }
.bl-ie[data-invalid] .bl-ie__input { box-shadow: inset 0 0 0 2px var(--bl-error); animation: bl-ie-shake 320ms; }
.bl-ie[data-busy] .bl-ie__input { opacity: 0.7; }
.bl-ie__btn { display: grid; place-items: center; flex: none; width: 30px; height: 30px; padding: 0; border: 0; border-radius: 8px; background: var(--bl-chip); color: var(--bl-ink); cursor: pointer; animation: bl-ie-pop 260ms cubic-bezier(.3,1.6,.5,1) both; }
.bl-ie__btn + .bl-ie__btn { animation-delay: 50ms; }
.bl-ie__btn:hover { background: var(--bl-hover); }
.bl-ie__btn:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 1px; }
.bl-ie__btn[data-save] { background: var(--bl-accent); color: var(--bl-on-accent); }
.bl-ie__btn:disabled { cursor: progress; opacity: 0.6; }
.bl-ie__msg { position: absolute; top: calc(100% + 4px); left: 0; font-size: 12px; white-space: nowrap; color: var(--bl-muted); }
.bl-ie__msg[data-error] { color: var(--bl-error); }
.bl-ie__measure { position: absolute; top: 0; left: 0; visibility: hidden; padding: 0 10px; white-space: pre; pointer-events: none; }
.bl-ie__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-ie-pop { from { opacity: 0; transform: scale(0.4); } }
@keyframes bl-ie-shake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
@media (prefers-reduced-motion: reduce) { .bl-ie__box { transition: none; } .bl-ie__btn, .bl-ie[data-invalid] .bl-ie__input { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function InlineEdit({
  value: controlled,
  defaultValue = '',
  onSave,
  validate,
  placeholder = 'Click to edit',
  label = 'Text',
  saveOnBlur = true,
  maxLength,
  minWidth = 60,
  fontSize = 16,
  radius = 8,
  textColor,
  mutedColor,
  hoverColor,
  fieldColor,
  chipColor,
  accentColor,
  onAccentColor,
  errorColor,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [boxWidth, setBoxWidth] = useState(null);
  const inputRef = useRef(null);
  const displayRef = useRef(null);
  const measureRef = useRef(null);
  const rootRef = useRef(null);
  const refocus = useRef(false);

  const shown = editing ? draft : value;
  // Size the box to the text: the pencil (24px) only counts while not editing.
  useLayoutEffect(() => {
    const width = measureRef.current.getBoundingClientRect().width;
    setBoxWidth(Math.ceil(width + (editing ? 4 : 24)));
  }, [shown, placeholder, editing, fontSize, fontFamily]);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else if (refocus.current) {
      refocus.current = false;
      displayRef.current?.focus();
    }
  }, [editing]);

  const start = () => {
    setDraft(value);
    setError('');
    setEditing(true);
  };
  const cancel = (focusBack = true) => {
    refocus.current = focusBack;
    setEditing(false);
    setError('');
  };
  const save = async (focusBack = true) => {
    if (busy) return;
    const next = draft;
    if (next === value) {
      cancel(focusBack);
      return;
    }
    const problem = validate?.(next);
    if (problem) {
      setError(problem);
      setAnnounce(problem);
      inputRef.current?.focus();
      return;
    }
    try {
      const result = onSave?.(next);
      if (result && typeof result.then === 'function') {
        setBusy(true);
        setAnnounce('Saving…');
        await result;
      }
      if (controlled === undefined) setInner(next);
      setBusy(false);
      refocus.current = focusBack;
      setEditing(false);
      setError('');
      setAnnounce(`${label} saved: ${next || 'empty'}.`);
    } catch (err) {
      setBusy(false);
      const message = err?.message || "Couldn't save. Try again.";
      setError(message);
      setAnnounce(message);
      inputRef.current?.focus();
    }
  };

  const onBlur = event => {
    // Focus moving to our own save/cancel buttons isn't a blur of the editor.
    if (rootRef.current.contains(event.relatedTarget)) return;
    if (saveOnBlur) save(false);
    else cancel(false);
  };

  return (
    <span
      ref={rootRef}
      className={`bl-ie ${className}`}
      data-invalid={error || undefined}
      data-busy={busy || undefined}
      style={{ '--bl-size': `${fontSize}px`, '--bl-radius': `${radius}px`, '--bl-min-w': `${minWidth}px`, '--bl-box-w': boxWidth ? `${boxWidth}px` : 'auto', '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-hover': hoverColor, '--bl-field': fieldColor, '--bl-chip': chipColor, '--bl-accent': accentColor, '--bl-on-accent': onAccentColor, '--bl-error': errorColor, '--bl-font': fontFamily, ...style }}
    >
      <span className="bl-ie__box">
        {editing ? (
          <input
            ref={inputRef}
            className="bl-ie__input"
            value={draft}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-label={label}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${uid}-msg` : undefined}
            readOnly={busy}
            onChange={event => {
              setDraft(event.target.value);
              if (error) setError('');
            }}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                save();
              } else if (event.key === 'Escape') {
                event.preventDefault();
                cancel();
              }
            }}
            onBlur={onBlur}
          />
        ) : (
          <button ref={displayRef} type="button" className="bl-ie__display" aria-label={`Edit ${label}: ${value || 'empty'}`} onClick={start}>
            <span className="bl-ie__text" data-empty={value ? undefined : ''}>
              {value || placeholder}
            </span>
            <span className="bl-ie__pencil" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                <path d="M2 12l.6-2.8L9.8 2 12 4.2 4.8 11.4z" />
              </svg>
            </span>
          </button>
        )}
        <span ref={measureRef} className="bl-ie__measure" aria-hidden="true">
          {shown || placeholder}
        </span>
      </span>
      {editing && (
        <>
          <button type="button" className="bl-ie__btn" data-save="" aria-label="Save" disabled={busy} onClick={() => save()} onBlur={onBlur}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2.5 7.5l3 3 6-7" />
            </svg>
          </button>
          <button type="button" className="bl-ie__btn" aria-label="Cancel" disabled={busy} onClick={() => cancel()} onBlur={onBlur}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M2 2l8 8M10 2 2 10" />
            </svg>
          </button>
        </>
      )}
      {(error || busy) && (
        <span id={`${uid}-msg`} className="bl-ie__msg" data-error={error ? '' : undefined}>
          {error || 'Saving…'}
        </span>
      )}
      <span className="bl-ie__sr" aria-live="polite">
        {announce}
      </span>
    </span>
  );
}
