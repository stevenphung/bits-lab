import { useCallback, useEffect, useInsertionEffect, useRef, useState } from 'react';

// "Achievement unlocked" toasts. Render <AchievementToaster /> once, then call
// achievement({ title, description, icon, xp, tier }) from anywhere. Toasts queue, stack up to
// `max`, pause while hovered or focused, and announce politely to screen readers.

const STYLE_ID = 'bl-achievement';
const CSS = `
.bl-ach-region { position: var(--bl-position); z-index: 1000; display: flex; flex-direction: column; gap: 14px; pointer-events: none; width: min(380px, calc(100% - 32px)); }
.bl-ach-region[data-corner*="bottom"] { bottom: 20px; flex-direction: column-reverse; }
.bl-ach-region[data-corner*="top"] { top: 20px; }
.bl-ach-region[data-corner*="right"] { right: 20px; }
.bl-ach-region[data-corner*="left"] { left: 20px; }
.bl-ach {
  --bl-tier: #ffcd75;
  position: relative; display: grid; grid-template-columns: 56px 1fr auto; align-items: center; gap: 14px;
  padding: 12px 12px 16px; margin: 4px; background: #1a1c2c; color: #f4f4f4; pointer-events: auto;
  font-family: var(--bl-font, "Press Start 2P", ui-monospace, monospace);
  box-shadow: 0 -4px 0 0 #0b0b14, 0 4px 0 0 #0b0b14, -4px 0 0 0 #0b0b14, 4px 0 0 0 #0b0b14, 8px 8px 0 0 rgba(11, 11, 20, 0.5);
  animation: bl-ach-in 360ms steps(6) both;
}
.bl-ach-region[data-corner*="left"] .bl-ach { animation-name: bl-ach-in-left; }
.bl-ach[data-leaving] { animation: bl-ach-out 240ms steps(4) both; }
.bl-ach__icon { position: relative; display: grid; place-items: center; width: 56px; height: 56px; background: #0b0b14; box-shadow: inset 0 0 0 3px var(--bl-tier); }
.bl-ach__icon > :not(.bl-ach__spark) { animation: bl-ach-pop 500ms steps(5) 200ms both; }
.bl-ach__spark { position: absolute; left: 50%; top: 50%; width: 6px; height: 6px; margin: -3px; background: var(--bl-tier); opacity: 0; animation: bl-ach-spark 600ms steps(6) 260ms; }
.bl-ach__label { margin: 0 0 6px; font-size: 8px; color: var(--bl-tier); letter-spacing: 0.08em; text-transform: uppercase; }
.bl-ach__title { margin: 0; font-size: 11px; line-height: 1.4; text-transform: uppercase; }
.bl-ach__desc { margin: 6px 0 0; font: 14px/1.35 var(--bl-body, ui-monospace, monospace); color: #94b0c2; }
.bl-ach__xp { align-self: start; padding: 4px 6px; background: #38b764; color: #0b0b14; font-size: 8px; white-space: nowrap; }
.bl-ach__close { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border: 0; background: none; color: #94b0c2; font: 12px/1 monospace; cursor: pointer; }
.bl-ach__close:hover, .bl-ach__close:focus-visible { color: #f4f4f4; outline: 2px solid #41a6f6; }
.bl-ach__timer { position: absolute; left: 0; right: 0; bottom: 0; height: 4px; background: var(--bl-tier); transform-origin: left; animation: bl-ach-timer var(--bl-duration) linear both; }
.bl-ach:hover .bl-ach__timer, .bl-ach:focus-within .bl-ach__timer { animation-play-state: paused; }
@keyframes bl-ach-in { from { transform: translateX(110%); } }
@keyframes bl-ach-in-left { from { transform: translateX(-110%); } }
@keyframes bl-ach-out { to { transform: translateY(20%); opacity: 0; } }
@keyframes bl-ach-pop { 0% { transform: scale(0); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
@keyframes bl-ach-spark { 0% { opacity: 1; transform: translate(0, 0); } 100% { opacity: 0; transform: translate(var(--dx), var(--dy)); } }
@keyframes bl-ach-timer { from { transform: scaleX(1); } to { transform: scaleX(0); } }
@media (prefers-reduced-motion: reduce) {
  .bl-ach, .bl-ach[data-leaving] { animation: bl-ach-fade 200ms both; }
  .bl-ach[data-leaving] { animation-direction: reverse; }
  .bl-ach__icon > *, .bl-ach__spark { animation: none !important; }
  @keyframes bl-ach-fade { from { opacity: 0; } }
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
      className="bl-ach"
      data-leaving={leaving || undefined}
      style={{ '--bl-tier': TIERS[toast.tier] ?? toast.tier, '--bl-duration': `${toast.duration ?? duration}ms` }}
      onKeyDown={event => event.key === 'Escape' && leave()}
      aria-label={`${label}: ${toast.title}`}
    >
      <div className="bl-ach__icon" aria-hidden="true">
        {toast.icon ?? <span style={{ fontSize: 22, color: 'var(--bl-tier)' }}>★</span>}
        {SPARKS.map(([dx, dy], index) => (
          <i key={index} className="bl-ach__spark" style={{ '--dx': `${dx}px`, '--dy': `${dy}px` }} />
        ))}
      </div>
      <div>
        <p className="bl-ach__label">{label}</p>
        <p className="bl-ach__title">{toast.title}</p>
        {toast.description && <p className="bl-ach__desc">{toast.description}</p>}
      </div>
      {toast.xp != null && <span className="bl-ach__xp">+{toast.xp} XP</span>}
      <button type="button" className="bl-ach__close" onClick={leave} aria-label="Dismiss">
        ×
      </button>
      {/* The timer bar's own animation end drives auto-dismiss, so hover-pause just works. */}
      <span className="bl-ach__timer" onAnimationEnd={leave} />
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
      className={`bl-ach-region ${className}`}
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
