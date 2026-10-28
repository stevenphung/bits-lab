import { useEffect, useRef } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Letters that swell toward the pointer. Each letter's weight, width (on fonts with a width
// axis) and height follow how close the pointer is, so moving across a line pushes a soft bulge
// of heavy type along with you; the letters relax again when it leaves. Touch works by dragging.
// The text stays plain text; reduced motion keeps the letters still.

export default function ProximityType({
  text = '',
  as: Tag = 'p',
  radius = 160,
  falloff = 'smooth',
  minWeight = 300,
  maxWeight = 900,
  minWidth = 100,
  maxWidth = 100,
  lift = 0,
  tint = 0,
  ease = 0.2,
  fontSize = 56,
  textColor = '#f4f4f4',
  accentColor = '#73eff7',
  fontFamily = '"Roboto Flex", ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const letters = [...root.querySelectorAll('.bl-prox__ch')];
    const level = letters.map(() => 0);
    let centres = [];
    const pointer = { x: -1e4, y: -1e4 };
    let raf = 0;

    // Resting centres in page coordinates; measured with the lift removed so it can't feed back.
    const measure = () => {
      centres = letters.map(node => {
        const r = node.getBoundingClientRect();
        const k = Number(node.style.getPropertyValue('--k')) || 0;
        return { x: r.left + r.width / 2 + window.scrollX, y: r.top + r.height / 2 + window.scrollY + k * lift };
      });
    };
    const shape = t => (falloff === 'linear' ? t : falloff === 'sharp' ? t * t * t : t * t * (3 - 2 * t));

    const tick = () => {
      let moving = false;
      letters.forEach((node, i) => {
        const c = centres[i];
        const d = Math.hypot(c.x - pointer.x, c.y - pointer.y);
        const goal = d < radius ? shape(1 - d / radius) : 0;
        level[i] += (goal - level[i]) * ease;
        if (Math.abs(goal - level[i]) > 0.002) moving = true;
        else level[i] = goal;
        node.style.setProperty('--k', level[i].toFixed(3));
      });
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const onMove = event => {
      if (!centres.length) measure();
      pointer.x = event.clientX + window.scrollX;
      pointer.y = event.clientY + window.scrollY;
      wake();
    };
    const onLeave = () => {
      pointer.x = -1e4;
      pointer.y = -1e4;
      wake();
    };
    const onLayout = () => {
      centres = [];
    };

    // Listen on the window while the line is on screen, so the bulge starts before the pointer
    // actually reaches a letter.
    let listening = false;
    const listen = on => {
      if (on === listening) return;
      listening = on;
      if (on) {
        window.addEventListener('pointermove', onMove, { passive: true });
        document.documentElement.addEventListener('pointerleave', onLeave);
      } else {
        window.removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('pointerleave', onLeave);
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      listen(entry.isIntersecting);
      if (!entry.isIntersecting) onLeave();
    });
    observer.observe(root);
    const resize = new ResizeObserver(onLayout);
    resize.observe(root);
    window.addEventListener('scroll', onLayout, { passive: true, capture: true });
    document.fonts?.ready.then(onLayout);
    return () => {
      cancelAnimationFrame(raf);
      listen(false);
      observer.disconnect();
      resize.disconnect();
      window.removeEventListener('scroll', onLayout, { capture: true });
      letters.forEach(node => node.style.removeProperty('--k'));
    };
  }, [text, radius, falloff, lift, ease]);

  let index = 0;
  return (
    <Tag
      ref={rootRef}
      className={`m-0 touch-pan-y font-(family-name:--bl-font) text-(length:--bl-size) leading-[1.1] text-(--bl-ink) ${className}`}
      style={{ '--bl-size': typeof fontSize === 'number' ? `${fontSize}px` : fontSize, '--bl-wmin': minWeight, '--bl-wmax': maxWeight, '--bl-dmin': `${minWidth}%`, '--bl-dmax': `${maxWidth}%`, '--bl-lift': `${lift}px`, '--bl-tint': `${tint * 100}%`, '--bl-ink': textColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      {text.split(/(\s+)/).map((part, w) => {
        if (!part) return null;
        if (/^\s+$/.test(part)) return ' ';
        return (
          // Letters of a word stay together so lines only break between words.
          <span key={w} className="inline-block whitespace-nowrap">
            {[...part].map(ch => (
              <span key={index++} className="bl-prox__ch inline-block origin-bottom whitespace-pre [--k:0] [font-weight:calc(var(--bl-wmin)_+_var(--k)_*_(var(--bl-wmax)_-_var(--bl-wmin)))] [font-stretch:calc(var(--bl-dmin)_+_var(--k)_*_(var(--bl-dmax)_-_var(--bl-dmin)))] [color:color-mix(in_srgb,var(--bl-accent)_calc(var(--k)_*_var(--bl-tint)),var(--bl-ink))] [transform:translateY(calc(var(--k)_*_var(--bl-lift)_*_-1))]">
                {ch}
              </span>
            ))}
          </span>
        );
      })}
    </Tag>
  );
}
