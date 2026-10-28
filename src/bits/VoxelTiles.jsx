import { useEffect, useId, useInsertionEffect, useMemo, useRef, useState } from 'react';

// Isometric voxel island from a heightmap. Each cell becomes a column of pixel blocks colored
// by height (water, sand, grass, forest, stone, snow), the island rises in on a diagonal
// wave, water bobs, and hovering lifts a tile. Pass your own 2-D `map` of heights or let it
// generate one from a seed. One tab stop: arrow keys walk a cursor, Enter selects, and the
// tile under the cursor is announced.

const STYLE_ID = 'bl-voxel-tiles';
const CSS = `
.bl-vox { display: block; width: 100%; max-width: var(--bl-w); height: auto; margin: 0 auto; overflow: visible; outline: none; }
.bl-vox:focus-visible { outline: 2px dashed var(--bl-hi); outline-offset: 6px; }
.bl-vox__tile { transition: transform 160ms steps(3); animation: bl-vox-rise 560ms cubic-bezier(.25,1.4,.5,1) backwards; animation-delay: calc(var(--d) * 1ms); cursor: pointer; }
.bl-vox__tile:hover, .bl-vox__tile[data-cursor], .bl-vox__tile[data-selected] { transform: translateY(calc(var(--bl-lift) * -1px)); }
.bl-vox__tile[data-cursor] .bl-vox__top, .bl-vox__tile[data-selected] .bl-vox__top { stroke: var(--bl-hi); stroke-width: 1.5; }
.bl-vox__tile[data-water] .bl-vox__top { transform-box: fill-box; animation: bl-vox-bob 2.6s ease-in-out infinite; animation-delay: calc(var(--d) * -4ms); }
.bl-vox[data-paused] .bl-vox__top { animation-play-state: paused; }
.bl-vox__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-vox-rise { from { transform: translateY(40px); opacity: 0; } }
@keyframes bl-vox-bob { 50% { transform: translateY(1.5px); } }
@media (prefers-reduced-motion: reduce) { .bl-vox__tile { animation: none; transition: none; } .bl-vox__tile[data-water] .bl-vox__top { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export const DEFAULT_BIOMES = [
  { max: 0, name: 'Water', color: '#41a6f6' },
  { max: 1, name: 'Sand', color: '#ffcd75' },
  { max: 3, name: 'Grass', color: '#38b764' },
  { max: 4, name: 'Forest', color: '#257179' },
  { max: 5, name: 'Stone', color: '#94b0c2' },
  { max: Infinity, name: 'Snow', color: '#f4f4f4' }
];

function random(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A small island: smoothed, re-stretched noise shaped by a falloff from the centre.
export function generateHeightmap(size = 12, seed = 3) {
  const rand = random(seed);
  let grid = Array.from({ length: size }, () => Array.from({ length: size }, () => rand()));
  for (let pass = 0; pass < 2; pass++) {
    grid = grid.map((row, y) =>
      row.map((_, x) => {
        let sum = 0;
        let n = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const v = grid[y + dy]?.[x + dx];
            if (v !== undefined) {
              sum += v;
              n++;
            }
          }
        }
        return sum / n;
      })
    );
  }
  // Smoothing squeezes the noise toward 0.5; stretch it back to 0–1 so peaks stay tall.
  const flat = grid.flat();
  const lo = Math.min(...flat);
  const span = Math.max(...flat) - lo || 1;
  const c = (size - 1) / 2;
  return grid.map((row, y) =>
    row.map((v, x) => {
      const falloff = Math.max(0, 1 - Math.hypot(x - c, y - c) / (size * 0.58));
      return Math.max(0, Math.round(falloff ** 0.8 * (0.25 + ((v - lo) / span) * 1.1) * 8 - 1));
    })
  );
}

function shade(hex, amount) {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  const f = ch => Math.round(((n >> ch) & 255) * amount);
  return `rgb(${f(16)},${f(8)},${f(0)})`;
}

export default function VoxelTiles({
  map,
  size = 12,
  seed = 3,
  tileSize = 32,
  heightUnit = 8,
  lift = 6,
  stagger = 30,
  biomes = DEFAULT_BIOMES,
  selectable = true,
  onTileSelect,
  highlightColor = '#f4f4f4',
  label = 'Voxel island',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const heights = useMemo(() => map ?? generateHeightmap(size, seed), [map, size, seed]);
  const rows = heights.length;
  const cols = heights[0]?.length ?? 0;
  const [cursor, setCursor] = useState(null);
  const [selected, setSelected] = useState(null);
  const [paused, setPaused] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    const io = new IntersectionObserver(([entry]) => setPaused(!entry.isIntersecting));
    io.observe(svgRef.current);
    return () => io.disconnect();
  }, []);

  const a = tileSize / 2;
  const biomeOf = h => biomes.find(b => h <= b.max) ?? biomes[biomes.length - 1];
  const maxH = Math.max(0, ...heights.flat());
  const minX = -rows * a;
  const top = -(maxH + 1) * heightUnit - a / 2 - lift - 2;
  const viewW = (rows + cols) * a;
  const viewH = (rows + cols) * (a / 2) + a / 2 - top + 4;

  // Painter's order: back to front along the diagonals.
  const tiles = [];
  for (let s = 0; s < rows + cols - 1; s++) {
    for (let y = 0; y < rows; y++) {
      const x = s - y;
      if (x < 0 || x >= cols) continue;
      tiles.push({ x, y, h: heights[y][x] });
    }
  }

  const describe = tile => (tile ? `${biomeOf(tile.h).name}, height ${tile.h}, column ${tile.x + 1}, row ${tile.y + 1}` : '');
  const select = tile => {
    if (!selectable) return;
    setSelected(tile);
    onTileSelect?.({ ...tile, biome: biomeOf(tile.h).name });
  };

  const onKeyDown = event => {
    const moves = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] };
    if (event.key in moves) {
      event.preventDefault();
      const [dx, dy] = moves[event.key];
      const from = cursor ?? { x: Math.floor(cols / 2), y: Math.floor(rows / 2) };
      const x = Math.max(0, Math.min(cols - 1, from.x + (cursor ? dx : 0)));
      const y = Math.max(0, Math.min(rows - 1, from.y + (cursor ? dy : 0)));
      setCursor({ x, y, h: heights[y][x] });
    } else if ((event.key === 'Enter' || event.key === ' ') && cursor) {
      event.preventDefault();
      select(cursor);
    } else if (event.key === 'Escape') {
      setCursor(null);
    }
  };

  return (
    <>
      <svg
        ref={svgRef}
        className={`bl-vox ${className}`}
        viewBox={`${minX} ${top} ${viewW} ${viewH}`}
        role="application"
        aria-roledescription="tile map"
        aria-label={`${label}. ${cols} by ${rows} tiles. Use arrow keys to move${selectable ? ' and Enter to select' : ''}.`}
        aria-describedby={`${uid}-status`}
        tabIndex={0}
        data-paused={paused || undefined}
        onKeyDown={onKeyDown}
        onFocus={() => setCursor(c => c ?? { x: Math.floor(cols / 2), y: Math.floor(rows / 2), h: heights[Math.floor(rows / 2)][Math.floor(cols / 2)] })}
        onBlur={() => setCursor(null)}
        style={{ '--bl-w': `${viewW * 1.5}px`, '--bl-hi': highlightColor, '--bl-lift': lift, ...style }}
      >
        {tiles.map(tile => {
          const { x, y, h } = tile;
          const biome = biomeOf(h);
          const water = h <= 0;
          const sx = (x - y) * a;
          const sy = (x + y) * (a / 2);
          const H = water ? heightUnit * 0.6 : (h + 1) * heightUnit;
          const t = sy - H;
          return (
            <g
              key={`${x}-${y}`}
              className="bl-vox__tile"
              data-water={water || undefined}
              data-cursor={(cursor && cursor.x === x && cursor.y === y) || undefined}
              data-selected={(selected && selected.x === x && selected.y === y) || undefined}
              style={{ '--d': (x + y) * stagger }}
              onClick={() => select(tile)}
              shapeRendering="crispEdges"
            >
              <polygon points={`${sx - a},${t} ${sx},${t + a / 2} ${sx},${sy + a / 2} ${sx - a},${sy}`} fill={shade(biome.color, water ? 0.7 : 0.72)} />
              <polygon points={`${sx},${t + a / 2} ${sx + a},${t} ${sx + a},${sy} ${sx},${sy + a / 2}`} fill={shade(biome.color, water ? 0.55 : 0.52)} />
              <polygon className="bl-vox__top" points={`${sx},${t - a / 2} ${sx + a},${t} ${sx},${t + a / 2} ${sx - a},${t}`} fill={biome.color} fillOpacity={water ? 0.9 : 1} />
              {!water && <polyline points={`${sx - a},${t} ${sx},${t - a / 2} ${sx + a},${t}`} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />}
            </g>
          );
        })}
      </svg>
      <span id={`${uid}-status`} className="bl-vox__sr" aria-live="polite">
        {cursor ? describe(cursor) : selected ? `Selected: ${describe(selected)}` : ''}
      </span>
    </>
  );
}
