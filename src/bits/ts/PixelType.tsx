import { useEffect, useRef, type CSSProperties } from 'react';

// Words built from pixel blocks. The text is rasterised into a grid, and every lit cell becomes
// a block with its own spring: on "assemble" the blocks fly in from a scatter and click into
// place; on "crumble" the word holds, then falls apart under gravity and rebuilds itself. Move
// the pointer through it and the blocks scatter away and drift home. Drawn on a canvas (named
// for screen readers with the text); pauses off-screen; reduced motion shows the word still.

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

interface Block {
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number[];
  loose: boolean;
}

export interface PixelTypeProps {
  text?: string;
  /** Fly in once, or hold, crumble and rebuild on a loop. */
  effect?: 'assemble' | 'crumble';
  /** Block size in px. */
  pixelSize?: number;
  gap?: number;
  /** CSS font family the text is rasterised with. */
  font?: string;
  /** How many pixel rows tall the text is rasterised. */
  rows?: number;
  /** Colour bands from top to bottom. */
  colors?: string[];
  /** How far the pointer scatters blocks, in px. */
  repel?: number;
  stiffness?: number;
  damping?: number;
  /** Crumble: how long the word holds, in ms. */
  hold?: number;
  trigger?: 'view' | 'mount';
  align?: 'center' | 'start' | 'end';
  className?: string;
  style?: CSSProperties;
}

export default function PixelType({
  text = 'PIXEL',
  effect = 'assemble',
  pixelSize = 6,
  gap = 1,
  font = '"Press Start 2P", ui-monospace, monospace',
  rows = 12,
  colors = ['#ffcd75', '#ef7d57', '#b13e53'],
  repel = 70,
  stiffness = 90,
  damping = 11,
  hold = 2400,
  trigger = 'view',
  align = 'center',
  className = '',
  style
}: PixelTypeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const pitch = pixelSize + gap;
    const palette = colors.map(hexToRgb);
    let blocks: Block[] = [];
    let W = 0;
    let H = 0;
    let gridW = 0;
    let dpr = 1;
    let raf = 0;
    let last = 0;
    let visible = true;
    let started = trigger === 'mount';
    let phase = 'idle'; // idle → forming → holding → falling → forming…
    let phaseAt = 0;
    const pointer = { x: -1e4, y: -1e4 };

    // Rasterise the text at `rows` pixels tall and keep the lit cells.
    const raster = () => {
      const probe = document.createElement('canvas').getContext('2d')!;
      probe.font = `${rows}px ${font}`;
      const w = Math.ceil(probe.measureText(text).width) + 2;
      const off = document.createElement('canvas');
      off.width = Math.max(1, w);
      off.height = rows + 2;
      const o = off.getContext('2d')!;
      o.font = `${rows}px ${font}`;
      o.textBaseline = 'middle';
      o.fillStyle = '#fff';
      o.fillText(text, 1, (rows + 2) / 2 + 1);
      const data = o.getImageData(0, 0, off.width, off.height).data;
      const cells: number[][] = [];
      for (let y = 0; y < off.height; y++) for (let x = 0; x < off.width; x++) if (data[(y * off.width + x) * 4 + 3] > 120) cells.push([x, y]);
      return { cells, w: off.width, h: off.height };
    };

    const layout = () => {
      const { cells, w, h } = raster();
      gridW = w * pitch;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth;
      H = h * pitch;
      canvas.style.height = `${H}px`;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const ox = align === 'start' ? 0 : align === 'end' ? W - gridW : (W - gridW) / 2;
      const old = blocks;
      blocks = cells.map(([cx, cy], i) => {
        const hx = ox + cx * pitch;
        const hy = cy * pitch;
        const prev = old[i];
        // Colour bands run top to bottom, like a title screen.
        const color = palette[Math.min(palette.length - 1, Math.floor((cy / h) * palette.length))];
        return prev ? { ...prev, hx, hy, color } : { hx, hy, x: hx, y: hy, vx: 0, vy: 0, color, loose: false };
      });
    };

    const scatter = () => {
      blocks.forEach(b => {
        b.x = Math.random() * W;
        b.y = H + Math.random() * H * 2;
        b.vx = 0;
        b.vy = 0;
        b.loose = false;
      });
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // Nothing to show until it starts, so "view" doesn't flash the word before assembling it.
      if (!started && !reduced) return;
      blocks.forEach(b => {
        const [r, g, bl] = b.color;
        ctx.fillStyle = `rgb(${r},${g},${bl})`;
        ctx.fillRect(Math.round(b.x), Math.round(b.y), pixelSize, pixelSize);
      });
    };

    const tick = (now: number) => {
      const dt = Math.max(0, Math.min(0.033, (now - last) / 1000));
      last = now;
      if (phase === 'holding' && effect === 'crumble' && now - phaseAt > hold) {
        phase = 'falling';
        phaseAt = now;
        blocks.forEach(b => {
          b.loose = true;
          b.vx = (Math.random() - 0.5) * 120;
          b.vy = -Math.random() * 160;
        });
      }
      if (phase === 'falling' && now - phaseAt > 1400) {
        phase = 'forming';
        phaseAt = now;
        blocks.forEach(b => (b.loose = false));
      }
      let moving = false;
      blocks.forEach(b => {
        if (b.loose) {
          b.vy += 900 * dt;
          b.x += b.vx * dt;
          b.y = Math.min(H * 3, b.y + b.vy * dt);
          moving = true;
          return;
        }
        let tx = b.hx;
        let ty = b.hy;
        const dx = b.x - pointer.x;
        const dy = b.y - pointer.y;
        const d = Math.hypot(dx, dy);
        if (d < repel && d > 0) {
          const push = (1 - d / repel) * repel * 0.6;
          tx += (dx / d) * push;
          ty += (dy / d) * push;
        }
        b.vx += (stiffness * (tx - b.x) - damping * b.vx) * dt;
        b.vy += (stiffness * (ty - b.y) - damping * b.vy) * dt;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (Math.abs(tx - b.x) > 0.3 || Math.abs(ty - b.y) > 0.3 || Math.abs(b.vx) > 2 || Math.abs(b.vy) > 2) moving = true;
        else if (tx === b.hx && ty === b.hy) {
          b.x = b.hx;
          b.y = b.hy;
          b.vx = 0;
          b.vy = 0;
        }
      });
      if (phase === 'forming' && !moving) {
        phase = 'holding';
        phaseAt = now;
      }
      draw();
      const busy = moving || (effect === 'crumble' && phase !== 'idle');
      raf = busy && visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (raf || reduced || !visible || document.hidden || !started) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      started = true;
      if (reduced) return;
      scatter();
      phase = 'forming';
      wake();
    };

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      wake();
    };
    const onLeave = () => {
      pointer.x = -1e4;
      pointer.y = -1e4;
      wake();
    };

    const resize = new ResizeObserver(() => {
      layout();
      draw();
    });
    resize.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !started && trigger === 'view') start();
      else wake();
    }, { threshold: 0.2 });
    observer.observe(canvas);
    const onVisibility = () => wake();
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    // The pixel font may still be loading: rasterise again once it's in.
    document.fonts?.load(`${rows}px ${font}`).then(() => {
      if (!canvas.isConnected) return;
      blocks = [];
      layout();
      if (started && !reduced) {
        scatter();
        phase = 'forming';
        wake();
      }
      draw();
    });
    layout();
    if (started) start();
    draw();
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, effect, pixelSize, gap, font, rows, colors.join(), repel, stiffness, damping, hold, trigger, align]);

  return <canvas ref={canvasRef} role="img" aria-label={text} className={className} style={{ display: 'block', width: '100%', touchAction: 'pan-y', ...style }} />;
}
