import { useEffect, useInsertionEffect, useRef } from 'react';

// Scroll-driven zoom. An image (or video, or any node) starts as a small framed card under a
// heading; as you scroll it opens out to fill the screen, then dims and reveals whatever you
// pass as children on top of it, and finally scrolls away into the next section. The frame
// is a clip-path over a full-size image, so it stays sharp the whole way. Works in the page
// or any scroll container; with reduced motion it shows the finished state without pinning.

const STYLE_ID = 'bl-scroll-zoom';
const CSS = `
.bl-zoom { position: relative; height: calc(var(--bl-view, 100vh) * var(--bl-length)); color: var(--bl-ink); font-family: var(--bl-font); }
.bl-zoom__stage { position: sticky; top: 0; height: var(--bl-view, 100vh); overflow: hidden; }
.bl-zoom__media { position: absolute; inset: 0; clip-path: var(--bl-clip, inset(0)); will-change: clip-path; }
.bl-zoom__media > img, .bl-zoom__media > video { display: block; width: 100%; height: 100%; object-fit: cover; transform: scale(calc(1.18 - var(--bl-p, 1) * 0.18)); }
.bl-zoom__media > :not(img):not(video) { width: 100%; height: 100%; }
.bl-zoom__dim { position: absolute; inset: 0; background: var(--bl-dim-color); opacity: calc(var(--bl-reveal, 1) * var(--bl-dim)); pointer-events: none; }
.bl-zoom__heading { position: absolute; left: 0; right: 0; top: 0; display: grid; place-items: center; height: var(--bl-head-h); padding: 0 16px; text-align: center; opacity: calc(1 - var(--bl-p, 1) * 3); transform: translateY(calc(var(--bl-p, 1) * -40px)); pointer-events: none; }
.bl-zoom__reveal { position: absolute; inset: 0; display: grid; place-items: center; padding: 24px; text-align: center; opacity: var(--bl-reveal, 1); transform: translateY(calc((1 - var(--bl-reveal, 1)) * 30px)); }
.bl-zoom[data-hidden-reveal] .bl-zoom__reveal { visibility: hidden; }
.bl-zoom[data-static] { height: auto; }
.bl-zoom[data-static] .bl-zoom__stage { position: relative; height: var(--bl-view, 100vh); }
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

const clamp = value => Math.max(0, Math.min(1, value));
const ease = t => 1 - (1 - t) ** 3;

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
}) {
  useStyles();
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    const scroller = scrollParent(root);
    const isWindow = scroller === window;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    const viewport = () => (isWindow ? { top: 0, height: window.innerHeight } : { top: scroller.getBoundingClientRect().top, height: scroller.clientHeight });

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
    if (!isWindow) resize.observe(scroller);
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
      className={`bl-zoom ${className}`}
      style={{ '--bl-length': length, '--bl-dim': dim, '--bl-dim-color': dimColor, '--bl-ink': textColor, '--bl-font': fontFamily, background: backgroundColor, ...style }}
    >
      <div className="bl-zoom__stage">
        {heading && <div className="bl-zoom__heading">{heading}</div>}
        <div className="bl-zoom__media" style={mediaStyle}>
          {media ?? <img src={src} alt={alt} />}
          <div className="bl-zoom__dim" aria-hidden="true" />
        </div>
        {children && <div className="bl-zoom__reveal">{children}</div>}
      </div>
    </section>
  );
}
