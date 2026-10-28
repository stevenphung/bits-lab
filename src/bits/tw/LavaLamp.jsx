import { useEffect, useRef } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A pixel lava lamp. Soft blobs drift up and sink back down at their own pace, merging and
// pulling apart where they meet, with a hot pool at the bottom and a lighter rim around every
// blob. With `pointer` on, the pointer is a blob of its own you can push through the wax. Drawn
// as a low-resolution metaball field, scaled up crisply. Fills its parent, pauses off-screen;
// reduced motion holds one still frame. Decorative.

const hexToRgb = hex => {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

export default function LavaLamp({
  blobs = 7,
  speed = 1,
  size = 1,
  pointer = true,
  pixelSize = 5,
  topColor = '#ffcd75',
  bottomColor = '#b13e53',
  rimColor = '#f4f4f4',
  backgroundTop = '#29366f',
  backgroundBottom = '#1a1c2c',
  className = '',
  style
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const hot = hexToRgb(bottomColor);
    const cool = hexToRgb(topColor);
    const rim = hexToRgb(rimColor);
    const bgTop = hexToRgb(backgroundTop);
    const bgBottom = hexToRgb(backgroundBottom);
    // Each blob rises and falls on its own slow cycle (positions in 0…1 of the lamp).
    const wax = Array.from({ length: blobs }, (_, i) => ({ x: 0.15 + (((i * 41) % 70) / 100), r: (0.07 + ((i * 13) % 6) / 100) * size, period: 9 + ((i * 7) % 8), phase: i * 1.37, sway: 0.04 + ((i * 3) % 5) / 100 }));
    const hand = { x: -10, y: -10, on: false };
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

    const frame = () => {
      const d = img.data;
      const aspect = w / h;
      const live = wax.map(b => {
        const cycle = (Math.sin(((t / b.period) * Math.PI * 2) + b.phase) + 1) / 2;
        return { x: (b.x + Math.sin(t * 0.3 + b.phase) * b.sway) * aspect, y: 0.12 + cycle * 0.8, r2: b.r * b.r };
      });
      if (hand.on) live.push({ x: hand.x * aspect, y: hand.y, r2: 0.006 * size });
      for (let py = 0; py < h; py++) {
        const y = py / h;
        const back = mix(bgTop, bgBottom, y);
        for (let px = 0; px < w; px++) {
          const x = (px / w) * aspect;
          // Sum of r²/d² from every blob, plus the hot pool along the bottom.
          let f = Math.max(0, (y - 0.9) * 9);
          for (let k = 0; k < live.length; k++) {
            const b = live[k];
            const dx = x - b.x;
            const dy = y - b.y;
            f += b.r2 / (dx * dx + dy * dy + 1e-5);
          }
          const i = (py * w + px) * 4;
          let c = back;
          if (f > 1) c = mix(cool, hot, y);
          else if (f > 0.82) c = mix(rim, mix(cool, hot, y), 0.35);
          d[i] = c[0];
          d[i + 1] = c[1];
          d[i + 2] = c[2];
          d[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    const tick = now => {
      t += Math.max(0, Math.min(0.05, (now - last) / 1000)) * speed;
      last = now;
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
      hand.x = (event.clientX - r.left) / r.width;
      hand.y = (event.clientY - r.top) / r.height;
      hand.on = true;
      if (reduced) frame();
    };
    const onLeave = () => {
      hand.on = false;
      if (reduced) frame();
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
  }, [blobs, speed, size, pointer, pixelSize, topColor, bottomColor, rimColor, backgroundTop, backgroundBottom]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={{ display: 'block', width: '100%', height: '100%', background: backgroundBottom, imageRendering: 'pixelated', touchAction: 'pan-y', ...style }} />;
}
