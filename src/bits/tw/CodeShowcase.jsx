import { useEffect, useId, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// An animated code window for landing pages. Lines reveal one by one when it scrolls into
// view; switching file tabs morphs the code (lines both files share stay put, removed lines
// fold away, new ones unfold) instead of swapping it; diff files mark added and removed
// lines. Light built-in highlighting for JS/TS/JSX-like code, a copy button, optional
// auto-advancing tabs, and a proper tablist for keyboard users.

const STYLE_ID = 'bl-code-showcase-tw';
const CSS = `
@keyframes bl-code-reveal { from { opacity: 0; transform: translateY(6px); } }
@keyframes bl-code-out { to { height: 0; opacity: 0; transform: translateX(-10px); } }
@keyframes bl-code-in { from { height: 0; opacity: 0; transform: translateX(10px); } }
@keyframes bl-code-progress { from { transform: scaleX(0); } }
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
function highlight(line) {
  const out = [];
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
function diffLines(a, b) {
  const dp = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }
  const ops = [];
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

const splitCode = code => code.replace(/\n$/, '').split('\n');

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
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [inner, setInner] = useState(defaultFile);
  const active = Math.min(files.length - 1, Math.max(0, controlled ?? inner));
  const nextKey = useRef(0);
  const keyed = code => splitCode(code).map(text => ({ key: nextKey.current++, text, state: 'idle' }));
  const [rows, setRows] = useState(() => (files[active] ? keyed(files[active].code) : []));
  const [revealState, setRevealState] = useState(reveal ? 'wait' : 'done');
  const [hold, setHold] = useState(false);
  const [auto, setAuto] = useState(autoPlay > 0);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef(null);
  const tabRefs = useRef([]);
  const shown = useRef(active);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const select = (index, fromUser = true) => {
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
    const merged = diffLines(live.map(row => row.text), target).map(op =>
      op.type === 'keep'
        ? { ...live[op.from], state: 'idle' }
        : op.type === 'del'
          ? { ...live[op.from], state: 'out' }
          : { key: nextKey.current++, text: target[op.to], state: 'in' }
    );
    const settled = merged.filter(row => row.state !== 'out').map(row => ({ ...row, state: 'idle' }));
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
    io.observe(rootRef.current);
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

  const onTabKey = (event, index) => {
    const keys = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: files.length - 1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const next = (keys[event.key] + files.length) % files.length;
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
      className={`group/code mx-auto w-full max-w-(--bl-w) overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) font-(family-name:--bl-ui-font) text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line),0_24px_60px_-28px_rgba(0,0,0,0.8)] [&_.t-c]:text-(--bl-dim) [&_.t-c]:italic [&_.t-f]:text-(--bl-fn) [&_.t-k]:text-(--bl-keyword) [&_.t-n]:text-(--bl-number) [&_.t-s]:text-(--bl-string) [&_.t-t]:text-(--bl-tag) ${className}`}
      data-reveal={revealState === 'done' ? undefined : revealState}
      data-hold={hold || undefined}
      onPointerEnter={() => setHold(true)}
      onPointerLeave={() => setHold(false)}
      onFocus={() => setHold(true)}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHold(false);
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
      }}
    >
      <div className="flex min-w-0 items-center gap-3 bg-(--bl-bar) py-0 pr-2.5 pl-3.5 shadow-[inset_0_-1px_0_var(--bl-line)]">
        {showChrome && (
          <span className="flex gap-1.5 *:size-2.5 *:rounded-[50%] *:bg-(--bl-line)" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
        <div className="flex min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]" role="tablist" aria-label={label}>
          {files.map((f, i) => (
            <button
              key={f.name}
              ref={node => {
                tabRefs.current[i] = node;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${i}`}
              className="relative flex-none cursor-pointer border-0 bg-transparent px-3 py-[11px] text-[13px] text-(--bl-muted) hover:text-(--bl-ink) aria-selected:text-(--bl-ink) focus-visible:rounded-[6px] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-(--bl-accent) after:absolute after:right-2.5 after:bottom-0 after:left-2.5 after:h-0.5 after:rounded-[2px] after:bg-(--bl-accent) after:[transform:scaleX(0)] after:[transition:transform_240ms_cubic-bezier(.2,.9,.25,1)] aria-selected:after:[transform:scaleX(1)] data-[progress]:before:absolute data-[progress]:before:right-2.5 data-[progress]:before:bottom-0 data-[progress]:before:left-2.5 data-[progress]:before:h-0.5 data-[progress]:before:origin-left data-[progress]:before:animate-[bl-code-progress_var(--bl-auto)_linear_both] data-[progress]:before:bg-[color-mix(in_srgb,var(--bl-accent)_35%,transparent)] group-data-[hold]/code:data-[progress]:before:[animation-play-state:paused] motion-reduce:after:[transition:none]"
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
          <button type="button" className="flex-none cursor-pointer rounded-[6px] border-0 bg-transparent px-2.5 py-[5px] text-[12px] text-(--bl-muted) hover:bg-(--bl-line) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" onClick={copy}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
        <span className="sr-only" aria-live="polite">
          {copied ? 'Code copied to clipboard' : ''}
        </span>
      </div>
      <pre className="m-0 overflow-x-auto py-3.5 font-(family-name:--bl-font) text-(length:--bl-size) leading-(--bl-lh) [tab-size:2]" id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${active}`} tabIndex={0}>
        <code className="block min-w-max">
          {rows.map((row, i) => {
            const mark = file?.diff ? (row.text.startsWith('+') ? 'add' : row.text.startsWith('-') ? 'del' : null) : null;
            const text = file?.diff ? row.text.replace(/^[+\- ]/, '') : row.text;
            if (row.state !== 'out') number++;
            return (
              <span
                key={row.key}
                className="group/line grid h-(--bl-lh) grid-cols-[3.2em_1.4em_auto] overflow-hidden pr-[18px] whitespace-pre data-[mark=add]:bg-[color-mix(in_srgb,var(--bl-add)_14%,transparent)] data-[mark=del]:bg-[color-mix(in_srgb,var(--bl-del)_14%,transparent)] data-[focus]:bg-[color-mix(in_srgb,var(--bl-accent)_10%,transparent)] data-[focus]:shadow-[inset_2px_0_0_var(--bl-accent)] group-data-[reveal=wait]/code:opacity-0 group-data-[reveal=run]/code:animate-[bl-code-reveal_380ms_cubic-bezier(.2,.9,.25,1)_both] group-data-[reveal=run]/code:[animation-delay:calc(var(--i)*var(--bl-stagger))] group-[:not([data-reveal=run])]/code:data-[state=out]:animate-[bl-code-out_var(--bl-out)_cubic-bezier(.4,0,.2,1)_both] group-[:not([data-reveal=run])]/code:data-[state=in]:animate-[bl-code-in_var(--bl-in)_cubic-bezier(.2,.9,.25,1)_var(--bl-out)_both] motion-reduce:group-data-[reveal]/code:animate-none! motion-reduce:group-data-[reveal]/code:opacity-100 motion-reduce:data-[state]:animate-none! motion-reduce:data-[state]:opacity-100"
                data-state={row.state === 'idle' ? undefined : row.state}
                data-mark={mark ?? undefined}
                data-focus={(row.state !== 'out' && focusLines.has(number)) || undefined}
                style={{ '--i': i }}
              >
                <span className="text-right text-(--bl-dim) select-none" aria-hidden="true">
                  {showLineNumbers && row.state !== 'out' ? number : ''}
                </span>
                <span className="text-center text-(--bl-dim) select-none group-data-[mark=add]/line:text-(--bl-add) group-data-[mark=del]/line:text-(--bl-del)" aria-hidden="true">
                  {mark === 'add' ? '+' : mark === 'del' ? '−' : ''}
                </span>
                <span className="group-data-[mark=del]/line:opacity-70">{highlight(text)}</span>
                {'\n'}
              </span>
            );
          })}
        </code>
      </pre>
    </div>
  );
}
