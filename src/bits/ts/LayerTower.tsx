import { useInsertionEffect, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A stack diagram for "how it fits together": an isometric tower of voxel slabs beside a list of
// the layers. Point at a layer (in the list or on the tower) and its slab slides out in colour
// while the rest stay grey, and its description opens. Active can be controlled. The list is
// real buttons with aria-pressed; the tower is decoration. Reduced motion skips the slide.

const STYLE_ID = 'bl-layer-tower';
const CSS = `
/* theme tokens */
.bl-tower { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-slab: #566c86; }
:where(.light, [data-theme="light"]) .bl-tower, .bl-tower:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-slab: #8a96a3; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-tower, :where(.light, [data-theme="light"]) .bl-tower:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-slab: #566c86; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-tower, .bl-tower:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-slab: #8a96a3; } }
/* theme tokens end */
.bl-tower { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 20px; width: min(var(--bl-w), 100%); padding: 16px; box-sizing: border-box; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); font-size: 14px; box-shadow: inset 0 0 0 3px var(--bl-line); }
.bl-tower__art { display: block; flex: none; width: var(--bl-tw); max-width: 100%; height: auto; overflow: visible; }
.bl-tower__slab { transition: transform 200ms steps(3); }
.bl-tower__slab[data-active] { transform: translate(-24px, 11px); }
.bl-tower__top { fill: var(--c); stroke: rgba(0,0,0,0.25); stroke-width: 1; }
.bl-tower__left { fill: color-mix(in srgb, var(--c) 72%, #000); }
.bl-tower__right { fill: color-mix(in srgb, var(--c) 52%, #000); }
.bl-tower__list { display: grid; flex: 1 1 200px; gap: 4px; margin: 0; padding: 0; list-style: none; }
.bl-tower__item { display: grid; gap: 4px; width: 100%; padding: 8px 10px; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; box-shadow: inset 3px 0 0 var(--bl-line); }
.bl-tower__item:hover { background: var(--bl-chip); }
.bl-tower__item[aria-pressed="true"] { background: var(--bl-chip); box-shadow: inset 3px 0 0 var(--c); }
.bl-tower__item:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: -2px; }
.bl-tower__label { font-weight: 800; }
.bl-tower__desc { color: var(--bl-muted); font-size: 13px; line-height: 1.4; }
@media (prefers-reduced-motion: reduce) { .bl-tower__slab { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Slab geometry in viewBox units: half width, half depth, thickness, and the step between slabs.
const HW = 64;
const HD = 30;
const T = 12;
const STEP = 26;
const CX = 100;

export interface TowerLayer {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  color?: string;
}

export interface LayerTowerProps {
  /** Top layer first. */
  layers?: TowerLayer[];
  active?: string;
  defaultActive?: string;
  onActiveChange?: (id: string) => void;
  label?: string;
  width?: number;
  towerWidth?: number;
  backgroundColor?: string;
  chipColor?: string;
  lineColor?: string;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  slabColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function LayerTower({
  layers = [],
  active,
  defaultActive,
  onActiveChange,
  label = 'Layers',
  width = 560,
  towerWidth = 200,
  backgroundColor,
  chipColor,
  lineColor,
  textColor,
  mutedColor,
  accentColor,
  slabColor,
  fontFamily = 'inherit',
  className = '',
  style
}: LayerTowerProps) {
  useStyles();
  const [innerActive, setInnerActive] = useState<string | undefined>(defaultActive ?? layers[0]?.id);
  const current = active ?? innerActive;
  const height = 20 + HD + (layers.length - 1) * STEP + HD + T + 14;

  const choose = (id: string) => {
    if (id === current) return;
    if (active === undefined) setInnerActive(id);
    onActiveChange?.(id);
  };

  const tint = (layer: TowerLayer) => (layer.id === current ? (layer.color ?? 'var(--bl-accent)') : 'var(--bl-slab)');

  return (
    <div
      className={`bl-tower ${className}`}
      role="group"
      aria-label={label}
      style={{ '--bl-w': `${width}px`, '--bl-tw': `${towerWidth}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-slab': slabColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <svg className="bl-tower__art" viewBox={`0 0 200 ${height}`} aria-hidden="true">
        {layers
          .map((layer, i) => ({ layer, y: 20 + HD + i * STEP }))
          .reverse()
          .map(({ layer, y }) => (
            <g key={layer.id} className="bl-tower__slab" data-active={layer.id === current ? '' : undefined} style={{ '--c': tint(layer) } as CSSVars} onPointerEnter={() => choose(layer.id)}>
              <polygon className="bl-tower__left" points={`${CX - HW},${y} ${CX},${y + HD} ${CX},${y + HD + T} ${CX - HW},${y + T}`} />
              <polygon className="bl-tower__right" points={`${CX},${y + HD} ${CX + HW},${y} ${CX + HW},${y + T} ${CX},${y + HD + T}`} />
              <polygon className="bl-tower__top" points={`${CX},${y - HD} ${CX + HW},${y} ${CX},${y + HD} ${CX - HW},${y}`} />
            </g>
          ))}
      </svg>
      <ul className="bl-tower__list">
        {layers.map(layer => (
          <li key={layer.id}>
            <button
              type="button"
              className="bl-tower__item"
              aria-pressed={layer.id === current}
              style={{ '--c': layer.color ?? 'var(--bl-accent)' } as CSSVars}
              onClick={() => choose(layer.id)}
              onFocus={() => choose(layer.id)}
              onPointerEnter={() => choose(layer.id)}
            >
              <span className="bl-tower__label">{layer.label}</span>
              {layer.description && layer.id === current && <span className="bl-tower__desc">{layer.description}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
