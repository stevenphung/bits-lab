import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A pill that morphs between states: idle, now playing, a call, a timer, a notification.
// Each view declares its own size; the island springs to it (with a little overshoot)
// while the old content blurs out and the new content blurs in. Changes are announced
// politely to screen readers. Reduced motion swaps instantly. Views may hold their own
// controls (call buttons, play/pause); pass onPress only when they don't.

const STYLE_ID = 'bl-dynamic-island-tw';
const CSS = `
@keyframes bl-island-in { from { opacity: 0; filter: blur(6px); transform: scale(0.92); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function DynamicIsland({
  views = {},
  view = 'idle',
  onPress,
  duration = 520,
  bounce = 0.35,
  backgroundColor = '#000000',
  textColor = '#f4f4f4',
  lineColor = 'rgba(255,255,255,0.08)',
  accentColor = '#73eff7',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const current = views[view] ?? { width: 126, height: 36 };
  const [layers, setLayers] = useState(() => [{ key: view, state: 'in' }]);
  const timer = useRef(0);

  useEffect(() => {
    // The new layer enters with a CSS animation (no frame timing needed); old ones fade out.
    setLayers(prev => {
      if (prev.some(layer => layer.key === view && layer.state === 'in')) return prev;
      return [...prev.filter(layer => layer.key !== view).map(layer => ({ ...layer, state: 'out' })), { key: view, state: 'in' }];
    });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLayers(prev => prev.filter(layer => layer.state !== 'out')), duration);
  }, [view, duration]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const radius = current.radius ?? Math.min(current.height / 2, 44);
  // Overshoot grows with `bounce`: 0 is a plain ease-out, 1 is very springy.
  const ease = `cubic-bezier(.3, ${(1 + bounce * 1.2).toFixed(2)}, .5, 1)`;

  return (
    // Always a div, so switching onPress on and off never remounts it mid-animation.
    <div
      className={`relative mx-auto block h-(--bl-h) w-(--bl-w) max-w-full overflow-hidden rounded-(--bl-r) bg-(--bl-bg) font-(family-name:--bl-font) text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line),0_12px_30px_-12px_rgba(0,0,0,0.6)] [transition:width_var(--bl-dur)_var(--bl-ease),height_var(--bl-dur)_var(--bl-ease),border-radius_var(--bl-dur)_var(--bl-ease)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--bl-accent) motion-reduce:transition-none! motion-reduce:animate-none! [&[role=button]]:cursor-pointer ${className}`}
      role={onPress ? 'button' : undefined}
      tabIndex={onPress ? 0 : undefined}
      onClick={onPress ? () => onPress(view) : undefined}
      onKeyDown={
        onPress
          ? event => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onPress(view);
              }
            }
          : undefined
      }
      aria-label={onPress ? current.label ?? view : undefined}
      style={{
        '--bl-w': `${current.width}px`,
        '--bl-h': `${current.height}px`,
        '--bl-r': `${radius}px`,
        '--bl-dur': `${duration}ms`,
        '--bl-ease': ease,
        '--bl-bg': backgroundColor,
        '--bl-ink': textColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-font': fontFamily,
        ...style
      }}
    >
      {layers.map(layer => (
        <span key={layer.key} className="absolute inset-0 flex items-center [transition:opacity_calc(var(--bl-dur)*0.6)_ease,filter_calc(var(--bl-dur)*0.6)_ease,transform_var(--bl-dur)_var(--bl-ease)] data-[state=in]:animate-[bl-island-in_calc(var(--bl-dur)*0.75)_ease_calc(var(--bl-dur)*0.15)_both] data-[state=out]:pointer-events-none data-[state=out]:opacity-0 data-[state=out]:[filter:blur(6px)] data-[state=out]:[transform:scale(1.04)] motion-reduce:transition-none! motion-reduce:animate-none!" data-state={layer.state} aria-hidden={layer.state === 'out' || undefined} inert={layer.state === 'out' ? true : undefined}>
          {views[layer.key]?.content}
        </span>
      ))}
      <span className="sr-only" role="status" aria-live="polite">
        {current.label ?? ''}
      </span>
    </div>
  );
}
