import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Search / prompt input with rotating placeholder suggestions. On submit, the typed text is
// redrawn on a canvas, broken into square particles that drift away from the end of the text
// to the start, and the field clears for the next entry. Enter or the button submits.

const STYLE_ID = 'bl-vanish-tw';
const CSS = `
@keyframes bl-vanish-in { from { opacity: 0; transform: translateY(calc(-50% + 12px)); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
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
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = 'rgba(255,255,255,0.12)',
  accentColor = '#73eff7',
  accentTextColor = '#0b0b14',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const [value, setValue] = useState('');
  const [index, setIndex] = useState(0);
  const [vanishing, setVanishing] = useState(false);
  const inputRef = useRef(null);
  const canvasRef = useRef(null);
  const frame = useRef(0);

  useEffect(() => {
    if (placeholders.length < 2 || value) return undefined;
    const timer = setInterval(() => setIndex(i => (i + 1) % placeholders.length), interval);
    return () => clearInterval(timer);
  }, [placeholders.length, interval, value]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const vanish = text => {
    const input = inputRef.current;
    const canvas = canvasRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !canvas) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = input.clientWidth;
    const h = input.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const computed = getComputedStyle(input);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
    ctx.fillStyle = textColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, parseFloat(computed.paddingLeft) - input.scrollLeft, h / 2);

    // Sample the drawn text into square particles that keep their pixel's color.
    const step = Math.max(1, Math.round(particleSize * dpr));
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const particles = [];
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
    const tick = now => {
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

  const submit = event => {
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
      className={`group/vanish relative flex h-(--bl-h) w-full max-w-(--bl-w) items-center rounded-(--bl-radius) bg-(--bl-bg) font-(family-name:--bl-font) shadow-[inset_0_0_0_1px_var(--bl-line),0_10px_30px_-18px_rgba(0,0,0,0.6)] transition-shadow duration-160 ease-[ease] focus-within:shadow-[inset_0_0_0_1.5px_var(--bl-accent),0_0_0_4px_var(--bl-ring)] motion-reduce:transition-none ${className}`}
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
        '--bl-ring': `color-mix(in srgb, ${accentColor} 22%, transparent)`,
        '--bl-font': fontFamily,
        ...style
      }}
    >
      <div className="relative h-full min-w-0 flex-1 overflow-hidden">
        <input
          ref={inputRef}
          className="h-full w-full border-0 bg-transparent py-0 pr-0 pl-(--bl-pad) text-(length:--bl-size) text-(--bl-ink) outline-none group-data-[vanishing]/vanish:text-transparent"
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
          <span key={index} className="pointer-events-none absolute top-1/2 right-2 left-(--bl-pad) animate-[bl-vanish-in_420ms_cubic-bezier(.2,.9,.25,1)] overflow-hidden text-(length:--bl-size) text-ellipsis whitespace-nowrap text-(--bl-muted) [transform:translateY(-50%)] motion-reduce:animate-none" aria-hidden="true">
            {placeholders[index % placeholders.length]}
          </span>
        )}
        <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true" />
      </div>
      <button type="submit" className="mr-1.5 grid size-[calc(var(--bl-h)_-_12px)] flex-none cursor-pointer place-items-center rounded-[calc(var(--bl-radius)_-_4px)] border-0 bg-(--bl-accent) text-(--bl-accent-ink) [transition:opacity_160ms,transform_160ms] not-disabled:hover:[transform:scale(1.05)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) disabled:cursor-default disabled:opacity-35 motion-reduce:[transition:none]" disabled={!value.trim() || vanishing} aria-label={submitLabel}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </button>
    </form>
  );
}
