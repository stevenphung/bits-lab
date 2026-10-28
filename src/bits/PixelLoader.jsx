import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Retro loading screen: chunked progress bar, pixel spinner, rotating tips and a COMPLETE flash.
// Pass `progress` (0–100) to control it, or leave it out to simulate a load.

const STYLE_ID = 'bl-pixel-loader';
const CSS = `
/* theme tokens */
.bl-loader { --bl-accent: #a7f070; --bl-frame: #566c86; --bl-text: #f4f4f4; --bl-muted: #94b0c2; }
:where(.light, [data-theme="light"]) .bl-loader, .bl-loader:where(.light, [data-theme="light"]) { --bl-accent: #2f7d22; --bl-frame: #8a96a3; --bl-text: #1a1c2c; --bl-muted: #566c86; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-loader, :where(.light, [data-theme="light"]) .bl-loader:where(.dark, [data-theme="dark"]) { --bl-accent: #a7f070; --bl-frame: #566c86; --bl-text: #f4f4f4; --bl-muted: #94b0c2; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-loader, .bl-loader:where([data-theme="system"]) { --bl-accent: #2f7d22; --bl-frame: #8a96a3; --bl-text: #1a1c2c; --bl-muted: #566c86; } }
/* theme tokens end */
.bl-loader { display: grid; justify-items: center; gap: 18px; width: min(var(--bl-width), 100%); color: var(--bl-text); font-family: var(--bl-font, "Press Start 2P", ui-monospace, monospace); text-transform: uppercase; }
.bl-loader__title { display: flex; align-items: center; gap: 14px; font-size: 14px; }
.bl-loader__spinner { position: relative; width: 24px; height: 24px; animation: bl-loader-spin 0.8s steps(8) infinite; }
.bl-loader__spinner i { position: absolute; left: 10px; top: 0; width: 4px; height: 4px; background: var(--bl-accent); transform-origin: 2px 12px; }
.bl-loader__bar { display: grid; grid-template-columns: repeat(var(--bl-chunks), 1fr); gap: 3px; width: 100%; padding: 6px; background: #0b0b14; box-shadow: 0 0 0 3px var(--bl-frame); }
.bl-loader__chunk { height: 18px; background: #1a1c2c; }
.bl-loader__chunk[data-on] { background: var(--bl-accent); box-shadow: inset 0 -5px 0 0 rgba(0, 0, 0, 0.22), inset 0 4px 0 0 rgba(255, 255, 255, 0.25); }
.bl-loader__chunk[data-new] { animation: bl-loader-pop 160ms steps(2); }
.bl-loader__meta { display: flex; justify-content: space-between; width: 100%; font-size: 9px; color: var(--bl-muted); }
.bl-loader__tip { min-height: 3em; max-width: 46ch; font-family: var(--bl-tip-font, ui-monospace, monospace); font-size: 14px; line-height: 1.5; text-transform: none; text-align: center; color: var(--bl-muted); }
.bl-loader[data-done] .bl-loader__title { animation: bl-loader-flash 120ms steps(1) 6; color: var(--bl-accent); }
@keyframes bl-loader-spin { to { transform: rotate(360deg); } }
@keyframes bl-loader-pop { 50% { filter: brightness(1.8); transform: scaleY(1.2); } }
@keyframes bl-loader-flash { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .bl-loader__spinner, .bl-loader__chunk[data-new], .bl-loader[data-done] .bl-loader__title { animation: none; }
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

const DEFAULT_TIPS = [
  'Tip: torches keep the dark at bay.',
  'Tip: you can stack up to 64 blocks in one slot.',
  'Tip: save before you cross the lava.',
  'Tip: night falls faster in the desert.'
];

export default function PixelLoader({
  progress,
  label = 'Loading',
  doneLabel = 'Complete!',
  tips = DEFAULT_TIPS,
  tipInterval = 3200,
  chunks = 20,
  width = 440,
  accentColor,
  frameColor,
  textColor,
  mutedColor,
  simulateDuration = 6000,
  loop = true,
  showPercent = true,
  fontFamily,
  onComplete,
  className = '',
  style
}) {
  useStyles();
  const controlled = typeof progress === 'number';
  const [simulated, setSimulated] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const lastChunks = useRef(0);
  const value = Math.min(100, Math.max(0, controlled ? progress : simulated));
  const done = value >= 100;

  // Simulated loads move in uneven bursts, like a real asset loader.
  useEffect(() => {
    if (controlled) return undefined;
    let timer;
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
      className={`bl-loader ${className}`}
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
      }}
    >
      <div className="bl-loader__title" aria-hidden="true">
        {!done && (
          <span className="bl-loader__spinner">
            {Array.from({ length: 8 }, (_, i) => (
              <i key={i} style={{ transform: `rotate(${i * 45}deg)`, opacity: 0.25 + (i / 8) * 0.75 }} />
            ))}
          </span>
        )}
        <span>{done ? doneLabel : `${label}…`}</span>
      </div>
      <div
        className="bl-loader__bar"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(value)}
      >
        {Array.from({ length: chunks }, (_, i) => (
          <span key={i} className="bl-loader__chunk" data-on={i < filled || undefined} data-new={(i < filled && i >= previous) || undefined} />
        ))}
      </div>
      {showPercent && (
        <div className="bl-loader__meta" aria-hidden="true">
          <span>{Math.round(value)}%</span>
          <span>
            {filled}/{chunks} chunks
          </span>
        </div>
      )}
      {tips.length > 0 && (
        <p className="bl-loader__tip" aria-live="polite">
          {tips[tipIndex % tips.length]}
        </p>
      )}
    </div>
  );
}
