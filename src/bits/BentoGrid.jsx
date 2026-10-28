import { useInsertionEffect, useRef } from 'react';

// Responsive bento grid. Cards span columns and rows, light their border where the cursor is
// (neighbouring cards catch the glow too), lift their content on hover or focus to reveal a
// call to action. Layout collapses with container queries, so it fits any parent width.

const STYLE_ID = 'bl-bento';
const CSS = `
.bl-bento-wrap { container-type: inline-size; width: 100%; }
.bl-bento { display: grid; grid-template-columns: repeat(var(--bl-cols), minmax(0, 1fr)); grid-auto-rows: var(--bl-row); gap: var(--bl-gap); }
.bl-bento__card { --bl-mx: -999px; --bl-my: -999px; position: relative; grid-column: span var(--bl-cs, 1); grid-row: span var(--bl-rs, 1); display: flex; flex-direction: column; justify-content: flex-end; min-width: 0; overflow: hidden; padding: 22px; border-radius: var(--bl-radius); background: var(--bl-card); color: var(--bl-ink); isolation: isolate; text-decoration: none; outline: none; box-shadow: inset 0 0 0 1px var(--bl-line); transition: transform 240ms cubic-bezier(.2,.8,.2,1); }
.bl-bento__card::before { content: ""; position: absolute; inset: 0; z-index: 3; border-radius: inherit; padding: 1.5px; pointer-events: none; background: radial-gradient(var(--bl-spot-size) circle at var(--bl-mx) var(--bl-my), var(--bl-spot), transparent 60%); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); }
.bl-bento__card::after { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; background: radial-gradient(calc(var(--bl-spot-size) * 1.4) circle at var(--bl-mx) var(--bl-my), var(--bl-wash), transparent 55%); }
.bl-bento__bg { position: absolute; inset: 0; z-index: -2; overflow: hidden; }
.bl-bento__bg > img, .bl-bento__bg > video { width: 100%; height: 100%; object-fit: cover; }
.bl-bento__bg::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, var(--bl-card) 8%, transparent 70%); }
.bl-bento__body { position: relative; transform: translateY(var(--bl-lift)); transition: transform 300ms cubic-bezier(.2,.8,.2,1); }
.bl-bento__icon { display: inline-grid; place-items: center; width: 40px; height: 40px; margin-bottom: 14px; border-radius: 10px; background: var(--bl-chip); color: var(--bl-accent); }
.bl-bento__title { margin: 0 0 6px; font: 700 var(--bl-title-size)/1.2 var(--bl-font); }
.bl-bento__desc { margin: 0; color: var(--bl-muted); font: 400 14px/1.5 var(--bl-font-body); }
.bl-bento__cta { position: absolute; left: 0; top: 100%; display: inline-flex; align-items: center; gap: 6px; padding-top: 12px; color: var(--bl-accent); font: 600 13px/1 var(--bl-font-body); opacity: 0; transition: opacity 220ms; }
.bl-bento__card[data-cta] { --bl-lift: 0px; }
.bl-bento__card[data-cta]:hover, .bl-bento__card[data-cta]:focus-within, .bl-bento__card[data-cta]:focus-visible { --bl-lift: -30px; }
.bl-bento__card[data-cta]:hover .bl-bento__cta, .bl-bento__card[data-cta]:focus-within .bl-bento__cta, .bl-bento__card[data-cta]:focus-visible .bl-bento__cta { opacity: 1; }
.bl-bento__card:focus-visible { box-shadow: inset 0 0 0 2px var(--bl-accent); }
a.bl-bento__card:hover { transform: translateY(-2px); }
@container (max-width: 860px) {
  .bl-bento { grid-template-columns: repeat(min(var(--bl-cols), 2), minmax(0, 1fr)); }
  .bl-bento__card { grid-column: span min(var(--bl-cs, 1), 2); }
}
@container (max-width: 560px) {
  .bl-bento { grid-template-columns: minmax(0, 1fr); grid-auto-rows: minmax(var(--bl-row), auto); }
  .bl-bento__card { grid-column: span 1; grid-row: span 1; }
  .bl-bento__card[data-cta] { --bl-lift: -30px; }
  .bl-bento__card[data-cta] .bl-bento__cta { opacity: 1; }
}
@media (hover: none) {
  .bl-bento__card[data-cta] { --bl-lift: -30px; }
  .bl-bento__card[data-cta] .bl-bento__cta { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) { .bl-bento__card, .bl-bento__body { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export function BentoCard({ colSpan = 1, rowSpan = 1, title, description, icon, background, cta = 'Learn more', href, onClick, children, className = '', style }) {
  const Tag = href ? 'a' : onClick ? 'button' : 'div';
  const interactive = Boolean(href || onClick);
  return (
    <Tag
      className={`bl-bento__card ${className}`}
      data-cta={interactive && cta ? '' : undefined}
      href={href}
      onClick={onClick}
      type={Tag === 'button' ? 'button' : undefined}
      tabIndex={Tag === 'div' ? undefined : 0}
      style={{ '--bl-cs': colSpan, '--bl-rs': rowSpan, textAlign: 'left', border: 0, cursor: interactive ? 'pointer' : undefined, ...style }}
    >
      {background && (
        <div className="bl-bento__bg" aria-hidden="true">
          {background}
        </div>
      )}
      <div className="bl-bento__body">
        {icon && (
          <span className="bl-bento__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {title && <h3 className="bl-bento__title">{title}</h3>}
        {description && <p className="bl-bento__desc">{description}</p>}
        {children}
        {interactive && cta && (
          <span className="bl-bento__cta" aria-hidden="true">
            {cta} →
          </span>
        )}
      </div>
    </Tag>
  );
}

export default function BentoGrid({
  children,
  columns = 3,
  rowHeight = 200,
  gap = 14,
  radius = 18,
  cardColor = '#1a1c2c',
  lineColor = 'rgba(255,255,255,0.08)',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  accentColor = '#73eff7',
  chipColor = 'rgba(115,239,247,0.12)',
  spotlightColor = 'rgba(115,239,247,0.85)',
  washColor = 'rgba(115,239,247,0.08)',
  spotlightSize = 320,
  titleSize = 18,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  bodyFontFamily,
  className = '',
  style
}) {
  useStyles();
  const ref = useRef(null);

  // One listener on the grid positions the light in every card, so neighbours glow too.
  const onPointerMove = event => {
    for (const card of ref.current.children) {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--bl-mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--bl-my', `${event.clientY - rect.top}px`);
    }
  };
  const onPointerLeave = () => {
    for (const card of ref.current.children) {
      card.style.setProperty('--bl-mx', '-999px');
      card.style.setProperty('--bl-my', '-999px');
    }
  };

  return (
    <div className={`bl-bento-wrap ${className}`} style={style}>
      <div
        ref={ref}
        className="bl-bento"
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{
          '--bl-cols': columns,
          '--bl-row': `${rowHeight}px`,
          '--bl-gap': `${gap}px`,
          '--bl-radius': `${radius}px`,
          '--bl-card': cardColor,
          '--bl-line': lineColor,
          '--bl-ink': textColor,
          '--bl-muted': mutedColor,
          '--bl-accent': accentColor,
          '--bl-chip': chipColor,
          '--bl-spot': spotlightColor,
          '--bl-wash': washColor,
          '--bl-spot-size': `${spotlightSize}px`,
          '--bl-title-size': `${titleSize}px`,
          '--bl-font': fontFamily,
          '--bl-font-body': bodyFontFamily ?? fontFamily
        }}
      >
        {children}
      </div>
    </div>
  );
}
