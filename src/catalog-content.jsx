import { useEffect, useRef, useState } from 'react';
import Sprite from './pixel/Sprite';
import { pixelVideoUrl } from './pixel/media';
import PixelButton from './bits/PixelButton';
import ExpandCardGrid, { ExpandCard } from './bits/ExpandCard';
import VideoHero from './bits/VideoHero';
import TextOnPath from './bits/TextOnPath';
import MorphWords from './bits/MorphWords';
import SketchHighlight from './bits/SketchHighlight';
import StreamingText from './bits/StreamingText';
import GravityBox from './bits/GravityBox';
import VoiceOrb from './bits/VoiceOrb';
import ThinkingShimmer from './bits/ThinkingShimmer';
import ChatBubbles from './bits/ChatBubbles';
import expandCardSource from './bits/ExpandCard.jsx?raw';
import videoHeroSource from './bits/VideoHero.jsx?raw';
import textOnPathSource from './bits/TextOnPath.jsx?raw';
import morphWordsSource from './bits/MorphWords.jsx?raw';
import sketchHighlightSource from './bits/SketchHighlight.jsx?raw';
import streamingTextSource from './bits/StreamingText.jsx?raw';
import gravityBoxSource from './bits/GravityBox.jsx?raw';
import voiceOrbSource from './bits/VoiceOrb.jsx?raw';
import thinkingShimmerSource from './bits/ThinkingShimmer.jsx?raw';
import chatBubblesSource from './bits/ChatBubbles.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });
const text = (name, label) => ({ name, type: 'text', label });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", monospace';
const pixelated = { imageRendering: 'pixelated' };
const biome = id => `/pixel/biome-${id}.png`;
const stack = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18, justifyItems: 'center', width: '100%', padding: '32px 0' };
const row = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 };
const hint = { margin: 0, color: 'var(--demo-muted, #94b0c2)', font: `14px/1.4 ${PIXEL_FONT}`, textAlign: 'center' };

// ---------- ExpandCard ----------

const ARTICLES = [
  { scene: 'cave', eyebrow: 'Guide', title: 'Mining without dying', summary: 'Torches, ladders and the one rule about digging straight down.', body: ['Bring at least two stacks of torches and place one every eight blocks; monsters only spawn in the dark, so a lit tunnel is a safe tunnel.', 'Never dig the block directly under your feet. Staircase down instead, so a hidden cave or a lava lake below can only ever cost you a few blocks of pride.'] },
  { scene: 'cherry', eyebrow: 'Biome', title: 'Blossom Hills', summary: 'The calmest place to build your first home.', body: ['Pink canopies, gentle slopes and almost no hostile mobs during the day make Blossom Hills the friendliest start in the game.', 'Bees here pollinate faster, so a few hives near your farm pay off within a single in-game week.'] },
  { scene: 'underworld', eyebrow: 'Danger', title: 'Surviving the Underworld', summary: 'Fire resistance, gold armor and a way home.', body: ['Wear at least one piece of gold armor so the local pig-folk stay neutral, and carry a stack of cobblestone to bridge lava.', 'Always note the coordinates of your portal before wandering off; the Underworld fog makes every corridor look the same.'] },
  { scene: 'snowy', eyebrow: 'Loot', title: 'Gems above the snowline', summary: 'Why the coldest peaks hide the rarest ore.', body: ['Emerald veins only generate in mountain biomes above height 100. Bring a fast pickaxe and something warm.', 'Powder snow looks solid but isn’t; leather boots let you walk on it, everything else falls straight through.'] }
];

function ExpandDemo(props) {
  return (
    <div style={{ width: '100%', maxWidth: 820, margin: '0 auto', padding: '24px 0' }}>
      <ExpandCardGrid {...props} fontFamily={PIXEL_FONT}>
        {ARTICLES.map(article => (
          <ExpandCard
            key={article.title}
            id={article.title}
            eyebrow={article.eyebrow}
            title={article.title}
            summary={article.summary}
            media={<img src={biome(article.scene)} alt="" style={pixelated} />}
          >
            {article.body.map(p => (
              <p key={p.slice(0, 20)} style={{ margin: '0 0 12px', color: '#c8d3dc' }}>
                {p}
              </p>
            ))}
          </ExpandCard>
        ))}
      </ExpandCardGrid>
    </div>
  );
}

// ---------- VideoHero ----------

function VideoDemo(props) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let live = true;
    pixelVideoUrl().then(url => live && setSrc(url));
    return () => {
      live = false;
    };
  }, []);
  return (
    <div style={{ ...stack, padding: '32px 16px' }}>
      <VideoHero {...props} src={src ?? undefined} poster={biome('plains')} title="Block Quest: launch trailer" meta="0:04 · A short pixel-world flyover" fontFamily={PIXEL_FONT}>
        <img src={biome('plains')} alt="" style={pixelated} />
      </VideoHero>
      <p style={hint}>Click the thumbnail; the video grows out of it.</p>
    </div>
  );
}

// ---------- SketchHighlight ----------

function SketchDemo(props) {
  const [run, setRun] = useState(0);
  const p = { margin: 0, maxWidth: 560, color: 'var(--demo-ink, #f4f4f4)', font: `20px/1.9 ${PIXEL_FONT}`, textAlign: 'center' };
  return (
    <div style={stack}>
      <p key={run} style={p}>
        Every world starts with <SketchHighlight {...props} type="underline">one block</SketchHighlight>. Mine it, <SketchHighlight {...props} type="circle" delay={500}>craft</SketchHighlight> something, and{' '}
        <SketchHighlight {...props} type="highlight" color="#ffcd75" delay={1000}>
          build a home before night falls
        </SketchHighlight>
        . Avoid <SketchHighlight {...props} type="strike" delay={1500}>digging straight down</SketchHighlight>, keep your <SketchHighlight {...props} type="box" color="#73eff7" delay={2000}>torches</SketchHighlight> close and{' '}
        <SketchHighlight {...props} type="bracket" color="#a7f070" delay={2500}>
          never trust a quiet cave
        </SketchHighlight>
        .
      </p>
      <PixelButton size="sm" variant="secondary" onPress={() => setRun(r => r + 1)}>
        Draw again
      </PixelButton>
    </div>
  );
}

// ---------- StreamingText ----------

const ANSWER = `## How to craft a diamond pickaxe

You'll need **3 diamonds** and **2 sticks**, plus a *crafting table*.

1. Place the table and open its 3×3 grid.
2. Put the diamonds across the **top row**.
3. Put the sticks down the **middle column**.

> Tip: enchant it with \`Efficiency\` before you head underground.

\`\`\`
[D][D][D]
[ ][S][ ]
[ ][S][ ]
\`\`\`

Diamonds spawn below height 16, so bring torches and read the [mining guide](#mining).`;

function StreamDemo(props) {
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);
  return (
    <div style={{ ...stack, justifyItems: 'stretch', maxWidth: 640, margin: '0 auto', padding: '28px 16px' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ flex: '0 0 auto', display: 'grid', placeItems: 'center', width: 34, height: 34, background: 'var(--demo-panel, #29366f)' }}>
          <Sprite name="book" size={22} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <StreamingText key={run} {...props} text={ANSWER} fontFamily={PIXEL_FONT} onDone={() => setDone(true)} />
        </div>
      </div>
      <div style={row}>
        <PixelButton
          size="sm"
          variant="secondary"
          onPress={() => {
            setDone(false);
            setRun(r => r + 1);
          }}
        >
          {done ? 'Regenerate' : 'Restart'}
        </PixelButton>
      </div>
    </div>
  );
}

// ---------- GravityBox ----------

const BLOCKS = [
  ['gem', 'Diamonds'],
  ['pickaxe', 'Mining'],
  ['sword', 'Combat'],
  ['potion', 'Brewing'],
  ['heart', 'Health'],
  ['coin', 'Trading'],
  ['book', 'Lore'],
  ['chest', 'Storage'],
  ['star', 'Achievements'],
  ['note', 'Music'],
  ['grass', 'Farming'],
  ['orb', 'Magic']
];

function GravityDemo({ startOn, ...props }) {
  const [run, setRun] = useState(0);
  return (
    <div style={{ ...stack, padding: '20px 0' }}>
      <div style={{ width: '100%', maxWidth: 760 }}>
        <GravityBox key={`${run}-${startOn}`} {...props} startOn={startOn} backgroundColor="var(--demo-bg, #11131c)" radius={4}>
          {BLOCKS.map(([icon, name]) => (
            <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--demo-panel, #29366f)', color: 'var(--demo-ink, #f4f4f4)', font: `16px ${PIXEL_FONT}`, boxShadow: 'inset 0 -4px 0 #1a1c2c', borderRadius: 4 }}>
              <Sprite name={icon} size={20} />
              {name}
            </span>
          ))}
        </GravityBox>
      </div>
      <div style={row}>
        <PixelButton size="sm" variant="warning" onPress={() => setRun(r => r + 1)}>
          Drop again
        </PixelButton>
      </div>
      <p style={hint}>Grab a block and throw it. {startOn === 'click' ? 'Click the box to start.' : ''}</p>
    </div>
  );
}

// ---------- VoiceOrb ----------

function OrbDemo({ source, ...props }) {
  const [state, setState] = useState('listening');
  const [error, setError] = useState('');
  return (
    <div style={stack}>
      <VoiceOrb {...props} state={state} source={source} onMicError={e => setError(`Microphone unavailable (${e.name}); using a simulated voice.`)} />
      <div style={row}>
        {['idle', 'listening', 'thinking', 'speaking'].map(s => (
          <PixelButton key={s} size="sm" variant={state === s ? 'info' : 'secondary'} onPress={() => setState(s)}>
            {s}
          </PixelButton>
        ))}
      </div>
      <p style={hint}>{error || (source === 'mic' ? 'Listening uses your microphone (your browser will ask first).' : 'Voice levels are simulated.')}</p>
    </div>
  );
}

// ---------- ThinkingShimmer ----------

const PLAN = ['Reading your inventory', 'Checking recipes for a diamond pickaxe', 'Comparing materials you already have', 'Writing the answer'];

function ThinkingDemo(props) {
  const [run, setRun] = useState(0);
  const [step, setStep] = useState(0);
  useEffect(() => {
    setStep(0);
    const timers = PLAN.map((_, i) => setTimeout(() => setStep(i + 1), 1400 * (i + 1)));
    return () => timers.forEach(clearTimeout);
  }, [run]);
  const thinking = step < PLAN.length;
  const steps = PLAN.map((label, i) => ({ label, status: i < step ? 'done' : i === step ? 'active' : 'pending', detail: i === 1 && i < step ? '3 diamonds + 2 sticks, crafting table required.' : undefined }));
  return (
    <div style={{ ...stack, justifyItems: 'stretch', maxWidth: 560, margin: '0 auto', padding: '32px 16px' }}>
      <ThinkingShimmer key={run} {...props} thinking={thinking} steps={steps} defaultOpen fontFamily={PIXEL_FONT} />
      {!thinking && <p style={{ ...hint, textAlign: 'left', color: 'var(--demo-ink, #f4f4f4)' }}>You have 2 of 3 diamonds. Mine one more below height 16.</p>}
      <div style={row}>
        <PixelButton size="sm" variant="secondary" onPress={() => setRun(r => r + 1)}>
          Ask again
        </PixelButton>
      </div>
    </div>
  );
}

// ---------- ChatBubbles ----------

const START = [
  { id: 1, from: 'them', author: 'Villager', avatar: <Sprite name="heart" size={18} />, text: 'Hrmm! Welcome, traveler.', time: '9:41' },
  { id: 2, from: 'them', author: 'Villager', avatar: <Sprite name="heart" size={18} />, text: 'Looking to trade? I have emeralds.', time: '9:41', reactions: ['👍'] },
  { id: 3, from: 'me', text: 'What do you want for one?', time: '9:42' }
];
const REPLIES = ['Twenty wheat. Freshly harvested only.', 'Hrmm. You drive a hard bargain.', 'Deal! Pleasure doing business.', 'Watch out for zombies tonight.'];

function ChatDemo(props) {
  const [messages, setMessages] = useState(START);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const reply = useRef(0);
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const send = event => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages(m => [...m, { id: Date.now(), from: 'me', text, time: 'now' }]);
    setDraft('');
    timers.current.push(setTimeout(() => setTyping(true), 500));
    timers.current.push(
      setTimeout(() => {
        setTyping(false);
        setMessages(m => [...m, { id: Date.now() + 1, from: 'them', author: 'Villager', avatar: <Sprite name="heart" size={18} />, text: REPLIES[reply.current++ % REPLIES.length], time: 'now' }]);
      }, 2000)
    );
  };
  return (
    <div style={{ ...stack, justifyItems: 'stretch', maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
      <ChatBubbles {...props} messages={messages} typing={typing} typingName="Villager" fontFamily={PIXEL_FONT} label="Trade chat with a villager" />
      <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          aria-label="Message"
          placeholder="Say something…"
          style={{ flex: 1, minWidth: 0, padding: '10px 12px', border: 0, background: 'var(--demo-panel, #29366f)', color: 'var(--demo-ink, #f4f4f4)', font: `15px ${PIXEL_FONT}`, outline: 'none', boxShadow: 'inset 0 -3px 0 #1a1c2c' }}
        />
        <PixelButton size="sm" variant="info" type="submit">
          Send
        </PixelButton>
      </form>
      <p style={hint}>Hover a bubble to react, or double-click it for a heart.</p>
    </div>
  );
}

// ---------- Entries ----------

const DEMO_ENTRIES = {
  'expand-card': {
    source: expandCardSource,
    defaults: { minWidth: 240, mediaHeight: 140, openMediaHeight: 280, radius: 4, duration: 480 },
    controls: [slider('minWidth', 'Min card width', 180, 360, 10), slider('mediaHeight', 'Media height', 80, 240, 10), slider('openMediaHeight', 'Open media height', 160, 420, 10), slider('radius', 'Radius', 0, 28, 1), slider('duration', 'Motion (ms)', 200, 900, 20)],
    docs: [
      ['ExpandCardGrid', 'component', 'default export', 'Responsive grid; one card open at a time. Every other card glides to its new spot (FLIP).'],
      ['ExpandCard: title / eyebrow / summary / media', 'ReactNode', '-', 'The card face. The title stays as the article heading when open.'],
      ['ExpandCard: children', 'ReactNode', '-', 'The article, revealed in the page flow (not a modal), so it scrolls, links and prints normally.'],
      ['ExpandCard: id', 'string', 'index', 'Stable identity, used to remember positions across the layout change.'],
      ['defaultOpen / onOpenChange', 'string | null / (id) => void', 'null', 'Which card starts open, and a change callback.'],
      ['minWidth / gap / mediaHeight / openMediaHeight', 'number', '240 / 16 / 150 / 300', 'Grid track minimum and media heights, in px.'],
      ['duration / radius / colors / fontFamily', 'number / string', '480 / 16', 'Motion and styling. Esc or the close button folds the card back and returns focus.']
    ],
    usage: `import ExpandCardGrid, { ExpandCard } from "./ExpandCard";

<ExpandCardGrid>
  <ExpandCard title="Blossom Hills" summary="The calmest biome." media={<img src="/cherry.png" alt="" />}>
    <p>Full article…</p>
  </ExpandCard>
</ExpandCardGrid>`,
    render: props => <ExpandDemo {...props} />
  },

  'video-hero': {
    source: videoHeroSource,
    defaults: { buttonSize: 72, radius: 4, magnetic: true, accentColor: '#f4f4f4' },
    controls: [slider('buttonSize', 'Play button', 48, 110, 2), slider('radius', 'Radius', 0, 28, 1), toggle('magnetic', 'Button follows cursor'), color('accentColor', 'Button color')],
    docs: [
      ['src / embedUrl', 'string', '-', 'A video file, or an embed player URL (rendered in an iframe).'],
      ['poster / children', 'string / ReactNode', '-', 'Thumbnail image, or any custom thumbnail content.'],
      ['title / meta / label', 'ReactNode / ReactNode / string', '-', 'Caption on the thumbnail; label overrides the button name ("Play video: title").'],
      ['aspectRatio / width / radius', 'string / number / number', '"16 / 9" / 720 / 16', 'Thumbnail shape; the lightbox keeps the same ratio.'],
      ['buttonSize / magnetic', 'number / boolean', '72 / true', 'Play button size and whether it leans toward the cursor.'],
      ['duration / backdropColor / accentColor', 'number / string', '520', 'Lightbox grow animation and colors.'],
      ['onOpenChange', '(open) => void', '-', 'Called when the lightbox opens or closes. Esc, backdrop and close button all close it.']
    ],
    usage: `import VideoHero from "./VideoHero";

<VideoHero
  src="/trailer.mp4"
  poster="/trailer.jpg"
  title="Launch trailer"
/>`,
    render: props => <VideoDemo {...props} />
  },

  'text-on-path': {
    source: textOnPathSource,
    defaults: { text: 'BLOCK QUEST · BUILD · EXPLORE · SURVIVE · ', path: 'wave', speed: 60, fontSize: 40, showPath: false, direction: 'forward' },
    controls: [text('text', 'Text'), select('path', 'Path', ['wave', 'arc', 'smile', 'circle', 'loop']), slider('speed', 'Speed (0 = still)', 0, 200, 5), slider('fontSize', 'Font size', 18, 80, 1), select('direction', 'Direction', ['forward', 'reverse']), toggle('showPath', 'Show path')],
    docs: [
      ['text', 'string', '"Text along a path · "', 'The text. End it with a separator so the loop reads cleanly.'],
      ['path', '"wave" | "arc" | "smile" | "circle" | "loop" | SVG path data', '"wave"', 'A preset or any SVG d string (pair it with viewBox).'],
      ['viewBox', 'string', 'per preset', 'Coordinate box for a custom path; the SVG scales to its container.'],
      ['speed / direction', 'number / "forward" | "reverse"', '40 / "forward"', 'Scroll speed in units per second (0 for still text). Seamless: it repeats the text as needed.'],
      ['offset', 'number', '0', 'Starting position along the path, in percent.'],
      ['fontSize / fontWeight / letterSpacing / textColor', 'number / string', '42 / 700 / 1', 'Typography in viewBox units.'],
      ['pauseOnHover / showPath', 'boolean', 'true / false', 'Pause while hovered; draw the guide path.']
    ],
    usage: `import TextOnPath from "./TextOnPath";

<TextOnPath
  text="BUILD · EXPLORE · SURVIVE · "
  path="wave"
  speed={60}
/>`,
    render: props => (
      <div style={{ ...stack, padding: '40px 16px' }}>
        <TextOnPath {...props} fontFamily={TITLE_FONT} textColor="#ffcd75" width={props.path === 'circle' ? 360 : 900} />
      </div>
    )
  },

  'morph-words': {
    source: morphWordsSource,
    defaults: { interval: 1800, morphTime: 900, fontSize: 44 },
    controls: [slider('interval', 'Hold (ms)', 600, 4000, 100), slider('morphTime', 'Morph (ms)', 300, 2000, 50), slider('fontSize', 'Font size (demo)', 20, 80, 2)],
    docs: [
      ['words', 'string[]', '4 words', 'Words to cycle through. The box sizes to the widest, so the line never reflows.'],
      ['interval / morphTime', 'number', '1800 / 900', 'How long each word holds, and how long the gooey morph takes (ms).'],
      ['align', '"center" | "start" | "end"', '"center"', 'Alignment of shorter words inside the box.'],
      ['announce', 'boolean', 'false', 'Announce each word to screen readers (off by default to avoid chatter).'],
      ['color', 'string', 'currentColor', 'Text color; font comes from the surrounding text.']
    ],
    usage: `import MorphWords from "./MorphWords";

<h1>
  Build <MorphWords words={["worlds", "quests", "magic"]} /> faster
</h1>`,
    demoOnly: ['fontSize'],
    render: ({ fontSize, ...props }) => (
      <div style={{ ...stack, padding: '60px 16px' }}>
        <h2 style={{ margin: 0, color: 'var(--demo-ink, #f4f4f4)', font: `${fontSize}px/1.3 ${PIXEL_FONT}`, textAlign: 'center' }}>
          Build <MorphWords {...props} words={['worlds', 'quests', 'castles', 'legends']} color="#73eff7" /> one block at a time
        </h2>
      </div>
    )
  },

  'sketch-highlight': {
    source: sketchHighlightSource,
    defaults: { color: '#ef7d57', strokeWidth: 2.5, roughness: 2.5, iterations: 2, duration: 700 },
    controls: [color('color', 'Pen color'), slider('strokeWidth', 'Stroke', 1, 6, 0.5), slider('roughness', 'Roughness', 0, 6, 0.5), slider('iterations', 'Passes', 1, 3, 1), slider('duration', 'Draw (ms)', 200, 2000, 50)],
    docs: [
      ['type', '"underline" | "highlight" | "strike" | "box" | "circle" | "bracket" | "cross"', '"underline"', 'Annotation style. Underline, highlight and strike follow each wrapped line.'],
      ['color / strokeWidth / highlightOpacity', 'string / number / number', 'orange / 2.5 / 0.55', 'Pen color and weight; highlight uses a translucent marker.'],
      ['roughness / iterations / padding', 'number', '2.5 / 2 / 4', 'How shaky the pen is, how many passes it makes, and the gap around the text.'],
      ['duration / delay', 'number', '700 / 0', 'Draw time and delay in ms; chain delays to annotate in sequence.'],
      ['trigger / show', '"view" | "mount" / boolean', '"view" / true', 'Draw when scrolled into view or at once; show=false hides it.'],
      ['children', 'ReactNode', '-', 'The inline text being annotated (untouched; the strokes are decorative).']
    ],
    usage: `import SketchHighlight from "./SketchHighlight";

<p>
  Keep your <SketchHighlight type="circle">torches</SketchHighlight> close.
</p>`,
    render: props => <SketchDemo {...props} />
  },

  'streaming-text': {
    source: streamingTextSource,
    defaults: { speed: 90, tail: 6, fadeDuration: 420, markdown: true, showCursor: true },
    controls: [slider('speed', 'Speed (chars/s)', 20, 400, 10), slider('tail', 'Fading tail (chunks)', 1, 16, 1), slider('fadeDuration', 'Fade (ms)', 100, 1200, 20), toggle('markdown', 'Markdown'), toggle('showCursor', 'Cursor')],
    docs: [
      ['text', 'string', '""', 'Full text to stream word by word at `speed`.'],
      ['stream', 'AsyncIterable<string>', '-', 'A real token stream (e.g. from your model API); chunks appear as they arrive.'],
      ['speed / tail / fadeDuration', 'number', '60 / 6 / 420', 'Characters per second, how many recent chunks are still fading, and the fade length.'],
      ['markdown', 'boolean', 'true', 'Headings, lists, quotes, code blocks, bold, italic, code and links. Unclosed markup renders optimistically.'],
      ['showCursor / onDone', 'boolean / () => void', 'true / -', 'Blinking cursor while streaming; callback when complete.'],
      ['colors / fontFamily / monoFontFamily / fontSize', 'string / number', 'dark', 'Styling. The region is aria-busy while streaming and announces completion.']
    ],
    usage: `import StreamingText from "./StreamingText";

<StreamingText
  stream={tokenStream}
  onDone={() => setDone(true)}
/>`,
    render: props => <StreamDemo {...props} />
  },

  'gravity-box': {
    source: gravityBoxSource,
    defaults: { startOn: 'view', gravity: 1, restitution: 0.35, friction: 0.2, height: 420, spin: true },
    controls: [select('startOn', 'Start on', ['view', 'mount', 'click']), slider('gravity', 'Gravity', 0, 2.5, 0.1), slider('restitution', 'Bounce', 0, 0.95, 0.05), slider('friction', 'Friction', 0, 1, 0.05), slider('height', 'Height', 240, 600, 10), toggle('spin', 'Random spin')],
    docs: [
      ['children', 'ReactNode[]', '-', 'Each child becomes a rigid body, starting where the layout placed it.'],
      ['startOn', '"view" | "mount" | "click"', '"view"', 'When things fall: on scroll into view, immediately, or when the box is clicked.'],
      ['gravity / restitution / friction / spin', 'number / number / number / boolean', '1 / 0.35 / 0.2 / true', 'Physics tuning.'],
      ['draggable', 'boolean', 'true', 'Grab and throw with mouse, pen or touch (springy constraint; links and buttons still click).'],
      ['sleep / onSettle', 'boolean / () => void', 'true / -', 'Stop simulating once everything rests (and resume on touch); callback the first time it settles.'],
      ['height / gap / padding / radius / backgroundColor', 'number / string', '420', 'Box styling and the starting layout.'],
      ['force', 'boolean', 'false', 'Run physics even under reduced motion (off by default).'],
      ['Dependency', 'matter-js', '-', 'The only Bits Lab original with a dependency; install it alongside.']
    ],
    usage: `import GravityBox from "./GravityBox";

<GravityBox
  startOn="view"
>
  <span>Diamonds</span>
  <span>Mining</span>
</GravityBox>`,
    render: props => <GravityDemo {...props} />
  },

  'voice-orb': {
    source: voiceOrbSource,
    defaults: { size: 240, sensitivity: 1, source: 'simulated', glowColor: 'rgba(115,239,247,0.45)' },
    controls: [slider('size', 'Size', 120, 320, 4), slider('sensitivity', 'Sensitivity', 0.3, 3, 0.1), select('source', 'Voice source', ['simulated', 'mic']), color('glowColor', 'Glow')],
    docs: [
      ['state', '"idle" | "listening" | "thinking" | "speaking"', '"idle"', 'What the assistant is doing; changes are announced.'],
      ['source', '"simulated" | "mic"', '"simulated"', 'With "mic", the microphone opens only while listening and is released right after.'],
      ['level', 'number', '-', 'Drive the orb yourself (0–1), e.g. from your TTS audio. Overrides the source.'],
      ['size / sensitivity', 'number', '220 / 1', 'Diameter in px and level gain.'],
      ['colors / glowColor', 'string[] / string', 'blue · aqua · red', 'Gradient stops (they rotate) and the halo.'],
      ['onMicError', '(error) => void', '-', 'Called if the microphone is denied or missing; the orb falls back to a simulated voice.'],
      ['label', 'string', '"Voice assistant"', 'Accessible name, combined with the current state.']
    ],
    usage: `import VoiceOrb from "./VoiceOrb";

<VoiceOrb
  state={assistantState}
  source="mic"
/>`,
    render: props => <OrbDemo {...props} />
  },

  'thinking-shimmer': {
    source: thinkingShimmerSource,
    defaults: { shimmerSpeed: 1800, label: 'Thinking', showTimer: true, accentColor: '#73eff7' },
    controls: [slider('shimmerSpeed', 'Shimmer (ms)', 600, 4000, 100), text('label', 'Label'), toggle('showTimer', 'Elapsed timer'), color('accentColor', 'Accent')],
    docs: [
      ['thinking', 'boolean', 'true', 'While true the label shimmers and the timer ticks; false settles to the done label.'],
      ['steps', '{ label, status, detail?, id? }[]', '[]', 'Disclosed under the header: status is "pending", "active" (spinner) or "done" (check).'],
      ['label / doneLabel', 'string / (seconds) => string', '"Thinking" / "Thought for 12s"', 'Header text while working and when done.'],
      ['startedAt', 'number', 'mount time', 'Epoch ms the work began, if it started before this mounted.'],
      ['defaultOpen / open / onOpenChange', 'boolean / boolean / (open) => void', 'false', 'Disclosure state.'],
      ['showTimer / shimmerSpeed / colors', 'boolean / number / string', 'true / 1800', 'Timer and styling; completion is announced politely.']
    ],
    usage: `import ThinkingShimmer from "./ThinkingShimmer";

<ThinkingShimmer
  thinking={isThinking}
  steps={[{ label: "Reading files", status: "done" }, { label: "Planning", status: "active" }]}
/>`,
    render: props => <ThinkingDemo {...props} />
  },

  'chat-bubbles': {
    source: chatBubblesSource,
    defaults: { height: 380, radius: 4, meColor: '#3987e5', themColor: '#29366f' },
    controls: [slider('height', 'Height', 240, 600, 10), slider('radius', 'Radius', 0, 28, 1), color('meColor', 'My bubbles'), color('themColor', 'Their bubbles')],
    docs: [
      ['messages', '{ id, from: "me" | "them", text, author?, avatar?, time?, reactions? }[]', '[]', 'The thread. Consecutive messages from one sender group, with one tail and avatar.'],
      ['typing / typingName', 'boolean / string', 'false', 'Show the bouncing typing indicator (announced as "Name is typing").'],
      ['reactions / onReact', 'string[] / (id, emoji, on) => void', '5 emoji', 'Picker options; double-click or double-tap adds the first one.'],
      ['height / radius', 'number | string / number', '420 / 18', 'The thread scrolls and stays pinned to the newest message unless you scroll up.'],
      ['meColor / themColor / text colors', 'string', 'blue / navy', 'Bubble colors; keep bubble text contrast at 4.5:1 or more.'],
      ['label', 'string', '"Conversation"', 'Accessible name of the live log.']
    ],
    usage: `import ChatBubbles from "./ChatBubbles";

<ChatBubbles
  messages={messages}
  typing={botIsTyping}
  onReact={(id, emoji) => saveReaction(id, emoji)}
/>`,
    render: props => <ChatDemo {...props} />
  }
};

export const CONTENT_DEMOS = DEMO_ENTRIES;
