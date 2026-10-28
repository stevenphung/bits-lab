import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A date-range calendar. Click a start and an end (hovering previews the range), or pick a
// preset. Months slide in from the side you're heading toward. The grid works fully from
// the keyboard: arrows move by day and week, Home/End to the week's edges, Page Up/Down by
// month (with Shift, by year), Enter picks. Dates and weekdays follow the locale; min/max
// dates are disabled. Shows two months side by side, one on narrow screens.

const STYLE_ID = 'bl-date-range-tw';
const CSS = `
/* theme tokens */
.bl-dr { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-dim: #566c86; --bl-hover: rgba(255,255,255,0.07); --bl-line: #333c57; --bl-accent: #73eff7; --bl-on-accent: #0b0b14; --bl-band: rgba(115,239,247,0.16); }
:where(.light, [data-theme="light"]) .bl-dr, .bl-dr:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-dim: #8a96a3; --bl-hover: rgba(26,28,44,0.07); --bl-line: #cfc4ad; --bl-accent: #167f8f; --bl-band: rgba(22,127,143,0.16); }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-dr, :where(.light, [data-theme="light"]) .bl-dr:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-dim: #566c86; --bl-hover: rgba(255,255,255,0.07); --bl-line: #333c57; --bl-accent: #73eff7; --bl-on-accent: #0b0b14; --bl-band: rgba(115,239,247,0.16); }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-dr, .bl-dr:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-dim: #8a96a3; --bl-hover: rgba(26,28,44,0.07); --bl-line: #cfc4ad; --bl-accent: #167f8f; --bl-band: rgba(22,127,143,0.16); } }
/* theme tokens end */
@keyframes bl-dr-slide { from { opacity: 0; transform: translateX(calc(var(--bl-dir) * 28px)); } }
@keyframes bl-dr-pop { 40% { transform: scale(1.15); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const day = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const addMonths = (d, n) => {
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
};
const same = (a, b) => !!a && !!b && a.getTime() === b.getTime();
const keyOf = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

export const DEFAULT_PRESETS = [
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
  backgroundColor,
  textColor,
  mutedColor,
  dimColor,
  hoverColor,
  lineColor,
  accentColor,
  onAccentColor,
  bandColor,
  radius = 16,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const today = day(new Date());
  const [inner, setInner] = useState(defaultValue ?? { start: null, end: null });
  const range = value ?? inner;
  const start = range.start ? day(range.start) : null;
  const end = range.end ? day(range.end) : null;
  const [view, setView] = useState(() => new Date((start ?? today).getFullYear(), (start ?? today).getMonth(), 1));
  const [dir, setDir] = useState(0);
  const [focused, setFocused] = useState(start ?? today);
  const [hover, setHover] = useState(null);
  const [narrow, setNarrow] = useState(false);
  const [room, setRoom] = useState(Infinity);
  const [announce, setAnnounce] = useState('');
  const rootRef = useRef(null);
  const gridRef = useRef(null);
  const keyboard = useRef(false);
  const shown = narrow ? 1 : months;
  const min = minDate ? day(minDate) : null;
  const max = maxDate ? day(maxDate) : null;

  const fmt = (d, opts) => new Intl.DateTimeFormat(locale, opts).format(d);
  const long = d => fmt(d, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const short = d => fmt(d, { month: 'short', day: 'numeric', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
  const disabled = d => (min && d < min) || (max && d > max);

  useLayoutEffect(() => {
    const node = rootRef.current;
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

  const commit = next => {
    if (value === undefined) setInner(next);
    onValueChange?.(next);
  };

  const goMonth = (target, direction) => {
    setDir(direction);
    setView(new Date(target.getFullYear(), target.getMonth(), 1));
  };

  // Keep the focused date on screen, sliding the months in the direction of travel.
  const reveal = d => {
    const first = view;
    const lastShown = addMonths(view, shown - 1);
    if (d < first) goMonth(d, -1);
    else if (d > new Date(lastShown.getFullYear(), lastShown.getMonth() + 1, 0)) goMonth(addMonths(d, -(shown - 1)), 1);
  };

  const pick = d => {
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

  const onKeyDown = event => {
    const moves = {
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
    gridRef.current?.querySelector(`[data-key="${keyOf(focused)}"]`)?.focus();
  }, [focused, view]);

  const applyPreset = preset => {
    const next = preset.range();
    commit({ start: day(next.start), end: day(next.end) });
    setFocused(day(next.start));
    const target = day(next.start);
    if (target.getFullYear() !== view.getFullYear() || target.getMonth() !== view.getMonth()) goMonth(target, target < view ? -1 : 1);
    setAnnounce(`${preset.label}: ${long(day(next.start))} to ${long(day(next.end))}.`);
  };

  // Range band for a day: a real range, or a preview while choosing the end.
  const bandOf = d => {
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

  const renderMonth = offset => {
    const first = addMonths(view, offset);
    const lead = (first.getDay() - weekStartsOn + 7) % 7;
    const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells = Array.from({ length: 42 }, (_, i) => (i < lead || i >= lead + daysIn ? null : new Date(first.getFullYear(), first.getMonth(), i - lead + 1)));
    const title = fmt(first, { month: 'long', year: 'numeric' });
    return (
      <div key={`${first.getFullYear()}-${first.getMonth()}`} className="flex-none animate-[bl-dr-slide_320ms_cubic-bezier(.2,.9,.25,1)_both] motion-reduce:animate-none" style={{ '--bl-dir': dir }}>
        <div className="pointer-events-none -mt-[42px] mb-2.5 flex h-8 items-center justify-center text-[14px] font-bold" id={`${uid}-m${offset}`} aria-hidden="true">
          {title}
        </div>
        <table className="border-collapse [&_th]:h-7 [&_th]:w-(--bl-cell) [&_th]:p-0 [&_th]:text-[11px] [&_th]:font-semibold [&_th]:text-(--bl-dim) [&_th]:uppercase [&_td]:relative [&_td]:size-(--bl-cell) [&_td]:p-0 [&_td]:text-center [&_td[data-band]]:before:absolute [&_td[data-band]]:before:inset-x-0 [&_td[data-band]]:before:inset-y-[3px] [&_td[data-band]]:before:bg-(--bl-band) [&_td[data-band][data-band=start]]:before:left-1/2 [&_td[data-band][data-band=end]]:before:right-1/2 [&_td[data-band][data-band=solo]]:before:hidden [&_td[data-band][data-preview]]:before:bg-[color-mix(in_srgb,var(--bl-band)_55%,transparent)]" role="grid" aria-label={title}>
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
                        className="relative z-1 size-[calc(var(--bl-cell)_-_4px)] cursor-pointer rounded-[50%] border-0 bg-transparent p-0 text-[13px] text-inherit tabular-nums [transition:background-color_120ms,transform_160ms_cubic-bezier(.3,1.6,.5,1)] not-disabled:hover:bg-(--bl-hover) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--bl-accent) disabled:cursor-not-allowed disabled:text-(--bl-dim) disabled:line-through disabled:opacity-40 data-[edge]:animate-[bl-dr-pop_300ms_cubic-bezier(.3,1.6,.5,1)] data-[edge]:bg-(--bl-accent) data-[edge]:font-bold data-[edge]:text-(--bl-on-accent) data-[today]:shadow-[inset_0_0_0_1px_var(--bl-dim)] motion-reduce:[transition:none] motion-reduce:data-[edge]:animate-none"
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
      className={`bl-dr group/dr box-border flex w-fit max-w-full gap-[18px] rounded-(--bl-radius) bg-(--bl-bg) p-4 font-(family-name:--bl-font) text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line),0_24px_50px_-28px_rgba(0,0,0,0.85)] data-[narrow]:flex-col ${className}`}
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
      }}
    >
      {presets.length > 0 && (
        <div className="flex min-w-[130px] flex-col gap-0.5 pr-4 shadow-[1px_0_0_var(--bl-line)] group-data-[narrow]/dr:min-w-0 group-data-[narrow]/dr:flex-row group-data-[narrow]/dr:flex-wrap group-data-[narrow]/dr:p-0 group-data-[narrow]/dr:pb-3 group-data-[narrow]/dr:shadow-[0_1px_0_var(--bl-line)]" role="group" aria-label="Presets">
          {presets.map((preset, i) => (
            <button key={preset.label} type="button" className="cursor-pointer rounded-[8px] border-0 bg-transparent px-2.5 py-[7px] text-left text-[13px] whitespace-nowrap text-(--bl-muted) hover:bg-(--bl-hover) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--bl-accent) aria-pressed:bg-(--bl-hover) aria-pressed:text-(--bl-ink)" aria-pressed={i === activePreset} onClick={() => applyPreset(preset)}>
              {preset.label}
            </button>
          ))}
        </div>
      )}
      <div className="min-w-0">
        <div className="relative mb-2.5 flex items-center justify-between">
          <button type="button" className="grid size-8 cursor-pointer place-items-center rounded-[8px] border-0 bg-transparent p-0 text-(--bl-muted) hover:bg-(--bl-hover) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--bl-accent)" aria-label="Previous month" onClick={() => goMonth(addMonths(view, -1), -1)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M8.5 3 4.5 7l4 4" />
            </svg>
          </button>
          <button type="button" className="grid size-8 cursor-pointer place-items-center rounded-[8px] border-0 bg-transparent p-0 text-(--bl-muted) hover:bg-(--bl-hover) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--bl-accent)" aria-label="Next month" onClick={() => goMonth(addMonths(view, 1), 1)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="M5.5 3 9.5 7l-4 4" />
            </svg>
          </button>
        </div>
        <div ref={gridRef} className="flex gap-6" onKeyDown={onKeyDown} onPointerLeave={() => setHover(null)}>
          {Array.from({ length: shown }, (_, i) => renderMonth(i))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 pt-3 text-[13px] shadow-[0_-1px_0_var(--bl-line)]">
          <span className="text-(--bl-muted) [&_b]:text-(--bl-ink)">
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
              className="cursor-pointer rounded-[8px] border-0 bg-(--bl-hover) px-2.5 py-1.5 text-[13px] text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--bl-accent)"
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
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
