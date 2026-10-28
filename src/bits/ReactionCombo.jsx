import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// A reaction pill (like, comment, repost, share…). Turning a reaction on pops its icon and rolls
// the count to the new number; reacting again within a moment builds a combo that bursts above
// the pill ("COMBO ×3"). Toggle reactions are real toggle buttons (aria-pressed); actions like
// share just fire. `count` is everyone else's total: being on adds one. Counts are announced
// politely. Reduced motion keeps the counts and drops the pops.

const STYLE_ID = 'bl-reaction-combo';
const CSS = `
/* theme tokens */
.bl-react { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-gold: #ffcd75; }
:where(.light, [data-theme="light"]) .bl-react, .bl-react:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-gold: #a86a12; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-react, :where(.light, [data-theme="light"]) .bl-react:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-gold: #ffcd75; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-react, .bl-react:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-gold: #a86a12; } }
/* theme tokens end */
.bl-react { position: relative; display: inline-flex; align-items: center; gap: 2px; padding: 4px; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); font-size: 14px; box-shadow: inset 0 0 0 3px var(--bl-line), 4px 4px 0 rgba(0,0,0,0.45); }
.bl-react__btn { position: relative; display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border: 0; background: transparent; color: var(--bl-muted); font: inherit; font-weight: 700; cursor: pointer; }
.bl-react__btn:hover { background: var(--bl-chip); color: var(--bl-ink); }
.bl-react__btn:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: -2px; }
.bl-react__btn[aria-pressed="true"] { color: var(--tone, var(--bl-accent)); }
.bl-react__icon { display: inline-grid; place-items: center; width: 18px; height: 18px; }
.bl-react__icon[data-pop] { animation: bl-react-pop 360ms steps(4); }
.bl-react__count { display: inline-block; min-width: 1ch; overflow: hidden; height: 1.2em; line-height: 1.2em; font-variant-numeric: tabular-nums; }
.bl-react__num { display: inline-block; }
.bl-react__num[data-dir="up"] { animation: bl-react-up 220ms steps(3); }
.bl-react__num[data-dir="down"] { animation: bl-react-down 220ms steps(3); }
.bl-react__combo { position: absolute; left: 50%; bottom: calc(100% + 6px); padding: 4px 8px; background: var(--bl-gold); color: #0b0b14; font-size: 11px; font-weight: 900; letter-spacing: 0.06em; white-space: nowrap; pointer-events: none; transform: translateX(-50%); animation: bl-react-combo 900ms steps(6) forwards; }
.bl-react__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-react-pop { 40% { transform: scale(1.5) translateY(-3px); } }
@keyframes bl-react-up { from { transform: translateY(100%); } }
@keyframes bl-react-down { from { transform: translateY(-100%); } }
@keyframes bl-react-combo { 0% { opacity: 0; transform: translate(-50%, 6px) scale(0.6); } 20% { opacity: 1; transform: translate(-50%, 0) scale(1.15); } 70% { opacity: 1; transform: translate(-50%, -4px) scale(1); } 100% { opacity: 0; transform: translate(-50%, -14px); } }
@media (prefers-reduced-motion: reduce) { .bl-react__icon, .bl-react__num, .bl-react__combo { animation: none !important; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const HEART = (
  <svg viewBox="0 0 8 8" width="16" height="16" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
    <path d="M1 1h2v1h2V1h2v1h1v2H7v1H6v1H5v1H3V6H2V5H1V4H0V2h1z" />
  </svg>
);
const BUBBLE = (
  <svg viewBox="0 0 8 8" width="16" height="16" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
    <path d="M1 1h6v1h1v3H7v1H4v1H3v1H2V6H1V5H0V2h1z" />
  </svg>
);
const LOOP = (
  <svg viewBox="0 0 8 8" width="16" height="16" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
    <path d="M2 1h4v1h1v1H6v1H5V3H2v2H1V2h1zM6 5h1v1H6v1H2V6H1V5h1v1h3z" />
  </svg>
);
const ARROW = (
  <svg viewBox="0 0 8 8" width="16" height="16" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
    <path d="M4 0h1v1h1v1h1v1H5v3H3V3H1V2h1V1h1V0zM0 6h1v1h6V6h1v2H0z" />
  </svg>
);

export const DEFAULT_REACTIONS = [
  { id: 'like', label: 'Like', icon: HEART, count: 128, tone: '#ef7d57' },
  { id: 'comment', label: 'Comment', icon: BUBBLE, count: 14, toggle: false },
  { id: 'repost', label: 'Repost', icon: LOOP, count: 9, tone: '#a7f070' },
  { id: 'share', label: 'Share', icon: ARROW, toggle: false }
];

export default function ReactionCombo({
  reactions = DEFAULT_REACTIONS,
  active,
  defaultActive = [],
  onReact,
  comboWindow = 900,
  showCombo = true,
  label = 'Reactions',
  backgroundColor,
  chipColor,
  lineColor,
  textColor,
  mutedColor,
  accentColor,
  goldColor,
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const [innerActive, setInnerActive] = useState(defaultActive);
  const on = active ?? innerActive;
  const [pop, setPop] = useState({ id: null, n: 0 });
  const [dirs, setDirs] = useState({});
  const [combo, setCombo] = useState({ n: 0, key: 0 });
  const [said, setSaid] = useState('');
  const last = useRef(0);

  useEffect(() => {
    if (!combo.n) return undefined;
    const t = setTimeout(() => setCombo(c => ({ ...c, n: 0 })), comboWindow + 300);
    return () => clearTimeout(t);
  }, [combo, comboWindow]);

  const press = reaction => {
    const toggles = reaction.toggle !== false;
    const nowOn = toggles ? !on.includes(reaction.id) : true;
    if (toggles) {
      const next = nowOn ? [...on, reaction.id] : on.filter(id => id !== reaction.id);
      if (active === undefined) setInnerActive(next);
      setDirs(d => ({ ...d, [reaction.id]: nowOn ? 'up' : 'down' }));
    }
    if (nowOn) {
      setPop(p => ({ id: reaction.id, n: p.n + 1 }));
      const now = Date.now();
      const chained = now - last.current < comboWindow;
      last.current = now;
      setCombo(c => ({ n: chained ? c.n + 1 : 1, key: c.key + 1 }));
    }
    const count = reaction.count === undefined ? undefined : reaction.count + (toggles && nowOn ? 1 : 0);
    setSaid(toggles ? `${reaction.label} ${nowOn ? 'on' : 'off'}${count === undefined ? '' : `, ${count}`}` : reaction.label);
    onReact?.(reaction.id, nowOn);
  };

  return (
    <div className={`bl-react ${className}`} role="group" aria-label={label} style={{ '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-gold': goldColor, '--bl-font': fontFamily, ...style }}>
      {reactions.map(reaction => {
        const toggles = reaction.toggle !== false;
        const isOn = toggles && on.includes(reaction.id);
        const count = reaction.count === undefined ? undefined : reaction.count + (isOn ? 1 : 0);
        return (
          <button
            key={reaction.id}
            type="button"
            className="bl-react__btn"
            aria-pressed={toggles ? isOn : undefined}
            aria-label={count === undefined ? reaction.label : `${reaction.label}, ${count}`}
            onClick={() => press(reaction)}
            style={reaction.tone ? { '--tone': reaction.tone } : undefined}
          >
            <span key={pop.id === reaction.id ? pop.n : 0} className="bl-react__icon" data-pop={(pop.id === reaction.id && pop.n > 0) || undefined}>
              {reaction.icon}
            </span>
            {count !== undefined && (
              <span className="bl-react__count" aria-hidden="true">
                <span key={count} className="bl-react__num" data-dir={dirs[reaction.id]}>
                  {count}
                </span>
              </span>
            )}
          </button>
        );
      })}
      {showCombo && combo.n > 1 && (
        <span key={combo.key} className="bl-react__combo" aria-hidden="true">
          COMBO ×{combo.n}
        </span>
      )}
      <span className="bl-react__sr" aria-live="polite">
        {said}
      </span>
    </div>
  );
}
