import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A pile of instant photos on a table. Grab one and it lifts with a deeper shadow; fling it
// and it slides on with momentum, spins a little from where you held it, and bounces off the
// edges of the table before settling. Scatter tosses the whole pile at once. Each photo is a
// focusable button: arrows nudge it (Shift for bigger steps), Enter brings it to the top,
// and moves are announced. Under reduced motion photos move straight to where they land.

const STYLE_ID = 'bl-polaroids';
const CSS = `
.bl-pola { position: relative; display: grid; gap: 10px; width: 100%; font-family: var(--bl-font); }
.bl-pola__table { position: relative; width: 100%; height: var(--bl-h); overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-bg); box-shadow: inset 0 0 0 2px var(--bl-line); touch-action: none; }
.bl-pola__photo { position: absolute; top: 0; left: 0; box-sizing: border-box; width: var(--bl-pw); margin: 0; padding: var(--bl-frame) var(--bl-frame) 0; border: 0; background: var(--bl-paper); color: var(--bl-ink); font: inherit; text-align: center; cursor: grab; touch-action: none; filter: drop-shadow(0 3px 4px rgba(0,0,0,0.4)); transition: filter 200ms; outline: none; will-change: transform; }
.bl-pola__photo[data-held] { cursor: grabbing; filter: drop-shadow(0 22px 18px rgba(0,0,0,0.5)); }
.bl-pola__photo[data-flying] { filter: drop-shadow(0 14px 12px rgba(0,0,0,0.45)); }
.bl-pola__photo:focus-visible { box-shadow: 0 0 0 3px var(--bl-accent); }
.bl-pola__img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; background: #0b0b14; pointer-events: none; user-select: none; }
.bl-pola__caption { display: block; overflow: hidden; height: var(--bl-caption); line-height: var(--bl-caption); font-size: 14px; white-space: nowrap; text-overflow: ellipsis; }
.bl-pola__bar { display: flex; justify-content: center; gap: 8px; }
.bl-pola__btn { padding: 7px 14px; border: 0; border-radius: 8px; background: var(--bl-btn); color: var(--bl-btn-ink); font: inherit; font-size: 14px; cursor: pointer; }
.bl-pola__btn:hover { filter: brightness(1.15); }
.bl-pola__btn:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-pola__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Deterministic jitter per photo, so the first render is the same on server and client.
const jitter = (i: number, salt: number) => {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x) - 0.5;
};

export interface Photo {
  src: string;
  /** Shown under the photo; also names it for screen readers. */
  caption?: string;
  /** Used as the name when there is no caption. */
  alt?: string;
}

export interface PolaroidsProps {
  photos?: Photo[];
  /** Table height in px. */
  height?: number;
  photoWidth?: number;
  /** White border around the image, in px. */
  frame?: number;
  captionHeight?: number;
  /** How quickly a throw slows down (per second). */
  friction?: number;
  /** Share of speed kept when bouncing off an edge (0–1). */
  bounce?: number;
  /** How much an off-centre grip spins a thrown photo. */
  spin?: number;
  /** Show the Scatter and Tidy up buttons. */
  showControls?: boolean;
  scatterLabel?: string;
  tidyLabel?: string;
  /** Accessible name of the table. */
  label?: string;
  radius?: number;
  backgroundColor?: string;
  paperColor?: string;
  textColor?: string;
  lineColor?: string;
  accentColor?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

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
}: PolaroidsProps) {
  useStyles();
  const tableRef = useRef<HTMLDivElement>(null);
  const nodes = useRef<(HTMLButtonElement | null)[]>([]);
  const api = useRef<{ scatter: () => void; tidy: () => void } | null>(null);
  const [order, setOrder] = useState(() => photos.map((_, i) => i));
  const [announce, setAnnounce] = useState('');

  const name = (i: number) => photos[i]?.caption || photos[i]?.alt || `Photo ${i + 1}`;
  const raise = (i: number) => setOrder(list => [...list.filter(j => j !== i), i]);

  useEffect(() => {
    setOrder(list => {
      const kept = list.filter(i => i < photos.length);
      return [...kept, ...photos.map((_, i) => i).filter(i => !kept.includes(i))];
    });
  }, [photos.length]);

  useEffect(() => {
    const table = tableRef.current!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const count = photos.length;
    let W = table.clientWidth;
    let H = table.clientHeight;
    const size = (i: number) => ({ w: nodes.current[i]?.offsetWidth || photoWidth, h: nodes.current[i]?.offsetHeight || photoWidth + captionHeight });
    // A loose pile around the middle.
    const bodies = Array.from({ length: count }, (_, i) => {
      const { w, h } = size(i);
      return { x: W / 2 - w / 2 + jitter(i, 1) * W * 0.35, y: H / 2 - h / 2 + jitter(i, 2) * H * 0.3, r: jitter(i, 3) * 30, vx: 0, vy: 0, vr: 0, held: false };
    });
    let raf = 0;
    let last = 0;

    const clamp = (i: number) => {
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
    const place = (i: number) => {
      const node = nodes.current[i];
      const b = bodies[i];
      if (node) node.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px) rotate(${b.r.toFixed(2)}deg)`;
    };

    const tick = (now: number) => {
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
    const settle = (i: number) => {
      const b = bodies[i];
      const k = 1 / friction;
      b.x += b.vx * k;
      b.y += b.vy * k;
      b.r += b.vr * k * 0.3;
      b.vx = b.vy = b.vr = 0;
      clamp(i);
      place(i);
    };
    const launch = (i: number) => (reduced ? settle(i) : wake());

    // Dragging, with the release velocity taken from the last ~80ms of movement.
    let drag: { i: number; id: number; rect: DOMRect; dx: number; dy: number; gx: number; gy: number; samples: { x: number; y: number; t: number }[] } | null = null;
    const onDown = (event: PointerEvent) => {
      const i = nodes.current.indexOf((event.target as Element).closest('.bl-pola__photo') as HTMLButtonElement | null);
      if (i < 0 || event.button > 0) return;
      event.preventDefault();
      const node = nodes.current[i]!;
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
    const onMove = (event: PointerEvent) => {
      if (!drag || event.pointerId !== drag.id) return;
      const b = bodies[drag.i];
      b.x = event.clientX - drag.rect.left - drag.dx;
      b.y = event.clientY - drag.rect.top - drag.dy;
      clamp(drag.i);
      place(drag.i);
      drag.samples.push({ x: event.clientX, y: event.clientY, t: event.timeStamp });
      while (drag.samples.length > 2 && event.timeStamp - drag.samples[0].t > 80) drag.samples.shift();
    };
    const onUp = (event: PointerEvent) => {
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
      delete nodes.current[i]!.dataset.held;
      drag = null;
      launch(i);
      if (Math.hypot(b.vx, b.vy) > 200) setAnnounce(`${name(i)} tossed.`);
    };

    const onKey = (event: KeyboardEvent) => {
      const i = nodes.current.indexOf((event.target as Element).closest?.('.bl-pola__photo') as HTMLButtonElement | null);
      if (i < 0) return;
      const step = event.shiftKey ? 40 : 10;
      const moves: Record<string, number[]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
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
    <div className={`bl-pola ${className}`} style={{ '--bl-h': `${height}px`, '--bl-pw': `${photoWidth}px`, '--bl-frame': `${frame}px`, '--bl-caption': `${captionHeight}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-paper': paperColor, '--bl-ink': textColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-btn': buttonColor, '--bl-btn-ink': buttonTextColor, '--bl-font': fontFamily, ...style } as CSSVars}>
      <div ref={tableRef} className="bl-pola__table" role="group" aria-label={label}>
        {photos.map((photo, i) => (
          <button
            key={photo.src ?? i}
            ref={node => {
              nodes.current[i] = node;
            }}
            type="button"
            className="bl-pola__photo"
            style={{ zIndex: order.indexOf(i) + 1 }}
            aria-label={`${name(i)}. Drag to move, arrows to nudge, Enter to bring to the top.`}
          >
            <img className="bl-pola__img" src={photo.src} alt="" draggable={false} />
            <span className="bl-pola__caption">{photo.caption}</span>
          </button>
        ))}
      </div>
      {showControls && (
        <div className="bl-pola__bar">
          <button type="button" className="bl-pola__btn" onClick={() => api.current?.scatter()}>
            {scatterLabel}
          </button>
          <button type="button" className="bl-pola__btn" onClick={() => api.current?.tidy()}>
            {tidyLabel}
          </button>
        </div>
      )}
      <span className="bl-pola__sr" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
