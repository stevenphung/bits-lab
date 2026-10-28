import { useEffect, useId, useInsertionEffect, useState, type CSSProperties, type RefObject } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Animated beams between DOM nodes. Pass a container ref and pairs of node refs; an SVG
// overlay draws a curved path between each pair's edges and sends a gradient pulse along it.
// Paths are recalculated whenever the container or any endpoint resizes.

const STYLE_ID = 'bl-connect-beams';
const CSS = `
.bl-beams { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; z-index: 0; }
.bl-beams__pulse { animation: bl-beam-pulse var(--bl-dur) linear infinite; }
@keyframes bl-beam-pulse { from { stroke-dashoffset: var(--bl-from); } to { stroke-dashoffset: var(--bl-to); } }
@media (prefers-reduced-motion: reduce) { .bl-beams__pulse { animation: none; stroke-dasharray: none; opacity: 0.6; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Point on a rectangle's edge facing the other point, so beams start at the border, not the center.
interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BeamPath {
  d: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Beam {
  from: RefObject<Element | null>;
  to: RefObject<Element | null>;
  /** Run the pulse from `to` back to `from`. */
  reverse?: boolean;
  /** Overrides the shared curvature for this beam. */
  curvature?: number;
  /** Pulse loop length for this beam, in seconds. */
  duration?: number;
  /** Animation delay, in seconds (negative starts mid-loop). */
  delay?: number;
  /** Track color for this beam. */
  color?: string;
  pulseColor?: string;
  pulseColorEnd?: string;
}

export interface ConnectBeamsProps {
  /** Positioned parent that holds the nodes; the SVG overlay fills it. */
  containerRef: RefObject<Element | null>;
  beams?: Beam[];
  /** Static track color. */
  color?: string;
  pulseColor?: string;
  pulseColorEnd?: string;
  /** Stroke width, in px. */
  width?: number;
  /** Bend perpendicular to the beam; negative bends the other way. */
  curvature?: number;
  /** Pulse loop length, in seconds. */
  duration?: number;
  /** Pulse length as a share of the beam (0–1). */
  pulseLength?: number;
  /** How far inside the node edge beams attach, in px. */
  edgeInset?: number;
  className?: string;
  style?: CSSProperties;
}

function edgePoint(rect: Box, toward: [number, number], inset: number): [number, number] {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;
  const dx = toward[0] - cx;
  const dy = toward[1] - cy;
  if (!dx && !dy) return [cx, cy];
  const sx = Math.abs(dx) ? (rect.width / 2 - inset) / Math.abs(dx) : Infinity;
  const sy = Math.abs(dy) ? (rect.height / 2 - inset) / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return [cx + dx * s, cy + dy * s];
}

export default function ConnectBeams({
  containerRef,
  beams = [],
  color = '#3b5dc9',
  pulseColor = '#73eff7',
  pulseColorEnd = '#a7f070',
  width = 2,
  curvature = 0.25,
  duration = 3,
  pulseLength = 0.22,
  edgeInset = 4,
  className = '',
  style
}: ConnectBeamsProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [paths, setPaths] = useState<(BeamPath | null)[]>([]);
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;
    let frame = 0;

    const measure = () => {
      frame = 0;
      const base = container.getBoundingClientRect();
      setBox(prev => (prev.width === base.width && prev.height === base.height ? prev : { width: base.width, height: base.height }));
      const next = beams.map(beam => {
          const a = beam.from?.current;
          const b = beam.to?.current;
          if (!a || !b) return null;
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          const local = (r: DOMRect): Box => ({ x: r.left - base.left, y: r.top - base.top, width: r.width, height: r.height });
          const la = local(ra);
          const lb = local(rb);
          const ca: [number, number] = [la.x + la.width / 2, la.y + la.height / 2];
          const cb: [number, number] = [lb.x + lb.width / 2, lb.y + lb.height / 2];
          const [x1, y1] = edgePoint(la, cb, edgeInset);
          const [x2, y2] = edgePoint(lb, ca, edgeInset);
          const bend = beam.curvature ?? curvature;
          // Control point offset perpendicular to the beam, so parallel beams fan out.
          const mx = (x1 + x2) / 2 - (y2 - y1) * bend;
          const my = (y1 + y2) / 2 + (x2 - x1) * bend;
          return { d: `M${x1.toFixed(1)} ${y1.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`, x1, y1, x2, y2 };
        });
      // Skip identical results so inline `beams` arrays can't cause a render loop.
      setPaths(prev => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    const observer = new ResizeObserver(schedule);
    observer.observe(container);
    beams.forEach(beam => {
      if (beam.from?.current) observer.observe(beam.from.current);
      if (beam.to?.current) observer.observe(beam.to.current);
    });
    window.addEventListener('resize', schedule);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [containerRef, beams, curvature, edgeInset]);

  return (
    <svg className={`bl-beams ${className}`} width={box.width} height={box.height} viewBox={`0 0 ${box.width || 1} ${box.height || 1}`} aria-hidden="true" style={style}>
      <defs>
        {paths.map((path, index) =>
          path ? (
            <linearGradient key={index} id={`${uid}-g${index}`} gradientUnits="userSpaceOnUse" x1={path.x1} y1={path.y1} x2={path.x2} y2={path.y2}>
              <stop offset="0" stopColor={beams[index].pulseColor ?? pulseColor} />
              <stop offset="1" stopColor={beams[index].pulseColorEnd ?? pulseColorEnd} />
            </linearGradient>
          ) : null
        )}
      </defs>
      {paths.map((path, index) => {
        if (!path) return null;
        const beam = beams[index];
        const reverse = beam.reverse;
        const dur = beam.duration ?? duration;
        return (
          <g key={index}>
            <path d={path.d} fill="none" stroke={beam.color ?? color} strokeWidth={width} strokeOpacity="0.35" strokeLinecap="round" />
            <path
              className="bl-beams__pulse"
              d={path.d}
              fill="none"
              pathLength="1"
              stroke={`url(#${uid}-g${index})`}
              strokeWidth={width + 0.5}
              strokeLinecap="round"
              strokeDasharray={`${pulseLength} ${1 + pulseLength}`}
              style={{
                '--bl-dur': `${dur}s`,
                '--bl-from': reverse ? -1 : pulseLength,
                '--bl-to': reverse ? pulseLength : -1,
                animationDelay: `${beam.delay ?? -index * 0.6}s`
              } as CSSVars}
            />
          </g>
        );
      })}
    </svg>
  );
}
