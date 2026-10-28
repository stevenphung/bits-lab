import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Multi-layer pixel scene. Each layer is a horizontally tiling image with a depth (0 = fixed,
// 1 = moves the most). Modes: 'auto' pans forever, 'mouse' follows the pointer, 'scroll' moves
// with the page. Offsets snap to whole pixels so pixel art stays crisp. Optional day-night cycle.

type Phase = 'day' | 'dusk' | 'night';

const SKY: Record<Phase, [string, string]> = {
  day: ['#41a6f6', '#73eff7'],
  dusk: ['#5d275d', '#ef7d57'],
  night: ['#0b0b14', '#29366f']
};
const TINT: Record<Phase, string> = { day: 'rgba(0,0,0,0)', dusk: 'rgba(177,62,83,0.28)', night: 'rgba(11,11,40,0.55)' };

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const hexToRgb = (hex: string) => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const mixHex = (a: string, b: string, t: number) => `rgb(${hexToRgb(a).map((v, i) => Math.round(lerp(v, hexToRgb(b)[i], t))).join(',')})`;
const parseRgba = (value: string) => value.match(/[\d.]+/g)!.map(Number);
const mixRgba = (a: string, b: string, t: number) => {
  const [r1, g1, b1, a1] = parseRgba(a);
  const [r2, g2, b2, a2] = parseRgba(b);
  return `rgba(${Math.round(lerp(r1, r2, t))},${Math.round(lerp(g1, g2, t))},${Math.round(lerp(b1, b2, t))},${lerp(a1, a2, t).toFixed(3)})`;
};

// Day → dusk → night → dusk → day over one cycle.
function phaseAt(t: number) {
  const p = (((t % 1) + 1) % 1) * 4;
  const stops: Phase[] = ['day', 'dusk', 'night', 'dusk', 'day'];
  const i = Math.floor(p);
  return { from: stops[i], to: stops[i + 1], t: p - i };
}

export interface ParallaxLayer {
  /** Horizontally tiling image, drawn at the layer's full height. */
  src?: string;
  /** 0 stays fixed, 1 moves the most. Defaults to the layer's position in the list. */
  depth?: number;
  /** Distance from the bottom (px or any CSS length). */
  bottom?: number | string;
  /** Layer height (px or any CSS length); defaults to the full scene. */
  height?: number | string;
  opacity?: number;
  /** Custom content that moves with the layer. */
  node?: ReactNode;
}

export interface PixelParallaxProps {
  /** Back to front. */
  layers?: ParallaxLayer[];
  /** Scene height, in px. */
  height?: number;
  /** Pan forever, follow the pointer, or move with the page scroll. */
  mode?: 'auto' | 'mouse' | 'scroll';
  /** Auto mode speed, in px per second for depth 1. */
  speed?: number;
  /** Mouse and scroll mode range, in px. */
  intensity?: number;
  /** Offsets snap to multiples of this, keeping pixel art crisp. */
  pixelSize?: number;
  /** Custom sky background (any CSS background). */
  sky?: string;
  /** Cycle the sky and a color tint through day, dusk and night. */
  dayNight?: boolean;
  /** Length of a full day, in seconds. */
  cycleDuration?: number;
  /** Accessible description of the scene. */
  label?: string;
  /** Centered content over the scene. */
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export default function PixelParallax({
  layers = [],
  height = 360,
  mode = 'auto',
  speed = 40,
  intensity = 60,
  pixelSize = 4,
  sky,
  dayNight = false,
  cycleDuration = 24,
  label = 'Pixel landscape',
  children,
  className = '',
  style
}: PixelParallaxProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const skyRef = useRef<HTMLDivElement>(null);
  const tintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const pointer = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(root);

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      pointer.tx = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      pointer.ty = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    };
    if (mode === 'mouse') window.addEventListener('pointermove', onMove);

    const snap = (value: number) => Math.round(value / pixelSize) * pixelSize;
    let frame = 0;
    const start = performance.now();
    const render = (now: number) => {
      const elapsed = (now - start) / 1000;
      if (visible) {
        pointer.x += (pointer.tx - pointer.x) * 0.08;
        pointer.y += (pointer.ty - pointer.y) * 0.08;
        const rect = root.getBoundingClientRect();
        const scrollProgress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height) - 0.5;
        layers.forEach((layer, index) => {
          const el = layerRefs.current[index];
          if (!el) return;
          const depth = layer.depth ?? index / Math.max(1, layers.length - 1);
          let x = 0;
          let y = 0;
          if (!reduced) {
            if (mode === 'auto') x = -elapsed * speed * depth;
            if (mode === 'mouse') {
              x = (0.5 - pointer.x) * intensity * depth;
              y = (0.5 - pointer.y) * intensity * 0.25 * depth;
            }
            if (mode === 'scroll') y = scrollProgress * intensity * 2 * depth;
          }
          el.style.backgroundPosition = `${snap(x)}px ${snap(y)}px`;
          if (layer.node) el.style.transform = `translate(${snap(x)}px, ${snap(y)}px)`;
        });
        if (dayNight && skyRef.current && tintRef.current) {
          const { from, to, t } = phaseAt(reduced ? 0 : elapsed / cycleDuration);
          skyRef.current.style.background = `linear-gradient(to bottom, ${mixHex(SKY[from][0], SKY[to][0], t)}, ${mixHex(SKY[from][1], SKY[to][1], t)})`;
          tintRef.current.style.background = mixRgba(TINT[from], TINT[to], t);
        }
      }
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, [layers, mode, speed, intensity, pixelSize, dayNight, cycleDuration]);

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={label}
      className={`relative w-full overflow-hidden [image-rendering:pixelated] ${className}`}
      style={{ height, ...style }}
    >
      <div
        ref={skyRef}
        aria-hidden="true" className="absolute inset-0"
        style={{ background: sky ?? `linear-gradient(to bottom, ${SKY.day[0]}, ${SKY.day[1]})` }}
      />
      {layers.map((layer, index) => (
        <div
          key={index}
          ref={el => {
            layerRefs.current[index] = el;
          }}
          aria-hidden="true" className="absolute inset-x-0 bg-[length:auto_100%] bg-[position:0_0] bg-repeat-x [image-rendering:pixelated]"
          style={{
            bottom: layer.bottom ?? 0,
            height: layer.height ?? '100%',
            backgroundImage: layer.src ? `url(${layer.src})` : undefined,
            opacity: layer.opacity ?? 1
          }}
        >
          {layer.node}
        </div>
      ))}
      {dayNight && <div ref={tintRef} aria-hidden="true" className="pointer-events-none absolute inset-0 mix-blend-multiply"  />}
      {children && <div className="absolute inset-0 grid place-items-center" >{children}</div>}
    </div>
  );
}
