import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A changelog as a vertical timeline. A beam fills down the line as you scroll, each entry's
// dot lights up and the entry slides in when the beam reaches it, and dates stick beside
// their entry while you read it. Entries can carry a version tag, rich body and media.
// Under ~600px the date moves above the entry. Works inside any scroller.

export interface ChangelogEntry {
  id?: string;
  date: ReactNode;
  /** Machine-readable date for the <time> element. */
  dateTime?: string;
  title: ReactNode;
  /** A version or label pill. */
  tag?: ReactNode;
  body?: ReactNode;
  /** An image URL, or any node (video, embed). */
  media?: ReactNode;
  mediaAlt?: string;
}

export interface ChangelogTimelineProps {
  entries?: ChangelogEntry[];
  /** The scroller to measure against, when it is not the page. */
  scrollRoot?: RefObject<HTMLElement | null>;
  /** Where the beam tip sits, as a share of the viewport height. */
  anchor?: number;
  dateColumn?: number;
  stickyTop?: number;
  width?: number;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  trackColor?: string;
  accentColor?: string;
  mediaRadius?: number;
  fontFamily?: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export default function ChangelogTimeline({
  entries = [],
  scrollRoot,
  anchor = 0.6,
  dateColumn = 140,
  stickyTop = 24,
  width = 760,
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  trackColor = '#333c57',
  accentColor = '#73eff7',
  mediaRadius = 12,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  label = 'Changelog',
  className = '',
  style
}: ChangelogTimelineProps) {
  
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const listRef = useRef<HTMLOListElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [reached, setReached] = useState(0);

  useEffect(() => {
    const list = listRef.current!;
    const line = lineRef.current!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    // The beam's tip sits at `anchor` down the viewport (or the scroll root, if given).
    const update = () => {
      frame = 0;
      const view = scrollRoot?.current?.getBoundingClientRect() ?? { top: 0, height: window.innerHeight };
      const tip = view.top + view.height * anchor;
      const box = line.getBoundingClientRect();
      const progress = reduced ? 1 : Math.max(0, Math.min(1, (tip - box.top) / Math.max(1, box.height)));
      line.style.setProperty('--bl-p', String(progress));
      const items = list.querySelectorAll(':scope > .bl-log__entry');
      let count = 0;
      items.forEach(item => {
        if (reduced || item.getBoundingClientRect().top + 8 <= tip) count++;
      });
      setReached(count);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    // Capture scrolls from any scroller, so it works inside panels and the page alike.
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule);
    const resize = new ResizeObserver(schedule);
    resize.observe(list);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, { capture: true });
      window.removeEventListener('resize', schedule);
      resize.disconnect();
    };
  }, [scrollRoot, anchor, entries.length]);

  return (
    <section
      className={`@container relative mx-auto w-full max-w-(--bl-w) font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      aria-label={label}
      style={{
        '--bl-w': `${width}px`,
        '--bl-x': `${dateColumn + 28}px`,
        '--bl-sticky': `${stickyTop}px`,
        '--bl-bg': backgroundColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-track': trackColor,
        '--bl-accent': accentColor,
        '--bl-radius': `${mediaRadius}px`,
        '--bl-font': fontFamily,
        ...style
      } as CSSVars}
    >
      <div ref={lineRef} className="absolute top-1.5 bottom-1.5 left-(--bl-x) -ml-px w-0.5 bg-(--bl-track) [@container(max-width:600px)]:left-1.5" aria-hidden="true">
        <div className="absolute inset-[0_0_auto_0] h-[calc(var(--bl-p,0)*100%)] bg-[linear-gradient(transparent,var(--bl-accent)_40px)] shadow-[0_0_12px_var(--bl-accent)]" />
      </div>
      <ol ref={listRef} className="relative m-0 list-none p-0">
        {entries.map((entry, i) => (
          <li key={entry.id ?? i} className="bl-log__entry group/entry relative grid grid-cols-[calc(var(--bl-x)_-_28px)_56px_minmax(0,1fr)] pb-12 last:pb-0 [@container(max-width:600px)]:grid-cols-[12px_minmax(0,1fr)] [@container(max-width:600px)]:gap-x-[18px]" data-reached={i < reached || undefined} aria-labelledby={`${uid}-${i}`}>
            <time className="sticky top-(--bl-sticky) [align-self:start] pt-0.5 text-right text-[13px] text-(--bl-muted) [@container(max-width:600px)]:static [@container(max-width:600px)]:col-start-2 [@container(max-width:600px)]:row-start-1 [@container(max-width:600px)]:mb-1 [@container(max-width:600px)]:text-left" dateTime={entry.dateTime}>
              {entry.date}
            </time>
            <span className="sticky top-[calc(var(--bl-sticky)_+_4px)] size-3 [align-self:start] justify-self-center rounded-[50%] bg-(--bl-bg) shadow-[0_0_0_2px_var(--bl-track)] [transition:background-color_200ms,box-shadow_200ms] group-data-[reached]/entry:bg-(--bl-accent) group-data-[reached]/entry:shadow-[0_0_0_2px_var(--bl-accent),0_0_0_6px_color-mix(in_srgb,var(--bl-accent)_25%,transparent)] [@container(max-width:600px)]:col-start-1 [@container(max-width:600px)]:row-[1/span_2] motion-reduce:[transition:none]" aria-hidden="true" />
            <div className="min-w-0 opacity-25 [transform:translateY(16px)] [transition:opacity_500ms_cubic-bezier(.2,.9,.25,1),transform_500ms_cubic-bezier(.2,.9,.25,1)] group-data-[reached]/entry:opacity-100 group-data-[reached]/entry:[transform:none] [@container(max-width:600px)]:col-start-2 motion-reduce:opacity-100 motion-reduce:[transform:none] motion-reduce:[transition:none]">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 id={`${uid}-${i}`} className="m-0 text-[18px] leading-[1.3] font-bold">
                  {entry.title}
                </h3>
                {entry.tag && <span className="rounded-full bg-[color-mix(in_srgb,var(--bl-accent)_16%,transparent)] px-2 py-0.5 text-[12px] font-semibold text-(--bl-accent)">{entry.tag}</span>}
              </div>
              {entry.body && <div className="text-[15px] leading-[1.6] text-(--bl-muted) *:mx-0 *:mt-0 *:mb-2.5 *:last:mb-0">{typeof entry.body === 'string' ? <p>{entry.body}</p> : entry.body}</div>}
              {entry.media && (
                <div className="mt-3.5 overflow-hidden rounded-(--bl-radius) shadow-[0_0_0_1px_var(--bl-track)] [&_img]:block [&_img]:h-auto [&_img]:w-full [&_video]:block [&_video]:h-auto [&_video]:w-full">
                  {typeof entry.media === 'string' ? <img src={entry.media} alt={entry.mediaAlt ?? ''} loading="lazy" /> : entry.media}
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
