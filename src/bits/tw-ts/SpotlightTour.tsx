import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
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

const STYLE_ID = 'bl-spotlight-tour-tw';
const CSS = `
@keyframes bl-tour-in { from { opacity: 0; } }
@keyframes bl-tour-card { from { opacity: 0; transform: translateY(8px) scale(0.96); } }
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
    <div className="fixed inset-0 z-1950 font-(family-name:--bl-font)" style={vars}>
      <div className="fixed inset-0" onClick={() => closeOnBackdrop && finish(false)} />
      <div
        className="pointer-events-none fixed top-0 left-0 animate-[bl-tour-in_260ms_ease_both] rounded-(--bl-radius) shadow-[0_0_0_2px_var(--bl-accent),0_0_0_200vmax_var(--bl-dim)] [transition:transform_420ms_cubic-bezier(.3,1.2,.5,1),width_420ms_cubic-bezier(.3,1.2,.5,1),height_420ms_cubic-bezier(.3,1.2,.5,1)] data-[none]:h-0! data-[none]:w-0! data-[none]:shadow-[0_0_0_200vmax_var(--bl-dim)] motion-reduce:[transition:none]"
        data-none={!hole || undefined}
        style={hole ? { width: hole.w, height: hole.h, transform: `translate(${hole.x}px, ${hole.y}px)` } : { transform: `translate(50vw, 50vh)` }}
        aria-hidden="true"
      />
      <div
        ref={bubbleRef}
        className="fixed top-0 left-0 box-border w-[min(var(--bl-w),calc(100vw_-_24px))] rounded-[14px] bg-(--bl-bg) p-[18px] text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line),0_24px_60px_-24px_rgba(0,0,0,0.9)] outline-none [transition:transform_420ms_cubic-bezier(.3,1.2,.5,1)] motion-reduce:[transition:none]"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        aria-describedby={`${uid}-body`}
        tabIndex={-1}
        style={{ transform: `translate(${bubblePos.x}px, ${bubblePos.y}px)` }}
      >
        <div key={index} className="animate-[bl-tour-card_360ms_cubic-bezier(.3,1.4,.5,1)_both] motion-reduce:animate-none">
          <div className="text-[12px] font-bold tracking-[0.04em] text-(--bl-accent) uppercase">
            Step {index + 1} of {steps.length}
          </div>
          <h2 id={`${uid}-title`} className="my-1.5 text-[17px] leading-[1.3] font-bold">
            {step.title}
          </h2>
          <div id={`${uid}-body`} className="m-0 text-[14px] leading-[1.55] text-(--bl-muted)">
            {step.body}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="flex gap-1.5 *:size-[7px] *:rounded-[50%] *:bg-(--bl-line) *:[transition:width_240ms,background-color_240ms] *:data-[on]:w-[18px] *:data-[on]:rounded-[4px] *:data-[on]:bg-(--bl-accent)" aria-hidden="true">
              {steps.map((_, i) => (
                <i key={i} data-on={i === index || undefined} />
              ))}
            </span>
            <span className="flex gap-2">
              {index > 0 && (
                <button type="button" className="cursor-pointer rounded-[8px] border-0 bg-transparent px-3.5 py-2 text-[14px] font-semibold text-(--bl-muted) not-data-[primary]:hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) data-[primary]:bg-(--bl-accent) data-[primary]:text-(--bl-on-accent) data-[primary]:hover:[filter:brightness(1.12)]" onClick={() => go(index - 1)}>
                  {backLabel}
                </button>
              )}
              <button type="button" className="cursor-pointer rounded-[8px] border-0 bg-transparent px-3.5 py-2 text-[14px] font-semibold text-(--bl-muted) not-data-[primary]:hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) data-[primary]:bg-(--bl-accent) data-[primary]:text-(--bl-on-accent) data-[primary]:hover:[filter:brightness(1.12)]" data-primary="" onClick={() => (last ? finish(true) : go(index + 1))}>
                {last ? doneLabel : nextLabel}
              </button>
            </span>
          </div>
        </div>
        <button type="button" className="absolute top-2.5 right-2.5 grid size-7 cursor-pointer place-items-center rounded-[50%] border-0 bg-transparent p-0 text-(--bl-muted) hover:bg-(--bl-line) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" aria-label={skipLabel} onClick={() => finish(false)}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M2 2l8 8M10 2 2 10" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}
