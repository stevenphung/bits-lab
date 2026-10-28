import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Navbar that gets out of the way. Full width at the top of the page; once you scroll past
// `shrinkAt` it tightens into a floating, blurred pill. Scrolling down hides it, scrolling
// up (or tabbing into it) brings it back. Collapses to a menu button on narrow containers.
// Tracks the nearest scroll box or the window.

const STYLE_ID = 'bl-smart-navbar';
const CSS = `
/* theme tokens */
.bl-nav { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line-top: rgba(255,255,255,0.08); --bl-bg-pill: rgba(26,28,44,0.72); --bl-line: rgba(255,255,255,0.12); --bl-hover: rgba(255,255,255,0.08); --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-nav, .bl-nav:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line-top: rgba(26,28,44,0.08); --bl-bg-pill: rgba(244,241,232,0.82); --bl-line: rgba(26,28,44,0.12); --bl-hover: rgba(26,28,44,0.08); --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-nav, :where(.light, [data-theme="light"]) .bl-nav:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line-top: rgba(255,255,255,0.08); --bl-bg-pill: rgba(26,28,44,0.72); --bl-line: rgba(255,255,255,0.12); --bl-hover: rgba(255,255,255,0.08); --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-nav, .bl-nav:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line-top: rgba(26,28,44,0.08); --bl-bg-pill: rgba(244,241,232,0.82); --bl-line: rgba(26,28,44,0.12); --bl-hover: rgba(26,28,44,0.08); --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-nav { position: sticky; top: 0; z-index: 40; height: 0; font-family: var(--bl-font); container-type: inline-size; }
.bl-nav__bar { position: relative; display: flex; align-items: center; gap: 18px; width: 100%; max-width: 100%; height: var(--bl-h); margin: 0 auto; padding: 0 var(--bl-pad); box-sizing: border-box; color: var(--bl-ink); background: var(--bl-bg-top); border-bottom: 1px solid var(--bl-line-top); transition: max-width var(--bl-dur) var(--bl-ease), margin-top var(--bl-dur) var(--bl-ease), height var(--bl-dur) var(--bl-ease), border-radius var(--bl-dur) var(--bl-ease), background-color var(--bl-dur), box-shadow var(--bl-dur), border-color var(--bl-dur), transform var(--bl-dur) var(--bl-ease); }
.bl-nav[data-pill] .bl-nav__bar { max-width: var(--bl-pill-w); height: var(--bl-pill-h); margin-top: var(--bl-pill-top); border-radius: var(--bl-pill-r); background: var(--bl-bg-pill); border-color: transparent; box-shadow: 0 0 0 1px var(--bl-line), 0 12px 32px -14px rgba(0,0,0,0.6); backdrop-filter: blur(var(--bl-blur)) saturate(1.4); -webkit-backdrop-filter: blur(var(--bl-blur)) saturate(1.4); }
.bl-nav[data-hidden]:not(:focus-within) .bl-nav__bar { transform: translateY(calc(-100% - var(--bl-pill-top) - 8px)); }
.bl-nav__brand { display: flex; align-items: center; gap: 10px; flex: 0 0 auto; color: inherit; font-weight: 700; text-decoration: none; white-space: nowrap; }
.bl-nav__links { display: flex; gap: 4px; flex: 1; justify-content: center; margin: 0; padding: 0; list-style: none; min-width: 0; }
.bl-nav__link { display: block; padding: 8px 12px; border-radius: var(--bl-link-r); color: var(--bl-muted); font-size: 14px; font-weight: 600; text-decoration: none; white-space: nowrap; transition: color 150ms, background-color 150ms; }
.bl-nav__link:hover, .bl-nav__link[aria-current="page"] { color: var(--bl-ink); background: var(--bl-hover); }
.bl-nav__link:focus-visible, .bl-nav__menu:focus-visible, .bl-nav__brand:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-nav__actions { display: flex; align-items: center; gap: 8px; flex: 0 0 auto; }
.bl-nav__menu { display: none; place-items: center; width: 38px; height: 38px; margin-left: auto; border: 0; border-radius: var(--bl-link-r); background: var(--bl-hover); color: var(--bl-ink); cursor: pointer; }
.bl-nav__sheet { position: absolute; left: 8px; right: 8px; top: calc(100% + 8px); display: grid; gap: 2px; padding: 8px; border-radius: var(--bl-link-r); background: var(--bl-bg-pill); box-shadow: 0 0 0 1px var(--bl-line), 0 20px 40px -16px rgba(0,0,0,0.7); backdrop-filter: blur(var(--bl-blur)); -webkit-backdrop-filter: blur(var(--bl-blur)); }
@container (max-width: 640px) {
  .bl-nav__links, .bl-nav__actions { display: none; }
  .bl-nav__menu { display: grid; }
}
@media (prefers-reduced-motion: reduce) { .bl-nav__bar { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

function scrollParent(node: HTMLElement | null): HTMLElement | Window {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) return el;
  }
  return window;
}

export interface NavLink {
  href: string;
  label: ReactNode;
}

export interface SmartNavbarProps {
  /** Logo area. */
  brand?: ReactNode;
  brandHref?: string;
  links?: NavLink[];
  /** Buttons on the right (also shown in the mobile menu). */
  actions?: ReactNode;
  /** href of the current page; marked with aria-current. */
  current?: string;
  /** Turns links into client-side navigation (default navigation is prevented). */
  onNavigate?: (href: string, link?: NavLink) => void;
  /** Scroll distance after which the bar becomes a pill, in px. */
  shrinkAt?: number;
  /** Hide while scrolling down; scrolling up or focusing a link shows it. */
  hideOnScroll?: boolean;
  /** Never hide above this scroll position, in px. */
  hideAfter?: number;
  height?: number;
  pillHeight?: number;
  pillWidth?: number;
  /** Gap above the pill, in px. */
  pillTop?: number;
  padding?: number;
  radius?: number;
  /** Pill backdrop blur, in px. */
  blur?: number;
  duration?: number;
  textColor?: string;
  mutedColor?: string;
  /** Bar background while at the top. */
  topColor?: string;
  topLineColor?: string;
  pillColor?: string;
  lineColor?: string;
  hoverColor?: string;
  accentColor?: string;
  fontFamily?: string;
  /** Accessible name of the nav landmark. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export default function SmartNavbar({
  brand,
  brandHref = '/',
  links = [],
  actions,
  current,
  onNavigate,
  shrinkAt = 60,
  hideOnScroll = true,
  hideAfter = 240,
  height = 64,
  pillHeight = 52,
  pillWidth = 720,
  pillTop = 12,
  padding = 24,
  radius = 999,
  blur = 14,
  duration = 380,
  textColor,
  mutedColor,
  topColor = 'transparent',
  topLineColor,
  pillColor,
  lineColor,
  hoverColor,
  accentColor,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  label = 'Main',
  className = '',
  style
}: SmartNavbarProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ref = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuOpenRef = useRef(false);
  menuOpenRef.current = menuOpen;

  useEffect(() => {
    const scroller = scrollParent(ref.current);
    const read = () => (scroller === window ? window.scrollY : (scroller as HTMLElement).scrollTop);
    let last = read();
    let travel = 0;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = read();
      const delta = y - last;
      last = y;
      setPill(y > shrinkAt);
      // Small jitters don't toggle; it takes a few px of consistent travel to hide or show.
      travel = Math.sign(delta) === Math.sign(travel) ? travel + delta : delta;
      if (!hideOnScroll || y < hideAfter || menuOpenRef.current) setHidden(false);
      else if (travel > 12) setHidden(true);
      else if (travel < -8) setHidden(false);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', onScroll);
    };
  }, [shrinkAt, hideOnScroll, hideAfter]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    const onDown = (event: PointerEvent) => !ref.current!.contains(event.target as Node) && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [menuOpen]);

  const link = (item: NavLink, extra?: () => void) => (
    <a
      className="bl-nav__link"
      href={item.href}
      aria-current={current === item.href ? 'page' : undefined}
      onClick={event => {
        if (onNavigate) {
          event.preventDefault();
          onNavigate(item.href, item);
        }
        extra?.();
      }}
    >
      {item.label}
    </a>
  );

  return (
    <div
      ref={ref}
      className={`bl-nav ${className}`}
      data-pill={pill || undefined}
      data-hidden={hidden || undefined}
      style={{
        '--bl-h': `${height}px`,
        '--bl-pill-h': `${pillHeight}px`,
        '--bl-pill-w': `${pillWidth}px`,
        '--bl-pill-top': `${pillTop}px`,
        '--bl-pill-r': `${Math.min(radius, pillHeight / 2)}px`,
        '--bl-link-r': `${Math.min(radius, 10)}px`,
        '--bl-pad': `${padding}px`,
        '--bl-blur': `${blur}px`,
        '--bl-dur': `${duration}ms`,
        '--bl-ease': 'cubic-bezier(.2,.9,.25,1)',
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-bg-top': topColor,
        '--bl-line-top': topLineColor,
        '--bl-bg-pill': pillColor,
        '--bl-line': lineColor,
        '--bl-hover': hoverColor,
        '--bl-accent': accentColor,
        '--bl-font': fontFamily,
        ...style
      } as CSSVars}
    >
      <nav className="bl-nav__bar" aria-label={label}>
        {brand && (
          <a
            className="bl-nav__brand"
            href={brandHref}
            onClick={event => {
              if (onNavigate) {
                event.preventDefault();
                onNavigate(brandHref);
              }
            }}
          >
            {brand}
          </a>
        )}
        <ul className="bl-nav__links">
          {links.map(item => (
            <li key={item.href}>{link(item)}</li>
          ))}
        </ul>
        {actions && <div className="bl-nav__actions">{actions}</div>}
        <button type="button" className="bl-nav__menu" aria-expanded={menuOpen} aria-controls={`${uid}-sheet`} aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(o => !o)}>
          <svg width="18" height="18" viewBox="0 0 18 18" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden="true">
            {menuOpen ? <path d="M3 3l12 12M15 3 3 15" /> : <path d="M2 4h14M2 9h14M2 14h14" />}
          </svg>
        </button>
        {menuOpen && (
          <div id={`${uid}-sheet`} className="bl-nav__sheet">
            {links.map(item => (
              <div key={item.href}>{link(item, () => setMenuOpen(false))}</div>
            ))}
            {actions && <div style={{ display: 'flex', gap: 8, padding: '8px 4px 2px' }}>{actions}</div>}
          </div>
        )}
      </nav>
    </div>
  );
}
