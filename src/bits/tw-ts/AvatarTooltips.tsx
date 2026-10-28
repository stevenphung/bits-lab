import { useId, useState, type CSSProperties, type ReactNode, type PointerEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// An overlapping avatar stack. Hovering or focusing the stack fans it out; the avatar under
// the pointer lifts and springs up a name tag that sways with the pointer. Extra people
// collapse into a "+N" chip whose tag lists them. Each avatar is a focusable item with its
// name, so keyboard and screen reader users get the same information.

export interface StackPerson {
  id?: string;
  name: string;
  role?: string;
  /** An image URL or any node; initials are used otherwise. */
  avatar?: ReactNode;
}

export interface AvatarTooltipsProps {
  people?: StackPerson[];
  /** Visible avatars; the rest fold into a "+N" chip. */
  max?: number;
  size?: number;
  /** Overlap at rest, in px. */
  overlap?: number;
  /** Gap when fanned out, in px. */
  spread?: number;
  ring?: number;
  /** How far the tag swings toward the pointer, in degrees. */
  sway?: number;
  label?: string;
  backgroundColor?: string;
  chipColor?: string;
  textColor?: string;
  tooltipColor?: string;
  tooltipTextColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

const initials = (name: string) =>
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
}: AvatarTooltipsProps) {
  
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [swayBy, setSwayBy] = useState<Record<string, number>>({});
  const shown = people.length > max ? people.slice(0, max - 1) : people;
  const rest = people.length > max ? people.slice(max - 1) : [];

  // The tag leans toward the pointer's side of the avatar, like it's hanging from a string.
  const onMove = (key: string, event: PointerEvent<HTMLLIElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offset = (event.clientX - rect.left) / rect.width - 0.5;
    setSwayBy(current => ({ ...current, [key]: offset * 2 * sway }));
  };

  const item = (key: string, face: ReactNode, tip: ReactNode, name: string, extraClass = '') => (
    <li key={key} className="group/item relative flex-none [transition:margin_340ms_cubic-bezier(.3,1.35,.5,1)] not-first:ml-[calc(var(--bl-overlap)*-1)] focus-within:z-2 hover:z-2 group-focus-within/avs:not-first:ml-(--bl-spread) group-hover/avs:not-first:ml-(--bl-spread) motion-reduce:[transition:opacity_120ms]" onPointerMove={event => onMove(key, event)} onPointerLeave={() => setSwayBy(current => ({ ...current, [key]: 0 }))}>
      <span className={`peer/face relative grid size-(--bl-size) cursor-default place-items-center overflow-hidden rounded-[50%] [font-size:calc(var(--bl-size)*0.34)] font-bold shadow-[0_0_0_var(--bl-ring)_var(--bl-bg)] outline-none [transition:transform_240ms_cubic-bezier(.3,1.5,.5,1)] focus:[transform:translateY(-6px)_scale(1.08)] group-hover/item:[transform:translateY(-6px)_scale(1.08)] focus-visible:shadow-[0_0_0_var(--bl-ring)_var(--bl-bg),0_0_0_calc(var(--bl-ring)_+_2px)_var(--bl-accent)] [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_svg]:h-full [&_svg]:w-full [&_svg]:object-cover motion-reduce:[transition:opacity_120ms] ${extraClass ? 'bg-(--bl-accent) text-(--bl-tip)' : 'bg-(--bl-chip) text-(--bl-ink)'}`} tabIndex={0} role="img" aria-label={name} aria-describedby={`${uid}-${key}`}>
        {face}
      </span>
      <span id={`${uid}-${key}`} className="pointer-events-none absolute bottom-[calc(100%_+_10px)] left-1/2 grid origin-bottom justify-items-center gap-px rounded-[8px] bg-(--bl-tip) px-2.5 py-1.5 whitespace-nowrap text-(--bl-tip-ink) opacity-0 [transform:translate(-50%,8px)_scale(0.6)_rotate(var(--bl-sway,0deg))] [transition:opacity_120ms,transform_340ms_cubic-bezier(.3,1.6,.5,1)] after:absolute after:top-full after:left-1/2 after:border-5 after:border-solid after:border-transparent after:border-t-(--bl-tip) after:[transform:translateX(-50%)] group-hover/item:opacity-100 group-hover/item:[transform:translate(-50%,0)_scale(1)_rotate(var(--bl-sway,0deg))] peer-focus/face:opacity-100 peer-focus/face:[transform:translate(-50%,0)_scale(1)_rotate(var(--bl-sway,0deg))] motion-reduce:[transition:opacity_120ms]" role="tooltip" style={{ '--bl-sway': `${(swayBy[key] ?? 0).toFixed(1)}deg` } as CSSVars}>
        {tip}
      </span>
    </li>
  );

  return (
    <ul
      className={`group/avs m-0 inline-flex list-none items-center px-0 pt-(--bl-pad) pb-0 font-(family-name:--bl-font) ${className}`}
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
      } as CSSVars}
    >
      {shown.map((person, i) => {
        const key = person.id ?? `p${i}`;
        const face = person.avatar ? typeof person.avatar === 'string' ? <img src={person.avatar} alt="" /> : person.avatar : initials(person.name);
        return item(
          key,
          face,
          <>
            <span className="text-[13px] font-bold">{person.name}</span>
            {person.role && <span className="text-[11px] opacity-75">{person.role}</span>}
          </>,
          person.role ? `${person.name}, ${person.role}` : person.name
        );
      })}
      {rest.length > 0 &&
        item(
          'more',
          `+${rest.length}`,
          <>
            <span className="text-[13px] font-bold">{rest.length} more</span>
            <span className="text-[11px] opacity-75">{rest.slice(0, 4).map(p => p.name).join(', ')}{rest.length > 4 ? '…' : ''}</span>
          </>,
          `${rest.length} more: ${rest.map(p => p.name).join(', ')}`,
          'bl-avs__more'
        )}
    </ul>
  );
}
