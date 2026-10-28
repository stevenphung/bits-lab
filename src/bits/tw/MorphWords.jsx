import { useEffect, useId, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Words that melt into each other. During each change the old word blurs out while the new
// one sharpens in, and an SVG alpha-threshold filter fuses the two blurry shapes into one
// gooey blob. The box is sized to the widest word, so nothing around it shifts. Pauses
// off-screen; under reduced motion words simply swap.

export default function MorphWords({
  words = ['pixels', 'worlds', 'quests', 'magic'],
  interval = 1800,
  morphTime = 900,
  align = 'center',
  announce = false,
  color,
  className = '',
  style
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const rootRef = useRef(null);
  const fromRef = useRef(null);
  const toRef = useRef(null);
  const stageRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches));
  }, []);

  useEffect(() => {
    if (words.length < 2) return undefined;
    const from = fromRef.current;
    const to = toRef.current;
    const stage = stageRef.current;
    let frame = 0;
    let timer = 0;
    let visible = true;
    let current = 0;

    // Opacity rises steeply while blur falls off as 1/t, so the shapes overlap and fuse mid-way.
    const paint = t => {
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
      const step = now => {
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
    observer.observe(rootRef.current);
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
      className={`relative inline-grid align-bottom text-(--bl-ink) ${className}`}
      style={{ '--bl-align': align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center', ...(color ? { '--bl-ink': color } : { '--bl-ink': 'currentColor' }), ...style }}
    >
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <defs>
          <filter id={`${uid}-goo`}>
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140" />
          </filter>
        </defs>
      </svg>
      <span className="invisible grid [grid-area:1/1] *:[grid-area:1/1] *:whitespace-nowrap" aria-hidden="true">
        {words.map(word => (
          <span key={word}>{word}</span>
        ))}
      </span>
      <span ref={stageRef} className="relative [grid-area:1/1]" aria-hidden="true">
        <span ref={fromRef} className="absolute inset-0 flex items-center [justify-content:var(--bl-align)] whitespace-nowrap select-none">
          {words[0]}
        </span>
        <span ref={toRef} className="absolute inset-0 flex items-center [justify-content:var(--bl-align)] whitespace-nowrap select-none" style={{ opacity: 0 }} />
      </span>
      <span className="sr-only" aria-live={announce ? 'polite' : undefined}>
        {words[index] ?? ''}
      </span>
    </span>
  );
}
