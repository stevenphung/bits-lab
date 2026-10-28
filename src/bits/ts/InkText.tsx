import { useInsertionEffect, type CSSProperties, type ElementType, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Text filled with something other than flat ink. "shimmer" runs a band of light across it;
// "gradient" flows colours through it, either smooth or stepped into hard pixel bands; "outline"
// shows a hollow stroke that floods with colour from the bottom on hover or focus; "image"
// fills the letters with a picture that slowly pans. Plain, selectable text throughout; reduced
// motion keeps every fill still.

const STYLE_ID = 'bl-ink-text';
const CSS = `
/* theme tokens */
.bl-ink { --bl-base: #94b0c2; --bl-glint: #f4f4f4; }
:where(.light, [data-theme="light"]) .bl-ink, .bl-ink:where(.light, [data-theme="light"]) { --bl-base: #566c86; --bl-glint: #ffffff; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-ink, :where(.light, [data-theme="light"]) .bl-ink:where(.dark, [data-theme="dark"]) { --bl-base: #94b0c2; --bl-glint: #f4f4f4; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-ink, .bl-ink:where([data-theme="system"]) { --bl-base: #566c86; --bl-glint: #ffffff; } }
/* theme tokens end */
@property --bl-ink-level { syntax: "<percentage>"; inherits: true; initial-value: 0%; }
.bl-ink { margin: 0; color: transparent; background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-repeat: no-repeat; }
.bl-ink[data-fill="shimmer"] { background-image: linear-gradient(100deg, var(--bl-base) 0 40%, var(--bl-glint) 50%, var(--bl-base) 60% 100%); background-size: 250% 100%; animation: bl-ink-sweep var(--bl-speed) linear infinite; }
.bl-ink[data-fill="gradient"] { background-image: linear-gradient(90deg, var(--bl-stops)); background-size: 300% 100%; background-repeat: repeat; animation: bl-ink-flow var(--bl-speed) linear infinite; }
.bl-ink[data-fill="outline"] { --bl-ink-level: 0%; background-image: linear-gradient(to top, var(--bl-base) var(--bl-ink-level), transparent var(--bl-ink-level)); -webkit-text-stroke: var(--bl-stroke) var(--bl-base); transition: --bl-ink-level 600ms cubic-bezier(.3,.8,.3,1); }
.bl-ink[data-fill="outline"]:hover, .bl-ink[data-fill="outline"]:focus-visible, .bl-ink[data-fill="outline"][data-filled] { --bl-ink-level: 100%; }
.bl-ink[data-fill="image"] { background-image: var(--bl-image); background-size: cover; background-position: 0% 50%; animation: bl-ink-pan var(--bl-speed) ease-in-out infinite alternate; }
.bl-ink[data-fill="image"][data-pixelated] { image-rendering: pixelated; }
@keyframes bl-ink-sweep { from { background-position: 100% 0; } to { background-position: -50% 0; } }
@keyframes bl-ink-flow { from { background-position: 0% 0; } to { background-position: 150% 0; } }
@keyframes bl-ink-pan { to { background-position: 100% 50%; } }
@media (prefers-reduced-motion: reduce) { .bl-ink { animation: none !important; transition: none !important; } .bl-ink[data-fill="shimmer"] { background-position: 50% 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// "a, b, c" as hard bands (each colour holds, then jumps) or as smooth stops. The list repeats
// once so the flowing background tiles without a seam.
function gradientStops(colors: string[], stepped: boolean) {
  const list = [...colors, colors[0]];
  if (!stepped) return list.join(', ');
  const share = 100 / list.length;
  return list.map((c, i) => `${c} ${(i * share).toFixed(2)}% ${((i + 1) * share).toFixed(2)}%`).join(', ');
}

export interface InkTextProps {
  /** The text (or pass children). */
  text?: string;
  children?: ReactNode;
  as?: ElementType;
  /** A sweeping glint, flowing colours, a hollow stroke that floods on hover, or a panning picture. */
  fill?: 'shimmer' | 'gradient' | 'outline' | 'image';
  /** Gradient colours. */
  colors?: string[];
  /** Hard 8-bit bands instead of a smooth blend. */
  stepped?: boolean;
  /** Shimmer base, and the outline colour. */
  baseColor?: string;
  glintColor?: string;
  /** Picture for the image fill. */
  image?: string;
  pixelated?: boolean;
  strokeWidth?: number;
  /** Keep the outline flooded. */
  filled?: boolean;
  /** Seconds per shimmer, flow or pan cycle. */
  speed?: number;
  className?: string;
  style?: CSSProperties;
}

export default function InkText({
  text,
  children,
  as: Tag = 'span',
  fill = 'shimmer',
  colors = ['#ef7d57', '#ffcd75', '#a7f070', '#73eff7', '#41a6f6', '#b13e53'],
  stepped = true,
  baseColor,
  glintColor,
  image,
  pixelated = true,
  strokeWidth = 1.5,
  filled = false,
  speed = 3,
  className = '',
  style
}: InkTextProps) {
  useStyles();
  return (
    <Tag
      className={`bl-ink ${className}`}
      data-fill={fill}
      data-filled={filled || undefined}
      data-pixelated={pixelated || undefined}
      style={{ '--bl-base': baseColor, '--bl-glint': glintColor, '--bl-stops': gradientStops(colors, stepped), '--bl-image': image ? `url("${image}")` : 'none', '--bl-stroke': `${strokeWidth}px`, '--bl-speed': `${speed}s`, ...style } as CSSVars}
    >
      {text ?? children}
    </Tag>
  );
}
