import { useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type KeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Segmented control. Single mode is a radio group with one thumb that slides (with a little
// overshoot) between options. Multiple mode is a set of toggle buttons; neighbouring selections
// fuse into one continuous pill. Arrow keys move, Home/End jump, Space/Enter toggle.

const STYLE_ID = 'bl-toggle-group';
const CSS = `
/* theme tokens */
.bl-tg { --bl-track: rgba(255,255,255,0.06); --bl-line: rgba(255,255,255,0.1); --bl-thumb: #f4f4f4; --bl-thumb-ink: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-tg, .bl-tg:where(.light, [data-theme="light"]) { --bl-track: rgba(26,28,44,0.06); --bl-line: rgba(26,28,44,0.1); --bl-thumb: #1a1c2c; --bl-thumb-ink: #f4f4f4; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-tg, :where(.light, [data-theme="light"]) .bl-tg:where(.dark, [data-theme="dark"]) { --bl-track: rgba(255,255,255,0.06); --bl-line: rgba(255,255,255,0.1); --bl-thumb: #f4f4f4; --bl-thumb-ink: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-tg, .bl-tg:where([data-theme="system"]) { --bl-track: rgba(26,28,44,0.06); --bl-line: rgba(26,28,44,0.1); --bl-thumb: #1a1c2c; --bl-thumb-ink: #f4f4f4; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-tg { position: relative; display: inline-flex; max-width: 100%; overflow-x: auto; scrollbar-width: none; padding: var(--bl-pad); gap: var(--bl-gap); border-radius: var(--bl-radius); background: var(--bl-track); box-shadow: inset 0 0 0 1px var(--bl-line); font-family: var(--bl-font); isolation: isolate; }
.bl-tg[data-full] { display: flex; width: 100%; }
.bl-tg[data-full] .bl-tg__item { flex: 1 0 auto; }
.bl-tg__thumb { position: absolute; z-index: 0; top: var(--bl-pad); bottom: var(--bl-pad); left: 0; border-radius: var(--bl-inner-radius); background: var(--bl-thumb); box-shadow: 0 1px 2px rgba(0,0,0,0.3), 0 4px 12px -6px rgba(0,0,0,0.5); transition: transform var(--bl-dur) cubic-bezier(.3,1.25,.5,1), width var(--bl-dur) cubic-bezier(.3,1.25,.5,1); }
.bl-tg__thumb[data-instant] { transition: none; }
.bl-tg__item { position: relative; z-index: 1; display: inline-flex; flex: 0 0 auto; align-items: center; justify-content: center; gap: 7px; min-width: 0; height: var(--bl-h); padding: 0 var(--bl-item-pad); border: 0; border-radius: var(--bl-inner-radius); background: transparent; color: var(--bl-muted); font: inherit; font-size: var(--bl-size); font-weight: 600; white-space: nowrap; cursor: pointer; transition: color 180ms, background-color 180ms, border-radius 180ms; }
.bl-tg__item:hover:not(:disabled) { color: var(--bl-ink); }
.bl-tg__item:disabled { opacity: 0.4; cursor: not-allowed; }
.bl-tg__item:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 1px; z-index: 2; }
.bl-tg[data-type="single"] .bl-tg__item[aria-checked="true"] { color: var(--bl-thumb-ink); }
.bl-tg[data-type="multiple"] .bl-tg__item[aria-pressed="true"] { background: var(--bl-thumb); color: var(--bl-thumb-ink); animation: bl-tg-pop 260ms cubic-bezier(.3,1.4,.5,1); }
.bl-tg[data-type="multiple"] .bl-tg__item[data-join-left] { border-top-left-radius: 0; border-bottom-left-radius: 0; }
.bl-tg[data-type="multiple"] .bl-tg__item[data-join-right] { border-top-right-radius: 0; border-bottom-right-radius: 0; }
.bl-tg[data-type="multiple"] .bl-tg__item[data-join-right]::after { content: ""; position: absolute; top: 0; bottom: 0; right: calc(var(--bl-gap) * -1); width: var(--bl-gap); background: var(--bl-thumb); }
@keyframes bl-tg-pop { 40% { transform: scale(0.94); } }
@media (prefers-reduced-motion: reduce) { .bl-tg__thumb, .bl-tg__item { transition: none; animation: none !important; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface ToggleItem {
  value: string;
  label?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  /** Accessible name for icon-only options. */
  ariaLabel?: string;
}

export interface ToggleGroupProps {
  items?: ToggleItem[];
  /** A radio group with a sliding thumb, or toggle buttons whose neighbouring selections fuse. */
  type?: 'single' | 'multiple';
  /** Controlled value: a string in single mode, a string[] (in item order) in multiple mode. */
  value?: string | string[];
  defaultValue?: string | string[];
  onChange?: (value: string | string[]) => void;
  /** Accessible name of the group. */
  label?: string;
  /** Stretch options to fill the row. */
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Thumb slide length, in ms. */
  duration?: number;
  radius?: number;
  gap?: number;
  padding?: number;
  trackColor?: string;
  lineColor?: string;
  thumbColor?: string;
  thumbTextColor?: string;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function ToggleGroup({
  items = [],
  type = 'single',
  value,
  defaultValue,
  onChange,
  label = 'Options',
  fullWidth = false,
  size = 'md',
  duration = 340,
  radius = 12,
  gap = 2,
  padding = 4,
  trackColor,
  lineColor,
  thumbColor,
  thumbTextColor,
  textColor,
  mutedColor,
  accentColor,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: ToggleGroupProps) {
  useStyles();
  const multiple = type === 'multiple';
  const [inner, setInner] = useState<string | string[] | undefined>(() => defaultValue ?? (multiple ? [] : items.find(item => !item.disabled)?.value));
  const selected = value !== undefined ? value : inner;
  const selectedSet = new Set<string | undefined>(multiple ? (selected as string[] | undefined) ?? [] : [selected as string | undefined]);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const placed = useRef(false);

  const commit = (next: string | string[]) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  const toggle = (item: ToggleItem) => {
    if (item.disabled) return;
    if (!multiple) {
      if (item.value !== selected) commit(item.value);
      return;
    }
    const current = (selected ?? []) as string[];
    commit(current.includes(item.value) ? current.filter(v => v !== item.value) : items.filter(i => i.value === item.value || current.includes(i.value)).map(i => i.value));
  };

  const selectedIndex = multiple ? -1 : items.findIndex(item => item.value === selected);

  // Slide the single-mode thumb onto the selected option (no animation on first paint).
  useLayoutEffect(() => {
    const thumb = thumbRef.current;
    const target = refs.current[selectedIndex];
    if (!thumb) return undefined;
    const place = () => {
      const node = refs.current[selectedIndex];
      if (!node) {
        thumb.style.opacity = '0';
        return;
      }
      thumb.style.opacity = '1';
      thumb.style.width = `${node.offsetWidth}px`;
      thumb.style.transform = `translateX(${node.offsetLeft}px)`;
    };
    if (!placed.current) thumb.setAttribute('data-instant', '');
    place();
    if (!placed.current) {
      placed.current = true;
      requestAnimationFrame(() => thumb.removeAttribute('data-instant'));
    }
    const observer = new ResizeObserver(() => {
      thumb.setAttribute('data-instant', '');
      place();
      requestAnimationFrame(() => thumb.removeAttribute('data-instant'));
    });
    if (target) observer.observe(target);
    if (thumb.parentElement) observer.observe(thumb.parentElement);
    return () => observer.disconnect();
  }, [selectedIndex, items.length, size]);

  const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter(i => i >= 0);
  const tabStop = focusIndex ?? (multiple ? enabled[0] : selectedIndex >= 0 ? selectedIndex : enabled[0]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const position = enabled.indexOf(index);
    const keys: Record<string, number> = { ArrowRight: position + 1, ArrowDown: position + 1, ArrowLeft: position - 1, ArrowUp: position - 1, Home: 0, End: enabled.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = enabled[(keys[event.key] + enabled.length) % enabled.length];
    setFocusIndex(next);
    refs.current[next]?.focus();
    // Radio groups select as focus moves; toggle buttons wait for Space/Enter.
    if (!multiple) toggle(items[next]);
  };

  const heights: Record<string, number> = { sm: 30, md: 38, lg: 46 };
  const fontSizes: Record<string, number> = { sm: 13, md: 14, lg: 15 };

  return (
    <div
      className={`bl-tg ${className}`}
      role={multiple ? 'group' : 'radiogroup'}
      aria-label={label}
      data-type={type}
      data-full={fullWidth || undefined}
      style={{
        '--bl-h': `${heights[size] ?? heights.md}px`,
        '--bl-size': `${fontSizes[size] ?? fontSizes.md}px`,
        '--bl-item-pad': size === 'sm' ? '10px' : '14px',
        '--bl-pad': `${padding}px`,
        '--bl-gap': `${gap}px`,
        '--bl-radius': `${radius}px`,
        '--bl-inner-radius': `${Math.max(0, radius - padding)}px`,
        '--bl-dur': `${duration}ms`,
        '--bl-track': trackColor,
        '--bl-line': lineColor,
        '--bl-thumb': thumbColor,
        '--bl-thumb-ink': thumbTextColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-accent': accentColor,
        '--bl-font': fontFamily,
        ...style
      } as CSSVars}
    >
      {!multiple && <span ref={thumbRef} className="bl-tg__thumb" aria-hidden="true" />}
      {items.map((item, index) => {
        const on = selectedSet.has(item.value);
        const joinLeft = multiple && on && index > 0 && selectedSet.has(items[index - 1].value);
        const joinRight = multiple && on && index < items.length - 1 && selectedSet.has(items[index + 1].value);
        return (
          <button
            key={item.value}
            ref={node => {
              refs.current[index] = node;
            }}
            type="button"
            className="bl-tg__item"
            role={multiple ? undefined : 'radio'}
            aria-checked={multiple ? undefined : on}
            aria-pressed={multiple ? on : undefined}
            aria-label={item.ariaLabel}
            disabled={item.disabled}
            tabIndex={index === tabStop ? 0 : -1}
            data-join-left={joinLeft || undefined}
            data-join-right={joinRight || undefined}
            onClick={() => {
              setFocusIndex(index);
              toggle(item);
            }}
            onKeyDown={event => onKeyDown(event, index)}
            onBlur={event => !event.currentTarget.parentElement?.contains(event.relatedTarget) && setFocusIndex(null)}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
