import { useEffect, useRef, type CSSProperties, type ElementType } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A headline whose letters breathe. Each letter's weight (and width, if the font has that
// axis) swells and relaxes in a wave that rolls along the line. Three drivers: "breathe"
// loops on its own, "beat" sends a pulse down the line on every beat of a tempo, and
// "scroll" sweeps a bold spotlight across the letters as the headline passes through the
// viewport. Screen readers get the plain text once; it pauses off-screen, and reduced
// motion shows the text at a steady middle weight.

export interface KineticHeadlineProps {
  /** The headline; screen readers get it once as plain text. */
  text?: string;
  as?: ElementType;
  /** A rolling wave, a pulse on every beat, or a spotlight driven by scroll position. */
  mode?: 'breathe' | 'beat' | 'scroll';
  /** Breathe: cycles per second. */
  speed?: number;
  /** Breathe: letters per wave. */
  wavelength?: number;
  /** Beat: tempo. */
  bpm?: number;
  /** Beat and scroll: pulse width in letters. */
  spread?: number;
  minWeight?: number;
  maxWeight?: number;
  /** Width axis range in % (needs a font with wdth, e.g. Roboto Flex). */
  minWidth?: number;
  maxWidth?: number;
  /** How far heavy letters shift toward the accent (0–1). */
  tint?: number;
  fontSize?: number | string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function KineticHeadline({
  text = '',
  as: Tag = 'h2',
  mode = 'breathe',
  speed = 0.5,
  wavelength = 8,
  bpm = 100,
  spread = 3,
  minWeight = 200,
  maxWeight = 900,
  minWidth = 100,
  maxWidth = 100,
  tint = 0,
  fontSize = 72,
  textColor = '#f4f4f4',
  accentColor = '#ffcd75',
  fontFamily = '"Roboto Flex", ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: KineticHeadlineProps) {
  
  const rootRef = useRef<HTMLElement>(null);
  const words = text.split(/(\s+)/).filter(Boolean);

  useEffect(() => {
    const root = rootRef.current!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const letters = [...root.querySelectorAll<HTMLElement>('.bl-kinetic__letter')];
    const n = letters.length;
    if (reduced || !n) return undefined;
    let visible = true;
    let raf = 0;
    let clock = 0;
    let last = 0;

    // Scroll mode: 0 as the headline enters at the bottom, 1 as it leaves at the top.
    const progress = () => {
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      return Math.max(0, Math.min(1, (vh - rect.top) / (vh + rect.height)));
    };
    const level = (i: number, p: number) => {
      if (mode === 'scroll') {
        const x = p * (n + spread * 4) - spread * 2;
        return Math.exp(-((x - i) ** 2) / (2 * spread * spread));
      }
      if (mode === 'beat') {
        // A pulse runs down the line each beat, over a soft breathing floor.
        const beat = 60 / bpm;
        const head = ((clock % beat) / beat) * (n + spread * 4) - spread * 2;
        return 0.15 + 0.85 * Math.exp(-((head - i) ** 2) / (2 * spread * spread));
      }
      return (Math.sin(2 * Math.PI * (clock * speed - i / wavelength)) + 1) / 2;
    };
    const paint = () => {
      const p = mode === 'scroll' ? progress() : 0;
      letters.forEach((node, i) => node.style.setProperty('--k', level(i, p).toFixed(3)));
    };

    const tick = (now: number) => {
      clock += Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      paint();
      raf = mode === 'scroll' ? 0 : requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    observer.observe(root);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    // Scroll mode only repaints when something scrolls; capture catches inner scroll boxes too.
    const onScroll = () => start();
    if (mode === 'scroll') {
      window.addEventListener('scroll', onScroll, { passive: true, capture: true });
      window.addEventListener('resize', onScroll);
    }
    paint();
    start();
    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
      letters.forEach(node => node.style.removeProperty('--k'));
    };
  }, [text, mode, speed, wavelength, bpm, spread]);

  let index = 0;
  return (
    <Tag
      ref={rootRef}
      className={`m-0 font-(family-name:--bl-font) text-(length:--bl-size) leading-[1.05] tracking-[-0.01em] text-(--bl-ink) ${className}`}
      style={{ '--bl-size': typeof fontSize === 'number' ? `${fontSize}px` : fontSize, '--bl-wmin': minWeight, '--bl-wmax': maxWeight, '--bl-dmin': `${minWidth}%`, '--bl-dmax': `${maxWidth}%`, '--bl-tint': `${tint * 100}%`, '--bl-ink': textColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, w) =>
          /^\s+$/.test(word) ? (
            ' '
          ) : (
            // Letters of a word stay together so the line only breaks between words.
            <span key={w} className="inline-block whitespace-nowrap">
              {[...word].map(char => (
                <span key={index++} className="bl-kinetic__letter inline-block whitespace-pre [--k:0.5] [font-weight:calc(var(--bl-wmin)_+_var(--k)_*_(var(--bl-wmax)_-_var(--bl-wmin)))] [font-stretch:calc(var(--bl-dmin)_+_var(--k)_*_(var(--bl-dmax)_-_var(--bl-dmin)))] [color:color-mix(in_srgb,var(--bl-accent)_calc(var(--k)_*_var(--bl-tint)),var(--bl-ink))]">
                  {char}
                </span>
              ))}
            </span>
          )
        )}
      </span>
    </Tag>
  );
}
