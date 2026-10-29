import { useInsertionEffect, useRef, useState } from 'react';

// Team invites as a game party. Members fill the slots, open slots wait with a "+", and the
// people you can invite sit on the bench below. Drag someone into an open slot, or press their
// Invite button: the dashed link to them turns solid and they come online. onInvite tells you
// who joined. Every drag has a button twin, and each join is announced. Reduced motion drops the
// pop and the ping.

const STYLE_ID = 'bl-party-invite';
const CSS = `
/* theme tokens */
.bl-party { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-done: #38b764; --bl-gold: #ffcd75; }
:where(.light, [data-theme="light"]) .bl-party, .bl-party:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-done: #2b8a4a; --bl-gold: #a86a12; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-party, :where(.light, [data-theme="light"]) .bl-party:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-done: #38b764; --bl-gold: #ffcd75; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-party, .bl-party:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-done: #2b8a4a; --bl-gold: #a86a12; } }
/* theme tokens end */
.bl-party { display: grid; gap: 14px; width: min(var(--bl-w), 100%); padding: 16px; box-sizing: border-box; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); font-size: 14px; box-shadow: inset 0 0 0 3px var(--bl-line), 6px 6px 0 rgba(0,0,0,0.45); }
.bl-party__head { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin: 0; }
.bl-party__title { color: var(--bl-gold); font-size: 12px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
.bl-party__count { color: var(--bl-muted); font-size: 12px; font-weight: 700; }
.bl-party__slots { display: grid; grid-template-columns: repeat(var(--bl-n), minmax(0, 1fr)); gap: 12px; margin: 0; padding: 0; list-style: none; }
.bl-party__slot { position: relative; display: grid; justify-items: center; align-content: start; gap: 6px; min-width: 0; }
.bl-party__slot + .bl-party__slot::before { content: ''; position: absolute; top: 21px; right: calc(50% + 22px); width: calc(100% - 32px); border-top: 2px dashed var(--bl-line); }
.bl-party__slot[data-filled] + .bl-party__slot[data-filled]::before { border-top-style: solid; border-top-color: var(--bl-done); }
.bl-party__avatar { position: relative; display: grid; place-items: center; width: 44px; height: 44px; background: var(--c, var(--bl-accent)); color: #0b0b14; font-weight: 900; box-shadow: inset 0 0 0 3px rgba(0,0,0,0.3); }
.bl-party__avatar img, .bl-party__mini img { width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; }
.bl-party__dot { position: absolute; right: -3px; bottom: -3px; width: 10px; height: 10px; background: var(--bl-muted); box-shadow: 0 0 0 2px var(--bl-bg); }
.bl-party__dot[data-online] { background: var(--bl-done); }
.bl-party__slot[data-new] .bl-party__avatar { animation: bl-party-join 420ms steps(4) both; }
.bl-party__slot[data-new] .bl-party__dot { animation: bl-party-ping 900ms steps(3) 2; }
.bl-party__open { display: grid; place-items: center; width: 44px; height: 44px; box-sizing: border-box; border: 2px dashed var(--bl-line); color: var(--bl-muted); font-size: 20px; font-weight: 800; }
.bl-party__slot[data-over] .bl-party__open { border-color: var(--bl-accent); background: var(--bl-chip); color: var(--bl-accent); }
.bl-party__name { max-width: 100%; overflow: hidden; font-size: 12px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.bl-party__role { color: var(--bl-muted); font-size: 11px; }
.bl-party__hint { margin: 0; padding-top: 12px; border-top: 2px dashed var(--bl-line); color: var(--bl-muted); font-size: 12px; }
.bl-party__bench { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
.bl-party__chip { position: relative; display: inline-flex; align-items: center; gap: 8px; padding: 4px; background: var(--bl-chip); cursor: grab; touch-action: none; user-select: none; }
.bl-party__chip[data-dragging] { z-index: 2; cursor: grabbing; box-shadow: inset 0 0 0 2px var(--bl-accent), 4px 4px 0 rgba(0,0,0,0.45); }
.bl-party__mini { display: grid; place-items: center; width: 28px; height: 28px; overflow: hidden; background: var(--c, var(--bl-accent)); color: #0b0b14; font-size: 12px; font-weight: 900; }
.bl-party__invite { padding: 4px 8px; border: 0; background: var(--bl-accent); color: #0b0b14; font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; }
.bl-party__invite:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-party__invite:disabled { background: var(--bl-line); color: var(--bl-muted); cursor: default; }
.bl-party__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-party-join { from { opacity: 0; transform: scale(0.4); } 60% { transform: scale(1.15); } }
@keyframes bl-party-ping { 50% { box-shadow: 0 0 0 2px var(--bl-bg), 0 0 0 5px var(--bl-done); } }
@media (prefers-reduced-motion: reduce) { .bl-party__slot[data-new] .bl-party__avatar, .bl-party__slot[data-new] .bl-party__dot { animation: none; } }
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
  String(name ?? '?')
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const face = person => (typeof person.avatar === 'string' ? <img src={person.avatar} alt="" /> : (person.avatar ?? initials(person.name)));

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
}) {
  useStyles();
  const [joined, setJoined] = useState([]);
  const [fresh, setFresh] = useState(null);
  const [drag, setDrag] = useState(null);
  const [said, setSaid] = useState('');
  const slotRefs = useRef([]);
  const origin = useRef(null);

  const party = [...members, ...joined.map(id => candidates.find(c => c.id === id)).filter(Boolean)];
  const total = Math.max(slots, party.length);
  const open = total - party.length;
  const bench = candidates.filter(c => !joined.includes(c.id));

  const invite = person => {
    if (open <= 0 || joined.includes(person.id)) return;
    setJoined(ids => [...ids, person.id]);
    setFresh(person.id);
    setSaid(`${person.name} joined the party.`);
    onInvite?.(person);
  };

  // Is the point over one of the open slots?
  const overOpen = (x, y) =>
    slotRefs.current.slice(party.length, total).some(el => {
      const box = el?.getBoundingClientRect();
      return box && x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
    });

  const down = (event, person) => {
    if (event.button !== 0 || event.target.closest('button') || open <= 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    origin.current = { x: event.clientX, y: event.clientY };
    setDrag({ id: person.id, x: 0, y: 0, over: false });
  };

  const move = event => {
    if (!drag || !origin.current) return;
    const next = { id: drag.id, x: event.clientX - origin.current.x, y: event.clientY - origin.current.y, over: overOpen(event.clientX, event.clientY) };
    setDrag(next);
  };

  const up = (event, person) => {
    if (!drag) return;
    const hit = overOpen(event.clientX, event.clientY);
    setDrag(null);
    origin.current = null;
    if (hit) invite(person);
  };

  return (
    <section
      className={`bl-party ${className}`}
      aria-label={title}
      style={{ '--bl-w': `${width}px`, '--bl-n': total, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-done': doneColor, '--bl-gold': goldColor, '--bl-font': fontFamily, ...style }}
    >
      <p className="bl-party__head">
        <span className="bl-party__title">{title}</span>
        <span className="bl-party__count">
          {party.length} / {total}
        </span>
      </p>
      <ol className="bl-party__slots">
        {Array.from({ length: total }, (_, i) => {
          const member = party[i];
          return (
            <li
              key={member?.id ?? `open-${i}`}
              ref={el => {
                slotRefs.current[i] = el;
              }}
              className="bl-party__slot"
              data-filled={member ? '' : undefined}
              data-new={member && member.id === fresh ? '' : undefined}
              data-over={!member && drag?.over ? '' : undefined}
            >
              {member ? (
                <>
                  <span className="bl-party__avatar" style={{ '--c': member.color }}>
                    {face(member)}
                    <span className="bl-party__dot" data-online={member.online === false ? undefined : ''} />
                  </span>
                  <span className="bl-party__name">{member.name}</span>
                  {member.role && <span className="bl-party__role">{member.role}</span>}
                  <span className="bl-party__sr">{member.online === false ? 'offline' : 'online'}</span>
                </>
              ) : (
                <>
                  <span className="bl-party__open" aria-hidden="true">
                    +
                  </span>
                  <span className="bl-party__role">{openLabel}</span>
                </>
              )}
            </li>
          );
        })}
      </ol>
      {bench.length > 0 && (
        <>
          <p className="bl-party__hint">{hint}</p>
          <ul className="bl-party__bench" aria-label="Invite">
            {bench.map(person => (
              <li key={person.id}>
                <div
                  className="bl-party__chip"
                  data-dragging={drag?.id === person.id ? '' : undefined}
                  style={drag?.id === person.id ? { transform: `translate(${drag.x}px, ${drag.y}px)` } : undefined}
                  onPointerDown={event => down(event, person)}
                  onPointerMove={move}
                  onPointerUp={event => up(event, person)}
                  onPointerCancel={() => setDrag(null)}
                >
                  <span className="bl-party__mini" style={{ '--c': person.color }}>
                    {face(person)}
                  </span>
                  <span className="bl-party__name">{person.name}</span>
                  <button type="button" className="bl-party__invite" disabled={open <= 0} onClick={() => invite(person)}>
                    {inviteLabel}
                    <span className="bl-party__sr"> {person.name}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      <span className="bl-party__sr" aria-live="polite">
        {said}
      </span>
    </section>
  );
}
