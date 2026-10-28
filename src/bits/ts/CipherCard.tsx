import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A card whose surface hides a field of scrambled characters. Under the pointer they show
// through a soft spotlight, tinted by a gradient, and reshuffle as you move, like the card
// is encrypting itself where you look. Your content sits on a badge in the middle. The
// cipher layer is decorative and stays still under reduced motion.

export interface CipherCardProps {
  /** Content on the center badge. */
  children?: ReactNode;
  charset?: string;
  /** How many characters fill the card. */
  density?: number;
  /** Reveal radius around the pointer, in px. */
  spotlight?: number;
  width?: number;
  aspectRatio?: string;
  radius?: number;
  gradient?: string;
  backgroundColor?: string;
  textColor?: string;
  charColor?: string;
  lineColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

const STYLE_ID = 'bl-cipher-card';
const CSS = `
.bl-cipher { position: relative; display: grid; place-items: center; width: var(--bl-w); max-width: 100%; aspect-ratio: var(--bl-ratio); overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-bg); box-shadow: 0 0 0 1px var(--bl-line); color: var(--bl-ink); font-family: var(--bl-font); }
.bl-cipher__glow { position: absolute; inset: 0; background: var(--bl-gradient); opacity: 0; transition: opacity 300ms; -webkit-mask-image: radial-gradient(var(--bl-r) circle at var(--bl-mx, 50%) var(--bl-my, 50%), #000 0%, transparent 100%); mask-image: radial-gradient(var(--bl-r) circle at var(--bl-mx, 50%) var(--bl-my, 50%), #000 0%, transparent 100%); }
.bl-cipher__chars { position: absolute; inset: 0; margin: 0; padding: 6px; overflow: hidden; color: var(--bl-char); font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; line-height: 1.2; word-break: break-all; white-space: normal; opacity: 0; transition: opacity 300ms; -webkit-mask-image: radial-gradient(var(--bl-r) circle at var(--bl-mx, 50%) var(--bl-my, 50%), #000 10%, transparent 100%); mask-image: radial-gradient(var(--bl-r) circle at var(--bl-mx, 50%) var(--bl-my, 50%), #000 10%, transparent 100%); user-select: none; }
.bl-cipher[data-active] .bl-cipher__glow { opacity: 0.55; }
.bl-cipher[data-active] .bl-cipher__chars { opacity: 1; }
.bl-cipher__badge { position: relative; z-index: 1; display: grid; place-items: center; min-width: 40%; aspect-ratio: 1; padding: 14px; box-sizing: border-box; border-radius: 50%; background: color-mix(in srgb, var(--bl-bg) 82%, transparent); box-shadow: 0 0 0 1px var(--bl-line); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); text-align: center; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789#$%&*+<>/=?@';
const scramble = (length: number, charset: string) => Array.from({ length }, () => charset[Math.floor(Math.random() * charset.length)]).join('');

export default function CipherCard({
  children,
  charset = CHARSET,
  density = 1800,
  spotlight = 160,
  width = 320,
  aspectRatio = '1',
  radius = 18,
  gradient = 'linear-gradient(135deg, #41a6f6, #73eff7 45%, #a7f070)',
  backgroundColor = '#0b0b14',
  textColor = '#f4f4f4',
  charColor = '#f4f4f4',
  lineColor = '#333c57',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: CipherCardProps) {
  useStyles();
  const ref = useRef<HTMLDivElement>(null);
  const [chars, setChars] = useState(() => scramble(density, charset));
  const [active, setActive] = useState(false);
  const last = useRef(0);

  useEffect(() => setChars(scramble(density, charset)), [density, charset]);

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const node = ref.current!;
    const rect = node.getBoundingClientRect();
    node.style.setProperty('--bl-mx', `${event.clientX - rect.left}px`);
    node.style.setProperty('--bl-my', `${event.clientY - rect.top}px`);
    // Reshuffle at most ~30 times a second, and not at all under reduced motion.
    const now = performance.now();
    if (now - last.current > 33 && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      last.current = now;
      setChars(scramble(density, charset));
    }
  };

  return (
    <div
      ref={ref}
      className={`bl-cipher ${className}`}
      data-active={active || undefined}
      onPointerMove={onMove}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      style={{
        '--bl-w': `${width}px`,
        '--bl-ratio': aspectRatio,
        '--bl-radius': `${radius}px`,
        '--bl-r': `${spotlight}px`,
        '--bl-gradient': gradient,
        '--bl-bg': backgroundColor,
        '--bl-ink': textColor,
        '--bl-char': charColor,
        '--bl-line': lineColor,
        '--bl-font': fontFamily,
        ...style
      } as CSSVars}
    >
      <div className="bl-cipher__glow" aria-hidden="true" />
      <p className="bl-cipher__chars" aria-hidden="true">
        {chars}
      </p>
      <div className="bl-cipher__badge">{children}</div>
    </div>
  );
}
