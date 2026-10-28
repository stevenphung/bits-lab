import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

// An app sidebar that collapses to an icon rail. Sections hold items; items can nest one
// level of children that fold open with a height animation. A highlight slides to the
// active item. Collapsed, every icon shows its name in a tooltip, and items with children
// open a small flyout instead. Up/Down move between items. The rail state and the active
// item can be controlled or left to the component.

const STYLE_ID = 'bl-side-rail';
const CSS = `
.bl-rail { position: relative; display: flex; flex-direction: column; width: var(--bl-w); height: 100%; box-sizing: border-box; padding: 10px; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); box-shadow: inset -1px 0 0 var(--bl-line); transition: width 320ms cubic-bezier(.3,1.1,.5,1); overflow: hidden; }
.bl-rail[data-collapsed] { width: var(--bl-rail-w); }
.bl-rail__head { display: flex; align-items: center; gap: 10px; min-height: 40px; margin-bottom: 8px; padding: 0 4px; }
.bl-rail__brand { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; overflow: hidden; white-space: nowrap; font-weight: 700; }
.bl-rail__toggle { flex: 0 0 auto; display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 8px; background: transparent; color: var(--bl-muted); cursor: pointer; }
.bl-rail__toggle:hover { background: var(--bl-hover); color: var(--bl-ink); }
.bl-rail__toggle svg { transition: transform 320ms cubic-bezier(.3,1.3,.5,1); }
.bl-rail[data-collapsed] .bl-rail__toggle svg { transform: rotate(180deg); }
.bl-rail[data-collapsed] .bl-rail__head { flex-direction: column; padding: 0; }
.bl-rail[data-collapsed] .bl-rail__brand { flex: none; }
.bl-rail__scroll { position: relative; flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; scrollbar-width: thin; }
.bl-rail__glow { position: absolute; left: 0; right: 0; top: 0; height: var(--bl-ih, 0px); border-radius: 10px; background: var(--bl-active-bg); transform: translateY(var(--bl-iy, 0px)); transition: transform 320ms cubic-bezier(.3,1.2,.5,1), height 320ms; pointer-events: none; }
.bl-rail__glow::before { content: ""; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px; border-radius: 3px; background: var(--bl-accent); }
.bl-rail__glow[data-hidden] { opacity: 0; }
.bl-rail__section { margin: 0 0 10px; padding: 0; list-style: none; }
.bl-rail__title { height: 26px; padding: 8px 12px 0; color: var(--bl-dim); font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; overflow: hidden; transition: opacity 200ms; }
.bl-rail[data-collapsed] .bl-rail__title { opacity: 0; }
.bl-rail__item { position: relative; display: flex; align-items: center; gap: 12px; width: 100%; min-height: 40px; padding: 0 12px; box-sizing: border-box; border: 0; border-radius: 10px; background: transparent; color: var(--bl-muted); font: inherit; font-size: 14px; text-align: left; text-decoration: none; cursor: pointer; white-space: nowrap; }
.bl-rail__item:hover { color: var(--bl-ink); background: var(--bl-hover); }
.bl-rail__item[aria-current="page"] { color: var(--bl-ink); font-weight: 600; }
.bl-rail__item:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: -2px; }
.bl-rail__icon { flex: 0 0 auto; display: grid; place-items: center; width: 20px; height: 20px; }
.bl-rail__label { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; transition: opacity 200ms; }
.bl-rail__badge { flex: 0 0 auto; min-width: 20px; padding: 1px 6px; box-sizing: border-box; border-radius: 999px; background: var(--bl-accent); color: var(--bl-on-accent); font-size: 11px; font-weight: 700; text-align: center; transition: opacity 200ms; }
.bl-rail__caret { flex: 0 0 auto; color: var(--bl-dim); transition: transform 240ms cubic-bezier(.3,1.3,.5,1), opacity 200ms; }
.bl-rail__item[aria-expanded="true"] .bl-rail__caret { transform: rotate(90deg); }
.bl-rail[data-collapsed] :is(.bl-rail__label, .bl-rail__badge, .bl-rail__caret) { opacity: 0; }
.bl-rail[data-collapsed] .bl-rail__badge { position: absolute; top: 6px; left: 30px; min-width: 8px; height: 8px; padding: 0; opacity: 1; font-size: 0; }
.bl-rail__kids { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 280ms cubic-bezier(.2,.9,.25,1); }
.bl-rail__kids[data-open] { grid-template-rows: 1fr; }
.bl-rail__kids > ul { min-height: 0; overflow: hidden; margin: 0; padding: 0 0 0 22px; list-style: none; }
.bl-rail__kids .bl-rail__item { min-height: 34px; font-size: 13px; }
.bl-rail[data-collapsed] .bl-rail__kids { display: none; }
.bl-rail__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.bl-rail__tip, .bl-rail__fly { position: fixed; z-index: 1700; font-family: var(--bl-font); }
.bl-rail__tip { padding: 5px 9px; border-radius: 7px; background: var(--bl-ink); color: var(--bl-bg); font-size: 12px; font-weight: 600; white-space: nowrap; pointer-events: none; transform: translateY(-50%); animation: bl-rail-pop 160ms cubic-bezier(.3,1.4,.5,1) both; }
.bl-rail__fly { min-width: 180px; padding: 6px; border-radius: 12px; background: var(--bl-bg); color: var(--bl-ink); box-shadow: 0 0 0 1px var(--bl-line), 0 20px 40px -18px rgba(0,0,0,0.85); animation: bl-rail-pop 200ms cubic-bezier(.3,1.4,.5,1) both; }
.bl-rail__fly-title { padding: 6px 10px 4px; color: var(--bl-dim); font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
.bl-rail__fly ul { margin: 0; padding: 0; list-style: none; }
@keyframes bl-rail-pop { from { opacity: 0; translate: -6px 0; } }
@media (prefers-reduced-motion: reduce) { .bl-rail, .bl-rail__glow, .bl-rail__kids, .bl-rail__toggle svg, .bl-rail__caret { transition: none; } .bl-rail__tip, .bl-rail__fly { animation: none; } }
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
  <svg className="bl-rail__caret" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
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
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  dimColor = '#566c86',
  hoverColor = 'rgba(255,255,255,0.05)',
  activeColor = 'rgba(115,239,247,0.12)',
  lineColor = '#333c57',
  accentColor = '#73eff7',
  onAccentColor = '#0b0b14',
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
      className: 'bl-rail__item',
      onPointerEnter: event => showTip(event, item.label),
      onPointerLeave: () => setTip(null),
      onFocus: event => showTip(event, item.label),
      onBlur: () => setTip(null)
    };
    const inner = (
      <>
        {item.icon && (
          <span className="bl-rail__icon" aria-hidden="true">
            {item.icon}
          </span>
        )}
        <span className="bl-rail__label">{item.label}</span>
        {item.badge != null && (
          <span className="bl-rail__badge">
            {item.badge}
            <span className="bl-rail__sr"> new</span>
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
          <div id={`${uid}-${item.id}`} className="bl-rail__kids" data-open={(isOpen && !isCollapsed) || undefined} inert={!isOpen || isCollapsed || undefined}>
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
    <nav ref={rootRef} className={`bl-rail ${className}`} aria-label={label} data-collapsed={isCollapsed || undefined} onKeyDown={onKeyDown} style={{ ...vars, ...style }}>
      <div className="bl-rail__head">
        {brand && <div className="bl-rail__brand">{brand}</div>}
        <button type="button" className="bl-rail__toggle" aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!isCollapsed} onClick={() => setCollapsed(!isCollapsed)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10 3.5 5.5 8l4.5 4.5" />
          </svg>
        </button>
      </div>
      <div ref={scrollRef} className="bl-rail__scroll" onScroll={() => setTip(null)}>
        <div ref={glowRef} className="bl-rail__glow" aria-hidden="true" />
        {sections.map((section, s) => (
          <div key={section.title ?? s}>
            {section.title && (
              <div className="bl-rail__title" id={`${uid}-s${s}`}>
                {section.title}
              </div>
            )}
            <ul className="bl-rail__section" aria-labelledby={section.title ? `${uid}-s${s}` : undefined}>
              {section.items.map(item => renderItem(item))}
            </ul>
          </div>
        ))}
      </div>
      {tip && (
        <div className="bl-rail__tip" aria-hidden="true" style={{ ...vars, left: tip.x, top: tip.y }}>
          {tip.text}
        </div>
      )}
      {fly && (
        <div ref={flyRef} className="bl-rail__fly" role="menu" aria-label={fly.item.label} style={{ ...vars, left: fly.x, top: fly.y }}>
          <div className="bl-rail__fly-title" aria-hidden="true">
            {fly.item.label}
          </div>
          <ul>
            {fly.item.children.map(child => (
              <li key={child.id}>
                <button type="button" role="menuitem" className="bl-rail__item" aria-current={current === child.id ? 'page' : undefined} onClick={event => select(child, event)}>
                  {child.icon && (
                    <span className="bl-rail__icon" aria-hidden="true">
                      {child.icon}
                    </span>
                  )}
                  <span className="bl-rail__label">{child.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}
