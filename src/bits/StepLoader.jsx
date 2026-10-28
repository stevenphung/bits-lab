import { useEffect, useId, useInsertionEffect, useRef } from 'react';

// A multi-step progress panel for long jobs (deploys, imports, onboarding setup). Steps
// tick off one by one: the current one spins, finished ones draw a check, a failed one
// shows a cross, and a rail fills between them. An overall bar and "Step 2 of 5" sit on top,
// with Cancel while it runs and a Done/Retry button at the end. You drive it with `current`
// and `status`; each change is announced. Set `fixed` to show it as a modal overlay.

const STYLE_ID = 'bl-step-loader';
const CSS = `
/* theme tokens */
.bl-steps { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-track: #333c57; --bl-line: #333c57; --bl-accent: #38b764; --bl-on-accent: #0b0b14; --bl-error: #b13e53; }
:where(.light, [data-theme="light"]) .bl-steps, .bl-steps:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-track: #cfc4ad; --bl-line: #cfc4ad; --bl-accent: #2b8a4a; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-steps, :where(.light, [data-theme="light"]) .bl-steps:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-track: #333c57; --bl-line: #333c57; --bl-accent: #38b764; --bl-on-accent: #0b0b14; --bl-error: #b13e53; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-steps, .bl-steps:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-track: #cfc4ad; --bl-line: #cfc4ad; --bl-accent: #2b8a4a; } }
/* theme tokens end */
.bl-steps { position: relative; width: 100%; max-width: var(--bl-w); box-sizing: border-box; padding: 22px; border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); box-shadow: 0 0 0 1px var(--bl-line), 0 30px 60px -30px rgba(0,0,0,0.85); }
.bl-steps-overlay { position: fixed; inset: 0; z-index: 1900; display: grid; place-items: center; padding: 16px; background: var(--bl-backdrop); animation: bl-steps-fade 200ms both; }
.bl-steps-overlay > .bl-steps { animation: bl-steps-pop 360ms cubic-bezier(.3,1.35,.5,1) both; }
.bl-steps__title { margin: 0 0 4px; font-size: 17px; font-weight: 700; }
.bl-steps__meta { display: flex; justify-content: space-between; gap: 12px; color: var(--bl-muted); font-size: 13px; }
.bl-steps__bar { height: 6px; margin: 10px 0 18px; overflow: hidden; border-radius: 999px; background: var(--bl-track); }
.bl-steps__fill { height: 100%; width: calc(var(--bl-p) * 100%); border-radius: inherit; background: var(--bl-accent); transition: width 500ms cubic-bezier(.2,.9,.25,1), background-color 200ms; }
.bl-steps[data-status="error"] .bl-steps__fill { background: var(--bl-error); }
.bl-steps__list { position: relative; display: grid; gap: 0; max-height: var(--bl-max-h); margin: 0; padding: 0; overflow-y: auto; list-style: none; }
.bl-steps__step { position: relative; display: grid; grid-template-columns: 28px 1fr; gap: 12px; padding-bottom: 16px; color: var(--bl-muted); transition: color 200ms; }
.bl-steps__step:last-child { padding-bottom: 0; }
.bl-steps__step:not(:last-child)::before { content: ""; position: absolute; left: 13px; top: 30px; bottom: 2px; width: 2px; background: var(--bl-track); }
.bl-steps__step:not(:last-child)::after { content: ""; position: absolute; left: 13px; top: 30px; bottom: 2px; width: 2px; background: var(--bl-accent); transform-origin: top; transform: scaleY(0); transition: transform 400ms cubic-bezier(.2,.9,.25,1); }
.bl-steps__step[data-state="done"]::after { transform: scaleY(1); }
.bl-steps__step[data-state="active"], .bl-steps__step[data-state="done"] { color: var(--bl-ink); }
.bl-steps__step[data-state="error"] { color: var(--bl-error); }
.bl-steps__icon { position: relative; display: grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--bl-track); color: var(--bl-on-accent); }
.bl-steps__step[data-state="done"] .bl-steps__icon { background: var(--bl-accent); animation: bl-steps-pop-icon 360ms cubic-bezier(.3,1.6,.5,1); }
.bl-steps__step[data-state="error"] .bl-steps__icon { background: var(--bl-error); }
.bl-steps__spin { position: absolute; inset: 0; border-radius: 50%; border: 3px solid var(--bl-track); border-top-color: var(--bl-accent); animation: bl-steps-spin 800ms linear infinite; }
.bl-steps__icon path { stroke-dasharray: 20; stroke-dashoffset: 20; animation: bl-steps-draw 320ms 80ms cubic-bezier(.2,.9,.25,1) forwards; }
.bl-steps__text { display: grid; gap: 2px; padding-top: 4px; min-width: 0; }
.bl-steps__label { font-size: 15px; font-weight: 600; }
.bl-steps__desc { color: var(--bl-muted); font-size: 13px; line-height: 1.4; }
.bl-steps__actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.bl-steps__btn { padding: 9px 16px; border: 0; border-radius: 8px; background: var(--bl-track); color: var(--bl-ink); font: inherit; font-size: 14px; font-weight: 600; cursor: pointer; }
.bl-steps__btn[data-primary] { background: var(--bl-accent); color: var(--bl-on-accent); }
.bl-steps__btn:hover { filter: brightness(1.15); }
.bl-steps__btn:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-steps__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-steps-spin { to { transform: rotate(360deg); } }
@keyframes bl-steps-draw { to { stroke-dashoffset: 0; } }
@keyframes bl-steps-pop-icon { 40% { transform: scale(1.25); } }
@keyframes bl-steps-fade { from { opacity: 0; } }
@keyframes bl-steps-pop { from { opacity: 0; transform: translateY(12px) scale(0.96); } }
@media (prefers-reduced-motion: reduce) {
  .bl-steps__spin { animation-duration: 2.4s; }
  .bl-steps__icon path { animation: none; stroke-dashoffset: 0; }
  .bl-steps__fill, .bl-steps__step::after { transition: none; }
  .bl-steps__step[data-state="done"] .bl-steps__icon, .bl-steps-overlay, .bl-steps-overlay > .bl-steps { animation: none; }
}
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2.5 7.5 5.5 10.5 11.5 3.5" />
  </svg>
);
const Cross = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5" />
  </svg>
);

export default function StepLoader({
  steps = [],
  current = 0,
  status = 'running',
  title = 'Working on it',
  open = true,
  fixed = false,
  onCancel,
  onDone,
  onRetry,
  cancelLabel = 'Cancel',
  doneLabel = 'Done',
  retryLabel = 'Retry',
  successMessage = 'All done!',
  errorMessage = 'Something went wrong.',
  width = 440,
  maxListHeight = 320,
  backgroundColor,
  textColor,
  mutedColor,
  trackColor,
  lineColor,
  accentColor,
  onAccentColor,
  errorColor,
  backdropColor = 'rgba(8,8,16,0.65)',
  radius = 16,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const listRef = useRef(null);
  const actionRef = useRef(null);
  const total = steps.length;
  const finished = status === 'done';
  const failed = status === 'error';
  const index = Math.max(0, Math.min(total - 1, current));
  const doneCount = finished ? total : index;
  const progress = total ? doneCount / total : 0;

  const stateOf = i => (finished || i < index ? 'done' : i === index ? (failed ? 'error' : 'active') : 'pending');

  // Keep the current step in view in long lists (scrolling only the list, never the page).
  useEffect(() => {
    const list = listRef.current;
    const node = list?.children[index];
    if (!list || !node) return;
    const top = node.offsetTop; // the list is positioned, so this is relative to it
    const bottom = top + node.offsetHeight;
    const behavior = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    if (top < list.scrollTop) list.scrollTo({ top, behavior });
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTo({ top: bottom - list.clientHeight, behavior });
  }, [index]);

  // As a modal, move focus to its button so Esc/Enter/Tab work straight away.
  useEffect(() => {
    if (open && fixed) actionRef.current?.focus({ preventScroll: true });
  }, [open, fixed, status]);

  useEffect(() => {
    if (!open || !fixed) return undefined;
    const onKey = event => {
      if (event.key === 'Escape' && !finished && !failed) onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, fixed, finished, failed, onCancel]);

  if (!open) return null;

  const announcement = finished ? successMessage : failed ? `${errorMessage} ${steps[index]?.label ?? ''}` : `Step ${index + 1} of ${total}: ${steps[index]?.label ?? ''}`;

  const panel = (
    <div
      className={`bl-steps ${className}`}
      role={fixed ? 'dialog' : 'region'}
      aria-modal={fixed || undefined}
      aria-labelledby={`${uid}-title`}
      aria-busy={!finished && !failed}
      data-status={status}
      style={{
        '--bl-w': `${width}px`,
        '--bl-max-h': `${maxListHeight}px`,
        '--bl-p': progress,
        '--bl-bg': backgroundColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-track': trackColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-on-accent': onAccentColor,
        '--bl-error': errorColor,
        '--bl-radius': `${radius}px`,
        '--bl-font': fontFamily,
        ...style
      }}
    >
      <h2 id={`${uid}-title`} className="bl-steps__title">
        {finished ? successMessage : failed ? errorMessage : title}
      </h2>
      <div className="bl-steps__meta" aria-hidden="true">
        <span>{finished ? `${total} of ${total} steps` : `Step ${index + 1} of ${total}`}</span>
        <span>{Math.round(progress * 100)}%</span>
      </div>
      <div className="bl-steps__bar" role="progressbar" aria-label="Overall progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={doneCount}>
        <div className="bl-steps__fill" />
      </div>
      <ol ref={listRef} className="bl-steps__list">
        {steps.map((step, i) => {
          const state = stateOf(i);
          return (
            <li key={step.id ?? i} className="bl-steps__step" data-state={state} aria-current={state === 'active' ? 'step' : undefined}>
              <span className="bl-steps__icon" aria-hidden="true">
                {state === 'active' && <span className="bl-steps__spin" />}
                {state === 'done' && <Check />}
                {state === 'error' && <Cross />}
              </span>
              <span className="bl-steps__text">
                <span className="bl-steps__label">
                  {step.label}
                  <span className="bl-steps__sr">{state === 'done' ? ' (done)' : state === 'error' ? ' (failed)' : state === 'active' ? ' (in progress)' : ''}</span>
                </span>
                {step.description && <span className="bl-steps__desc">{step.description}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="bl-steps__actions">
        {finished && (
          <button ref={actionRef} type="button" className="bl-steps__btn" data-primary="" onClick={() => onDone?.()}>
            {doneLabel}
          </button>
        )}
        {failed && (
          <>
            {onCancel && (
              <button type="button" className="bl-steps__btn" onClick={() => onCancel()}>
                {cancelLabel}
              </button>
            )}
            <button ref={actionRef} type="button" className="bl-steps__btn" data-primary="" onClick={() => onRetry?.()}>
              {retryLabel}
            </button>
          </>
        )}
        {!finished && !failed && onCancel && (
          <button ref={actionRef} type="button" className="bl-steps__btn" onClick={() => onCancel()}>
            {cancelLabel}
          </button>
        )}
      </div>
      <p className="bl-steps__sr" role="status">
        {announcement}
      </p>
    </div>
  );

  return fixed ? (
    <div className="bl-steps-overlay" style={{ '--bl-backdrop': backdropColor }}>
      {panel}
    </div>
  ) : (
    panel
  );
}
