import { useState } from 'react';
import PixelButton from './bits/PixelButton';
import LetterSwap from './bits/LetterSwap';
import CutReveal from './bits/CutReveal';
import Spoiler from './bits/Spoiler';
import letterSwapSource from './bits/LetterSwap.jsx?raw';
import cutRevealSource from './bits/CutReveal.jsx?raw';
import spoilerSource from './bits/Spoiler.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });
const text = (name, label) => ({ name, type: 'text', label });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", monospace';
const stack = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 22, justifyItems: 'center', width: '100%', padding: '28px 16px', boxSizing: 'border-box' };
const hint = { margin: 0, color: '#94b0c2', font: `14px/1.4 ${PIXEL_FONT}`, textAlign: 'center' };

// ---------- LetterSwap ----------

function SwapDemo({ text: label, swapText, ...props }) {
  return (
    <div style={stack}>
      <LetterSwap {...props} text={label} swapText={swapText || undefined} style={{ font: `clamp(20px, 5vw, 40px) ${TITLE_FONT}`, color: '#f4f4f4' }} />
      <nav aria-label="Demo menu" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 22, font: `20px ${PIXEL_FONT}`, color: '#94b0c2' }}>
        {['Play', 'Inventory', 'Map', 'Settings'].map(item => (
          <LetterSwap key={item} {...props} text={item} href={`#${item.toLowerCase()}`} onClick={event => event.preventDefault()} />
        ))}
      </nav>
      <p style={hint}>Hover or Tab to a word.</p>
    </div>
  );
}

// ---------- CutReveal ----------

const STORY = 'Long ago, the pixel world was a single grey block. Then someone placed a torch, and the light spread across the plains, into the forests and down to the deepest caves. Every block you place today still carries a little of that first glow.';

function CutDemo(props) {
  const [run, setRun] = useState(0);
  return (
    <div style={{ ...stack, maxWidth: 640, margin: '0 auto' }}>
      <CutReveal {...props} as="h3" text="The first torch" replayKey={`h-${run}`} style={{ margin: 0, font: `clamp(16px, 3.4vw, 26px)/1.5 ${TITLE_FONT}`, color: '#ffcd75', textAlign: 'center' }} />
      <CutReveal {...props} text={STORY} replayKey={`p-${run}`} style={{ margin: 0, font: `clamp(16px, 2.6vw, 20px)/1.7 ${PIXEL_FONT}`, color: '#f4f4f4' }} />
      <PixelButton size="sm" variant="secondary" onPress={() => setRun(n => n + 1)}>
        Replay
      </PixelButton>
    </div>
  );
}

// ---------- Spoiler ----------

function SpoilerDemo(props) {
  const [count, setCount] = useState(0);
  return (
    <div style={{ ...stack, maxWidth: 560, margin: '0 auto' }}>
      <p style={{ margin: 0, color: '#f4f4f4', font: `18px/1.8 ${PIXEL_FONT}` }}>
        The final boss is not a dragon at all. It turns out the boss is{' '}
        <Spoiler {...props} onReveal={shown => shown && setCount(c => c + 1)}>
          your own reflection in the obsidian mirror, wearing the crown you dropped in chapter two
        </Spoiler>
        , which explains why it always knew your next move.
      </p>
      <p style={{ margin: 0, color: '#f4f4f4', font: `18px/1.8 ${PIXEL_FONT}` }}>
        Secret password for the vault: <Spoiler {...props} onReveal={shown => shown && setCount(c => c + 1)}>pickaxe-4-ever</Spoiler>
      </p>
      <p style={hint}>{count ? `Spoilers revealed: ${count}` : 'Click a spoiler, or Tab to it and press Enter.'}</p>
    </div>
  );
}

// ---------- Entries ----------

export const TEXT_MORE_DEMOS = {
  'letter-swap': {
    source: letterSwapSource,
    defaults: { text: 'PRESS START', swapText: 'LET’S GO!', from: 'start', stagger: 30, duration: 500, altColor: '#73eff7' },
    controls: [text('text', 'Text'), text('swapText', 'Back face (optional)'), select('from', 'Wave from', ['start', 'center', 'end', 'random']), slider('stagger', 'Stagger (ms)', 0, 120, 5), slider('duration', 'Roll (ms)', 150, 1200, 50), color('altColor', 'Back face color')],
    docs: [
      ['text / swapText', 'string', '- / text', 'Front word and the face that rolls into view (defaults to the same word).'],
      ['as / href', 'string', '"span" / -', 'The element to render; href makes it a link.'],
      ['from', '"start" | "center" | "end" | "random"', '"start"', 'Where the wave starts.'],
      ['stagger / duration', 'number', '30 / 500', 'Delay between letters and the roll time, in ms.'],
      ['active', 'boolean', '-', 'Hold it rolled (for a selected state).'],
      ['Accessibility', '-', '-', 'The word is read once; letters are decoration. Works on focus; reduced motion swaps color.']
    ],
    usage: `import LetterSwap from "./LetterSwap";

<LetterSwap as="a" href="/play" text="Play" />`,
    render: props => <SwapDemo {...props} />
  },

  'cut-reveal': {
    source: cutRevealSource,
    defaults: { slice: 14, direction: 'right', stagger: 140, duration: 900 },
    controls: [slider('slice', 'Cut width (px)', 4, 40, 1), select('direction', 'Cuts open toward', ['right', 'left', 'down', 'up']), slider('stagger', 'Line stagger (ms)', 0, 400, 10), slider('duration', 'Per line (ms)', 300, 2000, 50)],
    docs: [
      ['text', 'string', '""', 'Plain text; lines come from the real layout and re-measure on resize.'],
      ['as', 'string', '"p"', 'Element to render (h1–h6, p…).'],
      ['slice / direction', 'number / "right" | "left" | "down" | "up"', '14 / "right"', 'Width of each cut and the way the strips open.'],
      ['stagger / duration / rise', 'number / number / string', '140 / 900 / "0.35em"', 'Line delay, reveal time and how far lines rise.'],
      ['threshold / replayKey', 'number / any', '0.3 / -', 'How much must be visible to play; change replayKey to play again.'],
      ['Accessibility', '-', '-', 'The text is real text throughout; reduced motion shows it at once.']
    ],
    usage: `import CutReveal from "./CutReveal";

<CutReveal as="h2" text="The first torch" />`,
    render: props => <CutDemo {...props} />
  },

  spoiler: {
    source: spoilerSource,
    defaults: { tile: 24, density: 60, rehide: false, dotColor: '#f4f4f4' },
    controls: [slider('tile', 'Particle field size', 12, 48, 2), slider('density', 'Particles', 20, 160, 5), toggle('rehide', 'Click again to hide'), color('dotColor', 'Particles')],
    docs: [
      ['children', 'ReactNode', '-', 'The hidden text (inline; wraps across lines).'],
      ['revealed / defaultRevealed / onReveal', 'boolean / boolean / (shown) => void', 'false', 'Controlled or not.'],
      ['rehide', 'boolean', 'false', 'Let a second click hide it again (it becomes a toggle button).'],
      ['dotColor / coverColor / tile / density', 'string / string / number / number', 'white / slate / 24 / 60', 'The particle field.'],
      ['label', 'string', '"Spoiler"', 'Accessible name while hidden.'],
      ['Accessibility', '-', '-', 'Hidden: a button named "Spoiler, hidden" and the secret isn’t read; revealed: plain text.']
    ],
    usage: `import Spoiler from "./Spoiler";

<p>The butler <Spoiler>did it</Spoiler>.</p>`,
    render: props => <SpoilerDemo {...props} />
  }
};
