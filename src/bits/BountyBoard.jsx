import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// A board of open decisions pinned up like bounties. Each card asks one question with two quick
// answers; answering slams a stamp on it (ACCEPTED / DECLINED), then it folds away and the rest
// close up. When the board is empty it says so. Answers are buttons, the result is announced,
// and focus moves to the next card. Reduced motion skips the stamp and fold.

const STYLE_ID = 'bl-bounty-board';
const CSS = `
/* theme tokens */
.bl-bounty { --bl-board: #1a1c2c; --bl-paper: #f4e4c1; --bl-paper-ink: #2b2233; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-reward: #b13e53; --bl-pin: #b13e53; --bl-gold: #ffcd75; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-bounty, .bl-bounty:where(.light, [data-theme="light"]) { --bl-board: #f4f1e8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-gold: #a86a12; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-bounty, :where(.light, [data-theme="light"]) .bl-bounty:where(.dark, [data-theme="dark"]) { --bl-board: #1a1c2c; --bl-paper: #f4e4c1; --bl-paper-ink: #2b2233; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-reward: #b13e53; --bl-pin: #b13e53; --bl-gold: #ffcd75; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-bounty, .bl-bounty:where([data-theme="system"]) { --bl-board: #f4f1e8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-gold: #a86a12; --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-bounty { display: grid; gap: 12px; width: min(var(--bl-w), 100%); padding: 14px; box-sizing: border-box; background: var(--bl-board); font-family: var(--bl-font); font-size: 14px; color: var(--bl-ink); box-shadow: inset 0 0 0 3px var(--bl-line), 6px 6px 0 rgba(0,0,0,0.45); }
.bl-bounty__head { display: flex; align-items: center; justify-content: space-between; margin: 0; font-size: 12px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--bl-gold); }
.bl-bounty__list { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.bl-bounty__item { display: grid; grid-template-rows: 1fr; transition: grid-template-rows 280ms steps(4), opacity 280ms steps(4); }
.bl-bounty__item[data-gone] { grid-template-rows: 0fr; opacity: 0; }
.bl-bounty__clip { min-height: 0; overflow: hidden; }
.bl-bounty__card { position: relative; display: grid; gap: 8px; margin: 4px; padding: 14px 14px 12px; background: var(--bl-paper); color: var(--bl-paper-ink); transform: rotate(var(--tilt)); box-shadow: 3px 3px 0 rgba(0,0,0,0.35); }
.bl-bounty__card::before { content: ''; position: absolute; top: 4px; left: 50%; width: 8px; height: 8px; margin-left: -4px; background: var(--bl-pin); box-shadow: 0 2px 0 rgba(0,0,0,0.35); }
.bl-bounty__title { margin: 6px 0 0; font-weight: 800; }
.bl-bounty__detail { margin: 0; font-size: 13px; opacity: 0.8; }
.bl-bounty__meta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.bl-bounty__reward { font-size: 12px; font-weight: 800; color: var(--bl-reward); }
.bl-bounty__actions { display: flex; gap: 6px; }
.bl-bounty__btn { padding: 6px 12px; border: 0; background: var(--bl-yes); color: #0b0b14; font: inherit; font-size: 13px; font-weight: 800; cursor: pointer; box-shadow: inset -2px -2px 0 rgba(0,0,0,0.25); }
.bl-bounty__btn[data-kind="decline"] { background: transparent; color: inherit; box-shadow: inset 0 0 0 2px currentColor; }
.bl-bounty__btn:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-bounty__btn:disabled { cursor: default; opacity: 0.5; }
.bl-bounty__stamp { position: absolute; top: 50%; left: 50%; padding: 4px 10px; border: 3px solid var(--stamp); color: var(--stamp); font-size: 18px; font-weight: 900; letter-spacing: 0.1em; transform: translate(-50%, -50%) rotate(-12deg); pointer-events: none; animation: bl-bounty-stamp 240ms steps(3) both; }
.bl-bounty__empty { margin: 0; padding: 18px 8px; color: var(--bl-muted); text-align: center; }
.bl-bounty__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-bounty-stamp { from { opacity: 0; transform: translate(-50%, -50%) rotate(-12deg) scale(2.2); } }
@media (prefers-reduced-motion: reduce) { .bl-bounty__item { transition: none; } .bl-bounty__stamp { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function BountyBoard({
  items = [],
  onDecide,
  title = 'Open decisions',
  acceptLabel = 'Accept',
  declineLabel = 'Decline',
  emptyMessage = 'Board cleared. Nice work!',
  foldDelay = 700,
  width = 380,
  boardColor,
  paperColor,
  paperTextColor,
  lineColor,
  textColor,
  mutedColor,
  acceptColor = '#38b764',
  declineColor = '#b13e53',
  rewardColor,
  pinColor,
  goldColor,
  accentColor,
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const [answers, setAnswers] = useState({});
  const [gone, setGone] = useState([]);
  const [said, setSaid] = useState('');
  const listRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const open = items.filter(item => !gone.includes(item.id));
  const pending = items.filter(item => !answers[item.id]).length;

  const decide = (item, answer) => {
    if (answers[item.id]) return;
    setAnswers(a => ({ ...a, [item.id]: answer }));
    setSaid(`${item.title}: ${answer === 'accept' ? 'accepted' : 'declined'}.`);
    onDecide?.(item.id, answer);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    timers.current.push(
      setTimeout(() => {
        setGone(g => [...g, item.id]);
        // Move focus to the next unanswered card's first button, if any.
        const next = listRef.current?.querySelector('li:not([data-gone]) button:not(:disabled)');
        next?.focus({ preventScroll: true });
      }, reduced ? 0 : foldDelay)
    );
  };

  return (
    <section
      className={`bl-bounty ${className}`}
      aria-label={title}
      style={{ '--bl-w': `${width}px`, '--bl-board': boardColor, '--bl-paper': paperColor, '--bl-paper-ink': paperTextColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-yes': acceptColor, '--bl-reward': rewardColor, '--bl-pin': pinColor, '--bl-gold': goldColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      <p className="bl-bounty__head">
        <span>{title}</span>
        <span>{pending} open</span>
      </p>
      <ul ref={listRef} className="bl-bounty__list">
        {items.map((item, i) => {
          const answer = answers[item.id];
          return (
            <li key={item.id} className="bl-bounty__item" data-gone={gone.includes(item.id) || undefined} aria-hidden={gone.includes(item.id) || undefined}>
              <div className="bl-bounty__clip">
                <article className="bl-bounty__card" style={{ '--tilt': `${((i % 3) - 1) * 0.8}deg` }}>
                  <p className="bl-bounty__title">{item.title}</p>
                  {item.detail && <p className="bl-bounty__detail">{item.detail}</p>}
                  <div className="bl-bounty__meta">
                    {item.reward ? <span className="bl-bounty__reward">{item.reward}</span> : <span />}
                    <div className="bl-bounty__actions">
                      <button type="button" className="bl-bounty__btn" data-kind="accept" disabled={Boolean(answer)} onClick={() => decide(item, 'accept')}>
                        {item.acceptLabel ?? acceptLabel}
                      </button>
                      <button type="button" className="bl-bounty__btn" data-kind="decline" disabled={Boolean(answer)} onClick={() => decide(item, 'decline')}>
                        {item.declineLabel ?? declineLabel}
                      </button>
                    </div>
                  </div>
                  {answer && (
                    <span className="bl-bounty__stamp" style={{ '--stamp': answer === 'accept' ? acceptColor : declineColor }} aria-hidden="true">
                      {answer === 'accept' ? 'ACCEPTED' : 'DECLINED'}
                    </span>
                  )}
                </article>
              </div>
            </li>
          );
        })}
      </ul>
      {open.length === 0 && <p className="bl-bounty__empty">{emptyMessage}</p>}
      <span className="bl-bounty__sr" aria-live="polite">
        {said}
      </span>
    </section>
  );
}
