import { useEffect, useRef } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A slowly moving colour field drawn with only a few colours, the way 8-bit machines faked
// gradients: an ordered (Bayer) dither picks between neighbouring palette colours pixel by
// pixel. Choose what moves underneath, drifting "noise" clouds, rolling "waves" or a pulsing
// "radial" glow, and the pointer adds a warm spot. Fills its parent, pauses off-screen; reduced
// motion holds one still frame. Decorative.

const hexToRgb = hex => {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21].map(v => (v + 0.5) / 64);

// Smooth value noise in 3D (x, y, time), from a cheap integer hash.
const hash = (x, y, z) => {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1440662683);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
const fade = t => t * t * (3 - 2 * t);
function noise(x, y, z) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = fade(x - xi);
  const v = fade(y - yi);
  const w = fade(z - zi);
  const lerp = (a, b, k) => a + (b - a) * k;
  const corner = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz);
  return lerp(
    lerp(lerp(corner(0, 0, 0), corner(1, 0, 0), u), lerp(corner(0, 1, 0), corner(1, 1, 0), u), v),
    lerp(lerp(corner(0, 0, 1), corner(1, 0, 1), u), lerp(corner(0, 1, 1), corner(1, 1, 1), u), v),
    w
  );
}

export default function DitherField({
  pattern = 'noise',
  palette = ['#1a1c2c', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75'],
  scale = 1,
  speed = 1,
  pixelSize = 3,
  pointer = true,
  className = '',
  style
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const colors = palette.map(hexToRgb);
    const steps = colors.length - 1;
    const hand = { x: -1, y: -1, glow: 0, on: false };
    let w = 0;
    let h = 0;
    let img = null;
    let t = 0;
    let raf = 0;
    let last = 0;
    let visible = true;

    const fit = () => {
      w = Math.max(1, Math.ceil(canvas.clientWidth / pixelSize));
      h = Math.max(1, Math.ceil(canvas.clientHeight / pixelSize));
      canvas.width = w;
      canvas.height = h;
      img = ctx.createImageData(w, h);
    };

    const value = (x, y) => {
      const u = x / w;
      const v = y / h;
      const k = 3 * scale;
      if (pattern === 'waves') return 0.5 + 0.25 * Math.sin(u * k * 4 + Math.sin(v * k * 2 + t * 0.7) * 1.5 + t * 0.5) + 0.25 * Math.sin(v * k * 3 - t * 0.4);
      if (pattern === 'radial') {
        const d = Math.hypot(u - 0.5, (v - 0.5) * (h / w)) * 2;
        return 0.5 + 0.5 * Math.cos(d * k * 3 - t * 1.2);
      }
      // Noise mostly lands mid-range; stretch it so the whole palette gets used.
      const n = noise(u * k * 2, v * k * 2 * (h / w), t * 0.25) * 0.65 + noise(u * k * 5, v * k * 5 * (h / w), t * 0.4 + 9) * 0.35;
      return (n - 0.22) / 0.56;
    };

    const frame = () => {
      const d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let v = value(x, y);
          if (hand.glow > 0.01) {
            const dx = (x - hand.x) / w;
            const dy = (y - hand.y) / w;
            v += Math.exp(-(dx * dx + dy * dy) / 0.012) * 0.6 * hand.glow;
          }
          // Between which two palette colours does this value fall, and how far along? The
          // Bayer threshold decides, pixel by pixel, which of the two to show.
          const pos = Math.max(0, Math.min(steps, v * steps));
          const base = Math.min(steps - 1, Math.floor(pos));
          const pick = pos - base > BAYER[(y & 7) * 8 + (x & 7)] ? base + 1 : base;
          const c = colors[pick];
          const i = (y * w + x) * 4;
          d[i] = c[0];
          d[i + 1] = c[1];
          d[i + 2] = c[2];
          d[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    const tick = now => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      t += dt * speed;
      hand.glow += ((hand.on ? 1 : 0) - hand.glow) * Math.min(1, dt * 5);
      frame();
      raf = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (raf || reduced || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const onMove = event => {
      if (!pointer) return;
      const r = canvas.getBoundingClientRect();
      hand.x = ((event.clientX - r.left) / r.width) * w;
      hand.y = ((event.clientY - r.top) / r.height) * h;
      hand.on = true;
      if (reduced) {
        hand.glow = 1;
        frame();
      }
    };
    const onLeave = () => {
      hand.on = false;
      if (reduced) {
        hand.glow = 0;
        frame();
      }
    };

    const resize = new ResizeObserver(() => {
      fit();
      frame();
    });
    resize.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    observer.observe(canvas);
    document.addEventListener('visibilitychange', start);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    fit();
    frame();
    start();
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', start);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern, palette.join(), scale, speed, pixelSize, pointer]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={{ display: 'block', width: '100%', height: '100%', background: palette[0], imageRendering: 'pixelated', touchAction: 'pan-y', ...style }} />;
}
