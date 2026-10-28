import { cloneElement, isValidElement, useCallback, useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactElement, type ReactNode, type Ref, type RefObject, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A set of overlay primitives that share one motion language: Dialog, Sheet, Tooltip,
// Popover and Dropdown. Every piece enters and exits with the same durations and curves
// (exported as MOTION), mounts only while visible, and handles its own accessibility:
// focus trap and scroll lock for modals, Esc and outside-click dismissal, focus return,
// hoverable tooltips, and a full keyboard menu. Theme everything at once with CSS variables
// (--bl-ok-bg, --bl-ok-ink, --bl-ok-muted, --bl-ok-line, --bl-ok-accent, --bl-ok-radius,
// --bl-ok-font) on :root, or per component through `style`.

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Align = 'start' | 'center' | 'end';

/** The element a trigger or tooltip child must be: anything that takes DOM props and a ref. */
type TriggerProps = HTMLAttributes<HTMLElement> & { ref?: Ref<HTMLElement> };
type TriggerElement = ReactElement<TriggerProps>;

type RenderChildren = ReactNode | ((api: { close: () => void }) => ReactNode);

export interface DialogProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** An element (usually a button) that opens it; cloned with ARIA and onClick. */
  trigger?: TriggerElement;
  title?: ReactNode;
  description?: ReactNode;
  /** Content, or a function receiving { close }. Mark a button data-autofocus to focus it first. */
  children?: RenderChildren;
  /** Panel width in px. */
  width?: number;
  closeLabel?: string;
  className?: string;
  style?: CSSProperties;
}

export interface SheetProps extends DialogProps {
  /** Edge the sheet slides in from. */
  side?: Side;
}

export interface TooltipProps {
  content: ReactNode;
  /** One element; it receives the hover/focus handlers and aria-describedby. */
  children: TriggerElement;
  side?: Side;
  align?: Align;
  /** Hover delay before showing, in ms. */
  delay?: number;
  /** Delay before hiding after the pointer leaves, in ms. */
  closeDelay?: number;
  className?: string;
  style?: CSSProperties;
}

export interface PopoverProps {
  trigger?: TriggerElement;
  children?: RenderChildren;
  /** Accessible name of the popover panel. */
  label?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: Side;
  align?: Align;
  width?: number;
  className?: string;
  style?: CSSProperties;
}

export interface DropdownAction {
  type?: 'item';
  label: ReactNode;
  icon?: ReactNode;
  shortcut?: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export type DropdownItem = DropdownAction | { type: 'separator' } | { type: 'label'; label: ReactNode };

export interface DropdownProps {
  trigger?: TriggerElement;
  items?: DropdownItem[];
  /** Accessible name of the menu. */
  label?: string;
  side?: Side;
  align?: Align;
  className?: string;
  style?: CSSProperties;
}

// A set of overlay primitives that share one motion language: Dialog, Sheet, Tooltip,
// Popover and Dropdown. Every piece enters and exits with the same durations and curves
// (exported as MOTION), mounts only while visible, and handles its own accessibility:
// focus trap and scroll lock for modals, Esc and outside-click dismissal, focus return,
// hoverable tooltips, and a full keyboard menu. Theme everything at once with CSS variables
// (--bl-ok-bg, --bl-ok-ink, --bl-ok-muted, --bl-ok-line, --bl-ok-accent, --bl-ok-radius,
// --bl-ok-font) on :root, or per component through `style`.

export const MOTION = {
  fast: 140,
  base: 220,
  slow: 320,
  easeOut: 'cubic-bezier(.2,.9,.25,1)',
  easeIn: 'cubic-bezier(.4,0,1,1)',
  spring: 'cubic-bezier(.3,1.35,.5,1)'
};

const STYLE_ID = 'bl-overlay-kit-tw';
const CSS = `
@keyframes bl-ok-fade { from { opacity: 0; } }
@keyframes bl-ok-pop { from { opacity: 0; transform: translate(-50%, -48%) scale(0.95); } }
@keyframes bl-ok-slide-in { from { transform: var(--ok-from); } }
@keyframes bl-ok-float-in { from { opacity: 0; transform: translate(var(--ok-shift, 0, 0)) scale(0.96); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// ---------- Shared hooks ----------

function useControllable(open: boolean | undefined, defaultOpen: boolean | undefined, onOpenChange: ((open: boolean) => void) | undefined): [boolean, (next: boolean) => void] {
  const [inner, setInner] = useState(defaultOpen ?? false);
  const value = open ?? inner;
  const set = useCallback(
    (next: boolean) => {
      if (open === undefined) setInner(next);
      onOpenChange?.(next);
    },
    [open, onOpenChange]
  );
  return [value, set];
}

// Keeps content mounted through its exit animation; returns the data-state to render.
function usePresence(open: boolean, exitMs: number = MOTION.base): [boolean, 'open' | 'closed'] {
  const [mounted, setMounted] = useState(open);
  useEffect(() => {
    if (open) {
      setMounted(true);
      return undefined;
    }
    const timer = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(timer);
  }, [open, exitMs]);
  return [mounted || open, open ? 'open' : 'closed'];
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function useFocusTrap(ref: RefObject<HTMLElement | null>, active: boolean, { trap = true, restore = true }: { trap?: boolean; restore?: boolean } = {}) {
  useEffect(() => {
    if (!active) return undefined;
    const node = ref.current;
    const previous = document.activeElement;
    const first = node?.querySelector<HTMLElement>('[data-autofocus]') ?? node?.querySelector<HTMLElement>(FOCUSABLE) ?? node;
    first?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (!trap || event.key !== 'Tab' || !node) return;
      const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) {
        event.preventDefault();
        return;
      }
      const a = items[0];
      const z = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === a || document.activeElement === node)) {
        event.preventDefault();
        z.focus();
      } else if (!event.shiftKey && document.activeElement === z) {
        event.preventDefault();
        a.focus();
      }
    };
    node?.addEventListener('keydown', onKey);
    return () => {
      node?.removeEventListener('keydown', onKey);
      if (restore && previous instanceof HTMLElement && (node?.contains(document.activeElement) || document.activeElement === document.body)) previous.focus({ preventScroll: true });
    };
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
}

function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return undefined;
    const { body, documentElement } = document;
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    const gap = window.innerWidth - documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      Object.assign(body.style, previous);
    };
  }, [active]);
}

// Esc closes; a press outside every given element closes (unless outside is false).
function useDismiss(active: boolean, refs: RefObject<Element | null>[], onDismiss: () => void, { outside = true }: { outside?: boolean } = {}) {
  const latest = useRef(onDismiss);
  latest.current = onDismiss;
  useEffect(() => {
    if (!active) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        latest.current();
      }
    };
    const onDown = (event: PointerEvent) => {
      if (!outside) return;
      if (refs.every(ref => !ref.current?.contains(event.target as Node))) latest.current();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onDown);
    };
  }, [active, outside]); // eslint-disable-line react-hooks/exhaustive-deps
}

// Places a floating element beside an anchor, flipping to the other side when it doesn't fit
// and clamping it inside the viewport. Re-runs on scroll and resize while open.
function useFloating(anchorRef: RefObject<HTMLElement | null>, floatingRef: RefObject<HTMLElement | null>, active: boolean, { side = 'bottom', align = 'center', offset = 8 }: { side?: Side; align?: Align; offset?: number }) {
  const [placed, setPlaced] = useState<Side>(side);
  useLayoutEffect(() => {
    if (!active) return undefined;
    const update = () => {
      const anchor = anchorRef.current;
      const floating = floatingRef.current;
      if (!anchor || !floating) return;
      const a = anchor.getBoundingClientRect();
      const f = { width: floating.offsetWidth, height: floating.offsetHeight };
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const opposite: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
      const fits = (s: Side) => (s === 'top' ? a.top - offset - f.height >= 4 : s === 'bottom' ? a.bottom + offset + f.height <= vh - 4 : s === 'left' ? a.left - offset - f.width >= 4 : a.right + offset + f.width <= vw - 4);
      const s = fits(side) || !fits(opposite[side]) ? side : opposite[side];
      let top: number;
      let left: number;
      if (s === 'top' || s === 'bottom') {
        top = s === 'top' ? a.top - offset - f.height : a.bottom + offset;
        left = align === 'start' ? a.left : align === 'end' ? a.right - f.width : a.left + a.width / 2 - f.width / 2;
      } else {
        left = s === 'left' ? a.left - offset - f.width : a.right + offset;
        top = align === 'start' ? a.top : align === 'end' ? a.bottom - f.height : a.top + a.height / 2 - f.height / 2;
      }
      left = Math.max(8, Math.min(vw - f.width - 8, left));
      top = Math.max(8, Math.min(vh - f.height - 8, top));
      floating.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
      setPlaced(s);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [active, side, align, offset]); // eslint-disable-line react-hooks/exhaustive-deps
  return placed;
}

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(node);
      else if (ref) ref.current = node;
    }
  };
}

const CloseIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M2 2l10 10M12 2 2 12" />
  </svg>
);

// The float wrapper is an inner element so the entry transform doesn't fight positioning.
const floatStyle: CSSProperties = { position: 'fixed', zIndex: 1600, top: 0, left: 0 };

// ---------- Dialog & Sheet ----------

function Modal({ variant, open, defaultOpen, onOpenChange, trigger, title, description, children, side = 'right', width, closeLabel = 'Close', className = '', style }: SheetProps & { variant: 'dialog' | 'sheet' }) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const [mounted, state] = usePresence(isOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, isOpen && mounted);
  useScrollLock(isOpen);
  useDismiss(isOpen, [panelRef], () => setOpen(false), { outside: false });

  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger, {
        'aria-haspopup': 'dialog',
        'aria-expanded': isOpen,
        onClick: event => {
          trigger.props.onClick?.(event);
          setOpen(true);
        }
      })
    : null;

  return (
    <>
      {triggerEl}
      {mounted &&
        createPortal(
          <div className="[--ok-bg:var(--bl-ok-bg,#1a1c2c)] [--ok-ink:var(--bl-ok-ink,#f4f4f4)] [--ok-muted:var(--bl-ok-muted,#94b0c2)] [--ok-line:var(--bl-ok-line,rgba(255,255,255,0.12))] [--ok-accent:var(--bl-ok-accent,#73eff7)] [--ok-hover:var(--bl-ok-hover,rgba(255,255,255,0.07))] [--ok-radius:var(--bl-ok-radius,14px)] [--ok-backdrop:var(--bl-ok-backdrop,rgba(8,8,16,0.6))] [font-family:var(--bl-ok-font,ui-sans-serif,system-ui,sans-serif)] text-(--ok-ink)" style={{ ...(width ? { '--ok-w': `${width}px` } : null), ...style } as CSSVars}>
            <div className="fixed inset-0 z-1500 bg-(--ok-backdrop) data-[state=open]:animate-[bl-ok-fade_220ms_cubic-bezier(.2,.9,.25,1)_both] data-[state=closed]:animate-[bl-ok-fade_220ms_cubic-bezier(.4,0,1,1)_reverse_both]" data-state={state} onClick={() => setOpen(false)} aria-hidden="true" />
            <div
              ref={panelRef}
              className={`bg-(--ok-bg) text-(--ok-ink) shadow-[0_0_0_1px_var(--ok-line),0_24px_60px_-24px_rgba(0,0,0,0.75)] outline-none ${variant === 'sheet' ? 'fixed z-1501 overflow-auto rounded-none p-[22px] data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:w-[min(var(--ok-w,380px),92vw)] data-[side=right]:rounded-l-(--ok-radius) data-[side=right]:[--ok-from:translateX(100%)] data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:w-[min(var(--ok-w,380px),92vw)] data-[side=left]:rounded-r-(--ok-radius) data-[side=left]:[--ok-from:translateX(-100%)] data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:max-h-[85vh] data-[side=bottom]:rounded-t-(--ok-radius) data-[side=bottom]:[--ok-from:translateY(100%)] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:max-h-[85vh] data-[side=top]:rounded-b-(--ok-radius) data-[side=top]:[--ok-from:translateY(-100%)] data-[state=open]:animate-[bl-ok-slide-in_320ms_cubic-bezier(.2,.9,.25,1)_both] data-[state=closed]:animate-[bl-ok-slide-in_220ms_cubic-bezier(.4,0,1,1)_reverse_both] motion-reduce:data-[state]:[animation-name:bl-ok-fade]' : 'fixed top-1/2 left-1/2 z-1501 max-h-[calc(100vh_-_48px)] w-[min(var(--ok-w,480px),calc(100vw_-_32px))] overflow-auto rounded-(--ok-radius) p-[22px] [transform:translate(-50%,-50%)] data-[state=open]:animate-[bl-ok-pop_320ms_cubic-bezier(.3,1.35,.5,1)_both] data-[state=closed]:animate-[bl-ok-pop_220ms_cubic-bezier(.4,0,1,1)_reverse_both] motion-reduce:data-[state]:[animation-name:bl-ok-fade]'} ${className}`}
              data-state={state}
              data-side={variant === 'sheet' ? side : undefined}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? `${uid}-title` : undefined}
              aria-describedby={description ? `${uid}-desc` : undefined}
              tabIndex={-1}
            >
              {title && (
                <h2 id={`${uid}-title`} className="mt-0 mr-8 mb-1.5 ml-0 text-[1.15em] font-bold">
                  {title}
                </h2>
              )}
              {description && (
                <p id={`${uid}-desc`} className="m-0 mb-4 text-[0.93em] leading-[1.5] text-(--ok-muted)">
                  {description}
                </p>
              )}
              {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
              <button type="button" className="absolute top-3.5 right-3.5 grid size-[30px] cursor-pointer place-items-center rounded-[50%] border-0 bg-transparent text-(--ok-muted) hover:bg-(--ok-hover) hover:text-(--ok-ink) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--ok-accent)" aria-label={closeLabel} onClick={() => setOpen(false)}>
                <CloseIcon />
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export function Dialog(props: DialogProps) {
  return <Modal {...props} variant="dialog" />;
}

export function Sheet(props: SheetProps) {
  return <Modal {...props} variant="sheet" />;
}

// ---------- Tooltip ----------

export function Tooltip({ content, children, side = 'top', align = 'center', delay = 400, closeDelay = 120, className = '', style }: TooltipProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [open, setOpen] = useState(false);
  const [mounted, state] = usePresence(open, MOTION.fast);
  const anchorRef = useRef<HTMLElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | number>(0);
  const placed = useFloating(anchorRef, floatRef, mounted, { side, align, offset: 8 });

  const show = (wait: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), wait);
  };
  const hide = (wait: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(false), wait);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  useDismiss(open, [], () => setOpen(false), { outside: false });

  if (!isValidElement(children)) return children ?? null;
  const child = cloneElement(children, {
    ref: mergeRefs(anchorRef, children.props.ref),
    'aria-describedby': open ? `${uid}-tip` : children.props['aria-describedby'],
    onPointerEnter: event => {
      children.props.onPointerEnter?.(event);
      if (event.pointerType === 'mouse') show(delay);
    },
    onPointerLeave: event => {
      children.props.onPointerLeave?.(event);
      hide(closeDelay);
    },
    onFocus: event => {
      children.props.onFocus?.(event);
      show(0);
    },
    onBlur: event => {
      children.props.onBlur?.(event);
      hide(0);
    }
  });

  return (
    <>
      {child}
      {mounted &&
        createPortal(
          <div ref={floatRef} className="[--ok-bg:var(--bl-ok-bg,#1a1c2c)] [--ok-ink:var(--bl-ok-ink,#f4f4f4)] [--ok-muted:var(--bl-ok-muted,#94b0c2)] [--ok-line:var(--bl-ok-line,rgba(255,255,255,0.12))] [--ok-accent:var(--bl-ok-accent,#73eff7)] [--ok-hover:var(--bl-ok-hover,rgba(255,255,255,0.07))] [--ok-radius:var(--bl-ok-radius,14px)] [--ok-backdrop:var(--bl-ok-backdrop,rgba(8,8,16,0.6))] [font-family:var(--bl-ok-font,ui-sans-serif,system-ui,sans-serif)] text-(--ok-ink)" style={{ ...floatStyle, ...style }} onPointerEnter={() => show(0)} onPointerLeave={() => hide(closeDelay)}>
            <div id={`${uid}-tip`} role="tooltip" className={`data-[state=open]:animate-[bl-ok-float-in_220ms_cubic-bezier(.3,1.35,.5,1)_both] data-[state=closed]:animate-[bl-ok-float-in_140ms_cubic-bezier(.4,0,1,1)_reverse_both] data-[side=top]:origin-bottom data-[side=top]:[--ok-shift:0,6px] data-[side=bottom]:origin-top data-[side=bottom]:[--ok-shift:0,-6px] data-[side=left]:origin-right data-[side=left]:[--ok-shift:6px,0] data-[side=right]:origin-left data-[side=right]:[--ok-shift:-6px,0] motion-reduce:data-[state]:[animation-name:bl-ok-fade] max-w-[260px] rounded-[calc(var(--ok-radius)*0.6)] bg-[var(--bl-ok-tooltip-bg,#f4f4f4)] px-2.5 py-1.5 text-[13px] leading-[1.4] text-[var(--bl-ok-tooltip-ink,#1a1c2c)] shadow-[0_8px_24px_-10px_rgba(0,0,0,0.6)] ${className}`} data-state={state} data-side={placed}>
              {content}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

// ---------- Popover ----------

export function Popover({ trigger, children, label, open, defaultOpen, onOpenChange, side = 'bottom', align = 'center', width, className = '', style }: PopoverProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [isOpen, setOpen] = useControllable(open, defaultOpen, onOpenChange);
  const [mounted, state] = usePresence(isOpen, MOTION.fast);
  const anchorRef = useRef<HTMLElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const placed = useFloating(anchorRef, floatRef, mounted, { side, align, offset: 8 });
  useFocusTrap(panelRef, isOpen && mounted, { trap: false });
  useDismiss(isOpen, [anchorRef, floatRef], () => setOpen(false));

  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger, {
        ref: mergeRefs(anchorRef, trigger.props.ref),
        'aria-haspopup': 'dialog',
        'aria-expanded': isOpen,
        'aria-controls': mounted ? `${uid}-pop` : undefined,
        onClick: event => {
          trigger.props.onClick?.(event);
          setOpen(!isOpen);
        }
      })
    : null;

  return (
    <>
      {triggerEl}
      {mounted &&
        createPortal(
          <div ref={floatRef} className="[--ok-bg:var(--bl-ok-bg,#1a1c2c)] [--ok-ink:var(--bl-ok-ink,#f4f4f4)] [--ok-muted:var(--bl-ok-muted,#94b0c2)] [--ok-line:var(--bl-ok-line,rgba(255,255,255,0.12))] [--ok-accent:var(--bl-ok-accent,#73eff7)] [--ok-hover:var(--bl-ok-hover,rgba(255,255,255,0.07))] [--ok-radius:var(--bl-ok-radius,14px)] [--ok-backdrop:var(--bl-ok-backdrop,rgba(8,8,16,0.6))] [font-family:var(--bl-ok-font,ui-sans-serif,system-ui,sans-serif)] text-(--ok-ink)" style={{ ...floatStyle, ...(width ? { '--ok-w': `${width}px` } : null), ...style } as CSSVars}>
            <div
              ref={panelRef}
              id={`${uid}-pop`}
              role="dialog"
              aria-label={label}
              tabIndex={-1}
              className={`bg-(--ok-bg) text-(--ok-ink) shadow-[0_0_0_1px_var(--ok-line),0_24px_60px_-24px_rgba(0,0,0,0.75)] outline-none rounded-(--ok-radius) data-[state=open]:animate-[bl-ok-float-in_220ms_cubic-bezier(.3,1.35,.5,1)_both] data-[state=closed]:animate-[bl-ok-float-in_140ms_cubic-bezier(.4,0,1,1)_reverse_both] data-[side=top]:origin-bottom data-[side=top]:[--ok-shift:0,6px] data-[side=bottom]:origin-top data-[side=bottom]:[--ok-shift:0,-6px] data-[side=left]:origin-right data-[side=left]:[--ok-shift:6px,0] data-[side=right]:origin-left data-[side=right]:[--ok-shift:-6px,0] motion-reduce:data-[state]:[animation-name:bl-ok-fade] w-[var(--ok-w,auto)] max-w-[min(360px,calc(100vw_-_16px))] p-3.5 ${className}`}
              data-state={state}
              data-side={placed}
            >
              {typeof children === 'function' ? children({ close: () => setOpen(false) }) : children}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

// ---------- Dropdown menu ----------

export function Dropdown({ trigger, items = [], label = 'Menu', side = 'bottom', align = 'start', className = '', style }: DropdownProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [open, setOpen] = useState(false);
  const [mounted, state] = usePresence(open, MOTION.fast);
  const anchorRef = useRef<HTMLElement>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const startAt = useRef<'first' | 'last'>('first');
  const typed = useRef({ text: '', at: 0 });
  const placed = useFloating(anchorRef, floatRef, mounted, { side, align, offset: 6 });

  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) anchorRef.current?.focus({ preventScroll: true });
  };
  useDismiss(open, [anchorRef, floatRef], () => close());

  const menuItems = () => [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') ?? [])];

  useEffect(() => {
    if (!open || !mounted) return;
    const list = menuItems();
    (startAt.current === 'last' ? list[list.length - 1] : list[0])?.focus({ preventScroll: true });
  }, [open, mounted]);

  const onMenuKey = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const list = menuItems();
    const index = list.indexOf(document.activeElement as HTMLButtonElement);
    const move = (to: number) => {
      event.preventDefault();
      list[(to + list.length) % list.length]?.focus();
    };
    if (event.key === 'ArrowDown') move(index + 1);
    else if (event.key === 'ArrowUp') move(index - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(list.length - 1);
    else if (event.key === 'Tab') close(false);
    else if (event.key.length === 1 && /\S/.test(event.key)) {
      // Typeahead: jump to the next item starting with what was typed recently.
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 600 ? typed.current.text : '') + event.key.toLowerCase(), at: now };
      const match = list.findIndex((el, i) => i > index - (typed.current.text.length > 1 ? 1 : 0) && el.textContent!.trim().toLowerCase().startsWith(typed.current.text));
      const fallback = list.findIndex(el => el.textContent!.trim().toLowerCase().startsWith(typed.current.text));
      if (match >= 0 || fallback >= 0) move(match >= 0 ? match : fallback);
    }
  };

  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger, {
        ref: mergeRefs(anchorRef, trigger.props.ref),
        'aria-haspopup': 'menu',
        'aria-expanded': open,
        'aria-controls': mounted ? `${uid}-menu` : undefined,
        onClick: event => {
          trigger.props.onClick?.(event);
          startAt.current = 'first';
          setOpen(!open);
        },
        onKeyDown: event => {
          trigger.props.onKeyDown?.(event);
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            startAt.current = event.key === 'ArrowUp' ? 'last' : 'first';
            setOpen(true);
          }
        }
      })
    : null;

  return (
    <>
      {triggerEl}
      {mounted &&
        createPortal(
          <div ref={floatRef} className="[--ok-bg:var(--bl-ok-bg,#1a1c2c)] [--ok-ink:var(--bl-ok-ink,#f4f4f4)] [--ok-muted:var(--bl-ok-muted,#94b0c2)] [--ok-line:var(--bl-ok-line,rgba(255,255,255,0.12))] [--ok-accent:var(--bl-ok-accent,#73eff7)] [--ok-hover:var(--bl-ok-hover,rgba(255,255,255,0.07))] [--ok-radius:var(--bl-ok-radius,14px)] [--ok-backdrop:var(--bl-ok-backdrop,rgba(8,8,16,0.6))] [font-family:var(--bl-ok-font,ui-sans-serif,system-ui,sans-serif)] text-(--ok-ink)" style={{ ...floatStyle, ...style }}>
            <div ref={menuRef} id={`${uid}-menu`} role="menu" aria-label={label} className={`bg-(--ok-bg) text-(--ok-ink) shadow-[0_0_0_1px_var(--ok-line),0_24px_60px_-24px_rgba(0,0,0,0.75)] outline-none rounded-(--ok-radius) data-[state=open]:animate-[bl-ok-float-in_220ms_cubic-bezier(.3,1.35,.5,1)_both] data-[state=closed]:animate-[bl-ok-float-in_140ms_cubic-bezier(.4,0,1,1)_reverse_both] data-[side=top]:origin-bottom data-[side=top]:[--ok-shift:0,6px] data-[side=bottom]:origin-top data-[side=bottom]:[--ok-shift:0,-6px] data-[side=left]:origin-right data-[side=left]:[--ok-shift:6px,0] data-[side=right]:origin-left data-[side=right]:[--ok-shift:-6px,0] motion-reduce:data-[state]:[animation-name:bl-ok-fade] max-w-[calc(100vw_-_16px)] min-w-[200px] p-[5px] ${className}`} data-state={state} data-side={placed} onKeyDown={onMenuKey}>
              {items.map((item, i) => {
                if (item.type === 'separator') return <div key={i} className="mx-1 my-[5px] h-px bg-(--ok-line)" role="separator" />;
                if (item.type === 'label')
                  return (
                    <div key={i} className="px-2.5 pt-1.5 pb-1 text-[11px] font-bold tracking-[0.05em] text-(--ok-muted) uppercase" role="presentation">
                      {item.label}
                    </div>
                  );
                return (
                  <button
                    key={i}
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-[calc(var(--ok-radius)*0.55)] border-0 bg-transparent px-2.5 py-2 text-left text-[14px] text-inherit hover:bg-(--ok-hover) hover:outline-none focus:bg-(--ok-hover) focus:outline-none focus-visible:shadow-[inset_0_0_0_2px_var(--ok-accent)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 data-[danger]:text-[var(--bl-ok-danger,#ef7d57)]"
                    disabled={item.disabled}
                    data-danger={item.danger || undefined}
                    onClick={() => {
                      item.onSelect?.();
                      close();
                    }}
                  >
                    {item.icon && <span aria-hidden="true">{item.icon}</span>}
                    <span className="flex-1">{item.label}</span>
                    {item.shortcut && <span className="text-[12px] text-(--ok-muted)">{item.shortcut}</span>}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

// The default export is the Dialog; the other pieces are named exports.
export default Dialog;
