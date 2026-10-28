import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ElementType } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Text with a bad signal. Three ways in: "scramble" cycles each letter through noise and locks
// it in from left to right; "flap" runs every letter through a split-flap board until it lands;
// "glitch" shows the text but tears it apart in short colour-split bursts every so often. Runs
// on view, at mount, on hover or on a loop. Screen readers get the plain text once; reduced
// motion shows it settled and never glitches.

const STYLE_ID = 'bl-signal-text';
const CSS = `
.bl-signal { position: relative; margin: 0; color: var(--bl-ink); }
.bl-signal__glyphs { display: inline; }
.bl-signal__ch { white-space: pre; }
.bl-signal__ch[data-noise] { color: var(--bl-noise); }
.bl-signal[data-mode="flap"] .bl-signal__glyphs { display: inline-flex; flex-wrap: wrap; gap: var(--bl-cell-gap); }
.bl-signal[data-mode="flap"] .bl-signal__word { display: inline-flex; gap: var(--bl-cell-gap); }
.bl-signal[data-mode="flap"] .bl-signal__ch { position: relative; display: inline-grid; place-items: center; min-width: 1.05em; padding: 0.12em 0.08em; border-radius: 0.12em; background: var(--bl-cell); box-shadow: inset 0 -0.08em 0 rgba(0,0,0,0.35); line-height: 1; font-variant-numeric: tabular-nums; }
.bl-signal[data-mode="flap"] .bl-signal__ch::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: rgba(0,0,0,0.45); }
.bl-signal[data-mode="flap"] .bl-signal__ch[data-flip] { animation: bl-signal-flap var(--bl-step) steps(2) both; }
.bl-signal[data-mode="glitch"] .bl-signal__glyphs::before, .bl-signal[data-mode="glitch"] .bl-signal__glyphs::after { content: attr(data-text); position: absolute; inset: 0; opacity: 0; pointer-events: none; }
.bl-signal[data-burst] .bl-signal__glyphs::before { opacity: 0.85; color: var(--bl-split-a); animation: bl-signal-tear-a 0.32s steps(4) both; }
.bl-signal[data-burst] .bl-signal__glyphs::after { opacity: 0.85; color: var(--bl-split-b); animation: bl-signal-tear-b 0.32s steps(4) both; }
.bl-signal[data-burst] .bl-signal__glyphs { animation: bl-signal-jolt 0.32s steps(4) both; }
.bl-signal__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-signal-flap { 0% { transform: scaleY(1); } 50% { transform: scaleY(0.1); filter: brightness(1.4); } 100% { transform: scaleY(1); } }
@keyframes bl-signal-tear-a { 0% { clip-path: inset(10% 0 70% 0); transform: translate(-0.06em, 0); } 33% { clip-path: inset(55% 0 20% 0); transform: translate(0.08em, 0); } 66% { clip-path: inset(30% 0 45% 0); transform: translate(-0.04em, 0); } 100% { clip-path: inset(80% 0 5% 0); transform: translate(0.05em, 0); } }
@keyframes bl-signal-tear-b { 0% { clip-path: inset(60% 0 15% 0); transform: translate(0.06em, 0); } 33% { clip-path: inset(5% 0 75% 0); transform: translate(-0.07em, 0); } 66% { clip-path: inset(40% 0 35% 0); transform: translate(0.05em, 0); } 100% { clip-path: inset(20% 0 60% 0); transform: translate(-0.03em, 0); } }
@keyframes bl-signal-jolt { 0%, 100% { transform: none; } 25% { transform: translateX(0.03em); } 50% { transform: translateX(-0.02em) skewX(-4deg); } 75% { transform: translateX(0.01em); } }
@media (prefers-reduced-motion: reduce) { .bl-signal .bl-signal__ch, .bl-signal .bl-signal__glyphs { animation: none !important; } .bl-signal .bl-signal__glyphs::before, .bl-signal .bl-signal__glyphs::after { display: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const CHARSETS: Record<string, string> = {
  blocks: '█▓▒░▚▞▙▟▛▜■□▪▫',
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  // The split-flap drum: what a departures board can show, in order.
  board: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:!?-'
};

const pick = (set: string) => set[Math.floor(Math.random() * set.length)];

export interface SignalTextProps {
  text?: string;
  as?: ElementType;
  /** Noise that locks in left to right, a split-flap board, or colour-split tearing bursts. */
  mode?: 'scramble' | 'flap' | 'glitch';
  /** Noise characters for scramble: a preset name or your own string. */
  charset?: 'blocks' | 'alpha' | 'digits' | (string & {});
  /** How long scramble or flap takes to settle, in ms. */
  duration?: number;
  /** For trigger "loop": how often it replays (or bursts), in ms. */
  interval?: number;
  trigger?: 'view' | 'mount' | 'hover' | 'loop';
  textColor?: string;
  noiseColor?: string;
  /** The two glitch copies. */
  splitColors?: [string, string];
  /** Flap tile colour. */
  cellColor?: string;
  cellGap?: number;
  onSettled?: () => void;
  className?: string;
  style?: CSSProperties;
}

export default function SignalText({
  text = '',
  as: Tag = 'p',
  mode = 'scramble',
  charset = 'blocks',
  duration = 1200,
  interval = 3200,
  trigger = 'view',
  textColor = 'inherit',
  noiseColor = '#73eff7',
  splitColors = ['#ef7d57', '#41a6f6'],
  cellColor = '#333c57',
  cellGap = 4,
  onSettled,
  className = '',
  style
}: SignalTextProps) {
  useStyles();
  const rootRef = useRef<HTMLElement>(null);
  const settledRef = useRef(onSettled);
  settledRef.current = onSettled;
  const target = mode === 'flap' ? text.toUpperCase() : text;
  // Flap timing: the letter furthest along the drum sets the pace for every step.
  const flapSteps = Math.max(1, ...[...target].map(ch => Math.max(0, CHARSETS.board.indexOf(ch))));
  const stepMs = Math.max(30, duration / flapSteps);
  // Each letter: what it shows now, whether that's noise, and a flip counter for the flap animation.
  const [cells, setCells] = useState(() => [...target].map(ch => ({ ch, noise: false, flip: 0 })));
  const [burst, setBurst] = useState(false);
  const [run, setRun] = useState(trigger === 'mount' || trigger === 'loop' ? 1 : 0);

  // Start: on view, or again on hover.
  useEffect(() => {
    if (trigger !== 'view') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      setRun(r => r + 1);
    }, { threshold: 0.3 });
    observer.observe(rootRef.current!);
    return () => observer.disconnect();
  }, [trigger]);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const chars = [...target];
    const settle = () => {
      setCells(chars.map(ch => ({ ch, noise: false, flip: 0 })));
      settledRef.current?.();
    };
    if (!run || reduced || mode === 'glitch') {
      settle();
      return undefined;
    }
    let raf = 0;
    let timer = 0;
    let begun = 0;

    if (mode === 'scramble') {
      const set = CHARSETS[charset] ?? charset;
      const n = Math.max(1, chars.length);
      let lastFrame = 0;
      const tick = (now: number) => {
        if (!begun) begun = now;
        const t = (now - begun) / duration;
        // Re-roll the noise about 20 times a second, so it reads as flicker, not a blur.
        if (now - lastFrame > 50 || t >= 1) {
          lastFrame = now;
          setCells(chars.map((ch, i) => (t >= (i + 1) / n || ch === ' ' ? { ch, noise: false, flip: 0 } : { ch: pick(set), noise: true, flip: 0 })));
        }
        if (t < 1) raf = requestAnimationFrame(tick);
        else settledRef.current?.();
      };
      raf = requestAnimationFrame(tick);
    } else {
      // Flap: every letter steps through the drum from blank until it reaches its own letter.
      const drum = CHARSETS.board;
      const steps = chars.map(ch => Math.max(0, drum.indexOf(ch)));
      let step = 0;
      const advance = () => {
        step += 1;
        setCells(chars.map((ch, i) => {
          const at = drum.indexOf(ch) < 0 ? ch : drum[Math.min(step, steps[i])];
          return { ch: at, noise: false, flip: step <= steps[i] ? step : 0 };
        }));
        if (step < flapSteps) timer = setTimeout(advance, stepMs);
        else settledRef.current?.();
      };
      setCells(chars.map(() => ({ ch: ' ', noise: false, flip: 0 })));
      timer = setTimeout(advance, stepMs);
    }
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [run, target, mode, charset, duration, flapSteps, stepMs]);

  // Loop replays; glitch bursts on its own interval (or on hover).
  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || trigger !== 'loop') return undefined;
    const id = setInterval(() => (mode === 'glitch' ? setBurst(true) : setRun(r => r + 1)), Math.max(interval, duration + 400));
    return () => clearInterval(id);
  }, [trigger, interval, duration, mode]);

  useEffect(() => {
    if (mode !== 'glitch' || !run || trigger === 'loop' || trigger === 'hover') return undefined;
    setBurst(true);
    return undefined;
  }, [mode, run, trigger]);

  useEffect(() => {
    if (!burst) return undefined;
    const id = setTimeout(() => setBurst(false), 340);
    return () => clearTimeout(id);
  }, [burst]);

  const onPointerEnter = () => {
    if (trigger !== 'hover' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (mode === 'glitch') setBurst(true);
    else setRun(r => r + 1);
  };

  // Runs of letters and runs of spaces, by index into the target text.
  const words: { start: number; end: number; space: boolean }[] = [];
  [...target].forEach((ch, i) => {
    const space = ch === ' ';
    const prev = words[words.length - 1];
    if (prev && prev.space === space) prev.end = i + 1;
    else words.push({ start: i, end: i + 1, space });
  });

  return (
    <Tag
      ref={rootRef}
      className={`bl-signal ${className}`}
      data-mode={mode}
      data-burst={burst || undefined}
      onPointerEnter={onPointerEnter}
      style={{ '--bl-ink': textColor, '--bl-noise': noiseColor, '--bl-split-a': splitColors[0], '--bl-split-b': splitColors[1], '--bl-cell': cellColor, '--bl-cell-gap': `${cellGap}px`, '--bl-step': `${stepMs}ms`, ...style } as CSSVars}
    >
      <span className="bl-signal__sr">{text}</span>
      <span className="bl-signal__glyphs" data-text={target} aria-hidden="true">
        {words.map(({ start, end }) => (
          // Letters of a word stay together, so the flap board only wraps between words.
          <span key={start} className="bl-signal__word">
            {cells.slice(start, end).map((cell, k) => (
              <span key={`${start + k}-${cell.flip}`} className="bl-signal__ch" data-noise={cell.noise || undefined} data-flip={cell.flip ? '' : undefined}>
                {cell.ch}
              </span>
            ))}
          </span>
        ))}
      </span>
    </Tag>
  );
}
