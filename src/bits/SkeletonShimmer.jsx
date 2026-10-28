import { useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

// Skeletons that draw themselves from your real layout. While `loading`, render your
// component as usual (with placeholder data); SkeletonShimmer hides it and traces a
// skeleton over it: one bar per actual line of text, and a block for every image, icon,
// button and field, with matching corner radii. When loading ends the skeleton crossfades
// into the real content. No hand-built skeleton component to keep in sync.

const STYLE_ID = 'bl-skeleton-shimmer';
const CSS = `
/* theme tokens */
.bl-skel { --bl-base: #262b44; --bl-shine: #3a4266; }
:where(.light, [data-theme="light"]) .bl-skel, .bl-skel:where(.light, [data-theme="light"]) { --bl-base: #e3dccd; --bl-shine: #f4f1e8; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-skel, :where(.light, [data-theme="light"]) .bl-skel:where(.dark, [data-theme="dark"]) { --bl-base: #262b44; --bl-shine: #3a4266; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-skel, .bl-skel:where([data-theme="system"]) { --bl-base: #e3dccd; --bl-shine: #f4f1e8; } }
/* theme tokens end */
.bl-skel { position: relative; }
.bl-skel__content { transition: opacity var(--bl-fade) ease; }
.bl-skel[data-loading] .bl-skel__content { opacity: 0; visibility: hidden; }
.bl-skel__bones { position: absolute; inset: 0; pointer-events: none; transition: opacity var(--bl-fade) ease; }
.bl-skel__bones[data-leaving] { opacity: 0; }
.bl-skel__bone { position: absolute; left: var(--x); top: var(--y); width: var(--w); height: var(--h); border-radius: var(--r); background: linear-gradient(100deg, var(--bl-base) 0 40%, var(--bl-shine) 50%, var(--bl-base) 60% 100%); background-size: 300% 100%; animation: bl-skel-shine var(--bl-speed) linear infinite; animation-delay: calc(var(--x01) * var(--bl-speed) * -0.5); }
.bl-skel__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-skel-shine { from { background-position: 100% 0; } to { background-position: 0 0; } }
@media (prefers-reduced-motion: reduce) { .bl-skel__bone { animation: none; } .bl-skel__content, .bl-skel__bones { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const BLOCKS = 'img, svg, video, canvas, picture, iframe, input, textarea, select, button, [role="img"], [data-skeleton]';

// Traces the content: blocks for media and controls, one bar per rendered line of text.
function trace(root, lineScale) {
  const origin = root.getBoundingClientRect();
  const bones = [];
  const add = (rect, radius) => {
    if (rect.width < 2 || rect.height < 2) return;
    bones.push({ x: rect.left - origin.left, y: rect.top - origin.top, w: rect.width, h: rect.height, r: radius });
  };
  for (const node of root.querySelectorAll(BLOCKS)) {
    if (node.parentElement?.closest(BLOCKS) && !node.matches('[data-skeleton]')) continue;
    if (node.closest('[data-skeleton="skip"]')) continue;
    const radius = getComputedStyle(node).borderRadius;
    add(node.getBoundingClientRect(), radius && radius !== '0px' ? radius : '6px');
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: text => (text.textContent.trim() && !text.parentElement?.closest(`${BLOCKS}, [data-skeleton="skip"]`) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT)
  });
  const range = document.createRange();
  // Merge the fragments of each visual line (one text node can wrap; several share a line).
  const lines = [];
  for (let text = walker.nextNode(); text; text = walker.nextNode()) {
    range.selectNodeContents(text);
    for (const rect of range.getClientRects()) {
      if (rect.width < 2) continue;
      const line = lines.find(l => Math.abs(l.top - rect.top) < rect.height / 2 && rect.left <= l.right + 12 && rect.right >= l.left - 12);
      if (line) {
        line.left = Math.min(line.left, rect.left);
        line.right = Math.max(line.right, rect.right);
      } else {
        lines.push({ top: rect.top, left: rect.left, right: rect.right, height: rect.height });
      }
    }
  }
  for (const line of lines) {
    const h = line.height * lineScale;
    add({ left: line.left, top: line.top + (line.height - h) / 2, width: line.right - line.left, height: h }, `${Math.min(6, h / 2)}px`);
  }
  return { bones, width: origin.width };
}

export default function SkeletonShimmer({
  loading = false,
  children,
  lineScale = 0.62,
  fade = 320,
  speed = 1400,
  baseColor,
  shineColor,
  loadingLabel = 'Loading…',
  className = '',
  style
}) {
  useStyles();
  const contentRef = useRef(null);
  const [skeleton, setSkeleton] = useState({ bones: [], width: 1 });
  const [showBones, setShowBones] = useState(loading);
  const [leaving, setLeaving] = useState(false);

  // Trace while loading, and re-trace when the layout changes size.
  useLayoutEffect(() => {
    if (!loading) return undefined;
    setShowBones(true);
    setLeaving(false);
    const node = contentRef.current;
    const measure = () => setSkeleton(trace(node, lineScale));
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(node);
    return () => resize.disconnect();
  }, [loading, lineScale]);

  // Crossfade out, then drop the bones.
  useEffect(() => {
    if (loading || !showBones) return undefined;
    setLeaving(true);
    const timer = setTimeout(() => setShowBones(false), fade);
    return () => clearTimeout(timer);
  }, [loading, showBones, fade]);

  return (
    <div className={`bl-skel ${className}`} data-loading={loading || undefined} aria-busy={loading} style={{ '--bl-fade': `${fade}ms`, '--bl-speed': `${speed}ms`, '--bl-base': baseColor, '--bl-shine': shineColor, ...style }}>
      <div ref={contentRef} className="bl-skel__content" inert={loading || undefined}>
        {children}
      </div>
      {showBones && (
        <div className="bl-skel__bones" data-leaving={leaving || undefined} aria-hidden="true">
          {skeleton.bones.map((bone, i) => (
            <span
              key={i}
              className="bl-skel__bone"
              style={{ '--x': `${bone.x}px`, '--y': `${bone.y}px`, '--w': `${bone.w}px`, '--h': `${bone.h}px`, '--r': bone.r, '--x01': (bone.x / skeleton.width).toFixed(3) }}
            />
          ))}
        </div>
      )}
      {loading && (
        <span className="bl-skel__sr" role="status">
          {loadingLabel}
        </span>
      )}
    </div>
  );
}
