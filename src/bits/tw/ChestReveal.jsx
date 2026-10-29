import { useId, useInsertionEffect, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A treasure chest for "what's inside": hover it (or press it) and the lid swings open, light
// spills out and the items fan out above it. Good for a folder, a bundle or a plan's perks.
// Open can be controlled; trigger "click" opens on press only. The chest is a button with
// aria-expanded, and the items are a real list. Reduced motion opens it without the fan.

const STYLE_ID = 'bl-chest-reveal-tw';
const CSS = `
/* theme tokens */
.bl-chest { --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-chest, .bl-chest:where(.light, [data-theme="light"]) { --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-chest, :where(.light, [data-theme="light"]) .bl-chest:where(.dark, [data-theme="dark"]) { --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-chest, .bl-chest:where([data-theme="system"]) { --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; } }
/* theme tokens end */
@keyframes bl-chest-glow { 50% { opacity: 0.4; } }
@keyframes bl-chest-jolt { 50% { transform: translateY(-4%); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const INK = { o: '#0b0b14', w: '#a0703c', W: '#6b4423', g: '#ffcd75', d: '#333c57', p: '#fff4d6' };

// [colour, x, y, width, height] on a 20 × 16 grid (the glow sits above it).
const BOX = [['o', 1, 9, 1, 6], ['o', 18, 9, 1, 6], ['o', 1, 15, 18, 1], ['w', 2, 9, 16, 6], ['W', 3, 11, 14, 1], ['W', 3, 13, 14, 1], ['g', 2, 9, 16, 1], ['g', 8, 9, 4, 4], ['o', 9, 10, 2, 2]];
const SHUT = [['o', 2, 2, 16, 1], ['o', 1, 3, 1, 6], ['o', 18, 3, 1, 6], ['w', 2, 3, 16, 5], ['W', 3, 4, 14, 1], ['g', 2, 7, 16, 1], ['o', 1, 8, 18, 1]];
const OPEN = [['o', 2, 0, 16, 1], ['o', 1, 1, 1, 4], ['o', 18, 1, 1, 4], ['W', 2, 1, 16, 3], ['g', 2, 4, 16, 1], ['o', 1, 5, 1, 4], ['o', 18, 5, 1, 4], ['d', 2, 5, 16, 3], ['p', 2, 8, 16, 1]];
const GLOW = [['p', 6, -3, 1, 2], ['p', 10, -4, 1, 3], ['p', 14, -3, 1, 2], ['g', 4, -1, 1, 1], ['g', 16, -1, 1, 1]];

const draw = rects => rects.map(([key, x, y, width, height], i) => <rect key={i} x={x} y={y} width={width} height={height} fill={INK[key]} />);

export default function ChestReveal({
  items = [],
  open,
  defaultOpen = false,
  onOpenChange,
  trigger = 'hover',
  label = 'Open the chest',
  caption,
  size = 120,
  radius = 96,
  chipColor,
  lineColor,
  textColor,
  mutedColor,
  accentColor,
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const listId = useId();
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const isOpen = open ?? innerOpen;
  const span = Math.min(140, 34 * Math.max(0, items.length - 1));

  const set = next => {
    if (next === isOpen) return;
    if (open === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };

  const hover = trigger === 'hover' ? { onPointerEnter: event => event.pointerType === 'mouse' && set(true), onPointerLeave: event => event.pointerType === 'mouse' && set(false) } : {};

  return (
    <div
      className={`bl-chest group/chest relative inline-grid w-(--bl-box) justify-items-center gap-2 pt-[calc(var(--bl-r)+34px)] font-(family-name:--bl-font) text-[13px] text-(--bl-ink) ${className}`}
      data-open={isOpen ? '' : undefined}
      {...hover}
      style={{ '--bl-size': `${size}px`, '--bl-r': `${radius}px`, '--bl-box': `${Math.max(size, radius * 2 + 80)}px`, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      <ul id={listId} className="absolute top-[calc(var(--bl-r)+34px)] left-1/2 m-0 size-0 list-none p-0" aria-hidden={isOpen ? undefined : true}>
        {items.map((item, i) => {
          const angle = ((items.length > 1 ? i / (items.length - 1) - 0.5 : 0) * span * Math.PI) / 180;
          return (
            <li key={item.id ?? i} className="invisible absolute -top-6 -left-10 grid w-20 justify-items-center gap-1 opacity-0 [transform:translate(0,12px)_scale(0.3)] [transition:transform_300ms_steps(4),opacity_300ms_steps(4),visibility_0s_300ms] group-data-[open]/chest:visible group-data-[open]/chest:opacity-100 group-data-[open]/chest:[transform:translate(var(--x),var(--y))] group-data-[open]/chest:[transition:transform_300ms_steps(4)_calc(var(--i)_*_60ms),opacity_300ms_steps(4)_calc(var(--i)_*_60ms),visibility_0s_calc(var(--i)_*_60ms)] motion-reduce:[transition:none]!" style={{ '--i': i, '--x': `${Math.round(Math.sin(angle) * radius)}px`, '--y': `${Math.round(-Math.cos(angle) * radius)}px` }}>
              <span className="grid size-9 place-items-center bg-(--bl-chip) text-[18px] shadow-[inset_0_0_0_2px_var(--bl-line),3px_3px_0_rgba(0,0,0,0.35)]" aria-hidden="true">
                {item.icon}
              </span>
              <span className="max-w-full overflow-hidden text-[11px] font-extrabold text-ellipsis whitespace-nowrap">{item.label}</span>
            </li>
          );
        })}
      </ul>
      <button type="button" className="block cursor-pointer border-0 bg-transparent p-0 text-inherit focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" aria-label={label} aria-expanded={isOpen} aria-controls={listId} onClick={() => set(!isOpen)}>
        <svg className="block h-auto w-(--bl-size) overflow-visible group-data-[open]/chest:animate-[bl-chest-jolt_240ms_steps(3)] motion-reduce:animate-none!" viewBox="0 -4 20 20" shapeRendering="crispEdges" aria-hidden="true">
          <g className="hidden group-data-[open]/chest:inline group-data-[open]/chest:animate-[bl-chest-glow_900ms_steps(2)_infinite] motion-reduce:animate-none!">{draw(GLOW)}</g>
          {draw(BOX)}
          <g className="group-data-[open]/chest:hidden">{draw(SHUT)}</g>
          <g className="hidden group-data-[open]/chest:inline">{draw(OPEN)}</g>
        </svg>
      </button>
      {caption && <p className="m-0 text-center text-[12px] text-(--bl-muted)">{caption}</p>}
    </div>
  );
}
