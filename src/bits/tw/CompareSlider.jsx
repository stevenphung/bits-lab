import { useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Before/after comparison. Drag the handle (or anywhere, or hover in hover mode), use arrow
// keys, Home/End and Page keys, horizontal or vertical. The "after" layer is revealed with a
// clip-path, so both sides can be any content: images, video or live components.

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
      className={`group/cmp relative aspect-(--bl-ratio) w-full overflow-hidden rounded-(--bl-radius) bg-black [cursor:var(--bl-cursor)] [touch-action:var(--bl-touch)] select-none ${className}`}
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
      <div className="absolute inset-0 [&>img]:pointer-events-none [&>img]:block [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>video]:pointer-events-none [&>video]:block [&>video]:h-full [&>video]:w-full [&>video]:object-cover">{before}</div>
      <div className="absolute inset-0 [clip-path:inset(0_0_0_var(--bl-pos))] group-data-[vertical]/cmp:[clip-path:inset(var(--bl-pos)_0_0_0)] [&>img]:pointer-events-none [&>img]:block [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>video]:pointer-events-none [&>video]:block [&>video]:h-full [&>video]:w-full [&>video]:object-cover">{after}</div>
      {beforeLabel && (
        <span className="pointer-events-none absolute top-3 rounded-[6px] bg-[rgba(0,0,0,0.6)] px-[9px] py-[5px] font-(family-name:--bl-font) text-[11px] leading-none font-semibold tracking-[0.06em] text-white uppercase transition-opacity duration-200 ease-[ease] motion-reduce:transition-none left-3 opacity-(--bl-before-o)" data-side="before" aria-hidden="true">
          {beforeLabel}
        </span>
      )}
      {afterLabel && (
        <span className="pointer-events-none absolute top-3 rounded-[6px] bg-[rgba(0,0,0,0.6)] px-[9px] py-[5px] font-(family-name:--bl-font) text-[11px] leading-none font-semibold tracking-[0.06em] text-white uppercase transition-opacity duration-200 ease-[ease] motion-reduce:transition-none right-3 opacity-(--bl-after-o) group-data-[vertical]/cmp:top-auto group-data-[vertical]/cmp:right-auto group-data-[vertical]/cmp:bottom-3 group-data-[vertical]/cmp:left-3" data-side="after" aria-hidden="true">
          {afterLabel}
        </span>
      )}
      <div className="pointer-events-none absolute top-0 bottom-0 left-(--bl-pos) w-(--bl-line-w) bg-(--bl-line) shadow-[0_0_12px_rgba(0,0,0,0.4)] [transform:translateX(-50%)] group-data-[vertical]/cmp:top-(--bl-pos) group-data-[vertical]/cmp:right-0 group-data-[vertical]/cmp:bottom-auto group-data-[vertical]/cmp:left-0 group-data-[vertical]/cmp:h-(--bl-line-w) group-data-[vertical]/cmp:w-auto group-data-[vertical]/cmp:[transform:translateY(-50%)]" aria-hidden="true" />
      <div
        className="absolute top-1/2 left-(--bl-pos) -mt-[21px] -ml-[21px] grid size-[42px] cursor-grab place-items-center rounded-[50%] bg-(--bl-line) text-(--bl-handle-ink) shadow-[0_4px_16px_rgba(0,0,0,0.35)] outline-none [transition:transform_150ms] focus-visible:shadow-[0_0_0_3px_var(--bl-focus),0_4px_16px_rgba(0,0,0,0.35)] group-data-[vertical]/cmp:top-(--bl-pos) group-data-[vertical]/cmp:left-1/2 group-data-[vertical]/cmp:[&_svg]:[transform:rotate(90deg)] group-data-[dragging]/cmp:cursor-grabbing group-data-[dragging]/cmp:[transform:scale(1.1)] motion-reduce:[transition:none]"
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
