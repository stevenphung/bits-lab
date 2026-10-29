import Sprite from './pixel/Sprite';
import StickyReveal from './bits/StickyReveal';
import ScrollTilt from './bits/ScrollTilt';
import TracingLine from './bits/TracingLine';
import HorizontalTrack from './bits/HorizontalTrack';
import stickyRevealSource from './bits/StickyReveal.jsx?raw';
import scrollTiltSource from './bits/ScrollTilt.jsx?raw';
import tracingLineSource from './bits/TracingLine.jsx?raw';
import horizontalTrackSource from './bits/HorizontalTrack.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", monospace';
const pixelated = { imageRendering: 'pixelated' };
const biome = id => `/pixel/biome-${id}.png`;
const BOX_HEIGHT = 560;

// Every demo scrolls inside its own box, so the effect can be tried without leaving the page.
function ScrollBox({ children, top = 'Scroll inside this box ↓', bottom = 'The end. Scroll back up ↑', topHeight = 160, bottomHeight = 240 }) {
  const note = height => ({ height, display: 'grid', placeItems: 'center', color: 'var(--demo-muted, #94b0c2)', font: `14px ${PIXEL_FONT}`, textAlign: 'center', padding: '0 16px' });
  return (
    <div style={{ width: '100%', height: BOX_HEIGHT, overflowY: 'auto', overflowX: 'hidden', background: 'var(--demo-scroll, linear-gradient(#1a1c2c, #202640))', borderRadius: 4 }}>
      <div style={note(topHeight)}>{top}</div>
      {children}
      <div style={note(bottomHeight)}>{bottom}</div>
    </div>
  );
}

const JOURNEY = [
  { scene: 'plains', icon: 'grass', title: 'Day one on the plains', body: 'You wake up in a field with nothing but your hands. Punch a tree, build a workbench and get a roof up before the sun sets.' },
  { scene: 'forest', icon: 'pickaxe', title: 'Into the forest', body: 'Oak and birch for every build. Wolves watch from the trees, and the canopy hides a few things worth finding.' },
  { scene: 'cave', icon: 'gem', title: 'Down in the caves', body: 'Torches every eight blocks. Ore veins glitter in the walls, and something is shuffling in the dark.' },
  { scene: 'underworld', icon: 'potion', title: 'The underworld', body: 'Lava seas, glowing fungus and the rarest brewing ingredients. Pack fire resistance and a way home.' },
  { scene: 'void', icon: 'star', title: 'The edge of the world', body: 'Floating islands over nothing. The final challenge waits out here, for anyone brave enough to jump.' }
];

function SceneMedia({ scene, icon }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img src={biome(scene)} alt="" style={{ ...pixelated, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <div style={{ position: 'absolute', left: 14, bottom: 14, display: 'grid', placeItems: 'center', width: 56, height: 56, background: 'rgba(26,28,44,0.8)', boxShadow: '0 0 0 3px #ffcd75' }}>
        <Sprite name={icon} size={38} />
      </div>
    </div>
  );
}

const journeySections = JOURNEY.map(step => ({ id: step.scene, title: step.title, body: step.body, media: <SceneMedia scene={step.scene} icon={step.icon} /> }));

const CHANGELOG = [
  { version: '1.5', date: 'Oct 2026', icon: 'star', title: 'The Void Update', body: 'Floating islands, a new end boss and elytra-style gliding.', scene: 'void' },
  { version: '1.4', date: 'Jul 2026', icon: 'potion', title: 'Brewing overhaul', body: '48 recipes, splash potions and a cauldron you can actually see into.' },
  { version: '1.3', date: 'Apr 2026', icon: 'gem', title: 'Caves & Cliffs', body: 'Deeper worlds, dripstone, glow lichen and gems that only spawn above the snowline.', scene: 'cave' },
  { version: '1.2', date: 'Jan 2026', icon: 'heart', title: 'Villages', body: 'Villagers trade, sleep and panic. Iron golems keep the peace.' },
  { version: '1.1', date: 'Oct 2025', icon: 'chest', title: 'Storage', body: 'Double chests, barrels and the inventory sort button everyone asked for.' },
  { version: '1.0', date: 'Jul 2025', icon: 'grass', title: 'Launch', body: 'Twelve biomes, day and night, and a lot of punching trees.', scene: 'plains' }
];

function ChangelogEntry({ entry }) {
  return (
    <article style={{ paddingBottom: 44, color: 'var(--demo-ink, #f4f4f4)', font: `15px/1.55 ${PIXEL_FONT}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--demo-muted, #94b0c2)', fontSize: 13 }}>
        <span style={{ padding: '3px 7px', background: 'var(--demo-panel, #29366f)', color: 'var(--demo-accent, #73eff7)', font: `9px ${TITLE_FONT}` }}>v{entry.version}</span>
        {entry.date}
      </div>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '10px 0 6px', font: `12px/1.5 ${TITLE_FONT}` }}>
        <Sprite name={entry.icon} size={22} />
        {entry.title}
      </h3>
      <p style={{ margin: 0, color: 'var(--demo-muted, #94b0c2)' }}>{entry.body}</p>
      {entry.scene && <img src={biome(entry.scene)} alt="" style={{ ...pixelated, display: 'block', width: '100%', maxWidth: 440, marginTop: 14, boxShadow: '0 0 0 3px #333c57' }} />}
    </article>
  );
}

const BIOME_CARDS = [
  ['plains', 'Plains', 'grass'],
  ['forest', 'Forest', 'pickaxe'],
  ['desert', 'Desert', 'coin'],
  ['snowy', 'Snowy Peaks', 'gem'],
  ['ocean', 'Ocean', 'orb'],
  ['jungle', 'Jungle', 'heart'],
  ['mesa', 'Mesa', 'chest'],
  ['cherry', 'Blossom Hills', 'note'],
  ['cave', 'Deep Cave', 'lever'],
  ['underworld', 'Underworld', 'potion'],
  ['void', 'Void Isles', 'star']
];

function BiomeCard({ scene, name, icon, index }) {
  return (
    <div style={{ background: 'var(--demo-bg, #1a1c2c)', boxShadow: '0 0 0 3px var(--demo-line, #333c57), 0 10px 0 rgba(0,0,0,0.35)' }}>
      <img src={biome(scene)} alt="" style={{ ...pixelated, display: 'block', width: '100%', aspectRatio: '3 / 2', objectFit: 'cover' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
        <Sprite name={icon} size={28} />
        <div>
          <div style={{ font: `10px/1.5 ${TITLE_FONT}`, color: 'var(--demo-ink, #f4f4f4)' }}>{name}</div>
          <div style={{ font: `13px ${PIXEL_FONT}`, color: 'var(--demo-muted, #94b0c2)' }}>Biome {String(index + 1).padStart(2, '0')}</div>
        </div>
      </div>
    </div>
  );
}

const DEMO_ENTRIES = {
  'sticky-reveal': {
    source: stickyRevealSource,
    defaults: { effect: 'fade', mediaSide: 'right', activeLine: 0.5, showDots: true, radius: 4, accentColor: '#ffcd75' },
    controls: [
      select('effect', 'Transition', ['fade', 'zoom', 'slide']),
      select('mediaSide', 'Media side', ['right', 'left']),
      slider('activeLine', 'Activation line', 0.2, 0.8, 0.05),
      toggle('showDots', 'Progress dots'),
      slider('radius', 'Radius', 0, 28, 1),
      color('accentColor', 'Accent')
    ],
    docs: [
      ['sections', '{ id?, title, body, media }[]', '[]', 'Story steps. body can be a string or any node; media shows in the sticky column.'],
      ['effect', '"fade" | "zoom" | "slide"', '"fade"', 'How media swaps. Slide wipes the next image up over the last.'],
      ['mediaSide', '"right" | "left"', '"right"', 'Which side the sticky column sits on.'],
      ['sectionHeight / stageHeight / stickyTop', 'string', '"80vh" / "70vh" / "15vh"', 'Section min-height, media height and sticky offset. Use px inside a scroll box.'],
      ['activeLine', 'number', '0.5', 'Where in the viewport (0 top, 1 bottom) a section becomes active.'],
      ['onChange', '(index) => void', '-', 'Called when the active section changes.'],
      ['showDots', 'boolean', 'true', 'Progress dots on the media.'],
      ['textColor / mutedColor / accentColor / stageColor', 'string', 'Sweetie 16', 'Colors. Under 640px of container width, media moves inline above each section.']
    ],
    usage: `import StickyReveal from "./StickyReveal";

<StickyReveal
  sections={[
    { title: "Day one", body: "Punch a tree.", media: <img src="/plains.png" alt="" /> },
    { title: "The caves", body: "Bring torches.", media: <img src="/cave.png" alt="" /> }
  ]}
  effect="fade"
/>`,
    render: props => (
      <ScrollBox key={props.effect}>
        <div style={{ padding: '0 24px' }}>
          <StickyReveal
            {...props}
            sections={journeySections}
            sectionHeight="420px"
            stageHeight="340px"
            stickyTop="110px"
            gap={32}
            titleSize={13}
            fontFamily={PIXEL_FONT}
            titleFontFamily={TITLE_FONT}
            labelFontFamily={TITLE_FONT}
          />
        </div>
      </ScrollBox>
    )
  },

  'scroll-tilt': {
    source: scrollTiltSource,
    defaults: { tilt: 32, scale: 0.88, lift: 40, end: 0.35, shine: true, radius: 4 },
    controls: [
      slider('tilt', 'Starting tilt', 0, 70, 1),
      slider('scale', 'Starting scale', 0.6, 1, 0.01),
      slider('lift', 'Starting drop (px)', 0, 120, 2),
      slider('end', 'Flat at (viewport share)', 0.05, 0.8, 0.05),
      toggle('shine', 'Light sweep'),
      slider('radius', 'Radius', 0, 28, 1)
    ],
    docs: [
      ['children', 'ReactNode', '-', 'The product shot: an image, video, device frame or live UI.'],
      ['tilt / scale / lift', 'number', '32 / 0.88 / 40', 'Starting rotation (degrees), scale and downward offset (px).'],
      ['start / end', 'number', '1 / 0.35', 'Viewport positions (0 top, 1 bottom) of the card top where the effect starts and where it is fully flat.'],
      ['perspective', 'number', '1200', '3D perspective in px; lower is more dramatic.'],
      ['shine / shineColor', 'boolean / string', 'true', 'Light sweep across the card as it settles.'],
      ['radius / borderWidth / borderColor / shadowColor', 'number / string', '16 / 1', 'Card styling.']
    ],
    usage: `import ScrollTilt from "./ScrollTilt";

<ScrollTilt
  tilt={32}
>
  <img src="/dashboard.png" alt="Product dashboard" />
</ScrollTilt>`,
    render: props => (
      <ScrollBox top="Scroll down to bring the world into view ↓" topHeight={BOX_HEIGHT} bottomHeight={420}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px' }}>
          <ScrollTilt {...props}>
            <SceneMedia scene="cherry" icon="note" />
          </ScrollTilt>
          <p style={{ margin: '36px 0 0', color: 'var(--demo-muted, #94b0c2)', font: `16px/1.6 ${PIXEL_FONT}`, textAlign: 'center' }}>Blossom Hills: the calmest biome in the game.</p>
        </div>
      </ScrollBox>
    )
  },

  'tracing-line': {
    source: tracingLineSource,
    defaults: { lineWidth: 3, markerSize: 14, square: true, activeLine: 0.55, fromColor: '#41a6f6', toColor: '#73eff7' },
    controls: [
      slider('lineWidth', 'Line width', 1, 8, 1),
      slider('markerSize', 'Marker size', 6, 24, 1),
      toggle('square', 'Square (pixel) markers'),
      slider('activeLine', 'Draw to (viewport share)', 0.2, 0.9, 0.05),
      color('fromColor', 'Line start'),
      color('toColor', 'Line end')
    ],
    docs: [
      ['children', 'ReactNode', '-', 'Entries. Each direct child gets a marker, placed markerOffset px below its top.'],
      ['activeLine', 'number', '0.55', 'Viewport position (0 top, 1 bottom) the line draws down to.'],
      ['gutter / lineWidth / markerSize / markerOffset', 'number', '56 / 3 / 14 / 14', 'Geometry in px.'],
      ['square', 'boolean', 'false', 'Square markers and head, for a pixel look.'],
      ['fromColor / toColor / glowColor / trackColor / backgroundColor', 'string', 'blue → cyan', 'Colors. backgroundColor fills unpassed markers.']
    ],
    usage: `import TracingLine from "./TracingLine";

<TracingLine
  square
>
  <article>v1.5: The Void Update</article>
  <article>v1.4: Brewing overhaul</article>
</TracingLine>`,
    render: props => (
      <ScrollBox topHeight={200}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '0 16px' }}>
          <TracingLine {...props}>
            {CHANGELOG.map(entry => (
              <ChangelogEntry key={entry.version} entry={entry} />
            ))}
          </TracingLine>
        </div>
      </ScrollBox>
    )
  },

  'horizontal-track': {
    source: horizontalTrackSource,
    defaults: { itemWidth: 300, gap: 24, snap: true, showProgress: true, accentColor: '#ffcd75' },
    controls: [
      slider('itemWidth', 'Item width', 180, 520, 10),
      slider('gap', 'Gap', 8, 64, 2),
      toggle('snap', 'Snap to items'),
      toggle('showProgress', 'Progress bar'),
      color('accentColor', 'Accent')
    ],
    docs: [
      ['children', 'ReactNode[]', '-', 'Gallery items. Each becomes a focusable list item; tabbing scrolls it into view.'],
      ['header', 'ReactNode', '-', 'Content pinned above the track.'],
      ['itemWidth / gap / padding', 'number', '420 / 24 / 48', 'Item size and spacing in px.'],
      ['stageHeight', 'string', '"100vh"', 'Height of the pinned stage. Use the scroll box height when inside one.'],
      ['snap', 'boolean', 'true', 'After scrolling stops, glide to the nearest item.'],
      ['showProgress', 'boolean', 'true', 'Counter and progress bar under the track.'],
      ['accentColor / mutedColor / trackColor', 'string', 'Sweetie 16', 'Colors. Under reduced motion it becomes a swipeable row with scroll snap.']
    ],
    usage: `import HorizontalTrack from "./HorizontalTrack";

<HorizontalTrack
  header={<h2>Explore the biomes</h2>}
  itemWidth={300}
>
  {biomes.map(b => <BiomeCard key={b.id} {...b} />)}
</HorizontalTrack>`,
    render: props => (
      <ScrollBox key={`${props.itemWidth}-${props.gap}`} topHeight={140}>
        <HorizontalTrack
          {...props}
          stageHeight={`${BOX_HEIGHT}px`}
          padding={24}
          fontFamily={PIXEL_FONT}
          label="Biomes"
          header={<div style={{ font: `clamp(11px, 2.4vw, 15px)/1.5 ${TITLE_FONT}`, color: 'var(--demo-gold, #ffcd75)' }}>EXPLORE THE BIOMES</div>}
        >
          {BIOME_CARDS.map(([scene, name, icon], index) => (
            <BiomeCard key={scene} scene={scene} name={name} icon={icon} index={index} />
          ))}
        </HorizontalTrack>
      </ScrollBox>
    )
  }
};

export const SCROLL_DEMOS = DEMO_ENTRIES;
