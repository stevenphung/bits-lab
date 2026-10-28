import { useEffect, useInsertionEffect, useMemo, useRef, useState } from 'react';

// Retro BIOS boot screen. A header, then POST checks that type out line by line with
// [ OK ] / [WARN] / [FAIL] tags, a memory counter that ticks up, optional beeps, and finally
// a CRT-style reveal of whatever you pass as children. Click or press any key to skip.
// Screen readers hear each finished line once (never every keystroke), and reduced motion
// shows the finished screen straight away.

const STYLE_ID = 'bl-boot-sequence';
const CSS = `
.bl-boot { position: relative; width: 100%; height: 100%; min-height: var(--bl-min-h); overflow: hidden; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); font-size: var(--bl-size); line-height: 1.6; }
.bl-boot[data-skippable] { cursor: pointer; }
.bl-boot__screen { position: absolute; inset: 0; padding: 18px 20px 40px; overflow: hidden; }
.bl-boot__screen[data-off] { animation: bl-boot-off 420ms steps(6) forwards; }
.bl-boot__line { display: flex; gap: 1ch; min-height: 1.6em; white-space: pre-wrap; overflow-wrap: anywhere; }
.bl-boot__text { flex: 1; min-width: 0; }
.bl-boot__head { margin-bottom: 0.8em; color: var(--bl-accent); }
.bl-boot__tag { flex: 0 0 auto; white-space: pre; }
.bl-boot__tag[data-status="ok"] { color: var(--bl-ok); }
.bl-boot__tag[data-status="warn"] { color: var(--bl-warn); }
.bl-boot__tag[data-status="fail"] { color: var(--bl-fail); }
.bl-boot__cursor { display: inline-block; width: 0.6em; height: 1.1em; margin-left: 1px; vertical-align: text-bottom; background: currentColor; animation: bl-boot-blink 1s steps(1) infinite; }
.bl-boot__hint { position: absolute; right: 16px; bottom: 12px; left: 16px; color: var(--bl-muted); font-size: 0.8em; text-align: right; animation: bl-boot-blink 1.6s steps(1) infinite; }
.bl-boot__reveal { position: absolute; inset: 0; animation: bl-boot-on 520ms steps(8) both; }
.bl-boot__scan { position: absolute; inset: 0; pointer-events: none; background: repeating-linear-gradient(to bottom, transparent 0 2px, rgba(0,0,0,0.2) 2px 3px); }
.bl-boot__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.bl-boot__skip { position: absolute; top: 8px; right: 8px; padding: 6px 10px; border: 1px solid var(--bl-muted); background: var(--bl-bg); color: var(--bl-ink); font: inherit; font-size: 0.8em; opacity: 0; pointer-events: none; }
.bl-boot__skip:focus-visible { opacity: 1; pointer-events: auto; outline: 2px solid var(--bl-accent); }
@keyframes bl-boot-blink { 50% { opacity: 0; } }
@keyframes bl-boot-off { 60% { transform: scaleY(0.04); filter: brightness(2.5); opacity: 1; } 100% { transform: scale(0, 0.04); opacity: 0; } }
@keyframes bl-boot-on { from { clip-path: inset(50% 0 50% 0); filter: brightness(2.2); } to { clip-path: inset(0 0 0 0); filter: none; } }
@media (prefers-reduced-motion: reduce) {
  .bl-boot__cursor, .bl-boot__hint { animation: none; }
  .bl-boot__screen[data-off], .bl-boot__reveal { animation: none; }
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
      className={`bl-boot ${className}`}
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
          className="bl-boot__screen"
          data-off={phase === 'off' || undefined}
          aria-hidden="true"
          onAnimationEnd={event => {
            if (event.target === event.currentTarget) setPhase('revealed');
          }}
        >
          {header.length > 0 && (
            <div className="bl-boot__head">
              {header.map((line, i) => (
                <div key={i} className="bl-boot__line">
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
              <div key={i} className="bl-boot__line">
                <span className="bl-boot__text">
                  {item.text.slice(0, chars)}
                  {count}
                  {i === active && !done && <span className="bl-boot__cursor" />}
                </span>
                {tag && (
                  <span className="bl-boot__tag" data-status={tag}>
                    {TAGS[tag]}
                  </span>
                )}
              </div>
            );
          })}
          {done && (
            <div className="bl-boot__line">
              <span className="bl-boot__cursor" />
            </div>
          )}
          {skippable && !done && hint && <div className="bl-boot__hint">{hint}</div>}
        </div>
      )}
      {phase === 'revealed' && <div className="bl-boot__reveal">{children}</div>}
      {scanlines && <div className="bl-boot__scan" aria-hidden="true" />}
      {skippable && !done && (
        <button type="button" className="bl-boot__skip" onClick={skip}>
          Skip boot sequence
        </button>
      )}
      <div className="bl-boot__sr" role="log" aria-live="polite">
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
