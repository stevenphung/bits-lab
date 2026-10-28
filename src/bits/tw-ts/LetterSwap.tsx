import { type CSSProperties, type HTMLAttributes, type ElementType } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Text whose letters roll over in 3D on hover: each letter is a tiny cube that turns to show
// its other face, one after another, so a wave runs through the word. The other face can
// repeat the word or show different text (an alternate label). Works on keyboard focus
// too, and screen readers hear the word once. Reduced motion swaps colour instead.

export interface LetterSwapProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  text?: string;
  /** The face that rolls into view; defaults to the same word. */
  swapText?: string;
  /** Element to render. */
  as?: ElementType;
  /** Makes it a link. */
  href?: string;
  /** Where the wave starts. */
  from?: 'start' | 'center' | 'end' | 'random';
  /** Delay between letters, in ms. */
  stagger?: number;
  duration?: number;
  /** Hold it rolled. */
  active?: boolean;
  altColor?: string;
  accentColor?: string;
}

// Delay order for each letter: from the start, the end, the center out, or shuffled.
function delays(count: number, from: string): number[] {
  if (from === 'end') return Array.from({ length: count }, (_, i) => count - 1 - i);
  if (from === 'center') return Array.from({ length: count }, (_, i) => Math.abs(i - (count - 1) / 2));
  if (from === 'random') {
    // A fixed shuffle per length, so it doesn't change between renders.
    return Array.from({ length: count }, (_, i) => ((i * 7 + 3) % count) * 0.8);
  }
  return Array.from({ length: count }, (_, i) => i);
}

export default function LetterSwap({
  text = 'Hover me',
  swapText,
  as = 'span',
  href,
  from = 'start',
  stagger = 30,
  duration = 500,
  active,
  altColor = 'currentColor',
  accentColor = '#73eff7',
  className = '',
  style,
  ...rest
}: LetterSwapProps) {
  
  const front = [...text];
  const back = [...(swapText ?? text)];
  const count = Math.max(front.length, back.length);
  const order = delays(count, from);
  const Tag = (href ? 'a' : as) as ElementType;

  return (
    <Tag
      className={`group/swap relative inline-flex cursor-pointer flex-wrap border-0 bg-none p-0 [font:inherit] text-inherit no-underline perspective-[600px] focus-visible:rounded-[4px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--bl-accent) ${className}`}
      href={href}
      data-active={active || undefined}
      style={{ '--bl-stagger': `${stagger}ms`, '--bl-dur': `${duration}ms`, '--bl-alt': altColor, '--bl-accent': accentColor, ...style } as CSSVars}
      {...rest}
    >
      {/* Screen readers get the word once; the letter cubes are decoration. */}
      <span className="sr-only">{text}</span>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="relative inline-block h-[1.15em] leading-[1.15em] [transition:transform_var(--bl-dur)_cubic-bezier(.3,1.15,.5,1)_calc(var(--d)*var(--bl-stagger))] transform-3d group-hover/swap:[transform:rotateX(90deg)] group-focus-visible/swap:[transform:rotateX(90deg)] group-data-[active]/swap:[transform:rotateX(90deg)] motion-reduce:[transition:color_200ms] motion-reduce:[transform:none]!" aria-hidden="true" style={{ '--d': order[i] } as CSSVars}>
          <span className="block whitespace-pre backface-hidden [transform:translateZ(0.575em)] motion-reduce:group-hover/swap:text-(--bl-alt) motion-reduce:group-focus-visible/swap:text-(--bl-alt) motion-reduce:group-data-[active]/swap:text-(--bl-alt)">{front[i] ?? ' '}</span>
          <span className="block whitespace-pre backface-hidden absolute inset-0 text-(--bl-alt) [transform:rotateX(-90deg)_translateZ(0.575em)] motion-reduce:hidden">{back[i] ?? ' '}</span>
        </span>
      ))}
    </Tag>
  );
}
