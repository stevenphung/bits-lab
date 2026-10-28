import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Retro loading screen: chunked progress bar, pixel spinner, rotating tips and a COMPLETE flash.
// Pass `progress` (0–100) to control it, or leave it out to simulate a load.

const STYLE_ID = 'bl-pixel-loader-tw';
const CSS = `
@keyframes bl-loader-spin { to { transform: rotate(360deg); } }
@keyframes bl-loader-pop { 50% { filter: brightness(1.8); transform: scaleY(1.2); } }
@keyframes bl-loader-flash { 50% { opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const DEFAULT_TIPS = [
  'Tip: torches keep the dark at bay.',
  'Tip: you can stack up to 64 blocks in one slot.',
  'Tip: save before you cross the lava.',
  'Tip: night falls faster in the desert.'
];

export interface PixelLoaderProps {
  /** 0–100. Leave undefined to simulate a load. */
  progress?: number;
  label?: string;
  /** Title shown when progress reaches 100. */
  doneLabel?: string;
  /** Rotating tips under the bar; empty to hide. */
  tips?: string[];
  /** Time per tip, in ms. */
  tipInterval?: number;
  /** Number of chunks in the bar. */
  chunks?: number;
  /** Max width, in px. */
  width?: number;
  accentColor?: string;
  frameColor?: string;
  textColor?: string;
  mutedColor?: string;
  /** Rough length of a simulated load, in ms. */
  simulateDuration?: number;
  /** Restart a simulated load after COMPLETE. */
  loop?: boolean;
  /** Show the percent and chunk count. */
  showPercent?: boolean;
  fontFamily?: string;
  /** Called when progress reaches 100. */
  onComplete?: () => void;
  className?: string;
  style?: CSSProperties;
}

export default function PixelLoader({
  progress,
  label = 'Loading',
  doneLabel = 'Complete!',
  tips = DEFAULT_TIPS,
  tipInterval = 3200,
  chunks = 20,
  width = 440,
  accentColor = '#a7f070',
  frameColor = '#566c86',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  simulateDuration = 6000,
  loop = true,
  showPercent = true,
  fontFamily,
  onComplete,
  className = '',
  style
}: PixelLoaderProps) {
  useStyles();
  const controlled = typeof progress === 'number';
  const [simulated, setSimulated] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const lastChunks = useRef(0);
  const value = Math.min(100, Math.max(0, controlled ? progress! : simulated));
  const done = value >= 100;

  // Simulated loads move in uneven bursts, like a real asset loader.
  useEffect(() => {
    if (controlled) return undefined;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setSimulated(current => (current >= 100 ? 100 : Math.min(100, current + Math.random() * (1600 / simulateDuration) * 12)));
      timer = setTimeout(tick, 120 + Math.random() * 260);
    };
    timer = setTimeout(tick, 300);
    return () => clearTimeout(timer);
  }, [controlled, simulateDuration]);

  // Hold on COMPLETE for a moment before a looping simulation starts over.
  useEffect(() => {
    if (controlled || !loop || !done) return undefined;
    const timer = setTimeout(() => setSimulated(0), 1800);
    return () => clearTimeout(timer);
  }, [controlled, loop, done]);

  useEffect(() => {
    if (done) onComplete?.();
  }, [done, onComplete]);

  useEffect(() => {
    if (tips.length < 2) return undefined;
    const timer = setInterval(() => setTipIndex(index => (index + 1) % tips.length), tipInterval);
    return () => clearInterval(timer);
  }, [tips.length, tipInterval]);

  const filled = Math.round((value / 100) * chunks);
  const previous = lastChunks.current;
  lastChunks.current = filled;

  return (
    <div
      className={`group/loader grid w-[min(var(--bl-width),100%)] justify-items-center gap-[18px] [font-family:var(--bl-font,'Press_Start_2P',ui-monospace,monospace)] text-(--bl-text) uppercase ${className}`}
      data-done={done || undefined}
      style={{
        '--bl-width': `${width}px`,
        '--bl-accent': accentColor,
        '--bl-frame': frameColor,
        '--bl-text': textColor,
        '--bl-muted': mutedColor,
        '--bl-chunks': chunks,
        ...(fontFamily ? { '--bl-font': fontFamily } : null),
        ...style
      } as CSSVars}
    >
      <div className="flex items-center gap-3.5 text-[14px] group-data-[done]/loader:animate-[bl-loader-flash_120ms_steps(1)_6] group-data-[done]/loader:text-(--bl-accent) motion-reduce:group-data-[done]/loader:animate-none" aria-hidden="true">
        {!done && (
          <span className="relative size-6 animate-[bl-loader-spin_0.8s_steps(8)_infinite] motion-reduce:animate-none *:absolute *:top-0 *:left-2.5 *:size-1 *:origin-[2px_12px] *:bg-(--bl-accent)">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} style={{ transform: `rotate(${i * 45}deg)`, opacity: 0.25 + (i / 8) * 0.75 }} />
            ))}
          </span>
        )}
        <span>{done ? doneLabel : `${label}…`}</span>
      </div>
      <div
        className="grid w-full grid-cols-[repeat(var(--bl-chunks),1fr)] gap-[3px] bg-[#0b0b14] p-1.5 shadow-[0_0_0_3px_var(--bl-frame)]"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
      >
        {Array.from({ length: chunks }, (_, i) => (
          <span key={i} className="h-[18px] bg-[#1a1c2c] data-[new]:animate-[bl-loader-pop_160ms_steps(2)] data-[on]:bg-(--bl-accent) data-[on]:shadow-[inset_0_-5px_0_0_rgba(0,0,0,0.22),inset_0_4px_0_0_rgba(255,255,255,0.25)] motion-reduce:data-[new]:animate-none" data-on={i < filled || undefined} data-new={(i < filled && i >= previous) || undefined} />
        ))}
      </div>
      {showPercent && (
        <div className="flex w-full justify-between text-[9px] text-(--bl-muted)" aria-hidden="true">
          <span>{Math.round(value)}%</span>
          <span>
            {filled}/{chunks} chunks
          </span>
        </div>
      )}
      {tips.length > 0 && (
        <p className="min-h-[3em] max-w-[46ch] [font-family:var(--bl-tip-font,ui-monospace,monospace)] text-center text-[14px] leading-[1.5] text-(--bl-muted) normal-case" aria-live="polite">
          {tips[tipIndex % tips.length]}
        </p>
      )}
    </div>
  );
}
