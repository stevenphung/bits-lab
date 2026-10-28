import { useEffect, useId, useInsertionEffect, useRef, useState } from 'react';

// A reading-progress bar for long articles. It finds the chapter headings in your article,
// marks each one as a tick on the bar, names the chapter you're in, estimates the reading
// time left, and lets you jump: click a tick, or open the chapter list (the keyboard path).
// Place it as a sticky bar above the article; it works with the page or any scroller.

const STYLE_ID = 'bl-chapter-progress';
const CSS = `
.bl-chap { position: relative; z-index: 10; display: grid; gap: 8px; padding: 10px 14px 12px; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); font-size: 13px; box-shadow: 0 1px 0 var(--bl-line), 0 10px 24px -18px rgba(0,0,0,0.8); }
.bl-chap__row { display: flex; align-items: center; gap: 12px; min-width: 0; }
.bl-chap__current { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.bl-chap__current b { color: var(--bl-accent); font-weight: 700; }
.bl-chap__meta { flex: 0 0 auto; color: var(--bl-muted); font-variant-numeric: tabular-nums; }
.bl-chap__toggle { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border: 0; border-radius: 999px; background: var(--bl-track); color: var(--bl-ink); font: inherit; cursor: pointer; }
.bl-chap__toggle:hover { filter: brightness(1.2); }
.bl-chap__toggle:focus-visible, .bl-chap__link:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-chap__toggle svg { transition: transform 200ms; }
.bl-chap__toggle[aria-expanded="true"] svg { transform: rotate(180deg); }
.bl-chap__bar { position: relative; height: 6px; border-radius: 999px; background: var(--bl-track); }
.bl-chap__fill { position: absolute; inset: 0; border-radius: inherit; background: var(--bl-accent); transform-origin: left; transform: scaleX(var(--bl-p, 0)); }
.bl-chap__tick { position: absolute; top: 50%; left: calc(var(--at) * 100%); width: 14px; height: 14px; margin: -7px 0 0 -7px; padding: 0; border: 0; border-radius: 50%; background: var(--bl-bg); box-shadow: inset 0 0 0 3px var(--bl-track); cursor: pointer; transition: transform 160ms, box-shadow 160ms; }
.bl-chap__tick[data-passed] { box-shadow: inset 0 0 0 3px var(--bl-accent); }
.bl-chap__tick[data-current] { background: var(--bl-accent); }
.bl-chap__tick:hover { transform: scale(1.3); }
.bl-chap__tick::after { content: attr(data-title); position: absolute; left: 50%; top: calc(100% + 8px); padding: 3px 8px; border-radius: 6px; background: var(--bl-ink); color: var(--bl-bg); font-size: 12px; white-space: nowrap; transform: translateX(-50%); opacity: 0; pointer-events: none; transition: opacity 120ms; }
.bl-chap__tick:hover::after { opacity: 1; }
.bl-chap__menu { position: absolute; top: calc(100% + 6px); right: 10px; display: grid; gap: 2px; min-width: 220px; max-width: calc(100% - 20px); max-height: 60vh; margin: 0; padding: 6px; overflow: auto; border-radius: 10px; background: var(--bl-bg); box-shadow: 0 0 0 1px var(--bl-line), 0 20px 40px -16px rgba(0,0,0,0.8); list-style: none; }
.bl-chap__link { display: flex; gap: 10px; width: 100%; padding: 8px 10px; border: 0; border-radius: 6px; background: transparent; color: var(--bl-ink); font: inherit; text-align: left; cursor: pointer; }
.bl-chap__link:hover { background: var(--bl-track); }
.bl-chap__link[aria-current="true"] { color: var(--bl-accent); }
.bl-chap__link span { color: var(--bl-muted); font-variant-numeric: tabular-nums; }
@media (prefers-reduced-motion: reduce) { .bl-chap__tick, .bl-chap__toggle svg { transition: none; } }
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

export default function ChapterProgress({
  target,
  selector = 'h2',
  offset = 72,
  wordsPerMinute = 220,
  showTime = true,
  listLabel = 'Chapters',
  label = 'Reading progress',
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  trackColor = '#333c57',
  lineColor = '#333c57',
  accentColor = '#73eff7',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const rootRef = useRef(null);
  const fillRef = useRef(null);
  const [chapters, setChapters] = useState([]);
  const [current, setCurrent] = useState(-1);
  const [percent, setPercent] = useState(0);
  const [minutesLeft, setMinutesLeft] = useState(0);
  const [open, setOpen] = useState(false);
  const headings = useRef([]);
  const scrollerRef = useRef(null);

  useEffect(() => {
    const article = target?.current;
    if (!article) return undefined;
    const scroller = scrollParent(article);
    scrollerRef.current = scroller;
    const isWindow = scroller === window;
    let frame = 0;
    let words = 0;
    let layout = { top: 0, travel: 1, marks: [] };

    const viewTop = () => (isWindow ? 0 : scroller.getBoundingClientRect().top);
    const viewHeight = () => (isWindow ? window.innerHeight : scroller.clientHeight);

    // Where the article and each heading sit, in scroll coordinates.
    const measure = () => {
      headings.current = [...article.querySelectorAll(selector)];
      const scrollTop = isWindow ? window.scrollY : scroller.scrollTop;
      const top = article.getBoundingClientRect().top - viewTop() + scrollTop;
      const travel = Math.max(1, article.offsetHeight - viewHeight());
      const marks = headings.current.map(h => h.getBoundingClientRect().top - viewTop() + scrollTop - offset);
      layout = { top, travel, marks };
      words = (article.innerText || '').split(/\s+/).filter(Boolean).length;
      // A tick sits where the bar will be when its chapter becomes the current one.
      setChapters(headings.current.map((h, i) => ({ title: h.textContent.trim(), at: Math.max(0, Math.min(1, (marks[i] - top) / travel)) })));
      update();
    };

    const update = () => {
      frame = 0;
      const scrollTop = isWindow ? window.scrollY : scroller.scrollTop;
      const p = Math.max(0, Math.min(1, (scrollTop - layout.top) / layout.travel));
      fillRef.current?.style.setProperty('--bl-p', String(p));
      let index = -1;
      layout.marks.forEach((mark, i) => {
        if (scrollTop >= mark - 2) index = i;
      });
      setCurrent(index);
      setPercent(Math.round(p * 100));
      setMinutesLeft(Math.ceil((words * (1 - p)) / wordsPerMinute));
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    let timer = 0;
    const remeasure = () => {
      clearTimeout(timer);
      timer = setTimeout(measure, 100);
    };
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', remeasure);
    const resize = new ResizeObserver(remeasure);
    resize.observe(article);
    measure();
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', remeasure);
      resize.disconnect();
    };
  }, [target, selector, offset, wordsPerMinute]);

  // Close the chapter list on Escape or a click elsewhere.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = event => {
      if (event.key === 'Escape') {
        setOpen(false);
        rootRef.current?.querySelector('.bl-chap__toggle')?.focus();
      }
    };
    const onDown = event => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const jump = index => {
    const heading = headings.current[index];
    const scroller = scrollerRef.current;
    if (!heading || !scroller) return;
    const isWindow = scroller === window;
    const viewTop = isWindow ? 0 : scroller.getBoundingClientRect().top;
    const scrollTop = isWindow ? window.scrollY : scroller.scrollTop;
    const top = heading.getBoundingClientRect().top - viewTop + scrollTop - offset + 1;
    const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    scroller.scrollTo({ top, behavior });
    // Move focus to the heading too, so keyboard and screen reader users land there.
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
    setOpen(false);
  };

  const chapter = chapters[current];

  return (
    <nav
      ref={rootRef}
      className={`bl-chap ${className}`}
      aria-label={label}
      style={{ '--bl-bg': backgroundColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-track': trackColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      <div className="bl-chap__row">
        <span className="bl-chap__current" aria-live="polite">
          {chapter ? (
            <>
              <b>{current + 1}</b> · {chapter.title}
            </>
          ) : (
            'Introduction'
          )}
        </span>
        {showTime && (
          <span className="bl-chap__meta" aria-hidden="true">
            {percent >= 100 ? 'Done' : `${minutesLeft} min left`}
          </span>
        )}
        {chapters.length > 0 && (
          <button type="button" className="bl-chap__toggle" aria-expanded={open} aria-controls={`${uid}-menu`} onClick={() => setOpen(o => !o)}>
            {listLabel}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M2 3.5 5 6.5 8 3.5" />
            </svg>
          </button>
        )}
      </div>
      <div className="bl-chap__bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div ref={fillRef} className="bl-chap__fill" />
        {chapters.map((c, i) => (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="bl-chap__tick"
            style={{ '--at': c.at }}
            data-title={c.title}
            data-passed={i <= current || undefined}
            data-current={i === current || undefined}
            onClick={() => jump(i)}
          />
        ))}
      </div>
      {open && (
        <ol id={`${uid}-menu`} className="bl-chap__menu">
          {chapters.map((c, i) => (
            <li key={i}>
              <button type="button" className="bl-chap__link" aria-current={i === current || undefined} onClick={() => jump(i)}>
                <span>{i + 1}</span>
                {c.title}
              </button>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
