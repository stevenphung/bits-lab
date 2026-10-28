import { useEffect, useRef } from 'react';

// Strings you can pluck. Move the pointer into a string and it bends to follow, up to a
// limit; slip off (or pull too far) and it snaps back with a damped wobble, like a guitar
// string. Several strings stack like a fretboard, each with its own pitch of wobble, and
// onPluck reports which one and how hard (hook a sound to it). Decorative: hidden from
// assistive tech; under reduced motion the strings return without wobbling.

export default function ElasticString({
  strings = 1,
  height = 200,
  gap,
  thickness = 3,
  colors = ['#73eff7'],
  grab = 26,
  maxPull = 70,
  stiffness = 420,
  damping = 7,
  onPluck,
  className = '',
  style
}) {
  const svgRef = useRef(null);
  const pathRefs = useRef([]);
  const pluckRef = useRef(onPluck);
  pluckRef.current = onPluck;

  useEffect(() => {
    const svg = svgRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const spacing = gap ?? height / (strings + 1);
    const restY = i => (gap ? (height - gap * (strings - 1)) / 2 + i * gap : spacing * (i + 1));
    // Per string: where it's bent (x), how far (dy), its velocity, and whether it's held.
    const state = Array.from({ length: strings }, () => ({ x: 0.5, dy: 0, v: 0, held: false }));
    let width = svg.clientWidth || 1;
    let frame = 0;
    let last = 0;

    const draw = i => {
      const s = state[i];
      const y = restY(i);
      const cx = s.x * width;
      // A quadratic curve passes through half its control offset, so double it.
      pathRefs.current[i]?.setAttribute('d', `M0 ${y} Q ${cx.toFixed(1)} ${(y + s.dy * 2).toFixed(1)} ${width} ${y}`);
    };

    const tick = now => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      let moving = false;
      state.forEach((s, i) => {
        if (s.held) return;
        if (reduced) s.dy = 0;
        else {
          // Each string a touch stiffer than the last, so they ring at different speeds.
          const k = stiffness * (1 + i * 0.18);
          for (let t = 0; t < dt; t += 1 / 240) {
            s.v += (-k * s.dy - damping * s.v) / 240;
            s.dy += s.v / 240;
          }
        }
        if (Math.abs(s.dy) > 0.05 || Math.abs(s.v) > 0.5) moving = true;
        else {
          s.dy = 0;
          s.v = 0;
        }
        draw(i);
      });
      frame = moving ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (!frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      }
    };

    const release = (i, s) => {
      s.held = false;
      pluckRef.current?.(i, Math.min(1, Math.abs(s.dy) / maxPull));
      wake();
    };

    const onMove = event => {
      const rect = svg.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      state.forEach((s, i) => {
        const offset = py - restY(i);
        if (s.held) {
          if (Math.abs(offset) > maxPull || px < 0 || px > width) release(i, s);
          else {
            s.x = Math.max(0.05, Math.min(0.95, px / width));
            s.dy = offset;
            draw(i);
          }
        } else if (Math.abs(offset) < grab && Math.abs(s.dy) < 4) {
          // Catch the string where the pointer meets it.
          s.held = true;
          s.v = 0;
          s.x = Math.max(0.05, Math.min(0.95, px / width));
          s.dy = offset;
          draw(i);
        }
      });
    };
    const onLeave = () => state.forEach((s, i) => s.held && release(i, s));

    const resize = new ResizeObserver(() => {
      width = svg.clientWidth || 1;
      state.forEach((_, i) => draw(i));
    });
    resize.observe(svg);
    svg.addEventListener('pointermove', onMove);
    svg.addEventListener('pointerleave', onLeave);
    svg.addEventListener('pointercancel', onLeave);
    state.forEach((_, i) => draw(i));
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      svg.removeEventListener('pointermove', onMove);
      svg.removeEventListener('pointerleave', onLeave);
      svg.removeEventListener('pointercancel', onLeave);
    };
  }, [strings, height, gap, grab, maxPull, stiffness, damping]);

  return (
    <svg ref={svgRef} className={className} width="100%" height={height} aria-hidden="true" style={{ display: 'block', touchAction: 'pan-y', overflow: 'visible', ...style }}>
      {Array.from({ length: strings }, (_, i) => (
        <path
          key={i}
          ref={node => {
            pathRefs.current[i] = node;
          }}
          fill="none"
          stroke={colors[i % colors.length]}
          strokeWidth={Math.max(1, thickness - i * 0.3)}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
