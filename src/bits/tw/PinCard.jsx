import { useInsertionEffect } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A card that tips back in 3D on hover and lifts off a map pin: a beam of light grows from
// the card down to a pulsing marker on the "ground", and a label pill rises above it. Works
// on keyboard focus too. If you give it an href the whole card is the link.

const STYLE_ID = 'bl-pin-card-tw';
const CSS = `
/* theme tokens */
.bl-pin { --bl-bg: #1a1c2c; --bl-label-bg: #0b0b14; --bl-ink: #f4f4f4; --bl-line: #333c57; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-pin, .bl-pin:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-line: #cfc4ad; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-pin, :where(.light, [data-theme="light"]) .bl-pin:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-label-bg: #0b0b14; --bl-ink: #f4f4f4; --bl-line: #333c57; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-pin, .bl-pin:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-line: #cfc4ad; --bl-accent: #167f8f; } }
/* theme tokens end */
@keyframes bl-pin-pulse { from { transform: scale(0.2); opacity: 1; } to { transform: scale(1); opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function PinCard({
  children,
  title,
  href,
  target,
  width = 300,
  radius = 16,
  backgroundColor,
  labelColor,
  textColor,
  lineColor,
  accentColor,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const Tag = href ? 'a' : 'div';
  return (
    <Tag
      className={`bl-pin group/pin relative grid w-(--bl-w) max-w-full justify-items-center pt-14 perspective-[1000px] font-(family-name:--bl-font) text-(--bl-ink) no-underline outline-none ${className}`}
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      tabIndex={href ? undefined : 0}
      style={{
        '--bl-w': `${width}px`,
        '--bl-radius': `${radius}px`,
        '--bl-bg': backgroundColor,
        '--bl-label-bg': labelColor,
        '--bl-ink': textColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-font': fontFamily,
        ...style
      }}
    >
      {title && <span className="absolute top-0 left-1/2 z-3 rounded-full bg-(--bl-label-bg) px-3 py-[5px] text-[13px] font-semibold whitespace-nowrap text-(--bl-ink) opacity-0 shadow-[0_0_0_1px_var(--bl-line)] [transform:translate(-50%,10px)] [transition:opacity_200ms,transform_300ms_cubic-bezier(.3,1.4,.5,1)] group-hover/pin:opacity-100 group-focus-visible/pin:opacity-100 group-focus-within/pin:opacity-100 group-hover/pin:[transform:translate(-50%,0)] group-focus-visible/pin:[transform:translate(-50%,0)] group-focus-within/pin:[transform:translate(-50%,0)] group-focus-visible/pin:shadow-[0_0_0_2px_var(--bl-accent)] motion-reduce:[transition:opacity_150ms]">{title}</span>}
      <div className="relative z-2 w-full origin-[50%_100%] overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) shadow-[0_0_0_1px_var(--bl-line),0_18px_40px_-20px_rgba(0,0,0,0.7)] [transition:transform_600ms_cubic-bezier(.2,.9,.25,1),box-shadow_400ms] group-hover/pin:[transform:translateY(-14px)_rotateX(38deg)_scale(0.86)] group-focus-visible/pin:[transform:translateY(-14px)_rotateX(38deg)_scale(0.86)] group-focus-within/pin:[transform:translateY(-14px)_rotateX(38deg)_scale(0.86)] group-hover/pin:shadow-[0_0_0_1px_var(--bl-accent),0_40px_60px_-30px_rgba(0,0,0,0.9)] group-focus-visible/pin:shadow-[0_0_0_1px_var(--bl-accent),0_40px_60px_-30px_rgba(0,0,0,0.9)] group-focus-within/pin:shadow-[0_0_0_1px_var(--bl-accent),0_40px_60px_-30px_rgba(0,0,0,0.9)] motion-reduce:[transition:opacity_150ms] group-hover/pin:motion-reduce:[transform:none] group-focus-visible/pin:motion-reduce:[transform:none] group-focus-within/pin:motion-reduce:[transform:none]">{children}</div>
      <span className="pointer-events-none absolute bottom-[46px] left-1/2 z-1 -ml-px h-0 w-0.5 bg-[linear-gradient(transparent,var(--bl-accent))] [transition:height_500ms_cubic-bezier(.2,.9,.25,1)] after:absolute after:-bottom-1 after:left-1/2 after:-ml-1 after:size-2 after:rounded-[50%] after:bg-(--bl-accent) after:shadow-[0_0_12px_3px_var(--bl-accent)] group-hover/pin:h-[90px] group-focus-visible/pin:h-[90px] group-focus-within/pin:h-[90px] motion-reduce:[transition:opacity_150ms]" aria-hidden="true" />
      <span className="pointer-events-none relative -mt-10 h-24 w-full [transform:rotateX(70deg)] transform-3d" aria-hidden="true">
        <span className="absolute top-1/2 left-1/2 -mt-[70px] -ml-[70px] size-[140px] rounded-[50%] bg-[radial-gradient(color-mix(in_srgb,var(--bl-accent)_40%,transparent),transparent_65%)] opacity-0 transition-opacity duration-300 ease-[ease] before:absolute before:inset-0 before:rounded-[50%] before:opacity-0 before:shadow-[0_0_0_2px_var(--bl-accent)] after:absolute after:inset-0 after:rounded-[50%] after:opacity-0 after:shadow-[0_0_0_2px_var(--bl-accent)] group-hover/pin:opacity-100 group-focus-visible/pin:opacity-100 group-focus-within/pin:opacity-100 group-hover/pin:before:animate-[bl-pin-pulse_2s_ease-out_infinite] group-focus-visible/pin:before:animate-[bl-pin-pulse_2s_ease-out_infinite] group-focus-within/pin:before:animate-[bl-pin-pulse_2s_ease-out_infinite] group-hover/pin:after:animate-[bl-pin-pulse_2s_ease-out_1s_infinite] group-focus-visible/pin:after:animate-[bl-pin-pulse_2s_ease-out_1s_infinite] group-focus-within/pin:after:animate-[bl-pin-pulse_2s_ease-out_1s_infinite] motion-reduce:before:animate-none! motion-reduce:after:animate-none!" />
      </span>
    </Tag>
  );
}
