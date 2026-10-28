import { useEffect, useRef } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Columns of glyphs falling like a data feed. Each column drops at its own speed with a bright
// leading glyph and a fading tail; now and then a glyph in a tail flips to something else, and a
// rare glitch row flashes across. Pick the glyphs (hex, binary, blocks, arrows or your own) and
// the pixel font. Pointer nearby makes columns run hot. Fills its parent, pauses off-screen;
// reduced motion shows a still screen of glyphs. Decorative.

const hexToRgb = hex => {
  const n = parseInt(hex.replace('#', '').replace(/^(.)(.)(.)$/, '$1$1$2$2$3$3'), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const GLYPHS = {
  hex: '0123456789ABCDEF',
  binary: '01',
  blocks: '▖▗▘▙▚▛▜▝▞▟█▄▀',
  arrows: '←↑→↓↖↗↘↙◄►▲▼'
};

export default function CodeRain({
  glyphs = 'hex',
  fontSize = 14,
  fontFamily = '"Press Start 2P", ui-monospace, monospace',
  speed = 1,
  density = 0.8,
  tail = 1.2,
  glitch = 0.004,
  hotRadius = 120,
  headColor = '#f4f4f4',
  color = '#38b764',
  hotColor = '#ffcd75',
  backgroundColor = '#0b0b14',
  className = '',
  style
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const set = GLYPHS[glyphs] ?? glyphs;
    const [br, bg, bb] = hexToRgb(backgroundColor);
    const pick = () => set[Math.floor(Math.random() * set.length)];
    let W = 0;
    let H = 0;
    let dpr = 1;
    let cols = [];
    let rows = 0;
    let raf = 0;
    let last = 0;
    let visible = true;
    const hand = { x: -1e4, y: -1e4 };

    const fit = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      const count = Math.ceil(W / fontSize);
      rows = Math.ceil(H / fontSize);
      cols = Array.from({ length: count }, () => ({ y: -Math.random() * rows, rate: 6 + Math.random() * 10, on: Math.random() < density, glyph: pick() }));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, W, H);
    };

    const step = dt => {
      // Fade the whole screen a little each frame: what's left behind becomes the tail. The fade
      // is set per second, so tails last about `tail` seconds at any frame rate.
      ctx.fillStyle = `rgba(${br},${bg},${bb},${(1 - Math.exp((-dt * 4) / Math.max(0.05, tail))).toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textBaseline = 'top';
      cols.forEach((c, i) => {
        if (!c.on) return;
        const x = i * fontSize;
        const near = Math.abs(x - hand.x) < hotRadius && hand.y > -1e3;
        const prev = Math.floor(c.y);
        c.y += c.rate * speed * dt * (near ? 2.2 : 1);
        const row = Math.floor(c.y);
        if (row !== prev) {
          // Repaint the old head in the tail colour, then the new head bright.
          ctx.fillStyle = near ? hotColor : color;
          ctx.fillText(c.glyph, x, prev * fontSize);
          c.glyph = pick();
          ctx.fillStyle = headColor;
          ctx.fillText(c.glyph, x, row * fontSize);
        }
        if (row > rows + 4) {
          c.y = -Math.random() * rows * 0.5;
          c.rate = 6 + Math.random() * 10;
          c.on = Math.random() < density;
        }
        if (Math.random() < glitch * 6) {
          ctx.fillStyle = color;
          ctx.fillText(pick(), x, Math.floor(Math.random() * Math.max(1, row)) * fontSize);
        }
      });
      if (Math.random() < glitch) {
        const y = Math.floor(Math.random() * rows) * fontSize;
        ctx.fillStyle = hotColor;
        for (let x = 0; x < W; x += fontSize) if (Math.random() < 0.6) ctx.fillText(pick(), x, y);
      }
    };

    const still = () => {
      ctx.font = `${fontSize}px ${fontFamily}`;
      ctx.textBaseline = 'top';
      cols.forEach((c, i) => {
        if (!c.on) return;
        const len = 4 + ((i * 7) % 12);
        const head = (i * 5) % (rows + 4);
        for (let k = 0; k < len; k++) {
          ctx.fillStyle = k === 0 ? headColor : color;
          ctx.globalAlpha = 1 - k / len;
          ctx.fillText(pick(), i * fontSize, (head - k) * fontSize);
        }
      });
      ctx.globalAlpha = 1;
    };

    const tick = now => {
      step(Math.max(0, Math.min(0.05, (now - last) / 1000)));
      last = now;
      raf = visible && !document.hidden ? requestAnimationFrame(tick) : 0;
    };
    const start = () => {
      if (raf || reduced || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(tick);
    };
    const onMove = event => {
      const r = canvas.getBoundingClientRect();
      hand.x = event.clientX - r.left;
      hand.y = event.clientY - r.top;
    };
    const onLeave = () => {
      hand.x = -1e4;
      hand.y = -1e4;
    };

    const resize = new ResizeObserver(() => {
      fit();
      if (reduced) still();
    });
    resize.observe(canvas);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    observer.observe(canvas);
    document.addEventListener('visibilitychange', start);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    // The pixel font may still be loading; once it's in, the next glyphs use it.
    fit();
    if (reduced) document.fonts?.load(`${fontSize}px ${fontFamily}`).then(() => canvas.isConnected && still());
    start();
    return () => {
      cancelAnimationFrame(raf);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener('visibilitychange', start);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [glyphs, fontSize, fontFamily, speed, density, tail, glitch, hotRadius, headColor, color, hotColor, backgroundColor]);

  return <canvas ref={canvasRef} aria-hidden="true" className={className} style={{ display: 'block', width: '100%', height: '100%', background: backgroundColor, ...style }} />;
}
