import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type KeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Instagram-style stories. Segmented progress bars fill as each slide plays; tap the right
// side for next and the left for back; press and hold anywhere to pause (release to carry
// on). Slides can be images, videos (they set their own length) or any content. Arrow keys,
// Space to pause, and a visible pause button. It pauses when the tab is hidden, and each
// new slide is announced.

export interface StorySlide {
  /** An image or video URL. */
  src?: string;
  type?: 'image' | 'video';
  /** Any content instead of src. */
  content?: ReactNode;
  alt?: string;
  caption?: ReactNode;
  /** Overrides the default slide time (videos use their own length). */
  duration?: number;
  style?: CSSProperties;
}

export interface StoryViewerProps {
  slides?: StorySlide[];
  author?: string;
  avatar?: ReactNode;
  timestamp?: string;
  /** Default slide time in ms. */
  duration?: number;
  loop?: boolean;
  startAt?: number;
  onChange?: (index: number) => void;
  onEnd?: () => void;
  /** Press length (ms) that counts as hold-to-pause rather than a tap. */
  holdDelay?: number;
  width?: number;
  radius?: number;
  backgroundColor?: string;
  accentColor?: string;
  fontFamily?: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

const STYLE_ID = 'bl-story-viewer';
const CSS = `
.bl-story { position: relative; width: var(--bl-w); max-width: 100%; aspect-ratio: 9 / 16; overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-bg); color: #fff; font-family: var(--bl-font); user-select: none; -webkit-user-select: none; touch-action: manipulation; outline: none; }
.bl-story:focus-visible { box-shadow: 0 0 0 3px var(--bl-accent); }
.bl-story__slide { position: absolute; inset: 0; display: grid; place-items: center; animation: bl-story-in 260ms ease both; }
.bl-story__slide > img, .bl-story__slide > video { width: 100%; height: 100%; object-fit: cover; }
.bl-story__shade { position: absolute; inset: 0 0 auto; height: 120px; background: linear-gradient(rgba(0,0,0,0.55), transparent); pointer-events: none; }
.bl-story__bars { position: absolute; top: 10px; left: 10px; right: 10px; z-index: 2; display: flex; gap: 4px; }
.bl-story__bar { flex: 1; height: 3px; overflow: hidden; border-radius: 3px; background: rgba(255,255,255,0.35); }
.bl-story__bar i { display: block; height: 100%; width: 100%; background: #fff; transform-origin: left; transform: scaleX(var(--p, 0)); }
.bl-story__head { position: absolute; top: 22px; left: 12px; right: 12px; z-index: 2; display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }
.bl-story__avatar { display: grid; place-items: center; width: 32px; height: 32px; overflow: hidden; border-radius: 50%; box-shadow: 0 0 0 2px #fff; }
.bl-story__avatar img { width: 100%; height: 100%; object-fit: cover; }
.bl-story__time { color: rgba(255,255,255,0.75); font-weight: 400; }
.bl-story__pause { margin-left: auto; display: grid; place-items: center; width: 32px; height: 32px; padding: 0; border: 0; border-radius: 50%; background: rgba(0,0,0,0.25); color: #fff; cursor: pointer; }
.bl-story__pause:focus-visible { outline: 2px solid #fff; }
.bl-story__caption { position: absolute; left: 0; right: 0; bottom: 0; z-index: 2; padding: 40px 16px 18px; background: linear-gradient(transparent, rgba(0,0,0,0.65)); font-size: 15px; line-height: 1.45; text-shadow: 0 1px 3px rgba(0,0,0,0.5); pointer-events: none; }
.bl-story__zones { position: absolute; inset: 0; z-index: 1; display: grid; grid-template-columns: 1fr 2fr; }
.bl-story__zones > span { cursor: pointer; }
.bl-story[data-held] .bl-story__head, .bl-story[data-held] .bl-story__bars, .bl-story[data-held] .bl-story__caption { opacity: 0; transition: opacity 200ms; }
.bl-story__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-story-in { from { opacity: 0.4; transform: scale(1.02); } }
@media (prefers-reduced-motion: reduce) { .bl-story__slide { animation: none; } }
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
}: StoryViewerProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [index, setIndex] = useState(startAt);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const [ended, setEnded] = useState(false);
  const barsRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progress = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | number>(0);
  const holding = useRef(false);
  // The slide we're on, updated immediately (two quick taps must move two slides).
  const indexRef = useRef(index);
  indexRef.current = index;
  const slide = slides[index];
  const total = slides.length;

  const go = (next: number) => {
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
    [...bars].forEach((bar, i) => (bar.firstElementChild as HTMLElement | null)?.style.setProperty('--p', i < index ? '1' : i > index ? '0' : String(progress.current)));
    if (ended) return undefined;
    const bar = bars[index]?.firstElementChild as HTMLElement | null | undefined;
    const length = slide?.duration ?? duration;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
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
  const onPointerUp = (direction: number) => {
    clearTimeout(holdTimer.current);
    if (holding.current) {
      holding.current = false;
      setHeld(false);
      return;
    }
    go(indexRef.current + direction);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
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
      className={`bl-story ${className}`}
      aria-roledescription="story"
      aria-label={author ? `${label} by ${author}` : label}
      tabIndex={0}
      onKeyDown={onKeyDown}
      data-held={held || undefined}
      style={{ '--bl-w': `${width}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <div key={index} className="bl-story__slide">
        {media}
      </div>
      <div className="bl-story__shade" aria-hidden="true" />
      <div ref={barsRef} className="bl-story__bars" aria-hidden="true">
        {slides.map((_, i) => (
          <span key={i} className="bl-story__bar">
            <i />
          </span>
        ))}
      </div>
      <div className="bl-story__zones" aria-hidden="true">
        <span onPointerDown={onPointerDown} onPointerUp={() => onPointerUp(-1)} onPointerLeave={() => holding.current && onPointerUp(0)} />
        <span onPointerDown={onPointerDown} onPointerUp={() => onPointerUp(1)} onPointerLeave={() => holding.current && onPointerUp(0)} />
      </div>
      <div className="bl-story__head">
        {avatar && (
          <span className="bl-story__avatar" aria-hidden="true">
            {typeof avatar === 'string' ? <img src={avatar} alt="" /> : avatar}
          </span>
        )}
        {author && <span>{author}</span>}
        {timestamp && <span className="bl-story__time">{timestamp}</span>}
        <button type="button" className="bl-story__pause" aria-label={paused ? 'Play story' : 'Pause story'} onClick={() => setPaused(p => !p)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
            {paused ? <path d="M3 1.5v9l7.5-4.5z" /> : <path d="M2.5 1.5h2.5v9H2.5zM7 1.5h2.5v9H7z" />}
          </svg>
        </button>
      </div>
      {slide?.caption && <div className="bl-story__caption">{slide.caption}</div>}
      <p className="bl-story__sr" aria-live="polite" id={`${uid}-status`}>
        {ended ? 'End of story.' : `Slide ${index + 1} of ${total}${slide?.alt ? `: ${slide.alt}` : ''}${slide?.caption && typeof slide.caption === 'string' ? `. ${slide.caption}` : ''}`}
      </p>
    </section>
  );
}
