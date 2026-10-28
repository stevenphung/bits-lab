import { useEffect, useInsertionEffect, useRef, type ButtonHTMLAttributes, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A soft-body button. Its outline is a ring of springs: the edge nearest the pointer bulges
// toward it, a press squashes the blob flat and wide, and letting go makes it bounce back.
// At rest it breathes gently (paused off-screen). It's a real <button>, so Space and Enter
// squash it too. Under reduced motion it's a still pill that darkens when pressed.

const STYLE_ID = 'bl-jelly-blob';
const CSS = `
.bl-jelly { position: relative; display: inline-grid; place-items: center; box-sizing: border-box; width: var(--bl-w); height: var(--bl-h); margin: 0; padding: 0 24px; border: 0; background: transparent; color: var(--bl-ink); font: inherit; font-family: var(--bl-font); font-size: var(--bl-size); font-weight: 700; cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
.bl-jelly:focus-visible { outline: none; }
.bl-jelly:focus-visible .bl-jelly__ring { opacity: 1; }
.bl-jelly:disabled { cursor: not-allowed; opacity: 0.5; }
.bl-jelly__blob { position: absolute; inset: -16px; width: calc(100% + 32px); height: calc(100% + 32px); overflow: visible; pointer-events: none; }
.bl-jelly__fill { fill: var(--bl-color); transition: fill 150ms; }
.bl-jelly__shade { fill: rgba(0,0,0,0.28); }
.bl-jelly__ring { fill: none; stroke: var(--bl-accent); stroke-width: 3; opacity: 0; transition: opacity 150ms; }
.bl-jelly[data-pressed] .bl-jelly__fill { fill: var(--bl-pressed); }
.bl-jelly__label { position: relative; display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; pointer-events: none; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// A closed curve through the points (Catmull-Rom turned into cubic Béziers).
function smoothPath(pts: number[][]) {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [pts[(i - 1 + n) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return `${d}Z`;
}

export interface JellyBlobProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'type' | 'children' | 'style' | 'color'> {
  children?: ReactNode;
  onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  /** The resting pill, in px. */
  width?: number;
  height?: number;
  /** Springs around the outline; more is smoother. */
  points?: number;
  /** How far the edge reaches toward the pointer, in px. */
  bulge?: number;
  /** How flat a press makes it, in px. */
  squash?: number;
  stiffness?: number;
  damping?: number;
  /** Gentle breathing at rest (paused off-screen). */
  idle?: boolean;
  color?: string;
  pressedColor?: string;
  textColor?: string;
  /** Focus ring. */
  accentColor?: string;
  fontSize?: number;
  fontFamily?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function JellyBlob({
  children,
  onClick,
  width = 220,
  height = 72,
  points = 18,
  bulge = 10,
  squash = 9,
  stiffness = 320,
  damping = 9,
  idle = true,
  color = '#b13e53',
  pressedColor = '#8a2f43',
  textColor = '#f4f4f4',
  accentColor = '#73eff7',
  fontSize = 18,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  type = 'button',
  disabled = false,
  className = '',
  style,
  ...rest
}: JellyBlobProps) {
  useStyles();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fillRef = useRef<SVGPathElement>(null);
  const shadeRef = useRef<SVGPathElement>(null);
  const ringRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const button = buttonRef.current!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const pad = 16;
    const cx = width / 2 + pad;
    const cy = height / 2 + pad;
    const a = width / 2;
    const b = height / 2;
    // Base outline: a superellipse, so it reads as a pill rather than an egg.
    const angles = Array.from({ length: points }, (_, i) => (i / points) * Math.PI * 2);
    const base = angles.map(t => Math.pow(Math.pow(Math.abs(Math.cos(t) / a), 4) + Math.pow(Math.abs(Math.sin(t) / b), 4), -1 / 4));
    const offset = angles.map(() => 0);
    const velocity = angles.map(() => 0);
    const pointer = { inside: false, angle: 0, near: 0 };
    let pressed = false;
    let visible = true;
    let frame = 0;
    let last = 0;
    let clock = 0;

    const draw = () => {
      const pts = angles.map((t, i) => {
        const r = base[i] + offset[i];
        return [cx + Math.cos(t) * r, cy + Math.sin(t) * r];
      });
      const d = smoothPath(pts);
      fillRef.current!.setAttribute('d', d);
      ringRef.current!.setAttribute('d', smoothPath(angles.map((t, i) => [cx + Math.cos(t) * (base[i] + offset[i] + 5), cy + Math.sin(t) * (base[i] + offset[i] + 5)])));
      // A drop shadow that squashes with the body.
      shadeRef.current!.setAttribute('d', d);
    };

    const target = (i: number) => {
      const t = angles[i];
      let goal = 0;
      if (pressed) goal += squash * (0.7 * Math.cos(t) ** 2 - Math.sin(t) ** 2);
      if (pointer.inside) {
        // Angular distance to the pointer's direction, folded to 0…π.
        const delta = Math.abs(((t - pointer.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        goal += bulge * pointer.near * Math.max(0, Math.cos(delta)) ** 6;
      }
      if (idle && !pressed) goal += 1.6 * Math.sin(clock * 2.2 + t * 3);
      return goal;
    };

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      clock += dt;
      let moving = false;
      for (let i = 0; i < points; i++) {
        const goal = target(i);
        for (let t = 0; t < dt; t += 1 / 240) {
          velocity[i] += (stiffness * (goal - offset[i]) - damping * velocity[i]) / 240;
          offset[i] += velocity[i] / 240;
        }
        if (Math.abs(goal - offset[i]) > 0.02 || Math.abs(velocity[i]) > 0.2) moving = true;
      }
      draw();
      frame = visible && (moving || idle) ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (reduced || frame || !visible) return;
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };

    const setPressed = (value: boolean) => {
      if (disabled) return;
      pressed = value;
      if (value) button.dataset.pressed = '';
      else {
        delete button.dataset.pressed;
        // Let go with a kick so it bounces past the rest shape.
        angles.forEach((t, i) => {
          velocity[i] += squash * 14 * (Math.sin(t) ** 2 - 0.5);
        });
      }
      wake();
    };
    const onMove = (event: PointerEvent) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      pointer.inside = true;
      pointer.angle = Math.atan2(y, x);
      // How close to the edge (1) versus the centre (0) the pointer is.
      pointer.near = Math.min(1, Math.hypot(x / (rect.width / 2), y / (rect.height / 2)));
      wake();
    };
    const onLeave = () => {
      pointer.inside = false;
      if (pressed) setPressed(false);
      wake();
    };
    const onDown = (event: PointerEvent) => {
      if (event.button === 0) setPressed(true);
    };
    const onUp = () => pressed && setPressed(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) setPressed(true);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') setPressed(false);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    });
    observer.observe(button);
    button.addEventListener('pointermove', onMove);
    button.addEventListener('pointerleave', onLeave);
    button.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    button.addEventListener('keydown', onKeyDown);
    button.addEventListener('keyup', onKeyUp);
    button.addEventListener('blur', onUp);
    draw();
    wake();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      button.removeEventListener('pointermove', onMove);
      button.removeEventListener('pointerleave', onLeave);
      button.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      button.removeEventListener('keydown', onKeyDown);
      button.removeEventListener('keyup', onKeyUp);
      button.removeEventListener('blur', onUp);
    };
  }, [width, height, points, bulge, squash, stiffness, damping, idle, disabled]);

  return (
    <button
      {...rest}
      ref={buttonRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`bl-jelly ${className}`}
      style={{ '--bl-w': `${width}px`, '--bl-h': `${height}px`, '--bl-color': color, '--bl-pressed': pressedColor, '--bl-ink': textColor, '--bl-accent': accentColor, '--bl-size': `${fontSize}px`, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <svg className="bl-jelly__blob" viewBox={`0 0 ${width + 32} ${height + 32}`} aria-hidden="true">
        <path ref={shadeRef} className="bl-jelly__shade" transform="translate(0 5)" />
        <path ref={fillRef} className="bl-jelly__fill" />
        <path ref={ringRef} className="bl-jelly__ring" />
      </svg>
      <span className="bl-jelly__label">{children}</span>
    </button>
  );
}
