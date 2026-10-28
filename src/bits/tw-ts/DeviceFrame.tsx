import { useRef, type CSSProperties, type ReactNode, type PointerEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Original device frames drawn in CSS: phone, tablet, laptop, browser window and watch.
// Children fill the screen (any content: images, video, live UI). Optional 3D tilt that
// eases toward the pointer. Frames are generic designs, not replicas of real products.

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

  const screen = <div className="relative isolate overflow-hidden bg-black *:block *:h-full *:w-full *:object-cover group-data-[device=phone]/dev:h-full group-data-[device=phone]/dev:rounded-[11%/5.2%] group-data-[device=tablet]/dev:h-full group-data-[device=tablet]/dev:rounded-[2.5%] group-data-[device=laptop]/dev:aspect-[16/10] group-data-[device=laptop]/dev:rounded-[0.6%] group-data-[device=browser]/dev:aspect-[var(--bl-ratio,16/10)] group-data-[device=browser]/dev:bg-(--bl-page) group-data-[device=watch]/dev:h-full group-data-[device=watch]/dev:rounded-[22%]">{children}</div>;

  return (
    <div
      ref={ref}
      className={`group/dev relative inline-block w-(--bl-w) max-w-full [--bl-body:#1f2230] [--bl-edge:#3a3f55] [--bl-shine:rgba(255,255,255,0.14)] transform-3d [transition:transform_500ms_cubic-bezier(.2,.8,.2,1)] motion-reduce:[transition:none] ${className}`}
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
          <div className="relative mx-[7%] my-0 rounded-[3%_3%_0_0/4.5%_4.5%_0_0] bg-(--bl-body) px-[2.4%] pt-[2.4%] pb-[3.2%] shadow-[inset_0_0_0_2px_var(--bl-edge)]">
            <span className="absolute top-[0.9%] left-1/2 aspect-square w-[0.8%] rounded-[50%] bg-[#0b0b14] [transform:translateX(-50%)]" aria-hidden="true" />
            {screen}
          </div>
          <div className="relative h-0 rounded-[0_0_40%_40%/0_0_100%_100%] bg-[linear-gradient(to_bottom,var(--bl-edge),var(--bl-body))] pb-[3.6%] shadow-[0_24px_40px_-18px_rgba(0,0,0,0.65)] before:absolute before:top-0 before:left-1/2 before:h-[30%] before:w-[16%] before:rounded-[0_0_10px_10px] before:bg-[rgba(0,0,0,0.3)] before:[transform:translateX(-50%)]" aria-hidden="true" />
        </>
      ) : (
        <div className="relative bg-(--bl-body) shadow-[inset_0_0_0_2px_var(--bl-edge),inset_0_0_0_4px_rgba(0,0,0,0.35),0_30px_60px_-20px_rgba(0,0,0,0.6),0_12px_24px_-12px_rgba(0,0,0,0.5)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-[linear-gradient(135deg,var(--bl-shine),transparent_40%)] group-data-[device=phone]/dev:aspect-[9/19] group-data-[device=phone]/dev:rounded-[15%/7%] group-data-[device=phone]/dev:p-[4.5%] group-data-[device=tablet]/dev:aspect-[3/4] group-data-[device=tablet]/dev:rounded-[6%] group-data-[device=tablet]/dev:p-[4%] group-data-[device=tablet]/dev:group-data-[landscape]/dev:aspect-[4/3] group-data-[device=browser]/dev:overflow-hidden group-data-[device=browser]/dev:rounded-[12px] group-data-[device=browser]/dev:bg-(--bl-chrome) group-data-[device=browser]/dev:p-0 group-data-[device=browser]/dev:shadow-[0_0_0_1px_rgba(0,0,0,0.25),0_30px_60px_-24px_rgba(0,0,0,0.55)] group-data-[device=browser]/dev:after:hidden group-data-[device=watch]/dev:aspect-[4/5] group-data-[device=watch]/dev:rounded-[26%] group-data-[device=watch]/dev:p-[8%]">
          {device === 'browser' && (
            <div className="flex h-10 items-center gap-3 border-b border-solid border-(--bl-chrome-line) bg-(--bl-chrome) px-3.5" aria-hidden="true">
              <span className="flex gap-[7px] *:size-[11px] *:rounded-[50%]">
                <i style={{ background: '#ff5f57' }} />
                <i style={{ background: '#febc2e' }} />
                <i style={{ background: '#28c840' }} />
              </span>
              <span className="mx-auto max-w-[60%] flex-1 overflow-hidden rounded-[7px] bg-(--bl-url) px-3 py-[5px] text-center [font:500_12px/1.2_ui-sans-serif,system-ui,sans-serif] text-ellipsis whitespace-nowrap text-(--bl-url-text)">{url}</span>
            </div>
          )}
          {device === 'phone' && (
            <>
              <span className="absolute top-[2.2%] left-1/2 z-2 h-[3.2%] w-[30%] rounded-full bg-black [transform:translateX(-50%)]" aria-hidden="true" />
              <span className="absolute w-[1.6%] rounded-[2px] bg-(--bl-edge)" style={{ left: '-1%', top: '18%', height: '6%' }} aria-hidden="true" />
              <span className="absolute w-[1.6%] rounded-[2px] bg-(--bl-edge)" style={{ left: '-1%', top: '27%', height: '9%' }} aria-hidden="true" />
              <span className="absolute w-[1.6%] rounded-[2px] bg-(--bl-edge)" style={{ right: '-1%', top: '24%', height: '12%' }} aria-hidden="true" />
            </>
          )}
          {device === 'watch' && <span className="absolute top-[28%] -right-[3.5%] h-[16%] w-[5%] rounded-[3px] bg-(--bl-edge)" aria-hidden="true" />}
          {screen}
        </div>
      )}
    </div>
  );
}
