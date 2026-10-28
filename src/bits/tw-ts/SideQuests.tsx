import { useInsertionEffect, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Tips as side quests: a grid of short cards, each with one action and an XP reward. Taking the
// action marks the quest done (a stamp, a "+XP" float and a dimmed card), and the header keeps
// score. Done state can be controlled. Cards are plain articles with real buttons; the score is a
// polite live region. Reduced motion skips the float and stamp.

const STYLE_ID = 'bl-side-quests-tw';
const CSS = `
/* theme tokens */
.bl-sideq { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-done: #38b764; --bl-gold: #ffcd75; }
:where(.light, [data-theme="light"]) .bl-sideq, .bl-sideq:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-done: #2b8a4a; --bl-gold: #a86a12; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-sideq, :where(.light, [data-theme="light"]) .bl-sideq:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-done: #38b764; --bl-gold: #ffcd75; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-sideq, .bl-sideq:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-done: #2b8a4a; --bl-gold: #a86a12; } }
/* theme tokens end */
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

export interface SideQuest {
  id: string;
  title: string;
  body?: ReactNode;
  /** The button label (defaults to "Start"). */
  action?: string;
  xp?: number;
  icon?: ReactNode;
  onSelect?: () => void;
}

export interface SideQuestsProps {
  quests?: SideQuest[];
  done?: string[];
  defaultDone?: string[];
  onDoneChange?: (done: string[], quest: SideQuest) => void;
  title?: string;
  doneLabel?: string;
  /** Grid track minimum, in px. */
  minWidth?: number;
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
}: SideQuestsProps) {
  useStyles();
  const [innerDone, setInnerDone] = useState(defaultDone);
  const finished = done ?? innerDone;
  const [fresh, setFresh] = useState<string | null>(null);
  const earned = quests.filter(q => finished.includes(q.id)).reduce((sum, q) => sum + (q.xp ?? 0), 0);
  const total = quests.reduce((sum, q) => sum + (q.xp ?? 0), 0);

  const take = (quest: SideQuest) => {
    if (finished.includes(quest.id)) return;
    quest.onSelect?.();
    const next = [...finished, quest.id];
    if (done === undefined) setInnerDone(next);
    setFresh(quest.id);
    onDoneChange?.(next, quest);
  };

  return (
    <section className={`bl-sideq grid gap-3 font-(family-name:--bl-font) text-[14px] text-(--bl-ink) ${className}`} aria-label={title} style={{ '--bl-min': `${minWidth}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-done': doneColor, '--bl-gold': goldColor, '--bl-font': fontFamily, ...style } as CSSVars}>
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
