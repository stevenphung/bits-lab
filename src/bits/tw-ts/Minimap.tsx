import { useEffect, useRef, useState, type CSSProperties, type RefObject, type PointerEvent as ReactPointerEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A live, game-style overview of a long page or scroll container. Every heading, paragraph,
// image and code block is drawn as a chunky pixel block, and a box marks what's on screen.
// Drag the box or click anywhere on the map to travel; on very long pages the map scrolls
// with you. It behaves as a scrollbar for assistive tech and the keyboard (arrows, Page
// Up/Down, Home, End), and redraws when the content changes size or shape.

export type BlockKind = 'heading' | 'text' | 'media' | 'code' | 'control';

export interface MinimapProps {
  /** Scroll container to map; omit to map the whole window. */
  target?: RefObject<HTMLElement | null>;
  /** Which elements become blocks. */
  selector?: string;
  width?: number;
  /** Max height; longer content scrolls inside the map. */
  height?: number;
  /** Size of one map pixel in screen px. */
  pixelSize?: number;
  colors?: Partial<Record<BlockKind, string>>;
  backgroundColor?: string;
  edgeColor?: string;
  viewportColor?: string;
  label?: string;
  className?: string;
  style?: CSSProperties;
}

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: BlockKind;
  line: number;
}

const KINDS: Record<Exclude<BlockKind, 'text'>, RegExp> = {
  heading: /^H[1-6]$/,
  media: /^(IMG|VIDEO|CANVAS|SVG|PICTURE|FIGURE|IFRAME)$/,
  code: /^(PRE|CODE|TABLE)$/,
  control: /^(BUTTON|INPUT|SELECT|TEXTAREA)$/
};
const DEFAULT_COLORS: Record<BlockKind, string> = { heading: '#ffcd75', text: '#566c86', media: '#41a6f6', code: '#a7f070', control: '#ef7d57' };

const kindOf = (node: Element): BlockKind => (Object.keys(KINDS) as (keyof typeof KINDS)[]).find(kind => KINDS[kind].test(node.tagName.toUpperCase())) ?? 'text';

export default function Minimap({
  target,
  selector = 'h1, h2, h3, h4, h5, h6, p, li, blockquote, img, video, canvas, svg, picture, pre, table, button, input, textarea',
  width = 96,
  height = 320,
  pixelSize = 2,
  colors,
  backgroundColor = '#0b0b14',
  edgeColor = '#333c57',
  viewportColor = '#73eff7',
  label = 'Page overview',
  className = '',
  style
}: MinimapProps) {
  
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [mapHeight, setMapHeight] = useState(height);
  const geometry = useRef<{ scale: number; contentH: number; viewH: number; offset: number; maxScroll: number; blocks: Block[] }>({ scale: 1, contentH: 1, viewH: 1, offset: 0, maxScroll: 0, blocks: [] });
  const palette = { ...DEFAULT_COLORS, ...colors };
  const paletteKey = JSON.stringify(palette);

  useEffect(() => {
    const root = rootRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const isWindow = !target;
    const scroller = () => target?.current ?? document.scrollingElement ?? document.documentElement;
    const scrollTop = () => (isWindow ? window.scrollY : scroller().scrollTop);
    const colorsNow: Record<BlockKind, string> = JSON.parse(paletteKey);
    let frame = 0;

    // Measure every matching element once, in content coordinates (scroll-independent).
    const measure = () => {
      const el = scroller();
      if (!el) return;
      const g = geometry.current;
      const box = isWindow ? { top: 0, left: 0 } : el.getBoundingClientRect();
      const originTop = box.top + (isWindow ? 0 : el.clientTop) - scrollTop();
      const originLeft = box.left + (isWindow ? 0 : el.clientLeft) - (isWindow ? window.scrollX : el.scrollLeft);
      const contentW = isWindow ? document.documentElement.clientWidth : el.clientWidth;
      g.viewH = isWindow ? window.innerHeight : el.clientHeight;
      g.contentH = Math.max(el.scrollHeight, g.viewH);
      g.maxScroll = Math.max(0, g.contentH - g.viewH);
      g.scale = width / Math.max(1, contentW);
      g.blocks = [];
      for (const node of el.querySelectorAll(selector)) {
        if (root.contains(node)) continue;
        const r = node.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const kind = kindOf(node);
        const line = kind === 'text' || kind === 'heading' ? parseFloat(getComputedStyle(node).lineHeight) || r.height : 0;
        g.blocks.push({ x: r.left - originLeft, y: r.top - originTop, w: r.width, h: r.height, kind, line });
      }
      setMapHeight(Math.min(height, Math.ceil(g.contentH * g.scale)));
      draw();
    };

    const draw = () => {
      const g = geometry.current;
      const fullH = g.contentH * g.scale;
      const visibleH = Math.min(height, fullH);
      const p = g.maxScroll ? Math.min(1, Math.max(0, scrollTop() / g.maxScroll)) : 0;
      // On long pages the map itself scrolls, keeping the box in view.
      g.offset = p * Math.max(0, fullH - visibleH);
      const px = Math.max(1, pixelSize);
      canvas.width = Math.ceil(width / px);
      canvas.height = Math.ceil(visibleH / px);
      canvas.style.width = `${canvas.width * px}px`;
      canvas.style.height = `${canvas.height * px}px`;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const s = g.scale / px;
      const off = g.offset / px;
      for (const b of g.blocks) {
        const y = b.y * s - off;
        const h = Math.max(1, b.h * s);
        if (y + h < 0 || y > canvas.height) continue;
        ctx.fillStyle = colorsNow[b.kind] ?? colorsNow.text;
        const x = Math.round(b.x * s);
        const w = Math.max(1, Math.round(b.w * s));
        const pitch = b.line * s;
        if (pitch >= 2) {
          // Text reads as lines: one bar per line of text, the last one shorter.
          const count = Math.max(1, Math.round(b.h / b.line));
          for (let i = 0; i < count; i++) {
            const lineW = i === count - 1 && count > 1 ? Math.max(1, Math.round(w * 0.6)) : w;
            ctx.fillRect(x, Math.round(y + i * pitch), lineW, Math.max(1, Math.round(pitch * 0.55)));
          }
        } else {
          ctx.fillRect(x, Math.round(y), w, Math.round(h));
        }
      }
      const view = viewRef.current;
      if (view) {
        view.style.height = `${Math.max(8, g.viewH * g.scale)}px`;
        view.style.transform = `translateY(${scrollTop() * g.scale - g.offset}px)`;
      }
      setProgress(Math.round(p * 100));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        draw();
      });
    };

    let timer = 0;
    const remeasure = () => {
      clearTimeout(timer);
      timer = setTimeout(measure, 120);
    };

    const scrollSource: EventTarget | null = isWindow ? window : scroller();
    scrollSource?.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', remeasure);
    const resize = new ResizeObserver(remeasure);
    const el = scroller();
    if (el) {
      resize.observe(el);
      for (const child of el.children) resize.observe(child);
    }
    const mutations = new MutationObserver(remeasure);
    if (el) mutations.observe(el, { childList: true, subtree: true, characterData: true });
    measure();
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      scrollSource?.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', remeasure);
      resize.disconnect();
      mutations.disconnect();
    };
  }, [target, selector, width, height, pixelSize, paletteKey]);

  const scrollTo = (top: number, smooth = false) => {
    const g = geometry.current;
    const value = Math.max(0, Math.min(g.maxScroll, top));
    const behavior = smooth && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'instant';
    if (target) target.current?.scrollTo({ top: value, behavior });
    else window.scrollTo({ top: value, behavior });
  };
  const currentScroll = () => (target ? target.current?.scrollTop ?? 0 : window.scrollY);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const root = rootRef.current!;
    const g = geometry.current;
    const rect = root.getBoundingClientRect();
    const onBox = viewRef.current?.contains(event.target as Node);
    if (!onBox) {
      // Jump: centre the view on the clicked spot.
      scrollTo((event.clientY - rect.top + g.offset) / g.scale - g.viewH / 2, true);
      return;
    }
    event.preventDefault();
    try {
      root.setPointerCapture(event.pointerId);
    } catch {
      // Synthetic or already-released pointers can't be captured; dragging still works.
    }
    root.setAttribute('data-dragging', '');
    const startY = event.clientY;
    const startScroll = currentScroll();
    // Like a scrollbar: the box's free travel maps onto the full scroll range.
    const travel = Math.max(1, Math.min(height, g.contentH * g.scale) - g.viewH * g.scale);
    const ratio = g.maxScroll / travel;
    const onMove = (move: PointerEvent) => scrollTo(startScroll + (move.clientY - startY) * ratio);
    const onUp = () => {
      root.removeAttribute('data-dragging');
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
    };
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const g = geometry.current;
    const now = currentScroll();
    const moves = {
      ArrowDown: now + g.viewH * 0.15,
      ArrowUp: now - g.viewH * 0.15,
      PageDown: now + g.viewH * 0.9,
      PageUp: now - g.viewH * 0.9,
      Home: 0,
      End: g.maxScroll
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    scrollTo(moves[event.key as keyof typeof moves], event.key === 'Home' || event.key === 'End' || event.key.startsWith('Page'));
  };

  return (
    <div
      ref={rootRef}
      className={`group/mini relative flex-none cursor-pointer touch-none overflow-hidden bg-(--bl-bg) shadow-[0_0_0_2px_var(--bl-edge)] select-none focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--bl-view) ${className}`}
      role="scrollbar"
      aria-label={label}
      aria-orientation="vertical"
      aria-controls={target?.current?.id || undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={progress}
      aria-valuetext={`${progress}%`}
      tabIndex={0}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      style={{ width, height: mapHeight, '--bl-bg': backgroundColor, '--bl-edge': edgeColor, '--bl-view': viewportColor, ...style } as CSSVars}
    >
      <canvas ref={canvasRef} aria-hidden="true" className="absolute top-0 left-0 [image-rendering:pixelated]" />
      <div ref={viewRef} className="absolute inset-x-0 top-0 box-border cursor-grab border-2 border-solid border-(--bl-view) bg-[color-mix(in_srgb,var(--bl-view)_14%,transparent)] will-change-transform group-data-[dragging]/mini:cursor-grabbing group-data-[dragging]/mini:bg-[color-mix(in_srgb,var(--bl-view)_24%,transparent)]" aria-hidden="true" />
    </div>
  );
}
