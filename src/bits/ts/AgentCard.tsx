import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A card for one tool call in an AI agent's run. It shows the tool, a short summary of its
// arguments and a status: queued, running (spinner and a live timer), success (check and
// how long it took) or error (cross and the message). Logs stream into a collapsible panel
// that sticks to the bottom as lines arrive; the result or error shows underneath. The
// status is announced as it changes.

const STYLE_ID = 'bl-agent-card';
const CSS = `
.bl-agent { width: 100%; max-width: var(--bl-w); overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); box-shadow: 0 0 0 1px var(--bl-line); transition: box-shadow 300ms; }
.bl-agent[data-status="running"] { box-shadow: 0 0 0 1px var(--bl-accent), 0 0 24px -8px var(--bl-accent); }
.bl-agent[data-status="error"] { box-shadow: 0 0 0 1px var(--bl-error); }
.bl-agent__head { display: flex; align-items: center; gap: 10px; width: 100%; padding: 12px 14px; border: 0; background: transparent; color: inherit; font: inherit; text-align: left; cursor: pointer; }
.bl-agent__head:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: -2px; }
.bl-agent__icon { position: relative; display: grid; place-items: center; flex: 0 0 auto; width: 26px; height: 26px; border-radius: 8px; background: var(--bl-chip); color: var(--bl-muted); }
.bl-agent[data-status="success"] .bl-agent__icon { background: color-mix(in srgb, var(--bl-ok) 22%, transparent); color: var(--bl-ok); }
.bl-agent[data-status="error"] .bl-agent__icon { background: color-mix(in srgb, var(--bl-error) 22%, transparent); color: var(--bl-error); }
.bl-agent__spin { position: absolute; inset: 3px; border-radius: 50%; border: 2px solid color-mix(in srgb, var(--bl-accent) 25%, transparent); border-top-color: var(--bl-accent); animation: bl-agent-spin 800ms linear infinite; }
.bl-agent__title { display: grid; flex: 1; min-width: 0; gap: 1px; }
.bl-agent__tool { font-family: var(--bl-mono); font-size: 13px; font-weight: 700; }
.bl-agent__args { overflow: hidden; color: var(--bl-muted); font-family: var(--bl-mono); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.bl-agent__meta { flex: 0 0 auto; color: var(--bl-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.bl-agent__chev { flex: 0 0 auto; color: var(--bl-muted); transition: transform 220ms; }
.bl-agent__head[aria-expanded="true"] .bl-agent__chev { transform: rotate(180deg); }
.bl-agent__body { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 260ms cubic-bezier(.2,.9,.25,1); }
.bl-agent__body[data-open] { grid-template-rows: 1fr; }
.bl-agent__inner { min-height: 0; overflow: hidden; }
.bl-agent__logs { max-height: var(--bl-log-h); margin: 0 14px; padding: 10px 12px; overflow-y: auto; border-radius: 10px; background: var(--bl-code); font-family: var(--bl-mono); font-size: 12px; line-height: 1.6; list-style: none; }
.bl-agent__logs li { color: var(--bl-muted); white-space: pre-wrap; overflow-wrap: anywhere; animation: bl-agent-line 260ms ease both; }
.bl-agent__logs li::before { content: "› "; color: var(--bl-dim); }
.bl-agent__out { margin: 10px 14px 14px; padding: 10px 12px; border-radius: 10px; background: color-mix(in srgb, var(--bl-ok) 10%, transparent); font-size: 13px; line-height: 1.5; }
.bl-agent__out[data-error] { background: color-mix(in srgb, var(--bl-error) 12%, transparent); color: var(--bl-error); }
.bl-agent__out pre { margin: 0; font-family: var(--bl-mono); font-size: 12px; white-space: pre-wrap; overflow-wrap: anywhere; }
.bl-agent__empty { padding: 10px 14px 14px; color: var(--bl-dim); font-size: 13px; }
.bl-agent__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-agent-spin { to { transform: rotate(360deg); } }
@keyframes bl-agent-line { from { opacity: 0; transform: translateY(4px); } }
@media (prefers-reduced-motion: reduce) { .bl-agent__spin { animation-duration: 2.4s; } .bl-agent__logs li { animation: none; } .bl-agent__body, .bl-agent__chev { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export type AgentStatus = 'queued' | 'running' | 'success' | 'error';

export interface AgentCardProps {
  /** The tool's name. */
  tool?: string;
  /** Arguments, summarised on one line. */
  args?: Record<string, unknown> | string;
  status?: AgentStatus;
  /** When the call started (ms since epoch); drives the live timer. */
  startedAt?: number;
  /** Final duration in ms; overrides the timer. */
  duration?: number;
  logs?: string[];
  result?: ReactNode;
  error?: ReactNode;
  /** Icon shown while queued. */
  icon?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Max width in px. */
  width?: number;
  /** Max height of the log panel in px. */
  logHeight?: number;
  backgroundColor?: string;
  chipColor?: string;
  codeColor?: string;
  textColor?: string;
  mutedColor?: string;
  dimColor?: string;
  lineColor?: string;
  accentColor?: string;
  okColor?: string;
  errorColor?: string;
  radius?: number;
  fontFamily?: string;
  monoFamily?: string;
  className?: string;
  style?: CSSProperties;
}

const summarize = (args: unknown) => {
  if (args == null) return '';
  if (typeof args === 'string') return args;
  return Object.entries(args as Record<string, unknown>)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join(', ');
};

const seconds = (ms: number) => (ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}s`);

const ICONS = {
  success: 'M3 8.5 6.5 12 13 4.5',
  error: 'M4 4l8 8M12 4l-8 8',
  queued: 'M8 4v4l2.5 2.5'
};

export default function AgentCard({
  tool = 'tool',
  args,
  status = 'running',
  startedAt,
  duration,
  logs = [],
  result,
  error,
  icon,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
  width = 520,
  logHeight = 160,
  backgroundColor = '#1a1c2c',
  chipColor = '#262b44',
  codeColor = '#0b0b14',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  dimColor = '#566c86',
  lineColor = '#333c57',
  accentColor = '#73eff7',
  okColor = '#38b764',
  errorColor = '#ef7d57',
  radius = 14,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  monoFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace',
  className = '',
  style
}: AgentCardProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [innerOpen, setInnerOpen] = useState(defaultOpen);
  const open = controlledOpen ?? innerOpen;
  const [now, setNow] = useState(() => Date.now());
  const logRef = useRef<HTMLOListElement>(null);
  const stick = useRef(true);

  // Tick the elapsed timer while running.
  useEffect(() => {
    if (status !== 'running') return undefined;
    const timer = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(timer);
  }, [status]);

  // Follow new log lines unless the reader has scrolled up.
  useEffect(() => {
    const node = logRef.current;
    if (node && stick.current) node.scrollTop = node.scrollHeight;
  }, [logs.length, open]);

  const toggle = () => {
    if (controlledOpen === undefined) setInnerOpen(o => !o);
    onOpenChange?.(!open);
  };

  const elapsed = duration ?? (startedAt ? Math.max(0, now - startedAt) : null);
  const meta = status === 'queued' ? 'Queued' : status === 'running' ? (elapsed != null ? seconds(elapsed) : 'Running') : status === 'success' ? (elapsed != null ? `Done in ${seconds(elapsed)}` : 'Done') : elapsed != null ? `Failed after ${seconds(elapsed)}` : 'Failed';
  const statusText = { queued: 'queued', running: 'running', success: 'finished', error: 'failed' }[status];

  return (
    <article
      className={`bl-agent ${className}`}
      data-status={status}
      aria-labelledby={`${uid}-tool`}
      style={{
        '--bl-w': `${width}px`,
        '--bl-log-h': `${logHeight}px`,
        '--bl-bg': backgroundColor,
        '--bl-chip': chipColor,
        '--bl-code': codeColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-dim': dimColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-ok': okColor,
        '--bl-error': errorColor,
        '--bl-radius': `${radius}px`,
        '--bl-font': fontFamily,
        '--bl-mono': monoFamily,
        ...style
      } as CSSVars}
    >
      <button type="button" className="bl-agent__head" aria-expanded={open} aria-controls={`${uid}-body`} onClick={toggle}>
        <span className="bl-agent__icon" aria-hidden="true">
          {status === 'running' ? (
            <span className="bl-agent__spin" />
          ) : status === 'queued' && icon ? (
            icon
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={ICONS[status as keyof typeof ICONS] ?? ICONS.queued} />
            </svg>
          )}
        </span>
        <span className="bl-agent__title">
          <span id={`${uid}-tool`} className="bl-agent__tool">
            {tool}
          </span>
          {args != null && <span className="bl-agent__args">{summarize(args)}</span>}
        </span>
        <span className="bl-agent__meta">{meta}</span>
        <svg className="bl-agent__chev" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M3 4.5 6 7.5 9 4.5" />
        </svg>
      </button>
      <div id={`${uid}-body`} className="bl-agent__body" data-open={open || undefined} inert={open ? undefined : true}>
        <div className="bl-agent__inner">
          {logs.length > 0 ? (
            <ol
              ref={logRef}
              className="bl-agent__logs"
              aria-label="Logs"
              tabIndex={0}
              onScroll={event => {
                const node = event.currentTarget;
                stick.current = node.scrollTop + node.clientHeight >= node.scrollHeight - 8;
              }}
            >
              {logs.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ol>
          ) : (
            <p className="bl-agent__empty">{status === 'queued' ? 'Waiting to start…' : 'No logs.'}</p>
          )}
          {status === 'error' && error && (
            <div className="bl-agent__out" data-error="">
              {typeof error === 'string' ? <pre>{error}</pre> : error}
            </div>
          )}
          {status === 'success' && result != null && <div className="bl-agent__out">{typeof result === 'string' ? <pre>{result}</pre> : result}</div>}
        </div>
      </div>
      <span className="bl-agent__sr" aria-live="polite">
        {`${tool} ${statusText}${status === 'error' && typeof error === 'string' ? `: ${error.split('\n')[0]}` : ''}`}
      </span>
    </article>
  );
}
