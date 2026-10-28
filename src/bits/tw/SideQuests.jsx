import { useInsertionEffect, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Tips as side quests: a grid of short cards, each with one action and an XP reward. Taking the
// action marks the quest done (a stamp, a "+XP" float and a dimmed card), and the header keeps
// score. Done state can be controlled. Cards are plain articles with real buttons; the score is a
// polite live region. Reduced motion skips the float and stamp.

const STYLE_ID = 'bl-side-quests-tw';
const CSS = `
@keyframes bl-sideq-stamp { from { opacity: 0; transform: rotate(8deg) scale(2); } }
@keyframes bl-sideq-float { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-28px); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function SideQuests({
  quests = [],
  done,
  defaultDone = [],
  onDoneChange,
  title = 'Side quests',
  doneLabel = 'Done',
  minWidth = 220,
  backgroundColor = '#1a1c2c',
  chipColor = '#262b44',
  lineColor = '#333c57',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  accentColor = '#73eff7',
  doneColor = '#38b764',
  goldColor = '#ffcd75',
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const [innerDone, setInnerDone] = useState(defaultDone);
  const finished = done ?? innerDone;
  const [fresh, setFresh] = useState(null);
  const earned = quests.filter(q => finished.includes(q.id)).reduce((sum, q) => sum + (q.xp ?? 0), 0);
  const total = quests.reduce((sum, q) => sum + (q.xp ?? 0), 0);

  const take = quest => {
    if (finished.includes(quest.id)) return;
    quest.onSelect?.();
    const next = [...finished, quest.id];
    if (done === undefined) setInnerDone(next);
    setFresh(quest.id);
    onDoneChange?.(next, quest);
  };

  return (
    <section className={`grid gap-3 font-(family-name:--bl-font) text-[14px] text-(--bl-ink) ${className}`} aria-label={title} style={{ '--bl-min': `${minWidth}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-done': doneColor, '--bl-gold': goldColor, '--bl-font': fontFamily, ...style }}>
      <p className="m-0 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] font-extrabold tracking-[0.06em] uppercase text-(--bl-gold)">{title}</span>
        <span className="text-[12px] font-bold text-(--bl-muted)" aria-live="polite">
          {finished.length} / {quests.length} done{total > 0 ? ` · ${earned} / ${total} XP` : ''}
        </span>
      </p>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(var(--bl-min),1fr))] gap-2.5 p-0">
        {quests.map(quest => {
          const isDone = finished.includes(quest.id);
          return (
            <li key={quest.id}>
              <article className="group/sq relative box-border grid h-full [align-content:start] gap-2 bg-(--bl-bg) p-[14px] shadow-[inset_0_0_0_2px_var(--bl-line)] data-[done]:shadow-[inset_0_0_0_2px_var(--bl-done)]" data-done={isDone || undefined}>
                {quest.icon && (
                  <span className="grid size-8 place-items-center bg-(--bl-chip) text-(--bl-gold) group-data-[done]/sq:opacity-55" aria-hidden="true">
                    {quest.icon}
                  </span>
                )}
                <p className="m-0 font-extrabold group-data-[done]/sq:opacity-55">{quest.title}</p>
                {quest.body && <p className="m-0 text-[13px] text-(--bl-muted) group-data-[done]/sq:opacity-55">{quest.body}</p>}
                <div className="mt-1 flex items-center justify-between gap-2 group-data-[done]/sq:opacity-55">
                  {quest.xp ? <span className="text-[12px] font-extrabold text-(--bl-gold)">+{quest.xp} XP</span> : <span />}
                  <button type="button" className="cursor-pointer border-0 bg-(--bl-accent) px-2.5 py-1.5 text-[12px] font-extrabold text-[#0b0b14] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid disabled:cursor-default disabled:bg-(--bl-chip) disabled:text-(--bl-muted)" disabled={isDone} onClick={() => take(quest)}>
                    {isDone ? doneLabel : (quest.action ?? 'Start')}
                  </button>
                </div>
                {isDone && (
                  <span className="absolute top-2.5 right-2.5 animate-[bl-sideq-stamp_220ms_steps(3)_both] border-2 border-solid border-(--bl-done) px-1.5 py-0.5 text-[11px] font-black tracking-[0.08em] text-(--bl-done) [transform:rotate(8deg)] motion-reduce:animate-none" aria-hidden="true">
                    DONE
                  </span>
                )}
                {isDone && fresh === quest.id && quest.xp ? (
                  <span className="pointer-events-none absolute right-[14px] bottom-11 animate-[bl-sideq-float_900ms_steps(6)_forwards] font-black text-(--bl-gold) motion-reduce:hidden" aria-hidden="true">
                    +{quest.xp}
                  </span>
                ) : null}
                <span className="sr-only">{isDone ? `${quest.title}: done` : ''}</span>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
