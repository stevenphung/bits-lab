import { useInsertionEffect, useState } from 'react';

// Tips as side quests: a grid of short cards, each with one action and an XP reward. Taking the
// action marks the quest done (a stamp, a "+XP" float and a dimmed card), and the header keeps
// score. Done state can be controlled. Cards are plain articles with real buttons; the score is a
// polite live region. Reduced motion skips the float and stamp.

const STYLE_ID = 'bl-side-quests';
const CSS = `
/* theme tokens */
.bl-sideq { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-done: #38b764; --bl-gold: #ffcd75; }
:where(.light, [data-theme="light"]) .bl-sideq, .bl-sideq:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-done: #2b8a4a; --bl-gold: #a86a12; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-sideq, :where(.light, [data-theme="light"]) .bl-sideq:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-done: #38b764; --bl-gold: #ffcd75; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-sideq, .bl-sideq:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-done: #2b8a4a; --bl-gold: #a86a12; } }
/* theme tokens end */
.bl-sideq { display: grid; gap: 12px; font-family: var(--bl-font); font-size: 14px; color: var(--bl-ink); }
.bl-sideq__head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; margin: 0; }
.bl-sideq__title { color: var(--bl-gold); font-size: 12px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
.bl-sideq__score { color: var(--bl-muted); font-size: 12px; font-weight: 700; }
.bl-sideq__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(var(--bl-min), 1fr)); gap: 10px; margin: 0; padding: 0; list-style: none; }
.bl-sideq__card { position: relative; display: grid; align-content: start; gap: 8px; height: 100%; padding: 14px; box-sizing: border-box; background: var(--bl-bg); box-shadow: inset 0 0 0 2px var(--bl-line); }
.bl-sideq__card[data-done] { box-shadow: inset 0 0 0 2px var(--bl-done); }
.bl-sideq__card[data-done] > :not(.bl-sideq__stamp):not(.bl-sideq__float) { opacity: 0.55; }
.bl-sideq__icon { display: grid; place-items: center; width: 32px; height: 32px; background: var(--bl-chip); color: var(--bl-gold); }
.bl-sideq__name { margin: 0; font-weight: 800; }
.bl-sideq__body { margin: 0; color: var(--bl-muted); font-size: 13px; }
.bl-sideq__foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 4px; }
.bl-sideq__xp { color: var(--bl-gold); font-size: 12px; font-weight: 800; }
.bl-sideq__btn { padding: 6px 10px; border: 0; background: var(--bl-accent); color: #0b0b14; font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; }
.bl-sideq__btn:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-sideq__btn:disabled { background: var(--bl-chip); color: var(--bl-muted); cursor: default; }
.bl-sideq__stamp { position: absolute; top: 10px; right: 10px; padding: 2px 6px; border: 2px solid var(--bl-done); color: var(--bl-done); font-size: 11px; font-weight: 900; letter-spacing: 0.08em; transform: rotate(8deg); animation: bl-sideq-stamp 220ms steps(3) both; }
.bl-sideq__float { position: absolute; right: 14px; bottom: 44px; color: var(--bl-gold); font-weight: 900; pointer-events: none; animation: bl-sideq-float 900ms steps(6) forwards; }
.bl-sideq__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-sideq-stamp { from { opacity: 0; transform: rotate(8deg) scale(2); } }
@keyframes bl-sideq-float { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-28px); } }
@media (prefers-reduced-motion: reduce) { .bl-sideq__stamp { animation: none; } .bl-sideq__float { display: none; } }
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
    <section className={`bl-sideq ${className}`} aria-label={title} style={{ '--bl-min': `${minWidth}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-done': doneColor, '--bl-gold': goldColor, '--bl-font': fontFamily, ...style }}>
      <p className="bl-sideq__head">
        <span className="bl-sideq__title">{title}</span>
        <span className="bl-sideq__score" aria-live="polite">
          {finished.length} / {quests.length} done{total > 0 ? ` · ${earned} / ${total} XP` : ''}
        </span>
      </p>
      <ul className="bl-sideq__grid">
        {quests.map(quest => {
          const isDone = finished.includes(quest.id);
          return (
            <li key={quest.id}>
              <article className="bl-sideq__card" data-done={isDone || undefined}>
                {quest.icon && (
                  <span className="bl-sideq__icon" aria-hidden="true">
                    {quest.icon}
                  </span>
                )}
                <p className="bl-sideq__name">{quest.title}</p>
                {quest.body && <p className="bl-sideq__body">{quest.body}</p>}
                <div className="bl-sideq__foot">
                  {quest.xp ? <span className="bl-sideq__xp">+{quest.xp} XP</span> : <span />}
                  <button type="button" className="bl-sideq__btn" disabled={isDone} onClick={() => take(quest)}>
                    {isDone ? doneLabel : (quest.action ?? 'Start')}
                  </button>
                </div>
                {isDone && (
                  <span className="bl-sideq__stamp" aria-hidden="true">
                    DONE
                  </span>
                )}
                {isDone && fresh === quest.id && quest.xp ? (
                  <span className="bl-sideq__float" aria-hidden="true">
                    +{quest.xp}
                  </span>
                ) : null}
                <span className="bl-sideq__sr">{isDone ? `${quest.title}: done` : ''}</span>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
