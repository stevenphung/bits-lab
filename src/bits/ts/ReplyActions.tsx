import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// The small bar under an assistant's reply. Copy turns into a check for a moment; regenerate
// spins, then a version switcher appears (‹ 2 / 3 ›) so earlier answers stay one click away;
// thumbs up and down are toggle buttons. Everything is a real button with a label, and the
// result of each action is announced. Reduced motion keeps the states, drops the spin.

const STYLE_ID = 'bl-reply-actions';
const CSS = `
/* theme tokens */
.bl-reply { --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-ok: #a7f070; }
:where(.light, [data-theme="light"]) .bl-reply, .bl-reply:where(.light, [data-theme="light"]) { --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-ok: #2f7d22; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-reply, :where(.light, [data-theme="light"]) .bl-reply:where(.dark, [data-theme="dark"]) { --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-ok: #a7f070; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-reply, .bl-reply:where([data-theme="system"]) { --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-ok: #2f7d22; } }
/* theme tokens end */
.bl-reply { display: inline-flex; align-items: center; gap: 2px; color: var(--bl-muted); font-family: var(--bl-font); font-size: 13px; }
.bl-reply__btn { display: inline-grid; place-items: center; width: 30px; height: 30px; padding: 0; border: 0; background: transparent; color: inherit; cursor: pointer; }
.bl-reply__btn:hover { background: var(--bl-chip); color: var(--bl-ink); }
.bl-reply__btn:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: -2px; }
.bl-reply__btn:disabled { cursor: default; opacity: 0.4; }
.bl-reply__btn[aria-pressed="true"] { color: var(--bl-accent); }
.bl-reply__btn[data-done] { color: var(--bl-ok); }
.bl-reply__btn[data-busy] svg { animation: bl-reply-spin 600ms steps(8) infinite; }
.bl-reply__btn svg { width: 16px; height: 16px; }
.bl-reply__versions { display: inline-flex; align-items: center; gap: 2px; margin: 0 2px; animation: bl-reply-in 220ms steps(3) both; }
.bl-reply__count { min-width: 38px; color: var(--bl-ink); font-weight: 700; text-align: center; font-variant-numeric: tabular-nums; }
.bl-reply__sep { width: 2px; height: 16px; margin: 0 4px; background: var(--bl-line); }
.bl-reply__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-reply-spin { to { transform: rotate(360deg); } }
@keyframes bl-reply-in { from { opacity: 0; transform: translateX(-6px); } }
@media (prefers-reduced-motion: reduce) { .bl-reply__btn[data-busy] svg, .bl-reply__versions { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const icon = (d: string) => (
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

export type ReplyFeedback = 'up' | 'down' | null;

export interface ReplyActionsProps {
  /** What Copy puts on the clipboard. */
  text?: string;
  onCopy?: () => void;
  /** The spin lasts until this resolves (and at least regenerateTime). */
  onRegenerate?: () => void | Promise<unknown>;
  versions?: number;
  defaultVersions?: number;
  version?: number;
  defaultVersion?: number;
  onVersionChange?: (version: number) => void;
  feedback?: ReplyFeedback;
  defaultFeedback?: ReplyFeedback;
  onFeedback?: (feedback: ReplyFeedback) => void;
  regenerateTime?: number;
  label?: string;
  chipColor?: string;
  lineColor?: string;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  okColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

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
  chipColor,
  lineColor,
  textColor,
  mutedColor,
  accentColor,
  okColor,
  fontFamily = 'inherit',
  className = '',
  style
}: ReplyActionsProps) {
  useStyles();
  const [innerVersions, setInnerVersions] = useState(defaultVersions);
  const total = versions ?? innerVersions;
  const [innerVersion, setInnerVersion] = useState(defaultVersion ?? defaultVersions);
  const current = version ?? innerVersion;
  const [innerFeedback, setInnerFeedback] = useState<ReplyFeedback>(defaultFeedback);
  const vote = feedback === undefined ? innerFeedback : feedback;
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState('');
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  const show = (n: number) => {
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

  const rate = (kind: 'up' | 'down') => {
    const next = vote === kind ? null : kind;
    if (feedback === undefined) setInnerFeedback(next);
    onFeedback?.(next);
    setSaid(next ? `Marked as ${next === 'up' ? 'good' : 'bad'}` : 'Feedback removed');
  };

  return (
    <div className={`bl-reply ${className}`} role="toolbar" aria-label={label} style={{ '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-ok': okColor, '--bl-font': fontFamily, ...style } as CSSVars}>
      <button type="button" className="bl-reply__btn" aria-label={copied ? 'Copied' : 'Copy'} data-done={copied || undefined} onClick={copy}>
        {copied ? ICONS.check : ICONS.copy}
      </button>
      <button type="button" className="bl-reply__btn" aria-label="Regenerate" data-busy={busy || undefined} disabled={busy} onClick={regenerate}>
        {ICONS.redo}
      </button>
      {total > 1 && (
        <span className="bl-reply__versions" role="group" aria-label="Versions">
          <button type="button" className="bl-reply__btn" aria-label="Previous version" disabled={current <= 1 || busy} onClick={() => show(current - 1)}>
            {ICONS.prev}
          </button>
          <span className="bl-reply__count">
            {current} / {total}
          </span>
          <button type="button" className="bl-reply__btn" aria-label="Next version" disabled={current >= total || busy} onClick={() => show(current + 1)}>
            {ICONS.next}
          </button>
        </span>
      )}
      <span className="bl-reply__sep" aria-hidden="true" />
      <button type="button" className="bl-reply__btn" aria-label="Good reply" aria-pressed={vote === 'up'} onClick={() => rate('up')}>
        {ICONS.up}
      </button>
      <button type="button" className="bl-reply__btn" aria-label="Bad reply" aria-pressed={vote === 'down'} onClick={() => rate('down')}>
        {ICONS.down}
      </button>
      <span className="bl-reply__sr" aria-live="polite">
        {said}
      </span>
    </div>
  );
}
