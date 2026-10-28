import { useEffect, useInsertionEffect, useMemo, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Shows an AI edit landing in a piece of text. The two versions are diffed word by word;
// removed words get struck through and fold away one group at a time, then the new words
// type in with a highlight that fades once the edit is done. Plays when scrolled into view
// (or on demand), with replay and speed controls. Screen readers get the final text and a
// summary of the change; under reduced motion the final state shows straight away.

const STYLE_ID = 'bl-diff-reveal-tw';
const CSS = `
@keyframes bl-diff-blink { 50% { opacity: 0; } }
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
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  chipColor = '#262b44',
  insertColor = '#38b764',
  deleteColor = '#ef7d57',
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
      className={`group/diff grid gap-3 font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
      data-done={(done && clock > 0) || undefined}
      data-settled={(done && clock > 0 && !playing) || undefined}
      style={{ '--bl-size': `${fontSize}px`, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-chip': chipColor, '--bl-ins': insertColor, '--bl-del': deleteColor, '--bl-font': fontFamily, ...style }}
    >
      <Tag className="m-0 text-(length:--bl-size) leading-[1.65] whitespace-pre-wrap [overflow-wrap:anywhere]" aria-hidden="true">
        {ops.map((op, i) => {
          if (op.type === 'same') return <span key={i}>{op.text}</span>;
          const step = plan.steps[i];
          if (op.type === 'del') {
            const phase = idle ? 'idle' : clock >= step.gone ? 'gone' : clock >= step.strike ? 'strike' : 'idle';
            return (
              <span key={i} className="rounded-[4px] [transition:opacity_260ms,background-color_260ms] data-[phase=gone]:hidden data-[phase=strike]:bg-[color-mix(in_srgb,var(--bl-del)_22%,transparent)] data-[phase=strike]:text-(--bl-del) data-[phase=strike]:line-through data-[phase=strike]:decoration-2 motion-reduce:[transition:none]" data-phase={phase}>
                {op.text}
              </span>
            );
          }
          const shown = idle ? 0 : Math.min(op.text.length, Math.floor(typed - step.start));
          if (shown <= 0) return null;
          const caret = !caretPlaced && playing && shown < op.text.length;
          if (caret) caretPlaced = true;
          return (
            <span key={i} className="rounded-[4px] bg-[color-mix(in_srgb,var(--bl-ins)_24%,transparent)] shadow-[0_0_0_1px_color-mix(in_srgb,var(--bl-ins)_40%,transparent)] [transition:background-color_900ms,box-shadow_900ms] group-data-[done]/diff:bg-[color-mix(in_srgb,var(--bl-ins)_10%,transparent)] group-data-[done]/diff:shadow-none group-data-[settled]/diff:bg-transparent motion-reduce:[transition:none]">
              {op.text.slice(0, shown)}
              {caret && <span className="ml-px inline-block h-[1.1em] w-0.5 animate-[bl-diff-blink_900ms_steps(1)_infinite] bg-(--bl-ins) align-[-0.15em] motion-reduce:animate-none" />}
            </span>
          );
        })}
      </Tag>
      <span className="sr-only">{after}</span>
      {showControls && (
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-(--bl-muted)">
          <button type="button" className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-(--bl-chip) px-3 py-1.5 text-(--bl-ink) hover:shadow-[0_0_0_1px_var(--bl-ins)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-ins) aria-pressed:bg-[color-mix(in_srgb,var(--bl-ins)_22%,var(--bl-chip))]" onClick={play}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {idle ? <path d="M4 2.5v9l7-4.5z" fill="currentColor" /> : <path d="M11.5 5.5A5 5 0 0 0 2.6 4.4M2.5 2v2.5H5M2.5 8.5a5 5 0 0 0 8.9 1.1" />}
            </svg>
            {idle ? 'Play edit' : 'Replay'}
          </button>
          <span className="inline-flex gap-1" role="group" aria-label="Speed">
            {SPEEDS.map(s => (
              <button key={s} type="button" className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border-0 bg-(--bl-chip) px-3 py-1.5 text-(--bl-ink) hover:shadow-[0_0_0_1px_var(--bl-ins)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-ins) aria-pressed:bg-[color-mix(in_srgb,var(--bl-ins)_22%,var(--bl-chip))]" aria-pressed={speed === s} onClick={() => setSpeed(s)}>
                {s}×
              </button>
            ))}
          </span>
          <span className="ml-auto tabular-nums [&_b]:font-semibold">
            <b className="text-(--bl-ins)">+{plan.stats.ins}</b> <b className="text-(--bl-del)">−{plan.stats.del}</b> words
          </span>
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {done && clock > 0 ? `Edit applied: ${plan.stats.ins} words inserted, ${plan.stats.del} words deleted.` : ''}
      </span>
    </div>
  );
}
