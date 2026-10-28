import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
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

const STYLE_ID = 'bl-lightbox-tw';
const CSS = `
@keyframes bl-lb-fade { from { opacity: 0; } }
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
      <ul className={`m-0 grid w-full list-none grid-cols-[repeat(auto-fill,minmax(min(var(--bl-thumb),100%),1fr))] gap-(--bl-gap) p-0 ${className}`} aria-label={label} style={{ ...vars, ...style }}>
        {images.map((img, i) => (
          <li key={img.src}>
            <button
              ref={node => {
                thumbRefs.current[i] = node;
              }}
              type="button"
              className="block aspect-(--bl-ratio) w-full cursor-zoom-in overflow-hidden rounded-(--bl-radius) border-0 bg-(--bl-surface) p-0 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid [&_img]:block [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:[transition:transform_300ms_cubic-bezier(.2,.9,.25,1)] hover:[&_img]:[transform:scale(1.05)] data-[hidden]:[&_img]:invisible motion-reduce:[&_img]:[transition:none]"
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
          <div ref={dialogRef} className="group/lb fixed inset-0 z-2000 grid grid-rows-[auto_1fr_auto] font-(family-name:--bl-font) text-white" role="dialog" aria-modal="true" aria-label={`${label} viewer`} data-closing={closing || undefined} style={vars}>
            <div className="absolute inset-0 animate-[bl-lb-fade_240ms_ease_both] bg-(--bl-backdrop) group-data-[closing]/lb:animate-[bl-lb-fade_220ms_ease_reverse_both]" onClick={close} aria-hidden="true" />
            <div className="relative z-2 flex items-center justify-between gap-3 px-3.5 py-3 text-[14px]">
              <span className="text-[rgba(255,255,255,0.75)] tabular-nums" aria-hidden="true">
                {open! + 1} / {images.length}
              </span>
              <span className="flex gap-1.5">
                <button type="button" className="grid size-10 cursor-pointer place-items-center rounded-[50%] border-0 bg-[rgba(255,255,255,0.12)] p-0 text-white hover:bg-[rgba(255,255,255,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) disabled:cursor-default disabled:opacity-30" aria-label="Zoom out" disabled={!zoomed} onClick={() => zoomBy(1 / 1.5)}>
                  <Icon d="M3 8h10" />
                </button>
                <button type="button" className="grid size-10 cursor-pointer place-items-center rounded-[50%] border-0 bg-[rgba(255,255,255,0.12)] p-0 text-white hover:bg-[rgba(255,255,255,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) disabled:cursor-default disabled:opacity-30" aria-label="Zoom in" disabled={view.scale >= MAX_ZOOM} onClick={() => zoomBy(1.5)}>
                  <Icon d="M3 8h10M8 3v10" />
                </button>
                <button type="button" className="grid size-10 cursor-pointer place-items-center rounded-[50%] border-0 bg-[rgba(255,255,255,0.12)] p-0 text-white hover:bg-[rgba(255,255,255,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) disabled:cursor-default disabled:opacity-30" data-close="" aria-label="Close" onClick={close}>
                  <Icon d="m3.5 3.5 9 9M12.5 3.5l-9 9" />
                </button>
              </span>
            </div>
            <div
              ref={stageRef}
              className="relative z-1 grid min-h-0 cursor-grab touch-none place-items-center overflow-hidden data-[zoomed]:cursor-move"
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
                className="max-h-full max-w-[92vw] rounded-[6px] object-contain select-none will-change-transform [-webkit-user-drag:none] data-[settle]:[transition:transform_260ms_cubic-bezier(.2,.9,.25,1)] motion-reduce:data-[settle]:[transition:none]"
                data-settle={settle || undefined}
                src={image.src}
                alt={image.alt ?? ''}
                draggable={false}
                style={{ ...imageStyle, transform: `translate(${view.x + view.dx}px, ${view.y}px) scale(${view.scale})` }}
              />
              <button type="button" className="grid size-10 cursor-pointer place-items-center rounded-[50%] border-0 bg-[rgba(255,255,255,0.12)] p-0 text-white hover:bg-[rgba(255,255,255,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) disabled:cursor-default disabled:opacity-30 absolute top-1/2 z-2 [transform:translateY(-50%)] [@media(max-width:640px)]:hidden left-3" data-side="prev" aria-label="Previous image" disabled={open === 0} onClick={() => go(-1)}>
                <Icon d="M10 3 5 8l5 5" />
              </button>
              <button type="button" className="grid size-10 cursor-pointer place-items-center rounded-[50%] border-0 bg-[rgba(255,255,255,0.12)] p-0 text-white hover:bg-[rgba(255,255,255,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) disabled:cursor-default disabled:opacity-30 absolute top-1/2 z-2 [transform:translateY(-50%)] [@media(max-width:640px)]:hidden right-3" data-side="next" aria-label="Next image" disabled={open === images.length - 1} onClick={() => go(1)}>
                <Icon d="m6 3 5 5-5 5" />
              </button>
            </div>
            <div className="relative z-2 min-h-[1.5em] px-4 pt-3 pb-[18px] text-center text-[14px] text-[rgba(255,255,255,0.85)]">{image.caption}</div>
            <p className="sr-only" aria-live="polite" id={`${uid}-status`}>
              {`Image ${open! + 1} of ${images.length}${image.alt ? `: ${image.alt}` : ''}`}
            </p>
          </div>,
          document.body
        )}
    </>
  );
}
