import { useEffect, useImperativeHandle, useRef } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Disintegrates any element into pixel blocks, for deletes and dismissals, and can put it
// back together. The element is copied into a grid of small tiles (static DOM copies, so
// it works on anything: text, images, cards), the real element is hidden, and each tile
// flies off on its own arc. Control it with the `exploded` prop or call explode() and
// reassemble() through a ref. While exploded the content is hidden from everyone; under
// reduced motion it simply fades.

function prefersReduced() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export default function PixelExplode({
  children,
  exploded,
  pieceSize = 8,
  maxPieces = 500,
  duration = 900,
  spread = 1,
  gravity = 1,
  direction = 'right',
  stepped = true,
  onExploded,
  onReassembled,
  display = 'inline-block',
  ref,
  className = '',
  style
}) {
  const contentRef = useRef(null);
  const layerRef = useRef(null);
  const animations = useRef([]);
  const state = useRef(exploded ? 'gone' : 'whole');
  const callbacks = useRef({ onExploded, onReassembled });
  callbacks.current = { onExploded, onReassembled };
  const options = useRef(null);
  options.current = { pieceSize, maxPieces, duration, spread, gravity, direction, stepped };

  const clear = () => {
    animations.current.forEach(animation => animation.cancel());
    animations.current = [];
    layerRef.current?.replaceChildren();
  };

  const setHidden = hidden => {
    const content = contentRef.current;
    if (!content) return;
    content.style.visibility = hidden ? 'hidden' : '';
    content.inert = hidden;
  };

  // Copies the content into tiles and starts their flight (or the reverse of it).
  const build = reverse => {
    const content = contentRef.current;
    const layer = layerRef.current;
    if (!content || !layer) return Promise.resolve();
    clear();
    const o = options.current;
    const width = content.offsetWidth;
    const height = content.offsetHeight;
    if (!width || !height) return Promise.resolve();
    const size = Math.max(o.pieceSize, Math.ceil(Math.sqrt((width * height) / o.maxPieces)));
    const source = content.cloneNode(true);
    source.removeAttribute('id');
    source.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    source.style.visibility = 'visible';
    source.style.width = `${width}px`;
    source.style.height = `${height}px`;
    source.style.margin = '0';

    const cols = Math.ceil(width / size);
    const rows = Math.ceil(height / size);
    const fragment = document.createDocumentFragment();
    const pending = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const tile = document.createElement('div');
        tile.style.cssText = `position:absolute;left:${c * size}px;top:${r * size}px;width:${size}px;height:${size}px;overflow:hidden;will-change:transform,opacity;`;
        const copy = source.cloneNode(true);
        copy.style.position = 'absolute';
        copy.style.left = `${-c * size}px`;
        copy.style.top = `${-r * size}px`;
        tile.appendChild(copy);
        fragment.appendChild(tile);

        // The sweep: tiles leave in order across the element, with a little jitter.
        const along = o.direction === 'left' ? 1 - c / cols : o.direction === 'up' ? 1 - r / rows : o.direction === 'down' ? r / rows : o.direction === 'center' ? Math.hypot(c / cols - 0.5, r / rows - 0.5) * 1.4 : c / cols;
        const delay = along * o.duration * 0.6 + Math.random() * o.duration * 0.15;
        const angle = (Math.random() - 0.5) * Math.PI * 0.9 - Math.PI / 2;
        const distance = (40 + Math.random() * 90) * o.spread;
        const dx = Math.cos(angle) * distance * 0.7 + (o.direction === 'left' ? -1 : o.direction === 'right' ? 1 : 0) * distance * 0.6;
        const dy = Math.sin(angle) * distance;
        const fall = 60 * o.gravity;
        const spin = (Math.random() - 0.5) * 180;
        const keyframes = [
          { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
          { transform: `translate(${dx * 0.55}px, ${dy * 0.55}px) rotate(${spin * 0.5}deg) scale(0.9)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${dx}px, ${dy + fall}px) rotate(${spin}deg) scale(0.4)`, opacity: 0 }
        ];
        const animation = tile.animate(keyframes, {
          duration: o.duration * (0.7 + Math.random() * 0.5),
          delay: reverse ? 0 : delay,
          endDelay: reverse ? delay : 0,
          easing: o.stepped ? 'steps(10)' : 'cubic-bezier(.3,.6,.5,1)',
          fill: 'both'
        });
        if (reverse) animation.reverse();
        animations.current.push(animation);
        pending.push(animation.finished.catch(() => null));
      }
    }
    layer.appendChild(fragment);
    return Promise.all(pending);
  };

  const explode = () => {
    if (state.current === 'gone' || state.current === 'leaving') return;
    state.current = 'leaving';
    if (prefersReduced()) {
      const fade = contentRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 });
      (fade?.finished ?? Promise.resolve()).catch(() => null).then(() => {
        if (state.current !== 'leaving') return;
        setHidden(true);
        state.current = 'gone';
        callbacks.current.onExploded?.();
      });
      return;
    }
    const run = build(false);
    setHidden(true);
    run.then(() => {
      if (state.current !== 'leaving') return;
      clear();
      state.current = 'gone';
      callbacks.current.onExploded?.();
    });
  };

  const reassemble = () => {
    if (state.current === 'whole' || state.current === 'returning') return;
    state.current = 'returning';
    if (prefersReduced()) {
      clear();
      setHidden(false);
      contentRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      state.current = 'whole';
      callbacks.current.onReassembled?.();
      return;
    }
    // Measure while hidden (layout is kept), fly the tiles home, then swap the real thing back.
    const run = build(true);
    run.then(() => {
      if (state.current !== 'returning') return;
      clear();
      setHidden(false);
      state.current = 'whole';
      callbacks.current.onReassembled?.();
    });
  };

  useImperativeHandle(ref, () => ({ explode, reassemble }));

  // Controlled use: follow the exploded prop after the first render.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      if (exploded) setHidden(true);
      return;
    }
    if (exploded === undefined) return;
    if (exploded) explode();
    else reassemble();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exploded]);

  useEffect(() => () => animations.current.forEach(animation => animation.cancel()), []);

  return (
    <div className={`relative ${className}`} style={{ display, ...style }}>
      <div ref={contentRef}>{children}</div>
      <div ref={layerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible" />
    </div>
  );
}
