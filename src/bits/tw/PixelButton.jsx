import { useInsertionEffect } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Chunky 8-bit button: notched pixel border, bevel, press-down, loading pips with a shimmer and
// a cracked disabled state. Variants include ghost (outline only, inherits the text colour) and
// destructive (hazard stripes on hover); an icon with no label makes a square icon button, which
// needs an aria-label. A real <button>, so keyboard, focus and form behavior come for free.

const STYLE_ID = 'bl-pixel-button-tw';
const CSS = `
@keyframes bl-pxbtn-pip { 0%, 100% { opacity: 0.25; } 33% { opacity: 1; } }
@keyframes bl-pxbtn-shine { to { transform: translateX(350%); } }
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

const VARIANTS = {
  primary: { face: '#b13e53', text: '#f4f4f4' },
  secondary: { face: '#94b0c2', text: '#0b0b14' },
  success: { face: '#38b764', text: '#0b0b14' },
  warning: { face: '#ffcd75', text: '#0b0b14' },
  info: { face: '#41a6f6', text: '#0b0b14' },
  destructive: { face: '#ef7d57', text: '#0b0b14' },
  ghost: { face: 'transparent', text: 'currentColor' }
};

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
}) {
  useStyles();
  const palette = VARIANTS[variant] ?? VARIANTS.primary;
  const iconOnly = Boolean(icon) && (children === undefined || children === null || children === false);

  return (
    <button
      ref={ref}
      type={type}
      className={`group/pxbtn relative m-(--bl-px) inline-flex cursor-pointer items-center justify-center gap-2.5 select-none bg-(--bl-face) [font-family:var(--bl-font,'Press_Start_2P',ui-monospace,monospace)] leading-none text-(--bl-text) uppercase [--bl-ink:#0b0b14] [--bl-px:4px] [--bl-raised:0_calc(var(--bl-px)*-1)_0_0_var(--bl-ink),0_var(--bl-px)_0_0_var(--bl-ink),calc(var(--bl-px)*-1)_0_0_0_var(--bl-ink),var(--bl-px)_0_0_0_var(--bl-ink),inset_calc(var(--bl-px)*-1)_calc(var(--bl-px)*-1)_0_0_rgba(11,11,20,0.28),inset_var(--bl-px)_var(--bl-px)_0_0_rgba(255,255,255,0.32),var(--bl-px)_calc(var(--bl-px)*2)_0_0_rgba(11,11,20,0.5)] [--bl-sunk:0_calc(var(--bl-px)*-1)_0_0_var(--bl-ink),0_var(--bl-px)_0_0_var(--bl-ink),calc(var(--bl-px)*-1)_0_0_0_var(--bl-ink),var(--bl-px)_0_0_0_var(--bl-ink),inset_var(--bl-px)_var(--bl-px)_0_0_rgba(11,11,20,0.3)] shadow-(--bl-raised) transition-[translate,filter] duration-60 ease-[steps(1)] motion-reduce:transition-none hover:not-disabled:[filter:brightness(1.12)] active:not-disabled:translate-y-(--bl-px) active:not-disabled:shadow-(--bl-sunk) data-[pressed]:translate-y-(--bl-px) data-[pressed]:shadow-(--bl-sunk) focus-visible:outline-(length:--bl-px) focus-visible:outline-offset-[calc(var(--bl-px)*2)] focus-visible:outline-[#41a6f6] focus-visible:outline-solid data-[size=sm]:px-3 data-[size=sm]:py-2 data-[size=sm]:text-[8px] data-[size=sm]:[--bl-px:3px] data-[size=md]:px-[18px] data-[size=md]:py-3 data-[size=md]:text-[11px] data-[size=lg]:px-[26px] data-[size=lg]:py-4 data-[size=lg]:text-[14px] data-[size=lg]:[--bl-px:5px] disabled:cursor-not-allowed disabled:[filter:grayscale(0.85)_brightness(0.8)] disabled:after:pointer-events-none disabled:after:absolute disabled:after:inset-0 disabled:after:bg-[repeating-linear-gradient(135deg,transparent_0_6px,rgba(11,11,20,0.35)_6px_8px)] [--bl-outline:0_calc(var(--bl-px)*-1)_0_0_currentColor,0_var(--bl-px)_0_0_currentColor,calc(var(--bl-px)*-1)_0_0_0_currentColor,var(--bl-px)_0_0_0_currentColor] data-[variant=ghost]:shadow-(--bl-outline) data-[variant=ghost]:hover:not-disabled:[filter:none] data-[variant=ghost]:hover:not-disabled:bg-[color-mix(in_srgb,currentColor_14%,transparent)] data-[variant=ghost]:active:not-disabled:shadow-(--bl-outline) data-[variant=ghost]:data-[pressed]:shadow-(--bl-outline) data-[variant=destructive]:hover:not-disabled:bg-[repeating-linear-gradient(135deg,rgba(11,11,20,0.16)_0_6px,transparent_6px_12px)] data-[icon-only]:data-[size=sm]:p-2! data-[icon-only]:data-[size=md]:p-3! data-[icon-only]:data-[size=lg]:p-4! ${className}`}
      data-size={size}
      data-variant={variant}
      data-icon-only={iconOnly || undefined}
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
      }}
      {...rest}
    >
      <span className="relative inline-flex items-center gap-2.5 group-data-[loading]/pxbtn:invisible">
        {icon}
        {children}
      </span>
      {loading && <span className="pointer-events-none absolute inset-0 overflow-hidden before:absolute before:inset-y-0 before:-left-[40%] before:w-[40%] before:animate-[bl-pxbtn-shine_1.2s_steps(8)_infinite] before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)] before:content-[''] motion-reduce:before:hidden" aria-hidden="true" />}
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center gap-1.5" aria-hidden="true">
          <i className="size-1.5 animate-[bl-pxbtn-pip_0.9s_steps(1)_infinite] bg-current motion-reduce:animate-none motion-reduce:opacity-80" />
          <i className="size-1.5 animate-[bl-pxbtn-pip_0.9s_steps(1)_infinite] bg-current motion-reduce:animate-none motion-reduce:opacity-80 [animation-delay:0.3s]" />
          <i className="size-1.5 animate-[bl-pxbtn-pip_0.9s_steps(1)_infinite] bg-current motion-reduce:animate-none motion-reduce:opacity-80 [animation-delay:0.6s]" />
        </span>
      )}
    </button>
  );
}
