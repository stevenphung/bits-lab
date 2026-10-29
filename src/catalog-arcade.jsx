import { useRef, useState } from 'react';
import Sprite from './pixel/Sprite';
import PixelButton from './bits/PixelButton';
import BootSequence from './bits/BootSequence';
import VoxelTiles from './bits/VoxelTiles';
import GameOver from './bits/GameOver';
import ScoreTicker from './bits/ScoreTicker';
import PixelExplode from './bits/PixelExplode';
import Minimap from './bits/Minimap';
import QuestLog from './bits/QuestLog';
import PixelAvatar from './bits/PixelAvatar';
import bootSequenceSource from './bits/BootSequence.jsx?raw';
import voxelTilesSource from './bits/VoxelTiles.jsx?raw';
import gameOverSource from './bits/GameOver.jsx?raw';
import scoreTickerSource from './bits/ScoreTicker.jsx?raw';
import pixelExplodeSource from './bits/PixelExplode.jsx?raw';
import minimapSource from './bits/Minimap.jsx?raw';
import questLogSource from './bits/QuestLog.jsx?raw';
import pixelAvatarSource from './bits/PixelAvatar.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });
const text = (name, label) => ({ name, type: 'text', label });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", monospace';
const stack = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 20, justifyItems: 'center', width: '100%', padding: '28px 0' };
const row = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 };
const hint = { margin: 0, color: 'var(--demo-muted, #94b0c2)', font: `14px/1.4 ${PIXEL_FONT}`, textAlign: 'center' };

// ---------- BootSequence ----------

function BootDemo(props) {
  const [run, setRun] = useState(0);
  return (
    <div style={{ width: '100%', height: 380 }}>
      <BootSequence {...props} replayKey={run} minHeight={380}>
        <div style={{ display: 'grid', placeItems: 'center', alignContent: 'center', gap: 22, height: '100%', background: 'var(--demo-bg, #1a1c2c)', padding: 16, textAlign: 'center' }}>
          <Sprite name="gem" size={56} />
          <span style={{ font: `clamp(12px, 3vw, 18px) ${TITLE_FONT}`, color: 'var(--demo-accent, #73eff7)' }}>READY.</span>
          <PixelButton size="sm" variant="secondary" onPress={() => setRun(n => n + 1)}>
            Reboot
          </PixelButton>
        </div>
      </BootSequence>
    </div>
  );
}

// ---------- VoxelTiles ----------

function VoxelDemo(props) {
  const [picked, setPicked] = useState(null);
  return (
    <div style={{ ...stack, padding: '28px 12px' }}>
      <VoxelTiles {...props} onTileSelect={setPicked} />
      <p style={hint} aria-hidden="true">
        {picked ? `${picked.biome} · height ${picked.h} · (${picked.x + 1}, ${picked.y + 1})` : 'Hover to lift a tile, click to inspect. Tab in and use the arrow keys.'}
      </p>
    </div>
  );
}

// ---------- GameOver ----------

const PRESETS = {
  'game over': {
    title: 'GAME OVER',
    stats: [
      { label: 'Coins', value: 1240 },
      { label: 'Monsters', value: 3800 },
      { label: 'Time bonus', value: 2500 }
    ],
    finalMessage: 'Thanks for playing!'
  },
  404: {
    title: '404',
    subtitle: 'LEVEL NOT FOUND',
    stats: [
      { label: 'Pages searched', value: 128 },
      { label: 'Secret rooms', value: 3 }
    ],
    continueLabel: 'Go home',
    quitLabel: 'Report map bug',
    finalMessage: 'The page wandered off. Try the home page.'
  }
};

function GameOverDemo({ preset, ...props }) {
  const [run, setRun] = useState(0);
  const [note, setNote] = useState('');
  return (
    <div style={{ width: '100%', height: '100%', minHeight: 440, display: 'grid' }}>
      <GameOver
        {...PRESETS[preset]}
        {...props}
        replayKey={`${run}-${preset}`}
        minHeight={440}
        onContinue={() => {
          setNote('');
          setRun(n => n + 1);
        }}
        onQuit={() => setNote('Quit pressed. Your app would leave the game here.')}
        subtitle={note || PRESETS[preset].subtitle}
      />
    </div>
  );
}

// ---------- ScoreTicker ----------

function ScoreDemo(props) {
  const [score, setScore] = useState(9640);
  const [combo, setCombo] = useState(1);
  const lastHit = useRef(0);
  const add = (points, chain = false) => {
    const now = Date.now();
    const next = chain && now - lastHit.current < 1500 ? Math.min(combo + 1, 9) : 1;
    lastHit.current = now;
    setCombo(next);
    setScore(s => s + points * next);
  };
  return (
    <div style={stack}>
      <ScoreTicker {...props} value={score} combo={combo} />
      <div style={row}>
        <PixelButton size="sm" variant="warning" onPress={() => add(10)}>
          <Sprite name="coin" size={14} /> +10
        </PixelButton>
        <PixelButton size="sm" variant="primary" onPress={() => add(250, true)}>
          <Sprite name="sword" size={14} /> Hit (combo)
        </PixelButton>
        <PixelButton size="sm" variant="info" onPress={() => add(5000)}>
          <Sprite name="star" size={14} /> Boss +5000
        </PixelButton>
        <PixelButton
          size="sm"
          variant="secondary"
          onPress={() => {
            setCombo(1);
            setScore(0);
          }}
        >
          Reset
        </PixelButton>
      </div>
      <p style={hint}>Press Hit quickly to chain a combo. Passing 12,000 sets a new high score.</p>
    </div>
  );
}

// ---------- PixelExplode ----------

function ExplodeDemo(props) {
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div style={stack}>
      <PixelExplode {...props} exploded={gone} onExploded={() => setBusy(false)} onReassembled={() => setBusy(false)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: 'min(320px, calc(100vw - 64px))', padding: '14px 16px', background: 'var(--demo-line, #333c57)', boxShadow: '0 0 0 3px #566c86', color: 'var(--demo-ink, #f4f4f4)', font: `16px ${PIXEL_FONT}` }}>
          <Sprite name="potion" size={40} />
          <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
            <strong>Potion of Leaping</strong>
            <span style={{ color: 'var(--demo-muted, #94b0c2)', fontSize: 14 }}>Jump twice as high for 3 minutes.</span>
          </div>
        </div>
      </PixelExplode>
      <div style={row}>
        <PixelButton
          size="sm"
          variant={gone ? 'success' : 'primary'}
          disabled={busy}
          onPress={() => {
            setBusy(true);
            setGone(g => !g);
          }}
        >
          {gone ? 'Undo' : 'Discard item'}
        </PixelButton>
      </div>
      <p style={hint} aria-live="polite">
        {gone ? 'Item discarded.' : 'Works on any element: text, images, whole cards.'}
      </p>
    </div>
  );
}

// ---------- Minimap ----------

const CHAPTERS = [
  { title: 'Chapter 1: The cave', sprite: 'pickaxe', text: 'Pip woke up at the bottom of a cave with nothing but a wooden pickaxe and a half-eaten loaf of bread. Somewhere above, birds were singing.' },
  { title: 'Chapter 2: Gems', sprite: 'gem', text: 'The walls glittered. Every swing of the pickaxe chipped loose another blue gem, and every gem made the bag a little heavier.', code: 'inventory.add({ item: "gem", qty: 3 });\ninventory.weight(); // 12' },
  { title: 'Chapter 3: The chest', sprite: 'chest', text: 'Behind a waterfall sat an old chest. Inside: a map with one corner torn off and a note that said only "north, then up".' },
  { title: 'Chapter 4: The climb', sprite: 'star', text: 'North led to a cliff. Up led to the stars. Pip climbed all night and reached the top just as the sun rose over the pixel hills.', code: 'player.climb({ height: 128 });\nplayer.status = "victorious";' },
  { title: 'Chapter 5: Home', sprite: 'heart', text: 'With a bag full of gems and a head full of stories, Pip built a little house at the edge of the cliff and never forgot the way back to the cave.' }
];

function MinimapDemo(props) {
  const ref = useRef(null);
  return (
    <div style={{ display: 'flex', gap: 14, width: '100%', maxWidth: 640, height: 380, margin: '24px auto', padding: '0 12px', boxSizing: 'border-box' }}>
      <article id="minimap-demo-story" ref={ref} tabIndex={0} aria-label="Pip's story" style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '4px 16px 16px', background: 'var(--demo-bg, #1a1c2c)', color: 'var(--demo-ink, #f4f4f4)', font: `16px/1.6 ${PIXEL_FONT}`, boxShadow: '0 0 0 2px var(--demo-line, #333c57)' }}>
        {CHAPTERS.map(chapter => (
          <section key={chapter.title}>
            <h3 style={{ margin: '22px 0 10px', font: `12px/1.6 ${TITLE_FONT}`, color: 'var(--demo-gold, #ffcd75)' }}>{chapter.title}</h3>
            <Sprite name={chapter.sprite} size={64} />
            {[0, 1].map(i => (
              <p key={i} style={{ color: 'var(--demo-muted, #94b0c2)' }}>
                {chapter.text}
              </p>
            ))}
            {chapter.code && <pre style={{ margin: 0, padding: 12, overflowX: 'auto', background: 'var(--demo-field, #0b0b14)', color: '#a7f070', font: '13px/1.5 ui-monospace, monospace' }}>{chapter.code}</pre>}
          </section>
        ))}
      </article>
      <Minimap {...props} target={ref} height={380} />
    </div>
  );
}

// ---------- QuestLog ----------

const QUESTS = [
  { id: 'create', title: 'Create your character', description: 'Pick a name and a look.', xp: 50 },
  { id: 'equip', title: 'Equip a pickaxe', description: 'Open your inventory and drag the pickaxe to your hand.', xp: 30, requires: ['create'] },
  { id: 'mine', title: 'Mine your first gem', description: 'Gems hide in cave walls. Listen for the sparkle.', xp: 80, requires: ['equip'] },
  { id: 'shelter', title: 'Build a shelter', description: 'Night is coming. Four walls and a roof will do.', xp: 100, requires: ['create'] },
  { id: 'friend', title: 'Invite a friend', description: 'Adventures are better with two.', xp: 40 }
];

function QuestDemo(props) {
  return (
    <div style={{ ...stack, padding: '28px 16px' }}>
      <QuestLog {...props} quests={QUESTS} defaultCompleted={['create']} />
    </div>
  );
}

// ---------- PixelAvatar ----------

const NAMES = ['pip', 'ada', 'grace', 'linus', 'margaret', 'tim', 'hedy', 'alan', 'katherine', 'dennis', 'barbara', 'ken'];

function AvatarDemo({ seed, ...props }) {
  return (
    <div style={{ ...stack, gap: 26, padding: '28px 16px' }}>
      <div style={{ display: 'grid', justifyItems: 'center', gap: 10 }}>
        <PixelAvatar {...props} seed={seed} size={props.size * 2} />
        <span style={{ ...hint, color: 'var(--demo-ink, #f4f4f4)' }}>{seed || '(empty seed)'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${props.size + 8}px, 1fr))`, gap: 12, width: '100%', maxWidth: 560, justifyItems: 'center' }}>
        {NAMES.map(name => (
          <PixelAvatar key={name} {...props} seed={name} title={name} />
        ))}
      </div>
      <p style={hint}>Same seed, same avatar, every time. Type any name in the seed field.</p>
    </div>
  );
}

// ---------- Entries ----------

export const ARCADE_DEMOS = {
  'boot-sequence': {
    source: bootSequenceSource,
    defaults: { speed: 70, lineDelay: 160, beep: false, skippable: true, scanlines: true, textColor: '#94b0c2', okColor: '#a7f070' },
    controls: [slider('speed', 'Typing speed (chars/s)', 10, 200, 5), slider('lineDelay', 'Pause between lines (ms)', 0, 600, 20), toggle('beep', 'Beeps'), toggle('skippable', 'Skippable'), toggle('scanlines', 'Scanlines'), color('textColor', 'Text'), color('okColor', 'OK tag')],
    docs: [
      ['lines', '(string | { text, status?, count?, unit?, delay? })[]', 'POST checks', 'Lines to type. status is "ok", "warn" or "fail"; count ticks a number up after the text (e.g. memory).'],
      ['header', 'string[]', 'BIOS banner', 'Lines shown immediately at the top.'],
      ['speed / lineDelay / countDuration / holdAfter', 'number', '70 / 160 / 900 / 700', 'Characters per second, and pauses in ms.'],
      ['children', 'ReactNode', '-', 'Revealed with a CRT power-on after the boot finishes.'],
      ['skippable / hint', 'boolean / string', 'true', 'Click or any key (outside text fields) skips; a hidden Skip button is reachable by Tab.'],
      ['beep', 'boolean', 'false', 'A short square-wave beep per tag and a POST beep at the end.'],
      ['replayKey / onComplete', 'any / () => void', '-', 'Change replayKey to boot again; onComplete fires when it finishes.'],
      ['Accessibility', '-', '-', 'Finished lines go to a polite log, never each keystroke. Reduced motion shows the final screen.']
    ],
    usage: `import BootSequence from "./BootSequence";

<BootSequence lines={["Memory test... OK", { text: "Loading", status: "ok" }]}>
  <App />
</BootSequence>`,
    fullBleed: true,
    render: props => <BootDemo {...props} />
  },

  'voxel-tiles': {
    source: voxelTilesSource,
    defaults: { size: 12, seed: 3, tileSize: 32, heightUnit: 8, lift: 6, stagger: 30 },
    controls: [slider('size', 'Map size', 4, 20, 1), slider('seed', 'Seed', 1, 99, 1), slider('tileSize', 'Tile size', 16, 56, 2), slider('heightUnit', 'Block height', 2, 16, 1), slider('lift', 'Hover lift', 0, 16, 1), slider('stagger', 'Rise stagger (ms)', 0, 80, 5)],
    docs: [
      ['map', 'number[][]', 'generated', 'Heights per cell (rows of columns). 0 is water.'],
      ['size / seed', 'number', '12 / 3', 'Used to generate an island when no map is given (generateHeightmap is exported).'],
      ['tileSize / heightUnit', 'number', '32 / 8', 'Tile width and the height of one block, in SVG units.'],
      ['biomes', '{ max, name, color }[]', 'water → snow', 'Height bands and their colors; DEFAULT_BIOMES is exported.'],
      ['lift / stagger', 'number', '6 / 30', 'Hover lift, and delay per diagonal for the rise-in.'],
      ['onTileSelect', '({ x, y, h, biome }) => void', '-', 'Click, or Enter on the keyboard cursor.'],
      ['Keyboard', '-', '-', 'One tab stop; arrows walk a cursor, Enter selects, Esc clears. The tile is announced.']
    ],
    usage: `import VoxelTiles from "./VoxelTiles";

<VoxelTiles
  map={[[0, 1, 2], [1, 3, 4], [2, 4, 6]]}
  onTileSelect={tile => console.log(tile.biome)}
/>`,
    render: props => <VoxelDemo {...props} />
  },

  'game-over': {
    source: gameOverSource,
    defaults: { preset: 'game over', countdown: 9, tallyDuration: 700, titleSize: 40, titleColor: '#b13e53', buttonColor: '#38b764' },
    controls: [select('preset', 'Preset', ['game over', '404']), slider('countdown', 'Countdown (s)', 0, 15, 1), slider('tallyDuration', 'Tally per row (ms)', 100, 2000, 50), slider('titleSize', 'Title size', 20, 64, 2), color('titleColor', 'Title'), color('buttonColor', 'Button')],
    docs: [
      ['title / subtitle', 'string', '"GAME OVER"', 'The title drops in letter by letter.'],
      ['stats / total / totalLabel', '{ label, value }[] / number / string', '[] / sum / "Total"', 'Rows tally up one at a time, then the total.'],
      ['countdown', 'number', '9', 'CONTINUE? seconds; 0 turns the countdown off.'],
      ['onContinue / onQuit / onTimeout', '() => void', '-', 'Buttons, and the countdown reaching zero (finalMessage shows).'],
      ['continueLabel / quitLabel / finalMessage', 'string', 'Continue / Quit / Thanks…', 'Rename for a 404 or 500 page.'],
      ['fixed / autoFocus', 'boolean', 'false / fixed', 'Fixed full-screen dialog (Esc quits) or fill the parent.'],
      ['replayKey', 'any', '-', 'Change to play it again. Click while tallying to skip ahead.']
    ],
    usage: `import GameOver from "./GameOver";

<GameOver
  stats={[{ label: "Coins", value: 1240 }]}
  onContinue={restart}
  fixed
/>`,
    demoOnly: ['preset'],
    fullBleed: true,
    render: props => <GameOverDemo {...props} />
  },

  'score-ticker': {
    source: scoreTickerSource,
    defaults: { digits: 7, size: 40, highScore: 12000, duration: 600, showPopups: true, accentColor: '#ffcd75' },
    controls: [slider('digits', 'Digits', 3, 10, 1), slider('size', 'Size', 16, 64, 2), slider('highScore', 'High score', 0, 50000, 1000), slider('duration', 'Roll (ms)', 0, 1500, 50), toggle('showPopups', 'Popups'), color('accentColor', 'Popup')],
    docs: [
      ['value', 'number', '0', 'The score. Drums roll forward to it; decreases roll back.'],
      ['digits', 'number', '7', 'Zero-padded width; leading zeros are dimmed. Caps at all nines.'],
      ['combo', 'number', '1', 'Above 1, gains pop up with "×N COMBO".'],
      ['highScore', 'number', '-', 'Shows HI; beating it flashes NEW HIGH SCORE.'],
      ['showPopups / shakeAt', 'boolean / number', 'true / 1000', 'Gain popups, and the smallest gain that shakes the panel.'],
      ['size / duration', 'number', '40 / 600', 'Digit size in px and roll time in ms.'],
      ['Accessibility', '-', '-', 'The settled score is announced politely, not every tick.']
    ],
    usage: `import ScoreTicker from "./ScoreTicker";

<ScoreTicker value={score} combo={combo} highScore={12000} />`,
    render: props => <ScoreDemo {...props} />
  },

  'pixel-explode': {
    source: pixelExplodeSource,
    defaults: { pieceSize: 8, duration: 900, spread: 1, gravity: 1, direction: 'right', stepped: true },
    controls: [slider('pieceSize', 'Piece size', 3, 24, 1), slider('duration', 'Duration (ms)', 300, 2500, 50), slider('spread', 'Spread', 0.2, 3, 0.1), slider('gravity', 'Gravity', -1, 3, 0.1), select('direction', 'Sweep', ['right', 'left', 'up', 'down', 'center']), toggle('stepped', 'Stepped (8-bit) motion')],
    docs: [
      ['exploded', 'boolean', '-', 'Controlled: true explodes, false reassembles. Or use the ref API.'],
      ['ref', '{ explode(), reassemble() }', '-', 'Imperative control.'],
      ['pieceSize / maxPieces', 'number', '8 / 500', 'Tile size in px; large elements use bigger tiles to stay under maxPieces.'],
      ['duration / spread / gravity', 'number', '900 / 1 / 1', 'Flight time, distance and fall.'],
      ['direction', '"right" | "left" | "up" | "down" | "center"', '"right"', 'The direction the disintegration sweeps.'],
      ['stepped', 'boolean', 'true', 'Choppy 8-bit motion instead of smooth.'],
      ['onExploded / onReassembled', '() => void', '-', 'After each finishes. While exploded, content is hidden and inert.']
    ],
    usage: `import PixelExplode from "./PixelExplode";

<PixelExplode exploded={deleted}>
  <Card />
</PixelExplode>`,
    render: props => <ExplodeDemo {...props} />
  },

  minimap: {
    source: minimapSource,
    defaults: { width: 80, pixelSize: 2, viewportColor: '#73eff7', backgroundColor: '#0b0b14' },
    controls: [slider('width', 'Width', 48, 140, 4), slider('pixelSize', 'Pixel size', 1, 4, 1), color('viewportColor', 'Viewport box'), color('backgroundColor', 'Background')],
    docs: [
      ['target', 'RefObject<HTMLElement>', 'the page', 'Scroll container to map. Omit to map the whole window.'],
      ['selector', 'string', 'headings, text, media…', 'Which elements become blocks.'],
      ['width / height / pixelSize', 'number', '96 / 320 / 2', 'Map size; long content scrolls inside the map.'],
      ['colors', '{ heading, text, media, code, control }', 'Sweetie 16', 'Block colors by kind.'],
      ['viewportColor / backgroundColor / edgeColor', 'string', 'cyan / ink / slate', 'Box and frame colors.'],
      ['Interaction', '-', '-', 'Drag the box, click to jump. A scrollbar to assistive tech: arrows, Page Up/Down, Home, End.']
    ],
    usage: `import Minimap from "./Minimap";

const ref = useRef(null);
<article ref={ref} style={{ overflow: "auto" }}>…</article>
<Minimap target={ref} />`,
    render: props => <MinimapDemo {...props} />
  },

  'quest-log': {
    source: questLogSource,
    defaults: { allowUndo: true, accentColor: '#ffcd75', doneColor: '#38b764', title: 'Quest log' },
    controls: [text('title', 'Title'), toggle('allowUndo', 'Allow undo'), color('accentColor', 'Accent'), color('doneColor', 'Done')],
    docs: [
      ['quests', '{ id, title, description?, xp?, requires? }[]', '[]', 'requires lists quest ids that must be done first (locked until then).'],
      ['completed / defaultCompleted / onCompletedChange', 'string[]', '-', 'Controlled or uncontrolled list of done quest ids.'],
      ['onQuestComplete', '(quest) => void', '-', 'Hook up a sound (ChiptuneKit) or analytics.'],
      ['allowUndo', 'boolean', 'true', 'Unticking a quest also unticks the quests that depend on it.'],
      ['title / finishedMessage', 'string', '"Quest log" / "All quests complete!"', 'Heading and the fanfare banner.'],
      ['Accessibility', '-', '-', 'Native checkboxes; locked quests describe what they need; completions are announced.']
    ],
    usage: `import QuestLog from "./QuestLog";

<QuestLog
  quests={[
    { id: "profile", title: "Create a profile", xp: 50 },
    { id: "invite", title: "Invite a teammate", xp: 40, requires: ["profile"] }
  ]}
/>`,
    render: props => <QuestDemo {...props} />
  },

  'pixel-avatar': {
    source: pixelAvatarSource,
    defaults: { seed: 'pip', size: 56, variant: 'creature', shape: 'rounded', blink: true },
    controls: [text('seed', 'Seed'), slider('size', 'Size', 24, 96, 4), select('variant', 'Variant', ['creature', 'identicon']), select('shape', 'Shape', ['rounded', 'square', 'circle']), toggle('blink', 'Blink')],
    docs: [
      ['seed', 'string', '"bits"', 'Any string; the same seed always draws the same avatar.'],
      ['variant', '"creature" | "identicon"', '"creature"', 'A little outlined creature with eyes, or classic mirrored blocks.'],
      ['size / shape', 'number / "rounded" | "square" | "circle"', '64 / "rounded"', 'Rendered size and frame.'],
      ['background', 'boolean | string', 'true', 'A seeded backdrop, a color of your own, or none.'],
      ['blink', 'boolean', 'false', 'Idle blink, offset per seed so a grid never blinks in sync.'],
      ['title / decorative', 'string / boolean', '"Avatar for {seed}"', 'Accessible name, or hide it when a name sits next to it.'],
      ['avatarGrid(seed, variant)', 'function', 'export', 'The raw 10×10 color grid, for canvases or favicons.']
    ],
    usage: `import PixelAvatar from "./PixelAvatar";

<PixelAvatar seed={user.name} size={48} />`,
    render: props => <AvatarDemo {...props} />
  }
};
