import { useEffect, useId, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A multi-step form shell. A progress rail fills as you go; each step slides in from the
// direction you're moving. Next is a gate: the step's native field rules run first (required,
// type, pattern...), then your own `validate` (sync or async), and a failing step shakes,
// says why and focuses the problem. Earlier steps stay clickable. Every step stays mounted,
// so the final FormData holds all of them, and focus moves to each new step's heading.

const STYLE_ID = 'bl-stepper-form-tw';
const CSS = `
/* theme tokens */
.bl-stepper { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-track: #333c57; --bl-line: #333c57; --bl-accent: #73eff7; --bl-on-accent: #0b0b14; --bl-error: #ef7d57; }
:where(.light, [data-theme="light"]) .bl-stepper, .bl-stepper:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-track: #cfc4ad; --bl-line: #cfc4ad; --bl-accent: #167f8f; --bl-error: #c4502a; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-stepper, :where(.light, [data-theme="light"]) .bl-stepper:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-track: #333c57; --bl-line: #333c57; --bl-accent: #73eff7; --bl-on-accent: #0b0b14; --bl-error: #ef7d57; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-stepper, .bl-stepper:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-track: #cfc4ad; --bl-line: #cfc4ad; --bl-accent: #167f8f; --bl-error: #c4502a; } }
/* theme tokens end */
@keyframes bl-stepper-in { from { opacity: 0; transform: translateX(calc(var(--bl-dir, 1) * 26px)); } }
@keyframes bl-stepper-shake { 20%, 60% { transform: translateX(-6px); } 40%, 80% { transform: translateX(6px); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const FIELDS = 'input, select, textarea';

export default function StepperForm({
  steps = [],
  defaultStep = 0,
  onStepChange,
  onComplete,
  doneContent,
  backLabel = 'Back',
  nextLabel = 'Continue',
  finishLabel = 'Finish',
  checkingLabel = 'Checking…',
  label = 'Form',
  width = 520,
  backgroundColor,
  textColor,
  mutedColor,
  trackColor,
  lineColor,
  accentColor,
  onAccentColor,
  errorColor,
  radius = 16,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [index, setIndex] = useState(defaultStep);
  const [reached, setReached] = useState(defaultStep);
  const [dir, setDir] = useState(1);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const formRef = useRef(null);
  const moved = useRef(false);
  const last = index === steps.length - 1;

  const go = next => {
    setDir(next > index ? 1 : -1);
    setIndex(next);
    setReached(r => Math.max(r, next));
    setError('');
    moved.current = true;
    onStepChange?.(next);
  };

  // Focus the new step's heading so screen readers announce where they are.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    formRef.current?.querySelector(`#${uid}-title-${index}`)?.focus({ preventScroll: true });
  }, [index, uid]);

  const fail = (message, field) => {
    setError(message);
    setShake(true);
    field?.focus();
  };

  // Native rules first, then the step's own validate().
  const check = async () => {
    const panel = formRef.current.querySelector(`[data-step="${index}"]`);
    for (const field of panel.querySelectorAll(FIELDS)) {
      if (!field.checkValidity()) {
        const name = field.labels?.[0]?.textContent?.trim();
        fail(name ? `${name}: ${field.validationMessage}` : field.validationMessage, field);
        return false;
      }
    }
    const validate = steps[index].validate;
    if (!validate) return true;
    setBusy(true);
    try {
      const verdict = await validate(new FormData(formRef.current));
      if (verdict === true || verdict === undefined) return true;
      fail(typeof verdict === 'string' ? verdict : 'Please check this step.');
      return false;
    } catch (err) {
      fail(err instanceof Error ? err.message : 'Something went wrong.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async event => {
    event.preventDefault();
    if (busy || !(await check())) return;
    if (!last) go(index + 1);
    else {
      onComplete?.(new FormData(formRef.current));
      setDone(true);
    }
  };

  return (
    <form
      ref={formRef}
      className={`bl-stepper box-border w-full max-w-(--bl-w) rounded-(--bl-radius) bg-(--bl-bg) p-5 font-(family-name:--bl-font) text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line),0_24px_50px_-28px_rgba(0,0,0,0.85)] ${className}`}
      aria-label={label}
      noValidate
      onSubmit={onSubmit}
      style={{
        '--bl-w': `${width}px`,
        '--bl-p': done ? 1 : steps.length > 1 ? index / (steps.length - 1) : 1,
        '--bl-dir': dir,
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
      <ol className="relative m-0 mb-[22px] flex list-none justify-between p-0 before:absolute before:top-[13px] before:right-3.5 before:left-3.5 before:h-[3px] before:rounded-[3px] before:bg-(--bl-track) after:absolute after:top-[13px] after:right-auto after:left-3.5 after:h-[3px] after:w-[calc((100%_-_28px)*var(--bl-p))] after:rounded-[3px] after:bg-(--bl-accent) after:[transition:width_420ms_cubic-bezier(.3,1.1,.5,1)] motion-reduce:after:[transition:none]" aria-label="Progress">
        {steps.map((step, i) => {
          const state = done || i < index ? 'done' : i === index ? 'current' : 'todo';
          const canJump = !done && i !== index && i <= reached;
          return (
            <li key={step.id ?? i} className="group/step relative z-1 grid min-w-0 flex-[0_1_auto] justify-items-center gap-1.5" data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
              <button
                type="button"
                className="grid size-7 cursor-default place-items-center rounded-[50%] border-0 bg-(--bl-bg) p-0 text-[12px] font-bold text-(--bl-muted) shadow-[inset_0_0_0_2px_var(--bl-track)] [transition:background-color_200ms,color_200ms,box-shadow_200ms] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--bl-accent) group-data-[state=done]/step:cursor-pointer group-data-[state=done]/step:bg-(--bl-accent) group-data-[state=done]/step:text-(--bl-on-accent) group-data-[state=done]/step:shadow-none group-data-[state=current]/step:text-(--bl-ink) group-data-[state=current]/step:shadow-[inset_0_0_0_2px_var(--bl-accent),0_0_0_5px_color-mix(in_srgb,var(--bl-accent)_22%,transparent)] motion-reduce:[transition:none]"
                disabled={!canJump}
                aria-label={`Step ${i + 1}: ${step.title}${state === 'done' ? ' (done)' : state === 'current' ? ' (current)' : ''}`}
                onClick={() => canJump && go(i)}
              >
                {state === 'done' ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2.5 6.5 5 9l4.5-5.5" />
                  </svg>
                ) : (
                  i + 1
                )}
              </button>
              <span className="max-w-[90px] overflow-hidden text-[12px] text-ellipsis whitespace-nowrap text-(--bl-muted) group-data-[state=current]/step:font-semibold group-data-[state=current]/step:text-(--bl-ink) [@media(max-width:520px)]:hidden" aria-hidden="true">
                {step.title}
              </span>
            </li>
          );
        })}
      </ol>
      {steps.map((step, i) => (
        <section
          key={step.id ?? i}
          data-step={i}
          className="animate-[bl-stepper-in_380ms_cubic-bezier(.2,.9,.25,1)_both] data-[shake]:animate-[bl-stepper-shake_380ms_ease] motion-reduce:animate-none motion-reduce:data-[shake]:animate-none"
          hidden={done || i !== index}
          data-shake={(shake && i === index) || undefined}
          onAnimationEnd={() => setShake(false)}
          aria-labelledby={`${uid}-title-${i}`}
        >
          <h3 id={`${uid}-title-${i}`} className="m-0 mb-1 text-[18px] font-bold outline-none" tabIndex={-1}>
            {step.title}
          </h3>
          {step.description && <p className="m-0 mb-4 text-[14px] leading-[1.5] text-(--bl-muted)">{step.description}</p>}
          {typeof step.content === 'function' ? step.content({ index: i, go }) : step.content}
        </section>
      ))}
      {done ? (
        <div className="grid animate-[bl-stepper-in_380ms_cubic-bezier(.2,.9,.25,1)_both] justify-items-center gap-2.5 pt-5 pb-1.5 text-center motion-reduce:animate-none" role="status">
          {doneContent ?? <strong>All done!</strong>}
        </div>
      ) : (
        <>
          {error && (
            <p className="mx-0 mt-3.5 mb-0 flex items-center gap-2 rounded-[10px] bg-[color-mix(in_srgb,var(--bl-error)_16%,transparent)] px-3 py-[9px] text-[13px] font-semibold text-(--bl-error)" role="alert">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                <path d="M7 1 13.5 12.5h-13zM6.3 5v3.6h1.4V5zm0 4.8v1.4h1.4V9.8z" />
              </svg>
              {error}
            </p>
          )}
          <div className="mt-5 flex justify-between gap-2.5">
            {index > 0 && (
              <button type="button" className="cursor-pointer rounded-[10px] border-0 bg-(--bl-track) px-[18px] py-2.5 text-[14px] font-bold text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-ink) disabled:cursor-progress disabled:opacity-60 data-[primary]:ml-auto data-[primary]:bg-(--bl-accent) data-[primary]:text-(--bl-on-accent)" onClick={() => go(index - 1)}>
                {backLabel}
              </button>
            )}
            <button type="submit" className="cursor-pointer rounded-[10px] border-0 bg-(--bl-track) px-[18px] py-2.5 text-[14px] font-bold text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-ink) disabled:cursor-progress disabled:opacity-60 data-[primary]:ml-auto data-[primary]:bg-(--bl-accent) data-[primary]:text-(--bl-on-accent)" data-primary="" disabled={busy}>
              {busy ? checkingLabel : last ? finishLabel : nextLabel}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
