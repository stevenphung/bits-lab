import { useMemo, useRef } from 'react';
import Sprite from './pixel/Sprite';
import DeviceFrame from './bits/DeviceFrame';
import ScreenScroller from './bits/ScreenScroller';
import DotGlobe from './bits/DotGlobe';
import DotMap from './bits/DotMap';
import ConnectBeams from './bits/ConnectBeams';
import BentoGrid, { BentoCard } from './bits/BentoGrid';
import FeatureTabs from './bits/FeatureTabs';
import CompareSlider from './bits/CompareSlider';
import TerminalDemo from './bits/TerminalDemo';
import deviceFrameSource from './bits/DeviceFrame.jsx?raw';
import screenScrollerSource from './bits/ScreenScroller.jsx?raw';
import dotGlobeSource from './bits/DotGlobe.jsx?raw';
import dotMapSource from './bits/DotMap.jsx?raw';
import connectBeamsSource from './bits/ConnectBeams.jsx?raw';
import bentoGridSource from './bits/BentoGrid.jsx?raw';
import featureTabsSource from './bits/FeatureTabs.jsx?raw';
import compareSliderSource from './bits/CompareSlider.jsx?raw';
import terminalDemoSource from './bits/TerminalDemo.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });
const text = (name, label) => ({ name, type: 'text', label });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", monospace';
const pixelated = { imageRendering: 'pixelated' };
const biome = id => `/pixel/biome-${id}.png`;
const BIOME_OPTIONS = ['plains', 'forest', 'desert', 'snowy', 'ocean', 'jungle', 'mesa', 'night', 'underworld', 'void', 'cave', 'cherry'];

// ---------- Shared demo screens ----------

const QUESTS = [
  ['sword', 'Clear the cave', '+40 XP'],
  ['gem', 'Find 3 gems', '2 / 3'],
  ['potion', 'Brew a potion', 'New'],
  ['book', 'Read the old tome', '+15 XP'],
  ['chest', 'Open the vault', 'Locked']
];

function PixelAppScreen({ scene = 'plains', compact = false }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#1a1c2c', color: '#f4f4f4', font: `14px/1.3 ${PIXEL_FONT}`, overflow: 'hidden' }}>
      <img src={biome(scene)} alt="" style={{ ...pixelated, position: 'absolute', inset: 0, width: '100%', height: compact ? '100%' : '46%', objectFit: 'cover' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: compact ? '12% 10% 0' : '15% 7% 0' }}>
        <Sprite name="heart" size={compact ? 16 : 22} />
        <span style={{ font: `${compact ? 7 : 9}px ${TITLE_FONT}`, textShadow: '1px 1px 0 #1a1c2c' }}>BLOCK QUEST</span>
        <Sprite name="coin" size={compact ? 16 : 22} />
      </div>
      {compact ? (
        <div style={{ position: 'absolute', left: '10%', right: '10%', bottom: '14%', padding: '8px 10px', background: 'rgba(26,28,44,0.85)', boxShadow: '0 0 0 2px #ffcd75', textAlign: 'center' }}>
          <div style={{ font: `8px ${TITLE_FONT}`, color: '#ffcd75' }}>12:00</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Day 37 · Sunny</div>
        </div>
      ) : (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '42%', bottom: 0, padding: '6% 6% 0', background: '#1a1c2c', borderTop: '3px solid #333c57' }}>
          <div style={{ font: `8px ${TITLE_FONT}`, color: '#94b0c2', marginBottom: 10 }}>TODAY'S QUESTS</div>
          {QUESTS.map(([icon, title, tag]) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', marginBottom: 7, background: '#29366f', boxShadow: 'inset 0 -3px 0 #1a1c2c' }}>
              <Sprite name={icon} size={20} />
              <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
              <span style={{ fontSize: 12, color: '#a7f070' }}>{tag}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PixelWebsite({ scene = 'plains' }) {
  const section = { padding: '28px 6%', color: '#f4f4f4', font: `15px/1.5 ${PIXEL_FONT}` };
  const heading = { margin: '0 0 12px', font: `14px/1.5 ${TITLE_FONT}`, color: '#ffcd75' };
  return (
    <div style={{ background: '#1a1c2c' }}>
      <div style={{ position: 'relative', aspectRatio: '16 / 9' }}>
        <img src={biome(scene)} alt="" style={{ ...pixelated, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', background: 'linear-gradient(transparent 40%, rgba(26,28,44,0.85))' }}>
          <div>
            <div style={{ font: `clamp(12px, 3vw, 22px)/1.4 ${TITLE_FONT}`, color: '#fff', textShadow: '3px 3px 0 #1a1c2c' }}>BLOCK QUEST</div>
            <div style={{ marginTop: 10, font: `16px ${PIXEL_FONT}`, color: '#ffcd75' }}>Build. Explore. Survive the night.</div>
          </div>
        </div>
      </div>
      <div style={{ ...section, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
        {[
          ['pickaxe', 'Mine', 'Dig deep for ores.'],
          ['sword', 'Fight', 'Defend your base.'],
          ['potion', 'Brew', 'Mix strange potions.']
        ].map(([icon, title, body]) => (
          <div key={title} style={{ padding: 14, background: '#29366f', boxShadow: 'inset 0 -4px 0 #1a1c2c', textAlign: 'center' }}>
            <Sprite name={icon} size={36} />
            <div style={{ font: `10px ${TITLE_FONT}`, margin: '10px 0 6px' }}>{title}</div>
            <div style={{ fontSize: 13, color: '#94b0c2' }}>{body}</div>
          </div>
        ))}
      </div>
      {['forest', 'snowy', 'underworld'].map((id, i) => (
        <div key={id} style={{ ...section, display: 'grid', gridTemplateColumns: i % 2 ? '1fr 1.2fr' : '1.2fr 1fr', gap: 18, alignItems: 'center' }}>
          {i % 2 ? null : <img src={biome(id)} alt="" style={{ ...pixelated, width: '100%', display: 'block', boxShadow: '0 0 0 3px #333c57' }} />}
          <div>
            <h4 style={heading}>{['Endless forests', 'Frozen peaks', 'The underworld'][i]}</h4>
            <p style={{ margin: 0, color: '#94b0c2' }}>{['Every seed grows a new world to wander.', 'Climb above the clouds for rare gems.', 'Brave the heat for the rarest loot.'][i]}</p>
          </div>
          {i % 2 ? <img src={biome(id)} alt="" style={{ ...pixelated, width: '100%', display: 'block', boxShadow: '0 0 0 3px #333c57' }} /> : null}
        </div>
      ))}
      <div style={{ ...section, textAlign: 'center', paddingBottom: 48 }}>
        <Sprite name="star" size={40} />
        <h4 style={{ ...heading, marginTop: 14 }}>PRESS START</h4>
        <p style={{ margin: 0, color: '#94b0c2' }}>Free on every platform. No account needed.</p>
      </div>
    </div>
  );
}

// ---------- Demo wrappers ----------

function ScrollerDemo(props) {
  return (
    <div style={{ width: '100%', height: 560, overflowY: 'auto', background: 'linear-gradient(#1a1c2c, #29366f)', borderRadius: 4 }}>
      <div style={{ height: 120, display: 'grid', placeItems: 'center', color: '#94b0c2', font: `14px ${PIXEL_FONT}` }}>Scroll inside this box ↓</div>
      <ScreenScroller
        {...props}
        stageHeight="560px"
        intro={
          <>
            <div style={{ font: `clamp(11px, 2.4vw, 16px)/1.5 ${TITLE_FONT}`, color: '#ffcd75' }}>A WORLD IN YOUR POCKET</div>
            <div style={{ marginTop: 8, font: `15px ${PIXEL_FONT}`, color: '#94b0c2' }}>Keep scrolling to tour the site.</div>
          </>
        }
      >
        <PixelWebsite scene={props.scene} />
      </ScreenScroller>
      <div style={{ height: 200, display: 'grid', placeItems: 'center', color: '#94b0c2', font: `14px ${PIXEL_FONT}` }}>The end. Scroll back up ↑</div>
    </div>
  );
}

function BeamsDemo(props) {
  const container = useRef(null);
  const hub = useRef(null);
  const left = [useRef(null), useRef(null), useRef(null)];
  const right = [useRef(null), useRef(null), useRef(null)];
  const beams = useMemo(
    () => [...left.map(from => ({ from, to: hub })), ...right.map(to => ({ from: hub, to, reverse: false }))],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const node = (ref, icon, name, big = false) => (
    <div ref={ref} style={{ position: 'relative', zIndex: 1, display: 'grid', justifyItems: 'center', gap: 6 }}>
      <div style={{ display: 'grid', placeItems: 'center', width: big ? 88 : 60, height: big ? 88 : 60, background: big ? '#29366f' : '#1a1c2c', boxShadow: `0 0 0 3px ${big ? '#ffcd75' : '#333c57'}, 0 8px 0 rgba(0,0,0,0.35)` }}>
        <Sprite name={icon} size={big ? 52 : 34} />
      </div>
      <span style={{ font: `13px ${PIXEL_FONT}`, color: '#94b0c2' }}>{name}</span>
    </div>
  );
  return (
    <div ref={container} style={{ position: 'relative', width: '100%', maxWidth: 640, margin: '0 auto', padding: '32px 12px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', justifyItems: 'center', gap: 16 }}>
      <ConnectBeams containerRef={container} beams={beams} {...props} />
      <div style={{ display: 'grid', gap: 34 }}>
        {node(left[0], 'pickaxe', 'Miners')}
        {node(left[1], 'sword', 'Raids')}
        {node(left[2], 'grass', 'Farms')}
      </div>
      {node(hub, 'chest', 'Village chest', true)}
      <div style={{ display: 'grid', gap: 34 }}>
        {node(right[0], 'gem', 'Gems')}
        {node(right[1], 'potion', 'Potions')}
        {node(right[2], 'coin', 'Coins')}
      </div>
    </div>
  );
}

const BENTO_CARDS = [
  { colSpan: 2, rowSpan: 2, scene: 'plains', icon: 'grass', title: 'Infinite worlds', description: 'Every seed generates a fresh map of biomes, caves and villages.' },
  { scene: 'cave', icon: 'pickaxe', title: 'Deep mining', description: 'Twelve layers down to the bedrock.' },
  { scene: 'underworld', icon: 'potion', title: 'Brewing', description: '48 recipes, some of them safe.' },
  { scene: 'snowy', icon: 'gem', title: 'Rare loot', description: 'Gems hide above the snowline.' },
  { colSpan: 2, scene: 'night', icon: 'star', title: 'Day and night', description: 'Monsters come out after dark. Build a shelter before sunset.' }
];

function BentoDemo({ showImages, ...props }) {
  return (
    <div style={{ width: '100%', maxWidth: 920, margin: '0 auto' }}>
      <BentoGrid {...props}>
        {BENTO_CARDS.map(card => (
          <BentoCard
            key={card.title}
            colSpan={card.colSpan}
            rowSpan={card.rowSpan}
            icon={<Sprite name={card.icon} size={26} />}
            title={card.title}
            description={card.description}
            onClick={() => {}}
            cta="Explore"
            background={showImages ? <img src={biome(card.scene)} alt="" style={{ ...pixelated, opacity: 0.55 }} /> : null}
          />
        ))}
      </BentoGrid>
    </div>
  );
}

const FEATURES = [
  { scene: 'plains', icon: 'grass', title: 'Build anything', description: 'Place and break blocks to shape houses, farms and castles.' },
  { scene: 'cave', icon: 'pickaxe', title: 'Mine deep', description: 'Torch-lit tunnels lead to ores, lava lakes and lost loot.' },
  { scene: 'underworld', icon: 'potion', title: 'Brew potions', description: 'Combine strange ingredients for speed, night vision or worse.' },
  { scene: 'void', icon: 'star', title: 'Reach the void', description: 'Floating islands at the edge of the world, for the brave.' }
];

function FeatureMedia({ scene, icon }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img src={biome(scene)} alt="" style={{ ...pixelated, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <div style={{ position: 'absolute', left: 16, top: 16, display: 'grid', placeItems: 'center', width: 64, height: 64, background: 'rgba(26,28,44,0.8)', boxShadow: '0 0 0 3px #ffcd75' }}>
        <Sprite name={icon} size={44} />
      </div>
    </div>
  );
}

const featureItems = FEATURES.map(feature => ({ ...feature, media: <FeatureMedia scene={feature.scene} icon={feature.icon} /> }));

const SCRIPTS = {
  install: undefined,
  server: [
    { type: 'command', text: './start-server --world overworld' },
    { type: 'output', text: 'Loading world "overworld" (seed 8675309)…' },
    { type: 'spinner', text: 'Generating spawn chunks', duration: 1600, done: 'Prepared spawn area: 100%' },
    { type: 'spinner', text: 'Waking villagers', duration: 900, done: '42 villagers ready to trade' },
    { type: 'info', text: 'Weather: clear. Time: sunrise.' },
    { type: 'command', text: 'whitelist add pip_builds' },
    { type: 'success', text: 'Added pip_builds to the whitelist' },
    { type: 'command', text: 'summon dragon' },
    { type: 'error', text: 'Unknown command. Nice try.' }
  ]
};

// ---------- Entries ----------

const DEMO_ENTRIES = {
  'device-frame': {
    source: deviceFrameSource,
    defaults: { device: 'phone', finish: 'graphite', browserTheme: 'dark', url: 'blockquest.example', tilt: 0, interactiveTilt: true, scene: 'plains' },
    controls: [
      select('device', 'Device', ['phone', 'tablet', 'laptop', 'browser', 'watch']),
      select('finish', 'Finish', ['graphite', 'silver', 'midnight', 'gold']),
      select('browserTheme', 'Browser theme', ['dark', 'light']),
      text('url', 'Browser URL'),
      slider('tilt', 'Resting tilt', -20, 20, 1),
      toggle('interactiveTilt', 'Tilt toward pointer'),
      select('scene', 'Screen biome (demo)', BIOME_OPTIONS)
    ],
    docs: [
      ['device', '"phone" | "tablet" | "laptop" | "browser" | "watch"', '"phone"', 'Which frame to draw. Children fill the screen.'],
      ['width', 'number', 'per device', 'Frame width in px (phone 300, tablet 420, laptop 720, browser 760, watch 200). Never wider than its parent.'],
      ['finish / bodyColor', 'string', '"graphite"', 'Preset body finish (graphite, silver, midnight, gold) or any custom body color.'],
      ['landscape', 'boolean', 'false', 'Tablet only: rotate to 4:3.'],
      ['url / browserTheme / aspectRatio', 'string', '"bitslab.dev" / "dark" / "16 / 10"', 'Browser frame address bar, chrome theme and page ratio.'],
      ['tilt / interactiveTilt', 'number / boolean', '0 / false', 'Resting 3D tilt in degrees, and easing toward the pointer (off under reduced motion).'],
      ['label', 'string', '-', 'Accessible name; makes the frame a labelled figure.']
    ],
    usage: `import DeviceFrame from "./DeviceFrame";

<DeviceFrame
  device="phone"
  finish="graphite"
  interactiveTilt
>
  <img src="/screenshot.png" alt="App home screen" />
</DeviceFrame>`,
    demoOnly: ['scene'],
    render: ({ scene, ...props }) => (
      <div style={{ display: 'grid', placeItems: 'center', width: '100%', padding: '24px 0' }}>
        <DeviceFrame {...props} label="Block Quest app preview">
          {props.device === 'browser' || props.device === 'laptop' ? (
            <PixelWebsite scene={scene} />
          ) : (
            <PixelAppScreen scene={scene} compact={props.device === 'watch'} />
          )}
        </DeviceFrame>
      </div>
    )
  },

  'screen-scroller': {
    source: screenScrollerSource,
    defaults: { device: 'laptop', tilt: 38, scrollLength: 300, riseUntil: 0.35, bodyColor: '#1f2230', scene: 'plains' },
    controls: [
      select('device', 'Device', ['laptop', 'tablet', 'phone']),
      slider('tilt', 'Starting tilt', 0, 70, 1),
      slider('scrollLength', 'Scroll length (vh)', 150, 600, 10),
      slider('riseUntil', 'Rise phase', 0.1, 0.8, 0.05),
      color('bodyColor', 'Body color'),
      select('scene', 'Hero biome (demo)', BIOME_OPTIONS)
    ],
    docs: [
      ['children', 'ReactNode', '-', 'The page shown on the screen. Taller content scrolls further.'],
      ['intro', 'ReactNode', '-', 'Heading shown above the device; fades out as it rises.'],
      ['device', '"laptop" | "tablet" | "phone"', '"laptop"', 'Frame shape.'],
      ['scrollLength', 'number | string', '300', 'Section height: a number is vh, or pass any CSS length.'],
      ['stageHeight', 'string', '"100vh"', 'Height of the sticky stage. Use the scroll box height when inside one.'],
      ['tilt / riseUntil', 'number', '38 / 0.35', 'Starting tilt in degrees, and the share of the scroll spent rising flat before the screen scrolls.'],
      ['bodyColor / edgeColor / textColor', 'string', 'graphite', 'Colors.']
    ],
    usage: `import ScreenScroller from "./ScreenScroller";

<ScreenScroller
  device="laptop"
  intro={<h2>A world in your pocket</h2>}
>
  <img src="/full-page-screenshot.png" alt="" />
</ScreenScroller>`,
    demoOnly: ['scene'],
    render: props => <ScrollerDemo key={`${props.scrollLength}-${props.device}`} {...props} />
  },

  'dot-globe': {
    source: dotGlobeSource,
    defaults: { dotCount: 9000, dotSize: 1, square: true, dotColor: '#73eff7', arcColor: '#ffcd75', markerColor: '#ef7d57', autoRotate: true, rotateSpeed: 8, draggable: true },
    controls: [
      slider('dotCount', 'Sphere samples', 3000, 20000, 500),
      slider('dotSize', 'Dot size', 0.5, 2.5, 0.1),
      toggle('square', 'Square (pixel) dots'),
      color('dotColor', 'Land dots'),
      color('arcColor', 'Arcs'),
      color('markerColor', 'Markers'),
      toggle('autoRotate', 'Auto-rotate'),
      slider('rotateSpeed', 'Rotate speed (°/s)', 1, 40, 1),
      toggle('draggable', 'Draggable')
    ],
    docs: [
      ['markers', '{ lat, lon, label?, color? }[]', '6 cities', 'Pulsing points. Labels feed the accessible description.'],
      ['arcs', '{ from: [lat, lon], to: [lat, lon] }[]', '5 routes', 'Great-circle arcs with a traveling comet. Longer arcs fly higher.'],
      ['dotCount / dotSize / square', 'number / number / boolean', '9000 / 1 / false', 'Fibonacci samples over the whole sphere (about a third land on land), dot scale, and square pixels.'],
      ['dotColor / oceanColor / glowColor / arcColor / markerColor', 'string', 'Sweetie 16', 'Colors.'],
      ['autoRotate / rotateSpeed', 'boolean / number', 'true / 8', 'Spin speed in degrees per second. Resumes after a drag settles.'],
      ['initialLat / initialLon', 'number', '18 / -20', 'Which point faces the viewer at start.'],
      ['draggable', 'boolean', 'true', 'Drag with inertia. Arrow keys rotate when focused.'],
      ['isLand(lat, lon)', 'function', 'export', 'The embedded 2° land lookup (Natural Earth, public domain).']
    ],
    usage: `import DotGlobe from "./DotGlobe";

<DotGlobe
  markers={[{ lat: 51.5, lon: -0.1, label: "London" }]}
  arcs={[{ from: [37.8, -122.4], to: [51.5, -0.1] }]}
  square
/>`,
    render: props => (
      <div style={{ width: '100%', padding: '16px 0' }}>
        <DotGlobe {...props} />
      </div>
    )
  },

  'dot-map': {
    source: dotMapSource,
    defaults: { dotSpacing: 2, dotRadius: 0.55, square: true, showLabels: true, cropAntarctica: true, markerColor: '#ef7d57', routeColor: '#ffcd75', routeSpeed: 3 },
    controls: [
      slider('dotSpacing', 'Dot spacing (°)', 2, 6, 2),
      slider('dotRadius', 'Dot radius', 0.3, 1.2, 0.05),
      toggle('square', 'Square (pixel) dots'),
      toggle('showLabels', 'Always show labels'),
      toggle('cropAntarctica', 'Crop Antarctica'),
      color('markerColor', 'Markers'),
      color('routeColor', 'Routes'),
      slider('routeSpeed', 'Route loop (s)', 1, 8, 0.5)
    ],
    docs: [
      ['markers', '{ lat, lon, label?, color? }[]', '8 cities', 'Pulsing, focusable locations. Labels flip left near the right edge.'],
      ['routes', '{ from: [lat, lon], to: [lat, lon], color? }[]', '7 routes', 'Curved routes with a traveling comet; they take the short way around.'],
      ['dotSpacing / dotRadius / square', 'number / number / boolean', '2 / 0.55 / false', 'Grid spacing in degrees (multiples of 2), dot size in map units and square pixels.'],
      ['cropAntarctica', 'boolean', 'true', 'Hide latitudes south of 60°S.'],
      ['showLabels / labelSize', 'boolean / number', 'true / 4', 'Labels always on, or on hover and focus only.'],
      ['onMarkerSelect', '(marker, index) => void', '-', 'Makes markers buttons (click, Enter or Space).'],
      ['dotColor / markerColor / routeColor / labelColor', 'string', 'Sweetie 16', 'Colors.']
    ],
    usage: `import DotMap from "./DotMap";

<DotMap
  markers={[{ lat: 35.7, lon: 139.7, label: "Tokyo" }]}
  routes={[{ from: [51.5, -0.1], to: [35.7, 139.7] }]}
  square
/>`,
    render: props => (
      <div style={{ width: '100%', maxWidth: 960, margin: '0 auto', padding: '24px 0' }}>
        <DotMap {...props} fontFamily={PIXEL_FONT} />
      </div>
    )
  },

  'connect-beams': {
    source: connectBeamsSource,
    defaults: { color: '#3b5dc9', pulseColor: '#73eff7', pulseColorEnd: '#a7f070', width: 2, curvature: 0.18, duration: 3, pulseLength: 0.22 },
    controls: [
      color('color', 'Track'),
      color('pulseColor', 'Pulse start'),
      color('pulseColorEnd', 'Pulse end'),
      slider('width', 'Width', 1, 6, 0.5),
      slider('curvature', 'Curvature', -0.5, 0.5, 0.02),
      slider('duration', 'Pulse loop (s)', 1, 8, 0.5),
      slider('pulseLength', 'Pulse length', 0.05, 0.6, 0.01)
    ],
    docs: [
      ['containerRef', 'RefObject<HTMLElement>', 'required', 'Positioned parent that holds the nodes; the SVG overlay fills it.'],
      ['beams', '{ from, to, reverse?, curvature?, duration?, delay?, color? }[]', '[]', 'Pairs of node refs. Beams start and end at the node edges.'],
      ['color / width', 'string / number', '"#3b5dc9" / 2', 'Static track.'],
      ['pulseColor / pulseColorEnd / pulseLength / duration', 'string / number', 'cyan → green / 0.22 / 3', 'Traveling gradient pulse; length is a share of the beam.'],
      ['curvature', 'number', '0.25', 'Bend perpendicular to the beam; negative bends the other way.'],
      ['edgeInset', 'number', '4', 'How far inside the node edge beams attach.']
    ],
    usage: `import ConnectBeams from "./ConnectBeams";

const box = useRef(null), a = useRef(null), b = useRef(null);

<div ref={box} style={{ position: "relative" }}>
  <ConnectBeams
    containerRef={box}
    beams={[{ from: a, to: b }]}
  />
  <div ref={a}>A</div>
  <div ref={b}>B</div>
</div>`,
    render: props => <BeamsDemo {...props} />
  },

  'bento-grid': {
    source: bentoGridSource,
    defaults: { columns: 3, rowHeight: 190, gap: 14, radius: 4, accentColor: '#73eff7', spotlightSize: 320, showImages: true },
    controls: [
      slider('columns', 'Columns', 2, 4, 1),
      slider('rowHeight', 'Row height', 140, 280, 10),
      slider('gap', 'Gap', 4, 32, 1),
      slider('radius', 'Radius', 0, 28, 1),
      color('accentColor', 'Accent'),
      slider('spotlightSize', 'Spotlight size', 120, 600, 10),
      toggle('showImages', 'Card backgrounds (demo)')
    ],
    docs: [
      ['children', 'BentoCard[]', '-', 'Cards, in reading order.'],
      ['columns / rowHeight / gap', 'number', '3 / 200 / 14', 'Grid shape. Collapses to 2 columns under 860px of container width and 1 under 560px.'],
      ['spotlightColor / washColor / spotlightSize', 'string / number', 'cyan / 320', 'Cursor-following border light and the soft fill behind it.'],
      ['cardColor / lineColor / textColor / mutedColor / accentColor', 'string', 'Sweetie 16', 'Colors.'],
      ['BentoCard: colSpan / rowSpan', 'number', '1 / 1', 'How many columns and rows a card covers.'],
      ['BentoCard: title / description / icon / background', 'ReactNode', '-', 'Content. Background fades into the card color.'],
      ['BentoCard: href / onClick / cta', 'string / function / string', '- / - / "Learn more"', 'Makes the card a link or button and reveals the call to action on hover or focus.']
    ],
    usage: `import BentoGrid, { BentoCard } from "./BentoGrid";

<BentoGrid
  columns={3}
>
  <BentoCard colSpan={2} rowSpan={2} title="Infinite worlds" href="/worlds" />
  <BentoCard title="Deep mining" description="Twelve layers down." />
</BentoGrid>`,
    demoOnly: ['showImages'],
    render: props => <BentoDemo {...props} fontFamily={TITLE_FONT} bodyFontFamily={PIXEL_FONT} titleSize={11} />
  },

  'feature-tabs': {
    source: featureTabsSource,
    defaults: { interval: 5000, autoPlay: true, mediaAspect: '4 / 3', radius: 4, accentColor: '#73eff7' },
    controls: [
      slider('interval', 'Interval (ms)', 2000, 10000, 500),
      toggle('autoPlay', 'Auto-advance'),
      select('mediaAspect', 'Media aspect', ['4 / 3', '16 / 10', '1 / 1']),
      slider('radius', 'Radius', 0, 24, 1),
      color('accentColor', 'Accent')
    ],
    docs: [
      ['items', '{ id?, title, description?, media }[]', '[]', 'Tabs and the media shown for each.'],
      ['interval / autoPlay', 'number / boolean', '5000 / true', 'Time per tab. Auto-advance is off under reduced motion; hovering or the pause button pauses it.'],
      ['defaultIndex / onChange', 'number / (index, item) => void', '0 / -', 'Starting tab and change callback.'],
      ['mediaAspect', 'string', '"4 / 3"', 'Media panel aspect ratio. Panels crossfade.'],
      ['textColor / mutedColor / accentColor / stageColor', 'string', 'Sweetie 16', 'Colors.'],
      ['fontFamily / titleSize', 'string / number', 'system / 17', 'Typography.']
    ],
    usage: `import FeatureTabs from "./FeatureTabs";

<FeatureTabs
  items={[{ title: "Build anything", description: "…", media: <img src="/build.png" alt="" /> }]}
  interval={5000}
/>`,
    render: props => (
      <div style={{ width: '100%', maxWidth: 900, margin: '0 auto', padding: '16px 0' }}>
        <FeatureTabs key={props.interval} {...props} items={featureItems} fontFamily={PIXEL_FONT} />
      </div>
    )
  },

  'compare-slider': {
    source: compareSliderSource,
    defaults: { vertical: false, hover: false, defaultPosition: 50, beforeLabel: 'Day', afterLabel: 'Night', lineColor: '#f4f4f4', radius: 4, before: 'plains', after: 'night' },
    controls: [
      toggle('vertical', 'Vertical'),
      toggle('hover', 'Follow mouse (no drag)'),
      slider('defaultPosition', 'Start position', 0, 100, 1),
      text('beforeLabel', 'Before label'),
      text('afterLabel', 'After label'),
      color('lineColor', 'Handle color'),
      slider('radius', 'Radius', 0, 28, 1),
      select('before', 'Before biome (demo)', BIOME_OPTIONS),
      select('after', 'After biome (demo)', BIOME_OPTIONS)
    ],
    docs: [
      ['before / after', 'ReactNode', '-', 'The two layers: images, video or live UI.'],
      ['beforeLabel / afterLabel', 'string', '"Before" / "After"', 'Corner labels; they hide when their side is almost covered.'],
      ['defaultPosition / position / onPositionChange', 'number', '50', 'Uncontrolled start, or controlled position in percent.'],
      ['vertical', 'boolean', 'false', 'Split top/bottom instead of left/right.'],
      ['hover', 'boolean', 'false', 'Follow the mouse without dragging (touch still drags).'],
      ['step', 'number', '2', 'Arrow-key step; Page Up/Down move 10, Home/End jump to the ends.'],
      ['aspectRatio / radius / lineColor / lineWidth', 'string / number', '"16 / 10" / 14', 'Shape and handle styling.']
    ],
    usage: `import CompareSlider from "./CompareSlider";

<CompareSlider
  before={<img src="/day.png" alt="Village by day" />}
  after={<img src="/night.png" alt="Village by night" />}
  beforeLabel="Day"
  afterLabel="Night"
/>`,
    demoOnly: ['before', 'after'],
    render: ({ before, after, ...props }) => (
      <div style={{ width: '100%', maxWidth: 820, margin: '0 auto', padding: '16px 0' }}>
        <CompareSlider
          key={`${props.defaultPosition}-${props.vertical}`}
          {...props}
          fontFamily={PIXEL_FONT}
          before={<img src={biome(before)} alt={`${before} biome`} style={pixelated} />}
          after={<img src={biome(after)} alt={`${after} biome`} style={pixelated} />}
        />
      </div>
    )
  },

  'terminal-demo': {
    source: terminalDemoSource,
    defaults: { preset: 'server', title: 'zsh — block-quest', prompt: '$', typingSpeed: 45, loop: true, height: 300, promptColor: '#73eff7' },
    controls: [
      select('preset', 'Script (demo)', ['server', 'install']),
      text('title', 'Window title'),
      text('prompt', 'Prompt'),
      slider('typingSpeed', 'Typing speed (ms/char)', 10, 120, 5),
      toggle('loop', 'Loop'),
      slider('height', 'Height', 160, 460, 10),
      color('promptColor', 'Prompt color')
    ],
    docs: [
      ['script', 'Step[]', 'install demo', 'Steps: command (typed), output, spinner (with duration and done text), success, error, info and pause.'],
      ['typingSpeed / lineDelay', 'number', '45 / 260', 'Average ms per typed character (with jitter), and the gap after each step.'],
      ['loop / loopDelay', 'boolean / number', 'false / 2600', 'Replay forever. When not looping, a Replay button appears at the end.'],
      ['startOnView', 'boolean', 'true', 'Wait until a third of the terminal is visible.'],
      ['title / prompt', 'string', '"zsh — bits-lab" / "$"', 'Window title and prompt symbol (each command can override it).'],
      ['width / height / fontSize / fontFamily', 'number / string', '640 / 300 / 13.5 / mono', 'Size and type.'],
      ['background / textColor / mutedColor / promptColor / successColor / errorColor / infoColor', 'string', 'dark', 'Colors.']
    ],
    usage: `import TerminalDemo from "./TerminalDemo";

<TerminalDemo
  script={[
    { type: "command", text: "npm create block-quest" },
    { type: "spinner", text: "Generating world", duration: 1200, done: "World ready" },
    { type: "success", text: "Done!" }
  ]}
  loop
/>`,
    demoOnly: ['preset'],
    render: ({ preset, ...props }) => (
      <div style={{ display: 'grid', placeItems: 'center', width: '100%', padding: '24px 0' }}>
        <TerminalDemo key={`${preset}-${props.loop}-${props.typingSpeed}`} {...props} script={SCRIPTS[preset]} />
      </div>
    )
  }
};

export const SHOWCASE_DEMOS = DEMO_ENTRIES;
