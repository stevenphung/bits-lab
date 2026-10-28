import { useId, useInsertionEffect, useState } from 'react';

// Filters laid out like a loot screen. Groups of options fold open and closed; options are real
// checkboxes with an optional count and rarity colour; everything picked shows as removable chips
// above, with Clear all. The value is a map of group id → picked option values, controlled or not.
// Native checkboxes and buttons give full keyboard control; changes are announced politely.

const STYLE_ID = 'bl-loot-filter';
const CSS = `
.bl-loot { display: grid; gap: 10px; width: min(var(--bl-w), 100%); padding: 14px; box-sizing: border-box; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); font-size: 14px; box-shadow: inset 0 0 0 3px var(--bl-line), 6px 6px 0 rgba(0,0,0,0.45); }
.bl-loot__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.bl-loot__title { margin: 0; color: var(--bl-gold); font-size: 12px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
.bl-loot__clear { padding: 4px 8px; border: 0; background: transparent; color: var(--bl-accent); font: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
.bl-loot__clear:disabled { color: var(--bl-muted); cursor: default; opacity: 0.6; }
.bl-loot__chips { display: flex; flex-wrap: wrap; gap: 6px; min-height: 28px; margin: 0; padding: 0; list-style: none; }
.bl-loot__chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 4px 4px 8px; background: var(--bl-chip); font-size: 12px; font-weight: 700; box-shadow: inset 3px 0 0 var(--tone, var(--bl-accent)); animation: bl-loot-chip 200ms steps(3) both; }
.bl-loot__chip button { display: grid; place-items: center; width: 18px; height: 18px; padding: 0; border: 0; background: transparent; color: var(--bl-muted); font: inherit; cursor: pointer; }
.bl-loot__chip button:hover { color: var(--bl-ink); }
.bl-loot__none { color: var(--bl-muted); font-size: 12px; }
.bl-loot__group { border-top: 2px dashed var(--bl-line); }
.bl-loot__toggle { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 10px 2px; border: 0; background: transparent; color: inherit; font: inherit; font-weight: 800; cursor: pointer; }
.bl-loot__toggle::after { content: '▸'; color: var(--bl-muted); transition: transform 160ms steps(2); }
.bl-loot__toggle[aria-expanded="true"]::after { transform: rotate(90deg); }
.bl-loot__picked { margin-left: auto; margin-right: 10px; color: var(--bl-accent); font-size: 12px; }
.bl-loot__options { display: grid; gap: 2px; margin: 0 0 10px; padding: 0; list-style: none; }
.bl-loot__option { display: flex; align-items: center; gap: 10px; padding: 6px 8px; cursor: pointer; }
.bl-loot__option:hover { background: var(--bl-chip); }
.bl-loot__option input { width: 16px; height: 16px; margin: 0; accent-color: var(--tone, var(--bl-accent)); }
.bl-loot__gem { width: 8px; height: 8px; background: var(--tone, var(--bl-muted)); }
.bl-loot__count { margin-left: auto; color: var(--bl-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.bl-loot button:focus-visible, .bl-loot__option:focus-within { outline: 2px solid var(--bl-accent); outline-offset: 1px; }
.bl-loot__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-loot-chip { from { opacity: 0; transform: scale(0.7); } }
@media (prefers-reduced-motion: reduce) { .bl-loot__chip { animation: none; } .bl-loot__toggle::after { transition: none; } }
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
  backgroundColor = '#1a1c2c',
  chipColor = '#262b44',
  lineColor = '#333c57',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  accentColor = '#73eff7',
  goldColor = '#ffcd75',
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
      className={`bl-loot ${className}`}
      aria-label={title}
      style={{ '--bl-w': `${width}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-gold': goldColor, '--bl-font': fontFamily, ...style }}
    >
      <div className="bl-loot__head">
        <p className="bl-loot__title">{title}</p>
        <button type="button" className="bl-loot__clear" disabled={chips.length === 0} onClick={() => commit({}, 'All filters cleared')}>
          {clearLabel}
        </button>
      </div>
      <ul className="bl-loot__chips" aria-label="Active filters">
        {chips.length === 0 && <li className="bl-loot__none">{emptyLabel}</li>}
        {chips.map(({ group, option }) => (
          <li key={`${group.id}:${option.value}`} className="bl-loot__chip" style={{ '--tone': (option.rarity && RARITY_TONES[option.rarity]) || option.color }}>
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
          <div key={group.id} className="bl-loot__group">
            <button type="button" className="bl-loot__toggle" aria-expanded={isOpen} aria-controls={`${uid}-${group.id}`} onClick={() => setOpen(list => (isOpen ? list.filter(id => id !== group.id) : [...list, group.id]))}>
              {group.label}
              {count > 0 && <span className="bl-loot__picked">{count}</span>}
            </button>
            {isOpen && (
              <ul id={`${uid}-${group.id}`} className="bl-loot__options">
                {group.options.map(option => (
                  <li key={option.value}>
                    <label className="bl-loot__option" style={{ '--tone': (option.rarity && RARITY_TONES[option.rarity]) || option.color }}>
                      <input type="checkbox" checked={(picked[group.id] ?? []).includes(option.value)} onChange={() => toggle(group, option)} />
                      {(option.rarity || option.color) && <span className="bl-loot__gem" aria-hidden="true" />}
                      <span>{option.label}</span>
                      {option.count !== undefined && <span className="bl-loot__count">{option.count}</span>}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      <span className="bl-loot__sr" aria-live="polite">
        {said}
      </span>
    </section>
  );
}
