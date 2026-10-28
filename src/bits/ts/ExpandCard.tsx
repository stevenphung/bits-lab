import { Children, cloneElement, createContext, isValidElement, useContext, useId, useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type ReactElement } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Cards that open in place. Put <ExpandCard>s in an <ExpandCardGrid>: opening one widens it
// to the full row and reveals the article inside, while every other card glides to its new
// spot (FLIP). Unlike a modal, the article stays in the page flow, so it scrolls, links and
// prints like normal content. Esc or the close button folds it back.

const STYLE_ID = 'bl-expand-card';
const CSS = `
.bl-xgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(var(--bl-min), 100%), 1fr)); gap: var(--bl-gap); font-family: var(--bl-font); color: var(--bl-ink); }
.bl-xcard { position: relative; display: flex; flex-direction: column; min-width: 0; overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-bg); box-shadow: inset 0 0 0 1px var(--bl-line); }
.bl-xcard[data-open] { grid-column: 1 / -1; box-shadow: inset 0 0 0 1px var(--bl-line), 0 24px 50px -30px rgba(0,0,0,0.7); }
.bl-xcard__trigger { display: block; width: 100%; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.bl-xcard__trigger:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: -2px; border-radius: var(--bl-radius); }
.bl-xcard[data-open] .bl-xcard__trigger { cursor: default; }
.bl-xcard__media { overflow: hidden; height: var(--bl-media); transition: height var(--bl-dur) cubic-bezier(.2,.9,.25,1); }
.bl-xcard[data-open] .bl-xcard__media { height: var(--bl-media-open); }
.bl-xcard__media > img, .bl-xcard__media > video { display: block; width: 100%; height: 100%; object-fit: cover; }
.bl-xcard__head { padding: 16px 18px 18px; }
.bl-xcard__eyebrow { margin: 0 0 6px; color: var(--bl-accent); font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; }
.bl-xcard__title { margin: 0; font-size: var(--bl-title); font-weight: 700; line-height: 1.25; transition: font-size var(--bl-dur) cubic-bezier(.2,.9,.25,1); }
.bl-xcard[data-open] .bl-xcard__title { font-size: calc(var(--bl-title) * 1.45); }
.bl-xcard__summary { margin: 8px 0 0; color: var(--bl-muted); font-size: 14px; line-height: 1.55; }
.bl-xcard__body { padding: 0 18px 22px; color: var(--bl-ink); line-height: 1.7; animation: bl-xcard-in calc(var(--bl-dur) * 1.2) cubic-bezier(.2,.9,.25,1) both; animation-delay: calc(var(--bl-dur) * 0.35); }
.bl-xcard__body > :first-child { margin-top: 0; }
.bl-xcard__close { position: absolute; top: 12px; right: 12px; z-index: 2; display: grid; place-items: center; width: 34px; height: 34px; border: 0; border-radius: 50%; background: rgba(0,0,0,0.55); color: #fff; cursor: pointer; animation: bl-xcard-in 300ms ease both; }
.bl-xcard__close:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
@keyframes bl-xcard-in { from { opacity: 0; transform: translateY(10px); } }
@media (prefers-reduced-motion: reduce) { .bl-xcard__media, .bl-xcard__title { transition: none; } .bl-xcard__body, .bl-xcard__close { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

interface GridState {
  openId: string | null;
  toggle: (id: string | null) => void;
}

const GridContext = createContext<GridState | null>(null);

export interface ExpandCardProps {
  /** Stable identity inside a grid (defaults to its position). */
  id?: string;
  /** Image or video at the top; it grows taller when open. */
  media?: ReactNode;
  eyebrow?: ReactNode;
  title: ReactNode;
  summary?: ReactNode;
  /** The article, revealed in the page flow when open. */
  children?: ReactNode;
  /** Controlled open state when used outside a grid. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  style?: CSSProperties;
}

export function ExpandCard({ id, media, eyebrow, title, summary, children, open: controlledOpen, onOpenChange, className = '', style }: ExpandCardProps) {
  const grid = useContext(GridContext);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const key = id ?? uid;
  const [innerOpen, setInnerOpen] = useState(false);
  const open = grid ? grid.openId === key : controlledOpen ?? innerOpen;
  const triggerRef = useRef<HTMLButtonElement>(null);

  const setOpen = (next: boolean) => {
    if (grid) grid.toggle(next ? key : null);
    else {
      if (controlledOpen === undefined) setInnerOpen(next);
      onOpenChange?.(next);
    }
    // After the close renders (a timeout, so it never waits on a throttled frame).
    if (!next) setTimeout(() => triggerRef.current?.focus({ preventScroll: true }));
  };

  return (
    <article
      className={`bl-xcard ${className}`}
      data-open={open || undefined}
      data-expand-key={key}
      style={style}
      onKeyDown={event => {
        if (open && event.key === 'Escape') {
          event.stopPropagation();
          setOpen(false);
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="bl-xcard__trigger"
        aria-expanded={open}
        aria-controls={`${uid}-body`}
        onClick={() => !open && setOpen(true)}
      >
        {media && (
          <div className="bl-xcard__media" aria-hidden="true">
            {media}
          </div>
        )}
        <div className="bl-xcard__head">
          {eyebrow && <p className="bl-xcard__eyebrow">{eyebrow}</p>}
          <h3 className="bl-xcard__title">{title}</h3>
          {summary && <p className="bl-xcard__summary">{summary}</p>}
        </div>
      </button>
      {open && (
        <>
          <button type="button" className="bl-xcard__close" aria-label="Close article" onClick={() => setOpen(false)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M2 2l10 10M12 2 2 12" />
            </svg>
          </button>
          <div id={`${uid}-body`} className="bl-xcard__body" role="region" aria-label={typeof title === 'string' ? title : undefined}>
            {children}
          </div>
        </>
      )}
    </article>
  );
}

export interface ExpandCardGridProps {
  /** ExpandCard elements. */
  children?: ReactNode;
  /** id of the card that starts open. */
  defaultOpen?: string | null;
  onOpenChange?: (id: string | null) => void;
  /** Minimum card width before the grid wraps, in px. */
  minWidth?: number;
  gap?: number;
  radius?: number;
  mediaHeight?: number;
  openMediaHeight?: number;
  titleSize?: number;
  /** Motion length, in ms. */
  duration?: number;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export function ExpandCardGrid({
  children,
  defaultOpen = null,
  onOpenChange,
  minWidth = 240,
  gap = 16,
  radius = 16,
  mediaHeight = 150,
  openMediaHeight = 300,
  titleSize = 17,
  duration = 480,
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = 'rgba(255,255,255,0.1)',
  accentColor = '#73eff7',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: ExpandCardGridProps) {
  useStyles();
  const ref = useRef<HTMLDivElement>(null);
  const [openId, setOpenId] = useState<string | null>(defaultOpen);
  const before = useRef<Map<string | undefined, DOMRect> | null>(null);

  // FLIP, step 1: remember where every card is before the layout changes.
  const toggle = (next: string | null) => {
    const grid = ref.current;
    if (grid) before.current = new Map([...(grid.children as HTMLCollectionOf<HTMLElement>)].map(card => [card.dataset.expandKey, card.getBoundingClientRect()]));
    setOpenId(next);
    onOpenChange?.(next);
  };

  // FLIP, step 2: after the change, play each card from its old box to its new one.
  useLayoutEffect(() => {
    const grid = ref.current;
    const old = before.current;
    before.current = null;
    if (!grid || !old || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    for (const card of grid.children as HTMLCollectionOf<HTMLElement>) {
      const from = old.get(card.dataset.expandKey);
      if (!from) continue;
      const to = card.getBoundingClientRect();
      const dx = from.left - to.left;
      const dy = from.top - to.top;
      const easing = 'cubic-bezier(.2,.9,.25,1)';
      if (Math.abs(from.width - to.width) > 1 || Math.abs(from.height - to.height) > 1) {
        // The resized card animates its box (not a scale), so text never stretches.
        card.animate(
          [
            { transform: `translate(${dx}px, ${dy}px)`, width: `${from.width}px`, height: `${from.height}px` },
            { transform: 'none', width: `${to.width}px`, height: `${to.height}px` }
          ],
          { duration, easing }
        );
      } else if (dx || dy) {
        card.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration, easing });
      }
    }
    const opened = grid.querySelector('[data-open]');
    if (opened) {
      const rect = opened.getBoundingClientRect();
      if (rect.top < 0 || rect.top > window.innerHeight * 0.6) opened.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }
  }, [openId, duration]);

  return (
    <GridContext.Provider value={{ openId, toggle }}>
      <div
        ref={ref}
        className={`bl-xgrid ${className}`}
        style={{
          '--bl-min': `${minWidth}px`,
          '--bl-gap': `${gap}px`,
          '--bl-radius': `${radius}px`,
          '--bl-media': `${mediaHeight}px`,
          '--bl-media-open': `${openMediaHeight}px`,
          '--bl-title': `${titleSize}px`,
          '--bl-dur': `${duration}ms`,
          '--bl-bg': backgroundColor,
          '--bl-ink': textColor,
          '--bl-muted': mutedColor,
          '--bl-line': lineColor,
          '--bl-accent': accentColor,
          '--bl-font': fontFamily,
          ...style
        } as CSSVars}
      >
        {Children.map(children, (child, i) => (isValidElement(child) ? cloneElement(child as ReactElement<{ id?: string }>, { id: (child as ReactElement<{ id?: string }>).props.id ?? `card-${i}` }) : child))}
      </div>
    </GridContext.Provider>
  );
}

export default ExpandCardGrid;
