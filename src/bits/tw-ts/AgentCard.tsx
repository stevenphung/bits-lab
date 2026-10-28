import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A card for one tool call in an AI agent's run. It shows the tool, a short summary of its
// arguments and a status: queued, running (spinner and a live timer), success (check and
// how long it took) or error (cross and the message). Logs stream into a collapsible panel
// that sticks to the bottom as lines arrive; the result or error shows underneath. The
// status is announced as it changes.

const STYLE_ID = 'bl-agent-card-tw';
const CSS = `
@keyframes bl-agent-spin { to { transform: rotate(360deg); } }
@keyframes bl-agent-line { from { opacity: 0; transform: translateY(4px); } }
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
      className={`group/agent w-full max-w-(--bl-w) overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) font-(family-name:--bl-font) text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line)] transition-shadow duration-300 ease-[ease] data-[status=error]:shadow-[0_0_0_1px_var(--bl-error)] data-[status=running]:shadow-[0_0_0_1px_var(--bl-accent),0_0_24px_-8px_var(--bl-accent)] ${className}`}
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
      <button type="button" className="group/head flex w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent px-3.5 py-3 text-left text-inherit focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--bl-accent)" aria-expanded={open} aria-controls={`${uid}-body`} onClick={toggle}>
        <span className="relative grid size-[26px] flex-none place-items-center rounded-[8px] bg-(--bl-chip) text-(--bl-muted) group-data-[status=success]/agent:bg-[color-mix(in_srgb,var(--bl-ok)_22%,transparent)] group-data-[status=success]/agent:text-(--bl-ok) group-data-[status=error]/agent:bg-[color-mix(in_srgb,var(--bl-error)_22%,transparent)] group-data-[status=error]/agent:text-(--bl-error)" aria-hidden="true">
          {status === 'running' ? (
            <span className="absolute inset-[3px] animate-[bl-agent-spin_800ms_linear_infinite] rounded-[50%] border-2 border-solid border-[color-mix(in_srgb,var(--bl-accent)_25%,transparent)] border-t-(--bl-accent) motion-reduce:[animation-duration:2.4s]" />
          ) : status === 'queued' && icon ? (
            icon
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={ICONS[status as keyof typeof ICONS] ?? ICONS.queued} />
            </svg>
          )}
        </span>
        <span className="grid min-w-0 flex-1 gap-px">
          <span id={`${uid}-tool`} className="font-(family-name:--bl-mono) text-[13px] font-bold">
            {tool}
          </span>
          {args != null && <span className="overflow-hidden font-(family-name:--bl-mono) text-[12px] text-ellipsis whitespace-nowrap text-(--bl-muted)">{summarize(args)}</span>}
        </span>
        <span className="flex-none text-[12px] text-(--bl-muted) tabular-nums">{meta}</span>
        <svg className="flex-none text-(--bl-muted) [transition:transform_220ms] group-aria-expanded/head:[transform:rotate(180deg)] motion-reduce:[transition:none]" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M3 4.5 6 7.5 9 4.5" />
        </svg>
      </button>
      <div id={`${uid}-body`} className="grid grid-rows-[0fr] [transition:grid-template-rows_260ms_cubic-bezier(.2,.9,.25,1)] data-[open]:grid-rows-[1fr] motion-reduce:[transition:none]" data-open={open || undefined} inert={open ? undefined : true}>
        <div className="min-h-0 overflow-hidden">
          {logs.length > 0 ? (
            <ol
              ref={logRef}
              className="mx-3.5 my-0 max-h-(--bl-log-h) list-none overflow-y-auto rounded-[10px] bg-(--bl-code) px-3 py-2.5 font-(family-name:--bl-mono) text-[12px] leading-[1.6] [&_li]:animate-[bl-agent-line_260ms_ease_both] [&_li]:whitespace-pre-wrap [&_li]:text-(--bl-muted) [&_li]:[overflow-wrap:anywhere] [&_li]:before:text-(--bl-dim) [&_li]:before:content-['›_'] motion-reduce:[&_li]:animate-none"
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
            <p className="px-3.5 pt-2.5 pb-3.5 text-[13px] text-(--bl-dim)">{status === 'queued' ? 'Waiting to start…' : 'No logs.'}</p>
          )}
          {status === 'error' && error && (
            <div className="mx-3.5 mt-2.5 mb-3.5 rounded-[10px] bg-[color-mix(in_srgb,var(--bl-ok)_10%,transparent)] px-3 py-2.5 text-[13px] leading-[1.5] data-[error]:bg-[color-mix(in_srgb,var(--bl-error)_12%,transparent)] data-[error]:text-(--bl-error) [&_pre]:m-0 [&_pre]:font-(family-name:--bl-mono) [&_pre]:text-[12px] [&_pre]:whitespace-pre-wrap [&_pre]:[overflow-wrap:anywhere]" data-error="">
              {typeof error === 'string' ? <pre>{error}</pre> : error}
            </div>
          )}
          {status === 'success' && result != null && <div className="mx-3.5 mt-2.5 mb-3.5 rounded-[10px] bg-[color-mix(in_srgb,var(--bl-ok)_10%,transparent)] px-3 py-2.5 text-[13px] leading-[1.5] data-[error]:bg-[color-mix(in_srgb,var(--bl-error)_12%,transparent)] data-[error]:text-(--bl-error) [&_pre]:m-0 [&_pre]:font-(family-name:--bl-mono) [&_pre]:text-[12px] [&_pre]:whitespace-pre-wrap [&_pre]:[overflow-wrap:anywhere]">{typeof result === 'string' ? <pre>{result}</pre> : result}</div>}
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {`${tool} ${statusText}${status === 'error' && typeof error === 'string' ? `: ${error.split('\n')[0]}` : ''}`}
      </span>
    </article>
  );
}
