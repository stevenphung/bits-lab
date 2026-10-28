import { Children, useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Drop anything into a physics box. Each child starts where the layout put it, then becomes
// a rigid body (matter-js) that falls, tumbles and stacks; grab and throw them with mouse,
// pen or touch. Bodies sleep once they settle and the simulation stops until you touch it
// again, and it pauses off-screen. Children stay real DOM in reading order, so links and
// buttons inside still work. Under reduced motion nothing falls.

const { Engine, Bodies, Body, Composite, Constraint, Sleeping } = Matter;

export default function GravityBox({
  children,
  height = 420,
  gravity = 1,
  restitution = 0.35,
  friction = 0.2,
  startOn = 'view',
  spin = true,
  draggable = true,
  sleep = true,
  gap = 10,
  padding = 20,
  radius = 16,
  backgroundColor = 'transparent',
  force = false,
  onSettle,
  className = '',
  style
}) {
  const rootRef = useRef(null);
  const itemRefs = useRef([]);
  const [live, setLive] = useState(false);
  const [armed, setArmed] = useState(startOn === 'mount');
  const onSettleRef = useRef(onSettle);
  onSettleRef.current = onSettle;
  const items = Children.toArray(children);

  // Arm on view or click (the click is on the box itself, so inner buttons still work).
  useEffect(() => {
    if (armed || startOn !== 'view') return undefined;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setArmed(true), { threshold: 0.4 });
    observer.observe(rootRef.current);
    return () => observer.disconnect();
  }, [armed, startOn]);

  useEffect(() => {
    if (!armed) return undefined;
    if (!force && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const root = rootRef.current;
    const nodes = itemRefs.current.filter(Boolean);
    const base = root.getBoundingClientRect();
    // Measure the static layout first, then switch every item to absolute positioning.
    const boxes = nodes.map(node => {
      const r = node.getBoundingClientRect();
      const radius = parseFloat(getComputedStyle(node.firstElementChild ?? node).borderTopLeftRadius) || 0;
      return { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height, radius };
    });
    // Switch to absolute positioning right away (not on the next render), so no frame shows
    // the static layout with a transform applied on top.
    root.setAttribute('data-live', '');
    setLive(true);

    const engine = Engine.create({ enableSleeping: sleep });
    engine.gravity.y = gravity;
    const bodies = boxes.map(b => {
      const body = Bodies.rectangle(b.x + b.w / 2, b.y + b.h / 2, b.w, b.h, {
        restitution,
        friction,
        frictionAir: 0.012,
        chamfer: { radius: Math.min(b.radius, b.w / 2, b.h / 2) }
      });
      if (spin) Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.08);
      return body;
    });
    Composite.add(engine.world, bodies);

    let walls = [];
    const buildWalls = () => {
      Composite.remove(engine.world, walls);
      const w = root.clientWidth;
      const h = root.clientHeight;
      const t = 200;
      walls = [
        Bodies.rectangle(w / 2, h + t / 2, w + t * 2, t, { isStatic: true }),
        Bodies.rectangle(-t / 2, h / 2, t, h * 3, { isStatic: true }),
        Bodies.rectangle(w + t / 2, h / 2, t, h * 3, { isStatic: true })
      ];
      Composite.add(engine.world, walls);
    };
    buildWalls();

    const paint = () => {
      bodies.forEach((body, i) => {
        const b = boxes[i];
        nodes[i].style.transform = `translate(${(body.position.x - b.w / 2).toFixed(2)}px, ${(body.position.y - b.h / 2).toFixed(2)}px) rotate(${body.angle.toFixed(4)}rad)`;
        nodes[i].style.width = `${b.w}px`;
      });
    };
    paint();

    let frame = 0;
    let visible = true;
    let last = performance.now();
    let settledOnce = false;
    // Simulated (not wall-clock) time since the last wake, so slow frames can't fake a settle.
    let awakeFor = 0;
    let grab = null;
    const loop = now => {
      frame = 0;
      const dt = Math.min(1000 / 30, now - last);
      last = now;
      Engine.update(engine, dt);
      awakeFor += dt;
      paint();
      // Bodies start at rest, so give gravity half a second before checking whether they've settled.
      const resting = !grab && awakeFor > 500 && bodies.every(body => body.isSleeping || body.speed < 0.05);
      if (resting && sleep) {
        if (!settledOnce) {
          settledOnce = true;
          onSettleRef.current?.();
        }
        return;
      }
      if (visible) frame = requestAnimationFrame(loop);
    };
    const wake = () => {
      bodies.forEach(body => Sleeping.set(body, false));
      awakeFor = 0;
      if (!frame && visible) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
    };

    // Drag with a springy constraint so throws carry real momentum.
    const onDown = event => {
      if (!draggable || event.button > 0) return;
      const index = nodes.findIndex(node => node.contains(event.target));
      if (index < 0 || event.target.closest('a, button, input, textarea, select')) return;
      const rect = root.getBoundingClientRect();
      const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
      const body = bodies[index];
      const local = Matter.Vector.rotate(Matter.Vector.sub(point, body.position), -body.angle);
      const constraint = Constraint.create({ pointA: point, bodyB: body, pointB: local, stiffness: 0.08, damping: 0.08, length: 0 });
      Composite.add(engine.world, constraint);
      grab = { constraint, node: nodes[index], id: event.pointerId };
      nodes[index].setAttribute('data-held', '');
      try {
        root.setPointerCapture(event.pointerId);
      } catch {
        // The pointer may already be gone; dragging still works without capture.
      }
      wake();
    };
    const onMove = event => {
      if (!grab || event.pointerId !== grab.id) return;
      const rect = root.getBoundingClientRect();
      grab.constraint.pointA = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const onUp = event => {
      if (!grab || event.pointerId !== grab.id) return;
      Composite.remove(engine.world, grab.constraint);
      grab.node.removeAttribute('data-held');
      grab = null;
      wake();
    };

    const resize = new ResizeObserver(() => {
      buildWalls();
      wake();
    });
    resize.observe(root);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    io.observe(root);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      io.disconnect();
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      Engine.clear(engine);
      nodes.forEach(node => {
        node.style.transform = '';
        node.style.width = '';
      });
      root.removeAttribute('data-live');
      setLive(false);
    };
  }, [armed, gravity, restitution, friction, spin, draggable, sleep, force, items.length]);

  return (
    <div
      ref={rootRef}
      className={`group/grav relative h-(--bl-h) w-full overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) ${className}`}
      data-live={live || undefined}
      onClick={() => startOn === 'click' && setArmed(true)}
      style={{ '--bl-h': `${height}px`, '--bl-gap': `${gap}px`, '--bl-pad': `${padding}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, ...style }}
    >
      <div className="flex flex-wrap content-start justify-center gap-(--bl-gap) p-(--bl-pad)">
        {items.map((child, i) => (
          <div
            key={child.key ?? i}
            ref={node => {
              itemRefs.current[i] = node;
            }}
            className="inline-block group-data-[live]/grav:absolute group-data-[live]/grav:top-0 group-data-[live]/grav:left-0 group-data-[live]/grav:m-0 group-data-[live]/grav:cursor-grab group-data-[live]/grav:touch-none group-data-[live]/grav:select-none group-data-[live]/grav:will-change-transform group-data-[live]/grav:data-[held]:z-2 group-data-[live]/grav:data-[held]:cursor-grabbing"
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}
