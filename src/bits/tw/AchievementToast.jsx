import { useCallback, useEffect, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// "Achievement unlocked" toasts. Render <AchievementToaster /> once, then call
// achievement({ title, description, icon, xp, tier }) from anywhere. Toasts queue, stack up to
// `max`, pause while hovered or focused, and announce politely to screen readers.

const STYLE_ID = 'bl-achievement-tw';
const CSS = `
@keyframes bl-ach-in { from { transform: translateX(110%); } }
@keyframes bl-ach-in-left { from { transform: translateX(-110%); } }
@keyframes bl-ach-out { to { transform: translateY(20%); opacity: 0; } }
@keyframes bl-ach-pop { 0% { transform: scale(0); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
@keyframes bl-ach-spark { 0% { opacity: 1; transform: translate(0, 0); } 100% { opacity: 0; transform: translate(var(--dx), var(--dy)); } }
@keyframes bl-ach-timer { from { transform: scaleX(1); } to { transform: scaleX(0); } }
@keyframes bl-ach-fade { from { opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const TIERS = { bronze: '#ef7d57', silver: '#94b0c2', gold: '#ffcd75', diamond: '#73eff7' };
const listeners = new Set();
let nextId = 1;

// Shows an achievement on every mounted <AchievementToaster />. Returns its id.
export function achievement(data) {
  const toast = { id: nextId++, tier: 'gold', ...data };
  listeners.forEach(listener => listener(toast));
  return toast.id;
}

const SPARKS = [
  [-30, -26],
  [30, -26],
  [-34, 10],
  [34, 10],
  [0, -38],
  [0, 34]
];

function Toast({ toast, duration, label, onDone }) {
  const [leaving, setLeaving] = useState(false);
  const leave = useCallback(() => setLeaving(true), []);

  useEffect(() => {
    if (!leaving) return undefined;
    const timer = setTimeout(() => onDone(toast.id), 240);
    return () => clearTimeout(timer);
  }, [leaving, onDone, toast.id]);

  return (
    <article
      className="group/ach pointer-events-auto relative m-1 grid grid-cols-[56px_1fr_auto] items-center gap-3.5 bg-[#1a1c2c] px-3 pt-3 pb-4 [font-family:var(--bl-font,'Press_Start_2P',ui-monospace,monospace)] text-[#f4f4f4] shadow-[0_-4px_0_0_#0b0b14,0_4px_0_0_#0b0b14,-4px_0_0_0_#0b0b14,4px_0_0_0_#0b0b14,8px_8px_0_0_rgba(11,11,20,0.5)] [--bl-tier:#ffcd75] animate-[bl-ach-in_360ms_steps(6)_both] motion-safe:group-data-[corner*=left]/region:not-data-[leaving]:[animation-name:bl-ach-in-left] data-[leaving]:animate-[bl-ach-out_240ms_steps(4)_both] motion-reduce:animate-[bl-ach-fade_200ms_both] motion-reduce:data-[leaving]:animate-[bl-ach-fade_200ms_reverse_both]"
      data-leaving={leaving || undefined}
      style={{ '--bl-tier': TIERS[toast.tier] ?? toast.tier, '--bl-duration': `${toast.duration ?? duration}ms` }}
      onKeyDown={event => event.key === 'Escape' && leave()}
      aria-label={`${label}: ${toast.title}`}
    >
      <div className="relative grid size-14 place-items-center bg-[#0b0b14] shadow-[inset_0_0_0_3px_var(--bl-tier)] [&>:not(.ach-spark)]:animate-[bl-ach-pop_500ms_steps(5)_200ms_both] motion-reduce:[&>:not(.ach-spark)]:animate-none!" aria-hidden="true">
        {toast.icon ?? <span style={{ fontSize: 22, color: 'var(--bl-tier)' }}>★</span>}
        {SPARKS.map(([dx, dy], index) => (
          <i key={index} className="ach-spark absolute top-1/2 left-1/2 -m-[3px] size-1.5 animate-[bl-ach-spark_600ms_steps(6)_260ms] bg-(--bl-tier) opacity-0 motion-reduce:animate-none!" style={{ '--dx': `${dx}px`, '--dy': `${dy}px` }} />
        ))}
      </div>
      <div>
        <p className="m-0 mb-1.5 text-[8px] tracking-[0.08em] text-(--bl-tier) uppercase">{label}</p>
        <p className="m-0 text-[11px] leading-[1.4] uppercase">{toast.title}</p>
        {toast.description && <p className="mt-1.5 mb-0 [font:14px/1.35_var(--bl-body,ui-monospace,monospace)] text-[#94b0c2]">{toast.description}</p>}
      </div>
      {toast.xp != null && <span className="[align-self:start] bg-[#38b764] px-1.5 py-1 text-[8px] whitespace-nowrap text-[#0b0b14]">+{toast.xp} XP</span>}
      <button type="button" className="absolute top-1 right-1 size-[22px] cursor-pointer border-0 bg-none [font:12px/1_monospace] text-[#94b0c2] hover:text-[#f4f4f4] hover:outline-2 hover:outline-[#41a6f6] hover:outline-solid focus-visible:text-[#f4f4f4] focus-visible:outline-2 focus-visible:outline-[#41a6f6] focus-visible:outline-solid" onClick={leave} aria-label="Dismiss">
        ×
      </button>
      {/* The timer bar's own animation end drives auto-dismiss, so hover-pause just works. */}
      <span className="absolute inset-x-0 bottom-0 h-1 origin-left animate-[bl-ach-timer_var(--bl-duration)_linear_both] bg-(--bl-tier) group-focus-within/ach:[animation-play-state:paused] group-hover/ach:[animation-play-state:paused]" onAnimationEnd={leave} />
    </article>
  );
}

export default function AchievementToaster({
  position = 'bottom-right',
  max = 3,
  duration = 4500,
  label = 'Achievement unlocked',
  contained = false,
  fontFamily,
  onShow,
  className = '',
  style
}) {
  useStyles();
  const [visible, setVisible] = useState([]);
  const queue = useRef([]);
  const onShowRef = useRef(onShow);
  onShowRef.current = onShow;

  const pump = useCallback(() => {
    setVisible(current => {
      if (current.length >= max || !queue.current.length) return current;
      const next = queue.current.shift();
      onShowRef.current?.(next);
      return [...current, next];
    });
  }, [max]);

  useEffect(() => {
    const listener = toast => {
      queue.current.push(toast);
      pump();
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [pump]);

  const remove = useCallback(
    id => {
      setVisible(current => current.filter(toast => toast.id !== id));
      setTimeout(pump, 0);
    },
    [pump]
  );

  return (
    <section
      className={`group/region pointer-events-none z-1000 flex w-[min(380px,calc(100%_-_32px))] flex-col gap-3.5 [position:var(--bl-position)] data-[corner*=bottom]:bottom-5 data-[corner*=bottom]:flex-col-reverse data-[corner*=left]:left-5 data-[corner*=right]:right-5 data-[corner*=top]:top-5 ${className}`}
      data-corner={position}
      aria-live="polite"
      aria-label="Achievements"
      style={{ '--bl-position': contained ? 'absolute' : 'fixed', ...(fontFamily ? { '--bl-font': fontFamily } : null), ...style }}
    >
      {visible.map(toast => (
        <Toast key={toast.id} toast={toast} duration={duration} label={label} onDone={remove} />
      ))}
    </section>
  );
}
