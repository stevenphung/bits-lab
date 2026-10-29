import { useState } from 'react';
import PixelAvatar from './bits/PixelAvatar';
import { playChip } from './bits/ChiptuneKit';
import WobbleCard from './bits/WobbleCard';
import CursorAttractor from './bits/CursorAttractor';
import JellyBlob from './bits/JellyBlob';
import Screensaver from './bits/Screensaver';
import wobbleCardSource from './bits/WobbleCard.jsx?raw';
import cursorAttractorSource from './bits/CursorAttractor.jsx?raw';
import jellyBlobSource from './bits/JellyBlob.jsx?raw';
import screensaverSource from './bits/Screensaver.jsx?raw';
import Polaroids from './bits/Polaroids';
import HexField from './bits/HexField';
import CloudSky from './bits/CloudSky';
import polaroidsSource from './bits/Polaroids.jsx?raw';
import hexFieldSource from './bits/HexField.jsx?raw';
import cloudSkySource from './bits/CloudSky.jsx?raw';
import BreadcrumbTrail from './bits/BreadcrumbTrail';
import InlineEdit from './bits/InlineEdit';
import FunnelFlow from './bits/FunnelFlow';
import breadcrumbTrailSource from './bits/BreadcrumbTrail.jsx?raw';
import inlineEditSource from './bits/InlineEdit.jsx?raw';
import funnelFlowSource from './bits/FunnelFlow.jsx?raw';
import ScrollTypography from './bits/ScrollTypography';
import KineticHeadline from './bits/KineticHeadline';
import scrollTypographySource from './bits/ScrollTypography.jsx?raw';
import kineticHeadlineSource from './bits/KineticHeadline.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", ui-monospace, monospace';
const stack = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 22, justifyItems: 'center', width: '100%', padding: '28px 16px', boxSizing: 'border-box' };
const hint = { margin: 0, color: 'var(--demo-muted, #94b0c2)', font: `14px/1.4 ${PIXEL_FONT}`, textAlign: 'center' };
const sprite = (name, size = 32) => <img src={`/pixel/sprite-${name}.png`} alt="" width={size} height={size} style={{ imageRendering: 'pixelated', display: 'block' }} />;

// ---------- WobbleCard ----------

function WobbleDemo(props) {
  return (
    <div style={{ ...stack, padding: '48px 16px' }}>
      <WobbleCard {...props} fontFamily={PIXEL_FONT}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 14 }}>
          <PixelAvatar seed="slime" size={56} decorative />
          <div>
            <div style={{ font: `12px ${TITLE_FONT}`, color: '#a7f070' }}>SLIME</div>
            <div style={{ color: 'var(--demo-muted, #94b0c2)', fontSize: 14, marginTop: 6 }}>Common · Lv 3</div>
          </div>
        </div>
        <p style={{ margin: 0, lineHeight: 1.5 }}>Bounces when poked. Mostly harmless, slightly sticky, extremely jiggly.</p>
      </WobbleCard>
      <p style={hint}>Move the pointer over the card, then sweep off it quickly.</p>
    </div>
  );
}

// ---------- CursorAttractor ----------

const LOOT = ['gem', 'coin', 'heart', 'star', 'potion', 'chest', 'sword', 'pickaxe', 'book', 'orb'];

function AttractDemo(props) {
  return (
    <div style={{ ...stack, maxWidth: 680, margin: '0 auto' }}>
      <CursorAttractor {...props} style={{ width: '100%', boxSizing: 'border-box', borderRadius: 16, background: 'var(--demo-bg, #1a1c2c)', boxShadow: 'inset 0 0 0 2px var(--demo-line, #333c57)' }}>
        {LOOT.map(name => (
          <span key={name} style={{ display: 'grid', placeItems: 'center', width: 64, height: 64, borderRadius: 12, background: 'var(--demo-chip, #262b44)' }}>
            {sprite(name, 36)}
          </span>
        ))}
      </CursorAttractor>
      <p style={hint}>{props.mode === 'repel' ? 'The loot shies away from the pointer.' : 'Move the pointer near the loot: it leans in.'}</p>
    </div>
  );
}

// ---------- JellyBlob ----------

function JellyDemo({ sound, ...props }) {
  const [count, setCount] = useState(0);
  return (
    <div style={{ ...stack, padding: '56px 16px' }}>
      <JellyBlob
        {...props}
        fontFamily={PIXEL_FONT}
        onClick={() => {
          setCount(c => c + 1);
          if (sound) playChip({ wave: 'square', from: 330, to: 660, duration: 0.12, volume: 0.25 });
        }}
      >
        Squish me
      </JellyBlob>
      <p style={hint}>{count ? `Squished ${count} time${count === 1 ? '' : 's'}.` : 'Hover near an edge, then press and hold. Space and Enter work too.'}</p>
    </div>
  );
}

// ---------- Screensaver ----------

function SaverDemo({ idleMode, ...props }) {
  const [last, setLast] = useState(0);
  return (
    <div style={{ ...stack, maxWidth: 760, margin: '0 auto' }}>
      <Screensaver
        key={String(idleMode)}
        {...props}
        idleAfter={idleMode ? 3000 : 0}
        logo={
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'grid', width: 34, height: 34, placeItems: 'center', background: 'currentColor' }}>
              <span style={{ filter: 'brightness(0)' }}>{sprite('gem', 26)}</span>
            </span>
            BITS
          </span>
        }
        onCornerHit={setLast}
      >
        <div style={{ display: 'grid', height: '100%', placeItems: 'center', alignContent: 'center', gap: 10, padding: 24, boxSizing: 'border-box', color: 'var(--demo-ink, #f4f4f4)', font: `16px/1.5 ${PIXEL_FONT}`, textAlign: 'center' }}>
          <span style={{ font: `12px ${TITLE_FONT}`, color: 'var(--demo-gold, #ffcd75)' }}>YOUR APP</span>
          Stop moving for three seconds and the screensaver fades in. Any input brings this back.
        </div>
      </Screensaver>
      <p style={hint}>{last ? `Corner hit #${last}!` : 'Raise the corner tolerance to see the corner celebration sooner.'}</p>
    </div>
  );
}

// ---------- Polaroids ----------

const SNAPS = [
  { src: '/pixel/biome-plains.png', caption: 'First night' },
  { src: '/pixel/biome-forest.png', caption: 'Lost in the woods' },
  { src: '/pixel/biome-desert.png', caption: 'Too hot' },
  { src: '/pixel/biome-snowy.png', caption: 'Snow fort' },
  { src: '/pixel/biome-cherry.png', caption: 'Blossom season' }
];

function PolaroidDemo(props) {
  return (
    <div style={{ ...stack, maxWidth: 760, margin: '0 auto' }}>
      <Polaroids {...props} photos={SNAPS} />
      <p style={hint}>Fling a photo across the table, or Scatter the lot. Focus one and use the arrows to nudge it.</p>
    </div>
  );
}

// ---------- BreadcrumbTrail ----------

const TRAIL = [
  { label: 'Overworld', icon: sprite('grass', 16) },
  { label: 'Plains' },
  { label: 'Village' },
  { label: 'Blacksmith' },
  { label: 'Storage' },
  { label: 'Chest #3' },
  { label: 'Enchanted pickaxe' }
];

function CrumbsDemo({ trailWidth, ...props }) {
  const [depth, setDepth] = useState(TRAIL.length);
  const items = TRAIL.slice(0, depth);
  return (
    <div style={{ ...stack, maxWidth: 760, margin: '0 auto' }}>
      <div style={{ width: `${trailWidth}%`, minWidth: 0, padding: '10px 12px', borderRadius: 12, background: 'var(--demo-bg, #1a1c2c)', boxShadow: 'inset 0 0 0 2px var(--demo-line, #333c57)', boxSizing: 'border-box' }}>
        <BreadcrumbTrail {...props} items={items} fontFamily={PIXEL_FONT} onNavigate={(item, i, event) => { event.preventDefault(); setDepth(i + 1); }} />
      </div>
      <button type="button" onClick={() => setDepth(TRAIL.length)} style={{ padding: '7px 14px', border: 0, borderRadius: 8, background: 'var(--demo-line, #333c57)', color: 'var(--demo-ink, #f4f4f4)', font: `14px ${PIXEL_FONT}`, cursor: 'pointer' }}>
        Go deep again
      </button>
      <p style={hint}>Narrow the trail width to fold the middle crumbs into “…”. Clicking a crumb navigates up to it.</p>
    </div>
  );
}

// ---------- InlineEdit ----------

function InlineDemo({ slowSave, ...props }) {
  const [log, setLog] = useState('');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  return (
    <div style={{ ...stack, maxWidth: 560, margin: '0 auto', justifyItems: 'start' }}>
      <div style={{ display: 'grid', gap: 18, width: '100%', padding: 20, borderRadius: 14, background: 'var(--demo-bg, #1a1c2c)', boxShadow: 'inset 0 0 0 2px var(--demo-line, #333c57)', boxSizing: 'border-box', color: 'var(--demo-muted, #94b0c2)', font: `14px ${PIXEL_FONT}` }}>
        <label style={{ display: 'grid', gap: 4 }}>
          World name
          <InlineEdit
            {...props}
            label="World name"
            defaultValue="Pixel Plains"
            fontFamily={PIXEL_FONT}
            fontSize={22}
            validate={v => (v.trim() ? null : 'A world needs a name.')}
            onSave={async v => {
              if (slowSave) await wait(900);
              setLog(`Saved world name: ${v}`);
            }}
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          Motto
          <InlineEdit
            {...props}
            label="Motto"
            defaultValue=""
            placeholder="Add a motto"
            fontFamily={PIXEL_FONT}
            onSave={async v => {
              if (slowSave) await wait(900);
              if (/creeper/i.test(v)) throw new Error('No creepers in the motto.');
              setLog(`Saved motto: ${v || '(empty)'}`);
            }}
          />
        </label>
      </div>
      <p style={hint}>{log || 'Click a value to edit. Enter saves, Escape cancels. Try a motto with “creeper” in it.'}</p>
    </div>
  );
}

// ---------- FunnelFlow ----------

const FUNNEL = [
  { label: 'Visited', value: 12480 },
  { label: 'Signed up', value: 4310 },
  { label: 'Made a world', value: 2650 },
  { label: 'Invited a friend', value: 980 },
  { label: 'Subscribed', value: 412 }
];

function FunnelDemo(props) {
  return (
    <div style={{ ...stack, maxWidth: 820, margin: '0 auto' }}>
      <FunnelFlow {...props} stages={FUNNEL} fontFamily={PIXEL_FONT} />
      <p style={hint}>Hover a stage, or focus the chart and use the arrow keys.</p>
    </div>
  );
}

// ---------- ScrollTypography ----------

const FLEX_FONT = '"Roboto Flex", system-ui, sans-serif';
const filler = text => <p style={{ margin: '0 auto', maxWidth: 520, color: '#566c86', font: `16px/1.6 ${PIXEL_FONT}`, textAlign: 'center' }}>{text}</p>;

function ScrollTypeDemo({ pixelFont, ...props }) {
  const font = pixelFont ? PIXEL_FONT : FLEX_FONT;
  return (
    <div style={{ ...stack, maxWidth: 820, margin: '0 auto' }}>
      <div style={{ width: '100%', height: 420, overflowY: 'auto', borderRadius: 16, background: 'var(--demo-bg, #1a1c2c)', boxShadow: 'inset 0 0 0 2px var(--demo-line, #333c57)' }}>
        <div style={{ display: 'grid', gap: 120, padding: '160px 24px' }}>
          {filler('Scroll this box. Flick it fast, then stop.')}
          <ScrollTypography {...props} as="h3" text="Speed changes everything" fontFamily={font} minWeight={pixelFont ? 400 : props.minWeight} maxWeight={pixelFont ? 700 : props.maxWeight} style={{ textAlign: 'center' }} />
          {filler('Each word reacts a moment after the one before it.')}
          <ScrollTypography {...props} text="Slow down and the letters breathe out" fontFamily={font} minWeight={pixelFont ? 400 : props.minWeight} maxWeight={pixelFont ? 700 : props.maxWeight} fontSize={props.fontSize * 0.7} style={{ textAlign: 'center' }} />
          {filler('The end. Scroll back up the other way.')}
        </div>
      </div>
    </div>
  );
}

// ---------- KineticHeadline ----------

function KineticDemo({ pixelFont, ...props }) {
  return (
    <div style={{ ...stack, maxWidth: 900, margin: '0 auto', padding: '48px 16px' }}>
      <KineticHeadline {...props} text="Breathe in the pixels" fontFamily={pixelFont ? PIXEL_FONT : FLEX_FONT} minWeight={pixelFont ? 400 : props.minWeight} maxWeight={pixelFont ? 700 : props.maxWeight} style={{ textAlign: 'center' }} />
      <p style={hint}>{props.mode === 'scroll' ? 'Scroll the page: a bold spotlight sweeps across the letters.' : props.mode === 'beat' ? `A pulse runs down the line at ${props.bpm} BPM.` : 'A slow wave of weight rolls along the line.'}</p>
    </div>
  );
}

// ---------- Entries ----------

export const WAVE3_DEMOS = {
  'wobble-card': {
    source: wobbleCardSource,
    defaults: { intensity: 1, stiffness: 170, damping: 9, width: 360, radius: 18, backgroundColor: '#262b44', accentColor: '#73eff7' },
    controls: [slider('intensity', 'Intensity', 0, 2, 0.1), slider('stiffness', 'Stiffness', 60, 500, 10), slider('damping', 'Damping', 2, 30, 0.5), slider('width', 'Max width', 240, 520, 10), slider('radius', 'Corner radius', 0, 40, 1), color('backgroundColor', 'Card'), color('accentColor', 'Accent')],
    docs: [
      ['children', 'ReactNode', '-', 'The card content.'],
      ['intensity', 'number', '1', 'How far it leans and stretches (0 turns the jelly off).'],
      ['stiffness / damping', 'number', '170 / 9', 'The spring; lower damping wobbles longer.'],
      ['width / padding / radius', 'number', '360 / 24 / 18', 'Card size and shape.'],
      ['backgroundColor / textColor / lineColor / accentColor / sheenColor', 'string', 'navy / white / slate / cyan / cyan wash', 'Colours; the accent rings the card while active or focused.'],
      ['Accessibility', '-', '-', 'Content stays in normal flow; focus inside rings the card. Reduced motion: no deformation, only the sheen and ring.']
    ],
    usage: `import WobbleCard from "./WobbleCard";

<WobbleCard>
  <h3>Slime</h3>
  <p>Extremely jiggly.</p>
</WobbleCard>`,
    render: props => <WobbleDemo {...props} />
  },

  'cursor-attractor': {
    source: cursorAttractorSource,
    defaults: { mode: 'attract', radius: 180, strength: 0.35, maxShift: 36, stiffness: 220, damping: 13, gap: 16 },
    controls: [select('mode', 'Mode', ['attract', 'repel']), slider('radius', 'Reach (px)', 60, 400, 10), slider('strength', 'Strength', 0.05, 1, 0.05), slider('maxShift', 'Max shift (px)', 4, 80, 2), slider('stiffness', 'Stiffness', 60, 600, 10), slider('damping', 'Damping', 2, 40, 1), slider('gap', 'Gap', 0, 40, 2)],
    docs: [
      ['children', 'ReactNode', '-', 'Each child is pulled on its own spring.'],
      ['mode', '"attract" | "repel"', '"attract"', 'Lean toward the pointer, or away from it.'],
      ['radius / strength / maxShift', 'number', '180 / 0.35 / 36', 'Reach in px, how hard the pull is, and the cap on movement.'],
      ['stiffness / damping', 'number', '220 / 13', 'The spring each item rides.'],
      ['gap / padding / justify', 'number / number / "center" | "start" | "end"', '16 / 32 / "center"', 'Layout of the wrapping row; padding is the area where the pointer counts.'],
      ['Accessibility', '-', '-', 'Visual only: layout and tab order never change. Reduced motion: no pull.']
    ],
    usage: `import CursorAttractor from "./CursorAttractor";

<CursorAttractor mode="attract">
  <img src="/gem.png" alt="Gem" />
  <img src="/coin.png" alt="Coin" />
</CursorAttractor>`,
    render: props => <AttractDemo {...props} />
  },

  'jelly-blob': {
    source: jellyBlobSource,
    defaults: { width: 220, height: 72, points: 18, bulge: 10, squash: 9, stiffness: 320, damping: 9, idle: true, color: '#b13e53', sound: false },
    controls: [slider('width', 'Width', 120, 360, 10), slider('height', 'Height', 44, 120, 2), slider('points', 'Springs', 8, 32, 1), slider('bulge', 'Hover bulge', 0, 24, 1), slider('squash', 'Press squash', 0, 20, 1), slider('stiffness', 'Stiffness', 80, 800, 10), slider('damping', 'Damping', 2, 30, 0.5), toggle('idle', 'Breathe at rest'), color('color', 'Colour'), toggle('sound', 'Click sound')],
    docs: [
      ['children / onClick', 'ReactNode / (event) => void', '-', 'Label and handler. Any other button props pass through.'],
      ['width / height', 'number', '220 / 72', 'The resting pill.'],
      ['points', 'number', '18', 'Springs around the outline; more is smoother.'],
      ['bulge / squash', 'number', '10 / 9', 'How far the edge reaches for the pointer, and how flat a press makes it.'],
      ['stiffness / damping / idle', 'number / number / boolean', '320 / 9 / true', 'The springs, and a gentle breathing at rest (paused off-screen).'],
      ['color / pressedColor / textColor / accentColor', 'string', 'red / dark red / white / cyan', 'Fill, pressed fill, label and focus ring.'],
      ['Accessibility', '-', '-', 'A native button: Space and Enter press and squash it, focus shows a ring. Reduced motion: a still pill.']
    ],
    usage: `import JellyBlob from "./JellyBlob";

<JellyBlob onClick={start}>Squish me</JellyBlob>`,
    render: props => <JellyDemo {...props} />
  },

  screensaver: {
    source: screensaverSource,
    defaults: { idleMode: false, speed: 110, cornerTolerance: 4, height: 320, logoSize: 30, showCount: true, backgroundColor: '#0b0b14' },
    controls: [toggle('idleMode', 'Wait for idle (3 s)'), slider('speed', 'Speed (px/s)', 30, 400, 10), slider('cornerTolerance', 'Corner tolerance (px)', 1, 60, 1), slider('height', 'Height', 200, 480, 10), slider('logoSize', 'Logo size', 14, 60, 2), toggle('showCount', 'Corner counter'), color('backgroundColor', 'Screen')],
    docs: [
      ['logo', 'ReactNode', '"BITS LAB"', 'What bounces. It takes the current colour (currentColor) on every wall.'],
      ['children / idleAfter', 'ReactNode / number (ms)', '- / 0', '0 runs it always; otherwise children show until there has been no input for idleAfter ms.'],
      ['speed / colors', 'number / string[]', '110 / pixel palette', 'Travel speed in px/s and the wall colours.'],
      ['cornerTolerance / onCornerHit', 'number / (count) => void', '4 / -', 'How exact a corner must be, and a callback per corner hit.'],
      ['showCount', 'boolean', 'true', 'The on-screen corner counter.'],
      ['height / radius / logoSize', 'number', '320 / 12 / 34', 'Box and logo size.'],
      ['Accessibility', '-', '-', 'An image with a label when always on; corner hits are announced. Pauses off-screen and in hidden tabs. Reduced motion: logo centred, slow colour change, no confetti.']
    ],
    usage: `import Screensaver from "./Screensaver";

<Screensaver idleAfter={60000} logo={<Logo />}>
  <App />
</Screensaver>`,
    render: props => <SaverDemo {...props} />
  },

  polaroids: {
    source: polaroidsSource,
    defaults: { height: 440, photoWidth: 160, friction: 3.2, bounce: 0.45, spin: 1, showControls: true, backgroundColor: '#5d275d', paperColor: '#f4f4f4' },
    controls: [slider('height', 'Table height', 280, 640, 10), slider('photoWidth', 'Photo width', 100, 240, 10), slider('friction', 'Friction', 0.5, 10, 0.1), slider('bounce', 'Edge bounce', 0, 1, 0.05), slider('spin', 'Spin', 0, 3, 0.1), toggle('showControls', 'Scatter / tidy buttons'), color('backgroundColor', 'Table'), color('paperColor', 'Frame')],
    docs: [
      ['photos', '{ src, caption?, alt? }[]', '[]', 'The pile; the caption (or alt) also names each photo for screen readers.'],
      ['height / photoWidth / frame / captionHeight', 'number', '440 / 160 / 10 / 34', 'Table and photo size.'],
      ['friction / bounce / spin', 'number', '3.2 / 0.45 / 1', 'How quickly a throw slows, how much it keeps off an edge, and how much an off-centre grip spins it.'],
      ['showControls / scatterLabel / tidyLabel', 'boolean / string / string', 'true / "Scatter" / "Tidy up"', 'Buttons that toss the pile or stack it neatly.'],
      ['backgroundColor / paperColor / textColor / accentColor', 'string', 'plum / white / ink / cyan', 'Table, photo frame, caption and focus ring.'],
      ['Accessibility', '-', '-', 'Photos are buttons: arrows nudge (Shift ×4), Enter brings to the top, moves are announced. Reduced motion: throws land without sliding.']
    ],
    usage: `import Polaroids from "./Polaroids";

<Polaroids photos={[{ src: "/trip.jpg", caption: "Day one" }]} />`,
    render: props => <PolaroidDemo {...props} />
  },

  'hex-field': {
    source: hexFieldSource,
    defaults: { size: 22, gap: 3, hoverRadius: 110, rippleSpeed: 420, rippleWidth: 70, wave: true, pixelated: false, cellColor: '#29366f', glowColor: '#73eff7', rippleColor: '#ffcd75' },
    controls: [slider('size', 'Hex size', 8, 48, 1), slider('gap', 'Gap', 0, 10, 0.5), slider('hoverRadius', 'Hover glow (px)', 0, 300, 10), slider('rippleSpeed', 'Ripple speed', 100, 1200, 20), slider('rippleWidth', 'Ripple width', 20, 200, 5), toggle('wave', 'Rest wave'), toggle('pixelated', 'Pixelated'), color('cellColor', 'Cells'), color('glowColor', 'Hover glow'), color('rippleColor', 'Ripple')],
    docs: [
      ['size / gap', 'number', '22 / 3', 'Hexagon radius and the gap between cells.'],
      ['hoverRadius', 'number', '110', 'How far the pointer glow reaches.'],
      ['rippleSpeed / rippleWidth / onRipple', 'number / number / ({ x, y }) => void', '420 / 70 / -', 'Click ripples: px per second, ring thickness, and a callback.'],
      ['wave / pixelated', 'boolean', 'true / false', 'A slow drifting wave at rest; render at a third of the resolution for chunky pixels.'],
      ['baseColor / cellColor / glowColor / rippleColor / backgroundColor', 'string', 'navy tones / cyan / gold / near-black', 'Colours.'],
      ['height', 'number | string', '"100%"', 'Fills its parent by default.'],
      ['Accessibility', '-', '-', 'Decorative. Pauses off-screen and in hidden tabs. Reduced motion: no wave; a click flashes nearby cells.']
    ],
    usage: `import HexField from "./HexField";

<div style={{ height: 400 }}>
  <HexField onRipple={({ x, y }) => console.log(x, y)} />
</div>`,
    fullBleed: true,
    render: props => <HexField {...props} />
  },

  'cloud-sky': {
    source: cloudSkySource,
    defaults: { quality: 'medium', pixelSize: 0, speed: 0.06, coverage: 0.55, sunAngle: 30, sunHeight: 0.35, topColor: '#29366f', bottomColor: '#ef7d57', cloudColor: '#f4f4f4', shadeColor: '#5d275d' },
    controls: [select('quality', 'Quality', ['low', 'medium', 'high']), slider('pixelSize', 'Pixel size (0 = smooth)', 0, 12, 1), slider('speed', 'Drift speed', 0, 0.4, 0.01), slider('coverage', 'Coverage', 0.2, 0.9, 0.01), slider('sunAngle', 'Sun angle (°)', -90, 90, 5), slider('sunHeight', 'Sun height', -0.2, 1.2, 0.05), color('topColor', 'Sky top'), color('bottomColor', 'Horizon'), color('cloudColor', 'Cloud light'), color('shadeColor', 'Cloud shade')],
    docs: [
      ['quality', '"low" | "medium" | "high"', '"medium"', 'Ray steps, noise detail and render resolution: 14/3/35%, 22/4/50%, 36/5/80%.'],
      ['pixelSize', 'number', '0', 'Render one sample per N px and scale up crisply, for a pixel-art sky. Overrides the quality resolution.'],
      ['speed / coverage', 'number', '0.06 / 0.55', 'Drift speed, and how much of the sky is cloud.'],
      ['sunAngle / sunHeight', 'number', '30 / 0.35', 'Where the light comes from (degrees left/right, and how high).'],
      ['topColor / bottomColor / cloudColor / shadeColor', 'string', 'navy / orange / white / plum', 'Sky gradient, lit cloud tops and shaded bellies. The gradient is also the no-WebGL fallback.'],
      ['children / height', 'ReactNode / number | string', '- / "100%"', 'Content on top; fills its parent by default.'],
      ['Accessibility', '-', '-', 'Decorative canvas. Pauses off-screen and in hidden tabs; frees the GPU context on unmount. Reduced motion: one still frame.']
    ],
    usage: `import CloudSky from "./CloudSky";

<div style={{ height: 420 }}>
  <CloudSky quality="medium" pixelSize={4}>
    <h1>Above the clouds</h1>
  </CloudSky>
</div>`,
    fullBleed: true,
    render: props => (
      <CloudSky {...props}>
        <div style={{ display: 'grid', height: '100%', placeItems: 'center', alignContent: 'center', gap: 12, padding: 16, color: '#f4f4f4', textAlign: 'center', textShadow: '0 2px 0 rgba(26,28,44,0.6)' }}>
          <span style={{ font: `20px/1.4 ${TITLE_FONT}` }}>ABOVE THE CLOUDS</span>
          <span style={{ font: `16px ${PIXEL_FONT}` }}>A ray-marched sky in one small shader.</span>
        </div>
      </CloudSky>
    )
  },

  'breadcrumb-trail': {
    source: breadcrumbTrailSource,
    defaults: { trailWidth: 70, fontSize: 14, accentColor: '#73eff7' },
    controls: [slider('trailWidth', 'Trail width (%)', 25, 100, 1), slider('fontSize', 'Font size', 11, 20, 1), color('accentColor', 'Focus ring')],
    docs: [
      ['items', '{ label, href?, icon? }[]', '[]', 'Root first, current page last. Items without href render as buttons.'],
      ['onNavigate', '(item, index, event) => void', '-', 'Called on any crumb or menu click (call event.preventDefault() for client routing).'],
      ['separator', 'ReactNode', 'chevron', 'Between crumbs.'],
      ['moreLabel / label', 'string', '"Show hidden pages" / "Breadcrumb"', 'Names for the “…” menu and the nav landmark.'],
      ['fontSize and colours', 'number / string', '14 / pixel palette', 'textColor, mutedColor, dimColor, hoverColor, chipColor, menuColor, lineColor, accentColor.'],
      ['Accessibility', '-', '-', 'nav + ordered list, aria-current on the last crumb. The “…” button opens a menu (arrows, Home/End, Escape returns focus).']
    ],
    usage: `import BreadcrumbTrail from "./BreadcrumbTrail";

<BreadcrumbTrail items={[{ label: "Home", href: "/" }, { label: "Docs", href: "/docs" }, { label: "Install" }]} />`,
    render: props => <CrumbsDemo {...props} />
  },

  'inline-edit': {
    source: inlineEditSource,
    defaults: { saveOnBlur: true, slowSave: true, radius: 8, accentColor: '#73eff7' },
    controls: [toggle('saveOnBlur', 'Save on blur'), toggle('slowSave', 'Slow save (async)'), slider('radius', 'Corner radius', 0, 20, 1), color('accentColor', 'Accent')],
    docs: [
      ['value / defaultValue', 'string', '- / ""', 'Controlled or not. When controlled, update value in onSave.'],
      ['onSave', '(value) => void | Promise', '-', 'Return a promise to show “Saving…”; throw (or reject) with a message to keep editing and show it.'],
      ['validate', '(value) => string | null', '-', 'Return a message to block the save.'],
      ['saveOnBlur', 'boolean', 'true', 'Clicking away saves; set false to cancel instead.'],
      ['placeholder / label / maxLength / minWidth', 'string / string / number / number', '"Click to edit" / "Text" / - / 60', 'Empty text, the accessible name, and limits.'],
      ['Accessibility', '-', '-', 'The value is a button (“Edit World name: …”); the field has a label, errors are described and announced; focus returns after save or cancel. Reduced motion: no width animation.']
    ],
    usage: `import InlineEdit from "./InlineEdit";

<InlineEdit label="Title" defaultValue="Untitled" onSave={title => api.rename(title)} />`,
    render: props => <InlineDemo {...props} />
  },

  'funnel-flow': {
    source: funnelFlowSource,
    defaults: { particles: true, rate: 40, height: 280, barWidth: 18, barColor: '#3b5dc9', activeColor: '#73eff7' },
    controls: [toggle('particles', 'Particles'), slider('rate', 'Particles per second', 5, 120, 5), slider('height', 'Height', 200, 420, 10), slider('barWidth', 'Bar width', 6, 40, 1), color('barColor', 'Bars'), color('activeColor', 'Highlighted stage')],
    docs: [
      ['stages', '{ label, value }[]', '[]', 'Top of the funnel first. Bar heights scale to the first stage.'],
      ['particles / rate / particleSize', 'boolean / number / number', 'true / 40 / 3', 'The flow: dots per second entering the first band. At each band the converting share carries on; the rest fall away.'],
      ['height / barWidth', 'number', '280 / 18', 'Chart height (it fills the width) and bar thickness.'],
      ['locale', 'string', '"en-US"', 'Number and percent formatting.'],
      ['barColor / activeColor / bandColor / particleColor', 'string', 'one blue hue / cyan highlight', 'Single-hue by design; text stays in the ink colours.'],
      ['Accessibility', '-', '-', 'Focusable group with a summary; arrows read each stage aloud; a table with every count and rate for screen readers. Reduced motion: no particles.']
    ],
    usage: `import FunnelFlow from "./FunnelFlow";

<FunnelFlow stages={[{ label: "Visited", value: 12480 }, { label: "Signed up", value: 4310 }, { label: "Paid", value: 412 }]} />`,
    render: props => <FunnelDemo {...props} />
  },

  'scroll-typography': {
    source: scrollTypographySource,
    defaults: { sensitivity: 2400, minWeight: 300, maxWeight: 900, stretch: 0.25, widthRange: 20, skew: 10, stagger: 35, fontSize: 56, accentColor: '#73eff7', pixelFont: false },
    controls: [slider('sensitivity', 'Full effect at (px/s)', 600, 6000, 100), slider('minWeight', 'Rest weight', 100, 500, 50), slider('maxWeight', 'Peak weight', 500, 1000, 50), slider('stretch', 'Stretch', 0, 0.6, 0.05), slider('widthRange', 'Width axis (%)', 0, 50, 5), slider('skew', 'Lean (°)', 0, 25, 1), slider('stagger', 'Word delay (ms)', 0, 120, 5), slider('fontSize', 'Font size', 24, 96, 2), color('accentColor', 'Speed colour'), toggle('pixelFont', 'Pixel font (400–700)')],
    docs: [
      ['text / as', 'string / element', '"" / "p"', 'Plain text, split into words.'],
      ['sensitivity', 'number (px/s)', '2400', 'Scroll speed that gives the full effect.'],
      ['minWeight / maxWeight / widthRange', 'number', '300 / 900 / 0', 'Variable-font weight range, and how much wider (in %) fast words get if the font has a width axis.'],
      ['stretch / skew', 'number', '0.25 / 10', 'Vertical stretch at full speed, and the lean in degrees (it follows the scroll direction).'],
      ['stagger', 'number (ms)', '35', 'Delay per word, which makes the ripple.'],
      ['fontSize / textColor / accentColor / fontFamily', 'number / string', '56 / white / cyan / Roboto Flex', 'Use a variable font for smooth weight changes.'],
      ['Accessibility', '-', '-', 'Stays plain, selectable text. Only runs while scrolling and on-screen. Reduced motion: no effect.']
    ],
    usage: `import ScrollTypography from "./ScrollTypography";

<ScrollTypography as="h2" text="Speed changes everything" />`,
    render: props => <ScrollTypeDemo {...props} />
  },

  'kinetic-headline': {
    source: kineticHeadlineSource,
    defaults: { mode: 'breathe', speed: 0.5, wavelength: 8, bpm: 100, spread: 3, minWeight: 200, maxWeight: 900, minWidth: 85, maxWidth: 125, tint: 0.6, fontSize: 72, accentColor: '#ffcd75', pixelFont: false },
    controls: [select('mode', 'Driver', ['breathe', 'beat', 'scroll']), slider('speed', 'Breaths per second', 0.1, 2, 0.05), slider('wavelength', 'Wave length (letters)', 2, 30, 1), slider('bpm', 'Tempo (BPM)', 40, 200, 1), slider('spread', 'Pulse width (letters)', 1, 8, 0.5), slider('minWeight', 'Light weight', 100, 500, 50), slider('maxWeight', 'Heavy weight', 500, 1000, 50), slider('minWidth', 'Narrow (%)', 25, 100, 5), slider('maxWidth', 'Wide (%)', 100, 151, 1), slider('tint', 'Accent tint', 0, 1, 0.05), slider('fontSize', 'Font size', 28, 120, 2), color('accentColor', 'Accent'), toggle('pixelFont', 'Pixel font (400–700)')],
    docs: [
      ['text / as', 'string / element', '"" / "h2"', 'The headline; screen readers get it once as plain text.'],
      ['mode', '"breathe" | "beat" | "scroll"', '"breathe"', 'A rolling wave, a pulse on every beat, or a spotlight driven by scroll position.'],
      ['speed / wavelength', 'number', '0.5 / 8', 'Breathe: cycles per second and letters per wave.'],
      ['bpm / spread', 'number', '100 / 3', 'Beat tempo, and the pulse/spotlight width in letters.'],
      ['minWeight / maxWeight / minWidth / maxWidth', 'number', '200 / 900 / 100 / 100', 'Variable-font ranges: weight, and width in % (needs a wdth axis, e.g. Roboto Flex).'],
      ['tint / accentColor', 'number 0–1 / string', '0 / gold', 'How far heavy letters shift toward the accent.'],
      ['Accessibility', '-', '-', 'Letters are aria-hidden, the text is read once. Pauses off-screen; reduced motion: steady middle weight.']
    ],
    usage: `import KineticHeadline from "./KineticHeadline";

<KineticHeadline as="h1" text="Breathe in the pixels" mode="beat" bpm={120} />`,
    render: props => <KineticDemo {...props} />
  }
};
