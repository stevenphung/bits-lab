import { useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Video thumbnail with a pulsing play button that leans toward the cursor. Pressing it grows
// the thumbnail into a centred lightbox player (it animates from the thumbnail's exact box)
// that starts playing; Esc, the backdrop or the close button shrink it back. Works with a
// video file (`src`) or an embed URL (`embedUrl`, e.g. a video platform's player).

const STYLE_ID = 'bl-video-hero-tw';
const CSS = `
@keyframes bl-vhero-ring { from { transform: scale(1); opacity: 0.8; } to { transform: scale(1.9); opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export default function VideoHero({
  src,
  embedUrl,
  poster,
  children,
  title,
  meta,
  label,
  aspectRatio = '16 / 9',
  width = 720,
  radius = 16,
  buttonSize = 72,
  magnetic = true,
  duration = 520,
  accentColor = '#f4f4f4',
  accentTextColor = '#1a1c2c',
  backdropColor = 'rgba(6,6,12,0.82)',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  onOpenChange,
  className = '',
  style
}) {
  useStyles();
  const triggerRef = useRef(null);
  const boxRef = useRef(null);
  const backdropRef = useRef(null);
  const closeRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closing = useRef(false);

  const change = next => {
    setOpen(next);
    onOpenChange?.(next);
  };

  const target = () => {
    const [w, h] = aspectRatio.split('/').map(Number);
    const ratio = w / h || 16 / 9;
    const maxW = Math.min(window.innerWidth - 32, 1100);
    const maxH = window.innerHeight - 96;
    const width = Math.min(maxW, maxH * ratio);
    const height = width / ratio;
    return { left: (window.innerWidth - width) / 2, top: (window.innerHeight - height) / 2, width, height };
  };
  const box = r => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useLayoutEffect(() => {
    if (!mounted || !open) return undefined;
    const node = boxRef.current;
    const from = triggerRef.current.getBoundingClientRect();
    const to = target();
    Object.assign(node.style, box(to));
    if (!reduced()) node.animate([box(from), box(to)], { duration, easing: 'cubic-bezier(.2,.9,.25,1)' });
    backdropRef.current.animate({ opacity: [0, 1] }, { duration: duration * 0.6, fill: 'both' });
    // Start playback; if the browser refuses sound without a gesture, fall back to muted.
    const video = node.querySelector('video');
    video?.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });
    closeRef.current?.focus({ preventScroll: true });
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onResize = () => Object.assign(node.style, box(target()));
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('resize', onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, open]);

  useEffect(() => {
    if (open || !mounted || closing.current) return;
    closing.current = true;
    const node = boxRef.current;
    const finish = () => {
      closing.current = false;
      setMounted(false);
      triggerRef.current?.focus({ preventScroll: true });
    };
    node.querySelector('video')?.pause();
    backdropRef.current.animate({ opacity: [1, 0] }, { duration: duration * 0.6, fill: 'forwards' });
    if (reduced()) return finish();
    const from = node.getBoundingClientRect();
    node.animate([box(from), box(triggerRef.current.getBoundingClientRect())], { duration: duration * 0.85, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = finish;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  // Lean the play button toward the pointer.
  const onPointerMove = event => {
    if (!magnetic || reduced()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.setProperty('--bl-px', `${x * 40}px`);
    event.currentTarget.style.setProperty('--bl-py', `${y * 30}px`);
  };
  const onPointerLeave = event => {
    event.currentTarget.style.removeProperty('--bl-px');
    event.currentTarget.style.removeProperty('--bl-py');
  };

  const vars = {
    '--bl-w': `${width}px`,
    '--bl-ratio': aspectRatio,
    '--bl-radius': `${radius}px`,
    '--bl-btn': `${buttonSize}px`,
    '--bl-accent': accentColor,
    '--bl-accent-ink': accentTextColor,
    '--bl-backdrop': backdropColor,
    '--bl-font': fontFamily
  };
  const name = label ?? (typeof title === 'string' ? `Play video: ${title}` : 'Play video');

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`group/vh relative block aspect-(--bl-ratio) w-full max-w-(--bl-w) cursor-pointer overflow-hidden rounded-(--bl-radius) border-0 bg-black p-0 font-(family-name:--bl-font) text-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-(--bl-accent) ${className}`}
        aria-label={name}
        aria-haspopup="dialog"
        onClick={() => change(true)}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{ ...vars, ...style }}
      >
        <span className="absolute inset-0 [transition:transform_600ms_cubic-bezier(.2,.9,.25,1),filter_300ms] group-hover/vh:[filter:brightness(0.8)] group-hover/vh:[transform:scale(1.04)] [&>img]:block [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>video]:block [&>video]:h-full [&>video]:w-full [&>video]:object-cover motion-reduce:[transition:none]" aria-hidden="true">
          {children ?? (poster ? <img src={poster} alt="" /> : null)}
        </span>
        {(title || meta) && <span className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.55),transparent_55%)]" aria-hidden="true" />}
        <span className="absolute top-1/2 left-1/2 grid size-(--bl-btn) place-items-center rounded-[50%] bg-(--bl-accent) text-(--bl-accent-ink) shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)] [transform:translate(calc(-50%_+_var(--bl-px,0px)),calc(-50%_+_var(--bl-py,0px)))_scale(var(--bl-ps,1))] [transition:transform_300ms_cubic-bezier(.2,.9,.25,1.3)] group-hover/vh:[--bl-ps:1.1] before:absolute before:inset-0 before:animate-[bl-vhero-ring_2.4s_cubic-bezier(.2,.6,.3,1)_infinite] before:rounded-[50%] before:border-2 before:border-solid before:border-(--bl-accent) motion-reduce:before:animate-none motion-reduce:before:opacity-0 after:absolute after:inset-0 after:animate-[bl-vhero-ring_2.4s_cubic-bezier(.2,.6,.3,1)_infinite] after:rounded-[50%] after:border-2 after:border-solid after:border-(--bl-accent) motion-reduce:after:animate-none motion-reduce:after:opacity-0 after:[animation-delay:1.2s] motion-reduce:[transition:none]" aria-hidden="true">
          <svg width={buttonSize * 0.34} height={buttonSize * 0.34} viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 4.5v15l13-7.5z" />
          </svg>
        </span>
        {(title || meta) && (
          <span className="absolute right-[18px] bottom-4 left-[18px] text-left" aria-hidden="true">
            {title && <span className="block text-[18px] font-bold">{title}</span>}
            {meta && <span className="mt-[3px] block text-[13px] text-[rgba(255,255,255,0.75)]">{meta}</span>}
          </span>
        )}
      </button>
      {mounted &&
        createPortal(
          <div style={vars}>
            <div ref={backdropRef} className="fixed inset-0 z-1400 bg-(--bl-backdrop)" onClick={() => change(false)} />
            <div
              ref={boxRef}
              className="fixed z-1401 overflow-hidden rounded-(--bl-radius) bg-black shadow-[0_40px_100px_-30px_rgba(0,0,0,0.9)] outline-none [&>video]:block [&>video]:h-full [&>video]:w-full [&>video]:border-0 [&>iframe]:block [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-0"
              role="dialog"
              aria-modal="true"
              aria-label={typeof title === 'string' ? title : 'Video'}
              tabIndex={-1}
              onKeyDown={event => {
                if (event.key === 'Escape') {
                  event.stopPropagation();
                  change(false);
                }
                // Keep Tab inside the dialog: the close button and the player.
                if (event.key === 'Tab') {
                  const items = [closeRef.current, boxRef.current.querySelector('video, iframe')].filter(Boolean);
                  const index = items.indexOf(document.activeElement);
                  event.preventDefault();
                  items[(index + (event.shiftKey ? -1 : 1) + items.length) % items.length]?.focus();
                }
              }}
            >
              <button ref={closeRef} type="button" className="fixed top-4 right-4 z-1402 grid size-[42px] cursor-pointer place-items-center rounded-[50%] border-0 bg-[rgba(255,255,255,0.14)] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent)" aria-label="Close video" onClick={() => change(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M3 3l10 10M13 3 3 13" />
                </svg>
              </button>
              {embedUrl ? (
                <iframe src={embedUrl} title={typeof title === 'string' ? title : 'Video'} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen />
              ) : (
                <video src={src} poster={poster} controls autoPlay playsInline />
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
