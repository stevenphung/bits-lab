import { useEffect, useId, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A suggestion from an advisor (a person, an agent, a rule) that a person decides on. It shows
// how sure the advisor is as pixel signal bars, lets you switch to one of the alternatives, and
// accepts with a grace period: an Undo button and a draining fuse, after which the choice is
// final (onCommit). Options are a radio group; the result and the undo window are announced.

const STYLE_ID = 'bl-advisor-card-tw';
const CSS = `
/* theme tokens */
.bl-advisor { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-track: #0b0b14; --bl-accent: #73eff7; --bl-ok: #a7f070; }
:where(.light, [data-theme="light"]) .bl-advisor, .bl-advisor:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-track: #e2dacb; --bl-accent: #167f8f; --bl-ok: #2f7d22; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-advisor, :where(.light, [data-theme="light"]) .bl-advisor:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-track: #0b0b14; --bl-accent: #73eff7; --bl-ok: #a7f070; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-advisor, .bl-advisor:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-track: #e2dacb; --bl-accent: #167f8f; --bl-ok: #2f7d22; } }
/* theme tokens end */
@keyframes bl-advisor-fuse { from { transform: scaleX(1); } to { transform: scaleX(0); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const sureness = confidence => (confidence >= 0.75 ? 'Very sure' : confidence >= 0.5 ? 'Fairly sure' : 'Unsure');

export default function AdvisorCard({
  suggestion,
  alternatives = [],
  advisor = 'Suggestion',
  icon,
  onAccept,
  onUndo,
  onCommit,
  onDismiss,
  undoWindow = 5000,
  acceptLabel = 'Accept',
  dismissLabel = 'Not now',
  width = 400,
  backgroundColor,
  chipColor,
  lineColor,
  textColor,
  mutedColor,
  trackColor,
  accentColor,
  okColor,
  highColor = '#a7f070',
  midColor = '#ffcd75',
  lowColor = '#ef7d57',
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const uid = useId();
  const options = suggestion ? [suggestion, ...alternatives] : alternatives;
  const [chosen, setChosen] = useState(options[0]?.id);
  const [state, setState] = useState('open');
  const [said, setSaid] = useState('');
  const timer = useRef(0);
  const pick = options.find(o => o.id === chosen) ?? options[0];

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!pick) return null;
  const confidence = Math.max(0, Math.min(1, pick.confidence ?? 0));
  const tone = confidence >= 0.75 ? highColor : confidence >= 0.5 ? midColor : lowColor;
  const bars = Math.max(1, Math.round(confidence * 5));

  const accept = () => {
    setState('accepted');
    setSaid(`Accepted: ${pick.title}. You can undo for ${Math.round(undoWindow / 1000)} seconds.`);
    onAccept?.(pick);
    timer.current = setTimeout(() => {
      setState('committed');
      setSaid(`${pick.title} is final.`);
      onCommit?.(pick);
    }, undoWindow);
  };
  const undo = () => {
    clearTimeout(timer.current);
    setState('open');
    setSaid('Undone. Pick again whenever you like.');
    onUndo?.(pick);
  };

  return (
    <section
      className={`bl-advisor grid gap-3 p-4 w-[min(var(--bl-w),100%)] box-border bg-(--bl-bg) text-(--bl-ink) font-(family-name:--bl-font) text-[14px] shadow-[inset_0_0_0_3px_var(--bl-line),6px_6px_0_rgba(0,0,0,0.45)] ${className}`}
      aria-label={`${advisor}: ${pick.title}`}
      style={{ '--bl-w': `${width}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-track': trackColor, '--bl-accent': accentColor, '--bl-ok': okColor, '--bl-undo': `${undoWindow}ms`, '--bl-font': fontFamily, '--tone': tone, ...style }}
    >
      <div className="flex items-center justify-between gap-2.5">
        <p className="m-0 inline-flex items-center gap-2 text-[12px] font-extrabold tracking-[0.04em] text-(--bl-muted) uppercase">
          {icon}
          {advisor}
        </p>
        <span className="text-[12px] font-extrabold text-(--tone)">
          <span className="inline-flex h-4 items-end gap-0.5" aria-hidden="true">
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} className="w-1 bg-(--bl-track) data-[on]:bg-(--tone)" data-on={n <= bars || undefined} style={{ height: `${n * 3 + 1}px` }} />
            ))}
          </span>{' '}
          {sureness(confidence)} · {Math.round(confidence * 100)}%
        </span>
      </div>
      <p className="m-0 text-[17px] font-extrabold">{pick.title}</p>
      {pick.body && <p className="m-0 leading-[1.5] text-(--bl-muted)">{pick.body}</p>}

      {state === 'open' && options.length > 1 && (
        <fieldset className="m-0 grid gap-1 border-0 p-0 [&_legend]:mb-1 [&_legend]:p-0 [&_legend]:text-[12px] [&_legend]:font-extrabold [&_legend]:text-(--bl-muted) [&_legend]:uppercase">
          <legend>Options</legend>
          {options.map(option => (
            <label key={option.id} className="flex cursor-pointer items-center gap-2.5 bg-(--bl-chip) px-2.5 py-2 focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-(--bl-accent) focus-within:outline-solid has-checked:shadow-[inset_3px_0_0_var(--bl-accent)] [&_input]:m-0 [&_input]:[accent-color:var(--bl-accent)] [&_span:last-child]:ml-auto [&_span:last-child]:text-[12px] [&_span:last-child]:text-(--bl-muted) [&_span:last-child]:tabular-nums">
              <input type="radio" name={uid} value={option.id} checked={option.id === pick.id} onChange={() => setChosen(option.id)} />
              <span>{option.title}</span>
              {option.confidence !== undefined && <span>{Math.round(option.confidence * 100)}%</span>}
            </label>
          ))}
        </fieldset>
      )}

      {state === 'open' && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" className="cursor-pointer border-0 bg-(--bl-accent) px-3.5 py-2 font-extrabold text-[#0b0b14] shadow-[inset_-3px_-3px_0_rgba(0,0,0,0.25)] data-[kind=ghost]:bg-transparent data-[kind=ghost]:text-(--bl-ink) data-[kind=ghost]:shadow-[inset_0_0_0_2px_var(--bl-line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" data-kind="ghost" onClick={() => onDismiss?.(pick)}>
            {dismissLabel}
          </button>
          <button type="button" className="cursor-pointer border-0 bg-(--bl-accent) px-3.5 py-2 font-extrabold text-[#0b0b14] shadow-[inset_-3px_-3px_0_rgba(0,0,0,0.25)] data-[kind=ghost]:bg-transparent data-[kind=ghost]:text-(--bl-ink) data-[kind=ghost]:shadow-[inset_0_0_0_2px_var(--bl-line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" onClick={accept}>
            {acceptLabel}
          </button>
        </div>
      )}
      {state === 'accepted' && (
        <div className="grid gap-2 bg-(--bl-chip) px-3 py-2.5 [&_p]:m-0 [&_p]:font-bold">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>Accepted: {pick.title}</p>
            <button type="button" className="cursor-pointer border-0 bg-(--bl-accent) px-3.5 py-2 font-extrabold text-[#0b0b14] shadow-[inset_-3px_-3px_0_rgba(0,0,0,0.25)] data-[kind=ghost]:bg-transparent data-[kind=ghost]:text-(--bl-ink) data-[kind=ghost]:shadow-[inset_0_0_0_2px_var(--bl-line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" data-kind="ghost" onClick={undo}>
              Undo
            </button>
          </div>
          <div className="h-1 bg-(--bl-track) motion-reduce:[&_span]:animate-none [&_span]:block [&_span]:h-full [&_span]:origin-left [&_span]:animate-[bl-advisor-fuse_var(--bl-undo)_linear_forwards] [&_span]:bg-(--bl-ok)" aria-hidden="true">
            <span />
          </div>
        </div>
      )}
      {state === 'committed' && (
        <div className="grid gap-2 bg-(--bl-chip) px-3 py-2.5 [&_p]:m-0 [&_p]:font-bold">
          <p>✓ Done: {pick.title}</p>
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {said}
      </span>
    </section>
  );
}
