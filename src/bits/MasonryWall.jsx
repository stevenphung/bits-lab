import { Children, useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

// A masonry wall that rearranges itself smoothly. Items of any height drop into whichever column
// is shortest; when the width changes, items come or go, or their size changes, everything glides
// to its new place instead of jumping, and new arrivals pop in with a stepped little bounce. Give
// each child a key so it can be tracked. Reading and tab order follow the order you pass in.
// Reduced motion places items without gliding.

const STYLE_ID = 'bl-masonry-wall';
const CSS = `
.bl-masonry { position: relative; width: 100%; }
.bl-masonry__item { position: absolute; top: 0; left: 0; width: var(--bl-col-w); transform: translate(var(--x), var(--y)); transition: transform var(--bl-dur) cubic-bezier(.2,.8,.2,1); }
.bl-masonry__item[data-new] { animation: bl-masonry-pop 360ms steps(4) both; animation-delay: calc(var(--i) * 40ms); }
.bl-masonry[data-ready="false"] .bl-masonry__item { transition: none; visibility: hidden; }
@keyframes bl-masonry-pop { from { opacity: 0; scale: 0.85; } }
@media (prefers-reduced-motion: reduce) { .bl-masonry__item { transition: none; } .bl-masonry__item[data-new] { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function MasonryWall({ children, minColumnWidth = 220, maxColumns = 6, gap = 16, duration = 450, className = '', style }) {
  useStyles();
  const items = Children.toArray(children);
  const keys = items.map((item, i) => String(item.key ?? i));
  const rootRef = useRef(null);
  const nodes = useRef(new Map());
  const seen = useRef(null);
  const [layout, setLayout] = useState({ ready: false, colWidth: 0, height: 0, pos: {} });
  const [fresh, setFresh] = useState(() => new Set());

  // Which keys are new since the last render (not on the very first one).
  useEffect(() => {
    if (seen.current) {
      const added = keys.filter(k => !seen.current.has(k));
      if (added.length) setFresh(new Set(added));
    }
    seen.current = new Set(keys);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join('|')]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const place = () => {
      const width = root.clientWidth;
      const cols = Math.max(1, Math.min(maxColumns, Math.floor((width + gap) / (minColumnWidth + gap))));
      const colWidth = (width - gap * (cols - 1)) / cols;
      const heights = new Array(cols).fill(0);
      const pos = {};
      keys.forEach(k => {
        const node = nodes.current.get(k);
        if (!node) return;
        // Shortest column first; ties go left, so order reads roughly row by row.
        const c = heights.indexOf(Math.min(...heights));
        pos[k] = { x: c * (colWidth + gap), y: heights[c] };
        heights[c] += node.offsetHeight + gap;
      });
      setLayout({ ready: true, colWidth, height: Math.max(0, Math.max(...heights) - gap), pos });
    };
    place();
    // Re-place when the wall resizes or any item changes height (images loading, text wrapping).
    const resize = new ResizeObserver(place);
    resize.observe(root);
    nodes.current.forEach(node => resize.observe(node));
    return () => resize.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join('|'), minColumnWidth, maxColumns, gap]);

  return (
    <div
      ref={rootRef}
      className={`bl-masonry ${className}`}
      data-ready={layout.ready}
      style={{ '--bl-col-w': `${layout.colWidth}px`, '--bl-dur': `${duration}ms`, height: layout.height, ...style }}
    >
      {items.map((item, i) => {
        const k = keys[i];
        const p = layout.pos[k] ?? { x: 0, y: 0 };
        return (
          <div
            key={k}
            ref={node => {
              if (node) nodes.current.set(k, node);
              else nodes.current.delete(k);
            }}
            className="bl-masonry__item"
            data-new={fresh.has(k) || undefined}
            style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, '--i': i }}
          >
            {item}
          </div>
        );
      })}
    </div>
  );
}
