import { useEffect, useId, useInsertionEffect, useRef, useState } from 'react';

const STYLE_ID = 'bl-smart-navbar-tw';
const CSS = `
/* theme tokens */
.bl-nav { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line-top: rgba(255,255,255,0.08); --bl-bg-pill: rgba(26,28,44,0.72); --bl-line: rgba(255,255,255,0.12); --bl-hover: rgba(255,255,255,0.08); --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-nav, .bl-nav:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line-top: rgba(26,28,44,0.08); --bl-bg-pill: rgba(244,241,232,0.82); --bl-line: rgba(26,28,44,0.12); --bl-hover: rgba(26,28,44,0.08); --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-nav, :where(.light, [data-theme="light"]) .bl-nav:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line-top: rgba(255,255,255,0.08); --bl-bg-pill: rgba(26,28,44,0.72); --bl-line: rgba(255,255,255,0.12); --bl-hover: rgba(255,255,255,0.08); --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-nav, .bl-nav:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line-top: rgba(26,28,44,0.08); --bl-bg-pill: rgba(244,241,232,0.82); --bl-line: rgba(26,28,44,0.12); --bl-hover: rgba(26,28,44,0.08); --bl-accent: #167f8f; } }
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

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Navbar that gets out of the way. Full width at the top of the page; once you scroll past
// `shrinkAt` it tightens into a floating, blurred pill. Scrolling down hides it, scrolling
// up (or tabbing into it) brings it back. Collapses to a menu button on narrow containers.
// Tracks the nearest scroll box or the window.

function scrollParent(node) {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) return el;
  }
  return window;
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
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const ref = useRef(null);
  const [pill, setPill] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuOpenRef = useRef(false);
  menuOpenRef.current = menuOpen;

  useEffect(() => {
    const scroller = scrollParent(ref.current);
    const read = () => (scroller === window ? window.scrollY : scroller.scrollTop);
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
    const onKey = event => event.key === 'Escape' && setMenuOpen(false);
    const onDown = event => !ref.current.contains(event.target) && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [menuOpen]);

  const link = (item, extra) => (
    <a
      className="block rounded-(--bl-link-r) px-3 py-2 text-[14px] font-semibold whitespace-nowrap text-(--bl-muted) no-underline transition-[color,background-color] duration-150 ease-[ease] hover:bg-(--bl-hover) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) aria-[current=page]:bg-(--bl-hover) aria-[current=page]:text-(--bl-ink)"
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
      className={`bl-nav group/nav @container sticky top-0 z-40 h-0 font-(family-name:--bl-font) ${className}`}
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
      }}
    >
      <nav className="relative mx-auto box-border flex h-(--bl-h) w-full max-w-full items-center gap-[18px] border-b border-solid border-(--bl-line-top) bg-(--bl-bg-top) px-(--bl-pad) text-(--bl-ink) [transition:max-width_var(--bl-dur)_var(--bl-ease),margin-top_var(--bl-dur)_var(--bl-ease),height_var(--bl-dur)_var(--bl-ease),border-radius_var(--bl-dur)_var(--bl-ease),background-color_var(--bl-dur),box-shadow_var(--bl-dur),border-color_var(--bl-dur),transform_var(--bl-dur)_var(--bl-ease)] group-data-[pill]/nav:mt-(--bl-pill-top) group-data-[pill]/nav:h-(--bl-pill-h) group-data-[pill]/nav:max-w-(--bl-pill-w) group-data-[pill]/nav:rounded-(--bl-pill-r) group-data-[pill]/nav:border-transparent group-data-[pill]/nav:bg-(--bl-bg-pill) group-data-[pill]/nav:shadow-[0_0_0_1px_var(--bl-line),0_12px_32px_-14px_rgba(0,0,0,0.6)] group-data-[pill]/nav:[backdrop-filter:blur(var(--bl-blur))_saturate(1.4)] [[data-hidden]:not(:focus-within)>&]:[transform:translateY(calc(-100%_-_var(--bl-pill-top)_-_8px))] motion-reduce:transition-none" aria-label={label}>
        {brand && (
          <a
            className="flex flex-none items-center gap-2.5 font-bold whitespace-nowrap text-inherit no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent)"
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
        <ul className="m-0 flex min-w-0 flex-1 list-none justify-center gap-1 p-0 [@container(max-width:640px)]:hidden">
          {links.map(item => (
            <li key={item.href}>{link(item)}</li>
          ))}
        </ul>
        {actions && <div className="flex flex-none items-center gap-2 [@container(max-width:640px)]:hidden">{actions}</div>}
        <button type="button" className="ml-auto hidden size-[38px] cursor-pointer place-items-center rounded-(--bl-link-r) border-0 bg-(--bl-hover) text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) [@container(max-width:640px)]:grid" aria-expanded={menuOpen} aria-controls={`${uid}-sheet`} aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(o => !o)}>
          <svg width="18" height="18" viewBox="0 0 18 18" stroke="currentColor" strokeWidth="2" fill="none" aria-hidden="true">
            {menuOpen ? <path d="M3 3l12 12M15 3 3 15" /> : <path d="M2 4h14M2 9h14M2 14h14" />}
          </svg>
        </button>
        {menuOpen && (
          <div id={`${uid}-sheet`} className="absolute top-[calc(100%_+_8px)] right-2 left-2 grid gap-0.5 rounded-(--bl-link-r) bg-(--bl-bg-pill) p-2 shadow-[0_0_0_1px_var(--bl-line),0_20px_40px_-16px_rgba(0,0,0,0.7)] backdrop-blur-(--bl-blur)">
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
