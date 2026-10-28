import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A button for actions you shouldn't take by accident. Press and hold (or hold Space or Enter)
// and a fuse burns across it, spark and all; let go early and it rewinds. Hold to the end and
// it confirms, flashes, and shows a done label for a moment. Screen readers hear how to use it
// and when it's done. Reduced motion drops the spark and flash but keeps the hold.

const STYLE_ID = 'bl-hold-confirm-tw';
const CSS = `
/* theme tokens */
.bl-hold { --bl-bg: #333c57; --bl-fill: #b13e53; --bl-fuse: #ef7d57; --bl-spark: #ffcd75; --bl-ink: #f4f4f4; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-hold, .bl-hold:where(.light, [data-theme="light"]) { --bl-bg: #ddd4c0; --bl-fuse: #c4502a; --bl-spark: #a86a12; --bl-ink: #1a1c2c; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-hold, :where(.light, [data-theme="light"]) .bl-hold:where(.dark, [data-theme="dark"]) { --bl-bg: #333c57; --bl-fill: #b13e53; --bl-fuse: #ef7d57; --bl-spark: #ffcd75; --bl-ink: #f4f4f4; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-hold, .bl-hold:where([data-theme="system"]) { --bl-bg: #ddd4c0; --bl-fuse: #c4502a; --bl-spark: #a86a12; --bl-ink: #1a1c2c; --bl-accent: #167f8f; } }
/* theme tokens end */
@keyframes bl-hold-crackle { 50% { transform: translate(1px, -2px) scale(0.8); } }
@keyframes bl-hold-flash { 33% { filter: brightness(1.8); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
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
}) {
  useStyles();
  const ref = useRef(null);
  const confirmRef = useRef(onConfirm);
  confirmRef.current = onConfirm;
  const [state, setState] = useState('idle'); // idle | holding | done
  const [announce, setAnnounce] = useState('');
  const held = useRef(false);

  useEffect(() => {
    const el = ref.current;
    let p = 0;
    let raf = 0;
    let last = 0;
    let done = false;
    let resetTimer = 0;
    const paint = () => el.style.setProperty('--p', p.toFixed(4));

    // Fill while held, rewind (faster) when let go; confirm at the end.
    const tick = now => {
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
    const onDown = event => {
      if (event.button > 0) return;
      el.setPointerCapture?.(event.pointerId);
      start();
    };
    const onKeyDown = event => {
      if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
        event.preventDefault();
        start();
      }
    };
    const onKeyUp = event => {
      if (event.key === ' ' || event.key === 'Enter') stop();
    };
    // Block the native click so a quick tap never counts as a confirm.
    const onClick = event => event.preventDefault();

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
      className={`bl-hold group/hold relative inline-grid h-(--bl-h) min-w-(--bl-w) cursor-pointer touch-none place-items-center overflow-hidden rounded-(--bl-radius) border-0 bg-(--bl-bg) px-[22px] py-0 font-(family-name:--bl-font) text-[15px] font-bold text-(--bl-ink) shadow-[inset_0_-4px_0_rgba(0,0,0,0.3)] select-none [--p:0] [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-(--bl-accent) focus-visible:outline-solid disabled:cursor-not-allowed disabled:opacity-50 data-[state=done]:animate-[bl-hold-flash_420ms_steps(3)] motion-reduce:data-[state=done]:animate-none ${className}`}
      data-state={state}
      disabled={disabled}
      style={{ '--bl-w': `${width}px`, '--bl-h': `${height}px`, '--bl-radius': `${radius}px`, '--bl-bg': backgroundColor, '--bl-fill': fillColor, '--bl-fuse': fuseColor, '--bl-spark': sparkColor, '--bl-ink': textColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      <span className="absolute inset-0 origin-left bg-(--bl-fill) [transform:scaleX(var(--p))]" aria-hidden="true" />
      <span className="absolute right-0 bottom-0 left-0 h-1 bg-[repeating-linear-gradient(90deg,var(--bl-fuse)_0_6px,transparent_6px_9px)]" aria-hidden="true" />
      <span className="absolute -bottom-0.5 left-[calc(var(--p)_*_100%)] -ml-1 size-2 animate-[bl-hold-crackle_120ms_steps(2)_infinite] bg-(--bl-spark) opacity-0 shadow-[4px_-4px_0_var(--bl-spark),-4px_-6px_0_var(--bl-fuse),2px_-10px_0_rgba(255,255,255,0.7)] group-data-[state=holding]/hold:opacity-100 motion-reduce:hidden" aria-hidden="true" />
      <span className="relative inline-flex items-center gap-2">{state === 'done' ? doneLabel : children}</span>
      <span className="sr-only">{state === 'done' ? '' : ' (press and hold to confirm)'}</span>
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </button>
  );
}
