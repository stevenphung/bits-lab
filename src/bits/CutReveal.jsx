import { useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

// Text that reveals line by line through vertical cuts: each rendered line is sliced into
// thin vertical strips that open like blinds while the line rises into place, one line after
// another. Lines are measured from the real layout (and re-measured when the width changes),
// so it works with any font and container. Plays when scrolled into view, or on `replayKey`.
// Under reduced motion the text is simply shown.

const STYLE_ID = 'bl-cut-reveal';
const CSS = `
@property --bl-open { syntax: '<number>'; inherits: false; initial-value: 0; }
.bl-cut { margin: 0; }
.bl-cut__line { display: block; --bl-open: 0; -webkit-mask-image: repeating-linear-gradient(var(--bl-angle), #000 0 calc(var(--bl-open) * var(--bl-slice)), transparent calc(var(--bl-open) * var(--bl-slice)) var(--bl-slice)); mask-image: repeating-linear-gradient(var(--bl-angle), #000 0 calc(var(--bl-open) * var(--bl-slice)), transparent calc(var(--bl-open) * var(--bl-slice)) var(--bl-slice)); transform: translateY(var(--bl-rise)); opacity: 0.001; }
.bl-cut[data-state="play"] .bl-cut__line { animation: bl-cut-open var(--bl-dur) cubic-bezier(.2,.9,.25,1) both; animation-delay: calc(var(--i) * var(--bl-stagger)); }
.bl-cut[data-state="done"] .bl-cut__line { -webkit-mask-image: none; mask-image: none; transform: none; opacity: 1; }
.bl-cut[data-state="measure"] .bl-cut__line { display: inline; -webkit-mask-image: none; mask-image: none; transform: none; opacity: 0; }
@keyframes bl-cut-open { to { --bl-open: 1.02; transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .bl-cut .bl-cut__line { animation: none !important; -webkit-mask-image: none; mask-image: none; transform: none; opacity: 1; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function CutReveal({
  text = '',
  as = 'p',
  slice = 14,
  direction = 'right',
  stagger = 140,
  duration = 900,
  rise = '0.35em',
  threshold = 0.3,
  replayKey,
  className = '',
  style
}) {
  useStyles();
  const ref = useRef(null);
  const words = text.split(/\s+/).filter(Boolean);
  const [lines, setLines] = useState(null);
  const [state, setState] = useState('measure');
  const width = useRef(0);
  const Tag = as;

  // Group the words into the lines the browser actually renders.
  const measure = () => {
    const node = ref.current;
    if (!node) return;
    const spans = [...node.querySelectorAll('[data-word]')];
    const grouped = [];
    let top = null;
    spans.forEach((span, i) => {
      if (top === null || Math.abs(span.offsetTop - top) > 2) {
        grouped.push([]);
        top = span.offsetTop;
      }
      grouped[grouped.length - 1].push(words[i]);
    });
    setLines(grouped.map(line => line.join(' ')));
  };

  useLayoutEffect(() => {
    setLines(null);
    setState('measure');
  }, [text, replayKey]);

  useLayoutEffect(() => {
    if (lines === null) measure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  // Re-measure when the width changes (lines re-wrap); keep the finished state.
  useEffect(() => {
    const node = ref.current;
    width.current = node.clientWidth;
    const resize = new ResizeObserver(() => {
      if (Math.abs(node.clientWidth - width.current) < 2) return;
      width.current = node.clientWidth;
      setLines(null);
    });
    resize.observe(node);
    return () => resize.disconnect();
  }, []);

  // Play once the measured text scrolls into view. A re-measure while still waiting (fonts
  // loading, a resize) must set the observer up again, so 'wait' counts too.
  useEffect(() => {
    if (lines === null || state === 'play' || state === 'done') return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setState('done');
      return undefined;
    }
    setState('wait');
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        setState('play');
      },
      { threshold }
    );
    io.observe(ref.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  // After a re-measure following a finished play, go straight back to done.
  useEffect(() => {
    if (state !== 'play' || !lines) return undefined;
    const timer = setTimeout(() => setState('done'), duration + stagger * lines.length + 50);
    return () => clearTimeout(timer);
  }, [state, lines, duration, stagger]);

  const angle = { right: '90deg', left: '270deg', down: '180deg', up: '0deg' }[direction] ?? '90deg';

  return (
    <Tag
      ref={ref}
      className={`bl-cut ${className}`}
      data-state={lines === null ? 'measure' : state === 'wait' ? 'wait' : state}
      style={{ '--bl-slice': `${slice}px`, '--bl-angle': angle, '--bl-stagger': `${stagger}ms`, '--bl-dur': `${duration}ms`, '--bl-rise': rise, ...style }}
    >
      {lines === null
        ? words.map((word, i) => (
            <span key={i} data-word="">
              {word}{' '}
            </span>
          ))
        : lines.map((line, i) => (
            <span key={`${i}-${line}`} className="bl-cut__line" style={{ '--i': i }}>
              {line}
            </span>
          ))}
    </Tag>
  );
}
