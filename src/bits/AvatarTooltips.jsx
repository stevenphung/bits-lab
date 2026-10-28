import { useId, useInsertionEffect, useState } from 'react';

// An overlapping avatar stack. Hovering or focusing the stack fans it out; the avatar under
// the pointer lifts and springs up a name tag that sways with the pointer. Extra people
// collapse into a "+N" chip whose tag lists them. Each avatar is a focusable item with its
// name, so keyboard and screen reader users get the same information.

const STYLE_ID = 'bl-avatar-tooltips';
const CSS = `
.bl-avs { display: inline-flex; align-items: center; margin: 0; padding: var(--bl-pad) 0 0; list-style: none; font-family: var(--bl-font); }
.bl-avs__item { position: relative; flex: 0 0 auto; transition: margin 340ms cubic-bezier(.3,1.35,.5,1); }
.bl-avs__item + .bl-avs__item { margin-left: calc(var(--bl-overlap) * -1); }
.bl-avs:hover .bl-avs__item + .bl-avs__item, .bl-avs:focus-within .bl-avs__item + .bl-avs__item { margin-left: var(--bl-spread); }
.bl-avs__face { position: relative; display: grid; place-items: center; width: var(--bl-size); height: var(--bl-size); overflow: hidden; border-radius: 50%; background: var(--bl-chip); color: var(--bl-ink); font-size: calc(var(--bl-size) * 0.34); font-weight: 700; box-shadow: 0 0 0 var(--bl-ring) var(--bl-bg); outline: none; cursor: default; transition: transform 240ms cubic-bezier(.3,1.5,.5,1); }
.bl-avs__face img, .bl-avs__face svg { width: 100%; height: 100%; object-fit: cover; }
.bl-avs__item:hover, .bl-avs__item:focus-within { z-index: 2; }
.bl-avs__item:hover .bl-avs__face, .bl-avs__face:focus { transform: translateY(-6px) scale(1.08); }
.bl-avs__face:focus-visible { box-shadow: 0 0 0 var(--bl-ring) var(--bl-bg), 0 0 0 calc(var(--bl-ring) + 2px) var(--bl-accent); }
.bl-avs__tip { position: absolute; left: 50%; bottom: calc(100% + 10px); display: grid; justify-items: center; gap: 1px; padding: 6px 10px; border-radius: 8px; background: var(--bl-tip); color: var(--bl-tip-ink); white-space: nowrap; pointer-events: none; opacity: 0; transform: translate(-50%, 8px) scale(0.6) rotate(var(--bl-sway, 0deg)); transform-origin: bottom center; transition: opacity 120ms, transform 340ms cubic-bezier(.3,1.6,.5,1); }
.bl-avs__tip::after { content: ""; position: absolute; left: 50%; top: 100%; border: 5px solid transparent; border-top-color: var(--bl-tip); transform: translateX(-50%); }
.bl-avs__item:hover .bl-avs__tip, .bl-avs__face:focus + .bl-avs__tip { opacity: 1; transform: translate(-50%, 0) scale(1) rotate(var(--bl-sway, 0deg)); }
.bl-avs__name { font-size: 13px; font-weight: 700; }
.bl-avs__role { font-size: 11px; opacity: 0.75; }
.bl-avs__more { background: var(--bl-accent); color: var(--bl-tip); }
@media (prefers-reduced-motion: reduce) { .bl-avs__item, .bl-avs__face, .bl-avs__tip { transition: opacity 120ms; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const initials = name =>
  String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');

export default function AvatarTooltips({
  people = [],
  max = 5,
  size = 48,
  overlap = 14,
  spread = 6,
  ring = 3,
  sway = 12,
  label = 'Team',
  backgroundColor = '#1a1c2c',
  chipColor = '#333c57',
  textColor = '#f4f4f4',
  tooltipColor = '#f4f4f4',
  tooltipTextColor = '#1a1c2c',
  accentColor = '#73eff7',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [swayBy, setSwayBy] = useState({});
  const shown = people.length > max ? people.slice(0, max - 1) : people;
  const rest = people.length > max ? people.slice(max - 1) : [];

  // The tag leans toward the pointer's side of the avatar, like it's hanging from a string.
  const onMove = (key, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = (event.clientX - rect.left) / rect.width - 0.5;
    setSwayBy(current => ({ ...current, [key]: offset * 2 * sway }));
  };

  const item = (key, face, tip, name, extraClass = '') => (
    <li key={key} className="bl-avs__item" onPointerMove={event => onMove(key, event)} onPointerLeave={() => setSwayBy(current => ({ ...current, [key]: 0 }))}>
      <span className={`bl-avs__face ${extraClass}`} tabIndex={0} role="img" aria-label={name} aria-describedby={`${uid}-${key}`}>
        {face}
      </span>
      <span id={`${uid}-${key}`} className="bl-avs__tip" role="tooltip" style={{ '--bl-sway': `${(swayBy[key] ?? 0).toFixed(1)}deg` }}>
        {tip}
      </span>
    </li>
  );

  return (
    <ul
      className={`bl-avs ${className}`}
      aria-label={`${label}: ${people.length} ${people.length === 1 ? 'person' : 'people'}`}
      style={{
        '--bl-size': `${size}px`,
        '--bl-overlap': `${overlap}px`,
        '--bl-spread': `${spread}px`,
        '--bl-ring': `${ring}px`,
        '--bl-pad': `${Math.round(size * 0.9)}px`,
        '--bl-bg': backgroundColor,
        '--bl-chip': chipColor,
        '--bl-ink': textColor,
        '--bl-tip': tooltipColor,
        '--bl-tip-ink': tooltipTextColor,
        '--bl-accent': accentColor,
        '--bl-font': fontFamily,
        ...style
      }}
    >
      {shown.map((person, i) => {
        const key = person.id ?? `p${i}`;
        const face = person.avatar ? typeof person.avatar === 'string' ? <img src={person.avatar} alt="" /> : person.avatar : initials(person.name);
        return item(
          key,
          face,
          <>
            <span className="bl-avs__name">{person.name}</span>
            {person.role && <span className="bl-avs__role">{person.role}</span>}
          </>,
          person.role ? `${person.name}, ${person.role}` : person.name
        );
      })}
      {rest.length > 0 &&
        item(
          'more',
          `+${rest.length}`,
          <>
            <span className="bl-avs__name">{rest.length} more</span>
            <span className="bl-avs__role">{rest.slice(0, 4).map(p => p.name).join(', ')}{rest.length > 4 ? '…' : ''}</span>
          </>,
          `${rest.length} more: ${rest.map(p => p.name).join(', ')}`,
          'bl-avs__more'
        )}
    </ul>
  );
}
