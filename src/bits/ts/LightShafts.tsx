import { useEffect, useRef, type CSSProperties } from 'react';

// Shafts of light. "rays" fans slow, swaying beams down from a light source like sun through a
// cave mouth; "beams" raises flickering pillars of light from the floor, like a save point;
// "lightning" forks bolts down the sky every so often and flashes the whole scene. Drawn at low
// resolution and scaled up crisply, so the light falls in pixel steps. Fills its parent, pauses
// off-screen; reduced motion holds a still frame and never flashes. Decorative.

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = ([r, g, b]: number[], a: number) => `rgba(${r},${g},${b},${a})`;

// A jagged bolt from (x, y) heading down: midpoint displacement, with the odd branch.
function bolt(x: number, y: number, length: number, angle: number, depth: number, out: number[][]): number[][] {
  const segs = 10;
  let px = x;
  let py = y;
  for (let i = 0; i < segs; i++) {
    const a = angle + (Math.random() - 0.5) * 0.9;
    const nx = px + Math.cos(a) * (length / segs);
    const ny = py + Math.sin(a) * (length / segs);
    out.push([px, py, nx, ny, depth]);
    if (depth < 2 && Math.random() < 0.18) bolt(nx, ny, length * 0.45, a + (Math.random() < 0.5 ? -0.6 : 0.6), depth + 1, out);
    px = nx;
    py = ny;
  }
  return out;
}

export interface LightShaftsProps {
  /** Swaying rays from a source, flickering floor pillars, or forked lightning with a flash. */
  mode?: 'rays' | 'beams' | 'lightning';
  /** Rays or pillars. */
  count?: number;
  speed?: number;
  /** Light source position as a share of the area. */
  originX?: number;
  originY?: number;
  /** Fan angle of the rays in degrees. */
  spread?: number;
  /** Roughly how often lightning strikes, in ms. */
  interval?: number;
  pixelSize?: number;
  /** [main, second]. */
  colors?: string[];
  backgroundColor?: string;
  className?: string;
  style?: CSSProperties;
}

export default function LightShafts({
  mode = 'rays',
  count = 7,
  speed = 1,
  originX = 0.5,
  originY = -0.05,
  spread = 70,
  interval = 3500,
  pixelSize = 3,
  colors = ['#ffcd75', '#f4f4f4'],
  backgroundColor = '#1a1c2c',
  className = '',
  style
}: LightShaftsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const main = hexToRgb(colors[0]);
    const second = hexToRgb(colors[1] ?? colors[0]);
    const bg = hexToRgb(backgroundColor);
    let w = 0;
    let h = 0;
    let t = 2;
    let raf = 0;
    let last = 0;
    let visible = true;
    let strike: { segs: number[][]; at: number } | null = null; // { segs, at }
    let nextStrike = 600;
    const pillars = Array.from({ length: count }, (_, i) => ({ x: (i + 0.5) / count + (Math.sin(i * 7.1) * 0.3) / count, width: 0.4 + ((i * 37) % 10) / 20, phase: i * 1.7 }));

    const fit = () => {
      w = Math.max(1, Math.ceil(canvas.clientWidth / pixelSize));
      h = Math.max(1, Math.ceil(canvas.clientHeight / pixelSize));
      canvas.width = w;
      canvas.height = h;
      ctx.imageSmoothingEnabled = false;
    };

    const rays = () => {
      const ox = originX * w;
      const oy = originY * h;
      const reach = Math.hypot(w, h) * 1.1;
      for (let i = 0; i < count; i++) {
        const base = ((i / Math.max(1, count - 1)) - 0.5) * ((spread * Math.PI) / 180);
        const a = Math.PI / 2 + base + Math.sin(t * 0.4 + i * 1.3) * 0.08;
        const half = 0.03 + 0.025 * (0.5 + 0.5 * Math.sin(t * 0.7 + i * 2.1));
        const glow = ctx.createLinearGradient(ox, oy, ox + Math.cos(a) * reach, oy + Math.sin(a) * reach);
        const tint = i % 2 ? second : main;
        const strength = 0.16 + 0.1 * Math.sin(t * 1.1 + i);
        glow.addColorStop(0, rgba(tint, strength * 1.8));
        glow.addColorStop(0.6, rgba(tint, strength * 0.5));
        glow.addColorStop(1, rgba(tint, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox + Math.cos(a - half) * reach, oy + Math.sin(a - half) * reach);
        ctx.lineTo(ox + Math.cos(a + half) * reach, oy + Math.sin(a + half) * reach);
        ctx.closePath();
        ctx.fill();
      }
    };

    const beams = () => {
      pillars.forEach((p, i) => {
        const flicker = 0.55 + 0.25 * Math.sin(t * 3 + p.phase) + 0.2 * Math.sin(t * 7.3 + p.phase * 2);
        const x = (p.x + Math.sin(t * 0.3 + p.phase) * 0.01) * w;
        const bw = Math.max(1, (w / count) * p.width * 0.5);
        const tint = i % 2 ? second : main;
        const glow = ctx.createLinearGradient(0, h, 0, 0);
        glow.addColorStop(0, rgba(tint, 0.55 * flicker));
        glow.addColorStop(0.5, rgba(tint, 0.18 * flicker));
        glow.addColorStop(1, rgba(tint, 0));
        ctx.fillStyle = glow;
        ctx.fillRect(Math.round(x - bw / 2), 0, Math.round(bw), h);
        // A bright core down the middle of each pillar.
        ctx.fillStyle = rgba(tint, 0.35 * flicker);
        ctx.fillRect(Math.round(x), Math.round(h * 0.35), 1, h);
      });
    };

    const lightning = (now: number) => {
      if (!strike || now - strike.at > 700) return;
      const age = (now - strike.at) / 700;
      // A quick double flash, then the bolt glows out.
      const flash = age < 0.08 || (age > 0.16 && age < 0.22) ? 0.35 : 0;
      if (flash) {
        ctx.fillStyle = rgba(second, flash);
        ctx.fillRect(0, 0, w, h);
      }
      ctx.fillStyle = rgba(main, 1 - age);
      strike.segs.forEach(([x0, y0, x1, y1, depth]) => {
        const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
        for (let k = 0; k <= steps; k++) ctx.fillRect(Math.round(x0 + ((x1 - x0) * k) / steps), Math.round(y0 + ((y1 - y0) * k) / steps), depth ? 1 : 2, depth ? 1 : 2);
      });
    };

    const draw = (now: number) => {
      ctx.globalCompositeOperation = 'source-over';
      const [r, g, b] = bg;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      if (mode === 'beams') beams();
      else if (mode === 'lightning') lightning(now);
      else rays();
      ctx.globalCompositeOperation = 'source-over';
    };

    const tick = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      t += dt * speed;
      if (mode === 'lightning') {
        nextStrike -= dt * 1000;
        if (nextStrike <= 0) {
          strike = { at: now, segs: bolt(w * (0.2 + Math.random() * 0.6), 0, h * 0.95, Math.PI / 2, 0, []) };
          nextStrike = interval * (0.6 + Math.random() * 0.8);
        }
      }
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
  }, [mode, count, speed, originX, originY, spread, interval, pixelSize, colors.join(), backgroundColor]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={{ display: 'block', width: '100%', height: '100%', background: backgroundColor, imageRendering: 'pixelated', ...style }} />;
}
