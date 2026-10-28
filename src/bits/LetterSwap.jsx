import { useInsertionEffect } from 'react';

// Text whose letters roll over in 3D on hover: each letter is a tiny cube that turns to show
// its other face, one after another, so a wave runs through the word. The other face can
// repeat the word or show different text (an alternate label). Works on keyboard focus
// too, and screen readers hear the word once. Reduced motion swaps colour instead.

const STYLE_ID = 'bl-letter-swap';
const CSS = `
/* theme tokens */
.bl-swap { --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-swap, .bl-swap:where(.light, [data-theme="light"]) { --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-swap, :where(.light, [data-theme="light"]) .bl-swap:where(.dark, [data-theme="dark"]) { --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-swap, .bl-swap:where([data-theme="system"]) { --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-swap { display: inline-flex; flex-wrap: wrap; color: inherit; font: inherit; text-decoration: none; perspective: 600px; cursor: pointer; }
a.bl-swap, button.bl-swap { border: 0; background: none; padding: 0; }
.bl-swap:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 4px; border-radius: 4px; }
.bl-swap__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.bl-swap { position: relative; }
.bl-swap__char { position: relative; display: inline-block; height: 1.15em; line-height: 1.15em; transform-style: preserve-3d; transition: transform var(--bl-dur) cubic-bezier(.3,1.15,.5,1); transition-delay: calc(var(--d) * var(--bl-stagger)); }
.bl-swap__face { display: block; backface-visibility: hidden; -webkit-backface-visibility: hidden; transform: translateZ(0.575em); white-space: pre; }
.bl-swap__face + .bl-swap__face { position: absolute; inset: 0; color: var(--bl-alt); transform: rotateX(-90deg) translateZ(0.575em); }
.bl-swap:is(:hover, :focus-visible) .bl-swap__char, .bl-swap[data-active] .bl-swap__char { transform: rotateX(90deg); }
@media (prefers-reduced-motion: reduce) {
  .bl-swap__char { transition: color 200ms; transform: none !important; }
  .bl-swap__face + .bl-swap__face { display: none; }
  .bl-swap:is(:hover, :focus-visible) .bl-swap__face, .bl-swap[data-active] .bl-swap__face { color: var(--bl-alt); }
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

// Delay order for each letter: from the start, the end, the center out, or shuffled.
function delays(count, from) {
  if (from === 'end') return Array.from({ length: count }, (_, i) => count - 1 - i);
  if (from === 'center') return Array.from({ length: count }, (_, i) => Math.abs(i - (count - 1) / 2));
  if (from === 'random') {
    // A fixed shuffle per length, so it doesn't change between renders.
    return Array.from({ length: count }, (_, i) => ((i * 7 + 3) % count) * 0.8);
  }
  return Array.from({ length: count }, (_, i) => i);
}

export default function LetterSwap({
  text = 'Hover me',
  swapText,
  as = 'span',
  href,
  from = 'start',
  stagger = 30,
  duration = 500,
  active,
  altColor = 'currentColor',
  accentColor,
  className = '',
  style,
  ...rest
}) {
  useStyles();
  const front = [...text];
  const back = [...(swapText ?? text)];
  const count = Math.max(front.length, back.length);
  const order = delays(count, from);
  const Tag = href ? 'a' : as;

  return (
    <Tag
      className={`bl-swap ${className}`}
      href={href}
      data-active={active || undefined}
      style={{ '--bl-stagger': `${stagger}ms`, '--bl-dur': `${duration}ms`, '--bl-alt': altColor, '--bl-accent': accentColor, ...style }}
      {...rest}
    >
      {/* Screen readers get the word once; the letter cubes are decoration. */}
      <span className="bl-swap__sr">{text}</span>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="bl-swap__char" aria-hidden="true" style={{ '--d': order[i] }}>
          <span className="bl-swap__face">{front[i] ?? ' '}</span>
          <span className="bl-swap__face">{back[i] ?? ' '}</span>
        </span>
      ))}
    </Tag>
  );
}
