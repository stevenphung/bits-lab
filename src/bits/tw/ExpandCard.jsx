import { Children, cloneElement, createContext, isValidElement, useContext, useId, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Cards that open in place. Put <ExpandCard>s in an <ExpandCardGrid>: opening one widens it
// to the full row and reveals the article inside, while every other card glides to its new
// spot (FLIP). Unlike a modal, the article stays in the page flow, so it scrolls, links and
// prints like normal content. Esc or the close button folds it back.

const STYLE_ID = 'bl-expand-card-tw';
const CSS = `
@keyframes bl-xcard-in { from { opacity: 0; transform: translateY(10px); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const GridContext = createContext(null);

export function ExpandCard({ id, media, eyebrow, title, summary, children, open: controlledOpen, onOpenChange, className = '', style }) {
  const grid = useContext(GridContext);
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const key = id ?? uid;
  const [innerOpen, setInnerOpen] = useState(false);
  const open = grid ? grid.openId === key : controlledOpen ?? innerOpen;
  const triggerRef = useRef(null);

  const setOpen = next => {
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
      className={`group/xcard relative flex min-w-0 flex-col overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) shadow-[inset_0_0_0_1px_var(--bl-line)] data-[open]:col-[1/-1] data-[open]:shadow-[inset_0_0_0_1px_var(--bl-line),0_24px_50px_-30px_rgba(0,0,0,0.7)] ${className}`}
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
        className="block w-full cursor-pointer border-0 bg-none p-0 text-left text-inherit focus-visible:rounded-(--bl-radius) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--bl-accent) group-data-[open]/xcard:cursor-default"
        aria-expanded={open}
        aria-controls={`${uid}-body`}
        onClick={() => !open && setOpen(true)}
      >
        {media && (
          <div className="h-(--bl-media) overflow-hidden [transition:height_var(--bl-dur)_cubic-bezier(.2,.9,.25,1)] group-data-[open]/xcard:h-(--bl-media-open) [&>img]:block [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>video]:block [&>video]:h-full [&>video]:w-full [&>video]:object-cover motion-reduce:[transition:none]" aria-hidden="true">
            {media}
          </div>
        )}
        <div className="px-[18px] pt-4 pb-[18px]">
          {eyebrow && <p className="m-0 mb-1.5 text-[12px] tracking-[0.06em] text-(--bl-accent) uppercase">{eyebrow}</p>}
          <h3 className="m-0 text-(length:--bl-title) leading-[1.25] font-bold [transition:font-size_var(--bl-dur)_cubic-bezier(.2,.9,.25,1)] group-data-[open]/xcard:[font-size:calc(var(--bl-title)*1.45)] motion-reduce:[transition:none]">{title}</h3>
          {summary && <p className="mt-2 mb-0 text-[14px] leading-[1.55] text-(--bl-muted)">{summary}</p>}
        </div>
      </button>
      {open && (
        <>
          <button type="button" className="absolute top-3 right-3 z-2 grid size-[34px] animate-[bl-xcard-in_300ms_ease_both] cursor-pointer place-items-center rounded-[50%] border-0 bg-[rgba(0,0,0,0.55)] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) motion-reduce:animate-none" aria-label="Close article" onClick={() => setOpen(false)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M2 2l10 10M12 2 2 12" />
            </svg>
          </button>
          <div id={`${uid}-body`} className="animate-[bl-xcard-in_calc(var(--bl-dur)*1.2)_cubic-bezier(.2,.9,.25,1)_both] px-[18px] pt-0 pb-[22px] leading-[1.7] text-(--bl-ink) [animation-delay:calc(var(--bl-dur)*0.35)] *:first:mt-0 motion-reduce:animate-none" role="region" aria-label={typeof title === 'string' ? title : undefined}>
            {children}
          </div>
        </>
      )}
    </article>
  );
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
}) {
  useStyles();
  const ref = useRef(null);
  const [openId, setOpenId] = useState(defaultOpen);
  const before = useRef(null);

  // FLIP, step 1: remember where every card is before the layout changes.
  const toggle = next => {
    const grid = ref.current;
    if (grid) before.current = new Map([...grid.children].map(card => [card.dataset.expandKey, card.getBoundingClientRect()]));
    setOpenId(next);
    onOpenChange?.(next);
  };

  // FLIP, step 2: after the change, play each card from its old box to its new one.
  useLayoutEffect(() => {
    const grid = ref.current;
    const old = before.current;
    before.current = null;
    if (!grid || !old || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    for (const card of grid.children) {
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
        className={`grid grid-cols-[repeat(auto-fill,minmax(min(var(--bl-min),100%),1fr))] gap-(--bl-gap) font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
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
        }}
      >
        {Children.map(children, (child, i) => (isValidElement(child) ? cloneElement(child, { id: child.props.id ?? `card-${i}` }) : child))}
      </div>
    </GridContext.Provider>
  );
}

export default ExpandCardGrid;
