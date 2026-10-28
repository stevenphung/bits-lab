import { useEffect, useInsertionEffect, useRef, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };
type Vec3 = [number, number, number];
/** [latitude, longitude] in degrees. */
export type LatLon = [number, number];

export interface GlobeMarker {
  lat: number;
  lon: number;
  /** Also feeds the globe's accessible description. */
  label?: string;
  color?: string;
}

export interface GlobeArc {
  from: LatLon;
  to: LatLon;
}

export interface DotGlobeProps {
  /** Max width, in px (the globe is square and shrinks to fit). */
  size?: number;
  /** Fibonacci samples over the whole sphere; roughly a third land on land. */
  dotCount?: number;
  /** Dot scale. */
  dotSize?: number;
  /** Square dots, for a pixel look. */
  square?: boolean;
  dotColor?: string;
  oceanColor?: string;
  glowColor?: string;
  arcColor?: string;
  markerColor?: string;
  markers?: GlobeMarker[];
  /** Great-circle arcs with a traveling comet. Longer arcs fly higher. */
  arcs?: GlobeArc[];
  /** Spin when idle; resumes after a drag settles. */
  autoRotate?: boolean;
  /** Spin speed, in degrees per second. */
  rotateSpeed?: number;
  /** Longitude facing the viewer at start. */
  initialLon?: number;
  /** Latitude tilted toward the viewer at start. */
  initialLat?: number;
  /** Drag with inertia (arrow keys always work when focused). */
  draggable?: boolean;
  /** Accessible name. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

interface GlobeConfig {
  dotSize: number;
  square: boolean;
  dotColor: string;
  oceanColor: string;
  glowColor: string;
  arcColor: string;
  markerColor: string;
  markers: GlobeMarker[];
  autoRotate: boolean;
  rotateSpeed: number;
  draggable: boolean;
}

// Interactive dotted globe on a 2D canvas (no WebGL, no dependencies). Land dots are spread
// evenly with a Fibonacci sphere and kept where an embedded land bitmap says there is land.
// Drag with inertia, arrow keys, auto-rotate, pulsing markers and great-circle arcs with
// traveling comets. Pauses off-screen; draws a still frame under reduced motion.

// Land data: Natural Earth (public domain), rasterized to 180×90 cells (2°) by
// scripts/build-land-mask.mjs. Row 0 = 90°N, column 0 = 180°W, MSB-first bits.
const LAND = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf4AP/AAAAAAAAAAAAAAAAAAAAAAAAX/z///+AAAAAAAABAAAAAAAAAAAAAYd8P///wAA+AAAAAA8AAAAAAAAAAAwAnw////4AAIAAAAAAGAAAAAAAAAAADivwAf//wAAAAADAAf/wAHYAAAAAADoi3sAP//gAAAAAMAD///sAAAAgBgACfwz/AD/+gAAAwAEHf///+/8gBAP/7/nJdjwD/+AAAH/AA7f///////f4P//////h8H/gAAAf/6//f////////Mf/////9H4D8AeAA+ev///////////AP/////4A0B4AAAD5/////////////Af3////gHgA4AAAH5///////////LwAHgH///gHkAAAAAH4/////////+CIAABAB///4D+AAAAGCx/////////4A8AAIAAf///n/gAAAOCD/////////wA4AAAAAf///n/wAAAbP///////////AgAAAAAP/////wAAADf//////////9AAAAAAAF////0YAAAB///////////9AAAAAAAD////8EAAAB///////////5AAAAAAAD////2AAAAB/f5fP//////wAAAAAAAD////gAAAAfxnwPP//////jAAAAAAAD////AAAAAPCb3/n/////+CAAAAAAAD///8AAAAAfALf/n////+ECAAAAAAAB///8AAAAAGHQP/n/////mMAAAAAAAA///8AAAAAH+Ai///////E8AAAAAAAAf//wAAAAAP/AA///////BgAAAAAAAAP//gAAAAAf/73///////gAAAAAAAAAD/AQAAAAAf////f/////gAAAAAAAAAF+AQAAAAB///+/n/////AAAAAAAAAAC+AAAAAAB///+f0H////AAAAAAAAAAAeAwAAAAD////f/B///8gAAAAAAAAAAeGEAAAAH////v+B/z/AAAAAAAAAAAAPMAgAAAD////n+A/B+gAAAAAAAAAAAD8AAAAAD////n4AeB/AgAAAAAAAAAAAPAAAAAH////3gAcAfAgAAAAAAAAAAADAAAAAD////6AAcAfggAAAAAAAAAAABDwAAAD////8wAMATAIAAAAAAAAAAAAr/AAAB/////gAKASAAAAAAAAAAAAAAH/gAAA/////gACAAAIAAAAAAAAAAAAH/8AAAaH///AAAAsGAAAAAAAAAAAAAH/+AAAAB//+AAAAUOAAAAAAAAAAAAAP/+AAAAB//8AAAAYegAAAAAAAAAAAAP//gAAAD//4AAAAMeBgAAAAAAAAAAAP//8AAAB//wAAAAGdiuAAAAAAAAAAAf///AAAA//wAAAACAQHgAAAAAAAAAAP///gAAA//wAAAABwAHwgAAAAAAAAAH///AAAA//wAAAAACIDQIAAAAAAAAAH//+AAAAf/wAAAAAAAAAAAAAAAAAAAD//+AAAA//wgAAAAABxAAAAAAAAAAAD//+AAAA//wgAAAAAPxgBAAAAAAAAAA//8AAAA//jgAAAAAf5gAAAAAAAAAAAf/8AAAA//DgAAAAAf/gAAAAAAAAAAAf/8AAAAf/DAAAAAD//4CAAAAAAAAAAf/wAAAAf/DAAAAAH//4AAAAAAAAAAAf/AAAAAf+CAAAAAH//8AAAAAAAAAAAf/AAAAAP8AAAAAAH//+AAAAAAAAAAA/+AAAAAP8AAAAAAH//+AAAAAAAAAAA/+AAAAAH4AAAAAAD//+AAAAAAAAAAA/8AAAAAHwAAAAAADwf8AAAAAAAAAAA/gAAAAAAAAAAAAACAH4AIAAAAAAAAB/wAAAAAAAAAAAAAAAD4AEAAAAAAAAB+AAAAAAAAAAAAAAAAAAAGAAAAAAAAB6AAAAAAAAAAAAAAAAAwAMAAAAAAAAA8AAAAAAAAAAAAAAAAAQAYAAAAAAAAB4AAAAAAAAAAAAAAAAAAAwAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAACAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAeAAIP+f/gAAAAAAAAAAAMAAAAAAABP/+H//////AAAAAAAAAAA+AAAAAf////8////////AAAAAAAOEAPAAAB///////////////gAAAP//T//8AAAH//////////////+AAAH/////4AAAH///////////////8AAE//////4ABw////////////////8AAAD//////gCA////////////////wAAAf/////////////////////////+A/4A///////////////////////////////////////////////////////////////////////////////////////';

const STYLE_ID = 'bl-dot-globe';
const CSS = `
.bl-globe { position: relative; width: 100%; max-width: var(--bl-size); aspect-ratio: 1; margin: 0 auto; touch-action: pan-y; cursor: grab; outline: none; }
.bl-globe[data-dragging] { cursor: grabbing; }
.bl-globe:focus-visible { box-shadow: 0 0 0 3px var(--bl-focus); border-radius: 50%; }
.bl-globe canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

let landBits: Uint8Array | undefined;
export function isLand(lat: number, lon: number) {
  if (!landBits) landBits = Uint8Array.from(atob(LAND), c => c.charCodeAt(0));
  const col = Math.min(179, Math.max(0, Math.floor((lon + 180) / 2)));
  const row = Math.min(89, Math.max(0, Math.floor((90 - lat) / 2)));
  const i = row * 180 + col;
  return (landBits[i >> 3] & (1 << (7 - (i & 7)))) !== 0;
}

const RAD = Math.PI / 180;
const toVec = (lat: number, lon: number): Vec3 => [Math.cos(lat * RAD) * Math.sin(lon * RAD), Math.sin(lat * RAD), Math.cos(lat * RAD) * Math.cos(lon * RAD)];

function landDots(count: number) {
  const dots: Vec3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * (i + 0.5)) / count;
    const r = Math.sqrt(1 - y * y);
    const x = r * Math.cos(i * golden);
    const z = r * Math.sin(i * golden);
    if (isLand(Math.asin(y) / RAD, Math.atan2(x, z) / RAD)) dots.push([x, y, z]);
  }
  return dots;
}

function arcPoints(from: LatLon, to: LatLon, samples = 64) {
  const a = toVec(...from);
  const b = toVec(...to);
  const omega = Math.acos(Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
  const lift = Math.min(0.4, omega * 0.2);
  const points: Vec3[] = [];
  for (let s = 0; s <= samples; s++) {
    const t = s / samples;
    const ka = omega < 1e-6 ? 1 - t : Math.sin((1 - t) * omega) / Math.sin(omega);
    const kb = omega < 1e-6 ? t : Math.sin(t * omega) / Math.sin(omega);
    const h = 1 + lift * Math.sin(Math.PI * t);
    points.push([(a[0] * ka + b[0] * kb) * h, (a[1] * ka + b[1] * kb) * h, (a[2] * ka + b[2] * kb) * h]);
  }
  return points;
}

const DEFAULT_MARKERS: GlobeMarker[] = [
  { lat: 37.77, lon: -122.42, label: 'San Francisco' },
  { lat: 51.51, lon: -0.13, label: 'London' },
  { lat: 35.68, lon: 139.69, label: 'Tokyo' },
  { lat: -33.87, lon: 151.21, label: 'Sydney' },
  { lat: -23.55, lon: -46.63, label: 'São Paulo' },
  { lat: 1.35, lon: 103.82, label: 'Singapore' }
];

const DEFAULT_ARCS: GlobeArc[] = [
  { from: [37.77, -122.42], to: [51.51, -0.13] },
  { from: [51.51, -0.13], to: [1.35, 103.82] },
  { from: [1.35, 103.82], to: [35.68, 139.69] },
  { from: [35.68, 139.69], to: [-33.87, 151.21] },
  { from: [37.77, -122.42], to: [-23.55, -46.63] }
];

export default function DotGlobe({
  size = 520,
  dotCount = 9000,
  dotSize = 1,
  square = false,
  dotColor = '#73eff7',
  oceanColor = 'rgba(41,54,111,0.55)',
  glowColor = 'rgba(115,239,247,0.25)',
  arcColor = '#ffcd75',
  markerColor = '#ef7d57',
  markers = DEFAULT_MARKERS,
  arcs = DEFAULT_ARCS,
  autoRotate = true,
  rotateSpeed = 8,
  initialLon = -20,
  initialLat = 18,
  draggable = true,
  label = 'Interactive globe',
  className = '',
  style
}: DotGlobeProps) {
  useStyles();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const view = useRef({ yaw: -initialLon * RAD, pitch: initialLat * RAD, vy: 0, vp: 0, dragging: false });
  const config = useRef<GlobeConfig>(null as unknown as GlobeConfig);
  config.current = { dotSize, square, dotColor, oceanColor, glowColor, arcColor, markerColor, markers, autoRotate, rotateSpeed, draggable };
  const arcsKey = JSON.stringify(arcs);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dots = landDots(dotCount);
    const arcPaths = arcs.map(arc => arcPoints(arc.from, arc.to));
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const state = view.current;
    let width = 0;
    let frame = 0;
    let visible = true;
    let last = performance.now();
    let clock = 0;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = wrap.clientWidth;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(width * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };

    const project = ([x, y, z]: Vec3, cosY: number, sinY: number, cosP: number, sinP: number, radius: number, center: number): [number, number, number, boolean] => {
      const x1 = x * cosY + z * sinY;
      const z1 = z * cosY - x * sinY;
      const y2 = y * cosP - z1 * sinP;
      const z2 = y * sinP + z1 * cosP;
      return [center + x1 * radius, center - y2 * radius, z2, x1 * x1 + y2 * y2 > 1];
    };

    function draw() {
      const c = config.current;
      const center = width / 2;
      const radius = width * 0.42;
      const cosY = Math.cos(state.yaw);
      const sinY = Math.sin(state.yaw);
      const cosP = Math.cos(state.pitch);
      const sinP = Math.sin(state.pitch);
      ctx.clearRect(0, 0, width, width);

      const glow = ctx.createRadialGradient(center, center, radius * 0.9, center, center, radius * 1.18);
      glow.addColorStop(0, c.glowColor);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, width);
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = c.oceanColor;
      ctx.fill();

      const dotRadius = Math.max(0.6, radius * 0.0068 * c.dotSize);
      ctx.fillStyle = c.dotColor;
      for (const dot of dots) {
        const [sx, sy, depth] = project(dot, cosY, sinY, cosP, sinP, radius, center);
        if (depth <= 0) continue;
        ctx.globalAlpha = 0.25 + depth * 0.75;
        const r = dotRadius * (0.55 + depth * 0.45);
        if (c.square) ctx.fillRect(sx - r, sy - r, r * 2, r * 2);
        else {
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      ctx.lineCap = 'round';
      arcPaths.forEach((path, index) => {
        const projected = path.map(point => project(point, cosY, sinY, cosP, sinP, radius, center));
        const shown = (p: [number, number, number, boolean]) => p[2] > 0 || p[3];
        ctx.strokeStyle = c.arcColor;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        projected.forEach((p, i) => (i && shown(p) && shown(projected[i - 1]) ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
        ctx.stroke();

        const head = reduced ? 1 : ((clock * 0.35 + index * 0.37) % 1.4) / 1.1;
        const tail = 0.28;
        ctx.lineWidth = 2;
        for (let i = 1; i < projected.length; i++) {
          const t = i / (projected.length - 1);
          if (t > head || t < head - tail || !shown(projected[i]) || !shown(projected[i - 1])) continue;
          ctx.globalAlpha = 1 - (head - t) / tail;
          ctx.beginPath();
          ctx.moveTo(projected[i - 1][0], projected[i - 1][1]);
          ctx.lineTo(projected[i][0], projected[i][1]);
          ctx.stroke();
        }
      });
      ctx.globalAlpha = 1;

      for (const marker of c.markers) {
        const [sx, sy, depth] = project(toVec(marker.lat, marker.lon), cosY, sinY, cosP, sinP, radius, center);
        if (depth <= 0.05) continue;
        const color = marker.color ?? c.markerColor;
        const pulse = reduced ? 0.5 : (((clock * 0.8 + marker.lon / 90) % 1) + 1) % 1;
        ctx.globalAlpha = depth * (1 - pulse);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 3 + pulse * 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = depth;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    const tick = (now: number) => {
      frame = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      clock += dt;
      const c = config.current;
      if (!state.dragging) {
        state.yaw += state.vy * dt;
        state.pitch += state.vp * dt;
        state.vy *= Math.pow(0.04, dt);
        state.vp *= Math.pow(0.04, dt);
        if (c.autoRotate && Math.abs(state.vy) < 0.2) state.yaw += c.rotateSpeed * RAD * dt;
        state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch));
      }
      draw();
      if (visible) frame = requestAnimationFrame(tick);
    };
    const start = () => {
      if (reduced || frame || !visible) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    let pointer: { id: number; x: number; y: number; t: number } | null = null;
    const onDown = (event: PointerEvent) => {
      if (!config.current.draggable) return;
      pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, t: performance.now() };
      state.dragging = true;
      state.vy = 0;
      state.vp = 0;
      wrap.setPointerCapture(event.pointerId);
      wrap.setAttribute('data-dragging', '');
    };
    const onMove = (event: PointerEvent) => {
      if (!pointer || event.pointerId !== pointer.id) return;
      const now = performance.now();
      const scale = Math.PI / Math.max(1, width);
      const dx = (event.clientX - pointer.x) * scale;
      const dy = (event.clientY - pointer.y) * scale;
      const dt = Math.max(0.008, (now - pointer.t) / 1000);
      state.yaw += dx;
      state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch + dy));
      state.vy = dx / dt;
      state.vp = dy / dt;
      pointer = { ...pointer, x: event.clientX, y: event.clientY, t: now };
      if (reduced) draw();
    };
    const onUp = (event: PointerEvent) => {
      if (!pointer || event.pointerId !== pointer.id) return;
      if (performance.now() - pointer.t > 80) {
        state.vy = 0;
        state.vp = 0;
      }
      pointer = null;
      state.dragging = false;
      wrap.removeAttribute('data-dragging');
    };
    const onKey = (event: KeyboardEvent) => {
      const step = 10 * RAD;
      const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
      const move = moves[event.key];
      if (!move) return;
      event.preventDefault();
      state.yaw += move[0];
      state.pitch = Math.max(-1.2, Math.min(1.2, state.pitch + move[1]));
      draw();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(wrap);
    wrap.addEventListener('pointerdown', onDown);
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerup', onUp);
    wrap.addEventListener('pointercancel', onUp);
    wrap.addEventListener('keydown', onKey);
    resize();
    start();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
      wrap.removeEventListener('pointerdown', onDown);
      wrap.removeEventListener('pointermove', onMove);
      wrap.removeEventListener('pointerup', onUp);
      wrap.removeEventListener('pointercancel', onUp);
      wrap.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dotCount, arcsKey]);

  const names = markers.map(m => m.label).filter(Boolean);
  return (
    <div
      ref={wrapRef}
      className={`bl-globe ${className}`}
      role="img"
      tabIndex={0}
      aria-label={names.length ? `${label}: ${names.join(', ')}. Drag or use arrow keys to rotate.` : `${label}. Drag or use arrow keys to rotate.`}
      style={{ '--bl-size': `${size}px`, '--bl-focus': dotColor, ...style } as CSSVars}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
    </div>
  );
}
