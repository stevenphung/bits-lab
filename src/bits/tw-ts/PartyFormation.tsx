import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

const STYLE_ID = 'bl-party-formation-tw';
const CSS = `
/* theme tokens */
.bl-form { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-gold: #ffcd75; }
:where(.light, [data-theme="light"]) .bl-form, .bl-form:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-gold: #a86a12; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-form, :where(.light, [data-theme="light"]) .bl-form:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-gold: #ffcd75; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-form, .bl-form:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-gold: #a86a12; } }
/* theme tokens end */
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
      className={`bl-form group/form grid gap-[18px] p-4 w-[min(var(--bl-w),100%)] box-border bg-(--bl-bg) text-(--bl-ink) font-(family-name:--bl-font) text-[14px] shadow-[inset_0_0_0_3px_var(--bl-line),6px_6px_0_rgba(0,0,0,0.45)] ${className}`}
      aria-label={label ?? quest}
      data-formed={isFormed ? '' : undefined}
      style={{ '--bl-w': `${width}px`, '--bl-min': `${minWidth}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-gold': goldColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <div className="relative z-1 flex flex-wrap items-center justify-center [justify-self:center] gap-x-3 gap-y-2 bg-(--bl-chip) px-[14px] py-2.5 shadow-[inset_0_0_0_3px_var(--bl-gold)] after:absolute after:top-full after:left-1/2 after:h-[18px] after:[border-left:2px_dashed_var(--bl-line)] after:content-['']">
        <span className="bg-(--bl-gold) px-1.5 py-0.5 text-[10px] font-black tracking-[0.08em] text-[#0b0b14] uppercase">{questLabel}</span>
        <p className="m-0 font-extrabold">{quest}</p>
        {trigger === 'button' && !isFormed && (
          <button type="button" className="cursor-pointer border-0 bg-(--bl-accent) px-2.5 py-1.5 text-[12px] font-extrabold text-[#0b0b14] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" onClick={form}>
            {formLabel}
          </button>
        )}
      </div>
      <ul className="relative m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(var(--bl-min),1fr))] gap-2.5 px-0 pt-4 pb-0 before:absolute before:top-0 before:right-[12%] before:left-[12%] before:[border-top:2px_dashed_var(--bl-line)] before:opacity-0 before:[transition:opacity_200ms_steps(2)] before:content-[''] group-data-[formed]/form:before:opacity-100 motion-reduce:before:[transition:none]" aria-hidden={isFormed ? undefined : true}>
        {members.map((member, i) => (
          <li key={member.id} className="relative grid min-h-24 outline-2 -outline-offset-2 outline-(--bl-line) outline-dashed before:absolute before:bottom-full before:left-1/2 before:h-4 before:[border-left:2px_dashed_var(--bl-line)] before:content-['']">
            <div className="invisible grid [align-content:start] gap-2 bg-(--bl-chip) p-3 opacity-0 shadow-[inset_3px_0_0_var(--c,var(--bl-accent))] [transform:translate(var(--fx),-40px)_scale(0.5)] [transition:transform_360ms_steps(5),opacity_360ms_steps(5),visibility_0s_360ms] group-data-[formed]/form:visible group-data-[formed]/form:opacity-100 group-data-[formed]/form:[transform:none] group-data-[formed]/form:[transition:transform_360ms_steps(5)_calc(var(--i)_*_90ms),opacity_360ms_steps(5)_calc(var(--i)_*_90ms),visibility_0s_calc(var(--i)_*_90ms)] motion-reduce:[transition:none]!" style={{ '--i': i, '--fx': `${((members.length - 1) / 2 - i) * 100}%`, '--c': member.color } as CSSVars}>
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 flex-none place-items-center bg-[var(--c,var(--bl-accent))] font-black text-[#0b0b14] shadow-[inset_0_0_0_3px_rgba(0,0,0,0.3)]" aria-hidden="true">
                {member.icon ?? initials(member.name)}
              </span>
              <div className="grid min-w-0 gap-0.5">
                <p className="m-0 overflow-hidden font-extrabold text-ellipsis whitespace-nowrap">{member.name}</p>
                {member.role && <p className="m-0 text-[11px] font-extrabold tracking-[0.06em] text-(--bl-muted) uppercase">{member.role}</p>}
              </div>
            </div>
            {member.status && <p className="m-0 text-[12px] leading-[1.4] text-(--bl-muted)">{member.status}</p>}
            {member.gear && member.gear.length > 0 && (
              <ul className="m-0 flex list-none flex-wrap gap-1 p-0 [&>li]:inline-flex [&>li]:items-center [&>li]:gap-1 [&>li]:bg-(--bl-bg) [&>li]:px-1.5 [&>li]:py-0.5 [&>li]:text-[11px] [&>li]:font-bold [&>li]:shadow-[inset_0_0_0_1px_var(--bl-line)]" aria-label={`${member.name}’s gear`}>
                {member.gear.map((item, k) => (
                  <li key={k}>{item}</li>
                ))}
              </ul>
            )}
            </div>
          </li>
        ))}
      </ul>
      <span className="sr-only" aria-live="polite">
        {isFormed ? `Party formed: ${members.length} members.` : ''}
      </span>
    </section>
  );
}
