// What to render for each Tailwind variant in the parity check. A fixture is
// { label, props, width, height, settle, render?(Component, module) }: the same props go to both versions, inside
// a stage of the given size. Without an entry, a component renders once with its defaults.
// Add fixtures that reach other states through props (open, status, data…).

import { useEffect, useRef } from 'react';

export const DEFAULT_FIXTURE = { label: 'defaults', props: {} };

const IDEAS = ['Plan a cosy cabin build', 'Name my pet slime', 'Write a quest for a lost compass', 'Explain redstone like I’m five', 'Design a castle in the clouds', 'Invent a new potion'];

const box = (background, height = 80) => <div style={{ height, background, borderRadius: 8 }} />;

// ConnectBeams needs a container and two nodes to join.
function Beams({ C }) {
  const container = useRef(null);
  const a = useRef(null);
  const b = useRef(null);
  return (
    <div ref={container} style={{ position: 'relative', height: 300 }}>
      <div ref={a} style={{ position: 'absolute', left: 30, top: 40, width: 60, height: 60, background: '#333c57' }} />
      <div ref={b} style={{ position: 'absolute', right: 30, bottom: 40, width: 60, height: 60, background: '#333c57' }} />
      <C containerRef={container} beams={[{ from: a, to: b }]} />
    </div>
  );
}

// ToastStack: show a few toasts from the same module instance the frame renders.
function Toasts({ C, toast }) {
  useEffect(() => {
    toast.success('Saved', { description: 'All good', duration: 60000 });
    toast.loading('Uploading', { duration: 60000 });
    toast('Hello', { action: { label: 'Undo', onClick: () => {} }, duration: 60000 });
  }, [toast]);
  return <C contained position="bottom-right" />;
}

const SECTIONS = ['One', 'Two', 'Three'].map(t => (
  <section key={t} style={{ height: 120 }}>
    <h3 style={{ margin: 0 }}>{t}</h3>
    <p style={{ margin: 0 }}>Some text.</p>
  </section>
));

// AchievementToast: fire a few from the same module instance the frame renders.
function Achievements({ C, fire }) {
  useEffect(() => {
    fire({ title: 'Diamonds!', description: 'Mine your first diamond.', xp: 50, icon: <span>◆</span>, duration: 60000 });
    fire({ title: 'Bronze', tier: 'bronze', description: 'Craft a pick.', duration: 60000 });
  }, [fire]);
  return <C contained duration={60000} position="bottom-left" />;
}

// OverlayKit Dropdown has no open prop: click its trigger once mounted.
function OpenDropdown({ mod }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.querySelector('button').click();
  }, []);
  return (
    <div ref={ref} style={{ padding: 60 }}>
      <mod.Dropdown trigger={<button>Menu</button>} items={[{ type: 'label', label: 'World' }, { label: 'Rename', shortcut: 'R' }, { type: 'separator' }, { label: 'Delete', danger: true }, { label: 'Off', disabled: true }]} />
    </div>
  );
}

const QUEST_DATA = [
  { id: 'create', title: 'Create your character', description: 'Pick a name.', xp: 50 },
  { id: 'equip', title: 'Equip a pickaxe', description: 'Drag it to your hand.', xp: 30, requires: ['create'] },
  { id: 'mine', title: 'Mine a gem', xp: 80, requires: ['equip'] }
];
const RAIL = [
  { title: 'Play', items: [
    { id: 'home', label: 'Home', icon: <span>⌂</span> },
    { id: 'quests', label: 'Quests', icon: <span>★</span>, badge: 3 },
    { id: 'inv', label: 'Inventory', icon: <span>▣</span>, children: [{ id: 'w', label: 'Weapons', icon: <span>/</span> }, { id: 'p', label: 'Potions', icon: <span>▲</span> }] }
  ] }
];
const CODE = [
  { name: 'App.jsx', code: 'import x from "./x";\n// comment\nexport default function App() {\n  return <div className="a">{42}</div>;\n}' },
  { name: 'fix.diff', diff: true, code: ' const a = 1;\n-const b = 2;\n+const b = 3;' }
];
const STORY_SECTIONS = ['Plains', 'Forest', 'Desert'].map(t => ({ id: t, title: t, body: `${t} body text.`, media: <img src={`/pixel/biome-${t.toLowerCase()}.png`} alt="" /> }));
const FAQ_ITEMS = [
  { id: 'a', icon: <span>★</span>, title: 'How do I start?', content: [<p key="1">Pick a seed.</p>, <p key="2">Press play.</p>] },
  { id: 'b', title: 'Is it saved?', content: 'Autosave every five minutes.' },
  { id: 'c', title: 'Disabled', content: 'x', disabled: true }
];

// Reach a state that only interaction sets: run a step on the rendered component after mount.
function After({ run, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const id = setTimeout(() => run(ref.current.firstElementChild), 50);
    return () => clearTimeout(id);
  }, [run]);
  return <div ref={ref}>{children}</div>;
}
const press = el => el.setAttribute('data-pressed', '');
const activate = el => el.setAttribute('data-active', '');
const holdFirst = el => el.querySelector('button')?.setAttribute('data-held', '');
const clickButton = el => el.querySelector('button')?.click();
const clickMore = el => el.querySelector('button[aria-haspopup]')?.click();
const burst = el => el.setAttribute('data-burst', '');
const lit = el => el.setAttribute('data-lit', '');
const setAttr = (name, value = '') => el => el.setAttribute(name, value);
const holding = setAttr('data-state', 'holding');
const doneState = setAttr('data-state', 'done');
const scrubbing = setAttr('data-scrubbing');
const previewing = setAttr('data-preview');
const flying = setAttr('data-state', 'flying');
const landing = setAttr('data-state', 'landing');
const openSwipeMenu = el => el.querySelector('button[aria-expanded]')?.click();
const W5_ACTIONS = { leftActions: [{ label: 'Read', color: '#38b764' }], rightActions: [{ label: 'Delete', color: '#b13e53' }, { label: 'Later' }] };
const arrowRight = el => {
  el.focus();
  el.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
};
const W3_PHOTOS = ['plains', 'forest', 'desert'].map(b => ({ src: `/pixel/biome-${b}.png`, caption: b }));
const W3_CRUMBS = ['Overworld', 'Plains', 'Village', 'Blacksmith', 'Storage', 'Chest', 'Enchanted pickaxe'].map(label => ({ label }));
const W3_STAGES = [{ label: 'Visited', value: 1000 }, { label: 'Signed up', value: 400 }, { label: 'Paid', value: 90 }];

export const FIXTURES = {
  HoldToConfirm: [
    { label: 'idle', props: { children: 'Hold' } },
    { label: 'holding', settle: 400, render: C => <After run={holding}><C>Hold</C></After> },
    { label: 'done', settle: 900, render: C => <After run={doneState}><C>Hold</C></After> }
  ],
  SwipeActions: [
    { label: 'rest', props: { ...W5_ACTIONS, children: <p style={{ padding: 12 }}>Row</p> } },
    { label: 'menu open', settle: 400, render: C => <After run={openSwipeMenu}><C {...W5_ACTIONS}><p style={{ padding: 12 }}>Row</p></C></After> }
  ],
  Discard: [
    { label: 'whole', props: { children: <p style={{ padding: 20 }}>Note</p> } },
    { label: 'shredded (ended)', settle: 1500, props: { discarded: true, duration: 100, children: <p style={{ padding: 20 }}>Note</p> } },
    { label: 'torn (ended)', settle: 1500, props: { discarded: true, effect: 'tear', duration: 100, children: <p style={{ padding: 20 }}>Note</p> } }
  ],
  RatingPips: [
    { label: 'slider 2.5', props: { defaultValue: 2.5 } },
    { label: 'read-only stars', props: { readOnly: true, value: 4, icon: 'star' } },
    { label: 'preview', settle: 300, render: C => <After run={previewing}><C defaultValue={1} /></After> }
  ],
  ScrubNumber: [
    { label: 'with unit', props: { defaultValue: 5, unit: 'px', handle: 'W', label: 'Width' } },
    { label: 'scrubbing', settle: 300, render: C => <After run={scrubbing}><C defaultValue={5} /></After> }
  ],
  PixelSpinners: ['blocks', 'bar', 'dots', 'hourglass', 'orbit'].map(type => ({ label: type, props: { type, showLabel: type === 'dots' } })),
  ArcadeButtons: [
    { label: 'launch, idle', props: { children: 'Go' } },
    { label: 'launch, landing', settle: 900, render: C => <After run={landing}><C>Go</C></After> },
    { label: 'sling, idle', props: { behavior: 'sling', children: 'Pull' } }
  ],
  CardDeck: [
    { label: 'pile of 3', height: 460, props: { width: 200, height: 260, children: ['A', 'B', 'C'].map(t => <div key={t} style={{ padding: 16 }}>{t}</div>) } },
    { label: 'one visible', height: 460, props: { width: 200, height: 260, visible: 1, children: ['A', 'B'].map(t => <div key={t}>{t}</div>) } }
  ],
  Coverflow: [{ label: 'index 1', height: 460, props: { defaultIndex: 1, itemWidth: 160, height: 260, children: ['A', 'B', 'C', 'D'].map(t => <div key={t} style={{ height: 200, background: '#333c57' }}>{t}</div>) } }],
  MasonryWall: [{ label: 'four notes', height: 420, settle: 900, props: { minColumnWidth: 160, children: [80, 140, 60, 120].map((h, i) => <div key={i} style={{ height: h, background: '#262b44' }}>{i}</div>) } }],
  FeedList: [
    { label: 'selectable', height: 420, props: { onSelect: () => {}, items: [{ id: 1, title: 'Found a gem', body: 'Layer 11', icon: '◆', time: 0 }, { id: 2, title: 'Night falls', tone: '#ffcd75' }] } },
    { label: 'plain list', height: 300, props: { items: [{ id: 1, title: 'Hello' }] } },
    { label: 'empty', height: 200, props: { items: [] } }
  ],
  HotbarDock: [{ label: 'three slots', height: 200, props: { value: 'b', items: [{ id: 'a', label: 'Sword', icon: <span>/</span> }, { id: 'b', label: 'Gems', icon: <span>◆</span>, count: 12 }, { id: 'c', label: 'Map', icon: <span>▣</span> }] } }],
  OverlayMenu: [
    { label: 'closed', props: { items: [{ label: 'Play' }] } },
    { label: 'open', height: 500, settle: 1500, props: { defaultOpen: true, items: [{ label: 'Play', meta: 'New' }, { label: 'Shop', href: '#shop' }], footer: <span>Footer</span> } }
  ],
  TradingCard: [
    { label: 'legendary, stats', height: 420, props: { name: 'Dragon', rarity: 'legendary', image: '/pixel/biome-void.png', stats: [{ label: 'HP', value: 99 }, { label: 'ATK', value: 15 }] } },
    { label: 'common, flipped', height: 420, settle: 900, props: { name: 'Slime', rarity: 'common', back: <span>Back</span>, flipped: true } }
  ],
  GlassPanel: [
    { label: 'frost', props: { children: <p>Glass</p> } },
    { label: 'pixel dither, no sheen', props: { pixel: true, sheen: false, children: <p>Glass</p> } }
  ],
  WheelPicker: [{ label: 'middle option', height: 260, settle: 600, props: { options: ['a', 'b', 'c', 'd', 'e'], defaultValue: 'c' } }],
  AuroraBands: [{ label: 'canvas', props: { style: { height: 160 } } }],
  WarpField: [{ label: 'canvas', props: { style: { height: 160 } } }],
  LightShafts: [{ label: 'canvas', props: { style: { height: 160 } } }],
  LavaLamp: [{ label: 'canvas', props: { style: { height: 160 } } }],
  CodeRain: [{ label: 'canvas', props: { style: { height: 160 } } }],
  DitherField: [{ label: 'canvas', props: { style: { height: 160 } } }],
  ContourLines: [{ label: 'canvas', props: { style: { height: 160 } } }],
  ScanScope: [{ label: 'canvas', props: { style: { height: 160 } } }],
  PointerKit: [{ label: 'area', props: { children: <button type="button">Go</button>, style: { height: 160 } } }],
  Footprints: [{ label: 'area', props: { children: <p>Walk here</p>, style: { height: 160 } } }],
  EdgeFX: [
    { label: 'ants', props: { children: <p style={{ padding: 20 }}>Card</p> } },
    { label: 'energy', props: { mode: 'energy', children: <p style={{ padding: 20 }}>Card</p> } },
    { label: 'glow, lit', settle: 400, render: C => <After run={lit}><C mode="glow" active="hover"><p style={{ padding: 20 }}>Card</p></C></After> },
    { label: 'glow, hover, unlit', props: { mode: 'glow', active: 'hover', children: <p style={{ padding: 20 }}>Card</p> } },
    { label: 'glare, always', props: { mode: 'glare', children: <p style={{ padding: 20 }}>Card</p> } },
    { label: 'hover only (resting)', props: { active: 'hover', children: <p style={{ padding: 20 }}>Card</p> } }
  ],
  Reveal: [
    { label: 'rise, shown', settle: 1500, props: { trigger: 'mount', children: <p>Hello</p> } },
    { label: 'blocks, shown', settle: 1500, props: { effect: 'blocks', trigger: 'mount', children: <p style={{ height: 80 }}>Hello</p> } },
    { label: 'cascade, hidden (off-screen)', height: 300, render: C => <div style={{ paddingTop: 2000 }}><C cascade effect="wipe"><p>One</p><p>Two</p></C></div> },
    { label: 'zoom, hidden (off-screen)', height: 300, render: C => <div style={{ paddingTop: 2000 }}><C effect="zoom"><p>One</p></C></div> }
  ],
  Marquee: [
    { label: 'two lanes, still', settle: 600, props: { items: ['A', 'B', 'C', 'D'].map(t => <span key={t} style={{ padding: 10 }}>{t}</span>), speed: 0 } },
    { label: 'vertical, still', settle: 600, props: { vertical: true, height: 240, items: ['A', 'B', 'C', 'D'].map(t => <span key={t}>{t}</span>), speed: 0 } }
  ],
  GrainFX: [{ label: 'all layers', props: { effects: ['grain', 'dither', 'halftone', 'scanlines', 'blur'], children: <p style={{ height: 120 }}>Texture</p> } }],
  SignalText: [
    { label: 'scramble, settled', settle: 1200, props: { text: 'Signal', trigger: 'mount', duration: 300 } },
    { label: 'flap, settled', settle: 2500, props: { text: 'Gate 4', mode: 'flap', trigger: 'mount', duration: 400 } },
    { label: 'glitch burst', settle: 900, render: C => <After run={burst}><C text="Signal lost" mode="glitch" trigger="hover" /></After> }
  ],
  InkText: [
    { label: 'gradient, stepped', props: { text: 'Insert coin' , fill: 'gradient' } },
    { label: 'shimmer', props: { text: 'Insert coin', fill: 'shimmer' } },
    { label: 'outline, filled', props: { text: 'Insert coin', fill: 'outline', filled: true } },
    { label: 'image', props: { text: 'Insert coin', fill: 'image', image: '/pixel/biome-cherry.png' } }
  ],
  PixelType: [{ label: 'canvas', props: { text: 'HI', trigger: 'mount' } }],
  ProximityType: [{ label: 'rest', props: { text: 'Bend the type', maxWidth: 140, lift: 6 } }],
  ShadowStack: [
    { label: 'extrude', props: { text: 'GAME ON', fontSize: 40 } },
    { label: 'echo', props: { text: 'GAME ON', mode: 'echo', fontSize: 40 } }
  ],
  MarqueeLine: [{ label: 'still', settle: 600, props: { items: ['Season 3', 'Double gems'], speed: 0 } }],
  FocusPull: [
    { label: 'soft (waiting for hover)', props: { text: 'Focus pull', trigger: 'hover' } },
    { label: 'sharp, sweep', settle: 2500, props: { text: 'Focus pull', trigger: 'mount' } },
    { label: 'sharp, snap', settle: 2500, props: { text: 'Focus pull', trigger: 'mount', rack: 'snap' } }
  ],
  TallyUp: [{ label: 'counted, milestones', settle: 2500, props: { value: 70, goal: 100, unit: 'XP', caption: 'Quest XP', milestones: [25, 50, 75], trigger: 'mount', duration: 400 } }],
  PegBoard: [{ label: 'board', props: { height: 200 } }],
  WobbleCard: [
    { label: 'rest', props: { children: <p>Jelly</p> } },
    { label: 'active', render: C => <After run={activate}><C><p>Jelly</p></C></After> }
  ],
  CursorAttractor: [{ label: 'items', props: { children: ['A', 'B', 'C'].map(t => <span key={t}>{t}</span>), justify: 'start' } }],
  JellyBlob: [
    { label: 'rest', settle: 300, props: { idle: false, children: 'Squish' } },
    { label: 'pressed', settle: 300, render: C => <After run={press}><C idle={false}>Squish</C></After> },
    { label: 'disabled', settle: 300, props: { idle: false, disabled: true, children: 'Off' } }
  ],
  Screensaver: [{ label: 'idle mode, waiting', props: { idleAfter: 600000, height: 200, children: <p>App</p> } }],
  Polaroids: [
    { label: 'pile', height: 520, settle: 400, props: { photos: W3_PHOTOS, height: 380 } },
    { label: 'held', height: 520, settle: 400, render: C => <After run={holdFirst}><C photos={W3_PHOTOS} height={380} /></After> }
  ],
  BreadcrumbTrail: [
    { label: 'wide', width: 900, settle: 400, props: { items: W3_CRUMBS } },
    { label: 'folded', width: 360, settle: 400, props: { items: W3_CRUMBS } },
    { label: 'menu open', width: 360, height: 320, settle: 600, render: C => <After run={clickMore}><C items={W3_CRUMBS} /></After> }
  ],
  InlineEdit: [
    { label: 'display', settle: 300, props: { defaultValue: 'Pixel Plains' } },
    { label: 'empty', settle: 300, props: { placeholder: 'Add a motto' } },
    { label: 'editing', settle: 600, render: C => <After run={clickButton}><C defaultValue="Pixel Plains" /></After> }
  ],
  FunnelFlow: [
    { label: 'static', settle: 300, props: { stages: W3_STAGES, particles: false } },
    { label: 'stage focused', settle: 500, render: C => <After run={arrowRight}><C stages={W3_STAGES} particles={false} /></After> }
  ],
  ScrollTypography: [{ label: 'rest', props: { text: 'Speed changes everything', fontSize: 40 } }],
  KineticHeadline: [{ label: 'scroll mode', settle: 300, props: { text: 'Breathe in', mode: 'scroll', minWidth: 85, maxWidth: 125, tint: 0.6 } }],
  HexField: [{ label: 'field', props: { height: 200, wave: false } }],
  CloudSky: [{ label: 'sky', props: { height: 200 } }],
  MegaMenu: [{ label: 'closed', props: { items: [{ label: 'Components', content: <div style={{ width: 300 }}>Panel</div> }, { label: 'Docs', href: '#docs' }] } }],
  PricingFlip: [
    { label: 'monthly', width: 1000, height: 560, props: { plans: [{ id: 'f', name: 'Free', monthly: 0, yearly: 0, features: ['A'], cta: 'Start' }, { id: 'p', name: 'Pro', description: 'Solo', monthly: 12, yearly: 10, features: ['A', 'B'], cta: 'Go', featured: true, badge: 'Popular' }] } },
    { label: 'yearly', width: 1000, height: 560, settle: 1200, props: { defaultPeriod: 'yearly', plans: [{ id: 'f', name: 'Free', monthly: 0, yearly: 0, features: ['A'], cta: 'Start' }, { id: 'p', name: 'Pro', monthly: 12, yearly: 10, features: ['A'], cta: 'Go', featured: true }] } }
  ],
  AgentCard: [
    { label: 'running, open', settle: 600, props: { tool: 'read_file', args: { path: 'a.js' }, status: 'running', startedAt: Date.now(), defaultOpen: true, logs: ['line 1', 'line 2'] } },
    { label: 'done', props: { tool: 'grep', status: 'done', duration: 1200, result: '3 matches', defaultOpen: true } },
    { label: 'error', props: { tool: 'write', status: 'error', error: 'Permission denied', defaultOpen: true } }
  ],
  OTPInput: [
    { label: 'partial', props: { defaultValue: '123' } },
    { label: 'error', props: { defaultValue: '123456', status: 'error', message: 'Wrong code' } },
    { label: 'success, masked', props: { defaultValue: '1234', length: 4, mask: true, status: 'success', message: 'OK' } },
    { label: 'disabled', props: { disabled: true } }
  ],
  ToggleKit: [
    { label: 'switches', render: (C, mod) => <div><mod.Switch label="On" description="Desc" defaultChecked /><mod.Switch label="Off" size="sm" /><mod.Switch label="Disabled" disabled size="lg" /></div> },
    { label: 'checkboxes', render: (C, mod) => <div><mod.Checkbox label="Checked" defaultChecked /><mod.Checkbox label="Mixed" indeterminate /><mod.Checkbox label="Off" description="Desc" disabled /></div> },
    { label: 'bells', settle: 1200, render: (C, mod) => <div><mod.NotifyBell label="On" defaultPressed /><mod.NotifyBell label="Off" size="lg" /><mod.NotifyBell label="Hidden label" showLabel={false} disabled /></div> },
    { label: 'radio group', render: (C, mod) => <mod.RadioGroup label="Pick" defaultValue="b" orientation="horizontal" options={[{ value: 'a', label: 'A' }, { value: 'b', label: 'B', description: 'Bee' }, { value: 'c', label: 'C', disabled: true }]} /> }
  ],
  TagInput: [
    { label: 'chips', props: { defaultValue: ['Torch', 'Rope'], suggestions: ['Torch', 'Rope', 'Map'] } },
    { label: 'max reached', props: { defaultValue: ['A', 'B'], max: 2 } }
  ],
  DateRange: [
    { label: 'range', width: 760, height: 480, props: { defaultValue: { start: new Date(2026, 9, 6), end: new Date(2026, 9, 14) }, minDate: new Date(2026, 9, 2) } },
    { label: 'narrow', width: 520, height: 640, props: { months: 1, defaultValue: { start: new Date(2026, 9, 6), end: new Date(2026, 9, 6) } } }
  ],
  AchievementToast: [{ label: 'two', height: 360, settle: 1200, render: (C, mod) => <Achievements C={C} fire={mod.achievement} /> }],
  QuestLog: [
    { label: 'partial', height: 460, props: { quests: QUEST_DATA, defaultCompleted: ['create'] } },
    { label: 'all done', height: 520, settle: 900, props: { quests: QUEST_DATA, defaultCompleted: ['create', 'equip', 'mine'] } }
  ],
  SideRail: [
    { label: 'open', height: 420, settle: 600, props: { sections: RAIL, defaultValue: 'quests', brand: <b>BITS</b> } },
    { label: 'collapsed', height: 420, settle: 600, props: { sections: RAIL, defaultValue: 'home', defaultCollapsed: true } }
  ],
  StepLoader: [
    { label: 'running', settle: 800, props: { steps: [{ label: 'Wood', description: 'Punch trees' }, { label: 'Planks' }, { label: 'Bench' }], current: 1, onCancel: () => {} } },
    { label: 'error', settle: 800, props: { steps: [{ label: 'Wood' }, { label: 'Planks' }], current: 1, status: 'error', onRetry: () => {} } },
    { label: 'done', settle: 800, props: { steps: [{ label: 'Wood' }, { label: 'Planks' }], current: 2, status: 'done', onDone: () => {} } }
  ],
  ChatBubbles: [{ label: 'thread', height: 460, settle: 900, props: { typing: true, typingName: 'Bob', messages: [{ id: 1, from: 'them', author: 'Bob', avatar: <span>B</span>, text: 'Hi', time: '9:41' }, { id: 2, from: 'them', author: 'Bob', avatar: <span>B</span>, text: 'Trade?', reactions: ['👍'] }, { id: 3, from: 'me', text: 'Sure' }, { id: 4, from: 'me', text: 'What for?' }] } }],
  CodeShowcase: [
    { label: 'revealed', height: 360, settle: 1500, props: { files: CODE, autoPlay: 60000 } },
    { label: 'diff, bare', height: 300, settle: 400, props: { files: CODE, defaultFile: 1, reveal: false, showChrome: false } }
  ],
  StickyReveal: [
    { label: 'fade', width: 760, height: 520, settle: 600, props: { sections: STORY_SECTIONS, sectionHeight: '220px', stageHeight: '200px', stickyTop: '20px' } },
    { label: 'zoom left', width: 760, height: 520, settle: 600, props: { sections: STORY_SECTIONS, effect: 'zoom', mediaSide: 'left', sectionHeight: '220px', stageHeight: '200px' } },
    { label: 'slide', width: 760, height: 520, settle: 600, props: { sections: STORY_SECTIONS, effect: 'slide', sectionHeight: '220px', stageHeight: '200px' } },
    { label: 'narrow', width: 520, height: 520, settle: 600, props: { sections: STORY_SECTIONS } }
  ],
  OverlayKit: [
    { label: 'dialog', height: 420, settle: 800, render: (C, mod) => <mod.Dialog open title="Delete world?" description="This can't be undone.">Body</mod.Dialog> },
    { label: 'sheet left', height: 420, settle: 800, render: (C, mod) => <mod.Sheet open side="left" title="Settings">Body</mod.Sheet> },
    { label: 'sheet bottom', height: 420, settle: 800, render: (C, mod) => <mod.Sheet open side="bottom" title="Share">Body</mod.Sheet> },
    { label: 'popover', height: 320, settle: 800, render: (C, mod) => <div style={{ padding: 60 }}><mod.Popover defaultOpen trigger={<button>Open</button>} label="Info">Popover body</mod.Popover></div> },
    { label: 'dropdown', height: 360, settle: 800, render: (C, mod) => <OpenDropdown mod={mod} /> }
  ],
  Accordion: [
    { label: 'one open', height: 420, settle: 1200, props: { items: FAQ_ITEMS, defaultValue: 'a' } },
    { label: 'closed', props: { items: FAQ_ITEMS } }
  ],
  TextOnPath: [{ label: 'wave', props: {} }, { label: 'circle, guide, still', props: { path: 'circle', showPath: true, speed: 0 } }],
  GravityBox: [{ label: 'at rest', props: { startOn: 'click', height: 260, backgroundColor: '#1a1c2c', children: ['Pixel', 'Bits', 'Lab'].map(t => <span key={t} style={{ padding: 8, background: '#333c57' }}>{t}</span>) } }],
  Minimap: [{ label: 'page', props: { height: 240 } }],
  SketchHighlight: [
    { label: 'underline', props: { trigger: 'load', duration: 1, children: 'Hand-drawn underline' } },
    { label: 'highlight', props: { trigger: 'load', duration: 1, type: 'highlight', children: 'A highlighted phrase' } }
  ],
  CipherCard: [{ label: 'badge', props: { children: <strong>Locked</strong> } }],
  ParallaxCollage: [
    {
      label: 'pieces',
      props: {
        height: 300,
        pieces: [
          { content: box('#b13e53'), x: 10, y: 10, width: 30, depth: 0.2 },
          { src: '/pixel/biome-plains.png', alt: 'Plains', x: 50, y: 40, width: 35, depth: 0.8, rotate: 5 }
        ],
        children: <h2 style={{ margin: 0 }}>Collage</h2>
      }
    }
  ],
  ConnectBeams: [{ label: 'one beam', render: C => <Beams C={C} /> }],
  MorphWords: [{ label: 'words', props: { words: ['Pixel', 'Bits', 'Lab'] } }],
  PixelAvatar: [{ label: 'creature, blink', props: { seed: 'pip', blink: true } }, { label: 'identicon', props: { seed: 'lab', variant: 'identicon' } }],
  ScrollTilt: [{ label: 'image', props: { children: <img src="/pixel/biome-forest.png" alt="Forest" /> } }],
  FocusGrid: [{ label: 'grid', props: { minWidth: 120, children: ['#b13e53', '#38b764', '#41a6f6', '#ffcd75'].map(c => <div key={c}>{box(c)}</div>) } }],
  PressStart: [{ label: 'idle, subtext', props: { subtext: 'Insert coin' } }],
  TracingLine: [{ label: 'sections', height: 420, props: { children: SECTIONS } }],
  CRTPower: [
    { label: 'on', settle: 1200, props: { height: 200, children: <p style={{ margin: 16 }}>Hello</p> } },
    { label: 'off', settle: 1200, props: { height: 200, defaultOn: false, powerOnAtMount: false, children: <p style={{ margin: 16 }}>Hello</p> } }
  ],
  DirectionHover: [{ label: 'closed', props: { children: box('#3b5dc9', 160), overlay: <strong>Overlay</strong> } }],
  DynamicIsland: [
    { label: 'idle', props: { views: { idle: { width: 126, height: 36 } } } },
    { label: 'button, wide', props: { view: 'call', onPress: () => {}, views: { idle: { width: 126, height: 36 }, call: { width: 320, height: 64, label: 'Call', content: <span style={{ padding: 12 }}>Incoming call</span> } } } }
  ],
  ScrollZoom: [{ label: 'image', height: 400, props: { src: '/pixel/biome-plains.png', heading: <h2 style={{ margin: 0 }}>Zoom</h2>, children: <p>Revealed</p> } }],
  Spoiler: [
    { label: 'hidden', props: { children: 'the secret' } },
    { label: 'revealed', props: { defaultRevealed: true, children: 'the secret' } }
  ],
  MorphPopover: [
    { label: 'closed', props: { children: <p style={{ margin: 0 }}>Panel</p> } },
    { label: 'open, centre top', height: 360, settle: 900, render: C => <div style={{ paddingTop: 200, paddingLeft: 120 }}><C align="center" side="top" open children={<p style={{ margin: 0 }}>Panel</p>} /></div> }
  ],
  RollingNumber: [{ label: '1,234', settle: 1500, props: { value: 1234, startOnView: false, prefix: '$' } }],
  GaugeMeter: [{ label: '72 %', settle: 2000, props: { value: 72, unit: '%', label: 'Load' } }],
  LetterSwap: [
    { label: 'span', props: { text: 'Press start', swapText: 'Let’s go' } },
    { label: 'link, active', props: { as: 'a', href: '#x', text: 'Play', active: true } }
  ],
  MorphDialog: [{ label: 'card', props: { card: <div style={{ padding: 16 }}>Open me</div>, media: <img src="/pixel/biome-forest.png" alt="" />, title: 'Forest', children: <p>Body</p> } }],
  SkeletonShimmer: [
    { label: 'loaded', props: { children: <p style={{ margin: 0 }}>Real content here.</p> } },
    { label: 'loading', settle: 800, props: { loading: true, children: <p style={{ margin: 0 }}>Real content here.</p> } }
  ],
  HorizontalTrack: [{ label: 'items', height: 420, props: { stageHeight: '360px', itemWidth: 200, header: <h3 style={{ margin: 0 }}>Gallery</h3>, children: ['#b13e53', '#38b764', '#41a6f6'].map(c => <div key={c}>{box(c, 120)}</div>) } }],
  VoxelTiles: [{ label: 'island', settle: 1500, props: { size: 6 } }],
  LogoOrbit: [{ label: 'logos', height: 420, props: { size: 400, center: <strong>Lab</strong>, logos: ['A', 'B', 'C', 'D', 'E'].map(l => ({ label: l, icon: <b>{l}</b> })) } }],
  StatCard: [{ label: 'trend', settle: 1500, props: { label: 'Players', value: 1520, previous: 1300, trend: [3, 5, 4, 7, 6, 9] } }],
  VanishInput: [{ label: 'placeholder', props: { placeholders: ['Search the lab…'] } }],
  AvatarTooltips: [{ label: 'six people', height: 200, props: { max: 4, people: ['Ada', 'Bo', 'Cy', 'Di', 'Ed', 'Flo'].map((name, i) => ({ id: name, name, role: i % 2 ? 'Builder' : 'Explorer' })) } }],
  ScreenScroller: [{ label: 'laptop', height: 420, props: { stageHeight: '400px', intro: <h2 style={{ margin: 0 }}>Scroll</h2>, children: <img src="/pixel/biome-plains.png" alt="" /> } }],
  SlideTabs: [
    { label: 'pill', props: { items: ['Map', 'Bag', 'Quests'].map(t => ({ id: t, label: t, content: <p style={{ margin: 0 }}>{t} panel</p> })) } },
    { label: 'underline', props: { variant: 'underline', defaultValue: 'Bag', items: ['Map', 'Bag', 'Quests'].map(t => ({ id: t, label: t, content: <p style={{ margin: 0 }}>{t} panel</p> })) } }
  ],
  SmartNavbar: [{ label: 'top', height: 200, props: { brand: 'Bits Lab', current: '/docs', links: [{ label: 'Docs', href: '/docs' }, { label: 'Blog', href: '/blog' }], actions: <button>Sign in</button> } }],
  CompareSlider: [
    { label: 'horizontal', props: { before: <img src="/pixel/biome-plains.png" alt="" />, after: <img src="/pixel/biome-desert.png" alt="" /> } },
    { label: 'vertical', props: { vertical: true, defaultPosition: 30, before: <img src="/pixel/biome-plains.png" alt="" />, after: <img src="/pixel/biome-desert.png" alt="" /> } }
  ],
  DotMap: [{ label: 'defaults', settle: 1200, props: {} }],
  ToggleGroup: [
    { label: 'single', settle: 800, props: { defaultValue: 'b', items: [{ value: 'a', label: 'Day' }, { value: 'b', label: 'Week' }, { value: 'c', label: 'Month', disabled: true }] } },
    { label: 'multiple, joined, full', settle: 800, props: { type: 'multiple', fullWidth: true, defaultValue: ['a', 'b'], items: [{ value: 'a', label: 'B' }, { value: 'b', label: 'I' }, { value: 'c', label: 'U' }] } }
  ],
  PixelLoader: [{ label: '40 %', props: { progress: 40 } }],
  SpringDrawer: [{ label: 'open, contained', height: 420, settle: 1200, render: C => <div style={{ position: 'relative', height: 420 }}><C open contained title="Inventory" description="Your items">{<p>Body</p>}</C></div> }],
  LevelMap: [{ label: 'defaults', height: 520, settle: 1800, props: {} }],
  QuestDialog: [{ label: 'defaults', settle: 1200, props: { speed: 0 } }],
  RingProgress: [{ label: 'two rings, legend', settle: 1600, props: { showLegend: true, rings: [{ value: 72, label: 'Done' }, { value: 30, label: 'Bonus' }] } }],
  ColorDial: [{ label: 'defaults', height: 420, props: {} }],
  ContextOrb: [{ label: 'area', props: { items: [{ label: 'Copy' }, { label: 'Delete', danger: true }], children: <div style={{ height: 120 }}>Right-click me</div> } }],
  WebcamPixels: [
    { label: 'start screen', props: {} },
    { label: 'image', settle: 1200, props: { src: '/pixel/biome-cherry.png', mode: 'ascii' } }
  ],
  StickerBoard: [
    {
      label: 'stickers',
      height: 380,
      props: {
        height: 360,
        stickers: [
          { id: 'a', label: 'Heart', content: '/pixel/sprite-heart.png', x: 30, y: 30, rotate: -8, size: 100 },
          { id: 'b', label: 'Note', content: <span style={{ display: 'block', padding: 24 }}>gg!</span>, x: 200, y: 80, rotate: 10, size: 110 }
        ]
      }
    }
  ],
  BarRace: [{ label: 'paused', settle: 600, props: { autoPlay: false, title: 'Lab visits', subtitle: 'By biome', steps: ['2024', '2025'], series: [{ name: 'Plains', values: [40, 70] }, { name: 'Forest', values: [55, 50] }, { name: 'Desert', values: [20, 35] }] } }],
  PinCard: [{ label: 'card', height: 420, props: { title: 'lab.dev', href: '#x', children: <div style={{ padding: 24 }}>Pinned</div> } }],
  ExpandCard: [{ label: 'grid', height: 420, render: (C, mod) => <C>{['One', 'Two'].map(t => <mod.ExpandCard key={t} id={t} eyebrow="Guide" title={t} summary="A short summary." media={<img src="/pixel/biome-forest.png" alt="" />}>Body</mod.ExpandCard>)}</C> }],
  HealthBar: [{ label: '72', props: {} }, { label: 'critical', settle: 800, props: { value: 15 } }],
  Heatmap: [{ label: 'year', height: 260, width: 900, settle: 1200, props: { title: 'Activity', end: '2026-10-01', data: Array.from({ length: 60 }, (_, i) => ({ date: `2026-0${1 + (i % 9)}-1${i % 9}`, value: i % 7 })) } }],
  RangeDual: [{ label: 'histogram', height: 300, props: { defaultValue: [20, 70], histogram: [1, 4, 9, 6, 3, 8, 5, 2, 7, 4] } }],
  SparkChart: [{ label: 'trend', settle: 1500, props: { data: [3, 5, 4, 7, 6, 9, 8], animate: false } }],
  StoryViewer: [{ label: 'paused slide', height: 600, props: { author: 'Pip', timestamp: '2h', slides: [{ content: <img src="/pixel/biome-cherry.png" alt="" />, caption: 'Cherry grove' }] } }],
  TerminalDemo: [{ label: 'static', settle: 300, props: { startOnView: false, typingSpeed: 0, script: [] } }],
  TestimonialWall: [{ label: 'two rows', height: 520, props: { rows: 2, testimonials: ['Great kit', 'Love the pixels', 'So smooth', 'Ship it'].map((q, i) => ({ quote: q, name: `Fan ${i}`, role: 'Builder' })) } }],
  VideoHero: [{ label: 'closed', props: { src: '/x.mp4', poster: <img src="/pixel/biome-night.png" alt="" />, title: 'Night run', meta: '2 min' } }],
  ChapterProgress: [{ label: 'page', props: {} }],
  StreamingText: [{ label: 'markdown, done', settle: 1500, props: { speed: 0, text: '## Title\n\nSome *text* with `code` and a [link](#x).\n\n- one\n- two\n\n1. first\n\n> quote\n\n```\ncode block\n```' } }],
  MobileTabBar: [
    { label: 'active labels', props: { defaultValue: 'b', tabs: [{ id: 'a', label: 'Home', icon: <span>⌂</span> }, { id: 'b', label: 'Bag', icon: <span>▣</span>, badge: 3 }, { id: 'c', label: 'Map', icon: <span>✦</span> }] } },
    { label: 'floating, all labels', props: { floating: true, labels: 'all', defaultValue: 'a', tabs: [{ id: 'a', label: 'Home', icon: <span>⌂</span> }, { id: 'b', label: 'Bag', icon: <span>▣</span> }] } }
  ],
  ToastStack: [{ label: 'three toasts', height: 420, settle: 1200, render: (C, mod) => <Toasts C={C} toast={mod.toast} /> }],
  DiffReveal: [{ label: 'done', settle: 400, props: { autoPlay: false, before: 'The quick fox.', after: 'The quick brown fox jumps.' } }],
  LinkPeek: [{ label: 'link', props: { href: 'https://example.com', preview: { title: 'Example', description: 'A page' }, children: 'a link' } }],
  PasswordMeter: [
    { label: 'empty', props: {} },
    { label: 'strong', settle: 800, props: { defaultValue: 'Pixel-Lab-2026!' } }
  ],
  ChangelogTimeline: [{ label: 'entries', height: 520, props: { entries: [{ date: 'Oct 2026', title: 'Tailwind', tag: 'New', body: 'Tailwind variants.' }, { date: 'Sep 2026', title: 'Wave 2', body: 'More components.' }] } }],
  CommandPalette: [{ label: 'open', height: 520, settle: 800, props: { open: true, groups: [{ heading: 'Go to', items: [{ id: 'a', label: 'Docs', icon: <span>⌘</span>, shortcut: ['G', 'D'] }, { id: 'b', label: 'Blog', hint: 'Posts' }] }] } }],
  ScoreTicker: [{ label: '1,250 (high)', settle: 1200, props: { value: 1250, highScore: 1000 } }],
  BootSequence: [{ label: 'booting', settle: 600, props: { speed: 0, lineDelay: 0 } }],
  DeviceFrame: [
    { label: 'phone', height: 560, props: { children: <img src="/pixel/biome-plains.png" alt="" /> } },
    { label: 'laptop', props: { device: 'laptop', width: 520, children: <img src="/pixel/biome-plains.png" alt="" /> } },
    { label: 'browser', props: { device: 'browser', width: 520, children: <div style={{ padding: 16 }}>Page</div> } },
    { label: 'tablet landscape', props: { device: 'tablet', landscape: true, width: 400, children: <div /> } },
    { label: 'watch', props: { device: 'watch', width: 180, children: <div /> } }
  ],
  InventoryGrid: [{ label: 'items', height: 420, props: { columns: 4, items: [{ name: 'Gem', icon: <span>◆</span>, rarity: 'legendary' }, { name: 'Coin', icon: <span>●</span>, count: 12 }, null, { name: 'Potion', icon: <span>▲</span>, rarity: 'rare' }] } }],
  SpotlightTour: [{ label: 'step 1', height: 420, settle: 900, render: C => <div><button id="tour-a" style={{ margin: 60 }}>Target</button><C open steps={[{ target: '#tour-a', title: 'Hello', body: 'This is a target.' }, { target: '#tour-a', title: 'Two', body: 'Second.' }]} /></div> }],
  BentoGrid: [
    { label: 'narrow 560', width: 560, height: 640, render: (C, mod) => <C columns={3}><mod.BentoCard colSpan={2} title="Big" description="Wide card" icon={<span>★</span>} /><mod.BentoCard title="Link" description="Has a CTA" href="#x" /><mod.BentoCard title="Image" background={<img src="/pixel/biome-forest.png" alt="" />} /></C>  },
    { label: 'mid 760', width: 760, height: 640, render: (C, mod) => <C columns={3}><mod.BentoCard colSpan={2} title="Big" description="Wide card" icon={<span>★</span>} /><mod.BentoCard title="Link" description="Has a CTA" href="#x" /><mod.BentoCard title="Image" background={<img src="/pixel/biome-forest.png" alt="" />} /></C>  },
    { label: 'wide 960', width: 960, height: 640, render: (C, mod) => <C columns={3}><mod.BentoCard colSpan={2} title="Big" description="Wide card" icon={<span>★</span>} /><mod.BentoCard title="Link" description="Has a CTA" href="#x" /><mod.BentoCard title="Image" background={<img src="/pixel/biome-forest.png" alt="" />} /></C>  },
  ],
  GameOver: [{ label: 'stats', height: 520, settle: 2500, props: { subtitle: 'You fell in lava', stats: [{ label: 'Coins', value: 40 }, { label: 'Gems', value: 3 }], total: 4300, countdown: 0 } }],
  LightboxGallery: [{ label: 'thumbs', props: { images: ['plains', 'forest', 'desert'].map(b => ({ src: `/pixel/biome-${b}.png`, alt: b, caption: b })) } }],
  ThinkingShimmer: [
    { label: 'thinking, open', settle: 800, props: { defaultOpen: true, startedAt: Date.now(), steps: [{ label: 'Read files', status: 'done', detail: '3 files' }, { label: 'Plan', status: 'active' }, { label: 'Write', status: 'pending' }] } },
    { label: 'done', props: { thinking: false, startedAt: Date.now() - 4000, steps: [{ label: 'Read files', status: 'done' }] } }
  ],
  DropZone: [{ label: 'empty', props: { hint: 'PNG or JPG' } }],
  FeatureTabs: [{ label: 'tabs', height: 480, settle: 900, props: { autoPlay: false, items: ['Build', 'Ship'].map(t => ({ id: t, title: t, description: `${t} things.`, media: <img src="/pixel/biome-desert.png" alt="" /> })) } }],
  StepperForm: [{ label: 'step 2', height: 460, settle: 800, props: { defaultStep: 1, steps: ['Name', 'Biome', 'Done'].map(t => ({ id: t, title: t, description: `${t} step`, content: <p>{t}</p> })) } }],
  CutReveal: [{ label: 'done', settle: 2500, props: { text: 'Long ago, the pixel world was a single grey block. Then someone placed a torch.' } }],
  PixelButton: [
    { label: 'md', props: { children: 'Start' } },
    { label: 'sm, secondary', props: { size: 'sm', variant: 'secondary', children: 'Back' } },
    { label: 'lg, icon', props: { size: 'lg', variant: 'success', icon: <span>★</span>, children: 'Save' } },
    { label: 'disabled', props: { disabled: true, children: 'Locked' } },
    { label: 'loading', props: { loading: true, children: 'Saving' } },
    { label: 'pressed', props: { 'data-pressed': true, children: 'Held' } }
  ],
  SuggestionChips: [
    { label: 'centered', props: { suggestions: IDEAS } },
    { label: 'start, icons', props: { align: 'start', count: 3, suggestions: IDEAS.map(text => ({ text, icon: <span>★</span> })) } }
  ]
};
