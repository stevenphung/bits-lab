import { useRef, useState, type CSSProperties, type ReactNode, type HTMLAttributes, type PointerEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A card whose overlay slides in from the side the pointer entered, and leaves toward the
// side it exited, so moving across a grid feels like the overlay follows you. Keyboard focus
// brings the overlay up from the bottom. The overlay is ordinary content (titles, links),
// readable and focusable at all times.

type Side = 'top' | 'right' | 'bottom' | 'left';

export interface DirectionHoverProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The card's base (an image, usually). */
  children?: ReactNode;
  /** Slides in from the edge the pointer entered. */
  overlay?: ReactNode;
  duration?: number;
  /** How much the base zooms while open. */
  zoom?: number;
  radius?: number;
  overlayColor?: string;
  textColor?: string;
  accentColor?: string;
}

const OFFSETS: Record<Side, [string, string]> = { top: ['0', '-100%'], right: ['100%', '0'], bottom: ['0', '100%'], left: ['-100%', '0'] };

// Which edge a point is nearest to, correcting for the card's aspect ratio.
function edgeOf(rect: DOMRect, x: number, y: number): Side {
  const dx = (x - rect.left - rect.width / 2) / (rect.width / 2);
  const dy = (y - rect.top - rect.height / 2) / (rect.height / 2);
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'bottom' : 'top';
}

export default function DirectionHover({
  children,
  overlay,
  duration = 320,
  zoom = 1.06,
  radius = 14,
  overlayColor = 'linear-gradient(to top, rgba(11,11,20,0.92), rgba(11,11,20,0.55))',
  textColor = '#f4f4f4',
  accentColor = '#73eff7',
  className = '',
  style,
  ...rest
}: DirectionHoverProps) {
  
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState<Side>('bottom');
  const [instant, setInstant] = useState(false);

  // Park the overlay on the entry side without animating, then slide it in.
  const enter = (event: PointerEvent<HTMLDivElement>) => {
    const side = edgeOf(ref.current!.getBoundingClientRect(), event.clientX, event.clientY);
    setInstant(true);
    setFrom(side);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setInstant(false);
        setOpen(true);
      })
    );
  };
  const leave = (event: PointerEvent<HTMLDivElement>) => {
    setFrom(edgeOf(ref.current!.getBoundingClientRect(), event.clientX, event.clientY));
    setOpen(false);
  };

  const [x, y] = OFFSETS[from];

  return (
    <div
      ref={ref}
      className={`group/dh relative isolate overflow-hidden rounded-(--bl-radius) outline-none focus-visible:shadow-[0_0_0_3px_var(--bl-accent)] ${className}`}
      data-open={open || undefined}
      data-instant={instant || undefined}
      onPointerEnter={event => event.pointerType === 'mouse' && enter(event)}
      onPointerLeave={event => event.pointerType === 'mouse' && leave(event)}
      onFocus={() => {
        setFrom('bottom');
        setOpen(true);
      }}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
      style={{ '--bl-x': x, '--bl-y': y, '--bl-dur': `${duration}ms`, '--bl-zoom': zoom, '--bl-radius': `${radius}px`, '--bl-overlay': overlayColor, '--bl-ink': textColor, '--bl-accent': accentColor, ...style } as CSSVars}
      {...rest}
    >
      <div className="block [transition:transform_var(--bl-dur)_cubic-bezier(.2,.9,.25,1)] group-data-[open]/dh:[transform:scale(var(--bl-zoom))] motion-reduce:[transition:none]">{children}</div>
      <div className="absolute inset-0 z-1 box-border flex flex-col justify-end [background:var(--bl-overlay)] p-4 text-(--bl-ink) [transform:translate(var(--bl-x,0),var(--bl-y,100%))] [transition:transform_var(--bl-dur)_cubic-bezier(.2,.9,.25,1)] group-data-[open]/dh:[transform:translate(0,0)] group-data-[instant]/dh:[transition:none] motion-reduce:opacity-0 motion-reduce:[transform:none] motion-reduce:[transition:opacity_150ms] motion-reduce:group-data-[open]/dh:opacity-100 motion-reduce:group-data-[open]/dh:[transform:none]">{overlay}</div>
    </div>
  );
}
