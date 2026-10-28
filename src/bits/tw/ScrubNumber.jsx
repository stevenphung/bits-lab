import { useEffect, useId, useInsertionEffect, useRef, useState } from 'react';

const STYLE_ID = 'bl-scrub-number-tw';
const CSS = `
/* theme tokens */
.bl-scrub { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-scrub, .bl-scrub:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-scrub, :where(.light, [data-theme="light"]) .bl-scrub:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-scrub, .bl-scrub:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-accent: #167f8f; } }
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

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A number you can scrub. Drag the label left or right to change the value, like the fields in
// a design tool; a little pixel ruler slides under it while you drag. Hold Shift for big steps
// and Alt for fine ones. Or click into the field and type, or use the arrow keys. It's a real
// text input with a label, so forms and screen readers work as usual.

const decimalsOf = step => (String(step).split('.')[1] ?? '').length;

export default function ScrubNumber({
  value: controlled,
  defaultValue = 0,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  pixelsPerStep = 4,
  label = 'Value',
  handle,
  unit = '',
  width = 64,
  radius = 8,
  backgroundColor,
  chipColor,
  textColor,
  mutedColor,
  lineColor,
  accentColor,
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const id = useId();
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const decimals = decimalsOf(step);
  const [draft, setDraft] = useState(null);
  const [scrubbing, setScrubbing] = useState(false);
  const handleRef = useRef(null);
  const rootRef = useRef(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const commit = next => {
    const snapped = Math.round(next / step) * step;
    const v = Number(Math.max(min, Math.min(max, snapped)).toFixed(decimals));
    if (v === valueRef.current) return;
    if (controlled === undefined) setInner(v);
    onChange?.(v);
  };
  const commitRef = useRef(commit);
  commitRef.current = commit;

  useEffect(() => {
    const el = handleRef.current;
    const root = rootRef.current;
    let drag = null;
    const onDown = event => {
      if (event.button > 0) return;
      event.preventDefault();
      el.setPointerCapture?.(event.pointerId);
      drag = { x: event.clientX, from: valueRef.current };
      setScrubbing(true);
    };
    const onMove = event => {
      if (!drag) return;
      const dx = event.clientX - drag.x;
      // Shift for big steps, Alt for fine ones.
      const scale = event.shiftKey ? 10 : event.altKey ? 0.1 : 1;
      root.style.setProperty('--off', `${dx}px`);
      commitRef.current(drag.from + Math.round(dx / pixelsPerStep) * step * scale);
    };
    const onUp = () => {
      drag = null;
      setScrubbing(false);
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
    };
  }, [step, pixelsPerStep]);

  const finishTyping = () => {
    if (draft === null) return;
    const parsed = Number(draft.replace(',', '.'));
    if (Number.isFinite(parsed)) commit(parsed);
    setDraft(null);
  };

  return (
    <span
      ref={rootRef}
      className={`bl-scrub group/scrub relative inline-flex items-stretch overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) font-(family-name:--bl-font) text-[14px] text-(--bl-ink) shadow-[inset_0_0_0_1px_var(--bl-line)] focus-within:shadow-[inset_0_0_0_2px_var(--bl-accent)] ${className}`}
      data-scrubbing={scrubbing || undefined}
      style={{ '--bl-w': `${width}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-font': fontFamily, '--off': '0px', ...style }}
    >
      <label ref={handleRef} htmlFor={id} className="relative grid min-w-[30px] cursor-ew-resize touch-none place-items-center bg-(--bl-chip) px-2.5 py-0 font-bold text-(--bl-muted) select-none group-data-[scrubbing]/scrub:text-(--bl-accent)" title={`Drag to change ${label}`}>
        {handle ?? label}
      </label>
      <input
        id={id}
        className="m-0 w-(--bl-w) min-w-0 border-0 bg-transparent px-2.5 py-2 text-inherit tabular-nums outline-none"
        type="text"
        inputMode="decimal"
        role="spinbutton"
        aria-label={handle ? label : undefined}
        aria-valuenow={value}
        aria-valuemin={Number.isFinite(min) ? min : undefined}
        aria-valuemax={Number.isFinite(max) ? max : undefined}
        value={draft ?? value.toFixed(decimals)}
        onChange={event => setDraft(event.target.value)}
        onBlur={finishTyping}
        onKeyDown={event => {
          if (event.key === 'Enter') {
            finishTyping();
            event.currentTarget.select();
          } else if (event.key === 'Escape') setDraft(null);
          else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            setDraft(null);
            const scale = event.shiftKey ? 10 : event.altKey ? 0.1 : 1;
            commit(value + (event.key === 'ArrowUp' ? 1 : -1) * step * scale);
          }
        }}
      />
      {unit && (
        <span className="grid place-items-center pr-2.5 text-(--bl-muted)" aria-hidden="true">
          {unit}
        </span>
      )}
      <span className="pointer-events-none absolute right-0 bottom-0 left-0 h-[5px] bg-[repeating-linear-gradient(90deg,var(--bl-accent)_0_1px,transparent_1px_8px)] bg-[position:var(--off)_0] opacity-0 [transition:opacity_120ms] group-data-[scrubbing]/scrub:opacity-80" aria-hidden="true" />
    </span>
  );
}
