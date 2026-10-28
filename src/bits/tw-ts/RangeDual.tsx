import { useId, useRef, useState, type CSSProperties, type PointerEvent, type KeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A two-thumb range slider for filters like price. A histogram behind the track shows where
// the data sits, and the bars inside your range light up. Drag either thumb, drag the
// selected stretch to move both, or click the track to bring the nearest thumb over. Value
// bubbles show while you hover, drag or focus. Each thumb is a keyboard slider, and optional
// number fields edit the ends directly.

export type Ends = [number, number];

export interface RangeDualProps {
  min?: number;
  max?: number;
  step?: number;
  value?: Ends;
  defaultValue?: Ends;
  onValueChange?: (value: Ends) => void;
  /** Smallest allowed distance between the ends. */
  minGap?: number;
  /** Bin counts drawn behind the track. */
  histogram?: number[];
  /** Text for bubbles, labels and screen readers. */
  format?: (value: number) => string;
  label?: string;
  showInputs?: boolean;
  showScale?: boolean;
  width?: number;
  thumbSize?: number;
  histogramHeight?: number;
  backgroundColor?: string;
  fieldColor?: string;
  textColor?: string;
  mutedColor?: string;
  dimColor?: string;
  trackColor?: string;
  lineColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

type Which = 0 | 1 | 'both';

export default function RangeDual({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onValueChange,
  minGap = 0,
  histogram,
  format = (v: number) => String(v),
  label = 'Range',
  showInputs = true,
  showScale = true,
  width = 460,
  thumbSize = 22,
  histogramHeight = 56,
  backgroundColor = '#1a1c2c',
  fieldColor = '#0b0b14',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  dimColor = '#566c86',
  trackColor = '#333c57',
  lineColor = '#333c57',
  accentColor = '#73eff7',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: RangeDualProps) {
  
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState<Ends>(defaultValue ?? [min, max]);
  const [lo, hi] = value ?? inner;
  const [active, setActive] = useState<Which | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string> | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ which: Which; start: number; lo: number; hi: number } | null>(null);

  const span = Math.max(1e-9, max - min);
  const snap = (v: number) => {
    const snapped = Math.round((v - min) / step) * step + min;
    return Math.max(min, Math.min(max, Number(snapped.toFixed(10))));
  };
  const commit = (a: number, b: number) => {
    const next: Ends = [a, b];
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  // Moves one end, respecting the other end and the minimum gap.
  const setEnd = (which: 0 | 1, raw: number) => {
    const v = snap(raw);
    if (which === 0) commit(Math.min(v, hi - minGap), hi);
    else commit(lo, Math.max(v, lo + minGap));
  };

  const valueAt = (clientX: number) => {
    const rect = trackRef.current!.getBoundingClientRect();
    const usable = rect.width - thumbSize;
    return min + Math.max(0, Math.min(1, (clientX - rect.left - thumbSize / 2) / usable)) * span;
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const v = valueAt(event.clientX);
    const onFill = (event.target as Element).classList.contains('bl-range__fill');
    // The nearest thumb takes the press; with both thumbs together, the side you pressed decides.
    const nearest = lo === hi ? (v > lo ? 1 : 0) : Math.abs(v - lo) <= Math.abs(v - hi) ? 0 : 1;
    const which: Which = onFill ? 'both' : nearest;
    drag.current = { which, start: v, lo, hi };
    setActive(which);
    try {
      trackRef.current!.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic pointers can't be captured; the track still receives the moves.
    }
    if (which !== 'both') setEnd(which, v);
    trackRef.current!.querySelectorAll<HTMLElement>('.bl-range__thumb')[which === 'both' ? 0 : which]?.focus({ preventScroll: true });
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const v = valueAt(event.clientX);
    if (d.which === 'both') {
      // Slide the whole selection, keeping its width and staying inside the bounds.
      const shift = Math.max(min - d.lo, Math.min(max - d.hi, v - d.start));
      const nextLo = snap(d.lo + shift);
      commit(nextLo, nextLo + (d.hi - d.lo));
    } else setEnd(d.which, v);
  };

  const endDrag = () => {
    drag.current = null;
    setActive(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLSpanElement>, which: 0 | 1) => {
    const big = Math.max(step, (max - min) / 10);
    const current = which === 0 ? lo : hi;
    const moves: Record<string, number> = { ArrowRight: step, ArrowUp: step, ArrowLeft: -step, ArrowDown: -step, PageUp: big, PageDown: -big };
    let next: number;
    if (event.key in moves) next = current + moves[event.key];
    else if (event.key === 'Home') next = which === 0 ? min : lo + minGap;
    else if (event.key === 'End') next = which === 0 ? hi - minGap : max;
    else return;
    event.preventDefault();
    setEnd(which, next);
  };

  const p = (v: number) => (v - min) / span;
  const bins = histogram ?? [];
  const peak = Math.max(1, ...bins);

  const thumb = (which: 0 | 1) => {
    const v = which === 0 ? lo : hi;
    return (
      <span
        className="bl-range__thumb group/thumb absolute top-0 left-[calc(var(--p)*(100%_-_var(--bl-thumb)))] box-border size-(--bl-thumb) rounded-[50%] bg-(--bl-ink) shadow-[0_0_0_3px_var(--bl-accent),0_4px_12px_rgba(0,0,0,0.4)] outline-none [transition:transform_140ms_cubic-bezier(.3,1.6,.5,1)] focus-visible:shadow-[0_0_0_3px_var(--bl-accent),0_0_0_7px_color-mix(in_srgb,var(--bl-accent)_35%,transparent)] data-[active]:z-2 data-[active]:[transform:scale(1.18)] motion-reduce:[transition:none]"
        role="slider"
        tabIndex={0}
        aria-label={which === 0 ? `${label} minimum` : `${label} maximum`}
        aria-valuemin={which === 0 ? min : lo + minGap}
        aria-valuemax={which === 0 ? hi - minGap : max}
        aria-valuenow={v}
        aria-valuetext={format(v)}
        data-active={active === which || active === 'both' || undefined}
        style={{ '--p': p(v) } as CSSVars}
        onKeyDown={event => onKeyDown(event, which)}
      >
        <span className="pointer-events-none absolute bottom-[calc(100%_+_10px)] left-1/2 rounded-[6px] bg-(--bl-ink) px-2 py-[3px] text-[12px] font-bold whitespace-nowrap text-(--bl-bg) tabular-nums opacity-0 [transform:translate(-50%,4px)_scale(0.85)] [transition:opacity_120ms,transform_180ms_cubic-bezier(.3,1.6,.5,1)] after:absolute after:top-full after:left-1/2 after:border-4 after:border-solid after:border-transparent after:border-t-(--bl-ink) after:[transform:translateX(-50%)] group-hover/track:opacity-100 group-hover/track:[transform:translate(-50%,0)_scale(1)] group-focus-visible/thumb:opacity-100 group-focus-visible/thumb:[transform:translate(-50%,0)_scale(1)] group-data-[active]/thumb:opacity-100 group-data-[active]/thumb:[transform:translate(-50%,0)_scale(1)] motion-reduce:[transition:none]" aria-hidden="true">
          {format(v)}
        </span>
      </span>
    );
  };

  const field = (which: 0 | 1, name: string) => (
    <label>
      {name}
      <input
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={drafts?.[which] ?? (which === 0 ? lo : hi)}
        onChange={event => setDrafts(d => ({ ...(d ?? {}), [which]: event.target.value }))}
        onBlur={event => {
          if (event.target.value !== '') setEnd(which, Number(event.target.value));
          setDrafts(null);
        }}
        onKeyDown={event => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        aria-describedby={`${uid}-label`}
      />
    </label>
  );

  return (
    <div
      className={`group/range w-full max-w-(--bl-w) pt-[34px] font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      role="group"
      aria-labelledby={`${uid}-label`}
      data-dragging={active ?? undefined}
      style={{
        '--bl-w': `${width}px`,
        '--bl-thumb': `${thumbSize}px`,
        '--bl-hist-h': `${histogramHeight}px`,
        '--bl-lo': p(lo),
        '--bl-hi': p(hi),
        '--bl-bg': backgroundColor,
        '--bl-field': fieldColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-dim': dimColor,
        '--bl-track': trackColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-font': fontFamily,
        ...style
      } as CSSVars}
    >
      <span id={`${uid}-label`} className="-mt-[34px] mb-[18px] block text-[13px] font-semibold text-(--bl-muted)">
        {label}: {format(lo)} – {format(hi)}
      </span>
      {bins.length > 0 && (
        <div className="flex h-(--bl-hist-h) items-end gap-0.5 px-[calc(var(--bl-thumb)/2)]" aria-hidden="true">
          {bins.map((count, i) => {
            const binLo = min + (i / bins.length) * span;
            const binHi = min + ((i + 1) / bins.length) * span;
            return <span key={i} className="min-h-[2px] flex-1 rounded-t-[3px] bg-(--bl-dim) transition-[background-color] duration-160 ease-[ease] data-[in]:bg-(--bl-accent) data-[in]:opacity-55 motion-reduce:transition-none" data-in={(binHi > lo && binLo < hi) || undefined} style={{ height: `${(count / peak) * 100}%` }} />;
          })}
        </div>
      )}
      <div ref={trackRef} className="group/track relative m-0 h-(--bl-thumb) cursor-pointer touch-none" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <div className="absolute top-1/2 right-[calc(var(--bl-thumb)/2)] left-[calc(var(--bl-thumb)/2)] -mt-[3px] h-1.5 rounded-full bg-(--bl-track)">
          <div className="bl-range__fill absolute top-0 right-[calc((1_-_var(--bl-hi))*100%)] bottom-0 left-[calc(var(--bl-lo)*100%)] cursor-grab rounded-[inherit] bg-(--bl-accent) group-data-[dragging=both]/range:cursor-grabbing" />
        </div>
        {thumb(0)}
        {thumb(1)}
      </div>
      {showScale && (
        <div className="mt-2 flex justify-between text-[12px] text-(--bl-dim)" aria-hidden="true">
          <span>{format(min)}</span>
          <span>{format(max)}</span>
        </div>
      )}
      {showInputs && (
        <div className="mt-3.5 flex items-center gap-2.5 [&_label]:grid [&_label]:flex-1 [&_label]:gap-1 [&_label]:text-[12px] [&_label]:text-(--bl-muted) [&_input]:box-border [&_input]:h-9 [&_input]:rounded-[10px] [&_input]:border-0 [&_input]:bg-(--bl-field) [&_input]:px-2.5 [&_input]:text-[14px] [&_input]:text-(--bl-ink) [&_input]:tabular-nums [&_input]:shadow-[inset_0_0_0_1px_var(--bl-line)] [&_input]:outline-none [&_input:focus]:shadow-[inset_0_0_0_2px_var(--bl-accent)]">
          {field(0, 'Minimum')}
          <span className="mt-[18px] text-(--bl-dim)" aria-hidden="true">
            –
          </span>
          {field(1, 'Maximum')}
        </div>
      )}
    </div>
  );
}
