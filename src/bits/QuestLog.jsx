import { useId, useInsertionEffect, useRef, useState } from 'react';

// Onboarding checklist dressed as a quest log. Quests can require other quests (locked until
// then), each one pays XP into a bar at the top, finishing one flashes the row and floats
// "+XP", and finishing them all sets off a fanfare. Each quest is a native checkbox, locked
// quests say what they need, and completions are announced.

const STYLE_ID = 'bl-quest-log';
const CSS = `
.bl-ql { position: relative; width: 100%; max-width: var(--bl-w); padding: 18px; box-sizing: border-box; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); box-shadow: 0 0 0 3px var(--bl-line), 6px 6px 0 3px rgba(0,0,0,0.45); }
.bl-ql__head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin: 0 0 10px; }
.bl-ql__title { margin: 0; font-family: var(--bl-title-font); font-size: 13px; font-weight: 400; color: var(--bl-accent); letter-spacing: 0.04em; }
.bl-ql__xp { color: var(--bl-muted); font-size: 13px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.bl-ql__bar { position: relative; height: 12px; margin-bottom: 16px; background: var(--bl-track); box-shadow: inset 0 0 0 2px rgba(0,0,0,0.35); }
.bl-ql__fill { position: absolute; inset: 0 auto 0 0; width: calc(var(--bl-p) * 100%); background: repeating-linear-gradient(90deg, var(--bl-accent) 0 8px, color-mix(in srgb, var(--bl-accent) 75%, #000) 8px 10px); transition: width 600ms steps(12); }
.bl-ql__list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.bl-ql__quest { position: relative; display: grid; grid-template-columns: 22px 1fr auto; align-items: start; gap: 12px; padding: 10px 12px; background: var(--bl-row); cursor: pointer; }
.bl-ql__quest:hover { background: var(--bl-hover); }
.bl-ql__quest[data-state="locked"] { cursor: not-allowed; opacity: 0.55; }
.bl-ql__quest[data-state="done"] .bl-ql__name { color: var(--bl-muted); text-decoration: line-through; text-decoration-thickness: 2px; }
.bl-ql__quest[data-flash] { animation: bl-ql-flash 600ms steps(4); }
.bl-ql__input { position: absolute; width: 1px; height: 1px; margin: 0; overflow: hidden; clip: rect(0 0 0 0); opacity: 0; }
.bl-ql__box { position: relative; width: 22px; height: 22px; background: var(--bl-track); box-shadow: inset 0 0 0 3px var(--bl-line); color: var(--bl-muted); }
.bl-ql__input:focus-visible ~ .bl-ql__box { outline: 3px solid var(--bl-accent); outline-offset: 2px; }
.bl-ql__quest[data-state="done"] .bl-ql__box { color: var(--bl-bg); background: var(--bl-done); box-shadow: inset 0 0 0 3px color-mix(in srgb, var(--bl-done) 60%, #000); }
.bl-ql__box svg { position: absolute; inset: 3px; width: 16px; height: 16px; }
.bl-ql__mark { position: absolute; inset: 0; display: grid; place-items: center; color: var(--bl-accent); font-family: var(--bl-title-font); font-size: 11px; animation: bl-ql-bob 1.2s steps(2) infinite; }
.bl-ql__body { display: grid; gap: 3px; min-width: 0; }
.bl-ql__name { font-size: 15px; font-weight: 600; line-height: 1.3; }
.bl-ql__desc { color: var(--bl-muted); font-size: 13px; line-height: 1.4; }
.bl-ql__reward { position: relative; padding: 3px 7px; background: var(--bl-track); color: var(--bl-accent); font-family: var(--bl-title-font); font-size: 9px; line-height: 1.4; white-space: nowrap; }
.bl-ql__quest[data-state="done"] .bl-ql__reward { background: var(--bl-accent); color: var(--bl-bg); }
.bl-ql__pop { position: absolute; right: 0; bottom: 100%; color: var(--bl-accent); font-family: var(--bl-title-font); font-size: 10px; white-space: nowrap; text-shadow: 2px 2px 0 rgba(0,0,0,0.6); pointer-events: none; animation: bl-ql-pop 1000ms steps(10) forwards; }
.bl-ql__banner { position: relative; margin-top: 14px; padding: 12px; background: var(--bl-accent); color: var(--bl-bg); font-family: var(--bl-title-font); font-size: 11px; line-height: 1.5; text-align: center; animation: bl-ql-banner 500ms cubic-bezier(.3,1.5,.5,1) both; }
.bl-ql__spark { position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; background: var(--c); animation: bl-ql-spark 900ms cubic-bezier(.2,.8,.3,1) forwards; }
.bl-ql__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-ql-flash { 25%, 75% { background: color-mix(in srgb, var(--bl-done) 35%, var(--bl-row)); } }
@keyframes bl-ql-bob { 50% { transform: translateY(-3px); } }
@keyframes bl-ql-pop { from { transform: translateY(6px); opacity: 0; } 15% { opacity: 1; } to { transform: translateY(-26px); opacity: 0; } }
@keyframes bl-ql-banner { from { transform: scale(0.6); opacity: 0; } }
@keyframes bl-ql-spark { from { transform: translate(-50%, -50%); opacity: 1; } to { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .bl-ql__fill { transition: none; }
  .bl-ql__quest[data-flash], .bl-ql__mark, .bl-ql__banner, .bl-ql__spark { animation: none; }
  .bl-ql__spark { display: none; }
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

const SPARK_COLORS = ['#ffcd75', '#ef7d57', '#a7f070', '#73eff7', '#f4f4f4', '#b13e53'];
const SPARKS = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2;
  const dist = 60 + (i % 3) * 24;
  return { dx: `${Math.round(Math.cos(angle) * dist * 1.6)}px`, dy: `${Math.round(Math.sin(angle) * dist * 0.7)}px`, c: SPARK_COLORS[i % SPARK_COLORS.length] };
});

export default function QuestLog({
  quests = [],
  completed,
  defaultCompleted = [],
  onCompletedChange,
  onQuestComplete,
  allowUndo = true,
  title = 'Quest log',
  finishedMessage = 'All quests complete!',
  width = 520,
  backgroundColor = '#1a1c2c',
  rowColor = '#262b44',
  hoverColor = '#2e3552',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = '#333c57',
  trackColor = '#0b0b14',
  accentColor = '#ffcd75',
  doneColor = '#38b764',
  fontFamily = '"Pixelify Sans", ui-sans-serif, system-ui, sans-serif',
  titleFontFamily = '"Press Start 2P", ui-monospace, monospace',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState(defaultCompleted);
  const done = completed ?? inner;
  const [flash, setFlash] = useState(null);
  const [pops, setPops] = useState([]);
  const [announce, setAnnounce] = useState('');
  const popId = useRef(0);

  const byId = Object.fromEntries(quests.map(q => [q.id, q]));
  const isLocked = quest => (quest.requires ?? []).some(id => !done.includes(id));
  const earned = quests.reduce((sum, q) => sum + (done.includes(q.id) ? q.xp ?? 0 : 0), 0);
  const totalXp = quests.reduce((sum, q) => sum + (q.xp ?? 0), 0);
  const allDone = quests.length > 0 && quests.every(q => done.includes(q.id));

  const commit = next => {
    if (completed === undefined) setInner(next);
    onCompletedChange?.(next);
  };

  const toggle = quest => {
    if (isLocked(quest)) return;
    if (done.includes(quest.id)) {
      if (!allowUndo) return;
      // Undoing a quest also undoes everything that depended on it.
      const removed = new Set([quest.id]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const q of quests) {
          if (!removed.has(q.id) && (q.requires ?? []).some(id => removed.has(id))) {
            removed.add(q.id);
            grew = true;
          }
        }
      }
      commit(done.filter(id => !removed.has(id)));
      setAnnounce(`${quest.title} marked not done.`);
      return;
    }
    const next = [...done, quest.id];
    commit(next);
    onQuestComplete?.(quest);
    setFlash(quest.id);
    popId.current += 1;
    setPops(list => [...list, { id: popId.current, quest: quest.id, xp: quest.xp ?? 0 }]);
    const finishing = quests.every(q => next.includes(q.id));
    setAnnounce(`Quest complete: ${quest.title}.${quest.xp ? ` Plus ${quest.xp} XP.` : ''}${finishing ? ` ${finishedMessage}` : ''}`);
  };

  return (
    <section
      className={`bl-ql ${className}`}
      aria-labelledby={`${uid}-title`}
      style={{
        '--bl-w': `${width}px`,
        '--bl-bg': backgroundColor,
        '--bl-row': rowColor,
        '--bl-hover': hoverColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-line': lineColor,
        '--bl-track': trackColor,
        '--bl-accent': accentColor,
        '--bl-done': doneColor,
        '--bl-p': totalXp ? earned / totalXp : 0,
        '--bl-font': fontFamily,
        '--bl-title-font': titleFontFamily,
        ...style
      }}
    >
      <div className="bl-ql__head">
        <h3 id={`${uid}-title`} className="bl-ql__title">
          {title}
        </h3>
        <span className="bl-ql__xp">
          {earned} / {totalXp} XP
        </span>
      </div>
      <div className="bl-ql__bar" role="progressbar" aria-label="Experience" aria-valuemin={0} aria-valuemax={totalXp} aria-valuenow={earned}>
        <div className="bl-ql__fill" />
      </div>
      <ul className="bl-ql__list">
        {quests.map(quest => {
          const locked = isLocked(quest);
          const complete = done.includes(quest.id);
          const state = complete ? 'done' : locked ? 'locked' : 'active';
          const needs = (quest.requires ?? []).filter(id => !done.includes(id)).map(id => byId[id]?.title ?? id);
          const descId = `${uid}-${quest.id}-desc`;
          return (
            <li key={quest.id}>
              <label className="bl-ql__quest" data-state={state} data-flash={flash === quest.id || undefined} onAnimationEnd={event => event.target === event.currentTarget && setFlash(null)}>
                <input
                  type="checkbox"
                  className="bl-ql__input"
                  checked={complete}
                  disabled={locked || (complete && !allowUndo)}
                  aria-describedby={descId}
                  onChange={() => toggle(quest)}
                />
                <span className="bl-ql__box" aria-hidden="true">
                  {complete && (
                    <svg viewBox="0 0 8 8" shapeRendering="crispEdges">
                      <path d="M1 4 3 6 7 2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  )}
                  {state === 'active' && <span className="bl-ql__mark">!</span>}
                  {locked && (
                    <svg viewBox="0 0 8 8" shapeRendering="crispEdges" fill="currentColor">
                      <rect x={2} y={1} width={4} height={1} />
                      <rect x={1} y={2} width={1} height={2} />
                      <rect x={6} y={2} width={1} height={2} />
                      <rect x={1} y={4} width={6} height={4} />
                    </svg>
                  )}
                </span>
                <span className="bl-ql__body">
                  <span className="bl-ql__name">{quest.title}</span>
                  <span id={descId} className="bl-ql__desc">
                    {locked ? `Locked. Requires: ${needs.join(', ')}.` : quest.description}
                  </span>
                </span>
                {quest.xp ? (
                  <span className="bl-ql__reward" aria-label={`${quest.xp} XP`}>
                    +{quest.xp} XP
                    {pops
                      .filter(pop => pop.quest === quest.id)
                      .map(pop => (
                        <span key={pop.id} className="bl-ql__pop" aria-hidden="true" onAnimationEnd={() => setPops(list => list.filter(p => p.id !== pop.id))}>
                          +{pop.xp} XP
                        </span>
                      ))}
                  </span>
                ) : (
                  <span />
                )}
              </label>
            </li>
          );
        })}
      </ul>
      {allDone && (
        <div className="bl-ql__banner" aria-hidden="true">
          {finishedMessage}
          {SPARKS.map((spark, i) => (
            <i key={i} className="bl-ql__spark" style={{ '--dx': spark.dx, '--dy': spark.dy, '--c': spark.c }} />
          ))}
        </div>
      )}
      <p className="bl-ql__sr" aria-live="polite">
        {announce}
      </p>
    </section>
  );
}
