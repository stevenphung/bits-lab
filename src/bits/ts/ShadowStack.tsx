import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ElementType } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Chunky retro titles. "extrude" stacks hard one-pixel shadow layers into a solid block that
// steps through your colours from face to back, like an 80s arcade logo; "echo" leaves spaced,
// fading copies trailing behind, gently breathing. With `follow`, the depth swings away from the
// pointer as if a light moved, and a press squashes the title down like a key. Plain text; the
// shadows are decoration; reduced motion keeps it still.

const STYLE_ID = 'bl-shadow-stack';
const CSS = `
.bl-stack { margin: 0; color: var(--bl-face); font-family: var(--bl-font); font-size: var(--bl-size); line-height: 1.1; text-shadow: var(--bl-shadow); transform: translate(var(--bl-push-x), var(--bl-push-y)); transition: text-shadow 160ms steps(4), transform 160ms steps(4); }
.bl-stack[data-mode="echo"] { animation: bl-stack-breathe 2.6s ease-in-out infinite; }
.bl-stack[data-follow] { cursor: default; user-select: none; }
@keyframes bl-stack-breathe { 50% { letter-spacing: 0.02em; } }
@media (prefers-reduced-motion: reduce) { .bl-stack { transition: none; animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const hexToRgb = (hex: string) => {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

// A colour partway along a list of colours (t from 0 to 1).
function along(colors: string[], t: number) {
  const rgb = colors.map(hexToRgb);
  const at = Math.min(rgb.length - 1.0001, t * (rgb.length - 1));
  const i = Math.floor(at);
  const f = at - i;
  return `rgb(${rgb[i].map((v, k) => Math.round(v + (rgb[i + 1][k] - v) * f)).join(',')})`;
}

function shadowFor(mode: string, depth: number, angle: number, step: number, colors: string[], echoes: number, spacing: number) {
  const rad = (angle * Math.PI) / 180;
  // Step a whole pixel per layer along the main axis (45° moves 1px right and 1px down), the
  // way hand-drawn pixel logos are extruded, rather than 1px along the diagonal.
  const unit = 1 / Math.max(Math.abs(Math.cos(rad)), Math.abs(Math.sin(rad)));
  const ux = Math.cos(rad) * unit;
  const uy = Math.sin(rad) * unit;
  if (mode === 'echo') {
    return Array.from({ length: echoes }, (_, i) => {
      const d = (i + 1) * spacing;
      const color = along(colors, i / Math.max(1, echoes - 1));
      return `${(ux * d).toFixed(1)}px ${(uy * d).toFixed(1)}px 0 color-mix(in srgb, ${color} ${Math.round(70 - (i / echoes) * 55)}%, transparent)`;
    }).join(', ');
  }
  const layers = Math.max(1, Math.round(depth / step));
  return Array.from({ length: layers }, (_, i) => {
    const d = (i + 1) * step;
    // Round each layer to whole pixels so the edge stays crisp and stair-stepped.
    return `${Math.round(ux * d)}px ${Math.round(uy * d)}px 0 ${along(colors, i / Math.max(1, layers - 1))}`;
  }).join(', ');
}

export interface ShadowStackProps {
  text?: string;
  as?: ElementType;
  /** A solid stair-stepped block, or spaced fading copies that breathe. */
  mode?: 'extrude' | 'echo';
  /** Extrude depth in px. */
  depth?: number;
  /** Direction of the depth in degrees (0 = right, 90 = down). */
  angle?: number;
  /** Px per extrude layer. */
  step?: number;
  echoes?: number;
  /** Gap between echoes in px. */
  spacing?: number;
  /** Depth falls away from the pointer, snapped to 15°. */
  follow?: boolean;
  /** Pressing squashes the title like a key. */
  press?: boolean;
  faceColor?: string;
  /** Colours the depth steps through, front to back. */
  colors?: string[];
  fontSize?: number | string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function ShadowStack({
  text = '',
  as: Tag = 'h2',
  mode = 'extrude',
  depth = 10,
  angle = 45,
  step = 1,
  echoes = 4,
  spacing = 6,
  follow = false,
  press = true,
  faceColor = '#ffcd75',
  colors = ['#ef7d57', '#b13e53', '#5d275d', '#1a1c2c'],
  fontSize = 56,
  fontFamily = '"Press Start 2P", ui-monospace, monospace',
  className = '',
  style
}: ShadowStackProps) {
  useStyles();
  const rootRef = useRef<HTMLElement>(null);
  const [aim, setAim] = useState(angle);
  const [pressed, setPressed] = useState(false);
  const live = follow ? aim : angle;
  const squash = pressed ? 0.35 : 1;
  const shadow = shadowFor(mode, depth * squash, live, step, colors, echoes, spacing * squash);
  // Pressing pushes the face into the depth it loses, so the back of the stack stays put.
  const rad = (live * Math.PI) / 180;
  const push = pressed && mode === 'extrude' ? depth * (1 - squash) : 0;

  useEffect(() => setAim(angle), [angle]);

  useEffect(() => {
    if (!follow || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const root = rootRef.current!;
    let raf = 0;
    const onMove = (event: PointerEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = root.getBoundingClientRect();
        // The light is the pointer: depth falls away from it, snapped to 15° so it steps.
        const away = (Math.atan2(r.top + r.height / 2 - event.clientY, r.left + r.width / 2 - event.clientX) * 180) / Math.PI;
        setAim(Math.round(away / 15) * 15);
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
    };
  }, [follow]);

  const setPress = (down: boolean) => {
    if (press && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setPressed(down);
  };
  return (
    <Tag
      ref={rootRef}
      className={`bl-stack ${className}`}
      data-mode={mode}
      data-follow={follow || undefined}
      onPointerDown={() => setPress(true)}
      onPointerUp={() => setPress(false)}
      onPointerLeave={() => setPress(false)}
      style={{ '--bl-face': faceColor, '--bl-shadow': shadow, '--bl-size': typeof fontSize === 'number' ? `${fontSize}px` : fontSize, '--bl-font': fontFamily, '--bl-push-x': `${Math.round(Math.cos(rad) * push)}px`, '--bl-push-y': `${Math.round(Math.sin(rad) * push)}px`, ...style } as CSSVars}
    >
      {text}
    </Tag>
  );
}
