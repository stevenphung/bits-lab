import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A date-range calendar. Click a start and an end (hovering previews the range), or pick a
// preset. Months slide in from the side you're heading toward. The grid works fully from
// the keyboard: arrows move by day and week, Home/End to the week's edges, Page Up/Down by
// month (with Shift, by year), Enter picks. Dates and weekdays follow the locale; min/max
// dates are disabled. Shows two months side by side, one on narrow screens.

export interface DateRangeValue {
  start: Date | null;
  end: Date | null;
}

export interface DatePreset {
  label: string;
  range: () => { start: Date; end: Date };
}

export interface DateRangeProps {
  value?: DateRangeValue;
  defaultValue?: DateRangeValue;
  onValueChange?: (range: DateRangeValue) => void;
  presets?: DatePreset[];
  /** Months side by side (one on narrow screens). */
  months?: number;
  minDate?: Date;
  maxDate?: Date;
  /** 0 = Sunday, 1 = Monday. */
  weekStartsOn?: number;
  /** Intl locale for month and weekday names. */
  locale?: string;
  label?: string;
  cellSize?: number;
  /** Container width (px) below which one month shows. */
  narrowAt?: number;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  dimColor?: string;
  hoverColor?: string;
  lineColor?: string;
  accentColor?: string;
  onAccentColor?: string;
  bandColor?: string;
  radius?: number;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

const STYLE_ID = 'bl-date-range';
const CSS = `
.bl-dr { display: flex; gap: 18px; width: fit-content; max-width: 100%; box-sizing: border-box; padding: 16px; border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); box-shadow: 0 0 0 1px var(--bl-line), 0 24px 50px -28px rgba(0,0,0,0.85); }
.bl-dr[data-narrow] { flex-direction: column; }
.bl-dr__presets { display: flex; flex-direction: column; gap: 2px; min-width: 130px; padding-right: 16px; box-shadow: 1px 0 0 var(--bl-line); }
.bl-dr[data-narrow] .bl-dr__presets { flex-direction: row; flex-wrap: wrap; min-width: 0; padding: 0 0 12px; box-shadow: 0 1px 0 var(--bl-line); }
.bl-dr__preset { padding: 7px 10px; border: 0; border-radius: 8px; background: transparent; color: var(--bl-muted); font: inherit; font-size: 13px; text-align: left; white-space: nowrap; cursor: pointer; }
.bl-dr__preset:hover, .bl-dr__preset[aria-pressed="true"] { background: var(--bl-hover); color: var(--bl-ink); }
.bl-dr__preset:focus-visible, .bl-dr__nav:focus-visible, .bl-dr__clear:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 1px; }
.bl-dr__main { min-width: 0; }
.bl-dr__head { position: relative; display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.bl-dr__nav { display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 8px; background: transparent; color: var(--bl-muted); cursor: pointer; }
.bl-dr__nav:hover { background: var(--bl-hover); color: var(--bl-ink); }
.bl-dr__months { display: flex; gap: 24px; }
.bl-dr__month { flex: 0 0 auto; animation: bl-dr-slide 320ms cubic-bezier(.2,.9,.25,1) both; }
.bl-dr__title { height: 32px; margin: -42px 0 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; pointer-events: none; }
.bl-dr__grid { border-collapse: collapse; }
.bl-dr__grid th { width: var(--bl-cell); height: 28px; padding: 0; color: var(--bl-dim); font-size: 11px; font-weight: 600; text-transform: uppercase; }
.bl-dr__grid td { position: relative; width: var(--bl-cell); height: var(--bl-cell); padding: 0; text-align: center; }
.bl-dr__grid td[data-band]::before { content: ""; position: absolute; inset: 3px 0; background: var(--bl-band); }
.bl-dr__grid td[data-band="start"]::before { left: 50%; }
.bl-dr__grid td[data-band="end"]::before { right: 50%; }
.bl-dr__grid td[data-band="solo"]::before { display: none; }
.bl-dr__grid td[data-preview]::before { background: color-mix(in srgb, var(--bl-band) 55%, transparent); }
.bl-dr__day { position: relative; z-index: 1; width: calc(var(--bl-cell) - 4px); height: calc(var(--bl-cell) - 4px); padding: 0; border: 0; border-radius: 50%; background: transparent; color: inherit; font: inherit; font-size: 13px; font-variant-numeric: tabular-nums; cursor: pointer; transition: background-color 120ms, transform 160ms cubic-bezier(.3,1.6,.5,1); }
.bl-dr__day:hover:not(:disabled) { background: var(--bl-hover); }
.bl-dr__day[data-today] { box-shadow: inset 0 0 0 1px var(--bl-dim); }
.bl-dr__day[data-edge] { background: var(--bl-accent); color: var(--bl-on-accent); font-weight: 700; animation: bl-dr-pop 300ms cubic-bezier(.3,1.6,.5,1); }
.bl-dr__day:disabled { color: var(--bl-dim); opacity: 0.4; cursor: not-allowed; text-decoration: line-through; }
.bl-dr__day:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 1px; }
.bl-dr__foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px; padding-top: 12px; box-shadow: 0 -1px 0 var(--bl-line); font-size: 13px; }
.bl-dr__summary { color: var(--bl-muted); }
.bl-dr__summary b { color: var(--bl-ink); }
.bl-dr__clear { padding: 6px 10px; border: 0; border-radius: 8px; background: var(--bl-hover); color: var(--bl-ink); font: inherit; font-size: 13px; cursor: pointer; }
.bl-dr__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-dr-slide { from { opacity: 0; transform: translateX(calc(var(--bl-dir) * 28px)); } }
@keyframes bl-dr-pop { 40% { transform: scale(1.15); } }
@media (prefers-reduced-motion: reduce) { .bl-dr__month, .bl-dr__day[data-edge] { animation: none; } .bl-dr__day { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d: Date, n: number) => {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
};
const same = (a: Date | null | undefined, b: Date | null | undefined) => !!a && !!b && a.getTime() === b.getTime();
const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

export const DEFAULT_PRESETS: DatePreset[] = [
  { label: 'Today', range: () => ({ start: day(new Date()), end: day(new Date()) }) },
  { label: 'Last 7 days', range: () => ({ start: addDays(day(new Date()), -6), end: day(new Date()) }) },
  { label: 'Last 30 days', range: () => ({ start: addDays(day(new Date()), -29), end: day(new Date()) }) },
  {
    label: 'This month',
    range: () => {
      const now = new Date();
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: new Date(now.getFullYear(), now.getMonth() + 1, 0) };
    }
  },
  {
    label: 'Next weekend',
    range: () => {
      const today = day(new Date());
      const saturday = addDays(today, ((6 - today.getDay() + 7) % 7) || 7);
      return { start: saturday, end: addDays(saturday, 1) };
    }
  }
];

export default function DateRange({
  value,
  defaultValue,
  onValueChange,
  presets = DEFAULT_PRESETS,
  months = 2,
  minDate,
  maxDate,
  weekStartsOn = 1,
  locale,
  label = 'Choose dates',
  cellSize = 38,
  narrowAt = 620,
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  dimColor = '#566c86',
  hoverColor = 'rgba(255,255,255,0.07)',
  lineColor = '#333c57',
  accentColor = '#73eff7',
  onAccentColor = '#0b0b14',
  bandColor = 'rgba(115,239,247,0.16)',
  radius = 16,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: DateRangeProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const today = day(new Date());
  const [inner, setInner] = useState<DateRangeValue>(defaultValue ?? { start: null, end: null });
  const range = value ?? inner;
  const start = range.start ? day(range.start) : null;
  const end = range.end ? day(range.end) : null;
  const [view, setView] = useState(() => new Date((start ?? today).getFullYear(), (start ?? today).getMonth(), 1));
  const [dir, setDir] = useState(0);
  const [focused, setFocused] = useState<Date>(start ?? today);
  const [hover, setHover] = useState<Date | null>(null);
  const [narrow, setNarrow] = useState(false);
  const [room, setRoom] = useState(Infinity);
  const [announce, setAnnounce] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const keyboard = useRef(false);
  const shown = narrow ? 1 : months;
  const min = minDate ? day(minDate) : null;
  const max = maxDate ? day(maxDate) : null;

  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, opts).format(d);
  const long = (d: Date) => fmt(d, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const short = (d: Date) => fmt(d, { month: 'short', day: 'numeric', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
  const disabled = (d: Date) => (min && d < min) || (max && d > max);

  useLayoutEffect(() => {
    const node = rootRef.current!;
    const measure = () => {
      // The parent's content box: clientWidth includes its padding.
      const parent = node.parentElement;
      const pad = parent ? parseFloat(getComputedStyle(parent).paddingLeft) + parseFloat(getComputedStyle(parent).paddingRight) : 0;
      const width = parent ? parent.clientWidth - pad : 9999;
      setNarrow(width < narrowAt);
      setRoom(width);
    };
    measure();
    const resize = new ResizeObserver(measure);
    if (node.parentElement) resize.observe(node.parentElement);
    return () => resize.disconnect();
  }, [narrowAt]);

  const commit = (next: DateRangeValue) => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  const goMonth = (target: Date, direction: number) => {
    setDir(direction);
    setView(new Date(target.getFullYear(), target.getMonth(), 1));
  };

  // Keep the focused date on screen, sliding the months in the direction of travel.
  const reveal = (d: Date) => {
    const first = view;
    const lastShown = addMonths(view, shown - 1);
    if (d < first) goMonth(d, -1);
    else if (d > new Date(lastShown.getFullYear(), lastShown.getMonth() + 1, 0)) goMonth(addMonths(d, -(shown - 1)), 1);
  };

  const pick = (d: Date) => {
    if (disabled(d)) return;
    if (!start || end) {
      commit({ start: d, end: null });
      setAnnounce(`Start date ${long(d)}. Now choose the end date.`);
    } else {
      const [a, b] = d < start ? [d, start] : [start, d];
      commit({ start: a, end: b });
      const nights = Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
      setAnnounce(`Selected ${long(a)} to ${long(b)}, ${nights} ${nights === 1 ? 'day' : 'days'}.`);
    }
    setFocused(d);
    setHover(null);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => addDays(focused, -1),
      ArrowRight: () => addDays(focused, 1),
      ArrowUp: () => addDays(focused, -7),
      ArrowDown: () => addDays(focused, 7),
      Home: () => addDays(focused, -((focused.getDay() - weekStartsOn + 7) % 7)),
      End: () => addDays(focused, 6 - ((focused.getDay() - weekStartsOn + 7) % 7)),
      PageUp: () => addMonths(focused, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focused, event.shiftKey ? 12 : 1)
    };
    if (!moves[event.key]) return;
    event.preventDefault();
    const next = moves[event.key]();
    keyboard.current = true;
    setFocused(next);
    reveal(next);
    if (start && !end) setHover(next);
  };

  // After a keyboard move, put real focus on the new day.
  useEffect(() => {
    if (!keyboard.current) return;
    keyboard.current = false;
    gridRef.current?.querySelector<HTMLElement>(`[data-key="${keyOf(focused)}"]`)?.focus();
  }, [focused, view]);

  const applyPreset = (preset: DatePreset) => {
    const next = preset.range();
    commit({ start: day(next.start), end: day(next.end) });
    setFocused(day(next.start));
    const target = day(next.start);
    if (target.getFullYear() !== view.getFullYear() || target.getMonth() !== view.getMonth()) goMonth(target, target < view ? -1 : 1);
    setAnnounce(`${preset.label}: ${long(day(next.start))} to ${long(day(next.end))}.`);
  };

  // Range band for a day: a real range, or a preview while choosing the end.
  const bandOf = (d: Date): { band: string | null; preview: boolean } => {
    const previewEnd = start && !end ? hover : null;
    const a = start;
    const b = end ?? previewEnd;
    if (!a || !b) return { band: start && same(d, start) ? 'solo' : null, preview: false };
    const [lo, hi] = a <= b ? [a, b] : [b, a];
    if (d < lo || d > hi) return { band: null, preview: false };
    const band = same(lo, hi) ? 'solo' : same(d, lo) ? 'start' : same(d, hi) ? 'end' : 'mid';
    return { band, preview: !end };
  };

  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 7 + ((i + weekStartsOn) % 7));
    return { short: fmt(d, { weekday: 'narrow' }), long: fmt(d, { weekday: 'long' }) };
  });

  const renderMonth = (offset: number) => {
    const first = addMonths(view, offset);
    const lead = (first.getDay() - weekStartsOn + 7) % 7;
    const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells = Array.from({ length: 42 }, (_, i) => (i < lead || i >= lead + daysIn ? null : new Date(first.getFullYear(), first.getMonth(), i - lead + 1)));
    const title = fmt(first, { month: 'long', year: 'numeric' });
    return (
      <div key={`${first.getFullYear()}-${first.getMonth()}`} className="bl-dr__month" style={{ '--bl-dir': dir } as CSSVars}>
        <div className="bl-dr__title" id={`${uid}-m${offset}`} aria-hidden="true">
          {title}
        </div>
        <table className="bl-dr__grid" role="grid" aria-label={title}>
          <thead>
            <tr>
              {weekdays.map(w => (
                <th key={w.long} scope="col" abbr={w.long}>
                  {w.short}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }, (_, row) => (
              <tr key={row}>
                {cells.slice(row * 7, row * 7 + 7).map((d, col) => {
                  if (!d) return <td key={col} />;
                  const { band, preview } = bandOf(d);
                  const edge = same(d, start) || same(d, end) || (preview && same(d, hover));
                  const state = same(d, start) && same(d, end) ? ', selected' : same(d, start) ? ', start date' : same(d, end) ? ', end date' : band && !preview ? ', in range' : '';
                  return (
                    <td key={col} data-band={band ?? undefined} data-preview={(band && preview) || undefined} aria-selected={!!band && !preview}>
                      <button
                        type="button"
                        className="bl-dr__day"
                        data-key={keyOf(d)}
                        data-today={same(d, today) || undefined}
                        data-edge={edge || undefined}
                        tabIndex={same(d, focused) ? 0 : -1}
                        disabled={!!disabled(d)}
                        aria-label={`${long(d)}${same(d, today) ? ', today' : ''}${state}`}
                        onClick={() => pick(d)}
                        onPointerEnter={() => start && !end && setHover(d)}
                        onFocus={() => setFocused(d)}
                      >
                        {d.getDate()}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const nights = start && end ? Math.round((end.getTime() - start.getTime()) / 86400000) + 1 : 0;
  // On narrow screens the day cells shrink so a week always fits (32px panel padding).
  const cell = narrow ? Math.max(28, Math.min(cellSize, Math.floor((room - 32) / 7))) : cellSize;
  const activePreset = presets.findIndex(p => {
    const r = p.range();
    return same(day(r.start), start) && same(day(r.end), end);
  });

  return (
    <div
      ref={rootRef}
      className={`bl-dr ${className}`}
      role="group"
      aria-label={label}
      data-narrow={narrow || undefined}
      style={{
        '--bl-cell': `${cell}px`,
        '--bl-bg': backgroundColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-dim': dimColor,
        '--bl-hover': hoverColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-on-accent': onAccentColor,
        '--bl-band': bandColor,
        '--bl-radius': `${radius}px`,
        '--bl-font': fontFamily,
        ...style
      } as CSSVars}
    >
      {presets.length > 0 && (
        <div className="bl-dr__presets" role="group" aria-label="Presets">
          {presets.map((preset, i) => (
            <button key={preset.label} type="button" className="bl-dr__preset" aria-pressed={i === activePreset} onClick={() => applyPreset(preset)}>
              {preset.label}
            </button>
          ))}
        </div>
      )}
      <div className="bl-dr__main">
        <div className="bl-dr__head">
          <button type="button" className="bl-dr__nav" aria-label="Previous month" onClick={() => goMonth(addMonths(view, -1), -1)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M8.5 3 4.5 7l4 4" />
            </svg>
          </button>
          <button type="button" className="bl-dr__nav" aria-label="Next month" onClick={() => goMonth(addMonths(view, 1), 1)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M5.5 3 9.5 7l-4 4" />
            </svg>
          </button>
        </div>
        <div ref={gridRef} className="bl-dr__months" onKeyDown={onKeyDown} onPointerLeave={() => setHover(null)}>
          {Array.from({ length: shown }, (_, i) => renderMonth(i))}
        </div>
        <div className="bl-dr__foot">
          <span className="bl-dr__summary">
            {start && end ? (
              <>
                <b>{short(start)}</b> – <b>{short(end)}</b> · {nights} {nights === 1 ? 'day' : 'days'}
              </>
            ) : start ? (
              <>
                <b>{short(start)}</b> – pick an end date
              </>
            ) : (
              'Pick a start date'
            )}
          </span>
          {start && (
            <button
              type="button"
              className="bl-dr__clear"
              onClick={() => {
                commit({ start: null, end: null });
                setAnnounce('Dates cleared.');
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>
      <span className="bl-dr__sr" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
