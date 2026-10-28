import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Words that melt into each other. During each change the old word blurs out while the new
// one sharpens in, and an SVG alpha-threshold filter fuses the two blurry shapes into one
// gooey blob. The box is sized to the widest word, so nothing around it shifts. Pauses
// off-screen; under reduced motion words simply swap.

const STYLE_ID = 'bl-morph-words';
const CSS = `
.bl-morph { position: relative; display: inline-grid; vertical-align: bottom; color: var(--bl-ink); }
.bl-morph__sizer, .bl-morph__stage { grid-area: 1 / 1; }
.bl-morph__sizer { display: grid; visibility: hidden; }
.bl-morph__sizer > span { grid-area: 1 / 1; white-space: nowrap; }
.bl-morph__stage { position: relative; }
.bl-morph__word { position: absolute; inset: 0; display: flex; align-items: center; justify-content: var(--bl-align); white-space: nowrap; user-select: none; }
.bl-morph__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface MorphWordsProps {
  /** Words to cycle through; the box sizes to the widest. */
  words?: string[];
  /** How long each word holds, in ms. */
  interval?: number;
  /** Morph length, in ms. */
  morphTime?: number;
  /** Alignment of shorter words inside the box. */
  align?: 'center' | 'start' | 'end';
  /** Announce each word to screen readers. */
  announce?: boolean;
  /** Text color (defaults to the inherited color). */
  color?: string;
  className?: string;
  style?: CSSProperties;
}

export default function MorphWords({
  words = ['pixels', 'worlds', 'quests', 'magic'],
  interval = 1800,
  morphTime = 900,
  align = 'center',
  announce = false,
  color,
  className = '',
  style
}: MorphWordsProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const rootRef = useRef<HTMLSpanElement>(null);
  const fromRef = useRef<HTMLSpanElement>(null);
  const toRef = useRef<HTMLSpanElement>(null);
  const stageRef = useRef<HTMLSpanElement>(null);
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
  }, []);

  useEffect(() => {
    if (words.length < 2) return undefined;
    const from = fromRef.current!;
    const to = toRef.current!;
    const stage = stageRef.current!;
    let frame = 0;
    let timer = 0;
    let visible = true;
    let current = 0;

    // Opacity rises steeply while blur falls off as 1/t, so the shapes overlap and fuse mid-way.
    const paint = (t: number) => {
      const inT = Math.max(0.0001, t);
      const outT = Math.max(0.0001, 1 - t);
      to.style.filter = `blur(${Math.min(8 / inT - 8, 100)}px)`;
      to.style.opacity = `${Math.pow(inT, 0.4) * 100}%`;
      from.style.filter = `blur(${Math.min(8 / outT - 8, 100)}px)`;
      from.style.opacity = `${Math.pow(outT, 0.4) * 100}%`;
    };
    const rest = () => {
      // The threshold filter only runs mid-morph; at rest the text stays smoothly anti-aliased.
      stage.style.filter = '';
      from.style.filter = '';
      from.style.opacity = '100%';
      to.style.filter = '';
      to.style.opacity = '0%';
    };

    const morph = () => {
      const next = (current + 1) % words.length;
      from.textContent = words[current];
      to.textContent = words[next];
      if (reduced) {
        current = next;
        from.textContent = words[current];
        setIndex(current);
        timer = setTimeout(morph, interval);
        return;
      }
      stage.style.filter = `url(#${uid}-goo)`;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / morphTime);
        paint(t);
        if (t < 1) {
          frame = requestAnimationFrame(step);
          return;
        }
        current = next;
        from.textContent = words[current];
        rest();
        setIndex(current);
        if (visible) timer = setTimeout(morph, interval);
      };
      frame = requestAnimationFrame(step);
    };

    rest();
    from.textContent = words[0];
    const observer = new IntersectionObserver(([entry]) => {
      const was = visible;
      visible = entry.isIntersecting;
      if (visible && !was) timer = setTimeout(morph, interval);
      if (!visible) {
        clearTimeout(timer);
        cancelAnimationFrame(frame);
        rest();
        from.textContent = words[current];
      }
    });
    observer.observe(rootRef.current!);
    timer = setTimeout(morph, interval);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [words.join('|'), interval, morphTime, reduced, uid]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span
      ref={rootRef}
      className={`bl-morph ${className}`}
      style={{ '--bl-align': align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center', ...(color ? { '--bl-ink': color } : { '--bl-ink': 'currentColor' }), ...style } as CSSVars}
    >
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
        <defs>
          <filter id={`${uid}-goo`}>
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140" />
          </filter>
        </defs>
      </svg>
      <span className="bl-morph__sizer" aria-hidden="true">
        {words.map(word => (
          <span key={word}>{word}</span>
        ))}
      </span>
      <span ref={stageRef} className="bl-morph__stage" aria-hidden="true">
        <span ref={fromRef} className="bl-morph__word">
          {words[0]}
        </span>
        <span ref={toRef} className="bl-morph__word" style={{ opacity: 0 }} />
      </span>
      <span className="bl-morph__sr" aria-live={announce ? 'polite' : undefined}>
        {words[index] ?? ''}
      </span>
    </span>
  );
}
