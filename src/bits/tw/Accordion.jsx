import { useId, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Accordion with real spring motion. Panels open and close on a spring curve (generated as a
// CSS linear() easing, so it runs on the compositor-friendly animation path), and the panel's
// children stagger in. Single or multiple open, WAI-ARIA accordion pattern: buttons in
// headings, Up/Down/Home/End between headers, closed panels inert.

const STYLE_ID = 'bl-accordion-tw';
// Named STYLES (not CSS) so the global CSS.supports() stays reachable below.
const STYLES = `
@keyframes bl-acc-in { from { opacity: 0; transform: translateY(8px); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = STYLES;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Simulates a damped spring from 0 to 1 and returns it as a CSS linear() easing plus the time
// it takes to settle. Falls back to an ease-out curve where linear() isn't supported.
export function springEasing({ stiffness = 260, damping = 22, mass = 1 } = {}) {
  const supported = typeof CSS !== 'undefined' && CSS.supports?.('animation-timing-function', 'linear(0, 1)');
  let x = 0;
  let v = 0;
  const dt = 1 / 120;
  const points = [0];
  let t = 0;
  while (t < 3) {
    const force = -stiffness * (x - 1) - damping * v;
    v += (force / mass) * dt;
    x += v * dt;
    t += dt;
    points.push(x);
    if (Math.abs(x - 1) < 0.001 && Math.abs(v) < 0.01) break;
  }
  const duration = Math.round(t * 1000);
  if (!supported) return { easing: 'cubic-bezier(.2,.9,.25,1)', duration: Math.min(duration, 500) };
  // Keep ~40 evenly spaced samples; that's plenty for a smooth curve.
  const step = Math.max(1, Math.floor(points.length / 40));
  const sampled = points.filter((_, i) => i % step === 0);
  sampled.push(1);
  return { easing: `linear(${sampled.map(p => p.toFixed(3)).join(', ')})`, duration };
}

export default function Accordion({
  items = [],
  type = 'single',
  defaultValue,
  value: controlled,
  onValueChange,
  collapsible = true,
  stiffness = 260,
  damping = 22,
  stagger = 45,
  width = 640,
  radius = 14,
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = 'rgba(255,255,255,0.1)',
  hoverColor = 'rgba(255,255,255,0.04)',
  accentColor = '#73eff7',
  headingLevel = 3,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const multiple = type === 'multiple';
  const [inner, setInner] = useState(() => {
    const start = defaultValue ?? [];
    return Array.isArray(start) ? start : [start];
  });
  const open = controlled !== undefined ? (Array.isArray(controlled) ? controlled : controlled ? [controlled] : []) : inner;
  const panels = useRef({});
  const triggers = useRef([]);
  const previous = useRef(open);
  const spring = springEasing({ stiffness, damping });

  const toggle = id => {
    const isOpen = open.includes(id);
    if (isOpen && !multiple && !collapsible) return;
    const next = isOpen ? open.filter(v => v !== id) : multiple ? [...open, id] : [id];
    if (controlled === undefined) setInner(next);
    onValueChange?.(multiple ? next : next[0] ?? null);
  };

  // Animate height for panels whose state changed since the last render.
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = open;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    for (const [id, panel] of Object.entries(panels.current)) {
      if (!panel) continue;
      const was = before.includes(id);
      const is = open.includes(id);
      if (was === is) continue;
      if (is) [...panel.firstElementChild.children].forEach((child, i) => child.style.setProperty('--i', String(i)));
      if (reduced) continue;
      const target = is ? panel.scrollHeight : 0;
      const from = is ? 0 : panel.scrollHeight;
      panel.setAttribute('data-animating', '');
      const animation = panel.animate([{ height: `${from}px` }, { height: `${target}px` }], is ? spring : { duration: 240, easing: 'cubic-bezier(.4,0,.2,1)' });
      animation.onfinish = animation.oncancel = () => panel.removeAttribute('data-animating');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open.join('|')]);

  const onKeyDown = (event, index) => {
    const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter(i => i >= 0);
    const position = enabled.indexOf(index);
    const keys = { ArrowDown: position + 1, ArrowUp: position - 1, Home: 0, End: enabled.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    triggers.current[enabled[(keys[event.key] + enabled.length) % enabled.length]]?.focus();
  };

  const Heading = `h${Math.min(6, Math.max(2, headingLevel))}`;

  return (
    <div
      className={`w-full max-w-(--bl-w) overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) font-(family-name:--bl-font) text-(--bl-ink) shadow-[inset_0_0_0_1px_var(--bl-line)] ${className}`}
      style={{
        '--bl-w': `${width}px`,
        '--bl-radius': `${radius}px`,
        '--bl-bg': backgroundColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-line': lineColor,
        '--bl-hover': hoverColor,
        '--bl-accent': accentColor,
        '--bl-dur': `${Math.min(spring.duration, 450)}ms`,
        '--bl-ease': 'cubic-bezier(.2,.9,.25,1.2)',
        '--bl-stagger': `${stagger}ms`,
        '--bl-font': fontFamily,
        ...style
      }}
    >
      {items.map((item, index) => {
        const id = item.id ?? String(index);
        const isOpen = open.includes(id);
        return (
          <div key={id} className="not-first:border-t not-first:border-solid not-first:border-(--bl-line)">
            <Heading className="m-0 [font:inherit]">
              <button
                ref={node => {
                  triggers.current[index] = node;
                }}
                type="button"
                id={`${uid}-trigger-${index}`}
                className="group/trig flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-[18px] py-4 text-left text-[15px] font-semibold text-inherit hover:bg-(--bl-hover) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--bl-accent) disabled:cursor-not-allowed disabled:opacity-45"
                aria-expanded={isOpen}
                aria-controls={`${uid}-panel-${index}`}
                aria-disabled={!multiple && !collapsible && isOpen ? true : undefined}
                disabled={item.disabled}
                onClick={() => toggle(id)}
                onKeyDown={event => onKeyDown(event, index)}
              >
                {item.icon}
                <span className="min-w-0 flex-1">{item.title}</span>
                <svg className="flex-none text-(--bl-muted) [transition:transform_var(--bl-dur)_var(--bl-ease)] group-aria-expanded/trig:text-(--bl-accent) group-aria-expanded/trig:[transform:rotate(180deg)] motion-reduce:[transition:none]" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 5.5 7 9.5l4-4" />
                </svg>
              </button>
            </Heading>
            <div
              ref={node => {
                panels.current[id] = node;
              }}
              id={`${uid}-panel-${index}`}
              className="group/panel overflow-hidden not-data-[open]:not-data-[animating]:invisible not-data-[open]:not-data-[animating]:h-0"
              role="region"
              aria-labelledby={`${uid}-trigger-${index}`}
              data-open={isOpen || undefined}
              inert={isOpen ? undefined : true}
            >
              <div className="px-[18px] pt-0 pb-[18px] text-[14px] leading-[1.6] text-(--bl-muted) *:mx-0 *:mt-0 *:mb-2.5 *:last:mb-0 group-data-[open]/panel:*:animate-[bl-acc-in_380ms_cubic-bezier(.2,.9,.25,1)_both] group-data-[open]/panel:*:[animation-delay:calc(var(--i,0)*var(--bl-stagger))] motion-reduce:group-data-[open]/panel:*:animate-none">{typeof item.content === 'string' ? <p>{item.content}</p> : item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
