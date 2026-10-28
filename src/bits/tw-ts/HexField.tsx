import { useEffect, useRef, type CSSProperties } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A field of hexagons. A slow wave drifts across it at rest, cells near the pointer light up,
// and a click (or tap) sends a ripple ring outward that lifts and brightens each cell as it
// passes. Drawn on a canvas at device resolution; it pauses when off-screen or in a hidden
// tab. Decorative (hidden from assistive tech). Under reduced motion the field is still and
// a click flashes the nearby cells instead of rippling.

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

export interface HexFieldProps {
  /** Hexagon radius in px. */
  size?: number;
  gap?: number;
  /** Fills its parent by default. */
  height?: number | string;
  baseColor?: string;
  cellColor?: string;
  glowColor?: string;
  rippleColor?: string;
  backgroundColor?: string;
  /** How far the pointer glow reaches, in px. */
  hoverRadius?: number;
  /** Ripple speed in px per second. */
  rippleSpeed?: number;
  rippleWidth?: number;
  /** A slow drifting wave at rest. */
  wave?: boolean;
  /** Render at a third of the resolution for chunky pixels. */
  pixelated?: boolean;
  onRipple?: (at: { x: number; y: number }) => void;
  className?: string;
  style?: CSSProperties;
}

export default function HexField({
  size = 22,
  gap = 3,
  height = '100%',
  baseColor = '#1a1c2c',
  cellColor = '#29366f',
  glowColor = '#73eff7',
  rippleColor = '#ffcd75',
  backgroundColor = '#0b0b14',
  hoverRadius = 110,
  rippleSpeed = 420,
  rippleWidth = 70,
  wave = true,
  pixelated = false,
  onRipple,
  className = '',
  style
}: HexFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rippleRef = useRef(onRipple);
  rippleRef.current = onRipple;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const base = hexToRgb(cellColor);
    const glow = hexToRgb(glowColor);
    const ripCol = hexToRgb(rippleColor);
    const edge = hexToRgb(baseColor);
    let cells: { x: number; y: number; lift: number }[] = [];
    let W = 0;
    let H = 0;
    let dpr = 1;
    const pointer = { x: -9999, y: -9999 };
    const ripples: { x: number; y: number; r: number; strength: number }[] = [];
    let flash: { x: number; y: number; strength: number } | null = null;
    let visible = true;
    let raf = 0;
    let clock = 0;
    let last = 0;

    // Pointy-top hexagons in offset rows.
    const layout = () => {
      // Pixelated draws at a third of CSS resolution and lets the browser scale it up blocky.
      dpr = pixelated ? 1 / 3 : Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const w = Math.sqrt(3) * size;
      const rowH = size * 1.5;
      cells = [];
      for (let row = -1; row * rowH < H + size; row++) {
        for (let col = -1; col * w < W + w; col++) {
          cells.push({ x: col * w + (row % 2 ? w / 2 : 0), y: row * rowH, lift: 0 });
        }
      }
    };

    const hex = (x: number, y: number, r: number) => {
      ctx.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k - Math.PI / 2;
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        if (k) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.closePath();
    };

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      const r = size - gap / 2;
      cells.forEach(cell => {
        // Rest wave, pointer glow and the strongest ripple at this cell.
        const waveT = wave && !reduced ? (Math.sin(cell.x * 0.012 + cell.y * 0.018 - clock * 1.1) + 1) / 2 : 0.5;
        const d = Math.hypot(cell.x - pointer.x, cell.y - pointer.y);
        const hover = Math.max(0, 1 - d / hoverRadius) ** 1.6;
        let rip = 0;
        ripples.forEach(rp => {
          const ring = Math.abs(Math.hypot(cell.x - rp.x, cell.y - rp.y) - rp.r);
          rip = Math.max(rip, Math.max(0, 1 - ring / rippleWidth) * rp.strength);
        });
        if (flash) rip = Math.max(rip, Math.max(0, 1 - Math.hypot(cell.x - flash.x, cell.y - flash.y) / (hoverRadius * 1.6)) * flash.strength);
        let rgb = mix(edge, base, 0.45 + waveT * 0.35);
        rgb = mix(rgb, glow, hover * 0.85);
        rgb = mix(rgb, ripCol, rip * 0.9);
        const lift = rip * 3 + hover * 1.5;
        hex(cell.x, cell.y - lift, r * (1 + rip * 0.08));
        ctx.fillStyle = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
        ctx.fill();
      });
    };

    const tick = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      clock += dt;
      const reach = Math.hypot(W, H) + rippleWidth;
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += rippleSpeed * dt;
        rp.strength = Math.max(0, 1 - rp.r / reach);
        if (rp.r > reach) ripples.splice(i, 1);
      }
      draw();
      raf = visible && !document.hidden && (wave || ripples.length || pointer.x > -9999) ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (raf || reduced || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const local = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const onMove = (event: PointerEvent) => {
      Object.assign(pointer, local(event));
      if (reduced) draw();
      else start();
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
      if (reduced) draw();
      else start();
    };
    const onDown = (event: PointerEvent) => {
      const at = local(event);
      rippleRef.current?.(at);
      if (reduced) {
        flash = { ...at, strength: 1 };
        draw();
        setTimeout(() => {
          flash = null;
          draw();
        }, 450);
        return;
      }
      ripples.push({ ...at, r: 0, strength: 1 });
      if (ripples.length > 6) ripples.shift();
      start();
    };

    const resize = new ResizeObserver(() => {
      layout();
      draw();
    });
    resize.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    observer.observe(canvas);
    const onVisibility = () => start();
    document.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('pointerdown', onDown);
    layout();
    draw();
    start();
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
    };
  }, [size, gap, baseColor, cellColor, glowColor, rippleColor, hoverRadius, rippleSpeed, rippleWidth, wave, pixelated]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height, background: backgroundColor, touchAction: 'pan-y', imageRendering: pixelated ? 'pixelated' : undefined, ...style }}
    />
  );
}
