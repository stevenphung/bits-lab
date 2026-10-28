import { useEffect, useRef, useState } from 'react';
import PixelButton from './bits/PixelButton';
import PixelAvatar from './bits/PixelAvatar';
import { playChip } from './bits/ChiptuneKit';
import ElasticString from './bits/ElasticString';
import StickerBoard from './bits/StickerBoard';
import AgentCard from './bits/AgentCard';
import SuggestionChips from './bits/SuggestionChips';
import DiffReveal from './bits/DiffReveal';
import elasticStringSource from './bits/ElasticString.jsx?raw';
import stickerBoardSource from './bits/StickerBoard.jsx?raw';
import agentCardSource from './bits/AgentCard.jsx?raw';
import suggestionChipsSource from './bits/SuggestionChips.jsx?raw';
import diffRevealSource from './bits/DiffReveal.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const stack = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 22, justifyItems: 'center', width: '100%', padding: '28px 16px', boxSizing: 'border-box' };
const hint = { margin: 0, color: '#94b0c2', font: `14px/1.4 ${PIXEL_FONT}`, textAlign: 'center' };

// ---------- ElasticString ----------

const STRING_COLORS = ['#73eff7', '#a7f070', '#ffcd75', '#ef7d57', '#b13e53', '#41a6f6'];
// Low to high, like a fretboard read top to bottom.
const PITCHES = [196, 247, 294, 392, 494, 659];

function StringDemo({ sound, ...props }) {
  const [last, setLast] = useState(null);
  return (
    <div style={{ ...stack, maxWidth: 720, margin: '0 auto' }}>
      <ElasticString
        {...props}
        colors={STRING_COLORS}
        onPluck={(i, strength) => {
          setLast({ i, strength });
          if (sound && strength > 0.05) playChip({ wave: 'triangle', from: PITCHES[i % PITCHES.length], to: PITCHES[i % PITCHES.length], duration: 0.18 + strength * 0.5, volume: 0.15 + strength * 0.3 });
        }}
      />
      <p style={hint}>{last ? `String ${last.i + 1} plucked at ${Math.round(last.strength * 100)}% strength.` : 'Sweep the pointer across the strings, or drag one and let go.'}</p>
    </div>
  );
}

// ---------- StickerBoard ----------

const pixelImg = (src, bg) => <img src={src} alt="" draggable={false} style={{ imageRendering: 'pixelated', background: bg, padding: 10, boxSizing: 'border-box' }} />;
const STICKERS = [
  { id: 'heart', label: 'Heart', content: pixelImg('/pixel/sprite-heart.png', '#ffd6dc'), x: 40, y: 40, rotate: -8, size: 104 },
  { id: 'pip', label: 'Pip', content: <PixelAvatar seed="pip" size={120} decorative style={{ display: 'block', width: '100%', height: 'auto' }} />, x: 180, y: 70, rotate: 6, size: 120 },
  { id: 'gem', label: 'Gem', content: pixelImg('/pixel/sprite-gem.png', '#d9f7ff'), x: 330, y: 30, rotate: 12, size: 96 },
  { id: 'chest', label: 'Treasure chest', content: pixelImg('/pixel/sprite-chest.png', '#fff1cf'), x: 90, y: 220, rotate: 4, size: 116 },
  { id: 'potion', label: 'Potion', content: pixelImg('/pixel/sprite-potion.png', '#e8dcff'), x: 260, y: 230, rotate: -14, size: 96 },
  { id: 'star', label: 'Star', content: pixelImg('/pixel/sprite-star.png', '#fff7c2'), x: 420, y: 190, rotate: -4, size: 108 },
  {
    id: 'note',
    label: 'Note: gg!',
    content: <span style={{ display: 'grid', placeItems: 'center', aspectRatio: '1', background: '#a7f070', color: '#1a1c2c', font: `28px ${PIXEL_FONT}` }}>gg!</span>,
    x: 520,
    y: 60,
    rotate: 10,
    size: 92
  }
];

function StickerDemo({ persist, ...props }) {
  const [key, setKey] = useState(0);
  const storageKey = persist ? 'bits-lab-sticker-demo' : undefined;
  return (
    <div style={{ ...stack, maxWidth: 760, margin: '0 auto' }}>
      <StickerBoard key={`${key}-${persist}`} {...props} stickers={STICKERS} storageKey={storageKey} />
      <PixelButton
        size="sm"
        variant="secondary"
        onPress={() => {
          try {
            localStorage.removeItem('bits-lab-sticker-demo');
          } catch {
            // Nothing saved to clear.
          }
          setKey(k => k + 1);
        }}
      >
        Reset layout
      </PixelButton>
      <p style={hint}>Drag stickers around. Shift + scroll rotates; with a sticker focused, arrows move and [ ] rotate.</p>
    </div>
  );
}

// ---------- AgentCard ----------

const RUN = [
  { tool: 'search_docs', args: { query: 'torch light radius', limit: 5 }, logs: ['Searching 1,204 pages…', 'Ranked 37 matches', 'Top hit: lighting.md#torches'], result: 'Found 5 pages. Torches light a radius of 14 blocks.', ms: 1800 },
  { tool: 'read_file', args: { path: 'src/world/lighting.js' }, logs: ['Opening src/world/lighting.js', 'Read 212 lines (6.1 KB)'], result: 'const TORCH_RADIUS = 12; // should be 14', ms: 1100 },
  {
    tool: 'run_tests',
    args: { suite: 'lighting', watch: false },
    logs: ['Running 18 tests in lighting.test.js', '✓ torch lights adjacent blocks', '✓ light fades with distance', '✓ water blocks light', '✓ radius matches the docs'],
    result: '18 passed in 2.4s',
    failLogs: ['Running 18 tests in lighting.test.js', '✓ torch lights adjacent blocks', '✓ light fades with distance', '✗ radius matches the docs'],
    error: 'AssertionError: expected 12 to equal 14\n    at lighting.test.js:41:22',
    ms: 2600
  }
];

function AgentDemo({ fail, ...props }) {
  const [cards, setCards] = useState([]);
  const timers = useRef([]);

  const run = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    const at = (ms, fn) => timers.current.push(setTimeout(fn, ms));
    setCards(RUN.map(step => ({ ...step, status: 'queued', lines: [] })));
    let t = 300;
    RUN.forEach((step, i) => {
      const failing = fail && step.error;
      const lines = failing ? step.failLogs : step.logs;
      const startAt = t;
      at(startAt, () => setCards(cs => cs.map((c, j) => (j === i ? { ...c, status: 'running', startedAt: Date.now() } : c))));
      lines.forEach((line, k) => at(startAt + ((k + 1) * step.ms) / (lines.length + 1), () => setCards(cs => cs.map((c, j) => (j === i ? { ...c, lines: [...c.lines, line] } : c)))));
      at(startAt + step.ms, () => setCards(cs => cs.map((c, j) => (j === i ? { ...c, status: failing ? 'error' : 'success', duration: Date.now() - c.startedAt } : c))));
      t += step.ms + 250;
    });
  };

  useEffect(() => {
    run();
    return () => timers.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fail]);

  return (
    <div style={{ ...stack, maxWidth: 640, margin: '0 auto' }}>
      <div style={{ display: 'grid', gap: 10, width: '100%', justifyItems: 'center' }}>
        {cards.map(card => (
          <AgentCard key={card.tool} {...props} tool={card.tool} args={card.args} status={card.status} startedAt={card.startedAt} duration={card.duration} logs={card.lines} result={card.result} error={card.error} />
        ))}
      </div>
      <PixelButton size="sm" variant="secondary" onPress={run}>
        Run again
      </PixelButton>
      <p style={hint}>Click a card to open its logs.</p>
    </div>
  );
}

// ---------- SuggestionChips ----------

const IDEAS = [
  'Plan a cosy cabin build',
  'Name my pet slime',
  'Write a quest for a lost compass',
  'Explain redstone like I’m five',
  'Design a castle in the clouds',
  'Make a shopping list for a dungeon raid',
  'Draft a tavern menu',
  'Suggest a colour palette for a desert town',
  'Write a lullaby for a sleepy dragon',
  'Plan a 3-day speedrun practice',
  'Invent a new potion',
  'Map out a hidden cave base'
];

function ChipsDemo({ withIcons, ...props }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const items = withIcons ? IDEAS.map((text, i) => ({ text, icon: <PixelAvatar seed={text} size={18} variant={i % 2 ? 'identicon' : 'creature'} decorative /> })) : IDEAS;
  return (
    <div style={{ ...stack, maxWidth: 640, margin: '0 auto' }}>
      <h3 style={{ margin: 0, color: '#f4f4f4', font: `24px ${PIXEL_FONT}`, textAlign: 'center' }}>What shall we make today?</h3>
      <SuggestionChips
        key={String(withIcons)}
        {...props}
        suggestions={items}
        fontFamily={PIXEL_FONT}
        onPick={text => {
          setValue(text);
          inputRef.current?.focus();
        }}
      />
      <input
        ref={inputRef}
        value={value}
        onChange={event => setValue(event.target.value)}
        placeholder="Ask anything…"
        aria-label="Message"
        style={{ width: '100%', maxWidth: 520, boxSizing: 'border-box', padding: '12px 16px', border: 0, borderRadius: 14, background: '#262b44', color: '#f4f4f4', font: `16px ${PIXEL_FONT}`, boxShadow: '0 0 0 1px #333c57' }}
      />
    </div>
  );
}

// ---------- DiffReveal ----------

const BEFORE = 'Torches light up the area around them and stop most mobs from spawning nearby. You should place them every few blocks in caves so you do not get lost.';
const AFTER = 'Torches light a radius of 14 blocks and stop hostile mobs from spawning nearby. In caves, place one every 8 blocks on your right-hand wall so the way out is always on your left.';

function DiffDemo(props) {
  return (
    <div style={{ ...stack, maxWidth: 680, margin: '0 auto', justifyItems: 'stretch' }}>
      <DiffReveal {...props} before={BEFORE} after={AFTER} fontFamily={PIXEL_FONT} />
    </div>
  );
}

// ---------- Entries ----------

export const PLAYFUL_MORE_DEMOS = {
  'elastic-string': {
    source: elasticStringSource,
    defaults: { strings: 4, height: 240, thickness: 3, grab: 26, maxPull: 70, stiffness: 420, damping: 7, sound: false },
    controls: [slider('strings', 'Strings', 1, 6, 1), slider('height', 'Height', 120, 400, 10), slider('thickness', 'Thickness', 1, 8, 0.5), slider('maxPull', 'Max pull (px)', 20, 140, 5), slider('stiffness', 'Stiffness', 100, 1200, 20), slider('damping', 'Damping', 1, 30, 0.5), toggle('sound', 'Pluck sound')],
    docs: [
      ['strings / height / gap', 'number', '1 / 200 / even', 'How many strings and how they are spaced.'],
      ['colors / thickness', 'string[] / number', 'cyan / 3', 'Colours cycle per string; lower strings get thinner.'],
      ['grab / maxPull', 'number', '26 / 70', 'How close the pointer must come to catch a string, and how far it bends before it slips.'],
      ['stiffness / damping', 'number', '420 / 7', 'The spring; each string is a little stiffer than the one above.'],
      ['onPluck', '(index, strength 0–1) => void', '-', 'Called on release. Hook a sound to it.'],
      ['Accessibility', '-', '-', 'Decorative (aria-hidden). Reduced motion: strings return without wobble.']
    ],
    usage: `import ElasticString from "./ElasticString";

<ElasticString strings={4} onPluck={(i, strength) => play(i, strength)} />`,
    render: props => <StringDemo {...props} />
  },

  'sticker-board': {
    source: stickerBoardSource,
    defaults: { height: 420, stickerRadius: 12, backgroundColor: '#5d275d', paperColor: '#f4f4f4', persist: true },
    controls: [slider('height', 'Height', 280, 600, 10), slider('stickerRadius', 'Sticker corners', 0, 40, 1), color('backgroundColor', 'Board'), color('paperColor', 'Sticker edge'), toggle('persist', 'Remember layout')],
    docs: [
      ['stickers', '{ id, label, content, x, y, rotate, size }[]', '[]', 'content is an image URL or any node.'],
      ['storageKey', 'string', '-', 'Save the layout in localStorage under this key.'],
      ['onChange', '(layout) => void', '-', 'Positions, rotations and stacking after each change.'],
      ['height / radius / stickerRadius', 'number', '420 / 16 / 12', 'Board and sticker shape.'],
      ['backgroundColor / paperColor / peelColor', 'string', 'plum / white / grey', 'Board, the sticker edge and the peeling corner.'],
      ['Accessibility', '-', '-', 'Stickers are buttons: arrows move (Shift ×4), [ ] rotate, Enter brings to front; changes are announced.']
    ],
    usage: `import StickerBoard from "./StickerBoard";

<StickerBoard storageKey="my-board" stickers={[{ id: "a", label: "Heart", content: "/heart.png" }]} />`,
    render: props => <StickerDemo {...props} />
  },

  'agent-card': {
    source: agentCardSource,
    defaults: { fail: false, defaultOpen: true, width: 560, logHeight: 140, accentColor: '#73eff7' },
    controls: [toggle('fail', 'Last step fails'), toggle('defaultOpen', 'Open by default'), slider('width', 'Max width', 320, 720, 10), slider('logHeight', 'Log height', 80, 300, 10), color('accentColor', 'Running accent')],
    docs: [
      ['tool / args', 'string / object | string', '"tool" / -', 'The call; args are summarised on one line.'],
      ['status', '"queued" | "running" | "success" | "error"', '"running"', 'Drives the icon, colour and announcement.'],
      ['startedAt / duration', 'number (ms epoch) / number (ms)', '-', 'A live timer while running; the final time when done.'],
      ['logs', 'string[]', '[]', 'New lines slide in; the panel follows them unless scrolled up.'],
      ['result / error', 'ReactNode | string', '-', 'Shown under the logs on success or failure.'],
      ['open / defaultOpen / onOpenChange', 'boolean / boolean / (open) => void', '- / false', 'Controlled or not.'],
      ['Accessibility', '-', '-', 'The header is a disclosure button; status changes are announced; collapsed logs are inert.']
    ],
    usage: `import AgentCard from "./AgentCard";

<AgentCard tool="read_file" args={{ path: "src/app.js" }} status="running" startedAt={start} logs={lines} />`,
    render: props => <AgentDemo {...props} />
  },

  'suggestion-chips': {
    source: suggestionChipsSource,
    defaults: { count: 4, stagger: 60, align: 'center', radius: 999, withIcons: true, accentColor: '#73eff7' },
    controls: [slider('count', 'Chips shown', 2, 8, 1), slider('stagger', 'Stagger (ms)', 0, 200, 10), select('align', 'Align', ['center', 'start']), slider('radius', 'Corner radius', 0, 999, 1), toggle('withIcons', 'Icons'), color('accentColor', 'Accent')],
    docs: [
      ['suggestions', '(string | { text, label?, icon? })[]', '[]', 'The pool to deal from.'],
      ['count', 'number', '4', 'How many show at once.'],
      ['onPick', '(text, item) => void', '-', 'Called when a chip is clicked.'],
      ['moreLabel', 'string', '"More ideas"', 'Reshuffle button (hidden when the pool fits).'],
      ['align / stagger', '"center" | "start" / number', '"center" / 60', 'Layout and entrance delay per chip.'],
      ['Accessibility', '-', '-', 'Chips are buttons in a labelled list; a new set is announced.']
    ],
    usage: `import SuggestionChips from "./SuggestionChips";

<SuggestionChips suggestions={ideas} onPick={text => setPrompt(text)} />`,
    render: props => <ChipsDemo {...props} />
  },

  'diff-reveal': {
    source: diffRevealSource,
    defaults: { charsPerSecond: 45, strikeDuration: 520, stagger: 220, showControls: true, insertColor: '#38b764', deleteColor: '#ef7d57' },
    controls: [slider('charsPerSecond', 'Typing (chars/s)', 10, 150, 5), slider('strikeDuration', 'Strike (ms)', 150, 1500, 50), slider('stagger', 'Deletion stagger (ms)', 0, 600, 20), toggle('showControls', 'Controls'), color('insertColor', 'Insertions'), color('deleteColor', 'Deletions')],
    docs: [
      ['before / after', 'string', '""', 'The two versions; diffed word by word.'],
      ['autoPlay / threshold / replayKey', 'boolean / number / any', 'true / 0.4 / -', 'Play on view; change replayKey to restart.'],
      ['charsPerSecond / strikeDuration / stagger', 'number', '45 / 520 / 220', 'Typing speed, how long a deletion shows struck, and the gap between deletions.'],
      ['showControls', 'boolean', 'true', 'Play/replay, speed and the +/− word count.'],
      ['onDone', '() => void', '-', 'Called when the edit has finished.'],
      ['diffWords(before, after)', 'export', '-', 'The diff on its own: { type: "same" | "ins" | "del", text }[].'],
      ['Accessibility', '-', '-', 'Screen readers get the final text and a summary; reduced motion shows the final state.']
    ],
    usage: `import DiffReveal from "./DiffReveal";

<DiffReveal before={draft} after={revised} />`,
    render: props => <DiffDemo {...props} />
  }
};
