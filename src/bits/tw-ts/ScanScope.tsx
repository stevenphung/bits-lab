import { useEffect, useRef, type CSSProperties } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A scanner over a grid. In "radar" mode a beam sweeps round and round with a fading trail,
// over range rings and a pixel grid; in "line" mode a bar sweeps down the area like a scanner.
// Blips light up the moment the beam passes them, ping, and fade until the next pass. Give your
// own blips or let it scatter some. Fills its parent, pauses off-screen; reduced motion shows the
// grid with every blip lit and no beam. Decorative.

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = ([r, g, b]: number[], a: number) => `rgba(${r},${g},${b},${a})`;

export interface ScanScopeProps {
  /** A rotating sweep over range rings, or a bar scanning down. */
  mode?: 'radar' | 'line';
  /** A count to scatter, or positions in 0–1 of the area. */
  blips?: number | { x: number; y: number }[];
  /** Seconds per sweep. */
  period?: number;
  /** Length of the fading wake (share of a turn, or of the height). */
  trail?: number;
  rings?: number;
  gridSize?: number;
  pixelSize?: number;
  color?: string;
  blipColor?: string;
  gridColor?: string;
  backgroundColor?: string;
  className?: string;
  style?: CSSProperties;
}

export default function ScanScope({
  mode = 'radar',
  blips = 9,
  period = 4,
  trail = 0.22,
  rings = 4,
  gridSize = 28,
  pixelSize = 2,
  color = '#38b764',
  blipColor = '#ffcd75',
  gridColor = '#262b44',
  backgroundColor = '#0b0b14',
  className = '',
  style
}: ScanScopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blipKey = Array.isArray(blips) ? blips.map(b => `${b.x},${b.y}`).join(';') : String(blips);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const beam = hexToRgb(color);
    const dot = hexToRgb(blipColor);
    const grid = hexToRgb(gridColor);
    // Blips in 0…1 of the area; a scatter that's the same on every load when only a count is given.
    const points = (Array.isArray(blips) ? blips : Array.from({ length: blips }, (_, i) => ({ x: 0.15 + ((Math.sin(i * 91.7) * 0.5 + 0.5) * 0.7), y: 0.15 + ((Math.sin(i * 37.3 + 2) * 0.5 + 0.5) * 0.7) }))).map(p => ({ ...p, litAt: -1e9 }));
    let W = 0;
    let H = 0;
    let dpr = 1;
    let t = 0;
    let raf = 0;
    let last = 0;
    let visible = true;
    let prevSweep = 0;

    const fit = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };
    const snap = (v: number) => Math.round(v / pixelSize) * pixelSize;

    const drawGrid = (cx: number, cy: number, radius: number) => {
      ctx.fillStyle = rgba(grid, 1);
      for (let x = snap((W % gridSize) / 2); x < W; x += gridSize) for (let y = 0; y < H; y += pixelSize * 2) ctx.fillRect(x, y, 1, pixelSize);
      for (let y = snap((H % gridSize) / 2); y < H; y += gridSize) for (let x = 0; x < W; x += pixelSize * 2) ctx.fillRect(x, y, pixelSize, 1);
      if (mode !== 'radar') return;
      // Range rings as stepped pixel circles.
      ctx.fillStyle = rgba(beam, 0.35);
      for (let r = 1; r <= rings; r++) {
        const rr = (radius * r) / rings;
        const steps = Math.ceil((rr * Math.PI * 2) / (pixelSize * 2));
        for (let k = 0; k < steps; k++) {
          const a = (k / steps) * Math.PI * 2;
          ctx.fillRect(snap(cx + Math.cos(a) * rr), snap(cy + Math.sin(a) * rr), pixelSize, pixelSize);
        }
      }
    };

    const draw = (now: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, W, H);
      const cx = W / 2;
      const cy = H / 2;
      const radius = Math.min(W, H) * 0.46;
      drawGrid(cx, cy, radius);
      const turn = (t / period) % 1;
      if (!reduced) {
        if (mode === 'radar') {
          // The beam and its fading wake, as thin wedges of decreasing strength.
          const slices = 28;
          for (let s = 0; s < slices; s++) {
            const a0 = (turn - (trail * (s + 1)) / slices) * Math.PI * 2;
            const a1 = (turn - (trail * s) / slices) * Math.PI * 2;
            ctx.fillStyle = rgba(beam, 0.35 * (1 - s / slices) ** 2);
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, a0, a1);
            ctx.closePath();
            ctx.fill();
          }
        } else {
          const y = turn * H;
          const glow = ctx.createLinearGradient(0, y - H * trail, 0, y);
          glow.addColorStop(0, rgba(beam, 0));
          glow.addColorStop(1, rgba(beam, 0.35));
          ctx.fillStyle = glow;
          ctx.fillRect(0, y - H * trail, W, H * trail);
          ctx.fillStyle = rgba(beam, 0.9);
          ctx.fillRect(0, snap(y), W, pixelSize);
        }
      }
      points.forEach(p => {
        const x = mode === 'radar' ? cx + (p.x - 0.5) * radius * 2 : p.x * W;
        const y = mode === 'radar' ? cy + (p.y - 0.5) * radius * 2 : p.y * H;
        if (mode === 'radar' && Math.hypot(x - cx, y - cy) > radius) return;
        const age = reduced ? 0 : (now - p.litAt) / (period * 1000);
        if (age >= 1) return;
        const a = 1 - age;
        const s = pixelSize * 3;
        ctx.fillStyle = rgba(dot, a);
        ctx.fillRect(snap(x) - s / 2, snap(y) - s / 2, s, s);
        // A ping ring that grows for the first moments after the beam hits.
        if (age < 0.25 && !reduced) {
          const rr = 4 + (age / 0.25) * 18;
          ctx.fillStyle = rgba(dot, (1 - age / 0.25) * 0.8);
          const steps = 16;
          for (let k = 0; k < steps; k++) {
            const ang = (k / steps) * Math.PI * 2;
            ctx.fillRect(snap(x + Math.cos(ang) * rr), snap(y + Math.sin(ang) * rr), pixelSize, pixelSize);
          }
        }
      });
    };

    const tick = (now: number) => {
      t += Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      const turn = (t / period) % 1;
      // Light every blip the beam crossed since the last frame.
      points.forEach(p => {
        let at: number;
        if (mode === 'radar') at = ((Math.atan2(p.y - 0.5, p.x - 0.5) / (Math.PI * 2)) + 1) % 1;
        else at = p.y;
        const crossed = prevSweep <= turn ? at > prevSweep && at <= turn : at > prevSweep || at <= turn;
        if (crossed) p.litAt = now;
      });
      prevSweep = turn;
      draw(now);
      raf = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (raf || reduced || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const resize = new ResizeObserver(() => {
      fit();
      draw(performance.now());
    });
    resize.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    observer.observe(canvas);
    document.addEventListener('visibilitychange', start);
    fit();
    draw(performance.now());
    start();
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, blipKey, period, trail, rings, gridSize, pixelSize, color, blipColor, gridColor, backgroundColor]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={{ display: 'block', width: '100%', height: '100%', background: backgroundColor, ...style }} />;
}
