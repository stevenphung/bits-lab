import { useEffect, useRef } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Leave a trail. As the pointer moves across the area it drops stamps at a steady stride:
// by default little pixel footprints that alternate left and right and turn to face the way
// you're walking, or your own images (cycled in order). Each stamp pops in, then fades and
// shrinks away. Drawn on a canvas over the content, never blocking clicks; touch drags leave
// prints too. Reduced motion drops the pop and lets stamps simply fade.

const hexToRgb = hex => {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// A pixel footprint on a 5×8 grid, toes up: drawn into a canvas once, reused for every print.
const FOOT = ['.XXX.', 'XXXXX', 'XXXXX', '.XXXX', '.XXX.', '.....', '.XXX.', '.XXX.'];

function footSprite(rgb, cell) {
  const c = document.createElement('canvas');
  c.width = 5 * cell;
  c.height = 8 * cell;
  const g = c.getContext('2d');
  g.fillStyle = `rgb(${rgb.join(',')})`;
  FOOT.forEach((row, y) => [...row].forEach((ch, x) => ch === 'X' && g.fillRect(x * cell, y * cell, cell, cell)));
  return c;
}

export default function Footprints({
  children,
  stamps = 'feet',
  stride = 34,
  size = 22,
  life = 1600,
  spread = 9,
  jitter = 8,
  max = 60,
  color = '#94b0c2',
  className = '',
  style
}) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const stampKey = Array.isArray(stamps) ? stamps.join('|') : stamps;

  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const feet = stampKey === 'feet';
    const sprites = feet ? [footSprite(hexToRgb(color), 4)] : stampKey.split('|').map(src => Object.assign(new Image(), { src }));
    const prints = [];
    let W = 0;
    let H = 0;
    let dpr = 1;
    let last = null; // where the previous stamp landed
    let count = 0;
    let raf = 0;

    const fit = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = root.clientWidth;
      H = root.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };

    const tick = now => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.imageSmoothingEnabled = false;
      for (let i = prints.length - 1; i >= 0; i--) {
        const p = prints[i];
        const age = (now - p.at) / life;
        if (age >= 1) {
          prints.splice(i, 1);
          continue;
        }
        // Pop in over the first 12% of its life, then fade and shrink.
        const pop = reduced ? 1 : age < 0.12 ? 0.6 + (age / 0.12) * 0.55 : 1.15 - Math.min(0.15, (age - 0.12) * 0.6);
        const scale = pop * (1 - age * 0.35);
        const img = p.sprite;
        if (!img.width) continue;
        const w = size * scale;
        const h = (img.height / img.width) * w;
        ctx.save();
        ctx.globalAlpha = Math.min(1, (1 - age) * 1.4);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
      raf = prints.length ? requestAnimationFrame(tick) : 0;
    };

    const onMove = event => {
      const r = root.getBoundingClientRect();
      const x = event.clientX - r.left;
      const y = event.clientY - r.top;
      if (!last) {
        last = { x, y };
        return;
      }
      const dx = x - last.x;
      const dy = y - last.y;
      const d = Math.hypot(dx, dy);
      if (d < stride) return;
      const heading = Math.atan2(dy, dx);
      // Feet sit either side of the path; sprites point "up", so turn them to face the heading.
      const side = feet ? (count % 2 ? 1 : -1) : 0;
      const nx = -Math.sin(heading) * spread * side;
      const ny = Math.cos(heading) * spread * side;
      const turn = feet ? heading + Math.PI / 2 : ((Math.random() - 0.5) * jitter * Math.PI) / 180;
      prints.push({ x: x + nx, y: y + ny, angle: turn, at: performance.now(), sprite: sprites[count % sprites.length] });
      if (prints.length > max) prints.shift();
      count += 1;
      last = { x, y };
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => {
      last = null;
    };

    fit();
    const resize = new ResizeObserver(fit);
    resize.observe(root);
    root.addEventListener('pointermove', onMove, { passive: true });
    root.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, [stampKey, stride, size, life, spread, jitter, max, color]);

  return (
    <div ref={rootRef} className={className} style={{ position: 'relative', touchAction: 'pan-y', ...style }}>
      {children}
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
    </div>
  );
}
