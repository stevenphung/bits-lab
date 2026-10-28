import { useEffect, useInsertionEffect, useMemo, useRef } from 'react';

// Texture on top of anything. Stack any of: "grain", live film noise in chunky pixels; "dither",
// an 8-bit ordered-dither screen; "halftone", printer dots that fade toward one edge; "scanlines";
// and "blur", which softens the content toward the top or bottom edge. Wrap content, or use it
// on its own to cover its parent. Never catches the pointer; grain pauses off-screen and holds
// still for reduced motion.

const STYLE_ID = 'bl-grain-fx';
const CSS = `
.bl-grain { position: relative; isolation: isolate; }
.bl-grain[data-cover] { position: absolute; inset: 0; }
.bl-grain__layer { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.bl-grain__noise { display: block; width: 100%; height: 100%; opacity: var(--bl-amount); mix-blend-mode: var(--bl-blend); image-rendering: pixelated; }
.bl-grain__dither { opacity: var(--bl-amount); mix-blend-mode: var(--bl-blend); background-image: var(--bl-dither); background-size: calc(var(--bl-cell) * 8) calc(var(--bl-cell) * 8); image-rendering: pixelated; }
.bl-grain__halftone { opacity: var(--bl-amount); background-image: radial-gradient(circle at center, var(--bl-ink) var(--bl-dot), transparent calc(var(--bl-dot) + 0.6px)); background-size: var(--bl-pitch) var(--bl-pitch); -webkit-mask-image: linear-gradient(var(--bl-fade-dir), #000, transparent); mask-image: linear-gradient(var(--bl-fade-dir), #000, transparent); }
.bl-grain__scan { opacity: var(--bl-amount); background: repeating-linear-gradient(to bottom, transparent 0 calc(var(--bl-cell) * 1), var(--bl-ink) calc(var(--bl-cell) * 1) calc(var(--bl-cell) * 2)); }
.bl-grain__blur { -webkit-backdrop-filter: blur(var(--bl-blur)); backdrop-filter: blur(var(--bl-blur)); -webkit-mask-image: linear-gradient(var(--bl-blur-dir), #000, transparent var(--bl-blur-size)); mask-image: linear-gradient(var(--bl-blur-dir), #000, transparent var(--bl-blur-size)); }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// The classic 8×8 Bayer matrix: thresholds spread so no two neighbours are close in value.
const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];

// An 8×8 SVG tile: each cell is ink when its threshold is under the level, so `level` sets density.
function ditherTile(color, level) {
  const cells = BAYER.map((t, i) => (t < level * 64 ? `<rect x="${i % 8}" y="${Math.floor(i / 8)}" width="1" height="1"/>` : '')).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" shape-rendering="crispEdges" fill="${color}">${cells}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

const DIR = { top: 'to bottom', bottom: 'to top', left: 'to right', right: 'to left' };

export default function GrainFX({
  children,
  effects = ['grain'],
  amount = 0.35,
  cell = 2,
  fps = 12,
  blend = 'overlay',
  color = '#0b0b14',
  density = 0.5,
  dotSize = 2.5,
  dotPitch = 8,
  fadeFrom = 'top',
  blur = 10,
  blurEdge = 'bottom',
  blurSize = 45,
  className = '',
  style
}) {
  useStyles();
  const canvasRef = useRef(null);
  const list = Array.isArray(effects) ? effects : [effects];
  const has = name => list.includes(name);
  const grain = has('grain');
  const dither = useMemo(() => ditherTile(color, density), [color, density]);

  useEffect(() => {
    if (!grain) return undefined;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let image = null;
    let visible = true;
    let timer = 0;

    // One canvas pixel per `cell` CSS pixels, stretched up crisply, so the grain is chunky.
    const fit = () => {
      canvas.width = Math.max(1, Math.ceil(canvas.clientWidth / cell));
      canvas.height = Math.max(1, Math.ceil(canvas.clientHeight / cell));
      image = ctx.createImageData(canvas.width, canvas.height);
    };
    const paint = () => {
      const d = image.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = Math.random() * 255;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
        d[i + 3] = 255;
      }
      ctx.putImageData(image, 0, 0);
    };
    const loop = () => {
      paint();
      timer = visible && !document.hidden && !reduced ? setTimeout(loop, 1000 / fps) : 0;
    };
    const resize = new ResizeObserver(() => {
      fit();
      paint();
    });
    resize.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !timer) loop();
    });
    observer.observe(canvas);
    const onVisibility = () => !timer && loop();
    document.addEventListener('visibilitychange', onVisibility);
    fit();
    loop();
    return () => {
      clearTimeout(timer);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [grain, cell, fps]);

  return (
    <div
      className={`bl-grain ${className}`}
      data-cover={children == null || undefined}
      style={{ '--bl-amount': amount, '--bl-cell': `${cell}px`, '--bl-blend': blend, '--bl-ink': color, '--bl-dither': dither, '--bl-dot': `${dotSize}px`, '--bl-pitch': `${dotPitch}px`, '--bl-fade-dir': DIR[fadeFrom] ?? 'to bottom', '--bl-blur': `${blur}px`, '--bl-blur-dir': DIR[blurEdge] ?? 'to top', '--bl-blur-size': `${blurSize}%`, ...style }}
    >
      {children}
      {has('blur') && <span className="bl-grain__layer bl-grain__blur" aria-hidden="true" />}
      {has('halftone') && <span className="bl-grain__layer bl-grain__halftone" aria-hidden="true" />}
      {has('dither') && <span className="bl-grain__layer bl-grain__dither" aria-hidden="true" />}
      {has('scanlines') && <span className="bl-grain__layer bl-grain__scan" aria-hidden="true" />}
      {grain && (
        <span className="bl-grain__layer" aria-hidden="true">
          <canvas ref={canvasRef} className="bl-grain__noise" />
        </span>
      )}
    </div>
  );
}
