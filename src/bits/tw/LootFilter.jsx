import { useId, useInsertionEffect, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Filters laid out like a loot screen. Groups of options fold open and closed; options are real
// checkboxes with an optional count and rarity colour; everything picked shows as removable chips
// above, with Clear all. The value is a map of group id → picked option values, controlled or not.
// Native checkboxes and buttons give full keyboard control; changes are announced politely.

const STYLE_ID = 'bl-loot-filter-tw';
const CSS = `
/* theme tokens */
.bl-loot { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-gold: #ffcd75; }
:where(.light, [data-theme="light"]) .bl-loot, .bl-loot:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-gold: #a86a12; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-loot, :where(.light, [data-theme="light"]) .bl-loot:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-gold: #ffcd75; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-loot, .bl-loot:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-gold: #a86a12; } }
/* theme tokens end */
@keyframes bl-loot-chip { from { opacity: 0; transform: scale(0.7); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export const RARITY_TONES = { common: '#94b0c2', uncommon: '#38b764', rare: '#41a6f6', epic: '#b55ac9', legendary: '#ffcd75' };

export default function LootFilter({
  groups = [],
  value,
  defaultValue = {},
  onChange,
  defaultOpen,
  title = 'Filters',
  clearLabel = 'Clear all',
  emptyLabel = 'No filters yet',
  width = 320,
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
  const [inner, setInner] = useState(defaultValue);
  const picked = value ?? inner;
  const [open, setOpen] = useState(() => defaultOpen ?? groups.map(g => g.id));
  const [said, setSaid] = useState('');
  const uid = useId();

  const commit = (next, message) => {
    if (value === undefined) setInner(next);
    setSaid(message);
    onChange?.(next);
  };
  const toggle = (group, option) => {
    const list = picked[group.id] ?? [];
    const on = !list.includes(option.value);
    const next = { ...picked, [group.id]: on ? [...list, option.value] : list.filter(v => v !== option.value) };
    commit(next, `${option.label} ${on ? 'added' : 'removed'}`);
  };
  const chips = groups.flatMap(group => (picked[group.id] ?? []).map(v => ({ group, option: group.options.find(o => o.value === v) ?? { value: v, label: String(v) } })));

  return (
    <section
      className={`bl-loot grid gap-2.5 p-[14px] w-[min(var(--bl-w),100%)] box-border bg-(--bl-bg) text-(--bl-ink) font-(family-name:--bl-font) text-[14px] shadow-[inset_0_0_0_3px_var(--bl-line),6px_6px_0_rgba(0,0,0,0.45)] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-1 [&_button:focus-visible]:outline-(--bl-accent) [&_button:focus-visible]:outline-solid ${className}`}
      aria-label={title}
      style={{ '--bl-w': `${width}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-gold': goldColor, '--bl-font': fontFamily, ...style }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 text-[12px] font-extrabold tracking-[0.06em] uppercase text-(--bl-gold)">{title}</p>
        <button type="button" className="cursor-pointer border-0 bg-transparent px-2 py-1 text-[12px] font-bold text-(--bl-accent) disabled:cursor-default disabled:text-(--bl-muted) disabled:opacity-60" disabled={chips.length === 0} onClick={() => commit({}, 'All filters cleared')}>
          {clearLabel}
        </button>
      </div>
      <ul className="m-0 flex min-h-7 list-none flex-wrap gap-1.5 p-0" aria-label="Active filters">
        {chips.length === 0 && <li className="text-[12px] text-(--bl-muted)">{emptyLabel}</li>}
        {chips.map(({ group, option }) => (
          <li key={`${group.id}:${option.value}`} className="inline-flex animate-[bl-loot-chip_200ms_steps(3)_both] items-center gap-1.5 bg-(--bl-chip) py-1 pr-1 pl-2 text-[12px] font-bold shadow-[inset_3px_0_0_var(--tone,var(--bl-accent))] motion-reduce:animate-none [&_button]:grid [&_button]:size-[18px] [&_button]:cursor-pointer [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0 [&_button]:text-(--bl-muted) [&_button:hover]:text-(--bl-ink)" style={{ '--tone': (option.rarity && RARITY_TONES[option.rarity]) || option.color }}>
            {option.label}
            <button type="button" aria-label={`Remove ${option.label}`} onClick={() => toggle(group, option)}>
              ×
            </button>
          </li>
        ))}
      </ul>
      {groups.map(group => {
        const isOpen = open.includes(group.id);
        const count = (picked[group.id] ?? []).length;
        return (
          <div key={group.id} className="[border-top:2px_dashed_var(--bl-line)]">
            <button type="button" className="flex w-full cursor-pointer items-center justify-between border-0 bg-transparent px-0.5 py-2.5 font-extrabold text-inherit after:text-(--bl-muted) after:[transition:transform_160ms_steps(2)] after:content-['▸'] aria-expanded:after:[transform:rotate(90deg)] motion-reduce:after:[transition:none]" aria-expanded={isOpen} aria-controls={`${uid}-${group.id}`} onClick={() => setOpen(list => (isOpen ? list.filter(id => id !== group.id) : [...list, group.id]))}>
              {group.label}
              {count > 0 && <span className="mr-2.5 ml-auto text-[12px] text-(--bl-accent)">{count}</span>}
            </button>
            {isOpen && (
              <ul id={`${uid}-${group.id}`} className="mx-0 mt-0 mb-2.5 grid list-none gap-0.5 p-0">
                {group.options.map(option => (
                  <li key={option.value}>
                    <label className="flex cursor-pointer items-center gap-2.5 px-2 py-1.5 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-(--bl-accent) focus-within:outline-solid hover:bg-(--bl-chip) [&_input]:m-0 [&_input]:size-4 [&_input]:[accent-color:var(--tone,var(--bl-accent))]" style={{ '--tone': (option.rarity && RARITY_TONES[option.rarity]) || option.color }}>
                      <input type="checkbox" checked={(picked[group.id] ?? []).includes(option.value)} onChange={() => toggle(group, option)} />
                      {(option.rarity || option.color) && <span className="size-2 bg-[var(--tone,var(--bl-muted))]" aria-hidden="true" />}
                      <span>{option.label}</span>
                      {option.count !== undefined && <span className="ml-auto text-[12px] text-(--bl-muted) tabular-nums">{option.count}</span>}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      <span className="sr-only" aria-live="polite">
        {said}
      </span>
    </section>
  );
}
