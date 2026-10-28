import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A button for actions you shouldn't take by accident. Press and hold (or hold Space or Enter)
// and a fuse burns across it, spark and all; let go early and it rewinds. Hold to the end and
// it confirms, flashes, and shows a done label for a moment. Screen readers hear how to use it
// and when it's done. Reduced motion drops the spark and flash but keeps the hold.

const STYLE_ID = 'bl-hold-confirm';
const CSS = `
/* theme tokens */
.bl-hold { --bl-bg: #333c57; --bl-fill: #b13e53; --bl-fuse: #ef7d57; --bl-spark: #ffcd75; --bl-ink: #f4f4f4; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-hold, .bl-hold:where(.light, [data-theme="light"]) { --bl-bg: #ddd4c0; --bl-fuse: #c4502a; --bl-spark: #a86a12; --bl-ink: #1a1c2c; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-hold, :where(.light, [data-theme="light"]) .bl-hold:where(.dark, [data-theme="dark"]) { --bl-bg: #333c57; --bl-fill: #b13e53; --bl-fuse: #ef7d57; --bl-spark: #ffcd75; --bl-ink: #f4f4f4; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-hold, .bl-hold:where([data-theme="system"]) { --bl-bg: #ddd4c0; --bl-fuse: #c4502a; --bl-spark: #a86a12; --bl-ink: #1a1c2c; --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-hold { --p: 0; position: relative; display: inline-grid; place-items: center; min-width: var(--bl-w); height: var(--bl-h); padding: 0 22px; overflow: hidden; border: 0; border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); font: inherit; font-family: var(--bl-font); font-size: 15px; font-weight: 700; cursor: pointer; user-select: none; touch-action: none; box-shadow: inset 0 -4px 0 rgba(0,0,0,0.3); -webkit-tap-highlight-color: transparent; }
.bl-hold:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 3px; }
.bl-hold:disabled { cursor: not-allowed; opacity: 0.5; }
.bl-hold__fill { position: absolute; inset: 0; background: var(--bl-fill); transform: scaleX(var(--p)); transform-origin: left; }
.bl-hold__fuse { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: repeating-linear-gradient(90deg, var(--bl-fuse) 0 6px, transparent 6px 9px); }
.bl-hold__spark { position: absolute; bottom: -2px; left: calc(var(--p) * 100%); width: 8px; height: 8px; margin-left: -4px; background: var(--bl-spark); box-shadow: 4px -4px 0 var(--bl-spark), -4px -6px 0 var(--bl-fuse), 2px -10px 0 rgba(255,255,255,0.7); opacity: 0; animation: bl-hold-crackle 120ms steps(2) infinite; }
.bl-hold[data-state="holding"] .bl-hold__spark { opacity: 1; }
.bl-hold__label { position: relative; display: inline-flex; align-items: center; gap: 8px; }
.bl-hold[data-state="done"] { animation: bl-hold-flash 420ms steps(3); }
.bl-hold__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-hold-crackle { 50% { transform: translate(1px, -2px) scale(0.8); } }
@keyframes bl-hold-flash { 33% { filter: brightness(1.8); } }
@media (prefers-reduced-motion: reduce) { .bl-hold__spark { display: none; } .bl-hold[data-state="done"] { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface HoldToConfirmProps {
  /** Label while waiting. */
  children?: ReactNode;
  /** Label after confirming. */
  doneLabel?: ReactNode;
  /** Called once the fuse burns all the way. */
  onConfirm?: () => void;
  /** Hold time in ms. */
  duration?: number;
  /** How many times faster it rewinds when let go. */
  rewind?: number;
  /** How long the done state shows, in ms. */
  resetAfter?: number;
  disabled?: boolean;
  width?: number;
  height?: number;
  radius?: number;
  backgroundColor?: string;
  fillColor?: string;
  fuseColor?: string;
  sparkColor?: string;
  textColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function HoldToConfirm({
  children = 'Hold to delete',
  doneLabel = 'Done',
  onConfirm,
  duration = 1200,
  rewind = 2.5,
  resetAfter = 1600,
  disabled = false,
  width = 200,
  height = 52,
  radius = 10,
  backgroundColor,
  fillColor,
  fuseColor,
  sparkColor,
  textColor,
  accentColor,
  fontFamily = 'inherit',
  className = '',
  style
}: HoldToConfirmProps) {
  useStyles();
  const ref = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;
  const [state, setState] = useState('idle'); // idle | holding | done
  const [announce, setAnnounce] = useState('');
  const held = useRef(false);

  useEffect(() => {
    const el = ref.current!;
    let p = 0;
    let raf = 0;
    let last = 0;
    let done = false;
    let resetTimer = 0;
    const paint = () => el.style.setProperty('--p', p.toFixed(4));

    // Fill while held, rewind (faster) when let go; confirm at the end.
    const tick = (now: number) => {
      // Real time, not frame count: a slow or janky device shouldn't make the hold longer.
      const dt = Math.max(0, Math.min(0.25, (now - last) / 1000));
      last = now;
      p = held.current ? Math.min(1, p + (dt * 1000) / duration) : Math.max(0, p - ((dt * 1000) / duration) * rewind);
      paint();
      if (held.current && p >= 1 && !done) {
        done = true;
        held.current = false;
        setState('done');
        setAnnounce(`${typeof doneLabel === 'string' ? doneLabel : 'Done'}.`);
        confirmRef.current?.();
        resetTimer = setTimeout(() => {
          done = false;
          p = 0;
          paint();
          setState('idle');
          setAnnounce('');
        }, resetAfter);
        raf = 0;
        return;
      }
      raf = held.current || p > 0 ? requestAnimationFrame(tick) : 0;
      if (!raf) setState('idle');
    };
    const start = () => {
      if (done || el.disabled) return;
      held.current = true;
      setState('holding');
      if (!raf) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const stop = () => {
      if (!held.current) return;
      held.current = false;
      if (!raf && p > 0) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    const onDown = (event: PointerEvent) => {
      if (event.button > 0) return;
      el.setPointerCapture?.(event.pointerId);
      start();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
        event.preventDefault();
        start();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') stop();
    };
    // Block the native click so a quick tap never counts as a confirm.
    const onClick = (event: MouseEvent) => event.preventDefault();

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', stop);
    el.addEventListener('pointercancel', stop);
    el.addEventListener('lostpointercapture', stop);
    el.addEventListener('keydown', onKeyDown);
    el.addEventListener('keyup', onKeyUp);
    el.addEventListener('blur', stop);
    el.addEventListener('click', onClick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resetTimer);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', stop);
      el.removeEventListener('pointercancel', stop);
      el.removeEventListener('lostpointercapture', stop);
      el.removeEventListener('keydown', onKeyDown);
      el.removeEventListener('keyup', onKeyUp);
      el.removeEventListener('blur', stop);
      el.removeEventListener('click', onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, rewind, resetAfter]);

  return (
    <button
      ref={ref}
      type="button"
      className={`bl-hold ${className}`}
      data-state={state}
      disabled={disabled}
      style={{ '--bl-w': `${width}px`, '--bl-h': `${height}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-fill': fillColor, '--bl-fuse': fuseColor, '--bl-spark': sparkColor, '--bl-ink': textColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <span className="bl-hold__fill" aria-hidden="true" />
      <span className="bl-hold__fuse" aria-hidden="true" />
      <span className="bl-hold__spark" aria-hidden="true" />
      <span className="bl-hold__label">{state === 'done' ? doneLabel : children}</span>
      <span className="bl-hold__sr">{state === 'done' ? '' : ' (press and hold to confirm)'}</span>
      <span className="bl-hold__sr" aria-live="polite">
        {announce}
      </span>
    </button>
  );
}
