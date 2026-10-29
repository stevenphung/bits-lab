import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Scroll story with a sticky media column: as each text section passes the middle of the
// viewport, the media beside it swaps (fade, slide or zoom). Works with the window or any
// scroll box. In narrow containers each section shows its own media inline instead.

const STYLE_ID = 'bl-sticky-reveal';
const CSS = `
/* theme tokens */
.bl-sreveal { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #ffcd75; --bl-stage-bg: #1a1c2c; --bl-line: rgba(255,255,255,0.08); }
:where(.light, [data-theme="light"]) .bl-sreveal, .bl-sreveal:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #a86a12; --bl-stage-bg: #f4f1e8; --bl-line: rgba(26,28,44,0.08); }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-sreveal, :where(.light, [data-theme="light"]) .bl-sreveal:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #ffcd75; --bl-stage-bg: #1a1c2c; --bl-line: rgba(255,255,255,0.08); }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-sreveal, .bl-sreveal:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #a86a12; --bl-stage-bg: #f4f1e8; --bl-line: rgba(26,28,44,0.08); } }
/* theme tokens end */
.bl-sreveal-wrap { container-type: inline-size; width: 100%; }
.bl-sreveal { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr); gap: var(--bl-gap); color: var(--bl-ink); font-family: var(--bl-font); }
.bl-sreveal[data-side="left"] .bl-sreveal__media { order: -1; }
.bl-sreveal__text { display: flex; flex-direction: column; }
.bl-sreveal__section { min-height: var(--bl-section); display: flex; flex-direction: column; justify-content: center; padding: 24px 0; opacity: 0.35; transition: opacity 400ms; }
.bl-sreveal__section[data-active] { opacity: 1; }
.bl-sreveal__index { color: var(--bl-accent); font-size: 12px; letter-spacing: 0.12em; margin-bottom: 10px; font-family: var(--bl-font-label); }
.bl-sreveal__title { margin: 0 0 12px; font-size: var(--bl-title-size); font-weight: 700; line-height: 1.25; font-family: var(--bl-font-title); }
.bl-sreveal__body { margin: 0; color: var(--bl-muted); line-height: 1.6; }
.bl-sreveal__inline { display: none; }
.bl-sreveal__media { position: relative; }
.bl-sreveal__sticky { position: sticky; top: var(--bl-top); height: var(--bl-stage); }
.bl-sreveal__frame { position: relative; height: 100%; overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-stage-bg); box-shadow: inset 0 0 0 1px var(--bl-line); }
.bl-sreveal__slide { position: absolute; inset: 0; opacity: 0; transition: opacity 600ms ease, transform 800ms cubic-bezier(.2,.8,.2,1), clip-path 700ms cubic-bezier(.7,0,.2,1); }
.bl-sreveal__slide > img, .bl-sreveal__slide > video, .bl-sreveal__inline > img, .bl-sreveal__inline > video { display: block; width: 100%; height: 100%; object-fit: cover; }
.bl-sreveal__slide[data-active] { opacity: 1; transform: none; }
.bl-sreveal[data-effect="zoom"] .bl-sreveal__slide { transform: scale(1.12); }
.bl-sreveal[data-effect="slide"] .bl-sreveal__slide { opacity: 1; clip-path: inset(100% 0 0 0); }
.bl-sreveal[data-effect="slide"] .bl-sreveal__slide[data-before] { clip-path: inset(0 0 0 0); }
.bl-sreveal[data-effect="slide"] .bl-sreveal__slide[data-active] { clip-path: inset(0 0 0 0); z-index: 1; }
.bl-sreveal__dots { position: absolute; right: 14px; top: 50%; z-index: 2; display: grid; gap: 8px; transform: translateY(-50%); }
.bl-sreveal__dot { width: 8px; height: 8px; border-radius: var(--bl-dot-radius); background: rgba(255,255,255,0.35); transition: background-color 200ms, transform 200ms; }
.bl-sreveal__dot[data-active] { background: var(--bl-accent); transform: scale(1.4); }
@container (max-width: 640px) {
  .bl-sreveal { grid-template-columns: minmax(0, 1fr); }
  .bl-sreveal__media { display: none; }
  .bl-sreveal__section { min-height: 0; opacity: 1; padding: 20px 0 28px; }
  .bl-sreveal__inline { display: block; aspect-ratio: 4 / 3; margin-bottom: 16px; overflow: hidden; border-radius: var(--bl-radius); }
}
@media (prefers-reduced-motion: reduce) {
  .bl-sreveal__slide, .bl-sreveal__section { transition: none; }
  .bl-sreveal[data-effect] .bl-sreveal__slide { transform: none; clip-path: none; }
  .bl-sreveal[data-effect] .bl-sreveal__slide:not([data-active]) { opacity: 0; }
}
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

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
    <div className={`bl-sreveal-wrap ${className}`} style={style}>
      <div
        ref={rootRef}
        className="bl-sreveal"
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
        <div className="bl-sreveal__text">
          {sections.map((section, index) => (
            <section
              key={section.id ?? index}
              ref={node => {
                sectionRefs.current[index] = node;
              }}
              className="bl-sreveal__section"
              data-active={index === active ? '' : undefined}
            >
              {section.media && (
                <div className="bl-sreveal__inline" aria-hidden="true">
                  {section.media}
                </div>
              )}
              <div className="bl-sreveal__index">
                {String(index + 1).padStart(2, '0')} / {String(sections.length).padStart(2, '0')}
              </div>
              {section.title && <h3 className="bl-sreveal__title">{section.title}</h3>}
              {typeof section.body === 'string' ? <p className="bl-sreveal__body">{section.body}</p> : section.body}
            </section>
          ))}
        </div>
        <div className="bl-sreveal__media" aria-hidden="true">
          <div className="bl-sreveal__sticky">
            <div className="bl-sreveal__frame">
              {sections.map((section, index) => (
                <div
                  key={section.id ?? index}
                  className="bl-sreveal__slide"
                  data-active={index === active ? '' : undefined}
                  data-before={index < active ? '' : undefined}
                >
                  {section.media}
                </div>
              ))}
              {showDots && sections.length > 1 && (
                <div className="bl-sreveal__dots">
                  {sections.map((section, index) => (
                    <span key={section.id ?? index} className="bl-sreveal__dot" data-active={index === active ? '' : undefined} />
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
