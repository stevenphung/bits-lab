import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

export interface CRTPowerProps {
  /** What's on the screen. It's inert and hidden from screen readers while off. */
  children?: ReactNode;
  /** Controlled power state. */
  on?: boolean;
  /** Starting state when uncontrolled. */
  defaultOn?: boolean;
  /** Called with the new state when the power button is pressed. */
  onChange?: (on: boolean) => void;
  /** Power-on length, in ms (power-off is a little shorter). */
  duration?: number;
  /** Screen height: a number in px or any CSS length. */
  height?: number | string;
  radius?: number;
  background?: string;
  bezelColor?: string;
  /** Color of the power-on line and the fading dot. */
  glowColor?: string;
  scanlines?: boolean;
  vignette?: boolean;
  /** Show the built-in power button. */
  showButton?: boolean;
  /** Play the power-on animation when the component mounts. */
  powerOnAtMount?: boolean;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

// Wraps any content in a CRT screen that powers on (a bright line opening into the picture)
// and off (collapsing to a line, then a fading dot). Controlled via `on`, or uncontrolled with
// the built-in power button. Content is inert while the set is off.

const STYLE_ID = 'bl-crt-power';
const CSS = `
.bl-crt { display: grid; gap: 14px; justify-items: center; width: 100%; }
.bl-crt__screen { position: relative; width: 100%; height: var(--bl-height); background: var(--bl-bg); overflow: hidden; border-radius: var(--bl-radius);
  box-shadow: 0 0 0 4px #0b0b14, 0 0 0 10px var(--bl-bezel), 0 0 0 14px #0b0b14, 10px 14px 0 10px rgba(11, 11, 20, 0.4); }
.bl-crt__content { position: absolute; inset: 0; transform-origin: center; will-change: transform, filter; }
.bl-crt__content[data-off] { visibility: hidden; }
.bl-crt__scan { position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.22) 2px 4px); }
.bl-crt__vignette { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(120% 100% at 50% 50%, transparent 60%, rgba(0,0,0,0.55) 100%); }
.bl-crt__dot { position: absolute; left: 50%; top: 50%; width: 8px; height: 8px; margin: -4px; border-radius: 50%; background: var(--bl-glow); box-shadow: 0 0 18px 6px var(--bl-glow); opacity: 0; pointer-events: none; }
.bl-crt__power { display: inline-flex; align-items: center; gap: 10px; padding: 8px 12px; border: 0; background: var(--bl-bezel); color: #f4f4f4; font: 9px/1 var(--bl-font, "Press Start 2P", ui-monospace, monospace); text-transform: uppercase; cursor: pointer;
  box-shadow: 0 -3px 0 0 #0b0b14, 0 3px 0 0 #0b0b14, -3px 0 0 0 #0b0b14, 3px 0 0 0 #0b0b14; }
.bl-crt__power:focus-visible { outline: 3px solid #41a6f6; outline-offset: 5px; }
.bl-crt__led { width: 8px; height: 8px; background: #b13e53; box-shadow: 0 0 6px #b13e53; }
.bl-crt__power[aria-pressed="true"] .bl-crt__led { background: #a7f070; box-shadow: 0 0 8px #a7f070; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

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
}: CRTPowerProps) {
  useStyles();
  const controlled = typeof on === 'boolean';
  const [internalOn, setInternalOn] = useState(defaultOn);
  const isOn = controlled ? on! : internalOn;
  const [visible, setVisible] = useState(isOn && !powerOnAtMount);
  const contentRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
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
    const animations: Animation[] = [];
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
      className={`bl-crt ${className}`}
      style={{
        '--bl-height': typeof height === 'number' ? `${height}px` : height,
        '--bl-radius': `${radius}px`,
        '--bl-bg': background,
        '--bl-bezel': bezelColor,
        '--bl-glow': glowColor,
        ...(fontFamily ? { '--bl-font': fontFamily } : null),
        ...style
      } as CSSVars}
    >
      <div className="bl-crt__screen">
        <div ref={contentRef} className="bl-crt__content" data-off={!visible || undefined} inert={!isOn || undefined} aria-hidden={!isOn || undefined}>
          {children}
        </div>
        <div ref={dotRef} className="bl-crt__dot" aria-hidden="true" />
        {scanlines && <div className="bl-crt__scan" aria-hidden="true" />}
        {vignette && <div className="bl-crt__vignette" aria-hidden="true" />}
      </div>
      {showButton && (
        <button type="button" className="bl-crt__power" aria-pressed={isOn} onClick={toggle}>
          <span className="bl-crt__led" aria-hidden="true" />
          {isOn ? 'Power off' : 'Power on'}
        </button>
      )}
    </div>
  );
}
