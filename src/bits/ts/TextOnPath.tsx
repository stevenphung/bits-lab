import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Text that flows along a path: a wave, an arc, a full circle (badges, seals) or any SVG
// path you pass. It can scroll along the path forever, seamlessly, and pauses off-screen.
// The SVG scales with its container; the text is exposed to screen readers once.

const STYLE_ID = 'bl-text-on-path';
const CSS = `
.bl-tpath { display: block; width: 100%; max-width: var(--bl-w); overflow: visible; color: var(--bl-ink); font-family: var(--bl-font); }
.bl-tpath text { fill: currentColor; font-size: var(--bl-size); font-weight: var(--bl-weight); letter-spacing: var(--bl-spacing); }
.bl-tpath__guide { fill: none; stroke: var(--bl-guide); stroke-width: 1; stroke-dasharray: 3 5; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Preset paths in a 1000-unit-wide viewBox.
export type PathPreset = 'wave' | 'arc' | 'smile' | 'circle' | 'loop';

export const PATHS: Record<PathPreset, { viewBox: string; d: string }> = {
  wave: { viewBox: '0 0 1000 240', d: 'M0,140 C125,40 250,40 375,140 S625,240 750,140 S875,40 1000,120' },
  arc: { viewBox: '0 0 1000 320', d: 'M40,300 Q500,-120 960,300' },
  smile: { viewBox: '0 0 1000 300', d: 'M40,40 Q500,460 960,40' },
  circle: { viewBox: '0 0 1000 1000', d: 'M500,500 m-380,0 a380,380 0 1,1 760,0 a380,380 0 1,1 -760,0' },
  loop: { viewBox: '0 0 1000 400', d: 'M40,300 C200,300 260,60 420,60 C600,60 560,340 420,340 C280,340 360,120 600,120 C780,120 820,300 960,300' }
};

export interface TextOnPathProps {
  /** End it with a separator so the loop reads cleanly. */
  text?: string;
  /** A preset name or any SVG path data (pair custom paths with viewBox). */
  path?: PathPreset | (string & {});
  viewBox?: string;
  /** Minimum copies of the text; more are added if the path needs them. */
  repeat?: number;
  /** Scroll speed in viewBox units per second; 0 for still text. */
  speed?: number;
  direction?: 'forward' | 'reverse';
  /** Starting position along the path, in percent. */
  offset?: number;
  fontSize?: number;
  fontWeight?: number;
  letterSpacing?: number;
  /** Draw the guide path. */
  showPath?: boolean;
  pauseOnHover?: boolean;
  /** Max width, in px. */
  width?: number;
  textColor?: string;
  guideColor?: string;
  fontFamily?: string;
  /** Accessible name; defaults to the text. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

export default function TextOnPath({
  text = 'Text along a path · ',
  path = 'wave',
  viewBox,
  repeat = 3,
  speed = 40,
  direction = 'forward',
  offset = 0,
  fontSize = 42,
  fontWeight = 700,
  letterSpacing = 1,
  showPath = false,
  pauseOnHover = true,
  width = 900,
  textColor = '#f4f4f4',
  guideColor = 'rgba(255,255,255,0.18)',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  label,
  className = '',
  style
}: TextOnPathProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const preset = typeof path === 'string' && PATHS[path as PathPreset] ? PATHS[path as PathPreset] : null;
  const d = preset ? preset.d : path;
  const box = viewBox ?? preset?.viewBox ?? '0 0 1000 300';
  const svgRef = useRef<SVGSVGElement>(null);
  const textPathRef = useRef<SVGTextPathElement>(null);
  const hovering = useRef(false);
  // Copies needed to cover the path plus one copy of slack; grows after the first measure.
  const [grown, setGrown] = useState(1);
  const copies = Math.max(repeat, grown);

  useEffect(() => {
    const svg = svgRef.current;
    const textPath = textPathRef.current;
    if (!svg || !textPath) return undefined;
    textPath.setAttribute('startOffset', `${offset}%`);
    if (!speed || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const pathEl = svg.querySelector<SVGPathElement>('path[id]')!;
    const length = pathEl.getTotalLength();
    // One copy of the text, measured along the path; scrolling by exactly that keeps it seamless.
    const copy = textPath.getComputedTextLength() / copies || length;
    const needed = Math.ceil(length / copy) + 1;
    if (needed > copies) {
      setGrown(needed);
      return undefined;
    }
    let shift = 0;
    let last = performance.now();
    let frame = 0;
    let visible = true;
    const sign = direction === 'reverse' ? 1 : -1;
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!(pauseOnHover && hovering.current)) shift = (shift + speed * dt) % copy;
      textPath.setAttribute('startOffset', `${(offset / 100) * length + sign * shift + (sign < 0 ? 0 : -copy)}`);
      if (visible) frame = requestAnimationFrame(tick);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) {
        last = performance.now();
        frame = requestAnimationFrame(tick);
      } else if (!visible) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    observer.observe(svg);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [d, speed, direction, copies, offset, text, fontSize, letterSpacing, pauseOnHover]);

  // Repeat the text so a moving loop never shows a gap.
  const content = speed ? text.repeat(copies) : text;

  return (
    <svg
      ref={svgRef}
      className={`bl-tpath ${className}`}
      viewBox={box}
      role="img"
      aria-label={label ?? text.trim()}
      onPointerEnter={() => (hovering.current = true)}
      onPointerLeave={() => (hovering.current = false)}
      style={{
        '--bl-w': `${width}px`,
        '--bl-size': `${fontSize}px`,
        '--bl-weight': fontWeight,
        '--bl-spacing': `${letterSpacing}px`,
        '--bl-ink': textColor,
        '--bl-guide': guideColor,
        '--bl-font': fontFamily,
        ...style
      } as CSSVars}
    >
      <path id={`${uid}-path`} d={d} fill="none" className={showPath ? 'bl-tpath__guide' : undefined} />
      <text aria-hidden="true" dominantBaseline="middle">
        <textPath ref={textPathRef} href={`#${uid}-path`}>
          {content}
        </textPath>
      </text>
    </svg>
  );
}
