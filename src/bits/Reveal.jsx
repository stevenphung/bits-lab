import { Children, useEffect, useInsertionEffect, useRef, useState } from 'react';

// Shows content as it arrives. Pick an entrance: "fade", "rise", "zoom", a stepped "wipe", or
// "blocks", where a grid of cover blocks winks out in a scattered order like an old game screen
// loading in. With `cascade`, each direct child takes its turn. Runs once when scrolled into
// view (or at mount), or every time it comes back with once={false}. Content is in the page
// from the start, so it's readable and findable; reduced motion shows it at once.

const STYLE_ID = 'bl-reveal';
const CSS = `
/* theme tokens */
.bl-reveal { --bl-cover: #0b0b14; }
:where(.light, [data-theme="light"]) .bl-reveal, .bl-reveal:where(.light, [data-theme="light"]) { --bl-cover: #f4f1e8; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-reveal, :where(.light, [data-theme="light"]) .bl-reveal:where(.dark, [data-theme="dark"]) { --bl-cover: #0b0b14; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-reveal, .bl-reveal:where([data-theme="system"]) { --bl-cover: #f4f1e8; } }
/* theme tokens end */
.bl-reveal { position: relative; }
.bl-reveal__part { display: block; transition: opacity var(--bl-dur) cubic-bezier(.2,.8,.2,1), transform var(--bl-dur) cubic-bezier(.2,.8,.2,1), clip-path var(--bl-dur) steps(var(--bl-steps)); transition-delay: calc(var(--bl-delay) + var(--i, 0) * var(--bl-stagger)); }
.bl-reveal:not([data-shown])[data-effect="fade"] .bl-reveal__part { opacity: 0; }
.bl-reveal:not([data-shown])[data-effect="rise"] .bl-reveal__part { opacity: 0; transform: translateY(var(--bl-distance)); }
.bl-reveal:not([data-shown])[data-effect="zoom"] .bl-reveal__part { opacity: 0; transform: scale(0.92); }
.bl-reveal:not([data-shown])[data-effect="wipe"] .bl-reveal__part { clip-path: inset(0 100% 0 0); }
.bl-reveal__cover { position: absolute; inset: 0; z-index: 1; display: grid; grid-template-columns: repeat(var(--bl-cols), 1fr); grid-template-rows: repeat(var(--bl-rows), 1fr); pointer-events: none; }
.bl-reveal__block { background: var(--bl-cover); transition: opacity 1ms linear; transition-delay: calc(var(--bl-delay) + var(--d) * var(--bl-dur)); }
.bl-reveal[data-shown] .bl-reveal__block { opacity: 0; }
@media (prefers-reduced-motion: reduce) { .bl-reveal .bl-reveal__part { opacity: 1 !important; transform: none !important; clip-path: none !important; transition: none !important; } .bl-reveal .bl-reveal__cover { display: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Scattered but repeatable order for the blocks (the same on server and client).
const scatter = i => {
  const x = Math.sin((i + 1) * 91.345) * 47453.13;
  return x - Math.floor(x);
};

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
  coverColor,
  onReveal,
  className = '',
  style
}) {
  useStyles();
  const rootRef = useRef(null);
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
    observer.observe(rootRef.current);
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
      className={`bl-reveal ${className}`}
      data-effect={effect}
      data-shown={shown || undefined}
      style={{ '--bl-dur': `${duration}ms`, '--bl-delay': `${delay}ms`, '--bl-stagger': `${stagger}ms`, '--bl-distance': `${distance}px`, '--bl-steps': steps, '--bl-cols': cols, '--bl-rows': rows, '--bl-cover': coverColor, ...style }}
    >
      {parts.map((part, i) => (
        <div key={i} className="bl-reveal__part" style={{ '--i': i }}>
          {part}
        </div>
      ))}
      {effect === 'blocks' && (
        <div className="bl-reveal__cover" aria-hidden="true">
          {Array.from({ length: cols * rows }, (_, i) => (
            <span key={i} className="bl-reveal__block" style={{ '--d': scatter(i).toFixed(3) }} />
          ))}
        </div>
      )}
    </Tag>
  );
}
