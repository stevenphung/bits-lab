import { Children, useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Shows content as it arrives. Pick an entrance: "fade", "rise", "zoom", a stepped "wipe", or
// "blocks", where a grid of cover blocks winks out in a scattered order like an old game screen
// loading in. With `cascade`, each direct child takes its turn. Runs once when scrolled into
// view (or at mount), or every time it comes back with once={false}. Content is in the page
// from the start, so it's readable and findable; reduced motion shows it at once.

// Scattered but repeatable order for the blocks (the same on server and client).
const scatter = (i: number) => {
  const x = Math.sin((i + 1) * 91.345) * 47453.13;
  return x - Math.floor(x);
};

export interface RevealProps {
  children?: ReactNode;
  as?: ElementType;
  /** The entrance; blocks dissolves a grid of cover blocks in a scattered order. */
  effect?: 'fade' | 'rise' | 'zoom' | 'wipe' | 'blocks';
  /** Reveal each direct child in turn. */
  cascade?: boolean;
  trigger?: 'view' | 'mount';
  /** false hides it again when scrolled away. */
  once?: boolean;
  threshold?: number;
  /** In ms. */
  duration?: number;
  delay?: number;
  /** Delay between cascading children, in ms. */
  stagger?: number;
  /** Rise distance in px. */
  distance?: number;
  /** How many steps the wipe takes. */
  steps?: number;
  /** The blocks grid, [columns, rows]. */
  blocks?: [number, number];
  /** Block colour: match the background behind the content. */
  coverColor?: string;
  onReveal?: () => void;
  className?: string;
  style?: CSSProperties;
}

export default function Reveal({
  children,
  as: Tag = 'div',
  effect = 'rise',
  cascade = false,
  trigger = 'view',
  once = true,
  threshold = 0.2,
  duration = 600,
  delay = 0,
  stagger = 90,
  distance = 24,
  steps = 8,
  blocks = [8, 5],
  coverColor = '#0b0b14',
  onReveal,
  className = '',
  style
}: RevealProps) {
  
  const rootRef = useRef<HTMLElement>(null);
  const revealRef = useRef(onReveal);
  revealRef.current = onReveal;
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (trigger === 'mount') {
      // Let the hidden state paint first, so the entrance actually runs.
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(id);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          if (once) observer.disconnect();
        } else if (!once) setShown(false);
      },
      { threshold }
    );
    observer.observe(rootRef.current!);
    return () => observer.disconnect();
  }, [trigger, once, threshold]);

  useEffect(() => {
    if (shown) revealRef.current?.();
  }, [shown]);

  const parts = cascade ? Children.toArray(children) : [children];
  const [cols, rows] = blocks;
  return (
    <Tag
      ref={rootRef}
      className={`group/rev relative ${className}`}
      data-effect={effect}
      data-shown={shown || undefined}
      style={{ '--bl-dur': `${duration}ms`, '--bl-delay': `${delay}ms`, '--bl-stagger': `${stagger}ms`, '--bl-distance': `${distance}px`, '--bl-steps': steps, '--bl-cols': cols, '--bl-rows': rows, '--bl-cover': coverColor, ...style } as CSSVars}
    >
      {parts.map((part, i) => (
        <div key={i} className="block [transition:opacity_var(--bl-dur)_cubic-bezier(.2,.8,.2,1)_calc(var(--bl-delay)_+_var(--i,0)_*_var(--bl-stagger)),transform_var(--bl-dur)_cubic-bezier(.2,.8,.2,1)_calc(var(--bl-delay)_+_var(--i,0)_*_var(--bl-stagger)),clip-path_var(--bl-dur)_steps(var(--bl-steps))_calc(var(--bl-delay)_+_var(--i,0)_*_var(--bl-stagger))] group-[:not([data-shown])[data-effect=fade]]/rev:opacity-0 group-[:not([data-shown])[data-effect=rise]]/rev:opacity-0 group-[:not([data-shown])[data-effect=rise]]/rev:[transform:translateY(var(--bl-distance))] group-[:not([data-shown])[data-effect=zoom]]/rev:opacity-0 group-[:not([data-shown])[data-effect=zoom]]/rev:[transform:scale(0.92)] group-[:not([data-shown])[data-effect=wipe]]/rev:[clip-path:inset(0_100%_0_0)] motion-reduce:opacity-100! motion-reduce:[clip-path:none]! motion-reduce:[transform:none]! motion-reduce:[transition:none]!" style={{ '--i': i } as CSSVars}>
          {part}
        </div>
      ))}
      {effect === 'blocks' && (
        <div className="pointer-events-none absolute inset-0 z-1 grid grid-cols-[repeat(var(--bl-cols),1fr)] grid-rows-[repeat(var(--bl-rows),1fr)] motion-reduce:hidden" aria-hidden="true">
          {Array.from({ length: cols * rows }, (_, i) => (
            <span key={i} className="bg-(--bl-cover) [transition:opacity_1ms_linear_calc(var(--bl-delay)_+_var(--d)_*_var(--bl-dur))] group-data-[shown]/rev:opacity-0" style={{ '--d': scatter(i).toFixed(3) } as CSSVars} />
          ))}
        </div>
      )}
    </Tag>
  );
}
