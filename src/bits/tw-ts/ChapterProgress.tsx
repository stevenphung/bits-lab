import { useEffect, useId, useRef, useState, type CSSProperties, type RefObject } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A reading-progress bar for long articles. It finds the chapter headings in your article,
// marks each one as a tick on the bar, names the chapter you're in, estimates the reading
// time left, and lets you jump: click a tick, or open the chapter list (the keyboard path).
// Place it as a sticky bar above the article; it works with the page or any scroller.

export interface ChapterProgressProps {
  /** The article to track. */
  target?: RefObject<HTMLElement | null>;
  /** Which headings count as chapters. */
  selector?: string;
  /** Space a heading keeps below the top when jumped to, in px. */
  offset?: number;
  wordsPerMinute?: number;
  showTime?: boolean;
  listLabel?: string;
  label?: string;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  trackColor?: string;
  lineColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

interface Chapter {
  title: string;
  /** Position on the bar, 0–1. */
  at: number;
}

function scrollParent(node: HTMLElement | null): HTMLElement | Window {
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
}: ChapterProgressProps) {
  
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const rootRef = useRef<HTMLElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [current, setCurrent] = useState(-1);
  const [percent, setPercent] = useState(0);
  const [minutesLeft, setMinutesLeft] = useState(0);
  const [open, setOpen] = useState(false);
  const headings = useRef<HTMLElement[]>([]);
  const scrollerRef = useRef<HTMLElement | Window | null>(null);

  useEffect(() => {
    const article = target?.current;
    if (!article) return undefined;
    const scroller = scrollParent(article);
    scrollerRef.current = scroller;
    const isWindow = scroller === window;
    let frame = 0;
    let words = 0;
    let layout: { top: number; travel: number; marks: number[] } = { top: 0, travel: 1, marks: [] };

    const viewTop = () => (isWindow ? 0 : (scroller as HTMLElement).getBoundingClientRect().top);
    const viewHeight = () => (isWindow ? window.innerHeight : (scroller as HTMLElement).clientHeight);

    // Where the article and each heading sit, in scroll coordinates.
    const measure = () => {
      headings.current = [...article.querySelectorAll<HTMLElement>(selector)];
      const scrollTop = isWindow ? window.scrollY : (scroller as HTMLElement).scrollTop;
      const top = article.getBoundingClientRect().top - viewTop() + scrollTop;
      const travel = Math.max(1, article.offsetHeight - viewHeight());
      const marks = headings.current.map(h => h.getBoundingClientRect().top - viewTop() + scrollTop - offset);
      layout = { top, travel, marks };
      words = (article.innerText || '').split(/\s+/).filter(Boolean).length;
      // A tick sits where the bar will be when its chapter becomes the current one.
      setChapters(headings.current.map((h, i) => ({ title: h.textContent!.trim(), at: Math.max(0, Math.min(1, (marks[i] - top) / travel)) })));
      update();
    };

    const update = () => {
      frame = 0;
      const scrollTop = isWindow ? window.scrollY : (scroller as HTMLElement).scrollTop;
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
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        rootRef.current?.querySelector<HTMLButtonElement>('.bl-chap__toggle')?.focus();
      }
    };
    const onDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [open]);

  const jump = (index: number) => {
    const heading = headings.current[index];
    const scroller = scrollerRef.current;
    if (!heading || !scroller) return;
    const isWindow = scroller === window;
    const viewTop = isWindow ? 0 : (scroller as HTMLElement).getBoundingClientRect().top;
    const scrollTop = isWindow ? window.scrollY : (scroller as HTMLElement).scrollTop;
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
      className={`relative z-10 grid gap-2 bg-(--bl-bg) px-3.5 pt-2.5 pb-3 font-(family-name:--bl-font) text-[13px] text-(--bl-ink) shadow-[0_1px_0_var(--bl-line),0_10px_24px_-18px_rgba(0,0,0,0.8)] ${className}`}
      aria-label={label}
      style={{ '--bl-bg': backgroundColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-track': trackColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap [&_b]:font-bold [&_b]:text-(--bl-accent)" aria-live="polite">
          {chapter ? (
            <>
              <b>{current + 1}</b> · {chapter.title}
            </>
          ) : (
            'Introduction'
          )}
        </span>
        {showTime && (
          <span className="flex-none text-(--bl-muted) tabular-nums" aria-hidden="true">
            {percent >= 100 ? 'Done' : `${minutesLeft} min left`}
          </span>
        )}
        {chapters.length > 0 && (
          <button type="button" className="bl-chap__toggle inline-flex flex-none cursor-pointer items-center gap-1.5 rounded-full border-0 bg-(--bl-track) px-2.5 py-[5px] text-(--bl-ink) hover:[filter:brightness(1.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) [&_svg]:transition-transform [&_svg]:duration-200 [&_svg]:ease-[ease] aria-expanded:[&_svg]:rotate-180 motion-reduce:[&_svg]:transition-none" aria-expanded={open} aria-controls={`${uid}-menu`} onClick={() => setOpen(o => !o)}>
            {listLabel}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M2 3.5 5 6.5 8 3.5" />
            </svg>
          </button>
        )}
      </div>
      <div className="relative h-1.5 rounded-full bg-(--bl-track)" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div ref={fillRef} className="absolute inset-0 origin-left rounded-[inherit] bg-(--bl-accent) [transform:scaleX(var(--bl-p,0))]" />
        {chapters.map((c, i) => (
          <button
            key={i}
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute top-1/2 left-[calc(var(--at)*100%)] -mt-[7px] -ml-[7px] size-3.5 cursor-pointer rounded-[50%] border-0 bg-(--bl-bg) p-0 shadow-[inset_0_0_0_3px_var(--bl-track)] [transition:transform_160ms,box-shadow_160ms] after:pointer-events-none after:absolute after:top-[calc(100%_+_8px)] after:left-1/2 after:rounded-[6px] after:bg-(--bl-ink) after:px-2 after:py-[3px] after:text-[12px] after:whitespace-nowrap after:text-(--bl-bg) after:opacity-0 after:[transform:translateX(-50%)] after:transition-opacity after:duration-120 after:ease-[ease] after:content-[attr(data-title)] hover:[transform:scale(1.3)] hover:after:opacity-100 data-[current]:bg-(--bl-accent) data-[passed]:shadow-[inset_0_0_0_3px_var(--bl-accent)] motion-reduce:[transition:none]"
            style={{ '--at': c.at } as CSSVars}
            data-title={c.title}
            data-passed={i <= current || undefined}
            data-current={i === current || undefined}
            onClick={() => jump(i)}
          />
        ))}
      </div>
      {open && (
        <ol id={`${uid}-menu`} className="absolute top-[calc(100%_+_6px)] right-2.5 m-0 grid max-h-[60vh] max-w-[calc(100%_-_20px)] min-w-[220px] list-none gap-0.5 overflow-auto rounded-[10px] bg-(--bl-bg) p-1.5 shadow-[0_0_0_1px_var(--bl-line),0_20px_40px_-16px_rgba(0,0,0,0.8)]">
          {chapters.map((c, i) => (
            <li key={i}>
              <button type="button" className="flex w-full cursor-pointer gap-2.5 rounded-[6px] border-0 bg-transparent px-2.5 py-2 text-left text-(--bl-ink) hover:bg-(--bl-track) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) aria-[current=true]:text-(--bl-accent) [&_span]:text-(--bl-muted) [&_span]:tabular-nums" aria-current={i === current || undefined} onClick={() => jump(i)}>
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
