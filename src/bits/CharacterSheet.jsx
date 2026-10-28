import { useInsertionEffect } from 'react';

// An account card drawn as an RPG character sheet: avatar, name and class, a level badge, an XP
// bar in pixel blocks, setup progress with a "continue" quest, a few stats, and the account
// actions as a menu. The XP and setup bars fill in when it appears; reduced motion shows them
// full straight away.

const STYLE_ID = 'bl-character-sheet';
const CSS = `
/* theme tokens */
.bl-char { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-fill: #38b764; --bl-track: #0b0b14; --bl-accent: #73eff7; --bl-gold: #ffcd75; --bl-danger: #ef7d57; }
:where(.light, [data-theme="light"]) .bl-char, .bl-char:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-fill: #2b8a4a; --bl-track: #e2dacb; --bl-accent: #167f8f; --bl-gold: #a86a12; --bl-danger: #c4502a; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-char, :where(.light, [data-theme="light"]) .bl-char:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-fill: #38b764; --bl-track: #0b0b14; --bl-accent: #73eff7; --bl-gold: #ffcd75; --bl-danger: #ef7d57; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-char, .bl-char:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-fill: #2b8a4a; --bl-track: #e2dacb; --bl-accent: #167f8f; --bl-gold: #a86a12; --bl-danger: #c4502a; } }
/* theme tokens end */
.bl-char { display: grid; gap: 14px; width: min(var(--bl-w), 100%); padding: 16px; box-sizing: border-box; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); font-size: 14px; box-shadow: inset 0 0 0 3px var(--bl-line), 6px 6px 0 rgba(0,0,0,0.45); }
.bl-char__head { display: flex; align-items: center; gap: 12px; }
.bl-char__avatar { position: relative; flex: none; display: grid; place-items: center; width: 56px; height: 56px; overflow: hidden; background: var(--bl-chip); box-shadow: inset 0 0 0 3px var(--bl-line); }
.bl-char__avatar img { width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; }
.bl-char__level { position: absolute; right: -2px; bottom: -2px; padding: 2px 4px; background: var(--bl-gold); color: #0b0b14; font-size: 10px; font-weight: 800; line-height: 1; }
.bl-char__who { display: grid; gap: 2px; min-width: 0; }
.bl-char__name { overflow: hidden; margin: 0; font-size: 16px; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }
.bl-char__class { margin: 0; color: var(--bl-muted); font-size: 12px; }
.bl-char__bar { display: grid; gap: 6px; }
.bl-char__bar-head { display: flex; justify-content: space-between; color: var(--bl-muted); font-size: 11px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
.bl-char__blocks { display: grid; grid-template-columns: repeat(var(--bl-n), 1fr); gap: 2px; height: 10px; }
.bl-char__block { background: var(--bl-track); }
.bl-char__block[data-on] { background: var(--bl-fill); animation: bl-char-fill 260ms steps(2) both; animation-delay: calc(var(--i) * 30ms); }
.bl-char__setup { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 12px; background: var(--bl-chip); }
.bl-char__setup p { margin: 0; font-size: 13px; }
.bl-char__go { flex: none; padding: 6px 10px; border: 0; background: var(--bl-accent); color: #0b0b14; font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; }
.bl-char__go:focus-visible, .bl-char__action:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-char__stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(64px, 1fr)); gap: 6px; margin: 0; padding: 0; list-style: none; }
.bl-char__stat { display: grid; gap: 2px; padding: 6px 8px; background: var(--bl-chip); text-align: center; }
.bl-char__stat span { color: var(--bl-muted); font-size: 10px; font-weight: 700; text-transform: uppercase; }
.bl-char__stat strong { font-size: 15px; }
.bl-char__menu { display: grid; gap: 2px; margin: 0; padding: 6px 0 0; border-top: 2px dashed var(--bl-line); list-style: none; }
.bl-char__action { display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.bl-char__action:hover { background: var(--bl-chip); }
.bl-char__action[data-danger] { color: var(--bl-danger); }
.bl-char__action::before { content: '►'; width: 10px; font-size: 9px; color: var(--bl-accent); opacity: 0; }
.bl-char__action:hover::before, .bl-char__action:focus-visible::before { opacity: 1; }
@keyframes bl-char-fill { from { transform: scaleY(0.2); opacity: 0.3; } }
@media (prefers-reduced-motion: reduce) { .bl-char__block[data-on] { animation: none; } }
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
      className={`bl-char ${className}`}
      aria-label={label ?? `${name}, level ${level}`}
      style={{ '--bl-w': `${width}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-fill': fillColor, '--bl-track': trackColor, '--bl-accent': accentColor, '--bl-gold': goldColor, '--bl-danger': dangerColor, '--bl-font': fontFamily, '--bl-n': blocks, ...style }}
    >
      <div className="bl-char__head">
        <span className="bl-char__avatar">
          {typeof avatar === 'string' ? <img src={avatar} alt="" /> : avatar}
          <span className="bl-char__level" aria-hidden="true">
            LV{level}
          </span>
        </span>
        <div className="bl-char__who">
          <p className="bl-char__name">{name}</p>
          <p className="bl-char__class">
            {title} · Level {level}
          </p>
        </div>
      </div>

      <div className="bl-char__bar">
        <div className="bl-char__bar-head">
          <span>XP</span>
          <span>
            {xp} / {xpMax}
          </span>
        </div>
        <div className="bl-char__blocks" role="progressbar" aria-label="Experience" aria-valuemin={0} aria-valuemax={xpMax} aria-valuenow={xp}>
          {Array.from({ length: blocks }, (_, i) => (
            <span key={i} className="bl-char__block" data-on={i < lit || undefined} style={{ '--i': i }} />
          ))}
        </div>
      </div>

      {setup && (
        <div className="bl-char__bar">
          <div className="bl-char__bar-head">
            <span>{setup.label ?? 'Setup'}</span>
            <span>
              {setup.done} / {setup.total}
            </span>
          </div>
          <div className="bl-char__blocks" role="progressbar" aria-label={setup.label ?? 'Setup'} aria-valuemin={0} aria-valuemax={setup.total} aria-valuenow={setup.done}>
            {Array.from({ length: blocks }, (_, i) => (
              <span key={i} className="bl-char__block" data-on={i < setupLit || undefined} style={{ '--i': i, '--bl-fill': accentColor ?? 'var(--bl-accent)' }} />
            ))}
          </div>
          {setup.next && (
            <div className="bl-char__setup">
              <p>Next quest: {setup.next}</p>
              {setup.onContinue && (
                <button type="button" className="bl-char__go" onClick={setup.onContinue}>
                  Continue
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {stats.length > 0 && (
        <ul className="bl-char__stats">
          {stats.map(stat => (
            <li key={stat.label} className="bl-char__stat">
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </li>
          ))}
        </ul>
      )}

      {actions.length > 0 && (
        <ul className="bl-char__menu" aria-label="Account">
          {actions.map(action => (
            <li key={action.label}>
              <button type="button" className="bl-char__action" data-danger={action.danger || undefined} onClick={action.onSelect}>
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
