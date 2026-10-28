import { Children, useEffect, useRef } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Items that lean toward the pointer. Each child within reach is pulled toward it on its own
// spring (closer items move further), and snaps back with a little overshoot when the pointer
// moves away. Flip it to repel and they shy away instead. Purely visual: the items keep their
// place in the layout and the tab order. Reduced motion turns the pull off.

export default function CursorAttractor({
  children,
  radius = 180,
  strength = 0.35,
  maxShift = 36,
  mode = 'attract',
  stiffness = 220,
  damping = 13,
  gap = 16,
  padding = 32,
  justify = 'center',
  className = '',
  style
}) {
  const rootRef = useRef(null);
  const itemRefs = useRef([]);
  const items = Children.toArray(children);

  useEffect(() => {
    const root = rootRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const nodes = itemRefs.current.slice(0, items.length).filter(Boolean);
    const state = nodes.map(() => ({ tx: 0, ty: 0, x: 0, y: 0, vx: 0, vy: 0 }));
    // Resting centres, measured with the current offset taken out so the pull doesn't feed back.
    let centres = [];
    let frame = 0;
    let last = 0;
    const sign = mode === 'repel' ? -1 : 1;

    const measure = () => {
      centres = nodes.map((node, i) => {
        const rect = node.getBoundingClientRect();
        return { x: rect.left + rect.width / 2 - state[i].x, y: rect.top + rect.height / 2 - state[i].y };
      });
    };

    const tick = now => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      let moving = false;
      state.forEach((s, i) => {
        for (let t = 0; t < dt; t += 1 / 240) {
          s.vx += (stiffness * (s.tx - s.x) - damping * s.vx) / 240;
          s.vy += (stiffness * (s.ty - s.y) - damping * s.vy) / 240;
          s.x += s.vx / 240;
          s.y += s.vy / 240;
        }
        if (Math.abs(s.tx - s.x) > 0.05 || Math.abs(s.ty - s.y) > 0.05 || Math.abs(s.vx) > 0.5 || Math.abs(s.vy) > 0.5) moving = true;
        else Object.assign(s, { x: s.tx, y: s.ty, vx: 0, vy: 0 });
        nodes[i].style.transform = s.x || s.y ? `translate(${s.x.toFixed(2)}px, ${s.y.toFixed(2)}px)` : '';
      });
      frame = moving ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const onEnter = () => measure();
    const onMove = event => {
      if (!centres.length) measure();
      state.forEach((s, i) => {
        const dx = event.clientX - centres[i].x;
        const dy = event.clientY - centres[i].y;
        const d = Math.hypot(dx, dy);
        if (d >= radius || d === 0) {
          s.tx = 0;
          s.ty = 0;
          return;
        }
        // Strongest at the edge of reach falling to nothing at the centre would feel dead, so
        // scale the pull by how deep inside the radius the pointer is.
        const pull = strength * (1 - d / radius);
        const len = Math.min(maxShift, d * pull);
        s.tx = (sign * dx * len) / d;
        s.ty = (sign * dy * len) / d;
      });
      wake();
    };
    const onLeave = () => {
      state.forEach(s => {
        s.tx = 0;
        s.ty = 0;
      });
      centres = [];
      wake();
    };
    const onLayout = () => {
      centres = [];
    };

    root.addEventListener('pointerenter', onEnter);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointercancel', onLeave);
    window.addEventListener('scroll', onLayout, { passive: true, capture: true });
    window.addEventListener('resize', onLayout);
    return () => {
      cancelAnimationFrame(frame);
      root.removeEventListener('pointerenter', onEnter);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointercancel', onLeave);
      window.removeEventListener('scroll', onLayout, { capture: true });
      window.removeEventListener('resize', onLayout);
      nodes.forEach(node => {
        node.style.transform = '';
      });
    };
  }, [items.length, radius, strength, maxShift, mode, stiffness, damping]);

  return (
    <div ref={rootRef} className={`flex touch-pan-y flex-wrap items-center gap-(--bl-gap) p-(--bl-pad) [justify-content:var(--bl-justify)] ${className}`} style={{ '--bl-gap': `${gap}px`, '--bl-pad': `${padding}px`, '--bl-justify': justify === 'start' ? 'flex-start' : justify === 'end' ? 'flex-end' : 'center', ...style }}>
      {items.map((child, i) => (
        <span
          key={child.key ?? i}
          ref={node => {
            itemRefs.current[i] = node;
          }}
          className="inline-block will-change-transform"
        >
          {child}
        </span>
      ))}
    </div>
  );
}
