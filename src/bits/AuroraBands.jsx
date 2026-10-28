import { useEffect, useRef } from 'react';

// Northern lights in pixel bands. A few curtains of light ripple across a starry sky, each with
// a sharp lower edge that fades upward like the real thing, and their glow is stepped into a
// handful of flat bands, the way an old game would draw it. Rendered at low resolution and
// scaled up crisply; fills its parent, pauses off-screen, and shows one still frame under
// reduced motion. Decorative.

const hexToRgb = hex => {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export default function AuroraBands({
  colors = ['#38b764', '#73eff7', '#b13e53'],
  ribbons = 3,
  speed = 1,
  bands = 5,
  height = 0.38,
  pixelSize = 4,
  stars = 70,
  skyTop = '#0b0b14',
  skyBottom = '#1a1c2c',
  className = '',
  style
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const tints = colors.map(hexToRgb);
    const top = hexToRgb(skyTop);
    const bottom = hexToRgb(skyBottom);
    let w = 0;
    let h = 0;
    let img = null;
    let sky = [];
    let field = [];
    let t = 3;
    let raf = 0;
    let last = 0;
    let visible = true;

    const fit = () => {
      w = Math.max(1, Math.ceil(canvas.clientWidth / pixelSize));
      h = Math.max(1, Math.ceil(canvas.clientHeight / pixelSize));
      canvas.width = w;
      canvas.height = h;
      img = ctx.createImageData(w, h);
      // The sky gradient per row, and a fixed scatter of stars.
      sky = Array.from({ length: h }, (_, y) => top.map((c, k) => c + (bottom[k] - c) * (y / h)));
      field = Array.from({ length: stars }, (_, i) => ({ x: Math.floor((Math.sin(i * 12.9898) * 0.5 + 0.5) * w), y: Math.floor(((Math.sin(i * 78.233) * 0.5 + 0.5) * h) * 0.8), phase: i }));
    };

    const frame = () => {
      const d = img.data;
      for (let y = 0; y < h; y++) {
        const [r, g, b] = sky[y];
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          d[i] = r;
          d[i + 1] = g;
          d[i + 2] = b;
          d[i + 3] = 255;
        }
      }
      field.forEach(s => {
        const twinkle = 0.5 + 0.5 * Math.sin(t * 2 + s.phase);
        const i = (s.y * w + s.x) * 4;
        const v = 120 + twinkle * 135;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
      });
      for (let r = 0; r < ribbons; r++) {
        const [cr, cg, cb] = tints[r % tints.length];
        for (let x = 0; x < w; x++) {
          const u = x / w;
          // Where the curtain hangs at this column, how thick it is, and a vertical shimmer.
          const centre = h * (0.32 + r * 0.1 + 0.1 * Math.sin(u * 5 + t * 0.5 + r * 1.9) + 0.05 * Math.sin(u * 13 - t * 0.9 + r));
          const thick = h * height * (0.5 + 0.25 * Math.sin(u * 7 + t * 0.7 + r * 2.3));
          const streak = 0.65 + 0.35 * Math.sin(x * 0.9 + t * 3 + r * 5) * Math.sin(x * 0.23 - t);
          for (let y = 0; y < h; y++) {
            const dy = (y - centre) / thick;
            // Sharp bottom edge, long fade upward.
            let v = dy > 0 ? Math.exp(-dy * dy * 9) : Math.exp(dy * 1.6);
            v *= streak;
            if (v < 0.08) continue;
            const level = Math.floor(v * bands) / bands;
            if (!level) continue;
            const i = (y * w + x) * 4;
            d[i] = Math.min(255, d[i] + cr * level);
            d[i + 1] = Math.min(255, d[i + 1] + cg * level);
            d[i + 2] = Math.min(255, d[i + 2] + cb * level);
          }
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
    fit();
    frame();
    start();
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colors.join(), ribbons, speed, bands, height, pixelSize, stars, skyTop, skyBottom]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={{ display: 'block', width: '100%', height: '100%', background: skyTop, imageRendering: 'pixelated', ...style }} />;
}
