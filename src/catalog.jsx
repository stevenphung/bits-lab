import { COMPONENTS } from './meta';
import FocusPull from './bits/FocusPull';
import TallyUp from './bits/TallyUp';
import PegBoard from './bits/PegBoard';
import focusPullSource from './bits/FocusPull.jsx?raw';
import tallyUpSource from './bits/TallyUp.jsx?raw';
import pegBoardSource from './bits/PegBoard.jsx?raw';
import { PIXEL_DEMOS } from './catalog-pixel';
import { SHOWCASE_DEMOS } from './catalog-showcase';
import { SCROLL_DEMOS } from './catalog-scroll';
import { OVERLAY_DEMOS } from './catalog-overlays';
import { NAV_DEMOS } from './catalog-nav';
import { INPUT_DEMOS } from './catalog-inputs';
import { DATA_DEMOS } from './catalog-data';
import { CONTENT_DEMOS } from './catalog-content';
import { FOUNDATION_DEMOS } from './catalog-foundation';
import { ARCADE_DEMOS } from './catalog-arcade';
import { SHOWCASE_MORE_DEMOS } from './catalog-showcase-more';
import { SCROLL_MORE_DEMOS } from './catalog-scroll-more';
import { OVERLAY_MORE_DEMOS } from './catalog-overlays-more';
import { NAV_MORE_DEMOS } from './catalog-nav-more';
import { INPUT_MORE_DEMOS } from './catalog-inputs-more';
import { DATA_MORE_DEMOS } from './catalog-data-more';
import { CARDS_MORE_DEMOS } from './catalog-cards-more';
import { TEXT_MORE_DEMOS } from './catalog-text-more';
import { PLAYFUL_MORE_DEMOS } from './catalog-playful-more';
import { BACKGROUNDS_MORE_DEMOS } from './catalog-backgrounds-more';
import { WAVE3_DEMOS } from './catalog-wave3';
import { WAVE4_DEMOS } from './catalog-wave4';
import { WAVE5_DEMOS } from './catalog-wave5';

// One entry per component page: defaults drive the URL state, controls drive the
// Customize panel, docs drive the prop table and usage is the snippet props get injected into.
const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", ui-monospace, monospace';
const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });
const stack = { display: 'grid', gap: 18, justifyItems: 'center', width: '100%', padding: '40px 16px', boxSizing: 'border-box', textAlign: 'center' };
const hint = { margin: 0, color: '#94b0c2', font: `14px/1.4 ${PIXEL_FONT}` };

// FocusPull's hover mode re-racks on every hover; the others replay when remounted.
function FocusDemo(props) {
  return (
    <div style={stack}>
      <FocusPull key={`${props.rack}-${props.trigger}`} {...props} as="h2" style={{ font: `clamp(22px, 4vw, 40px)/1.3 ${TITLE_FONT}`, maxWidth: 760 }} />
      <p style={hint}>{props.trigger === 'hover' ? 'Hover the line to rack the focus again.' : 'Change the rack style to replay it.'}</p>
    </div>
  );
}

const TALLIES = [
  { caption: 'Gems mined', value: 1728, goal: 2500, unit: 'gems', milestones: [500, 1000, 2000] },
  { caption: 'Quest XP', value: 86, goal: 100, unit: 'XP', milestones: [25, 50, 75] }
];

function TallyDemo(props) {
  return (
    <div style={{ ...stack, gap: 32 }}>
      {TALLIES.map(t => (
        <TallyUp key={`${t.caption}-${props.curve}-${props.duration}`} {...t} {...props} fontFamily={PIXEL_FONT} />
      ))}
    </div>
  );
}

// One entry per component page: defaults drive the URL state, controls drive the
// Customize panel, docs drive the prop table and usage is the snippet props get injected into.
const DEMOS = {
  'focus-pull': {
    source: focusPullSource,
    defaults: { text: 'Every pixel snaps into focus', rack: 'sweep', trigger: 'view', pull: 900, spread: 700, depth: 8, fringe: 3, textColor: '#ffcd75' },
    controls: [{ name: 'text', type: 'text', label: 'Text' }, select('rack', 'Rack', ['sweep', 'center', 'snap']), select('trigger', 'Trigger', ['view', 'mount', 'hover']), slider('pull', 'Pull (ms)', 200, 2400, 50), slider('spread', 'Sweep spread (ms)', 0, 2000, 50), slider('depth', 'Defocus blur (px)', 0, 20, 1), slider('fringe', 'Colour fringe (px)', 0, 10, 0.5), color('textColor', 'Colour')],
    docs: [
      ['text / as', 'string / element', '"" / "p"', 'The line, and the element it renders as.'],
      ['rack', '"sweep" | "center" | "snap"', '"sweep"', 'How the focus moves: across the line, outward from the middle, or all at once with a lens breathe.'],
      ['trigger / threshold', '"view" | "mount" | "hover" / number', '"view" / 0.4', 'When it pulls focus; hover racks it again on every hover.'],
      ['pull / spread', 'number (ms)', '900 / 700', 'How long each letter takes to sharpen, and how long the sweep takes to cross the line.'],
      ['depth / fringe / fringeColors', 'number / number / [string, string]', '8 / 3 / orange, cyan', 'Out-of-focus blur, and the colour-fringe offset of the soft lens.'],
      ['onFocused', '() => void', '-', 'Called when the whole line is sharp.'],
      ['Accessibility', '-', '-', 'The text is read once; the letters are hidden from screen readers. Reduced motion: sharp at once.']
    ],
    usage: `import FocusPull from "./FocusPull";

<FocusPull as="h2" text="Every pixel snaps into focus" rack="sweep" />`,
    render: props => <FocusDemo {...props} />
  },
  'tally-up': {
    source: tallyUpSource,
    defaults: { curve: 'steps', steps: 12, duration: 1600, blocks: 20, fontSize: 48, fillColor: '#38b764', accentColor: '#ffcd75' },
    controls: [select('curve', 'Curve', ['ease', 'steps']), slider('steps', 'Arcade steps', 3, 40, 1), slider('duration', 'Duration (ms)', 300, 4000, 100), slider('blocks', 'Blocks', 5, 40, 1), slider('fontSize', 'Figure size', 20, 80, 2), color('fillColor', 'Fill'), color('accentColor', 'Milestones')],
    docs: [
      ['value / start / goal', 'number', '0 / 0 / value', 'Where the count ends and begins; the bar fills toward goal.'],
      ['curve / steps / duration', '"ease" | "steps" / number / number', '"ease" / 12 / 1600', 'A smooth ease-out, or an arcade count in chunky steps with a bump on each.'],
      ['blocks / milestones', 'number / number[]', '20 / []', 'Pixel blocks in the bar, and notches that flash as the count passes them.'],
      ['format / locale / unit / caption', 'Intl.NumberFormatOptions / string / string / string', '-', 'How the figure is written and labelled.'],
      ['trigger / onReach', '"view" | "mount" / (value) => void', '"view" / -', 'When the count starts, and a callback when it lands.'],
      ['colours and sizes', 'string / number', 'pixel palette', 'textColor, mutedColor, trackColor, fillColor, accentColor; width, fontSize, barHeight, gap.'],
      ['Accessibility', '-', '-', 'The final figure (with caption, unit and goal) is announced once. Reduced motion: final at once.']
    ],
    usage: `import TallyUp from "./TallyUp";

<TallyUp caption="Gems mined" value={1728} goal={2500} unit="gems" milestones={[500, 1000, 2000]} />`,
    render: props => <TallyDemo {...props} />
  },
  'peg-board': {
    source: pegBoardSource,
    defaults: { imprint: 'BITS', pegSize: 10, spacing: 4, rise: 9, reach: 80, settle: 1.6, topColor: '#41a6f6', peakColor: '#73eff7' },
    controls: [{ name: 'imprint', type: 'text', label: 'Imprint' }, slider('pegSize', 'Peg size', 4, 24, 1), slider('spacing', 'Spacing', 1, 12, 1), slider('rise', 'Rise (px)', 2, 24, 1), slider('reach', 'Hand size (px)', 20, 200, 5), slider('settle', 'Settle (s)', 0.2, 6, 0.1), color('topColor', 'Peg tops'), color('peakColor', 'Raised tops')],
    docs: [
      ['imprint / imprintFont / imprintHeight', 'string / CSS font / number', '"" / Press Start 2P / 0.55', 'A word pressed into the pegs at rest; the font size is fitted to the board.'],
      ['pegSize / spacing / rise', 'number', '10 / 4 / 9', 'Peg size and gap, and how many px a fully raised peg climbs.'],
      ['reach / settle', 'number', '80 / 1.6', 'How wide the pointer "hand" presses, and roughly how many seconds pegs take to sink back.'],
      ['pegColor / topColor / peakColor / backgroundColor', 'string', 'navy / blue / cyan / ink', 'Side shade, resting tops, raised tops and the board.'],
      ['height', 'number | string', '"100%"', 'Fills its parent by default.'],
      ['Accessibility', '-', '-', 'Decorative. Pauses off-screen and in hidden tabs. Reduced motion: pegs move without the slow settle.']
    ],
    usage: `import PegBoard from "./PegBoard";

<div style={{ height: 420 }}>
  <PegBoard imprint="HELLO" />
</div>`,
    fullBleed: true,
    render: props => <PegBoard {...props} />
  }
};

// TypeScript variants (src/bits/ts) load on demand, only when someone switches the code to TS.
const TS_SOURCES = import.meta.glob('./bits/ts/*.tsx', { query: '?raw', import: 'default' });
// Tailwind variants (src/bits/tw, src/bits/tw-ts) likewise, when someone picks Tailwind.
const TW_SOURCES = import.meta.glob('./bits/tw/*.jsx', { query: '?raw', import: 'default' });
const TW_TS_SOURCES = import.meta.glob('./bits/tw-ts/*.tsx', { query: '?raw', import: 'default' });

export const CATALOG = COMPONENTS.map(meta => {
  const demo = DEMOS[meta.slug] ?? PIXEL_DEMOS[meta.slug] ?? SHOWCASE_DEMOS[meta.slug] ?? SCROLL_DEMOS[meta.slug] ?? OVERLAY_DEMOS[meta.slug] ?? NAV_DEMOS[meta.slug] ?? INPUT_DEMOS[meta.slug] ?? DATA_DEMOS[meta.slug] ?? CONTENT_DEMOS[meta.slug] ?? FOUNDATION_DEMOS[meta.slug] ?? ARCADE_DEMOS[meta.slug] ?? SHOWCASE_MORE_DEMOS[meta.slug] ?? SCROLL_MORE_DEMOS[meta.slug] ?? OVERLAY_MORE_DEMOS[meta.slug] ?? NAV_MORE_DEMOS[meta.slug] ?? INPUT_MORE_DEMOS[meta.slug] ?? DATA_MORE_DEMOS[meta.slug] ?? CARDS_MORE_DEMOS[meta.slug] ?? TEXT_MORE_DEMOS[meta.slug] ?? PLAYFUL_MORE_DEMOS[meta.slug] ?? BACKGROUNDS_MORE_DEMOS[meta.slug] ?? WAVE3_DEMOS[meta.slug] ?? WAVE4_DEMOS[meta.slug] ?? WAVE5_DEMOS[meta.slug];
  return {
    ...meta,
    ...demo,
    origin: 'lab',
    path: `/${meta.category}/${meta.slug}`,
    registryUrl: `${window.location.origin}/r/${meta.name}.json`,
    loadSources: () => Promise.resolve([{ file: meta.file.split('/').pop(), code: demo.source }]),
    ...(TS_SOURCES[`./bits/ts/${meta.name}.tsx`] && {
      tsRegistryUrl: `${window.location.origin}/r/${meta.name}-TS.json`,
      loadTsSources: () => TS_SOURCES[`./bits/ts/${meta.name}.tsx`]().then(code => [{ file: `${meta.name}.tsx`, code }])
    }),
    ...(TW_SOURCES[`./bits/tw/${meta.name}.jsx`] && {
      twRegistryUrl: `${window.location.origin}/r/${meta.name}-TW.json`,
      loadTwSources: () => TW_SOURCES[`./bits/tw/${meta.name}.jsx`]().then(code => [{ file: `${meta.name}.jsx`, code }])
    }),
    ...(TW_TS_SOURCES[`./bits/tw-ts/${meta.name}.tsx`] && {
      twTsRegistryUrl: `${window.location.origin}/r/${meta.name}-TS-TW.json`,
      loadTwTsSources: () => TW_TS_SOURCES[`./bits/tw-ts/${meta.name}.tsx`]().then(code => [{ file: `${meta.name}.tsx`, code }])
    })
  };
});
