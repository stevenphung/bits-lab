import { useEffect, useId, useInsertionEffect, useRef } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A multi-step progress panel for long jobs (deploys, imports, onboarding setup). Steps
// tick off one by one: the current one spins, finished ones draw a check, a failed one
// shows a cross, and a rail fills between them. An overall bar and "Step 2 of 5" sit on top,
// with Cancel while it runs and a Done/Retry button at the end. You drive it with `current`
// and `status`; each change is announced. Set `fixed` to show it as a modal overlay.

const STYLE_ID = 'bl-step-loader-tw';
const CSS = `
/* theme tokens */
.bl-steps { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-track: #333c57; --bl-line: #333c57; --bl-accent: #38b764; --bl-on-accent: #0b0b14; --bl-error: #b13e53; }
:where(.light, [data-theme="light"]) .bl-steps, .bl-steps:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-track: #cfc4ad; --bl-line: #cfc4ad; --bl-accent: #2b8a4a; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-steps, :where(.light, [data-theme="light"]) .bl-steps:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-track: #333c57; --bl-line: #333c57; --bl-accent: #38b764; --bl-on-accent: #0b0b14; --bl-error: #b13e53; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-steps, .bl-steps:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-track: #cfc4ad; --bl-line: #cfc4ad; --bl-accent: #2b8a4a; } }
/* theme tokens end */
@keyframes bl-steps-spin { to { transform: rotate(360deg); } }
@keyframes bl-steps-draw { to { stroke-dashoffset: 0; } }
@keyframes bl-steps-pop-icon { 40% { transform: scale(1.25); } }
@keyframes bl-steps-fade { from { opacity: 0; } }
@keyframes bl-steps-pop { from { opacity: 0; transform: translateY(12px) scale(0.96); } }
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
      className={`bl-steps group/steps relative box-border w-full max-w-(--bl-w) rounded-(--bl-radius) bg-(--bl-bg) p-[22px] font-(family-name:--bl-font) text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line),0_30px_60px_-30px_rgba(0,0,0,0.85)] ${className}`}
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
      <h2 id={`${uid}-title`} className="m-0 mb-1 text-[17px] font-bold">
        {finished ? successMessage : failed ? errorMessage : title}
      </h2>
      <div className="flex justify-between gap-3 text-[13px] text-(--bl-muted)" aria-hidden="true">
        <span>{finished ? `${total} of ${total} steps` : `Step ${index + 1} of ${total}`}</span>
        <span>{Math.round(progress * 100)}%</span>
      </div>
      <div className="mt-2.5 mb-[18px] h-1.5 overflow-hidden rounded-full bg-(--bl-track)" role="progressbar" aria-label="Overall progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={doneCount}>
        <div className="h-full w-[calc(var(--bl-p)*100%)] rounded-[inherit] bg-(--bl-accent) [transition:width_500ms_cubic-bezier(.2,.9,.25,1),background-color_200ms] group-data-[status=error]/steps:bg-(--bl-error) motion-reduce:[transition:none]" />
      </div>
      <ol ref={listRef} className="relative m-0 grid max-h-(--bl-max-h) list-none gap-0 overflow-y-auto p-0">
        {steps.map((step, i) => {
          const state = stateOf(i);
          return (
            <li key={step.id ?? i} className="group/step relative grid grid-cols-[28px_1fr] gap-3 pb-4 text-(--bl-muted) transition-[color] duration-200 ease-[ease] last:pb-0 not-last:before:absolute not-last:before:top-[30px] not-last:before:bottom-0.5 not-last:before:left-[13px] not-last:before:w-0.5 not-last:before:bg-(--bl-track) not-last:after:absolute not-last:after:top-[30px] not-last:after:bottom-0.5 not-last:after:left-[13px] not-last:after:w-0.5 not-last:after:origin-top not-last:after:bg-(--bl-accent) not-last:after:[transform:scaleY(0)] not-last:after:[transition:transform_400ms_cubic-bezier(.2,.9,.25,1)] data-[state=done]:not-last:after:[transform:scaleY(1)] data-[state=active]:text-(--bl-ink) data-[state=done]:text-(--bl-ink) data-[state=error]:text-(--bl-error) motion-reduce:after:[transition:none]" data-state={state} aria-current={state === 'active' ? 'step' : undefined}>
              <span className="relative grid size-7 place-items-center rounded-[50%] bg-(--bl-track) text-(--bl-on-accent) group-data-[state=done]/step:animate-[bl-steps-pop-icon_360ms_cubic-bezier(.3,1.6,.5,1)] group-data-[state=done]/step:bg-(--bl-accent) group-data-[state=error]/step:bg-(--bl-error) [&_path]:animate-[bl-steps-draw_320ms_80ms_cubic-bezier(.2,.9,.25,1)_forwards] [&_path]:[stroke-dasharray:20] [&_path]:[stroke-dashoffset:20] motion-reduce:group-data-[state=done]/step:animate-none motion-reduce:[&_path]:animate-none motion-reduce:[&_path]:[stroke-dashoffset:0]" aria-hidden="true">
                {state === 'active' && <span className="absolute inset-0 animate-[bl-steps-spin_800ms_linear_infinite] rounded-[50%] border-3 border-solid border-(--bl-track) border-t-(--bl-accent) motion-reduce:[animation-duration:2.4s]" />}
                {state === 'done' && <Check />}
                {state === 'error' && <Cross />}
              </span>
              <span className="grid min-w-0 gap-0.5 pt-1">
                <span className="text-[15px] font-semibold">
                  {step.label}
                  <span className="sr-only">{state === 'done' ? ' (done)' : state === 'error' ? ' (failed)' : state === 'active' ? ' (in progress)' : ''}</span>
                </span>
                {step.description && <span className="text-[13px] leading-[1.4] text-(--bl-muted)">{step.description}</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <div className="mt-5 flex justify-end gap-2.5">
        {finished && (
          <button ref={actionRef} type="button" className="cursor-pointer rounded-[8px] border-0 bg-(--bl-track) px-4 py-[9px] text-[14px] font-semibold text-(--bl-ink) hover:[filter:brightness(1.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) data-[primary]:bg-(--bl-accent) data-[primary]:text-(--bl-on-accent)" data-primary="" onClick={() => onDone?.()}>
            {doneLabel}
          </button>
        )}
        {failed && (
          <>
            {onCancel && (
              <button type="button" className="cursor-pointer rounded-[8px] border-0 bg-(--bl-track) px-4 py-[9px] text-[14px] font-semibold text-(--bl-ink) hover:[filter:brightness(1.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) data-[primary]:bg-(--bl-accent) data-[primary]:text-(--bl-on-accent)" onClick={() => onCancel()}>
                {cancelLabel}
              </button>
            )}
            <button ref={actionRef} type="button" className="cursor-pointer rounded-[8px] border-0 bg-(--bl-track) px-4 py-[9px] text-[14px] font-semibold text-(--bl-ink) hover:[filter:brightness(1.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) data-[primary]:bg-(--bl-accent) data-[primary]:text-(--bl-on-accent)" data-primary="" onClick={() => onRetry?.()}>
              {retryLabel}
            </button>
          </>
        )}
        {!finished && !failed && onCancel && (
          <button ref={actionRef} type="button" className="cursor-pointer rounded-[8px] border-0 bg-(--bl-track) px-4 py-[9px] text-[14px] font-semibold text-(--bl-ink) hover:[filter:brightness(1.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) data-[primary]:bg-(--bl-accent) data-[primary]:text-(--bl-on-accent)" onClick={() => onCancel()}>
            {cancelLabel}
          </button>
        )}
      </div>
      <p className="sr-only" role="status">
        {announcement}
      </p>
    </div>
  );

  return fixed ? (
    <div className="fixed inset-0 z-1900 grid animate-[bl-steps-fade_200ms_both] place-items-center bg-(--bl-backdrop) p-4 *:animate-[bl-steps-pop_360ms_cubic-bezier(.3,1.35,.5,1)_both] motion-reduce:animate-none motion-reduce:*:animate-none" style={{ '--bl-backdrop': backdropColor }}>
      {panel}
    </div>
  ) : (
    panel
  );
}
