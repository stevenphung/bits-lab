import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Hero product shot that enters tilted back in 3D and settles flat as it scrolls into view,
// scaling up and catching a sweep of light on the way. Scroll-linked (not time-based), so
// it scrubs both ways. Works with the window or any scroll box; flat under reduced motion.

function scrollParent(node: HTMLElement | null): HTMLElement | Window {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) return el;
  }
  return window;
}

// Smoothstep: gentle at both ends, so the tilt reads clearly through the middle of the scroll.
const ease = (t: number) => t * t * (3 - 2 * t);

export interface ScrollTiltProps {
  /** The product shot: an image, video, device frame or live UI. */
  children?: ReactNode;
  /** Starting rotation, in degrees. */
  tilt?: number;
  /** Starting scale. */
  scale?: number;
  /** Starting downward offset, in px. */
  lift?: number;
  /** Viewport position (0 top, 1 bottom) of the card's top where the effect starts. */
  start?: number;
  /** Viewport position of the card's top where it is fully flat. */
  end?: number;
  /** 3D perspective, in px; lower is more dramatic. */
  perspective?: number;
  /** Light sweep across the card as it settles. */
  shine?: boolean;
  radius?: number;
  borderWidth?: number;
  borderColor?: string;
  shineColor?: string;
  shadowColor?: string;
  className?: string;
  style?: CSSProperties;
}

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
}: ScrollTiltProps) {
  
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current!;
    const scroller = scrollParent(root);
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const viewTop = scroller === window ? 0 : (scroller as HTMLElement).getBoundingClientRect().top;
      const viewHeight = scroller === window ? window.innerHeight : (scroller as HTMLElement).clientHeight;
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
      className={`relative perspective-(--bl-perspective) [--bl-p:0] ${className}`}
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
      } as CSSVars}
    >
      <div className="relative origin-[50%_0] overflow-hidden rounded-(--bl-radius) shadow-[0_0_0_var(--bl-border)_var(--bl-edge),0_calc(10px_+_var(--bl-p)_*_40px)_calc(30px_+_var(--bl-p)_*_60px)_-20px_var(--bl-shadow)] will-change-transform [transform:rotateX(calc((1_-_var(--bl-p))_*_var(--bl-tilt)))_scale(calc(var(--bl-scale)_+_(1_-_var(--bl-scale))_*_var(--bl-p)))_translateY(calc((1_-_var(--bl-p))_*_var(--bl-lift)))] motion-reduce:[transform:none] [&>img]:block [&>img]:h-auto [&>img]:w-full [&>video]:block [&>video]:h-auto [&>video]:w-full">
        {children}
        {shine && <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,var(--bl-shine)_48%,transparent_66%)] bg-[length:250%_100%] bg-[position:calc(100%_-_var(--bl-p)_*_100%)_0] opacity-[calc(1_-_var(--bl-p)_*_0.7)] mix-blend-screen motion-reduce:hidden" aria-hidden="true" />}
      </div>
    </div>
  );
}
