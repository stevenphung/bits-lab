import { useState } from 'react';
import Sprite from './pixel/Sprite';
import PixelPet from './bits/PixelPet';
import EmptyScenes from './bits/EmptyScenes';
import PartyInvite from './bits/PartyInvite';
import PartyFormation from './bits/PartyFormation';
import LayerTower from './bits/LayerTower';
import WindowPile from './bits/WindowPile';
import ChestReveal from './bits/ChestReveal';
import LogoBurst from './bits/LogoBurst';
import pixelPetSource from './bits/PixelPet.jsx?raw';
import emptyScenesSource from './bits/EmptyScenes.jsx?raw';
import partyInviteSource from './bits/PartyInvite.jsx?raw';
import partyFormationSource from './bits/PartyFormation.jsx?raw';
import layerTowerSource from './bits/LayerTower.jsx?raw';
import windowPileSource from './bits/WindowPile.jsx?raw';
import chestRevealSource from './bits/ChestReveal.jsx?raw';
import logoBurstSource from './bits/LogoBurst.jsx?raw';

// Demo config for Wave 5, Phase C: Scenes & Mascots.

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });

const ghost = { padding: '6px 10px', border: 0, background: '#262b44', color: '#f4f4f4', font: 'inherit', fontSize: 12, fontWeight: 800, cursor: 'pointer' };

const SAY = {
  idle: 'Hi! Point somewhere and I’ll look.',
  happy: 'Quest complete!',
  thinking: undefined,
  sad: 'Something went wrong.'
};

function PetDemo(props) {
  const [pets, setPets] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
      <PixelPet {...props} say={pets ? `Pets: ${pets}` : SAY[props.mood]} onPet={() => setPets(n => n + 1)} />
    </div>
  );
}

const ACTIONS = { chest: 'Browse the shop', campfire: 'Start a chat', shop: 'Clear filters', offline: 'Try again', lost: 'Back to home' };

const MEMBERS = [
  { id: 'mira', name: 'Mira', role: 'Designer', color: '#73eff7' },
  { id: 'jo', name: 'Jo Park', role: 'Engineer', color: '#a7f070' }
];
const CANDIDATES = [
  { id: 'sam', name: 'Sam', role: 'PM', color: '#ffcd75' },
  { id: 'lee', name: 'Lee Chen', role: 'Support', color: '#ef7d57' },
  { id: 'ava', name: 'Ava', role: 'Data', color: '#41a6f6' }
];

const AGENTS = [
  { id: 'plan', name: 'Planner', role: 'Leader', status: 'Splits the brief into tasks.', gear: ['Brief', 'Roadmap'], color: '#ffcd75', icon: <Sprite name="book" size={22} /> },
  { id: 'scout', name: 'Scout', role: 'Research', status: 'Reads the market and the docs.', gear: ['Web search', 'Notes'], color: '#73eff7', icon: <Sprite name="orb" size={22} /> },
  { id: 'smith', name: 'Smith', role: 'Builder', status: 'Writes the page and the copy.', gear: ['Code', 'Browser'], color: '#a7f070', icon: <Sprite name="pickaxe" size={22} /> },
  { id: 'sage', name: 'Sage', role: 'Reviewer', status: 'Checks tone, links and a11y.', gear: ['Checklist'], color: '#ef7d57', icon: <Sprite name="potion" size={22} /> }
];

function FormationDemo(props) {
  const [formed, setFormed] = useState(false);
  return (
    <div style={{ display: 'grid', gap: 10, justifyItems: 'center', width: '100%' }}>
      <PartyFormation key={props.trigger} {...props} quest="Ship the launch page" members={AGENTS} formed={props.trigger === 'button' ? formed : undefined} onFormedChange={setFormed} />
      {props.trigger === 'button' && formed && (
        <button type="button" style={ghost} onClick={() => setFormed(false)}>
          Disband
        </button>
      )}
    </div>
  );
}

const LAYERS = [
  { id: 'app', label: 'Your app', description: 'Screens, routes and your own business logic.', color: '#73eff7' },
  { id: 'bits', label: 'Bits Lab', description: 'Game-feel components: quests, toasts, meters and scenes.', color: '#a7f070' },
  { id: 'react', label: 'React 19', description: 'Rendering, state and effects.', color: '#41a6f6' },
  { id: 'web', label: 'The browser', description: 'CSS, SVG and the DOM do the drawing.', color: '#ffcd75' }
];

const WINDOWS = [
  { id: 'inbox', title: 'Inbox (12)' },
  { id: 'roadmap', title: 'Q3 roadmap.pdf' },
  { id: 'design', title: 'Onboarding designs' },
  { id: 'pr', title: 'Pull request 482', body: 'Two reviewers approved. Checks are green.' },
  { id: 'billing', title: 'Docs: billing' },
  { id: 'notes', title: 'Standup notes' }
];

function PileDemo(props) {
  const [picked, setPicked] = useState(null);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'center' }}>
      <WindowPile {...props} windows={WINDOWS} onSelect={win => setPicked(win.title)} />
      <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>{picked ? `Opened: ${picked}` : 'Point at the pile, then click a window.'}</p>
    </div>
  );
}

const LOOT = [
  { id: 'gem', label: 'Themes', icon: <Sprite name="gem" size={22} /> },
  { id: 'potion', label: 'Boosts', icon: <Sprite name="potion" size={22} /> },
  { id: 'coin', label: 'Credits', icon: <Sprite name="coin" size={22} /> },
  { id: 'book', label: 'Guides', icon: <Sprite name="book" size={22} /> },
  { id: 'star', label: 'Badges', icon: <Sprite name="star" size={22} /> }
];

const LOGOS = [
  { id: 'mail', label: 'Mail', icon: <Sprite name="note" size={26} /> },
  { id: 'docs', label: 'Docs', icon: <Sprite name="book" size={26} /> },
  { id: 'pay', label: 'Payments', icon: <Sprite name="coin" size={26} /> },
  { id: 'store', label: 'Storage', icon: <Sprite name="chest" size={26} /> },
  { id: 'ai', label: 'AI', icon: <Sprite name="orb" size={26} /> },
  { id: 'crm', label: 'CRM', icon: <Sprite name="heart" size={26} /> },
  { id: 'data', label: 'Analytics', icon: <Sprite name="gem" size={26} /> },
  { id: 'chat', label: 'Chat', icon: <Sprite name="star" size={26} /> }
];

export const SCENES_DEMOS = {
  'pixel-pet': {
    source: pixelPetSource,
    defaults: { mood: 'idle', size: 96, follow: true, bodyColor: '#a7f070', shadeColor: '#38b764' },
    controls: [select('mood', 'Mood', ['idle', 'happy', 'thinking', 'sad']), slider('size', 'Size', 48, 192, 8), toggle('follow', 'Eyes follow the pointer'), color('bodyColor', 'Body'), color('shadeColor', 'Shade')],
    docs: [
      ['mood', '"idle" | "happy" | "thinking" | "sad"', '"idle"', 'The face and motion. Thinking shows a dots bubble when there is no say text.'],
      ['say', 'ReactNode', '-', 'Speech bubble text, read politely when it changes.'],
      ['follow / onPet', 'boolean / (event) => void', 'true / -', 'Eyes track the pointer; with onPet the pet is a button that hops when pressed.'],
      ['size / label / colours', 'number / string / string', '96 / "Pixel pet"', 'Size in px, accessible name, and bodyColor, shadeColor, shineColor, outlineColor, cheekColor, tearColor plus the bubble colours.'],
      ['Accessibility', '-', '-', 'One labelled image (or button) whose name includes the mood. Reduced motion: no float, blink or hop.']
    ],
    usage: `import PixelPet from "./PixelPet";

<PixelPet mood={saving ? "thinking" : "happy"} say={saving ? undefined : "All saved!"} />`,
    render: props => <PetDemo {...props} />
  },

  'empty-scenes': {
    source: emptyScenesSource,
    defaults: { scene: 'chest', width: 360, artWidth: 160, accentColor: '#73eff7' },
    controls: [select('scene', 'Scene', ['chest', 'campfire', 'shop', 'offline', 'lost']), slider('width', 'Width', 260, 480, 10), slider('artWidth', 'Art width', 96, 256, 8), color('accentColor', 'Button')],
    docs: [
      ['scene', '"chest" | "campfire" | "shop" | "offline" | "lost"', '"chest"', 'Empty items, no messages, no results, offline, and not found.'],
      ['title / message', 'ReactNode', 'per scene', 'Override the default heading and help text.'],
      ['action / actionLabel / onAction', 'ReactNode / string / () => void', '-', 'Your own action node, or a built-in button.'],
      ['width / artWidth / colours', 'number / string', '360 / 160', 'Card and art width, and backgroundColor, lineColor, textColor, mutedColor, accentColor.'],
      ['Accessibility', '-', '-', 'A labelled section; the art is decorative and the text carries the meaning. Reduced motion: still scenes.']
    ],
    usage: `import EmptyScenes from "./EmptyScenes";

{results.length === 0 && <EmptyScenes scene="shop" actionLabel="Clear filters" onAction={clearFilters} />}`,
    render: props => <EmptyScenes {...props} actionLabel={ACTIONS[props.scene]} onAction={() => {}} />
  },

  'party-invite': {
    source: partyInviteSource,
    defaults: { slots: 4, width: 420, doneColor: '#38b764', accentColor: '#73eff7' },
    controls: [slider('slots', 'Slots', 3, 6, 1), slider('width', 'Width', 340, 560, 10), color('doneColor', 'Online / link'), color('accentColor', 'Accent')],
    docs: [
      ['members / candidates', '{ id, name, role?, avatar?, color?, online? }[]', '[] / []', 'Who is in the party, and who can be invited.'],
      ['slots / onInvite', 'number / (person) => void', '4 / -', 'Party size, and a callback when someone joins.'],
      ['title / hint / inviteLabel / openLabel', 'string', '"Your party" / … / "Invite" / "Open slot"', 'Text.'],
      ['Accessibility', '-', '-', 'Every drag has an Invite button; joins are announced; online state is in text. Reduced motion: no pop.']
    ],
    usage: `import PartyInvite from "./PartyInvite";

<PartyInvite members={team} candidates={suggested} slots={5} onInvite={person => sendInvite(person.id)} />`,
    render: props => <PartyInvite key={props.slots} {...props} members={MEMBERS} candidates={CANDIDATES} />
  },

  'party-formation': {
    source: partyFormationSource,
    defaults: { trigger: 'button', minWidth: 140, width: 560, goldColor: '#ffcd75' },
    controls: [select('trigger', 'Start', ['button', 'view', 'mount']), slider('minWidth', 'Card min width', 110, 220, 10), slider('width', 'Width', 380, 720, 10), color('goldColor', 'Quest banner')],
    docs: [
      ['quest / members', 'ReactNode / { id, name, role?, status?, gear?, icon?, color? }[]', '"Ship the launch page" / []', 'The goal, and the agents (or people) that take it on.'],
      ['formed / defaultFormed / onFormedChange', 'boolean / boolean / (formed) => void', '- / false / -', 'Whether the party has formed.'],
      ['trigger', '"button" | "view" | "mount"', '"button"', 'Form with a button, when scrolled into view, or straight away.'],
      ['formLabel / questLabel / minWidth', 'string / string / number', '"Form party" / "Quest" / 140', 'Text and grid track width.'],
      ['Accessibility', '-', '-', 'Members are a list of real text, hidden until formed; forming is announced. Reduced motion: no fly-in.']
    ],
    usage: `import PartyFormation from "./PartyFormation";

<PartyFormation quest={task.title} members={agents.map(a => ({ id: a.id, name: a.name, role: a.role, gear: a.tools }))} trigger="view" />`,
    render: props => <FormationDemo {...props} />
  },

  'layer-tower': {
    source: layerTowerSource,
    defaults: { width: 560, towerWidth: 200, slabColor: '#566c86' },
    controls: [slider('width', 'Width', 360, 720, 10), slider('towerWidth', 'Tower width', 120, 280, 10), color('slabColor', 'Idle slabs')],
    docs: [
      ['layers', '{ id, label, description?, color? }[]', '[]', 'Top layer first.'],
      ['active / defaultActive / onActiveChange', 'string / string / (id) => void', '- / first layer / -', 'Which layer is out.'],
      ['label / width / towerWidth / colours', 'string / number / string', '"Layers" / 560 / 200', 'Group name, sizes, and slabColor plus the card colours.'],
      ['Accessibility', '-', '-', 'The list is buttons with aria-pressed (hover or focus picks a layer); the tower is decorative. Reduced motion: no slide.']
    ],
    usage: `import LayerTower from "./LayerTower";

<LayerTower layers={[{ id: "ui", label: "Interface", color: "#73eff7" }, { id: "api", label: "API" }, { id: "db", label: "Database" }]} />`,
    render: props => <LayerTower {...props} layers={LAYERS} />
  },

  'window-pile': {
    source: windowPileSource,
    defaults: { spread: 34, windowWidth: 220, width: 420, accentColor: '#73eff7' },
    controls: [slider('spread', 'Spread', 16, 60, 2), slider('windowWidth', 'Window width', 160, 300, 10), slider('width', 'Width', 320, 560, 10), color('accentColor', 'Highlight')],
    docs: [
      ['windows', '{ id, title, body? }[]', '[]', 'Back to front. Without a body a window gets placeholder lines.'],
      ['onSelect', '(window) => void', '-', 'Called when a window is clicked or pressed.'],
      ['spread / windowWidth / windowHeight / width', 'number', '34 / 220 / 104 / 420', 'Offset between windows and their size.'],
      ['Accessibility', '-', '-', 'A list of buttons; focus moves the highlight too. Reduced motion: no lift.']
    ],
    usage: `import WindowPile from "./WindowPile";

<WindowPile windows={openTabs.map(t => ({ id: t.id, title: t.title }))} onSelect={tab => focusTab(tab.id)} />`,
    render: props => <PileDemo {...props} />
  },

  'chest-reveal': {
    source: chestRevealSource,
    defaults: { trigger: 'hover', size: 120, radius: 96 },
    controls: [select('trigger', 'Open on', ['hover', 'click']), slider('size', 'Chest size', 64, 192, 8), slider('radius', 'Fan radius', 60, 140, 4)],
    docs: [
      ['items', '{ id, label, icon }[]', '[]', 'What fans out of the chest.'],
      ['open / defaultOpen / onOpenChange', 'boolean / boolean / (open) => void', '- / false / -', 'Whether the lid is open.'],
      ['trigger', '"hover" | "click"', '"hover"', 'Hover opens with a mouse; pressing always toggles.'],
      ['label / caption / size / radius', 'string / ReactNode / number / number', '"Open the chest" / - / 120 / 96', 'Button name, a line under the chest, and sizes.'],
      ['Accessibility', '-', '-', 'The chest is a button with aria-expanded controlling a real list. Reduced motion: no fan or glow.']
    ],
    usage: `import ChestReveal from "./ChestReveal";

<ChestReveal label="See what’s in Pro" caption="Pro plan perks" items={perks} />`,
    render: props => <ChestReveal key={props.trigger} {...props} items={LOOT} caption="Pro plan perks" />
  },

  'logo-burst': {
    source: logoBurstSource,
    defaults: { trigger: 'view', radius: 120, tileSize: 48, accentColor: '#73eff7' },
    controls: [select('trigger', 'Play', ['view', 'mount', 'hover']), slider('radius', 'Radius', 80, 180, 4), slider('tileSize', 'Tile size', 32, 64, 2), color('accentColor', 'Centre tile')],
    docs: [
      ['logos', '{ id, label, icon }[]', '[]', 'The integrations; icon is a node or an image URL.'],
      ['center', 'ReactNode', '"B"', 'Your product in the middle.'],
      ['trigger / replay', '"view" | "mount" | "hover" / boolean', '"view" / true', 'When it bursts, and whether a Replay button appears afterwards.'],
      ['label / radius / tileSize / colours', 'string / number / number / string', '"Integrations" / 120 / 48', 'List name, ring size and tiles.'],
      ['Accessibility', '-', '-', 'A labelled list of named logos. Reduced motion: the ring is shown settled.']
    ],
    usage: `import LogoBurst from "./LogoBurst";

<LogoBurst center={<img src="/logo.svg" alt="" />} logos={integrations.map(i => ({ id: i.id, label: i.name, icon: i.logoUrl }))} />`,
    render: props => <LogoBurst key={props.trigger} {...props} logos={LOGOS} center={<Sprite name="star" size={34} />} />
  }
};
