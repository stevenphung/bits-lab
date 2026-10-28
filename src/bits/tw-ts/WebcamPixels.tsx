import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// The camera feed redrawn as pixel art, ASCII or halftone dots, live. It never asks for the
// camera on its own: a start screen says what will happen, the browser's prompt appears only
// after a click, and blocked, missing or unsupported cameras each get a plain explanation and a
// way to retry. While live, a LIVE badge shows and a Stop button turns the camera off (it also
// turns off when the component unmounts). Pass `src` (an image or video URL) to render that
// instead of the camera. Colours can be snapped to a palette. Under reduced motion it draws at
// a few frames per second.

const STYLE_ID = 'bl-webcam-pixels-tw';
const CSS = `
@keyframes bl-cam-pulse { 50% { opacity: 0.35; } }
@keyframes bl-cam-spin { to { transform: rotate(360deg); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

function rgb(hex: string): [number, number, number] {
  const v = hex.replace('#', '');
  const full = v.length === 3 ? v.replace(/./g, (c: string) => c + c) : v.slice(0, 6);
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Darkest to brightest.
const ASCII_RAMP = ' .:-=+*#%@';

const MESSAGES = {
  denied: ['Camera blocked', 'Camera access was turned down. Allow it for this site in your browser’s address bar or settings, then try again.'],
  missing: ['No camera found', 'Plug in or enable a camera, then try again.'],
  busy: ['Camera in use', 'Another app or tab is using the camera. Close it, then try again.'],
  unsupported: ['Camera not available', 'This browser (or an insecure http:// page) can’t share a camera.'],
  error: ['Couldn’t start the camera', 'Something went wrong while starting it. Try again.']
};

export type WebcamStatus = 'idle' | 'requesting' | 'live' | 'denied' | 'missing' | 'busy' | 'unsupported' | 'error';

export interface WebcamPixelsProps {
  /** Render this image or video URL instead of the camera. */
  src?: string;
  mode?: 'pixels' | 'ascii' | 'dots';
  /** Grid pitch in px. */
  cellSize?: number;
  /** Snap colours to these. */
  palette?: string[];
  /** Flip horizontally (default: on for the camera). */
  mirror?: boolean;
  contrast?: number;
  /** Redraw rate. */
  fps?: number;
  /** Ask for the camera on mount instead of after a click. */
  autoStart?: boolean;
  /** Draw everything in inkColor. */
  monochrome?: boolean;
  inkColor?: string;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  /** The LIVE dot. */
  liveColor?: string;
  radius?: number;
  fontFamily?: string;
  /** Start-screen heading. */
  title?: string;
  description?: string;
  /** The canvas's accessible name. */
  label?: string;
  onStatusChange?: (status: WebcamStatus) => void;
  className?: string;
  style?: CSSProperties;
}

export default function WebcamPixels({
  src,
  mode = 'pixels',
  cellSize = 10,
  palette,
  mirror,
  contrast = 1.1,
  fps = 24,
  autoStart = false,
  monochrome = false,
  inkColor = '#73eff7',
  backgroundColor = '#14151f',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  accentColor = '#73eff7',
  liveColor = '#ef4444',
  radius = 16,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  title = 'See yourself in pixels',
  description = 'Your camera is turned into a live pixel grid right here in the browser. Nothing is recorded or uploaded.',
  label,
  onStatusChange,
  className = '',
  style
}: WebcamPixelsProps) {
  useStyles();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<WebcamStatus>(src ? 'live' : 'idle');
  const flip = mirror ?? !src;

  const changeStatus = (next: WebcamStatus) => {
    setStatus(next);
    onStatusChange?.(next);
  };

  const stop = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const start = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      changeStatus('unsupported');
      return;
    }
    changeStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      await video.play().catch(() => {});
      changeStatus('live');
    } catch (err) {
      stop();
      const name = (err as Error | undefined)?.name;
      changeStatus(name === 'NotAllowedError' || name === 'SecurityError' ? 'denied' : name === 'NotFoundError' || name === 'OverconstrainedError' ? 'missing' : name === 'NotReadableError' ? 'busy' : 'error');
    }
  };

  const turnOff = () => {
    stop();
    changeStatus('idle');
  };

  // Camera off on unmount; follow `src` changes.
  useEffect(() => {
    if (src) {
      stop();
      changeStatus('live');
    } else if (autoStart) start();
    else changeStatus('idle');
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  // Draw loop: sample the source down to one pixel per cell, then render the cells.
  useEffect(() => {
    if (status !== 'live') return undefined;
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const sample = document.createElement('canvas');
    const sctx = sample.getContext('2d', { willReadFrequently: true })!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const interval = 1000 / (reduced ? Math.min(fps, 4) : fps);
    const colors = palette?.length ? palette.map(rgb) : null;
    const ink = rgb(inkColor);
    let source: HTMLVideoElement | HTMLImageElement = videoRef.current!;
    let ready = !src;
    let frame = 0;
    let lastDraw = 0;
    let visible = true;
    let cancelled = false;

    if (src) {
      const isVideo = /\.(mp4|webm|ogv|mov)(\?|$)/i.test(src);
      source = isVideo ? Object.assign(document.createElement('video'), { muted: true, loop: true, playsInline: true, crossOrigin: 'anonymous' }) : new Image();
      source.crossOrigin = 'anonymous';
      const onReady = () => {
        if (cancelled) return;
        ready = true;
        if (isVideo) (source as HTMLVideoElement).play().catch(() => {});
        render(performance.now(), true);
      };
      source.addEventListener(isVideo ? 'loadeddata' : 'load', onReady, { once: true });
      source.src = src;
    }

    const nearest = (r: number, g: number, b: number) => {
      let best = colors![0];
      let bestD = Infinity;
      for (const c of colors!) {
        const d = (c[0] - r) ** 2 * 0.3 + (c[1] - g) ** 2 * 0.59 + (c[2] - b) ** 2 * 0.11;
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      return best;
    };

    const render = (now: number, force = false) => {
      frame = 0;
      if (cancelled) return;
      if (visible && ready && (force || now - lastDraw >= interval)) {
        lastDraw = now;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const w = wrap.clientWidth;
        const h = wrap.clientHeight;
        if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
        }
        const cols = Math.max(1, Math.floor(w / cellSize));
        const rows = Math.max(1, Math.floor(h / cellSize));
        const sw = (source as HTMLVideoElement).videoWidth || (source as HTMLImageElement).naturalWidth || 0;
        const sh = (source as HTMLVideoElement).videoHeight || (source as HTMLImageElement).naturalHeight || 0;
        if (sw && sh) {
          sample.width = cols;
          sample.height = rows;
          // Cover: crop the source to the grid's aspect ratio.
          const scale = Math.max(cols / sw, rows / sh);
          const cw = cols / scale;
          const ch = rows / scale;
          sctx.save();
          if (flip) {
            sctx.translate(cols, 0);
            sctx.scale(-1, 1);
          }
          sctx.drawImage(source, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, cols, rows);
          sctx.restore();
          const data = sctx.getImageData(0, 0, cols, rows).data;
          const cell = cellSize * dpr;
          const ox = (canvas.width - cols * cell) / 2;
          const oy = (canvas.height - rows * cell) / 2;
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          if (mode === 'ascii') {
            ctx.font = `700 ${cell * 1.05}px ui-monospace, SFMono-Regular, Menlo, monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
          }
          for (let i = 0; i < cols * rows; i++) {
            const c = i % cols;
            const r = (i - c) / cols;
            let R = data[i * 4];
            let G = data[i * 4 + 1];
            let B = data[i * 4 + 2];
            // Contrast around mid-grey.
            R = Math.max(0, Math.min(255, (R - 128) * contrast + 128));
            G = Math.max(0, Math.min(255, (G - 128) * contrast + 128));
            B = Math.max(0, Math.min(255, (B - 128) * contrast + 128));
            const lum = (0.299 * R + 0.587 * G + 0.114 * B) / 255;
            let color = monochrome ? ink : [R, G, B];
            if (colors && !monochrome) color = nearest(R, G, B);
            const x = ox + c * cell;
            const y = oy + r * cell;
            if (mode === 'ascii') {
              const ch = ASCII_RAMP[Math.min(ASCII_RAMP.length - 1, Math.floor(lum * ASCII_RAMP.length))];
              if (ch === ' ') continue;
              ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
              ctx.fillText(ch, x + cell / 2, y + cell / 2);
            } else if (mode === 'dots') {
              const rad = (cell / 2) * Math.sqrt(lum) * 0.95;
              if (rad < 0.4) continue;
              ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
              ctx.beginPath();
              ctx.arc(x + cell / 2, y + cell / 2, rad, 0, Math.PI * 2);
              ctx.fill();
            } else {
              const k = monochrome ? lum : 1;
              ctx.fillStyle = `rgb(${Math.round(color[0] * k)},${Math.round(color[1] * k)},${Math.round(color[2] * k)})`;
              ctx.fillRect(x, y, cell + 0.5, cell + 0.5);
            }
          }
        }
      }
      // Still images only need redrawing on resize; video keeps the loop going.
      if (!(src && source instanceof HTMLImageElement)) frame = requestAnimationFrame(render);
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(wrap);
    const resize = new ResizeObserver(() => render(performance.now(), true));
    resize.observe(wrap);
    frame = requestAnimationFrame(render);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      io.disconnect();
      resize.disconnect();
      if (src && source instanceof HTMLVideoElement) source.pause();
    };
    // palette is compared by value so a new array literal each render doesn't restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, src, mode, cellSize, palette?.join(), flip, contrast, fps, monochrome, inkColor, backgroundColor]);

  const message = MESSAGES[status as keyof typeof MESSAGES];
  const statusText = ({ idle: 'Camera off.', requesting: 'Waiting for camera permission…', live: src ? '' : 'Camera on.' } as Record<string, string>)[status] ?? (message ? `${message[0]}. ${message[1]}` : '');

  return (
    <div
      ref={wrapRef}
      className={`relative h-full w-full overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      style={{ '--bl-bg': backgroundColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-live': liveColor, '--bl-radius': `${radius}px`, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <video ref={videoRef} muted playsInline aria-hidden="true" style={{ display: 'none' }} />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" role="img" aria-label={label ?? `${src ? 'Image' : 'Live camera'} rendered as ${({ ascii: 'ASCII art', dots: 'halftone dots' } as Record<string, string>)[mode] ?? 'pixel art'}`} hidden={status !== 'live'} />
      {status === 'live' && !src && (
        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-end gap-2 *:pointer-events-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,var(--bl-bg)_70%,transparent)] px-2.5 py-1 text-[12px] font-bold tracking-[0.08em] backdrop-blur-[6px] before:size-2 before:animate-[bl-cam-pulse_1.4s_ease-in-out_infinite] before:rounded-[50%] before:bg-(--bl-live) motion-reduce:before:animate-none">LIVE</span>
          <button type="button" className="inline-flex cursor-pointer items-center gap-2 rounded-full border-0 bg-(--bl-accent) px-4 py-2.5 text-[14px] font-semibold text-(--bl-bg) focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--bl-ink) data-[quiet]:bg-[color-mix(in_srgb,var(--bl-bg)_70%,transparent)] data-[quiet]:text-(--bl-ink) data-[quiet]:shadow-[0_0_0_1px_color-mix(in_srgb,var(--bl-ink)_30%,transparent)] data-[quiet]:backdrop-blur-[6px]" data-quiet="" onClick={turnOff}>
            Stop camera
          </button>
        </div>
      )}
      {status === 'idle' && (
        <div className="absolute inset-0 grid place-content-center justify-items-center gap-3 p-6 text-center [&_h3]:m-0 [&_h3]:text-[18px] [&_h3]:font-bold [&_p]:m-0 [&_p]:max-w-[36ch] [&_p]:text-[14px] [&_p]:leading-[1.5] [&_p]:text-(--bl-muted)">
          <h3>{title}</h3>
          <p>{description}</p>
          <button type="button" className="inline-flex cursor-pointer items-center gap-2 rounded-full border-0 bg-(--bl-accent) px-4 py-2.5 text-[14px] font-semibold text-(--bl-bg) focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--bl-ink) data-[quiet]:bg-[color-mix(in_srgb,var(--bl-bg)_70%,transparent)] data-[quiet]:text-(--bl-ink) data-[quiet]:shadow-[0_0_0_1px_color-mix(in_srgb,var(--bl-ink)_30%,transparent)] data-[quiet]:backdrop-blur-[6px]" onClick={start}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
              <path d="M1.5 4.5h9v7h-9zM10.5 7l4-2.5v7l-4-2.5" />
            </svg>
            Turn on camera
          </button>
        </div>
      )}
      {status === 'requesting' && (
        <div className="absolute inset-0 grid place-content-center justify-items-center gap-3 p-6 text-center [&_h3]:m-0 [&_h3]:text-[18px] [&_h3]:font-bold [&_p]:m-0 [&_p]:max-w-[36ch] [&_p]:text-[14px] [&_p]:leading-[1.5] [&_p]:text-(--bl-muted)">
          <span className="size-[22px] animate-[bl-cam-spin_800ms_linear_infinite] rounded-[50%] border-3 border-solid border-[color-mix(in_srgb,var(--bl-accent)_25%,transparent)] border-t-(--bl-accent) motion-reduce:[animation-duration:2.4s]" aria-hidden="true" />
          <p>Waiting for you to allow the camera in your browser’s prompt…</p>
        </div>
      )}
      {message && (
        <div className="absolute inset-0 grid place-content-center justify-items-center gap-3 p-6 text-center [&_h3]:m-0 [&_h3]:text-[18px] [&_h3]:font-bold [&_p]:m-0 [&_p]:max-w-[36ch] [&_p]:text-[14px] [&_p]:leading-[1.5] [&_p]:text-(--bl-muted)">
          <h3>{message[0]}</h3>
          <p>{message[1]}</p>
          {status !== 'unsupported' && (
            <button type="button" className="inline-flex cursor-pointer items-center gap-2 rounded-full border-0 bg-(--bl-accent) px-4 py-2.5 text-[14px] font-semibold text-(--bl-bg) focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--bl-ink) data-[quiet]:bg-[color-mix(in_srgb,var(--bl-bg)_70%,transparent)] data-[quiet]:text-(--bl-ink) data-[quiet]:shadow-[0_0_0_1px_color-mix(in_srgb,var(--bl-ink)_30%,transparent)] data-[quiet]:backdrop-blur-[6px]" onClick={start}>
              Try again
            </button>
          )}
        </div>
      )}
      <span className="sr-only" role="status">
        {statusText}
      </span>
    </div>
  );
}
