import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Scripted terminal session for landing pages and docs: typed commands, instant output,
// spinners that resolve to a result, success / error / info lines and pauses. Starts when
// scrolled into view, can loop, and exposes the full transcript to screen readers.
// Under reduced motion the whole session is shown at once.

const STYLE_ID = 'bl-terminal-demo-tw';
const CSS = `
@keyframes bl-term-blink { 50% { opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const MARKS: Record<string, string> = { success: '✔', error: '✖', info: 'ℹ' };

/** One step of the scripted session. `after` is the pause after the step, in ms. */
export type TerminalStep =
  | { type: 'command'; text: string; prompt?: string; /** Pause before typing starts, in ms. */ delay?: number; after?: number }
  | { type: 'output' | 'success' | 'error' | 'info'; text: string; after?: number }
  | { type: 'spinner'; text: string; duration?: number; /** Text shown when the spinner resolves. */ done?: string; /** Resolve as an error instead of success. */ failed?: boolean; after?: number }
  | { type: 'pause'; duration?: number; after?: number };

type PrintedStep = Exclude<TerminalStep, { type: 'pause' }>;

interface TerminalLine {
  kind: 'command' | 'output' | 'success' | 'error' | 'info' | 'spinner';
  text: string;
  prompt?: string;
  typing?: boolean;
  frame?: number;
}

export interface TerminalDemoProps {
  /** The session, in order. */
  script?: TerminalStep[];
  /** Window title. */
  title?: string;
  /** Prompt symbol (each command can override it). */
  prompt?: string;
  /** Average ms per typed character (with jitter). */
  typingSpeed?: number;
  /** Default gap after each step, in ms. */
  lineDelay?: number;
  /** Replay forever. When not looping, a Replay button appears at the end. */
  loop?: boolean;
  /** Pause before looping, in ms. */
  loopDelay?: number;
  /** Wait until a third of the terminal is visible. */
  startOnView?: boolean;
  /** Show the Replay button. */
  showControls?: boolean;
  /** Max width, in px. */
  width?: number;
  /** Body height, in px. */
  height?: number;
  radius?: number;
  fontSize?: number;
  fontFamily?: string;
  background?: string;
  barColor?: string;
  lineColor?: string;
  textColor?: string;
  mutedColor?: string;
  promptColor?: string;
  successColor?: string;
  errorColor?: string;
  infoColor?: string;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_SCRIPT: TerminalStep[] = [
  { type: 'command', text: 'npx bits-lab add dot-globe' },
  { type: 'output', text: 'Resolving registry…' },
  { type: 'spinner', text: 'Fetching component', duration: 1200, done: 'Fetched dot-globe.jsx (12 kB)' },
  { type: 'spinner', text: 'Writing files', duration: 800, done: 'Wrote src/components/DotGlobe.jsx' },
  { type: 'info', text: 'No dependencies to install.' },
  { type: 'pause', duration: 400 },
  { type: 'command', text: 'npm run dev' },
  { type: 'output', text: '  VITE ready in 312 ms\n  ➜  Local:   http://localhost:5173/' },
  { type: 'success', text: 'Done. Happy shipping!' }
];

// Plain-text line for the screen-reader transcript and the reduced-motion render.
const finalLine = (step: PrintedStep, prompt: string): TerminalLine => {
  if (step.type === 'command') return { kind: 'command', text: step.text, prompt: step.prompt ?? prompt };
  if (step.type === 'spinner') return { kind: step.failed ? 'error' : 'success', text: step.done ?? step.text };
  return { kind: step.type, text: step.text };
};

export default function TerminalDemo({
  script = DEFAULT_SCRIPT,
  title = 'zsh — bits-lab',
  prompt = '$',
  typingSpeed = 45,
  lineDelay = 260,
  loop = false,
  loopDelay = 2600,
  startOnView = true,
  showControls = true,
  width = 640,
  height = 300,
  radius = 12,
  fontSize = 13.5,
  fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  background = '#11131c',
  barColor = '#181b27',
  lineColor = 'rgba(255,255,255,0.08)',
  textColor = '#e8eaf0',
  mutedColor = '#94b0c2',
  promptColor = '#73eff7',
  successColor = '#a7f070',
  errorColor = '#ef7d57',
  infoColor = '#ffcd75',
  className = '',
  style
}: TerminalDemoProps) {
  useStyles();
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [run, setRun] = useState(0);
  const [inView, setInView] = useState(!startOnView);
  const scriptKey = JSON.stringify(script);

  useEffect(() => {
    if (!startOnView || inView) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setInView(true), { threshold: 0.35 });
    io.observe(rootRef.current!);
    return () => io.disconnect();
  }, [startOnView, inView]);

  useEffect(() => {
    if (!inView) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setLines(script.filter((step): step is PrintedStep => step.type !== 'pause').map(step => finalLine(step, prompt)));
      setFinished(true);
      return;
    }
    let cancelled = false;
    const timers = new Set<ReturnType<typeof setTimeout>>();
    const wait = (ms: number) =>
      new Promise<void>(resolve => {
        const id = setTimeout(() => {
          timers.delete(id);
          resolve();
        }, ms);
        timers.add(id);
      });
    const push = (line: TerminalLine) => setLines(prev => [...prev, line]);
    const patchLast = (patch: Partial<TerminalLine>) => setLines(prev => [...prev.slice(0, -1), { ...prev[prev.length - 1], ...patch }]);

    (async () => {
      do {
        setLines([]);
        setFinished(false);
        setRunning(true);
        for (const step of script) {
          if (cancelled) return;
          if (step.type === 'pause') {
            await wait(step.duration ?? 600);
          } else if (step.type === 'command') {
            push({ kind: 'command', text: '', prompt: step.prompt ?? prompt, typing: true });
            await wait(step.delay ?? 380);
            for (let i = 1; i <= step.text.length && !cancelled; i++) {
              patchLast({ text: step.text.slice(0, i) });
              await wait(typingSpeed * (0.55 + Math.random() * 0.9));
            }
            await wait(320);
            patchLast({ typing: false });
          } else if (step.type === 'spinner') {
            push({ kind: 'spinner', text: step.text, frame: 0 });
            const end = performance.now() + (step.duration ?? 1000);
            for (let frame = 1; performance.now() < end && !cancelled; frame++) {
              await wait(80);
              patchLast({ frame });
            }
            patchLast(finalLine(step, prompt));
          } else {
            push(finalLine(step, prompt));
          }
          await wait(step.after ?? lineDelay);
        }
        if (cancelled) return;
        setRunning(false);
        setFinished(true);
        if (loop) await wait(loopDelay);
      } while (loop && !cancelled);
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, run, scriptKey, prompt, typingSpeed, lineDelay, loop, loopDelay]);

  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [lines]);

  const transcript = script
    .filter((step): step is PrintedStep => step.type !== 'pause')
    .map(step => finalLine(step, prompt))
    .map(line => (line.kind === 'command' ? `${line.prompt} ${line.text}` : line.text))
    .join('\n');

  return (
    <div
      ref={rootRef}
      className={`relative w-full max-w-(--bl-w) overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) [font:400_var(--bl-size)/1.6_var(--bl-font)] text-(--bl-ink) shadow-[inset_0_0_0_1px_var(--bl-line),0_30px_60px_-30px_rgba(0,0,0,0.6)] ${className}`}
      style={{
        '--bl-w': `${width}px`,
        '--bl-h': `${height}px`,
        '--bl-radius': `${radius}px`,
        '--bl-size': `${fontSize}px`,
        '--bl-font': fontFamily,
        '--bl-bg': background,
        '--bl-bar': barColor,
        '--bl-line': lineColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-prompt': promptColor,
        '--bl-success': successColor,
        '--bl-error': errorColor,
        '--bl-info': infoColor,
        ...style
      } as CSSVars}
    >
      <div className="relative flex h-[38px] items-center border-b border-solid border-(--bl-line) bg-(--bl-bar) px-3.5">
        <span className="flex gap-[7px] *:size-[11px] *:rounded-[50%]" aria-hidden="true">
          <i style={{ background: '#ff5f57' }} />
          <i style={{ background: '#febc2e' }} />
          <i style={{ background: '#28c840' }} />
        </span>
        <span className="absolute left-1/2 text-[12px] whitespace-nowrap text-(--bl-muted) [transform:translateX(-50%)]">{title}</span>
        {showControls && !loop && finished && (
          <button className="ml-auto cursor-pointer rounded-[6px] border border-solid border-(--bl-line) bg-transparent px-2 py-[3px] text-[11px] text-(--bl-muted) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-prompt)" type="button" onClick={() => setRun(r => r + 1)}>
            Replay
          </button>
        )}
      </div>
      <div ref={bodyRef} className="h-(--bl-h) overflow-y-auto px-4 py-3.5 [scrollbar-width:thin]" aria-hidden="true">
        {lines.map((line, i) => (
          <div key={i} className="min-h-[1.6em] [word-break:break-word] whitespace-pre-wrap data-[kind=output]:text-(--bl-muted) data-[kind=success]:text-(--bl-success) data-[kind=error]:text-(--bl-error) data-[kind=info]:text-(--bl-info) data-[kind=spinner]:text-(--bl-ink)" data-kind={line.kind}>
            {line.kind === 'command' && <span className="mr-[0.6em] text-(--bl-prompt) select-none">{line.prompt}</span>}
            {line.kind === 'spinner' && <span className="inline-block w-[1.4em]">{SPINNER[line.frame! % SPINNER.length]}</span>}
            {MARKS[line.kind] && <span className="inline-block w-[1.4em]">{MARKS[line.kind]}</span>}
            {line.text}
            {line.typing && <span className="ml-px inline-block h-[1.15em] w-[0.6em] animate-[bl-term-blink_1s_steps(1)_infinite] bg-(--bl-ink) align-text-bottom motion-reduce:animate-none" />}
          </div>
        ))}
        {(finished || !running) && (
          <div className="min-h-[1.6em] [word-break:break-word] whitespace-pre-wrap data-[kind=output]:text-(--bl-muted) data-[kind=success]:text-(--bl-success) data-[kind=error]:text-(--bl-error) data-[kind=info]:text-(--bl-info) data-[kind=spinner]:text-(--bl-ink)">
            <span className="mr-[0.6em] text-(--bl-prompt) select-none">{prompt}</span>
            <span className="ml-px inline-block h-[1.15em] w-[0.6em] animate-[bl-term-blink_1s_steps(1)_infinite] bg-(--bl-ink) align-text-bottom motion-reduce:animate-none" />
          </div>
        )}
      </div>
      <pre className="sr-only" aria-label={`${title} terminal transcript`}>
        {transcript}
      </pre>
    </div>
  );
}
