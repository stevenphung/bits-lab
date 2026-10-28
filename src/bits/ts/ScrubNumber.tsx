import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A number you can scrub. Drag the label left or right to change the value, like the fields in
// a design tool; a little pixel ruler slides under it while you drag. Hold Shift for big steps
// and Alt for fine ones. Or click into the field and type, or use the arrow keys. It's a real
// text input with a label, so forms and screen readers work as usual.

const STYLE_ID = 'bl-scrub-number';
const CSS = `
.bl-scrub { position: relative; display: inline-flex; align-items: stretch; overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); font-size: 14px; box-shadow: inset 0 0 0 1px var(--bl-line); }
.bl-scrub:focus-within { box-shadow: inset 0 0 0 2px var(--bl-accent); }
.bl-scrub__handle { position: relative; display: grid; place-items: center; min-width: 30px; padding: 0 10px; background: var(--bl-chip); color: var(--bl-muted); font-weight: 700; cursor: ew-resize; user-select: none; touch-action: none; }
.bl-scrub[data-scrubbing] .bl-scrub__handle { color: var(--bl-accent); }
.bl-scrub__input { width: var(--bl-w); min-width: 0; margin: 0; padding: 8px 10px; border: 0; background: transparent; color: inherit; font: inherit; font-variant-numeric: tabular-nums; outline: none; }
.bl-scrub__unit { display: grid; place-items: center; padding-right: 10px; color: var(--bl-muted); }
.bl-scrub__ruler { position: absolute; left: 0; right: 0; bottom: 0; height: 5px; background: repeating-linear-gradient(90deg, var(--bl-accent) 0 1px, transparent 1px 8px); background-position: var(--off) 0; opacity: 0; pointer-events: none; transition: opacity 120ms; }
.bl-scrub[data-scrubbing] .bl-scrub__ruler { opacity: 0.8; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const decimalsOf = (step: number) => (String(step).split('.')[1] ?? '').length;

export interface ScrubNumberProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  /** Step; decimals follow it. */
  step?: number;
  /** Drag distance per step; Shift ×10, Alt ×0.1. */
  pixelsPerStep?: number;
  /** Accessible name. */
  label?: string;
  /** What the drag handle shows (defaults to the label). */
  handle?: ReactNode;
  unit?: string;
  width?: number;
  radius?: number;
  backgroundColor?: string;
  chipColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

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
  backgroundColor = '#1a1c2c',
  chipColor = '#262b44',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = '#333c57',
  accentColor = '#73eff7',
  fontFamily = 'inherit',
  className = '',
  style
}: ScrubNumberProps) {
  useStyles();
  const id = useId();
  const [inner, setInner] = useState(defaultValue);
  const value = controlled ?? inner;
  const decimals = decimalsOf(step);
  const [draft, setDraft] = useState<string | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const handleRef = useRef<HTMLLabelElement>(null);
  const rootRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  const commit = (next: number) => {
    const snapped = Math.round(next / step) * step;
    const v = Number(Math.max(min, Math.min(max, snapped)).toFixed(decimals));
    if (v === valueRef.current) return;
    if (controlled === undefined) setInner(v);
    onChange?.(v);
  };
  const commitRef = useRef(commit);
  commitRef.current = commit;

  useEffect(() => {
    const el = handleRef.current!;
    const root = rootRef.current!;
    let drag: { x: number; from: number } | null = null;
    const onDown = (event: PointerEvent) => {
      if (event.button > 0) return;
      event.preventDefault();
      el.setPointerCapture?.(event.pointerId);
      drag = { x: event.clientX, from: valueRef.current };
      setScrubbing(true);
    };
    const onMove = (event: PointerEvent) => {
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
      className={`bl-scrub ${className}`}
      data-scrubbing={scrubbing || undefined}
      style={{ '--bl-w': `${width}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-font': fontFamily, '--off': '0px', ...style } as CSSVars}
    >
      <label ref={handleRef} htmlFor={id} className="bl-scrub__handle" title={`Drag to change ${label}`}>
        {handle ?? label}
      </label>
      <input
        id={id}
        className="bl-scrub__input"
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
        <span className="bl-scrub__unit" aria-hidden="true">
          {unit}
        </span>
      )}
      <span className="bl-scrub__ruler" aria-hidden="true" />
    </span>
  );
}
