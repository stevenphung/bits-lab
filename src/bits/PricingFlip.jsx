import { useId, useInsertionEffect, useRef, useState } from 'react';

// Pricing cards with a Monthly / Yearly switch. Flipping it rolls every price digit to its
// new value like a counter, shows what a year is billed at, and pops a "Save N%" badge
// computed from your own numbers. The switch is a keyboard radio group, prices are read
// out as words ("$12 per month"), and the change of period is announced once.

const STYLE_ID = 'bl-pricing-flip';
const CSS = `
.bl-price { display: grid; grid-template-columns: minmax(0, 1fr); gap: 28px; justify-items: center; width: 100%; color: var(--bl-ink); font-family: var(--bl-font); }
.bl-price__switch { position: relative; display: inline-grid; grid-template-columns: 1fr 1fr; padding: 4px; border-radius: 999px; background: var(--bl-track); box-shadow: inset 0 0 0 1px var(--bl-line); }
.bl-price__thumb { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 4px); border-radius: 999px; background: var(--bl-accent); transition: transform 320ms cubic-bezier(.3,1.35,.5,1); }
.bl-price__switch[data-yearly] .bl-price__thumb { transform: translateX(100%); }
.bl-price__opt { position: relative; z-index: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 9px 18px; border: 0; border-radius: 999px; background: transparent; color: var(--bl-muted); font: inherit; font-size: 14px; font-weight: 600; white-space: nowrap; cursor: pointer; transition: color 200ms; }
.bl-price__opt[aria-checked="true"] { color: var(--bl-on-accent); }
.bl-price__opt:focus-visible { outline: 2px solid var(--bl-ink); outline-offset: 2px; }
.bl-price__save { padding: 2px 7px; border-radius: 999px; background: var(--bl-save); color: var(--bl-on-accent); font-size: 11px; font-weight: 700; transform: scale(0.85); transition: transform 320ms cubic-bezier(.3,1.6,.5,1); }
.bl-price__switch[data-yearly] .bl-price__save { transform: scale(1.08) rotate(-4deg); }
.bl-price__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 18px; width: 100%; max-width: var(--bl-w); }
.bl-price__card { position: relative; display: flex; flex-direction: column; gap: 14px; padding: 24px; border-radius: var(--bl-radius); background: var(--bl-card); box-shadow: 0 0 0 1px var(--bl-line); }
.bl-price__card[data-featured] { box-shadow: 0 0 0 2px var(--bl-accent), 0 24px 50px -28px var(--bl-accent); }
.bl-price__badge { position: absolute; top: 0; right: 20px; padding: 4px 10px; border-radius: 999px; background: var(--bl-accent); color: var(--bl-on-accent); font-size: 12px; font-weight: 700; transform: translateY(-50%); }
.bl-price__name { margin: 0; font-size: 18px; font-weight: 700; }
.bl-price__desc { margin: -6px 0 0; color: var(--bl-muted); font-size: 14px; line-height: 1.5; }
.bl-price__amount { display: flex; align-items: baseline; gap: 6px; min-height: 1.2em; }
.bl-price__figure { display: inline-flex; font-size: var(--bl-size); font-weight: 800; line-height: 1.1; font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
.bl-price__drum { display: inline-block; width: 1ch; height: 1.1em; overflow: hidden; }
.bl-price__strip { display: block; transition: transform 640ms cubic-bezier(.25,1.25,.5,1); transition-delay: calc(var(--bl-col) * 45ms); }
.bl-price__strip > span { display: block; height: 1.1em; text-align: center; }
.bl-price__per { color: var(--bl-muted); font-size: 14px; }
.bl-price__billed { min-height: 1.4em; margin: -8px 0 0; color: var(--bl-muted); font-size: 13px; transition: opacity 240ms; }
.bl-price__billed[data-hidden] { opacity: 0; }
.bl-price__features { display: grid; gap: 9px; margin: 4px 0 0; padding: 0; list-style: none; font-size: 14px; }
.bl-price__features li { display: flex; gap: 10px; align-items: flex-start; line-height: 1.45; }
.bl-price__features svg { flex: 0 0 auto; margin-top: 3px; color: var(--bl-accent); }
.bl-price__cta { margin-top: auto; padding: 11px 16px; border: 0; border-radius: calc(var(--bl-radius) * 0.6); background: var(--bl-track); color: var(--bl-ink); font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: inset 0 0 0 1px var(--bl-line); }
.bl-price__card[data-featured] .bl-price__cta { background: var(--bl-accent); color: var(--bl-on-accent); box-shadow: none; }
.bl-price__cta:hover { filter: brightness(1.12); }
.bl-price__cta:focus-visible { outline: 2px solid var(--bl-ink); outline-offset: 2px; }
.bl-price__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .bl-price__thumb, .bl-price__strip, .bl-price__save { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const DIGITS = Array.from({ length: 10 }, (_, i) => i);

// A formatted price whose digits roll. Columns are keyed from the right, so "$9" → "$12"
// grows a new column on the left instead of shuffling every drum.
function RollingPrice({ text }) {
  const chars = [...text];
  return (
    <span className="bl-price__figure" aria-hidden="true">
      {chars.map((ch, i) => {
        const fromRight = chars.length - i;
        if (!/\d/.test(ch)) return <span key={`s${fromRight}-${ch}`}>{ch}</span>;
        return (
          <span key={`d${fromRight}`} className="bl-price__drum">
            <span className="bl-price__strip" style={{ transform: `translateY(${-Number(ch) * 1.1}em)`, '--bl-col': fromRight }}>
              {DIGITS.map(d => (
                <span key={d}>{d}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 7.5 5.5 10.5 11.5 3.5" />
  </svg>
);

export default function PricingFlip({
  plans = [],
  period: controlled,
  defaultPeriod = 'monthly',
  onPeriodChange,
  onSelect,
  currency = 'USD',
  locale = 'en-US',
  monthlyLabel = 'Monthly',
  yearlyLabel = 'Yearly',
  perLabel = '/mo',
  freeLabel = 'Free',
  billedYearly = total => `Billed ${total} yearly`,
  width = 1000,
  priceSize = 44,
  backgroundColor = '#1a1c2c',
  cardColor = '#262b44',
  trackColor = '#0b0b14',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = '#333c57',
  accentColor = '#73eff7',
  onAccentColor = '#0b0b14',
  saveColor = '#ffcd75',
  radius = 18,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  label = 'Billing period',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState(defaultPeriod);
  const period = controlled ?? inner;
  const yearly = period === 'yearly';
  const [announce, setAnnounce] = useState('');
  const optRefs = useRef([]);

  const money = value => new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: Number.isInteger(value) ? 0 : 2 }).format(value);
  const savings = plans.filter(p => p.monthly > 0 && p.yearly != null).map(p => Math.round((1 - p.yearly / p.monthly) * 100));
  const bestSaving = savings.length ? Math.max(...savings) : 0;

  const choose = next => {
    if (next === period) return;
    if (controlled === undefined) setInner(next);
    onPeriodChange?.(next);
    setAnnounce(next === 'yearly' ? `Showing yearly prices.${bestSaving > 0 ? ` Save up to ${bestSaving}%.` : ''}` : 'Showing monthly prices.');
  };

  const onKeyDown = event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const next = yearly ? 'monthly' : 'yearly';
    choose(next);
    optRefs.current[next === 'yearly' ? 1 : 0]?.focus();
  };

  return (
    <div
      className={`bl-price ${className}`}
      style={{
        '--bl-w': `${width}px`,
        '--bl-size': `${priceSize}px`,
        '--bl-radius': `${radius}px`,
        '--bl-bg': backgroundColor,
        '--bl-card': cardColor,
        '--bl-track': trackColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-on-accent': onAccentColor,
        '--bl-save': saveColor,
        '--bl-font': fontFamily,
        ...style
      }}
    >
      <div className="bl-price__switch" role="radiogroup" aria-label={label} data-yearly={yearly || undefined}>
        <span className="bl-price__thumb" aria-hidden="true" />
        {[
          ['monthly', monthlyLabel],
          ['yearly', yearlyLabel]
        ].map(([value, text], i) => (
          <button
            key={value}
            ref={node => {
              optRefs.current[i] = node;
            }}
            type="button"
            role="radio"
            className="bl-price__opt"
            aria-checked={period === value}
            tabIndex={period === value ? 0 : -1}
            onClick={() => choose(value)}
            onKeyDown={onKeyDown}
          >
            {text}
            {value === 'yearly' && bestSaving > 0 && <span className="bl-price__save">Save {bestSaving}%</span>}
          </button>
        ))}
      </div>
      <div className="bl-price__grid">
        {plans.map(plan => {
          const perMonth = yearly && plan.yearly != null ? plan.yearly : plan.monthly;
          const free = perMonth === 0;
          const shown = free ? freeLabel : money(perMonth);
          const nameId = `${uid}-${plan.id ?? plan.name}`;
          return (
            <section key={plan.id ?? plan.name} className="bl-price__card" data-featured={plan.featured || undefined} aria-labelledby={nameId}>
              {plan.badge && <span className="bl-price__badge">{plan.badge}</span>}
              <h3 id={nameId} className="bl-price__name">
                {plan.name}
              </h3>
              {plan.description && <p className="bl-price__desc">{plan.description}</p>}
              <div className="bl-price__amount">
                {free ? (
                  <span className="bl-price__figure" aria-hidden="true">
                    {freeLabel}
                  </span>
                ) : (
                  <RollingPrice text={shown} />
                )}
                {!free && (
                  <span className="bl-price__per" aria-hidden="true">
                    {perLabel}
                  </span>
                )}
                <span className="bl-price__sr">{free ? freeLabel : `${shown} per month`}</span>
              </div>
              <p className="bl-price__billed" data-hidden={!yearly || free || plan.yearly == null || undefined}>
                {yearly && !free && plan.yearly != null ? billedYearly(money(plan.yearly * 12)) : ' '}
              </p>
              {plan.features && plan.features.length > 0 && (
                <ul className="bl-price__features">
                  {plan.features.map(feature => (
                    <li key={feature}>
                      <Check />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
              {plan.cta && (
                <button type="button" className="bl-price__cta" onClick={() => onSelect?.(plan, period)}>
                  {plan.cta}
                </button>
              )}
            </section>
          );
        })}
      </div>
      <span className="bl-price__sr" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
