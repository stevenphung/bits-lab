import { useEffect, useId, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Instagram-style stories. Segmented progress bars fill as each slide plays; tap the right
// side for next and the left for back; press and hold anywhere to pause (release to carry
// on). Slides can be images, videos (they set their own length) or any content. Arrow keys,
// Space to pause, and a visible pause button. It pauses when the tab is hidden, and each
// new slide is announced.

const STYLE_ID = 'bl-story-viewer-tw';
const CSS = `
@keyframes bl-story-in { from { opacity: 0.4; transform: scale(1.02); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function StoryViewer({
  slides = [],
  author,
  avatar,
  timestamp,
  duration = 5000,
  loop = false,
  startAt = 0,
  onChange,
  onEnd,
  holdDelay = 180,
  width = 320,
  radius = 20,
  backgroundColor = '#0b0b14',
  accentColor = '#73eff7',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  label = 'Story',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [index, setIndex] = useState(startAt);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [ended, setEnded] = useState(false);
  const barsRef = useRef(null);
  const videoRef = useRef(null);
  const progress = useRef(0);
  const holdTimer = useRef(0);
  const holding = useRef(false);
  // The slide we're on, updated immediately (two quick taps must move two slides).
  const indexRef = useRef(index);
  indexRef.current = index;
  const slide = slides[index];
  const total = slides.length;

  const go = next => {
    if (next < 0) next = 0;
    if (next >= total) {
      if (loop) next = 0;
      else {
        setEnded(true);
        onEnd?.();
        return;
      }
    }
    progress.current = 0;
    indexRef.current = next;
    setEnded(false);
    setIndex(next);
    onChange?.(next);
  };

  // Drive the active bar. Videos report their own progress; others run on a clock.
  useEffect(() => {
    const bars = barsRef.current?.children;
    if (!bars) return undefined;
    [...bars].forEach((bar, i) => bar.firstElementChild?.style.setProperty('--p', i < index ? '1' : i > index ? '0' : String(progress.current)));
    if (ended) return undefined;
    const bar = bars[index]?.firstElementChild;
    const length = slide?.duration ?? duration;
    let frame = 0;
    let last = performance.now();
    const tick = now => {
      const dt = now - last;
      last = now;
      const video = videoRef.current;
      if (!paused && !held && !document.hidden) {
        progress.current = video && video.duration ? video.currentTime / video.duration : Math.min(1, progress.current + dt / length);
      }
      bar?.style.setProperty('--p', String(progress.current));
      if (progress.current >= 1) go(index + 1);
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, held, ended, duration, total]);

  // Keep a playing video in step with pause/hold.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (paused || held) video.pause();
    else video.play?.().catch(() => {});
  }, [paused, held, index]);

  // Press and hold pauses; a quick tap navigates.
  const onPointerDown = () => {
    clearTimeout(holdTimer.current);
    holding.current = false;
    holdTimer.current = setTimeout(() => {
      holding.current = true;
      setHeld(true);
    }, holdDelay);
  };
  const onPointerUp = direction => {
    clearTimeout(holdTimer.current);
    if (holding.current) {
      holding.current = false;
      setHeld(false);
      return;
    }
    go(indexRef.current + direction);
  };

  const onKeyDown = event => {
    if (event.key === 'ArrowRight') go(indexRef.current + 1);
    else if (event.key === 'ArrowLeft') go(indexRef.current - 1);
    else if (event.key === ' ') setPaused(p => !p);
    else return;
    event.preventDefault();
  };

  useEffect(() => () => clearTimeout(holdTimer.current), []);

  const media = slide?.src ? (
    slide.type === 'video' || /\.(mp4|webm|mov)$/i.test(slide.src) ? (
      <video ref={videoRef} src={slide.src} muted playsInline autoPlay aria-label={slide.alt ?? ''} />
    ) : (
      <img src={slide.src} alt={slide.alt ?? ''} draggable={false} style={slide.style} />
    )
  ) : (
    slide?.content
  );

  return (
    <section
      className={`group/story relative aspect-[9/16] w-(--bl-w) max-w-full touch-manipulation overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) font-(family-name:--bl-font) text-white outline-none select-none focus-visible:shadow-[0_0_0_3px_var(--bl-accent)] ${className}`}
      aria-roledescription="story"
      aria-label={author ? `${label} by ${author}` : label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      data-held={held || undefined}
      style={{ '--bl-w': `${width}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      <div key={index} className="absolute inset-0 grid animate-[bl-story-in_260ms_ease_both] place-items-center [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>video]:h-full [&>video]:w-full [&>video]:object-cover motion-reduce:animate-none">
        {media}
      </div>
      <div className="pointer-events-none absolute inset-[0_0_auto] h-[120px] bg-[linear-gradient(rgba(0,0,0,0.55),transparent)]" aria-hidden="true" />
      <div ref={barsRef} className="absolute top-2.5 right-2.5 left-2.5 z-2 flex gap-1 group-data-[held]/story:opacity-0 group-data-[held]/story:transition-opacity group-data-[held]/story:duration-200 group-data-[held]/story:ease-[ease]" aria-hidden="true">
        {slides.map((_, i) => (
          <span key={i} className="h-[3px] flex-1 overflow-hidden rounded-[3px] bg-[rgba(255,255,255,0.35)] [&_i]:block [&_i]:h-full [&_i]:w-full [&_i]:origin-left [&_i]:bg-white [&_i]:[transform:scaleX(var(--p,0))]">
            <i />
          </span>
        ))}
      </div>
      <div className="absolute inset-0 z-1 grid grid-cols-[1fr_2fr] *:cursor-pointer" aria-hidden="true">
        <span onPointerDown={onPointerDown} onPointerUp={() => onPointerUp(-1)} onPointerLeave={() => holding.current && onPointerUp(0)} />
        <span onPointerDown={onPointerDown} onPointerUp={() => onPointerUp(1)} onPointerLeave={() => holding.current && onPointerUp(0)} />
      </div>
      <div className="absolute top-[22px] right-3 left-3 z-2 flex items-center gap-2.5 text-[14px] font-semibold [text-shadow:0_1px_3px_rgba(0,0,0,0.5)] group-data-[held]/story:opacity-0 group-data-[held]/story:transition-opacity group-data-[held]/story:duration-200 group-data-[held]/story:ease-[ease]">
        {avatar && (
          <span className="grid size-8 place-items-center overflow-hidden rounded-[50%] shadow-[0_0_0_2px_#fff] [&_img]:h-full [&_img]:w-full [&_img]:object-cover" aria-hidden="true">
            {typeof avatar === 'string' ? <img src={avatar} alt="" /> : avatar}
          </span>
        )}
        {author && <span>{author}</span>}
        {timestamp && <span className="font-normal text-[rgba(255,255,255,0.75)]">{timestamp}</span>}
        <button type="button" className="ml-auto grid size-8 cursor-pointer place-items-center rounded-[50%] border-0 bg-[rgba(0,0,0,0.25)] p-0 text-white focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-solid" aria-label={paused ? 'Play story' : 'Pause story'} onClick={() => setPaused(p => !p)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            {paused ? <path d="M3 1.5v9l7.5-4.5z" /> : <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" />}
          </svg>
        </button>
      </div>
      {slide?.caption && <div className="pointer-events-none absolute inset-x-0 bottom-0 z-2 bg-[linear-gradient(transparent,rgba(0,0,0,0.65))] px-4 pt-10 pb-[18px] text-[15px] leading-[1.45] [text-shadow:0_1px_3px_rgba(0,0,0,0.5)] group-data-[held]/story:opacity-0 group-data-[held]/story:transition-opacity group-data-[held]/story:duration-200 group-data-[held]/story:ease-[ease]">{slide.caption}</div>}
      <p className="sr-only" aria-live="polite" id={`${uid}-status`}>
        {ended ? 'End of story.' : `Slide ${index + 1} of ${total}${slide?.alt ? `: ${slide.alt}` : ''}${slide?.caption && typeof slide.caption === 'string' ? `. ${slide.caption}` : ''}`}
      </p>
    </section>
  );
}
