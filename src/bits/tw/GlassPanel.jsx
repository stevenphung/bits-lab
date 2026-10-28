import { useEffect, useInsertionEffect, useRef } from 'react';

const STYLE_ID = 'bl-glass-panel-tw';
const CSS = `
/* theme tokens */
.bl-glass { --bl-edge: rgba(255,255,255,0.35); --bl-line: rgba(255,255,255,0.12); --bl-ink: #f4f4f4; }
:where(.light, [data-theme="light"]) .bl-glass, .bl-glass:where(.light, [data-theme="light"]) { --bl-line: rgba(26,28,44,0.12); --bl-ink: #1a1c2c; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-glass, :where(.light, [data-theme="light"]) .bl-glass:where(.dark, [data-theme="dark"]) { --bl-edge: rgba(255,255,255,0.35); --bl-line: rgba(255,255,255,0.12); --bl-ink: #f4f4f4; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-glass, .bl-glass:where([data-theme="system"]) { --bl-line: rgba(26,28,44,0.12); --bl-ink: #1a1c2c; } }
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
// A pane of frosted glass for content over busy backgrounds. Whatever is behind blurs and picks
// up a little extra colour, a bright edge catches the light along the top, and a soft sheen
// follows the pointer across the surface. Set `pixel` for an 8-bit take: a fine dither over the
// frost, like old hardware faking transparency. Where backdrop blur isn't supported it falls
// back to a stronger tint, so text stays readable. Reduced motion holds the sheen still.

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
      className={`bl-glass relative isolate overflow-hidden rounded-(--bl-radius) bg-(--bl-tint) p-(--bl-pad) font-(family-name:--bl-font) text-(--bl-ink) [--gx:50%] [--gy:0%] [-webkit-backdrop-filter:blur(var(--bl-blur))_saturate(var(--bl-sat))] [backdrop-filter:blur(var(--bl-blur))_saturate(var(--bl-sat))] shadow-[inset_0_1px_0_var(--bl-edge),inset_0_0_0_1px_var(--bl-line),0_20px_40px_-24px_rgba(0,0,0,0.7)] before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:bg-[radial-gradient(circle_var(--bl-sheen-size)_at_var(--gx)_var(--gy),var(--bl-sheen),transparent_70%)] before:[transition:background-position_200ms] before:content-[''] data-[pixel]:after:pointer-events-none data-[pixel]:after:absolute data-[pixel]:after:inset-0 data-[pixel]:after:-z-1 data-[pixel]:after:bg-(image:--bl-dither) data-[pixel]:after:bg-size-[4px_4px] data-[pixel]:after:opacity-35 data-[pixel]:after:[image-rendering:pixelated] data-[pixel]:after:content-[''] supports-[not_(backdrop-filter:blur(1px))]:bg-(--bl-fallback) ${className}`}
      data-pixel={pixel || undefined}
      style={{ '--bl-blur': `${blur}px`, '--bl-sat': saturation, '--bl-pad': typeof padding === 'number' ? `${padding}px` : padding, '--bl-radius': `${radius}px`, '--bl-tint': tint, '--bl-fallback': fallbackTint, '--bl-edge': edgeColor, '--bl-line': lineColor, '--bl-sheen': sheen ? sheenColor : 'transparent', '--bl-sheen-size': `${sheenSize}px`, '--bl-dither': DITHER, '--bl-ink': textColor, '--bl-font': fontFamily, ...style }}
    >
      {children}
    </Tag>
  );
}
