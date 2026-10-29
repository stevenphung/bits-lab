import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type InputHTMLAttributes, type ChangeEvent, type ButtonHTMLAttributes } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Switch, Checkbox and Radio with bouncy, tactile states. Each one is a real native input
// (visually hidden, still focusable), so forms, labels, keyboard and screen readers work
// exactly as they do for plain HTML; only the visuals are custom. The switch thumb stretches
// while pressed and springs across, the check mark draws itself, the radio dot pops in.
// Motion values match OverlayKit's MOTION tokens.

export type ToggleSize = 'sm' | 'md' | 'lg';

type InputRest = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'color' | 'checked' | 'defaultChecked' | 'onChange' | 'value' | 'name' | 'disabled' | 'className' | 'style'>;

interface ToggleBase {
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  size?: ToggleSize;
  /** Accent color for this control (sets --bl-tk-accent). */
  color?: string;
  /** Submitted with the form, like a plain input. */
  name?: string;
  value?: string;
  className?: string;
  style?: CSSProperties;
}

export interface SwitchProps extends ToggleBase, InputRest {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export interface CheckboxProps extends SwitchProps {
  /** Shows a dash; set for "some selected" parents. */
  indeterminate?: boolean;
}

export interface RadioProps extends ToggleBase, InputRest {
  checked?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}

export interface RadioOption {
  value: string;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options?: RadioOption[];
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  /** Rendered as the fieldset legend. */
  label?: ReactNode;
  name?: string;
  orientation?: 'vertical' | 'horizontal';
  size?: ToggleSize;
  color?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

const STYLE_ID = 'bl-toggle-kit';
const CSS = `
.bl-tk { --tk-accent: var(--bl-tk-accent, #73eff7); --tk-ink: var(--bl-tk-ink, #f4f4f4); --tk-muted: var(--bl-tk-muted, #94b0c2); --tk-track: var(--bl-tk-track, #333c57); --tk-on-ink: var(--bl-tk-on-ink, #1a1c2c); --tk-size: 22px; position: relative; display: inline-flex; align-items: flex-start; gap: 10px; color: var(--tk-ink); font-family: var(--bl-tk-font, ui-sans-serif, system-ui, sans-serif); font-size: 14px; line-height: 1.4; cursor: pointer; -webkit-tap-highlight-color: transparent; }
.bl-tk[data-size="sm"] { --tk-size: 18px; font-size: 13px; }
.bl-tk[data-size="lg"] { --tk-size: 26px; font-size: 15px; }
.bl-tk[data-disabled] { opacity: 0.45; cursor: not-allowed; }
.bl-tk__input { position: absolute; width: 1px; height: 1px; margin: 0; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; opacity: 0; }
.bl-tk__text { display: grid; gap: 2px; padding-top: calc((var(--tk-size) - 1.4em) / 2); }
.bl-tk__desc { color: var(--tk-muted); font-size: 0.92em; }
.bl-tk__input:focus-visible + .bl-tk__control { outline: 2px solid var(--tk-accent); outline-offset: 3px; }

/* Switch */
.bl-tk__switch { position: relative; flex: 0 0 auto; width: calc(var(--tk-size) * 1.8); height: var(--tk-size); border-radius: 999px; background: var(--tk-track); transition: background-color 220ms cubic-bezier(.2,.9,.25,1); }
.bl-tk__thumb { position: absolute; top: 3px; left: 3px; width: calc(var(--tk-size) - 6px); height: calc(var(--tk-size) - 6px); border-radius: 999px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.35); transition: left 320ms cubic-bezier(.3,1.35,.5,1), width 160ms cubic-bezier(.2,.9,.25,1); }
.bl-tk__input:checked + .bl-tk__switch { background: var(--tk-accent); }
.bl-tk__input:checked + .bl-tk__switch .bl-tk__thumb { left: calc(100% - var(--tk-size) + 3px); }
.bl-tk:active .bl-tk__input:not(:disabled) + .bl-tk__switch .bl-tk__thumb { width: calc(var(--tk-size) * 1.12); }
.bl-tk:active .bl-tk__input:checked:not(:disabled) + .bl-tk__switch .bl-tk__thumb { left: calc(100% - var(--tk-size) * 1.12 - 3px); }

/* Checkbox */
.bl-tk__box { position: relative; flex: 0 0 auto; display: grid; place-items: center; width: var(--tk-size); height: var(--tk-size); border-radius: calc(var(--tk-size) * 0.28); background: transparent; box-shadow: inset 0 0 0 2px var(--tk-track); color: var(--tk-on-ink); transition: background-color 160ms, box-shadow 160ms; animation: bl-tk-pop-off 260ms cubic-bezier(.3,1.35,.5,1); }
.bl-tk__box svg { width: 70%; height: 70%; overflow: visible; }
.bl-tk__check, .bl-tk__dash { fill: none; stroke: currentColor; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 220ms cubic-bezier(.2,.9,.25,1); }
.bl-tk__input:checked + .bl-tk__box, .bl-tk__input:indeterminate + .bl-tk__box { background: var(--tk-accent); box-shadow: inset 0 0 0 2px var(--tk-accent); animation: bl-tk-pop-on 320ms cubic-bezier(.3,1.35,.5,1); }
.bl-tk__input:checked:not(:indeterminate) + .bl-tk__box .bl-tk__check { stroke-dashoffset: 0; transition-delay: 60ms; }
.bl-tk__input:indeterminate + .bl-tk__box .bl-tk__dash { stroke-dashoffset: 0; }

/* Radio */
.bl-tk__radio { position: relative; flex: 0 0 auto; display: grid; place-items: center; width: var(--tk-size); height: var(--tk-size); border-radius: 50%; box-shadow: inset 0 0 0 2px var(--tk-track); transition: box-shadow 160ms; }
.bl-tk__dot { width: 45%; height: 45%; border-radius: 50%; background: var(--tk-accent); transform: scale(0); transition: transform 320ms cubic-bezier(.3,1.5,.5,1); }
.bl-tk__input:checked + .bl-tk__radio { box-shadow: inset 0 0 0 2px var(--tk-accent); }
.bl-tk__input:checked + .bl-tk__radio .bl-tk__dot { transform: scale(1); }
.bl-tk:active .bl-tk__input:not(:disabled) + .bl-tk__radio { transform: scale(0.9); }

.bl-tk-group { margin: 0; padding: 0; border: 0; font-family: var(--bl-tk-font, ui-sans-serif, system-ui, sans-serif); }
.bl-tk-group legend { margin-bottom: 10px; padding: 0; color: var(--bl-tk-muted, #94b0c2); font-size: 12px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; }
.bl-tk-group__list { display: flex; flex-direction: column; gap: 12px; }
.bl-tk-group[data-orientation="horizontal"] .bl-tk-group__list { flex-direction: row; flex-wrap: wrap; gap: 18px; }

/* Bell */
.bl-tk__bell { margin: 0; padding: 4px 10px 4px 4px; border: 0; border-radius: 10px; background: transparent; text-align: left; }
.bl-tk__bell:focus-visible { outline: 2px solid var(--tk-accent); outline-offset: 2px; }
.bl-tk__bell-icon { display: grid; place-items: center; flex: 0 0 auto; width: var(--tk-size); height: var(--tk-size); color: var(--tk-muted); transition: color 160ms; }
.bl-tk__bell[aria-pressed="true"] .bl-tk__bell-icon { color: var(--tk-accent); }
.bl-tk__bell-icon svg { width: 100%; height: 100%; overflow: visible; fill: currentColor; shape-rendering: crispEdges; transform-origin: 50% 8%; }
.bl-tk__bell[aria-pressed="true"] .bl-tk__bell-icon svg { animation: bl-tk-ring 720ms steps(8); }
.bl-tk__bell-waves { opacity: 0; }
.bl-tk__bell[aria-pressed="true"] .bl-tk__bell-waves { animation: bl-tk-waves 720ms steps(4); }
.bl-tk__bell[aria-pressed="true"] .bl-tk__bell-slash { display: none; }

@keyframes bl-tk-pop-on { 40% { transform: scale(0.82); } }
@keyframes bl-tk-pop-off { 40% { transform: scale(0.88); } }
@keyframes bl-tk-ring { 12% { transform: rotate(18deg); } 25% { transform: rotate(-16deg); } 38% { transform: rotate(12deg); } 50% { transform: rotate(-8deg); } 62% { transform: rotate(4deg); } 75% { transform: none; } }
@keyframes bl-tk-waves { 15%, 60% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .bl-tk__switch, .bl-tk__thumb, .bl-tk__check, .bl-tk__dash, .bl-tk__dot, .bl-tk__box, .bl-tk__radio, .bl-tk__bell-icon, .bl-tk__bell-icon svg, .bl-tk__bell-waves { transition: none; animation: none !important; }
}
/* light overrides */
:where(.light, [data-theme="light"]) .bl-tk, .bl-tk:where(.light, [data-theme="light"]) { --tk-accent: var(--bl-tk-accent, #167f8f); --tk-ink: var(--bl-tk-ink, #1a1c2c); --tk-muted: var(--bl-tk-muted, #566c86); --tk-track: var(--bl-tk-track, #cfc4ad); --tk-on-ink: var(--bl-tk-on-ink, #f4f1e8); }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-tk, :where(.light, [data-theme="light"]) .bl-tk:where(.dark, [data-theme="dark"]) { --tk-accent: var(--bl-tk-accent, #73eff7); --tk-ink: var(--bl-tk-ink, #f4f4f4); --tk-muted: var(--bl-tk-muted, #94b0c2); --tk-track: var(--bl-tk-track, #333c57); --tk-on-ink: var(--bl-tk-on-ink, #1a1c2c); }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-tk, .bl-tk:where([data-theme="system"]) { --tk-accent: var(--bl-tk-accent, #167f8f); --tk-ink: var(--bl-tk-ink, #1a1c2c); --tk-muted: var(--bl-tk-muted, #566c86); --tk-track: var(--bl-tk-track, #cfc4ad); --tk-on-ink: var(--bl-tk-on-ink, #f4f1e8); } }
:where(.light, [data-theme="light"]) .bl-tk-group legend, .bl-tk-group:where(.light, [data-theme="light"]) legend { color: var(--bl-tk-muted, #566c86); }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-tk-group legend, :where(.light, [data-theme="light"]) .bl-tk-group:where(.dark, [data-theme="dark"]) legend { color: var(--bl-tk-muted, #94b0c2); }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-tk-group legend, .bl-tk-group:where([data-theme="system"]) legend { color: var(--bl-tk-muted, #566c86); } }
/* light overrides end */
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

function useChecked(checked: boolean | undefined, defaultChecked: boolean | undefined, onCheckedChange: ((checked: boolean) => void) | undefined): [boolean, (next: boolean) => void] {
  const [inner, setInner] = useState(defaultChecked ?? false);
  const value = checked ?? inner;
  const set = (next: boolean) => {
    if (checked === undefined) setInner(next);
    onCheckedChange?.(next);
  };
  return [value, set];
}

const accentVars = (color?: string): CSSVars | null => (color ? { '--bl-tk-accent': color } : null);

function Label({ label, description, id }: { label?: ReactNode; description?: ReactNode; id: string }) {
  if (!label && !description) return null;
  return (
    <span className="bl-tk__text">
      {label && <span>{label}</span>}
      {description && (
        <span id={id} className="bl-tk__desc">
          {description}
        </span>
      )}
    </span>
  );
}

export function Switch({ checked, defaultChecked, onCheckedChange, label, description, disabled = false, size = 'md', color, name, value, className = '', style, ...rest }: SwitchProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [on, setOn] = useChecked(checked, defaultChecked, onCheckedChange);
  return (
    <label className={`bl-tk ${className}`} data-size={size} data-disabled={disabled || undefined} style={{ ...accentVars(color), ...style }}>
      <input
        {...rest}
        type="checkbox"
        role="switch"
        className="bl-tk__input"
        checked={on}
        disabled={disabled}
        name={name}
        value={value}
        aria-describedby={description ? `${uid}-desc` : undefined}
        onChange={event => setOn(event.target.checked)}
      />
      <span className="bl-tk__switch bl-tk__control" aria-hidden="true">
        <span className="bl-tk__thumb" />
      </span>
      <Label label={label} description={description} id={`${uid}-desc`} />
    </label>
  );
}

export function Checkbox({ checked, defaultChecked, onCheckedChange, indeterminate = false, label, description, disabled = false, size = 'md', color, name, value, className = '', style, ...rest }: CheckboxProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ref = useRef<HTMLInputElement>(null);
  const [on, setOn] = useChecked(checked, defaultChecked, onCheckedChange);
  // indeterminate is a DOM property, not an attribute.
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label className={`bl-tk ${className}`} data-size={size} data-disabled={disabled || undefined} style={{ ...accentVars(color), ...style }}>
      <input
        {...rest}
        ref={ref}
        type="checkbox"
        className="bl-tk__input"
        checked={on}
        disabled={disabled}
        name={name}
        value={value}
        aria-describedby={description ? `${uid}-desc` : undefined}
        onChange={event => setOn(event.target.checked)}
      />
      <span className="bl-tk__box bl-tk__control" aria-hidden="true">
        <svg viewBox="0 0 16 16">
          <path className="bl-tk__check" pathLength="1" d="M3 8.5 6.5 12 13 4.5" />
          <path className="bl-tk__dash" pathLength="1" d="M4 8h8" />
        </svg>
      </span>
      <Label label={label} description={description} id={`${uid}-desc`} />
    </label>
  );
}

export function Radio({ checked, onChange, label, description, disabled = false, size = 'md', color, name, value, className = '', style, ...rest }: RadioProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <label className={`bl-tk ${className}`} data-size={size} data-disabled={disabled || undefined} style={{ ...accentVars(color), ...style }}>
      <input
        {...rest}
        type="radio"
        className="bl-tk__input"
        checked={checked}
        disabled={disabled}
        name={name}
        value={value}
        aria-describedby={description ? `${uid}-desc` : undefined}
        onChange={onChange}
      />
      <span className="bl-tk__radio bl-tk__control" aria-hidden="true">
        <span className="bl-tk__dot" />
      </span>
      <Label label={label} description={description} id={`${uid}-desc`} />
    </label>
  );
}

export function RadioGroup({ options = [], value, defaultValue, onValueChange, label, name, orientation = 'vertical', size = 'md', color, disabled = false, className = '', style }: RadioGroupProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState<string | null>(defaultValue ?? null);
  const selected = value !== undefined ? value : inner;
  return (
    <fieldset className={`bl-tk-group ${className}`} data-orientation={orientation} disabled={disabled} style={{ ...accentVars(color), ...style }}>
      {label && <legend>{label}</legend>}
      <div className="bl-tk-group__list">
        {options.map(option => (
          <Radio
            key={option.value}
            name={name ?? `${uid}-radio`}
            value={option.value}
            label={option.label}
            description={option.description}
            disabled={option.disabled}
            size={size}
            checked={selected === option.value}
            onChange={() => {
              if (value === undefined) setInner(option.value);
              onValueChange?.(option.value);
            }}
          />
        ))}
      </div>
    </fieldset>
  );
}

export interface NotifyBellProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type' | 'style' | 'color'> {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  /** The button's name; shown beside the bell unless showLabel is false. */
  label?: string;
  showLabel?: boolean;
  disabled?: boolean;
  size?: ToggleSize;
  /** Accent colour when on. */
  color?: string;
  className?: string;
  style?: CSSProperties;
}

// ---------- NotifyBell ----------

// A notifications-style toggle: a pixel bell that rings when switched on and wears a slash
// when off. It's a toggle button (aria-pressed); the label is its name, shown or not.

// The slash across the bell when it's off: a staircase of pixels.
const SLASH = Array.from({ length: 10 }, (_, i) => i + 1);

export function NotifyBell({ pressed, defaultPressed, onPressedChange, label = 'Notifications', showLabel = true, disabled = false, size = 'md', color, className = '', style, ...rest }: NotifyBellProps) {
  useStyles();
  const [on, setOn] = useChecked(pressed, defaultPressed, onPressedChange);
  return (
    <button
      {...rest}
      type="button"
      className={`bl-tk bl-tk__bell ${className}`}
      aria-pressed={on}
      aria-label={showLabel ? undefined : label}
      disabled={disabled}
      data-size={size}
      data-disabled={disabled || undefined}
      onClick={() => setOn(!on)}
      style={{ ...accentVars(color), ...style }}
    >
      <span className="bl-tk__bell-icon" aria-hidden="true">
        <svg viewBox="0 0 12 12">
          <path d="M5 1h2v1h1v1h1v4h1v1h1v1H1V8h1V7h1V3h1V2h1zM5 10h2v1H5z" />
          <g className="bl-tk__bell-waves">
            <rect x="0" y="3" width="1" height="2" />
            <rect x="11" y="3" width="1" height="2" />
          </g>
          <g className="bl-tk__bell-slash">
            {SLASH.map(i => (
              <rect key={i} x={i} y={i} width="1" height="1" />
            ))}
          </g>
        </svg>
      </span>
      {showLabel && (
        <span className="bl-tk__text">
          <span>{label}</span>
        </span>
      )}
    </button>
  );
}

// The default export is the Switch; Checkbox, Radio, RadioGroup and NotifyBell are named exports.
export default Switch;
