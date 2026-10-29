import { useState } from 'react';
import Sprite from './pixel/Sprite';
import PixelAvatar from './bits/PixelAvatar';
import DirectionHover from './bits/DirectionHover';
import PinCard from './bits/PinCard';
import CipherCard from './bits/CipherCard';
import FocusGrid from './bits/FocusGrid';
import StoryViewer from './bits/StoryViewer';
import LightboxGallery from './bits/LightboxGallery';
import directionHoverSource from './bits/DirectionHover.jsx?raw';
import pinCardSource from './bits/PinCard.jsx?raw';
import cipherCardSource from './bits/CipherCard.jsx?raw';
import focusGridSource from './bits/FocusGrid.jsx?raw';
import storyViewerSource from './bits/StoryViewer.jsx?raw';
import lightboxGallerySource from './bits/LightboxGallery.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", monospace';
const pixelated = { imageRendering: 'pixelated' };
const stack = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18, justifyItems: 'center', width: '100%', padding: '28px 16px', boxSizing: 'border-box' };
const hint = { margin: 0, color: 'var(--demo-muted, #94b0c2)', font: `14px/1.4 ${PIXEL_FONT}`, textAlign: 'center' };
const biome = id => `/pixel/biome-${id}.png`;

const BIOMES = [
  ['plains', 'Plains', 'Rolling grass and easy first nights.'],
  ['forest', 'Forest', 'Oak, birch and the odd wolf.'],
  ['desert', 'Desert', 'Sand, cacti and buried temples.'],
  ['snowy', 'Snowy peaks', 'Ice, igloos and very cold toes.'],
  ['ocean', 'Ocean', 'Deep water and sunken ruins.'],
  ['cherry', 'Cherry grove', 'Petals all year round.'],
  ['jungle', 'Jungle', 'Vines, parrots and hidden caves.'],
  ['mesa', 'Mesa', 'Striped cliffs and gold veins.'],
  ['night', 'Night sky', 'Stars, quiet and the occasional ghost.'],
  ['underworld', 'Underworld', 'Lava seas and glowing fungus.'],
  ['cave', 'Caves', 'Torches every eight blocks.'],
  ['void', 'The void', 'Floating islands over nothing.']
];
const img = (id, extra = {}) => <img src={biome(id)} alt="" style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', ...pixelated, ...extra }} />;
const cardTitle = { margin: 0, font: `12px/1.6 ${TITLE_FONT}`, color: 'var(--demo-gold, #ffcd75)' };

// ---------- DirectionHover ----------

function DirectionDemo(props) {
  return (
    <div style={stack}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, width: '100%', maxWidth: 760 }}>
        {BIOMES.slice(0, 6).map(([id, name, text]) => (
          <DirectionHover
            key={id}
            {...props}
            overlay={
              <div style={{ display: 'grid', gap: 6, font: `14px/1.4 ${PIXEL_FONT}` }}>
                <h3 style={cardTitle}>{name}</h3>
                <span style={{ color: 'var(--demo-muted, #94b0c2)' }}>{text}</span>
                <a href={`#${id}`} style={{ color: 'var(--demo-accent, #73eff7)' }} onClick={event => event.preventDefault()}>
                  Explore {name.toLowerCase()} →
                </a>
              </div>
            }
          >
            {img(id)}
          </DirectionHover>
        ))}
      </div>
      <p style={hint}>Sweep the pointer across the grid: each overlay follows your direction.</p>
    </div>
  );
}

// ---------- PinCard ----------

function PinDemo(props) {
  return (
    <div style={{ ...stack, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', maxWidth: 720, margin: '0 auto', paddingTop: 12 }}>
      {[
        ['forest', 'Forest outpost', 'A cabin, a campfire and a map table.', '/biomes/forest'],
        ['snowy', 'Ice palace', 'Built block by block over a whole winter.', '/biomes/snowy']
      ].map(([id, name, text, path]) => (
        <div key={id} style={{ display: 'grid', justifyItems: 'center' }}>
          <PinCard {...props} title={path} fontFamily={PIXEL_FONT}>
            {img(id)}
            <div style={{ display: 'grid', gap: 6, padding: 14, font: `14px/1.4 ${PIXEL_FONT}` }}>
              <h3 style={cardTitle}>{name}</h3>
              <span style={{ color: 'var(--demo-muted, #94b0c2)' }}>{text}</span>
            </div>
          </PinCard>
        </div>
      ))}
    </div>
  );
}

// ---------- CipherCard ----------

const GRADIENTS = {
  ice: 'linear-gradient(135deg, #41a6f6, #73eff7 45%, #a7f070)',
  ember: 'linear-gradient(135deg, #b13e53, #ef7d57 50%, #ffcd75)',
  void: 'linear-gradient(135deg, #5d275d, #3b5dc9 50%, #73eff7)'
};

function CipherDemo({ palette, ...props }) {
  return (
    <div style={stack}>
      <CipherCard {...props} gradient={GRADIENTS[palette]} fontFamily={PIXEL_FONT}>
        <div style={{ display: 'grid', justifyItems: 'center', gap: 8 }}>
          <Sprite name="gem" size={40} />
          <span style={{ font: `10px/1.6 ${TITLE_FONT}`, color: 'var(--demo-ink, #f4f4f4)' }}>SECRET</span>
        </div>
      </CipherCard>
      <p style={hint}>Move the pointer over the card.</p>
    </div>
  );
}

// ---------- FocusGrid ----------

function FocusDemo(props) {
  return (
    <div style={{ ...stack, maxWidth: 820, margin: '0 auto' }}>
      <FocusGrid {...props} label="Biomes">
        {BIOMES.slice(0, 8).map(([id, name, text]) => (
          <a key={id} href={`#${id}`} onClick={event => event.preventDefault()} style={{ display: 'block', overflow: 'hidden', borderRadius: 14, background: 'var(--demo-bg, #1a1c2c)', boxShadow: '0 0 0 1px var(--demo-line, #333c57)', color: 'var(--demo-ink, #f4f4f4)', textDecoration: 'none' }}>
            {img(id)}
            <div style={{ display: 'grid', gap: 4, padding: 12, font: `14px/1.4 ${PIXEL_FONT}` }}>
              <h3 style={cardTitle}>{name}</h3>
              <span style={{ color: 'var(--demo-muted, #94b0c2)' }}>{text}</span>
            </div>
          </a>
        ))}
      </FocusGrid>
    </div>
  );
}

// ---------- StoryViewer ----------

const SLIDES = [
  { src: biome('plains'), alt: 'Sunrise over the plains', caption: 'Day one. Found a nice spot by the river.', style: pixelated },
  { src: biome('forest'), alt: 'A dense forest', caption: 'Wood for the cabin, check.', style: pixelated },
  {
    content: (
      <div style={{ display: 'grid', placeItems: 'center', gap: 14, width: '100%', height: '100%', background: 'radial-gradient(#29366f, #0b0b14)' }}>
        <Sprite name="gem" size={72} />
        <span style={{ font: `12px/1.6 ${TITLE_FONT}` }}>FIRST GEM!</span>
      </div>
    ),
    alt: 'A glowing gem',
    caption: 'Found it three blocks under the waterfall.',
    duration: 3500
  },
  { src: biome('night'), alt: 'A starry night', caption: 'Made it through the night.', style: pixelated }
];

function StoryDemo(props) {
  const [ended, setEnded] = useState(false);
  const [run, setRun] = useState(0);
  return (
    <div style={stack}>
      <StoryViewer
        key={run}
        {...props}
        slides={SLIDES}
        author="Pip"
        timestamp="2h"
        avatar={<PixelAvatar seed="pip" size={32} decorative />}
        fontFamily={PIXEL_FONT}
        onEnd={() => setEnded(true)}
        onChange={() => setEnded(false)}
      />
      <p style={hint}>
        {ended ? (
          <button
            type="button"
            onClick={() => {
              setEnded(false);
              setRun(n => n + 1);
            }}
            style={{ font: 'inherit', color: 'var(--demo-accent, #73eff7)', background: 'none', border: 0, cursor: 'pointer' }}
          >
            Watch again
          </button>
        ) : (
          'Tap the sides to skip, press and hold to pause.'
        )}
      </p>
    </div>
  );
}

// ---------- LightboxGallery ----------

const GALLERY = BIOMES.map(([id, name, text]) => ({ src: biome(id), alt: name, caption: `${name}: ${text}` }));

// ---------- Entries ----------

export const CARDS_MORE_DEMOS = {
  'direction-hover': {
    source: directionHoverSource,
    defaults: { duration: 320, zoom: 1.06, radius: 14 },
    controls: [slider('duration', 'Slide (ms)', 100, 800, 20), slider('zoom', 'Image zoom', 1, 1.2, 0.01), slider('radius', 'Radius', 0, 28, 1)],
    docs: [
      ['children', 'ReactNode', '-', 'The card’s base (an image, usually).'],
      ['overlay', 'ReactNode', '-', 'Slides in from the edge the pointer entered, leaves toward the edge it exited.'],
      ['duration / zoom', 'number', '320 / 1.06', 'Slide time and how much the base zooms while open.'],
      ['overlayColor', 'string', 'dark gradient', 'Any CSS background.'],
      ['Keyboard', '-', '-', 'Focusing a link inside raises the overlay from the bottom; the overlay is always readable by screen readers.']
    ],
    usage: `import DirectionHover from "./DirectionHover";

<DirectionHover overlay={<a href="/forest">Forest</a>}>
  <img src="/forest.png" alt="" />
</DirectionHover>`,
    render: props => <DirectionDemo {...props} />
  },

  'pin-card': {
    source: pinCardSource,
    defaults: { width: 300, radius: 16, accentColor: '#73eff7' },
    controls: [slider('width', 'Width', 220, 380, 10), slider('radius', 'Radius', 0, 28, 1), color('accentColor', 'Beam')],
    docs: [
      ['children', 'ReactNode', '-', 'Card content.'],
      ['title', 'ReactNode', '-', 'The label pill that rises above the pin.'],
      ['href / target', 'string', '-', 'Makes the whole card a link (otherwise it is a focusable div).'],
      ['width / radius', 'number', '300 / 16', 'Card size.'],
      ['accentColor', 'string', 'cyan', 'Beam, pin and glow.'],
      ['Interaction', '-', '-', 'Hover or keyboard focus tips the card back and lights the pin; reduced motion keeps it flat.']
    ],
    usage: `import PinCard from "./PinCard";

<PinCard title="/docs/install" href="/docs/install">
  <Preview />
</PinCard>`,
    render: props => <PinDemo {...props} />
  },

  'cipher-card': {
    source: cipherCardSource,
    defaults: { spotlight: 160, density: 1800, palette: 'ice' },
    controls: [slider('spotlight', 'Spotlight radius', 60, 300, 10), slider('density', 'Characters', 400, 3000, 100), select('palette', 'Gradient', ['ice', 'ember', 'void'])],
    docs: [
      ['children', 'ReactNode', '-', 'Content on the center badge.'],
      ['spotlight', 'number', '160', 'Radius of the reveal around the pointer, in px.'],
      ['density / charset', 'number / string', '1800 / A–Z a–z 0–9 symbols', 'How many characters, and which.'],
      ['gradient', 'string', 'ice', 'The tint under the characters.'],
      ['width / aspectRatio / radius', 'number / string / number', '320 / "1" / 18', 'Card shape.'],
      ['Accessibility', '-', '-', 'The cipher layer is decorative (aria-hidden); it stops reshuffling under reduced motion.']
    ],
    usage: `import CipherCard from "./CipherCard";

<CipherCard>
  <strong>Encrypted</strong>
</CipherCard>`,
    demoOnly: ['palette'],
    render: props => <CipherDemo {...props} />
  },

  'focus-grid': {
    source: focusGridSource,
    defaults: { blur: 4, dim: 0.45, minWidth: 180, lift: 1.02 },
    controls: [slider('blur', 'Blur (px)', 0, 12, 1), slider('dim', 'Dim', 0.1, 1, 0.05), slider('minWidth', 'Card min width', 140, 320, 10), slider('lift', 'Lift', 1, 1.08, 0.01)],
    docs: [
      ['children', 'ReactNode[]', '-', 'Each child becomes a card in a list.'],
      ['minWidth / gap', 'number', '220 / 16', 'Auto-fill column width and spacing.'],
      ['blur / dim / shrink / lift', 'number', '4 / 0.45 / 0.97 / 1.02', 'What happens to the other cards, and to the focused one.'],
      ['duration', 'number', '300', 'Transition time in ms.'],
      ['How', '-', '-', 'Pure CSS (:has with :hover and :focus-within), so keyboard focus works the same as hover.']
    ],
    usage: `import FocusGrid from "./FocusGrid";

<FocusGrid>
  {posts.map(post => <PostCard key={post.id} post={post} />)}
</FocusGrid>`,
    render: props => <FocusDemo {...props} />
  },

  'story-viewer': {
    source: storyViewerSource,
    defaults: { duration: 5000, loop: false, width: 300 },
    controls: [slider('duration', 'Slide time (ms)', 1500, 10000, 500), toggle('loop', 'Loop'), slider('width', 'Width', 240, 380, 10)],
    docs: [
      ['slides', '{ src? | content?, type?, alt?, caption?, duration?, style? }[]', '[]', 'Images, videos (they set their own length) or any content.'],
      ['author / avatar / timestamp', 'string / ReactNode / string', '-', 'The header.'],
      ['duration / loop / startAt', 'number / boolean / number', '5000 / false / 0', 'Default slide time and playback.'],
      ['onChange / onEnd', '(index) => void / () => void', '-', 'Slide changes, and the end of the story.'],
      ['Gestures', '-', '-', 'Tap left third for back, right two-thirds for next; press and hold to pause.'],
      ['Accessibility', '-', '-', 'Arrow keys, Space to pause, a pause button; each slide is announced; pauses when the tab is hidden.']
    ],
    usage: `import StoryViewer from "./StoryViewer";

<StoryViewer author="Pip" slides={[{ src: "/day1.jpg", caption: "Day one" }]} />`,
    render: props => <StoryDemo {...props} />
  },

  'lightbox-gallery': {
    source: lightboxGallerySource,
    defaults: { thumbSize: 150, gap: 10, aspectRatio: '1', radius: 10 },
    controls: [slider('thumbSize', 'Thumb size', 90, 260, 10), slider('gap', 'Gap', 2, 24, 1), select('aspectRatio', 'Thumb shape', ['1', '4 / 3', '16 / 9']), slider('radius', 'Radius', 0, 24, 1)],
    docs: [
      ['images', '{ src, alt?, caption?, thumb? }[]', '[]', 'thumb is an optional smaller image for the grid.'],
      ['thumbSize / gap / aspectRatio / radius', 'number / number / string / number', '160 / 10 / "1" / 10', 'Grid layout.'],
      ['imageStyle', 'CSSProperties', '-', 'Applied to thumbs and the full image (e.g. pixelated).'],
      ['Viewer', '-', '-', 'Opens out of the thumbnail; swipe or ← → to move; wheel, pinch, double-click or + / − / 0 to zoom; drag to pan when zoomed.'],
      ['Accessibility', '-', '-', 'Modal dialog: focus trapped, scroll locked, Esc closes, focus returns to the thumbnail; position announced.']
    ],
    usage: `import LightboxGallery from "./LightboxGallery";

<LightboxGallery images={[{ src: "/a.jpg", alt: "Harbor at dawn", caption: "Dawn" }]} />`,
    render: props => (
      <div style={stack}>
        <LightboxGallery {...props} images={GALLERY} imageStyle={pixelated} label="Biomes" fontFamily={PIXEL_FONT} />
        <p style={hint}>Click a biome to open it. Swipe, zoom and pan in the viewer.</p>
      </div>
    )
  }
};
