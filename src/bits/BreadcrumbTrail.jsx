import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

// Breadcrumbs that fit their space. When the trail is too wide, the middle crumbs fold into
// a "…" button (the first and current page always stay), and folded crumbs pop back in as
// room returns. The button opens a small animated menu of the hidden pages: arrows move
// through it, Escape closes it and returns focus. A <nav> with an ordered list, and the
// current page marked aria-current.

const STYLE_ID = 'bl-breadcrumb-trail';
const CSS = `
.bl-crumbs { position: relative; min-width: 0; font-family: var(--bl-font); font-size: var(--bl-size); }
.bl-crumbs__list { display: flex; align-items: center; gap: 4px; min-width: 0; margin: 0; padding: 0; list-style: none; white-space: nowrap; }
.bl-crumbs__item { display: flex; align-items: center; gap: 4px; min-width: 0; animation: bl-crumbs-in 260ms cubic-bezier(.3,1.4,.5,1) both; }
.bl-crumbs__item:last-child { flex: 0 1 auto; }
.bl-crumbs__link { display: inline-flex; align-items: center; gap: 6px; min-width: 0; padding: 5px 8px; border: 0; border-radius: 8px; background: transparent; color: var(--bl-muted); font: inherit; text-decoration: none; cursor: pointer; transition: background-color 150ms, color 150ms; }
.bl-crumbs__link:hover { background: var(--bl-hover); color: var(--bl-ink); }
.bl-crumbs__link:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 1px; }
.bl-crumbs__current { display: inline-flex; align-items: center; gap: 6px; min-width: 0; padding: 5px 8px; color: var(--bl-ink); font-weight: 600; }
.bl-crumbs__text { overflow: hidden; text-overflow: ellipsis; }
.bl-crumbs__sep { flex: none; display: grid; place-items: center; color: var(--bl-dim); }
.bl-crumbs__more { display: grid; place-items: center; min-width: 32px; height: 30px; padding: 0 6px; border: 0; border-radius: 8px; background: var(--bl-chip); color: var(--bl-ink); font: inherit; letter-spacing: 1px; cursor: pointer; transition: background-color 150ms; }
.bl-crumbs__more:hover, .bl-crumbs__more[aria-expanded="true"] { background: var(--bl-hover); }
.bl-crumbs__more:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 1px; }
.bl-crumbs__menu { position: absolute; z-index: 20; top: calc(100% + 6px); left: var(--bl-menu-x); min-width: 180px; margin: 0; padding: 5px; border-radius: 12px; background: var(--bl-menu); list-style: none; box-shadow: 0 0 0 1px var(--bl-line), 0 16px 32px -14px rgba(0,0,0,0.8); transform-origin: top left; animation: bl-crumbs-menu 200ms cubic-bezier(.3,1.4,.5,1) both; }
.bl-crumbs__menu .bl-crumbs__link { display: flex; width: 100%; box-sizing: border-box; padding: 8px 10px; animation: bl-crumbs-in 240ms cubic-bezier(.3,1.4,.5,1) both; animation-delay: calc(var(--i) * 35ms); }
.bl-crumbs__clip { position: absolute; top: 0; left: 0; width: 0; height: 0; overflow: hidden; visibility: hidden; pointer-events: none; }
.bl-crumbs__measure { width: max-content; }
@keyframes bl-crumbs-in { from { opacity: 0; transform: translateY(4px) scale(0.92); } }
@keyframes bl-crumbs-menu { from { opacity: 0; transform: scale(0.9) translateY(-4px); } }
@media (prefers-reduced-motion: reduce) { .bl-crumbs__item, .bl-crumbs__menu, .bl-crumbs__menu .bl-crumbs__link { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.5 2.5 8 6l-3.5 3.5" />
  </svg>
);

export default function BreadcrumbTrail({
  items = [],
  onNavigate,
  separator = <Chevron />,
  moreLabel = 'Show hidden pages',
  label = 'Breadcrumb',
  fontSize = 14,
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  dimColor = '#566c86',
  hoverColor = 'rgba(255,255,255,0.08)',
  chipColor = 'rgba(255,255,255,0.05)',
  menuColor = '#1a1c2c',
  lineColor = '#333c57',
  accentColor = '#73eff7',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const navRef = useRef(null);
  const measureRef = useRef(null);
  const moreRef = useRef(null);
  const menuRef = useRef(null);
  const [hidden, setHidden] = useState(0);
  const [open, setOpen] = useState(false);
  const [menuX, setMenuX] = useState(0);

  // Fold crumbs from the second one onward until the trail fits.
  useLayoutEffect(() => {
    const nav = navRef.current;
    const measure = measureRef.current;
    const fit = () => {
      const widths = [...measure.children].map(node => node.getBoundingClientRect().width);
      const more = widths.pop();
      const gap = 4;
      const available = nav.clientWidth;
      const total = n => widths.reduce((sum, w, i) => (i >= 1 && i <= n ? sum : sum + w + gap), 0) + (n ? more + gap : 0);
      let n = 0;
      // Never fold the first crumb or the current page.
      while (n < items.length - 2 && total(n) > available) n++;
      setHidden(n);
    };
    fit();
    // The copies resize too when a web font finishes loading.
    const resize = new ResizeObserver(fit);
    resize.observe(nav);
    resize.observe(measure);
    return () => resize.disconnect();
  }, [items, fontSize, fontFamily]);

  useEffect(() => {
    if (!hidden) setOpen(false);
  }, [hidden]);

  // Menu: focus the first entry, close on outside click, Escape or Tab.
  useEffect(() => {
    if (!open) return undefined;
    const menu = menuRef.current;
    const button = moreRef.current;
    const nav = navRef.current;
    setMenuX(button.offsetLeft);
    menu.querySelector('.bl-crumbs__link')?.focus();
    const entries = () => [...menu.querySelectorAll('.bl-crumbs__link')];
    const onKey = event => {
      const list = entries();
      const at = list.indexOf(document.activeElement);
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        button.focus();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        list[(at + (event.key === 'ArrowDown' ? 1 : -1) + list.length) % list.length]?.focus();
      } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault();
        list[event.key === 'Home' ? 0 : list.length - 1]?.focus();
      } else if (event.key === 'Tab') setOpen(false);
    };
    const onDown = event => {
      if (!nav.contains(event.target)) setOpen(false);
    };
    menu.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      menu.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const content = item => (
    <>
      {item.icon && <span aria-hidden="true">{item.icon}</span>}
      <span className="bl-crumbs__text">{item.label}</span>
    </>
  );
  const link = (item, index, extra = {}) => {
    const onClick = event => {
      onNavigate?.(item, index, event);
      setOpen(false);
    };
    return item.href ? (
      <a className="bl-crumbs__link" href={item.href} onClick={onClick} {...extra}>
        {content(item)}
      </a>
    ) : (
      <button type="button" className="bl-crumbs__link" onClick={onClick} {...extra}>
        {content(item)}
      </button>
    );
  };
  const crumb = (item, index) => {
    const last = index === items.length - 1;
    return (
      <li key={`${index}-${item.label}`} className="bl-crumbs__item">
        {last ? (
          <span className="bl-crumbs__current" aria-current="page">
            {content(item)}
          </span>
        ) : (
          link(item, index)
        )}
        {!last && <span className="bl-crumbs__sep" aria-hidden="true">{separator}</span>}
      </li>
    );
  };

  const folded = items.slice(1, 1 + hidden);
  return (
    <nav ref={navRef} aria-label={label} className={`bl-crumbs ${className}`} style={{ '--bl-size': `${fontSize}px`, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-dim': dimColor, '--bl-hover': hoverColor, '--bl-chip': chipColor, '--bl-menu': menuColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-font': fontFamily, '--bl-menu-x': `${menuX}px`, ...style }}>
      <ol className="bl-crumbs__list">
        {items.length > 0 && crumb(items[0], 0)}
        {hidden > 0 && (
          <li className="bl-crumbs__item">
            <button
              ref={moreRef}
              type="button"
              className="bl-crumbs__more"
              aria-label={`${moreLabel} (${hidden})`}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls={open ? `${uid}-menu` : undefined}
              onClick={() => setOpen(o => !o)}
              onKeyDown={event => {
                if (event.key === 'ArrowDown') {
                  event.preventDefault();
                  setOpen(true);
                }
              }}
            >
              …
            </button>
            <span className="bl-crumbs__sep" aria-hidden="true">
              {separator}
            </span>
          </li>
        )}
        {items.slice(1 + hidden).map((item, i) => crumb(item, i + 1 + hidden))}
      </ol>
      {open && (
        <ul ref={menuRef} id={`${uid}-menu`} role="menu" aria-label={moreLabel} className="bl-crumbs__menu">
          {folded.map((item, i) => (
            <li key={`${i}-${item.label}`} role="none">
              {link(item, i + 1, { role: 'menuitem', tabIndex: -1, style: { '--i': i } })}
            </li>
          ))}
        </ul>
      )}
      {/* Full-width copies of every crumb (plus the "…" button) to measure what fits. */}
      <div className="bl-crumbs__clip" aria-hidden="true">
        <div ref={measureRef} className="bl-crumbs__list bl-crumbs__measure">
          {items.map((item, index) => (
            <span key={`${index}-${item.label}`} className="bl-crumbs__item" style={{ animation: 'none' }}>
              <span className={index === items.length - 1 ? 'bl-crumbs__current' : 'bl-crumbs__link'}>{content(item)}</span>
              {index < items.length - 1 && <span className="bl-crumbs__sep">{separator}</span>}
            </span>
          ))}
          <span className="bl-crumbs__item" style={{ animation: 'none' }}>
            <span className="bl-crumbs__more">…</span>
            <span className="bl-crumbs__sep">{separator}</span>
          </span>
        </div>
      </div>
    </nav>
  );
}
