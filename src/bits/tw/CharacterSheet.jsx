import { useInsertionEffect } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// An account card drawn as an RPG character sheet: avatar, name and class, a level badge, an XP
// bar in pixel blocks, setup progress with a "continue" quest, a few stats, and the account
// actions as a menu. The XP and setup bars fill in when it appears; reduced motion shows them
// full straight away.

const STYLE_ID = 'bl-character-sheet-tw';
const CSS = `
/* theme tokens */
.bl-char { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-fill: #38b764; --bl-track: #0b0b14; --bl-accent: #73eff7; --bl-gold: #ffcd75; --bl-danger: #ef7d57; }
:where(.light, [data-theme="light"]) .bl-char, .bl-char:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-fill: #2b8a4a; --bl-track: #e2dacb; --bl-accent: #167f8f; --bl-gold: #a86a12; --bl-danger: #c4502a; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-char, :where(.light, [data-theme="light"]) .bl-char:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-fill: #38b764; --bl-track: #0b0b14; --bl-accent: #73eff7; --bl-gold: #ffcd75; --bl-danger: #ef7d57; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-char, .bl-char:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-fill: #2b8a4a; --bl-track: #e2dacb; --bl-accent: #167f8f; --bl-gold: #a86a12; --bl-danger: #c4502a; } }
/* theme tokens end */
@keyframes bl-char-fill { from { transform: scaleY(0.2); opacity: 0.3; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function CharacterSheet({
  name = 'Player One',
  title = 'Adventurer',
  avatar,
  level = 1,
  xp = 0,
  xpMax = 100,
  setup,
  stats = [],
  actions = [],
  blocks = 16,
  width = 320,
  label,
  backgroundColor,
  chipColor,
  lineColor,
  textColor,
  mutedColor,
  fillColor,
  trackColor,
  accentColor,
  goldColor,
  dangerColor,
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const xpShare = xpMax > 0 ? Math.min(1, Math.max(0, xp / xpMax)) : 0;
  const lit = Math.round(xpShare * blocks);
  const setupShare = setup && setup.total > 0 ? Math.min(1, setup.done / setup.total) : 0;
  const setupLit = Math.round(setupShare * blocks);

  return (
    <section
      className={`bl-char grid gap-[14px] p-4 w-[min(var(--bl-w),100%)] box-border bg-(--bl-bg) text-(--bl-ink) font-(family-name:--bl-font) text-[14px] shadow-[inset_0_0_0_3px_var(--bl-line),6px_6px_0_rgba(0,0,0,0.45)] ${className}`}
      aria-label={label ?? `${name}, level ${level}`}
      style={{ '--bl-w': `${width}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-fill': fillColor, '--bl-track': trackColor, '--bl-accent': accentColor, '--bl-gold': goldColor, '--bl-danger': dangerColor, '--bl-font': fontFamily, '--bl-n': blocks, ...style }}
    >
      <div className="flex items-center gap-3">
        <span className="relative grid size-14 flex-none place-items-center overflow-hidden bg-(--bl-chip) shadow-[inset_0_0_0_3px_var(--bl-line)] [&_img]:size-full [&_img]:object-cover [&_img]:[image-rendering:pixelated]">
          {typeof avatar === 'string' ? <img src={avatar} alt="" /> : avatar}
          <span className="absolute -right-0.5 -bottom-0.5 bg-(--bl-gold) px-1 py-0.5 text-[10px] leading-none font-extrabold text-[#0b0b14]" aria-hidden="true">
            LV{level}
          </span>
        </span>
        <div className="grid min-w-0 gap-0.5">
          <p className="m-0 overflow-hidden text-[16px] font-bold text-ellipsis whitespace-nowrap">{name}</p>
          <p className="m-0 text-[12px] text-(--bl-muted)">
            {title} · Level {level}
          </p>
        </div>
      </div>

      <div className="grid gap-1.5">
        <div className="flex justify-between text-[11px] font-bold tracking-[0.04em] text-(--bl-muted) uppercase">
          <span>XP</span>
          <span>
            {xp} / {xpMax}
          </span>
        </div>
        <div className="grid h-2.5 grid-cols-[repeat(var(--bl-n),1fr)] gap-0.5" role="progressbar" aria-label="Experience" aria-valuemin={0} aria-valuemax={xpMax} aria-valuenow={xp}>
          {Array.from({ length: blocks }, (_, i) => (
            <span key={i} className="bg-(--bl-track) data-[on]:animate-[bl-char-fill_260ms_steps(2)_calc(var(--i)_*_30ms)_both] data-[on]:bg-(--bl-fill) motion-reduce:data-[on]:animate-none" data-on={i < lit || undefined} style={{ '--i': i }} />
          ))}
        </div>
      </div>

      {setup && (
        <div className="grid gap-1.5">
          <div className="flex justify-between text-[11px] font-bold tracking-[0.04em] text-(--bl-muted) uppercase">
            <span>{setup.label ?? 'Setup'}</span>
            <span>
              {setup.done} / {setup.total}
            </span>
          </div>
          <div className="grid h-2.5 grid-cols-[repeat(var(--bl-n),1fr)] gap-0.5" role="progressbar" aria-label={setup.label ?? 'Setup'} aria-valuemin={0} aria-valuemax={setup.total} aria-valuenow={setup.done}>
            {Array.from({ length: blocks }, (_, i) => (
              <span key={i} className="bg-(--bl-track) data-[on]:animate-[bl-char-fill_260ms_steps(2)_calc(var(--i)_*_30ms)_both] data-[on]:bg-(--bl-fill) motion-reduce:data-[on]:animate-none" data-on={i < setupLit || undefined} style={{ '--i': i, '--bl-fill': accentColor ?? 'var(--bl-accent)' }} />
            ))}
          </div>
          {setup.next && (
            <div className="flex items-center justify-between gap-2.5 bg-(--bl-chip) px-3 py-2.5 [&_p]:m-0 [&_p]:text-[13px]">
              <p>Next quest: {setup.next}</p>
              {setup.onContinue && (
                <button type="button" className="flex-none cursor-pointer border-0 bg-(--bl-accent) px-2.5 py-1.5 text-[12px] font-extrabold text-[#0b0b14] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" onClick={setup.onContinue}>
                  Continue
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {stats.length > 0 && (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(64px,1fr))] gap-1.5 p-0">
          {stats.map(stat => (
            <li key={stat.label} className="grid gap-0.5 bg-(--bl-chip) px-2 py-1.5 text-center [&_span]:text-[10px] [&_span]:font-bold [&_span]:text-(--bl-muted) [&_span]:uppercase [&_strong]:text-[15px]">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </li>
          ))}
        </ul>
      )}

      {actions.length > 0 && (
        <ul className="m-0 grid list-none gap-0.5 px-0 pt-1.5 pb-0 [border-top:2px_dashed_var(--bl-line)]" aria-label="Account">
          {actions.map(action => (
            <li key={action.label}>
              <button type="button" className="flex w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent px-2.5 py-2 text-left text-inherit before:w-2.5 before:text-[9px] before:text-(--bl-accent) before:opacity-0 before:content-['►'] hover:bg-(--bl-chip) hover:before:opacity-100 data-[danger]:text-(--bl-danger) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid focus-visible:before:opacity-100" data-danger={action.danger || undefined} onClick={action.onSelect}>
                {action.icon}
                <span>{action.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
