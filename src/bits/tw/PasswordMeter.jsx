import { useEffect, useId, useInsertionEffect, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A password field that coaches as you type. A segmented meter fills and changes color with
// strength, a checklist ticks off each requirement with a drawn check, and a toggle shows
// or hides the password. Requirements are yours to define. The checklist describes the
// field, and the strength is announced once you pause typing.

const STYLE_ID = 'bl-password-meter-tw';
const CSS = `
/* theme tokens */
.bl-pw { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-track: #333c57; --bl-accent: #73eff7; --bl-ok: #38b764; --bl-on-ok: #0b0b14; }
:where(.light, [data-theme="light"]) .bl-pw, .bl-pw:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-track: #cfc4ad; --bl-accent: #167f8f; --bl-ok: #2b8a4a; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-pw, :where(.light, [data-theme="light"]) .bl-pw:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-track: #333c57; --bl-accent: #73eff7; --bl-ok: #38b764; --bl-on-ok: #0b0b14; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-pw, .bl-pw:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-track: #cfc4ad; --bl-accent: #167f8f; --bl-ok: #2b8a4a; } }
/* theme tokens end */
@keyframes bl-pw-pop { 40% { transform: scale(1.3); } }
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
  backgroundColor,
  textColor,
  mutedColor,
  lineColor,
  trackColor,
  accentColor,
  okColor,
  onOkColor,
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
      className={`bl-pw w-full max-w-(--bl-w) font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
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
      <label className="mb-1.5 block text-[13px] font-semibold text-(--bl-muted)" htmlFor={`${uid}-input`}>
        {label}
      </label>
      <div className="relative flex items-center rounded-(--bl-radius) bg-(--bl-bg) shadow-[inset_0_0_0_1px_var(--bl-line)] transition-shadow duration-150 ease-[ease] focus-within:shadow-[inset_0_0_0_2px_var(--bl-level,var(--bl-accent))]">
        <input
          id={`${uid}-input`}
          className="h-11 min-w-0 flex-1 border-0 bg-transparent px-3 text-[15px] tracking-[0.02em] text-inherit outline-none"
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
        <button type="button" className="mr-0.5 grid size-10 cursor-pointer place-items-center rounded-[calc(var(--bl-radius)*0.7)] border-0 bg-transparent p-0 text-(--bl-muted) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--bl-accent)" aria-pressed={visible} aria-label="Show password" onClick={() => setVisible(v => !v)}>
          <Eye open={visible} />
        </button>
      </div>
      <div className="mt-2.5 mb-1.5 grid grid-cols-[repeat(var(--bl-segments),1fr)] gap-[5px]" aria-hidden="true">
        {levels.map((_, i) => (
          <span key={i} className="h-1.5 overflow-hidden rounded-full bg-(--bl-track) after:block after:h-full after:origin-left after:rounded-[inherit] after:bg-(--bl-level) after:[transform:scaleX(0)] after:[transition:transform_280ms_cubic-bezier(.3,1.2,.5,1)_calc(var(--i)*40ms),background-color_280ms_calc(var(--i)*40ms)] data-[on]:after:[transform:scaleX(1)] motion-reduce:after:[transition:none]" data-on={i <= level || undefined} style={{ '--i': i }} />
        ))}
      </div>
      <div id={`${uid}-level`} className="flex justify-between text-[12px] text-(--bl-muted) [&_b]:text-[var(--bl-level,var(--bl-muted))] [&_b]:[transition:color_200ms]">
        <span>Strength</span>
        <b>{current?.label ?? '—'}</b>
      </div>
      {showChecklist && (
        <ul id={`${uid}-list`} className="mt-3 mb-0 grid list-none gap-1.5 p-0 text-[13px]" aria-label="Requirements">
          {requirements.map((r, i) => (
            <li key={r.id ?? r.label} className="group/req flex items-center gap-2 text-(--bl-muted) [transition:color_200ms] data-[met]:text-(--bl-ink)" data-met={met[i] || undefined}>
              <span className="grid size-[18px] flex-none place-items-center rounded-[50%] text-(--bl-on-ok) shadow-[inset_0_0_0_2px_var(--bl-track)] [transition:background-color_200ms,box-shadow_200ms] group-data-[met]/req:animate-[bl-pw-pop_320ms_cubic-bezier(.3,1.6,.5,1)] group-data-[met]/req:bg-(--bl-ok) group-data-[met]/req:shadow-none [&_path]:[stroke-dasharray:14] [&_path]:[stroke-dashoffset:14] [&_path]:[transition:stroke-dashoffset_260ms_60ms_cubic-bezier(.2,.9,.25,1)] group-data-[met]/req:[&_path]:[stroke-dashoffset:0] motion-reduce:group-data-[met]/req:animate-none motion-reduce:[&_path]:[transition:none]" aria-hidden="true">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1.8 5.2 4 7.4 8.2 2.8" />
                </svg>
              </span>
              {r.label}
              <span className="sr-only">{met[i] ? ' (met)' : ' (not met)'}</span>
            </li>
          ))}
        </ul>
      )}
      <span className="sr-only" aria-live="polite">
        {spoken}
      </span>
    </div>
  );
}
