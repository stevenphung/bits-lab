import { useMemo, useRef, useState } from 'react';
import Sprite from './pixel/Sprite';
import { SHEET_ANIMATIONS, demoParallaxLayers, demoSpriteSheet } from './pixel/demoArt';
import QuestDialog from './bits/QuestDialog';
import HealthBar from './bits/HealthBar';
import InventoryGrid from './bits/InventoryGrid';
import AchievementToaster, { achievement } from './bits/AchievementToast';
import PressStart from './bits/PressStart';
import CRTPower from './bits/CRTPower';
import PixelLoader from './bits/PixelLoader';
import SpriteAnimator from './bits/SpriteAnimator';
import PixelParallax from './bits/PixelParallax';
import LevelMap from './bits/LevelMap';
import PixelButton from './bits/PixelButton';
import ChiptuneKit, { ChiptuneProvider, MuteToggle, playChip } from './bits/ChiptuneKit';
import questDialogSource from './bits/QuestDialog.jsx?raw';
import healthBarSource from './bits/HealthBar.jsx?raw';
import inventoryGridSource from './bits/InventoryGrid.jsx?raw';
import achievementSource from './bits/AchievementToast.jsx?raw';
import pressStartSource from './bits/PressStart.jsx?raw';
import crtPowerSource from './bits/CRTPower.jsx?raw';
import pixelLoaderSource from './bits/PixelLoader.jsx?raw';
import spriteAnimatorSource from './bits/SpriteAnimator.jsx?raw';
import pixelParallaxSource from './bits/PixelParallax.jsx?raw';
import levelMapSource from './bits/LevelMap.jsx?raw';
import pixelButtonSource from './bits/PixelButton.jsx?raw';
import chiptuneKitSource from './bits/ChiptuneKit.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });
const text = (name, label) => ({ name, type: 'text', label });

const stack = { display: 'grid', justifyItems: 'center', gap: 28, width: '100%', padding: '24px 0' };
const row = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 18 };
const hint = { margin: 0, color: 'var(--demo-muted, #94b0c2)', font: '15px/1.4 "Pixelify Sans", system-ui, sans-serif', textAlign: 'center' };

// ---------- Demo wrappers (hold demo-only state) ----------

function HealthDemo({ value, sound, ...props }) {
  const [hp, setHp] = useState(value);
  const [mana, setMana] = useState(40);
  return (
    <div style={{ ...stack, maxWidth: 460 }}>
      <div style={{ display: 'grid', gap: 18, width: '100%' }}>
        <HealthBar {...props} value={hp} />
        <HealthBar label="MP" value={mana} max={60} segments={6} color="#41a6f6" lowColor="#41a6f6" height={14} />
        <HealthBar label="XP · LV 12" value={680} max={1000} segments={0} color="#ffcd75" height={10} showValue={false} />
      </div>
      <div style={row}>
        <PixelButton
          variant="primary"
          size="sm"
          onPress={() => {
            setHp(current => Math.max(0, current - 15));
            if (sound) playChip('hit');
          }}
        >
          Take hit
        </PixelButton>
        <PixelButton
          variant="success"
          size="sm"
          onPress={() => {
            setHp(current => Math.min(props.max, current + 20));
            setMana(current => Math.max(0, current - 12));
            if (sound) playChip('powerUp');
          }}
        >
          Heal
        </PixelButton>
      </div>
    </div>
  );
}

const ACHIEVEMENTS = [
  { title: 'Getting wood', description: 'Punch your first tree.', icon: <Sprite name="pickaxe" size={36} />, xp: 10, tier: 'bronze' },
  { title: 'Shiny!', description: 'Find your first diamond.', icon: <Sprite name="gem" size={36} />, xp: 50, tier: 'diamond' },
  { title: 'Treasure hunter', description: 'Open 10 chests.', icon: <Sprite name="chest" size={36} />, xp: 25, tier: 'gold' },
  { title: 'Alchemist', description: 'Brew a potion of anything.', icon: <Sprite name="potion" size={36} />, xp: 30, tier: 'silver' },
  { title: 'Unstoppable', description: 'Survive 7 nights.', icon: <Sprite name="heart" size={36} />, xp: 100, tier: 'gold' }
];

function AchievementDemo({ sound, ...props }) {
  const next = useRef(0);
  return (
    <div style={{ ...stack, height: '100%', alignContent: 'center' }}>
      <PixelButton
        size="lg"
        variant="warning"
        icon={<Sprite name="star" size={22} />}
        onPress={() => {
          achievement(ACHIEVEMENTS[next.current % ACHIEVEMENTS.length]);
          next.current += 1;
        }}
      >
        Unlock achievement
      </PixelButton>
      <p style={hint}>Click a few times: toasts queue and stack. Hover one to pause it.</p>
      <AchievementToaster {...props} contained onShow={() => sound && playChip('levelUp')} />
    </div>
  );
}

const QUEST_LINES = [
  { speaker: 'Old Miner', portrait: <Sprite name="pickaxe" size={56} />, text: 'Ah, a new face! These tunnels run deeper than anyone remembers.' },
  { speaker: 'Old Miner', portrait: <Sprite name="pickaxe" size={56} />, text: "They say a diamond the size of your fist waits at the bottom. Nobody's come back with it... yet." },
  {
    speaker: 'Old Miner',
    portrait: <Sprite name="gem" size={56} />,
    text: 'So, will you go down there?',
    choices: [
      { label: "I'm in. Hand me a pickaxe.", value: 'yes' },
      { label: 'Maybe after lunch.', value: 'no' }
    ]
  },
  { speaker: 'Old Miner', portrait: <Sprite name="heart" size={56} />, text: 'Ha! Bring torches. Lots of torches.' }
];

function QuestDemo({ sound, ...props }) {
  const last = useRef(0);
  return (
    <div style={stack}>
      <QuestDialog
        {...props}
        lines={QUEST_LINES}
        loop
        onChar={() => {
          // Throttle the blip so fast text doesn't buzz.
          const now = performance.now();
          if (sound && now - last.current > 45) {
            last.current = now;
            playChip('blip');
          }
        }}
        onChoice={() => sound && playChip('confirm')}
      />
      <p style={hint}>Click, tap, Enter or Space to skip and advance. Arrow keys pick a choice.</p>
    </div>
  );
}

function CRTDemo(props) {
  const layers = useMemo(() => demoParallaxLayers(), []);
  return (
    <div style={{ width: 'min(640px, 100%)', padding: '20px 0' }}>
      <CRTPower {...props}>
        <PixelParallax layers={layers} height="100%" speed={30} style={{ height: '100%' }}>
          <PressStart size={18} subtext="" listenGlobally={false} />
        </PixelParallax>
      </CRTPower>
    </div>
  );
}

function ParallaxDemo(props) {
  const layers = useMemo(() => demoParallaxLayers(), []);
  return <PixelParallax {...props} layers={layers} height="100%" style={{ position: 'absolute', inset: 0, height: '100%' }} />;
}

const INVENTORY = [
  { id: 'sword', name: 'Diamond sword', icon: <Sprite name="sword" size={40} />, rarity: 'epic', description: 'Sharp enough to cut through a mountain.' },
  { id: 'pickaxe', name: 'Diamond pickaxe', icon: <Sprite name="pickaxe" size={40} />, rarity: 'rare', description: 'Mines anything, eventually.' },
  null,
  { id: 'gem', name: 'Diamond', icon: <Sprite name="gem" size={40} />, count: 3, rarity: 'rare', description: 'Stackable. Shiny. Rare.' },
  { id: 'coin', name: 'Gold coin', icon: <Sprite name="coin" size={40} />, count: 48, rarity: 'common', description: 'Spend it at the village shop.' },
  { id: 'coin', name: 'Gold coin', icon: <Sprite name="coin" size={40} />, count: 30, rarity: 'common', description: 'Spend it at the village shop.' },
  { id: 'potion', name: 'Potion of leaping', icon: <Sprite name="potion" size={40} />, count: 2, rarity: 'uncommon', description: 'Jump higher for 3 minutes.' },
  null,
  { id: 'heart', name: 'Heart of the sea', icon: <Sprite name="heart" size={40} />, rarity: 'legendary', description: 'Pulses gently. Nobody knows why.' },
  { id: 'book', name: 'Recipe book', icon: <Sprite name="book" size={40} />, rarity: 'uncommon', description: 'Contains 112 crafting recipes.' },
  null,
  { id: 'chest', name: 'Ender chest', icon: <Sprite name="chest" size={40} />, rarity: 'epic', description: 'Bigger on the inside.' },
  { id: 'orb', name: 'XP orb', icon: <Sprite name="orb" size={40} />, count: 12, rarity: 'common', description: 'Collect to level up.' },
  null,
  null,
  { id: 'star', name: 'Nether star', icon: <Sprite name="star" size={40} />, rarity: 'legendary', description: 'Glows with a cold light.' },
  null,
  { id: 'lever', name: 'Lever', icon: <Sprite name="lever" size={40} />, count: 4, rarity: 'common', description: 'Flip it. See what happens.' }
];

function InventoryDemo({ sound, ...props }) {
  return (
    <div style={stack}>
      <InventoryGrid {...props} items={INVENTORY} onChange={(_, { action }) => sound && playChip(action === 'merged' ? 'coin' : 'select')} />
      <p style={hint}>Drag to move or swap; drop coins on coins to stack. Keyboard: arrows, then Space to pick up and drop.</p>
    </div>
  );
}

function LevelMapDemo({ sound, ...props }) {
  return (
    <div style={{ width: 'min(760px, 100%)' }}>
      <LevelMap {...props} marker={<Sprite name="gem" size={28} />} onSelect={() => sound && playChip('select')} />
    </div>
  );
}

function PixelButtonDemo({ label, sound, ...props }) {
  return (
    <div style={stack}>
      <PixelButton {...props} icon={<Sprite name="star" size={18} />} onPress={() => sound && playChip('confirm')}>
        {label}
      </PixelButton>
      <div style={row}>
        {['secondary', 'success', 'warning', 'info'].map(variant => (
          <PixelButton key={variant} variant={variant} size="sm" onPress={() => sound && playChip('select')}>
            {variant}
          </PixelButton>
        ))}
      </div>
    </div>
  );
}

function ChiptuneDemo(props) {
  return (
    <ChiptuneProvider>
      <div style={stack}>
        <MuteToggle />
        <ChiptuneKit {...props} />
        <p style={hint}>One file, no audio assets: every sound is synthesized in the browser.</p>
      </div>
    </ChiptuneProvider>
  );
}

// ---------- Catalog entries ----------

const DEMO_ENTRIES = {
  'quest-dialog': {
    source: questDialogSource,
    defaults: { speed: 40, fontSize: 13, width: 620, boxColor: '#1a1c2c', borderColor: '#f4f4f4', accentColor: '#ffcd75', sound: true },
    controls: [
      slider('speed', 'Letters per second', 5, 120, 1),
      slider('fontSize', 'Font size', 9, 20, 1),
      slider('width', 'Width', 320, 800, 10),
      color('boxColor', 'Box'),
      color('borderColor', 'Border'),
      color('accentColor', 'Accent'),
      toggle('sound', 'Typing blips (demo)')
    ],
    docs: [
      ['lines', '{ speaker?, text, portrait?, choices? }[]', 'demo lines', 'The conversation. Choices are { label, value }.'],
      ['speed', 'number', '40', 'Typing speed in characters per second; punctuation holds longer.'],
      ['onChar', '(char) => void', '-', 'Called per typed character — hook up a blip sound.'],
      ['onChoice', '(value, index) => void', '-', 'Called when the player picks a choice.'],
      ['onAdvance / onComplete', '() => void', '-', 'Called on each new line / when the last line is dismissed.'],
      ['loop', 'boolean', 'false', 'Start over after the last line.'],
      ['width / fontSize / minLines', 'number', '620 / 13 / 3', 'Box sizing; the box never jumps while typing.'],
      ['boxColor / borderColor / textColor / accentColor', 'string', 'Sweetie 16', 'Colors.'],
      ['fontFamily / bodyFont', 'string', 'Press Start 2P', 'Fonts for labels and dialogue text.']
    ],
    usage: `import QuestDialog from "./QuestDialog";

<QuestDialog
  lines={[
    { speaker: "Old Miner", text: "These tunnels run deeper than anyone remembers." },
    { speaker: "Old Miner", text: "Will you go?", choices: [{ label: "Yes", value: "yes" }, { label: "Not yet", value: "no" }] }
  ]}
  speed={40}
  onChoice={value => console.log(value)}
/>`,
    render: props => <QuestDemo {...props} />
  },

  'health-bar': {
    source: healthBarSource,
    defaults: { value: 72, max: 100, label: 'HP', segments: 10, height: 20, color: '#38b764', lowColor: '#b13e53', lowThreshold: 0.25, sound: true },
    controls: [
      slider('value', 'Starting value', 0, 100, 1),
      text('label', 'Label'),
      slider('segments', 'Segments (0 = smooth)', 0, 20, 1),
      slider('height', 'Height', 8, 40, 1),
      color('color', 'Fill'),
      color('lowColor', 'Critical color'),
      slider('lowThreshold', 'Critical below', 0, 0.6, 0.01),
      toggle('sound', 'Sounds (demo)')
    ],
    docs: [
      ['value / max', 'number', '72 / 100', 'Current and maximum. Changes animate: damage drains, heals fill.'],
      ['label', 'string', '"HP"', 'Shown above the bar and used as the meter’s accessible name.'],
      ['segments', 'number', '10', 'Number of cells; 0 for a smooth bar.'],
      ['lowThreshold', 'number', '0.25', 'Fraction of max at which the bar turns critical and pulses.'],
      ['delay / drainDuration', 'number', '350 / 600', 'How long the damage ghost waits, and how long it drains (ms).'],
      ['color / lowColor / damageColor / healColor / trackColor', 'string', 'Sweetie 16', 'Colors.'],
      ['height / showValue', 'number / boolean', '20 / true', 'Bar height and the "72/100" readout.']
    ],
    usage: `import HealthBar from "./HealthBar";

<HealthBar value={hp} max={100} label="HP" segments={10} />`,
    render: props => <HealthDemo key={props.value} {...props} />
  },

  'inventory-grid': {
    source: inventoryGridSource,
    defaults: { columns: 6, slotSize: 64, maxStack: 64, panelColor: '#333c57', accentColor: '#ffcd75', sound: true },
    controls: [slider('columns', 'Columns', 3, 9, 1), slider('slotSize', 'Slot size', 44, 88, 2), slider('maxStack', 'Max stack', 1, 99, 1), color('panelColor', 'Panel'), color('accentColor', 'Held highlight'), toggle('sound', 'Sounds (demo)')],
    docs: [
      ['items', '(Item | null)[]', '[]', 'Slots, left to right. Item: { id, name, icon, count?, rarity?, description? }.'],
      ['onChange', '(items, { from, to, action }) => void', '-', 'Called after every move; action is moved, merged or swapped.'],
      ['columns / slotSize', 'number', '6 / 64', 'Grid shape and slot size in px.'],
      ['maxStack', 'number', '64', 'Same-id items merge up to this count; the rest stays behind.'],
      ['panelColor / slotColor / hoverColor / accentColor', 'string', 'Sweetie 16', 'Colors. Rarity colors are exported as RARITY_COLORS.'],
      ['moveItem', '(items, from, to, maxStack) => { items, action }', 'export', 'The pure move/merge/swap logic, for server sync or tests.']
    ],
    usage: `import InventoryGrid from "./InventoryGrid";

<InventoryGrid
  columns={6}
  items={[
    { id: "sword", name: "Diamond sword", icon: <img src="/sword.png" alt="" />, rarity: "epic" },
    null,
    { id: "coin", name: "Gold coin", icon: <img src="/coin.png" alt="" />, count: 48 }
  ]}
  onChange={(items, { action }) => save(items)}
/>`,
    render: props => <InventoryDemo key={`${props.columns}-${props.maxStack}`} {...props} />
  },

  'achievement-toast': {
    source: achievementSource,
    defaults: { position: 'bottom-right', duration: 4500, max: 3, label: 'Achievement unlocked', sound: true },
    controls: [select('position', 'Position', ['bottom-right', 'bottom-left', 'top-right', 'top-left']), slider('duration', 'Duration (ms)', 1500, 10000, 100), slider('max', 'Max visible', 1, 5, 1), text('label', 'Label'), toggle('sound', 'Fanfare (demo)')],
    docs: [
      ['achievement(toast)', '({ title, description?, icon?, xp?, tier?, duration? }) => id', 'export', 'Shows an achievement. tier: bronze, silver, gold, diamond or a color.'],
      ['position', '"bottom-right" | "bottom-left" | "top-right" | "top-left"', '"bottom-right"', 'Corner of the stack.'],
      ['max', 'number', '3', 'How many show at once; the rest queue.'],
      ['duration', 'number', '4500', 'Time on screen in ms; hover or focus pauses it.'],
      ['contained', 'boolean', 'false', 'Position inside the nearest positioned parent instead of the viewport.'],
      ['onShow', '(toast) => void', '-', 'Called as each toast appears — play a sound here.']
    ],
    usage: `import AchievementToaster, { achievement } from "./AchievementToast";

// Once, near the root:
<AchievementToaster position="bottom-right" />

// Anywhere:
achievement({ title: "Shiny!", description: "Find your first diamond.", xp: 50, tier: "diamond" });`,
    fullBleed: true,
    render: props => <AchievementDemo {...props} />
  },

  'press-start': {
    source: pressStartSource,
    defaults: { text: 'Press start', startedText: 'Get ready!', subtext: '© 2026 Bits Lab', color: '#ffcd75', size: 28, blinkSpeed: 1.06, sound: true },
    controls: [text('text', 'Prompt'), text('startedText', 'After start'), text('subtext', 'Subtext'), color('color', 'Color'), slider('size', 'Size', 12, 48, 1), slider('blinkSpeed', 'Blink period (s)', 0.3, 2, 0.02), toggle('sound', 'Start sound (demo)')],
    docs: [
      ['text / startedText / subtext', 'string', '"Press start" …', 'The prompt, the line shown after starting, and the small line below.'],
      ['onStart', '() => void', '-', 'Called after the start flash.'],
      ['listenGlobally', 'boolean', 'true', 'Any key on the page starts (ignored while typing in fields).'],
      ['resetAfter', 'number', '2500', 'Return to the prompt after this many ms (0 to stay).'],
      ['color / shadowColor / subColor / size / blinkSpeed', 'string / number', 'Sweetie 16', 'Look and blink period.']
    ],
    usage: `import PressStart from "./PressStart";

<PressStart onStart={() => navigate("/play")} />`,
    render: ({ sound, ...props }) => <PressStart {...props} onStart={() => sound && playChip('powerUp')} />
  },

  'crt-power': {
    source: crtPowerSource,
    defaults: { duration: 650, scanlines: true, vignette: true, glowColor: '#e8f6ff', bezelColor: '#333c57', height: 320 },
    controls: [slider('duration', 'Duration (ms)', 200, 2000, 10), toggle('scanlines', 'Scanlines'), toggle('vignette', 'Vignette'), color('glowColor', 'Glow'), color('bezelColor', 'Bezel'), slider('height', 'Height', 180, 420, 10)],
    docs: [
      ['children', 'ReactNode', '-', 'What the screen shows.'],
      ['on / defaultOn / onChange', 'boolean / boolean / (on) => void', '- / true / -', 'Controlled or uncontrolled power state.'],
      ['duration', 'number', '650', 'Power-on time in ms; power-off is a little faster.'],
      ['powerOnAtMount', 'boolean', 'true', 'Play the power-on animation on first render.'],
      ['showButton', 'boolean', 'true', 'Render the built-in power button.'],
      ['scanlines / vignette / glowColor / bezelColor / height / radius', 'mixed', '-', 'Screen look.']
    ],
    usage: `import CRTPower from "./CRTPower";

<CRTPower height={320}>
  <YourGameScreen />
</CRTPower>`,
    render: props => <CRTDemo {...props} />
  },

  'pixel-loader': {
    source: pixelLoaderSource,
    defaults: { label: 'Loading', chunks: 20, width: 440, accentColor: '#a7f070', simulateDuration: 6000, showPercent: true },
    controls: [text('label', 'Label'), slider('chunks', 'Chunks', 6, 40, 1), slider('width', 'Width', 240, 640, 10), color('accentColor', 'Accent'), slider('simulateDuration', 'Simulated load (ms)', 1500, 15000, 100), toggle('showPercent', 'Show percent')],
    docs: [
      ['progress', 'number', '-', 'Progress 0–100. Leave out to simulate a load (demo mode).'],
      ['label / doneLabel', 'string', '"Loading" / "Complete!"', 'Title text while loading and when done.'],
      ['tips / tipInterval', 'string[] / number', 'game tips / 3200', 'Rotating tips under the bar, announced politely.'],
      ['chunks', 'number', '20', 'Number of cells in the bar.'],
      ['onComplete', '() => void', '-', 'Called when progress reaches 100.'],
      ['accentColor / frameColor / textColor / mutedColor / width', 'string / number', 'Sweetie 16', 'Look.']
    ],
    usage: `import PixelLoader from "./PixelLoader";

<PixelLoader progress={percent} tips={["Tip: save often."]} onComplete={start} />`,
    render: props => <PixelLoader {...props} />
  },

  'sprite-animator': {
    source: spriteAnimatorSource,
    defaults: { animation: 'coin', fps: 10, scale: 10, pingPong: false, flipX: false, playing: true },
    controls: [select('animation', 'Animation', Object.keys(SHEET_ANIMATIONS)), slider('fps', 'FPS (overrides)', 1, 30, 1), slider('scale', 'Scale', 2, 16, 1), toggle('pingPong', 'Ping-pong'), toggle('flipX', 'Flip horizontally'), toggle('playing', 'Playing')],
    docs: [
      ['src', 'string', '-', 'Sprite sheet URL. Frames run left to right; animations can use separate rows.'],
      ['frameWidth / frameHeight', 'number', '16 / 16', 'Size of one frame in the sheet, in px.'],
      ['animations / animation', 'Record<string, { row, frames, fps?, loop?, pingPong? }> / string', '-', 'Named animations and the one to play.'],
      ['row / frames / fps', 'number', '0 / 8 / 10', 'Used when no animations map is given.'],
      ['scale', 'number', '6', 'Integer upscaling with nearest-neighbor pixels.'],
      ['loop / pingPong / playing / flipX', 'boolean', 'true / false / true / false', 'Playback options.'],
      ['onEnd', '() => void', '-', 'Called when a non-looping animation finishes.']
    ],
    usage: `import SpriteAnimator from "./SpriteAnimator";

<SpriteAnimator
  src="/hero-sheet.png"
  frameWidth={16}
  frameHeight={16}
  animations={{ idle: { row: 0, frames: 4, fps: 6 }, run: { row: 1, frames: 8, fps: 12 } }}
  animation="run"
  scale={6}
/>`,
    render: ({ fps, ...props }) => {
      const animations = Object.fromEntries(Object.entries(SHEET_ANIMATIONS).map(([name, a]) => [name, { row: a.row, frames: a.frames, fps }]));
      return (
        <div style={stack}>
          <SpriteAnimator {...props} src={demoSpriteSheet()} animations={animations} label={`${props.animation} animation`} />
          <div style={row}>
            {Object.keys(SHEET_ANIMATIONS).map(name => (
              <SpriteAnimator key={name} src={demoSpriteSheet()} animations={animations} animation={name} scale={4} label={`${name} animation`} />
            ))}
          </div>
        </div>
      );
    }
  },

  'pixel-parallax': {
    source: pixelParallaxSource,
    defaults: { mode: 'auto', speed: 40, intensity: 60, pixelSize: 4, dayNight: true, cycleDuration: 24 },
    controls: [select('mode', 'Mode', ['auto', 'mouse', 'scroll']), slider('speed', 'Auto speed (px/s)', 0, 160, 1), slider('intensity', 'Mouse/scroll strength', 0, 200, 1), slider('pixelSize', 'Pixel snap', 1, 8, 1), toggle('dayNight', 'Day-night cycle'), slider('cycleDuration', 'Cycle length (s)', 6, 120, 1)],
    docs: [
      ['layers', '{ src?, node?, depth?, height?, bottom?, opacity? }[]', '[]', 'Back to front. Images tile horizontally; depth 0 is fixed, 1 moves the most.'],
      ['mode', '"auto" | "mouse" | "scroll"', '"auto"', 'What drives the motion.'],
      ['speed / intensity', 'number', '40 / 60', 'Auto pan speed (px/s at depth 1) and mouse/scroll strength.'],
      ['pixelSize', 'number', '4', 'Offsets snap to this many px, keeping pixel art crisp.'],
      ['dayNight / cycleDuration', 'boolean / number', 'false / 24', 'Animate sky and tint through day, dusk and night.'],
      ['sky / height / children', 'string / number / ReactNode', '-', 'Background, size, and centered overlay content.']
    ],
    usage: `import PixelParallax from "./PixelParallax";

const layers = [
  { src: "/mountains.png", depth: 0.15, height: "60%" },
  { src: "/trees.png", depth: 0.6, height: "35%" },
  { src: "/ground.png", depth: 1, height: "15%" }
];

<PixelParallax layers={layers} mode="auto" dayNight height={360} />`,
    fullBleed: true,
    render: props => <ParallaxDemo {...props} />
  },

  'level-map': {
    source: levelMapSource,
    defaults: { nodeSize: 56, minSpacing: 130, rowGap: 150, clearedColor: '#a7f070', pathColor: '#566c86', sound: true },
    controls: [slider('nodeSize', 'Node size', 36, 80, 2), slider('minSpacing', 'Min spacing', 90, 220, 5), slider('rowGap', 'Row gap', 100, 220, 5), color('clearedColor', 'Cleared trail'), color('pathColor', 'Trail'), toggle('sound', 'Select sound (demo)')],
    docs: [
      ['levels', "{ id, name?, label?, status: 'cleared'|'current'|'available'|'locked', stars? }[]", 'demo world', 'The levels, in order.'],
      ['onSelect', '(level, index) => void', '-', 'Called when an unlocked level is chosen.'],
      ['marker', 'ReactNode', '▼', 'Shown bouncing above the current level.'],
      ['nodeSize / minSpacing / rowGap / padding', 'number', '56 / 130 / 150 / 24', 'Layout; the trail re-flows to the container width.'],
      ['pathColor / clearedColor / textColor', 'string', 'Sweetie 16', 'Colors.'],
      ['drawDuration', 'number', '1200', 'How long the cleared trail takes to draw in (ms).']
    ],
    usage: `import LevelMap from "./LevelMap";

<LevelMap
  levels={[
    { id: 1, name: "Sign up", status: "cleared", stars: 3 },
    { id: 2, name: "Connect data", status: "current" },
    { id: 3, name: "Invite team", status: "locked" }
  ]}
  onSelect={level => open(level.id)}
/>`,
    render: props => <LevelMapDemo {...props} />
  },

  'pixel-button': {
    source: pixelButtonSource,
    defaults: { label: 'Start game', variant: 'primary', size: 'lg', loading: false, disabled: false, sound: true },
    controls: [text('label', 'Label'), select('variant', 'Variant', ['primary', 'secondary', 'success', 'warning', 'info']), select('size', 'Size', ['sm', 'md', 'lg']), toggle('loading', 'Loading'), toggle('disabled', 'Disabled'), toggle('sound', 'Click sound (demo)')],
    docs: [
      ['variant', '"primary" | "secondary" | "success" | "warning" | "info"', '"primary"', 'Color preset.'],
      ['size', '"sm" | "md" | "lg"', '"md"', 'Size, including border thickness.'],
      ['loading', 'boolean', 'false', 'Shows animated pips, sets aria-busy and ignores clicks.'],
      ['disabled', 'boolean', 'false', 'Cracked, desaturated and not clickable.'],
      ['icon', 'ReactNode', '-', 'Shown before the label.'],
      ['onPress / onClick', '(event) => void', '-', 'Click handlers (both work).'],
      ['color / textColor / fontFamily', 'string', '-', 'Override the variant colors and font.']
    ],
    usage: `import PixelButton from "./PixelButton";

<PixelButton variant="primary" size="lg" onPress={startGame}>
  Start game
</PixelButton>`,
    render: props => <PixelButtonDemo {...props} />
  },

  'chiptune-kit': {
    source: chiptuneKitSource,
    defaults: { volume: 0.8, columns: 4, accentColor: '#ffcd75' },
    controls: [slider('volume', 'Volume', 0, 1, 0.01), slider('columns', 'Columns', 2, 6, 1), color('accentColor', 'Label color')],
    docs: [
      ['playChip(sound, { volume })', '(name | recipe, options) => void', 'export', 'Plays a preset (select, confirm, cancel, blip, coin, jump, powerUp, levelUp, hit, error, explosion) or a custom recipe.'],
      ['CHIPS', 'Record<string, Recipe>', 'export', 'The presets; spread and tweak to make your own.'],
      ['ChiptuneProvider', '{ defaultMuted?, defaultVolume?, persist? }', 'export', 'Shares mute and volume; persists them per browser.'],
      ['useChiptune()', '() => { play, muted, setMuted, toggleMuted, volume, setVolume }', 'export', 'Works with or without a provider.'],
      ['MuteToggle', '{ size?, color?, background? }', 'export', 'Accessible pixel speaker toggle (aria-pressed).'],
      ['default export', '{ sounds?, volume?, columns? }', 'ChiptuneKit', 'A soundboard of the presets.']
    ],
    usage: `import { ChiptuneProvider, MuteToggle, useChiptune } from "./ChiptuneKit";

function BuyButton() {
  const { play } = useChiptune();
  return <button onClick={() => { play("coin"); buy(); }}>Buy</button>;
}

<ChiptuneProvider>
  <MuteToggle />
  <BuyButton />
</ChiptuneProvider>`,
    render: props => <ChiptuneDemo {...props} />
  }
};

// Props that only drive the demo (like the sound toggle) are left out of the usage snippet.
export const PIXEL_DEMOS = Object.fromEntries(
  Object.entries(DEMO_ENTRIES).map(([slug, demo]) => [slug, { demoOnly: slug === 'pixel-button' ? ['sound', 'label'] : ['sound'], ...demo }])
);
