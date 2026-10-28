import { useEffect, useInsertionEffect, useRef } from 'react';

// A headline whose letters breathe. Each letter's weight (and width, if the font has that
// axis) swells and relaxes in a wave that rolls along the line. Three drivers: "breathe"
// loops on its own, "beat" sends a pulse down the line on every beat of a tempo, and
// "scroll" sweeps a bold spotlight across the letters as the headline passes through the
// viewport. Screen readers get the plain text once; it pauses off-screen, and reduced
// motion shows the text at a steady middle weight.

const STYLE_ID = 'bl-kinetic-headline';
const CSS = `
/* theme tokens */
.bl-kinetic { --bl-ink: #f4f4f4; --bl-accent: #ffcd75; }
:where(.light, [data-theme="light"]) .bl-kinetic, .bl-kinetic:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-accent: #a86a12; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-kinetic, :where(.light, [data-theme="light"]) .bl-kinetic:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-accent: #ffcd75; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-kinetic, .bl-kinetic:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-accent: #a86a12; } }
/* theme tokens end */
.bl-kinetic { margin: 0; font-family: var(--bl-font); font-size: var(--bl-size); line-height: 1.05; color: var(--bl-ink); letter-spacing: -0.01em; }
.bl-kinetic__letter { --k: 0.5; display: inline-block; white-space: pre; font-weight: calc(var(--bl-wmin) + var(--k) * (var(--bl-wmax) - var(--bl-wmin))); font-stretch: calc(var(--bl-dmin) + var(--k) * (var(--bl-dmax) - var(--bl-dmin))); color: color-mix(in srgb, var(--bl-accent) calc(var(--k) * var(--bl-tint)), var(--bl-ink)); }
.bl-kinetic__word { display: inline-block; white-space: nowrap; }
.bl-kinetic__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
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
  textColor,
  accentColor,
  fontFamily = '"Roboto Flex", ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const rootRef = useRef(null);
  const words = text.split(/(\s+)/).filter(Boolean);

  useEffect(() => {
    const root = rootRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const letters = [...root.querySelectorAll('.bl-kinetic__letter')];
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
    const level = (i, p) => {
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

    const tick = now => {
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
      className={`bl-kinetic ${className}`}
      style={{ '--bl-size': typeof fontSize === 'number' ? `${fontSize}px` : fontSize, '--bl-wmin': minWeight, '--bl-wmax': maxWeight, '--bl-dmin': `${minWidth}%`, '--bl-dmax': `${maxWidth}%`, '--bl-tint': `${tint * 100}%`, '--bl-ink': textColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      <span className="bl-kinetic__sr">{text}</span>
      <span aria-hidden="true">
        {words.map((word, w) =>
          /^\s+$/.test(word) ? (
            ' '
          ) : (
            // Letters of a word stay together so the line only breaks between words.
            <span key={w} className="bl-kinetic__word">
              {[...word].map(char => (
                <span key={index++} className="bl-kinetic__letter">
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
