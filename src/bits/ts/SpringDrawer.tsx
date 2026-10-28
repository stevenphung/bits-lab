import { createContext, useContext, useEffect, useId, useInsertionEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type KeyboardEvent, type PointerEvent, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Bottom sheet or side drawer driven by a real spring. Drag it between snap points, flick it
// with velocity, or pull it down to dismiss. Drawers opened inside a drawer stack on top and
// push the parent back. Modal by default: focus trap, Esc closes the topmost, scroll lock,
// and focus returns to whatever opened it. The handle also works with arrow keys.

const STYLE_ID = 'bl-spring-drawer';
const CSS = `
.bl-drawer__backdrop { position: fixed; inset: 0; background: var(--bl-backdrop); opacity: 0; }
.bl-drawer__shell { position: fixed; display: flex; flex-direction: column; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); box-shadow: 0 0 0 1px var(--bl-line), 0 -20px 60px -20px rgba(0,0,0,0.6); outline: none; touch-action: none; will-change: transform; transition: filter 300ms; }
.bl-drawer[data-contained] .bl-drawer__backdrop, .bl-drawer[data-contained] .bl-drawer__shell { position: absolute; }
.bl-drawer[data-side="bottom"] .bl-drawer__shell { left: 0; right: 0; bottom: 0; max-width: var(--bl-max-w); margin: 0 auto; height: var(--bl-size); border-radius: var(--bl-radius) var(--bl-radius) 0 0; }
.bl-drawer[data-side="right"] .bl-drawer__shell { top: 0; bottom: 0; right: 0; width: var(--bl-size); max-width: 92%; border-radius: var(--bl-radius) 0 0 var(--bl-radius); }
.bl-drawer[data-side="left"] .bl-drawer__shell { top: 0; bottom: 0; left: 0; width: var(--bl-size); max-width: 92%; border-radius: 0 var(--bl-radius) var(--bl-radius) 0; }
.bl-drawer__shell[data-nested] { filter: brightness(0.7); }
.bl-drawer__handle { flex: 0 0 auto; display: grid; place-items: center; height: 28px; margin: 0; padding: 0; border: 0; background: transparent; cursor: grab; }
.bl-drawer__handle::before { content: ""; width: 44px; height: 5px; border-radius: var(--bl-pill); background: var(--bl-muted); opacity: 0.5; }
.bl-drawer__handle:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: -4px; }
.bl-drawer[data-side="right"] .bl-drawer__handle, .bl-drawer[data-side="left"] .bl-drawer__handle { position: absolute; top: 50%; width: 28px; height: 60px; transform: translateY(-50%); }
.bl-drawer[data-side="right"] .bl-drawer__handle { left: 0; }
.bl-drawer[data-side="left"] .bl-drawer__handle { right: 0; }
.bl-drawer[data-side="right"] .bl-drawer__handle::before, .bl-drawer[data-side="left"] .bl-drawer__handle::before { width: 5px; height: 44px; }
.bl-drawer__header { flex: 0 0 auto; padding: 4px 22px 10px; }
.bl-drawer[data-side="right"] .bl-drawer__header, .bl-drawer[data-side="left"] .bl-drawer__header { padding-top: 22px; }
.bl-drawer__title { margin: 0; font-size: 1.15em; font-weight: 700; }
.bl-drawer__desc { margin: 4px 0 0; color: var(--bl-muted); font-size: 0.92em; }
.bl-drawer__body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 8px 22px 22px; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

interface DrawerContextValue {
  host: HTMLElement | null;
  contained: boolean;
  setNested: (nested: boolean) => void;
}

interface Physics {
  x: number;
  v: number;
  target: number;
  frame: number;
  onRest: (() => void) | null;
}

interface DragState {
  id: number;
  start: number;
  origin: number;
  samples: [number, number][];
  moved: boolean;
  inBody: boolean | undefined;
}

export interface SpringDrawerProps {
  /** Controlled open state. */
  open: boolean;
  /** Drag-to-close, Esc and the backdrop call this with false. */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
  /** Heading; also the dialog's accessible name. */
  title?: ReactNode;
  /** Wired up as the dialog's accessible description. */
  description?: ReactNode;
  side?: 'bottom' | 'right' | 'left';
  /** Bottom only: open heights as fractions of the viewport (or container). */
  snapPoints?: number[];
  /** Index into the sorted snap points to open at. */
  defaultSnap?: number;
  /** Side drawers: width, in px. */
  size?: number;
  /** Bottom sheet max width, in px. */
  maxWidth?: number;
  /** Allow closing by drag, Esc and backdrop. */
  dismissible?: boolean;
  /** Render inside the parent element instead of the window. Nested drawers inherit it. */
  contained?: boolean;
  /** Spring stiffness. */
  stiffness?: number;
  /** Damping ratio: below 1 bounces, 1 is critically damped. */
  damping?: number;
  radius?: number;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  accentColor?: string;
  backdropColor?: string;
  fontFamily?: string;
  className?: string;
}

const DrawerContext = createContext<DrawerContextValue | null>(null);
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function SpringDrawer({
  open,
  onOpenChange,
  children,
  title,
  description,
  side = 'bottom',
  snapPoints = [0.5, 0.92],
  defaultSnap = 0,
  size = 380,
  maxWidth = 720,
  dismissible = true,
  contained = false,
  stiffness = 520,
  damping = 0.82,
  radius = 20,
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = 'rgba(255,255,255,0.1)',
  accentColor = '#73eff7',
  backdropColor = 'rgba(8,8,16,0.6)',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = ''
}: SpringDrawerProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const parent = useContext(DrawerContext);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [nested, setNested] = useState(false);
  const physics = useRef<Physics>({ x: 0, v: 0, target: 0, frame: 0, onRest: null });
  const geometry = useRef({ snaps: [0], closed: 1, full: 1 });
  const [snapIndex, setSnapIndex] = useState(defaultSnap);
  const opener = useRef<HTMLElement | null>(null);
  const isContained = parent ? parent.contained : contained;
  const bottom = side === 'bottom';
  const sign = side === 'left' ? -1 : 1;

  const request = (next: boolean) => onOpenChange?.(next);
  // Stable, so nested drawers' effects don't re-run (and reset `nested`) on every render.
  const childContext = useMemo<DrawerContextValue>(() => ({ host, contained: isContained, setNested }), [host, isContained]);

  useLayoutEffect(() => {
    setHost((parent?.host ?? (contained ? anchorRef.current?.parentElement : document.body)) as HTMLElement | null);
  }, [parent, contained]);

  // Snap offsets: distance (px) from fully open toward closed, along the drawer's axis.
  const measure = () => {
    const box = isContained ? host : null;
    const viewH = box ? box.clientHeight : window.innerHeight;
    const viewW = box ? box.clientWidth : window.innerWidth;
    if (bottom) {
      const points = [...snapPoints].sort((a, b) => a - b);
      const full = Math.max(...points) * viewH;
      geometry.current = { full, closed: full, snaps: points.map(p => full - p * viewH) };
    } else {
      const full = Math.min(size, viewW * 0.92);
      geometry.current = { full, closed: full, snaps: [0] };
    }
    shellRef.current?.style.setProperty('--bl-size', `${geometry.current.full}px`);
  };

  const apply = () => {
    const { x } = physics.current;
    const { closed, snaps } = geometry.current;
    const shell = shellRef.current;
    if (!shell) return;
    const pushed = nestedRef.current ? (bottom ? ' scale(0.94) translateY(-14px)' : ' scale(0.96)') : '';
    shell.style.transform = bottom ? `translate3d(0, ${x}px, 0)${pushed}` : `translate3d(${sign * x}px, 0, 0)${pushed}`;
    const openAmount = 1 - Math.min(1, Math.max(0, (x - Math.min(...snaps)) / Math.max(1, closed - Math.min(...snaps))));
    if (backdropRef.current) backdropRef.current.style.opacity = String(openAmount);
  };
  const nestedRef = useRef(false);
  nestedRef.current = nested;

  const springTo = (target: number, velocity = physics.current.v, onRest: (() => void) | null = null) => {
    const p = physics.current;
    p.target = target;
    p.v = velocity;
    p.onRest = onRest;
    cancelAnimationFrame(p.frame);
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      p.x = target;
      p.v = 0;
      apply();
      onRest?.();
      return;
    }
    const critical = 2 * Math.sqrt(stiffness);
    let last = performance.now();
    const step = (now: number) => {
      // Follow real time even when frames are slow, in small fixed substeps for stability.
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      const steps = Math.max(1, Math.ceil(dt / 0.004));
      for (let i = 0; i < steps; i++) {
        const h = dt / steps;
        const force = -stiffness * (p.x - p.target) - critical * damping * p.v;
        p.v += force * h;
        p.x += p.v * h;
      }
      apply();
      if (Math.abs(p.x - p.target) < 0.4 && Math.abs(p.v) < 8) {
        p.x = p.target;
        p.v = 0;
        apply();
        p.frame = 0;
        const done = p.onRest;
        p.onRest = null;
        done?.();
        return;
      }
      p.frame = requestAnimationFrame(step);
    };
    p.frame = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (open) {
      opener.current = document.activeElement as HTMLElement | null;
      setSnapIndex(Math.min(defaultSnap, (bottom ? snapPoints.length : 1) - 1));
      setMounted(true);
    } else if (mounted) {
      springTo(geometry.current.closed, physics.current.v, () => {
        setMounted(false);
        opener.current?.focus?.({ preventScroll: true });
      });
    }
    parent?.setNested(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => parent?.setNested(false), [parent]);

  // On mount: start closed, spring to the first snap, move focus in, lock page scroll.
  useLayoutEffect(() => {
    if (!mounted || !host) return;
    measure();
    physics.current.x = geometry.current.closed;
    apply();
    springTo(geometry.current.snaps[Math.min(snapIndex, geometry.current.snaps.length - 1)], 0);
    shellRef.current!.focus({ preventScroll: true });
    let unlock = () => {};
    if (!isContained && !parent) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      unlock = () => (document.body.style.overflow = previous);
    }
    const onResize = () => {
      measure();
      springTo(geometry.current.snaps[Math.min(snapIndexRef.current, geometry.current.snaps.length - 1)]);
    };
    window.addEventListener('resize', onResize);
    return () => {
      unlock();
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(physics.current.frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, host]);

  const snapIndexRef = useRef(snapIndex);
  snapIndexRef.current = snapIndex;

  useEffect(() => {
    if (mounted) apply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nested]);

  const goToSnap = (index: number) => {
    const { snaps } = geometry.current;
    if (index < 0) {
      if (dismissible) request(false);
      return;
    }
    const clamped = Math.min(snaps.length - 1, index);
    setSnapIndex(clamped);
    springTo(snaps[clamped]);
  };

  // ---------- Dragging ----------
  const drag = useRef<DragState | null>(null);
  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button > 0 || (event.target as Element).closest('input, textarea, select, a, [data-no-drag]')) return;
    const inBody = bodyRef.current?.contains(event.target as Node);
    if (inBody && bodyRef.current!.scrollTop > 0) return;
    if ((event.target as Element).closest('button') && !(event.target as Element).closest('.bl-drawer__handle')) return;
    cancelAnimationFrame(physics.current.frame);
    drag.current = { id: event.pointerId, start: bottom ? event.clientY : event.clientX, origin: physics.current.x, samples: [], moved: false, inBody };
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || event.pointerId !== d.id) return;
    const pos = bottom ? event.clientY : event.clientX;
    let delta = (pos - d.start) * (bottom ? 1 : sign);
    if (!d.moved) {
      if (Math.abs(delta) < 4) return;
      // Inside scrollable content, only an initial pull toward closed starts a drag.
      if (d.inBody && delta < 0 && bodyRef.current!.scrollHeight > bodyRef.current!.clientHeight) {
        drag.current = null;
        return;
      }
      d.moved = true;
      try {
        shellRef.current!.setPointerCapture(event.pointerId);
      } catch {
        // The pointer may already be gone; the drag still works without capture.
      }
    }
    let x = d.origin + delta;
    const min = Math.min(...geometry.current.snaps);
    if (x < min) x = min - Math.pow(min - x, 0.7); // rubber band past the top snap
    if (!dismissible && x > geometry.current.snaps[0]) x = geometry.current.snaps[0] + Math.pow(x - geometry.current.snaps[0], 0.7);
    physics.current.x = x;
    d.samples.push([performance.now(), x]);
    if (d.samples.length > 5) d.samples.shift();
    apply();
  };
  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) return;
    if (shellRef.current!.hasPointerCapture?.(event.pointerId)) shellRef.current!.releasePointerCapture(event.pointerId);
    const [first, last] = [d.samples[0], d.samples[d.samples.length - 1]];
    const velocity = first && last && last[0] > first[0] ? ((last[1] - first[1]) / (last[0] - first[0])) * 1000 : 0;
    const projected = physics.current.x + velocity * 0.2;
    const { snaps, closed } = geometry.current;
    const candidates = snaps.map((x, i) => ({ x, i }));
    if (dismissible) candidates.push({ x: closed, i: -1 });
    const best = candidates.reduce((a, b) => (Math.abs(b.x - projected) < Math.abs(a.x - projected) ? b : a));
    physics.current.v = velocity;
    if (best.i === -1) request(false);
    else {
      setSnapIndex(best.i);
      springTo(best.x, velocity);
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && dismissible) {
      event.stopPropagation();
      request(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const items = [...shellRef.current!.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => !el.closest('[inert]'));
    if (!items.length) return event.preventDefault();
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === shellRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const onHandleKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!bottom) return;
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      goToSnap(snapIndex + 1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      goToSnap(snapIndex - 1);
    }
  };

  const snapCount = bottom ? snapPoints.length : 1;
  const content = mounted && host && (
    <div
      className={`bl-drawer ${className}`}
      data-side={side}
      data-contained={isContained || undefined}
      style={{
        position: isContained ? 'absolute' : 'fixed',
        inset: 0,
        zIndex: 1200,
        pointerEvents: 'none',
        '--bl-radius': `${radius}px`,
        '--bl-pill': radius ? '999px' : '0',
        '--bl-bg': backgroundColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-backdrop': backdropColor,
        '--bl-font': fontFamily,
        '--bl-max-w': `${maxWidth}px`,
        overflow: 'hidden'
      } as CSSVars}
    >
      <div ref={backdropRef} className="bl-drawer__backdrop" style={{ pointerEvents: 'auto' }} onClick={() => dismissible && request(false)} aria-hidden="true" />
      <div
        ref={shellRef}
        className="bl-drawer__shell"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? `${uid}-title` : undefined}
        aria-describedby={description ? `${uid}-desc` : undefined}
        tabIndex={-1}
        data-nested={nested || undefined}
        inert={nested ? true : undefined}
        style={{ pointerEvents: 'auto' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <button
          type="button"
          className="bl-drawer__handle"
          aria-label={bottom && snapCount > 1 ? `Resize drawer (position ${snapIndex + 1} of ${snapCount}). Use up and down arrows.` : 'Drag to close'}
          onKeyDown={onHandleKey}
          onClick={() => bottom && snapCount > 1 && goToSnap((snapIndex + 1) % snapCount)}
        />
        {(title || description) && (
          <div className="bl-drawer__header">
            {title && (
              <h2 id={`${uid}-title`} className="bl-drawer__title">
                {title}
              </h2>
            )}
            {description && (
              <p id={`${uid}-desc`} className="bl-drawer__desc">
                {description}
              </p>
            )}
          </div>
        )}
        <div ref={bodyRef} className="bl-drawer__body">
          <DrawerContext.Provider value={childContext}>{children}</DrawerContext.Provider>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <span ref={anchorRef} hidden />
      {content && createPortal(content, host)}
    </>
  );
}
