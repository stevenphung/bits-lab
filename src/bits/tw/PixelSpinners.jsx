import { useInsertionEffect } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Loading indicators drawn in pixels, all pure CSS and stepped like old hardware. "blocks"
// chases a light round a 3×3 grid, "bar" bounces a bright segment along a row, "dots" hop in
// turn, "hourglass" drains and flips, and "orbit" spins four pixels round a centre. Each is a
// status with a text label for screen readers. Reduced motion swaps the motion for a slow glow.

const STYLE_ID = 'bl-pixel-spinners-tw';
const CSS = `
/* theme tokens */
.bl-spin { --bl-off: #333c57; --bl-muted: #94b0c2; }
:where(.light, [data-theme="light"]) .bl-spin, .bl-spin:where(.light, [data-theme="light"]) { --bl-off: #ddd4c0; --bl-muted: #566c86; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-spin, :where(.light, [data-theme="light"]) .bl-spin:where(.dark, [data-theme="dark"]) { --bl-off: #333c57; --bl-muted: #94b0c2; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-spin, .bl-spin:where([data-theme="system"]) { --bl-off: #ddd4c0; --bl-muted: #566c86; } }
/* theme tokens end */
@keyframes bl-spin-chase { 0%, 12% { background: var(--bl-on); } 13%, 100% { background: var(--bl-off); } }
@keyframes bl-spin-run { to { transform: translateX(calc((var(--bl-cell) + var(--bl-gap)) * 7)); } }
@keyframes bl-spin-hop { 0%, 60%, 100% { transform: none; } 30% { transform: translateY(calc(var(--bl-cell) * -2)); } }
@keyframes bl-spin-drain { from { transform: scaleY(1); } to { transform: scaleY(0); } }
@keyframes bl-spin-fill { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes bl-spin-flip { 0%, 92% { transform: none; } 93%, 100% { transform: rotate(180deg); } }
@keyframes bl-spin-turn { to { transform: rotate(360deg); } }
@keyframes bl-spin-glow { 50% { opacity: 0.45; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Order the eight outer cells of a 3×3 grid clockwise from the top-left.
const RING = [0, 1, 2, 5, 8, 7, 6, 3];

function Art({ type }) {
  if (type === 'blocks') {
    return Array.from({ length: 9 }, (_, cell) => {
      const i = RING.indexOf(cell);
      return <span key={cell} className="size-(--bl-cell) bg-(--bl-off) group-data-[type=blocks]/spin:data-[ring]:animate-[bl-spin-chase_var(--bl-speed)_steps(1)_calc(var(--i)_*_var(--bl-speed)_/_8_-_var(--bl-speed))_infinite] group-data-[type=dots]/spin:animate-[bl-spin-hop_var(--bl-speed)_steps(4)_calc(var(--i)_*_var(--bl-speed)_/_6)_infinite] group-data-[type=dots]/spin:bg-(--bl-on) group-data-[type=orbit]/spin:absolute group-data-[type=orbit]/spin:bg-(--bl-on) group-data-[type=orbit]/spin:nth-1:top-0 group-data-[type=orbit]/spin:nth-1:left-[calc(var(--bl-cell)_*_2)] group-data-[type=orbit]/spin:nth-2:top-[calc(var(--bl-cell)_*_2)] group-data-[type=orbit]/spin:nth-2:right-0 group-data-[type=orbit]/spin:nth-2:opacity-75 group-data-[type=orbit]/spin:nth-3:bottom-0 group-data-[type=orbit]/spin:nth-3:left-[calc(var(--bl-cell)_*_2)] group-data-[type=orbit]/spin:nth-3:opacity-50 group-data-[type=orbit]/spin:nth-4:top-[calc(var(--bl-cell)_*_2)] group-data-[type=orbit]/spin:nth-4:left-0 group-data-[type=orbit]/spin:nth-4:opacity-25 motion-reduce:animate-none!" data-ring={i >= 0 || undefined} style={{ '--i': i }} />;
    });
  }
  if (type === 'bar') {
    // A dim row of eight with one bright runner sliding along it and back.
    return (
      <>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="size-(--bl-cell) bg-(--bl-off) group-data-[type=blocks]/spin:data-[ring]:animate-[bl-spin-chase_var(--bl-speed)_steps(1)_calc(var(--i)_*_var(--bl-speed)_/_8_-_var(--bl-speed))_infinite] group-data-[type=dots]/spin:animate-[bl-spin-hop_var(--bl-speed)_steps(4)_calc(var(--i)_*_var(--bl-speed)_/_6)_infinite] group-data-[type=dots]/spin:bg-(--bl-on) group-data-[type=orbit]/spin:absolute group-data-[type=orbit]/spin:bg-(--bl-on) group-data-[type=orbit]/spin:nth-1:top-0 group-data-[type=orbit]/spin:nth-1:left-[calc(var(--bl-cell)_*_2)] group-data-[type=orbit]/spin:nth-2:top-[calc(var(--bl-cell)_*_2)] group-data-[type=orbit]/spin:nth-2:right-0 group-data-[type=orbit]/spin:nth-2:opacity-75 group-data-[type=orbit]/spin:nth-3:bottom-0 group-data-[type=orbit]/spin:nth-3:left-[calc(var(--bl-cell)_*_2)] group-data-[type=orbit]/spin:nth-3:opacity-50 group-data-[type=orbit]/spin:nth-4:top-[calc(var(--bl-cell)_*_2)] group-data-[type=orbit]/spin:nth-4:left-0 group-data-[type=orbit]/spin:nth-4:opacity-25 motion-reduce:animate-none!" />
        ))}
        <span className="absolute top-0 left-0 size-(--bl-cell) animate-[bl-spin-run_calc(var(--bl-speed)_/_2)_steps(7)_infinite_alternate] bg-(--bl-on) motion-reduce:animate-none!" />
      </>
    );
  }
  if (type === 'dots') return Array.from({ length: 3 }, (_, i) => <span key={i} className="size-(--bl-cell) bg-(--bl-off) group-data-[type=blocks]/spin:data-[ring]:animate-[bl-spin-chase_var(--bl-speed)_steps(1)_calc(var(--i)_*_var(--bl-speed)_/_8_-_var(--bl-speed))_infinite] group-data-[type=dots]/spin:animate-[bl-spin-hop_var(--bl-speed)_steps(4)_calc(var(--i)_*_var(--bl-speed)_/_6)_infinite] group-data-[type=dots]/spin:bg-(--bl-on) group-data-[type=orbit]/spin:absolute group-data-[type=orbit]/spin:bg-(--bl-on) group-data-[type=orbit]/spin:nth-1:top-0 group-data-[type=orbit]/spin:nth-1:left-[calc(var(--bl-cell)_*_2)] group-data-[type=orbit]/spin:nth-2:top-[calc(var(--bl-cell)_*_2)] group-data-[type=orbit]/spin:nth-2:right-0 group-data-[type=orbit]/spin:nth-2:opacity-75 group-data-[type=orbit]/spin:nth-3:bottom-0 group-data-[type=orbit]/spin:nth-3:left-[calc(var(--bl-cell)_*_2)] group-data-[type=orbit]/spin:nth-3:opacity-50 group-data-[type=orbit]/spin:nth-4:top-[calc(var(--bl-cell)_*_2)] group-data-[type=orbit]/spin:nth-4:left-0 group-data-[type=orbit]/spin:nth-4:opacity-25 motion-reduce:animate-none!" style={{ '--i': i }} />);
  if (type === 'orbit') return Array.from({ length: 4 }, (_, i) => <span key={i} className="size-(--bl-cell) bg-(--bl-off) group-data-[type=blocks]/spin:data-[ring]:animate-[bl-spin-chase_var(--bl-speed)_steps(1)_calc(var(--i)_*_var(--bl-speed)_/_8_-_var(--bl-speed))_infinite] group-data-[type=dots]/spin:animate-[bl-spin-hop_var(--bl-speed)_steps(4)_calc(var(--i)_*_var(--bl-speed)_/_6)_infinite] group-data-[type=dots]/spin:bg-(--bl-on) group-data-[type=orbit]/spin:absolute group-data-[type=orbit]/spin:bg-(--bl-on) group-data-[type=orbit]/spin:nth-1:top-0 group-data-[type=orbit]/spin:nth-1:left-[calc(var(--bl-cell)_*_2)] group-data-[type=orbit]/spin:nth-2:top-[calc(var(--bl-cell)_*_2)] group-data-[type=orbit]/spin:nth-2:right-0 group-data-[type=orbit]/spin:nth-2:opacity-75 group-data-[type=orbit]/spin:nth-3:bottom-0 group-data-[type=orbit]/spin:nth-3:left-[calc(var(--bl-cell)_*_2)] group-data-[type=orbit]/spin:nth-3:opacity-50 group-data-[type=orbit]/spin:nth-4:top-[calc(var(--bl-cell)_*_2)] group-data-[type=orbit]/spin:nth-4:left-0 group-data-[type=orbit]/spin:nth-4:opacity-25 motion-reduce:animate-none!" />);
  return (
    <svg viewBox="0 0 7 9" aria-hidden="true">
      <path className="fill-(--bl-off)" d="M0 0h7v1h-1v2h-1v1h-1v1h1v1h1v2h1v1H0V8h1V6h1V5h1V4H2V3H1V1H0z" />
      <rect className="origin-[50%_44%] animate-[bl-spin-drain_var(--bl-speed)_steps(4)_infinite] fill-(--bl-on) motion-reduce:animate-none!" x="2" y="1" width="3" height="3" />
      <rect className="origin-bottom animate-[bl-spin-fill_var(--bl-speed)_steps(4)_infinite] fill-(--bl-on) motion-reduce:animate-none!" x="1" y="6" width="5" height="2" />
    </svg>
  );
}

export default function PixelSpinners({
  type = 'blocks',
  label = 'Loading',
  showLabel = false,
  cell = 6,
  gap = 2,
  speed = 1.2,
  color = '#73eff7',
  dimColor,
  mutedColor,
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  return (
    <span
      className={`bl-spin group/spin inline-grid justify-items-center gap-2 font-(family-name:--bl-font) text-[12px] text-(--bl-on) ${className}`}
      role="status"
      data-type={type}
      style={{ '--bl-cell': `${cell}px`, '--bl-gap': `${gap}px`, '--bl-speed': `${speed}s`, '--bl-on': color, '--bl-off': dimColor, '--bl-muted': mutedColor, '--bl-font': fontFamily, ...style }}
    >
      <span className="relative grid gap-(--bl-gap) group-data-[type=blocks]/spin:grid-cols-[repeat(3,var(--bl-cell))] group-data-[type=bar]/spin:grid-flow-col group-data-[type=dots]/spin:grid-flow-col group-data-[type=dots]/spin:[align-items:end] group-data-[type=dots]/spin:h-[calc(var(--bl-cell)_*_3)] group-data-[type=hourglass]/spin:animate-[bl-spin-flip_var(--bl-speed)_steps(1)_infinite] [&_svg]:block [&_svg]:h-[calc(var(--bl-cell)_*_9)] [&_svg]:w-[calc(var(--bl-cell)_*_7)] [&_svg]:[shape-rendering:crispEdges] group-data-[type=orbit]/spin:size-[calc(var(--bl-cell)_*_5)] group-data-[type=orbit]/spin:animate-[bl-spin-turn_var(--bl-speed)_steps(8)_infinite] motion-reduce:animate-[bl-spin-glow_2.4s_ease-in-out_infinite]!" aria-hidden="true">
        <Art type={type} />
      </span>
      {showLabel ? <span className="text-(--bl-muted)">{label}</span> : <span className="sr-only">{label}</span>}
    </span>
  );
}
