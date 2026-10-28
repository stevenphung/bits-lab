import { useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

// Hand-drawn annotations for inline text: underline, highlight, strike-through, box, circle,
// brackets or a cross. Strokes wobble like a pen (seeded, so they don't change between
// renders), follow wrapped lines for underline / highlight / strike, and draw themselves
// when scrolled into view. Purely decorative: the text itself is untouched.

const STYLE_ID = 'bl-sketch';
const CSS = `
.bl-sketch { position: relative; }
.bl-sketch__svg { position: absolute; left: 0; top: 0; width: 1px; height: 1px; overflow: visible; pointer-events: none; z-index: 0; }
.bl-sketch[data-type="highlight"] .bl-sketch__svg { z-index: -1; }
.bl-sketch[data-type="highlight"] { isolation: isolate; }
.bl-sketch__svg path { fill: none; stroke-linecap: round; stroke-linejoin: round; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Small deterministic PRNG so a given annotation always gets the same wobble.
function seeded(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const hash = text => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

// A slightly bowed line with jittered ends.
function roughLine(x1, y1, x2, y2, rand, roughness) {
  const j = () => (rand() - 0.5) * roughness;
  const mx = (x1 + x2) / 2 + j() * 2;
  const my = (y1 + y2) / 2 + j() * 2;
  return `M${(x1 + j()).toFixed(1)},${(y1 + j()).toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${(x2 + j()).toFixed(1)},${(y2 + j()).toFixed(1)}`;
}

// An ellipse drawn in one stroke that overshoots its start, like a quick pen loop.
function roughEllipse(cx, cy, rx, ry, rand, roughness) {
  const points = [];
  const start = rand() * Math.PI * 2;
  const sweep = Math.PI * 2 * (1.08 + rand() * 0.1);
  const steps = 28;
  for (let i = 0; i <= steps; i++) {
    const a = start + (i / steps) * sweep;
    const wobble = 1 + (rand() - 0.5) * (roughness / Math.max(rx, ry));
    points.push([cx + Math.cos(a) * rx * wobble, cy + Math.sin(a) * ry * wobble]);
  }
  let d = `M${points[0][0].toFixed(1)},${points[0][1].toFixed(1)}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    d += ` Q${x.toFixed(1)},${y.toFixed(1)} ${((x + nx) / 2).toFixed(1)},${((y + ny) / 2).toFixed(1)}`;
  }
  return d;
}

function buildPaths(type, lines, box, { padding, iterations, roughness, seed }) {
  const rand = seeded(seed);
  const paths = [];
  const pass = n => Array.from({ length: n }, (_, i) => i);
  if (type === 'underline' || type === 'strike' || type === 'highlight') {
    for (const r of lines) {
      const y = type === 'underline' ? r.y + r.h + 2 : type === 'strike' ? r.y + r.h * 0.55 : r.y + r.h / 2;
      for (const i of pass(type === 'highlight' ? 1 : iterations)) paths.push(roughLine(r.x - padding, y + i * 1.5, r.x + r.w + padding, y - i, rand, roughness));
    }
  } else if (type === 'box') {
    const x1 = box.x - padding;
    const y1 = box.y - padding;
    const x2 = box.x + box.w + padding;
    const y2 = box.y + box.h + padding;
    for (let i = 0; i < iterations; i++) paths.push(roughLine(x1, y1, x2, y1, rand, roughness), roughLine(x2, y1, x2, y2, rand, roughness), roughLine(x2, y2, x1, y2, rand, roughness), roughLine(x1, y2, x1, y1, rand, roughness));
  } else if (type === 'circle') {
    for (let i = 0; i < iterations; i++) paths.push(roughEllipse(box.x + box.w / 2, box.y + box.h / 2, box.w / 2 + padding * 1.6, box.h / 2 + padding * 1.2, rand, roughness * 2));
  } else if (type === 'bracket') {
    const x1 = box.x - padding;
    const x2 = box.x + box.w + padding;
    const y1 = box.y - padding / 2;
    const y2 = box.y + box.h + padding / 2;
    const arm = Math.min(10, box.w / 6);
    paths.push(`${roughLine(x1 + arm, y1, x1, y1, rand, roughness)} ${roughLine(x1, y1, x1, y2, rand, roughness).replace('M', 'L')} ${roughLine(x1, y2, x1 + arm, y2, rand, roughness).replace('M', 'L')}`);
    paths.push(`${roughLine(x2 - arm, y1, x2, y1, rand, roughness)} ${roughLine(x2, y1, x2, y2, rand, roughness).replace('M', 'L')} ${roughLine(x2, y2, x2 - arm, y2, rand, roughness).replace('M', 'L')}`);
  } else if (type === 'cross') {
    paths.push(roughLine(box.x - padding, box.y, box.x + box.w + padding, box.y + box.h, rand, roughness), roughLine(box.x - padding, box.y + box.h, box.x + box.w + padding, box.y, rand, roughness));
  }
  return paths;
}

export default function SketchHighlight({
  children,
  type = 'underline',
  color = '#ef7d57',
  strokeWidth = 2.5,
  padding = 4,
  iterations = 2,
  roughness = 2.5,
  duration = 700,
  delay = 0,
  show = true,
  trigger = 'view',
  highlightOpacity = 0.55,
  className = '',
  style
}) {
  useStyles();
  const ref = useRef(null);
  const svgRef = useRef(null);
  const [paths, setPaths] = useState([]);
  const [visible, setVisible] = useState(trigger !== 'view');
  const drawn = useRef(false);

  // Measure each line box of the text (relative to the SVG's own origin) and build strokes.
  useLayoutEffect(() => {
    const node = ref.current;
    const svg = svgRef.current;
    if (!node || !svg) return undefined;
    const measure = () => {
      const origin = svg.getBoundingClientRect();
      const lines = [...node.getClientRects()].map(r => ({ x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height }));
      if (!lines.length) return;
      const x = Math.min(...lines.map(l => l.x));
      const y = Math.min(...lines.map(l => l.y));
      const box = { x, y, w: Math.max(...lines.map(l => l.x + l.w)) - x, h: Math.max(...lines.map(l => l.y + l.h)) - y };
      setPaths(buildPaths(type, lines, box, { padding, iterations, roughness, seed: hash(`${type}:${node.textContent}`) }));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [type, padding, iterations, roughness]);

  useEffect(() => {
    if (trigger !== 'view' || visible) return undefined;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && setVisible(true), { threshold: 0.6 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [trigger, visible]);

  // Draw the strokes one after another, the first time they become visible.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !paths.length) return undefined;
    const elements = [...svg.querySelectorAll('path')];
    const active = show && visible;
    if (!active) {
      elements.forEach(el => (el.style.opacity = '0'));
      drawn.current = false;
      return undefined;
    }
    if (drawn.current || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(el => {
        el.style.opacity = '1';
        el.style.strokeDasharray = '';
        el.style.strokeDashoffset = '';
      });
      drawn.current = true;
      return undefined;
    }
    drawn.current = true;
    const each = duration / elements.length;
    const animations = elements.map((el, i) => {
      const length = el.getTotalLength();
      el.style.opacity = '1';
      el.style.strokeDasharray = `${length}`;
      el.style.strokeDashoffset = `${length}`;
      return el.animate([{ strokeDashoffset: length }, { strokeDashoffset: 0 }], { duration: each, delay: delay + i * each, easing: 'cubic-bezier(.45,0,.3,1)', fill: 'forwards' });
    });
    return () => animations.forEach(a => a.finish());
  }, [paths, show, visible, duration, delay]);

  const highlight = type === 'highlight';
  return (
    <span ref={ref} className={`bl-sketch ${className}`} data-type={type} style={style}>
      <svg ref={svgRef} className="bl-sketch__svg" aria-hidden="true" focusable="false">
        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke={color}
            strokeWidth={highlight ? '1.05em' : strokeWidth}
            strokeOpacity={highlight ? highlightOpacity : 1}
            style={{ opacity: 0, strokeLinecap: highlight ? 'butt' : 'round' }}
          />
        ))}
      </svg>
      {children}
    </span>
  );
}
