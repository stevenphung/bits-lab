import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// One-time code input. A single real <input> sits over the cells, so paste, SMS autofill
// (autocomplete="one-time-code"), mobile keyboards and screen readers all just work.
// Set status="error" to shake and turn red, status="success" to fuse the cells into one
// confirmed pill.

const STYLE_ID = 'bl-otp';
const CSS = `
.bl-otp { position: relative; display: inline-flex; max-width: 100%; flex-direction: column; align-items: center; gap: 10px; font-family: var(--bl-font); }
.bl-otp__cells { position: relative; display: flex; max-width: 100%; align-items: center; gap: var(--bl-gap); transition: gap 320ms cubic-bezier(.2,.9,.25,1); }
.bl-otp__cell { position: relative; display: grid; place-items: center; flex: 0 1 var(--bl-w); width: var(--bl-w); min-width: 22px; height: var(--bl-h); border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); font-size: calc(var(--bl-h) * 0.42); font-weight: 700; font-variant-numeric: tabular-nums; box-shadow: inset 0 0 0 var(--bl-border) var(--bl-line); transition: box-shadow 160ms, background-color 200ms, border-radius 320ms cubic-bezier(.2,.9,.25,1), transform 160ms; }
.bl-otp__cell[data-filled] { box-shadow: inset 0 0 0 var(--bl-border) var(--bl-line-filled); }
.bl-otp[data-focused] .bl-otp__cell[data-active] { box-shadow: inset 0 0 0 calc(var(--bl-border) + 1px) var(--bl-accent), 0 0 0 4px var(--bl-ring); }
.bl-otp__char { animation: bl-otp-pop 160ms cubic-bezier(.2,.9,.25,1.4); }
.bl-otp__caret { width: 2px; height: 42%; background: var(--bl-accent); animation: bl-otp-blink 1s steps(1) infinite; }
.bl-otp__sep { width: 10px; height: 2px; border-radius: 1px; background: var(--bl-line-filled); transition: width 320ms, opacity 200ms; }
.bl-otp__input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; background: transparent; color: transparent; caret-color: transparent; font-size: 16px; letter-spacing: 0; outline: none; cursor: text; opacity: 0.001; }
.bl-otp__input:disabled { cursor: not-allowed; }
.bl-otp[data-status="error"] .bl-otp__cells { animation: bl-otp-shake 420ms cubic-bezier(.36,.07,.19,.97); }
.bl-otp[data-status="error"] .bl-otp__cell { box-shadow: inset 0 0 0 calc(var(--bl-border) + 1px) var(--bl-error); color: var(--bl-error); }
.bl-otp[data-status="success"] .bl-otp__cells { gap: 0; }
.bl-otp[data-status="success"] .bl-otp__sep { width: 0; opacity: 0; }
.bl-otp[data-status="success"] .bl-otp__cell { background: var(--bl-success); color: var(--bl-success-ink); box-shadow: none; border-radius: 0; }
.bl-otp[data-status="success"] .bl-otp__cell[data-edge="first"] { border-radius: var(--bl-radius) 0 0 var(--bl-radius); }
.bl-otp[data-status="success"] .bl-otp__cell[data-edge="last"] { border-radius: 0 var(--bl-radius) var(--bl-radius) 0; }
.bl-otp__check { position: absolute; right: -14px; top: 50%; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--bl-success); color: var(--bl-success-ink); transform: translate(100%, -50%) scale(0); transition: transform 300ms cubic-bezier(.2,.9,.25,1.5) 200ms; }
.bl-otp[data-status="success"] .bl-otp__check { transform: translate(100%, -50%) scale(1); }
.bl-otp[data-disabled] { opacity: 0.55; }
.bl-otp__message { min-height: 1.3em; margin: 0; color: var(--bl-muted); font-size: 13px; }
.bl-otp[data-status="error"] .bl-otp__message { color: var(--bl-error); }
.bl-otp[data-status="success"] .bl-otp__message { color: var(--bl-success); }
@keyframes bl-otp-pop { from { transform: scale(0.5); opacity: 0; } }
@keyframes bl-otp-blink { 50% { opacity: 0; } }
@keyframes bl-otp-shake { 10%, 90% { transform: translateX(-2px); } 20%, 80% { transform: translateX(4px); } 30%, 50%, 70% { transform: translateX(-7px); } 40%, 60% { transform: translateX(7px); } }
@media (prefers-reduced-motion: reduce) {
  .bl-otp__cells, .bl-otp__cell, .bl-otp__sep, .bl-otp__check { transition: none; }
  .bl-otp__char, .bl-otp__caret, .bl-otp[data-status="error"] .bl-otp__cells { animation: none; }
}
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
      className={`bl-otp ${className}`}
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
      <div className="bl-otp__cells">
        {cells.map(i => (
          <span key={i} style={{ display: 'contents' }}>
            {groupSize > 0 && i > 0 && i % groupSize === 0 && <span className="bl-otp__sep" aria-hidden="true" />}
            <span className="bl-otp__cell" data-edge={i === 0 ? 'first' : i === length - 1 ? 'last' : undefined} data-filled={i < code.length || undefined} data-active={i === active && code.length < length ? '' : undefined} aria-hidden="true">
              {i < code.length ? (
                <span key={code[i] + i} className="bl-otp__char">
                  {mask ? '•' : code[i]}
                </span>
              ) : (
                focused && i === code.length && <span className="bl-otp__caret" />
              )}
            </span>
          </span>
        ))}
        <span className="bl-otp__check" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 7.5 5.5 10.5 11.5 3.5" />
          </svg>
        </span>
        <input
          ref={inputRef}
          className="bl-otp__input"
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
        <p id={`${uid}-msg`} className="bl-otp__message" role={status === 'error' ? 'alert' : 'status'}>
          {message}
        </p>
      )}
    </div>
  );
}
