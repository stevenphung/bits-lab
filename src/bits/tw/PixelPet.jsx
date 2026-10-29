import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A small pixel creature for empty states and onboarding. It floats and blinks, its eyes follow
// the pointer, and it wears a mood: idle, happy, thinking or sad, with an optional speech bubble.
// Give it onPet and it becomes a button that hops when pressed. To assistive tech it is one
// labelled image (or button) plus the bubble text. Reduced motion keeps the mood, drops the motion.

const STYLE_ID = 'bl-pixel-pet-tw';
const CSS = `
/* theme tokens */
.bl-pet { --bl-bg: #1a1c2c; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-pet, .bl-pet:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-pet, :where(.light, [data-theme="light"]) .bl-pet:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-pet, .bl-pet:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-accent: #167f8f; } }
/* theme tokens end */
@keyframes bl-pet-float { 50% { transform: translateY(-4%); } }
@keyframes bl-pet-hop { 50% { transform: translateY(-14%); } }
@keyframes bl-pet-blink { 0%, 95% { transform: none; } 96% { transform: scaleY(0.15); } }
@keyframes bl-pet-tear { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(3px); } }
@keyframes bl-pet-dot { 50% { opacity: 0.25; } }
@keyframes bl-pet-pop { from { opacity: 0; transform: scale(0.6); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// o outline, b body, s shade, w shine. Eyes and mouth are drawn on top, per mood.
const BODY = [
  '................',
  '................',
  '.....oooooo.....',
  '...oobbbbbboo...',
  '..obwwbbbbbbbo..',
  '..obwbbbbbbbbo..',
  '.obbbbbbbbbbbbo.',
  '.obbbbbbbbbbbbo.',
  '.obbbbbbbbbbbbo.',
  '.obbbbbbbbbbbbo.',
  '.obbbbbbbbbbbso.',
  '.osbbbbbbbbbsso.',
  '..ossbbbbbbsso..',
  '...oossssssoo...',
  '....ooo..ooo....',
  '................'
];

// One path per colour: each run of same-key pixels in a row becomes a 1px-high rect.
function toPaths(rows) {
  const out = {};
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; ) {
      const key = row[x];
      let w = 1;
      while (row[x + w] === key) w++;
      if (key !== '.') out[key] = (out[key] ?? '') + `M${x} ${y}h${w}v1h-${w}z`;
      x += w;
    }
  });
  return out;
}

const SPRITE = toPaths(BODY);

const FACES = {
  idle: { eyes: 'M5 7h1v2H5zM10 7h1v2h-1z', mouth: 'M7 10h2v1H7z', blink: true, follow: true },
  happy: { eyes: 'M4 8h1v1H4zM5 7h1v1H5zM6 8h1v1H6zM9 8h1v1H9zM10 7h1v1h-1zM11 8h1v1h-1z', mouth: 'M6 10h1v1H6zM7 11h2v1H7zM9 10h1v1H9z', cheeks: true },
  thinking: { eyes: 'M6 6h1v2H6zM11 6h1v2h-1z', mouth: 'M7 10h3v1H7z', blink: true },
  sad: { eyes: 'M4 6h2v1H4zM10 6h2v1h-2zM5 8h1v1H5zM10 8h1v1h-1z', mouth: 'M6 11h1v1H6zM7 10h2v1H7zM9 11h1v1H9z', tear: true }
};

export default function PixelPet({
  mood = 'idle',
  say,
  follow = true,
  onPet,
  size = 96,
  label = 'Pixel pet',
  bodyColor = '#a7f070',
  shadeColor = '#38b764',
  shineColor = '#f4f4f4',
  outlineColor = '#0b0b14',
  cheekColor = '#ef7d57',
  tearColor = '#41a6f6',
  bubbleColor,
  lineColor,
  textColor,
  accentColor,
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const svgRef = useRef(null);
  const hopTimer = useRef(0);
  const [look, setLook] = useState([0, 0]);
  const [hop, setHop] = useState(false);
  const current = hop ? 'happy' : FACES[mood] ? mood : 'idle';
  const face = FACES[current];
  const fills = { o: outlineColor, b: bodyColor, s: shadeColor, w: shineColor };

  useEffect(() => {
    if (!follow) return;
    let raf = 0;
    const onMove = event => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const box = svgRef.current?.getBoundingClientRect();
        if (!box) return;
        const dx = event.clientX - (box.left + box.width / 2);
        const dy = event.clientY - (box.top + box.height / 2);
        const reach = box.width * 0.6;
        const next = [Math.abs(dx) > reach ? Math.sign(dx) : 0, Math.abs(dy) > reach ? Math.sign(dy) : 0];
        setLook(prev => (prev[0] === next[0] && prev[1] === next[1] ? prev : next));
      });
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, [follow]);

  useEffect(() => () => clearTimeout(hopTimer.current), []);

  const pet = event => {
    setHop(true);
    clearTimeout(hopTimer.current);
    hopTimer.current = setTimeout(() => setHop(false), 900);
    onPet?.(event);
  };

  const [lx, ly] = face.follow && follow ? look : [0, 0];
  const name = `${label}, ${current}`;
  const art = (
    <svg ref={svgRef} className="block size-(--bl-size) animate-[bl-pet-float_1600ms_steps(2)_infinite] overflow-visible group-data-[mood=happy]/pet:animate-[bl-pet-hop_500ms_steps(4)_infinite] group-data-[mood=sad]/pet:origin-[50%_100%] group-data-[mood=sad]/pet:animate-none group-data-[mood=sad]/pet:[transform:scaleY(0.94)] motion-reduce:animate-none motion-reduce:group-data-[mood=happy]/pet:animate-none" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true">
      {Object.entries(SPRITE).map(([key, d]) => (
        <path key={key} d={d} style={{ fill: fills[key] }} />
      ))}
      {face.cheeks && <path d="M3 9h2v1H3zM11 9h2v1h-2z" style={{ fill: cheekColor }} />}
      <g transform={`translate(${lx} ${ly})`}>
        <path className={face.blink ? 'origin-center animate-[bl-pet-blink_4s_steps(1)_infinite] [transform-box:fill-box] motion-reduce:animate-none' : undefined} d={face.eyes} style={{ fill: outlineColor }} />
      </g>
      <path d={face.mouth} style={{ fill: outlineColor }} />
      {face.tear && <path className="animate-[bl-pet-tear_1200ms_steps(4)_infinite] motion-reduce:animate-none" d="M4 9h1v2H4z" style={{ fill: tearColor }} />}
    </svg>
  );

  return (
    <div className={`bl-pet group/pet inline-grid justify-items-center gap-2 font-(family-name:--bl-font) text-[13px] text-(--bl-ink) ${className}`} data-mood={current} style={{ '--bl-size': `${size}px`, '--bl-bg': bubbleColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}>
      <span className="grid min-h-0 justify-items-center" aria-live="polite">
        {say ? (
          <span className="relative max-w-[220px] animate-[bl-pet-pop_200ms_steps(3)_both] bg-(--bl-bg) px-2.5 py-1.5 text-center leading-[1.35] shadow-[inset_0_0_0_2px_var(--bl-line),3px_3px_0_rgba(0,0,0,0.35)] after:absolute after:-bottom-1.5 after:left-1/2 after:-ml-1 after:h-1.5 after:w-2 after:bg-(--bl-line) after:[clip-path:polygon(0_0,100%_0,50%_100%)] after:content-[''] motion-reduce:animate-none">{say}</span>
        ) : current === 'thinking' ? (
          <span className="relative max-w-[220px] animate-[bl-pet-pop_200ms_steps(3)_both] bg-(--bl-bg) px-2.5 py-1.5 text-center leading-[1.35] shadow-[inset_0_0_0_2px_var(--bl-line),3px_3px_0_rgba(0,0,0,0.35)] after:absolute after:-bottom-1.5 after:left-1/2 after:-ml-1 after:h-1.5 after:w-2 after:bg-(--bl-line) after:[clip-path:polygon(0_0,100%_0,50%_100%)] after:content-[''] motion-reduce:animate-none">
            <span className="inline-flex gap-1 px-0 py-1" role="img" aria-label="Thinking">
              {[0, 1, 2].map(i => (
                <span key={i} className="size-1 animate-[bl-pet-dot_900ms_steps(2)_calc(var(--i)_*_150ms)_infinite] bg-current motion-reduce:animate-none" style={{ '--i': i }} />
              ))}
            </span>
          </span>
        ) : null}
      </span>
      {onPet ? (
        <button type="button" className="block border-0 bg-transparent p-0 text-inherit [&:is(button)]:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" aria-label={name} onClick={pet}>
          {art}
        </button>
      ) : (
        <span className="block border-0 bg-transparent p-0 text-inherit [&:is(button)]:cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--bl-accent) focus-visible:outline-solid" role="img" aria-label={name}>
          {art}
        </span>
      )}
      <span className="-mt-1.5 h-[max(3px,calc(var(--bl-size)*0.05))] w-[calc(var(--bl-size)*0.55)] bg-[rgba(0,0,0,0.3)]" aria-hidden="true" />
    </div>
  );
}
