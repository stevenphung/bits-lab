import { useEffect, useId, useInsertionEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A full-screen menu. The menu button morphs into a close cross, the screen fills in a stepped
// pixel wipe from the top, and big links drop in one after another, each with a small note at
// the side; a footer slot holds anything else. Escape or the cross closes it and hands focus
// back to the button. While open, focus stays inside and the page behind doesn't scroll.
// Reduced motion opens and closes at once.

const STYLE_ID = 'bl-overlay-menu-tw';
const CSS = `
/* theme tokens */
:is(.bl-omenu__toggle, .bl-omenu) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-chip: rgba(255,255,255,0.08); --bl-accent: #ffcd75; }
:where(.light, [data-theme="light"]) :is(.bl-omenu__toggle, .bl-omenu), :is(.bl-omenu__toggle, .bl-omenu):where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-chip: rgba(26,28,44,0.08); --bl-accent: #a86a12; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) :is(.bl-omenu__toggle, .bl-omenu), :where(.light, [data-theme="light"]) :is(.bl-omenu__toggle, .bl-omenu):where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-chip: rgba(255,255,255,0.08); --bl-accent: #ffcd75; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) :is(.bl-omenu__toggle, .bl-omenu), :is(.bl-omenu__toggle, .bl-omenu):where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-chip: rgba(26,28,44,0.08); --bl-accent: #a86a12; } }
/* theme tokens end */
@keyframes bl-omenu-wipe { from { clip-path: inset(0 0 100% 0); } }
@keyframes bl-omenu-drop { to { opacity: 1; transform: none; } }
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
  <span className="relative h-3.5 w-5 *:absolute *:left-0 *:h-0.5 *:w-full *:bg-current *:[transition:transform_240ms_steps(4),opacity_160ms_steps(2),top_240ms_steps(4)] *:nth-1:top-0 *:nth-2:top-1.5 *:nth-3:top-3 group-aria-expanded/tog:*:nth-1:top-1.5 group-aria-expanded/tog:*:nth-1:[transform:rotate(45deg)] group-aria-expanded/tog:*:nth-2:opacity-0 group-aria-expanded/tog:*:nth-3:top-1.5 group-aria-expanded/tog:*:nth-3:[transform:rotate(-45deg)] motion-reduce:*:[transition:none]" aria-hidden="true">
    <span />
    <span />
    <span />
  </span>
);

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
  backgroundColor,
  textColor,
  mutedColor,
  lineColor,
  chipColor,
  accentColor,
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState(defaultOpen);
  const open = controlled ?? inner;
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const toggleRef = useRef(null);
  const panelRef = useRef(null);

  const setOpen = next => {
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
    const panel = panelRef.current;
    const toggle = toggleRef.current;
    const focusables = () => [...panel.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')];
    focusables()[1]?.focus();
    const onKey = event => {
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

  const vars = { '--bl-size': `clamp(26px, 6vw, ${fontSize}px)`, '--bl-bg': backgroundColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-line': lineColor, '--bl-chip': chipColor, '--bl-accent': accentColor, '--bl-font': fontFamily };
  const choose = (item, event) => {
    item.onSelect?.(event);
    onNavigate?.(item, event);
    setOpen(false);
    toggleRef.current?.focus();
  };

  return (
    <>
      <button ref={toggleRef} type="button" className={`bl-omenu__toggle group/tog relative z-1801 inline-grid size-[46px] cursor-pointer place-items-center rounded-[10px] border-0 bg-(--bl-chip) p-0 text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid ${className}`} aria-expanded={open} aria-controls={`${uid}-menu`} aria-label={open ? `Close ${label}` : `Open ${label}`} onClick={() => setOpen(!open)} style={{ ...vars, ...style }}>
        <Bars />
      </button>
      {mounted &&
        typeof document !== 'undefined' &&
        createPortal(
          <div ref={panelRef} id={`${uid}-menu`} className="bl-omenu fixed inset-0 z-1800 grid animate-[bl-omenu-wipe_420ms_steps(8)_both] grid-rows-[1fr_auto] overflow-y-auto bg-(--bl-bg) px-[max(24px,6vw)] pt-[88px] pb-8 font-(family-name:--bl-font) text-(--bl-ink) [clip-path:inset(0_0_0_0)] data-[closing]:animate-[bl-omenu-wipe_300ms_steps(6)_reverse_both] motion-reduce:animate-none!" role="dialog" aria-modal="true" aria-label={label} data-closing={closing || undefined} style={{ ...vars, '--n': items.length }}>
            <button type="button" className="group/tog absolute top-5 right-[max(20px,5vw)] z-1801 inline-grid size-[46px] cursor-pointer place-items-center rounded-[10px] border-0 bg-(--bl-chip) p-0 text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" aria-expanded="true" aria-label={`Close ${label}`} onClick={() => {
              setOpen(false);
              toggleRef.current?.focus();
            }}>
              <Bars />
            </button>
            <nav aria-label={label}>
              <ul className="m-0 grid list-none content-center gap-1 p-0">
                {items.map((item, i) => {
                  const content = (
                    <>
                      {numbered && <span className="text-[13px] text-(--bl-muted) tabular-nums">{String(i + 1).padStart(2, '0')}</span>}
                      <span>{item.label}</span>
                      {item.meta && <span className="ml-auto text-[14px] text-(--bl-muted)">{item.meta}</span>}
                    </>
                  );
                  return (
                    <li key={item.label} className="animate-[bl-omenu-drop_360ms_cubic-bezier(.2,.9,.3,1.2)_calc(160ms_+_var(--i)_*_55ms)_forwards] opacity-0 [transform:translateY(16px)] motion-reduce:animate-none! motion-reduce:opacity-100 motion-reduce:[transform:none]" style={{ '--i': i }}>
                      {item.href ? (
                        <a className="flex w-full cursor-pointer items-baseline gap-4 border-0 bg-none px-0 py-1.5 text-left text-(length:--bl-size) leading-[1.15] text-inherit no-underline [transition:color_120ms_steps(2),transform_160ms_steps(3)] hover:text-(--bl-accent) hover:[transform:translateX(10px)] focus-visible:text-(--bl-accent) focus-visible:[transform:translateX(10px)] focus-visible:outline-none" href={item.href} onClick={event => choose(item, event)}>
                          {content}
                        </a>
                      ) : (
                        <button type="button" className="flex w-full cursor-pointer items-baseline gap-4 border-0 bg-none px-0 py-1.5 text-left text-(length:--bl-size) leading-[1.15] text-inherit no-underline [transition:color_120ms_steps(2),transform_160ms_steps(3)] hover:text-(--bl-accent) hover:[transform:translateX(10px)] focus-visible:text-(--bl-accent) focus-visible:[transform:translateX(10px)] focus-visible:outline-none" onClick={event => choose(item, event)}>
                          {content}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </nav>
            {footer && <div className="animate-[bl-omenu-drop_360ms_ease_calc(200ms_+_var(--n)_*_55ms)_forwards] border-t border-solid border-(--bl-line) pt-6 text-[14px] text-(--bl-muted) opacity-0 motion-reduce:animate-none! motion-reduce:opacity-100">{footer}</div>}
          </div>,
          document.body
        )}
    </>
  );
}
