import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A layered collage. Each piece sits at its own depth: as the collage scrolls through the
// viewport, deep pieces drift slowly and near ones rush past, with a little rotation, and
// (optionally) the whole stack leans toward the pointer. Your own content sits in the
// middle layer. Pieces are decorative unless you give them alt text. Pauses off-screen and
// holds still under reduced motion.

export interface CollagePiece {
  id?: string;
  /** An image URL; or pass content for any node. */
  src?: string;
  content?: ReactNode;
  /** Makes the piece meaningful to screen readers; otherwise it is decorative. */
  alt?: string;
  /** Left, top and width as percentages of the collage. */
  x?: number;
  y?: number;
  width?: number;
  /** 0 is far and slow, 1 is near and fast. */
  depth?: number;
  /** Resting rotation in degrees. */
  rotate?: number;
  /** Style for the image. */
  style?: CSSProperties;
}

export interface ParallaxCollageProps {
  pieces?: CollagePiece[];
  /** Your content in the middle layer. */
  children?: ReactNode;
  height?: number | string;
  /** Max vertical drift in px for a depth-1 piece. */
  range?: number;
  /** Max rotation drift in degrees for a depth-1 piece. */
  spin?: number;
  /** Lean toward the mouse. */
  pointer?: boolean;
  pointerRange?: number;
  /** Blur for the farthest pieces. */
  depthBlur?: number;
  radius?: number;
  textColor?: string;
  fontFamily?: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

function scrollParent(node: HTMLElement | null): HTMLElement | Window {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) return el;
  }
  return window;
}

export default function ParallaxCollage({
  pieces = [],
  children,
  height = 520,
  range = 160,
  spin = 6,
  pointer = true,
  pointerRange = 18,
  depthBlur = 0,
  radius = 10,
  textColor = '#f4f4f4',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  label,
  className = '',
  style
}: ParallaxCollageProps) {
  
  const rootRef = useRef<HTMLElement>(null);
  const pieceRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const root = rootRef.current!;
    const scroller = scrollParent(root);
    const isWindow = scroller === window;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let visible = true;
    let lean = { x: 0, y: 0 };
    let leanTarget = { x: 0, y: 0 };

    const update = () => {
      frame = 0;
      const view = isWindow ? { top: 0, height: window.innerHeight } : { top: (scroller as HTMLElement).getBoundingClientRect().top, height: (scroller as HTMLElement).clientHeight };
      const rect = root.getBoundingClientRect();
      // -1 when the collage enters from below, 0 when centred, 1 when it leaves at the top.
      const progress = reduced ? 0 : Math.max(-1, Math.min(1, (view.top + view.height / 2 - (rect.top + rect.height / 2)) / (view.height / 2 + rect.height / 2)));
      lean.x += (leanTarget.x - lean.x) * 0.12;
      lean.y += (leanTarget.y - lean.y) * 0.12;
      pieces.forEach((piece, i) => {
        const node = pieceRefs.current[i];
        if (!node) return;
        const depth = piece.depth ?? 0.5;
        const y = -progress * depth * range + lean.y * depth * pointerRange;
        const x = lean.x * depth * pointerRange;
        const r = (piece.rotate ?? 0) + progress * depth * spin * (i % 2 ? -1 : 1);
        node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${r.toFixed(2)}deg)`;
      });
      // Keep easing toward the pointer until it settles.
      if (Math.abs(leanTarget.x - lean.x) + Math.abs(leanTarget.y - lean.y) > 0.002) schedule();
    };

    const schedule = () => {
      if (!frame && visible) frame = requestAnimationFrame(update);
    };
    const onPointer = (event: PointerEvent) => {
      if (!pointer || reduced || event.pointerType === 'touch') return;
      const rect = root.getBoundingClientRect();
      leanTarget = { x: ((event.clientX - rect.left) / rect.width - 0.5) * 2, y: ((event.clientY - rect.top) / rect.height - 0.5) * 2 };
      schedule();
    };
    const onLeave = () => {
      leanTarget = { x: 0, y: 0 };
      schedule();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    });
    io.observe(root);
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    root.addEventListener('pointermove', onPointer);
    root.addEventListener('pointerleave', onLeave);
    update();
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      root.removeEventListener('pointermove', onPointer);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, [pieces, range, spin, pointer, pointerRange]);

  return (
    <section
      ref={rootRef}
      className={`relative h-(--bl-h) w-full overflow-hidden font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      aria-label={label}
      style={{ '--bl-h': typeof height === 'number' ? `${height}px` : height, '--bl-radius': `${radius}px`, '--bl-ink': textColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      {pieces.map((piece, i) => {
        const depth = piece.depth ?? 0.5;
        return (
          <div
            key={piece.id ?? i}
            ref={node => {
              pieceRefs.current[i] = node;
            }}
            className="absolute top-(--y) left-(--x) z-(--z) w-(--w) [filter:var(--blur,none)] will-change-transform *:w-full [&>img]:block [&>img]:h-auto [&>img]:rounded-(--bl-radius) [&>img]:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.7)]"
            aria-hidden={piece.alt ? undefined : true}
            style={{
              '--x': `${piece.x ?? 0}%`,
              '--y': `${piece.y ?? 0}%`,
              '--w': `${piece.width ?? 30}%`,
              // Near pieces stack above far ones; blur (if any) grows with distance from the middle.
              '--z': Math.round(depth * 100),
              '--blur': depthBlur && depth < 0.35 ? `blur(${((0.35 - depth) * depthBlur).toFixed(1)}px)` : 'none'
            } as CSSVars}
          >
            {piece.content ?? <img src={piece.src} alt={piece.alt ?? ''} loading="lazy" style={piece.style} />}
          </div>
        );
      })}
      {children && <div className="pointer-events-none absolute inset-0 z-50 grid place-items-center p-6 text-center *:pointer-events-auto">{children}</div>}
    </section>
  );
}
