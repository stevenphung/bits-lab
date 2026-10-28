import { useInsertionEffect, type ButtonHTMLAttributes, type CSSProperties, type MouseEvent, type ReactNode, type Ref } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Chunky 8-bit button: notched pixel border, bevel, press-down, loading pips and a cracked
// disabled state. A real <button>, so keyboard, focus and form behavior come for free.

const STYLE_ID = 'bl-pixel-button';
const CSS = `
.bl-pxbtn {
  --bl-face: #b13e53; --bl-text: #f4f4f4; --bl-ink: #0b0b14; --bl-px: 4px;
  position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  margin: var(--bl-px); border: 0; cursor: pointer; user-select: none;
  background: var(--bl-face); color: var(--bl-text);
  font-family: var(--bl-font, "Press Start 2P", ui-monospace, monospace); text-transform: uppercase; line-height: 1;
  box-shadow:
    0 calc(var(--bl-px) * -1) 0 0 var(--bl-ink), 0 var(--bl-px) 0 0 var(--bl-ink),
    calc(var(--bl-px) * -1) 0 0 0 var(--bl-ink), var(--bl-px) 0 0 0 var(--bl-ink),
    inset calc(var(--bl-px) * -1) calc(var(--bl-px) * -1) 0 0 rgba(11, 11, 20, 0.28),
    inset var(--bl-px) var(--bl-px) 0 0 rgba(255, 255, 255, 0.32),
    var(--bl-px) calc(var(--bl-px) * 2) 0 0 rgba(11, 11, 20, 0.5);
  transition: transform 60ms steps(1), filter 60ms steps(1);
}
.bl-pxbtn:hover:not(:disabled) { filter: brightness(1.12); }
.bl-pxbtn:active:not(:disabled), .bl-pxbtn[data-pressed] {
  transform: translateY(var(--bl-px));
  box-shadow:
    0 calc(var(--bl-px) * -1) 0 0 var(--bl-ink), 0 var(--bl-px) 0 0 var(--bl-ink),
    calc(var(--bl-px) * -1) 0 0 0 var(--bl-ink), var(--bl-px) 0 0 0 var(--bl-ink),
    inset var(--bl-px) var(--bl-px) 0 0 rgba(11, 11, 20, 0.3);
}
.bl-pxbtn:focus-visible { outline: var(--bl-px) solid #41a6f6; outline-offset: calc(var(--bl-px) * 2); }
.bl-pxbtn[data-size="sm"] { padding: 8px 12px; font-size: 8px; --bl-px: 3px; }
.bl-pxbtn[data-size="md"] { padding: 12px 18px; font-size: 11px; }
.bl-pxbtn[data-size="lg"] { padding: 16px 26px; font-size: 14px; --bl-px: 5px; }
.bl-pxbtn:disabled { cursor: not-allowed; filter: grayscale(0.85) brightness(0.8); }
.bl-pxbtn:disabled::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: repeating-linear-gradient(135deg, transparent 0 6px, rgba(11, 11, 20, 0.35) 6px 8px);
}
.bl-pxbtn__label { position: relative; }
.bl-pxbtn[data-loading] .bl-pxbtn__label { visibility: hidden; }
.bl-pxbtn__pips { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 6px; }
.bl-pxbtn__pips i { width: 6px; height: 6px; background: currentColor; animation: bl-pxbtn-pip 0.9s steps(1) infinite; }
.bl-pxbtn__pips i:nth-child(2) { animation-delay: 0.3s; }
.bl-pxbtn__pips i:nth-child(3) { animation-delay: 0.6s; }
@keyframes bl-pxbtn-pip { 0%, 100% { opacity: 0.25; } 33% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .bl-pxbtn { transition: none; }
  .bl-pxbtn__pips i { animation: none; opacity: 0.8; }
}
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const existing = document.getElementById(STYLE_ID);
    if (existing) {
      existing.textContent = CSS;
      return;
    }
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  }, []);
}

export type PixelButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'info';

const VARIANTS: Record<PixelButtonVariant, { face: string; text: string }> = {
  primary: { face: '#b13e53', text: '#f4f4f4' },
  secondary: { face: '#94b0c2', text: '#0b0b14' },
  success: { face: '#38b764', text: '#0b0b14' },
  warning: { face: '#ffcd75', text: '#0b0b14' },
  info: { face: '#41a6f6', text: '#0b0b14' }
};

export interface PixelButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  /** Preset face and text colors. */
  variant?: PixelButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  /** Custom face color; overrides the variant. */
  color?: string;
  /** Custom label color; overrides the variant. */
  textColor?: string;
  /** Shown before the label. */
  icon?: ReactNode;
  /** Shows loading pips, sets aria-busy and ignores clicks. */
  loading?: boolean;
  fontFamily?: string;
  /** Like onClick, but skipped while loading. */
  onPress?: (event: MouseEvent<HTMLButtonElement>) => void;
  ref?: Ref<HTMLButtonElement>;
}

export default function PixelButton({
  children,
  variant = 'primary',
  size = 'md',
  color,
  textColor,
  icon,
  loading = false,
  disabled = false,
  fontFamily,
  type = 'button',
  className = '',
  style,
  onPress,
  onClick,
  ref,
  ...rest
}: PixelButtonProps) {
  useStyles();
  const palette = VARIANTS[variant] ?? VARIANTS.primary;

  return (
    <button
      ref={ref}
      type={type}
      className={`bl-pxbtn ${className}`}
      data-size={size}
      data-loading={loading || undefined}
      disabled={disabled}
      aria-busy={loading || undefined}
      onClick={event => {
        if (loading) return;
        onClick?.(event);
        onPress?.(event);
      }}
      style={{
        '--bl-face': color ?? palette.face,
        '--bl-text': textColor ?? palette.text,
        ...(fontFamily ? { '--bl-font': fontFamily } : null),
        ...style
      } as CSSVars}
      {...rest}
    >
      <span className="bl-pxbtn__label" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        {icon}
        {children}
      </span>
      {loading && (
        <span className="bl-pxbtn__pips" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
      )}
    </button>
  );
}
