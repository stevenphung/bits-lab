import { useEffect, useInsertionEffect, useRef } from 'react';

// Hero product shot that enters tilted back in 3D and settles flat as it scrolls into view,
// scaling up and catching a sweep of light on the way. Scroll-linked (not time-based), so
// it scrubs both ways. Works with the window or any scroll box; flat under reduced motion.

const STYLE_ID = 'bl-scroll-tilt';
const CSS = `
.bl-tilt { --bl-p: 0; position: relative; perspective: var(--bl-perspective); }
.bl-tilt__card { position: relative; overflow: hidden; border-radius: var(--bl-radius); box-shadow: 0 0 0 var(--bl-border) var(--bl-edge), 0 calc(10px + var(--bl-p) * 40px) calc(30px + var(--bl-p) * 60px) -20px var(--bl-shadow); transform-origin: 50% 0; transform: rotateX(calc((1 - var(--bl-p)) * var(--bl-tilt))) scale(calc(var(--bl-scale) + (1 - var(--bl-scale)) * var(--bl-p))) translateY(calc((1 - var(--bl-p)) * var(--bl-lift))); will-change: transform; }
.bl-tilt__card > img, .bl-tilt__card > video { display: block; width: 100%; height: auto; }
.bl-tilt__shine { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(115deg, transparent 30%, var(--bl-shine) 48%, transparent 66%); background-size: 250% 100%; background-position: calc(100% - var(--bl-p) * 100%) 0; opacity: calc(1 - var(--bl-p) * 0.7); mix-blend-mode: screen; }
@media (prefers-reduced-motion: reduce) {
  .bl-tilt__card { transform: none; }
  .bl-tilt__shine { display: none; }
}
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

function scrollParent(node) {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) return el;
  }
  return window;
}

// Smoothstep: gentle at both ends, so the tilt reads clearly through the middle of the scroll.
const ease = t => t * t * (3 - 2 * t);

export default function ScrollTilt({
  children,
  tilt = 32,
  scale = 0.88,
  lift = 40,
  start = 1,
  end = 0.35,
  perspective = 1200,
  shine = true,
  radius = 16,
  borderWidth = 1,
  borderColor = 'rgba(255,255,255,0.12)',
  shineColor = 'rgba(255,255,255,0.35)',
  shadowColor = 'rgba(0,0,0,0.6)',
  className = '',
  style
}) {
  useStyles();
  const ref = useRef(null);

  useEffect(() => {
    const root = ref.current;
    const scroller = scrollParent(root);
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const viewTop = scroller === window ? 0 : scroller.getBoundingClientRect().top;
      const viewHeight = scroller === window ? window.innerHeight : scroller.clientHeight;
      // 0 when the card's top sits at `start` of the viewport height, 1 once it reaches `end`.
      const top = (rect.top - viewTop) / viewHeight;
      const raw = Math.min(1, Math.max(0, (start - top) / Math.max(0.01, start - end)));
      root.style.setProperty('--bl-p', ease(raw).toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [start, end]);

  return (
    <div
      ref={ref}
      className={`bl-tilt ${className}`}
      style={{
        '--bl-tilt': `${tilt}deg`,
        '--bl-scale': scale,
        '--bl-lift': `${lift}px`,
        '--bl-perspective': `${perspective}px`,
        '--bl-radius': `${radius}px`,
        '--bl-border': `${borderWidth}px`,
        '--bl-edge': borderColor,
        '--bl-shine': shineColor,
        '--bl-shadow': shadowColor,
        ...style
      }}
    >
      <div className="bl-tilt__card">
        {children}
        {shine && <div className="bl-tilt__shine" aria-hidden="true" />}
      </div>
    </div>
  );
}
