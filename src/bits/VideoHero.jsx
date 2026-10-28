import { useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Video thumbnail with a pulsing play button that leans toward the cursor. Pressing it grows
// the thumbnail into a centred lightbox player (it animates from the thumbnail's exact box)
// that starts playing; Esc, the backdrop or the close button shrink it back. Works with a
// video file (`src`) or an embed URL (`embedUrl`, e.g. a video platform's player).

const STYLE_ID = 'bl-video-hero';
const CSS = `
.bl-vhero { position: relative; display: block; width: 100%; max-width: var(--bl-w); aspect-ratio: var(--bl-ratio); padding: 0; overflow: hidden; border: 0; border-radius: var(--bl-radius); background: #000; color: #fff; font-family: var(--bl-font); cursor: pointer; box-shadow: 0 30px 60px -30px rgba(0,0,0,0.7); }
.bl-vhero:focus-visible { outline: 3px solid var(--bl-accent); outline-offset: 3px; }
.bl-vhero__poster { position: absolute; inset: 0; transition: transform 600ms cubic-bezier(.2,.9,.25,1), filter 300ms; }
.bl-vhero__poster > img, .bl-vhero__poster > video { width: 100%; height: 100%; object-fit: cover; display: block; }
.bl-vhero:hover .bl-vhero__poster { transform: scale(1.04); filter: brightness(0.8); }
.bl-vhero__shade { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.55), transparent 55%); }
.bl-vhero__play { position: absolute; left: 50%; top: 50%; display: grid; place-items: center; width: var(--bl-btn); height: var(--bl-btn); border-radius: 50%; background: var(--bl-accent); color: var(--bl-accent-ink); transform: translate(calc(-50% + var(--bl-px, 0px)), calc(-50% + var(--bl-py, 0px))) scale(var(--bl-ps, 1)); transition: transform 300ms cubic-bezier(.2,.9,.25,1.3); box-shadow: 0 10px 30px -8px rgba(0,0,0,0.6); }
.bl-vhero:hover .bl-vhero__play { --bl-ps: 1.1; }
.bl-vhero__play::before, .bl-vhero__play::after { content: ""; position: absolute; inset: 0; border-radius: 50%; border: 2px solid var(--bl-accent); animation: bl-vhero-ring 2.4s cubic-bezier(.2,.6,.3,1) infinite; }
.bl-vhero__play::after { animation-delay: 1.2s; }
.bl-vhero__caption { position: absolute; left: 18px; right: 18px; bottom: 16px; text-align: left; }
.bl-vhero__title { display: block; font-size: 18px; font-weight: 700; }
.bl-vhero__meta { display: block; margin-top: 3px; color: rgba(255,255,255,0.75); font-size: 13px; }
.bl-vhero-box__backdrop { position: fixed; inset: 0; z-index: 1400; background: var(--bl-backdrop); }
.bl-vhero-box { position: fixed; z-index: 1401; overflow: hidden; border-radius: var(--bl-radius); background: #000; box-shadow: 0 40px 100px -30px rgba(0,0,0,0.9); outline: none; }
.bl-vhero-box > video, .bl-vhero-box > iframe { display: block; width: 100%; height: 100%; border: 0; }
.bl-vhero-box__close { position: fixed; z-index: 1402; top: 16px; right: 16px; display: grid; place-items: center; width: 42px; height: 42px; border: 0; border-radius: 50%; background: rgba(255,255,255,0.14); color: #fff; cursor: pointer; }
.bl-vhero-box__close:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
@keyframes bl-vhero-ring { from { transform: scale(1); opacity: 0.8; } to { transform: scale(1.9); opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .bl-vhero__poster, .bl-vhero__play { transition: none; } .bl-vhero__play::before, .bl-vhero__play::after { animation: none; opacity: 0; } }
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
        className={`bl-vhero ${className}`}
        aria-label={name}
        aria-haspopup="dialog"
        onClick={() => change(true)}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{ ...vars, ...style }}
      >
        <span className="bl-vhero__poster" aria-hidden="true">
          {children ?? (poster ? <img src={poster} alt="" /> : null)}
        </span>
        {(title || meta) && <span className="bl-vhero__shade" aria-hidden="true" />}
        <span className="bl-vhero__play" aria-hidden="true">
          <svg width={buttonSize * 0.34} height={buttonSize * 0.34} viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 4.5v15l13-7.5z" />
          </svg>
        </span>
        {(title || meta) && (
          <span className="bl-vhero__caption" aria-hidden="true">
            {title && <span className="bl-vhero__title">{title}</span>}
            {meta && <span className="bl-vhero__meta">{meta}</span>}
          </span>
        )}
      </button>
      {mounted &&
        createPortal(
          <div style={vars}>
            <div ref={backdropRef} className="bl-vhero-box__backdrop" onClick={() => change(false)} />
            <div
              ref={boxRef}
              className="bl-vhero-box"
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
              <button ref={closeRef} type="button" className="bl-vhero-box__close" aria-label="Close video" onClick={() => change(false)}>
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
