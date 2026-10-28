import { useEffect, useInsertionEffect, useRef } from 'react';

// A jelly card. It leans and stretches toward the pointer, a soft sheen follows it, and when
// the pointer leaves it springs back with a wobble that settles. Touch drags work the same
// way. Under reduced motion the card stays still and only the sheen and border react.

const STYLE_ID = 'bl-wobble-card';
const CSS = `
.bl-wobble { position: relative; box-sizing: border-box; width: 100%; max-width: var(--bl-w); touch-action: pan-y; }
.bl-wobble__body { position: relative; box-sizing: border-box; overflow: hidden; padding: var(--bl-pad); border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); box-shadow: 0 0 0 2px var(--bl-line), 0 18px 40px -22px rgba(0,0,0,0.8); transform-origin: 50% 50%; will-change: transform; transition: box-shadow 200ms; }
.bl-wobble__body::before { content: ""; position: absolute; inset: 0; border-radius: inherit; background: radial-gradient(circle at var(--bl-mx, 50%) var(--bl-my, 50%), var(--bl-sheen), transparent 60%); opacity: 0; transition: opacity 250ms; pointer-events: none; }
.bl-wobble[data-active] .bl-wobble__body { box-shadow: 0 0 0 2px var(--bl-accent), 0 24px 48px -22px rgba(0,0,0,0.85); }
.bl-wobble[data-active] .bl-wobble__body::before { opacity: 1; }
.bl-wobble:focus-within .bl-wobble__body { box-shadow: 0 0 0 2px var(--bl-accent), 0 18px 40px -22px rgba(0,0,0,0.8); }
.bl-wobble__content { position: relative; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function WobbleCard({
  children,
  intensity = 1,
  stiffness = 170,
  damping = 9,
  width = 360,
  padding = 24,
  radius = 18,
  backgroundColor = '#262b44',
  textColor = '#f4f4f4',
  lineColor = '#333c57',
  accentColor = '#73eff7',
  sheenColor = 'rgba(115,239,247,0.18)',
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
    <div ref={rootRef} className={`bl-wobble ${className}`} style={{ '--bl-w': `${width}px`, '--bl-pad': `${padding}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-ink': textColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-sheen': sheenColor, '--bl-font': fontFamily, ...style }}>
      <div ref={bodyRef} className="bl-wobble__body">
        <div className="bl-wobble__content">{children}</div>
      </div>
    </div>
  );
}
