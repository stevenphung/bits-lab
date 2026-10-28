import { useId, useInsertionEffect, useRef, useState, type CSSProperties, type PointerEvent, type KeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

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

const STYLE_ID = 'bl-range-dual';
const CSS = `
.bl-range { width: 100%; max-width: var(--bl-w); padding-top: 34px; font-family: var(--bl-font); color: var(--bl-ink); }
.bl-range__label { display: block; margin: -34px 0 18px; color: var(--bl-muted); font-size: 13px; font-weight: 600; }
.bl-range__hist { display: flex; align-items: flex-end; gap: 2px; height: var(--bl-hist-h); padding: 0 calc(var(--bl-thumb) / 2); }
.bl-range__bar { flex: 1; min-height: 2px; border-radius: 3px 3px 0 0; background: var(--bl-dim); transition: background-color 160ms; }
.bl-range__bar[data-in] { background: var(--bl-accent); opacity: 0.55; }
.bl-range__track { position: relative; height: var(--bl-thumb); margin: 0; touch-action: none; cursor: pointer; }
.bl-range__rail { position: absolute; left: calc(var(--bl-thumb) / 2); right: calc(var(--bl-thumb) / 2); top: 50%; height: 6px; margin-top: -3px; border-radius: 999px; background: var(--bl-track); }
.bl-range__fill { position: absolute; top: 0; bottom: 0; left: calc(var(--bl-lo) * 100%); right: calc((1 - var(--bl-hi)) * 100%); border-radius: inherit; background: var(--bl-accent); cursor: grab; }
.bl-range[data-dragging="both"] .bl-range__fill { cursor: grabbing; }
.bl-range__thumb { position: absolute; top: 0; left: calc(var(--p) * (100% - var(--bl-thumb))); width: var(--bl-thumb); height: var(--bl-thumb); box-sizing: border-box; border-radius: 50%; background: var(--bl-ink); box-shadow: 0 0 0 3px var(--bl-accent), 0 4px 12px rgba(0,0,0,0.4); outline: none; transition: transform 140ms cubic-bezier(.3,1.6,.5,1); }
.bl-range__thumb:focus-visible { box-shadow: 0 0 0 3px var(--bl-accent), 0 0 0 7px color-mix(in srgb, var(--bl-accent) 35%, transparent); }
.bl-range__thumb[data-active] { transform: scale(1.18); z-index: 2; }
.bl-range__tip { position: absolute; left: 50%; bottom: calc(100% + 10px); padding: 3px 8px; border-radius: 6px; background: var(--bl-ink); color: var(--bl-bg); font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; transform: translate(-50%, 4px) scale(0.85); opacity: 0; pointer-events: none; transition: opacity 120ms, transform 180ms cubic-bezier(.3,1.6,.5,1); }
.bl-range__tip::after { content: ""; position: absolute; left: 50%; top: 100%; border: 4px solid transparent; border-top-color: var(--bl-ink); transform: translateX(-50%); }
.bl-range__track:hover .bl-range__tip, .bl-range__thumb:focus-visible .bl-range__tip, .bl-range__thumb[data-active] .bl-range__tip { opacity: 1; transform: translate(-50%, 0) scale(1); }
.bl-range__scale { display: flex; justify-content: space-between; margin-top: 8px; color: var(--bl-dim); font-size: 12px; }
.bl-range__inputs { display: flex; align-items: center; gap: 10px; margin-top: 14px; }
.bl-range__inputs label { display: grid; flex: 1; gap: 4px; color: var(--bl-muted); font-size: 12px; }
.bl-range__inputs input { height: 36px; padding: 0 10px; box-sizing: border-box; border: 0; border-radius: 10px; background: var(--bl-field); color: var(--bl-ink); font: inherit; font-size: 14px; font-variant-numeric: tabular-nums; box-shadow: inset 0 0 0 1px var(--bl-line); outline: none; }
.bl-range__inputs input:focus { box-shadow: inset 0 0 0 2px var(--bl-accent); }
.bl-range__dash { margin-top: 18px; color: var(--bl-dim); }
@media (prefers-reduced-motion: reduce) { .bl-range__thumb, .bl-range__tip, .bl-range__bar { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

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
  useStyles();
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
        className="bl-range__thumb"
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
        <span className="bl-range__tip" aria-hidden="true">
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
      className={`bl-range ${className}`}
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
      <span id={`${uid}-label`} className="bl-range__label">
        {label}: {format(lo)} – {format(hi)}
      </span>
      {bins.length > 0 && (
        <div className="bl-range__hist" aria-hidden="true">
          {bins.map((count, i) => {
            const binLo = min + (i / bins.length) * span;
            const binHi = min + ((i + 1) / bins.length) * span;
            return <span key={i} className="bl-range__bar" data-in={(binHi > lo && binLo < hi) || undefined} style={{ height: `${(count / peak) * 100}%` }} />;
          })}
        </div>
      )}
      <div ref={trackRef} className="bl-range__track" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
        <div className="bl-range__rail">
          <div className="bl-range__fill" />
        </div>
        {thumb(0)}
        {thumb(1)}
      </div>
      {showScale && (
        <div className="bl-range__scale" aria-hidden="true">
          <span>{format(min)}</span>
          <span>{format(max)}</span>
        </div>
      )}
      {showInputs && (
        <div className="bl-range__inputs">
          {field(0, 'Minimum')}
          <span className="bl-range__dash" aria-hidden="true">
            –
          </span>
          {field(1, 'Maximum')}
        </div>
      )}
    </div>
  );
}
