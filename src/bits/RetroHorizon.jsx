import { useEffect, useRef } from 'react';

// Synthwave horizon: a gradient sky with stars, a striped setting sun, pixel mountains and a
// perspective grid rolling toward you. It's drawn at low resolution and scaled up with crisp
// pixels, so it matches pixel-art UIs (set pixelSize to 1 for a smooth version). Fills its
// parent, pauses off-screen and holds still under reduced motion.

function hexToRgb(hex) {
  const v = hex.replace('#', '');
  const full = v.length === 3 ? v.replace(/./g, c => c + c) : v.slice(0, 6);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const mix = (a, b, t) => {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * t)},${Math.round(g1 + (g2 - g1) * t)},${Math.round(b1 + (b2 - b1) * t)})`;
};

// Deterministic noise for mountain ridges and stars, so the scene is stable across resizes.
function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

export default function RetroHorizon({
  speed = 1,
  horizon = 0.55,
  pixelSize = 3,
  gridSpacing = 12,
  gridLines = 24,
  showSun = true,
  showMountains = true,
  stars = 60,
  skyTop = '#0b0b14',
  skyBottom = '#5d275d',
  sunTop = '#ffcd75',
  sunBottom = '#b13e53',
  mountainColor = '#1a1c2c',
  gridColor = '#73eff7',
  floorColor = '#0b0b14',
  className = '',
  style
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let w = 0;
    let h = 0;
    let frame = 0;
    let visible = true;
    let offset = 0;
    let last = performance.now();
    let starField = [];
    let ridge = [];

    const layout = () => {
      // Low-resolution buffer; CSS scales it up with pixelated rendering.
      w = Math.max(40, Math.round(wrap.clientWidth / pixelSize));
      h = Math.max(30, Math.round(wrap.clientHeight / pixelSize));
      canvas.width = w;
      canvas.height = h;
      const rand = seeded(7);
      const horizonY = Math.round(h * horizon);
      starField = Array.from({ length: stars }, () => [Math.floor(rand() * w), Math.floor(rand() * horizonY * 0.85), rand()]);
      ridge = [];
      let y = 0;
      for (let x = 0; x < w; x++) {
        y += (rand() - 0.5) * 2.2;
        y = Math.max(-h * 0.12, Math.min(0, y * 0.97));
        ridge.push(Math.round(y));
      }
      draw();
    };

    const draw = () => {
      const horizonY = Math.round(h * horizon);
      // Sky, in hard bands so it reads as pixel art.
      const bands = 10;
      for (let i = 0; i < bands; i++) {
        ctx.fillStyle = mix(skyTop, skyBottom, i / (bands - 1));
        ctx.fillRect(0, Math.floor((i / bands) * horizonY), w, Math.ceil(horizonY / bands) + 1);
      }
      for (const [x, y, twinkle] of starField) {
        const t = reduced ? 1 : 0.5 + 0.5 * Math.sin(last / 600 + twinkle * 20);
        ctx.fillStyle = `rgba(244,244,244,${0.3 + t * 0.6})`;
        ctx.fillRect(x, y, 1, 1);
      }

      // Sun: a disc whose lower half is cut by stripes that widen toward the horizon.
      if (showSun) {
        const r = Math.round(Math.min(w, h) * 0.22);
        const cx = Math.round(w / 2);
        const cy = horizonY - Math.round(r * 0.35);
        for (let y = -r; y <= r; y++) {
          const py = cy + y;
          if (py >= horizonY) break;
          const t = (y + r) / (2 * r);
          if (y > 0) {
            const stripe = Math.floor((y / r) * 6);
            const gap = 1 + Math.floor(stripe / 2);
            if (y % (gap + 3) < gap) continue;
          }
          const half = Math.round(Math.sqrt(r * r - y * y));
          ctx.fillStyle = mix(sunTop, sunBottom, t);
          ctx.fillRect(cx - half, py, half * 2, 1);
        }
      }

      if (showMountains) {
        ctx.fillStyle = mountainColor;
        ridge.forEach((dy, x) => {
          const peak = Math.round(Math.abs(Math.sin(x * 0.045)) * h * 0.07 + Math.abs(Math.sin(x * 0.13 + 1)) * h * 0.03);
          const top = horizonY - peak + dy;
          ctx.fillRect(x, top, 1, horizonY - top);
        });
      }

      // Floor and perspective grid.
      ctx.fillStyle = floorColor;
      ctx.fillRect(0, horizonY, w, h - horizonY);
      ctx.fillStyle = gridColor;
      const depth = h - horizonY;
      // Horizontal lines: evenly spaced in world depth, so they bunch up near the horizon.
      for (let i = 0; i < gridLines; i++) {
        const z = (i + (offset % 1)) / gridLines;
        const y = horizonY + Math.round(Math.pow(z, 2.2) * depth);
        if (y <= horizonY || y >= h) continue;
        ctx.globalAlpha = 0.25 + z * 0.75;
        ctx.fillRect(0, y, w, 1);
      }
      ctx.globalAlpha = 1;
      // Vertical lines fan out from the vanishing point.
      const vx = w / 2;
      const count = Math.ceil(w / gridSpacing) + 6;
      for (let i = -count; i <= count; i++) {
        const bottomX = vx + i * gridSpacing * 3;
        for (let y = horizonY + 1; y < h; y++) {
          const t = (y - horizonY) / depth;
          const x = Math.round(vx + (bottomX - vx) * t);
          if (x < 0 || x >= w) continue;
          ctx.globalAlpha = 0.2 + t * 0.8;
          ctx.fillRect(x, y, 1, 1);
        }
      }
      ctx.globalAlpha = 1;
      // Glow line on the horizon.
      ctx.fillStyle = sunTop;
      ctx.fillRect(0, horizonY, w, 1);
    };

    const tick = now => {
      frame = 0;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      offset += dt * speed;
      draw();
      if (visible) frame = requestAnimationFrame(tick);
    };

    const resize = new ResizeObserver(layout);
    resize.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame && !reduced && speed) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    });
    io.observe(wrap);
    layout();
    if (!reduced && speed) frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      io.disconnect();
    };
  }, [speed, horizon, pixelSize, gridSpacing, gridLines, showSun, showMountains, stars, skyTop, skyBottom, sunTop, sunBottom, mountainColor, gridColor, floorColor]);

  return (
    <div ref={wrapRef} className={className} style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}>
      <canvas ref={canvasRef} aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: pixelSize > 1 ? 'pixelated' : 'auto' }} />
    </div>
  );
}
