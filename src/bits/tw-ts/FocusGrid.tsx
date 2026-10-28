import { Children, type CSSProperties, type ReactNode, type ReactElement } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A grid that spotlights one card at a time: hovering or focusing a card lifts it a touch,
// and every other card blurs, dims and shrinks back. Pure CSS (no measuring), so it costs
// nothing at rest. Children become the cards; layout is a responsive auto-fill grid.

export interface FocusGridProps {
  /** Each child becomes a card. */
  children?: ReactNode;
  /** Auto-fill column width in px. */
  minWidth?: number;
  gap?: number;
  /** Blur on the other cards, in px. */
  blur?: number;
  /** Opacity of the other cards. */
  dim?: number;
  shrink?: number;
  lift?: number;
  duration?: number;
  radius?: number;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export default function FocusGrid({ children, minWidth = 220, gap = 16, blur = 4, dim = 0.45, shrink = 0.97, lift = 1.02, duration = 300, radius = 14, label, className = '', style }: FocusGridProps) {
  
  return (
    <ul
      className={`group/focus m-0 grid w-full list-none grid-cols-[repeat(auto-fill,minmax(min(var(--bl-min),100%),1fr))] gap-(--bl-gap) p-0 ${className}`}
      aria-label={label}
      style={{
        '--bl-min': `${minWidth}px`,
        '--bl-gap': `${gap}px`,
        '--bl-blur': `${blur}px`,
        '--bl-dim': dim,
        '--bl-shrink': shrink,
        '--bl-lift': lift,
        '--bl-dur': `${duration}ms`,
        '--bl-radius': `${radius}px`,
        ...style
      } as CSSVars}
    >
      {Children.toArray(children).map((child, i) => (
        <li key={(child as ReactElement)?.key ?? i} className="relative min-w-0 rounded-(--bl-radius) [transition:filter_var(--bl-dur)_ease,opacity_var(--bl-dur)_ease,transform_var(--bl-dur)_cubic-bezier(.2,.9,.25,1)] focus-within:z-1 focus-within:[transform:scale(var(--bl-lift))] hover:z-1 hover:[transform:scale(var(--bl-lift))] group-has-[>li:is(:hover,:focus-within)]/focus:not-[:is(:hover,:focus-within)]:opacity-(--bl-dim) group-has-[>li:is(:hover,:focus-within)]/focus:not-[:is(:hover,:focus-within)]:[filter:blur(var(--bl-blur))_saturate(0.6)] group-has-[>li:is(:hover,:focus-within)]/focus:not-[:is(:hover,:focus-within)]:[transform:scale(var(--bl-shrink))] motion-reduce:[transition:opacity_150ms] motion-reduce:focus-within:[transform:none] motion-reduce:hover:[transform:none] motion-reduce:group-has-[>li:is(:hover,:focus-within)]/focus:not-[:is(:hover,:focus-within)]:[filter:none] motion-reduce:group-has-[>li:is(:hover,:focus-within)]/focus:not-[:is(:hover,:focus-within)]:[transform:none]">
          {child}
        </li>
      ))}
    </ul>
  );
}
