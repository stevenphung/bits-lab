import { useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

const STYLE_ID = 'bl-tracing-line-tw';
const CSS = `
/* theme tokens */
.bl-trace { --bl-from: #41a6f6; --bl-to: #73eff7; --bl-glow: rgba(115,239,247,0.35); --bl-track: rgba(148,176,194,0.22); --bl-bg: #1a1c2c; }
:where(.light, [data-theme="light"]) .bl-trace, .bl-trace:where(.light, [data-theme="light"]) { --bl-from: #2470c2; --bl-to: #167f8f; --bl-glow: rgba(22,127,143,0.35); --bl-track: rgba(86,108,134,0.22); --bl-bg: #f4f1e8; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-trace, :where(.light, [data-theme="light"]) .bl-trace:where(.dark, [data-theme="dark"]) { --bl-from: #41a6f6; --bl-to: #73eff7; --bl-glow: rgba(115,239,247,0.35); --bl-track: rgba(148,176,194,0.22); --bl-bg: #1a1c2c; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-trace, .bl-trace:where([data-theme="system"]) { --bl-from: #2470c2; --bl-to: #167f8f; --bl-glow: rgba(22,127,143,0.35); --bl-track: rgba(86,108,134,0.22); --bl-bg: #f4f1e8; } }
/* theme tokens end */
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
  fromColor,
  toColor,
  glowColor,
  trackColor,
  backgroundColor,
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
      className={`bl-trace relative pl-(--bl-gutter) ${className}`}
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
      <div className="absolute top-(--bl-start) bottom-(--bl-end) left-[calc(var(--bl-gutter)/2_-_var(--bl-w)/2)] w-(--bl-w) rounded-(--bl-w) bg-(--bl-track)" aria-hidden="true" />
      <div className="absolute top-(--bl-start) left-[calc(var(--bl-gutter)/2_-_var(--bl-w)/2)] h-(--bl-fill) w-(--bl-w) rounded-(--bl-w) bg-[linear-gradient(to_bottom,var(--bl-from),var(--bl-to))] shadow-[0_0_12px_var(--bl-glow)]" aria-hidden="true" />
      {markers.map((y, index) => (
        <span key={index} className="absolute left-[calc(var(--bl-gutter)/2)] size-(--bl-marker) rounded-(--bl-dot-radius) bg-(--bl-bg) shadow-[inset_0_0_0_2px_var(--bl-track)] [transform:translate(-50%,-50%)_scale(0.85)] transition-[box-shadow,background-color,transform] duration-250 ease-[ease] data-[passed]:bg-(--bl-to) data-[passed]:shadow-[inset_0_0_0_2px_var(--bl-to),0_0_0_4px_var(--bl-glow)] data-[passed]:[transform:translate(-50%,-50%)_scale(1)] motion-reduce:transition-none" style={{ top: y }} data-passed={index <= passed ? '' : undefined} aria-hidden="true" />
      ))}
      <div className="absolute top-[calc(var(--bl-start)_+_var(--bl-fill))] left-[calc(var(--bl-gutter)/2)] size-[calc(var(--bl-w)*4)] -translate-1/2 rounded-(--bl-dot-radius) bg-(--bl-to) opacity-(--bl-head-o) shadow-[0_0_0_4px_var(--bl-glow),0_0_22px_4px_var(--bl-glow)]" aria-hidden="true" />
      <div ref={contentRef} className="*:scroll-mt-6">
        {children}
      </div>
    </div>
  );
}
