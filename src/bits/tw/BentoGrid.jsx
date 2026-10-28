import { useRef } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Responsive bento grid. Cards span columns and rows, light their border where the cursor is
// (neighbouring cards catch the glow too), lift their content on hover or focus to reveal a
// call to action. Layout collapses with container queries, so it fits any parent width.

export function BentoCard({ colSpan = 1, rowSpan = 1, title, description, icon, background, cta = 'Learn more', href, onClick, children, className = '', style }) {
  const Tag = href ? 'a' : onClick ? 'button' : 'div';
  const interactive = Boolean(href || onClick);
  return (
    <Tag
      className={`group/card relative isolate col-[span_var(--bl-cs,1)] row-[span_var(--bl-rs,1)] flex min-w-0 flex-col justify-end overflow-hidden rounded-(--bl-radius) bg-(--bl-card) p-[22px] text-(--bl-ink) no-underline shadow-[inset_0_0_0_1px_var(--bl-line)] outline-none [--bl-mx:-999px] [--bl-my:-999px] [transition:transform_240ms_cubic-bezier(.2,.8,.2,1)] focus-visible:shadow-[inset_0_0_0_2px_var(--bl-accent)] [a&]:hover:[transform:translateY(-2px)] data-[cta]:[--bl-lift:0px] data-[cta]:hover:[--bl-lift:-30px] data-[cta]:focus-within:[--bl-lift:-30px] data-[cta]:focus-visible:[--bl-lift:-30px] [@container(560px<width<=860px)]:col-[span_min(var(--bl-cs,1),2)] [@container(max-width:560px)]:col-[span_1] [@container(max-width:560px)]:row-[span_1] [@container(max-width:560px)]:data-[cta]:[--bl-lift:-30px] [@media(hover:none)]:data-[cta]:[--bl-lift:-30px] motion-reduce:[transition:none] before:pointer-events-none before:absolute before:inset-0 before:z-3 before:rounded-[inherit] before:p-[1.5px] before:bg-[radial-gradient(var(--bl-spot-size)_circle_at_var(--bl-mx)_var(--bl-my),var(--bl-spot),transparent_60%)] before:[mask:linear-gradient(#000_0_0)_content-box_exclude,linear-gradient(#000_0_0)] after:pointer-events-none after:absolute after:inset-0 after:-z-1 after:bg-[radial-gradient(calc(var(--bl-spot-size)*1.4)_circle_at_var(--bl-mx)_var(--bl-my),var(--bl-wash),transparent_55%)] ${className}`}
      data-cta={interactive && cta ? '' : undefined}
      href={href}
      onClick={onClick}
      type={Tag === 'button' ? 'button' : undefined}
      tabIndex={Tag === 'div' ? undefined : 0}
      style={{ '--bl-cs': colSpan, '--bl-rs': rowSpan, textAlign: 'left', border: 0, cursor: interactive ? 'pointer' : undefined, ...style }}
    >
      {background && (
        <div className="absolute inset-0 -z-2 overflow-hidden [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>video]:h-full [&>video]:w-full [&>video]:object-cover after:absolute after:inset-0 after:bg-[linear-gradient(to_top,var(--bl-card)_8%,transparent_70%)]" aria-hidden="true">
          {background}
        </div>
      )}
      <div className="relative [transform:translateY(var(--bl-lift))] [transition:transform_300ms_cubic-bezier(.2,.8,.2,1)] motion-reduce:[transition:none]">
        {icon && (
          <span className="mb-3.5 inline-grid size-10 place-items-center rounded-[10px] bg-(--bl-chip) text-(--bl-accent)" aria-hidden="true">
            {icon}
          </span>
        )}
        {title && <h3 className="m-0 mb-1.5 [font:700_var(--bl-title-size)/1.2_var(--bl-font)]">{title}</h3>}
        {description && <p className="m-0 [font:400_14px/1.5_var(--bl-font-body)] text-(--bl-muted)">{description}</p>}
        {children}
        {interactive && cta && (
          <span className="absolute top-full left-0 inline-flex items-center gap-1.5 pt-3 [font:600_13px/1_var(--bl-font-body)] text-(--bl-accent) opacity-0 transition-opacity duration-220 ease-[ease] group-data-[cta]/card:group-hover/card:opacity-100 group-data-[cta]/card:group-focus-within/card:opacity-100 group-data-[cta]/card:group-focus-visible/card:opacity-100 [@container(max-width:560px)]:group-data-[cta]/card:opacity-100 [@media(hover:none)]:group-data-[cta]/card:opacity-100" aria-hidden="true">
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
    <div className={`@container w-full ${className}`} style={style}>
      <div
        ref={ref}
        className="grid auto-rows-(--bl-row) grid-cols-[repeat(var(--bl-cols),minmax(0,1fr))] gap-(--bl-gap) [@container(560px<width<=860px)]:grid-cols-[repeat(min(var(--bl-cols),2),minmax(0,1fr))] [@container(max-width:560px)]:auto-rows-[minmax(var(--bl-row),auto)] [@container(max-width:560px)]:grid-cols-[minmax(0,1fr)]"
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
