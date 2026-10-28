import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// A pill that morphs between states: idle, now playing, a call, a timer, a notification.
// Each view declares its own size; the island springs to it (with a little overshoot)
// while the old content blurs out and the new content blurs in. Changes are announced
// politely to screen readers. Reduced motion swaps instantly. Views may hold their own
// controls (call buttons, play/pause); pass onPress only when they don't.

const STYLE_ID = 'bl-dynamic-island';
const CSS = `
.bl-island { position: relative; display: block; margin: 0 auto; overflow: hidden; width: var(--bl-w); height: var(--bl-h); max-width: 100%; border-radius: var(--bl-r); background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); box-shadow: 0 0 0 1px var(--bl-line), 0 12px 30px -12px rgba(0,0,0,0.6); transition: width var(--bl-dur) var(--bl-ease), height var(--bl-dur) var(--bl-ease), border-radius var(--bl-dur) var(--bl-ease); }
[role="button"].bl-island { cursor: pointer; }
.bl-island:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 3px; }
.bl-island__layer { position: absolute; inset: 0; display: flex; align-items: center; transition: opacity calc(var(--bl-dur) * 0.6) ease, filter calc(var(--bl-dur) * 0.6) ease, transform var(--bl-dur) var(--bl-ease); }
.bl-island__layer[data-state="in"] { animation: bl-island-in calc(var(--bl-dur) * 0.75) ease calc(var(--bl-dur) * 0.15) both; }
@keyframes bl-island-in { from { opacity: 0; filter: blur(6px); transform: scale(0.92); } }
.bl-island__layer[data-state="out"] { opacity: 0; filter: blur(6px); transform: scale(1.04); pointer-events: none; }
.bl-island__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .bl-island, .bl-island__layer { transition: none !important; animation: none !important; } }
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
      className={`bl-island ${className}`}
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
        <span key={layer.key} className="bl-island__layer" data-state={layer.state} aria-hidden={layer.state === 'out' || undefined} inert={layer.state === 'out' ? true : undefined}>
          {views[layer.key]?.content}
        </span>
      ))}
      <span className="bl-island__sr" role="status" aria-live="polite">
        {current.label ?? ''}
      </span>
    </div>
  );
}
