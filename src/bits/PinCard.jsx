import { useInsertionEffect } from 'react';

// A card that tips back in 3D on hover and lifts off a map pin: a beam of light grows from
// the card down to a pulsing marker on the "ground", and a label pill rises above it. Works
// on keyboard focus too. If you give it an href the whole card is the link.

const STYLE_ID = 'bl-pin-card';
const CSS = `
.bl-pin { position: relative; display: grid; justify-items: center; width: var(--bl-w); max-width: 100%; padding-top: 56px; perspective: 1000px; color: var(--bl-ink); font-family: var(--bl-font); text-decoration: none; outline: none; }
.bl-pin__label { position: absolute; top: 0; left: 50%; z-index: 3; padding: 5px 12px; border-radius: 999px; background: var(--bl-label-bg); box-shadow: 0 0 0 1px var(--bl-line); color: var(--bl-ink); font-size: 13px; font-weight: 600; white-space: nowrap; opacity: 0; transform: translate(-50%, 10px); transition: opacity 200ms, transform 300ms cubic-bezier(.3,1.4,.5,1); }
.bl-pin__card { position: relative; z-index: 2; width: 100%; border-radius: var(--bl-radius); background: var(--bl-bg); box-shadow: 0 0 0 1px var(--bl-line), 0 18px 40px -20px rgba(0,0,0,0.7); transform-origin: 50% 100%; transition: transform 600ms cubic-bezier(.2,.9,.25,1), box-shadow 400ms; overflow: hidden; }
.bl-pin__ground { position: relative; width: 100%; height: 96px; margin-top: -40px; transform: rotateX(70deg); transform-style: preserve-3d; pointer-events: none; }
.bl-pin__ring { position: absolute; left: 50%; top: 50%; width: 140px; height: 140px; margin: -70px 0 0 -70px; border-radius: 50%; background: radial-gradient(color-mix(in srgb, var(--bl-accent) 40%, transparent), transparent 65%); opacity: 0; transition: opacity 300ms; }
.bl-pin__ring::before, .bl-pin__ring::after { content: ""; position: absolute; inset: 0; border-radius: 50%; box-shadow: 0 0 0 2px var(--bl-accent); opacity: 0; }
.bl-pin__beam { position: absolute; left: 50%; bottom: 46px; z-index: 1; width: 2px; height: 0; margin-left: -1px; background: linear-gradient(transparent, var(--bl-accent)); transition: height 500ms cubic-bezier(.2,.9,.25,1); pointer-events: none; }
.bl-pin__beam::after { content: ""; position: absolute; left: 50%; bottom: -4px; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%; background: var(--bl-accent); box-shadow: 0 0 12px 3px var(--bl-accent); }
.bl-pin:is(:hover, :focus-visible, :focus-within) .bl-pin__card { transform: translateY(-14px) rotateX(38deg) scale(0.86); box-shadow: 0 0 0 1px var(--bl-accent), 0 40px 60px -30px rgba(0,0,0,0.9); }
.bl-pin:is(:hover, :focus-visible, :focus-within) .bl-pin__label { opacity: 1; transform: translate(-50%, 0); }
.bl-pin:is(:hover, :focus-visible, :focus-within) .bl-pin__beam { height: 90px; }
.bl-pin:is(:hover, :focus-visible, :focus-within) .bl-pin__ring { opacity: 1; }
.bl-pin:is(:hover, :focus-visible, :focus-within) .bl-pin__ring::before { animation: bl-pin-pulse 2s ease-out infinite; }
.bl-pin:is(:hover, :focus-visible, :focus-within) .bl-pin__ring::after { animation: bl-pin-pulse 2s ease-out 1s infinite; }
.bl-pin:focus-visible .bl-pin__label { box-shadow: 0 0 0 2px var(--bl-accent); }
@keyframes bl-pin-pulse { from { transform: scale(0.2); opacity: 1; } to { transform: scale(1); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .bl-pin__card, .bl-pin__beam, .bl-pin__label { transition: opacity 150ms; }
  .bl-pin:is(:hover, :focus-visible, :focus-within) .bl-pin__card { transform: none; }
  .bl-pin__ring::before, .bl-pin__ring::after { animation: none !important; }
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

export default function PinCard({
  children,
  title,
  href,
  target,
  width = 300,
  radius = 16,
  backgroundColor = '#1a1c2c',
  labelColor = '#0b0b14',
  textColor = '#f4f4f4',
  lineColor = '#333c57',
  accentColor = '#73eff7',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const Tag = href ? 'a' : 'div';
  return (
    <Tag
      className={`bl-pin ${className}`}
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
      {title && <span className="bl-pin__label">{title}</span>}
      <div className="bl-pin__card">{children}</div>
      <span className="bl-pin__beam" aria-hidden="true" />
      <span className="bl-pin__ground" aria-hidden="true">
        <span className="bl-pin__ring" />
      </span>
    </Tag>
  );
}
