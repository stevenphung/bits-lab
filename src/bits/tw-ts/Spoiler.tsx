import { useInsertionEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Inline spoiler text. Until revealed, the words are hidden under a shimmering field of
// particles that drifts gently; click (or Enter / Space) and the particles scatter as the
// text fades in. It wraps across lines like normal text. While hidden it's a button that
// says it's a spoiler, and the secret isn't read out; once revealed it reads as plain text.

export interface SpoilerProps {
  /** The hidden text. */
  children?: ReactNode;
  revealed?: boolean;
  defaultRevealed?: boolean;
  onReveal?: (shown: boolean) => void;
  /** Let a second click hide it again. */
  rehide?: boolean;
  /** Accessible name while hidden. */
  label?: string;
  dotColor?: string;
  coverColor?: string;
  accentColor?: string;
  /** Size of the particle tile in px. */
  tile?: number;
  /** Particles per tile. */
  density?: number;
  className?: string;
  style?: CSSProperties;
}

const STYLE_ID = 'bl-spoiler-tw';
const CSS = `
/* theme tokens */
.bl-spoiler { --bl-cover: rgba(148,176,194,0.18); --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-spoiler, .bl-spoiler:where(.light, [data-theme="light"]) { --bl-cover: rgba(86,108,134,0.18); --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-spoiler, :where(.light, [data-theme="light"]) .bl-spoiler:where(.dark, [data-theme="dark"]) { --bl-cover: rgba(148,176,194,0.18); --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-spoiler, .bl-spoiler:where([data-theme="system"]) { --bl-cover: rgba(86,108,134,0.18); --bl-accent: #167f8f; } }
/* theme tokens end */
@keyframes bl-spoiler-drift { to { background-position: var(--bl-tile) calc(var(--bl-tile) * -1), calc(var(--bl-tile) * -1.37) calc(var(--bl-tile) * 1.37); } }
@keyframes bl-spoiler-scatter { to { background-position: calc(var(--bl-tile) * 3) calc(var(--bl-tile) * -2), calc(var(--bl-tile) * -3) calc(var(--bl-tile) * 2); opacity: 1; } }
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
const tiles = new Map<string, string>();
function dotTile(color: string, size: number, count: number): string {
  const key = `${color}|${size}|${count}`;
  if (tiles.has(key)) return tiles.get(key)!;
  if (typeof document === 'undefined') return 'none';
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size * 2;
  const ctx = canvas.getContext('2d')!;
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
}: SpoilerProps) {
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
      className={`bl-spoiler cursor-pointer rounded-[4px] bg-(--bl-cover) text-transparent box-decoration-clone select-none [background-image:var(--bl-dots),var(--bl-dots)] [background-size:var(--bl-tile)_var(--bl-tile),calc(var(--bl-tile)*1.37)_calc(var(--bl-tile)*1.37)] animate-[bl-spoiler-drift_2.4s_linear_infinite] [transition:color_500ms_ease,background-size_700ms_cubic-bezier(.2,.9,.25,1),background-color_400ms_ease] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) data-[revealed]:animate-[bl-spoiler-scatter_700ms_ease_forwards] data-[revealed]:cursor-text data-[revealed]:bg-transparent data-[revealed]:text-inherit data-[revealed]:select-text data-[revealed]:[background-size:calc(var(--bl-tile)*5)_calc(var(--bl-tile)*5),calc(var(--bl-tile)*6)_calc(var(--bl-tile)*6)] data-[gone]:animate-none! data-[gone]:[background:none]! motion-reduce:animate-none motion-reduce:[transition:color_150ms] motion-reduce:data-[revealed]:animate-none motion-reduce:data-[revealed]:[background:none] ${className}`}
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
      style={{ '--bl-dots': dots, '--bl-tile': `${tile}px`, '--bl-cover': coverColor, '--bl-accent': accentColor, ...style } as CSSVars}
    >
      <span aria-hidden={shown ? undefined : true}>{children}</span>
    </span>
  );
}
