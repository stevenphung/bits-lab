import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent, type KeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A color picker built around a hue ring with a saturation/brightness square inside it.
// Drag either one (or use the keyboard: each is a slider, the square moves on both axes),
// type a hex code, pick a swatch, or sample from the screen with the eyedropper where the
// browser supports it. Hue is kept while you drag through greys, so it never jumps to red.

declare global {
  interface Window {
    EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> };
  }
}

export type RGB = [number, number, number];

export interface HSV {
  h: number;
  s: number;
  v: number;
}

export interface ColorDialProps {
  /** Hex color; always emitted as #rrggbb. */
  value?: string;
  defaultValue?: string;
  onValueChange?: (hex: string) => void;
  swatches?: string[];
  size?: number;
  ringWidth?: number;
  /** Show the screen eyedropper where supported. */
  eyedropper?: boolean;
  label?: string;
  backgroundColor?: string;
  fieldColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  accentColor?: string;
  errorColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export function parseHex(text: string): RGB | null {
  const m = String(text).trim().replace(/^#/, '').match(/^([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const full = m[1].length === 3 ? m[1].replace(/./g, c => c + c) : m[1];
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const toHex = ([r, g, b]: number[]) => `#${[r, g, b].map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

export function hsvToRgb(h: number, s: number, v: number): RGB {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v * (1 - s * Math.max(0, Math.min(k, 4 - k, 1)));
  };
  return [f(5) * 255, f(3) * 255, f(1) * 255];
}

export function rgbToHsv([r, g, b]: number[]): HSV {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const d = max - Math.min(rn, gn, bn);
  let h = 0;
  if (d) h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4;
  return { h: (h * 60 + 360) % 360, s: max ? d / max : 0, v: max };
}

const DEFAULT_SWATCHES = ['#1a1c2c', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75', '#a7f070', '#38b764', '#257179', '#29366f', '#3b5dc9', '#41a6f6', '#73eff7', '#f4f4f4', '#94b0c2', '#566c86', '#333c57'];

export default function ColorDial({
  value,
  defaultValue = '#73eff7',
  onValueChange,
  swatches = DEFAULT_SWATCHES,
  size = 240,
  ringWidth = 22,
  eyedropper = true,
  label = 'Color',
  backgroundColor = '#1a1c2c',
  fieldColor = '#0b0b14',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = '#333c57',
  accentColor = '#73eff7',
  errorColor = '#ef7d57',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: ColorDialProps) {
  
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState(defaultValue);
  const hex = (value ?? inner).toLowerCase();
  const [hsv, setHsv] = useState<HSV>(() => rgbToHsv(parseHex(hex) ?? [0, 0, 0]));
  const [draft, setDraft] = useState(hex);
  const [dragging, setDragging] = useState<'ring' | 'square' | null>(null);
  const [canSample, setCanSample] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);
  const lastEmitted = useRef(hex);

  useEffect(() => setCanSample(eyedropper && typeof window !== 'undefined' && 'EyeDropper' in window), [eyedropper]);

  // Follow outside changes to the value, keeping our hue when the new color is grey.
  useEffect(() => {
    setDraft(hex);
    if (hex === lastEmitted.current) return;
    const rgb = parseHex(hex);
    if (!rgb) return;
    const next = rgbToHsv(rgb);
    setHsv(current => ({ h: next.s === 0 || next.v === 0 ? current.h : next.h, s: next.s, v: next.v }));
    lastEmitted.current = hex;
  }, [hex]);

  const emit = (next: HSV) => {
    setHsv(next);
    const out = toHex(hsvToRgb(next.h, next.s, next.v));
    lastEmitted.current = out;
    if (value === undefined) setInner(out);
    onValueChange?.(out);
  };

  // Set from an RGB color, keeping the current hue when the new color is grey.
  const emitRgb = (rgb: number[]) => {
    const next = rgbToHsv(rgb);
    emit({ h: next.s === 0 || next.v === 0 ? hsv.h : next.h, s: next.s, v: next.v });
  };

  // Geometry, in fractions of the wheel's width.
  const ringFrac = ringWidth / size;
  const innerR = 0.5 - ringFrac;
  const sq = Math.SQRT2 * innerR - 0.06;

  const fromPointer = (event: { clientX: number; clientY: number }, mode: 'ring' | 'square') => {
    const rect = wheelRef.current!.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    if (mode === 'ring') {
      const h = ((Math.atan2(y, x) * 180) / Math.PI + 90 + 360) % 360;
      emit({ ...hsv, h });
    } else {
      const s = Math.max(0, Math.min(1, (x + sq / 2) / sq));
      const v = Math.max(0, Math.min(1, 1 - (y + sq / 2) / sq));
      emit({ ...hsv, s, v });
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const rect = wheelRef.current!.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    const r = Math.hypot(x, y);
    const mode = r >= innerR - 0.01 && r <= 0.5 ? 'ring' : Math.abs(x) <= sq / 2 && Math.abs(y) <= sq / 2 ? 'square' : null;
    if (!mode) return;
    event.preventDefault();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointers can't be captured; the drag still tracks via the wheel.
    }
    setDragging(mode);
    fromPointer(event, mode);
    wheelRef.current!.querySelector<HTMLElement>(`[data-part="${mode}"]`)?.focus({ preventScroll: true });
  };

  const onRingKey = (event: KeyboardEvent<HTMLSpanElement>) => {
    const step = event.shiftKey ? 10 : 1;
    const delta = ({ ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step } as Record<string, number>)[event.key];
    if (delta === undefined && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const h = event.key === 'Home' ? 0 : event.key === 'End' ? 359 : (hsv.h + delta + 360) % 360;
    emit({ ...hsv, h });
  };

  const onSquareKey = (event: KeyboardEvent<HTMLSpanElement>) => {
    const step = event.shiftKey ? 0.1 : 0.01;
    const moves: Record<string, ['s' | 'v', number]> = { ArrowRight: ['s', step], ArrowLeft: ['s', -step], ArrowUp: ['v', step], ArrowDown: ['v', -step] };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    const [axis, delta] = move;
    emit({ ...hsv, [axis]: Math.max(0, Math.min(1, hsv[axis] + delta)) });
  };

  const commitDraft = () => {
    const rgb = parseHex(draft);
    if (rgb) emitRgb(rgb);
  };

  const sample = async () => {
    try {
      const result = await new window.EyeDropper().open();
      const rgb = parseHex(result.sRGBHex);
      if (rgb) emitRgb(rgb);
    } catch {
      // Cancelled.
    }
  };

  const angle = ((hsv.h - 90) * Math.PI) / 180;
  const ringR = 0.5 - ringFrac / 2;
  const valid = !!parseHex(draft);
  const pct = (n: number) => Math.round(n * 100);

  return (
    <div
      className={`group/dial grid w-[min(var(--bl-size),100%)] justify-items-center gap-3.5 font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      role="group"
      aria-label={label}
      data-dragging={dragging || undefined}
      style={{
        '--bl-size': `${size}px`,
        '--bl-ring': `${ringWidth}px`,
        '--bl-sq': `${sq * 100}%`,
        '--bl-h': hsv.h,
        '--bl-thumb': hex,
        '--bl-bg': backgroundColor,
        '--bl-field': fieldColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-error': errorColor,
        '--bl-font': fontFamily,
        ...style
      } as CSSVars}
    >
      <div
        ref={wheelRef}
        className="relative aspect-square w-full touch-none select-none"
        onPointerDown={onPointerDown}
        onPointerMove={event => dragging && fromPointer(event, dragging)}
        onPointerUp={() => setDragging(null)}
        onPointerCancel={() => setDragging(null)}
      >
        <div className="absolute inset-0 cursor-crosshair rounded-[50%] bg-[conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)] [mask:radial-gradient(farthest-side,transparent_calc(100%_-_var(--bl-ring)_-_1px),#000_calc(100%_-_var(--bl-ring)))]" aria-hidden="true" />
        <div className="absolute top-1/2 left-1/2 size-(--bl-sq) cursor-crosshair rounded-[8px] [background:linear-gradient(to_top,#000,transparent),linear-gradient(to_right,#fff,transparent),hsl(var(--bl-h)_100%_50%)] [transform:translate(-50%,-50%)]" aria-hidden="true" />
        <span
          className="absolute -mt-[9px] -ml-[9px] size-[18px] rounded-[50%] bg-(--bl-thumb) shadow-[0_0_0_3px_#fff,0_0_0_4px_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.4)] outline-none [transition:transform_140ms_cubic-bezier(.3,1.6,.5,1)] focus-visible:[transform:scale(1.25)] focus-visible:shadow-[0_0_0_3px_#fff,0_0_0_6px_var(--bl-accent)] group-data-[dragging]/dial:data-[active]:[transform:scale(1.25)] motion-reduce:[transition:none]"
          data-part="ring"
          data-active={dragging === 'ring' || undefined}
          role="slider"
          tabIndex={0}
          aria-label="Hue"
          aria-valuemin={0}
          aria-valuemax={359}
          aria-valuenow={Math.round(hsv.h)}
          aria-valuetext={`Hue ${Math.round(hsv.h)} degrees`}
          onKeyDown={onRingKey}
          style={{ left: `${(0.5 + Math.cos(angle) * ringR) * 100}%`, top: `${(0.5 + Math.sin(angle) * ringR) * 100}%`, background: `hsl(${hsv.h} 100% 50%)` }}
        />
        <span
          className="absolute -mt-[9px] -ml-[9px] size-[18px] rounded-[50%] bg-(--bl-thumb) shadow-[0_0_0_3px_#fff,0_0_0_4px_rgba(0,0,0,0.35),0_4px_10px_rgba(0,0,0,0.4)] outline-none [transition:transform_140ms_cubic-bezier(.3,1.6,.5,1)] focus-visible:[transform:scale(1.25)] focus-visible:shadow-[0_0_0_3px_#fff,0_0_0_6px_var(--bl-accent)] group-data-[dragging]/dial:data-[active]:[transform:scale(1.25)] motion-reduce:[transition:none]"
          data-part="square"
          data-active={dragging === 'square' || undefined}
          role="slider"
          tabIndex={0}
          aria-label="Saturation and brightness"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct(hsv.s)}
          aria-valuetext={`Saturation ${pct(hsv.s)}%, brightness ${pct(hsv.v)}%`}
          onKeyDown={onSquareKey}
          style={{ left: `${(0.5 - sq / 2 + hsv.s * sq) * 100}%`, top: `${(0.5 - sq / 2 + (1 - hsv.v) * sq) * 100}%` }}
        />
      </div>
      <div className="flex w-full items-center gap-2">
        <span className="size-9 flex-none rounded-[10px] bg-(--bl-thumb) shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]" aria-hidden="true" />
        <input
          className="box-border h-9 min-w-0 flex-1 rounded-[10px] border-0 bg-(--bl-field) px-2.5 font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[14px] text-inherit uppercase shadow-[inset_0_0_0_1px_var(--bl-line)] outline-none focus:shadow-[inset_0_0_0_2px_var(--bl-accent)] aria-invalid:shadow-[inset_0_0_0_2px_var(--bl-error)]"
          aria-label={`${label} hex code`}
          aria-invalid={!valid}
          spellCheck={false}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={event => event.key === 'Enter' && commitDraft()}
        />
        {canSample && (
          <button type="button" className="grid size-9 flex-none cursor-pointer place-items-center rounded-[10px] border-0 bg-(--bl-field) p-0 text-(--bl-muted) shadow-[inset_0_0_0_1px_var(--bl-line)] hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent)" aria-label="Pick a color from the screen" onClick={sample}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m9.5 3.5 3 3M11 2a1.4 1.4 0 0 1 2 0l1 1a1.4 1.4 0 0 1 0 2l-1.5 1.5-3-3zM8.5 4.5 2.8 10.2 2 14l3.8-.8 5.7-5.7" />
            </svg>
          </button>
        )}
      </div>
      {swatches.length > 0 && (
        <ul className="m-0 flex list-none flex-wrap justify-center gap-1.5 p-0" aria-label="Swatches" id={`${uid}-swatches`}>
          {swatches.map(swatch => (
            <li key={swatch}>
              <button
                type="button"
                className="size-6 cursor-pointer rounded-[7px] border-0 p-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)] [transition:transform_160ms_cubic-bezier(.3,1.6,.5,1)] hover:[transform:scale(1.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) aria-pressed:shadow-[0_0_0_2px_var(--bl-bg),0_0_0_4px_var(--bl-ink)] motion-reduce:[transition:none]"
                aria-label={swatch}
                aria-pressed={swatch.toLowerCase() === hex}
                style={{ background: swatch }}
                onClick={() => {
                  const rgb = parseHex(swatch);
                  if (rgb) emitRgb(rgb);
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
