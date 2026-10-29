import { useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type KeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Feature tour: a vertical tab list whose active tab fills a progress bar, then hands off to
// the next one, while the media panel crossfades. Pauses on hover, focus or the pause button;
// arrow keys move between tabs. Stacks into one column in narrow containers.

const STYLE_ID = 'bl-feature-tabs';
const CSS = `
/* theme tokens */
.bl-ft { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-hover: rgba(255,255,255,0.04); --bl-active: rgba(255,255,255,0.07); --bl-track: rgba(255,255,255,0.12); --bl-stage: #1a1c2c; --bl-line: rgba(255,255,255,0.08); }
:where(.light, [data-theme="light"]) .bl-ft, .bl-ft:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-hover: rgba(26,28,44,0.04); --bl-active: rgba(26,28,44,0.07); --bl-track: rgba(26,28,44,0.12); --bl-stage: #f4f1e8; --bl-line: rgba(26,28,44,0.08); }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-ft, :where(.light, [data-theme="light"]) .bl-ft:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-hover: rgba(255,255,255,0.04); --bl-active: rgba(255,255,255,0.07); --bl-track: rgba(255,255,255,0.12); --bl-stage: #1a1c2c; --bl-line: rgba(255,255,255,0.08); }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-ft, .bl-ft:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-hover: rgba(26,28,44,0.04); --bl-active: rgba(26,28,44,0.07); --bl-track: rgba(26,28,44,0.12); --bl-stage: #f4f1e8; --bl-line: rgba(26,28,44,0.08); } }
/* theme tokens end */
.bl-ft-wrap { container-type: inline-size; width: 100%; }
.bl-ft { display: grid; grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: var(--bl-gap); align-items: center; color: var(--bl-ink); font-family: var(--bl-font); }
.bl-ft__list { display: flex; flex-direction: column; gap: 6px; }
.bl-ft__tab { position: relative; display: block; width: 100%; padding: 16px 18px 18px; border: 0; border-radius: var(--bl-radius); background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; overflow: hidden; transition: background-color 200ms; }
.bl-ft__tab:hover { background: var(--bl-hover); }
.bl-ft__tab[aria-selected="true"] { background: var(--bl-active); }
.bl-ft__tab:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-ft__title { display: block; font-weight: 700; font-size: var(--bl-title-size); line-height: 1.25; opacity: 0.6; transition: opacity 200ms; }
.bl-ft__tab[aria-selected="true"] .bl-ft__title { opacity: 1; }
.bl-ft__desc { display: grid; grid-template-rows: 0fr; color: var(--bl-muted); font-size: 14px; line-height: 1.5; transition: grid-template-rows 320ms cubic-bezier(.2,.8,.2,1); }
.bl-ft__desc > span { overflow: hidden; }
.bl-ft__tab[aria-selected="true"] .bl-ft__desc { grid-template-rows: 1fr; }
.bl-ft__desc > span > span { display: block; padding-top: 6px; }
.bl-ft__track { position: absolute; left: 18px; right: 18px; bottom: 8px; height: 3px; border-radius: 2px; background: var(--bl-track); overflow: hidden; opacity: 0; }
.bl-ft__tab[aria-selected="true"] .bl-ft__track { opacity: 1; }
.bl-ft__fill { width: 100%; height: 100%; background: var(--bl-accent); transform-origin: left; transform: scaleX(0); }
.bl-ft__fill[data-run] { animation: bl-ft-fill var(--bl-interval) linear forwards; }
.bl-ft[data-paused] .bl-ft__fill[data-run] { animation-play-state: paused; }
@keyframes bl-ft-fill { to { transform: scaleX(1); } }
.bl-ft__stage { position: relative; aspect-ratio: var(--bl-ratio); border-radius: var(--bl-radius); overflow: hidden; background: var(--bl-stage); box-shadow: inset 0 0 0 1px var(--bl-line); }
.bl-ft__panel { position: absolute; inset: 0; opacity: 0; transform: scale(1.03); transition: opacity 500ms ease, transform 700ms cubic-bezier(.2,.8,.2,1); }
.bl-ft__panel[data-active] { opacity: 1; transform: none; }
.bl-ft__panel > img, .bl-ft__panel > video { width: 100%; height: 100%; object-fit: cover; display: block; }
.bl-ft__pause { position: absolute; right: 12px; bottom: 12px; z-index: 2; display: grid; place-items: center; width: 34px; height: 34px; border: 0; border-radius: 50%; background: rgba(0,0,0,0.55); color: #fff; cursor: pointer; }
.bl-ft__pause:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
@container (max-width: 680px) {
  .bl-ft { grid-template-columns: minmax(0, 1fr); }
  .bl-ft__stage { order: -1; }
}
@media (prefers-reduced-motion: reduce) {
  .bl-ft__panel, .bl-ft__desc, .bl-ft__title { transition: none; }
  .bl-ft__panel { transform: none; }
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

const PauseIcon = ({ paused }: { paused: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
    {paused ? <path d="M3 1.5v11l9.5-5.5z" /> : <path d="M2.5 1.5h3.2v11H2.5zm5.8 0h3.2v11H8.3z" />}
  </svg>
);

export interface FeatureItem {
  id?: string | number;
  title: ReactNode;
  description?: ReactNode;
  /** Shown in the media panel while this tab is active. */
  media?: ReactNode;
}

export interface FeatureTabsProps {
  items?: FeatureItem[];
  /** Time per tab, in ms. */
  interval?: number;
  /** Advance automatically (off under reduced motion). */
  autoPlay?: boolean;
  defaultIndex?: number;
  onChange?: (index: number, item: FeatureItem) => void;
  /** Media panel aspect ratio, e.g. "4 / 3". */
  mediaAspect?: string;
  gap?: number;
  radius?: number;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  hoverColor?: string;
  activeColor?: string;
  trackColor?: string;
  stageColor?: string;
  lineColor?: string;
  titleSize?: number;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function FeatureTabs({
  items = [],
  interval = 5000,
  autoPlay = true,
  defaultIndex = 0,
  onChange,
  mediaAspect = '4 / 3',
  gap = 32,
  radius = 14,
  textColor,
  mutedColor,
  accentColor,
  hoverColor,
  activeColor,
  trackColor,
  stageColor,
  lineColor,
  titleSize = 17,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: FeatureTabsProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [index, setIndex] = useState(Math.min(defaultIndex, Math.max(0, items.length - 1)));
  const [userPaused, setUserPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const playing = autoPlay && !reduced && items.length > 1;

  const select = (next: number, focus = false) => {
    const wrapped = (next + items.length) % items.length;
    setIndex(wrapped);
    onChange?.(wrapped, items[wrapped]);
    if (focus) tabs.current[wrapped]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const moves: Record<string, number> = { ArrowDown: index + 1, ArrowRight: index + 1, ArrowUp: index - 1, ArrowLeft: index - 1, Home: 0, End: items.length - 1 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(moves[event.key], true);
  };

  const paused = userPaused || hovering;

  return (
    <div className={`bl-ft-wrap ${className}`} style={style}>
      <div
        className="bl-ft"
        data-paused={paused || undefined}
        onPointerEnter={event => event.pointerType === 'mouse' && setHovering(true)}
        onPointerLeave={() => setHovering(false)}
        style={{
          '--bl-interval': `${interval}ms`,
          '--bl-ratio': mediaAspect,
          '--bl-gap': `${gap}px`,
          '--bl-radius': `${radius}px`,
          '--bl-ink': textColor,
          '--bl-muted': mutedColor,
          '--bl-accent': accentColor,
          '--bl-hover': hoverColor,
          '--bl-active': activeColor,
          '--bl-track': trackColor,
          '--bl-stage': stageColor,
          '--bl-line': lineColor,
          '--bl-title-size': `${titleSize}px`,
          '--bl-font': fontFamily
        } as CSSVars}
      >
        <div className="bl-ft__list" role="tablist" aria-orientation="vertical" onKeyDown={onKeyDown}>
          {items.map((item, i) => (
            <button
              key={item.id ?? i}
              ref={node => {
                tabs.current[i] = node;
              }}
              id={`${uid}-tab-${i}`}
              className="bl-ft__tab"
              role="tab"
              type="button"
              aria-selected={i === index}
              aria-controls={`${uid}-panel-${i}`}
              tabIndex={i === index ? 0 : -1}
              onClick={() => select(i)}
            >
              <span className="bl-ft__title">{item.title}</span>
              {item.description && (
                <span className="bl-ft__desc">
                  <span>
                    <span>{item.description}</span>
                  </span>
                </span>
              )}
              {playing && (
                <span className="bl-ft__track" aria-hidden="true">
                  <span
                    key={`${index}-${i}`}
                    className="bl-ft__fill"
                    data-run={i === index ? '' : undefined}
                    onAnimationEnd={() => i === index && select(index + 1)}
                  />
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="bl-ft__stage">
          {items.map((item, i) => (
            <div
              key={item.id ?? i}
              id={`${uid}-panel-${i}`}
              className="bl-ft__panel"
              role="tabpanel"
              aria-labelledby={`${uid}-tab-${i}`}
              aria-hidden={i !== index}
              inert={i !== index ? true : undefined}
              data-active={i === index ? '' : undefined}
            >
              {item.media}
            </div>
          ))}
          {playing && (
            <button className="bl-ft__pause" type="button" onClick={() => setUserPaused(p => !p)} aria-label={userPaused ? 'Play feature tour' : 'Pause feature tour'}>
              <PauseIcon paused={userPaused} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
