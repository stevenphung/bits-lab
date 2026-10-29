import { useEffect, useId, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// "Thinking…" for AI products. While working, the label shimmers and an elapsed timer ticks;
// when done it settles to "Thought for 12s". The header is a disclosure button that reveals
// the steps (pending, active with a spinner, done with a check). Completion is announced.
// variant="pill" is a compact one-line chip whose label rolls through phases while it works.

const STYLE_ID = 'bl-thinking-tw';
const CSS = `
/* theme tokens */
.bl-think { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-shine: #f4f4f4; --bl-line: rgba(255,255,255,0.12); --bl-hover: rgba(255,255,255,0.06); --bl-accent: #73eff7; --bl-success: #38b764; }
:where(.light, [data-theme="light"]) .bl-think, .bl-think:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-shine: #8a96a3; --bl-line: rgba(26,28,44,0.12); --bl-hover: rgba(26,28,44,0.06); --bl-accent: #167f8f; --bl-success: #2b8a4a; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-think, :where(.light, [data-theme="light"]) .bl-think:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-shine: #f4f4f4; --bl-line: rgba(255,255,255,0.12); --bl-hover: rgba(255,255,255,0.06); --bl-accent: #73eff7; --bl-success: #38b764; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-think, .bl-think:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-shine: #8a96a3; --bl-line: rgba(26,28,44,0.12); --bl-hover: rgba(26,28,44,0.06); --bl-accent: #167f8f; --bl-success: #2b8a4a; } }
/* theme tokens end */
@keyframes bl-think-shine { from { background-position: 100% 0; } to { background-position: -150% 0; } }
@keyframes bl-think-spin { to { transform: rotate(360deg); } }
@keyframes bl-think-roll { from { opacity: 0; transform: translateY(70%); } }
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
  variant = 'panel',
  phases,
  phaseInterval = 1600,
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

  // Pill mode: which phase is showing, stepping on while thinking.
  const [phase, setPhase] = useState(0);
  const rollList = phases?.length ? phases : steps.filter(step => step.status === 'active').map(step => step.label);
  const rolling = variant === 'pill' && thinking && rollList.length > 1;
  useEffect(() => {
    if (!rolling) return undefined;
    const timer = setInterval(() => setPhase(p => p + 1), phaseInterval);
    return () => clearInterval(timer);
  }, [rolling, phaseInterval]);

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
      <span className="size-[13px] animate-[bl-think-spin_800ms_linear_infinite] rounded-[50%] border-2 border-solid border-current border-r-transparent motion-reduce:[animation-duration:2.4s]" />
    ) : (
      <span className="size-1.5 rounded-[50%] bg-current" />
    );

  const rootStyle = {
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
  };

  // Compact pill: one line, no disclosure. While thinking the label rolls through the phases
  // (or the active steps' labels); when done it settles on the done label with a check.
  if (variant === 'pill') {
    const text = thinking ? `${rollList[phase % Math.max(1, rollList.length)] ?? label}…` : doneLabel(final ?? elapsed);
    return (
      <div className={`bl-think group/think inline-block max-w-full font-(family-name:--bl-font) text-[14px] text-(--bl-ink) ${className}`} data-variant="pill" style={rootStyle}>
        <span className="group/pill inline-flex max-w-full items-center gap-2 rounded-full bg-(--bl-hover) py-[5px] pr-3 pl-2 text-(--bl-muted) shadow-[inset_0_0_0_1px_var(--bl-line)]" data-done={!thinking || undefined}>
          <span className="grid size-3.5 flex-none place-items-center text-(--bl-accent) group-data-[done]/pill:text-(--bl-success)" aria-hidden="true">
            {thinking ? <span className="size-[13px] animate-[bl-think-spin_800ms_linear_infinite] rounded-[50%] border-2 border-solid border-current border-r-transparent motion-reduce:[animation-duration:2.4s]" /> : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 7.5 5.5 10.5 11.5 3.5" />
            </svg>
            )}
          </span>
          <span className="relative inline-grid min-w-0 overflow-hidden">
            <span key={thinking ? phase : 'done'} className="animate-[bl-think-roll_320ms_cubic-bezier(.2,.9,.25,1)_both] overflow-hidden text-ellipsis whitespace-nowrap motion-reduce:animate-none">
              <span className={thinking ? 'animate-[bl-think-shine_var(--bl-speed)_linear_infinite] bg-[linear-gradient(90deg,var(--bl-muted)_0%,var(--bl-muted)_35%,var(--bl-shine)_50%,var(--bl-muted)_65%,var(--bl-muted)_100%)] bg-[length:250%_100%] bg-clip-text text-transparent motion-reduce:animate-none motion-reduce:bg-none motion-reduce:text-(--bl-muted)' : undefined}>{text}</span>
            </span>
          </span>
          {thinking && showTimer && <span className="tabular-nums opacity-80">{formatSeconds(elapsed)}</span>}
        </span>
        <span className="sr-only" role="status">
          {thinking ? '' : doneLabel(final ?? elapsed)}
        </span>
      </div>
    );
  }

  const headText = thinking ? `${label}…` : doneLabel(final ?? elapsed);

  return (
    <div
      className={`bl-think w-full max-w-(--bl-w) font-(family-name:--bl-font) text-[14px] text-(--bl-ink) ${className}`}
      style={rootStyle}
    >
      <button type="button" className="group/head -ml-2 inline-flex cursor-pointer items-center gap-2 rounded-[8px] border-0 bg-transparent py-1.5 pr-2.5 pl-2 text-(--bl-muted) hover:bg-(--bl-hover) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--bl-accent)" aria-expanded={open} aria-controls={`${uid}-steps`} onClick={toggle} disabled={!steps.length}>
        <svg className="[transition:transform_220ms_cubic-bezier(.2,.9,.25,1)] group-aria-expanded/head:[transform:rotate(90deg)] motion-reduce:[transition:none]" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" style={{ opacity: steps.length ? 1 : 0 }}>
          <path d="M4.5 2.5 8 6l-3.5 3.5" />
        </svg>
        <span className={thinking ? 'animate-[bl-think-shine_var(--bl-speed)_linear_infinite] bg-[linear-gradient(90deg,var(--bl-muted)_0%,var(--bl-muted)_35%,var(--bl-shine)_50%,var(--bl-muted)_65%,var(--bl-muted)_100%)] bg-[length:250%_100%] bg-clip-text text-transparent motion-reduce:animate-none motion-reduce:bg-none motion-reduce:text-(--bl-muted)' : undefined}>{headText}</span>
        {thinking && showTimer && <span className="tabular-nums opacity-80">{formatSeconds(elapsed)}</span>}
      </button>
      <div id={`${uid}-steps`} className="grid grid-rows-[0fr] [transition:grid-template-rows_320ms_cubic-bezier(.2,.9,.25,1)] data-[open]:grid-rows-[1fr] *:overflow-hidden motion-reduce:[transition:none]" data-open={open || undefined} inert={!open || undefined}>
        <div>
          <ol className="mt-1.5 mr-0 mb-1 ml-1 list-none border-l-2 border-solid border-(--bl-line) py-0 pr-0 pl-4">
            {steps.map((step, i) => (
              <li key={step.id ?? i} className="group/step relative grid grid-cols-[18px_1fr] gap-2.5 py-1.5 data-[status=pending]:opacity-55" data-status={step.status ?? 'pending'}>
                <span className="mt-px grid size-[18px] place-items-center text-(--bl-muted) group-data-[status=active]/step:text-(--bl-accent) group-data-[status=done]/step:text-(--bl-success)" aria-hidden="true">
                  {icon(step.status ?? 'pending')}
                </span>
                <span>
                  <span className={`leading-[1.45] ${step.status === 'active' ? 'animate-[bl-think-shine_var(--bl-speed)_linear_infinite] bg-[linear-gradient(90deg,var(--bl-muted)_0%,var(--bl-muted)_35%,var(--bl-shine)_50%,var(--bl-muted)_65%,var(--bl-muted)_100%)] bg-[length:250%_100%] bg-clip-text text-transparent motion-reduce:animate-none motion-reduce:bg-none motion-reduce:text-(--bl-muted)' : ''}`}>{step.label}</span>
                  <span className="sr-only">{step.status === 'done' ? ' (done)' : step.status === 'active' ? ' (in progress)' : ' (waiting)'}</span>
                  {step.detail && <span className="mt-0.5 block text-[13px] leading-[1.5] text-(--bl-muted)">{step.detail}</span>}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
      <span className="sr-only" role="status">
        {thinking ? '' : doneLabel(final ?? elapsed)}
      </span>
    </div>
  );
}
