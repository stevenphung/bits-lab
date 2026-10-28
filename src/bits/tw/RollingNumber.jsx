import { useEffect, useInsertionEffect, useMemo, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Odometer number. Each digit is its own column that rolls to the new value, with columns
// keyed from the right so units stay units when the number grows. Formatting comes from
// Intl.NumberFormat (currency, percent, compact, any locale). The visual digits are hidden
// from screen readers; the formatted value is exposed as text instead.

const STYLE_ID = 'bl-rolling-number-tw';
const CSS = `
@keyframes bl-rn-in { from { opacity: 0; transform: translateY(40%); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Splits a formatted number into tokens keyed from the right, so the ones column keeps its
// key (and its DOM node) whatever happens on the left.
function tokenize(text) {
  const chars = [...text];
  let digitIndex = 0;
  let symbolIndex = 0;
  const tokens = [];
  for (let i = chars.length - 1; i >= 0; i--) {
    const char = chars[i];
    if (char >= '0' && char <= '9') tokens.unshift({ key: `d${digitIndex++}`, digit: Number(char), char });
    else tokens.unshift({ key: `s${symbolIndex++}-${char}`, char });
  }
  return tokens;
}

export default function RollingNumber({
  value = 0,
  from,
  locale,
  format,
  prefix = '',
  suffix = '',
  duration = 900,
  stagger = 40,
  startOnView = true,
  announce = false,
  lineHeight = 1.1,
  color,
  className = '',
  style
}) {
  useStyles();
  const ref = useRef(null);
  const [shown, setShown] = useState(from ?? value);
  const [started, setStarted] = useState(!startOnView || from === undefined);
  const mounted = useRef(false);

  // Wait until visible before rolling away from `from` (if given).
  useEffect(() => {
    if (started) return undefined;
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setStarted(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setStarted(true), { threshold: 0.3 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return undefined;
    // A short timeout (not a frame) so the starting digits paint first, even in a background tab.
    const timer = setTimeout(() => setShown(value), mounted.current ? 0 : 30);
    mounted.current = true;
    return () => clearTimeout(timer);
  }, [value, started]);

  const formatter = useMemo(() => new Intl.NumberFormat(locale, format), [locale, JSON.stringify(format)]); // eslint-disable-line react-hooks/exhaustive-deps
  const text = `${prefix}${formatter.format(shown)}${suffix}`;
  const tokens = tokenize(text);
  const known = useRef(new Set());

  const rendered = tokens.map(token => {
    const entering = mounted.current && !known.current.has(token.key);
    return { ...token, entering };
  });
  useEffect(() => {
    known.current = new Set(tokens.map(token => token.key));
  });

  let digitOrder = 0;
  return (
    <span
      ref={ref}
      className={`relative inline-flex items-baseline leading-(--bl-lh) whitespace-nowrap text-(--bl-ink) tabular-nums ${className}`}
      style={{ '--bl-lh': lineHeight, '--bl-dur': `${duration}ms`, '--bl-ease': 'cubic-bezier(.2,.9,.25,1)', ...(color ? { '--bl-ink': color } : { '--bl-ink': 'currentColor' }), ...style }}
    >
      <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'baseline' }}>
        {rendered.map(token => {
          if (token.digit === undefined) {
            return (
              <span key={token.key} className="inline-block data-[enter]:animate-[bl-rn-in_var(--bl-dur)_var(--bl-ease)] motion-reduce:data-[enter]:animate-none" data-enter={token.entering || undefined}>
                {token.char}
              </span>
            );
          }
          // Left-most digits move first, rippling toward the ones column.
          const delay = digitOrder++ * stagger;
          return (
            <span key={token.key} className="relative inline-block h-[calc(var(--bl-lh)*1em)] overflow-hidden data-[enter]:animate-[bl-rn-in_var(--bl-dur)_var(--bl-ease)] motion-reduce:data-[enter]:animate-none" data-enter={token.entering || undefined}>
              <span className="flex flex-col [transform:translateY(calc(var(--bl-digit)*-10%))] [transition:transform_var(--bl-dur)_var(--bl-ease)_var(--bl-delay)] motion-reduce:[transition:none] *:block *:h-[calc(var(--bl-lh)*1em)] *:text-center" style={{ '--bl-digit': token.digit, '--bl-delay': `${delay}ms` }}>
                {DIGITS.map(d => (
                  <span key={d}>{d}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
      <span className="sr-only" aria-live={announce ? 'polite' : undefined}>
        {`${prefix}${formatter.format(value)}${suffix}`}
      </span>
    </span>
  );
}
