import { useInsertionEffect, useRef, useState } from 'react';

// Before/after comparison. Drag the handle (or anywhere, or hover in hover mode), use arrow
// keys, Home/End and Page keys, horizontal or vertical. The "after" layer is revealed with a
// clip-path, so both sides can be any content: images, video or live components.

const STYLE_ID = 'bl-compare';
const CSS = `
.bl-cmp { position: relative; width: 100%; aspect-ratio: var(--bl-ratio); overflow: hidden; border-radius: var(--bl-radius); user-select: none; -webkit-user-select: none; touch-action: var(--bl-touch); cursor: var(--bl-cursor); background: #000; }
.bl-cmp__layer { position: absolute; inset: 0; }
.bl-cmp__layer > img, .bl-cmp__layer > video { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
.bl-cmp__after { clip-path: inset(0 0 0 var(--bl-pos)); }
.bl-cmp[data-vertical] .bl-cmp__after { clip-path: inset(var(--bl-pos) 0 0 0); }
.bl-cmp__label { position: absolute; top: 12px; padding: 5px 9px; border-radius: 6px; background: rgba(0,0,0,0.6); color: #fff; font: 600 11px/1 var(--bl-font); letter-spacing: 0.06em; text-transform: uppercase; pointer-events: none; transition: opacity 200ms; }
.bl-cmp__label[data-side="before"] { left: 12px; opacity: var(--bl-before-o); }
.bl-cmp__label[data-side="after"] { right: 12px; opacity: var(--bl-after-o); }
.bl-cmp[data-vertical] .bl-cmp__label[data-side="after"] { top: auto; bottom: 12px; right: auto; left: 12px; }
.bl-cmp__divider { position: absolute; top: 0; bottom: 0; left: var(--bl-pos); width: var(--bl-line-w); background: var(--bl-line); transform: translateX(-50%); pointer-events: none; box-shadow: 0 0 12px rgba(0,0,0,0.4); }
.bl-cmp[data-vertical] .bl-cmp__divider { top: var(--bl-pos); bottom: auto; left: 0; right: 0; width: auto; height: var(--bl-line-w); transform: translateY(-50%); }
.bl-cmp__handle { position: absolute; top: 50%; left: var(--bl-pos); display: grid; place-items: center; width: 42px; height: 42px; margin: -21px 0 0 -21px; border-radius: 50%; background: var(--bl-line); color: var(--bl-handle-ink); box-shadow: 0 4px 16px rgba(0,0,0,0.35); cursor: grab; outline: none; transition: transform 150ms; }
.bl-cmp[data-vertical] .bl-cmp__handle { top: var(--bl-pos); left: 50%; }
.bl-cmp[data-vertical] .bl-cmp__handle svg { transform: rotate(90deg); }
.bl-cmp__handle:focus-visible { box-shadow: 0 0 0 3px var(--bl-focus), 0 4px 16px rgba(0,0,0,0.35); }
.bl-cmp[data-dragging] .bl-cmp__handle { transform: scale(1.1); cursor: grabbing; }
@media (prefers-reduced-motion: reduce) { .bl-cmp__handle, .bl-cmp__label { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const clamp = value => Math.min(100, Math.max(0, value));

export default function CompareSlider({
  before,
  after,
  beforeLabel = 'Before',
  afterLabel = 'After',
  defaultPosition = 50,
  position: controlled,
  onPositionChange,
  vertical = false,
  hover = false,
  aspectRatio = '16 / 10',
  radius = 14,
  lineColor = '#f4f4f4',
  lineWidth = 3,
  handleInk = '#1a1c2c',
  focusColor = '#73eff7',
  step = 2,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  label = 'Comparison slider',
  className = '',
  style
}) {
  useStyles();
  const ref = useRef(null);
  const [inner, setInner] = useState(defaultPosition);
  const [dragging, setDragging] = useState(false);
  const position = controlled ?? inner;
  // Latest position, so key repeats faster than a render still accumulate.
  const latest = useRef(position);
  latest.current = position;

  const set = value => {
    const next = clamp(value);
    latest.current = next;
    if (controlled === undefined) setInner(next);
    onPositionChange?.(next);
  };

  const fromPointer = event => {
    const rect = ref.current.getBoundingClientRect();
    return vertical ? ((event.clientY - rect.top) / rect.height) * 100 : ((event.clientX - rect.left) / rect.width) * 100;
  };

  const onPointerDown = event => {
    if (hover || (event.pointerType === 'mouse' && event.button !== 0)) return;
    ref.current.setPointerCapture(event.pointerId);
    setDragging(true);
    set(fromPointer(event));
  };
  const onPointerMove = event => {
    if (dragging || (hover && event.pointerType === 'mouse')) set(fromPointer(event));
  };
  const onPointerUp = () => setDragging(false);

  const onKeyDown = event => {
    const position = latest.current;
    const keys = {
      ArrowLeft: position - step,
      ArrowDown: vertical ? position + step : position - step,
      ArrowRight: position + step,
      ArrowUp: vertical ? position - step : position + step,
      PageDown: position - 10,
      PageUp: position + 10,
      Home: 0,
      End: 100
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    set(keys[event.key]);
  };

  return (
    <div
      ref={ref}
      className={`bl-cmp ${className}`}
      data-vertical={vertical || undefined}
      data-dragging={dragging || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        '--bl-pos': `${position}%`,
        '--bl-ratio': aspectRatio,
        '--bl-radius': `${radius}px`,
        '--bl-line': lineColor,
        '--bl-line-w': `${lineWidth}px`,
        '--bl-handle-ink': handleInk,
        '--bl-focus': focusColor,
        '--bl-font': fontFamily,
        '--bl-touch': vertical ? 'pan-x' : 'pan-y',
        '--bl-cursor': vertical ? 'row-resize' : 'col-resize',
        '--bl-before-o': position > 12 ? 1 : 0,
        '--bl-after-o': position < 88 ? 1 : 0,
        ...style
      }}
    >
      <div className="bl-cmp__layer">{before}</div>
      <div className="bl-cmp__layer bl-cmp__after">{after}</div>
      {beforeLabel && (
        <span className="bl-cmp__label" data-side="before" aria-hidden="true">
          {beforeLabel}
        </span>
      )}
      {afterLabel && (
        <span className="bl-cmp__label" data-side="after" aria-hidden="true">
          {afterLabel}
        </span>
      )}
      <div className="bl-cmp__divider" aria-hidden="true" />
      <div
        className="bl-cmp__handle"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-orientation={vertical ? 'vertical' : 'horizontal'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)}% ${beforeLabel || 'before'}, ${100 - Math.round(position)}% ${afterLabel || 'after'}`}
        onKeyDown={onKeyDown}
      >
        <svg width="20" height="14" viewBox="0 0 20 14" fill="currentColor" aria-hidden="true">
          <path d="M6 1 0 7l6 6zM14 1l6 6-6 6z" />
        </svg>
      </div>
    </div>
  );
}
