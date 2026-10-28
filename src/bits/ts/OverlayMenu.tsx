import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A full-screen menu. The menu button morphs into a close cross, the screen fills in a stepped
// pixel wipe from the top, and big links drop in one after another, each with a small note at
// the side; a footer slot holds anything else. Escape or the cross closes it and hands focus
// back to the button. While open, focus stays inside and the page behind doesn't scroll.
// Reduced motion opens and closes at once.

const STYLE_ID = 'bl-overlay-menu';
const CSS = `
.bl-omenu__toggle { position: relative; z-index: 1801; display: inline-grid; place-items: center; width: 46px; height: 46px; padding: 0; border: 0; border-radius: 10px; background: var(--bl-chip); color: var(--bl-ink); cursor: pointer; }
.bl-omenu__toggle:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-omenu__bars { position: relative; width: 20px; height: 14px; }
.bl-omenu__bars span { position: absolute; left: 0; width: 100%; height: 2px; background: currentColor; transition: transform 240ms steps(4), opacity 160ms steps(2), top 240ms steps(4); }
.bl-omenu__bars span:nth-child(1) { top: 0; }
.bl-omenu__bars span:nth-child(2) { top: 6px; }
.bl-omenu__bars span:nth-child(3) { top: 12px; }
.bl-omenu__toggle[aria-expanded="true"] .bl-omenu__bars span:nth-child(1) { top: 6px; transform: rotate(45deg); }
.bl-omenu__toggle[aria-expanded="true"] .bl-omenu__bars span:nth-child(2) { opacity: 0; }
.bl-omenu__toggle[aria-expanded="true"] .bl-omenu__bars span:nth-child(3) { top: 6px; transform: rotate(-45deg); }
.bl-omenu { position: fixed; inset: 0; z-index: 1800; display: grid; grid-template-rows: 1fr auto; overflow-y: auto; padding: 88px max(24px, 6vw) 32px; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); clip-path: inset(0 0 0 0); animation: bl-omenu-wipe 420ms steps(8) both; }
.bl-omenu[data-closing] { animation: bl-omenu-wipe 300ms steps(6) reverse both; }
.bl-omenu__close { position: absolute; top: 20px; right: max(20px, 5vw); }
.bl-omenu__list { display: grid; align-content: center; gap: 4px; margin: 0; padding: 0; list-style: none; }
.bl-omenu__item { opacity: 0; transform: translateY(16px); animation: bl-omenu-drop 360ms cubic-bezier(.2,.9,.3,1.2) forwards; animation-delay: calc(160ms + var(--i) * 55ms); }
.bl-omenu__link { display: flex; align-items: baseline; gap: 16px; width: 100%; padding: 6px 0; border: 0; background: none; color: inherit; font: inherit; font-size: var(--bl-size); line-height: 1.15; text-align: left; text-decoration: none; cursor: pointer; transition: color 120ms steps(2), transform 160ms steps(3); }
.bl-omenu__link:hover, .bl-omenu__link:focus-visible { color: var(--bl-accent); transform: translateX(10px); outline: none; }
.bl-omenu__index { color: var(--bl-muted); font-size: 13px; font-variant-numeric: tabular-nums; }
.bl-omenu__meta { margin-left: auto; color: var(--bl-muted); font-size: 14px; }
.bl-omenu__foot { padding-top: 24px; border-top: 1px solid var(--bl-line); color: var(--bl-muted); font-size: 14px; opacity: 0; animation: bl-omenu-drop 360ms ease forwards; animation-delay: calc(200ms + var(--n) * 55ms); }
@keyframes bl-omenu-wipe { from { clip-path: inset(0 0 100% 0); } }
@keyframes bl-omenu-drop { to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .bl-omenu, .bl-omenu[data-closing], .bl-omenu__item, .bl-omenu__foot { animation: none; opacity: 1; transform: none; } .bl-omenu__bars span { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const Bars = () => (
  <span className="bl-omenu__bars" aria-hidden="true">
    <span />
    <span />
    <span />
  </span>
);

export interface MenuItem {
  label: string;
  href?: string;
  /** A small note at the side. */
  meta?: ReactNode;
  onSelect?: (event: ReactMouseEvent<HTMLElement>) => void;
}

export interface OverlayMenuProps {
  items?: MenuItem[];
  /** Anything under the links. */
  footer?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onNavigate?: (item: MenuItem, event: ReactMouseEvent<HTMLElement>) => void;
  label?: string;
  /** Number the links. */
  numbered?: boolean;
  /** Maximum link size in px. */
  fontSize?: number;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  chipColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function OverlayMenu({
  items = [],
  footer,
  open: controlled,
  defaultOpen = false,
  onOpenChange,
  onNavigate,
  label = 'Menu',
  numbered = true,
  fontSize = 44,
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = '#333c57',
  chipColor = 'rgba(255,255,255,0.08)',
  accentColor = '#ffcd75',
  fontFamily = 'inherit',
  className = '',
  style
}: OverlayMenuProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState(defaultOpen);
  const open = controlled ?? inner;
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const setOpen = (next: boolean) => {
    if (controlled === undefined) setInner(next);
    onOpenChange?.(next);
  };

  // Stay mounted through the closing wipe, then unmount.
  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return undefined;
    }
    if (!mounted) return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setClosing(true);
    const id = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, reduced ? 0 : 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // While open: focus the first link, trap Tab, close on Escape, lock page scroll.
  useEffect(() => {
    if (!open || !mounted) return undefined;
    const panel = panelRef.current!;
    const toggle = toggleRef.current;
    const focusables = () => [...panel.querySelectorAll<HTMLElement>('a[href], button, [tabindex]:not([tabindex="-1"])')];
    focusables()[1]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        toggle?.focus();
      } else if (event.key === 'Tab') {
        const list = focusables();
        const first = list[0];
        const last = list[list.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  const vars: CSSVars = { '--bl-size': `clamp(26px, 6vw, ${fontSize}px)`, '--bl-bg': backgroundColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-line': lineColor, '--bl-chip': chipColor, '--bl-accent': accentColor, '--bl-font': fontFamily };
  const choose = (item: MenuItem, event: ReactMouseEvent<HTMLElement>) => {
    item.onSelect?.(event);
    onNavigate?.(item, event);
    setOpen(false);
    toggleRef.current?.focus();
  };

  return (
    <>
      <button ref={toggleRef} type="button" className={`bl-omenu__toggle ${className}`} aria-expanded={open} aria-controls={`${uid}-menu`} aria-label={open ? `Close ${label}` : `Open ${label}`} onClick={() => setOpen(!open)} style={{ ...vars, ...style }}>
        <Bars />
      </button>
      {mounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <div ref={panelRef} id={`${uid}-menu`} className="bl-omenu" role="dialog" aria-modal="true" aria-label={label} data-closing={closing || undefined} style={{ ...vars, '--n': items.length } as CSSVars}>
            <button type="button" className="bl-omenu__toggle bl-omenu__close" aria-expanded="true" aria-label={`Close ${label}`} onClick={() => {
              setOpen(false);
              toggleRef.current?.focus();
            }}>
              <Bars />
            </button>
            <nav aria-label={label}>
              <ul className="bl-omenu__list">
                {items.map((item, i) => {
                  const content = (
                    <>
                      {numbered && <span className="bl-omenu__index">{String(i + 1).padStart(2, '0')}</span>}
                      <span>{item.label}</span>
                      {item.meta && <span className="bl-omenu__meta">{item.meta}</span>}
                    </>
                  );
                  return (
                    <li key={item.label} className="bl-omenu__item" style={{ '--i': i } as CSSVars}>
                      {item.href ? (
                        <a className="bl-omenu__link" href={item.href} onClick={event => choose(item, event)}>
                          {content}
                        </a>
                      ) : (
                        <button type="button" className="bl-omenu__link" onClick={event => choose(item, event)}>
                          {content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
            {footer && <div className="bl-omenu__foot">{footer}</div>}
          </div>,
          document.body
        )}
    </>
  );
}
