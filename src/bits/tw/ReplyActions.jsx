import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// The small bar under an assistant's reply. Copy turns into a check for a moment; regenerate
// spins, then a version switcher appears (‹ 2 / 3 ›) so earlier answers stay one click away;
// thumbs up and down are toggle buttons. Everything is a real button with a label, and the
// result of each action is announced. Reduced motion keeps the states, drops the spin.

const STYLE_ID = 'bl-reply-actions-tw';
const CSS = `
@keyframes bl-reply-spin { to { transform: rotate(360deg); } }
@keyframes bl-reply-in { from { opacity: 0; transform: translateX(-6px); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const icon = d => (
  <svg viewBox="0 0 8 8" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
    <path d={d} />
  </svg>
);
const ICONS = {
  copy: icon('M2 0h5v1h1v5H6v2H0V2h2zM1 3v4h4V3zM3 1v1h3v3h1V1z'),
  check: icon('M7 1h1v2H7v1H6v1H5v1H4v1H3V6H2V5H1V4H0V3h2v1h1v1h1V4h1V3h1V2h1z'),
  redo: icon('M2 1h4v1h1v1h1v2H6V4H5V3H2v1H1v2h1v1h3v1H1V7H0V2h1V1h1z'),
  up: icon('M3 0h1v1h1v2h3v4H7v1H2V3h1zM0 3h1v5H0z'),
  down: icon('M2 0h5v1h1v4H5v2H4v1H3V7H2V5H1V0h1zM0 0h1v5H0z'),
  prev: icon('M5 1h1v6H5V6H4V5H3V3h1V2h1z'),
  next: icon('M2 1h1v1h1v1h1v2H4v1H3v1H2z')
};

export default function ReplyActions({
  text,
  onCopy,
  onRegenerate,
  versions,
  defaultVersions = 1,
  version,
  defaultVersion,
  onVersionChange,
  feedback,
  defaultFeedback = null,
  onFeedback,
  regenerateTime = 1200,
  label = 'Reply actions',
  chipColor = '#262b44',
  lineColor = '#333c57',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  accentColor = '#73eff7',
  okColor = '#a7f070',
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const [innerVersions, setInnerVersions] = useState(defaultVersions);
  const total = versions ?? innerVersions;
  const [innerVersion, setInnerVersion] = useState(defaultVersion ?? defaultVersions);
  const current = version ?? innerVersion;
  const [innerFeedback, setInnerFeedback] = useState(defaultFeedback);
  const vote = feedback === undefined ? innerFeedback : feedback;
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState('');
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));
  const show = n => {
    if (version === undefined) setInnerVersion(n);
    onVersionChange?.(n);
    setSaid(`Version ${n} of ${total}`);
  };

  const copy = async () => {
    try {
      if (text !== undefined) await navigator.clipboard?.writeText(text);
    } catch {
      // Clipboard may be blocked; onCopy still runs.
    }
    onCopy?.();
    setCopied(true);
    setSaid('Copied');
    later(() => setCopied(false), 1600);
  };

  const regenerate = async () => {
    if (busy) return;
    setBusy(true);
    setSaid('Regenerating');
    const started = Date.now();
    try {
      await onRegenerate?.();
    } finally {
      // Keep the spin visible for a beat even when the work is instant.
      later(() => {
        const n = total + 1;
        if (versions === undefined) setInnerVersions(n);
        if (version === undefined) setInnerVersion(n);
        onVersionChange?.(n);
        setBusy(false);
        setSaid(`New version, ${n} of ${n}`);
      }, Math.max(0, regenerateTime - (Date.now() - started)));
    }
  };

  const rate = kind => {
    const next = vote === kind ? null : kind;
    if (feedback === undefined) setInnerFeedback(next);
    onFeedback?.(next);
    setSaid(next ? `Marked as ${next === 'up' ? 'good' : 'bad'}` : 'Feedback removed');
  };

  return (
    <div className={`inline-flex items-center gap-0.5 font-(family-name:--bl-font) text-[13px] text-(--bl-muted) ${className}`} role="toolbar" aria-label={label} style={{ '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-ok': okColor, '--bl-font': fontFamily, ...style }}>
      <button type="button" className="inline-grid size-[30px] cursor-pointer place-items-center border-0 bg-transparent p-0 text-inherit hover:bg-(--bl-chip) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid disabled:cursor-default disabled:opacity-40 aria-pressed:text-(--bl-accent) data-[done]:text-(--bl-ok) data-[busy]:[&_svg]:animate-[bl-reply-spin_600ms_steps(8)_infinite] motion-reduce:data-[busy]:[&_svg]:animate-none [&_svg]:size-4" aria-label={copied ? 'Copied' : 'Copy'} data-done={copied || undefined} onClick={copy}>
        {copied ? ICONS.check : ICONS.copy}
      </button>
      <button type="button" className="inline-grid size-[30px] cursor-pointer place-items-center border-0 bg-transparent p-0 text-inherit hover:bg-(--bl-chip) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid disabled:cursor-default disabled:opacity-40 aria-pressed:text-(--bl-accent) data-[done]:text-(--bl-ok) data-[busy]:[&_svg]:animate-[bl-reply-spin_600ms_steps(8)_infinite] motion-reduce:data-[busy]:[&_svg]:animate-none [&_svg]:size-4" aria-label="Regenerate" data-busy={busy || undefined} disabled={busy} onClick={regenerate}>
        {ICONS.redo}
      </button>
      {total > 1 && (
        <span className="mx-0.5 inline-flex animate-[bl-reply-in_220ms_steps(3)_both] items-center gap-0.5 motion-reduce:animate-none" role="group" aria-label="Versions">
          <button type="button" className="inline-grid size-[30px] cursor-pointer place-items-center border-0 bg-transparent p-0 text-inherit hover:bg-(--bl-chip) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid disabled:cursor-default disabled:opacity-40 aria-pressed:text-(--bl-accent) data-[done]:text-(--bl-ok) data-[busy]:[&_svg]:animate-[bl-reply-spin_600ms_steps(8)_infinite] motion-reduce:data-[busy]:[&_svg]:animate-none [&_svg]:size-4" aria-label="Previous version" disabled={current <= 1 || busy} onClick={() => show(current - 1)}>
            {ICONS.prev}
          </button>
          <span className="min-w-[38px] text-center font-bold text-(--bl-ink) tabular-nums">
            {current} / {total}
          </span>
          <button type="button" className="inline-grid size-[30px] cursor-pointer place-items-center border-0 bg-transparent p-0 text-inherit hover:bg-(--bl-chip) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid disabled:cursor-default disabled:opacity-40 aria-pressed:text-(--bl-accent) data-[done]:text-(--bl-ok) data-[busy]:[&_svg]:animate-[bl-reply-spin_600ms_steps(8)_infinite] motion-reduce:data-[busy]:[&_svg]:animate-none [&_svg]:size-4" aria-label="Next version" disabled={current >= total || busy} onClick={() => show(current + 1)}>
            {ICONS.next}
          </button>
        </span>
      )}
      <span className="mx-1 h-4 w-0.5 bg-(--bl-line)" aria-hidden="true" />
      <button type="button" className="inline-grid size-[30px] cursor-pointer place-items-center border-0 bg-transparent p-0 text-inherit hover:bg-(--bl-chip) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid disabled:cursor-default disabled:opacity-40 aria-pressed:text-(--bl-accent) data-[done]:text-(--bl-ok) data-[busy]:[&_svg]:animate-[bl-reply-spin_600ms_steps(8)_infinite] motion-reduce:data-[busy]:[&_svg]:animate-none [&_svg]:size-4" aria-label="Good reply" aria-pressed={vote === 'up'} onClick={() => rate('up')}>
        {ICONS.up}
      </button>
      <button type="button" className="inline-grid size-[30px] cursor-pointer place-items-center border-0 bg-transparent p-0 text-inherit hover:bg-(--bl-chip) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid disabled:cursor-default disabled:opacity-40 aria-pressed:text-(--bl-accent) data-[done]:text-(--bl-ok) data-[busy]:[&_svg]:animate-[bl-reply-spin_600ms_steps(8)_infinite] motion-reduce:data-[busy]:[&_svg]:animate-none [&_svg]:size-4" aria-label="Bad reply" aria-pressed={vote === 'down'} onClick={() => rate('down')}>
        {ICONS.down}
      </button>
      <span className="sr-only" aria-live="polite">
        {said}
      </span>
    </div>
  );
}
