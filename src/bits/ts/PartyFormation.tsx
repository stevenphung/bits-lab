import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// An agent team as an adventuring party. The quest sits on a banner; forming the party splits
// it into members that drop into formation below, each with a role, a status line and their
// gear (tools); until then their places wait as dashed slots. Start it with the button, on
// mount or when it scrolls into view, or control it with formed. Members are a plain list of
// text; forming is announced. Reduced motion shows the party in place.

const STYLE_ID = 'bl-party-formation';
const CSS = `
/* theme tokens */
.bl-form { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-gold: #ffcd75; }
:where(.light, [data-theme="light"]) .bl-form, .bl-form:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-gold: #a86a12; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-form, :where(.light, [data-theme="light"]) .bl-form:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-gold: #ffcd75; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-form, .bl-form:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-gold: #a86a12; } }
/* theme tokens end */
.bl-form { display: grid; gap: 18px; width: min(var(--bl-w), 100%); padding: 16px; box-sizing: border-box; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); font-size: 14px; box-shadow: inset 0 0 0 3px var(--bl-line), 6px 6px 0 rgba(0,0,0,0.45); }
.bl-form__quest { position: relative; z-index: 1; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; justify-self: center; gap: 8px 12px; padding: 10px 14px; background: var(--bl-chip); box-shadow: inset 0 0 0 3px var(--bl-gold); }
.bl-form__quest::after { content: ''; position: absolute; top: 100%; left: 50%; height: 18px; border-left: 2px dashed var(--bl-line); }
.bl-form__tag { padding: 2px 6px; background: var(--bl-gold); color: #0b0b14; font-size: 10px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; }
.bl-form__quest-name { margin: 0; font-weight: 800; }
.bl-form__btn { padding: 6px 10px; border: 0; background: var(--bl-accent); color: #0b0b14; font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; }
.bl-form__btn:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-form__party { position: relative; display: grid; grid-template-columns: repeat(auto-fit, minmax(var(--bl-min), 1fr)); gap: 10px; margin: 0; padding: 16px 0 0; list-style: none; }
.bl-form__party::before { content: ''; position: absolute; top: 0; right: 12%; left: 12%; border-top: 2px dashed var(--bl-line); opacity: 0; transition: opacity 200ms steps(2); }
.bl-form[data-formed] .bl-form__party::before { opacity: 1; }
.bl-form__member { position: relative; display: grid; min-height: 96px; outline: 2px dashed var(--bl-line); outline-offset: -2px; }
.bl-form__member::before { content: ''; position: absolute; bottom: 100%; left: 50%; height: 16px; border-left: 2px dashed var(--bl-line); }
.bl-form__card { display: grid; align-content: start; gap: 8px; padding: 12px; background: var(--bl-chip); box-shadow: inset 3px 0 0 var(--c, var(--bl-accent)); visibility: hidden; opacity: 0; transform: translate(var(--fx), -40px) scale(0.5); transition: transform 360ms steps(5), opacity 360ms steps(5), visibility 0s 360ms; }
.bl-form[data-formed] .bl-form__card { visibility: visible; opacity: 1; transform: none; transition: transform 360ms steps(5) calc(var(--i) * 90ms), opacity 360ms steps(5) calc(var(--i) * 90ms), visibility 0s calc(var(--i) * 90ms); }
.bl-form__top { display: flex; align-items: center; gap: 10px; }
.bl-form__avatar { display: grid; flex: none; place-items: center; width: 36px; height: 36px; background: var(--c, var(--bl-accent)); color: #0b0b14; font-weight: 900; box-shadow: inset 0 0 0 3px rgba(0,0,0,0.3); }
.bl-form__who { display: grid; gap: 2px; min-width: 0; }
.bl-form__name { margin: 0; overflow: hidden; font-weight: 800; text-overflow: ellipsis; white-space: nowrap; }
.bl-form__role { margin: 0; color: var(--bl-muted); font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
.bl-form__status { margin: 0; color: var(--bl-muted); font-size: 12px; line-height: 1.4; }
.bl-form__gear { display: flex; flex-wrap: wrap; gap: 4px; margin: 0; padding: 0; list-style: none; }
.bl-form__gear > li { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; background: var(--bl-bg); font-size: 11px; font-weight: 700; box-shadow: inset 0 0 0 1px var(--bl-line); }
.bl-form__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .bl-form__card, .bl-form[data-formed] .bl-form__card, .bl-form__party::before { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const initials = (name: string) =>
  String(name ?? '?')
    .split(/\s+/)
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export interface PartyFormationMember {
  id: string;
  name: string;
  role?: string;
  status?: ReactNode;
  /** Tools or skills, shown as chips. */
  gear?: ReactNode[];
  icon?: ReactNode;
  color?: string;
}

export type PartyFormationTrigger = 'button' | 'view' | 'mount';

export interface PartyFormationProps {
  quest?: string;
  members?: PartyFormationMember[];
  formed?: boolean;
  defaultFormed?: boolean;
  onFormedChange?: (formed: boolean) => void;
  trigger?: PartyFormationTrigger;
  formLabel?: string;
  questLabel?: string;
  label?: string;
  /** Grid track minimum, in px. */
  minWidth?: number;
  width?: number;
  backgroundColor?: string;
  chipColor?: string;
  lineColor?: string;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  goldColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function PartyFormation({
  quest = 'Ship the launch page',
  members = [],
  formed,
  defaultFormed = false,
  onFormedChange,
  trigger = 'button',
  formLabel = 'Form party',
  questLabel = 'Quest',
  label,
  minWidth = 140,
  width = 560,
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
}: PartyFormationProps) {
  useStyles();
  const rootRef = useRef<HTMLElement>(null);
  const [innerFormed, setInnerFormed] = useState(defaultFormed);
  const isFormed = formed ?? innerFormed;

  const form = () => {
    if (formed === undefined) setInnerFormed(true);
    onFormedChange?.(true);
  };

  useEffect(() => {
    if (isFormed || trigger === 'button') return;
    if (trigger === 'mount' || typeof IntersectionObserver === 'undefined') {
      form();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        form();
      },
      { threshold: 0.4 }
    );
    observer.observe(rootRef.current as Element);
    return () => observer.disconnect();
  }, [trigger, isFormed]);

  return (
    <section
      ref={rootRef}
      className={`bl-form ${className}`}
      aria-label={label ?? quest}
      data-formed={isFormed ? '' : undefined}
      style={{ '--bl-w': `${width}px`, '--bl-min': `${minWidth}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-gold': goldColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <div className="bl-form__quest">
        <span className="bl-form__tag">{questLabel}</span>
        <p className="bl-form__quest-name">{quest}</p>
        {trigger === 'button' && !isFormed && (
          <button type="button" className="bl-form__btn" onClick={form}>
            {formLabel}
          </button>
        )}
      </div>
      <ul className="bl-form__party" aria-hidden={isFormed ? undefined : true}>
        {members.map((member, i) => (
          <li key={member.id} className="bl-form__member">
            <div className="bl-form__card" style={{ '--i': i, '--fx': `${((members.length - 1) / 2 - i) * 100}%`, '--c': member.color } as CSSVars}>
            <div className="bl-form__top">
              <span className="bl-form__avatar" aria-hidden="true">
                {member.icon ?? initials(member.name)}
              </span>
              <div className="bl-form__who">
                <p className="bl-form__name">{member.name}</p>
                {member.role && <p className="bl-form__role">{member.role}</p>}
              </div>
            </div>
            {member.status && <p className="bl-form__status">{member.status}</p>}
            {member.gear && member.gear.length > 0 && (
              <ul className="bl-form__gear" aria-label={`${member.name}’s gear`}>
                {member.gear.map((item, k) => (
                  <li key={k}>{item}</li>
                ))}
              </ul>
            )}
            </div>
          </li>
        ))}
      </ul>
      <span className="bl-form__sr" aria-live="polite">
        {isFormed ? `Party formed: ${members.length} members.` : ''}
      </span>
    </section>
  );
}
