import { useEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Wraps any content in a CRT screen that powers on (a bright line opening into the picture)
// and off (collapsing to a line, then a fading dot). Controlled via `on`, or uncontrolled with
// the built-in power button. Content is inert while the set is off.

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function CRTPower({
  children,
  on,
  defaultOn = true,
  onChange,
  duration = 650,
  height = 360,
  radius = 18,
  background = '#0b0b14',
  bezelColor = '#333c57',
  glowColor = '#e8f6ff',
  scanlines = true,
  vignette = true,
  showButton = true,
  powerOnAtMount = true,
  fontFamily,
  className = '',
  style
}) {
  const controlled = typeof on === 'boolean';
  const [internalOn, setInternalOn] = useState(defaultOn);
  const isOn = controlled ? on : internalOn;
  const [visible, setVisible] = useState(isOn && !powerOnAtMount);
  const contentRef = useRef(null);
  const dotRef = useRef(null);
  const first = useRef(true);

  useEffect(() => {
    const content = contentRef.current;
    const dot = dotRef.current;
    if (!content) return undefined;
    // Skip the animation on mount unless powerOnAtMount asks for it.
    if (first.current) {
      first.current = false;
      if (!(isOn && powerOnAtMount)) {
        setVisible(isOn);
        return undefined;
      }
    }
    const animations = [];
    if (reducedMotion()) {
      setVisible(true);
      animations.push(content.animate([{ opacity: isOn ? 0 : 1 }, { opacity: isOn ? 1 : 0 }], { duration: 200, fill: 'forwards' }));
      animations[0].onfinish = () => setVisible(isOn);
      return () => animations.forEach(animation => animation.cancel());
    }

    if (isOn) {
      setVisible(true);
      animations.push(
        content.animate(
          [
            { transform: 'scale(0, 0.004)', filter: 'brightness(6)', opacity: 1 },
            { transform: 'scale(1, 0.004)', filter: 'brightness(5)', offset: 0.35 },
            { transform: 'scale(1, 1.04)', filter: 'brightness(2)', offset: 0.75 },
            { transform: 'scale(1, 1)', filter: 'brightness(1)', opacity: 1 }
          ],
          { duration, easing: 'cubic-bezier(.2,.8,.2,1)' }
        )
      );
    } else {
      const off = content.animate(
        [
          { transform: 'scale(1, 1)', filter: 'brightness(1)' },
          { transform: 'scale(1, 0.004)', filter: 'brightness(4)', offset: 0.55 },
          { transform: 'scale(0, 0.004)', filter: 'brightness(6)' }
        ],
        { duration: duration * 0.8, easing: 'cubic-bezier(.6,0,.8,.2)', fill: 'forwards' }
      );
      off.onfinish = () => {
        setVisible(false);
        off.cancel();
      };
      animations.push(off);
      if (dot) {
        animations.push(dot.animate([{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 0, transform: 'scale(0.4)' }], { duration: duration * 1.4, delay: duration * 0.7 }));
      }
    }
    return () => animations.forEach(animation => animation.cancel());
  }, [isOn, duration, powerOnAtMount]);

  const toggle = () => {
    const next = !isOn;
    if (!controlled) setInternalOn(next);
    onChange?.(next);
  };

  return (
    <div
      className={`grid w-full justify-items-center gap-3.5 ${className}`}
      style={{
        '--bl-height': typeof height === 'number' ? `${height}px` : height,
        '--bl-radius': `${radius}px`,
        '--bl-bg': background,
        '--bl-bezel': bezelColor,
        '--bl-glow': glowColor,
        ...(fontFamily ? { '--bl-font': fontFamily } : null),
        ...style
      }}
    >
      <div className="relative h-(--bl-height) w-full overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) shadow-[0_0_0_4px_#0b0b14,0_0_0_10px_var(--bl-bezel),0_0_0_14px_#0b0b14,10px_14px_0_10px_rgba(11,11,20,0.4)]">
        <div ref={contentRef} className="absolute inset-0 origin-center will-change-[transform,filter] data-[off]:invisible" data-off={!visible || undefined} inert={!isOn || undefined} aria-hidden={!isOn || undefined}>
          {children}
        </div>
        <div ref={dotRef} className="pointer-events-none absolute top-1/2 left-1/2 -m-1 size-2 rounded-[50%] bg-(--bl-glow) opacity-0 shadow-[0_0_18px_6px_var(--bl-glow)]" aria-hidden="true" />
        {scanlines && <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,rgba(0,0,0,0)_0_2px,rgba(0,0,0,0.22)_2px_4px)]" aria-hidden="true" />}
        {vignette && <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,transparent_60%,rgba(0,0,0,0.55)_100%)]" aria-hidden="true" />}
      </div>
      {showButton && (
        <button type="button" className="group/crt inline-flex cursor-pointer items-center gap-2.5 border-0 bg-(--bl-bezel) px-3 py-2 [font:9px/1_var(--bl-font,'Press_Start_2P',ui-monospace,monospace)] text-[#f4f4f4] uppercase shadow-[0_-3px_0_0_#0b0b14,0_3px_0_0_#0b0b14,-3px_0_0_0_#0b0b14,3px_0_0_0_#0b0b14] focus-visible:outline-3 focus-visible:outline-offset-5 focus-visible:outline-[#41a6f6] focus-visible:outline-solid" aria-pressed={isOn} onClick={toggle}>
          <span className="size-2 bg-[#b13e53] shadow-[0_0_6px_#b13e53] group-aria-pressed/crt:bg-[#a7f070] group-aria-pressed/crt:shadow-[0_0_8px_#a7f070]" aria-hidden="true" />
          {isOn ? 'Power off' : 'Power on'}
        </button>
      )}
    </div>
  );
}
