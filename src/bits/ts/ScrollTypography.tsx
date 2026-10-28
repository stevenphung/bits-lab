import { useEffect, useInsertionEffect, useRef, type CSSProperties, type ElementType } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Type that reacts to how fast you scroll. Words get heavier, stretch taller, lean with the
// scroll direction and shift toward the accent colour as the speed rises, then relax when
// you stop. Each word answers a moment after the one before it, so a flick sends a ripple
// through the line. Made for variable fonts (weight, and width if the font has it); works
// with the window or any scroll box. The text stays plain text; reduced motion keeps it still.

const STYLE_ID = 'bl-scroll-typography';
const CSS = `
/* theme tokens */
.bl-stype { --bl-ink: #f4f4f4; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-stype, .bl-stype:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-stype, :where(.light, [data-theme="light"]) .bl-stype:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-stype, .bl-stype:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-stype { margin: 0; font-family: var(--bl-font); font-size: var(--bl-size); line-height: 1.15; color: var(--bl-ink); text-wrap: balance; }
.bl-stype__word { --t: 0; --s: 0; display: inline-block; font-weight: calc(var(--bl-wmin) + var(--t) * (var(--bl-wmax) - var(--bl-wmin))); font-stretch: calc(100% + var(--t) * var(--bl-wdth)); color: color-mix(in srgb, var(--bl-accent) calc(var(--t) * 100%), var(--bl-ink)); transform: skewX(calc(var(--s) * var(--bl-skew))) scaleY(calc(1 + var(--t) * var(--bl-stretch))); transform-origin: 50% 100%; will-change: transform; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// The element that actually scrolls this one: the nearest scrollable ancestor, or the page.
function scrollerOf(node: HTMLElement): HTMLElement | Window {
  for (let el = node.parentElement; el && el !== document.body; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (/(auto|scroll|overlay)/.test(overflowY) && el.scrollHeight > el.clientHeight) return el;
  }
  return window;
}

export interface ScrollTypographyProps {
  /** Plain text, split into words. */
  text?: string;
  as?: ElementType;
  /** Scroll speed (px/s) that gives the full effect. */
  sensitivity?: number;
  minWeight?: number;
  maxWeight?: number;
  /** Vertical stretch at full speed (0.25 = 25% taller). */
  stretch?: number;
  /** How much wider fast words get, in %, if the font has a width axis. */
  widthRange?: number;
  /** Lean in degrees at full speed; follows the scroll direction. */
  skew?: number;
  /** Delay per word in ms, which makes the ripple. */
  stagger?: number;
  fontSize?: number | string;
  textColor?: string;
  /** Colour at full speed. */
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function ScrollTypography({
  text = '',
  as: Tag = 'p',
  sensitivity = 2400,
  minWeight = 300,
  maxWeight = 900,
  stretch = 0.25,
  widthRange = 0,
  skew = 10,
  stagger = 35,
  fontSize = 56,
  textColor,
  accentColor,
  fontFamily = '"Roboto Flex", ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: ScrollTypographyProps) {
  useStyles();
  const rootRef = useRef<HTMLElement>(null);
  const words = text.split(/\s+/).filter(Boolean);

  useEffect(() => {
    const root = rootRef.current!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;
    const nodes = [...root.querySelectorAll<HTMLElement>('.bl-stype__word')];
    const scroller = scrollerOf(root);
    const position = () => (scroller === window ? window.scrollY : (scroller as HTMLElement).scrollTop);
    // Recent smoothed velocities with timestamps, so each word can read a slightly older one.
    const history: { t: number; v: number }[] = [];
    let lastY = position();
    let smooth = 0;
    let visible = true;
    let raf = 0;
    let last = 0;

    const at = (time: number) => {
      for (let i = history.length - 1; i >= 0; i--) if (history[i].t <= time) return history[i].v;
      return history.length ? history[0].v : 0;
    };

    const tick = (now: number) => {
      const dt = Math.max(0.001, Math.min(0.05, (now - last) / 1000));
      last = now;
      const y = position();
      const raw = Math.max(-1, Math.min(1, (y - lastY) / dt / sensitivity));
      lastY = y;
      smooth += (raw - smooth) * (1 - Math.exp(-dt * 9));
      history.push({ t: now, v: smooth });
      while (history.length > 2 && now - history[0].t > stagger * nodes.length + 200) history.shift();
      let active = Math.abs(smooth) > 0.002;
      nodes.forEach((node, i) => {
        const v = at(now - i * stagger);
        if (Math.abs(v) > 0.002) active = true;
        node.style.setProperty('--t', Math.abs(v).toFixed(3));
        node.style.setProperty('--s', v.toFixed(3));
      });
      if (active) raf = requestAnimationFrame(tick);
      else {
        raf = 0;
        smooth = 0;
        history.length = 0;
        nodes.forEach(node => {
          node.style.setProperty('--t', '0');
          node.style.setProperty('--s', '0');
        });
      }
    };
    const onScroll = () => {
      if (raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      lastY = position();
    });
    observer.observe(root);
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      scroller.removeEventListener('scroll', onScroll);
      nodes.forEach(node => {
        node.style.removeProperty('--t');
        node.style.removeProperty('--s');
      });
    };
  }, [text, sensitivity, stagger]);

  return (
    <Tag
      ref={rootRef}
      className={`bl-stype ${className}`}
      style={{ '--bl-size': typeof fontSize === 'number' ? `${fontSize}px` : fontSize, '--bl-wmin': minWeight, '--bl-wmax': maxWeight, '--bl-stretch': stretch, '--bl-wdth': `${widthRange}%`, '--bl-skew': `${-skew}deg`, '--bl-ink': textColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      {words.map((word, i) => (
        <span key={i}>
          <span className="bl-stype__word">{word}</span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </Tag>
  );
}
