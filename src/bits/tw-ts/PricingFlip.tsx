import { useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type KeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

export type BillingPeriod = 'monthly' | 'yearly';

export interface PricingPlan {
  id?: string;
  name: string;
  description?: ReactNode;
  /** Price per month when billed monthly; 0 shows freeLabel. */
  monthly: number;
  /** Price per month when billed yearly. */
  yearly?: number;
  features?: string[];
  /** Button label; omit for no button. */
  cta?: ReactNode;
  featured?: boolean;
  /** Ribbon such as "Most popular". */
  badge?: ReactNode;
}

export interface PricingFlipProps {
  plans?: PricingPlan[];
  period?: BillingPeriod;
  defaultPeriod?: BillingPeriod;
  onPeriodChange?: (period: BillingPeriod) => void;
  onSelect?: (plan: PricingPlan, period: BillingPeriod) => void;
  /** ISO currency code for Intl.NumberFormat. */
  currency?: string;
  locale?: string;
  monthlyLabel?: string;
  yearlyLabel?: string;
  perLabel?: string;
  freeLabel?: string;
  /** Text under the price in yearly mode, given the formatted yearly total. */
  billedYearly?: (total: string) => string;
  /** Max width of the card grid in px. */
  width?: number;
  priceSize?: number;
  backgroundColor?: string;
  cardColor?: string;
  trackColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  accentColor?: string;
  onAccentColor?: string;
  saveColor?: string;
  radius?: number;
  fontFamily?: string;
  /** Accessible name of the period switch. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

const STYLE_ID = 'bl-pricing-flip-tw';
const CSS = `
/* theme tokens */
.bl-price { --bl-bg: #1a1c2c; --bl-card: #262b44; --bl-track: #0b0b14; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-accent: #73eff7; --bl-on-accent: #0b0b14; --bl-save: #ffcd75; }
:where(.light, [data-theme="light"]) .bl-price, .bl-price:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-card: #ebe5d8; --bl-track: #e2dacb; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-accent: #167f8f; --bl-save: #a86a12; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-price, :where(.light, [data-theme="light"]) .bl-price:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-card: #262b44; --bl-track: #0b0b14; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-accent: #73eff7; --bl-on-accent: #0b0b14; --bl-save: #ffcd75; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-price, .bl-price:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-card: #ebe5d8; --bl-track: #e2dacb; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-accent: #167f8f; --bl-save: #a86a12; } }
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

const DIGITS = Array.from({ length: 10 }, (_, i) => i);

// A formatted price whose digits roll. Columns are keyed from the right, so "$9" → "$12"
// grows a new column on the left instead of shuffling every drum.
function RollingPrice({ text }: { text: string }) {
  const chars = [...text];
  return (
    <span className="inline-flex text-(length:--bl-size) leading-[1.1] font-extrabold tracking-[-0.01em] tabular-nums" aria-hidden="true">
      {chars.map((ch, i) => {
        const fromRight = chars.length - i;
        if (!/\d/.test(ch)) return <span key={`s${fromRight}-${ch}`}>{ch}</span>;
        return (
          <span key={`d${fromRight}`} className="inline-block h-[1.1em] w-[1ch] overflow-hidden">
            <span className="block [transition:transform_640ms_cubic-bezier(.25,1.25,.5,1)_calc(var(--bl-col)*45ms)] *:block *:h-[1.1em] *:text-center motion-reduce:[transition:none]" style={{ transform: `translateY(${-Number(ch) * 1.1}em)`, '--bl-col': fromRight } as CSSVars}>
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
  billedYearly = (total: string) => `Billed ${total} yearly`,
  width = 1000,
  priceSize = 44,
  backgroundColor,
  cardColor,
  trackColor,
  textColor,
  mutedColor,
  lineColor,
  accentColor,
  onAccentColor,
  saveColor,
  radius = 18,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  label = 'Billing period',
  className = '',
  style
}: PricingFlipProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState<BillingPeriod>(defaultPeriod);
  const period = controlled ?? inner;
  const yearly = period === 'yearly';
  const [announce, setAnnounce] = useState('');
  const optRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const money = (value: number) => new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: Number.isInteger(value) ? 0 : 2 }).format(value);
  const savings = plans.filter(p => p.monthly > 0 && p.yearly != null).map(p => Math.round((1 - p.yearly! / p.monthly) * 100));
  const bestSaving = savings.length ? Math.max(...savings) : 0;

  const choose = (next: BillingPeriod) => {
    if (next === period) return;
    if (controlled === undefined) setInner(next);
    onPeriodChange?.(next);
    setAnnounce(next === 'yearly' ? `Showing yearly prices.${bestSaving > 0 ? ` Save up to ${bestSaving}%.` : ''}` : 'Showing monthly prices.');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const next = yearly ? 'monthly' : 'yearly';
    choose(next);
    optRefs.current[next === 'yearly' ? 1 : 0]?.focus();
  };

  return (
    <div
      className={`bl-price grid w-full grid-cols-[minmax(0,1fr)] justify-items-center gap-7 font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
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
      } as CSSVars}
    >
      <div className="group/switch relative inline-grid grid-cols-[1fr_1fr] rounded-full bg-(--bl-track) p-1 shadow-[inset_0_0_0_1px_var(--bl-line)]" role="radiogroup" aria-label={label} data-yearly={yearly || undefined}>
        <span className="absolute top-1 bottom-1 left-1 w-[calc(50%_-_4px)] rounded-full bg-(--bl-accent) [transition:transform_320ms_cubic-bezier(.3,1.35,.5,1)] group-data-[yearly]/switch:[transform:translateX(100%)] motion-reduce:[transition:none]" aria-hidden="true" />
        {(
          [
            ['monthly', monthlyLabel],
            ['yearly', yearlyLabel]
          ] as [BillingPeriod, string][]
        ).map(([value, text], i) => (
          <button
            key={value}
            ref={node => {
              optRefs.current[i] = node;
            }}
            type="button"
            role="radio"
            className="relative z-1 inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border-0 bg-transparent px-[18px] py-[9px] text-[14px] font-semibold whitespace-nowrap text-(--bl-muted) transition-[color] duration-200 ease-[ease] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-ink) aria-checked:text-(--bl-on-accent)"
            aria-checked={period === value}
            tabIndex={period === value ? 0 : -1}
            onClick={() => choose(value)}
            onKeyDown={onKeyDown}
          >
            {text}
            {value === 'yearly' && bestSaving > 0 && <span className="rounded-full bg-(--bl-save) px-[7px] py-0.5 text-[11px] font-bold text-(--bl-on-accent) [transform:scale(0.85)] [transition:transform_320ms_cubic-bezier(.3,1.6,.5,1)] group-data-[yearly]/switch:[transform:scale(1.08)_rotate(-4deg)] motion-reduce:[transition:none]">Save {bestSaving}%</span>}
          </button>
        ))}
      </div>
      <div className="grid w-full max-w-(--bl-w) grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-[18px]">
        {plans.map(plan => {
          const perMonth = yearly && plan.yearly != null ? plan.yearly : plan.monthly;
          const free = perMonth === 0;
          const shown = free ? freeLabel : money(perMonth);
          const nameId = `${uid}-${plan.id ?? plan.name}`;
          return (
            <section key={plan.id ?? plan.name} className="group/card relative flex flex-col gap-3.5 rounded-(--bl-radius) bg-(--bl-card) p-6 shadow-[0_0_0_1px_var(--bl-line)] data-[featured]:shadow-[0_0_0_2px_var(--bl-accent),0_24px_50px_-28px_var(--bl-accent)]" data-featured={plan.featured || undefined} aria-labelledby={nameId}>
              {plan.badge && <span className="absolute top-0 right-5 rounded-full bg-(--bl-accent) px-2.5 py-1 text-[12px] font-bold text-(--bl-on-accent) [transform:translateY(-50%)]">{plan.badge}</span>}
              <h3 id={nameId} className="m-0 text-[18px] font-bold">
                {plan.name}
              </h3>
              {plan.description && <p className="-mt-1.5 mb-0 text-[14px] leading-[1.5] text-(--bl-muted)">{plan.description}</p>}
              <div className="flex min-h-[1.2em] items-baseline gap-1.5">
                {free ? (
                  <span className="inline-flex text-(length:--bl-size) leading-[1.1] font-extrabold tracking-[-0.01em] tabular-nums" aria-hidden="true">
                    {freeLabel}
                  </span>
                ) : (
                  <RollingPrice text={shown} />
                )}
                {!free && (
                  <span className="text-[14px] text-(--bl-muted)" aria-hidden="true">
                    {perLabel}
                  </span>
                )}
                <span className="sr-only">{free ? freeLabel : `${shown} per month`}</span>
              </div>
              <p className="-mt-2 mb-0 min-h-[1.4em] text-[13px] text-(--bl-muted) transition-opacity duration-240 ease-[ease] data-[hidden]:opacity-0" data-hidden={!yearly || free || plan.yearly == null || undefined}>
                {yearly && !free && plan.yearly != null ? billedYearly(money(plan.yearly * 12)) : ' '}
              </p>
              {plan.features && plan.features.length > 0 && (
                <ul className="mt-1 mb-0 grid list-none gap-[9px] p-0 text-[14px] [&_li]:flex [&_li]:items-start [&_li]:gap-2.5 [&_li]:leading-[1.45] [&_svg]:mt-[3px] [&_svg]:flex-none [&_svg]:text-(--bl-accent)">
                  {plan.features.map(feature => (
                    <li key={feature}>
                      <Check />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}
              {plan.cta && (
                <button type="button" className="mt-auto cursor-pointer rounded-[calc(var(--bl-radius)*0.6)] border-0 bg-(--bl-track) px-4 py-[11px] text-[15px] font-bold text-(--bl-ink) shadow-[inset_0_0_0_1px_var(--bl-line)] hover:[filter:brightness(1.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-ink) group-data-[featured]/card:bg-(--bl-accent) group-data-[featured]/card:text-(--bl-on-accent) group-data-[featured]/card:shadow-none" onClick={() => onSelect?.(plan, period)}>
                  {plan.cta}
                </button>
              )}
            </section>
          );
        })}
      </div>
      <span className="sr-only" aria-live="polite">
        {announce}
      </span>
    </div>
  );
}
