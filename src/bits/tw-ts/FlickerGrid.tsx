import { useEffect, useRef, type CSSProperties } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A grid of small squares that flicker at random, like a dormant screen. Give it `text` (or a
// mask image) and the squares inside the shape glow brighter and in their own color, so a
// word or logo emerges from the noise. Canvas-based, fills its parent, pauses off-screen and
// freezes under reduced motion. The mask text is exposed to screen readers.

export interface FlickerGridProps {
  /** Square size in px. */
  squareSize?: number;
  /** Space between squares in px. */
  gap?: number;
  /** Color of the flickering noise. */
  color?: string;
  /** Color of squares inside the mask. */
  maskColor?: string;
  /** Average re-rolls per cell per second. */
  flickerChance?: number;
  /** Brightest opacity a noise square reaches (0–1). */
  maxOpacity?: number;
  /** Opacity of masked squares (0–1). */
  maskOpacity?: number;
  /** A word that emerges from the grid; long text shrinks to fit. */
  text?: string;
  /** An image (e.g. a logo) used as the mask instead of text; its opaque pixels count. */
  maskSrc?: string;
  fontSize?: number;
  fontWeight?: number | string;
  fontFamily?: string;
  /** Accessible name; defaults to text. Without either, the grid is decorative. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

// A grid of small squares that flicker at random, like a dormant screen. Give it `text` (or a
// mask image) and the squares inside the shape glow brighter and in their own color, so a
// word or logo emerges from the noise. Canvas-based, fills its parent, pauses off-screen and
// freezes under reduced motion. The mask text is exposed to screen readers.

function rgba(hex: string, alpha: number) {
  const v = hex.replace('#', '');
  const full = v.length === 3 ? v.replace(/./g, (c: string) => c + c) : v.slice(0, 6);
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export default function FlickerGrid({
  squareSize = 4,
  gap = 4,
  color = '#566c86',
  maskColor = '#73eff7',
  flickerChance = 1.5,
  maxOpacity = 0.35,
  maskOpacity = 0.95,
  text,
  maskSrc,
  fontSize = 120,
  fontWeight = 800,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  label,
  className = '',
  style
}: FlickerGridProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let cols = 0;
    let rows = 0;
    let dpr = 1;
    let opacity = new Float32Array(0);
    let inMask = new Uint8Array(0);
    let frame = 0;
    let visible = true;
    let last = performance.now();
    let image: HTMLImageElement | null = null;
    let cancelled = false;

    // Rasterize the mask (text or image) at grid resolution: one sample per cell.
    const buildMask = () => {
      inMask = new Uint8Array(cols * rows);
      if (!text && !image) return;
      const off = document.createElement('canvas');
      off.width = cols;
      off.height = rows;
      const octx = off.getContext('2d')!;
      const cell = squareSize + gap;
      if (image) {
        const scale = Math.min(cols / image.width, rows / image.height) * 0.8;
        const iw = image.width * scale;
        const ih = image.height * scale;
        octx.drawImage(image, (cols - iw) / 2, (rows - ih) / 2, iw, ih);
      } else {
        const size = Math.max(4, fontSize / cell);
        octx.font = `${fontWeight} ${size}px ${fontFamily}`;
        octx.textAlign = 'center';
        octx.textBaseline = 'middle';
        // Shrink long text to fit the width.
        const width = octx.measureText(text!).width;
        if (width > cols * 0.92) octx.font = `${fontWeight} ${(size * cols * 0.92) / width}px ${fontFamily}`;
        octx.fillStyle = '#fff';
        octx.fillText(text!, cols / 2, rows / 2);
      }
      const data = octx.getImageData(0, 0, cols, rows).data;
      for (let i = 0; i < cols * rows; i++) inMask[i] = data[i * 4 + 3] > 100 ? 1 : 0;
    };

    const layout = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = wrap.clientWidth;
      const height = wrap.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      const cell = squareSize + gap;
      cols = Math.max(1, Math.floor(width / cell));
      rows = Math.max(1, Math.floor(height / cell));
      opacity = new Float32Array(cols * rows).map(() => Math.random() * maxOpacity);
      buildMask();
      draw();
    };

    const draw = () => {
      const cell = (squareSize + gap) * dpr;
      const size = squareSize * dpr;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Center the grid in the canvas.
      const ox = (canvas.width - cols * cell + gap * dpr) / 2;
      const oy = (canvas.height - rows * cell + gap * dpr) / 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const masked = inMask[i];
          const a = masked ? Math.min(1, maskOpacity * (0.55 + opacity[i] / maxOpacity / 2)) : opacity[i];
          ctx.fillStyle = rgba(masked ? maskColor : color, a);
          ctx.fillRect(ox + c * cell, oy + r * cell, size, size);
        }
      }
    };

    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      // flickerChance = average re-rolls per cell per second.
      const p = Math.min(1, flickerChance * dt);
      for (let i = 0; i < opacity.length; i++) if (Math.random() < p) opacity[i] = Math.random() * maxOpacity;
      draw();
      if (visible) frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (reduced || frame || !visible || cancelled) return;
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
    if (maskSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (cancelled) return;
        image = img;
        buildMask();
        draw();
      };
      img.src = maskSrc;
    }
    layout();
    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      io.disconnect();
    };
  }, [squareSize, gap, color, maskColor, flickerChance, maxOpacity, maskOpacity, text, maskSrc, fontSize, fontWeight, fontFamily]);

  const name = label ?? text;
  return (
    <div
      ref={wrapRef}
      className={`relative h-full w-full overflow-hidden ${className}`}
      role={name ? 'img' : undefined}
      aria-label={name || undefined}
      aria-hidden={name ? undefined : true}
      style={style}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full"  />
    </div>
  );
}
