import { useRef } from 'react';
import Sprite from './pixel/Sprite';
import ScrollZoom from './bits/ScrollZoom';
import ParallaxCollage from './bits/ParallaxCollage';
import ChapterProgress from './bits/ChapterProgress';
import scrollZoomSource from './bits/ScrollZoom.jsx?raw';
import parallaxCollageSource from './bits/ParallaxCollage.jsx?raw';
import chapterProgressSource from './bits/ChapterProgress.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", monospace';
const pixelated = { imageRendering: 'pixelated' };
const biome = id => `/pixel/biome-${id}.png`;
const BOX_HEIGHT = 560;
const note = height => ({ height, display: 'grid', placeItems: 'center', color: 'var(--demo-muted, #94b0c2)', font: `14px ${PIXEL_FONT}`, textAlign: 'center', padding: '0 16px' });

// Every demo scrolls inside its own box, so the effect can be tried without leaving the page.
function ScrollBox({ children, top = 'Scroll inside this box ↓', bottom = 'The end. Scroll back up ↑', topHeight = 160, bottomHeight = 240 }) {
  return (
    <div style={{ width: '100%', height: BOX_HEIGHT, overflowY: 'auto', overflowX: 'hidden', background: 'var(--demo-scroll, linear-gradient(#1a1c2c, #202640))', borderRadius: 4 }}>
      <div style={note(topHeight)}>{top}</div>
      {children}
      <div style={note(bottomHeight)}>{bottom}</div>
    </div>
  );
}

// ---------- ScrollZoom ----------

function ZoomDemo(props) {
  return (
    <ScrollBox top="Scroll to step into the grove ↓" topHeight={120}>
      <ScrollZoom
        {...props}
        src={biome('cherry')}
        alt="A pixel-art cherry blossom grove"
        mediaStyle={pixelated}
        fontFamily={PIXEL_FONT}
        heading={<span style={{ font: `clamp(12px, 2.4vw, 18px)/1.6 ${TITLE_FONT}`, color: 'var(--demo-gold, #ffcd75)' }}>The cherry grove</span>}
      >
        <div style={{ display: 'grid', gap: 14, justifyItems: 'center', maxWidth: 420 }}>
          <Sprite name="heart" size={44} />
          <h3 style={{ margin: 0, font: `clamp(14px, 3vw, 22px)/1.5 ${TITLE_FONT}` }}>Petals all year</h3>
          <p style={{ margin: 0, font: `17px/1.5 ${PIXEL_FONT}`, color: 'var(--demo-ink, #f4f4f4)' }}>A new biome where the blossoms never fall and the bees hum in chiptune.</p>
        </div>
      </ScrollZoom>
      <section style={{ padding: '56px 24px', color: 'var(--demo-ink, #f4f4f4)', font: `16px/1.6 ${PIXEL_FONT}`, textAlign: 'center' }}>
        <h3 style={{ margin: '0 0 10px', font: `13px/1.6 ${TITLE_FONT}`, color: 'var(--demo-accent, #73eff7)' }}>The next section</h3>
        <p style={{ margin: 0, color: 'var(--demo-muted, #94b0c2)' }}>Once the zoom has played, the page carries on as normal.</p>
      </section>
    </ScrollBox>
  );
}

// ---------- ParallaxCollage ----------

const tile = (sprite, bg) => (
  <div style={{ display: 'grid', placeItems: 'center', aspectRatio: '1', background: bg, borderRadius: 10, boxShadow: '0 18px 40px -18px rgba(0,0,0,0.7)' }}>
    <Sprite name={sprite} size={32} />
  </div>
);
const PIECES = [
  { id: 'forest', src: biome('forest'), x: 2, y: 6, width: 34, depth: 0.2, rotate: -4, style: pixelated },
  { id: 'snowy', src: biome('snowy'), x: 64, y: 2, width: 32, depth: 0.3, rotate: 3, style: pixelated },
  { id: 'desert', src: biome('desert'), x: 58, y: 62, width: 36, depth: 0.25, rotate: -2, style: pixelated },
  { id: 'ocean', src: biome('ocean'), x: 4, y: 64, width: 30, depth: 0.35, rotate: 4, style: pixelated },
  { id: 'gem', content: tile('gem', '#29366f'), x: 30, y: 12, width: 13, depth: 0.85, rotate: -8 },
  { id: 'potion', content: tile('potion', '#5d275d'), x: 80, y: 40, width: 13, depth: 0.95, rotate: 10 },
  { id: 'chest', content: tile('chest', '#257179'), x: 10, y: 42, width: 13, depth: 0.75, rotate: 6 },
  { id: 'star', content: tile('star', '#b13e53'), x: 44, y: 74, width: 12, depth: 1, rotate: -12 }
];

function CollageDemo(props) {
  return (
    <ScrollBox top="Scroll to move through the collage ↓" topHeight={200} bottomHeight={260}>
      <ParallaxCollage {...props} pieces={PIECES} height={520} fontFamily={PIXEL_FONT} label="Biomes collage">
        <div style={{ display: 'grid', gap: 12, justifyItems: 'center', padding: '18px 22px', background: 'rgba(11,11,20,0.78)', borderRadius: 12 }}>
          <h3 style={{ margin: 0, font: `clamp(12px, 2.6vw, 18px)/1.6 ${TITLE_FONT}`, color: 'var(--demo-gold, #ffcd75)' }}>Twelve biomes</h3>
          <p style={{ margin: 0, font: `16px/1.5 ${PIXEL_FONT}`, color: 'var(--demo-ink, #f4f4f4)' }}>One world. Move your pointer to lean in.</p>
        </div>
      </ParallaxCollage>
    </ScrollBox>
  );
}

// ---------- ChapterProgress ----------

const CHAPTERS = [
  ['Day one on the plains', 'You wake up in a field with nothing but your hands. Punch a tree, build a workbench and get a roof up before the sun sets. The first night is the hardest; after that, you have a bed and a plan.'],
  ['Into the forest', 'Oak and birch for every build. Wolves watch from the trees, and the canopy hides a few things worth finding: mushrooms, a lost chest, and a path that only shows up at dusk.'],
  ['Down in the caves', 'Torches every eight blocks. Ore veins glitter in the walls, and something is shuffling in the dark. Bring more food than you think you need, and always mark the way home.'],
  ['The underworld', 'Lava seas, glowing fungus and the rarest brewing ingredients. Pack fire resistance and a way home, and never dig straight down when the floor might be molten.'],
  ['The edge of the world', 'Floating islands over nothing. The final challenge waits out here, for anyone brave enough to jump. Everything you learned on the way comes down to this one fight.']
];

function ChapterDemo(props) {
  const ref = useRef(null);
  return (
    <div style={{ width: '100%', height: BOX_HEIGHT, overflowY: 'auto', overflowX: 'hidden', background: 'var(--demo-scroll, linear-gradient(#1a1c2c, #202640))', borderRadius: 4 }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 5 }}>
        <ChapterProgress {...props} target={ref} fontFamily={PIXEL_FONT} />
      </div>
      <article ref={ref} style={{ maxWidth: 620, margin: '0 auto', padding: '24px 20px 200px', color: 'var(--demo-ink, #f4f4f4)', font: `17px/1.7 ${PIXEL_FONT}` }}>
        <p style={{ color: 'var(--demo-muted, #94b0c2)' }}>A short guide to the five places every adventurer passes through. Scroll, or jump with the chapter list.</p>
        {CHAPTERS.map(([title, body], i) => (
          <section key={title}>
            <h2 style={{ margin: '36px 0 12px', font: `13px/1.6 ${TITLE_FONT}`, color: 'var(--demo-gold, #ffcd75)', outlineOffset: 4 }}>{title}</h2>
            <Sprite name={['grass', 'pickaxe', 'gem', 'potion', 'star'][i]} size={40} />
            {[0, 1, 2].map(k => (
              <p key={k} style={{ color: k ? 'var(--demo-muted, #94b0c2)' : 'var(--demo-ink, #f4f4f4)' }}>
                {body}
              </p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}

// ---------- Entries ----------

export const SCROLL_MORE_DEMOS = {
  'scroll-zoom': {
    source: scrollZoomSource,
    defaults: { length: 3, zoomEnd: 0.6, startWidth: 0.46, radius: 18, dim: 0.55 },
    controls: [slider('length', 'Scroll length (screens)', 1.5, 6, 0.5), slider('zoomEnd', 'Zoom ends at', 0.3, 0.9, 0.05), slider('startWidth', 'Start width', 0.2, 0.8, 0.02), slider('radius', 'Start radius', 0, 40, 1), slider('dim', 'Dim behind reveal', 0, 0.9, 0.05)],
    docs: [
      ['src / alt / media', 'string / string / ReactNode', '-', 'An image, or any node (video, canvas) via media.'],
      ['heading', 'ReactNode', '-', 'Shown above the small frame; fades as the zoom starts.'],
      ['children', 'ReactNode', '-', 'Revealed over the full-bleed media after the zoom.'],
      ['length / zoomEnd', 'number', '3 / 0.6', 'Section length in screen heights, and the share of it spent zooming (the rest reveals).'],
      ['startWidth / startAspect / radius', 'number', '0.46 / 4:3 / 18', 'The starting frame.'],
      ['dim / dimColor / mediaStyle', 'number / string / CSSProperties', '0.55 / ink / -', 'Darkening behind the reveal; style for the image (e.g. pixelated).'],
      ['Scrolling', '-', '-', 'Pins inside the page or the nearest scroll container. Reduced motion shows the final state, unpinned.']
    ],
    usage: `import ScrollZoom from "./ScrollZoom";

<ScrollZoom src="/hero.jpg" alt="" heading={<h2>Meet the grove</h2>}>
  <h3>Petals all year</h3>
</ScrollZoom>`,
    render: props => <ZoomDemo {...props} />
  },

  'parallax-collage': {
    source: parallaxCollageSource,
    defaults: { range: 160, spin: 6, pointer: true, pointerRange: 18, depthBlur: 0 },
    controls: [slider('range', 'Scroll drift (px)', 0, 400, 10), slider('spin', 'Rotation drift (°)', 0, 20, 1), toggle('pointer', 'Lean toward pointer'), slider('pointerRange', 'Lean (px)', 0, 60, 2), slider('depthBlur', 'Depth blur', 0, 10, 0.5)],
    docs: [
      ['pieces', '{ id?, src? | content?, alt?, x, y, width, depth, rotate?, style? }[]', '[]', 'Position and width in % of the collage; depth 0 (far, slow) to 1 (near, fast).'],
      ['children', 'ReactNode', '-', 'Your content in the middle layer, above every piece.'],
      ['height', 'number | string', '520', 'Collage height.'],
      ['range / spin', 'number', '160 / 6', 'Maximum vertical drift (px) and rotation drift (°) for a depth-1 piece.'],
      ['pointer / pointerRange', 'boolean / number', 'true / 18', 'Lean toward the mouse (not touch).'],
      ['depthBlur', 'number', '0', 'Blurs the farthest pieces for depth of field.'],
      ['Accessibility', '-', '-', 'Pieces are decorative unless given alt. Pauses off-screen; still under reduced motion.']
    ],
    usage: `import ParallaxCollage from "./ParallaxCollage";

<ParallaxCollage
  pieces={[{ src: "/a.jpg", x: 5, y: 10, width: 30, depth: 0.2 }]}
>
  <h2>Our world</h2>
</ParallaxCollage>`,
    render: props => <CollageDemo {...props} />
  },

  'chapter-progress': {
    source: chapterProgressSource,
    defaults: { offset: 72, wordsPerMinute: 220, showTime: true, accentColor: '#73eff7' },
    controls: [slider('offset', 'Heading offset (px)', 0, 160, 4), slider('wordsPerMinute', 'Reading speed (wpm)', 100, 400, 10), toggle('showTime', 'Time left'), color('accentColor', 'Accent')],
    docs: [
      ['target', 'RefObject<HTMLElement>', '-', 'The article to track (required).'],
      ['selector', 'string', '"h2"', 'Which headings count as chapters.'],
      ['offset', 'number', '72', 'Space a heading keeps below the top when jumped to (the bar height, plus breathing room).'],
      ['wordsPerMinute / showTime', 'number / boolean', '220 / true', 'Reading-time estimate for what is left.'],
      ['listLabel / label', 'string', '"Chapters" / "Reading progress"', 'Menu button and landmark labels.'],
      ['Placement', '-', '-', 'Put it in a sticky wrapper above the article. Works with the page or any scroller.'],
      ['Accessibility', '-', '-', 'A nav landmark with a progressbar; the chapter list is the keyboard path and moves focus to the heading.']
    ],
    usage: `import ChapterProgress from "./ChapterProgress";

const article = useRef(null);
<div style={{ position: "sticky", top: 0 }}>
  <ChapterProgress target={article} />
</div>
<article ref={article}>…</article>`,
    render: props => <ChapterDemo {...props} />
  }
};
