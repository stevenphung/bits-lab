import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// The camera feed redrawn as pixel art, ASCII or halftone dots, live. It never asks for the
// camera on its own: a start screen says what will happen, the browser's prompt appears only
// after a click, and blocked, missing or unsupported cameras each get a plain explanation and a
// way to retry. While live, a LIVE badge shows and a Stop button turns the camera off (it also
// turns off when the component unmounts). Pass `src` (an image or video URL) to render that
// instead of the camera. Colours can be snapped to a palette. Under reduced motion it draws at
// a few frames per second.

const STYLE_ID = 'bl-webcam-pixels';
const CSS = `
.bl-cam { position: relative; width: 100%; height: 100%; overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); }
.bl-cam__canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.bl-cam__panel { position: absolute; inset: 0; display: grid; place-content: center; justify-items: center; gap: 12px; padding: 24px; text-align: center; }
.bl-cam__panel h3 { margin: 0; font-size: 18px; font-weight: 700; }
.bl-cam__panel p { max-width: 36ch; margin: 0; color: var(--bl-muted); font-size: 14px; line-height: 1.5; }
.bl-cam__btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border: 0; border-radius: 999px; background: var(--bl-accent); color: var(--bl-bg); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.bl-cam__btn:focus-visible { outline: 2px solid var(--bl-ink); outline-offset: 3px; }
.bl-cam__btn[data-quiet] { background: color-mix(in srgb, var(--bl-bg) 70%, transparent); color: var(--bl-ink); box-shadow: 0 0 0 1px color-mix(in srgb, var(--bl-ink) 30%, transparent); backdrop-filter: blur(6px); }
.bl-cam__bar { position: absolute; left: 12px; right: 12px; top: 12px; display: flex; align-items: center; justify-content: flex-end; gap: 8px; pointer-events: none; }
.bl-cam__bar > * { pointer-events: auto; }
.bl-cam__live { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: color-mix(in srgb, var(--bl-bg) 70%, transparent); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; backdrop-filter: blur(6px); }
.bl-cam__live::before { content: ""; width: 8px; height: 8px; border-radius: 50%; background: var(--bl-live); animation: bl-cam-pulse 1.4s ease-in-out infinite; }
.bl-cam__spin { width: 22px; height: 22px; border-radius: 50%; border: 3px solid color-mix(in srgb, var(--bl-accent) 25%, transparent); border-top-color: var(--bl-accent); animation: bl-cam-spin 800ms linear infinite; }
.bl-cam__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-cam-pulse { 50% { opacity: 0.35; } }
@keyframes bl-cam-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .bl-cam__live::before { animation: none; } .bl-cam__spin { animation-duration: 2.4s; } }
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
      className={`bl-cam ${className}`}
      style={{ '--bl-bg': backgroundColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-live': liveColor, '--bl-radius': `${radius}px`, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <video ref={videoRef} muted playsInline aria-hidden="true" style={{ display: 'none' }} />
      <canvas ref={canvasRef} className="bl-cam__canvas" role="img" aria-label={label ?? `${src ? 'Image' : 'Live camera'} rendered as ${({ ascii: 'ASCII art', dots: 'halftone dots' } as Record<string, string>)[mode] ?? 'pixel art'}`} hidden={status !== 'live'} />
      {status === 'live' && !src && (
        <div className="bl-cam__bar">
          <span className="bl-cam__live">LIVE</span>
          <button type="button" className="bl-cam__btn" data-quiet="" onClick={turnOff}>
            Stop camera
          </button>
        </div>
      )}
      {status === 'idle' && (
        <div className="bl-cam__panel">
          <h3>{title}</h3>
          <p>{description}</p>
          <button type="button" className="bl-cam__btn" onClick={start}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
              <path d="M1.5 4.5h9v7h-9zM10.5 7l4-2.5v7l-4-2.5" />
            </svg>
            Turn on camera
          </button>
        </div>
      )}
      {status === 'requesting' && (
        <div className="bl-cam__panel">
          <span className="bl-cam__spin" aria-hidden="true" />
          <p>Waiting for you to allow the camera in your browser’s prompt…</p>
        </div>
      )}
      {message && (
        <div className="bl-cam__panel">
          <h3>{message[0]}</h3>
          <p>{message[1]}</p>
          {status !== 'unsupported' && (
            <button type="button" className="bl-cam__btn" onClick={start}>
              Try again
            </button>
          )}
        </div>
      )}
      <span className="bl-cam__sr" role="status">
        {statusText}
      </span>
    </div>
  );
}
