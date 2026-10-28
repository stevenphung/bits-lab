import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A camera focus pull on a line of text. It starts soft and out of focus, with red and cyan
// fringes like a cheap lens, then the focus racks across it: sweeping from the start of the
// line, opening out from the centre, or snapping in with a little lens "breathe". It can rack
// again on hover. Screen readers get the text once; reduced motion shows it sharp at once.

const STYLE_ID = 'bl-focus-pull-tw';
const CSS = `
@keyframes bl-focus-breathe {
  0% { filter: blur(var(--bl-depth)); opacity: 0.35; text-shadow: var(--bl-fringe) 0 0 var(--bl-red), calc(var(--bl-fringe) * -1) 0 0 var(--bl-cyan); }
  55% { filter: blur(0); opacity: 1; text-shadow: 0 0 0 transparent, 0 0 0 transparent; }
  72% { filter: blur(calc(var(--bl-depth) * 0.18)); text-shadow: calc(var(--bl-fringe) * 0.4) 0 0 var(--bl-red), calc(var(--bl-fringe) * -0.4) 0 0 var(--bl-cyan); }
  100% { filter: blur(0); opacity: 1; text-shadow: 0 0 0 transparent, 0 0 0 transparent; }
}
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function FocusPull({
  text = '',
  as: Tag = 'p',
  rack = 'sweep',
  pull = 900,
  spread = 700,
  depth = 8,
  fringe = 3,
  trigger = 'view',
  threshold = 0.4,
  textColor = 'inherit',
  fringeColors = ['rgba(239,125,87,0.7)', 'rgba(115,239,247,0.7)'],
  onFocused,
  className = '',
  style
}) {
  useStyles();
  const rootRef = useRef(null);
  const focusedRef = useRef(onFocused);
  focusedRef.current = onFocused;
  const [state, setState] = useState(trigger === 'mount' ? 'sharp' : 'soft');
  const n = Math.max(1, [...text].length - 1);
  // Where each letter sits in the rack: 0 sharpens first.
  const position = i => (rack === 'center' ? Math.abs(i / n - 0.5) * 2 : rack === 'snap' ? 0 : i / n);

  useEffect(() => {
    if (trigger !== 'view') return undefined;
    const root = rootRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState('sharp');
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, [trigger, threshold]);

  useEffect(() => {
    if (state !== 'sharp') return undefined;
    const timer = setTimeout(() => focusedRef.current?.(), pull + (rack === 'snap' ? 0 : spread));
    return () => clearTimeout(timer);
  }, [state, pull, spread, rack]);

  // Hover racks the focus again: drop to soft for a frame, then pull.
  const onPointerEnter = () => {
    if (trigger !== 'hover' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    setState('soft');
    requestAnimationFrame(() => requestAnimationFrame(() => setState('sharp')));
  };

  let index = 0;
  return (
    <Tag
      ref={rootRef}
      className={`group/focus m-0 text-(--bl-ink) ${className}`}
      data-state={state}
      data-rack={rack}
      onPointerEnter={onPointerEnter}
      style={{ '--bl-pull': `${pull}ms`, '--bl-spread': `${rack === 'snap' ? 0 : spread}ms`, '--bl-depth': `${depth}px`, '--bl-fringe': `${fringe}px`, '--bl-red': fringeColors[0], '--bl-cyan': fringeColors[1], '--bl-ink': textColor, ...style }}
    >
      <span className="sr-only">{text}</span>
      <span className="inline" aria-hidden="true">
        {text.split(/(\s+)/).map((part, w) => {
          if (!part) return null;
          if (/^\s+$/.test(part)) {
            index += part.length;
            return ' ';
          }
          // A word's letters stay together, so lines only break between words.
          return (
            <span key={w} className="inline-block whitespace-nowrap">
              {[...part].map(ch => {
                const i = index++;
                return (
                  <span key={i} className="inline-block whitespace-pre [transition:filter_var(--bl-pull)_cubic-bezier(.2,.7,.2,1)_calc(var(--p)_*_var(--bl-spread)),opacity_var(--bl-pull)_ease_calc(var(--p)_*_var(--bl-spread)),text-shadow_var(--bl-pull)_cubic-bezier(.2,.7,.2,1)_calc(var(--p)_*_var(--bl-spread))] group-data-[state=soft]/focus:[filter:blur(var(--bl-depth))] group-data-[state=soft]/focus:opacity-35 group-data-[state=soft]/focus:[text-shadow:var(--bl-fringe)_0_0_var(--bl-red),calc(var(--bl-fringe)_*_-1)_0_0_var(--bl-cyan)] group-data-[state=soft]/focus:[transition:none] group-[[data-state=sharp][data-rack=snap]]/focus:animate-[bl-focus-breathe_var(--bl-pull)_cubic-bezier(.2,.7,.2,1)_both] group-[[data-state=sharp][data-rack=snap]]/focus:[transition:none] motion-reduce:animate-none! motion-reduce:opacity-100! motion-reduce:[filter:none]! motion-reduce:[text-shadow:none]! motion-reduce:[transition:none]!" style={{ '--p': position(i).toFixed(3) }}>
                    {ch}
                  </span>
                );
              })}
            </span>
          );
        })}
      </span>
    </Tag>
  );
}
