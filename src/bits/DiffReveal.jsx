import { useEffect, useInsertionEffect, useMemo, useRef, useState } from 'react';

// Shows an AI edit landing in a piece of text. The two versions are diffed word by word;
// removed words get struck through and fold away one group at a time, then the new words
// type in with a highlight that fades once the edit is done. Plays when scrolled into view
// (or on demand), with replay and speed controls. Screen readers get the final text and a
// summary of the change; under reduced motion the final state shows straight away.

const STYLE_ID = 'bl-diff-reveal';
const CSS = `
/* theme tokens */
.bl-diff { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-chip: #262b44; --bl-ins: #38b764; --bl-del: #ef7d57; }
:where(.light, [data-theme="light"]) .bl-diff, .bl-diff:where(.light, [data-theme="light"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-chip: #ebe5d8; --bl-ins: #2b8a4a; --bl-del: #c4502a; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-diff, :where(.light, [data-theme="light"]) .bl-diff:where(.dark, [data-theme="dark"]) { --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-chip: #262b44; --bl-ins: #38b764; --bl-del: #ef7d57; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-diff, .bl-diff:where([data-theme="system"]) { --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-chip: #ebe5d8; --bl-ins: #2b8a4a; --bl-del: #c4502a; } }
/* theme tokens end */
.bl-diff { display: grid; gap: 12px; color: var(--bl-ink); font-family: var(--bl-font); }
.bl-diff__text { margin: 0; font-size: var(--bl-size); line-height: 1.65; white-space: pre-wrap; overflow-wrap: anywhere; }
.bl-diff__del { border-radius: 4px; transition: opacity 260ms, background-color 260ms; }
.bl-diff__del[data-phase="strike"] { background: color-mix(in srgb, var(--bl-del) 22%, transparent); color: var(--bl-del); text-decoration: line-through; text-decoration-thickness: 2px; }
.bl-diff__del[data-phase="gone"] { display: none; }
.bl-diff__ins { border-radius: 4px; background: color-mix(in srgb, var(--bl-ins) 24%, transparent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--bl-ins) 40%, transparent); transition: background-color 900ms, box-shadow 900ms; }
.bl-diff[data-done] .bl-diff__ins { background: color-mix(in srgb, var(--bl-ins) 10%, transparent); box-shadow: none; }
.bl-diff[data-settled] .bl-diff__ins { background: transparent; }
.bl-diff__caret { display: inline-block; width: 2px; height: 1.1em; margin-left: 1px; vertical-align: -0.15em; background: var(--bl-ins); animation: bl-diff-blink 900ms steps(1) infinite; }
.bl-diff__bar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; color: var(--bl-muted); font-size: 13px; }
.bl-diff__btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border: 0; border-radius: 999px; background: var(--bl-chip); color: var(--bl-ink); font: inherit; cursor: pointer; }
.bl-diff__btn:hover { box-shadow: 0 0 0 1px var(--bl-ins); }
.bl-diff__btn:focus-visible { outline: 2px solid var(--bl-ins); outline-offset: 2px; }
.bl-diff__btn[aria-pressed="true"] { background: color-mix(in srgb, var(--bl-ins) 22%, var(--bl-chip)); }
.bl-diff__speeds { display: inline-flex; gap: 4px; }
.bl-diff__count { margin-left: auto; font-variant-numeric: tabular-nums; }
.bl-diff__count b { font-weight: 600; }
.bl-diff__count .bl-diff__plus { color: var(--bl-ins); }
.bl-diff__count .bl-diff__minus { color: var(--bl-del); }
.bl-diff__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-diff-blink { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .bl-diff__del, .bl-diff__ins { transition: none; } .bl-diff__caret { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Word-level diff (whitespace kept as its own tokens) via longest common subsequence.
// Consecutive tokens of the same kind are merged into one op.
export function diffWords(before, after) {
  const a = before.split(/(\s+)/).filter(Boolean);
  const b = after.split(/(\s+)/).filter(Boolean);
  const ops = [];
  const push = (type, text) => {
    const last = ops[ops.length - 1];
    if (last && last.type === type) last.text += text;
    else ops.push({ type, text });
  };
  // Very long texts: skip the quadratic table and replace wholesale.
  if (a.length * b.length > 250000) {
    push('del', before);
    push('ins', after);
    return ops;
  }
  const lcs = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--) lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push('same', a[i]);
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) push('del', a[i++]);
    else push('ins', b[j++]);
  }
  while (i < a.length) push('del', a[i++]);
  while (j < b.length) push('ins', b[j++]);
  return tidy(ops);
}

// Raw word diffs interleave ("up" → "a", "the" kept…). Merge changes that are separated only
// by whitespace into one deletion followed by one insertion, so each edit reads as a phrase.
function tidy(ops) {
  const out = [];
  let del = '';
  let ins = '';
  const flush = () => {
    if (del) out.push({ type: 'del', text: del });
    if (ins) out.push({ type: 'ins', text: ins });
    del = '';
    ins = '';
  };
  ops.forEach((op, k) => {
    if (op.type === 'del') del += op.text;
    else if (op.type === 'ins') ins += op.text;
    else if ((del || ins) && /^\s+$/.test(op.text) && ops[k + 1] && ops[k + 1].type !== 'same') {
      del += op.text;
      ins += op.text;
    } else {
      flush();
      out.push(op);
    }
  });
  flush();
  return out;
}

const SPEEDS = [0.5, 1, 2];
const countWords = text => text.split(/\s+/).filter(Boolean).length;

export default function DiffReveal({
  before = '',
  after = '',
  autoPlay = true,
  threshold = 0.4,
  replayKey,
  charsPerSecond = 45,
  strikeDuration = 520,
  stagger = 220,
  showControls = true,
  onDone,
  as = 'p',
  fontSize = 18,
  textColor,
  mutedColor,
  chipColor,
  insertColor,
  deleteColor,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const ref = useRef(null);
  const ops = useMemo(() => diffWords(before, after), [before, after]);
  const [clock, setClock] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const Tag = as;

  // When each deletion strikes and folds away, and where each insertion's characters start.
  const plan = useMemo(() => {
    let d = 0;
    let c = 0;
    const steps = ops.map(op => {
      if (op.type === 'del') {
        const at = d++ * stagger;
        return { strike: at, gone: at + strikeDuration };
      }
      if (op.type === 'ins') {
        const start = c;
        c += op.text.length;
        return { start };
      }
      return null;
    });
    const typeAt = d ? (d - 1) * stagger + strikeDuration + 160 : 0;
    const total = typeAt + (c / charsPerSecond) * 1000;
    const stats = ops.reduce((s, op) => (op.type === 'same' ? s : { ...s, [op.type]: s[op.type] + countWords(op.text) }), { ins: 0, del: 0 });
    return { steps, typeAt, total, stats };
  }, [ops, stagger, strikeDuration, charsPerSecond]);

  const done = clock >= plan.total;

  // Drive the clock while playing.
  useEffect(() => {
    if (!playing) return undefined;
    let frame = 0;
    let last = performance.now();
    const tick = now => {
      const dt = (now - last) * speed;
      last = now;
      setClock(c => {
        const next = Math.min(plan.total, c + dt);
        if (next >= plan.total) setPlaying(false);
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, plan.total]);

  useEffect(() => {
    if (done && clock > 0) doneRef.current?.();
  }, [done, clock]);

  const play = () => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setClock(plan.total);
      return;
    }
    setClock(0);
    setPlaying(true);
  };

  // Start on first view (and again when the texts or replayKey change).
  useEffect(() => {
    setPlaying(false);
    setClock(0);
    if (!autoPlay) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        play();
      },
      { threshold }
    );
    io.observe(ref.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [before, after, replayKey, autoPlay]);

  const typed = Math.max(0, ((clock - plan.typeAt) / 1000) * charsPerSecond);
  const idle = clock === 0 && !playing;
  let caretPlaced = false;

  return (
    <div
      ref={ref}
      className={`bl-diff ${className}`}
      data-done={(done && clock > 0) || undefined}
      data-settled={(done && clock > 0 && !playing) || undefined}
      style={{ '--bl-size': `${fontSize}px`, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-chip': chipColor, '--bl-ins': insertColor, '--bl-del': deleteColor, '--bl-font': fontFamily, ...style }}
    >
      <Tag className="bl-diff__text" aria-hidden="true">
        {ops.map((op, i) => {
          if (op.type === 'same') return <span key={i}>{op.text}</span>;
          const step = plan.steps[i];
          if (op.type === 'del') {
            const phase = idle ? 'idle' : clock >= step.gone ? 'gone' : clock >= step.strike ? 'strike' : 'idle';
            return (
              <span key={i} className="bl-diff__del" data-phase={phase}>
                {op.text}
              </span>
            );
          }
          const shown = idle ? 0 : Math.min(op.text.length, Math.floor(typed - step.start));
          if (shown <= 0) return null;
          const caret = !caretPlaced && playing && shown < op.text.length;
          if (caret) caretPlaced = true;
          return (
            <span key={i} className="bl-diff__ins">
              {op.text.slice(0, shown)}
              {caret && <span className="bl-diff__caret" />}
            </span>
          );
        })}
      </Tag>
      <span className="bl-diff__sr">{after}</span>
      {showControls && (
        <div className="bl-diff__bar">
          <button type="button" className="bl-diff__btn" onClick={play}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {idle ? <path d="M4 2.5v9l7-4.5z" fill="currentColor" /> : <path d="M11.5 5.5A5 5 0 0 0 2.6 4.4M2.5 2v2.5H5M2.5 8.5a5 5 0 0 0 8.9 1.1" />}
            </svg>
            {idle ? 'Play edit' : 'Replay'}
          </button>
          <span className="bl-diff__speeds" role="group" aria-label="Speed">
            {SPEEDS.map(s => (
              <button key={s} type="button" className="bl-diff__btn" aria-pressed={speed === s} onClick={() => setSpeed(s)}>
                {s}×
              </button>
            ))}
          </span>
          <span className="bl-diff__count">
            <b className="bl-diff__plus">+{plan.stats.ins}</b> <b className="bl-diff__minus">−{plan.stats.del}</b> words
          </span>
        </div>
      )}
      <span className="bl-diff__sr" aria-live="polite">
        {done && clock > 0 ? `Edit applied: ${plan.stats.ins} words inserted, ${plan.stats.del} words deleted.` : ''}
      </span>
    </div>
  );
}
