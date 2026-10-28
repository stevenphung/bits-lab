import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Breadcrumbs that fit their space. When the trail is too wide, the middle crumbs fold into
// a "…" button (the first and current page always stay), and folded crumbs pop back in as
// room returns. The button opens a small animated menu of the hidden pages: arrows move
// through it, Escape closes it and returns focus. A <nav> with an ordered list, and the
// current page marked aria-current.

const STYLE_ID = 'bl-breadcrumb-trail-tw';
const CSS = `
/* theme tokens */
.bl-crumbs { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-dim: #566c86; --bl-hover: rgba(255,255,255,0.08); --bl-chip: rgba(255,255,255,0.05); --bl-menu: #1a1c2c; --bl-line: #333c57; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-crumbs, .bl-crumbs:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-dim: #8a96a3; --bl-hover: rgba(26,28,44,0.08); --bl-chip: rgba(26,28,44,0.05); --bl-menu: #f4f1e8; --bl-line: #cfc4ad; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-crumbs, :where(.light, [data-theme="light"]) .bl-crumbs:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-dim: #566c86; --bl-hover: rgba(255,255,255,0.08); --bl-chip: rgba(255,255,255,0.05); --bl-menu: #1a1c2c; --bl-line: #333c57; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-crumbs, .bl-crumbs:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-dim: #8a96a3; --bl-hover: rgba(26,28,44,0.08); --bl-chip: rgba(26,28,44,0.05); --bl-menu: #f4f1e8; --bl-line: #cfc4ad; --bl-accent: #167f8f; } }
/* theme tokens end */
@keyframes bl-crumbs-in { from { opacity: 0; transform: translateY(4px) scale(0.92); } }
@keyframes bl-crumbs-menu { from { opacity: 0; transform: scale(0.9) translateY(-4px); } }
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

export interface Crumb {
  label: string;
  /** Renders a link; without it the crumb is a button. */
  href?: string;
  icon?: ReactNode;
}

export interface BreadcrumbTrailProps {
  /** Root first, current page last. */
  items?: Crumb[];
  /** Any crumb or menu click; call event.preventDefault() for client-side routing. */
  onNavigate?: (item: Crumb, index: number, event: ReactMouseEvent<HTMLElement>) => void;
  separator?: ReactNode;
  /** Accessible name of the "…" button and its menu. */
  moreLabel?: string;
  /** Accessible name of the nav landmark. */
  label?: string;
  fontSize?: number;
  textColor?: string;
  mutedColor?: string;
  dimColor?: string;
  hoverColor?: string;
  chipColor?: string;
  menuColor?: string;
  lineColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function BreadcrumbTrail({
  items = [],
  onNavigate,
  separator = <Chevron />,
  moreLabel = 'Show hidden pages',
  label = 'Breadcrumb',
  fontSize = 14,
  textColor,
  mutedColor,
  dimColor,
  hoverColor,
  chipColor,
  menuColor,
  lineColor,
  accentColor,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: BreadcrumbTrailProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const navRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [hidden, setHidden] = useState(0);
  const [open, setOpen] = useState(false);
  const [menuX, setMenuX] = useState(0);

  // Fold crumbs from the second one onward until the trail fits.
  useLayoutEffect(() => {
    const nav = navRef.current!;
    const measure = measureRef.current!;
    const fit = () => {
      const widths = [...measure.children].map(node => node.getBoundingClientRect().width);
      const more = widths.pop()!;
      const gap = 4;
      const available = nav.clientWidth;
      const total = (n: number) => widths.reduce((sum, w, i) => (i >= 1 && i <= n ? sum : sum + w + gap), 0) + (n ? more + gap : 0);
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
    const menu = menuRef.current!;
    const button = moreRef.current!;
    const nav = navRef.current!;
    setMenuX(button.offsetLeft);
    menu.querySelector<HTMLElement>('.bl-crumbs__link')?.focus();
    const entries = () => [...menu.querySelectorAll<HTMLElement>('.bl-crumbs__link')];
    const onKey = (event: KeyboardEvent) => {
      const list = entries();
      const at = list.indexOf(document.activeElement as HTMLElement);
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
    const onDown = (event: PointerEvent) => {
      if (!nav.contains(event.target as Node)) setOpen(false);
    };
    menu.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      menu.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const content = (item: Crumb) => (
    <>
      {item.icon && <span aria-hidden="true">{item.icon}</span>}
      <span className="overflow-hidden text-ellipsis">{item.label}</span>
    </>
  );
  const link = (item: Crumb, index: number, extra: HTMLAttributes<HTMLElement> = {}) => {
    const onClick = (event: ReactMouseEvent<HTMLElement>) => {
      onNavigate?.(item, index, event);
      setOpen(false);
    };
    return item.href ? (
      <a className="bl-crumbs__link inline-flex min-w-0 cursor-pointer items-center gap-1.5 rounded-[8px] border-0 bg-transparent px-2 py-[5px] text-(--bl-muted) no-underline [transition:background-color_150ms,color_150ms] hover:bg-(--bl-hover) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid focus-visible:outline-offset-1" href={item.href} onClick={onClick} {...extra}>
        {content(item)}
      </a>
    ) : (
      <button type="button" className="bl-crumbs__link inline-flex min-w-0 cursor-pointer items-center gap-1.5 rounded-[8px] border-0 bg-transparent px-2 py-[5px] text-(--bl-muted) no-underline [transition:background-color_150ms,color_150ms] hover:bg-(--bl-hover) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid focus-visible:outline-offset-1" onClick={onClick} {...extra}>
        {content(item)}
      </button>
    );
  };
  const crumb = (item: Crumb, index: number) => {
    const last = index === items.length - 1;
    return (
      <li key={`${index}-${item.label}`} className="flex min-w-0 animate-[bl-crumbs-in_260ms_cubic-bezier(.3,1.4,.5,1)_both] items-center gap-1 last:flex-[0_1_auto] motion-reduce:animate-none">
        {last ? (
          <span className="inline-flex min-w-0 items-center gap-1.5 px-2 py-[5px] font-semibold text-(--bl-ink)" aria-current="page">
            {content(item)}
          </span>
        ) : (
          link(item, index)
        )}
        {!last && <span className="grid flex-none place-items-center text-(--bl-dim)" aria-hidden="true">{separator}</span>}
      </li>
    );
  };

  const folded = items.slice(1, 1 + hidden);
  return (
    <nav ref={navRef} aria-label={label} className={`bl-crumbs relative min-w-0 font-(family-name:--bl-font) text-(length:--bl-size) ${className}`} style={{ '--bl-size': `${fontSize}px`, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-dim': dimColor, '--bl-hover': hoverColor, '--bl-chip': chipColor, '--bl-menu': menuColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-font': fontFamily, '--bl-menu-x': `${menuX}px`, ...style } as CSSVars}>
      <ol className="m-0 flex min-w-0 list-none items-center gap-1 p-0 whitespace-nowrap">
        {items.length > 0 && crumb(items[0], 0)}
        {hidden > 0 && (
          <li className="flex min-w-0 animate-[bl-crumbs-in_260ms_cubic-bezier(.3,1.4,.5,1)_both] items-center gap-1 last:flex-[0_1_auto] motion-reduce:animate-none">
            <button
              ref={moreRef}
              type="button"
              className="grid h-[30px] min-w-8 cursor-pointer place-items-center rounded-[8px] border-0 bg-(--bl-chip) px-1.5 py-0 tracking-[1px] text-(--bl-ink) [transition:background-color_150ms] hover:bg-(--bl-hover) aria-expanded:bg-(--bl-hover) focus-visible:outline-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid focus-visible:outline-offset-1"
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
            <span className="grid flex-none place-items-center text-(--bl-dim)" aria-hidden="true">
              {separator}
            </span>
          </li>
        )}
        {items.slice(1 + hidden).map((item, i) => crumb(item, i + 1 + hidden))}
      </ol>
      {open && (
        <ul ref={menuRef} id={`${uid}-menu`} role="menu" aria-label={moreLabel} className="absolute top-[calc(100%_+_6px)] left-(--bl-menu-x) z-20 m-0 min-w-[180px] origin-top-left animate-[bl-crumbs-menu_200ms_cubic-bezier(.3,1.4,.5,1)_both] list-none rounded-[12px] bg-(--bl-menu) p-[5px] shadow-[0_0_0_1px_var(--bl-line),0_16px_32px_-14px_rgba(0,0,0,0.8)] [&_[role=menuitem]]:box-border [&_[role=menuitem]]:flex [&_[role=menuitem]]:w-full [&_[role=menuitem]]:animate-[bl-crumbs-in_240ms_cubic-bezier(.3,1.4,.5,1)_both] [&_[role=menuitem]]:px-2.5 [&_[role=menuitem]]:py-2 [&_[role=menuitem]]:[animation-delay:calc(var(--i)*35ms)] motion-reduce:animate-none motion-reduce:[&_[role=menuitem]]:animate-none">
          {folded.map((item, i) => (
            <li key={`${i}-${item.label}`} role="none">
              {link(item, i + 1, { role: 'menuitem', tabIndex: -1, style: { '--i': i } as CSSVars })}
            </li>
          ))}
        </ul>
      )}
      {/* Full-width copies of every crumb (plus the "…" button) to measure what fits. */}
      <div className="pointer-events-none invisible absolute top-0 left-0 h-0 w-0 overflow-hidden" aria-hidden="true">
        <div ref={measureRef} className="m-0 flex min-w-0 list-none items-center gap-1 p-0 whitespace-nowrap w-max">
          {items.map((item, index) => (
            <span key={`${index}-${item.label}`} className="flex min-w-0 animate-[bl-crumbs-in_260ms_cubic-bezier(.3,1.4,.5,1)_both] items-center gap-1 last:flex-[0_1_auto] motion-reduce:animate-none" style={{ animation: 'none' }}>
              <span className={index === items.length - 1 ? 'inline-flex min-w-0 items-center gap-1.5 px-2 py-[5px] font-semibold text-(--bl-ink)' : 'bl-crumbs__link inline-flex min-w-0 cursor-pointer items-center gap-1.5 rounded-[8px] border-0 bg-transparent px-2 py-[5px] text-(--bl-muted) no-underline [transition:background-color_150ms,color_150ms] hover:bg-(--bl-hover) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid focus-visible:outline-offset-1'}>{content(item)}</span>
              {index < items.length - 1 && <span className="grid flex-none place-items-center text-(--bl-dim)">{separator}</span>}
            </span>
          ))}
          <span className="flex min-w-0 animate-[bl-crumbs-in_260ms_cubic-bezier(.3,1.4,.5,1)_both] items-center gap-1 last:flex-[0_1_auto] motion-reduce:animate-none" style={{ animation: 'none' }}>
            <span className="grid h-[30px] min-w-8 cursor-pointer place-items-center rounded-[8px] border-0 bg-(--bl-chip) px-1.5 py-0 tracking-[1px] text-(--bl-ink) [transition:background-color_150ms] hover:bg-(--bl-hover) aria-expanded:bg-(--bl-hover) focus-visible:outline-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid focus-visible:outline-offset-1">…</span>
            <span className="grid flex-none place-items-center text-(--bl-dim)">{separator}</span>
          </span>
        </div>
      </div>
    </nav>
  );
}
