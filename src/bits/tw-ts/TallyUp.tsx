import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A number that climbs to its value while a bar of pixel blocks fills toward a goal. Milestone
// notches flash as the count passes them, and the "arcade" curve counts in chunky steps with a
// bump on each one, like a score tallying up. Starts when it scrolls into view (or at mount).
// Screen readers get the final figure once; reduced motion shows it straight away.

const STYLE_ID = 'bl-tally-up-tw';
const CSS = `
@keyframes bl-tally-bump { 50% { transform: translateY(-3px); } }
@keyframes bl-tally-flash { 33% { background: var(--bl-accent); } }
@keyframes bl-tally-notch { 50% { transform: scaleY(1.6); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface TallyUpProps {
  /** Where the count ends. */
  value?: number;
  /** The bar fills toward this; defaults to value. */
  goal?: number;
  start?: number;
  /** In ms. */
  duration?: number;
  /** A smooth ease-out, or an arcade count in chunky steps. */
  curve?: 'ease' | 'steps';
  steps?: number;
  /** Pixel blocks in the bar. */
  blocks?: number;
  /** Notches that flash as the count passes them. */
  milestones?: number[];
  trigger?: 'view' | 'mount';
  locale?: string;
  format?: Intl.NumberFormatOptions;
  unit?: string;
  caption?: string;
  /** Show "of {goal}" under the bar (when goal is set). */
  showGoal?: boolean;
  onReach?: (value: number) => void;
  width?: number;
  fontSize?: number;
  barHeight?: number;
  gap?: number;
  textColor?: string;
  mutedColor?: string;
  trackColor?: string;
  fillColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function TallyUp({
  value = 0,
  goal,
  start = 0,
  duration = 1600,
  curve = 'ease',
  steps = 12,
  blocks = 20,
  milestones = [],
  trigger = 'view',
  locale,
  format,
  unit = '',
  caption = '',
  showGoal = true,
  onReach,
  width = 420,
  fontSize = 48,
  barHeight = 14,
  gap = 3,
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  trackColor = '#262b44',
  fillColor = '#38b764',
  accentColor = '#ffcd75',
  fontFamily = 'inherit',
  className = '',
  style
}: TallyUpProps) {
  useStyles();
  const rootRef = useRef<HTMLDivElement>(null);
  const figureRef = useRef<HTMLSpanElement>(null);
  const reachRef = useRef(onReach);
  reachRef.current = onReach;
  const [shown, setShown] = useState(start);
  const [done, setDone] = useState(false);
  const target = goal ?? value;
  const fmt = new Intl.NumberFormat(locale, format);

  useEffect(() => {
    const root = rootRef.current!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let begun = 0;
    let lastStep = -1;
    setDone(false);

    const finish = () => {
      setShown(value);
      setDone(true);
      reachRef.current?.(value);
    };
    const tick = (now: number) => {
      if (!begun) begun = now;
      const t = Math.min(1, (now - begun) / duration);
      let k: number;
      if (curve === 'steps') {
        // Chunky arcade count: jump in equal steps, bumping the figure on each one.
        const step = Math.min(steps, Math.floor(t * steps + 1e-9));
        k = step / steps;
        if (step !== lastStep) {
          lastStep = step;
          const figure = figureRef.current;
          if (figure && step > 0) {
            delete figure.dataset.bump;
            void figure.offsetWidth;
            figure.dataset.bump = '';
          }
        }
      } else k = 1 - Math.pow(1 - t, 3);
      setShown(start + (value - start) * k);
      if (t < 1) raf = requestAnimationFrame(tick);
      else finish();
    };
    const run = () => {
      if (reduced) finish();
      else raf = requestAnimationFrame(tick);
    };

    if (trigger === 'mount') {
      run();
      return () => cancelAnimationFrame(raf);
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      run();
    }, { threshold: 0.4 });
    observer.observe(root);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value, start, duration, curve, steps, trigger]);

  // Round to the precision the formatter shows, so the figure doesn't jitter with decimals.
  const decimals = format?.maximumFractionDigits ?? format?.minimumFractionDigits ?? 0;
  const display = fmt.format(Number(shown.toFixed(decimals)));
  const share = target ? Math.max(0, Math.min(1, shown / target)) : 0;
  const lit = Math.round(share * blocks);

  return (
    <div
      ref={rootRef}
      className={`grid w-full max-w-(--bl-w) gap-2.5 font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      style={{ '--bl-w': `${width}px`, '--bl-size': `${fontSize}px`, '--bl-bar-h': `${barHeight}px`, '--bl-gap': `${gap}px`, '--bl-blocks': blocks, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-track': trackColor, '--bl-fill': fillColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <div className="flex items-baseline justify-between gap-3" aria-hidden="true">
        <span ref={figureRef} className="inline-flex items-baseline gap-1.5 text-(length:--bl-size) leading-none font-bold tabular-nums data-[bump]:animate-[bl-tally-bump_160ms_steps(2)] motion-reduce:data-[bump]:animate-none">
          {display}
          {unit && <span className="text-[0.45em] font-semibold text-(--bl-muted)">{unit}</span>}
        </span>
        {caption && <span className="text-[14px] text-(--bl-muted)">{caption}</span>}
      </div>
      <div className="group/bar relative grid h-(--bl-bar-h) grid-cols-[repeat(var(--bl-blocks),minmax(0,1fr))] gap-(--bl-gap)" data-done={done || undefined} aria-hidden="true">
        {Array.from({ length: blocks }, (_, i) => (
          <span key={i} className="bg-(--bl-track) [transition:background-color_120ms_steps(1)] data-[on]:bg-(--bl-fill) data-[on]:shadow-[inset_0_-3px_0_rgba(0,0,0,0.25)] group-data-[done]/bar:data-[on]:animate-[bl-tally-flash_600ms_steps(3)] motion-reduce:[transition:none] motion-reduce:group-data-[done]/bar:data-[on]:animate-none" data-on={i < lit || undefined} />
        ))}
        {target > 0 &&
          milestones
            .filter(m => m > 0 && m < target)
            .map(m => <span key={m} className="absolute -top-[5px] -bottom-[5px] left-(--x) -ml-px w-0.5 bg-(--bl-muted) opacity-60 data-[passed]:animate-[bl-tally-notch_500ms_steps(4)] data-[passed]:bg-(--bl-accent) data-[passed]:opacity-100 motion-reduce:data-[passed]:animate-none" data-passed={shown >= m || undefined} style={{ '--x': `${(m / target) * 100}%` } as CSSVars} />)}
      </div>
      {showGoal && goal != null && (
        <span className="text-right text-[12px] text-(--bl-muted) tabular-nums" aria-hidden="true">
          of {fmt.format(goal)}
          {unit && ` ${unit}`}
        </span>
      )}
      <span className="sr-only" role="status">
        {done ? `${caption ? `${caption}: ` : ''}${fmt.format(value)}${unit ? ` ${unit}` : ''}${goal != null ? ` of ${fmt.format(goal)}` : ''}` : ''}
      </span>
    </div>
  );
}
