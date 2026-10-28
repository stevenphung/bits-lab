import { useEffect, useRef } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Type that reacts to how fast you scroll. Words get heavier, stretch taller, lean with the
// scroll direction and shift toward the accent colour as the speed rises, then relax when
// you stop. Each word answers a moment after the one before it, so a flick sends a ripple
// through the line. Made for variable fonts (weight, and width if the font has it); works
// with the window or any scroll box. The text stays plain text; reduced motion keeps it still.

// The element that actually scrolls this one: the nearest scrollable ancestor, or the page.
function scrollerOf(node) {
  for (let el = node.parentElement; el && el !== document.body; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (/(auto|scroll|overlay)/.test(overflowY) && el.scrollHeight > el.clientHeight) return el;
  }
  return window;
}

export default function ScrollTypography({
  text = '',
  as: Tag = 'p',
  sensitivity = 2400,
  minWeight = 300,
  maxWeight = 900,
  stretch = 0.25,
  widthRange = 0,
  skew = 10,
  stagger = 35,
  fontSize = 56,
  textColor = '#f4f4f4',
  accentColor = '#73eff7',
  fontFamily = '"Roboto Flex", ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  const rootRef = useRef(null);
  const words = text.split(/\s+/).filter(Boolean);

  useEffect(() => {
    const root = rootRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;
    const nodes = [...root.querySelectorAll('.bl-stype__word')];
    const scroller = scrollerOf(root);
    const position = () => (scroller === window ? window.scrollY : scroller.scrollTop);
    // Recent smoothed velocities with timestamps, so each word can read a slightly older one.
    const history = [];
    let lastY = position();
    let smooth = 0;
    let visible = true;
    let raf = 0;
    let last = 0;

    const at = time => {
      for (let i = history.length - 1; i >= 0; i--) if (history[i].t <= time) return history[i].v;
      return history.length ? history[0].v : 0;
    };

    const tick = now => {
      const dt = Math.max(0.001, Math.min(0.05, (now - last) / 1000));
      last = now;
      const y = position();
      const raw = Math.max(-1, Math.min(1, (y - lastY) / dt / sensitivity));
      lastY = y;
      smooth += (raw - smooth) * (1 - Math.exp(-dt * 9));
      history.push({ t: now, v: smooth });
      while (history.length > 2 && now - history[0].t > stagger * nodes.length + 200) history.shift();
      let active = Math.abs(smooth) > 0.002;
      nodes.forEach((node, i) => {
        const v = at(now - i * stagger);
        if (Math.abs(v) > 0.002) active = true;
        node.style.setProperty('--t', Math.abs(v).toFixed(3));
        node.style.setProperty('--s', v.toFixed(3));
      });
      if (active) raf = requestAnimationFrame(tick);
      else {
        raf = 0;
        smooth = 0;
        history.length = 0;
        nodes.forEach(node => {
          node.style.setProperty('--t', '0');
          node.style.setProperty('--s', '0');
        });
      }
    };
    const onScroll = () => {
      if (raf || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      lastY = position();
    });
    observer.observe(root);
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      scroller.removeEventListener('scroll', onScroll);
      nodes.forEach(node => {
        node.style.removeProperty('--t');
        node.style.removeProperty('--s');
      });
    };
  }, [text, sensitivity, stagger]);

  return (
    <Tag
      ref={rootRef}
      className={`m-0 font-(family-name:--bl-font) text-(length:--bl-size) leading-[1.15] text-balance text-(--bl-ink) ${className}`}
      style={{ '--bl-size': typeof fontSize === 'number' ? `${fontSize}px` : fontSize, '--bl-wmin': minWeight, '--bl-wmax': maxWeight, '--bl-stretch': stretch, '--bl-wdth': `${widthRange}%`, '--bl-skew': `${-skew}deg`, '--bl-ink': textColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      {words.map((word, i) => (
        <span key={i}>
          <span className="bl-stype__word inline-block origin-bottom will-change-transform [--s:0] [--t:0] [font-weight:calc(var(--bl-wmin)_+_var(--t)_*_(var(--bl-wmax)_-_var(--bl-wmin)))] [font-stretch:calc(100%_+_var(--t)_*_var(--bl-wdth))] [color:color-mix(in_srgb,var(--bl-accent)_calc(var(--t)_*_100%),var(--bl-ink))] [transform:skewX(calc(var(--s)_*_var(--bl-skew)))_scaleY(calc(1_+_var(--t)_*_var(--bl-stretch)))]">{word}</span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </Tag>
  );
}
