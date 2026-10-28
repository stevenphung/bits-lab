import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type FormEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A multi-step form shell. A progress rail fills as you go; each step slides in from the
// direction you're moving. Next is a gate: the step's native field rules run first (required,
// type, pattern...), then your own `validate` (sync or async), and a failing step shakes,
// says why and focuses the problem. Earlier steps stay clickable. Every step stays mounted,
// so the final FormData holds all of them, and focus moves to each new step's heading.

type Verdict = true | string | void;

export interface FormStep {
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  content?: ReactNode | ((api: { index: number; go: (index: number) => void }) => ReactNode);
  /** Runs after the native field rules; a string is shown as the error. */
  validate?: (data: FormData) => Verdict | Promise<Verdict>;
}

export interface StepperFormProps {
  steps?: FormStep[];
  defaultStep?: number;
  onStepChange?: (index: number) => void;
  /** All steps' fields together. */
  onComplete?: (data: FormData) => void;
  doneContent?: ReactNode;
  backLabel?: string;
  nextLabel?: string;
  finishLabel?: string;
  checkingLabel?: string;
  label?: string;
  width?: number;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  trackColor?: string;
  lineColor?: string;
  accentColor?: string;
  onAccentColor?: string;
  errorColor?: string;
  radius?: number;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const STYLE_ID = 'bl-stepper-form';
const CSS = `
.bl-stepper { width: 100%; max-width: var(--bl-w); box-sizing: border-box; padding: 20px; border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); box-shadow: 0 0 0 1px var(--bl-line), 0 24px 50px -28px rgba(0,0,0,0.85); }
.bl-stepper__rail { position: relative; display: flex; justify-content: space-between; margin: 0 0 22px; padding: 0; list-style: none; }
.bl-stepper__rail::before, .bl-stepper__rail::after { content: ""; position: absolute; left: 14px; right: 14px; top: 13px; height: 3px; border-radius: 3px; background: var(--bl-track); }
.bl-stepper__rail::after { right: auto; width: calc((100% - 28px) * var(--bl-p)); background: var(--bl-accent); transition: width 420ms cubic-bezier(.3,1.1,.5,1); }
.bl-stepper__step { position: relative; z-index: 1; display: grid; justify-items: center; gap: 6px; min-width: 0; flex: 0 1 auto; }
.bl-stepper__dot { display: grid; place-items: center; width: 28px; height: 28px; padding: 0; border: 0; border-radius: 50%; background: var(--bl-bg); color: var(--bl-muted); font: inherit; font-size: 12px; font-weight: 700; box-shadow: inset 0 0 0 2px var(--bl-track); cursor: default; transition: background-color 200ms, color 200ms, box-shadow 200ms; }
.bl-stepper__step[data-state="done"] .bl-stepper__dot { background: var(--bl-accent); color: var(--bl-on-accent); box-shadow: none; cursor: pointer; }
.bl-stepper__step[data-state="current"] .bl-stepper__dot { color: var(--bl-ink); box-shadow: inset 0 0 0 2px var(--bl-accent), 0 0 0 5px color-mix(in srgb, var(--bl-accent) 22%, transparent); }
.bl-stepper__dot:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 3px; }
.bl-stepper__name { max-width: 90px; overflow: hidden; color: var(--bl-muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.bl-stepper__step[data-state="current"] .bl-stepper__name { color: var(--bl-ink); font-weight: 600; }
.bl-stepper__panel { animation: bl-stepper-in 380ms cubic-bezier(.2,.9,.25,1) both; }
.bl-stepper__panel[data-shake] { animation: bl-stepper-shake 380ms ease; }
.bl-stepper__title { margin: 0 0 4px; font-size: 18px; font-weight: 700; outline: none; }
.bl-stepper__desc { margin: 0 0 16px; color: var(--bl-muted); font-size: 14px; line-height: 1.5; }
.bl-stepper__error { display: flex; gap: 8px; align-items: center; margin: 14px 0 0; padding: 9px 12px; border-radius: 10px; background: color-mix(in srgb, var(--bl-error) 16%, transparent); color: var(--bl-error); font-size: 13px; font-weight: 600; }
.bl-stepper__foot { display: flex; justify-content: space-between; gap: 10px; margin-top: 20px; }
.bl-stepper__btn { padding: 10px 18px; border: 0; border-radius: 10px; background: var(--bl-track); color: var(--bl-ink); font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
.bl-stepper__btn[data-primary] { margin-left: auto; background: var(--bl-accent); color: var(--bl-on-accent); }
.bl-stepper__btn:disabled { opacity: 0.6; cursor: progress; }
.bl-stepper__btn:focus-visible { outline: 2px solid var(--bl-ink); outline-offset: 2px; }
.bl-stepper__done { display: grid; justify-items: center; gap: 10px; padding: 20px 0 6px; text-align: center; animation: bl-stepper-in 380ms cubic-bezier(.2,.9,.25,1) both; }
@keyframes bl-stepper-in { from { opacity: 0; transform: translateX(calc(var(--bl-dir, 1) * 26px)); } }
@keyframes bl-stepper-shake { 20%, 60% { transform: translateX(-6px); } 40%, 80% { transform: translateX(6px); } }
@media (prefers-reduced-motion: reduce) { .bl-stepper__panel, .bl-stepper__panel[data-shake], .bl-stepper__done { animation: none; } .bl-stepper__rail::after, .bl-stepper__dot { transition: none; } }
@media (max-width: 520px) { .bl-stepper__name { display: none; } }
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
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  trackColor = '#333c57',
  lineColor = '#333c57',
  accentColor = '#73eff7',
  onAccentColor = '#0b0b14',
  errorColor = '#ef7d57',
  radius = 16,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: StepperFormProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [index, setIndex] = useState(defaultStep);
  const [reached, setReached] = useState(defaultStep);
  const [dir, setDir] = useState(1);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const moved = useRef(false);
  const last = index === steps.length - 1;

  const go = (next: number) => {
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
    formRef.current?.querySelector<HTMLElement>(`#${uid}-title-${index}`)?.focus({ preventScroll: true });
  }, [index, uid]);

  const fail = (message: string, field?: HTMLElement) => {
    setError(message);
    setShake(true);
    field?.focus();
  };

  // Native rules first, then the step's own validate().
  const check = async () => {
    const panel = formRef.current!.querySelector(`[data-step="${index}"]`);
    for (const field of panel!.querySelectorAll<Field>(FIELDS)) {
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
      const verdict = await validate(new FormData(formRef.current!));
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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !(await check())) return;
    if (!last) go(index + 1);
    else {
      onComplete?.(new FormData(formRef.current!));
      setDone(true);
    }
  };

  return (
    <form
      ref={formRef}
      className={`bl-stepper ${className}`}
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
      } as CSSVars}
    >
      <ol className="bl-stepper__rail" aria-label="Progress">
        {steps.map((step, i) => {
          const state = done || i < index ? 'done' : i === index ? 'current' : 'todo';
          const canJump = !done && i !== index && i <= reached;
          return (
            <li key={step.id ?? i} className="bl-stepper__step" data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
              <button
                type="button"
                className="bl-stepper__dot"
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
              <span className="bl-stepper__name" aria-hidden="true">
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
          className="bl-stepper__panel"
          hidden={done || i !== index}
          data-shake={(shake && i === index) || undefined}
          onAnimationEnd={() => setShake(false)}
          aria-labelledby={`${uid}-title-${i}`}
        >
          <h3 id={`${uid}-title-${i}`} className="bl-stepper__title" tabIndex={-1}>
            {step.title}
          </h3>
          {step.description && <p className="bl-stepper__desc">{step.description}</p>}
          {typeof step.content === 'function' ? step.content({ index: i, go }) : step.content}
        </section>
      ))}
      {done ? (
        <div className="bl-stepper__done" role="status">
          {doneContent ?? <strong>All done!</strong>}
        </div>
      ) : (
        <>
          {error && (
            <p className="bl-stepper__error" role="alert">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                <path d="M7 1 13.5 12.5h-13zM6.3 5v3.6h1.4V5zm0 4.8v1.4h1.4V9.8z" />
              </svg>
              {error}
            </p>
          )}
          <div className="bl-stepper__foot">
            {index > 0 && (
              <button type="button" className="bl-stepper__btn" onClick={() => go(index - 1)}>
                {backLabel}
              </button>
            )}
            <button type="submit" className="bl-stepper__btn" data-primary="" disabled={busy}>
              {busy ? checkingLabel : last ? finishLabel : nextLabel}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
