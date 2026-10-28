import { useId, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Feature tour: a vertical tab list whose active tab fills a progress bar, then hands off to
// the next one, while the media panel crossfades. Pauses on hover, focus or the pause button;
// arrow keys move between tabs. Stacks into one column in narrow containers.

const STYLE_ID = 'bl-feature-tabs-tw';
const CSS = `
@keyframes bl-ft-fill { to { transform: scaleX(1); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const PauseIcon = ({ paused }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
    {paused ? <path d="M3 1.5v11l9.5-5.5z" /> : <path d="M2.5 1.5h3.2v11H2.5zm5.8 0h3.2v11H8.3z" />}
  </svg>
);

export default function FeatureTabs({
  items = [],
  interval = 5000,
  autoPlay = true,
  defaultIndex = 0,
  onChange,
  mediaAspect = '4 / 3',
  gap = 32,
  radius = 14,
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  accentColor = '#73eff7',
  hoverColor = 'rgba(255,255,255,0.04)',
  activeColor = 'rgba(255,255,255,0.07)',
  trackColor = 'rgba(255,255,255,0.12)',
  stageColor = '#1a1c2c',
  lineColor = 'rgba(255,255,255,0.08)',
  titleSize = 17,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const tabs = useRef([]);
  const [index, setIndex] = useState(Math.min(defaultIndex, Math.max(0, items.length - 1)));
  const [userPaused, setUserPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const playing = autoPlay && !reduced && items.length > 1;

  const select = (next, focus = false) => {
    const wrapped = (next + items.length) % items.length;
    setIndex(wrapped);
    onChange?.(wrapped, items[wrapped]);
    if (focus) tabs.current[wrapped]?.focus();
  };

  const onKeyDown = event => {
    const moves = { ArrowDown: index + 1, ArrowRight: index + 1, ArrowUp: index - 1, ArrowLeft: index - 1, Home: 0, End: items.length - 1 };
    if (!(event.key in moves)) return;
    event.preventDefault();
    select(moves[event.key], true);
  };

  const paused = userPaused || hovering;

  return (
    <div className={`@container w-full ${className}`} style={style}>
      <div
        className="group/ft grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] items-center gap-(--bl-gap) font-(family-name:--bl-font) text-(--bl-ink) [@container(max-width:680px)]:grid-cols-[minmax(0,1fr)]"
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
        }}
      >
        <div className="flex flex-col gap-1.5" role="tablist" aria-orientation="vertical" onKeyDown={onKeyDown}>
          {items.map((item, i) => (
            <button
              key={item.id ?? i}
              ref={node => {
                tabs.current[i] = node;
              }}
              id={`${uid}-tab-${i}`}
              className="group/tab relative block w-full cursor-pointer overflow-hidden rounded-(--bl-radius) border-0 bg-transparent px-[18px] pt-4 pb-[18px] text-left text-inherit transition-[background-color] duration-200 ease-[ease] not-aria-selected:hover:bg-(--bl-hover) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) aria-selected:bg-(--bl-active)"
              role="tab"
              type="button"
              aria-selected={i === index}
              aria-controls={`${uid}-panel-${i}`}
              tabIndex={i === index ? 0 : -1}
              onClick={() => select(i)}
            >
              <span className="block text-(length:--bl-title-size) leading-[1.25] font-bold opacity-60 transition-opacity duration-200 ease-[ease] group-aria-selected/tab:opacity-100 motion-reduce:transition-none">{item.title}</span>
              {item.description && (
                <span className="grid grid-rows-[0fr] text-[14px] leading-[1.5] text-(--bl-muted) [transition:grid-template-rows_320ms_cubic-bezier(.2,.8,.2,1)] group-aria-selected/tab:grid-rows-[1fr] *:overflow-hidden [&>span>span]:block [&>span>span]:pt-1.5 motion-reduce:[transition:none]">
                  <span>
                    <span>{item.description}</span>
                  </span>
                </span>
              )}
              {playing && (
                <span className="absolute right-[18px] bottom-2 left-[18px] h-[3px] overflow-hidden rounded-[2px] bg-(--bl-track) opacity-0 group-aria-selected/tab:opacity-100" aria-hidden="true">
                  <span
                    key={`${index}-${i}`}
                    className="h-full w-full origin-left bg-(--bl-accent) [transform:scaleX(0)] data-[run]:animate-[bl-ft-fill_var(--bl-interval)_linear_forwards] group-data-[paused]/ft:data-[run]:[animation-play-state:paused]"
                    data-run={i === index ? '' : undefined}
                    onAnimationEnd={() => i === index && select(index + 1)}
                  />
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative aspect-(--bl-ratio) overflow-hidden rounded-(--bl-radius) bg-(--bl-stage) shadow-[inset_0_0_0_1px_var(--bl-line)] [@container(max-width:680px)]:-order-1">
          {items.map((item, i) => (
            <div
              key={item.id ?? i}
              id={`${uid}-panel-${i}`}
              className="absolute inset-0 opacity-0 [transform:scale(1.03)] [transition:opacity_500ms_ease,transform_700ms_cubic-bezier(.2,.8,.2,1)] data-[active]:opacity-100 data-[active]:[transform:none] [&>img]:block [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>video]:block [&>video]:h-full [&>video]:w-full [&>video]:object-cover motion-reduce:[transform:none] motion-reduce:[transition:none]"
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
            <button className="absolute right-3 bottom-3 z-2 grid size-[34px] cursor-pointer place-items-center rounded-[50%] border-0 bg-[rgba(0,0,0,0.55)] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent)" type="button" onClick={() => setUserPaused(p => !p)} aria-label={userPaused ? 'Play feature tour' : 'Pause feature tour'}>
              <PauseIcon paused={userPaused} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
