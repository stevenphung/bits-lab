import { useEffect, useId, useInsertionEffect, useMemo, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A contribution-style calendar heatmap: one square per day, weeks as columns. Cells fill in
// with a staggered sweep, color is a single-hue sequential ramp (quiet days recede toward the
// surface, busy days get lighter), and a tooltip leads with the value. One tab stop: arrow
// keys walk the days and each is announced. Month and weekday labels, a Less/More legend, and
// a total. Scrolls to the most recent weeks on narrow screens.

const STYLE_ID = 'bl-heatmap-tw';
const CSS = `
@keyframes bl-heat-in { from { opacity: 0; transform: scale(0.3); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Sequential blue ramp for the dark surface: empty, then steps 600 → 250 (busier = lighter).
export const HEAT_RAMP = ['#262b44', '#184f95', '#256abf', '#3987e5', '#86b6ef'];

const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const keyOf = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export default function Heatmap({
  data = [],
  end,
  weeks = 53,
  weekStartsOn = 0,
  thresholds,
  colors = HEAT_RAMP,
  title,
  unit = 'contribution',
  unitPlural,
  locale,
  cellSize = 12,
  gap = 3,
  radius = 2,
  onSelect,
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  dimColor = '#566c86',
  accentColor = '#73eff7',
  tooltipColor = '#f4f4f4',
  tooltipTextColor = '#1a1c2c',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const plural = unitPlural ?? `${unit}s`;
  const last = startOfDay(end ? new Date(end) : new Date());
  // The grid starts on the week-start day `weeks` columns back.
  const first = new Date(last.getFullYear(), last.getMonth(), last.getDate() - ((last.getDay() - weekStartsOn + 7) % 7) - (weeks - 1) * 7);

  const values = useMemo(() => {
    const map = new Map();
    for (const entry of data) {
      const d = startOfDay(new Date(entry.date));
      map.set(keyOf(d), (map.get(keyOf(d)) ?? 0) + (Number(entry.value) || 0));
    }
    return map;
  }, [data]);

  // Level cut-offs: given, or quartiles of the non-zero days.
  const cuts = useMemo(() => {
    if (thresholds) return thresholds;
    const sorted = [...values.values()].filter(v => v > 0).sort((a, b) => a - b);
    if (!sorted.length) return [1, 2, 3];
    const q = p => sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
    return [q(0.25), q(0.5), q(0.75)];
  }, [values, thresholds]);
  const levelOf = v => (v <= 0 ? 0 : v <= cuts[0] ? 1 : v <= cuts[1] ? 2 : v <= cuts[2] ? 3 : 4);

  const cells = useMemo(
    () =>
      Array.from({ length: weeks * 7 }, (_, i) => {
        const date = new Date(first.getFullYear(), first.getMonth(), first.getDate() + i);
        return { date, week: Math.floor(i / 7), weekday: i % 7, value: values.get(keyOf(date)) ?? 0, future: date > last };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values, weeks, weekStartsOn, last.getTime()]
  );

  const total = cells.reduce((sum, c) => sum + (c.future ? 0 : c.value), 0);
  const [active, setActive] = useState(cells.length - 1 - cells.filter(c => c.future).length);
  const [tip, setTip] = useState(null);
  const scrollRef = useRef(null);
  const gridRef = useRef(null);

  // Show the most recent weeks first on narrow screens.
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollLeft = node.scrollWidth;
  }, [weeks]);

  const fmtDate = d => new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(d);
  const describe = c => `${c.value.toLocaleString(locale)} ${c.value === 1 ? unit : plural}, ${fmtDate(c.date)}`;

  const showTip = index => {
    const cell = cells[index];
    const node = gridRef.current?.querySelector(`[data-i="${index}"]`);
    if (!cell || !node || cell.future) return setTip(null);
    const box = node.getBoundingClientRect();
    const base = gridRef.current.closest('.bl-heat').getBoundingClientRect();
    setTip({ index, x: box.left - base.left + box.width / 2, y: box.top - base.top });
  };

  const onKeyDown = event => {
    const moves = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7, Home: -active % 7, End: 6 - (active % 7) };
    if (!(event.key in moves)) {
      if ((event.key === 'Enter' || event.key === ' ') && onSelect) {
        event.preventDefault();
        onSelect(cells[active]);
      }
      return;
    }
    event.preventDefault();
    let next = active + moves[event.key];
    while (next >= 0 && next < cells.length && cells[next].future) next -= 7;
    if (next < 0 || next >= cells.length) return;
    setActive(next);
    showTip(next);
    gridRef.current?.querySelector(`[data-i="${next}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  // A month label over each week where the month changes, skipping ones that would crowd.
  const months = [];
  for (let week = 0; week < weeks; week++) {
    const date = cells[week * 7].date;
    const previous = week > 0 ? cells[(week - 1) * 7].date : null;
    if (previous && previous.getMonth() === date.getMonth()) continue;
    // Too close to the previous label: a partial first month gives way; otherwise skip this one.
    if (months.length && week - months[months.length - 1].week < 3) {
      if (months[months.length - 1].week === 0) months.pop();
      else continue;
    }
    months.push({ week, text: new Intl.DateTimeFormat(locale, { month: 'short' }).format(date) });
  }
  const dayNames = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 7 + ((i + weekStartsOn) % 7))));
  const step = cellSize + gap;

  return (
    <div
      className={`bl-heat relative w-fit max-w-full font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      style={{
        '--bl-cell': `${cellSize}px`,
        '--bl-gap': `${gap}px`,
        '--bl-radius': `${radius}px`,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-dim': dimColor,
        '--bl-accent': accentColor,
        '--bl-tip': tooltipColor,
        '--bl-tip-ink': tooltipTextColor,
        '--bl-font': fontFamily,
        ...style
      }}
    >
      {title && (
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <p className="m-0 text-[14px] font-semibold" id={`${uid}-title`}>
            {title}
          </p>
        </div>
      )}
      <div ref={scrollRef} className="overflow-x-auto px-0.5 pt-1 pb-1.5 [scrollbar-width:thin]">
        <div className="grid w-max grid-cols-[auto_1fr] gap-x-1.5">
          <div className="relative col-start-2 h-4 text-[11px] text-(--bl-dim) *:absolute *:top-0 *:whitespace-nowrap" aria-hidden="true" style={{ width: weeks * step - gap }}>
            {months.map(m => (
              <span key={m.week} style={{ left: m.week * step }}>
                {m.text}
              </span>
            ))}
          </div>
          <div className="grid grid-rows-[repeat(7,var(--bl-cell))] gap-y-(--bl-gap) text-[10px] leading-(--bl-cell) text-(--bl-dim)" aria-hidden="true">
            {dayNames.map((name, i) => (
              <span key={name}>{i % 2 === 1 ? name : ''}</span>
            ))}
          </div>
          <div
            ref={gridRef}
            className="grid auto-cols-(--bl-cell) grid-flow-col grid-rows-[repeat(7,var(--bl-cell))] gap-(--bl-gap) outline-none focus-visible:rounded-[4px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--bl-accent)"
            role="grid"
            tabIndex={0}
            aria-label={`${title ?? 'Activity'}: ${total.toLocaleString(locale)} ${plural}. Use the arrow keys to read each day.`}
            aria-activedescendant={`${uid}-d${active}`}
            onKeyDown={onKeyDown}
            onFocus={() => showTip(active)}
            onBlur={() => setTip(null)}
            onPointerLeave={() => setTip(null)}
          >
            {Array.from({ length: 7 }, (_, row) => (
              <div key={row} className="contents" role="row">
                {cells
                  .filter(c => c.weekday === row)
                  .map(c => {
                    const i = c.week * 7 + c.weekday;
                    return (
                      <span
                        key={i}
                        id={`${uid}-d${i}`}
                        data-i={i}
                        role="gridcell"
                        aria-label={c.future ? undefined : describe(c)}
                        aria-hidden={c.future || undefined}
                        aria-selected={i === active}
                        className="animate-[bl-heat-in_420ms_cubic-bezier(.3,1.4,.5,1)_both] rounded-(--bl-radius) bg-(--c) shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] [animation-delay:calc(var(--wk)*14ms)] data-[active]:shadow-[0_0_0_2px_var(--bl-ink)] data-[out]:invisible motion-reduce:animate-none"
                        data-out={c.future || undefined}
                        data-active={(tip && tip.index === i) || undefined}
                        style={{ gridColumn: c.week + 1, gridRow: row + 1, '--c': colors[levelOf(c.value)], '--wk': c.week }}
                        onPointerEnter={() => showTip(i)}
                        onClick={() => {
                          setActive(i);
                          if (!c.future) onSelect?.(c);
                        }}
                      />
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2.5 text-[12px] text-(--bl-muted)">
        <span>
          {total.toLocaleString(locale)} {plural}
        </span>
        <span className="flex items-center gap-1 *:size-[11px] *:rounded-[2px]" aria-hidden="true">
          Less
          {colors.map(c => (
            <i key={c} style={{ background: c }} />
          ))}
          More
        </span>
      </div>
      {tip && cells[tip.index] && (
        <div className="pointer-events-none absolute z-5 rounded-[8px] bg-(--bl-tip) px-[9px] py-1.5 text-[12px] leading-[1.35] whitespace-nowrap text-(--bl-tip-ink) shadow-[0_10px_24px_-10px_rgba(0,0,0,0.8)] [transform:translate(-50%,calc(-100%_-_8px))] [&_b]:block [&_b]:text-[14px]" aria-hidden="true" style={{ left: tip.x, top: tip.y }}>
          <b>
            {cells[tip.index].value.toLocaleString(locale)} {cells[tip.index].value === 1 ? unit : plural}
          </b>
          {fmtDate(cells[tip.index].date)}
        </div>
      )}
    </div>
  );
}
