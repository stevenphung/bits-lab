import { useEffect, useRef, type CSSProperties } from 'react';

// A night sky with meteors streaking across it on a shared heading, each with a fading tail
// and a bright head, over a field of twinkling stars. Set `pixelSize` to draw everything as
// crisp blocks snapped to a grid (8-bit style), or 0 for smooth streaks. Canvas-based, fills
// its parent, pauses off-screen; under reduced motion the stars hold still and a few meteors
// are drawn frozen mid-flight.

function rgba(hex: string, alpha: number) {
  const v = hex.replace('#', '');
  const full = v.length === 3 ? v.replace(/./g, (c: string) => c + c) : v.slice(0, 6);
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export interface MeteorShowerProps {
  /** Average meteors per second. */
  rate?: number;
  /** Shared heading in degrees: 0 is right, 90 is down. */
  angle?: number;
  /** Speed range in px per second. */
  minSpeed?: number;
  maxSpeed?: number;
  /** Tail length in px (varies ±40%). */
  tail?: number;
  thickness?: number;
  /** Snap to blocks of this size; 0 draws smooth streaks. */
  pixelSize?: number;
  /** Number of background stars. */
  stars?: number;
  headColor?: string;
  tailColor?: string;
  starColor?: string;
  backgroundColor?: string;
  className?: string;
  style?: CSSProperties;
}

export default function MeteorShower({
  rate = 2.5,
  angle = 135,
  minSpeed = 500,
  maxSpeed = 1000,
  tail = 180,
  thickness = 2,
  pixelSize = 4,
  stars = 90,
  headColor = '#f4f4f4',
  tailColor = '#73eff7',
  starColor = '#94b0c2',
  backgroundColor = 'transparent',
  className = '',
  style
}: MeteorShowerProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const heading = (angle * Math.PI) / 180;
    const dir = [Math.cos(heading), Math.sin(heading)];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let field: { x: number; y: number; size: number; phase: number; speed: number }[] = [];
    let meteors: { x: number; y: number; speed: number; d: number; travel: number; len: number }[] = [];
    let frame = 0;
    let visible = true;
    let last = performance.now();
    let spawnDebt = 0;
    let time = 0;

    const snap = (v: number) => (pixelSize ? Math.round(v / pixelSize) * pixelSize : v);

    // Start somewhere on screen, then back up along the heading until fully off-screen.
    const spawn = (progress = 0) => {
      const diag = Math.hypot(width, height);
      const px = Math.random() * width;
      const py = Math.random() * height;
      const back = diag / 2 + tail;
      const travel = (back + diag / 2 + tail) * 1.1;
      meteors.push({ x: px - dir[0] * back, y: py - dir[1] * back, speed: minSpeed + Math.random() * (maxSpeed - minSpeed), d: travel * progress, travel, len: tail * (0.6 + Math.random() * 0.6) });
    };

    const layout = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      width = wrap.clientWidth;
      height = wrap.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      field = Array.from({ length: stars }, () => ({ x: Math.random() * width, y: Math.random() * height, size: Math.random() < 0.15 ? 2 : 1, phase: Math.random() * Math.PI * 2, speed: 0.6 + Math.random() * 1.8 }));
      meteors = [];
      if (reduced) for (let i = 0; i < 3; i++) spawn(0.35 + i * 0.12);
      draw();
    };

    const square = (x: number, y: number, s: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(snap(x) - s / 2, snap(y) - s / 2, s, s);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      if (backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, width, height);
      }
      field.forEach(s => {
        const a = reduced ? 0.6 : 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(s.phase + time * s.speed));
        const size = pixelSize ? Math.max(pixelSize / 2, s.size * (pixelSize / 2)) : s.size;
        square(s.x, s.y, size, rgba(starColor, a));
      });
      meteors.forEach(m => {
        const hx = m.x + dir[0] * m.d;
        const hy = m.y + dir[1] * m.d;
        if (pixelSize) {
          // Blocks along the tail, fading and shrinking toward the end.
          const step = pixelSize;
          for (let t = m.len; t >= 0; t -= step) {
            const k = 1 - t / m.len;
            const size = Math.max(pixelSize / 2, Math.round(thickness * k + 1) * (pixelSize / 2));
            square(hx - dir[0] * t, hy - dir[1] * t, size, rgba(tailColor, k * k * 0.9));
          }
          square(hx, hy, pixelSize * Math.max(1, Math.round(thickness / 2 + 0.5)), headColor);
        } else {
          const g = ctx.createLinearGradient(hx, hy, hx - dir[0] * m.len, hy - dir[1] * m.len);
          g.addColorStop(0, rgba(tailColor, 0.9));
          g.addColorStop(1, rgba(tailColor, 0));
          ctx.strokeStyle = g;
          ctx.lineWidth = thickness;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(hx - dir[0] * m.len, hy - dir[1] * m.len);
          ctx.stroke();
          ctx.fillStyle = rgba(headColor, 0.25);
          ctx.beginPath();
          ctx.arc(hx, hy, thickness * 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = headColor;
          ctx.beginPath();
          ctx.arc(hx, hy, thickness * 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    };

    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      time += dt;
      // `rate` meteors per second on average.
      spawnDebt += dt * rate * (0.5 + Math.random());
      while (spawnDebt >= 1) {
        spawn();
        spawnDebt -= 1;
      }
      meteors.forEach(m => {
        m.d += m.speed * dt;
      });
      meteors = meteors.filter(m => m.d < m.travel);
      draw();
      if (visible) frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (reduced || frame || !visible) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const resize = new ResizeObserver(layout);
    resize.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(wrap);
    layout();
    start();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      io.disconnect();
    };
  }, [rate, angle, minSpeed, maxSpeed, tail, thickness, pixelSize, stars, headColor, tailColor, starColor, backgroundColor]);

  return (
    <div ref={wrapRef} className={className} aria-hidden="true" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}
