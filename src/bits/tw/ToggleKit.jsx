import { useEffect, useId, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Switch, Checkbox and Radio with bouncy, tactile states. Each one is a real native input
// (visually hidden, still focusable), so forms, labels, keyboard and screen readers work
// exactly as they do for plain HTML; only the visuals are custom. The switch thumb stretches
// while pressed and springs across, the check mark draws itself, the radio dot pops in.
// Motion values match OverlayKit's MOTION tokens.

const STYLE_ID = 'bl-toggle-kit-tw';
const CSS = `
@keyframes bl-tk-pop-on { 40% { transform: scale(0.82); } }
@keyframes bl-tk-pop-off { 40% { transform: scale(0.88); } }
@keyframes bl-tk-ring { 12% { transform: rotate(18deg); } 25% { transform: rotate(-16deg); } 38% { transform: rotate(12deg); } 50% { transform: rotate(-8deg); } 62% { transform: rotate(4deg); } 75% { transform: none; } }
@keyframes bl-tk-waves { 15%, 60% { opacity: 1; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

function useChecked(checked, defaultChecked, onCheckedChange) {
  const [inner, setInner] = useState(defaultChecked ?? false);
  const value = checked ?? inner;
  const set = next => {
    if (checked === undefined) setInner(next);
    onCheckedChange?.(next);
  };
  return [value, set];
}

const accentVars = color => (color ? { '--bl-tk-accent': color } : null);

function Label({ label, description, id }) {
  if (!label && !description) return null;
  return (
    <span className="grid gap-0.5 pt-[calc((var(--tk-size)_-_1.4em)/2)]">
      {label && <span>{label}</span>}
      {description && (
        <span id={id} className="text-[0.92em] text-(--tk-muted)">
          {description}
        </span>
      )}
    </span>
  );
}

export function Switch({ checked, defaultChecked, onCheckedChange, label, description, disabled = false, size = 'md', color, name, value, className = '', style, ...rest }) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [on, setOn] = useChecked(checked, defaultChecked, onCheckedChange);
  return (
    <label className={`group/tk relative inline-flex cursor-pointer items-start gap-2.5 [font-family:var(--bl-tk-font,ui-sans-serif,system-ui,sans-serif)] text-[14px] leading-[1.4] text-(--tk-ink) [-webkit-tap-highlight-color:transparent] [--tk-accent:var(--bl-tk-accent,#73eff7)] [--tk-ink:var(--bl-tk-ink,#f4f4f4)] [--tk-muted:var(--bl-tk-muted,#94b0c2)] [--tk-track:var(--bl-tk-track,#333c57)] [--tk-on-ink:var(--bl-tk-on-ink,#1a1c2c)] [--tk-size:22px] data-[size=sm]:text-[13px] data-[size=sm]:[--tk-size:18px] data-[size=lg]:text-[15px] data-[size=lg]:[--tk-size:26px] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45 ${className}`} data-size={size} data-disabled={disabled || undefined} style={{ ...accentVars(color), ...style }}>
      <input
        {...rest}
        type="checkbox"
        role="switch"
        className="peer/in absolute m-0 size-px overflow-hidden border-0 p-0 whitespace-nowrap opacity-0 [clip:rect(0_0_0_0)]"
        checked={on}
        disabled={disabled}
        name={name}
        value={value}
        aria-describedby={description ? `${uid}-desc` : undefined}
        onChange={event => setOn(event.target.checked)}
      />
      <span className="relative h-(--tk-size) w-[calc(var(--tk-size)*1.8)] flex-none rounded-full bg-(--tk-track) [transition:background-color_220ms_cubic-bezier(.2,.9,.25,1)] peer-checked/in:bg-(--tk-accent) peer-checked/in:*:left-[calc(100%_-_var(--tk-size)_+_3px)] group-active/tk:peer-enabled/in:*:w-[calc(var(--tk-size)*1.12)] group-active/tk:peer-enabled/in:peer-checked/in:*:left-[calc(100%_-_var(--tk-size)*1.12_-_3px)] peer-focus-visible/in:outline-2 peer-focus-visible/in:outline-offset-3 peer-focus-visible/in:outline-(--tk-accent) peer-focus-visible/in:outline-solid motion-reduce:[transition:none]" aria-hidden="true">
        <span className="absolute top-[3px] left-[3px] size-[calc(var(--tk-size)_-_6px)] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.35)] [transition:left_320ms_cubic-bezier(.3,1.35,.5,1),width_160ms_cubic-bezier(.2,.9,.25,1)] motion-reduce:[transition:none]" />
      </span>
      <Label label={label} description={description} id={`${uid}-desc`} />
    </label>
  );
}

export function Checkbox({ checked, defaultChecked, onCheckedChange, indeterminate = false, label, description, disabled = false, size = 'md', color, name, value, className = '', style, ...rest }) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ref = useRef(null);
  const [on, setOn] = useChecked(checked, defaultChecked, onCheckedChange);
  // indeterminate is a DOM property, not an attribute.
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label className={`group/tk relative inline-flex cursor-pointer items-start gap-2.5 [font-family:var(--bl-tk-font,ui-sans-serif,system-ui,sans-serif)] text-[14px] leading-[1.4] text-(--tk-ink) [-webkit-tap-highlight-color:transparent] [--tk-accent:var(--bl-tk-accent,#73eff7)] [--tk-ink:var(--bl-tk-ink,#f4f4f4)] [--tk-muted:var(--bl-tk-muted,#94b0c2)] [--tk-track:var(--bl-tk-track,#333c57)] [--tk-on-ink:var(--bl-tk-on-ink,#1a1c2c)] [--tk-size:22px] data-[size=sm]:text-[13px] data-[size=sm]:[--tk-size:18px] data-[size=lg]:text-[15px] data-[size=lg]:[--tk-size:26px] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45 ${className}`} data-size={size} data-disabled={disabled || undefined} style={{ ...accentVars(color), ...style }}>
      <input
        {...rest}
        ref={ref}
        type="checkbox"
        className="peer/in absolute m-0 size-px overflow-hidden border-0 p-0 whitespace-nowrap opacity-0 [clip:rect(0_0_0_0)]"
        checked={on}
        disabled={disabled}
        name={name}
        value={value}
        aria-describedby={description ? `${uid}-desc` : undefined}
        onChange={event => setOn(event.target.checked)}
      />
      <span className="relative grid size-(--tk-size) flex-none animate-[bl-tk-pop-off_260ms_cubic-bezier(.3,1.35,.5,1)] place-items-center rounded-[calc(var(--tk-size)*0.28)] bg-transparent text-(--tk-on-ink) shadow-[inset_0_0_0_2px_var(--tk-track)] [transition:background-color_160ms,box-shadow_160ms] [&_svg]:size-[70%] [&_svg]:overflow-visible peer-checked/in:animate-[bl-tk-pop-on_320ms_cubic-bezier(.3,1.35,.5,1)] peer-checked/in:bg-(--tk-accent) peer-checked/in:shadow-[inset_0_0_0_2px_var(--tk-accent)] peer-indeterminate/in:animate-[bl-tk-pop-on_320ms_cubic-bezier(.3,1.35,.5,1)] peer-indeterminate/in:bg-(--tk-accent) peer-indeterminate/in:shadow-[inset_0_0_0_2px_var(--tk-accent)] peer-[:checked:not(:indeterminate)]/in:[&_.tk-check]:[stroke-dashoffset:0] peer-[:checked:not(:indeterminate)]/in:[&_.tk-check]:[transition-delay:60ms] peer-indeterminate/in:[&_.tk-dash]:[stroke-dashoffset:0] peer-focus-visible/in:outline-2 peer-focus-visible/in:outline-offset-3 peer-focus-visible/in:outline-(--tk-accent) peer-focus-visible/in:outline-solid motion-reduce:animate-none! motion-reduce:[transition:none]" aria-hidden="true">
        <svg viewBox="0 0 16 16">
          <path className="tk-check fill-none stroke-current stroke-3 [stroke-dasharray:1] [stroke-dashoffset:1] [stroke-linecap:round] [stroke-linejoin:round] [transition:stroke-dashoffset_220ms_cubic-bezier(.2,.9,.25,1)] motion-reduce:[transition:none]" pathLength="1" d="M3 8.5 6.5 12 13 4.5" />
          <path className="tk-dash fill-none stroke-current stroke-3 [stroke-dasharray:1] [stroke-dashoffset:1] [stroke-linecap:round] [stroke-linejoin:round] [transition:stroke-dashoffset_220ms_cubic-bezier(.2,.9,.25,1)] motion-reduce:[transition:none]" pathLength="1" d="M4 8h8" />
        </svg>
      </span>
      <Label label={label} description={description} id={`${uid}-desc`} />
    </label>
  );
}

export function Radio({ checked, onChange, label, description, disabled = false, size = 'md', color, name, value, className = '', style, ...rest }) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <label className={`group/tk relative inline-flex cursor-pointer items-start gap-2.5 [font-family:var(--bl-tk-font,ui-sans-serif,system-ui,sans-serif)] text-[14px] leading-[1.4] text-(--tk-ink) [-webkit-tap-highlight-color:transparent] [--tk-accent:var(--bl-tk-accent,#73eff7)] [--tk-ink:var(--bl-tk-ink,#f4f4f4)] [--tk-muted:var(--bl-tk-muted,#94b0c2)] [--tk-track:var(--bl-tk-track,#333c57)] [--tk-on-ink:var(--bl-tk-on-ink,#1a1c2c)] [--tk-size:22px] data-[size=sm]:text-[13px] data-[size=sm]:[--tk-size:18px] data-[size=lg]:text-[15px] data-[size=lg]:[--tk-size:26px] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45 ${className}`} data-size={size} data-disabled={disabled || undefined} style={{ ...accentVars(color), ...style }}>
      <input
        {...rest}
        type="radio"
        className="peer/in absolute m-0 size-px overflow-hidden border-0 p-0 whitespace-nowrap opacity-0 [clip:rect(0_0_0_0)]"
        checked={checked}
        disabled={disabled}
        name={name}
        value={value}
        aria-describedby={description ? `${uid}-desc` : undefined}
        onChange={onChange}
      />
      <span className="relative grid size-(--tk-size) flex-none place-items-center rounded-[50%] shadow-[inset_0_0_0_2px_var(--tk-track)] [transition:box-shadow_160ms] peer-checked/in:shadow-[inset_0_0_0_2px_var(--tk-accent)] peer-checked/in:*:[transform:scale(1)] group-active/tk:peer-enabled/in:[transform:scale(0.9)] peer-focus-visible/in:outline-2 peer-focus-visible/in:outline-offset-3 peer-focus-visible/in:outline-(--tk-accent) peer-focus-visible/in:outline-solid motion-reduce:animate-none! motion-reduce:[transition:none]" aria-hidden="true">
        <span className="size-[45%] rounded-[50%] bg-(--tk-accent) [transform:scale(0)] [transition:transform_320ms_cubic-bezier(.3,1.5,.5,1)] motion-reduce:[transition:none]" />
      </span>
      <Label label={label} description={description} id={`${uid}-desc`} />
    </label>
  );
}

export function RadioGroup({ options = [], value, defaultValue, onValueChange, label, name, orientation = 'vertical', size = 'md', color, disabled = false, className = '', style }) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState(defaultValue ?? null);
  const selected = value !== undefined ? value : inner;
  return (
    <fieldset className={`group/tkg m-0 border-0 p-0 [font-family:var(--bl-tk-font,ui-sans-serif,system-ui,sans-serif)] [&_legend]:mb-2.5 [&_legend]:p-0 [&_legend]:text-[12px] [&_legend]:font-bold [&_legend]:tracking-[0.05em] [&_legend]:text-[var(--bl-tk-muted,#94b0c2)] [&_legend]:uppercase ${className}`} data-orientation={orientation} disabled={disabled} style={{ ...accentVars(color), ...style }}>
      {label && <legend>{label}</legend>}
      <div className="flex flex-col gap-3 group-data-[orientation=horizontal]/tkg:flex-row group-data-[orientation=horizontal]/tkg:flex-wrap group-data-[orientation=horizontal]/tkg:gap-[18px]">
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

// ---------- NotifyBell ----------

// A notifications-style toggle: a pixel bell that rings when switched on and wears a slash
// when off. It's a toggle button (aria-pressed); the label is its name, shown or not.

// The slash across the bell when it's off: a staircase of pixels.
const SLASH = Array.from({ length: 10 }, (_, i) => i + 1);

export function NotifyBell({ pressed, defaultPressed, onPressedChange, label = 'Notifications', showLabel = true, disabled = false, size = 'md', color, className = '', style, ...rest }) {
  useStyles();
  const [on, setOn] = useChecked(pressed, defaultPressed, onPressedChange);
  return (
    <button
      {...rest}
      type="button"
      className={`group/bell relative inline-flex cursor-pointer items-start gap-2.5 [font-family:var(--bl-tk-font,ui-sans-serif,system-ui,sans-serif)] text-[14px] leading-[1.4] text-(--tk-ink) [-webkit-tap-highlight-color:transparent] [--tk-accent:var(--bl-tk-accent,#73eff7)] [--tk-ink:var(--bl-tk-ink,#f4f4f4)] [--tk-muted:var(--bl-tk-muted,#94b0c2)] [--tk-track:var(--bl-tk-track,#333c57)] [--tk-on-ink:var(--bl-tk-on-ink,#1a1c2c)] [--tk-size:22px] data-[size=sm]:text-[13px] data-[size=sm]:[--tk-size:18px] data-[size=lg]:text-[15px] data-[size=lg]:[--tk-size:26px] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45 m-0 rounded-[10px] border-0 bg-transparent py-1 pr-2.5 pl-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--tk-accent) focus-visible:outline-solid ${className}`}
      aria-pressed={on}
      aria-label={showLabel ? undefined : label}
      disabled={disabled}
      data-size={size}
      data-disabled={disabled || undefined}
      onClick={() => setOn(!on)}
      style={{ ...accentVars(color), ...style }}
    >
      <span className="grid size-(--tk-size) flex-none place-items-center text-(--tk-muted) [transition:color_160ms] group-aria-pressed/bell:text-(--tk-accent) [&_svg]:h-full [&_svg]:w-full [&_svg]:origin-[50%_8%] [&_svg]:overflow-visible [&_svg]:fill-current [&_svg]:[shape-rendering:crispEdges] group-aria-pressed/bell:[&_svg]:animate-[bl-tk-ring_720ms_steps(8)] motion-reduce:[transition:none] motion-reduce:[&_svg]:animate-none!" aria-hidden="true">
        <svg viewBox="0 0 12 12">
          <path d="M5 1h2v1h1v1h1v4h1v1h1v1H1V8h1V7h1V3h1V2h1zM5 10h2v1H5z" />
          <g className="opacity-0 group-aria-pressed/bell:animate-[bl-tk-waves_720ms_steps(4)] motion-reduce:animate-none!">
            <rect x="0" y="3" width="1" height="2" />
            <rect x="11" y="3" width="1" height="2" />
          </g>
          <g className="group-aria-pressed/bell:hidden">
            {SLASH.map(i => (
              <rect key={i} x={i} y={i} width="1" height="1" />
            ))}
          </g>
        </svg>
      </span>
      {showLabel && (
        <span className="grid gap-0.5 pt-[calc((var(--tk-size)_-_1.4em)/2)]">
          <span>{label}</span>
        </span>
      )}
    </button>
  );
}

// The default export is the Switch; Checkbox, Radio, RadioGroup and NotifyBell are named exports.
export default Switch;
