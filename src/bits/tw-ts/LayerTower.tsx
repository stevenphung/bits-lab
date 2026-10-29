import { useInsertionEffect, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

const STYLE_ID = 'bl-layer-tower-tw';
const CSS = `
/* theme tokens */
.bl-tower { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-slab: #566c86; }
:where(.light, [data-theme="light"]) .bl-tower, .bl-tower:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-slab: #8a96a3; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-tower, :where(.light, [data-theme="light"]) .bl-tower:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-slab: #566c86; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-tower, .bl-tower:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-slab: #8a96a3; } }
/* theme tokens end */
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
      className={`bl-tower box-border flex w-[min(var(--bl-w),100%)] flex-wrap items-center gap-x-5 gap-y-4 bg-(--bl-bg) p-4 font-(family-name:--bl-font) text-[14px] text-(--bl-ink) shadow-[inset_0_0_0_3px_var(--bl-line)] ${className}`}
      role="group"
      aria-label={label}
      style={{ '--bl-w': `${width}px`, '--bl-tw': `${towerWidth}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-slab': slabColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <svg className="block h-auto w-(--bl-tw) max-w-full flex-none overflow-visible" viewBox={`0 0 200 ${height}`} aria-hidden="true">
        {layers
          .map((layer, i) => ({ layer, y: 20 + HD + i * STEP }))
          .reverse()
          .map(({ layer, y }) => (
            <g key={layer.id} className="[transition:transform_200ms_steps(3)] data-[active]:[transform:translate(-24px,11px)] motion-reduce:[transition:none]" data-active={layer.id === current ? '' : undefined} style={{ '--c': tint(layer) } as CSSVars} onPointerEnter={() => choose(layer.id)}>
              <polygon className="fill-[color-mix(in_srgb,var(--c)_72%,#000)]" points={`${CX - HW},${y} ${CX},${y + HD} ${CX},${y + HD + T} ${CX - HW},${y + T}`} />
              <polygon className="fill-[color-mix(in_srgb,var(--c)_52%,#000)]" points={`${CX},${y + HD} ${CX + HW},${y} ${CX + HW},${y + T} ${CX},${y + HD + T}`} />
              <polygon className="fill-(--c) stroke-[rgba(0,0,0,0.25)] stroke-1" points={`${CX},${y - HD} ${CX + HW},${y} ${CX},${y + HD} ${CX - HW},${y}`} />
            </g>
          ))}
      </svg>
      <ul className="m-0 grid flex-[1_1_200px] list-none gap-1 p-0">
        {layers.map(layer => (
          <li key={layer.id}>
            <button
              type="button"
              className="grid w-full cursor-pointer gap-1 border-0 bg-transparent px-2.5 py-2 text-left text-inherit shadow-[inset_3px_0_0_var(--bl-line)] hover:bg-(--bl-chip) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid aria-pressed:bg-(--bl-chip) aria-pressed:shadow-[inset_3px_0_0_var(--c)]"
              aria-pressed={layer.id === current}
              style={{ '--c': layer.color ?? 'var(--bl-accent)' } as CSSVars}
              onClick={() => choose(layer.id)}
              onFocus={() => choose(layer.id)}
              onPointerEnter={() => choose(layer.id)}
            >
              <span className="font-extrabold">{layer.label}</span>
              {layer.description && layer.id === current && <span className="text-[13px] leading-[1.4] text-(--bl-muted)">{layer.description}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
