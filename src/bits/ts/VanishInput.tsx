import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Search / prompt input with rotating placeholder suggestions. On submit, the typed text is
// redrawn on a canvas, broken into square particles that drift away from the end of the text
// to the start, and the field clears for the next entry. Enter or the button submits.

const STYLE_ID = 'bl-vanish';
const CSS = `
/* theme tokens */
.bl-vanish { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: rgba(255,255,255,0.12); --bl-accent: #73eff7; --bl-accent-ink: #0b0b14; }
:where(.light, [data-theme="light"]) .bl-vanish, .bl-vanish:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: rgba(26,28,44,0.12); --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-vanish, :where(.light, [data-theme="light"]) .bl-vanish:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: rgba(255,255,255,0.12); --bl-accent: #73eff7; --bl-accent-ink: #0b0b14; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-vanish, .bl-vanish:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: rgba(26,28,44,0.12); --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-vanish { position: relative; display: flex; align-items: center; width: 100%; max-width: var(--bl-w); height: var(--bl-h); border-radius: var(--bl-radius); background: var(--bl-bg); box-shadow: inset 0 0 0 1px var(--bl-line), 0 10px 30px -18px rgba(0,0,0,0.6); font-family: var(--bl-font); transition: box-shadow 160ms; }
.bl-vanish:focus-within { box-shadow: inset 0 0 0 1.5px var(--bl-accent), 0 0 0 4px var(--bl-ring); }
.bl-vanish__field { position: relative; flex: 1; min-width: 0; height: 100%; overflow: hidden; }
.bl-vanish__input { width: 100%; height: 100%; padding: 0 0 0 var(--bl-pad); border: 0; background: transparent; color: var(--bl-ink); font: inherit; font-size: var(--bl-size); outline: none; }
.bl-vanish[data-vanishing] .bl-vanish__input { color: transparent; }
.bl-vanish__placeholder { position: absolute; left: var(--bl-pad); right: 8px; top: 50%; color: var(--bl-muted); font-size: var(--bl-size); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; pointer-events: none; transform: translateY(-50%); animation: bl-vanish-in 420ms cubic-bezier(.2,.9,.25,1); }
@keyframes bl-vanish-in { from { opacity: 0; transform: translateY(calc(-50% + 12px)); } }
.bl-vanish__canvas { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.bl-vanish__submit { flex: 0 0 auto; display: grid; place-items: center; width: calc(var(--bl-h) - 12px); height: calc(var(--bl-h) - 12px); margin-right: 6px; border: 0; border-radius: calc(var(--bl-radius) - 4px); background: var(--bl-accent); color: var(--bl-accent-ink); cursor: pointer; transition: opacity 160ms, transform 160ms; }
.bl-vanish__submit:disabled { opacity: 0.35; cursor: default; }
.bl-vanish__submit:not(:disabled):hover { transform: scale(1.05); }
.bl-vanish__submit:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .bl-vanish__placeholder { animation: none; } .bl-vanish, .bl-vanish__submit { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export interface VanishInputProps {
  /** Suggestions that rotate while the field is empty. */
  placeholders?: string[];
  /** Time per placeholder, in ms. */
  interval?: number;
  /** Called with the trimmed text; the field then clears. */
  onSubmit?: (text: string) => void;
  onChange?: (text: string) => void;
  /** Accessible name of the field. */
  label?: string;
  /** Accessible name of the submit button. */
  submitLabel?: string;
  /** Particle size, in px. */
  particleSize?: number;
  /** Dissolve length, in ms. */
  duration?: number;
  width?: number;
  height?: number;
  radius?: number;
  fontSize?: number;
  /** Left text padding, in px. */
  padding?: number;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  accentColor?: string;
  accentTextColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_PLACEHOLDERS = ['Search for a component…', 'Try "pixel button"', 'Find a background', 'What are you building today?'];

export default function VanishInput({
  placeholders = DEFAULT_PLACEHOLDERS,
  interval = 3000,
  onSubmit,
  onChange,
  label = 'Search',
  submitLabel = 'Submit',
  particleSize = 2,
  duration = 900,
  width = 560,
  height = 52,
  radius = 26,
  fontSize = 16,
  padding = 20,
  backgroundColor,
  textColor,
  mutedColor,
  lineColor,
  accentColor,
  accentTextColor,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: VanishInputProps) {
  useStyles();
  const [value, setValue] = useState('');
  const [index, setIndex] = useState(0);
  const [vanishing, setVanishing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frame = useRef(0);

  useEffect(() => {
    if (placeholders.length < 2 || value) return undefined;
    const timer = setInterval(() => setIndex(i => (i + 1) % placeholders.length), interval);
    return () => clearInterval(timer);
  }, [placeholders.length, interval, value]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const vanish = (text: string) => {
    const input = inputRef.current!;
    const canvas = canvasRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = input.clientWidth;
    const h = input.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const computed = getComputedStyle(input);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
    ctx.fillStyle = computed.color;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, parseFloat(computed.paddingLeft) - input.scrollLeft, h / 2);

    // Sample the drawn text into square particles that keep their pixel's color.
    const step = Math.max(1, Math.round(particleSize * dpr));
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const particles: Particle[] = [];
    let maxX = 0;
    for (let y = 0; y < canvas.height; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        const i = (y * canvas.width + x) * 4;
        if (data[i + 3] < 100) continue;
        particles.push({ x: x / dpr, y: y / dpr, vx: 0, vy: 0, alpha: 1, color: `rgb(${data[i]},${data[i + 1]},${data[i + 2]})` });
        maxX = Math.max(maxX, x / dpr);
      }
    }
    const size = step / dpr;
    const start = performance.now();
    // The end of the text breaks up first, sweeping back to the start.
    const sweep = duration * 0.55;
    const tick = (now: number) => {
      const t = now - start;
      ctx.clearRect(0, 0, w, h);
      let alive = 0;
      for (const p of particles) {
        if (p.alpha <= 0) continue;
        alive++;
        const released = t > ((maxX - p.x) / Math.max(1, maxX)) * sweep;
        if (released) {
          if (!p.vx) {
            p.vx = 0.6 + Math.random() * 1.6;
            p.vy = (Math.random() - 0.5) * 1.6;
          }
          p.x += p.vx;
          p.y += p.vy;
          p.alpha -= 0.02 + Math.random() * 0.03;
        }
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, size, size);
      }
      ctx.globalAlpha = 1;
      if (alive && t < duration * 2) frame.current = requestAnimationFrame(tick);
      else {
        ctx.clearRect(0, 0, w, h);
        setVanishing(false);
      }
    };
    setVanishing(true);
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(tick);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = value.trim();
    if (!text || vanishing) return;
    vanish(value);
    onSubmit?.(text);
    setValue('');
    onChange?.('');
  };

  return (
    <form
      className={`bl-vanish ${className}`}
      role="search"
      data-vanishing={vanishing || undefined}
      onSubmit={submit}
      style={{
        '--bl-w': `${width}px`,
        '--bl-h': `${height}px`,
        '--bl-radius': `${radius}px`,
        '--bl-size': `${fontSize}px`,
        '--bl-pad': `${padding}px`,
        '--bl-bg': backgroundColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-accent-ink': accentTextColor,
        '--bl-ring': 'color-mix(in srgb, var(--bl-accent) 22%, transparent)',
        '--bl-font': fontFamily,
        ...style
      } as CSSVars}
    >
      <div className="bl-vanish__field">
        <input
          ref={inputRef}
          className="bl-vanish__input"
          type="text"
          value={value}
          onChange={event => {
            setValue(event.target.value);
            onChange?.(event.target.value);
          }}
          aria-label={label}
          autoComplete="off"
          enterKeyHint="send"
        />
        {!value && !vanishing && placeholders.length > 0 && (
          <span key={index} className="bl-vanish__placeholder" aria-hidden="true">
            {placeholders[index % placeholders.length]}
          </span>
        )}
        <canvas ref={canvasRef} className="bl-vanish__canvas" aria-hidden="true" />
      </div>
      <button type="submit" className="bl-vanish__submit" disabled={!value.trim() || vanishing} aria-label={submitLabel}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </button>
    </form>
  );
}
