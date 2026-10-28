import { useId, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

// Accordion with real spring motion. Panels open and close on a spring curve (generated as a
// CSS linear() easing, so it runs on the compositor-friendly animation path), and the panel's
// children stagger in. Single or multiple open, WAI-ARIA accordion pattern: buttons in
// headings, Up/Down/Home/End between headers, closed panels inert.

const STYLE_ID = 'bl-accordion';
// Named STYLES (not CSS) so the global CSS.supports() stays reachable below.
const STYLES = `
/* theme tokens */
.bl-acc { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: rgba(255,255,255,0.1); --bl-hover: rgba(255,255,255,0.04); --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-acc, .bl-acc:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: rgba(26,28,44,0.1); --bl-hover: rgba(26,28,44,0.04); --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-acc, :where(.light, [data-theme="light"]) .bl-acc:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: rgba(255,255,255,0.1); --bl-hover: rgba(255,255,255,0.04); --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-acc, .bl-acc:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: rgba(26,28,44,0.1); --bl-hover: rgba(26,28,44,0.04); --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-acc { width: 100%; max-width: var(--bl-w); border-radius: var(--bl-radius); background: var(--bl-bg); box-shadow: inset 0 0 0 1px var(--bl-line); color: var(--bl-ink); font-family: var(--bl-font); overflow: hidden; }
.bl-acc__item + .bl-acc__item { border-top: 1px solid var(--bl-line); }
.bl-acc__heading { margin: 0; font: inherit; }
.bl-acc__trigger { display: flex; align-items: center; gap: 12px; width: 100%; padding: 16px 18px; border: 0; background: transparent; color: inherit; font: inherit; font-size: 15px; font-weight: 600; text-align: left; cursor: pointer; }
.bl-acc__trigger:hover { background: var(--bl-hover); }
.bl-acc__trigger:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: -2px; }
.bl-acc__trigger:disabled { opacity: 0.45; cursor: not-allowed; }
.bl-acc__title { flex: 1; min-width: 0; }
.bl-acc__chev { flex: 0 0 auto; color: var(--bl-muted); transition: transform var(--bl-dur) var(--bl-ease); }
.bl-acc__trigger[aria-expanded="true"] .bl-acc__chev { transform: rotate(180deg); color: var(--bl-accent); }
.bl-acc__panel { overflow: hidden; }
.bl-acc__panel:not([data-open]):not([data-animating]) { height: 0; visibility: hidden; }
.bl-acc__body { padding: 0 18px 18px; color: var(--bl-muted); font-size: 14px; line-height: 1.6; }
.bl-acc__body > * { margin: 0 0 10px; }
.bl-acc__body > :last-child { margin-bottom: 0; }
.bl-acc__panel[data-open] .bl-acc__body > * { animation: bl-acc-in 380ms cubic-bezier(.2,.9,.25,1) both; animation-delay: calc(var(--i, 0) * var(--bl-stagger)); }
@keyframes bl-acc-in { from { opacity: 0; transform: translateY(8px); } }
@media (prefers-reduced-motion: reduce) { .bl-acc__chev { transition: none; } .bl-acc__panel[data-open] .bl-acc__body > * { animation: none; } }
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
  backgroundColor,
  textColor,
  mutedColor,
  lineColor,
  hoverColor,
  accentColor,
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
      className={`bl-acc ${className}`}
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
          <div key={id} className="bl-acc__item">
            <Heading className="bl-acc__heading">
              <button
                ref={node => {
                  triggers.current[index] = node;
                }}
                type="button"
                id={`${uid}-trigger-${index}`}
                className="bl-acc__trigger"
                aria-expanded={isOpen}
                aria-controls={`${uid}-panel-${index}`}
                aria-disabled={!multiple && !collapsible && isOpen ? true : undefined}
                disabled={item.disabled}
                onClick={() => toggle(id)}
                onKeyDown={event => onKeyDown(event, index)}
              >
                {item.icon}
                <span className="bl-acc__title">{item.title}</span>
                <svg className="bl-acc__chev" width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M3 5.5 7 9.5l4-4" />
                </svg>
              </button>
            </Heading>
            <div
              ref={node => {
                panels.current[id] = node;
              }}
              id={`${uid}-panel-${index}`}
              className="bl-acc__panel"
              role="region"
              aria-labelledby={`${uid}-trigger-${index}`}
              data-open={isOpen || undefined}
              inert={isOpen ? undefined : true}
            >
              <div className="bl-acc__body">{typeof item.content === 'string' ? <p>{item.content}</p> : item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
