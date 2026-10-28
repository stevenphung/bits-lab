import { useEffect, useInsertionEffect, useRef } from 'react';

const STYLE_ID = 'bl-wobble-card-tw';
const CSS = `
/* theme tokens */
.bl-wobble { --bl-bg: #262b44; --bl-ink: #f4f4f4; --bl-line: #333c57; --bl-accent: #73eff7; --bl-sheen: rgba(115,239,247,0.18); }
:where(.light, [data-theme="light"]) .bl-wobble, .bl-wobble:where(.light, [data-theme="light"]) { --bl-bg: #ebe5d8; --bl-ink: #1a1c2c; --bl-line: #cfc4ad; --bl-accent: #167f8f; --bl-sheen: rgba(22,127,143,0.18); }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-wobble, :where(.light, [data-theme="light"]) .bl-wobble:where(.dark, [data-theme="dark"]) { --bl-bg: #262b44; --bl-ink: #f4f4f4; --bl-line: #333c57; --bl-accent: #73eff7; --bl-sheen: rgba(115,239,247,0.18); }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-wobble, .bl-wobble:where([data-theme="system"]) { --bl-bg: #ebe5d8; --bl-ink: #1a1c2c; --bl-line: #cfc4ad; --bl-accent: #167f8f; --bl-sheen: rgba(22,127,143,0.18); } }
/* theme tokens end */
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A jelly card. It leans and stretches toward the pointer, a soft sheen follows it, and when
// the pointer leaves it springs back with a wobble that settles. Touch drags work the same
// way. Under reduced motion the card stays still and only the sheen and border react.

export default function WobbleCard({
  children,
  intensity = 1,
  stiffness = 170,
  damping = 9,
  width = 360,
  padding = 24,
  radius = 18,
  backgroundColor,
  textColor,
  lineColor,
  accentColor,
  sheenColor,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const rootRef = useRef(null);
  const bodyRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const body = bodyRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // Pointer offset from the centre (-1…1 on each axis) is the target; x/y chase it on a spring.
    const s = { tx: 0, ty: 0, x: 0, y: 0, vx: 0, vy: 0 };
    let frame = 0;
    let last = 0;

    const apply = () => {
      const k = intensity;
      const sx = 1 + k * (0.05 * Math.abs(s.x) - 0.025 * Math.abs(s.y));
      const sy = 1 + k * (0.05 * Math.abs(s.y) - 0.025 * Math.abs(s.x));
      body.style.transform = `translate(${(s.x * 7 * k).toFixed(2)}px, ${(s.y * 7 * k).toFixed(2)}px) skew(${(-s.x * s.y * 5 * k).toFixed(2)}deg, ${(s.x * s.y * 2 * k).toFixed(2)}deg) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
    };

    const tick = now => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      for (let t = 0; t < dt; t += 1 / 240) {
        s.vx += (stiffness * (s.tx - s.x) - damping * s.vx) / 240;
        s.vy += (stiffness * (s.ty - s.y) - damping * s.vy) / 240;
        s.x += s.vx / 240;
        s.y += s.vy / 240;
      }
      apply();
      const moving = Math.abs(s.tx - s.x) > 0.001 || Math.abs(s.ty - s.y) > 0.001 || Math.abs(s.vx) > 0.01 || Math.abs(s.vy) > 0.01;
      if (moving) frame = requestAnimationFrame(tick);
      else {
        Object.assign(s, { x: s.tx, y: s.ty, vx: 0, vy: 0 });
        apply();
        frame = 0;
      }
    };
    const wake = () => {
      if (reduced || frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const onMove = event => {
      const rect = root.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      root.style.setProperty('--bl-mx', `${(px * 100).toFixed(1)}%`);
      root.style.setProperty('--bl-my', `${(py * 100).toFixed(1)}%`);
      root.dataset.active = '';
      s.tx = Math.max(-1, Math.min(1, px * 2 - 1));
      s.ty = Math.max(-1, Math.min(1, py * 2 - 1));
      wake();
    };
    const onLeave = () => {
      delete root.dataset.active;
      s.tx = 0;
      s.ty = 0;
      // A little kick on release so it jiggles even after a slow exit.
      s.vx -= s.x * 3;
      s.vy -= s.y * 3;
      wake();
    };

    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointercancel', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointercancel', onLeave);
      body.style.transform = '';
    };
  }, [intensity, stiffness, damping]);

  return (
    <div ref={rootRef} className={`bl-wobble group/wob relative box-border w-full max-w-(--bl-w) touch-pan-y ${className}`} style={{ '--bl-w': `${width}px`, '--bl-pad': `${padding}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-ink': textColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-sheen': sheenColor, '--bl-font': fontFamily, ...style }}>
      <div ref={bodyRef} className="relative box-border origin-center overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) p-(--bl-pad) font-(family-name:--bl-font) text-(--bl-ink) shadow-[0_0_0_2px_var(--bl-line),0_18px_40px_-22px_rgba(0,0,0,0.8)] will-change-transform [transition:box-shadow_200ms] before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_var(--bl-mx,50%)_var(--bl-my,50%),var(--bl-sheen),transparent_60%)] before:opacity-0 before:[transition:opacity_250ms] before:content-[''] group-data-[active]/wob:shadow-[0_0_0_2px_var(--bl-accent),0_24px_48px_-22px_rgba(0,0,0,0.85)] group-data-[active]/wob:before:opacity-100 group-focus-within/wob:shadow-[0_0_0_2px_var(--bl-accent),0_18px_40px_-22px_rgba(0,0,0,0.8)]!">
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
