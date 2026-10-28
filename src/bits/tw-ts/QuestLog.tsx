import { useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Onboarding checklist dressed as a quest log. Quests can require other quests (locked until
// then), each one pays XP into a bar at the top, finishing one flashes the row and floats
// "+XP", and finishing them all sets off a fanfare. Each quest is a native checkbox, locked
// quests say what they need, and completions are announced.

export interface Quest {
  id: string;
  title: string;
  description?: ReactNode;
  /** XP paid into the bar when done. */
  xp?: number;
  /** Quest ids that must be done first; locked until then. */
  requires?: string[];
}

export interface QuestLogProps {
  quests?: Quest[];
  /** Controlled list of done quest ids. */
  completed?: string[];
  defaultCompleted?: string[];
  onCompletedChange?: (completed: string[]) => void;
  /** Fires when a quest is ticked (hook up a sound or analytics). */
  onQuestComplete?: (quest: Quest) => void;
  /** Unticking also unticks quests that depend on it. */
  allowUndo?: boolean;
  title?: string;
  finishedMessage?: string;
  /** Max width in px. */
  width?: number;
  backgroundColor?: string;
  rowColor?: string;
  hoverColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  trackColor?: string;
  accentColor?: string;
  doneColor?: string;
  fontFamily?: string;
  titleFontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

interface XpPop {
  id: number;
  quest: string;
  xp: number;
}

const STYLE_ID = 'bl-quest-log-tw';
const CSS = `
@keyframes bl-ql-flash { 25%, 75% { background: color-mix(in srgb, var(--bl-done) 35%, var(--bl-row)); } }
@keyframes bl-ql-bob { 50% { transform: translateY(-3px); } }
@keyframes bl-ql-pop { from { transform: translateY(6px); opacity: 0; } 15% { opacity: 1; } to { transform: translateY(-26px); opacity: 0; } }
@keyframes bl-ql-banner { from { transform: scale(0.6); opacity: 0; } }
@keyframes bl-ql-spark { from { transform: translate(-50%, -50%); opacity: 1; } to { transform: translate(calc(-50% + var(--dx)), calc(-50% + var(--dy))); opacity: 0; } }
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
}: QuestLogProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState<string[]>(defaultCompleted);
  const done = completed ?? inner;
  const [flash, setFlash] = useState<string | null>(null);
  const [pops, setPops] = useState<XpPop[]>([]);
  const [announce, setAnnounce] = useState('');
  const popId = useRef(0);

  const byId = Object.fromEntries(quests.map(q => [q.id, q]));
  const isLocked = (quest: Quest) => (quest.requires ?? []).some(id => !done.includes(id));
  const earned = quests.reduce((sum, q) => sum + (done.includes(q.id) ? q.xp ?? 0 : 0), 0);
  const totalXp = quests.reduce((sum, q) => sum + (q.xp ?? 0), 0);
  const allDone = quests.length > 0 && quests.every(q => done.includes(q.id));

  const commit = (next: string[]) => {
    if (completed === undefined) setInner(next);
    onCompletedChange?.(next);
  };

  const toggle = (quest: Quest) => {
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
      className={`relative box-border w-full max-w-(--bl-w) bg-(--bl-bg) p-[18px] font-(family-name:--bl-font) text-(--bl-ink) shadow-[0_0_0_3px_var(--bl-line),6px_6px_0_3px_rgba(0,0,0,0.45)] ${className}`}
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
      } as CSSVars}
    >
      <div className="m-0 mb-2.5 flex items-baseline justify-between gap-3">
        <h3 id={`${uid}-title`} className="m-0 font-(family-name:--bl-title-font) text-[13px] font-normal tracking-[0.04em] text-(--bl-accent)">
          {title}
        </h3>
        <span className="text-[13px] whitespace-nowrap text-(--bl-muted) tabular-nums">
          {earned} / {totalXp} XP
        </span>
      </div>
      <div className="relative mb-4 h-3 bg-(--bl-track) shadow-[inset_0_0_0_2px_rgba(0,0,0,0.35)]" role="progressbar" aria-label="Experience" aria-valuemin={0} aria-valuemax={totalXp} aria-valuenow={earned}>
        <div className="absolute inset-[0_auto_0_0] w-[calc(var(--bl-p)*100%)] bg-[repeating-linear-gradient(90deg,var(--bl-accent)_0_8px,color-mix(in_srgb,var(--bl-accent)_75%,#000)_8px_10px)] [transition:width_600ms_steps(12)] motion-reduce:[transition:none]" />
      </div>
      <ul className="m-0 grid list-none gap-2 p-0">
        {quests.map(quest => {
          const locked = isLocked(quest);
          const complete = done.includes(quest.id);
          const state = complete ? 'done' : locked ? 'locked' : 'active';
          const needs = (quest.requires ?? []).filter(id => !done.includes(id)).map(id => byId[id]?.title ?? id);
          const descId = `${uid}-${quest.id}-desc`;
          return (
            <li key={quest.id}>
              <label className="group/quest relative grid cursor-pointer grid-cols-[22px_1fr_auto] [align-items:start] gap-3 bg-(--bl-row) px-3 py-2.5 hover:bg-(--bl-hover) data-[flash]:animate-[bl-ql-flash_600ms_steps(4)] data-[state=locked]:cursor-not-allowed data-[state=locked]:opacity-55 motion-reduce:data-[flash]:animate-none" data-state={state} data-flash={flash === quest.id || undefined} onAnimationEnd={event => event.target === event.currentTarget && setFlash(null)}>
                <input
                  type="checkbox"
                  className="peer/in absolute m-0 size-px overflow-hidden opacity-0 [clip:rect(0_0_0_0)]"
                  checked={complete}
                  disabled={locked || (complete && !allowUndo)}
                  aria-describedby={descId}
                  onChange={() => toggle(quest)}
                />
                <span className="relative size-[22px] bg-(--bl-track) text-(--bl-muted) shadow-[inset_0_0_0_3px_var(--bl-line)] peer-focus-visible/in:outline-3 peer-focus-visible/in:outline-offset-2 peer-focus-visible/in:outline-(--bl-accent) peer-focus-visible/in:outline-solid group-data-[state=done]/quest:bg-(--bl-done) group-data-[state=done]/quest:text-(--bl-bg) group-data-[state=done]/quest:shadow-[inset_0_0_0_3px_color-mix(in_srgb,var(--bl-done)_60%,#000)] [&_svg]:absolute [&_svg]:inset-[3px] [&_svg]:size-4" aria-hidden="true">
                  {complete && (
                    <svg viewBox="0 0 8 8" shapeRendering="crispEdges">
                      <path d="M1 4 3 6 7 2" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  )}
                  {state === 'active' && <span className="absolute inset-0 grid animate-[bl-ql-bob_1.2s_steps(2)_infinite] place-items-center font-(family-name:--bl-title-font) text-[11px] text-(--bl-accent) motion-reduce:animate-none">!</span>}
                  {locked && (
                    <svg viewBox="0 0 8 8" shapeRendering="crispEdges" fill="currentColor">
                      <rect x={2} y={1} width={4} height={1} />
                      <rect x={1} y={2} width={1} height={2} />
                      <rect x={6} y={2} width={1} height={2} />
                      <rect x={1} y={4} width={6} height={4} />
                    </svg>
                  )}
                </span>
                <span className="grid min-w-0 gap-[3px]">
                  <span className="text-[15px] leading-[1.3] font-semibold group-data-[state=done]/quest:text-(--bl-muted) group-data-[state=done]/quest:line-through group-data-[state=done]/quest:decoration-2">{quest.title}</span>
                  <span id={descId} className="text-[13px] leading-[1.4] text-(--bl-muted)">
                    {locked ? `Locked. Requires: ${needs.join(', ')}.` : quest.description}
                  </span>
                </span>
                {quest.xp ? (
                  <span className="relative bg-(--bl-track) px-[7px] py-[3px] font-(family-name:--bl-title-font) text-[9px] leading-[1.4] whitespace-nowrap text-(--bl-accent) group-data-[state=done]/quest:bg-(--bl-accent) group-data-[state=done]/quest:text-(--bl-bg)" aria-label={`${quest.xp} XP`}>
                    +{quest.xp} XP
                    {pops
                      .filter(pop => pop.quest === quest.id)
                      .map(pop => (
                        <span key={pop.id} className="pointer-events-none absolute right-0 bottom-full animate-[bl-ql-pop_1000ms_steps(10)_forwards] font-(family-name:--bl-title-font) text-[10px] whitespace-nowrap text-(--bl-accent) [text-shadow:2px_2px_0_rgba(0,0,0,0.6)]" aria-hidden="true" onAnimationEnd={() => setPops(list => list.filter(p => p.id !== pop.id))}>
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
        <div className="relative mt-3.5 animate-[bl-ql-banner_500ms_cubic-bezier(.3,1.5,.5,1)_both] bg-(--bl-accent) p-3 text-center font-(family-name:--bl-title-font) text-[11px] leading-[1.5] text-(--bl-bg) motion-reduce:animate-none" aria-hidden="true">
          {finishedMessage}
          {SPARKS.map((spark, i) => (
            <i key={i} className="absolute top-1/2 left-1/2 size-1.5 animate-[bl-ql-spark_900ms_cubic-bezier(.2,.8,.3,1)_forwards] bg-(--c) motion-reduce:hidden motion-reduce:animate-none" style={{ '--dx': spark.dx, '--dy': spark.dy, '--c': spark.c } as CSSVars} />
          ))}
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
    </section>
  );
}
