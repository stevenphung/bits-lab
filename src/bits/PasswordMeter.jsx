import { useEffect, useId, useInsertionEffect, useState } from 'react';

// A password field that coaches as you type. A segmented meter fills and changes color with
// strength, a checklist ticks off each requirement with a drawn check, and a toggle shows
// or hides the password. Requirements are yours to define. The checklist describes the
// field, and the strength is announced once you pause typing.

const STYLE_ID = 'bl-password-meter';
const CSS = `
.bl-pw { width: 100%; max-width: var(--bl-w); font-family: var(--bl-font); color: var(--bl-ink); }
.bl-pw__label { display: block; margin-bottom: 6px; color: var(--bl-muted); font-size: 13px; font-weight: 600; }
.bl-pw__field { position: relative; display: flex; align-items: center; border-radius: var(--bl-radius); background: var(--bl-bg); box-shadow: inset 0 0 0 1px var(--bl-line); transition: box-shadow 150ms; }
.bl-pw__field:focus-within { box-shadow: inset 0 0 0 2px var(--bl-level, var(--bl-accent)); }
.bl-pw__input { flex: 1; min-width: 0; height: 44px; padding: 0 12px; border: 0; background: transparent; color: inherit; font: inherit; font-size: 15px; letter-spacing: 0.02em; outline: none; }
.bl-pw__toggle { display: grid; place-items: center; width: 40px; height: 40px; margin-right: 2px; padding: 0; border: 0; border-radius: calc(var(--bl-radius) * 0.7); background: transparent; color: var(--bl-muted); cursor: pointer; }
.bl-pw__toggle:hover { color: var(--bl-ink); }
.bl-pw__toggle:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: -2px; }
.bl-pw__meter { display: grid; grid-template-columns: repeat(var(--bl-segments), 1fr); gap: 5px; margin: 10px 0 6px; }
.bl-pw__seg { height: 6px; border-radius: 999px; background: var(--bl-track); overflow: hidden; }
.bl-pw__seg::after { content: ""; display: block; height: 100%; border-radius: inherit; background: var(--bl-level); transform: scaleX(0); transform-origin: left; transition: transform 280ms cubic-bezier(.3,1.2,.5,1), background-color 280ms; transition-delay: calc(var(--i) * 40ms); }
.bl-pw__seg[data-on]::after { transform: scaleX(1); }
.bl-pw__level { display: flex; justify-content: space-between; color: var(--bl-muted); font-size: 12px; }
.bl-pw__level b { color: var(--bl-level, var(--bl-muted)); transition: color 200ms; }
.bl-pw__list { display: grid; gap: 6px; margin: 12px 0 0; padding: 0; list-style: none; font-size: 13px; }
.bl-pw__req { display: flex; align-items: center; gap: 8px; color: var(--bl-muted); transition: color 200ms; }
.bl-pw__req[data-met] { color: var(--bl-ink); }
.bl-pw__tick { display: grid; place-items: center; flex: 0 0 auto; width: 18px; height: 18px; border-radius: 50%; box-shadow: inset 0 0 0 2px var(--bl-track); color: var(--bl-on-ok); transition: background-color 200ms, box-shadow 200ms; }
.bl-pw__req[data-met] .bl-pw__tick { background: var(--bl-ok); box-shadow: none; animation: bl-pw-pop 320ms cubic-bezier(.3,1.6,.5,1); }
.bl-pw__tick path { stroke-dasharray: 14; stroke-dashoffset: 14; transition: stroke-dashoffset 260ms 60ms cubic-bezier(.2,.9,.25,1); }
.bl-pw__req[data-met] .bl-pw__tick path { stroke-dashoffset: 0; }
.bl-pw__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-pw-pop { 40% { transform: scale(1.3); } }
@media (prefers-reduced-motion: reduce) { .bl-pw__seg::after, .bl-pw__tick path { transition: none; } .bl-pw__req[data-met] .bl-pw__tick { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export const DEFAULT_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: v => v.length >= 8 },
  { id: 'lower', label: 'A lowercase letter', test: v => /[a-z]/.test(v) },
  { id: 'upper', label: 'An uppercase letter', test: v => /[A-Z]/.test(v) },
  { id: 'number', label: 'A number', test: v => /\d/.test(v) },
  { id: 'symbol', label: 'A symbol', test: v => /[^A-Za-z0-9\s]/.test(v) }
];

const DEFAULT_LEVELS = [
  { label: 'Too weak', color: '#b13e53' },
  { label: 'Weak', color: '#ef7d57' },
  { label: 'Fair', color: '#ffcd75' },
  { label: 'Good', color: '#a7f070' },
  { label: 'Strong', color: '#38b764' }
];

// Requirements met, plus a bonus for length, mapped onto the levels.
export function scorePassword(password, requirements = DEFAULT_REQUIREMENTS, levels = DEFAULT_LEVELS) {
  if (!password) return { level: -1, met: requirements.map(() => false) };
  const met = requirements.map(r => (typeof r.test === 'function' ? r.test(password) : r.test.test(password)));
  const ratio = met.filter(Boolean).length / Math.max(1, requirements.length);
  const lengthBonus = Math.min(0.25, Math.max(0, password.length - 8) * 0.03);
  const level = Math.min(levels.length - 1, Math.floor((ratio * 0.8 + lengthBonus) * levels.length));
  return { level, met };
}

const Eye = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <path d="M1.5 9S4.5 3.5 9 3.5 16.5 9 16.5 9 13.5 14.5 9 14.5 1.5 9 1.5 9Z" />
    <circle cx="9" cy="9" r="2.4" />
    {!open && <path d="M3 15 15 3" />}
  </svg>
);

export default function PasswordMeter({
  value,
  defaultValue = '',
  onValueChange,
  requirements = DEFAULT_REQUIREMENTS,
  levels = DEFAULT_LEVELS,
  label = 'Password',
  name,
  autoComplete = 'new-password',
  showChecklist = true,
  width = 420,
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = '#333c57',
  trackColor = '#333c57',
  accentColor = '#73eff7',
  okColor = '#38b764',
  onOkColor = '#0b0b14',
  radius = 12,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState(defaultValue);
  const password = value ?? inner;
  const [visible, setVisible] = useState(false);
  const [spoken, setSpoken] = useState('');
  const { level, met } = scorePassword(password, requirements, levels);
  const current = levels[level];
  const metCount = met.filter(Boolean).length;

  // Announce the verdict after a pause, not on every keystroke.
  useEffect(() => {
    if (!password) return undefined;
    const timer = setTimeout(() => setSpoken(`Password strength: ${current?.label ?? ''}. ${metCount} of ${requirements.length} requirements met.`), 900);
    return () => clearTimeout(timer);
  }, [password, current?.label, metCount, requirements.length]);

  return (
    <div
      className={`bl-pw ${className}`}
      style={{
        '--bl-w': `${width}px`,
        '--bl-segments': levels.length,
        '--bl-level': current?.color,
        '--bl-bg': backgroundColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-line': lineColor,
        '--bl-track': trackColor,
        '--bl-accent': accentColor,
        '--bl-ok': okColor,
        '--bl-on-ok': onOkColor,
        '--bl-radius': `${radius}px`,
        '--bl-font': fontFamily,
        ...style
      }}
    >
      <label className="bl-pw__label" htmlFor={`${uid}-input`}>
        {label}
      </label>
      <div className="bl-pw__field">
        <input
          id={`${uid}-input`}
          className="bl-pw__input"
          type={visible ? 'text' : 'password'}
          name={name}
          autoComplete={autoComplete}
          spellCheck={false}
          value={password}
          aria-describedby={`${uid}-level ${showChecklist ? `${uid}-list` : ''}`.trim()}
          onChange={event => {
            if (value === undefined) setInner(event.target.value);
            onValueChange?.(event.target.value, { level, label: current?.label });
          }}
        />
        <button type="button" className="bl-pw__toggle" aria-pressed={visible} aria-label="Show password" onClick={() => setVisible(v => !v)}>
          <Eye open={visible} />
        </button>
      </div>
      <div className="bl-pw__meter" aria-hidden="true">
        {levels.map((_, i) => (
          <span key={i} className="bl-pw__seg" data-on={i <= level || undefined} style={{ '--i': i }} />
        ))}
      </div>
      <div id={`${uid}-level`} className="bl-pw__level">
        <span>Strength</span>
        <b>{current?.label ?? '—'}</b>
      </div>
      {showChecklist && (
        <ul id={`${uid}-list`} className="bl-pw__list" aria-label="Requirements">
          {requirements.map((r, i) => (
            <li key={r.id ?? r.label} className="bl-pw__req" data-met={met[i] || undefined}>
              <span className="bl-pw__tick" aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1.8 5.2 4 7.4 8.2 2.8" />
                </svg>
              </span>
              {r.label}
              <span className="bl-pw__sr">{met[i] ? ' (met)' : ' (not met)'}</span>
            </li>
          ))}
        </ul>
      )}
      <span className="bl-pw__sr" aria-live="polite">
        {spoken}
      </span>
    </div>
  );
}
