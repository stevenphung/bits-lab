import { useEffect, useInsertionEffect, useRef } from 'react';

// A pane of frosted glass for content over busy backgrounds. Whatever is behind blurs and picks
// up a little extra colour, a bright edge catches the light along the top, and a soft sheen
// follows the pointer across the surface. Set `pixel` for an 8-bit take: a fine dither over the
// frost, like old hardware faking transparency. Where backdrop blur isn't supported it falls
// back to a stronger tint, so text stays readable. Reduced motion holds the sheen still.

const STYLE_ID = 'bl-glass-panel';
const CSS = `
/* theme tokens */
.bl-glass { --bl-edge: rgba(255,255,255,0.35); --bl-line: rgba(255,255,255,0.12); --bl-ink: #f4f4f4; }
:where(.light, [data-theme="light"]) .bl-glass, .bl-glass:where(.light, [data-theme="light"]) { --bl-line: rgba(26,28,44,0.12); --bl-ink: #1a1c2c; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-glass, :where(.light, [data-theme="light"]) .bl-glass:where(.dark, [data-theme="dark"]) { --bl-edge: rgba(255,255,255,0.35); --bl-line: rgba(255,255,255,0.12); --bl-ink: #f4f4f4; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-glass, .bl-glass:where([data-theme="system"]) { --bl-line: rgba(26,28,44,0.12); --bl-ink: #1a1c2c; } }
/* theme tokens end */
.bl-glass { --gx: 50%; --gy: 0%; position: relative; overflow: hidden; isolation: isolate; padding: var(--bl-pad); border-radius: var(--bl-radius); background: var(--bl-tint); color: var(--bl-ink); font-family: var(--bl-font); -webkit-backdrop-filter: blur(var(--bl-blur)) saturate(var(--bl-sat)); backdrop-filter: blur(var(--bl-blur)) saturate(var(--bl-sat)); box-shadow: inset 0 1px 0 var(--bl-edge), inset 0 0 0 1px var(--bl-line), 0 20px 40px -24px rgba(0,0,0,0.7); }
.bl-glass::before { content: ""; position: absolute; inset: 0; z-index: -1; background: radial-gradient(circle var(--bl-sheen-size) at var(--gx) var(--gy), var(--bl-sheen), transparent 70%); pointer-events: none; transition: background-position 200ms; }
.bl-glass[data-pixel]::after { content: ""; position: absolute; inset: 0; z-index: -1; background-image: var(--bl-dither); background-size: 4px 4px; opacity: 0.35; image-rendering: pixelated; pointer-events: none; }
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) { .bl-glass { background: var(--bl-fallback); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// A 2×2 checker of light and clear pixels.
const DITHER = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="2" height="2" shape-rendering="crispEdges"><rect width="1" height="1" fill="rgba(255,255,255,0.35)"/><rect x="1" y="1" width="1" height="1" fill="rgba(255,255,255,0.35)"/></svg>')}")`;

export default function GlassPanel({
  children,
  as: Tag = 'div',
  blur = 14,
  saturation = 1.5,
  pixel = false,
  sheen = true,
  padding = 24,
  radius = 18,
  tint = 'rgba(38,43,68,0.42)',
  fallbackTint = 'rgba(26,28,44,0.92)',
  edgeColor,
  lineColor,
  sheenColor = 'rgba(255,255,255,0.14)',
  sheenSize = 260,
  textColor,
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const rootRef = useRef(null);

  useEffect(() => {
    if (!sheen || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const root = rootRef.current;
    let raf = 0;
    const onMove = event => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = root.getBoundingClientRect();
        root.style.setProperty('--gx', `${(event.clientX - r.left).toFixed(0)}px`);
        root.style.setProperty('--gy', `${(event.clientY - r.top).toFixed(0)}px`);
      });
    };
    const onLeave = () => {
      root.style.removeProperty('--gx');
      root.style.removeProperty('--gy');
    };
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
    };
  }, [sheen]);

  return (
    <Tag
      ref={rootRef}
      className={`bl-glass ${className}`}
      data-pixel={pixel || undefined}
      style={{ '--bl-blur': `${blur}px`, '--bl-sat': saturation, '--bl-pad': typeof padding === 'number' ? `${padding}px` : padding, '--bl-radius': `${radius}px`, '--bl-tint': tint, '--bl-fallback': fallbackTint, '--bl-edge': edgeColor, '--bl-line': lineColor, '--bl-sheen': sheen ? sheenColor : 'transparent', '--bl-sheen-size': `${sheenSize}px`, '--bl-dither': DITHER, '--bl-ink': textColor, '--bl-font': fontFamily, ...style }}
    >
      {children}
    </Tag>
  );
}
