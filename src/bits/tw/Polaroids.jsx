import { useEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A pile of instant photos on a table. Grab one and it lifts with a deeper shadow; fling it
// and it slides on with momentum, spins a little from where you held it, and bounces off the
// edges of the table before settling. Scatter tosses the whole pile at once. Each photo is a
// focusable button: arrows nudge it (Shift for bigger steps), Enter brings it to the top,
// and moves are announced. Under reduced motion photos move straight to where they land.

// Deterministic jitter per photo, so the first render is the same on server and client.
const jitter = (i, salt) => {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x) - 0.5;
};

export default function Polaroids({
  photos = [],
  height = 440,
  photoWidth = 160,
  frame = 10,
  captionHeight = 34,
  friction = 3.2,
  bounce = 0.45,
  spin = 1,
  showControls = true,
  scatterLabel = 'Scatter',
  tidyLabel = 'Tidy up',
  label = 'Photo pile',
  radius = 16,
  backgroundColor = '#5d275d',
  paperColor = '#f4f4f4',
  textColor = '#1a1c2c',
  lineColor = 'rgba(0,0,0,0.25)',
  accentColor = '#73eff7',
  buttonColor = '#333c57',
  buttonTextColor = '#f4f4f4',
  fontFamily = '"Pixelify Sans", ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  const tableRef = useRef(null);
  const nodes = useRef([]);
  const api = useRef(null);
  const [order, setOrder] = useState(() => photos.map((_, i) => i));
  const [announce, setAnnounce] = useState('');

  const name = i => photos[i]?.caption || photos[i]?.alt || `Photo ${i + 1}`;
  const raise = i => setOrder(list => [...list.filter(j => j !== i), i]);

  useEffect(() => {
    setOrder(list => {
      const kept = list.filter(i => i < photos.length);
      return [...kept, ...photos.map((_, i) => i).filter(i => !kept.includes(i))];
    });
  }, [photos.length]);

  useEffect(() => {
    const table = tableRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const count = photos.length;
    let W = table.clientWidth;
    let H = table.clientHeight;
    const size = i => ({ w: nodes.current[i]?.offsetWidth || photoWidth, h: nodes.current[i]?.offsetHeight || photoWidth + captionHeight });
    // A loose pile around the middle.
    const bodies = Array.from({ length: count }, (_, i) => {
      const { w, h } = size(i);
      return { x: W / 2 - w / 2 + jitter(i, 1) * W * 0.35, y: H / 2 - h / 2 + jitter(i, 2) * H * 0.3, r: jitter(i, 3) * 30, vx: 0, vy: 0, vr: 0, held: false };
    });
    let raf = 0;
    let last = 0;

    const clamp = i => {
      const b = bodies[i];
      const { w, h } = size(i);
      let hit = false;
      if (b.x < 0 || b.x > W - w) {
        b.x = Math.max(0, Math.min(W - w, b.x));
        b.vx = -b.vx * bounce;
        b.vr *= 0.7;
        hit = true;
      }
      if (b.y < 0 || b.y > H - h) {
        b.y = Math.max(0, Math.min(H - h, b.y));
        b.vy = -b.vy * bounce;
        b.vr *= 0.7;
        hit = true;
      }
      return hit;
    };
    const place = i => {
      const node = nodes.current[i];
      const b = bodies[i];
      if (node) node.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px) rotate(${b.r.toFixed(2)}deg)`;
    };

    const tick = now => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      const decay = Math.exp(-friction * dt);
      let moving = false;
      bodies.forEach((b, i) => {
        const node = nodes.current[i];
        if (b.held) return;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.r += b.vr * dt;
        b.vx *= decay;
        b.vy *= decay;
        b.vr *= decay;
        clamp(i);
        const flying = Math.hypot(b.vx, b.vy) > 8 || Math.abs(b.vr) > 4;
        if (flying) moving = true;
        else {
          b.vx = 0;
          b.vy = 0;
          b.vr = 0;
        }
        if (node) node.toggleAttribute('data-flying', flying);
        place(i);
      });
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (raf) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    // Reduced motion: travel the whole slide at once.
    const settle = i => {
      const b = bodies[i];
      const k = 1 / friction;
      b.x += b.vx * k;
      b.y += b.vy * k;
      b.r += b.vr * k * 0.3;
      b.vx = b.vy = b.vr = 0;
      clamp(i);
      place(i);
    };
    const launch = i => (reduced ? settle(i) : wake());

    // Dragging, with the release velocity taken from the last ~80ms of movement.
    let drag = null;
    const onDown = event => {
      const i = nodes.current.indexOf(event.target.closest('.bl-pola__photo'));
      if (i < 0 || event.button > 0) return;
      event.preventDefault();
      const node = nodes.current[i];
      node.focus({ preventScroll: true });
      try {
        node.setPointerCapture(event.pointerId);
      } catch {
        // The pointer is already gone; the drag still works while it stays over the table.
      }
      const rect = table.getBoundingClientRect();
      const b = bodies[i];
      const { w, h } = size(i);
      b.held = true;
      b.vx = b.vy = b.vr = 0;
      node.dataset.held = '';
      drag = { i, id: event.pointerId, rect, dx: event.clientX - rect.left - b.x, dy: event.clientY - rect.top - b.y, gx: event.clientX - rect.left - (b.x + w / 2), gy: event.clientY - rect.top - (b.y + h / 2), samples: [{ x: event.clientX, y: event.clientY, t: event.timeStamp }] };
      raise(i);
    };
    const onMove = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const b = bodies[drag.i];
      b.x = event.clientX - drag.rect.left - drag.dx;
      b.y = event.clientY - drag.rect.top - drag.dy;
      clamp(drag.i);
      place(drag.i);
      drag.samples.push({ x: event.clientX, y: event.clientY, t: event.timeStamp });
      while (drag.samples.length > 2 && event.timeStamp - drag.samples[0].t > 80) drag.samples.shift();
    };
    const onUp = event => {
      if (!drag || event.pointerId !== drag.id) return;
      const { i, samples, gx, gy } = drag;
      const b = bodies[i];
      const first = samples[0];
      const lastSample = samples[samples.length - 1];
      const span = Math.max(16, lastSample.t - first.t) / 1000;
      b.vx = (lastSample.x - first.x) / span;
      b.vy = (lastSample.y - first.y) / span;
      // Holding off-centre makes it spin: torque from the grip offset crossed with the throw.
      b.vr = (spin * (gx * b.vy - gy * b.vx)) / 900;
      b.held = false;
      delete nodes.current[i].dataset.held;
      drag = null;
      launch(i);
      if (Math.hypot(b.vx, b.vy) > 200) setAnnounce(`${name(i)} tossed.`);
    };

    const onKey = event => {
      const i = nodes.current.indexOf(event.target.closest?.('.bl-pola__photo'));
      if (i < 0) return;
      const step = event.shiftKey ? 40 : 10;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (moves[event.key]) {
        event.preventDefault();
        const b = bodies[i];
        b.x += moves[event.key][0];
        b.y += moves[event.key][1];
        clamp(i);
        place(i);
        raise(i);
        setAnnounce(`${name(i)} moved to ${Math.round(b.x)}, ${Math.round(b.y)}.`);
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        raise(i);
        setAnnounce(`${name(i)} on top.`);
      }
    };

    api.current = {
      scatter: () => {
        bodies.forEach((b, i) => {
          const a = Math.random() * Math.PI * 2;
          const speed = 600 + Math.random() * 900;
          b.vx = Math.cos(a) * speed;
          b.vy = Math.sin(a) * speed;
          b.vr = (Math.random() - 0.5) * 400 * spin;
          if (reduced) settle(i);
        });
        if (!reduced) wake();
        setAnnounce('Photos scattered.');
      },
      tidy: () => {
        bodies.forEach((b, i) => {
          const { w, h } = size(i);
          b.x = W / 2 - w / 2 + jitter(i, 4) * 16;
          b.y = H / 2 - h / 2 + jitter(i, 5) * 16;
          b.r = jitter(i, 6) * 10;
          b.vx = b.vy = b.vr = 0;
          place(i);
        });
        setAnnounce('Photos stacked in a neat pile.');
      }
    };

    const resize = new ResizeObserver(() => {
      W = table.clientWidth;
      H = table.clientHeight;
      bodies.forEach((_, i) => {
        clamp(i);
        place(i);
      });
    });
    resize.observe(table);
    bodies.forEach((_, i) => place(i));
    table.addEventListener('pointerdown', onDown);
    table.addEventListener('pointermove', onMove);
    table.addEventListener('pointerup', onUp);
    table.addEventListener('pointercancel', onUp);
    table.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      table.removeEventListener('pointerdown', onDown);
      table.removeEventListener('pointermove', onMove);
      table.removeEventListener('pointerup', onUp);
      table.removeEventListener('pointercancel', onUp);
      table.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos.length, photoWidth, frame, captionHeight, friction, bounce, spin]);

  return (
    <div className={`relative grid w-full gap-2.5 font-(family-name:--bl-font) ${className}`} style={{ '--bl-h': `${height}px`, '--bl-pw': `${photoWidth}px`, '--bl-frame': `${frame}px`, '--bl-caption': `${captionHeight}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-paper': paperColor, '--bl-ink': textColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-btn': buttonColor, '--bl-btn-ink': buttonTextColor, '--bl-font': fontFamily, ...style }}>
      <div ref={tableRef} className="relative h-(--bl-h) w-full touch-none overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) shadow-[inset_0_0_0_2px_var(--bl-line)]" role="group" aria-label={label}>
        {photos.map((photo, i) => (
          <button
            key={photo.src ?? i}
            ref={node => {
              nodes.current[i] = node;
            }}
            type="button"
            className="bl-pola__photo absolute top-0 left-0 m-0 box-border w-(--bl-pw) cursor-grab touch-none border-0 bg-(--bl-paper) px-(--bl-frame) pt-(--bl-frame) pb-0 text-center text-(--bl-ink) outline-none will-change-transform [filter:drop-shadow(0_3px_4px_rgba(0,0,0,0.4))] [transition:filter_200ms] focus-visible:shadow-[0_0_0_3px_var(--bl-accent)] data-[flying]:[filter:drop-shadow(0_14px_12px_rgba(0,0,0,0.45))] data-[held]:cursor-grabbing data-[held]:[filter:drop-shadow(0_22px_18px_rgba(0,0,0,0.5))]"
            style={{ zIndex: order.indexOf(i) + 1 }}
            aria-label={`${name(i)}. Drag to move, arrows to nudge, Enter to bring to the top.`}
          >
            <img className="pointer-events-none block aspect-square w-full bg-[#0b0b14] object-cover select-none" src={photo.src} alt="" draggable={false} />
            <span className="block h-(--bl-caption) overflow-hidden text-[14px] leading-(--bl-caption) text-ellipsis whitespace-nowrap">{photo.caption}</span>
          </button>
        ))}
      </div>
      {showControls && (
        <div className="flex justify-center gap-2">
          <button type="button" className="cursor-pointer rounded-[8px] border-0 bg-(--bl-btn) px-3.5 py-[7px] text-[14px] text-(--bl-btn-ink) hover:[filter:brightness(1.15)] focus-visible:outline-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid focus-visible:outline-offset-2" onClick={() => api.current?.scatter()}>
            {scatterLabel}
          </button>
          <button type="button" className="cursor-pointer rounded-[8px] border-0 bg-(--bl-btn) px-3.5 py-[7px] text-[14px] text-(--bl-btn-ink) hover:[filter:brightness(1.15)] focus-visible:outline-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid focus-visible:outline-offset-2" onClick={() => api.current?.tidy()}>
            {tidyLabel}
          </button>
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
