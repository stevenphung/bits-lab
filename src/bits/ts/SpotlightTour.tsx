import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A product tour. Everything dims except the element being explained, and that spotlight
// glides from target to target while a bubble with the step's title and text springs into
// place beside it. Back / Next / Skip, progress dots, arrow keys and Esc. Targets are CSS
// selectors or refs; each is scrolled into view first. The bubble is a modal dialog that
// keeps focus while the tour runs and hands it back when it ends.

export type TourSide = 'top' | 'bottom' | 'left' | 'right';

export interface TourStep {
  /** A CSS selector or a ref; without one the bubble centres on screen. */
  target?: string | RefObject<Element | null>;
  title: ReactNode;
  body?: ReactNode;
  /** Preferred side for the bubble. */
  side?: TourSide;
}

export interface SpotlightTourProps {
  steps?: TourStep[];
  open?: boolean;
  /** Whether the user finished (true) or skipped (false). */
  onClose?: (completed: boolean) => void;
  onStepChange?: (index: number) => void;
  startAt?: number;
  /** Space around the target inside the spotlight. */
  padding?: number;
  radius?: number;
  /** Distance between spotlight and bubble. */
  gap?: number;
  width?: number;
  closeOnBackdrop?: boolean;
  backLabel?: string;
  nextLabel?: string;
  doneLabel?: string;
  skipLabel?: string;
  dimColor?: string;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  accentColor?: string;
  onAccentColor?: string;
  fontFamily?: string;
}

const STYLE_ID = 'bl-spotlight-tour';
const CSS = `
.bl-tour { position: fixed; inset: 0; z-index: 1950; font-family: var(--bl-font); }
.bl-tour__shade { position: fixed; inset: 0; }
.bl-tour__hole { position: fixed; top: 0; left: 0; border-radius: var(--bl-radius); box-shadow: 0 0 0 2px var(--bl-accent), 0 0 0 200vmax var(--bl-dim); pointer-events: none; transition: transform 420ms cubic-bezier(.3,1.2,.5,1), width 420ms cubic-bezier(.3,1.2,.5,1), height 420ms cubic-bezier(.3,1.2,.5,1); animation: bl-tour-in 260ms ease both; }
.bl-tour__hole[data-none] { width: 0 !important; height: 0 !important; box-shadow: 0 0 0 200vmax var(--bl-dim); }
.bl-tour__bubble { position: fixed; top: 0; left: 0; width: min(var(--bl-w), calc(100vw - 24px)); box-sizing: border-box; padding: 18px; border-radius: 14px; background: var(--bl-bg); color: var(--bl-ink); box-shadow: 0 0 0 1px var(--bl-line), 0 24px 60px -24px rgba(0,0,0,0.9); outline: none; transition: transform 420ms cubic-bezier(.3,1.2,.5,1); }
.bl-tour__card { animation: bl-tour-card 360ms cubic-bezier(.3,1.4,.5,1) both; }
.bl-tour__step { color: var(--bl-accent); font-size: 12px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.bl-tour__title { margin: 6px 0 6px; font-size: 17px; font-weight: 700; line-height: 1.3; }
.bl-tour__body { margin: 0; color: var(--bl-muted); font-size: 14px; line-height: 1.55; }
.bl-tour__foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; }
.bl-tour__dots { display: flex; gap: 6px; }
.bl-tour__dots i { width: 7px; height: 7px; border-radius: 50%; background: var(--bl-line); transition: width 240ms, background-color 240ms; }
.bl-tour__dots i[data-on] { width: 18px; border-radius: 4px; background: var(--bl-accent); }
.bl-tour__btns { display: flex; gap: 8px; }
.bl-tour__btn { padding: 8px 14px; border: 0; border-radius: 8px; background: transparent; color: var(--bl-muted); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.bl-tour__btn:hover { color: var(--bl-ink); }
.bl-tour__btn[data-primary] { background: var(--bl-accent); color: var(--bl-on-accent); }
.bl-tour__btn[data-primary]:hover { filter: brightness(1.12); }
.bl-tour__btn:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-tour__close { position: absolute; top: 10px; right: 10px; display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: var(--bl-muted); cursor: pointer; }
.bl-tour__close:hover { color: var(--bl-ink); background: var(--bl-line); }
.bl-tour__close:focus-visible { outline: 2px solid var(--bl-accent); }
@keyframes bl-tour-in { from { opacity: 0; } }
@keyframes bl-tour-card { from { opacity: 0; transform: translateY(8px) scale(0.96); } }
@media (prefers-reduced-motion: reduce) { .bl-tour__hole, .bl-tour__bubble { transition: none; } .bl-tour__card { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const resolve = (target: TourStep['target']): Element | null => (typeof target === 'string' ? document.querySelector(target) : target?.current ?? null);
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function SpotlightTour({
  steps = [],
  open = false,
  onClose,
  onStepChange,
  startAt = 0,
  padding = 8,
  radius = 12,
  gap = 14,
  width = 320,
  closeOnBackdrop = false,
  backLabel = 'Back',
  nextLabel = 'Next',
  doneLabel = 'Done',
  skipLabel = 'Skip tour',
  dimColor = 'rgba(8,8,16,0.68)',
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = '#333c57',
  accentColor = '#73eff7',
  onAccentColor = '#0b0b14',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif'
}: SpotlightTourProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [index, setIndex] = useState(startAt);
  const [hole, setHole] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [bubblePos, setBubblePos] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<Element | null>(null);
  const step = steps[index];
  const last = index === steps.length - 1;

  useEffect(() => {
    if (open) {
      returnFocus.current = document.activeElement;
      setIndex(startAt);
    }
  }, [open, startAt]);

  const finish = (completed: boolean) => {
    onClose?.(completed);
    const back = returnFocus.current;
    if (back instanceof HTMLElement) setTimeout(() => back.focus({ preventScroll: true }), 0);
  };

  const go = (next: number) => {
    if (next < 0 || next >= steps.length) return;
    setIndex(next);
    onStepChange?.(next);
  };

  // Bring the target into view, then follow it (scrolls, resizes) while the step shows.
  useLayoutEffect(() => {
    if (!open || !step) return undefined;
    const el = resolve(step.target);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el?.scrollIntoView?.({ block: 'center', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
    let frame = 0;
    const place = () => {
      frame = 0;
      const bubble = bubbleRef.current;
      const bw = bubble?.offsetWidth ?? width;
      const bh = bubble?.offsetHeight ?? 160;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      if (!el) {
        setHole(null);
        setBubblePos({ x: (vw - bw) / 2, y: (vh - bh) / 2 });
        return;
      }
      const r = el.getBoundingClientRect();
      const box = { x: r.left - padding, y: r.top - padding, w: r.width + padding * 2, h: r.height + padding * 2 };
      setHole(box);
      // Prefer the requested side, then whichever side has the most room.
      const room: Record<TourSide, number> = { bottom: vh - (box.y + box.h), top: box.y, right: vw - (box.x + box.w), left: box.x };
      const fits = (side: TourSide) => (side === 'top' || side === 'bottom' ? room[side] >= bh + gap + 8 : room[side] >= bw + gap + 8);
      const side = step.side && fits(step.side) ? step.side : (['bottom', 'top', 'right', 'left'] as TourSide[]).find(fits) ?? 'bottom';
      let x = side === 'right' ? box.x + box.w + gap : side === 'left' ? box.x - bw - gap : box.x + box.w / 2 - bw / 2;
      let y = side === 'bottom' ? box.y + box.h + gap : side === 'top' ? box.y - bh - gap : box.y + box.h / 2 - bh / 2;
      x = Math.max(12, Math.min(vw - bw - 12, x));
      y = Math.max(12, Math.min(vh - bh - 12, y));
      setBubblePos({ x, y });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(place);
    };
    place();
    window.addEventListener('scroll', schedule, true);
    window.addEventListener('resize', schedule);
    const resize = new ResizeObserver(schedule);
    if (el) resize.observe(el);
    if (bubbleRef.current) resize.observe(bubbleRef.current);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule, true);
      window.removeEventListener('resize', schedule);
      resize.disconnect();
    };
  }, [open, step, padding, gap, width]);

  // Focus the bubble on every step; keep Tab inside it; arrows and Esc drive the tour.
  useEffect(() => {
    if (!open) return undefined;
    bubbleRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        finish(false);
      } else if (event.key === 'ArrowRight') {
        if (last) finish(true);
        else go(index + 1);
      } else if (event.key === 'ArrowLeft') {
        go(index - 1);
      } else if (event.key === 'Tab') {
        const items = [...(bubbleRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])];
        if (!items.length) return;
        const first = items[0];
        const end = items[items.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === bubbleRef.current)) {
          event.preventDefault();
          end.focus();
        } else if (!event.shiftKey && document.activeElement === end) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, index]);

  if (!open || !step) return null;

  const vars: CSSVars = {
    '--bl-dim': dimColor,
    '--bl-radius': `${radius}px`,
    '--bl-w': `${width}px`,
    '--bl-bg': backgroundColor,
    '--bl-ink': textColor,
    '--bl-muted': mutedColor,
    '--bl-line': lineColor,
    '--bl-accent': accentColor,
    '--bl-on-accent': onAccentColor,
    '--bl-font': fontFamily
  };

  return createPortal(
    <div className="bl-tour" style={vars}>
      <div className="bl-tour__shade" onClick={() => closeOnBackdrop && finish(false)} />
      <div
        className="bl-tour__hole"
        data-none={!hole || undefined}
        style={hole ? { width: hole.w, height: hole.h, transform: `translate(${hole.x}px, ${hole.y}px)` } : { transform: `translate(50vw, 50vh)` }}
        aria-hidden="true"
      />
      <div
        ref={bubbleRef}
        className="bl-tour__bubble"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        aria-describedby={`${uid}-body`}
        tabIndex={-1}
        style={{ transform: `translate(${bubblePos.x}px, ${bubblePos.y}px)` }}
      >
        <div key={index} className="bl-tour__card">
          <div className="bl-tour__step">
            Step {index + 1} of {steps.length}
          </div>
          <h2 id={`${uid}-title`} className="bl-tour__title">
            {step.title}
          </h2>
          <div id={`${uid}-body`} className="bl-tour__body">
            {step.body}
          </div>
          <div className="bl-tour__foot">
            <span className="bl-tour__dots" aria-hidden="true">
              {steps.map((_, i) => (
                <i key={i} data-on={i === index || undefined} />
              ))}
            </span>
            <span className="bl-tour__btns">
              {index > 0 && (
                <button type="button" className="bl-tour__btn" onClick={() => go(index - 1)}>
                  {backLabel}
                </button>
              )}
              <button type="button" className="bl-tour__btn" data-primary="" onClick={() => (last ? finish(true) : go(index + 1))}>
                {last ? doneLabel : nextLabel}
              </button>
            </span>
          </div>
        </div>
        <button type="button" className="bl-tour__close" aria-label={skipLabel} onClick={() => finish(false)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M2 2l8 8M10 2 2 10" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}
