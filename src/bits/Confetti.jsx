import { useEffect, useRef } from 'react';

// Canvas confetti with real-ish physics: drag, gravity, wobble, flutter and fade. One shared
// full-window canvas and a pooled particle array, so repeated bursts don't allocate or stack
// canvases. Fire it from code with confetti({ origin: element }) or wrap any element in
// <Confetti> to burst on click. Shapes: squares, circles, strips, emoji/text, or images
// (sprites drawn crisp). Skipped entirely under reduced motion unless forced.

const PRESETS = {
  burst: { count: 90, spread: 70, angle: 90, velocity: 42, gravity: 1, decay: 0.92, ticks: 220 },
  cannon: { count: 120, spread: 30, angle: 70, velocity: 58, gravity: 1, decay: 0.93, ticks: 260 },
  fireworks: { count: 140, spread: 360, angle: 90, velocity: 34, gravity: 0.6, decay: 0.91, ticks: 200 },
  fountain: { count: 70, spread: 24, angle: 90, velocity: 52, gravity: 1.1, decay: 0.94, ticks: 260 },
  rain: { count: 160, spread: 0, angle: 270, velocity: 4, gravity: 0.35, decay: 0.99, ticks: 400, fromTop: true }
};

const DEFAULT_COLORS = ['#ef7d57', '#ffcd75', '#a7f070', '#38b764', '#41a6f6', '#73eff7', '#b13e53', '#f4f4f4'];

let canvas = null;
let ctx = null;
let particles = [];
const pool = [];
let frame = 0;
let dpr = 1;
const imageCache = new Map();

function ensureCanvas(zIndex) {
  if (canvas?.isConnected) return;
  canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: String(zIndex) });
  document.body.appendChild(canvas);
  ctx = canvas.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
}

function resize() {
  if (!canvas) return;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(window.innerWidth * dpr);
  canvas.height = Math.round(window.innerHeight * dpr);
}

function loadImage(src) {
  if (typeof src !== 'string') return src;
  if (!imageCache.has(src)) {
    const image = new Image();
    image.src = src;
    imageCache.set(src, image);
  }
  return imageCache.get(src);
}

const isImageSource = value => typeof value === 'object' || /^(\/|\.|https?:|data:image)/.test(value);

function step() {
  frame = 0;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  let alive = 0;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.tick++;
    p.vx *= p.decay;
    p.vy *= p.decay;
    p.vy += p.gravity;
    p.x += p.vx + Math.cos(p.wobble) * p.drift;
    p.y += p.vy;
    p.wobble += p.wobbleSpeed;
    p.tilt += p.tiltSpeed;
    const life = 1 - p.tick / p.ticks;
    if (life <= 0 || p.y > window.innerHeight + 60) {
      pool.push(p);
      continue;
    }
    particles[alive++] = p;
    ctx.save();
    ctx.globalAlpha = Math.min(1, life * 2.2);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation + p.tilt);
    // Flutter: squash one axis to fake a flat piece turning in 3D.
    ctx.scale(1, Math.abs(Math.cos(p.wobble)) * 0.8 + 0.2);
    const s = p.size;
    if (p.kind === 'image') {
      if (p.image.complete && p.image.naturalWidth) {
        ctx.imageSmoothingEnabled = !p.pixelated;
        ctx.drawImage(p.image, -s, -s, s * 2, s * 2);
      }
    } else if (p.kind === 'text') {
      ctx.font = `${s * 2}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.text, 0, 0);
    } else {
      ctx.fillStyle = p.color;
      if (p.kind === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'strip') ctx.fillRect(-s * 0.3, -s, s * 0.6, s * 2);
      else ctx.fillRect(-s * 0.6, -s * 0.6, s * 1.2, s * 1.2);
    }
    ctx.restore();
  }
  particles.length = alive;
  if (alive) frame = requestAnimationFrame(step);
  else ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function originPoint(origin) {
  if (!origin) return { x: window.innerWidth / 2, y: window.innerHeight * 0.6 };
  if (typeof Element !== 'undefined' && origin instanceof Element) {
    const r = origin.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  // Fractions (0–1) are relative to the window; larger numbers are pixels.
  const x = origin.x <= 1 ? origin.x * window.innerWidth : origin.x;
  const y = origin.y <= 1 ? origin.y * window.innerHeight : origin.y;
  return { x, y };
}

export function confetti(options = {}) {
  if (typeof window === 'undefined') return;
  if (!options.force && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  const o = { ...PRESETS[options.preset ?? 'burst'], ...options };
  const { count, spread, angle, velocity, gravity, decay, ticks, colors = DEFAULT_COLORS, shapes = ['square', 'strip', 'circle'], size = 7, scalar = 1, zIndex = 2000, pixelated = true } = o;
  ensureCanvas(zIndex);
  const from = originPoint(o.origin);
  const kinds = shapes.map(shape => (shape === 'square' || shape === 'circle' || shape === 'strip' ? { kind: shape } : isImageSource(shape) ? { kind: 'image', image: loadImage(shape) } : { kind: 'text', text: shape }));
  for (let i = 0; i < count; i++) {
    const p = pool.pop() ?? {};
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    const a = ((angle + (Math.random() - 0.5) * spread) * Math.PI) / 180;
    const speed = velocity * (0.5 + Math.random() * 0.5) * scalar * 0.35;
    Object.assign(p, {
      ...kind,
      x: o.fromTop ? Math.random() * window.innerWidth : from.x,
      y: o.fromTop ? -20 - Math.random() * window.innerHeight * 0.4 : from.y,
      vx: Math.cos(a) * speed,
      vy: -Math.sin(a) * speed,
      gravity: gravity * 0.32 * scalar,
      decay,
      drift: (o.drift ?? 0) + (Math.random() - 0.5) * 0.6,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.05 + Math.random() * 0.1,
      rotation: Math.random() * Math.PI * 2,
      tilt: 0,
      tiltSpeed: (Math.random() - 0.5) * 0.2,
      size: size * scalar * (0.7 + Math.random() * 0.6) * (kind.kind === 'image' || kind.kind === 'text' ? 1.6 : 1),
      color: colors[Math.floor(Math.random() * colors.length)],
      tick: 0,
      ticks: ticks * (0.8 + Math.random() * 0.4),
      pixelated
    });
    particles.push(p);
  }
  if (!frame) frame = requestAnimationFrame(step);
}

confetti.reset = () => {
  cancelAnimationFrame(frame);
  frame = 0;
  pool.push(...particles);
  particles = [];
  if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
};

export default function Confetti({ children, trigger = 'click', disabled = false, className = '', style, ...options }) {
  const ref = useRef(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (trigger === 'mount' && !disabled) confetti({ origin: ref.current, ...optionsRef.current });
  }, [trigger, disabled]);

  const fire = () => {
    if (!disabled) confetti({ origin: ref.current, ...optionsRef.current });
  };

  return (
    <span
      ref={ref}
      className={className}
      style={{ display: 'inline-block', ...style }}
      onClick={trigger === 'click' ? fire : undefined}
      onPointerEnter={trigger === 'hover' ? fire : undefined}
    >
      {children}
    </span>
  );
}
