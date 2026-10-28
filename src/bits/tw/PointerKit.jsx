import { useEffect, useRef } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// One custom-pointer layer, five looks you can combine: "trail" leaves a stream of fading
// pixel squares; "crosshair" draws HUD lines across the area with a coordinate readout;
// "target" snaps corner brackets onto whatever link or button is under the pointer; "sparks"
// throws pixel sparks on every click; "blob" is a soft follower that lags and squashes with
// speed. Everything is drawn on one canvas over the area (or the whole window with `global`),
// never blocks clicks, and skips touch-only devices except for sparks. Reduced motion keeps the
// crosshair and target (without easing) and drops the rest.

const hexToRgb = hex => {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = ([r, g, b], a) => `rgba(${r},${g},${b},${a})`;

const TARGETS = 'a, button, input, select, textarea, [role="button"], [data-pointer-target]';

export default function PointerKit({
  children,
  mode = ['trail', 'sparks'],
  global = false,
  hideCursor = false,
  color = '#73eff7',
  accentColor = '#ffcd75',
  pixelSize = 6,
  trailLength = 24,
  smoothing = 0.18,
  targets = TARGETS,
  sparkCount = 14,
  className = '',
  style
}) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const modes = Array.isArray(mode) ? mode : [mode];
  const key = modes.join(',');

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia?.('(pointer: fine)').matches ?? true;
    const on = new Set(key.split(','));
    if (reduced) ['trail', 'blob', 'sparks'].forEach(m => on.delete(m));
    if (!fine) ['trail', 'blob', 'crosshair', 'target'].forEach(m => on.delete(m));
    const main = hexToRgb(color);
    const accent = hexToRgb(accentColor);
    const area = global ? window : root;
    let W = 0;
    let H = 0;
    let dpr = 1;
    const p = { x: -1e4, y: -1e4, inside: false };
    const blob = { x: -1e4, y: -1e4, vx: 0, vy: 0 };
    const trail = [];
    const sparks = [];
    let box = null; // the bracket rect, eased toward the hovered target
    let goal = null;
    let raf = 0;
    let last = 0;

    const size = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = global ? window.innerWidth : root.clientWidth;
      H = global ? window.innerHeight : root.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };
    const origin = () => (global ? { left: 0, top: 0 } : root.getBoundingClientRect());

    const draw = now => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const snap = v => Math.round(v / pixelSize) * pixelSize;

      if (on.has('trail')) {
        trail.forEach((t, i) => {
          const life = 1 - (now - t.at) / (trailLength * 22);
          if (life <= 0) return;
          const s = Math.max(2, pixelSize * life * (i / trail.length + 0.4));
          ctx.fillStyle = rgba(i % 3 === 0 ? accent : main, life * 0.9);
          ctx.fillRect(snap(t.x) - s / 2, snap(t.y) - s / 2, s, s);
        });
      }
      if (on.has('blob') && p.inside) {
        const speed = Math.min(1, Math.hypot(blob.vx, blob.vy) / 40);
        const angle = Math.atan2(blob.vy, blob.vx);
        ctx.save();
        ctx.translate(blob.x, blob.y);
        ctx.rotate(angle);
        ctx.scale(1 + speed * 0.6, 1 - speed * 0.35);
        ctx.fillStyle = rgba(main, 0.35);
        ctx.beginPath();
        ctx.arc(0, 0, pixelSize * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      if (on.has('crosshair') && p.inside) {
        ctx.fillStyle = rgba(main, 0.45);
        const x = Math.round(p.x);
        const y = Math.round(p.y);
        // Dashed in pixel steps, with a gap around the pointer itself.
        for (let i = 0; i < W; i += pixelSize * 2) if (Math.abs(i - x) > pixelSize * 3) ctx.fillRect(i, y, pixelSize, 1);
        for (let i = 0; i < H; i += pixelSize * 2) if (Math.abs(i - y) > pixelSize * 3) ctx.fillRect(x, i, 1, pixelSize);
        ctx.font = `10px ui-monospace, monospace`;
        ctx.fillStyle = rgba(accent, 0.9);
        ctx.fillText(`${x},${y}`, Math.min(W - 60, x + 10), Math.max(12, y - 8));
      }
      if (on.has('target') && box) {
        const arm = Math.min(14, box.w / 3, box.h / 3);
        ctx.strokeStyle = rgba(accent, box.alpha);
        ctx.lineWidth = 2;
        const corners = [
          [box.x, box.y, 1, 1],
          [box.x + box.w, box.y, -1, 1],
          [box.x, box.y + box.h, 1, -1],
          [box.x + box.w, box.y + box.h, -1, -1]
        ];
        ctx.beginPath();
        corners.forEach(([cx, cy, sx, sy]) => {
          ctx.moveTo(cx, cy + sy * arm);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx + sx * arm, cy);
        });
        ctx.stroke();
      }
      sparks.forEach(s => {
        ctx.fillStyle = rgba(s.accent ? accent : main, Math.max(0, s.life));
        ctx.fillRect(snap(s.x), snap(s.y), pixelSize * 0.8, pixelSize * 0.8);
      });
    };

    const tick = now => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      // Blob: a lagging spring toward the pointer.
      const k = reduced ? 1 : smoothing;
      blob.vx = (p.x - blob.x) * k;
      blob.vy = (p.y - blob.y) * k;
      blob.x += blob.vx;
      blob.y += blob.vy;
      while (trail.length && now - trail[0].at > trailLength * 22) trail.shift();
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vy += 600 * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.life -= dt * 1.6;
        if (s.life <= 0) sparks.splice(i, 1);
      }
      if (on.has('target')) {
        if (goal && !box) box = { ...goal, alpha: 0 };
        if (box) {
          const to = goal ?? box;
          const e = reduced ? 1 : 0.3;
          box.x += (to.x - box.x) * e;
          box.y += (to.y - box.y) * e;
          box.w += (to.w - box.w) * e;
          box.h += (to.h - box.h) * e;
          box.alpha += ((goal ? 1 : 0) - box.alpha) * (reduced ? 1 : 0.25);
          if (!goal && box.alpha < 0.02) box = null;
        }
      }
      draw(now);
      const busy = trail.length || sparks.length || (on.has('blob') && Math.hypot(blob.vx, blob.vy) > 0.1) || (box && (goal ? Math.abs(goal.x - box.x) + Math.abs(goal.w - box.w) > 0.3 || box.alpha < 0.98 : true));
      raf = busy ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = event => {
      const o = origin();
      p.x = event.clientX - o.left;
      p.y = event.clientY - o.top;
      p.inside = true;
      if (on.has('trail')) {
        trail.push({ x: p.x, y: p.y, at: performance.now() });
        if (trail.length > trailLength) trail.shift();
      }
      if (on.has('target')) {
        const el = event.target.closest?.(targets);
        if (el && (global || root.contains(el))) {
          const r = el.getBoundingClientRect();
          goal = { x: r.left - o.left - 4, y: r.top - o.top - 4, w: r.width + 8, h: r.height + 8 };
        } else goal = null;
      }
      if (blob.x < -1e3) {
        blob.x = p.x;
        blob.y = p.y;
      }
      wake();
    };
    const onLeave = () => {
      p.inside = false;
      goal = null;
      blob.x = -1e4;
      wake();
    };
    const onDown = event => {
      if (!on.has('sparks')) return;
      const o = origin();
      const x = event.clientX - o.left;
      const y = event.clientY - o.top;
      for (let i = 0; i < sparkCount; i++) {
        const a = (i / sparkCount) * Math.PI * 2 + Math.random() * 0.4;
        const v = 140 + Math.random() * 160;
        sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, life: 1, accent: i % 2 === 0 });
      }
      wake();
    };

    size();
    const resize = new ResizeObserver(size);
    resize.observe(root);
    window.addEventListener('resize', size);
    area.addEventListener('pointermove', onMove, { passive: true });
    area.addEventListener('pointerdown', onDown, { passive: true });
    (global ? document.documentElement : root).addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      window.removeEventListener('resize', size);
      area.removeEventListener('pointermove', onMove);
      area.removeEventListener('pointerdown', onDown);
      (global ? document.documentElement : root).removeEventListener('pointerleave', onLeave);
    };
  }, [key, global, color, accentColor, pixelSize, trailLength, smoothing, targets, sparkCount]);

  return (
    <div ref={rootRef} className={className} style={{ position: 'relative', cursor: hideCursor ? 'none' : undefined, ...style }}>
      {children}
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: global ? 'fixed' : 'absolute', inset: 0, width: global ? '100vw' : '100%', height: global ? '100vh' : '100%', pointerEvents: 'none', zIndex: 2147483000 }} />
    </div>
  );
}
