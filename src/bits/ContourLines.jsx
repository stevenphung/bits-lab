import { useEffect, useRef } from 'react';

// A topographic map that slowly breathes. Height comes from drifting noise; every contour is
// traced in single pixels, with every few lines drawn brighter like the index lines on a real
// map, and the bands between can be tinted like an atlas. The pointer raises a hill, so rings
// gather around it as you move. Fills its parent, pauses off-screen; reduced motion holds one
// still frame. Decorative.

const hexToRgb = hex => {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

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

export default function ContourLines({
  levels = 14,
  major = 5,
  scale = 1,
  speed = 1,
  pixelSize = 2,
  tint = true,
  pointer = true,
  lineColor = '#73eff7',
  majorColor = '#f4f4f4',
  bandColors = ['#1a1c2c', '#262b44'],
  className = '',
  style
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const line = hexToRgb(lineColor);
    const strong = hexToRgb(majorColor);
    const bands = bandColors.map(hexToRgb);
    const hand = { x: -1, y: -1, lift: 0, on: false };
    let w = 0;
    let h = 0;
    let img = null;
    let level = new Int16Array(0);
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
      level = new Int16Array(w * h);
    };

    const frame = () => {
      const k = (2.2 * scale) / Math.max(w, h);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          let v = noise(x * k * 1.6, y * k * 1.6, t * 0.12) * 0.7 + noise(x * k * 4, y * k * 4, t * 0.2 + 5) * 0.3;
          if (hand.lift > 0.01) {
            const dx = (x - hand.x) / w;
            const dy = (y - hand.y) / w;
            v += Math.exp(-(dx * dx + dy * dy) / 0.01) * 0.35 * hand.lift;
          }
          level[y * w + x] = Math.floor(v * levels);
        }
      }
      const d = img.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          const L = level[i];
          // A pixel is on a contour where its level differs from the pixel to its right or below.
          const edge = (x + 1 < w && level[i + 1] !== L) || (y + 1 < h && level[i + w] !== L);
          let c;
          if (edge) c = Math.max(L, x + 1 < w ? level[i + 1] : L, y + 1 < h ? level[i + w] : L) % major === 0 ? strong : line;
          else c = tint ? bands[((L % bands.length) + bands.length) % bands.length] : bands[0];
          const o = i * 4;
          d[o] = c[0];
          d[o + 1] = c[1];
          d[o + 2] = c[2];
          d[o + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    const tick = now => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      t += dt * speed;
      hand.lift += ((hand.on ? 1 : 0) - hand.lift) * Math.min(1, dt * 4);
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
        hand.lift = 1;
        frame();
      }
    };
    const onLeave = () => {
      hand.on = false;
      if (reduced) {
        hand.lift = 0;
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
  }, [levels, major, scale, speed, pixelSize, tint, pointer, lineColor, majorColor, bandColors.join()]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={{ display: 'block', width: '100%', height: '100%', background: bandColors[0], imageRendering: 'pixelated', touchAction: 'pan-y', ...style }} />;
}
