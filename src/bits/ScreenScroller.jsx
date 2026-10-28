import { useEffect, useInsertionEffect, useRef } from 'react';

// Scroll-driven device showcase: as the section scrolls past, a tilted device rises flat,
// then the page inside its screen scrolls from top to bottom. Progress is measured against
// the nearest scrollable ancestor (or the window), so it also works inside scroll boxes.

const STYLE_ID = 'bl-screen-scroller';
const CSS = `
.bl-ss { position: relative; height: var(--bl-len); }
.bl-ss__stage { position: sticky; top: 0; height: var(--bl-stage); display: grid; place-items: center; overflow: hidden; perspective: 1400px; }
.bl-ss__intro { position: absolute; top: 9%; left: 0; right: 0; text-align: center; padding: 0 16px; color: var(--bl-ink); opacity: calc(1 - var(--bl-rise) * 1.6); transform: translateY(calc(var(--bl-rise) * -40px)); pointer-events: none; }
.bl-ss__device { position: relative; width: min(var(--bl-w), 92%); padding: var(--bl-bezel); border-radius: var(--bl-radius); background: var(--bl-body); box-shadow: inset 0 0 0 2px var(--bl-edge), 0 40px 80px -30px rgba(0,0,0,0.7); transform-origin: 50% 100%; transform: translateY(calc((1 - var(--bl-rise)) * 18%)) rotateX(calc((1 - var(--bl-rise)) * var(--bl-tilt))) scale(calc(0.82 + var(--bl-rise) * 0.18)); will-change: transform; }
.bl-ss__screen { position: relative; overflow: hidden; aspect-ratio: var(--bl-ratio); border-radius: var(--bl-screen-radius); background: #000; }
.bl-ss__content { position: absolute; top: 0; left: 0; right: 0; transform: translateY(calc(var(--bl-scroll) * var(--bl-travel) * -1px)); will-change: transform; }
.bl-ss__content > img { display: block; width: 100%; height: auto; }
.bl-ss__bar { position: absolute; right: 4px; top: 4px; bottom: 4px; width: 3px; border-radius: 2px; background: rgba(255,255,255,0.12); opacity: var(--bl-rise); }
.bl-ss__thumb { position: absolute; left: 0; right: 0; height: 22%; border-radius: 2px; background: rgba(255,255,255,0.55); top: calc(var(--bl-scroll) * 78%); }
@media (prefers-reduced-motion: reduce) {
  .bl-ss { height: auto; }
  .bl-ss__stage { position: relative; height: auto; padding: 40px 0; }
  .bl-ss__intro { position: static; opacity: 1; transform: none; margin-bottom: 24px; }
  .bl-ss__device { transform: none; }
  .bl-ss__screen { overflow: auto; }
  .bl-ss__content { position: static; transform: none; }
  .bl-ss__bar { display: none; }
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
    const { overflowY } = getComputedStyle(el);
    if (/(auto|scroll|overlay)/.test(overflowY) && el.scrollHeight > el.clientHeight) return el;
  }
  return window;
}

const clamp = value => Math.min(1, Math.max(0, value));

const DEVICES = {
  laptop: { width: 760, ratio: '16 / 10', bezel: '14px 14px 22px', radius: '18px 18px 8px 8px', screenRadius: '4px' },
  phone: { width: 300, ratio: '9 / 19', bezel: '12px', radius: '44px', screenRadius: '34px' },
  tablet: { width: 520, ratio: '3 / 4', bezel: '18px', radius: '30px', screenRadius: '12px' }
};

export default function ScreenScroller({
  children,
  intro,
  device = 'laptop',
  scrollLength = 300,
  stageHeight = '100vh',
  tilt = 38,
  riseUntil = 0.35,
  bodyColor = '#1f2230',
  edgeColor = '#3a3f55',
  textColor = '#f4f4f4',
  className = '',
  style
}) {
  useStyles();
  const rootRef = useRef(null);
  const screenRef = useRef(null);
  const contentRef = useRef(null);
  const spec = DEVICES[device] ?? DEVICES.laptop;

  useEffect(() => {
    const root = rootRef.current;
    const scroller = scrollParent(root);
    let frame = 0;

    const measureTravel = () => {
      const travel = Math.max(0, contentRef.current.offsetHeight - screenRef.current.clientHeight);
      root.style.setProperty('--bl-travel', String(travel));
    };

    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const viewTop = scroller === window ? 0 : scroller.getBoundingClientRect().top;
      const viewHeight = scroller === window ? window.innerHeight : scroller.clientHeight;
      const progress = clamp((viewTop - rect.top) / Math.max(1, rect.height - viewHeight));
      const rise = clamp(progress / riseUntil);
      const scroll = clamp((progress - riseUntil) / (1 - riseUntil));
      root.style.setProperty('--bl-rise', rise.toFixed(4));
      root.style.setProperty('--bl-scroll', scroll.toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const resize = new ResizeObserver(() => {
      measureTravel();
      schedule();
    });
    resize.observe(contentRef.current);
    resize.observe(screenRef.current);
    measureTravel();
    update();
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [riseUntil]);

  return (
    <section
      ref={rootRef}
      className={`bl-ss ${className}`}
      style={{
        '--bl-len': typeof scrollLength === 'number' ? `${scrollLength}vh` : scrollLength,
        '--bl-stage': stageHeight,
        '--bl-tilt': `${tilt}deg`,
        '--bl-rise': 0,
        '--bl-scroll': 0,
        '--bl-travel': 0,
        '--bl-w': `${spec.width}px`,
        '--bl-ratio': spec.ratio,
        '--bl-bezel': spec.bezel,
        '--bl-radius': spec.radius,
        '--bl-screen-radius': spec.screenRadius,
        '--bl-body': bodyColor,
        '--bl-edge': edgeColor,
        '--bl-ink': textColor,
        ...style
      }}
    >
      <div className="bl-ss__stage">
        {intro && <div className="bl-ss__intro">{intro}</div>}
        <div className="bl-ss__device">
          <div ref={screenRef} className="bl-ss__screen" tabIndex={0} aria-label="Device screen preview">
            <div ref={contentRef} className="bl-ss__content">
              {children}
            </div>
            <div className="bl-ss__bar" aria-hidden="true">
              <div className="bl-ss__thumb" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
