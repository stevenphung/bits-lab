import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// An app sidebar that collapses to an icon rail. Sections hold items; items can nest one
// level of children that fold open with a height animation. A highlight slides to the
// active item. Collapsed, every icon shows its name in a tooltip, and items with children
// open a small flyout instead. Up/Down move between items. The rail state and the active
// item can be controlled or left to the component.

const STYLE_ID = 'bl-side-rail-tw';
const CSS = `
/* theme tokens */
.bl-rail { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-dim: #566c86; --bl-hover: rgba(255,255,255,0.05); --bl-active-bg: rgba(115,239,247,0.12); --bl-line: #333c57; --bl-accent: #73eff7; --bl-on-accent: #0b0b14; }
:where(.light, [data-theme="light"]) .bl-rail, .bl-rail:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-dim: #8a96a3; --bl-hover: rgba(26,28,44,0.05); --bl-active-bg: rgba(22,127,143,0.12); --bl-line: #cfc4ad; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-rail, :where(.light, [data-theme="light"]) .bl-rail:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-dim: #566c86; --bl-hover: rgba(255,255,255,0.05); --bl-active-bg: rgba(115,239,247,0.12); --bl-line: #333c57; --bl-accent: #73eff7; --bl-on-accent: #0b0b14; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-rail, .bl-rail:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-dim: #8a96a3; --bl-hover: rgba(26,28,44,0.05); --bl-active-bg: rgba(22,127,143,0.12); --bl-line: #cfc4ad; --bl-accent: #167f8f; } }
/* theme tokens end */
@keyframes bl-rail-pop { from { opacity: 0; translate: -6px 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const Caret = () => (
  <svg className="flex-none text-(--bl-dim) [transition:transform_240ms_cubic-bezier(.3,1.3,.5,1),opacity_200ms] group-aria-expanded/item:[transform:rotate(90deg)] group-data-[collapsed]/rail:opacity-0 motion-reduce:[transition:none]" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <path d="M4.5 2.5 8 6l-3.5 3.5" />
  </svg>
);

export default function SideRail({
  sections = [],
  brand,
  value,
  defaultValue,
  onValueChange,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  width = 248,
  railWidth = 68,
  label = 'Sidebar',
  backgroundColor,
  textColor,
  mutedColor,
  dimColor,
  hoverColor,
  activeColor,
  lineColor,
  accentColor,
  onAccentColor,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [innerValue, setInnerValue] = useState(defaultValue);
  const current = value !== undefined ? value : innerValue;
  const [innerCollapsed, setInnerCollapsed] = useState(defaultCollapsed);
  const isCollapsed = collapsed ?? innerCollapsed;
  // Groups start open when they contain the active item.
  const [openGroups, setOpenGroups] = useState(() => new Set(sections.flatMap(s => s.items).filter(item => item.children?.some(child => child.id === current)).map(item => item.id)));
  const [tip, setTip] = useState(null);
  const [fly, setFly] = useState(null);
  const rootRef = useRef(null);
  const scrollRef = useRef(null);
  const glowRef = useRef(null);
  const flyRef = useRef(null);

  const select = (item, event) => {
    if (value === undefined) setInnerValue(item.id);
    onValueChange?.(item.id, item, event);
    item.onSelect?.(event);
    setFly(null);
  };

  const setCollapsed = next => {
    if (collapsed === undefined) setInnerCollapsed(next);
    onCollapsedChange?.(next);
    setTip(null);
    setFly(null);
  };

  const toggleGroup = id =>
    setOpenGroups(groups => {
      const next = new Set(groups);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // Slide the highlight to the active item (or its parent when the group is folded/railed).
  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    const glow = glowRef.current;
    if (!scroller || !glow) return undefined;
    const place = () => {
      // A folded group's children are clipped, not removed, so check for that explicitly.
      let node = scroller.querySelector('[aria-current="page"]');
      if (!node || node.closest('.bl-rail__kids:not([data-open])')) node = scroller.querySelector('[data-has-current]');
      if (!node) {
        glow.setAttribute('data-hidden', '');
        return;
      }
      glow.removeAttribute('data-hidden');
      const box = node.getBoundingClientRect();
      const base = scroller.getBoundingClientRect();
      glow.style.setProperty('--bl-iy', `${box.top - base.top + scroller.scrollTop}px`);
      glow.style.setProperty('--bl-ih', `${box.height}px`);
    };
    place();
    // Re-place while groups animate open or closed and when the rail resizes.
    const resize = new ResizeObserver(place);
    scroller.querySelectorAll('ul').forEach(list => resize.observe(list));
    return () => resize.disconnect();
  }, [current, openGroups, isCollapsed, sections]);

  // Close the flyout on Esc or a click elsewhere.
  useEffect(() => {
    if (!fly) return undefined;
    const onKey = event => {
      if (event.key === 'Escape') {
        setFly(null);
        fly.anchor?.focus();
      }
    };
    const onDown = event => {
      if (!flyRef.current?.contains(event.target) && !fly.anchor?.contains(event.target)) setFly(null);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    requestAnimationFrame(() => flyRef.current?.querySelector('button, a')?.focus());
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [fly]);

  const showTip = (event, text) => {
    if (!isCollapsed) return;
    const box = event.currentTarget.getBoundingClientRect();
    setTip({ text, x: box.right + 10, y: box.top + box.height / 2 });
  };

  // Up/Down move between the visible items.
  const onKeyDown = event => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const scope = document.activeElement?.closest('.bl-rail__fly') ?? scrollRef.current;
    const items = [...scope.querySelectorAll('.bl-rail__item')].filter(node => !node.closest('.bl-rail__kids:not([data-open])'));
    const at = items.indexOf(document.activeElement);
    if (at < 0) return;
    event.preventDefault();
    items[(at + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  };

  const renderItem = (item, nested = false) => {
    const kids = !nested && !!item.children?.length;
    const isOpen = openGroups.has(item.id);
    const hasCurrent = kids && item.children.some(child => child.id === current);
    const common = {
      className: 'bl-rail__item group/item relative box-border flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-[10px] border-0 bg-transparent px-3 text-left text-[14px] whitespace-nowrap text-(--bl-muted) no-underline hover:bg-(--bl-hover) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--bl-accent) aria-[current=page]:font-semibold aria-[current=page]:text-(--bl-ink)',
      onPointerEnter: event => showTip(event, item.label),
      onPointerLeave: () => setTip(null),
      onFocus: event => showTip(event, item.label),
      onBlur: () => setTip(null)
    };
    const inner = (
      <>
        {item.icon && (
          <span className="grid size-5 flex-none place-items-center" aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis transition-opacity duration-200 ease-[ease] group-data-[collapsed]/rail:opacity-0">{item.label}</span>
        {item.badge != null && (
          <span className="box-border min-w-5 flex-none rounded-full bg-(--bl-accent) px-1.5 py-px text-center text-[11px] font-bold text-(--bl-on-accent) transition-opacity duration-200 ease-[ease] group-data-[collapsed]/rail:absolute group-data-[collapsed]/rail:top-1.5 group-data-[collapsed]/rail:left-[30px] group-data-[collapsed]/rail:h-2 group-data-[collapsed]/rail:min-w-2 group-data-[collapsed]/rail:p-0 group-data-[collapsed]/rail:text-[0px]">
            {item.badge}
            <span className="sr-only"> new</span>
          </span>
        )}
        {kids && <Caret />}
      </>
    );
    if (kids) {
      return (
        <li key={item.id}>
          <button
            {...common}
            type="button"
            aria-expanded={isCollapsed ? fly?.id === item.id : isOpen}
            aria-controls={isCollapsed ? undefined : `${uid}-${item.id}`}
            aria-haspopup={isCollapsed ? 'true' : undefined}
            data-has-current={(hasCurrent && (isCollapsed || !isOpen)) || undefined}
            onClick={event => {
              if (isCollapsed) {
                const box = event.currentTarget.getBoundingClientRect();
                setTip(null);
                setFly(f => (f?.id === item.id ? null : { id: item.id, item, x: box.right + 10, y: box.top, anchor: event.currentTarget }));
              } else toggleGroup(item.id);
            }}
          >
            {inner}
          </button>
          <div id={`${uid}-${item.id}`} className="bl-rail__kids grid grid-rows-[0fr] [transition:grid-template-rows_280ms_cubic-bezier(.2,.9,.25,1)] data-[open]:grid-rows-[1fr] *:m-0 *:min-h-0 *:list-none *:overflow-hidden *:py-0 *:pr-0 *:pl-[22px] [&_li>:is(a,button)]:min-h-[34px] [&_li>:is(a,button)]:text-[13px] group-data-[collapsed]/rail:hidden motion-reduce:[transition:none]" data-open={(isOpen && !isCollapsed) || undefined} inert={!isOpen || isCollapsed || undefined}>
            <ul>{item.children.map(child => renderItem(child, true))}</ul>
          </div>
        </li>
      );
    }
    const isCurrent = current === item.id;
    return (
      <li key={item.id}>
        {item.href ? (
          <a {...common} href={item.href} aria-current={isCurrent ? 'page' : undefined} onClick={event => select(item, event)}>
            {inner}
          </a>
        ) : (
          <button {...common} type="button" aria-current={isCurrent ? 'page' : undefined} onClick={event => select(item, event)}>
            {inner}
          </button>
        )}
      </li>
    );
  };

  const vars = {
    '--bl-w': `${width}px`,
    '--bl-rail-w': `${railWidth}px`,
    '--bl-bg': backgroundColor,
    '--bl-ink': textColor,
    '--bl-muted': mutedColor,
    '--bl-dim': dimColor,
    '--bl-hover': hoverColor,
    '--bl-active-bg': activeColor,
    '--bl-line': lineColor,
    '--bl-accent': accentColor,
    '--bl-on-accent': onAccentColor,
    '--bl-font': fontFamily
  };

  return (
    <nav ref={rootRef} className={`bl-rail group/rail relative box-border flex h-full w-(--bl-w) flex-col overflow-hidden bg-(--bl-bg) p-2.5 font-(family-name:--bl-font) text-(--bl-ink) shadow-[inset_-1px_0_0_var(--bl-line)] [transition:width_320ms_cubic-bezier(.3,1.1,.5,1)] data-[collapsed]:w-(--bl-rail-w) motion-reduce:[transition:none] ${className}`} aria-label={label} data-collapsed={isCollapsed || undefined} onKeyDown={onKeyDown} style={{ ...vars, ...style }}>
      <div className="mb-2 flex min-h-10 items-center gap-2.5 px-1 group-data-[collapsed]/rail:flex-col group-data-[collapsed]/rail:p-0">
        {brand && <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden font-bold whitespace-nowrap group-data-[collapsed]/rail:flex-none">{brand}</div>}
        <button type="button" className="grid size-8 flex-none cursor-pointer place-items-center rounded-[8px] border-0 bg-transparent p-0 text-(--bl-muted) hover:bg-(--bl-hover) hover:text-(--bl-ink) [&_svg]:[transition:transform_320ms_cubic-bezier(.3,1.3,.5,1)] group-data-[collapsed]/rail:[&_svg]:[transform:rotate(180deg)] motion-reduce:[&_svg]:[transition:none]" aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!isCollapsed} onClick={() => setCollapsed(!isCollapsed)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 3.5 5.5 8l4.5 4.5" />
          </svg>
        </button>
      </div>
      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto [scrollbar-width:thin]" onScroll={() => setTip(null)}>
        <div ref={glowRef} className="pointer-events-none absolute inset-x-0 top-0 h-[var(--bl-ih,0px)] rounded-[10px] bg-(--bl-active-bg) [transform:translateY(var(--bl-iy,0px))] [transition:transform_320ms_cubic-bezier(.3,1.2,.5,1),height_320ms] before:absolute before:top-2 before:bottom-2 before:left-0 before:w-[3px] before:rounded-[3px] before:bg-(--bl-accent) data-[hidden]:opacity-0 motion-reduce:[transition:none]" aria-hidden="true" />
        {sections.map((section, s) => (
          <div key={section.title ?? s}>
            {section.title && (
              <div className="h-[26px] overflow-hidden px-3 pt-2 pb-0 text-[11px] font-bold tracking-[0.06em] whitespace-nowrap text-(--bl-dim) uppercase transition-opacity duration-200 ease-[ease] group-data-[collapsed]/rail:opacity-0" id={`${uid}-s${s}`}>
                {section.title}
              </div>
            )}
            <ul className="m-0 mb-2.5 list-none p-0" aria-labelledby={section.title ? `${uid}-s${s}` : undefined}>
              {section.items.map(item => renderItem(item))}
            </ul>
          </div>
        ))}
      </div>
      {tip && (
        <div className="pointer-events-none fixed z-1700 animate-[bl-rail-pop_160ms_cubic-bezier(.3,1.4,.5,1)_both] rounded-[7px] bg-(--bl-ink) px-[9px] py-[5px] font-(family-name:--bl-font) text-[12px] font-semibold whitespace-nowrap text-(--bl-bg) [transform:translateY(-50%)] motion-reduce:animate-none" aria-hidden="true" style={{ ...vars, left: tip.x, top: tip.y }}>
          {tip.text}
        </div>
      )}
      {fly && (
        <div ref={flyRef} className="bl-rail__fly fixed z-1700 min-w-[180px] animate-[bl-rail-pop_200ms_cubic-bezier(.3,1.4,.5,1)_both] rounded-[12px] bg-(--bl-bg) p-1.5 font-(family-name:--bl-font) text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line),0_20px_40px_-18px_rgba(0,0,0,0.85)] [&_ul]:m-0 [&_ul]:list-none [&_ul]:p-0 motion-reduce:animate-none" role="menu" aria-label={fly.item.label} style={{ ...vars, left: fly.x, top: fly.y }}>
          <div className="px-2.5 pt-1.5 pb-1 text-[11px] font-bold tracking-[0.06em] text-(--bl-dim) uppercase" aria-hidden="true">
            {fly.item.label}
          </div>
          <ul>
            {fly.item.children.map(child => (
              <li key={child.id}>
                <button type="button" role="menuitem" className="bl-rail__item group/item relative box-border flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-[10px] border-0 bg-transparent px-3 text-left text-[14px] whitespace-nowrap text-(--bl-muted) no-underline hover:bg-(--bl-hover) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--bl-accent) aria-[current=page]:font-semibold aria-[current=page]:text-(--bl-ink)" aria-current={current === child.id ? 'page' : undefined} onClick={event => select(child, event)}>
                  {child.icon && (
                    <span className="grid size-5 flex-none place-items-center" aria-hidden="true">
                      {child.icon}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 overflow-hidden text-ellipsis transition-opacity duration-200 ease-[ease] group-data-[collapsed]/rail:opacity-0">{child.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
