import { useCallback, useEffect, useInsertionEffect, useRef, useState, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Title-screen prompt: blinks until any key, click or tap, flashes, then hands off.
// It's a real button (focusable, Enter/Space), and optionally listens to any key on the page.

const STYLE_ID = 'bl-press-start-tw';
const CSS = `
@keyframes bl-ps-blink { 50% { opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface PressStartProps {
  /** Blinking prompt. */
  text?: string;
  /** Shown after the flash, until `resetAfter`. */
  startedText?: string;
  /** Small line underneath (copyright, version…). Empty to hide. */
  subtext?: string;
  color?: string;
  shadowColor?: string;
  subColor?: string;
  /** Prompt font size, in px. */
  size?: number;
  /** Blink period, in seconds. */
  blinkSpeed?: number;
  /** How long the fast "starting" flash lasts, in ms. */
  flashDuration?: number;
  /** Start on any key press anywhere on the page (ignored while typing in a field). */
  listenGlobally?: boolean;
  /** Return to the prompt after this many ms; 0 to stay started. */
  resetAfter?: number;
  fontFamily?: string;
  /** Called when the flash finishes. */
  onStart?: () => void;
  className?: string;
  style?: CSSProperties;
}

type State = 'idle' | 'starting' | 'started';

export default function PressStart({
  text = 'Press start',
  startedText = 'Get ready!',
  subtext = '© 2026 Bits Lab',
  color = '#ffcd75',
  shadowColor = '#b13e53',
  subColor = '#94b0c2',
  size = 28,
  blinkSpeed = 1.06,
  flashDuration = 700,
  listenGlobally = true,
  resetAfter = 2500,
  fontFamily,
  onStart,
  className = '',
  style
}: PressStartProps) {
  useStyles();
  const [state, setState] = useState<State>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const start = useCallback(() => {
    if (state !== 'idle') return;
    setState('starting');
    timers.current.push(
      setTimeout(() => {
        setState('started');
        onStart?.();
        if (resetAfter > 0) timers.current.push(setTimeout(() => setState('idle'), resetAfter));
      }, flashDuration)
    );
  }, [state, flashDuration, onStart, resetAfter]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Any key starts the game, unless the user is typing in a field.
  useEffect(() => {
    if (!listenGlobally) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat || event.metaKey || event.ctrlKey || /input|textarea|select/i.test((event.target as HTMLElement).tagName) || (event.target as HTMLElement).isContentEditable) return;
      start();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [listenGlobally, start]);

  return (
    <button
      type="button"
      className={`group/ps inline-flex cursor-pointer flex-col items-center gap-[18px] border-0 bg-none px-4 py-3 [font-family:var(--bl-font,'Press_Start_2P',ui-monospace,monospace)] focus-visible:outline-4 focus-visible:outline-offset-6 focus-visible:outline-[#41a6f6] focus-visible:outline-solid ${className}`}
      data-state={state}
      onClick={start}
      aria-live="polite"
      style={{
        '--bl-color': color,
        '--bl-shadow': shadowColor,
        '--bl-sub': subColor,
        '--bl-size': `${size}px`,
        '--bl-blink': `${blinkSpeed}s`,
        ...(fontFamily ? { '--bl-font': fontFamily } : null),
        ...style
      } as CSSVars}
    >
      <span className="text-(length:--bl-size) leading-[1.2] text-(--bl-color) uppercase [text-shadow:calc(var(--bl-size)/6)_calc(var(--bl-size)/6)_0_var(--bl-shadow)] group-data-[state=idle]/ps:animate-[bl-ps-blink_var(--bl-blink)_steps(1)_infinite] group-data-[state=starting]/ps:animate-[bl-ps-blink_90ms_steps(1)_infinite] motion-reduce:group-data-[state]/ps:animate-none">{state === 'started' ? startedText : text}</span>
      {subtext && <span className="[font-size:calc(var(--bl-size)*0.45)] tracking-[0.1em] text-(--bl-sub) uppercase">{subtext}</span>}
    </button>
  );
}
