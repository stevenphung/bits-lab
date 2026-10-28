import { useInsertionEffect } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Text filled with something other than flat ink. "shimmer" runs a band of light across it;
// "gradient" flows colours through it, either smooth or stepped into hard pixel bands; "outline"
// shows a hollow stroke that floods with colour from the bottom on hover or focus; "image"
// fills the letters with a picture that slowly pans. Plain, selectable text throughout; reduced
// motion keeps every fill still.

const STYLE_ID = 'bl-ink-text-tw';
const CSS = `
/* theme tokens */
.bl-ink { --bl-base: #94b0c2; --bl-glint: #f4f4f4; }
:where(.light, [data-theme="light"]) .bl-ink, .bl-ink:where(.light, [data-theme="light"]) { --bl-base: #566c86; --bl-glint: #ffffff; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-ink, :where(.light, [data-theme="light"]) .bl-ink:where(.dark, [data-theme="dark"]) { --bl-base: #94b0c2; --bl-glint: #f4f4f4; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-ink, .bl-ink:where([data-theme="system"]) { --bl-base: #566c86; --bl-glint: #ffffff; } }
/* theme tokens end */
@property --bl-ink-level { syntax: "<percentage>"; inherits: true; initial-value: 0%; }
@keyframes bl-ink-sweep { from { background-position: 100% 0; } to { background-position: -50% 0; } }
@keyframes bl-ink-flow { from { background-position: 0% 0; } to { background-position: 150% 0; } }
@keyframes bl-ink-pan { to { background-position: 100% 50%; } }
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
function gradientStops(colors, stepped) {
  const list = [...colors, colors[0]];
  if (!stepped) return list.join(', ');
  const share = 100 / list.length;
  return list.map((c, i) => `${c} ${(i * share).toFixed(2)}% ${((i + 1) * share).toFixed(2)}%`).join(', ');
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
}) {
  useStyles();
  return (
    <Tag
      className={`bl-ink m-0 bg-clip-text bg-no-repeat text-transparent [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] data-[fill=shimmer]:animate-[bl-ink-sweep_var(--bl-speed)_linear_infinite] data-[fill=shimmer]:bg-[linear-gradient(100deg,var(--bl-base)_0_40%,var(--bl-glint)_50%,var(--bl-base)_60%_100%)] data-[fill=shimmer]:bg-size-[250%_100%] data-[fill=gradient]:animate-[bl-ink-flow_var(--bl-speed)_linear_infinite] data-[fill=gradient]:bg-repeat data-[fill=gradient]:bg-[linear-gradient(90deg,var(--bl-stops))] data-[fill=gradient]:bg-size-[300%_100%] data-[fill=outline]:[--bl-ink-level:0%] data-[fill=outline]:bg-[linear-gradient(to_top,var(--bl-base)_var(--bl-ink-level),transparent_var(--bl-ink-level))] data-[fill=outline]:[-webkit-text-stroke:var(--bl-stroke)_var(--bl-base)] data-[fill=outline]:[transition:--bl-ink-level_600ms_cubic-bezier(.3,.8,.3,1)] data-[fill=outline]:hover:[--bl-ink-level:100%] data-[fill=outline]:focus-visible:[--bl-ink-level:100%] data-[fill=outline]:data-[filled]:[--bl-ink-level:100%] data-[fill=image]:animate-[bl-ink-pan_var(--bl-speed)_ease-in-out_infinite_alternate] data-[fill=image]:bg-(image:--bl-image) data-[fill=image]:bg-cover data-[fill=image]:bg-[position:0%_50%] data-[fill=image]:data-[pixelated]:[image-rendering:pixelated] motion-reduce:animate-none! motion-reduce:[transition:none]! motion-reduce:data-[fill=shimmer]:bg-[position:50%_0] ${className}`}
      data-fill={fill}
      data-filled={filled || undefined}
      data-pixelated={pixelated || undefined}
      style={{ '--bl-base': baseColor, '--bl-glint': glintColor, '--bl-stops': gradientStops(colors, stepped), '--bl-image': image ? `url("${image}")` : 'none', '--bl-stroke': `${strokeWidth}px`, '--bl-speed': `${speed}s`, ...style }}
    >
      {text ?? children}
    </Tag>
  );
}
