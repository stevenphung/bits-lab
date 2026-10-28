import { useEffect, useRef } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A grid of square cells that light up under the pointer and fade out behind it, leaving a
// trail that cools through your colour ramp. Fast moves still draw unbroken trails (every cell
// between two pointer samples lights), a click sends a ripple ring across the grid, and when
// nobody is pointing, an optional autopilot wanders around so it never sits dead. It listens on
// the window, so content layered on top doesn't block it. Canvas-based, fills its parent,
// pauses off-screen; under reduced motion cells light without trails, ripples or autopilot.

function rgb(hex) {
  const v = hex.replace('#', '');
  const full = v.length === 3 ? v.replace(/./g, c => c + c) : v.slice(0, 6);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export default function InteractiveGrid({
  cellSize = 28,
  gap = 2,
  colors = ['#73eff7', '#41a6f6', '#3b5dc9', '#29366f'],
  cellColor = '#1f2236',
  backgroundColor = '#14151f',
  trail = 700,
  brush = 0,
  ripple = true,
  rippleSpeed = 24,
  autopilot = true,
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
    const ramp = colors.map(rgb);
    const base = rgb(cellColor);
    let cols = 0;
    let rows = 0;
    let dpr = 1;
    let heat = new Float32Array(0);
    let frame = 0;
    let visible = true;
    let last = performance.now();
    let pointer = null;
    let lastActive = -Infinity;
    let ripples = [];
    let pilotT = Math.random() * 100;
    let pilotCell = null;

    const light = (c, r) => {
      for (let y = r - brush; y <= r + brush; y++) {
        for (let x = c - brush; x <= c + brush; x++) {
          if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
          // Round brush: corners of the square are skipped.
          if (brush && (x - c) ** 2 + (y - r) ** 2 > (brush + 0.5) ** 2) continue;
          heat[y * cols + x] = 1;
        }
      }
    };

    // Light every cell on the line between two cells (Bresenham).
    const stroke = (from, to) => {
      let [x0, y0] = from ?? to;
      const [x1, y1] = to;
      const dx = Math.abs(x1 - x0);
      const dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (let n = 0; n < 512; n++) {
        light(x0, y0);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) {
          err += dy;
          x0 += sx;
        }
        if (e2 <= dx) {
          err += dx;
          y0 += sy;
        }
      }
    };

    const layout = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(wrap.clientWidth * dpr);
      canvas.height = Math.round(wrap.clientHeight * dpr);
      cols = Math.max(1, Math.ceil(wrap.clientWidth / cellSize));
      rows = Math.max(1, Math.ceil(wrap.clientHeight / cellSize));
      heat = new Float32Array(cols * rows);
      pointer = null;
      draw();
    };

    const draw = () => {
      const cell = cellSize * dpr;
      const inset = gap * dpr;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let h = heat[r * cols + c];
          // Ripples: a thin ring, brightest at its edge, dimming as it spreads.
          for (const rp of ripples) {
            const ring = 1 - Math.abs(Math.hypot(c - rp.x, r - rp.y) - rp.r) / 1.5;
            if (ring > 0) h = Math.max(h, ring * (1 - rp.r / rp.max));
          }
          if (h <= 0) {
            ctx.fillStyle = cellColor;
          } else {
            // Hot cells take the first colour and cool through the ramp as they fade.
            const pos = (1 - h) * (ramp.length - 1);
            const i = Math.max(0, Math.min(ramp.length - 2, Math.floor(pos)));
            const t = ramp.length > 1 ? pos - i : 0;
            const a = ramp[i];
            const b = ramp[Math.min(ramp.length - 1, i + 1)];
            const alpha = Math.min(1, h * 1.4);
            const mix = k => Math.round(base[k] + ((a[k] + (b[k] - a[k]) * t) - base[k]) * alpha);
            ctx.fillStyle = `rgb(${mix(0)},${mix(1)},${mix(2)})`;
          }
          ctx.fillRect(c * cell + inset / 2, r * cell + inset / 2, cell - inset, cell - inset);
        }
      }
    };

    const tick = now => {
      frame = 0;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const fade = reduced ? 1 : (dt * 1000) / trail;
      let hot = false;
      for (let i = 0; i < heat.length; i++) {
        if (heat[i] > 0) {
          heat[i] = Math.max(0, heat[i] - fade);
          hot = true;
        }
      }
      ripples = ripples.filter(rp => {
        rp.r += rippleSpeed * dt;
        return rp.r < rp.max;
      });
      // Autopilot: a wandering point while nobody is pointing.
      if (autopilot && !reduced && now - lastActive > 2000) {
        pilotT += dt * 0.6;
        const cell = [Math.round(((Math.sin(pilotT * 1.3) + Math.sin(pilotT * 0.7 + 1)) / 4 + 0.5) * (cols - 1)), Math.round(((Math.cos(pilotT * 0.9) + Math.sin(pilotT * 1.7)) / 4 + 0.5) * (rows - 1))];
        stroke(pilotCell, cell);
        pilotCell = cell;
        hot = true;
      } else pilotCell = null;
      draw();
      if (visible && (hot || ripples.length)) frame = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (frame || !visible) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const cellAt = event => {
      const rect = wrap.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < 0 || y < 0 || x >= rect.width || y >= rect.height) return null;
      return [Math.floor(x / cellSize), Math.floor(y / cellSize)];
    };

    const onMove = event => {
      const cell = cellAt(event);
      if (!cell) {
        pointer = null;
        return;
      }
      lastActive = performance.now();
      if (reduced) heat.fill(0);
      stroke(reduced ? null : pointer, cell);
      pointer = cell;
      if (reduced) draw();
      else wake();
    };

    const onDown = event => {
      if (!ripple || reduced) return;
      const cell = cellAt(event);
      if (!cell) return;
      ripples.push({ x: cell[0], y: cell[1], r: 0, max: Math.hypot(cols, rows) * 0.8 });
      wake();
    };

    const resize = new ResizeObserver(layout);
    resize.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && autopilot && !reduced) wake();
    });
    io.observe(wrap);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    layout();
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
    };
    // colors is compared by value so a new array literal each render doesn't restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellSize, gap, colors.join(), cellColor, backgroundColor, trail, brush, ripple, rippleSpeed, autopilot]);

  return (
    <div ref={wrapRef} className={`relative h-full w-full overflow-hidden ${className}`} aria-hidden="true" style={style}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
