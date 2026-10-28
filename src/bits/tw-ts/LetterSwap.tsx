import { useInsertionEffect, type CSSProperties, type HTMLAttributes, type ElementType } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

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

const STYLE_ID = 'bl-letter-swap-tw';
const CSS = `
/* theme tokens */
.bl-swap { --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-swap, .bl-swap:where(.light, [data-theme="light"]) { --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-swap, :where(.light, [data-theme="light"]) .bl-swap:where(.dark, [data-theme="dark"]) { --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-swap, .bl-swap:where([data-theme="system"]) { --bl-accent: #167f8f; } }
/* theme tokens end */
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
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
  accentColor,
  className = '',
  style,
  ...rest
}: LetterSwapProps) {
  useStyles();
  const front = [...text];
  const back = [...(swapText ?? text)];
  const count = Math.max(front.length, back.length);
  const order = delays(count, from);
  const Tag = (href ? 'a' : as) as ElementType;

  return (
    <Tag
      className={`bl-swap group/swap relative inline-flex cursor-pointer flex-wrap border-0 bg-none p-0 [font:inherit] text-inherit no-underline perspective-[600px] focus-visible:rounded-[4px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--bl-accent) ${className}`}
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
