import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// One-time code input. A single real <input> sits over the cells, so paste, SMS autofill
// (autocomplete="one-time-code"), mobile keyboards and screen readers all just work.
// Set status="error" to shake and turn red, status="success" to fuse the cells into one
// confirmed pill.

const STYLE_ID = 'bl-otp-tw';
const CSS = `
@keyframes bl-otp-pop { from { transform: scale(0.5); opacity: 0; } }
@keyframes bl-otp-blink { 50% { opacity: 0; } }
@keyframes bl-otp-shake { 10%, 90% { transform: translateX(-2px); } 20%, 80% { transform: translateX(4px); } 30%, 50%, 70% { transform: translateX(-7px); } 40%, 60% { transform: translateX(7px); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const PATTERNS: Record<'numeric' | 'alphanumeric', RegExp> = { numeric: /[^0-9]/g, alphanumeric: /[^0-9a-z]/gi };

export interface OTPInputProps {
  /** Number of characters. */
  length?: number;
  /** Controlled code. */
  value?: string;
  defaultValue?: string;
  onChange?: (code: string) => void;
  /** Called once per complete code (typed, pasted or autofilled). */
  onComplete?: (code: string) => void;
  /** error shakes and turns red (reset it on the next change); success fuses the cells and locks the input. */
  status?: 'idle' | 'error' | 'success';
  /** Line under the cells; announced as an alert on error. */
  message?: ReactNode;
  /** Allowed characters; alphanumeric is uppercased. */
  type?: 'numeric' | 'alphanumeric';
  /** Hide the characters. */
  mask?: boolean;
  /** Separator every N cells; 0 for none. */
  groupSize?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  /** Accessible name of the input. */
  label?: string;
  cellWidth?: number;
  cellHeight?: number;
  gap?: number;
  radius?: number;
  borderWidth?: number;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  filledLineColor?: string;
  accentColor?: string;
  errorColor?: string;
  successColor?: string;
  successTextColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function OTPInput({
  length = 6,
  value,
  defaultValue = '',
  onChange,
  onComplete,
  status = 'idle',
  message,
  type = 'numeric',
  mask = false,
  groupSize = 3,
  autoFocus = false,
  disabled = false,
  label = 'One-time code',
  cellWidth = 48,
  cellHeight = 58,
  gap = 8,
  radius = 12,
  borderWidth = 1.5,
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = 'rgba(255,255,255,0.14)',
  filledLineColor = 'rgba(255,255,255,0.32)',
  accentColor = '#73eff7',
  errorColor = '#ef7d57',
  successColor = '#38b764',
  successTextColor = '#0b0b14',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: OTPInputProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const inputRef = useRef<HTMLInputElement>(null);
  const [inner, setInner] = useState(defaultValue);
  const [focused, setFocused] = useState(false);
  const code = (value ?? inner).slice(0, length);
  const lastComplete = useRef('');

  const clean = (raw: string) => {
    const filtered = raw.replace(PATTERNS[type] ?? PATTERNS.numeric, '');
    return (type === 'alphanumeric' ? filtered.toUpperCase() : filtered).slice(0, length);
  };

  const update = (next: string) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  // Fire onComplete once per distinct full code (typing, paste or autofill).
  useEffect(() => {
    if (code.length === length && code !== lastComplete.current) {
      lastComplete.current = code;
      onComplete?.(code);
    }
    if (code.length < length) lastComplete.current = '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, length]);

  // After an error, select everything so the next keystroke replaces the code.
  useEffect(() => {
    if (status === 'error') inputRef.current?.select();
  }, [status]);

  const active = Math.min(code.length, length - 1);
  const cells = Array.from({ length }, (_, i) => i);

  return (
    <div
      className={`group/otp relative inline-flex max-w-full flex-col items-center gap-2.5 font-(family-name:--bl-font) data-[disabled]:opacity-55 ${className}`}
      data-status={status}
      data-focused={focused || undefined}
      data-disabled={disabled || undefined}
      style={{
        '--bl-w': `${cellWidth}px`,
        '--bl-h': `${cellHeight}px`,
        '--bl-gap': `${gap}px`,
        '--bl-radius': `${radius}px`,
        '--bl-border': `${borderWidth}px`,
        '--bl-bg': backgroundColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-line': lineColor,
        '--bl-line-filled': filledLineColor,
        '--bl-accent': accentColor,
        '--bl-ring': `color-mix(in srgb, ${accentColor} 25%, transparent)`,
        '--bl-error': errorColor,
        '--bl-success': successColor,
        '--bl-success-ink': successTextColor,
        '--bl-font': fontFamily,
        ...style
      } as CSSVars}
    >
      <div className="relative flex max-w-full items-center gap-(--bl-gap) [transition:gap_320ms_cubic-bezier(.2,.9,.25,1)] group-data-[status=error]/otp:animate-[bl-otp-shake_420ms_cubic-bezier(.36,.07,.19,.97)] group-data-[status=success]/otp:gap-0 motion-reduce:[transition:none] motion-reduce:group-data-[status=error]/otp:animate-none">
        {cells.map(i => (
          <span key={i} style={{ display: 'contents' }}>
            {groupSize > 0 && i > 0 && i % groupSize === 0 && <span className="h-0.5 w-2.5 rounded-[1px] bg-(--bl-line-filled) [transition:width_320ms,opacity_200ms] group-data-[status=success]/otp:w-0 group-data-[status=success]/otp:opacity-0 motion-reduce:[transition:none]" aria-hidden="true" />}
            <span className="relative grid h-(--bl-h) w-(--bl-w) min-w-[22px] flex-[0_1_var(--bl-w)] place-items-center rounded-(--bl-radius) bg-(--bl-bg) [font-size:calc(var(--bl-h)*0.42)] font-bold text-(--bl-ink) tabular-nums shadow-[inset_0_0_0_var(--bl-border)_var(--bl-line)] [transition:box-shadow_160ms,background-color_200ms,border-radius_320ms_cubic-bezier(.2,.9,.25,1),transform_160ms] data-[filled]:shadow-[inset_0_0_0_var(--bl-border)_var(--bl-line-filled)] group-data-[focused]/otp:data-[active]:shadow-[inset_0_0_0_calc(var(--bl-border)_+_1px)_var(--bl-accent),0_0_0_4px_var(--bl-ring)] group-data-[status=error]/otp:text-(--bl-error) group-data-[status=error]/otp:shadow-[inset_0_0_0_calc(var(--bl-border)_+_1px)_var(--bl-error)] group-data-[status=error]/otp:data-[filled]:shadow-[inset_0_0_0_calc(var(--bl-border)_+_1px)_var(--bl-error)] group-data-[status=success]/otp:rounded-none group-data-[status=success]/otp:bg-(--bl-success) group-data-[status=success]/otp:text-(--bl-success-ink) group-data-[status=success]/otp:shadow-none group-data-[status=success]/otp:data-[filled]:shadow-none group-data-[status=success]/otp:data-[edge=first]:rounded-[var(--bl-radius)_0_0_var(--bl-radius)] group-data-[status=success]/otp:data-[edge=last]:rounded-[0_var(--bl-radius)_var(--bl-radius)_0] motion-reduce:[transition:none]" data-edge={i === 0 ? 'first' : i === length - 1 ? 'last' : undefined} data-filled={i < code.length || undefined} data-active={i === active && code.length < length ? '' : undefined} aria-hidden="true">
              {i < code.length ? (
                <span key={code[i] + i} className="animate-[bl-otp-pop_160ms_cubic-bezier(.2,.9,.25,1.4)] motion-reduce:animate-none">
                  {mask ? '•' : code[i]}
                </span>
              ) : (
                focused && i === code.length && <span className="h-[42%] w-0.5 animate-[bl-otp-blink_1s_steps(1)_infinite] bg-(--bl-accent) motion-reduce:animate-none" />
              )}
            </span>
          </span>
        ))}
        <span className="absolute top-1/2 -right-3.5 grid size-7 place-items-center rounded-[50%] bg-(--bl-success) text-(--bl-success-ink) [transform:translate(100%,-50%)_scale(0)] [transition:transform_300ms_cubic-bezier(.2,.9,.25,1.5)_200ms] group-data-[status=success]/otp:[transform:translate(100%,-50%)_scale(1)] motion-reduce:[transition:none]" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 7.5 5.5 10.5 11.5 3.5" />
          </svg>
        </span>
        <input
          ref={inputRef}
          className="absolute inset-0 m-0 h-full w-full cursor-text border-0 bg-transparent p-0 text-[16px] tracking-normal text-transparent caret-transparent opacity-[0.001] outline-none disabled:cursor-not-allowed"
          value={code}
          onChange={event => update(clean(event.target.value))}
          onFocus={event => {
            setFocused(true);
            // Keep the caret at the end; cells are filled left to right.
            const end = event.target.value.length;
            event.target.setSelectionRange(end, end);
          }}
          onBlur={() => setFocused(false)}
          inputMode={type === 'numeric' ? 'numeric' : 'text'}
          autoComplete="one-time-code"
          autoCapitalize={type === 'alphanumeric' ? 'characters' : 'off'}
          autoCorrect="off"
          spellCheck={false}
          autoFocus={autoFocus}
          maxLength={length}
          pattern={type === 'numeric' ? `[0-9]{${length}}` : undefined}
          disabled={disabled || status === 'success'}
          type={mask ? 'password' : 'text'}
          aria-label={label}
          aria-invalid={status === 'error' || undefined}
          aria-describedby={message ? `${uid}-msg` : undefined}
        />
      </div>
      {message !== undefined && (
        <p id={`${uid}-msg`} className="m-0 min-h-[1.3em] text-[13px] text-(--bl-muted) group-data-[status=error]/otp:text-(--bl-error) group-data-[status=success]/otp:text-(--bl-success)" role={status === 'error' ? 'alert' : 'status'}>
          {message}
        </p>
      )}
    </div>
  );
}
