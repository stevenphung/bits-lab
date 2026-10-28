import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent as ReactFocusEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Click-to-edit text. The value reads as plain text with a pencil on hover; click it (or
// press Enter on it) and it turns into a field that grows and shrinks smoothly with what you
// type, with save and cancel buttons popping in beside it. Enter saves, Escape cancels, and
// blurring saves by default. onSave may return a promise (it shows "Saving…") or throw to
// reject the change; validate can block bad input with a message. Results are announced.

const STYLE_ID = 'bl-inline-edit-tw';
const CSS = `
@keyframes bl-ie-pop { from { opacity: 0; transform: scale(0.4); } }
@keyframes bl-ie-shake { 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface InlineEditProps {
  value?: string;
  defaultValue?: string;
  /** Return a promise to show "Saving…"; throw (or reject) with a message to keep editing. */
  onSave?: (value: string) => void | Promise<unknown>;
  /** Return a message to block the save. */
  validate?: (value: string) => string | null | undefined;
  placeholder?: string;
  /** Accessible name of the field. */
  label?: string;
  /** Clicking away saves; false cancels instead. */
  saveOnBlur?: boolean;
  maxLength?: number;
  minWidth?: number;
  fontSize?: number;
  radius?: number;
  textColor?: string;
  mutedColor?: string;
  hoverColor?: string;
  fieldColor?: string;
  chipColor?: string;
  accentColor?: string;
  onAccentColor?: string;
  errorColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
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
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  hoverColor = 'rgba(255,255,255,0.07)',
  fieldColor = '#0b0b14',
  chipColor = '#333c57',
  accentColor = '#73eff7',
  onAccentColor = '#0b0b14',
  errorColor = '#ef7d57',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: InlineEditProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [announce, setAnnounce] = useState('');
  const [boxWidth, setBoxWidth] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const displayRef = useRef<HTMLButtonElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const refocus = useRef(false);

  const shown = editing ? draft : value;
  // Size the box to the text: the pencil (24px) only counts while not editing.
  useLayoutEffect(() => {
    const width = measureRef.current!.getBoundingClientRect().width;
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
      const result = onSave?.(next) as Promise<unknown> | undefined;
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
      const message = (err as Error)?.message || "Couldn't save. Try again.";
      setError(message);
      setAnnounce(message);
      inputRef.current?.focus();
    }
  };

  const onBlur = (event: ReactFocusEvent<HTMLElement>) => {
    // Focus moving to our own save/cancel buttons isn't a blur of the editor.
    if (rootRef.current!.contains(event.relatedTarget as Node | null)) return;
    if (saveOnBlur) save(false);
    else cancel(false);
  };

  return (
    <span
      ref={rootRef}
      className={`group/ie relative inline-flex max-w-full items-center gap-1.5 align-middle font-(family-name:--bl-font) text-(length:--bl-size) text-(--bl-ink) ${className}`}
      data-invalid={error || undefined}
      data-busy={busy || undefined}
      style={{ '--bl-size': `${fontSize}px`, '--bl-radius': `${radius}px`, '--bl-min-w': `${minWidth}px`, '--bl-box-w': boxWidth ? `${boxWidth}px` : 'auto', '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-hover': hoverColor, '--bl-field': fieldColor, '--bl-chip': chipColor, '--bl-accent': accentColor, '--bl-on-accent': onAccentColor, '--bl-error': errorColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <span className="relative box-border w-(--bl-box-w) max-w-full min-w-(--bl-min-w) [transition:width_200ms_cubic-bezier(.3,1.2,.5,1)] motion-reduce:[transition:none]">
        {editing ? (
          <input
            ref={inputRef}
            className="m-0 box-border block w-full rounded-(--bl-radius) border-0 bg-(--bl-field) px-2.5 py-1.5 text-inherit shadow-[inset_0_0_0_2px_var(--bl-accent)] outline-none group-data-[busy]/ie:opacity-70 group-data-[invalid]/ie:animate-[bl-ie-shake_320ms] group-data-[invalid]/ie:shadow-[inset_0_0_0_2px_var(--bl-error)] motion-reduce:group-data-[invalid]/ie:animate-none"
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
          <button ref={displayRef} type="button" className="group/disp box-border flex w-full cursor-text items-center gap-2 rounded-(--bl-radius) border-0 bg-transparent px-2.5 py-1.5 text-left text-inherit [transition:background-color_150ms] hover:bg-(--bl-hover) focus-visible:outline-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid focus-visible:outline-offset-1" aria-label={`Edit ${label}: ${value || 'empty'}`} onClick={start}>
            <span className="overflow-hidden text-ellipsis whitespace-pre data-[empty]:text-(--bl-muted) data-[empty]:italic" data-empty={value ? undefined : ''}>
              {value || placeholder}
            </span>
            <span className="grid flex-none text-(--bl-muted) opacity-0 [transition:opacity_150ms] group-hover/disp:opacity-100 group-focus-visible/disp:opacity-100" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                <path d="M2 12l.6-2.8L9.8 2 12 4.2 4.8 11.4z" />
              </svg>
            </span>
          </button>
        )}
        <span ref={measureRef} className="pointer-events-none invisible absolute top-0 left-0 px-2.5 py-0 whitespace-pre" aria-hidden="true">
          {shown || placeholder}
        </span>
      </span>
      {editing && (
        <>
          <button type="button" className="grid size-[30px] flex-none animate-[bl-ie-pop_260ms_cubic-bezier(.3,1.6,.5,1)_both] cursor-pointer place-items-center rounded-[8px] border-0 p-0 focus-visible:outline-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid focus-visible:outline-offset-1 disabled:cursor-progress disabled:opacity-60 motion-reduce:animate-none bg-(--bl-accent) text-(--bl-on-accent)" data-save="" aria-label="Save" disabled={busy} onClick={() => save()} onBlur={onBlur}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2.5 7.5l3 3 6-7" />
            </svg>
          </button>
          <button type="button" className="grid size-[30px] flex-none animate-[bl-ie-pop_260ms_cubic-bezier(.3,1.6,.5,1)_both] cursor-pointer place-items-center rounded-[8px] border-0 p-0 focus-visible:outline-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid focus-visible:outline-offset-1 disabled:cursor-progress disabled:opacity-60 motion-reduce:animate-none bg-(--bl-chip) text-(--bl-ink) [animation-delay:50ms] hover:bg-(--bl-hover)" aria-label="Cancel" disabled={busy} onClick={() => cancel()} onBlur={onBlur}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M2 2l8 8M10 2 2 10" />
            </svg>
          </button>
        </>
      )}
      {(error || busy) && (
        <span id={`${uid}-msg`} className="absolute top-[calc(100%_+_4px)] left-0 text-[12px] whitespace-nowrap text-(--bl-muted) data-[error]:text-(--bl-error)" data-error={error ? '' : undefined}>
          {error || 'Saving…'}
        </span>
      )}
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </span>
  );
}
