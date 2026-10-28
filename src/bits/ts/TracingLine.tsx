import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A line that draws itself down the side of the content as you scroll, with a glowing head
// and a marker beside each child that lights up once the line passes it. Use it for
// changelogs, timelines, how-it-works steps or long articles. Works with any scroll box.

const STYLE_ID = 'bl-tracing-line';
const CSS = `
.bl-trace { position: relative; padding-left: var(--bl-gutter); }
.bl-trace__track, .bl-trace__fill { position: absolute; left: calc(var(--bl-gutter) / 2 - var(--bl-w) / 2); top: var(--bl-start); width: var(--bl-w); border-radius: var(--bl-w); }
.bl-trace__track { bottom: var(--bl-end); background: var(--bl-track); }
.bl-trace__fill { height: var(--bl-fill); background: linear-gradient(to bottom, var(--bl-from), var(--bl-to)); box-shadow: 0 0 12px var(--bl-glow); }
.bl-trace__head { position: absolute; left: calc(var(--bl-gutter) / 2); top: calc(var(--bl-start) + var(--bl-fill)); width: calc(var(--bl-w) * 4); height: calc(var(--bl-w) * 4); border-radius: var(--bl-dot-radius); background: var(--bl-to); box-shadow: 0 0 0 4px var(--bl-glow), 0 0 22px 4px var(--bl-glow); transform: translate(-50%, -50%); opacity: var(--bl-head-o); }
.bl-trace__marker { position: absolute; left: calc(var(--bl-gutter) / 2); width: var(--bl-marker); height: var(--bl-marker); border-radius: var(--bl-dot-radius); background: var(--bl-bg); box-shadow: inset 0 0 0 2px var(--bl-track); transform: translate(-50%, -50%) scale(0.85); transition: box-shadow 250ms, background-color 250ms, transform 250ms; }
.bl-trace__marker[data-passed] { background: var(--bl-to); box-shadow: inset 0 0 0 2px var(--bl-to), 0 0 0 4px var(--bl-glow); transform: translate(-50%, -50%) scale(1); }
.bl-trace__content > * { scroll-margin-top: 24px; }
@media (prefers-reduced-motion: reduce) { .bl-trace__marker { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

function scrollParent(node: HTMLElement | null): HTMLElement | Window {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    if (/(auto|scroll|overlay)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) return el;
  }
  return window;
}

export interface TracingLineProps {
  /** Entries. Each direct child gets a marker. */
  children?: ReactNode;
  /** Width of the left gutter holding the line, in px. */
  gutter?: number;
  lineWidth?: number;
  markerSize?: number;
  /** Marker position below each child's top, in px. */
  markerOffset?: number;
  /** Square markers and head, for a pixel look. */
  square?: boolean;
  /** Viewport position (0 top, 1 bottom) the line draws down to. */
  activeLine?: number;
  fromColor?: string;
  toColor?: string;
  glowColor?: string;
  trackColor?: string;
  /** Fill of markers the line hasn't reached yet. */
  backgroundColor?: string;
  className?: string;
  style?: CSSProperties;
}

export default function TracingLine({
  children,
  gutter = 56,
  lineWidth = 3,
  markerSize = 14,
  markerOffset = 14,
  square = false,
  activeLine = 0.55,
  fromColor = '#41a6f6',
  toColor = '#73eff7',
  glowColor = 'rgba(115,239,247,0.35)',
  trackColor = 'rgba(148,176,194,0.22)',
  backgroundColor = '#1a1c2c',
  className = '',
  style
}: TracingLineProps) {
  useStyles();
  const rootRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [markers, setMarkers] = useState<number[]>([]);
  const [passed, setPassed] = useState(-1);

  useEffect(() => {
    const root = rootRef.current!;
    const content = contentRef.current!;
    const scroller = scrollParent(root);
    let frame = 0;
    let positions: number[] = [];
    let lastPassed = -2;

    const measure = () => {
      positions = [...content.children].map(child => (child as HTMLElement).offsetTop + markerOffset);
      setMarkers(prev => (prev.length === positions.length && prev.every((y, i) => y === positions[i]) ? prev : positions));
      const first = positions[0] ?? 0;
      const last = positions[positions.length - 1] ?? root.offsetHeight;
      root.style.setProperty('--bl-start', `${first}px`);
      root.style.setProperty('--bl-end', `${root.offsetHeight - last}px`);
    };

    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const viewTop = scroller === window ? 0 : (scroller as HTMLElement).getBoundingClientRect().top;
      const viewHeight = scroller === window ? window.innerHeight : (scroller as HTMLElement).clientHeight;
      const line = viewTop + viewHeight * activeLine - rect.top;
      const first = positions[0] ?? 0;
      const last = positions[positions.length - 1] ?? rect.height;
      const fill = Math.min(last - first, Math.max(0, line - first));
      root.style.setProperty('--bl-fill', `${fill}px`);
      root.style.setProperty('--bl-head-o', fill > 0 && fill < last - first ? '1' : '0');
      let count = -1;
      positions.forEach((y, i) => {
        if (y <= first + fill + 0.5) count = i;
      });
      if (count !== lastPassed) {
        lastPassed = count;
        setPassed(count);
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const observer = new ResizeObserver(() => {
      measure();
      schedule();
    });
    observer.observe(content);
    [...content.children].forEach(child => observer.observe(child));
    measure();
    update();
    scroller.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      scroller.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [activeLine, markerOffset, children]);

  return (
    <div
      ref={rootRef}
      className={`bl-trace ${className}`}
      style={{
        '--bl-gutter': `${gutter}px`,
        '--bl-w': `${lineWidth}px`,
        '--bl-marker': `${markerSize}px`,
        '--bl-dot-radius': square ? '0' : '50%',
        '--bl-from': fromColor,
        '--bl-to': toColor,
        '--bl-glow': glowColor,
        '--bl-track': trackColor,
        '--bl-bg': backgroundColor,
        '--bl-start': '0px',
        '--bl-end': '0px',
        '--bl-fill': '0px',
        '--bl-head-o': 0,
        ...style
      } as CSSVars}
    >
      <div className="bl-trace__track" aria-hidden="true" />
      <div className="bl-trace__fill" aria-hidden="true" />
      {markers.map((y, index) => (
        <span key={index} className="bl-trace__marker" style={{ top: y }} data-passed={index <= passed ? '' : undefined} aria-hidden="true" />
      ))}
      <div className="bl-trace__head" aria-hidden="true" />
      <div ref={contentRef} className="bl-trace__content">
        {children}
      </div>
    </div>
  );
}
