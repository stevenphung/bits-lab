import { useEffect, useId, useInsertionEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Small trend chart in plain SVG. A 2px line over a faint area wash draws itself in, the last
// point gets an end dot and a direct label, and a crosshair snaps to the nearest point on
// hover, touch or arrow keys with a value-first tooltip. Screen readers get a summary and a
// full data table. One series per chart; for several, use small multiples.

const STYLE_ID = 'bl-spark-chart-tw';
const CSS = `
@keyframes bl-spark-draw { to { stroke-dashoffset: 0; } }
@keyframes bl-spark-fade { from { opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Monotone cubic interpolation (Fritsch–Carlson): smooth, but never overshoots the data.
type Point = [number, number];

/** A plain number, or a value with its label (shown in the tooltip and table). */
export type SparkDatum = number | { value: number; label?: string };

export interface SparkChartProps {
  /** One series. */
  data?: SparkDatum[];
  /** Labels for a plain number array. */
  labels?: string[];
  /** Height in px; the width follows the container. */
  height?: number;
  /** Monotone curve that never overshoots the data. */
  smooth?: boolean;
  /** A ~10% wash under the line. */
  area?: boolean;
  /** Direct label on the last value. */
  showEndLabel?: boolean;
  /** Hairline baseline. */
  showBaseline?: boolean;
  /** Draw the line in on mount (skipped under reduced motion). */
  animate?: boolean;
  drawDuration?: number;
  /** Formats the end label, tooltip and table. */
  formatValue?: (value: number) => string;
  /** Names the chart for screen readers (an automatic summary follows). */
  label?: string;
  color?: string;
  textColor?: string;
  mutedColor?: string;
  gridColor?: string;
  /** Surface behind the chart; used for the 2px ring around the dot. */
  surfaceColor?: string;
  tooltipColor?: string;
  focusColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

function smoothPath(points: Point[]) {
  if (points.length < 3) return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join('');
  const n = points.length;
  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1][0] - points[i][0]);
    slope.push((points[i + 1][1] - points[i][1]) / (dx[i] || 1));
  }
  const tangent = [slope[0]];
  for (let i = 1; i < n - 1; i++) tangent.push(slope[i - 1] * slope[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) / ((2 * dx[i] + dx[i - 1]) / slope[i - 1] + (dx[i] + 2 * dx[i - 1]) / slope[i]));
  tangent.push(slope[n - 2]);
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = dx[i] / 3;
    d += `C${x0 + h},${y0 + h * tangent[i]} ${x1 - h},${y1 - h * tangent[i + 1]} ${x1},${y1}`;
  }
  return d;
}

const defaultFormat = (value: number) => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);

export default function SparkChart({
  data = [],
  labels,
  height = 96,
  smooth = true,
  area = true,
  showEndLabel = true,
  showBaseline = true,
  animate = true,
  drawDuration = 900,
  formatValue = defaultFormat,
  label = 'Trend',
  color = '#3987e5',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  gridColor = 'rgba(255,255,255,0.1)',
  surfaceColor = '#1a1c2c',
  tooltipColor = '#11131c',
  focusColor = '#73eff7',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: SparkChartProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const [active, setActive] = useState<number | null>(null);
  const values = data.map(d => (typeof d === 'number' ? d : d.value));
  const names = data.map((d, i) => (typeof d === 'number' ? labels?.[i] : d.label) ?? `Point ${i + 1}`);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(60, entry.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Leave room on the right for the end label, and a little air top and bottom.
  const endLabel = showEndLabel && values.length ? formatValue(values[values.length - 1]) : '';
  const padRight = endLabel ? Math.min(80, String(endLabel).length * 7.5 + 14) : 6;
  const padY = 8;
  const geometry = useMemo(() => {
    if (!values.length) return null;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const plotW = Math.max(10, width - padRight - 6);
    const x = (i: number) => 6 + (values.length === 1 ? plotW / 2 : (i / (values.length - 1)) * plotW);
    const y = (v: number) => padY + (1 - (v - min) / span) * (height - padY * 2);
    const points: Point[] = values.map((v, i) => [Number(x(i).toFixed(2)), Number(y(v).toFixed(2))]);
    const line = smooth ? smoothPath(points) : points.map(([px, py], i) => `${i ? 'L' : 'M'}${px},${py}`).join('');
    const bottom = height - padY;
    const fill = `${line}L${points[points.length - 1][0]},${bottom}L${points[0][0]},${bottom}Z`;
    return { points, line, fill, bottom, min, max };
  }, [values.join(','), width, height, smooth, padRight]); // eslint-disable-line react-hooks/exhaustive-deps

  const nearest = (clientX: number) => {
    const rect = ref.current!.getBoundingClientRect();
    const x = clientX - rect.left;
    let best = 0;
    geometry!.points.forEach(([px], i) => {
      if (Math.abs(px - x) < Math.abs(geometry!.points[best][0] - x)) best = i;
    });
    return best;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!geometry) return;
    const last = values.length - 1;
    const moves: Record<string, number> = { ArrowRight: (active ?? -1) + 1, ArrowLeft: (active ?? last + 1) - 1, Home: 0, End: last };
    if (event.key === 'Escape') return setActive(null);
    if (!(event.key in moves)) return;
    event.preventDefault();
    setActive(Math.max(0, Math.min(last, moves[event.key])));
  };

  const point = geometry && active !== null ? geometry.points[active!] : null;
  const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0;
  const summary = values.length
    ? `${label}: ${values.length} points from ${formatValue(values[0])} to ${formatValue(values[values.length - 1])}, ${trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat'} overall; low ${formatValue(geometry!.min)}, high ${formatValue(geometry!.max)}.`
    : `${label}: no data.`;

  return (
    <div
      ref={ref}
      className={`group/spark relative w-full touch-pan-y font-(family-name:--bl-font) text-(--bl-ink) outline-none focus-visible:rounded-[6px] focus-visible:shadow-[0_0_0_2px_var(--bl-focus)] [&_svg]:block [&_svg]:w-full [&_svg]:overflow-visible ${className}`}
      data-draw={animate || undefined}
      tabIndex={values.length ? 0 : undefined}
      role="group"
      aria-label={summary}
      aria-describedby={`${uid}-table`}
      onPointerMove={event => geometry && setActive(nearest(event.clientX))}
      onPointerDown={event => geometry && setActive(nearest(event.clientX))}
      onPointerLeave={() => setActive(null)}
      onKeyDown={onKeyDown}
      onBlur={() => setActive(null)}
      style={{
        '--bl-color': color,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-grid': gridColor,
        '--bl-surface': surfaceColor,
        '--bl-tip-bg': tooltipColor,
        '--bl-focus': focusColor,
        '--bl-font': fontFamily,
        '--bl-draw': `${drawDuration}ms`,
        ...style
      } as CSSVars}
    >
      <svg height={height} aria-hidden="true">
        {geometry && (
          <>
            {showBaseline && <line className="stroke-(--bl-grid) stroke-1" x1="6" x2={width - padRight} y1={geometry.bottom + 0.5} y2={geometry.bottom + 0.5} />}
            {area && <path className="fill-(--bl-color) opacity-10 [transition:d_450ms_cubic-bezier(.2,.9,.25,1)] group-data-[draw]/spark:animate-[bl-spark-fade_var(--bl-draw)_ease_both] motion-reduce:[transition:none] motion-reduce:group-data-[draw]/spark:animate-none" d={geometry.fill} />}
            <path className="fill-none stroke-(--bl-color) stroke-2 [stroke-linecap:round] [stroke-linejoin:round] [transition:d_450ms_cubic-bezier(.2,.9,.25,1)] group-data-[draw]/spark:animate-[bl-spark-draw_var(--bl-draw)_cubic-bezier(.4,0,.2,1)_forwards] group-data-[draw]/spark:[stroke-dasharray:1] group-data-[draw]/spark:[stroke-dashoffset:1] motion-reduce:[transition:none] motion-reduce:group-data-[draw]/spark:animate-none motion-reduce:group-data-[draw]/spark:[stroke-dasharray:none]" d={geometry.line} pathLength="1" />
            {point && <line className="stroke-(--bl-muted) stroke-1" x1={point[0]} x2={point[0]} y1={padY / 2} y2={geometry.bottom} />}
            <circle className="fill-(--bl-color) stroke-(--bl-surface) stroke-2" cx={(point ?? geometry.points[geometry.points.length - 1])[0]} cy={(point ?? geometry.points[geometry.points.length - 1])[1]} r="4" />
            {endLabel && (
              <text className="fill-(--bl-ink) text-[12px] font-semibold" x={geometry.points[geometry.points.length - 1][0] + 9} y={geometry.points[geometry.points.length - 1][1]} dominantBaseline="middle">
                {endLabel}
              </text>
            )}
          </>
        )}
      </svg>
      {point && (
        <div className="pointer-events-none absolute top-0 z-2 rounded-[8px] bg-(--bl-tip-bg) px-[9px] py-1.5 whitespace-nowrap shadow-[0_0_0_1px_var(--bl-grid),0_8px_20px_-8px_rgba(0,0,0,0.6)] [transform:translate(-50%,calc(-100%_-_10px))] [&_strong]:block [&_strong]:text-[14px] [&_strong]:font-bold [&_strong]:text-(--bl-ink) [&_span]:flex [&_span]:items-center [&_span]:gap-1.5 [&_span]:text-[12px] [&_span]:text-(--bl-muted) [&_i]:h-0.5 [&_i]:w-2.5 [&_i]:rounded-[1px] [&_i]:bg-(--bl-color)" style={{ left: Math.min(Math.max(point[0], 50), width - 50), top: point[1] }}>
          <strong>{formatValue(values[active!])}</strong>
          <span>
            <i aria-hidden="true" />
            {names[active!]}
          </span>
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {point ? `${names[active!]}: ${formatValue(values[active!])}` : ''}
      </span>
      <table id={`${uid}-table`} className="sr-only">
        <caption>{label}</caption>
        <tbody>
          {values.map((v, i) => (
            <tr key={i}>
              <th scope="row">{names[i]}</th>
              <td>{formatValue(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
