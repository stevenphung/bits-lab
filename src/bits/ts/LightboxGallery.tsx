import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A thumbnail grid that opens into a full-screen viewer. The image grows out of its thumbnail
// (and shrinks back into it on close). In the viewer: swipe or arrow keys between images,
// wheel / pinch / double-click to zoom, drag to pan when zoomed. A modal dialog: focus stays
// inside, the page doesn't scroll behind it, Esc closes and focus returns to the thumbnail.

export interface GalleryImage {
  src: string;
  alt?: string;
  caption?: ReactNode;
  /** A smaller image for the grid. */
  thumb?: string;
}

export interface LightboxGalleryProps {
  images?: GalleryImage[];
  /** Grid column width in px. */
  thumbSize?: number;
  gap?: number;
  aspectRatio?: string;
  radius?: number;
  /** Applied to thumbs and the full image. */
  imageStyle?: CSSProperties;
  label?: string;
  backdropColor?: string;
  surfaceColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

interface View {
  scale: number;
  x: number;
  y: number;
  dx: number;
}

type Gesture = { kind: 'pinch'; dist: number; scale: number } | { kind: 'pan' | 'swipe'; x: number; y: number; vx: number; vy: number };

const STYLE_ID = 'bl-lightbox';
const CSS = `
.bl-lb-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(var(--bl-thumb), 100%), 1fr)); gap: var(--bl-gap); width: 100%; margin: 0; padding: 0; list-style: none; }
.bl-lb-thumb { display: block; width: 100%; aspect-ratio: var(--bl-ratio); padding: 0; overflow: hidden; border: 0; border-radius: var(--bl-radius); background: var(--bl-surface); cursor: zoom-in; }
.bl-lb-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform 300ms cubic-bezier(.2,.9,.25,1); }
.bl-lb-thumb:hover img { transform: scale(1.05); }
.bl-lb-thumb:focus-visible { outline: 3px solid var(--bl-accent); outline-offset: 2px; }
.bl-lb-thumb[data-hidden] img { visibility: hidden; }
.bl-lb { position: fixed; inset: 0; z-index: 2000; display: grid; grid-template-rows: auto 1fr auto; color: #fff; font-family: var(--bl-font); }
.bl-lb__backdrop { position: absolute; inset: 0; background: var(--bl-backdrop); animation: bl-lb-fade 240ms ease both; }
.bl-lb[data-closing] .bl-lb__backdrop { animation: bl-lb-fade 220ms ease reverse both; }
.bl-lb__bar { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; font-size: 14px; }
.bl-lb__count { color: rgba(255,255,255,0.75); font-variant-numeric: tabular-nums; }
.bl-lb__tools { display: flex; gap: 6px; }
.bl-lb__btn { display: grid; place-items: center; width: 40px; height: 40px; padding: 0; border: 0; border-radius: 50%; background: rgba(255,255,255,0.12); color: #fff; cursor: pointer; }
.bl-lb__btn:hover { background: rgba(255,255,255,0.22); }
.bl-lb__btn:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-lb__btn:disabled { opacity: 0.3; cursor: default; }
.bl-lb__stage { position: relative; z-index: 1; display: grid; place-items: center; min-height: 0; overflow: hidden; touch-action: none; cursor: grab; }
.bl-lb__stage[data-zoomed] { cursor: move; }
.bl-lb__img { max-width: 92vw; max-height: 100%; object-fit: contain; border-radius: 6px; user-select: none; -webkit-user-drag: none; will-change: transform; }
.bl-lb__img[data-settle] { transition: transform 260ms cubic-bezier(.2,.9,.25,1); }
.bl-lb__nav { position: absolute; top: 50%; z-index: 2; transform: translateY(-50%); }
.bl-lb__nav[data-side="prev"] { left: 12px; }
.bl-lb__nav[data-side="next"] { right: 12px; }
.bl-lb__caption { position: relative; z-index: 2; min-height: 1.5em; padding: 12px 16px 18px; color: rgba(255,255,255,0.85); font-size: 14px; text-align: center; }
.bl-lb__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-lb-fade { from { opacity: 0; } }
@media (max-width: 640px) { .bl-lb__nav { display: none; } }
@media (prefers-reduced-motion: reduce) { .bl-lb__img[data-settle], .bl-lb-thumb img { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const MAX_ZOOM = 4;
const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const Icon = ({ d }: { d: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

export default function LightboxGallery({
  images = [],
  thumbSize = 160,
  gap = 10,
  aspectRatio = '1',
  radius = 10,
  imageStyle,
  label = 'Gallery',
  backdropColor = 'rgba(8,8,16,0.92)',
  surfaceColor = '#1a1c2c',
  accentColor = '#73eff7',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: LightboxGalleryProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [open, setOpen] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const [view, setView] = useState<View>({ scale: 1, x: 0, y: 0, dx: 0 });
  const [settle, setSettle] = useState(false);
  const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const imgRef = useRef<HTMLImageElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<Gesture | null>(null);
  const dragged = useRef(false);
  const flip = useRef(false);
  const image = open != null ? images[open] : null;
  const zoomed = view.scale > 1.01;

  const reset = () => setView({ scale: 1, x: 0, y: 0, dx: 0 });

  const show = (index: number) => {
    flip.current = true;
    setClosing(false);
    reset();
    setOpen(index);
  };

  const go = (step: number) => {
    if (open == null) return;
    const next = open + step;
    if (next < 0 || next >= images.length) return;
    flip.current = false;
    setSettle(false);
    reset();
    setOpen(next);
  };

  // Shrink back into the thumbnail, then unmount and return focus.
  const close = () => {
    if (open == null || closing) return;
    const img = imgRef.current;
    const thumb = thumbRefs.current[open];
    setClosing(true);
    const finish = () => {
      setOpen(null);
      setClosing(false);
      thumb?.focus({ preventScroll: true });
    };
    if (!img || !thumb || reducedMotion()) {
      finish();
      return;
    }
    const from = img.getBoundingClientRect();
    const to = thumb.getBoundingClientRect();
    const s = to.width / from.width;
    img
      .animate([{ transform: img.style.transform || 'none' }, { transform: `translate(${to.left + to.width / 2 - (from.left + from.width / 2)}px, ${to.top + to.height / 2 - (from.top + from.height / 2)}px) scale(${s})` }], {
        duration: 260,
        easing: 'cubic-bezier(.4,0,.2,1)',
        fill: 'forwards'
      })
      .finished.catch(() => null)
      .then(finish);
  };

  // Grow out of the thumbnail on open.
  useLayoutEffect(() => {
    if (open == null || !flip.current) return;
    flip.current = false;
    const img = imgRef.current;
    const thumb = thumbRefs.current[open];
    if (!img || !thumb || reducedMotion()) return;
    const run = () => {
      const to = img.getBoundingClientRect();
      const from = thumb.getBoundingClientRect();
      if (!to.width) return;
      const s = from.width / to.width;
      img.animate([{ transform: `translate(${from.left + from.width / 2 - (to.left + to.width / 2)}px, ${from.top + from.height / 2 - (to.top + to.height / 2)}px) scale(${s})` }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.9,.25,1)' });
    };
    if (img.complete) run();
    else img.addEventListener('load', run, { once: true });
  }, [open]);

  // Modal behavior: lock scroll, trap Tab, keyboard shortcuts, focus the dialog.
  useEffect(() => {
    if (open == null) return undefined;
    const { body } = document;
    const previous = body.style.overflow;
    body.style.overflow = 'hidden';
    dialogRef.current?.querySelector<HTMLElement>('[data-close]')?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowRight') go(1);
      else if (event.key === 'ArrowLeft') go(-1);
      else if (event.key === '+' || event.key === '=') zoomBy(1.5);
      else if (event.key === '-') zoomBy(1 / 1.5);
      else if (event.key === '0') reset();
      else if (event.key === 'Tab') {
        const items = [...dialogRef.current!.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
        return;
      } else return;
      event.preventDefault();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, closing]);

  // Keep the pan inside the image when zoomed.
  const bound = (next: View): View => {
    const img = imgRef.current;
    if (!img || next.scale <= 1) return { ...next, scale: Math.max(1, next.scale), x: 0, y: 0 };
    const maxX = (img.offsetWidth * (next.scale - 1)) / 2;
    const maxY = (img.offsetHeight * (next.scale - 1)) / 2;
    return { ...next, x: Math.max(-maxX, Math.min(maxX, next.x)), y: Math.max(-maxY, Math.min(maxY, next.y)) };
  };

  // Zoom by a factor around a point on screen (default: the center).
  const zoomBy = (factor: number, cx?: number, cy?: number) => {
    setSettle(true);
    setView(v => {
      const scale = Math.max(1, Math.min(MAX_ZOOM, v.scale * factor));
      const rect = imgRef.current?.getBoundingClientRect();
      if (!rect || cx == null) return bound({ ...v, scale, dx: 0 });
      const ox = cx - (rect.left + rect.width / 2);
      const oy = cy! - (rect.top + rect.height / 2);
      const k = scale / v.scale;
      return bound({ scale, x: v.x * k - ox * (k - 1), y: v.y * k - oy * (k - 1), dx: 0 });
    });
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointers can't be captured; the stage still sees the moves.
    }
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    dragged.current = false;
    setSettle(false);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = { kind: 'pinch', dist: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale };
    } else {
      gesture.current = { kind: zoomed ? 'pan' : 'swipe', x: event.clientX, y: event.clientY, vx: view.x, vy: view.y };
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const g = gesture.current;
    if (!g) return;
    if (g.kind !== 'pinch' && Math.hypot(event.clientX - g.x, event.clientY - g.y) > 6) dragged.current = true;
    if (g.kind === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const scale = Math.max(1, Math.min(MAX_ZOOM, (g.scale * Math.hypot(a.x - b.x, a.y - b.y)) / g.dist));
      setView(v => bound({ ...v, scale }));
    } else if (g.kind === 'pan') {
      setView(v => bound({ ...v, x: g.vx + event.clientX - g.x, y: g.vy + event.clientY - g.y }));
    } else if (g.kind === 'swipe') {
      setView(v => ({ ...v, dx: event.clientX - g.x }));
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId);
    const g = gesture.current;
    if (pointers.current.size) return;
    gesture.current = null;
    if (g?.kind === 'swipe') {
      const dx = event.clientX - g.x;
      const atEdge = (dx > 0 && open === 0) || (dx < 0 && open === images.length - 1);
      if (Math.abs(dx) > 70 && !atEdge) go(dx < 0 ? 1 : -1);
      else {
        setSettle(true);
        setView(v => ({ ...v, dx: 0 }));
      }
    }
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    zoomBy(Math.exp(-event.deltaY * 0.0025), event.clientX, event.clientY);
  };

  // Wheel needs a non-passive listener to stop the page zooming/scrolling.
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = stageRef.current;
    if (!node) return undefined;
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  });

  // Warm the cache for the neighbors.
  useEffect(() => {
    if (open == null) return;
    [open - 1, open + 1].forEach(i => {
      if (images[i]) new Image().src = images[i].src;
    });
  }, [open, images]);

  const vars: CSSVars = { '--bl-thumb': `${thumbSize}px`, '--bl-gap': `${gap}px`, '--bl-ratio': aspectRatio, '--bl-radius': `${radius}px`, '--bl-backdrop': backdropColor, '--bl-surface': surfaceColor, '--bl-accent': accentColor, '--bl-font': fontFamily };

  return (
    <>
      <ul className={`bl-lb-grid ${className}`} aria-label={label} style={{ ...vars, ...style }}>
        {images.map((img, i) => (
          <li key={img.src}>
            <button
              ref={node => {
                thumbRefs.current[i] = node;
              }}
              type="button"
              className="bl-lb-thumb"
              data-hidden={(open === i && !reducedMotion()) || undefined}
              aria-label={`Open ${img.alt || `image ${i + 1}`}`}
              onClick={() => show(i)}
            >
              <img src={img.thumb ?? img.src} alt="" loading="lazy" style={imageStyle} />
            </button>
          </li>
        ))}
      </ul>
      {image &&
        createPortal(
          <div ref={dialogRef} className="bl-lb" role="dialog" aria-modal="true" aria-label={`${label} viewer`} data-closing={closing || undefined} style={vars}>
            <div className="bl-lb__backdrop" onClick={close} aria-hidden="true" />
            <div className="bl-lb__bar">
              <span className="bl-lb__count" aria-hidden="true">
                {open! + 1} / {images.length}
              </span>
              <span className="bl-lb__tools">
                <button type="button" className="bl-lb__btn" aria-label="Zoom out" disabled={!zoomed} onClick={() => zoomBy(1 / 1.5)}>
                  <Icon d="M3 8h10" />
                </button>
                <button type="button" className="bl-lb__btn" aria-label="Zoom in" disabled={view.scale >= MAX_ZOOM} onClick={() => zoomBy(1.5)}>
                  <Icon d="M3 8h10M8 3v10" />
                </button>
                <button type="button" className="bl-lb__btn" data-close="" aria-label="Close" onClick={close}>
                  <Icon d="m3.5 3.5 9 9M12.5 3.5l-9 9" />
                </button>
              </span>
            </div>
            <div
              ref={stageRef}
              className="bl-lb__stage"
              data-zoomed={zoomed || undefined}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onDoubleClick={event => {
                if (zoomed) {
                  setSettle(true);
                  reset();
                } else zoomBy(2.5, event.clientX, event.clientY);
              }}
              onClick={event => {
                // A tap on the empty area closes; the end of a drag doesn't.
                if (event.target === event.currentTarget && !zoomed && !dragged.current) close();
              }}
            >
              <img
                key={open}
                ref={imgRef}
                className="bl-lb__img"
                data-settle={settle || undefined}
                src={image.src}
                alt={image.alt ?? ''}
                draggable={false}
                style={{ ...imageStyle, transform: `translate(${view.x + view.dx}px, ${view.y}px) scale(${view.scale})` }}
              />
              <button type="button" className="bl-lb__btn bl-lb__nav" data-side="prev" aria-label="Previous image" disabled={open === 0} onClick={() => go(-1)}>
                <Icon d="M10 3 5 8l5 5" />
              </button>
              <button type="button" className="bl-lb__btn bl-lb__nav" data-side="next" aria-label="Next image" disabled={open === images.length - 1} onClick={() => go(1)}>
                <Icon d="m6 3 5 5-5 5" />
              </button>
            </div>
            <div className="bl-lb__caption">{image.caption}</div>
            <p className="bl-lb__sr" aria-live="polite" id={`${uid}-status`}>
              {`Image ${open! + 1} of ${images.length}${image.alt ? `: ${image.alt}` : ''}`}
            </p>
          </div>,
          document.body
        )}
    </>
  );
}
