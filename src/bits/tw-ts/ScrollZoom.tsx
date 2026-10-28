import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Scroll-driven zoom. An image (or video, or any node) starts as a small framed card under a
// heading; as you scroll it opens out to fill the screen, then dims and reveals whatever you
// pass as children on top of it, and finally scrolls away into the next section. The frame
// is a clip-path over a full-size image, so it stays sharp the whole way. Works in the page
// or any scroll container; with reduced motion it shows the finished state without pinning.

export interface ScrollZoomProps {
  src?: string;
  alt?: string;
  /** Any node (video, canvas) instead of an image. */
  media?: ReactNode;
  /** Shown above the small frame; fades as the zoom starts. */
  heading?: ReactNode;
  /** Revealed over the full-bleed media after the zoom. */
  children?: ReactNode;
  /** Section length in screen heights. */
  length?: number;
  /** Share of the scroll spent zooming; the rest reveals. */
  zoomEnd?: number;
  /** Starting frame width as a share of the stage. */
  startWidth?: number;
  startAspect?: number;
  radius?: number;
  /** Space above the frame for the heading, as a share of the stage height. */
  headingSpace?: number;
  dim?: number;
  dimColor?: string;
  textColor?: string;
  backgroundColor?: string;
  /** Style for the media wrapper (e.g. imageRendering: "pixelated"). */
  mediaStyle?: CSSProperties;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

function scrollParent(node: HTMLElement | null): HTMLElement | Window {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) return el;
  }
  return window;
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (t: number) => 1 - (1 - t) ** 3;

export default function ScrollZoom({
  src,
  alt = '',
  media,
  heading,
  children,
  length = 3,
  zoomEnd = 0.6,
  startWidth = 0.46,
  startAspect = 4 / 3,
  radius = 18,
  headingSpace = 0.24,
  dim = 0.55,
  dimColor = '#0b0b14',
  textColor = '#f4f4f4',
  backgroundColor = '#1a1c2c',
  mediaStyle,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: ScrollZoomProps) {
  
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current!;
    const scroller = scrollParent(root);
    const isWindow = scroller === window;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    const viewport = () => (isWindow ? { top: 0, height: window.innerHeight } : { top: (scroller as HTMLElement).getBoundingClientRect().top, height: (scroller as HTMLElement).clientHeight });

    const update = () => {
      frame = 0;
      const view = viewport();
      root.style.setProperty('--bl-view', `${view.height}px`);
      root.style.setProperty('--bl-head-h', `${view.height * headingSpace}px`);
      const rect = root.getBoundingClientRect();
      const travel = rect.height - view.height;
      const p = reduced ? 1 : clamp((view.top - rect.top) / Math.max(1, travel));
      // Phase one opens the frame; phase two reveals the overlay.
      const zoom = ease(clamp(p / zoomEnd));
      const reveal = clamp((p - zoomEnd) / Math.max(0.01, (1 - zoomEnd) * 0.6));
      const width = rect.width;
      const height = view.height;
      const frameW = Math.min(width * startWidth, (height * (1 - headingSpace) - 24) * startAspect);
      const frameH = frameW / startAspect;
      const x = ((width - frameW) / 2) * (1 - zoom);
      const top = (height * headingSpace) * (1 - zoom);
      const bottom = Math.max(0, height - height * headingSpace - frameH) * (1 - zoom);
      root.style.setProperty('--bl-clip', `inset(${top}px ${x}px ${bottom}px ${x}px round ${radius * (1 - zoom)}px)`);
      root.style.setProperty('--bl-p', String(zoom));
      root.style.setProperty('--bl-reveal', String(reveal));
      root.toggleAttribute('data-hidden-reveal', reveal < 0.02);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    if (reduced) root.setAttribute('data-static', '');
    else root.removeAttribute('data-static');
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const resize = new ResizeObserver(schedule);
    resize.observe(root);
    if (!isWindow) resize.observe(scroller as HTMLElement);
    update();
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      resize.disconnect();
    };
  }, [zoomEnd, startWidth, startAspect, radius, headingSpace, length]);

  return (
    <section
      ref={rootRef}
      className={`group/zoom relative h-[calc(var(--bl-view,100vh)*var(--bl-length))] font-(family-name:--bl-font) text-(--bl-ink) data-[static]:h-auto ${className}`}
      style={{ '--bl-length': length, '--bl-dim': dim, '--bl-dim-color': dimColor, '--bl-ink': textColor, '--bl-font': fontFamily, background: backgroundColor, ...style } as CSSVars}
    >
      <div className="sticky top-0 h-[var(--bl-view,100vh)] overflow-hidden group-data-[static]/zoom:relative">
        {heading && <div className="pointer-events-none absolute inset-x-0 top-0 grid h-(--bl-head-h) place-items-center px-4 text-center opacity-[calc(1_-_var(--bl-p,1)_*_3)] [transform:translateY(calc(var(--bl-p,1)_*_-40px))]">{heading}</div>}
        <div className="absolute inset-0 [clip-path:var(--bl-clip,inset(0))] will-change-[clip-path] *:h-full *:w-full [&>img]:block [&>img]:object-cover [&>img]:[transform:scale(calc(1.18_-_var(--bl-p,1)_*_0.18))] [&>video]:block [&>video]:object-cover [&>video]:[transform:scale(calc(1.18_-_var(--bl-p,1)_*_0.18))]" style={mediaStyle}>
          {media ?? <img src={src} alt={alt} />}
          <div className="pointer-events-none absolute inset-0 bg-(--bl-dim-color) opacity-[calc(var(--bl-reveal,1)_*_var(--bl-dim))]" aria-hidden="true" />
        </div>
        {children && <div className="absolute inset-0 grid place-items-center p-6 text-center opacity-[var(--bl-reveal,1)] [transform:translateY(calc((1_-_var(--bl-reveal,1))_*_30px))] group-data-[hidden-reveal]/zoom:invisible">{children}</div>}
      </div>
    </section>
  );
}
