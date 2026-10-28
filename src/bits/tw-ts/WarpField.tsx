import { useEffect, useRef, type CSSProperties } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Stars rushing past at warp speed. Each star flies out from the vanishing point and stretches
// into a streak as it nears, snapped to a pixel grid; the vanishing point leans gently toward
// the pointer. Hold the pointer down (or press Space while it's focused) to punch it into
// hyperspace, and let go to drop back to cruising. Fills its parent, pauses off-screen; reduced
// motion shows a still field of stars. Decorative.

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

interface Star {
  x: number;
  y: number;
  z: number;
  pz: number;
  tint: number[];
}

export interface WarpFieldProps {
  stars?: number;
  /** Cruising speed. */
  speed?: number;
  /** Hyperspace multiplier while held. */
  boost?: number;
  /** Hold the pointer down (or Space while focused) for hyperspace. */
  holdToBoost?: boolean;
  /** How far the vanishing point leans toward the pointer. */
  lean?: number;
  pixelSize?: number;
  colors?: string[];
  backgroundColor?: string;
  className?: string;
  style?: CSSProperties;
}

export default function WarpField({
  stars = 380,
  speed = 0.35,
  boost = 6,
  holdToBoost = true,
  lean = 0.12,
  pixelSize = 2,
  colors = ['#f4f4f4', '#73eff7', '#ffcd75'],
  backgroundColor = '#0b0b14',
  className = '',
  style
}: WarpFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const tints = colors.map(hexToRgb);
    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let visible = true;
    let warp = 1; // current multiplier, eased toward the target
    let held = false;
    const aim = { x: 0, y: 0, tx: 0, ty: 0 };
    const spawn = (s: Star, far: boolean) => {
      s.x = (Math.random() - 0.5) * 2;
      s.y = (Math.random() - 0.5) * 2;
      s.z = far ? 1 : 0.15 + Math.random() * 0.85;
      s.pz = s.z;
      s.tint = tints[Math.floor(Math.random() * tints.length)];
      return s;
    };
    const field = Array.from({ length: stars }, () => spawn({} as Star, false));

    const fit = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
    };
    const project = (x: number, y: number, z: number) => {
      const scale = Math.max(W, H) * 0.5;
      return [W / 2 + aim.x * W + (x / z) * scale, H / 2 + aim.y * H + (y / z) * scale];
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, W, H);
      const p = pixelSize;
      field.forEach(s => {
        const [x1, y1] = project(s.x, s.y, s.z);
        const [x0, y0] = project(s.x, s.y, s.pz);
        const near = 1 - s.z;
        const [r, g, b] = s.tint;
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, 0.25 + near * 1.1)})`;
        // Walk the streak in pixel steps, so it reads as a chunky line rather than a smooth one.
        const len = Math.hypot(x1 - x0, y1 - y0);
        const steps = Math.max(1, Math.min(40, Math.ceil(len / p)));
        for (let k = 0; k <= steps; k++) {
          const x = x0 + ((x1 - x0) * k) / steps;
          const y = y0 + ((y1 - y0) * k) / steps;
          ctx.fillRect(Math.round(x / p) * p, Math.round(y / p) * p, p, p);
        }
      });
    };

    const tick = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      warp += ((held ? boost : 1) - warp) * Math.min(1, dt * 3);
      aim.x += (aim.tx - aim.x) * Math.min(1, dt * 2);
      aim.y += (aim.ty - aim.y) * Math.min(1, dt * 2);
      field.forEach(s => {
        s.pz = s.z + 0.02 * warp; // the tail: where the star was a moment ago
        s.z -= speed * warp * dt;
        if (s.z < 0.02) spawn(s, true);
        else {
          const [x, y] = project(s.x, s.y, s.z);
          if (x < -50 || y < -50 || x > W + 50 || y > H + 50) spawn(s, true);
        }
      });
      draw();
      raf = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (raf || reduced || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      aim.tx = ((event.clientX - r.left) / r.width - 0.5) * lean;
      aim.ty = ((event.clientY - r.top) / r.height - 0.5) * lean;
    };
    const press = (on: boolean) => () => {
      if (holdToBoost) held = on;
    };
    const down = press(true);
    const up = press(false);
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space' && holdToBoost) {
        event.preventDefault();
        held = event.type === 'keydown';
      }
    };

    const resize = new ResizeObserver(() => {
      fit();
      draw();
    });
    resize.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    observer.observe(canvas);
    document.addEventListener('visibilitychange', start);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    canvas.addEventListener('pointerleave', up);
    canvas.addEventListener('keydown', onKey);
    canvas.addEventListener('keyup', onKey);
    fit();
    draw();
    start();
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', start);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointerleave', up);
      canvas.removeEventListener('keydown', onKey);
      canvas.removeEventListener('keyup', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stars, speed, boost, holdToBoost, lean, pixelSize, colors.join(), backgroundColor]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      tabIndex={holdToBoost ? -1 : undefined}
      className={className}
      style={{ display: 'block', width: '100%', height: '100%', background: backgroundColor, touchAction: 'pan-y', outline: 'none', ...style }}
    />
  );
}
