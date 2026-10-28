import { useInsertionEffect, useRef, type CSSProperties, type ReactNode, type PointerEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Original device frames drawn in CSS: phone, tablet, laptop, browser window and watch.
// Children fill the screen (any content: images, video, live UI). Optional 3D tilt that
// eases toward the pointer. Frames are generic designs, not replicas of real products.

const STYLE_ID = 'bl-device-frame';
const CSS = `
.bl-dev { --bl-body: #1f2230; --bl-edge: #3a3f55; --bl-shine: rgba(255,255,255,0.14); position: relative; display: inline-block; width: var(--bl-w); max-width: 100%; transform-style: preserve-3d; transition: transform 500ms cubic-bezier(.2,.8,.2,1); }
.bl-dev__shell { position: relative; background: var(--bl-body); box-shadow: inset 0 0 0 2px var(--bl-edge), inset 0 0 0 4px rgba(0,0,0,0.35), 0 30px 60px -20px rgba(0,0,0,0.6), 0 12px 24px -12px rgba(0,0,0,0.5); }
.bl-dev__shell::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; background: linear-gradient(135deg, var(--bl-shine), transparent 40%); }
.bl-dev__screen { position: relative; overflow: hidden; background: #000; isolation: isolate; }
.bl-dev__screen > * { display: block; width: 100%; height: 100%; object-fit: cover; }

.bl-dev[data-device="phone"] .bl-dev__shell { aspect-ratio: 9 / 19; border-radius: 15% / 7%; padding: 4.5%; }
.bl-dev[data-device="phone"] .bl-dev__screen { height: 100%; border-radius: 11% / 5.2%; }
.bl-dev[data-device="phone"] .bl-dev__notch { position: absolute; z-index: 2; top: 2.2%; left: 50%; width: 30%; height: 3.2%; transform: translateX(-50%); border-radius: 999px; background: #000; }
.bl-dev[data-device="phone"] .bl-dev__btn { position: absolute; width: 1.6%; border-radius: 2px; background: var(--bl-edge); }

.bl-dev[data-device="tablet"] .bl-dev__shell { aspect-ratio: 3 / 4; border-radius: 6%; padding: 4%; }
.bl-dev[data-device="tablet"] .bl-dev__screen { height: 100%; border-radius: 2.5%; }
.bl-dev[data-device="tablet"][data-landscape] .bl-dev__shell { aspect-ratio: 4 / 3; }

.bl-dev[data-device="laptop"] .bl-dev__lid { position: relative; margin: 0 7%; padding: 2.4% 2.4% 3.2%; border-radius: 3% 3% 0 0 / 4.5% 4.5% 0 0; background: var(--bl-body); box-shadow: inset 0 0 0 2px var(--bl-edge); }
.bl-dev[data-device="laptop"] .bl-dev__screen { aspect-ratio: 16 / 10; border-radius: 0.6%; }
.bl-dev[data-device="laptop"] .bl-dev__cam { position: absolute; top: 0.9%; left: 50%; width: 0.8%; aspect-ratio: 1; border-radius: 50%; background: #0b0b14; transform: translateX(-50%); }
.bl-dev[data-device="laptop"] .bl-dev__base { position: relative; height: 0; padding-bottom: 3.6%; border-radius: 0 0 40% 40% / 0 0 100% 100%; background: linear-gradient(to bottom, var(--bl-edge), var(--bl-body)); box-shadow: 0 24px 40px -18px rgba(0,0,0,0.65); }
.bl-dev[data-device="laptop"] .bl-dev__base::before { content: ""; position: absolute; top: 0; left: 50%; width: 16%; height: 30%; border-radius: 0 0 10px 10px; background: rgba(0,0,0,0.3); transform: translateX(-50%); }

.bl-dev[data-device="browser"] .bl-dev__shell { border-radius: 12px; padding: 0; overflow: hidden; background: var(--bl-chrome); box-shadow: 0 0 0 1px rgba(0,0,0,0.25), 0 30px 60px -24px rgba(0,0,0,0.55); }
.bl-dev[data-device="browser"] .bl-dev__shell::after { display: none; }
.bl-dev__bar { display: flex; align-items: center; gap: 12px; height: 40px; padding: 0 14px; background: var(--bl-chrome); border-bottom: 1px solid var(--bl-chrome-line); }
.bl-dev__lights { display: flex; gap: 7px; }
.bl-dev__lights i { width: 11px; height: 11px; border-radius: 50%; }
.bl-dev__url { flex: 1; max-width: 60%; margin: 0 auto; padding: 5px 12px; border-radius: 7px; background: var(--bl-url); color: var(--bl-url-text); font: 500 12px/1.2 ui-sans-serif, system-ui, sans-serif; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bl-dev[data-device="browser"] .bl-dev__screen { aspect-ratio: var(--bl-ratio, 16 / 10); background: var(--bl-page); }

.bl-dev[data-device="watch"] .bl-dev__shell { aspect-ratio: 4 / 5; border-radius: 26%; padding: 8%; }
.bl-dev[data-device="watch"] .bl-dev__screen { height: 100%; border-radius: 22%; }
.bl-dev[data-device="watch"] .bl-dev__crown { position: absolute; top: 28%; right: -3.5%; width: 5%; height: 16%; border-radius: 3px; background: var(--bl-edge); }

@media (prefers-reduced-motion: reduce) { .bl-dev { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export type DeviceType = 'phone' | 'tablet' | 'laptop' | 'browser' | 'watch';
export type DeviceFinish = 'graphite' | 'silver' | 'midnight' | 'gold';

const FINISHES: Record<DeviceFinish, { body: string; edge: string }> = {
  graphite: { body: '#1f2230', edge: '#3a3f55' },
  silver: { body: '#d9dde4', edge: '#b4bac6' },
  midnight: { body: '#141a33', edge: '#2b3566' },
  gold: { body: '#e8d3ae', edge: '#c9ad7e' }
};

const BROWSER_THEMES: Record<'light' | 'dark', { chrome: string; line: string; url: string; urlText: string; page: string }> = {
  light: { chrome: '#eceef2', line: '#d8dbe2', url: '#ffffff', urlText: '#5b6170', page: '#ffffff' },
  dark: { chrome: '#22252f', line: '#151720', url: '#151720', urlText: '#9aa2b4', page: '#0e1016' }
};

const DEFAULT_WIDTHS: Record<DeviceType, number> = { phone: 300, tablet: 420, laptop: 720, browser: 760, watch: 200 };

export interface DeviceFrameProps {
  device?: DeviceType;
  /** Fills the screen: an image, video or live UI. */
  children?: ReactNode;
  /** Frame width in px (never wider than its parent). Defaults per device. */
  width?: number;
  /** Preset body finish. */
  finish?: DeviceFinish;
  /** Custom body color; overrides the finish. */
  bodyColor?: string;
  /** Tablet only: rotate to 4:3. */
  landscape?: boolean;
  /** Browser frame address bar text. */
  url?: string;
  browserTheme?: 'light' | 'dark';
  /** Browser page aspect ratio, e.g. "16 / 10". */
  aspectRatio?: string;
  /** Resting 3D tilt, in degrees. */
  tilt?: number;
  /** Ease the tilt toward the pointer (off under reduced motion). */
  interactiveTilt?: boolean;
  /** Accessible name; makes the frame a labelled figure. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export default function DeviceFrame({
  device = 'phone',
  children,
  width,
  finish = 'graphite',
  bodyColor,
  landscape = false,
  url = 'bitslab.dev',
  browserTheme = 'dark',
  aspectRatio,
  tilt = 0,
  interactiveTilt = false,
  label,
  className = '',
  style
}: DeviceFrameProps) {
  useStyles();
  const ref = useRef<HTMLDivElement>(null);
  const colors = FINISHES[finish] ?? FINISHES.graphite;
  const chrome = BROWSER_THEMES[browserTheme] ?? BROWSER_THEMES.dark;
  const baseTransform = tilt ? `perspective(1600px) rotateX(${tilt * 0.5}deg) rotateY(${-tilt}deg)` : 'none';

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!interactiveTilt || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const rect = ref.current!.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    ref.current!.style.transform = `perspective(1600px) rotateX(${-y * 10}deg) rotateY(${x * 14}deg)`;
  };
  const onPointerLeave = () => {
    if (ref.current) ref.current.style.transform = baseTransform;
  };

  const screen = <div className="bl-dev__screen">{children}</div>;

  return (
    <div
      ref={ref}
      className={`bl-dev ${className}`}
      data-device={device}
      data-landscape={landscape || undefined}
      role={label ? 'figure' : undefined}
      aria-label={label}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{
        '--bl-w': `${width ?? DEFAULT_WIDTHS[device] ?? 320}px`,
        '--bl-body': bodyColor ?? colors.body,
        '--bl-edge': colors.edge,
        '--bl-chrome': chrome.chrome,
        '--bl-chrome-line': chrome.line,
        '--bl-url': chrome.url,
        '--bl-url-text': chrome.urlText,
        '--bl-page': chrome.page,
        ...(aspectRatio ? { '--bl-ratio': aspectRatio } : null),
        transform: baseTransform,
        ...style
      } as CSSVars}
    >
      {device === 'laptop' ? (
        <>
          <div className="bl-dev__lid">
            <span className="bl-dev__cam" aria-hidden="true" />
            {screen}
          </div>
          <div className="bl-dev__base" aria-hidden="true" />
        </>
      ) : (
        <div className="bl-dev__shell">
          {device === 'browser' && (
            <div className="bl-dev__bar" aria-hidden="true">
              <span className="bl-dev__lights">
                <i style={{ background: '#ff5f57' }} />
                <i style={{ background: '#febc2e' }} />
                <i style={{ background: '#28c840' }} />
              </span>
              <span className="bl-dev__url">{url}</span>
            </div>
          )}
          {device === 'phone' && (
            <>
              <span className="bl-dev__notch" aria-hidden="true" />
              <span className="bl-dev__btn" style={{ left: '-1%', top: '18%', height: '6%' }} aria-hidden="true" />
              <span className="bl-dev__btn" style={{ left: '-1%', top: '27%', height: '9%' }} aria-hidden="true" />
              <span className="bl-dev__btn" style={{ right: '-1%', top: '24%', height: '12%' }} aria-hidden="true" />
            </>
          )}
          {device === 'watch' && <span className="bl-dev__crown" aria-hidden="true" />}
          {screen}
        </div>
      )}
    </div>
  );
}
