import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

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

const STYLE_ID = 'bl-changelog';
const CSS = `
.bl-log { position: relative; container-type: inline-size; width: 100%; max-width: var(--bl-w); margin: 0 auto; color: var(--bl-ink); font-family: var(--bl-font); }
.bl-log__list { position: relative; margin: 0; padding: 0; list-style: none; }
.bl-log__line { position: absolute; top: 6px; bottom: 6px; left: var(--bl-x); width: 2px; margin-left: -1px; background: var(--bl-track); }
.bl-log__beam { position: absolute; inset: 0 0 auto 0; height: calc(var(--bl-p, 0) * 100%); background: linear-gradient(transparent, var(--bl-accent) 40px); box-shadow: 0 0 12px var(--bl-accent); }
.bl-log__entry { position: relative; display: grid; grid-template-columns: calc(var(--bl-x) - 28px) 56px minmax(0, 1fr); padding-bottom: 48px; }
.bl-log__entry:last-child { padding-bottom: 0; }
.bl-log__date { position: sticky; top: var(--bl-sticky); align-self: start; padding-top: 2px; color: var(--bl-muted); font-size: 13px; text-align: right; }
.bl-log__dot { position: sticky; top: calc(var(--bl-sticky) + 4px); align-self: start; justify-self: center; width: 12px; height: 12px; border-radius: 50%; background: var(--bl-bg); box-shadow: 0 0 0 2px var(--bl-track); transition: background-color 200ms, box-shadow 200ms; }
.bl-log__entry[data-reached] .bl-log__dot { background: var(--bl-accent); box-shadow: 0 0 0 2px var(--bl-accent), 0 0 0 6px color-mix(in srgb, var(--bl-accent) 25%, transparent); }
.bl-log__body { min-width: 0; opacity: 0.25; transform: translateY(16px); transition: opacity 500ms cubic-bezier(.2,.9,.25,1), transform 500ms cubic-bezier(.2,.9,.25,1); }
.bl-log__entry[data-reached] .bl-log__body { opacity: 1; transform: none; }
.bl-log__head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 8px; }
.bl-log__title { margin: 0; font-size: 18px; font-weight: 700; line-height: 1.3; }
.bl-log__tag { padding: 2px 8px; border-radius: 999px; background: color-mix(in srgb, var(--bl-accent) 16%, transparent); color: var(--bl-accent); font-size: 12px; font-weight: 600; }
.bl-log__text { color: var(--bl-muted); font-size: 15px; line-height: 1.6; }
.bl-log__text > * { margin: 0 0 10px; }
.bl-log__text > :last-child { margin-bottom: 0; }
.bl-log__media { margin-top: 14px; overflow: hidden; border-radius: var(--bl-radius); box-shadow: 0 0 0 1px var(--bl-track); }
.bl-log__media img, .bl-log__media video { display: block; width: 100%; height: auto; }
@container (max-width: 600px) {
  .bl-log__line { left: 6px; }
  .bl-log__entry { grid-template-columns: 12px minmax(0, 1fr); column-gap: 18px; }
  .bl-log__date { position: static; grid-column: 2; grid-row: 1; margin-bottom: 4px; text-align: left; }
  .bl-log__dot { grid-column: 1; grid-row: 1 / span 2; }
  .bl-log__body { grid-column: 2; }
}
@media (prefers-reduced-motion: reduce) { .bl-log__body { transition: none; opacity: 1; transform: none; } .bl-log__dot { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
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
  useStyles();
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
      className={`bl-log ${className}`}
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
      <div ref={lineRef} className="bl-log__line" aria-hidden="true">
        <div className="bl-log__beam" />
      </div>
      <ol ref={listRef} className="bl-log__list">
        {entries.map((entry, i) => (
          <li key={entry.id ?? i} className="bl-log__entry" data-reached={i < reached || undefined} aria-labelledby={`${uid}-${i}`}>
            <time className="bl-log__date" dateTime={entry.dateTime}>
              {entry.date}
            </time>
            <span className="bl-log__dot" aria-hidden="true" />
            <div className="bl-log__body">
              <div className="bl-log__head">
                <h3 id={`${uid}-${i}`} className="bl-log__title">
                  {entry.title}
                </h3>
                {entry.tag && <span className="bl-log__tag">{entry.tag}</span>}
              </div>
              {entry.body && <div className="bl-log__text">{typeof entry.body === 'string' ? <p>{entry.body}</p> : entry.body}</div>}
              {entry.media && (
                <div className="bl-log__media">
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
