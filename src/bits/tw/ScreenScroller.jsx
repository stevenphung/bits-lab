import { useEffect, useRef } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Scroll-driven device showcase: as the section scrolls past, a tilted device rises flat,
// then the page inside its screen scrolls from top to bottom. Progress is measured against
// the nearest scrollable ancestor (or the window), so it also works inside scroll boxes.

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
      className={`relative h-(--bl-len) motion-reduce:h-auto ${className}`}
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
      <div className="sticky top-0 grid h-(--bl-stage) place-items-center overflow-hidden perspective-[1400px] motion-reduce:relative motion-reduce:h-auto motion-reduce:py-10">
        {intro && <div className="pointer-events-none absolute inset-x-0 top-[9%] px-4 text-center text-(--bl-ink) opacity-[calc(1_-_var(--bl-rise)_*_1.6)] [transform:translateY(calc(var(--bl-rise)_*_-40px))] motion-reduce:static motion-reduce:mb-6 motion-reduce:opacity-100 motion-reduce:[transform:none]">{intro}</div>}
        <div className="relative w-[min(var(--bl-w),92%)] origin-[50%_100%] rounded-(--bl-radius) bg-(--bl-body) p-(--bl-bezel) shadow-[inset_0_0_0_2px_var(--bl-edge),0_40px_80px_-30px_rgba(0,0,0,0.7)] will-change-transform [transform:translateY(calc((1_-_var(--bl-rise))_*_18%))_rotateX(calc((1_-_var(--bl-rise))_*_var(--bl-tilt)))_scale(calc(0.82_+_var(--bl-rise)_*_0.18))] motion-reduce:[transform:none]">
          <div ref={screenRef} className="relative aspect-(--bl-ratio) overflow-hidden rounded-(--bl-screen-radius) bg-black motion-reduce:overflow-auto" tabIndex={0} aria-label="Device screen preview">
            <div ref={contentRef} className="absolute inset-x-0 top-0 [transform:translateY(calc(var(--bl-scroll)_*_var(--bl-travel)_*_-1px))] will-change-transform [&>img]:block [&>img]:h-auto [&>img]:w-full motion-reduce:static motion-reduce:[transform:none]">
              {children}
            </div>
            <div className="absolute top-1 right-1 bottom-1 w-[3px] rounded-[2px] bg-[rgba(255,255,255,0.12)] opacity-(--bl-rise) motion-reduce:hidden" aria-hidden="true">
              <div className="absolute inset-x-0 top-[calc(var(--bl-scroll)_*_78%)] h-[22%] rounded-[2px] bg-[rgba(255,255,255,0.55)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
