import { useInsertionEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Team invites as a game party. Members fill the slots, open slots wait with a "+", and the
// people you can invite sit on the bench below. Drag someone into an open slot, or press their
// Invite button: the dashed link to them turns solid and they come online. onInvite tells you
// who joined. Every drag has a button twin, and each join is announced. Reduced motion drops the
// pop and the ping.

const STYLE_ID = 'bl-party-invite-tw';
const CSS = `
/* theme tokens */
.bl-party { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-done: #38b764; --bl-gold: #ffcd75; }
:where(.light, [data-theme="light"]) .bl-party, .bl-party:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-done: #2b8a4a; --bl-gold: #a86a12; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-party, :where(.light, [data-theme="light"]) .bl-party:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-done: #38b764; --bl-gold: #ffcd75; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-party, .bl-party:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-done: #2b8a4a; --bl-gold: #a86a12; } }
/* theme tokens end */
@keyframes bl-party-join { from { opacity: 0; transform: scale(0.4); } 60% { transform: scale(1.15); } }
@keyframes bl-party-ping { 50% { box-shadow: 0 0 0 2px var(--bl-bg), 0 0 0 5px var(--bl-done); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const initials = (name: string) =>
  String(name ?? '?')
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const face = (person: PartyMember) => (typeof person.avatar === 'string' ? <img src={person.avatar} alt="" /> : (person.avatar ?? initials(person.name)));

export interface PartyMember {
  id: string;
  name: string;
  role?: string;
  /** An image URL or a node; initials otherwise. */
  avatar?: ReactNode;
  color?: string;
  online?: boolean;
}

export interface PartyInviteProps {
  members?: PartyMember[];
  candidates?: PartyMember[];
  slots?: number;
  onInvite?: (person: PartyMember) => void;
  title?: string;
  hint?: ReactNode;
  inviteLabel?: string;
  openLabel?: string;
  width?: number;
  backgroundColor?: string;
  chipColor?: string;
  lineColor?: string;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  doneColor?: string;
  goldColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function PartyInvite({
  members = [],
  candidates = [],
  slots = 4,
  onInvite,
  title = 'Your party',
  hint = 'Drag someone into an open slot, or press Invite.',
  inviteLabel = 'Invite',
  openLabel = 'Open slot',
  width = 420,
  backgroundColor,
  chipColor,
  lineColor,
  textColor,
  mutedColor,
  accentColor,
  doneColor,
  goldColor,
  fontFamily = 'inherit',
  className = '',
  style
}: PartyInviteProps) {
  useStyles();
  const [joined, setJoined] = useState<string[]>([]);
  const [fresh, setFresh] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; over: boolean } | null>(null);
  const [said, setSaid] = useState('');
  const slotRefs = useRef<(HTMLLIElement | null)[]>([]);
  const origin = useRef<{ x: number; y: number } | null>(null);

  const party = [...members, ...joined.map(id => candidates.find(c => c.id === id)).filter(Boolean) as PartyMember[]];
  const total = Math.max(slots, party.length);
  const open = total - party.length;
  const bench = candidates.filter(c => !joined.includes(c.id));

  const invite = (person: PartyMember) => {
    if (open <= 0 || joined.includes(person.id)) return;
    setJoined(ids => [...ids, person.id]);
    setFresh(person.id);
    setSaid(`${person.name} joined the party.`);
    onInvite?.(person);
  };

  // Is the point over one of the open slots?
  const overOpen = (x: number, y: number) =>
    slotRefs.current.slice(party.length, total).some(el => {
      const box = el?.getBoundingClientRect();
      return box && x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
    });

  const down = (event: PointerEvent<HTMLDivElement>, person: PartyMember) => {
    if (event.button !== 0 || (event.target as Element).closest('button') || open <= 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    origin.current = { x: event.clientX, y: event.clientY };
    setDrag({ id: person.id, x: 0, y: 0, over: false });
  };

  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag || !origin.current) return;
    const next = { id: drag.id, x: event.clientX - origin.current.x, y: event.clientY - origin.current.y, over: overOpen(event.clientX, event.clientY) };
    setDrag(next);
  };

  const up = (event: PointerEvent<HTMLDivElement>, person: PartyMember) => {
    if (!drag) return;
    const hit = overOpen(event.clientX, event.clientY);
    setDrag(null);
    origin.current = null;
    if (hit) invite(person);
  };

  return (
    <section
      className={`bl-party grid gap-[14px] p-4 w-[min(var(--bl-w),100%)] box-border bg-(--bl-bg) text-(--bl-ink) font-(family-name:--bl-font) text-[14px] shadow-[inset_0_0_0_3px_var(--bl-line),6px_6px_0_rgba(0,0,0,0.45)] ${className}`}
      aria-label={title}
      style={{ '--bl-w': `${width}px`, '--bl-n': total, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-done': doneColor, '--bl-gold': goldColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <p className="m-0 flex items-baseline justify-between gap-2">
        <span className="text-[12px] font-extrabold tracking-[0.06em] uppercase text-(--bl-gold)">{title}</span>
        <span className="text-[12px] font-bold text-(--bl-muted)">
          {party.length} / {total}
        </span>
      </p>
      <ol className="m-0 grid list-none grid-cols-[repeat(var(--bl-n),minmax(0,1fr))] gap-3 p-0">
        {Array.from({ length: total }, (_, i) => {
          const member = party[i];
          return (
            <li
              key={member?.id ?? `open-${i}`}
              ref={el => {
                slotRefs.current[i] = el;
              }}
              className="group/slot relative grid min-w-0 [align-content:start] justify-items-center gap-1.5 [*+&]:before:absolute [*+&]:before:top-[21px] [*+&]:before:right-[calc(50%+22px)] [*+&]:before:w-[calc(100%-32px)] [*+&]:before:[border-top:2px_dashed_var(--bl-line)] [*+&]:before:content-[''] [[data-filled]+&]:data-[filled]:before:[border-top-color:var(--bl-done)] [[data-filled]+&]:data-[filled]:before:[border-top-style:solid]"
              data-filled={member ? '' : undefined}
              data-new={member && member.id === fresh ? '' : undefined}
              data-over={!member && drag?.over ? '' : undefined}
            >
              {member ? (
                <>
                  <span className="relative grid size-11 place-items-center bg-[var(--c,var(--bl-accent))] font-black text-[#0b0b14] shadow-[inset_0_0_0_3px_rgba(0,0,0,0.3)] [&_img]:size-full [&_img]:object-cover [&_img]:[image-rendering:pixelated] group-data-[new]/slot:animate-[bl-party-join_420ms_steps(4)_both] motion-reduce:animate-none!" style={{ '--c': member.color } as CSSVars}>
                    {face(member)}
                    <span className="absolute -right-[3px] -bottom-[3px] size-2.5 bg-(--bl-muted) shadow-[0_0_0_2px_var(--bl-bg)] data-[online]:bg-(--bl-done) group-data-[new]/slot:animate-[bl-party-ping_900ms_steps(3)_2] motion-reduce:animate-none!" data-online={member.online === false ? undefined : ''} />
                  </span>
                  <span className="max-w-full overflow-hidden text-[12px] font-bold text-ellipsis whitespace-nowrap">{member.name}</span>
                  {member.role && <span className="text-[11px] text-(--bl-muted)">{member.role}</span>}
                  <span className="sr-only">{member.online === false ? 'offline' : 'online'}</span>
                </>
              ) : (
                <>
                  <span className="box-border grid size-11 place-items-center border-2 border-dashed border-(--bl-line) text-[20px] font-extrabold text-(--bl-muted) group-data-[over]/slot:border-(--bl-accent) group-data-[over]/slot:bg-(--bl-chip) group-data-[over]/slot:text-(--bl-accent)" aria-hidden="true">
                    +
                  </span>
                  <span className="text-[11px] text-(--bl-muted)">{openLabel}</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
      {bench.length > 0 && (
        <>
          <p className="m-0 pt-3 [border-top:2px_dashed_var(--bl-line)] text-[12px] text-(--bl-muted)">{hint}</p>
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Invite">
            {bench.map(person => (
              <li key={person.id}>
                <div
                  className="relative inline-flex cursor-grab touch-none items-center gap-2 bg-(--bl-chip) p-1 select-none data-[dragging]:z-2 data-[dragging]:cursor-grabbing data-[dragging]:shadow-[inset_0_0_0_2px_var(--bl-accent),4px_4px_0_rgba(0,0,0,0.45)]"
                  data-dragging={drag?.id === person.id ? '' : undefined}
                  style={drag?.id === person.id ? { transform: `translate(${drag.x}px, ${drag.y}px)` } : undefined}
                  onPointerDown={event => down(event, person)}
                  onPointerMove={move}
                  onPointerUp={event => up(event, person)}
                  onPointerCancel={() => setDrag(null)}
                >
                  <span className="grid size-7 place-items-center overflow-hidden bg-[var(--c,var(--bl-accent))] text-[12px] font-black text-[#0b0b14] [&_img]:size-full [&_img]:object-cover [&_img]:[image-rendering:pixelated]" style={{ '--c': person.color } as CSSVars}>
                    {face(person)}
                  </span>
                  <span className="max-w-full overflow-hidden text-[12px] font-bold text-ellipsis whitespace-nowrap">{person.name}</span>
                  <button type="button" className="cursor-pointer border-0 bg-(--bl-accent) px-2 py-1 text-[12px] font-extrabold text-[#0b0b14] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid disabled:cursor-default disabled:bg-(--bl-line) disabled:text-(--bl-muted)" disabled={open <= 0} onClick={() => invite(person)}>
                    {inviteLabel}
                    <span className="sr-only"> {person.name}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <span className="sr-only" aria-live="polite">
        {said}
      </span>
    </section>
  );
}
