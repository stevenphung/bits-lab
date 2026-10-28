import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type KeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// An animated code window for landing pages. Lines reveal one by one when it scrolls into
// view; switching file tabs morphs the code (lines both files share stay put, removed lines
// fold away, new ones unfold) instead of swapping it; diff files mark added and removed
// lines. Light built-in highlighting for JS/TS/JSX-like code, a copy button, optional
// auto-advancing tabs, and a proper tablist for keyboard users.

export interface CodeFile {
  /** Tab label. */
  name: string;
  code: string;
  /** Treat lines starting with + / - as added / removed. */
  diff?: boolean;
  /** 1-based line numbers to emphasise. */
  highlight?: number[];
}

export interface CodeShowcaseProps {
  files?: CodeFile[];
  defaultFile?: number;
  /** Controlled active tab index. */
  file?: number;
  onFileChange?: (index: number) => void;
  /** Advance every N ms until a tab is clicked; 0 is off. */
  autoPlay?: number;
  /** Line-by-line reveal on first view. */
  reveal?: boolean;
  stagger?: number;
  /** Fold-out and fold-in time for changed lines, in ms. */
  morphDuration?: number;
  showChrome?: boolean;
  showLineNumbers?: boolean;
  copyable?: boolean;
  width?: number;
  fontSize?: number;
  backgroundColor?: string;
  barColor?: string;
  textColor?: string;
  mutedColor?: string;
  dimColor?: string;
  lineColor?: string;
  accentColor?: string;
  keywordColor?: string;
  stringColor?: string;
  numberColor?: string;
  tagColor?: string;
  functionColor?: string;
  addColor?: string;
  removeColor?: string;
  radius?: number;
  fontFamily?: string;
  uiFontFamily?: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

interface DiffOp {
  type: 'keep' | 'del' | 'add';
  from: number;
  to: number;
}

interface CodeRow {
  key: number;
  text: string;
  state: 'idle' | 'in' | 'out';
}

const STYLE_ID = 'bl-code-showcase';
const CSS = `
.bl-code { width: 100%; max-width: var(--bl-w); margin: 0 auto; overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); box-shadow: 0 0 0 1px var(--bl-line), 0 24px 60px -28px rgba(0,0,0,0.8); font-family: var(--bl-ui-font); }
.bl-code__bar { display: flex; align-items: center; gap: 12px; min-width: 0; padding: 0 10px 0 14px; background: var(--bl-bar); box-shadow: inset 0 -1px 0 var(--bl-line); }
.bl-code__lights { display: flex; gap: 6px; }
.bl-code__lights i { width: 10px; height: 10px; border-radius: 50%; background: var(--bl-line); }
.bl-code__tabs { display: flex; flex: 1; min-width: 0; overflow-x: auto; scrollbar-width: none; }
.bl-code__tab { position: relative; flex: 0 0 auto; padding: 11px 12px; border: 0; background: transparent; color: var(--bl-muted); font: inherit; font-size: 13px; cursor: pointer; }
.bl-code__tab:hover { color: var(--bl-ink); }
.bl-code__tab[aria-selected="true"] { color: var(--bl-ink); }
.bl-code__tab::after { content: ""; position: absolute; left: 10px; right: 10px; bottom: 0; height: 2px; border-radius: 2px; background: var(--bl-accent); transform: scaleX(0); transition: transform 240ms cubic-bezier(.2,.9,.25,1); }
.bl-code__tab[aria-selected="true"]::after { transform: scaleX(1); }
.bl-code__tab:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: -4px; border-radius: 6px; }
.bl-code__tab[data-progress]::before { content: ""; position: absolute; left: 10px; right: 10px; bottom: 0; height: 2px; background: color-mix(in srgb, var(--bl-accent) 35%, transparent); transform-origin: left; animation: bl-code-progress var(--bl-auto) linear both; }
.bl-code[data-hold] .bl-code__tab[data-progress]::before { animation-play-state: paused; }
.bl-code__copy { flex: 0 0 auto; padding: 5px 10px; border: 0; border-radius: 6px; background: transparent; color: var(--bl-muted); font: inherit; font-size: 12px; cursor: pointer; }
.bl-code__copy:hover { background: var(--bl-line); color: var(--bl-ink); }
.bl-code__copy:focus-visible { outline: 2px solid var(--bl-accent); }
.bl-code__pre { margin: 0; padding: 14px 0; overflow-x: auto; font-family: var(--bl-font); font-size: var(--bl-size); line-height: var(--bl-lh); tab-size: 2; }
.bl-code__code { display: block; min-width: max-content; }
.bl-code__line { display: grid; grid-template-columns: 3.2em 1.4em auto; height: var(--bl-lh); overflow: hidden; white-space: pre; padding-right: 18px; }
.bl-code__num { color: var(--bl-dim); text-align: right; user-select: none; -webkit-user-select: none; }
.bl-code__sign { color: var(--bl-dim); text-align: center; user-select: none; -webkit-user-select: none; }
.bl-code__line[data-mark="add"] { background: color-mix(in srgb, var(--bl-add) 14%, transparent); }
.bl-code__line[data-mark="add"] .bl-code__sign { color: var(--bl-add); }
.bl-code__line[data-mark="del"] { background: color-mix(in srgb, var(--bl-del) 14%, transparent); }
.bl-code__line[data-mark="del"] .bl-code__sign { color: var(--bl-del); }
.bl-code__line[data-mark="del"] .bl-code__text { opacity: 0.7; }
.bl-code__line[data-focus] { background: color-mix(in srgb, var(--bl-accent) 10%, transparent); box-shadow: inset 2px 0 0 var(--bl-accent); }
.bl-code[data-reveal="wait"] .bl-code__line { opacity: 0; }
.bl-code[data-reveal="run"] .bl-code__line { animation: bl-code-reveal 380ms cubic-bezier(.2,.9,.25,1) both; animation-delay: calc(var(--i) * var(--bl-stagger)); }
.bl-code__line[data-state="out"] { animation: bl-code-out var(--bl-out) cubic-bezier(.4,0,.2,1) both; }
.bl-code__line[data-state="in"] { animation: bl-code-in var(--bl-in) cubic-bezier(.2,.9,.25,1) var(--bl-out) both; }
.bl-code .t-k { color: var(--bl-keyword); }
.bl-code .t-s { color: var(--bl-string); }
.bl-code .t-c { color: var(--bl-dim); font-style: italic; }
.bl-code .t-n { color: var(--bl-number); }
.bl-code .t-t { color: var(--bl-tag); }
.bl-code .t-f { color: var(--bl-fn); }
.bl-code__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-code-reveal { from { opacity: 0; transform: translateY(6px); } }
@keyframes bl-code-out { to { height: 0; opacity: 0; transform: translateX(-10px); } }
@keyframes bl-code-in { from { height: 0; opacity: 0; transform: translateX(10px); } }
@keyframes bl-code-progress { from { transform: scaleX(0); } }
@media (prefers-reduced-motion: reduce) {
  .bl-code[data-reveal] .bl-code__line, .bl-code__line[data-state] { animation: none; opacity: 1; }
  .bl-code__tab::after { transition: none; }
}
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const TOKENS = /(\/\/.*$|#.*$)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(<\/?[A-Za-z][\w.-]*|\/?>)|\b(import|from|export|default|const|let|var|function|return|if|else|for|while|await|async|new|class|extends|type|interface|as|of|in|true|false|null|undefined|this)\b|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_$][\w$]*)(?=\()/gm;
const CLASSES = ['t-c', 't-s', 't-t', 't-k', 't-n', 't-f'];

// Splits one line into highlighted spans. Good enough for marketing snippets, not a parser.
function highlight(line: string) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of line.matchAll(TOKENS)) {
    const index = match.index ?? 0;
    if (index > last) out.push(line.slice(last, index));
    const group = match.slice(1).findIndex(Boolean);
    out.push(
      <span key={index} className={CLASSES[group]}>
        {match[0]}
      </span>
    );
    last = index + match[0].length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
}

// Longest-common-subsequence line diff: which lines stay, which go, which arrive.
function diffLines(a: string[], b: string[]): DiffOp[] {
  const dp = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) ops.push({ type: 'keep', from: i++, to: j++ });
    else if (dp[i + 1][j] >= dp[i][j + 1]) ops.push({ type: 'del', from: i++, to: -1 });
    else ops.push({ type: 'add', from: -1, to: j++ });
  }
  while (i < a.length) ops.push({ type: 'del', from: i++, to: -1 });
  while (j < b.length) ops.push({ type: 'add', from: -1, to: j++ });
  return ops;
}

const splitCode = (code: string) => code.replace(/\n$/, '').split('\n');

export default function CodeShowcase({
  files = [],
  defaultFile = 0,
  file: controlled,
  onFileChange,
  autoPlay = 0,
  reveal = true,
  stagger = 45,
  morphDuration = 260,
  showChrome = true,
  showLineNumbers = true,
  copyable = true,
  width = 720,
  fontSize = 14,
  backgroundColor = '#0b0b14',
  barColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  dimColor = '#566c86',
  lineColor = '#333c57',
  accentColor = '#73eff7',
  keywordColor = '#ef7d57',
  stringColor = '#a7f070',
  numberColor = '#ffcd75',
  tagColor = '#41a6f6',
  functionColor = '#73eff7',
  addColor = '#38b764',
  removeColor = '#b13e53',
  radius = 12,
  fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  uiFontFamily = 'ui-sans-serif, system-ui, sans-serif',
  label = 'Code example',
  className = '',
  style
}: CodeShowcaseProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState(defaultFile);
  const active = Math.min(files.length - 1, Math.max(0, controlled ?? inner));
  const nextKey = useRef(0);
  const keyed = (code: string) => splitCode(code).map(text => ({ key: nextKey.current++, text, state: 'idle' as const }));
  const [rows, setRows] = useState<CodeRow[]>(() => (files[active] ? keyed(files[active].code) : []));
  const [revealState, setRevealState] = useState(reveal ? 'wait' : 'done');
  const [hold, setHold] = useState(false);
  const [auto, setAuto] = useState(autoPlay > 0);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const shown = useRef(active);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const select = (index: number, fromUser = true) => {
    if (fromUser) setAuto(false);
    if (controlled === undefined) setInner(index);
    onFileChange?.(index);
  };

  // Morph from the code on screen to the newly selected file.
  useEffect(() => {
    if (shown.current === active || !files[active]) return undefined;
    shown.current = active;
    const target = splitCode(files[active].code);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const live = rowsRef.current.filter(row => row.state !== 'out');
    const merged = diffLines(live.map(row => row.text), target).map(
      (op): CodeRow =>
        op.type === 'keep'
          ? { ...live[op.from], state: 'idle' }
          : op.type === 'del'
            ? { ...live[op.from], state: 'out' }
            : { key: nextKey.current++, text: target[op.to], state: 'in' }
    );
    const settled = merged.filter(row => row.state !== 'out').map((row): CodeRow => ({ ...row, state: 'idle' }));
    setRows(reduced ? settled : merged);
    if (reduced) return undefined;
    const timer = setTimeout(() => setRows(settled), morphDuration * 2 + 40);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, files]);

  // Reveal line by line the first time it scrolls into view.
  useEffect(() => {
    if (revealState !== 'wait') return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      setRevealState('run');
    }, { threshold: 0.3 });
    io.observe(rootRef.current!);
    return () => io.disconnect();
  }, [revealState]);
  useEffect(() => {
    if (revealState !== 'run') return undefined;
    const timer = setTimeout(() => setRevealState('done'), rows.length * stagger + 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealState]);

  // Auto-advance through the files until someone picks a tab.
  useEffect(() => {
    if (!auto || hold || autoPlay <= 0 || files.length < 2 || revealState === 'wait') return undefined;
    const timer = setTimeout(() => select((active + 1) % files.length, false), autoPlay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, hold, autoPlay, active, files.length, revealState]);

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keys = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: files.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = (keys[event.key as keyof typeof keys] + files.length) % files.length;
    select(next);
    tabRefs.current[next]?.focus();
  };

  const file = files[active];
  const copy = async () => {
    if (!file) return;
    const text = file.diff ? splitCode(file.code).filter(line => !line.startsWith('-')).map(line => line.replace(/^[+ ]/, '')).join('\n') : file.code;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const focusLines = new Set(file?.highlight ?? []);
  let number = 0;

  return (
    <div
      ref={rootRef}
      className={`bl-code ${className}`}
      data-reveal={revealState === 'done' ? undefined : revealState}
      data-hold={hold || undefined}
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHold(false);
      }}
      style={{
        '--bl-w': `${width}px`,
        '--bl-size': `${fontSize}px`,
        '--bl-lh': '1.7em',
        '--bl-stagger': `${stagger}ms`,
        '--bl-out': `${morphDuration}ms`,
        '--bl-in': `${morphDuration}ms`,
        '--bl-auto': `${autoPlay}ms`,
        '--bl-radius': `${radius}px`,
        '--bl-bg': backgroundColor,
        '--bl-bar': barColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-dim': dimColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-keyword': keywordColor,
        '--bl-string': stringColor,
        '--bl-number': numberColor,
        '--bl-tag': tagColor,
        '--bl-fn': functionColor,
        '--bl-add': addColor,
        '--bl-del': removeColor,
        '--bl-font': fontFamily,
        '--bl-ui-font': uiFontFamily,
        ...style
      } as CSSVars}
    >
      <div className="bl-code__bar">
        {showChrome && (
          <span className="bl-code__lights" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
        <div className="bl-code__tabs" role="tablist" aria-label={label}>
          {files.map((f, i) => (
            <button
              key={f.name}
              ref={node => {
                tabRefs.current[i] = node;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${i}`}
              className="bl-code__tab"
              aria-selected={i === active}
              aria-controls={`${uid}-panel`}
              tabIndex={i === active ? 0 : -1}
              data-progress={(auto && autoPlay > 0 && files.length > 1 && i === active && revealState !== 'wait') || undefined}

              onClick={() => select(i)}
              onKeyDown={event => onTabKey(event, i)}
            >
              {f.name}
            </button>
          ))}
        </div>
        {copyable && (
          <button type="button" className="bl-code__copy" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
        <span className="bl-code__sr" aria-live="polite">
          {copied ? 'Code copied to clipboard' : ''}
        </span>
      </div>
      <pre className="bl-code__pre" id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${active}`} tabIndex={0}>
        <code className="bl-code__code">
          {rows.map((row, i) => {
            const mark = file?.diff ? (row.text.startsWith('+') ? 'add' : row.text.startsWith('-') ? 'del' : null) : null;
            const text = file?.diff ? row.text.replace(/^[+\- ]/, '') : row.text;
            if (row.state !== 'out') number++;
            return (
              <span
                key={row.key}
                className="bl-code__line"
                data-state={row.state === 'idle' ? undefined : row.state}
                data-mark={mark ?? undefined}
                data-focus={(row.state !== 'out' && focusLines.has(number)) || undefined}
                style={{ '--i': i } as CSSVars}
              >
                <span className="bl-code__num" aria-hidden="true">
                  {showLineNumbers && row.state !== 'out' ? number : ''}
                </span>
                <span className="bl-code__sign" aria-hidden="true">
                  {mark === 'add' ? '+' : mark === 'del' ? '−' : ''}
                </span>
                <span className="bl-code__text">{highlight(text)}</span>
                {'\n'}
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
