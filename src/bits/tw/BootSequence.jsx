import { useEffect, useInsertionEffect, useMemo, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Retro BIOS boot screen. A header, then POST checks that type out line by line with
// [ OK ] / [WARN] / [FAIL] tags, a memory counter that ticks up, optional beeps, and finally
// a CRT-style reveal of whatever you pass as children. Click or press any key to skip.
// Screen readers hear each finished line once (never every keystroke), and reduced motion
// shows the finished screen straight away.

const STYLE_ID = 'bl-boot-sequence-tw';
const CSS = `
@keyframes bl-boot-blink { 50% { opacity: 0; } }
@keyframes bl-boot-off { 60% { transform: scaleY(0.04); filter: brightness(2.5); opacity: 1; } 100% { transform: scale(0, 0.04); opacity: 0; } }
@keyframes bl-boot-on { from { clip-path: inset(50% 0 50% 0); filter: brightness(2.2); } to { clip-path: inset(0 0 0 0); filter: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const TAGS = { ok: '[  OK  ]', warn: '[ WARN ]', fail: '[ FAIL ]' };

const DEFAULT_LINES = [
  { text: 'Detecting CPU... PX-8 @ 4.77 MHz', status: 'ok' },
  { text: 'Memory test:', count: 640, unit: 'K', status: 'ok' },
  { text: 'Video adapter... 16-color palette', status: 'ok' },
  { text: 'Sound chip... square, saw, noise', status: 'ok' },
  { text: 'Cartridge slot... empty', status: 'warn' },
  { text: 'Loading BITS.SYS', status: 'ok' },
  'Starting shell...'
];

let audio = null;
function beepOnce(frequency, seconds) {
  try {
    audio ??= new AudioContext();
    if (audio.state === 'suspended') audio.resume();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    osc.type = 'square';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0, now + seconds);
    osc.connect(gain).connect(audio.destination);
    osc.start(now);
    osc.stop(now + seconds);
  } catch {
    // No audio available (or not allowed yet); stay silent.
  }
}

export default function BootSequence({
  header = ['BITS LAB BIOS v1.0', '(C) 2026 Bits Lab. All rights reserved.'],
  lines = DEFAULT_LINES,
  speed = 70,
  lineDelay = 160,
  countDuration = 900,
  holdAfter = 700,
  skippable = true,
  beep = false,
  replayKey,
  onComplete,
  children,
  minHeight = 320,
  fontSize = 14,
  backgroundColor = '#0b0b14',
  textColor = '#94b0c2',
  accentColor = '#f4f4f4',
  okColor = '#a7f070',
  warnColor = '#ffcd75',
  failColor = '#ef7d57',
  mutedColor = '#566c86',
  scanlines = true,
  hint = 'Click or press any key to skip',
  label = 'System boot',
  fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  className = '',
  style
}) {
  useStyles();
  // Lay the lines out on one timeline: type, then count, then show the tag, then pause.
  const timeline = useMemo(() => {
    let t = 0;
    const items = lines.map(entry => {
      const line = typeof entry === 'string' ? { text: entry } : entry;
      const start = t;
      const typeEnd = start + (line.text.length / speed) * 1000;
      const countEnd = typeEnd + (line.count != null ? countDuration : 0);
      t = countEnd + (line.delay ?? lineDelay);
      return { ...line, start, typeEnd, countEnd };
    });
    return { items, total: t + holdAfter };
  }, [lines, speed, lineDelay, countDuration, holdAfter]);

  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState('boot');
  const startRef = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setPhase('boot');
    setElapsed(0);
    startRef.current = reduced ? -Infinity : performance.now();
    let frame = 0;
    const tick = now => {
      const t = Math.min(timeline.total, now - startRef.current);
      setElapsed(t);
      if (t < timeline.total) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [timeline, replayKey]);

  const done = elapsed >= timeline.total;
  const skip = () => {
    startRef.current = -Infinity;
  };

  // "Press any key": listen on the window while booting, but leave typing elsewhere alone.
  useEffect(() => {
    if (!skippable || done) return undefined;
    const onKey = event => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.key === 'Tab' || event.key === 'Shift') return;
      const el = event.target;
      if (el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      skip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [skippable, done]);

  const tagsShown = timeline.items.filter(item => item.status && elapsed >= item.countEnd).length;
  const beeped = useRef(0);
  useEffect(() => {
    if (tagsShown < beeped.current) beeped.current = 0;
    if (beep && tagsShown > beeped.current) {
      const latest = timeline.items.filter(item => item.status)[tagsShown - 1];
      beepOnce(latest?.status === 'fail' ? 220 : 1320, 0.04);
    }
    beeped.current = tagsShown;
  }, [tagsShown, beep, timeline]);

  const completed = useRef(onComplete);
  completed.current = onComplete;
  useEffect(() => {
    if (!done) return;
    if (beep) beepOnce(988, 0.2);
    completed.current?.();
    if (children) setPhase(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'revealed' : 'off');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  let active = -1;
  timeline.items.forEach((item, i) => {
    if (elapsed >= item.start) active = i;
  });
  const finished = timeline.items.filter(item => elapsed >= item.countEnd);

  return (
    <div
      className={`relative h-full min-h-(--bl-min-h) w-full overflow-hidden bg-(--bl-bg) font-(family-name:--bl-font) text-(length:--bl-size) leading-[1.6] text-(--bl-ink) data-[skippable]:cursor-pointer ${className}`}
      role="region"
      aria-label={label}
      data-skippable={(skippable && !done) || undefined}
      onClick={skippable && !done ? skip : undefined}
      style={{
        '--bl-min-h': `${minHeight}px`,
        '--bl-size': `${fontSize}px`,
        '--bl-bg': backgroundColor,
        '--bl-ink': textColor,
        '--bl-accent': accentColor,
        '--bl-ok': okColor,
        '--bl-warn': warnColor,
        '--bl-fail': failColor,
        '--bl-muted': mutedColor,
        '--bl-font': fontFamily,
        ...style
      }}
    >
      {phase !== 'revealed' && (
        <div
          className="absolute inset-0 overflow-hidden px-5 pt-[18px] pb-10 data-[off]:animate-[bl-boot-off_420ms_steps(6)_forwards] motion-reduce:data-[off]:animate-none"
          data-off={phase === 'off' || undefined}
          aria-hidden="true"
          onAnimationEnd={event => {
            if (event.target === event.currentTarget) setPhase('revealed');
          }}
        >
          {header.length > 0 && (
            <div className="mb-[0.8em] text-(--bl-accent)">
              {header.map((line, i) => (
                <div key={i} className="flex min-h-[1.6em] gap-[1ch] whitespace-pre-wrap [overflow-wrap:anywhere]">
                  {line}
                </div>
              ))}
            </div>
          )}
          {timeline.items.map((item, i) => {
            if (elapsed < item.start) return null;
            const chars = Math.min(item.text.length, Math.floor(((elapsed - item.start) / 1000) * speed));
            let count = '';
            if (item.count != null && elapsed >= item.typeEnd) {
              const progress = Math.min(1, (elapsed - item.typeEnd) / countDuration);
              count = ` ${Math.round(item.count * progress)}${item.unit ?? ''}`;
            }
            const tag = item.status && elapsed >= item.countEnd ? item.status : null;
            return (
              <div key={i} className="flex min-h-[1.6em] gap-[1ch] whitespace-pre-wrap [overflow-wrap:anywhere]">
                <span className="min-w-0 flex-1">
                  {item.text.slice(0, chars)}
                  {count}
                  {i === active && !done && <span className="ml-px inline-block h-[1.1em] w-[0.6em] animate-[bl-boot-blink_1s_steps(1)_infinite] bg-current align-text-bottom motion-reduce:animate-none" />}
                </span>
                {tag && (
                  <span className="flex-none whitespace-pre data-[status=fail]:text-(--bl-fail) data-[status=ok]:text-(--bl-ok) data-[status=warn]:text-(--bl-warn)" data-status={tag}>
                    {TAGS[tag]}
                  </span>
                )}
              </div>
            );
          })}
          {done && (
            <div className="flex min-h-[1.6em] gap-[1ch] whitespace-pre-wrap [overflow-wrap:anywhere]">
              <span className="ml-px inline-block h-[1.1em] w-[0.6em] animate-[bl-boot-blink_1s_steps(1)_infinite] bg-current align-text-bottom motion-reduce:animate-none" />
            </div>
          )}
          {skippable && !done && hint && <div className="absolute right-4 bottom-3 left-4 animate-[bl-boot-blink_1.6s_steps(1)_infinite] text-right text-[0.8em] text-(--bl-muted) motion-reduce:animate-none">{hint}</div>}
        </div>
      )}
      {phase === 'revealed' && <div className="absolute inset-0 animate-[bl-boot-on_520ms_steps(8)_both] motion-reduce:animate-none">{children}</div>}
      {scanlines && <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(to_bottom,transparent_0_2px,rgba(0,0,0,0.2)_2px_3px)]" aria-hidden="true" />}
      {skippable && !done && (
        <button type="button" className="pointer-events-none absolute top-2 right-2 border border-solid border-(--bl-muted) bg-(--bl-bg) px-2.5 py-1.5 text-[0.8em] text-(--bl-ink) opacity-0 focus-visible:pointer-events-auto focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" onClick={skip}>
          Skip boot sequence
        </button>
      )}
      <div className="sr-only" role="log" aria-live="polite">
        {finished.map((item, i) => (
          <div key={i}>
            {item.text}
            {item.count != null ? ` ${item.count}${item.unit ?? ''}` : ''}
            {item.status ? ` ${item.status.toUpperCase()}` : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
