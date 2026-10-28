import { useEffect, useId, useInsertionEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Game world map for onboarding, courses or roadmaps. Levels wind along a dotted trail that
// re-flows to the container width; cleared stretches draw in, the current level bounces a marker,
// locked levels are disabled. Levels: { id, label?, name?, status: 'cleared'|'current'|'available'|'locked', stars? }

const STYLE_ID = 'bl-level-map';
const CSS = `
.bl-lvl { position: relative; width: 100%; font-family: var(--bl-font, "Press Start 2P", ui-monospace, monospace); }
.bl-lvl__svg { position: absolute; inset: 0; overflow: visible; pointer-events: none; }
.bl-lvl__reveal { stroke-dasharray: 1; stroke-dashoffset: 1; animation: bl-lvl-draw var(--bl-draw) steps(24) 200ms forwards; }
.bl-lvl__node { position: absolute; display: grid; place-items: center; width: var(--bl-node); height: var(--bl-node); margin: calc(var(--bl-node) / -2) 0 0 calc(var(--bl-node) / -2); padding: 0; border: 0; cursor: pointer;
  background: var(--bl-face); color: #0b0b14; font-size: calc(var(--bl-node) / 4);
  box-shadow: 0 -4px 0 0 #0b0b14, 0 4px 0 0 #0b0b14, -4px 0 0 0 #0b0b14, 4px 0 0 0 #0b0b14, inset -4px -4px 0 0 rgba(0,0,0,0.25), inset 4px 4px 0 0 rgba(255,255,255,0.3); }
.bl-lvl__node:hover:not([aria-disabled="true"]) { filter: brightness(1.12); transform: translateY(-2px); }
.bl-lvl__node:focus-visible { outline: 4px solid #f4f4f4; outline-offset: 6px; }
.bl-lvl__node[aria-disabled="true"] { cursor: not-allowed; filter: grayscale(1) brightness(0.6); }
.bl-lvl__node[data-status="current"] { animation: bl-lvl-pulse 1s steps(2) infinite; }
.bl-lvl__marker { position: absolute; left: 50%; bottom: calc(100% + 8px); transform: translateX(-50%); animation: bl-lvl-bounce 0.7s steps(3) infinite alternate; pointer-events: none; }
.bl-lvl__name { position: absolute; top: calc(100% + 12px); left: 50%; transform: translateX(-50%); width: max-content; max-width: 140px; color: var(--bl-text); font-size: 8px; line-height: 1.5; text-align: center; text-transform: uppercase; pointer-events: none; }
.bl-lvl__stars { display: block; margin-top: 4px; color: #ffcd75; letter-spacing: 2px; }
@keyframes bl-lvl-draw { to { stroke-dashoffset: 0; } }
@keyframes bl-lvl-pulse { 50% { box-shadow: 0 -4px 0 0 #f4f4f4, 0 4px 0 0 #f4f4f4, -4px 0 0 0 #f4f4f4, 4px 0 0 0 #f4f4f4, inset -4px -4px 0 0 rgba(0,0,0,0.25), inset 4px 4px 0 0 rgba(255,255,255,0.3); } }
@keyframes bl-lvl-bounce { to { transform: translate(-50%, -8px); } }
@media (prefers-reduced-motion: reduce) {
  .bl-lvl__reveal { animation: none; stroke-dashoffset: 0; }
  .bl-lvl__node[data-status="current"], .bl-lvl__marker { animation: none; }
}
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const Lock = () => (
  <svg width="45%" height="45%" viewBox="0 0 8 8" shapeRendering="crispEdges" fill="#0b0b14" aria-hidden="true">
    <rect x="2" y="0" width="4" height="1" />
    <rect x="1" y="1" width="1" height="3" />
    <rect x="6" y="1" width="1" height="3" />
    <rect x="0" y="4" width="8" height="4" />
  </svg>
);

export type LevelStatus = 'cleared' | 'current' | 'available' | 'locked';

export interface Level {
  id?: string | number;
  name?: string;
  status: LevelStatus;
  /** 0–3 stars, shown under the name. */
  stars?: number;
  /** Text on the node instead of its number. */
  label?: ReactNode;
}

export interface LevelMapProps {
  levels?: Level[];
  /** Node diameter, in px. */
  nodeSize?: number;
  /** Minimum horizontal spacing between nodes, in px. */
  minSpacing?: number;
  /** Vertical distance between rows, in px. */
  rowGap?: number;
  padding?: number;
  pathColor?: string;
  /** Color of the path already traveled. */
  clearedColor?: string;
  textColor?: string;
  /** Custom "you are here" marker over the current level. */
  marker?: ReactNode;
  /** Path draw-in length, in ms. */
  drawDuration?: number;
  fontFamily?: string;
  /** Called when an unlocked level is chosen. */
  onSelect?: (level: Level, index: number) => void;
  className?: string;
  style?: CSSProperties;
}

interface Point {
  x: number;
  y: number;
  row: number;
}

const STATUS_COLORS: Record<LevelStatus, string> = { cleared: '#38b764', current: '#ffcd75', available: '#41a6f6', locked: '#566c86' };

// Serpentine layout: left-to-right, then right-to-left, with a gentle wave.
function layout(count: number, width: number, { nodeSize, minSpacing, rowGap, padding }: { nodeSize: number; minSpacing: number; rowGap: number; padding: number }) {
  const inner = Math.max(nodeSize, width - padding * 2 - nodeSize);
  const perRow = Math.max(2, Math.floor(inner / minSpacing) + 1);
  const spacing = inner / (perRow - 1);
  const points = Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const x = padding + nodeSize / 2 + (row % 2 ? perRow - 1 - col : col) * spacing;
    const y = padding + nodeSize / 2 + 40 + row * rowGap + Math.sin(col * 1.3 + row) * rowGap * 0.12;
    return { x, y, row };
  });
  const rows = Math.ceil(count / perRow);
  return { points, height: padding * 2 + nodeSize + 40 + (rows - 1) * rowGap + 70 };
}

function pathThrough(points: Point[]) {
  if (!points.length) return '';
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (a.row === b.row) {
      d += ` Q${(a.x + b.x) / 2} ${(a.y + b.y) / 2 - 18} ${b.x} ${b.y}`;
    } else {
      // Row change: bulge out past the edge, like a winding road.
      const bulge = a.x > b.x || a.row % 2 === 0 ? 80 : -80;
      d += ` C${a.x + bulge} ${a.y} ${b.x + bulge} ${b.y} ${b.x} ${b.y}`;
    }
  }
  return d;
}

const DEFAULT_LEVELS: Level[] = [
  { id: 1, name: 'Spawn point', status: 'cleared', stars: 3 },
  { id: 2, name: 'Oak woods', status: 'cleared', stars: 2 },
  { id: 3, name: 'Copper cave', status: 'cleared', stars: 3 },
  { id: 4, name: 'Sunken temple', status: 'current' },
  { id: 5, name: 'Lava bridge', status: 'available' },
  { id: 6, name: 'Sky isles', status: 'locked' },
  { id: 7, name: 'Crystal depths', status: 'locked' },
  { id: 8, name: 'The dragon', status: 'locked' }
];

export default function LevelMap({
  levels = DEFAULT_LEVELS,
  nodeSize = 56,
  minSpacing = 130,
  rowGap = 150,
  padding = 24,
  pathColor = '#566c86',
  clearedColor = '#a7f070',
  textColor = '#f4f4f4',
  marker,
  drawDuration = 1200,
  fontFamily,
  onSelect,
  className = '',
  style
}: LevelMapProps) {
  useStyles();
  const maskId = `bl-lvl-mask-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const { points, height } = useMemo(
    () => layout(levels.length, width, { nodeSize, minSpacing, rowGap, padding }),
    [levels.length, width, nodeSize, minSpacing, rowGap, padding]
  );
  const fullPath = useMemo(() => pathThrough(points), [points]);
  const progressIndex = Math.max(0, levels.findIndex(level => level.status === 'current'), levels.filter(level => level.status === 'cleared').length - 1);
  const clearedPath = useMemo(() => pathThrough(points.slice(0, progressIndex + 1)), [points, progressIndex]);

  const focusNode = (index: number) => nodeRefs.current[Math.max(0, Math.min(levels.length - 1, index))]?.focus();

  return (
    <div
      ref={rootRef}
      className={`bl-lvl ${className}`}
      role="list"
      aria-label="Level map"
      style={{ height, '--bl-node': `${nodeSize}px`, '--bl-text': textColor, '--bl-draw': `${drawDuration}ms`, ...(fontFamily ? { '--bl-font': fontFamily } : null), ...style } as CSSVars}
    >
      <svg className="bl-lvl__svg" width="100%" height={height} aria-hidden="true" shapeRendering="crispEdges">
        <defs>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            {/* Re-keyed so the draw-in replays when progress changes. */}
            <path key={progressIndex} className="bl-lvl__reveal" d={clearedPath} pathLength="1" fill="none" stroke="#fff" strokeWidth="24" />
          </mask>
        </defs>
        <path d={fullPath} fill="none" stroke={pathColor} strokeWidth="6" strokeDasharray="6 12" strokeLinecap="square" />
        <path
          d={clearedPath}
          fill="none"
          stroke={clearedColor}
          strokeWidth="8"
          strokeDasharray="8 10"
          strokeLinecap="square"
          mask={`url(#${maskId})`}
        />
      </svg>
      {levels.map((level, index) => {
        const point = points[index];
        const locked = level.status === 'locked';
        return (
          <div key={level.id ?? index} role="listitem">
            <button
              ref={el => {
                nodeRefs.current[index] = el;
              }}
              type="button"
              className="bl-lvl__node"
              data-status={level.status}
              aria-disabled={locked || undefined}
              aria-current={level.status === 'current' ? 'step' : undefined}
              aria-label={`Level ${index + 1}${level.name ? `: ${level.name}` : ''}, ${level.status}${level.stars ? `, ${level.stars} of 3 stars` : ''}`}
              style={{ left: point.x, top: point.y, '--bl-face': STATUS_COLORS[level.status] ?? STATUS_COLORS.available } as CSSVars}
              onClick={() => !locked && onSelect?.(level, index)}
              onKeyDown={event => {
                if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
                  event.preventDefault();
                  focusNode(index + 1);
                }
                if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
                  event.preventDefault();
                  focusNode(index - 1);
                }
              }}
            >
              <span aria-hidden="true">{locked ? <Lock /> : level.status === 'cleared' ? '✓' : level.label ?? index + 1}</span>
              {level.status === 'current' && (
                <span className="bl-lvl__marker" aria-hidden="true">
                  {marker ?? <span style={{ fontSize: 22, color: '#ffcd75' }}>▼</span>}
                </span>
              )}
              {level.name && (
                <span className="bl-lvl__name" aria-hidden="true">
                  {level.name}
                  {level.stars ? <span className="bl-lvl__stars">{'★'.repeat(level.stars)}{'☆'.repeat(3 - level.stars)}</span> : null}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}
