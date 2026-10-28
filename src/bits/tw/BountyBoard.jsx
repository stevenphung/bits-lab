import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A board of open decisions pinned up like bounties. Each card asks one question with two quick
// answers; answering slams a stamp on it (ACCEPTED / DECLINED), then it folds away and the rest
// close up. When the board is empty it says so. Answers are buttons, the result is announced,
// and focus moves to the next card. Reduced motion skips the stamp and fold.

const STYLE_ID = 'bl-bounty-board-tw';
const CSS = `
/* theme tokens */
.bl-bounty { --bl-board: #1a1c2c; --bl-paper: #f4e4c1; --bl-paper-ink: #2b2233; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-reward: #b13e53; --bl-pin: #b13e53; --bl-gold: #ffcd75; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-bounty, .bl-bounty:where(.light, [data-theme="light"]) { --bl-board: #f4f1e8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-gold: #a86a12; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-bounty, :where(.light, [data-theme="light"]) .bl-bounty:where(.dark, [data-theme="dark"]) { --bl-board: #1a1c2c; --bl-paper: #f4e4c1; --bl-paper-ink: #2b2233; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-reward: #b13e53; --bl-pin: #b13e53; --bl-gold: #ffcd75; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-bounty, .bl-bounty:where([data-theme="system"]) { --bl-board: #f4f1e8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-gold: #a86a12; --bl-accent: #167f8f; } }
/* theme tokens end */
@keyframes bl-bounty-stamp { from { opacity: 0; transform: translate(-50%, -50%) rotate(-12deg) scale(2.2); } }
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
      className={`bl-bounty grid w-[min(var(--bl-w),100%)] gap-3 box-border bg-(--bl-board) p-[14px] font-(family-name:--bl-font) text-[14px] text-(--bl-ink) shadow-[inset_0_0_0_3px_var(--bl-line),6px_6px_0_rgba(0,0,0,0.45)] ${className}`}
      aria-label={title}
      style={{ '--bl-w': `${width}px`, '--bl-board': boardColor, '--bl-paper': paperColor, '--bl-paper-ink': paperTextColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-yes': acceptColor, '--bl-reward': rewardColor, '--bl-pin': pinColor, '--bl-gold': goldColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      <p className="m-0 flex items-center justify-between text-[12px] font-extrabold tracking-[0.06em] uppercase text-(--bl-gold)">
        <span>{title}</span>
        <span>{pending} open</span>
      </p>
      <ul ref={listRef} className="m-0 grid list-none gap-2.5 p-0">
        {items.map((item, i) => {
          const answer = answers[item.id];
          return (
            <li key={item.id} className="grid grid-rows-[1fr] [transition:grid-template-rows_280ms_steps(4),opacity_280ms_steps(4)] data-[gone]:grid-rows-[0fr] data-[gone]:opacity-0 motion-reduce:[transition:none]" data-gone={gone.includes(item.id) || undefined} aria-hidden={gone.includes(item.id) || undefined}>
              <div className="min-h-0 overflow-hidden">
                <article className="relative m-1 grid gap-2 bg-(--bl-paper) px-[14px] pt-[14px] pb-3 text-(--bl-paper-ink) shadow-[3px_3px_0_rgba(0,0,0,0.35)] [transform:rotate(var(--tilt))] before:absolute before:top-1 before:left-1/2 before:-ml-1 before:size-2 before:bg-(--bl-pin) before:shadow-[0_2px_0_rgba(0,0,0,0.35)] before:content-['']" style={{ '--tilt': `${((i % 3) - 1) * 0.8}deg` }}>
                  <p className="mx-0 mt-1.5 mb-0 font-extrabold">{item.title}</p>
                  {item.detail && <p className="m-0 text-[13px] opacity-80">{item.detail}</p>}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {item.reward ? <span className="text-[12px] font-extrabold text-(--bl-reward)">{item.reward}</span> : <span />}
                    <div className="flex gap-1.5">
                      <button type="button" className="cursor-pointer border-0 bg-(--bl-yes) px-3 py-1.5 text-[13px] font-extrabold text-[#0b0b14] shadow-[inset_-2px_-2px_0_rgba(0,0,0,0.25)] data-[kind=decline]:bg-transparent data-[kind=decline]:text-inherit data-[kind=decline]:shadow-[inset_0_0_0_2px_currentColor] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid disabled:cursor-default disabled:opacity-50" data-kind="accept" disabled={Boolean(answer)} onClick={() => decide(item, 'accept')}>
                        {item.acceptLabel ?? acceptLabel}
                      </button>
                      <button type="button" className="cursor-pointer border-0 bg-(--bl-yes) px-3 py-1.5 text-[13px] font-extrabold text-[#0b0b14] shadow-[inset_-2px_-2px_0_rgba(0,0,0,0.25)] data-[kind=decline]:bg-transparent data-[kind=decline]:text-inherit data-[kind=decline]:shadow-[inset_0_0_0_2px_currentColor] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid disabled:cursor-default disabled:opacity-50" data-kind="decline" disabled={Boolean(answer)} onClick={() => decide(item, 'decline')}>
                        {item.declineLabel ?? declineLabel}
                      </button>
                    </div>
                  </div>
                  {answer && (
                    <span className="pointer-events-none absolute top-1/2 left-1/2 animate-[bl-bounty-stamp_240ms_steps(3)_both] border-3 border-solid border-(--stamp) px-2.5 py-1 text-[18px] font-black tracking-[0.1em] text-(--stamp) [transform:translate(-50%,-50%)_rotate(-12deg)] motion-reduce:animate-none" style={{ '--stamp': answer === 'accept' ? acceptColor : declineColor }} aria-hidden="true">
                      {answer === 'accept' ? 'ACCEPTED' : 'DECLINED'}
                    </span>
                  )}
                </article>
              </div>
            </li>
          );
        })}
      </ul>
      {open.length === 0 && <p className="m-0 px-2 py-[18px] text-center text-(--bl-muted)">{emptyMessage}</p>}
      <span className="sr-only" aria-live="polite">
        {said}
      </span>
    </section>
  );
}
