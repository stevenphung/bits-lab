import { useEffect, useMemo, useState } from 'react';
import Sprite from './pixel/Sprite';
import PixelButton from './bits/PixelButton';
import DynamicIsland from './bits/DynamicIsland';
import SlideTabs from './bits/SlideTabs';
import CommandPalette from './bits/CommandPalette';
import SmartNavbar from './bits/SmartNavbar';
import dynamicIslandSource from './bits/DynamicIsland.jsx?raw';
import slideTabsSource from './bits/SlideTabs.jsx?raw';
import commandPaletteSource from './bits/CommandPalette.jsx?raw';
import smartNavbarSource from './bits/SmartNavbar.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", monospace';
const pixelated = { imageRendering: 'pixelated' };
const biome = id => `/pixel/biome-${id}.png`;
const row = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 };
const hint = { margin: 0, color: 'var(--demo-muted, #94b0c2)', font: `14px/1.4 ${PIXEL_FONT}`, textAlign: 'center' };

// ---------- DynamicIsland ----------

function Bars() {
  return (
    <span style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14 }} aria-hidden="true">
      {[0, 1, 2, 3].map(i => (
        <span key={i} className="bl-demo-bar" style={{ width: 3, height: 14, background: '#a7f070', transformOrigin: 'bottom', animation: `bl-demo-bars 700ms ${i * 120}ms ease-in-out infinite alternate` }} />
      ))}
      <style>{'@keyframes bl-demo-bars { from { transform: scaleY(0.25); } to { transform: scaleY(1); } } @media (prefers-reduced-motion: reduce) { .bl-demo-bar { animation: none !important; } }'}</style>
    </span>
  );
}

const pad = n => String(n).padStart(2, '0');
const roundBtn = bg => ({ display: 'grid', placeItems: 'center', width: 34, height: 34, border: 0, borderRadius: '50%', background: bg, color: '#fff', cursor: 'pointer', font: `16px ${PIXEL_FONT}` });

function IslandDemo(props) {
  const [view, setView] = useState('idle');
  const [seconds, setSeconds] = useState(90);
  const [callTime, setCallTime] = useState(0);

  useEffect(() => {
    if (view !== 'timer' && view !== 'call') return;
    const id = setInterval(() => {
      if (view === 'timer') setSeconds(s => (s > 0 ? s - 1 : 90));
      else setCallTime(t => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [view]);

  const views = {
    idle: { width: 126, height: 36, label: 'Idle', content: null },
    music: {
      width: 240,
      height: 36,
      label: 'Now playing: Overworld Theme',
      content: (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 12px' }}>
          <Sprite name="note" size={20} />
          <Bars />
        </span>
      )
    },
    player: {
      width: 340,
      height: 150,
      radius: 40,
      label: 'Music player expanded',
      content: (
        <span style={{ display: 'grid', gap: 12, width: '100%', padding: '0 22px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 52, height: 52, borderRadius: 12, background: `url(${biome('cherry')}) center / cover`, ...pixelated }}>
              <Sprite name="note" size={26} />
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', font: `9px/1.6 ${TITLE_FONT}` }}>Overworld Theme</span>
              <span style={{ display: 'block', color: 'var(--demo-muted, #94b0c2)', fontSize: 13 }}>8-Bit Orchestra</span>
            </span>
            <Bars />
          </span>
          <span style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }}>
            <span style={{ display: 'block', width: '38%', height: '100%', borderRadius: 2, background: '#f4f4f4' }} />
          </span>
          <span style={{ display: 'flex', justifyContent: 'center', gap: 18 }}>
            <button type="button" aria-label="Previous" style={roundBtn('transparent')}>«</button>
            <button type="button" aria-label="Pause" style={roundBtn('rgba(255,255,255,0.12)')}>‖</button>
            <button type="button" aria-label="Next" style={roundBtn('transparent')}>»</button>
          </span>
        </span>
      )
    },
    call: {
      width: 320,
      height: 64,
      label: 'Incoming call from Pip',
      content: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '0 12px' }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 40, height: 40, borderRadius: '50%', background: 'var(--demo-panel, #29366f)' }}>
            <Sprite name="heart" size={24} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', color: 'var(--demo-muted, #94b0c2)', fontSize: 12 }}>Village call · {pad(Math.floor(callTime / 60))}:{pad(callTime % 60)}</span>
            <span style={{ display: 'block', fontWeight: 700 }}>Pip</span>
          </span>
          <button type="button" aria-label="Decline" style={roundBtn('#b13e53')} onClick={() => setView('idle')}>
            ✕
          </button>
          <button type="button" aria-label="Accept" style={roundBtn('#38b764')} onClick={() => setView('idle')}>
            ✓
          </button>
        </span>
      )
    },
    timer: {
      width: 200,
      height: 36,
      label: `Night falls in ${seconds} seconds`,
      content: (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 12px' }}>
          <Sprite name="star" size={18} />
          <span style={{ color: 'var(--demo-gold, #ffcd75)', font: `10px ${TITLE_FONT}` }}>
            {pad(Math.floor(seconds / 60))}:{pad(seconds % 60)}
          </span>
        </span>
      )
    },
    notification: {
      width: 330,
      height: 72,
      radius: 30,
      label: 'Achievement unlocked: Diamonds!',
      content: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '0 16px' }}>
          <Sprite name="gem" size={34} />
          <span>
            <span style={{ display: 'block', color: 'var(--demo-gold, #ffcd75)', font: `8px/1.8 ${TITLE_FONT}` }}>ACHIEVEMENT UNLOCKED</span>
            <span style={{ display: 'block', fontWeight: 700 }}>Diamonds!</span>
          </span>
        </span>
      )
    }
  };

  return (
    <div style={{ display: 'grid', gap: 22, justifyItems: 'center', width: '100%', padding: '24px 0' }}>
      <div style={{ width: 'min(100%, 420px)', minWidth: 0, height: 220, padding: '14px 0', borderRadius: 36, background: `linear-gradient(rgba(26,28,44,0.2), rgba(26,28,44,0.85)), url(${biome('night')}) center / cover`, ...pixelated }}>
        <DynamicIsland
          {...props}
          views={views}
          view={view}
          fontFamily={PIXEL_FONT}
          onPress={view === 'music' ? () => setView('player') : view === 'notification' || view === 'timer' ? () => setView('idle') : undefined}
        />
      </div>
      <div style={row}>
        {['idle', 'music', 'player', 'call', 'timer', 'notification'].map(name => (
          <PixelButton key={name} size="sm" variant={view === name ? 'warning' : 'secondary'} onPress={() => setView(name)}>
            {name}
          </PixelButton>
        ))}
      </div>
      <p style={hint}>Tap the island while music plays to expand it.</p>
    </div>
  );
}

// ---------- SlideTabs ----------

const PANELS = [
  { id: 'inventory', label: 'Inventory', icon: <Sprite name="chest" size={18} />, text: '27 slots, 8 used. Diamonds stack to 64.' },
  { id: 'crafting', label: 'Crafting', icon: <Sprite name="pickaxe" size={18} />, text: '312 recipes unlocked. Try a golden apple.' },
  { id: 'map', label: 'Map', icon: <Sprite name="book" size={18} />, text: '4 of 12 biomes discovered.' },
  { id: 'stats', label: 'Stats', icon: <Sprite name="heart" size={18} />, text: 'Blocks mined: 18,204. Times fallen in lava: 3.' }
];

const BIOME_TABS = ['Plains', 'Forest', 'Desert', 'Snowy Peaks', 'Ocean', 'Jungle', 'Mesa', 'Night Plains', 'Underworld', 'Void Isles', 'Deep Cave', 'Blossom Hills'];

function TabsDemo(props) {
  const items = PANELS.map(panel => ({ ...panel, content: <p style={{ margin: 0, color: 'var(--demo-muted, #94b0c2)', font: `16px ${PIXEL_FONT}` }}>{panel.text}</p> }));
  return (
    <div style={{ display: 'grid', gap: 40, width: '100%', maxWidth: 640, margin: '0 auto', padding: '28px 0' }}>
      <SlideTabs {...props} items={items} label="Player menu" fontFamily={PIXEL_FONT} />
      <SlideTabs {...props} variant="underline" items={BIOME_TABS.map(name => ({ id: name, label: name }))} label="Biomes" fontFamily={PIXEL_FONT} />
    </div>
  );
}

// ---------- CommandPalette ----------

const BIOMES = [
  ['plains', 'Plains', 'grass'],
  ['forest', 'Forest', 'pickaxe'],
  ['desert', 'Desert', 'coin'],
  ['snowy', 'Snowy Peaks', 'gem'],
  ['ocean', 'Ocean', 'orb'],
  ['underworld', 'Underworld', 'potion'],
  ['void', 'Void Isles', 'star']
];

function PaletteDemo(props) {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState('Nothing yet');
  const groups = useMemo(() => {
    const done = label => () => setLast(label);
    return [
      {
        heading: 'Travel',
        items: [
          {
            id: 'teleport',
            label: 'Teleport to biome…',
            icon: <Sprite name="orb" size={18} />,
            keywords: ['go', 'warp', 'travel'],
            placeholder: 'Pick a biome…',
            items: [{ heading: 'Biomes', items: BIOMES.map(([id, name, icon]) => ({ id: `tp-${id}`, label: name, icon: <Sprite name={icon} size={18} />, onSelect: done(`Teleported to ${name}`) })) }]
          },
          { id: 'spawn', label: 'Return to spawn', icon: <Sprite name="grass" size={18} />, shortcut: ['⇧', 'H'], onSelect: done('Returned to spawn') },
          { id: 'bed', label: 'Go to bed', icon: <Sprite name="bench" size={18} />, keywords: ['sleep', 'night'], onSelect: done('Slept until morning') }
        ]
      },
      {
        heading: 'Crafting',
        items: [
          {
            id: 'craft',
            label: 'Craft item…',
            icon: <Sprite name="pickaxe" size={18} />,
            keywords: ['make', 'build'],
            placeholder: 'What do you want to craft?',
            items: [
              {
                heading: 'Tools',
                items: [
                  { id: 'c-pick', label: 'Diamond pickaxe', icon: <Sprite name="pickaxe" size={18} />, hint: '3 diamonds', onSelect: done('Crafted a diamond pickaxe') },
                  { id: 'c-sword', label: 'Iron sword', icon: <Sprite name="sword" size={18} />, hint: '2 iron', onSelect: done('Crafted an iron sword') }
                ]
              },
              {
                heading: 'Potions',
                items: [
                  { id: 'c-night', label: 'Night vision potion', icon: <Sprite name="potion" size={18} />, onSelect: done('Brewed night vision') },
                  { id: 'c-heal', label: 'Healing potion', icon: <Sprite name="heart" size={18} />, onSelect: done('Brewed healing') }
                ]
              }
            ]
          },
          { id: 'chest', label: 'Open storage chest', icon: <Sprite name="chest" size={18} />, shortcut: ['E'], onSelect: done('Opened the chest') }
        ]
      },
      {
        heading: 'Settings',
        items: [
          { id: 'sound', label: 'Toggle chiptune sound', icon: <Sprite name="note" size={18} />, keywords: ['audio', 'mute'], onSelect: done('Toggled sound') },
          { id: 'save', label: 'Save world', icon: <Sprite name="book" size={18} />, shortcut: ['⌘', 'S'], onSelect: done('World saved') }
        ]
      }
    ];
  }, []);

  return (
    <div style={{ display: 'grid', gap: 18, justifyItems: 'center', width: '100%', padding: '48px 0' }}>
      <PixelButton variant="info" onPress={() => setOpen(true)}>
        Open palette · ⌘K
      </PixelButton>
      <p style={hint}>
        Last command: <span style={{ color: 'var(--demo-gold, #ffcd75)' }}>{last}</span>
      </p>
      <p style={hint}>Try "tp", "craft" then "dia", or Backspace to go back a page.</p>
      <CommandPalette {...props} groups={groups} open={open} onOpenChange={setOpen} fontFamily={PIXEL_FONT} recentKey="bitslab-demo-palette" />
    </div>
  );
}

// ---------- SmartNavbar ----------

const NAV_LINKS = [
  { href: '#worlds', label: 'Worlds' },
  { href: '#servers', label: 'Servers' },
  { href: '#mods', label: 'Mods' },
  { href: '#news', label: 'News' }
];

function NavDemo(props) {
  const [current, setCurrent] = useState('#worlds');
  const section = { padding: '0 24px 48px', color: 'var(--demo-muted, #94b0c2)', font: `16px/1.6 ${PIXEL_FONT}` };
  return (
    <div style={{ width: '100%', height: 560, overflowY: 'auto', overflowX: 'hidden', background: 'var(--demo-bg, #1a1c2c)' }}>
      <SmartNavbar
        {...props}
        current={current}
        onNavigate={href => setCurrent(href)}
        fontFamily={PIXEL_FONT}
        brand={
          <>
            <Sprite name="gem" size={22} />
            <span style={{ font: `10px ${TITLE_FONT}` }}>BLOCK QUEST</span>
          </>
        }
        links={NAV_LINKS}
        actions={
          <PixelButton size="sm" variant="success">
            Play free
          </PixelButton>
        }
      />
      <div style={{ position: 'relative', aspectRatio: '16 / 8', minHeight: 300 }}>
        <img src={biome('plains')} alt="" style={{ ...pixelated, position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', background: 'linear-gradient(rgba(26,28,44,0.1), #1a1c2c)' }}>
          <div style={{ font: `clamp(12px, 3vw, 20px)/1.5 ${TITLE_FONT}`, color: '#fff', textShadow: '3px 3px 0 #1a1c2c' }}>
            SCROLL DOWN
            <div style={{ marginTop: 8, font: `15px ${PIXEL_FONT}`, color: 'var(--demo-gold, #ffcd75)' }}>Watch the navbar become a pill, hide, and come back.</div>
          </div>
        </div>
      </div>
      {['forest', 'snowy', 'underworld', 'void'].map(id => (
        <div key={id} style={section}>
          <h3 style={{ margin: '0 0 12px', font: `12px/1.5 ${TITLE_FONT}`, color: 'var(--demo-gold, #ffcd75)' }}>{id.toUpperCase()}</h3>
          <img src={biome(id)} alt="" style={{ ...pixelated, width: '100%', display: 'block', marginBottom: 12 }} />
          <p style={{ margin: 0 }}>Scroll up at any point and the navbar slides back in. Tab to a link and it reappears too.</p>
        </div>
      ))}
    </div>
  );
}

// ---------- Entries ----------

const DEMO_ENTRIES = {
  'dynamic-island': {
    source: dynamicIslandSource,
    defaults: { duration: 520, bounce: 0.35, backgroundColor: '#000000' },
    controls: [slider('duration', 'Morph (ms)', 200, 1000, 20), slider('bounce', 'Bounce', 0, 1, 0.05), color('backgroundColor', 'Island color')],
    docs: [
      ['views', 'Record<string, { width, height, radius?, label?, content }>', '{}', 'Every state the island can take, with its size and content.'],
      ['view', 'string', '"idle"', 'The current view. Change it and the island morphs.'],
      ['onPress', '(view) => void', '-', 'Makes the island pressable (Enter/Space too). Leave it off when the view has its own buttons.'],
      ['duration / bounce', 'number', '520 / 0.35', 'Morph length and overshoot (0 = none, 1 = very springy).'],
      ['label (per view)', 'string', '-', 'Announced politely to screen readers when the view changes.'],
      ['backgroundColor / textColor / accentColor / fontFamily', 'string', 'black', 'Styling.']
    ],
    usage: `import DynamicIsland from "./DynamicIsland";

<DynamicIsland
  view={view}
  views={{
    idle: { width: 126, height: 36 },
    music: { width: 240, height: 36, label: "Now playing", content: <NowPlaying /> }
  }}
/>`,
    render: props => <IslandDemo {...props} />
  },

  'slide-tabs': {
    source: slideTabsSource,
    defaults: { stretch: true, dragToSwitch: true, duration: 380, activation: 'automatic', radius: 4, activeColor: '#f4f4f4', accentColor: '#73eff7' },
    controls: [toggle('stretch', 'Stretch while moving'), toggle('dragToSwitch', 'Drag the pill'), slider('duration', 'Slide (ms)', 150, 900, 10), select('activation', 'Keyboard activation', ['automatic', 'manual']), slider('radius', 'Radius', 0, 24, 1), color('activeColor', 'Pill color'), color('accentColor', 'Underline / focus')],
    docs: [
      ['items', '{ id, label, icon?, content? }[]', '[]', 'Tabs. Give items content to render a linked tab panel.'],
      ['value / defaultValue / onChange', 'string / string / (id, item) => void', 'first', 'Controlled or uncontrolled selection.'],
      ['variant', '"pill" | "underline"', '"pill"', 'Sliding pill on a track, or a sliding underline.'],
      ['stretch / duration', 'boolean / number', 'true / 380', 'The leading edge moves first and the trailing edge follows.'],
      ['dragToSwitch', 'boolean', 'true', 'Pill style: drag the pill and let go over a tab to select it. Clicks and keys work as usual.'],
      ['activation', '"automatic" | "manual"', '"automatic"', 'Arrow keys select immediately, or only move focus until Enter/Space.'],
      ['label', 'string', '"Tabs"', 'Accessible name of the tab list.'],
      ['colors / radius / padding / gap / fontSize', 'various', 'dark', 'Styling. Overflowing rows scroll with edge fades and keep the active tab centered.']
    ],
    usage: `import SlideTabs from "./SlideTabs";

<SlideTabs
  items={[{ id: "inv", label: "Inventory" }, { id: "map", label: "Map" }]}
  onChange={setTab}
/>`,
    render: props => <TabsDemo {...props} />
  },

  'command-palette': {
    source: commandPaletteSource,
    defaults: { width: 620, maxListHeight: 360, radius: 6, accentColor: '#73eff7', showFooter: true },
    controls: [slider('width', 'Width', 400, 800, 10), slider('maxListHeight', 'Max list height', 200, 520, 10), slider('radius', 'Radius', 0, 24, 1), color('accentColor', 'Accent'), toggle('showFooter', 'Key hints footer')],
    docs: [
      ['groups', '{ heading, items: Item[] }[]', '[]', 'Item: { id, label, icon?, hint?, shortcut?: string[], keywords?: string[], onSelect?, keepOpen?, items?: groups, placeholder? }.'],
      ['Item.items', 'groups', '-', 'Turns the item into a nested page; Backspace on an empty query (or Esc) goes back.'],
      ['open / onOpenChange', 'boolean / (open) => void', '-', 'Optional controlled state.'],
      ['hotkey', 'string | null', '"k"', '⌘/Ctrl + this key toggles the palette. null disables it.'],
      ['recentKey / maxRecent', 'string | null / number', 'key / 4', 'localStorage key for recently used items (null disables).'],
      ['fuzzyMatch(query, text)', 'function', 'export', 'The scorer: subsequence match favoring word starts and runs. Returns { score, indices } or null.'],
      ['width / maxListHeight / colors', 'number / string', '620 / 360', 'Size and styling. The list animates its height as results change.']
    ],
    usage: `import CommandPalette from "./CommandPalette";

<CommandPalette
  groups={[{ heading: "Actions", items: [{ id: "save", label: "Save world", onSelect: save }] }]}
/>`,
    render: props => <PaletteDemo {...props} />
  },

  'smart-navbar': {
    source: smartNavbarSource,
    defaults: { shrinkAt: 60, hideOnScroll: true, hideAfter: 240, pillWidth: 720, radius: 6, blur: 14 },
    controls: [slider('shrinkAt', 'Pill after (px)', 0, 300, 10), toggle('hideOnScroll', 'Hide on scroll down'), slider('hideAfter', 'Hide after (px)', 0, 800, 20), slider('pillWidth', 'Pill width', 320, 1000, 10), slider('radius', 'Radius', 0, 40, 1), slider('blur', 'Backdrop blur', 0, 30, 1)],
    docs: [
      ['brand / brandHref', 'ReactNode / string', '- / "/"', 'Logo area.'],
      ['links', '{ href, label }[]', '[]', 'Navigation links. Under 640px of container width they move into a menu sheet.'],
      ['actions', 'ReactNode', '-', 'Buttons on the right (also shown in the mobile sheet).'],
      ['current / onNavigate', 'string / (href, link) => void', '-', 'Marks the current link; onNavigate turns links into client-side navigation.'],
      ['shrinkAt / pillWidth / pillHeight / pillTop', 'number', '60 / 720 / 52 / 12', 'When and how the bar becomes a floating pill.'],
      ['hideOnScroll / hideAfter', 'boolean / number', 'true / 240', 'Hide while scrolling down past this point; scrolling up or focusing a link shows it.'],
      ['blur / colors', 'number / string', '14', 'Pill backdrop blur and colors. The bar overlays content, so give the first section top padding.']
    ],
    usage: `import SmartNavbar from "./SmartNavbar";

<SmartNavbar
  brand={<Logo />}
  links={[{ href: "/worlds", label: "Worlds" }]}
  actions={<button>Play free</button>}
/>`,
    render: props => <NavDemo {...props} />
  }
};

export const NAV_DEMOS = DEMO_ENTRIES;
