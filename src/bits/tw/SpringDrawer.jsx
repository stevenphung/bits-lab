import { createContext, useContext, useEffect, useId, useInsertionEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const STYLE_ID = 'bl-spring-drawer-tw';
const CSS = `
/* theme tokens */
.bl-drawer { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: rgba(255,255,255,0.1); --bl-accent: #73eff7; --bl-backdrop: rgba(8,8,16,0.6); }
:where(.light, [data-theme="light"]) .bl-drawer, .bl-drawer:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: rgba(26,28,44,0.1); --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-drawer, :where(.light, [data-theme="light"]) .bl-drawer:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: rgba(255,255,255,0.1); --bl-accent: #73eff7; --bl-backdrop: rgba(8,8,16,0.6); }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-drawer, .bl-drawer:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: rgba(26,28,44,0.1); --bl-accent: #167f8f; } }
/* theme tokens end */
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Bottom sheet or side drawer driven by a real spring. Drag it between snap points, flick it
// with velocity, or pull it down to dismiss. Drawers opened inside a drawer stack on top and
// push the parent back. Modal by default: focus trap, Esc closes the topmost, scroll lock,
// and focus returns to whatever opened it. The handle also works with arrow keys.

const DrawerContext = createContext(null);
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
  backgroundColor,
  textColor,
  mutedColor,
  lineColor,
  accentColor,
  backdropColor,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = ''
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const parent = useContext(DrawerContext);
  const anchorRef = useRef(null);
  const shellRef = useRef(null);
  const backdropRef = useRef(null);
  const bodyRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [host, setHost] = useState(null);
  const [nested, setNested] = useState(false);
  const physics = useRef({ x: 0, v: 0, target: 0, frame: 0, onRest: null });
  const geometry = useRef({ snaps: [0], closed: 1, full: 1 });
  const [snapIndex, setSnapIndex] = useState(defaultSnap);
  const opener = useRef(null);
  const isContained = parent ? parent.contained : contained;
  const bottom = side === 'bottom';
  const sign = side === 'left' ? -1 : 1;

  const request = next => onOpenChange?.(next);
  // Stable, so nested drawers' effects don't re-run (and reset `nested`) on every render.
  const childContext = useMemo(() => ({ host, contained: isContained, setNested }), [host, isContained]);

  useLayoutEffect(() => {
    setHost(parent?.host ?? (contained ? anchorRef.current?.parentElement : document.body));
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

  const springTo = (target, velocity = physics.current.v, onRest = null) => {
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
    const step = now => {
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
      opener.current = document.activeElement;
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
    shellRef.current.focus({ preventScroll: true });
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

  const goToSnap = index => {
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
  const drag = useRef(null);
  const onPointerDown = event => {
    if (event.button > 0 || event.target.closest('input, textarea, select, a, [data-no-drag]')) return;
    const inBody = bodyRef.current?.contains(event.target);
    if (inBody && bodyRef.current.scrollTop > 0) return;
    if (event.target.closest('button') && !event.target.closest('.bl-drawer__handle')) return;
    cancelAnimationFrame(physics.current.frame);
    drag.current = { id: event.pointerId, start: bottom ? event.clientY : event.clientX, origin: physics.current.x, samples: [], moved: false, inBody };
  };
  const onPointerMove = event => {
    const d = drag.current;
    if (!d || event.pointerId !== d.id) return;
    const pos = bottom ? event.clientY : event.clientX;
    let delta = (pos - d.start) * (bottom ? 1 : sign);
    if (!d.moved) {
      if (Math.abs(delta) < 4) return;
      // Inside scrollable content, only an initial pull toward closed starts a drag.
      if (d.inBody && delta < 0 && bodyRef.current.scrollHeight > bodyRef.current.clientHeight) {
        drag.current = null;
        return;
      }
      d.moved = true;
      try {
        shellRef.current.setPointerCapture(event.pointerId);
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
  const onPointerUp = event => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) return;
    if (shellRef.current.hasPointerCapture?.(event.pointerId)) shellRef.current.releasePointerCapture(event.pointerId);
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

  const onKeyDown = event => {
    if (event.key === 'Escape' && dismissible) {
      event.stopPropagation();
      request(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const items = [...shellRef.current.querySelectorAll(FOCUSABLE)].filter(el => !el.closest('[inert]'));
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

  const onHandleKey = event => {
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
      className={`bl-drawer group/drawer ${className}`}
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
      }}
    >
      <div ref={backdropRef} className="fixed inset-0 bg-(--bl-backdrop) opacity-0 group-data-[contained]/drawer:absolute" style={{ pointerEvents: 'auto' }} onClick={() => dismissible && request(false)} aria-hidden="true" />
      <div
        ref={shellRef}
        className="fixed flex touch-none flex-col bg-(--bl-bg) font-(family-name:--bl-font) text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line),0_-20px_60px_-20px_rgba(0,0,0,0.6)] outline-none will-change-transform [transition:filter_300ms] data-[nested]:[filter:brightness(0.7)] group-data-[contained]/drawer:absolute group-data-[side=bottom]/drawer:inset-x-0 group-data-[side=bottom]/drawer:bottom-0 group-data-[side=bottom]/drawer:mx-auto group-data-[side=bottom]/drawer:h-(--bl-size) group-data-[side=bottom]/drawer:max-w-(--bl-max-w) group-data-[side=bottom]/drawer:rounded-t-(--bl-radius) group-data-[side=right]/drawer:top-0 group-data-[side=right]/drawer:right-0 group-data-[side=right]/drawer:bottom-0 group-data-[side=right]/drawer:w-(--bl-size) group-data-[side=right]/drawer:max-w-[92%] group-data-[side=right]/drawer:rounded-l-(--bl-radius) group-data-[side=left]/drawer:top-0 group-data-[side=left]/drawer:bottom-0 group-data-[side=left]/drawer:left-0 group-data-[side=left]/drawer:w-(--bl-size) group-data-[side=left]/drawer:max-w-[92%] group-data-[side=left]/drawer:rounded-r-(--bl-radius)"
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
          className="bl-drawer__handle m-0 grid h-7 flex-none cursor-grab place-items-center border-0 bg-transparent p-0 before:h-[5px] before:w-11 before:rounded-(--bl-pill) before:bg-(--bl-muted) before:opacity-50 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-(--bl-accent) group-data-[side=right]/drawer:absolute group-data-[side=left]/drawer:absolute group-data-[side=right]/drawer:top-1/2 group-data-[side=left]/drawer:top-1/2 group-data-[side=right]/drawer:h-[60px] group-data-[side=left]/drawer:h-[60px] group-data-[side=right]/drawer:w-7 group-data-[side=left]/drawer:w-7 group-data-[side=right]/drawer:[transform:translateY(-50%)] group-data-[side=left]/drawer:[transform:translateY(-50%)] group-data-[side=right]/drawer:left-0 group-data-[side=left]/drawer:right-0 group-data-[side=right]/drawer:before:h-11 group-data-[side=left]/drawer:before:h-11 group-data-[side=right]/drawer:before:w-[5px] group-data-[side=left]/drawer:before:w-[5px]"
          aria-label={bottom && snapCount > 1 ? `Resize drawer (position ${snapIndex + 1} of ${snapCount}). Use up and down arrows.` : 'Drag to close'}
          onKeyDown={onHandleKey}
          onClick={() => bottom && snapCount > 1 && goToSnap((snapIndex + 1) % snapCount)}
        />
        {(title || description) && (
          <div className="flex-none px-[22px] pt-1 pb-2.5 group-data-[side=right]/drawer:pt-[22px] group-data-[side=left]/drawer:pt-[22px]">
            {title && (
              <h2 id={`${uid}-title`} className="m-0 text-[1.15em] font-bold">
                {title}
              </h2>
            )}
            {description && (
              <p id={`${uid}-desc`} className="mt-1 mb-0 text-[0.92em] text-(--bl-muted)">
                {description}
              </p>
            )}
          </div>
        )}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[22px] pt-2 pb-[22px]">
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
