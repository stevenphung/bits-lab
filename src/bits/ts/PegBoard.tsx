import { useEffect, useRef, type CSSProperties } from 'react';

// A pin-art toy. A field of square pegs, drawn as little blocks with a lit top and a shaded
// side; press the pointer into it and the pegs under your "hand" rise, then sink slowly back
// once you move on. Give it a word and the word stays pressed into the pegs at rest. Drawn on
// a canvas, paused off-screen and in hidden tabs, decorative (hidden from assistive tech).
// Under reduced motion it shows the imprint and lifts pegs without the slow settle.

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: number[], b: number[], t: number) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;

export interface PegBoardProps {
  pegSize?: number;
  spacing?: number;
  /** How many px a fully raised peg climbs. */
  rise?: number;
  /** Radius of the pointer "hand" in px. */
  reach?: number;
  /** Roughly how many seconds pegs take to sink back. */
  settle?: number;
  /** A word pressed into the pegs at rest. */
  imprint?: string;
  /** CSS font for the imprint; its "1px" is replaced by the fitted size. */
  imprintFont?: string;
  /** Imprint height as a share of the board. */
  imprintHeight?: number;
  pegColor?: string;
  topColor?: string;
  peakColor?: string;
  backgroundColor?: string;
  /** Fills its parent by default. */
  height?: number | string;
  className?: string;
  style?: CSSProperties;
}

export default function PegBoard({
  pegSize = 10,
  spacing = 4,
  rise = 9,
  reach = 80,
  settle = 1.6,
  imprint = '',
  imprintFont = '700 1px "Press Start 2P", ui-monospace, monospace',
  imprintHeight = 0.55,
  pegColor = '#29366f',
  topColor = '#41a6f6',
  peakColor = '#73eff7',
  backgroundColor = '#0b0b14',
  height = '100%',
  className = '',
  style
}: PegBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const base = hexToRgb(pegColor);
    const top = hexToRgb(topColor);
    const peak = hexToRgb(peakColor);
    const pitch = pegSize + spacing;
    let cols = 0;
    let rows = 0;
    let lift = new Float32Array(0); // current height 0…1
    let rest = new Float32Array(0); // where each peg settles (the imprint)
    let W = 0;
    let H = 0;
    let dpr = 1;
    const hand = { x: -1e4, y: -1e4, down: false };
    let visible = true;
    let raf = 0;
    let last = 0;

    // Rasterise the imprint word into the peg grid: pegs inside the letters rest raised.
    const stamp = () => {
      rest = new Float32Array(cols * rows);
      if (!imprint) return;
      const off = document.createElement('canvas');
      off.width = cols;
      off.height = rows;
      const o = off.getContext('2d')!;
      const size = Math.max(4, Math.floor(rows * imprintHeight));
      o.font = imprintFont.replace(/\b1px\b/, `${size}px`);
      o.textAlign = 'center';
      o.textBaseline = 'middle';
      let fit = size;
      while (fit > 4 && o.measureText(imprint).width > cols * 0.9) {
        fit -= 1;
        o.font = imprintFont.replace(/\b1px\b/, `${fit}px`);
      }
      o.fillStyle = '#fff';
      o.fillText(imprint, cols / 2, rows / 2 + 1);
      const data = o.getImageData(0, 0, cols, rows).data;
      for (let i = 0; i < cols * rows; i++) rest[i] = data[i * 4 + 3] > 110 ? 0.75 : 0;
    };

    const layout = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      cols = Math.ceil(W / pitch) + 1;
      rows = Math.ceil(H / pitch) + 1;
      stamp();
      lift = Float32Array.from(rest);
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      // Back to front so raised pegs overlap the row behind them.
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const h = lift[r * cols + c];
          const x = c * pitch;
          const y = r * pitch;
          const up = h * rise;
          if (up > 0.5) {
            ctx.fillStyle = mix(base, [0, 0, 0], 0.45);
            ctx.fillRect(x, y - up + pegSize, pegSize, up);
          }
          ctx.fillStyle = mix(base, h > 0.6 ? peak : top, Math.min(1, h * 1.2));
          ctx.fillRect(x, y - up, pegSize, pegSize);
        }
      }
    };

    const tick = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      const ease = reduced ? 1 : 1 - Math.exp(-dt / Math.max(0.05, settle / 4));
      const press = 1 - Math.exp(-dt * 30);
      let moving = false;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const d = Math.hypot(c * pitch + pegSize / 2 - hand.x, r * pitch + pegSize / 2 - hand.y);
          const pushed = d < reach ? (1 - d / reach) ** 1.4 * (hand.down ? 1 : 0.7) : 0;
          const goal = Math.max(rest[i], pushed);
          // Pegs rise fast under the hand and sink back slowly.
          const k = goal > lift[i] ? (reduced ? 1 : press) : ease;
          lift[i] += (goal - lift[i]) * k;
          if (Math.abs(goal - lift[i]) > 0.002) moving = true;
          else lift[i] = goal;
        }
      }
      draw();
      raf = moving && visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const local = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      hand.x = event.clientX - rect.left;
      hand.y = event.clientY - rect.top;
    };
    const onMove = (event: PointerEvent) => {
      local(event);
      wake();
    };
    const onDown = (event: PointerEvent) => {
      local(event);
      hand.down = true;
      wake();
    };
    const onUp = () => {
      hand.down = false;
      wake();
    };
    const onLeave = () => {
      hand.x = -1e4;
      hand.y = -1e4;
      hand.down = false;
      wake();
    };

    const resize = new ResizeObserver(() => {
      layout();
      draw();
    });
    resize.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      wake();
    });
    observer.observe(canvas);
    const onVisibility = () => wake();
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onLeave);
    // The imprint font may still be loading; restamp once it's ready.
    document.fonts?.ready.then(() => {
      if (!canvas.isConnected) return;
      layout();
      draw();
    });
    layout();
    draw();
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [pegSize, spacing, rise, reach, settle, imprint, imprintFont, imprintHeight, pegColor, topColor, peakColor]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" style={{ display: 'block', width: '100%', height, background: backgroundColor, touchAction: 'pan-y', ...style }} />;
}
