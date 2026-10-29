import { useId, useInsertionEffect, useState } from 'react';

// A treasure chest for "what's inside": hover it (or press it) and the lid swings open, light
// spills out and the items fan out above it. Good for a folder, a bundle or a plan's perks.
// Open can be controlled; trigger "click" opens on press only. The chest is a button with
// aria-expanded, and the items are a real list. Reduced motion opens it without the fan.

const STYLE_ID = 'bl-chest-reveal';
const CSS = `
/* theme tokens */
.bl-chest { --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-chest, .bl-chest:where(.light, [data-theme="light"]) { --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-chest, :where(.light, [data-theme="light"]) .bl-chest:where(.dark, [data-theme="dark"]) { --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-chest, .bl-chest:where([data-theme="system"]) { --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-chest { position: relative; display: inline-grid; justify-items: center; gap: 8px; width: var(--bl-box); padding-top: calc(var(--bl-r) + 34px); color: var(--bl-ink); font-family: var(--bl-font); font-size: 13px; }
.bl-chest__items { position: absolute; top: calc(var(--bl-r) + 34px); left: 50%; width: 0; height: 0; margin: 0; padding: 0; list-style: none; }
.bl-chest__item { position: absolute; top: -24px; left: -40px; display: grid; justify-items: center; gap: 4px; width: 80px; opacity: 0; visibility: hidden; transform: translate(0, 12px) scale(0.3); transition: transform 300ms steps(4), opacity 300ms steps(4), visibility 0s 300ms; }
.bl-chest[data-open] .bl-chest__item { opacity: 1; visibility: visible; transform: translate(var(--x), var(--y)); transition: transform 300ms steps(4) calc(var(--i) * 60ms), opacity 300ms steps(4) calc(var(--i) * 60ms), visibility 0s calc(var(--i) * 60ms); }
.bl-chest__icon { display: grid; place-items: center; width: 36px; height: 36px; background: var(--bl-chip); font-size: 18px; box-shadow: inset 0 0 0 2px var(--bl-line), 3px 3px 0 rgba(0,0,0,0.35); }
.bl-chest__label { max-width: 100%; overflow: hidden; font-size: 11px; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.bl-chest__btn { display: block; padding: 0; border: 0; background: none; color: inherit; cursor: pointer; }
.bl-chest__btn:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 4px; }
.bl-chest__art { display: block; width: var(--bl-size); height: auto; overflow: visible; }
.bl-chest__open, .bl-chest__glow { display: none; }
.bl-chest[data-open] .bl-chest__shut { display: none; }
.bl-chest[data-open] .bl-chest__open { display: inline; }
.bl-chest[data-open] .bl-chest__glow { display: inline; animation: bl-chest-glow 900ms steps(2) infinite; }
.bl-chest[data-open] .bl-chest__art { animation: bl-chest-jolt 240ms steps(3); }
.bl-chest__caption { margin: 0; color: var(--bl-muted); font-size: 12px; text-align: center; }
@keyframes bl-chest-glow { 50% { opacity: 0.4; } }
@keyframes bl-chest-jolt { 50% { transform: translateY(-4%); } }
@media (prefers-reduced-motion: reduce) { .bl-chest__item, .bl-chest[data-open] .bl-chest__item { transition: none; } .bl-chest[data-open] .bl-chest__glow, .bl-chest[data-open] .bl-chest__art { animation: none; } }
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
      className={`bl-chest ${className}`}
      data-open={isOpen ? '' : undefined}
      {...hover}
      style={{ '--bl-size': `${size}px`, '--bl-r': `${radius}px`, '--bl-box': `${Math.max(size, radius * 2 + 80)}px`, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      <ul id={listId} className="bl-chest__items" aria-hidden={isOpen ? undefined : true}>
        {items.map((item, i) => {
          const angle = ((items.length > 1 ? i / (items.length - 1) - 0.5 : 0) * span * Math.PI) / 180;
          return (
            <li key={item.id ?? i} className="bl-chest__item" style={{ '--i': i, '--x': `${Math.round(Math.sin(angle) * radius)}px`, '--y': `${Math.round(-Math.cos(angle) * radius)}px` }}>
              <span className="bl-chest__icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="bl-chest__label">{item.label}</span>
            </li>
          );
        })}
      </ul>
      <button type="button" className="bl-chest__btn" aria-label={label} aria-expanded={isOpen} aria-controls={listId} onClick={() => set(!isOpen)}>
        <svg className="bl-chest__art" viewBox="0 -4 20 20" shapeRendering="crispEdges" aria-hidden="true">
          <g className="bl-chest__glow">{draw(GLOW)}</g>
          {draw(BOX)}
          <g className="bl-chest__shut">{draw(SHUT)}</g>
          <g className="bl-chest__open">{draw(OPEN)}</g>
        </svg>
      </button>
      {caption && <p className="bl-chest__caption">{caption}</p>}
    </div>
  );
}
