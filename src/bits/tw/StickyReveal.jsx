import { useEffect, useInsertionEffect, useRef, useState } from 'react';

const STYLE_ID = 'bl-sticky-reveal-tw';
const CSS = `
/* theme tokens */
.bl-sreveal { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #ffcd75; --bl-stage-bg: #1a1c2c; --bl-line: rgba(255,255,255,0.08); }
:where(.light, [data-theme="light"]) .bl-sreveal, .bl-sreveal:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #a86a12; --bl-stage-bg: #f4f1e8; --bl-line: rgba(26,28,44,0.08); }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-sreveal, :where(.light, [data-theme="light"]) .bl-sreveal:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #ffcd75; --bl-stage-bg: #1a1c2c; --bl-line: rgba(255,255,255,0.08); }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-sreveal, .bl-sreveal:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #a86a12; --bl-stage-bg: #f4f1e8; --bl-line: rgba(26,28,44,0.08); } }
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
// Scroll story with a sticky media column: as each text section passes the middle of the
// viewport, the media beside it swaps (fade, slide or zoom). Works with the window or any
// scroll box. In narrow containers each section shows its own media inline instead.

function scrollParent(node) {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) return el;
  }
  return window;
}

export default function StickyReveal({
  sections = [],
  effect = 'fade',
  mediaSide = 'right',
  sectionHeight = '80vh',
  stageHeight = '70vh',
  stickyTop = '15vh',
  activeLine = 0.5,
  onChange,
  showDots = true,
  gap = 48,
  radius = 16,
  textColor,
  mutedColor,
  accentColor,
  stageColor,
  lineColor,
  titleSize = 26,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  titleFontFamily,
  labelFontFamily,
  className = '',
  style
}) {
  useStyles();
  const rootRef = useRef(null);
  const sectionRefs = useRef([]);
  const [active, setActive] = useState(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const scroller = scrollParent(rootRef.current);
    let frame = 0;
    let current = -1;
    const update = () => {
      frame = 0;
      const viewTop = scroller === window ? 0 : scroller.getBoundingClientRect().top;
      const viewHeight = scroller === window ? window.innerHeight : scroller.clientHeight;
      const line = viewTop + viewHeight * activeLine;
      // The active section is the last one whose top has crossed the activation line.
      let next = 0;
      sectionRefs.current.forEach((node, index) => {
        if (node && node.getBoundingClientRect().top <= line) next = index;
      });
      if (next !== current) {
        current = next;
        setActive(next);
        onChangeRef.current?.(next);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [activeLine, sections.length]);

  return (
    <div className={`@container w-full ${className}`} style={style}>
      <div
        ref={rootRef}
        className="bl-sreveal group/sr grid grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-(--bl-gap) font-(family-name:--bl-font) text-(--bl-ink) [@container(max-width:640px)]:grid-cols-[minmax(0,1fr)]"
        data-effect={effect}
        data-side={mediaSide}
        style={{
          '--bl-gap': `${gap}px`,
          '--bl-section': sectionHeight,
          '--bl-stage': stageHeight,
          '--bl-top': stickyTop,
          '--bl-radius': `${radius}px`,
          '--bl-dot-radius': radius ? '50%' : '0',
          '--bl-ink': textColor,
          '--bl-muted': mutedColor,
          '--bl-accent': accentColor,
          '--bl-stage-bg': stageColor,
          '--bl-line': lineColor,
          '--bl-title-size': `${titleSize}px`,
          '--bl-font': fontFamily,
          '--bl-font-title': titleFontFamily ?? fontFamily,
          '--bl-font-label': labelFontFamily ?? fontFamily
        }}
      >
        <div className="flex flex-col">
          {sections.map((section, index) => (
            <section
              key={section.id ?? index}
              ref={node => {
                sectionRefs.current[index] = node;
              }}
              className="flex min-h-(--bl-section) flex-col justify-center py-6 opacity-35 transition-opacity duration-400 ease-[ease] data-[active]:opacity-100 [@container(max-width:640px)]:min-h-0 [@container(max-width:640px)]:pt-5 [@container(max-width:640px)]:pb-7 [@container(max-width:640px)]:opacity-100 motion-reduce:transition-none"
              data-active={index === active ? '' : undefined}
            >
              {section.media && (
                <div className="hidden [&>img]:block [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>video]:block [&>video]:h-full [&>video]:w-full [&>video]:object-cover [@container(max-width:640px)]:mb-4 [@container(max-width:640px)]:block [@container(max-width:640px)]:aspect-[4/3] [@container(max-width:640px)]:overflow-hidden [@container(max-width:640px)]:rounded-(--bl-radius)" aria-hidden="true">
                  {section.media}
                </div>
              )}
              <div className="mb-2.5 font-(family-name:--bl-font-label) text-[12px] tracking-[0.12em] text-(--bl-accent)">
                {String(index + 1).padStart(2, '0')} / {String(sections.length).padStart(2, '0')}
              </div>
              {section.title && <h3 className="m-0 mb-3 font-(family-name:--bl-font-title) text-(length:--bl-title-size) leading-[1.25] font-bold">{section.title}</h3>}
              {typeof section.body === 'string' ? <p className="m-0 leading-[1.6] text-(--bl-muted)">{section.body}</p> : section.body}
            </section>
          ))}
        </div>
        <div className="relative group-data-[side=left]/sr:-order-1 [@container(max-width:640px)]:hidden" aria-hidden="true">
          <div className="sticky top-(--bl-top) h-(--bl-stage)">
            <div className="relative h-full overflow-hidden rounded-(--bl-radius) bg-(--bl-stage-bg) shadow-[inset_0_0_0_1px_var(--bl-line)]">
              {sections.map((section, index) => (
                <div
                  key={section.id ?? index}
                  className="absolute inset-0 opacity-0 [transition:opacity_600ms_ease,transform_800ms_cubic-bezier(.2,.8,.2,1),clip-path_700ms_cubic-bezier(.7,0,.2,1)] data-[active]:opacity-100 data-[active]:[transform:none] [&>img]:block [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>video]:block [&>video]:h-full [&>video]:w-full [&>video]:object-cover group-data-[effect=zoom]/sr:[transform:scale(1.12)] group-data-[effect=zoom]/sr:data-[active]:[transform:scale(1.12)] group-data-[effect=slide]/sr:opacity-100 group-data-[effect=slide]/sr:[clip-path:inset(100%_0_0_0)] group-data-[effect=slide]/sr:data-[before]:[clip-path:inset(0_0_0_0)] group-data-[effect=slide]/sr:data-[active]:z-1 group-data-[effect=slide]/sr:data-[active]:[clip-path:inset(0_0_0_0)] motion-reduce:[transition:none] motion-reduce:group-data-[effect]/sr:[clip-path:none]! motion-reduce:group-data-[effect]/sr:[transform:none]! motion-reduce:group-data-[effect]/sr:not-data-[active]:opacity-0!"
                  data-active={index === active ? '' : undefined}
                  data-before={index < active ? '' : undefined}
                >
                  {section.media}
                </div>
              ))}
              {showDots && sections.length > 1 && (
                <div className="absolute top-1/2 right-3.5 z-2 grid gap-2 [transform:translateY(-50%)]">
                  {sections.map((section, index) => (
                    <span key={section.id ?? index} className="size-2 rounded-(--bl-dot-radius) bg-[rgba(255,255,255,0.35)] [transition:background-color_200ms,transform_200ms] data-[active]:bg-(--bl-accent) data-[active]:[transform:scale(1.4)]" data-active={index === active ? '' : undefined} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
