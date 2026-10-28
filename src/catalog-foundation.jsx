import { useState } from 'react';
import Sprite from './pixel/Sprite';
import PixelButton from './bits/PixelButton';
import RetroHorizon from './bits/RetroHorizon';
import FlickerGrid from './bits/FlickerGrid';
import Accordion from './bits/Accordion';
import { Dialog, Sheet, Tooltip, Popover, Dropdown } from './bits/OverlayKit';
import { Switch, Checkbox, RadioGroup, BellToggle } from './bits/ToggleKit';
import retroHorizonSource from './bits/RetroHorizon.jsx?raw';
import flickerGridSource from './bits/FlickerGrid.jsx?raw';
import accordionSource from './bits/Accordion.jsx?raw';
import overlayKitSource from './bits/OverlayKit.jsx?raw';
import toggleKitSource from './bits/ToggleKit.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });
const text = (name, label) => ({ name, type: 'text', label });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", monospace';
const stack = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18, justifyItems: 'center', width: '100%', padding: '32px 0' };
const row = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 };
const hint = { margin: 0, color: '#94b0c2', font: `14px/1.4 ${PIXEL_FONT}`, textAlign: 'center' };
// Theme the overlay and toggle kits once, through their CSS variables.
const kitTheme = { '--bl-ok-font': PIXEL_FONT, '--bl-ok-radius': '6px', '--bl-tk-font': PIXEL_FONT };

// ---------- Accordion ----------

const FAQ = [
  { id: 'start', icon: <Sprite name="grass" size={18} />, title: 'How do I start a new world?', content: [<p key="a">Pick a seed (or leave it blank for a random one), choose a difficulty and press Play.</p>, <p key="b">Your first night arrives after about ten minutes, so collect wood straight away.</p>] },
  { id: 'save', icon: <Sprite name="book" size={18} />, title: 'Is my progress saved?', content: 'Worlds autosave every five minutes and whenever you open your inventory.' },
  { id: 'multi', icon: <Sprite name="heart" size={18} />, title: 'Can I play with friends?', content: [<p key="a">Yes. Open your world to the network from the pause menu, then share the invite code.</p>, <p key="b">Up to eight players can join one world.</p>, <p key="c">Everyone keeps their own inventory.</p>] },
  { id: 'mods', icon: <Sprite name="potion" size={18} />, title: 'Do mods work on every platform?', content: 'Mods work on desktop. Consoles get a curated set of add-ons instead.', disabled: false }
];

// ---------- Overlays ----------

function OverlayDemo() {
  const [log, setLog] = useState('Try each control. Every overlay shares the same motion tokens.');
  const button = (label, variant = 'secondary', extra = {}) => (
    <PixelButton size="sm" variant={variant} {...extra}>
      {label}
    </PixelButton>
  );
  return (
    <div style={{ ...stack, ...kitTheme }}>
      <div style={row}>
        <Dialog
          trigger={button('Dialog', 'primary')}
          title="Leave the world?"
          description="Unsaved progress since the last autosave will be lost."
          style={kitTheme}
        >
          {({ close }) => (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <PixelButton size="sm" variant="secondary" onPress={close} data-autofocus>
                Stay
              </PixelButton>
              <PixelButton
                size="sm"
                variant="primary"
                onPress={() => {
                  setLog('You left the world.');
                  close();
                }}
              >
                Leave
              </PixelButton>
            </div>
          )}
        </Dialog>
        <Sheet trigger={button('Sheet', 'info')} title="Settings" description="Changes apply immediately." side="right" style={kitTheme}>
          <div style={{ display: 'grid', gap: 14 }}>
            <Switch label="Music" defaultChecked />
            <Switch label="Sound effects" defaultChecked />
            <Switch label="Show coordinates" />
          </div>
        </Sheet>
        <Tooltip content="Your coordinates: 120, 64, -40" style={kitTheme}>
          {button('Tooltip')}
        </Tooltip>
        <Popover trigger={button('Popover', 'success')} label="Quick craft" style={kitTheme}>
          {({ close }) => (
            <div style={{ display: 'grid', gap: 10, minWidth: 220 }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sprite name="pickaxe" size={18} /> Quick craft
              </strong>
              <span style={{ color: '#94b0c2', fontSize: 13 }}>3 diamonds + 2 sticks</span>
              <PixelButton
                size="sm"
                variant="success"
                onPress={() => {
                  setLog('Crafted a diamond pickaxe.');
                  close();
                }}
              >
                Craft pickaxe
              </PixelButton>
            </div>
          )}
        </Popover>
        <Dropdown
          trigger={button('Dropdown ▾', 'warning')}
          label="World actions"
          style={kitTheme}
          items={[
            { type: 'label', label: 'World' },
            { label: 'Save', icon: <Sprite name="book" size={16} />, shortcut: '⌘S', onSelect: () => setLog('World saved.') },
            { label: 'Share invite', icon: <Sprite name="heart" size={16} />, onSelect: () => setLog('Invite copied.') },
            { label: 'Export map', icon: <Sprite name="orb" size={16} />, disabled: true },
            { type: 'separator' },
            { label: 'Delete world', icon: <Sprite name="sword" size={16} />, danger: true, onSelect: () => setLog('Deletion cancelled (demo).') }
          ]}
        />
      </div>
      <p style={hint}>{log}</p>
    </div>
  );
}

// ---------- Toggles ----------

function ToggleDemo({ size, accentColor }) {
  const [all, setAll] = useState([true, false, true]);
  const names = ['Torches', 'Bread', 'Spare pickaxe'];
  const count = all.filter(Boolean).length;
  return (
    <div style={{ ...stack, ...kitTheme, gap: 26, justifyItems: 'start', maxWidth: 520, margin: '0 auto', padding: '32px 16px' }}>
      <div style={{ display: 'grid', gap: 12 }}>
        <Switch size={size} color={accentColor} label="Peaceful mode" description="No monsters spawn at night." defaultChecked />
        <Switch size={size} color={accentColor} label="Hardcore" description="One life. Disabled for this world." disabled />
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        <Checkbox size={size} color={accentColor} label="Pack everything" checked={count === 3} indeterminate={count > 0 && count < 3} onCheckedChange={on => setAll([on, on, on])} />
        <div style={{ display: 'grid', gap: 10, paddingLeft: 32 }}>
          {names.map((name, i) => (
            <Checkbox key={name} size={size} color={accentColor} label={name} checked={all[i]} onCheckedChange={on => setAll(prev => prev.map((v, j) => (j === i ? on : v)))} />
          ))}
        </div>
      </div>
      <RadioGroup
        size={size}
        color={accentColor}
        label="Difficulty"
        orientation="horizontal"
        defaultValue="normal"
        options={[
          { value: 'easy', label: 'Easy' },
          { value: 'normal', label: 'Normal' },
          { value: 'hard', label: 'Hard', description: 'Hunger drains faster.' }
        ]}
      />
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <BellToggle size={size} color={accentColor} label="Quest alerts" defaultPressed />
        <BellToggle size={size} color={accentColor} label="Trade offers" />
      </div>
    </div>
  );
}

// ---------- Entries ----------

const DEMO_ENTRIES = {
  'retro-horizon': {
    source: retroHorizonSource,
    defaults: { speed: 1, horizon: 0.55, pixelSize: 3, showSun: true, showMountains: true, gridColor: '#73eff7', skyBottom: '#5d275d' },
    controls: [slider('speed', 'Speed', 0, 4, 0.1), slider('horizon', 'Horizon', 0.3, 0.8, 0.01), slider('pixelSize', 'Pixel size', 1, 8, 1), toggle('showSun', 'Sun'), toggle('showMountains', 'Mountains'), color('gridColor', 'Grid'), color('skyBottom', 'Sky (bottom)')],
    docs: [
      ['speed', 'number', '1', 'Grid rows per second rolling toward you (0 to hold still).'],
      ['horizon', 'number', '0.55', 'Horizon height as a share of the box.'],
      ['pixelSize', 'number', '3', 'Render scale: each art pixel becomes this many screen pixels (1 for smooth).'],
      ['gridSpacing / gridLines', 'number', '12 / 24', 'Vertical line spacing and number of horizontal lines.'],
      ['showSun / showMountains / stars', 'boolean / boolean / number', 'true / true / 60', 'Scene layers.'],
      ['skyTop / skyBottom / sunTop / sunBottom / mountainColor / gridColor / floorColor', 'string (hex)', 'Sweetie 16', 'Colors.'],
      ['Layout', '-', '-', 'Fills its parent; put content on top with absolute positioning. Pauses off-screen; still under reduced motion.']
    ],
    usage: `import RetroHorizon from "./RetroHorizon";

<div style={{ position: "relative", height: 480 }}>
  <RetroHorizon
    speed={1}
  />
</div>`,
    fullBleed: true,
    render: props => (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <RetroHorizon {...props} />
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'start center', paddingTop: '9%', pointerEvents: 'none' }}>
          <span style={{ font: `clamp(14px, 3vw, 26px) ${TITLE_FONT}`, color: '#f4f4f4', textShadow: '3px 3px 0 #b13e53' }}>NIGHT DRIVE</span>
        </div>
      </div>
    )
  },

  'flicker-grid': {
    source: flickerGridSource,
    defaults: { text: 'BITS LAB', squareSize: 4, gap: 4, flickerChance: 1.5, maxOpacity: 0.35, color: '#566c86', maskColor: '#73eff7' },
    controls: [text('text', 'Mask text'), slider('squareSize', 'Square size', 2, 12, 1), slider('gap', 'Gap', 1, 10, 1), slider('flickerChance', 'Flickers per second', 0, 6, 0.1), slider('maxOpacity', 'Max opacity', 0.05, 1, 0.05), color('color', 'Squares'), color('maskColor', 'Mask')],
    docs: [
      ['squareSize / gap', 'number', '4 / 4', 'Cell size and spacing in px.'],
      ['flickerChance / maxOpacity', 'number', '1.5 / 0.35', 'How often each cell re-rolls per second, and its brightest value.'],
      ['text / fontSize / fontWeight / fontFamily', 'string / number', '- / 120 / 800', 'A word that emerges from the grid. Long text shrinks to fit.'],
      ['maskSrc', 'string', '-', 'An image (logo) to use as the mask instead of text; its opaque pixels count.'],
      ['color / maskColor / maskOpacity', 'string / number', 'slate / cyan / 0.95', 'Colors of the noise and of the masked shape.'],
      ['label', 'string', 'text', 'Accessible name (the mask text is used when present).'],
      ['Layout', '-', '-', 'Fills its parent. Pauses off-screen; frozen under reduced motion.']
    ],
    usage: `import FlickerGrid from "./FlickerGrid";

<div style={{ position: "relative", height: 400 }}>
  <FlickerGrid
    text="BITS LAB"
  />
</div>`,
    fullBleed: true,
    render: props => <FlickerGrid {...props} fontFamily={TITLE_FONT} />
  },

  accordion: {
    source: accordionSource,
    defaults: { type: 'single', collapsible: true, stiffness: 260, damping: 22, stagger: 45, radius: 6 },
    controls: [select('type', 'Type', ['single', 'multiple']), toggle('collapsible', 'Collapsible (single)'), slider('stiffness', 'Spring stiffness', 80, 600, 10), slider('damping', 'Spring damping', 8, 40, 1), slider('stagger', 'Content stagger (ms)', 0, 120, 5), slider('radius', 'Radius', 0, 24, 1)],
    docs: [
      ['items', '{ id?, title, content, icon?, disabled? }[]', '[]', 'Sections. content can be a string or nodes; each direct child staggers in.'],
      ['type / collapsible', '"single" | "multiple" / boolean', '"single" / true', 'One or many open; whether the open one can close in single mode.'],
      ['value / defaultValue / onValueChange', 'string | string[]', '-', 'Controlled or uncontrolled open section(s).'],
      ['stiffness / damping', 'number', '260 / 22', 'The opening spring (rendered as a CSS linear() easing).'],
      ['stagger', 'number', '45', 'Delay between content children appearing, in ms.'],
      ['headingLevel', 'number', '3', 'Heading level wrapping each trigger (2–6).'],
      ['springEasing(options)', 'function', 'export', 'The spring-to-linear() generator, reusable for your own animations.']
    ],
    usage: `import Accordion from "./Accordion";

<Accordion
  items={[{ title: "Is my progress saved?", content: "Every five minutes." }]}
/>`,
    render: props => (
      <div style={{ ...stack, padding: '32px 16px' }}>
        <Accordion key={`${props.type}-${props.collapsible}`} {...props} items={FAQ} defaultValue="start" fontFamily={PIXEL_FONT} />
      </div>
    )
  },

  'overlay-kit': {
    source: overlayKitSource,
    defaults: {},
    controls: [],
    docs: [
      ['Dialog', '{ trigger, title, description, children | ({ close }), open?, onOpenChange?, width? }', '-', 'Modal: focus trap, scroll lock, Esc, focus return. Mark a button data-autofocus to focus it first.'],
      ['Sheet', 'Dialog props + side: "right" | "left" | "bottom" | "top"', '"right"', 'A modal panel that slides in from an edge.'],
      ['Tooltip', '{ content, children (one element), side?, align?, delay?, closeDelay? }', 'top · 400ms', 'Shows on hover (after a delay) and focus; stays while you hover it; Esc hides.'],
      ['Popover', '{ trigger, children | ({ close }), label, side?, align?, width? }', 'bottom', 'Non-modal panel; Esc or a click outside closes; focus moves in and returns.'],
      ['Dropdown', '{ trigger, items, label, side?, align? }', 'bottom start', 'Menu: arrows, Home/End, typeahead, Enter. Items: { label, icon, shortcut, onSelect, disabled, danger } or { type: "separator" | "label" }.'],
      ['MOTION', 'object', 'export', 'Shared durations (fast 140, base 220, slow 320 ms) and curves (easeOut, easeIn, spring).'],
      ['Theme', 'CSS variables', '-', '--bl-ok-bg, --bl-ok-ink, --bl-ok-muted, --bl-ok-line, --bl-ok-accent, --bl-ok-radius, --bl-ok-font (set on :root or via style).']
    ],
    usage: `import { Dialog, Tooltip, Dropdown } from "./OverlayKit";

<Dialog trigger={<button>Leave</button>} title="Leave the world?">
  {({ close }) => <button onClick={close}>Stay</button>}
</Dialog>`,
    render: () => <OverlayDemo />
  },

  'toggle-kit': {
    source: toggleKitSource,
    defaults: { size: 'md', accentColor: '#73eff7' },
    controls: [select('size', 'Size', ['sm', 'md', 'lg']), color('accentColor', 'Accent')],
    docs: [
      ['Switch', '{ checked?, defaultChecked?, onCheckedChange?, label?, description?, disabled?, size?, color?, name?, value? }', 'md', 'A native checkbox with role="switch"; the thumb stretches while pressed and springs across.'],
      ['Checkbox', 'Switch props + indeterminate?', 'md', 'A native checkbox; the check draws itself; indeterminate shows a dash.'],
      ['Radio', '{ checked, onChange, name, value, label?, description? }', '-', 'A single native radio, for custom layouts.'],
      ['RadioGroup', '{ options, value?, defaultValue?, onValueChange?, label?, orientation?, name? }', 'vertical', 'A fieldset with a legend; arrow keys move between options natively.'],
      ['BellToggle', '{ pressed?, defaultPressed?, onPressedChange?, label?, showLabel?, disabled?, size?, color? }', 'md', 'A toggle button (aria-pressed) with a pixel bell that rings when switched on and shows a slash when off; label is its name.'],
      ['Theme', 'CSS variables', '-', '--bl-tk-accent, --bl-tk-track, --bl-tk-ink, --bl-tk-muted, --bl-tk-on-ink, --bl-tk-font; or the color prop per control.'],
      ['Forms', '-', '-', 'name / value submit with the form like plain inputs, because they are plain inputs.']
    ],
    usage: `import { Switch, Checkbox, RadioGroup, BellToggle } from "./ToggleKit";

<Switch label="Peaceful mode" defaultChecked />
<BellToggle label="Quest alerts" />
<Checkbox label="Pack torches" />
<RadioGroup label="Difficulty" options={[{ value: "easy", label: "Easy" }]} />`,
    demoOnly: ['accentColor'],
    render: props => <ToggleDemo {...props} />
  }
};

export const FOUNDATION_DEMOS = DEMO_ENTRIES;
