import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
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
      className={`group/cipher relative grid aspect-(--bl-ratio) w-(--bl-w) max-w-full place-items-center overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) font-(family-name:--bl-font) text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line)] ${className}`}
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
      <div className="absolute inset-0 bg-(image:--bl-gradient) opacity-0 transition-opacity duration-300 ease-[ease] [mask-image:radial-gradient(var(--bl-r)_circle_at_var(--bl-mx,50%)_var(--bl-my,50%),#000_0%,transparent_100%)] group-data-[active]/cipher:opacity-55" aria-hidden="true" />
      <p className="absolute inset-0 m-0 overflow-hidden p-1.5 font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[11px] leading-[1.2] break-all whitespace-normal text-(--bl-char) opacity-0 transition-opacity duration-300 ease-[ease] select-none [mask-image:radial-gradient(var(--bl-r)_circle_at_var(--bl-mx,50%)_var(--bl-my,50%),#000_10%,transparent_100%)] group-data-[active]/cipher:opacity-100" aria-hidden="true">
        {chars}
      </p>
      <div className="relative z-1 box-border grid aspect-square min-w-[40%] place-items-center rounded-[50%] bg-[color-mix(in_srgb,var(--bl-bg)_82%,transparent)] p-3.5 text-center shadow-[0_0_0_1px_var(--bl-line)] backdrop-blur-[6px]">{children}</div>
    </div>
  );
}
