import { useEffect, useInsertionEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode, type PointerEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Stacked toasts. Render <Toaster /> once, then call toast() from anywhere:
//   toast('Saved'), toast.success(...), toast.error(...), toast.info(...)
//   toast.promise(fetchThing(), { loading: 'Saving…', success: 'Saved', error: 'Failed' })
// Toasts stack like cards and fan out on hover or focus, swipe sideways to dismiss, pause
// their timers while you read, and are announced to screen readers.

const STYLE_ID = 'bl-toast-stack-tw';
const CSS = `
@keyframes bl-toast-spin { to { transform: rotate(360deg); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// ---------- Store ----------

export type ToastType = 'default' | 'success' | 'error' | 'info' | 'loading';

export interface ToastOptions {
  /** Pass an existing id to update that toast in place. */
  id?: number;
  description?: ReactNode;
  icon?: ReactNode;
  /** Time on screen, in ms (Infinity to stay until dismissed). */
  duration?: number;
  /** A button on the toast; clicking it also dismisses the toast. */
  action?: { label: ReactNode; onClick?: () => void };
}

export interface ToastData extends ToastOptions {
  title?: ReactNode;
  type?: ToastType;
}

export interface PromiseMessages<T> {
  loading?: ReactNode;
  success?: ReactNode | ((value: T) => ReactNode);
  error?: ReactNode | ((error: unknown) => ReactNode);
}

interface ToastRecord extends ToastData {
  id: number;
  type: ToastType;
  created?: number;
  updated?: number;
  leaving?: boolean;
}

let toasts: ToastRecord[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(listener => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => toasts;

function upsert(data: ToastData) {
  const id = data.id ?? nextId++;
  const existing = toasts.find(t => t.id === id);
  toasts = (existing ? toasts.map(t => (t.id === id ? { ...t, ...data, id, updated: Date.now() } : t)) : [{ type: 'default', ...data, id, created: Date.now() }, ...toasts]) as ToastRecord[];
  emit();
  return id;
}

const normalize = (message: ReactNode | ToastData, options?: ToastOptions): ToastData =>
  typeof message === 'object' && message !== null && !Array.isArray(message) && !(message as { $$typeof?: unknown }).$$typeof ? (message as ToastData) : { title: message as ReactNode, ...options };

/** Shows a toast; returns its id. Pass a title (any node) and options, or one ToastData object. */
export function toast(message: ReactNode | ToastData, options?: ToastOptions) {
  return upsert(normalize(message, options));
}
toast.success = (message: ReactNode | ToastData, options?: ToastOptions) => upsert({ ...normalize(message, options), type: 'success' });
toast.error = (message: ReactNode | ToastData, options?: ToastOptions) => upsert({ ...normalize(message, options), type: 'error' });
toast.info = (message: ReactNode | ToastData, options?: ToastOptions) => upsert({ ...normalize(message, options), type: 'info' });
toast.loading = (message: ReactNode | ToastData, options?: ToastOptions) => upsert({ ...normalize(message, options), type: 'loading' });
toast.dismiss = (id?: number) => {
  toasts = id == null ? toasts.map(t => ({ ...t, leaving: true })) : toasts.map(t => (t.id === id ? { ...t, leaving: true } : t));
  emit();
};
toast.promise = <T,>(promise: Promise<T> | T, messages: PromiseMessages<T>) => {
  const id = upsert({ type: 'loading', title: messages.loading ?? 'Loading…' });
  const resolve = (value: unknown, key: 'success' | 'error', type: 'success' | 'error') => {
    const message = (typeof messages[key] === 'function' ? (messages[key] as (value: unknown) => ReactNode)(value) : messages[key]) as ReactNode;
    upsert({ id, type, title: message ?? (type === 'success' ? 'Done' : 'Something went wrong') });
  };
  Promise.resolve(promise).then(
    value => resolve(value, 'success', 'success'),
    error => resolve(error, 'error', 'error')
  );
  return id;
};
const remove = (id: number) => {
  toasts = toasts.filter(t => t.id !== id);
  emit();
};

// ---------- UI ----------

const ICONS: Record<string, string> = { success: '✓', error: '!', info: 'i' };

interface ToastItemProps {
  item: ToastRecord;
  index: number;
  expanded: boolean;
  offset: number;
  frontHeight: number | undefined;
  setHeight: (id: number, height: number) => void;
  duration: number;
  gap: number;
  colors: { success: string; error: string; info: string };
  y: string;
  visibleCount: number;
  paused: boolean;
}

function ToastItem({ item, index, expanded, offset, frontHeight, setHeight, duration, gap, colors, y, visibleCount, paused }: ToastItemProps) {
  const ref = useRef<HTMLLIElement>(null);
  const [mounted, setMounted] = useState(false);
  const [swipe, setSwipe] = useState(0);
  const drag = useRef<{ x: number; t: number } | null>(null);
  const remaining = useRef(item.duration ?? duration);
  const started = useRef(0);

  useLayoutEffect(() => {
    const el = ref.current!;
    const prev = el.style.height;
    el.style.height = 'auto';
    setHeight(item.id, el.getBoundingClientRect().height);
    el.style.height = prev;
  });

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Restart the timer whenever the content changes (for example a promise resolving).
  useEffect(() => {
    remaining.current = item.duration ?? duration;
  }, [item.updated, item.duration, duration]);

  useEffect(() => {
    if (item.leaving) {
      const timer = setTimeout(() => remove(item.id), 320);
      return () => clearTimeout(timer);
    }
    if (item.type === 'loading' || paused || remaining.current === Infinity) return;
    started.current = Date.now();
    const timer = setTimeout(() => toast.dismiss(item.id), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - started.current;
    };
  }, [paused, item.leaving, item.type, item.updated, item.id]);

  const onPointerDown = (event: PointerEvent<HTMLLIElement>) => {
    if ((event.target as Element).closest('button')) return;
    drag.current = { x: event.clientX, t: performance.now() };
    try {
      ref.current!.setPointerCapture(event.pointerId);
    } catch {
      // The pointer may already be gone (e.g. a synthetic event); dragging still works without capture.
    }
    ref.current!.setAttribute('data-swiping', '');
  };
  const onPointerMove = (event: PointerEvent<HTMLLIElement>) => {
    if (drag.current) setSwipe(event.clientX - drag.current.x);
  };
  const onPointerUp = (event: PointerEvent<HTMLLIElement>) => {
    if (!drag.current) return;
    const dx = event.clientX - drag.current.x;
    const velocity = Math.abs(dx) / Math.max(1, performance.now() - drag.current.t);
    drag.current = null;
    ref.current!.removeAttribute('data-swiping');
    if (Math.abs(dx) > 90 || velocity > 0.6) {
      setSwipe(Math.sign(dx || 1) * (ref.current!.offsetWidth + 40));
      toast.dismiss(item.id);
    } else setSwipe(0);
  };

  const dir = y === 'bottom' ? -1 : 1;
  const hiddenBehind = index >= visibleCount;
  const entering = !mounted;
  const translateY = entering ? -dir * 24 : expanded ? dir * offset : dir * index * gap;
  const scale = expanded || entering ? 1 : Math.max(0, 1 - index * 0.06);
  const opacity = entering || item.leaving || hiddenBehind ? 0 : 1;
  const accent = ({ success: colors.success, error: colors.error, info: colors.info } as Record<string, string>)[item.type];

  return (
    <li
      ref={ref}
      className="group/toast pointer-events-auto absolute inset-x-0 flex touch-pan-y items-start gap-3 overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) px-4 py-3.5 text-(--bl-ink) shadow-[inset_0_0_0_1px_var(--bl-line),0_10px_30px_-12px_rgba(0,0,0,0.6)] select-none will-change-transform [transition:transform_380ms_cubic-bezier(.2,.9,.25,1),opacity_380ms,height_380ms] group-data-[y=bottom]/toaster:bottom-0 group-data-[y=bottom]/toaster:origin-[50%_100%] group-data-[y=top]/toaster:top-0 group-data-[y=top]/toaster:origin-[50%_0] data-[swiping]:[transition:none] motion-reduce:[transition:opacity_200ms] [&_button:focus-visible]:opacity-100 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-solid [&_button:focus-visible]:outline-(--bl-accent)"
      data-type={item.type}
      role={item.type === 'error' ? 'alert' : 'status'}
      aria-live={item.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        zIndex: 100 - index,
        height: !expanded && index > 0 ? frontHeight : undefined,
        opacity: swipe ? Math.max(0, 1 - Math.abs(swipe) / 260) * opacity : opacity,
        transform: `translate(${swipe}px, ${translateY + (item.leaving && !swipe ? -dir * 12 : 0)}px) scale(${scale})`,
        pointerEvents: hiddenBehind || item.leaving ? 'none' : undefined
      }}
    >
      {item.type === 'loading' ? (
        <span className="size-4 animate-[bl-toast-spin_700ms_linear_infinite] rounded-[50%] border-2 border-solid border-(--bl-line) border-t-(--bl-accent) motion-reduce:[animation-duration:2s]" aria-hidden="true" />
      ) : (
        accent && (
          <span className="mt-px grid size-[22px] flex-none place-items-center rounded-(--bl-icon-radius) text-[13px] font-extrabold text-(--bl-bg)" style={{ background: accent }} aria-hidden="true">
            {item.icon ?? ICONS[item.type]}
          </span>
        )
      )}
      {item.type === 'default' && item.icon && (
        <span className="mt-px grid size-[22px] flex-none place-items-center rounded-(--bl-icon-radius) text-[13px] font-extrabold text-(--bl-bg)" aria-hidden="true">
          {item.icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="leading-[1.35] font-[650]">{item.title}</div>
        {item.description && <div className="mt-[3px] text-[0.9em] leading-[1.4] text-(--bl-muted)">{item.description}</div>}
      </div>
      {item.action && (
        <button
          type="button"
          className="flex-none cursor-pointer self-center rounded-[calc(var(--bl-radius)*0.6)] border-0 bg-(--bl-accent) px-2.5 py-1.5 text-[0.85em] font-bold text-(--bl-bg)"
          onClick={() => {
            item.action!.onClick?.();
            toast.dismiss(item.id);
          }}
        >
          {item.action.label}
        </button>
      )}
      <button type="button" className="grid size-[22px] flex-none cursor-pointer place-items-center rounded-[50%] border-0 bg-transparent text-(--bl-muted) opacity-0 transition-opacity duration-150 ease-[ease] group-focus-within/toast:opacity-100 group-hover/toast:opacity-100" aria-label="Dismiss notification" onClick={() => toast.dismiss(item.id)}>
        <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <path d="M1 1l8 8M9 1 1 9" />
        </svg>
      </button>
    </li>
  );
}

export interface ToasterProps {
  position?: 'bottom-right' | 'bottom-center' | 'bottom-left' | 'top-right' | 'top-center' | 'top-left';
  /** Default time on screen, in ms. */
  duration?: number;
  /** How many show when stacked. */
  visibleToasts?: number;
  /** Always fan out instead of stacking. */
  expand?: boolean;
  gap?: number;
  width?: number;
  /** Distance from the edges, in px. */
  offset?: number;
  /** Position inside the nearest positioned parent instead of the window. */
  contained?: boolean;
  radius?: number;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  accentColor?: string;
  successColor?: string;
  errorColor?: string;
  infoColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function Toaster({
  position = 'bottom-right',
  duration = 4000,
  visibleToasts = 3,
  expand = false,
  gap = 10,
  width = 360,
  offset = 24,
  contained = false,
  radius = 12,
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = 'rgba(255,255,255,0.12)',
  accentColor = '#73eff7',
  successColor = '#38b764',
  errorColor = '#b13e53',
  infoColor = '#41a6f6',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: ToasterProps) {
  useStyles();
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [heights, setHeights] = useState<Record<number, number>>({});
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [y, x] = position.split('-');

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const setHeight = (id: number, h: number) => setHeights(prev => (prev[id] === h ? prev : { ...prev, [id]: h }));
  const live = items.filter(t => !t.leaving);
  const expanded = expand || hovered || focused;
  const front = live[0] ?? items[0];
  const frontHeight = front ? heights[front.id] : undefined;

  // Expanded offsets: each toast sits above (or below) the ones that came after it.
  let running = 0;
  const offsets: Record<number, number> = {};
  for (const item of items) {
    offsets[item.id] = running;
    if (!item.leaving) running += (heights[item.id] ?? 64) + gap;
  }
  const stackHeight = expanded ? running : (frontHeight ?? 64) + Math.min(live.length - 1, visibleToasts - 1) * gap;

  return (
    <ol
      className={`group/toaster pointer-events-none fixed z-1100 m-0 w-(--bl-w) max-w-[calc(100%_-_32px)] list-none p-0 font-(family-name:--bl-font) data-[contained]:absolute data-[x=center]:left-1/2 data-[x=center]:[transform:translateX(-50%)] data-[x=left]:left-(--bl-offset) data-[x=right]:right-(--bl-offset) data-[y=bottom]:bottom-(--bl-offset) data-[y=top]:top-(--bl-offset) ${className}`}
      data-x={x ?? 'right'}
      data-y={y}
      data-contained={contained || undefined}
      aria-label="Notifications"
      onPointerEnter={event => event.pointerType === 'mouse' && setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={event => !event.currentTarget.contains(event.relatedTarget) && setFocused(false)}
      style={{
        '--bl-w': `${width}px`,
        '--bl-offset': `${offset}px`,
        '--bl-radius': `${radius}px`,
        '--bl-icon-radius': radius ? '50%' : '0',
        '--bl-bg': backgroundColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-font': fontFamily,
        height: items.length ? stackHeight : 0,
        ...style
      } as CSSVars}
    >
      {items.map(item => {
        const index = live.indexOf(item);
        return (
          <ToastItem
            key={item.id}
            item={item}
            index={index < 0 ? 0 : index}
            expanded={expanded}
            offset={offsets[item.id]}
            frontHeight={frontHeight}
            setHeight={setHeight}
            duration={duration}
            gap={gap}
            y={y}
            visibleCount={expanded ? Infinity : visibleToasts}
            colors={{ success: successColor, error: errorColor, info: infoColor }}
            paused={hovered || focused || hidden}
          />
        );
      })}
    </ol>
  );
}
