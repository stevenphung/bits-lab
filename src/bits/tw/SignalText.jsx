import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Text with a bad signal. Three ways in: "scramble" cycles each letter through noise and locks
// it in from left to right; "flap" runs every letter through a split-flap board until it lands;
// "glitch" shows the text but tears it apart in short colour-split bursts every so often. Runs
// on view, at mount, on hover or on a loop. Screen readers get the plain text once; reduced
// motion shows it settled and never glitches.

const STYLE_ID = 'bl-signal-text-tw';
const CSS = `
@keyframes bl-signal-flap { 0% { transform: scaleY(1); } 50% { transform: scaleY(0.1); filter: brightness(1.4); } 100% { transform: scaleY(1); } }
@keyframes bl-signal-tear-a { 0% { clip-path: inset(10% 0 70% 0); transform: translate(-0.06em, 0); } 33% { clip-path: inset(55% 0 20% 0); transform: translate(0.08em, 0); } 66% { clip-path: inset(30% 0 45% 0); transform: translate(-0.04em, 0); } 100% { clip-path: inset(80% 0 5% 0); transform: translate(0.05em, 0); } }
@keyframes bl-signal-tear-b { 0% { clip-path: inset(60% 0 15% 0); transform: translate(0.06em, 0); } 33% { clip-path: inset(5% 0 75% 0); transform: translate(-0.07em, 0); } 66% { clip-path: inset(40% 0 35% 0); transform: translate(0.05em, 0); } 100% { clip-path: inset(20% 0 60% 0); transform: translate(-0.03em, 0); } }
@keyframes bl-signal-jolt { 0%, 100% { transform: none; } 25% { transform: translateX(0.03em); } 50% { transform: translateX(-0.02em) skewX(-4deg); } 75% { transform: translateX(0.01em); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const CHARSETS = {
  blocks: '█▓▒░▚▞▙▟▛▜■□▪▫',
  alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  // The split-flap drum: what a departures board can show, in order.
  board: ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:!?-'
};

const pick = set => set[Math.floor(Math.random() * set.length)];

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
}) {
  useStyles();
  const rootRef = useRef(null);
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
    observer.observe(rootRef.current);
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
      const tick = now => {
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
  const words = [];
  [...target].forEach((ch, i) => {
    const space = ch === ' ';
    const prev = words[words.length - 1];
    if (prev && prev.space === space) prev.end = i + 1;
    else words.push({ start: i, end: i + 1, space });
  });

  return (
    <Tag
      ref={rootRef}
      className={`group/sig relative m-0 text-(--bl-ink) ${className}`}
      data-mode={mode}
      data-burst={burst || undefined}
      onPointerEnter={onPointerEnter}
      style={{ '--bl-ink': textColor, '--bl-noise': noiseColor, '--bl-split-a': splitColors[0], '--bl-split-b': splitColors[1], '--bl-cell': cellColor, '--bl-cell-gap': `${cellGap}px`, '--bl-step': `${stepMs}ms`, ...style }}
    >
      <span className="sr-only">{text}</span>
      <span className="inline group-data-[mode=flap]/sig:inline-flex group-data-[mode=flap]/sig:flex-wrap group-data-[mode=flap]/sig:gap-(--bl-cell-gap) group-data-[mode=glitch]/sig:before:pointer-events-none group-data-[mode=glitch]/sig:before:absolute group-data-[mode=glitch]/sig:before:inset-0 group-data-[mode=glitch]/sig:before:opacity-0 group-data-[mode=glitch]/sig:before:content-[attr(data-text)] group-data-[mode=glitch]/sig:after:pointer-events-none group-data-[mode=glitch]/sig:after:absolute group-data-[mode=glitch]/sig:after:inset-0 group-data-[mode=glitch]/sig:after:opacity-0 group-data-[mode=glitch]/sig:after:content-[attr(data-text)] group-[[data-mode=glitch][data-burst]]/sig:animate-[bl-signal-jolt_0.32s_steps(4)_both] group-[[data-mode=glitch][data-burst]]/sig:before:animate-[bl-signal-tear-a_0.32s_steps(4)_both] group-[[data-mode=glitch][data-burst]]/sig:before:text-(--bl-split-a) group-[[data-mode=glitch][data-burst]]/sig:before:opacity-85 group-[[data-mode=glitch][data-burst]]/sig:after:animate-[bl-signal-tear-b_0.32s_steps(4)_both] group-[[data-mode=glitch][data-burst]]/sig:after:text-(--bl-split-b) group-[[data-mode=glitch][data-burst]]/sig:after:opacity-85 motion-reduce:animate-none! motion-reduce:before:hidden motion-reduce:after:hidden" data-text={target} aria-hidden="true">
        {words.map(({ start, end }) => (
          // Letters of a word stay together, so the flap board only wraps between words.
          <span key={start} className="group-data-[mode=flap]/sig:inline-flex group-data-[mode=flap]/sig:gap-(--bl-cell-gap)">
            {cells.slice(start, end).map((cell, k) => (
              <span key={`${start + k}-${cell.flip}`} className="whitespace-pre data-[noise]:text-(--bl-noise) group-data-[mode=flap]/sig:relative group-data-[mode=flap]/sig:inline-grid group-data-[mode=flap]/sig:min-w-[1.05em] group-data-[mode=flap]/sig:place-items-center group-data-[mode=flap]/sig:rounded-[0.12em] group-data-[mode=flap]/sig:bg-(--bl-cell) group-data-[mode=flap]/sig:px-[0.08em] group-data-[mode=flap]/sig:py-[0.12em] group-data-[mode=flap]/sig:leading-none group-data-[mode=flap]/sig:tabular-nums group-data-[mode=flap]/sig:shadow-[inset_0_-0.08em_0_rgba(0,0,0,0.35)] group-data-[mode=flap]/sig:after:absolute group-data-[mode=flap]/sig:after:inset-x-0 group-data-[mode=flap]/sig:after:top-1/2 group-data-[mode=flap]/sig:after:h-px group-data-[mode=flap]/sig:after:bg-[rgba(0,0,0,0.45)] group-data-[mode=flap]/sig:after:content-[''] group-data-[mode=flap]/sig:data-[flip]:animate-[bl-signal-flap_var(--bl-step)_steps(2)_both] motion-reduce:animate-none!" data-noise={cell.noise || undefined} data-flip={cell.flip ? '' : undefined}>
                {cell.ch}
              </span>
            ))}
          </span>
        ))}
      </span>
    </Tag>
  );
}
