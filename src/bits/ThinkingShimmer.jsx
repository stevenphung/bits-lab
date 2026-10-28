import { useEffect, useId, useInsertionEffect, useRef, useState } from 'react';

// "Thinking…" for AI products. While working, the label shimmers and an elapsed timer ticks;
// when done it settles to "Thought for 12s". The header is a disclosure button that reveals
// the steps (pending, active with a spinner, done with a check). Completion is announced.

const STYLE_ID = 'bl-thinking';
const CSS = `
/* theme tokens */
.bl-think { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-shine: #f4f4f4; --bl-line: rgba(255,255,255,0.12); --bl-hover: rgba(255,255,255,0.06); --bl-accent: #73eff7; --bl-success: #38b764; }
:where(.light, [data-theme="light"]) .bl-think, .bl-think:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-shine: #8a96a3; --bl-line: rgba(26,28,44,0.12); --bl-hover: rgba(26,28,44,0.06); --bl-accent: #167f8f; --bl-success: #2b8a4a; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-think, :where(.light, [data-theme="light"]) .bl-think:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-shine: #f4f4f4; --bl-line: rgba(255,255,255,0.12); --bl-hover: rgba(255,255,255,0.06); --bl-accent: #73eff7; --bl-success: #38b764; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-think, .bl-think:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-shine: #8a96a3; --bl-line: rgba(26,28,44,0.12); --bl-hover: rgba(26,28,44,0.06); --bl-accent: #167f8f; --bl-success: #2b8a4a; } }
/* theme tokens end */
.bl-think { width: 100%; max-width: var(--bl-w); color: var(--bl-ink); font-family: var(--bl-font); font-size: 14px; }
.bl-think__head { display: inline-flex; align-items: center; gap: 8px; padding: 6px 10px 6px 8px; margin-left: -8px; border: 0; border-radius: 8px; background: transparent; color: var(--bl-muted); font: inherit; cursor: pointer; }
.bl-think__head:hover { background: var(--bl-hover); color: var(--bl-ink); }
.bl-think__head:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 1px; }
.bl-think__shine { background: linear-gradient(90deg, var(--bl-muted) 0%, var(--bl-muted) 35%, var(--bl-shine) 50%, var(--bl-muted) 65%, var(--bl-muted) 100%); background-size: 250% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: bl-think-shine var(--bl-speed) linear infinite; }
.bl-think__time { font-variant-numeric: tabular-nums; opacity: 0.8; }
.bl-think__chev { transition: transform 220ms cubic-bezier(.2,.9,.25,1); }
.bl-think__head[aria-expanded="true"] .bl-think__chev { transform: rotate(90deg); }
.bl-think__panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 320ms cubic-bezier(.2,.9,.25,1); }
.bl-think__panel[data-open] { grid-template-rows: 1fr; }
.bl-think__panel > div { overflow: hidden; }
.bl-think__steps { margin: 6px 0 4px 4px; padding: 0 0 0 16px; border-left: 2px solid var(--bl-line); list-style: none; }
.bl-think__step { position: relative; display: grid; grid-template-columns: 18px 1fr; gap: 10px; padding: 6px 0; }
.bl-think__icon { display: grid; place-items: center; width: 18px; height: 18px; margin-top: 1px; color: var(--bl-muted); }
.bl-think__step[data-status="done"] .bl-think__icon { color: var(--bl-success); }
.bl-think__step[data-status="active"] .bl-think__icon { color: var(--bl-accent); }
.bl-think__step[data-status="pending"] { opacity: 0.55; }
.bl-think__label { line-height: 1.45; }
.bl-think__detail { display: block; margin-top: 2px; color: var(--bl-muted); font-size: 13px; line-height: 1.5; }
.bl-think__spin { width: 13px; height: 13px; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: bl-think-spin 800ms linear infinite; }
.bl-think__dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.bl-think__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-think-shine { from { background-position: 100% 0; } to { background-position: -150% 0; } }
@keyframes bl-think-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .bl-think__shine { animation: none; color: var(--bl-muted); background: none; } .bl-think__panel, .bl-think__chev { transition: none; } .bl-think__spin { animation-duration: 2.4s; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const formatSeconds = seconds => (seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`);

export default function ThinkingShimmer({
  thinking = true,
  steps = [],
  label = 'Thinking',
  doneLabel = seconds => `Thought for ${formatSeconds(seconds)}`,
  startedAt,
  showTimer = true,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  shimmerSpeed = 1800,
  width = 560,
  textColor,
  mutedColor,
  shineColor,
  lineColor,
  hoverColor,
  accentColor,
  successColor,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const open = controlledOpen ?? innerOpen;
  const began = useRef(startedAt ?? Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [final, setFinal] = useState(null);

  useEffect(() => {
    if (startedAt) began.current = startedAt;
  }, [startedAt]);

  // Tick while thinking; freeze the total when it stops; restart if thinking resumes.
  useEffect(() => {
    if (!thinking) {
      setFinal(Math.max(1, Math.round((Date.now() - began.current) / 1000)));
      return undefined;
    }
    if (final !== null) {
      began.current = startedAt ?? Date.now();
      setFinal(null);
    }
    const tick = () => setElapsed(Math.floor((Date.now() - began.current) / 1000));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thinking]);

  const toggle = () => {
    if (controlledOpen === undefined) setInnerOpen(o => !o);
    onOpenChange?.(!open);
  };

  const icon = status =>
    status === 'done' ? (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 7.5 5.5 10.5 11.5 3.5" />
      </svg>
    ) : status === 'active' ? (
      <span className="bl-think__spin" />
    ) : (
      <span className="bl-think__dot" />
    );

  const headText = thinking ? `${label}…` : doneLabel(final ?? elapsed);

  return (
    <div
      className={`bl-think ${className}`}
      style={{
        '--bl-w': `${width}px`,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-shine': shineColor,
        '--bl-line': lineColor,
        '--bl-hover': hoverColor,
        '--bl-accent': accentColor,
        '--bl-success': successColor,
        '--bl-speed': `${shimmerSpeed}ms`,
        '--bl-font': fontFamily,
        ...style
      }}
    >
      <button type="button" className="bl-think__head" aria-expanded={open} aria-controls={`${uid}-steps`} onClick={toggle} disabled={!steps.length}>
        <svg className="bl-think__chev" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" style={{ opacity: steps.length ? 1 : 0 }}>
          <path d="M4.5 2.5 8 6l-3.5 3.5" />
        </svg>
        <span className={thinking ? 'bl-think__shine' : undefined}>{headText}</span>
        {thinking && showTimer && <span className="bl-think__time">{formatSeconds(elapsed)}</span>}
      </button>
      <div id={`${uid}-steps`} className="bl-think__panel" data-open={open || undefined} inert={!open || undefined}>
        <div>
          <ol className="bl-think__steps">
            {steps.map((step, i) => (
              <li key={step.id ?? i} className="bl-think__step" data-status={step.status ?? 'pending'}>
                <span className="bl-think__icon" aria-hidden="true">
                  {icon(step.status ?? 'pending')}
                </span>
                <span>
                  <span className={`bl-think__label ${step.status === 'active' ? 'bl-think__shine' : ''}`}>{step.label}</span>
                  <span className="bl-think__sr">{step.status === 'done' ? ' (done)' : step.status === 'active' ? ' (in progress)' : ' (waiting)'}</span>
                  {step.detail && <span className="bl-think__detail">{step.detail}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <span className="bl-think__sr" role="status">
        {thinking ? '' : doneLabel(final ?? elapsed)}
      </span>
    </div>
  );
}
