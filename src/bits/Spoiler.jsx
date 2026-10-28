import { useInsertionEffect, useMemo, useState } from 'react';

// Inline spoiler text. Until revealed, the words are hidden under a shimmering field of
// particles that drifts gently; click (or Enter / Space) and the particles scatter as the
// text fades in. It wraps across lines like normal text. While hidden it's a button that
// says it's a spoiler, and the secret isn't read out; once revealed it reads as plain text.

const STYLE_ID = 'bl-spoiler';
const CSS = `
/* theme tokens */
.bl-spoiler { --bl-cover: rgba(148,176,194,0.18); --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-spoiler, .bl-spoiler:where(.light, [data-theme="light"]) { --bl-cover: rgba(86,108,134,0.18); --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-spoiler, :where(.light, [data-theme="light"]) .bl-spoiler:where(.dark, [data-theme="dark"]) { --bl-cover: rgba(148,176,194,0.18); --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-spoiler, .bl-spoiler:where([data-theme="system"]) { --bl-cover: rgba(86,108,134,0.18); --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-spoiler { border-radius: 4px; color: transparent; background-image: var(--bl-dots), var(--bl-dots); background-size: var(--bl-tile) var(--bl-tile), calc(var(--bl-tile) * 1.37) calc(var(--bl-tile) * 1.37); background-color: var(--bl-cover); -webkit-box-decoration-break: clone; box-decoration-break: clone; cursor: pointer; user-select: none; -webkit-user-select: none; transition: color 500ms ease, background-size 700ms cubic-bezier(.2,.9,.25,1), background-color 400ms ease; animation: bl-spoiler-drift 2.4s linear infinite; }
.bl-spoiler:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-spoiler[data-revealed] { color: inherit; background-color: transparent; background-size: calc(var(--bl-tile) * 5) calc(var(--bl-tile) * 5), calc(var(--bl-tile) * 6) calc(var(--bl-tile) * 6); cursor: text; user-select: text; -webkit-user-select: text; animation: bl-spoiler-scatter 700ms ease forwards; }
.bl-spoiler[data-gone] { background: none; animation: none; }
@keyframes bl-spoiler-drift { to { background-position: var(--bl-tile) calc(var(--bl-tile) * -1), calc(var(--bl-tile) * -1.37) calc(var(--bl-tile) * 1.37); } }
@keyframes bl-spoiler-scatter { to { background-position: calc(var(--bl-tile) * 3) calc(var(--bl-tile) * -2), calc(var(--bl-tile) * -3) calc(var(--bl-tile) * 2); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .bl-spoiler { animation: none; transition: color 150ms; } .bl-spoiler[data-revealed] { background: none; animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// A tile of random dots, drawn once per color and size and cached as an image URL.
const tiles = new Map();
function dotTile(color, size, count) {
  const key = `${color}|${size}|${count}`;
  if (tiles.has(key)) return tiles.get(key);
  if (typeof document === 'undefined') return 'none';
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size * 2;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = 0.35 + Math.random() * 0.65;
    const r = 0.6 + Math.random() * 0.9;
    ctx.beginPath();
    ctx.arc(Math.random() * size * 2, Math.random() * size * 2, r, 0, Math.PI * 2);
    ctx.fill();
  }
  const url = `url(${canvas.toDataURL()})`;
  tiles.set(key, url);
  return url;
}

export default function Spoiler({
  children,
  revealed,
  defaultRevealed = false,
  onReveal,
  rehide = false,
  label = 'Spoiler',
  dotColor = '#f4f4f4',
  coverColor,
  accentColor,
  tile = 24,
  density = 60,
  className = '',
  style
}) {
  useStyles();
  const [inner, setInner] = useState(defaultRevealed);
  const shown = revealed ?? inner;
  const [gone, setGone] = useState(defaultRevealed);
  const dots = useMemo(() => dotTile(dotColor, tile, density), [dotColor, tile, density]);

  const toggle = () => {
    if (shown && !rehide) return;
    const next = !shown;
    if (revealed === undefined) setInner(next);
    setGone(false);
    onReveal?.(next);
  };

  const interactive = !shown || rehide;

  return (
    <span
      className={`bl-spoiler ${className}`}
      data-revealed={shown || undefined}
      data-gone={(shown && gone) || undefined}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={shown ? undefined : `${label}, hidden. Press to reveal.`}
      aria-pressed={rehide ? shown : undefined}

      onClick={toggle}
      onKeyDown={event => {
        if (interactive && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          toggle();
        }
      }}
      onAnimationEnd={event => {
        if (event.animationName === 'bl-spoiler-scatter') setGone(true);
      }}
      style={{ '--bl-dots': dots, '--bl-tile': `${tile}px`, '--bl-cover': coverColor, '--bl-accent': accentColor, ...style }}
    >
      <span aria-hidden={shown ? undefined : true}>{children}</span>
    </span>
  );
}
