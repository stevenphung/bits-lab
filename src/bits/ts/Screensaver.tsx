import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// The bouncing-logo screensaver. A logo drifts around the box and changes colour on every
// wall; hit a corner exactly and pixel confetti bursts out and the corner counter goes up.
// Use it always-on, or set idleAfter to have it fade in over your content after a spell of
// no input and vanish at the first touch, key or mouse move. Pauses off-screen and in hidden
// tabs; under reduced motion the logo sits still in the middle and changes colour slowly.

const STYLE_ID = 'bl-screensaver';
const CSS = `
.bl-saver { position: relative; box-sizing: border-box; width: 100%; height: var(--bl-h); overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-content-bg); box-shadow: 0 0 0 2px var(--bl-line); font-family: var(--bl-font); }
.bl-saver__content { height: 100%; }
.bl-saver__screen { position: absolute; inset: 0; overflow: hidden; background: var(--bl-bg); transition: opacity 600ms ease; }
.bl-saver[data-idle-mode]:not([data-idle]) .bl-saver__screen { opacity: 0; pointer-events: none; transition-duration: 150ms; }
.bl-saver__logo { position: absolute; top: 0; left: 0; display: grid; place-items: center; color: var(--bl-logo); font-size: var(--bl-logo-size); font-weight: 700; line-height: 1; white-space: nowrap; transition: color 120ms; will-change: transform; }
.bl-saver__logo svg, .bl-saver__logo img { display: block; }
.bl-saver__count { position: absolute; top: 10px; right: 12px; padding: 4px 8px; border-radius: 6px; background: rgba(0,0,0,0.45); color: var(--bl-ink); font-size: 12px; font-variant-numeric: tabular-nums; }
.bl-saver__count[data-pop] { animation: bl-saver-pop 500ms steps(5); }
.bl-saver__spark { position: absolute; width: 8px; height: 8px; margin: -4px; background: var(--c); animation: bl-saver-spark 900ms cubic-bezier(.2,.8,.3,1) forwards; pointer-events: none; }
.bl-saver__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-saver-spark { from { transform: translate(0, 0) scale(1); opacity: 1; } to { transform: translate(var(--dx), var(--dy)) scale(0.3); opacity: 0; } }
@keyframes bl-saver-pop { 50% { transform: scale(1.35); } }
@media (prefers-reduced-motion: reduce) { .bl-saver__spark { display: none; } .bl-saver__count[data-pop] { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const PALETTE = ['#73eff7', '#a7f070', '#ffcd75', '#ef7d57', '#b13e53', '#41a6f6', '#f4f4f4'];
const ACTIVITY = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'];

interface Spark {
  x: number;
  y: number;
  dx: number;
  dy: number;
  c: string;
}

export interface ScreensaverProps {
  /** What bounces; it takes the current colour (currentColor) on every wall. */
  logo?: ReactNode;
  /** Shown until the page has been idle for idleAfter ms (only when idleAfter > 0). */
  children?: ReactNode;
  /** 0 runs it always; otherwise it fades in after this many ms without input. */
  idleAfter?: number;
  /** Travel speed in px per second. */
  speed?: number;
  /** Colours cycled on each wall hit. */
  colors?: string[];
  /** How exact (in px) a corner hit must be. */
  cornerTolerance?: number;
  showCount?: boolean;
  onCornerHit?: (count: number) => void;
  height?: number | string;
  radius?: number;
  logoSize?: number;
  backgroundColor?: string;
  /** Behind the children in idle mode. */
  contentColor?: string;
  textColor?: string;
  lineColor?: string;
  fontFamily?: string;
  /** Accessible name when always on. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export default function Screensaver({
  logo = 'BITS LAB',
  children,
  idleAfter = 0,
  speed = 110,
  colors = PALETTE,
  cornerTolerance = 4,
  showCount = true,
  onCornerHit,
  height = 320,
  radius = 12,
  logoSize = 34,
  backgroundColor = '#0b0b14',
  contentColor = '#1a1c2c',
  textColor = '#f4f4f4',
  lineColor = '#333c57',
  fontFamily = '"Press Start 2P", ui-monospace, monospace',
  label = 'Screensaver',
  className = '',
  style
}: ScreensaverProps) {
  useStyles();
  const rootRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const hitRef = useRef(onCornerHit);
  hitRef.current = onCornerHit;
  const [idle, setIdle] = useState(idleAfter <= 0);
  const [corners, setCorners] = useState(0);
  const countValue = useRef(0);
  const [bursts, setBursts] = useState<{ id: string; sparks: Spark[] }[]>([]);
  const [announce, setAnnounce] = useState('');

  // Idle detection: any input anywhere wakes the page and restarts the countdown.
  useEffect(() => {
    if (idleAfter <= 0) {
      setIdle(true);
      return undefined;
    }
    let timer = 0;
    const reset = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), idleAfter);
    };
    reset();
    ACTIVITY.forEach(type => window.addEventListener(type, reset, { passive: true }));
    return () => {
      clearTimeout(timer);
      ACTIVITY.forEach(type => window.removeEventListener(type, reset));
    };
  }, [idleAfter]);

  useEffect(() => {
    if (!idle) return undefined;
    const root = rootRef.current!;
    const logoEl = logoRef.current!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let colorIndex = 0;
    const recolor = () => {
      colorIndex = (colorIndex + 1) % colors.length;
      logoEl.style.color = colors[colorIndex];
    };
    logoEl.style.color = colors[0];

    if (reduced) {
      const place = () => {
        logoEl.style.transform = `translate(${(root.clientWidth - logoEl.offsetWidth) / 2}px, ${(root.clientHeight - logoEl.offsetHeight) / 2}px)`;
      };
      place();
      const resize = new ResizeObserver(place);
      resize.observe(root);
      const timer = setInterval(recolor, 4000);
      return () => {
        resize.disconnect();
        clearInterval(timer);
      };
    }

    const box = () => ({ w: Math.max(0, root.clientWidth - logoEl.offsetWidth), h: Math.max(0, root.clientHeight - logoEl.offsetHeight) });
    let { w, h } = box();
    const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5;
    const p = { x: Math.random() * w, y: Math.random() * h, dx: Math.cos(angle), dy: Math.sin(angle) };
    let visible = true;
    let lastCorner = -Infinity;
    let frame = 0;
    let last = 0;

    const celebrate = (x: number, y: number, now: number) => {
      // With a wide tolerance both walls of one corner can register; count it once.
      if (now - lastCorner < 600) return;
      lastCorner = now;
      countValue.current += 1;
      const next = countValue.current;
      setCorners(next);
      setAnnounce(`Corner hit! ${next} so far.`);
      hitRef.current?.(next);
      const id = `${performance.now()}`;
      const sparks = Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const dist = 50 + Math.random() * 60;
        return { x, y, dx: Math.cos(a) * dist, dy: Math.sin(a) * dist, c: colors[i % colors.length] };
      });
      setBursts(list => [...list.slice(-2), { id, sparks }]);
      setTimeout(() => setBursts(list => list.filter(b => b.id !== id)), 950);
      const count = countRef.current;
      if (count) {
        delete count.dataset.pop;
        void count.offsetWidth;
        count.dataset.pop = '';
      }
    };

    const tick = (now: number) => {
      const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
      last = now;
      p.x += p.dx * speed * dt;
      p.y += p.dy * speed * dt;
      let hitX = false;
      let hitY = false;
      if (p.x <= 0 || p.x >= w) {
        p.x = Math.max(0, Math.min(w, p.x));
        p.dx = -p.dx;
        hitX = true;
      }
      if (p.y <= 0 || p.y >= h) {
        p.y = Math.max(0, Math.min(h, p.y));
        p.dy = -p.dy;
        hitY = true;
      }
      if (hitX || hitY) {
        recolor();
        // A corner: one wall now and the other within the tolerance.
        const nearX = p.x <= cornerTolerance || p.x >= w - cornerTolerance;
        const nearY = p.y <= cornerTolerance || p.y >= h - cornerTolerance;
        if (nearX && nearY) celebrate(p.x < w / 2 ? 0 : root.clientWidth, p.y < h / 2 ? 0 : root.clientHeight, now);
      }
      logoEl.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px)`;
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (frame || !visible || document.hidden) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    observer.observe(root);
    const resize = new ResizeObserver(() => {
      ({ w, h } = box());
    });
    resize.observe(root);
    resize.observe(logoEl);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);
    start();
    return () => {
      stop();
      observer.disconnect();
      resize.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [idle, speed, colors, cornerTolerance]);

  const idleMode = idleAfter > 0;
  return (
    <div
      ref={rootRef}
      className={`bl-saver ${className}`}
      data-idle-mode={idleMode || undefined}
      data-idle={idle || undefined}
      role={idleMode ? undefined : 'img'}
      aria-label={idleMode ? undefined : label}
      style={{ '--bl-h': typeof height === 'number' ? `${height}px` : height, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-content-bg': contentColor, '--bl-ink': textColor, '--bl-line': lineColor, '--bl-logo': colors[0], '--bl-logo-size': `${logoSize}px`, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      {idleMode && <div className="bl-saver__content">{children}</div>}
      <div className="bl-saver__screen" aria-hidden="true">
        <div ref={logoRef} className="bl-saver__logo">
          {logo}
        </div>
        {bursts.map(burst =>
          burst.sparks.map((s, i) => <span key={`${burst.id}-${i}`} className="bl-saver__spark" style={{ left: s.x, top: s.y, '--dx': `${s.dx}px`, '--dy': `${s.dy}px`, '--c': s.c } as CSSVars} />)
        )}
        {showCount && (
          <span ref={countRef} className="bl-saver__count">
            Corners: {corners}
          </span>
        )}
      </div>
      <span className="bl-saver__sr" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
