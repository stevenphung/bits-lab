import { Children, useInsertionEffect } from 'react';

// A grid that spotlights one card at a time: hovering or focusing a card lifts it a touch,
// and every other card blurs, dims and shrinks back. Pure CSS (no measuring), so it costs
// nothing at rest. Children become the cards; layout is a responsive auto-fill grid.

const STYLE_ID = 'bl-focus-grid';
const CSS = `
.bl-focus { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(var(--bl-min), 100%), 1fr)); gap: var(--bl-gap); width: 100%; margin: 0; padding: 0; list-style: none; }
.bl-focus__item { position: relative; min-width: 0; border-radius: var(--bl-radius); transition: filter var(--bl-dur) ease, opacity var(--bl-dur) ease, transform var(--bl-dur) cubic-bezier(.2,.9,.25,1); }
.bl-focus:has(.bl-focus__item:is(:hover, :focus-within)) .bl-focus__item:not(:is(:hover, :focus-within)) { filter: blur(var(--bl-blur)) saturate(0.6); opacity: var(--bl-dim); transform: scale(var(--bl-shrink)); }
.bl-focus__item:is(:hover, :focus-within) { transform: scale(var(--bl-lift)); z-index: 1; }
@media (prefers-reduced-motion: reduce) {
  .bl-focus__item { transition: opacity 150ms; }
  .bl-focus:has(.bl-focus__item:is(:hover, :focus-within)) .bl-focus__item:not(:is(:hover, :focus-within)) { filter: none; transform: none; }
  .bl-focus__item:is(:hover, :focus-within) { transform: none; }
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

export default function FocusGrid({ children, minWidth = 220, gap = 16, blur = 4, dim = 0.45, shrink = 0.97, lift = 1.02, duration = 300, radius = 14, label, className = '', style }) {
  useStyles();
  return (
    <ul
      className={`bl-focus ${className}`}
      aria-label={label}
      style={{
        '--bl-min': `${minWidth}px`,
        '--bl-gap': `${gap}px`,
        '--bl-blur': `${blur}px`,
        '--bl-dim': dim,
        '--bl-shrink': shrink,
        '--bl-lift': lift,
        '--bl-dur': `${duration}ms`,
        '--bl-radius': `${radius}px`,
        ...style
      }}
    >
      {Children.toArray(children).map((child, i) => (
        <li key={child?.key ?? i} className="bl-focus__item">
          {child}
        </li>
      ))}
    </ul>
  );
}
