import { useState } from 'react';
import Sprite from './pixel/Sprite';
import PixelAvatar from './bits/PixelAvatar';
import MegaMenu from './bits/MegaMenu';
import SideRail from './bits/SideRail';
import MobileTabBar from './bits/MobileTabBar';
import megaMenuSource from './bits/MegaMenu.jsx?raw';
import sideRailSource from './bits/SideRail.jsx?raw';
import mobileTabBarSource from './bits/MobileTabBar.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", monospace';
const pixelated = { imageRendering: 'pixelated' };
const hint = { margin: 0, color: '#94b0c2', font: `14px/1.4 ${PIXEL_FONT}`, textAlign: 'center' };

// ---------- MegaMenu ----------

const linkStyle = { display: 'flex', gap: 12, alignItems: 'flex-start', padding: 10, borderRadius: 10, color: '#f4f4f4', textDecoration: 'none' };
const MenuLink = ({ href, sprite, title, text }) => (
  <a href={href} style={linkStyle} className="nav-more-link">
    <Sprite name={sprite} size={28} />
    <span style={{ display: 'grid', gap: 2 }}>
      <strong style={{ fontSize: 15 }}>{title}</strong>
      <span style={{ color: '#94b0c2', fontSize: 13, lineHeight: 1.4 }}>{text}</span>
    </span>
  </a>
);

const MENU = [
  {
    label: 'Components',
    content: (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 4, width: 'min(520px, calc(100vw - 72px))' }}>
        <MenuLink href="/pixel-game/quest-log" sprite="book" title="Quest log" text="Onboarding that pays out XP." />
        <MenuLink href="/pixel-game/score-ticker" sprite="coin" title="Score ticker" text="Arcade digits that roll forward." />
        <MenuLink href="/overlays/context-orb" sprite="orb" title="Context orb" text="Radial menu with flick-to-select." />
        <MenuLink href="/showcase/pricing-flip" sprite="gem" title="Pricing flip" text="Monthly or yearly, rolling prices." />
        <MenuLink href="/scroll/scroll-zoom" sprite="star" title="Scroll zoom" text="Frame to full-bleed on scroll." />
        <MenuLink href="/primitives/accordion" sprite="lever" title="Accordion" text="Springy, accessible sections." />
      </div>
    )
  },
  {
    label: 'Biomes',
    content: (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, width: 'min(380px, calc(100vw - 72px))' }}>
        {['plains', 'snowy', 'desert', 'cherry'].map(b => (
          <a key={b} href="/backgrounds/retro-horizon" style={{ display: 'grid', gap: 6, color: '#f4f4f4', textDecoration: 'none', fontSize: 14, textTransform: 'capitalize' }}>
            <img src={`/pixel/biome-${b}.png`} alt="" style={{ width: '100%', aspectRatio: '8 / 5', objectFit: 'cover', borderRadius: 8, ...pixelated }} />
            {b}
          </a>
        ))}
      </div>
    )
  },
  {
    label: 'Learn',
    content: (
      <div style={{ display: 'grid', gap: 2, width: 'min(260px, calc(100vw - 72px))' }}>
        <MenuLink href="/" sprite="book" title="Getting started" text="Install your first bit." />
        <MenuLink href="/" sprite="note" title="Sound guide" text="Wire up ChiptuneKit." />
        <MenuLink href="/" sprite="heart" title="Accessibility" text="How every bit is tested." />
      </div>
    )
  },
  { label: 'Pricing', href: '/showcase/pricing-flip' }
];

function MegaDemo(props) {
  return (
    <div style={{ width: '100%', minHeight: 420, padding: '20px 16px', boxSizing: 'border-box' }}>
      <style>{'.nav-more-link:hover{background:rgba(255,255,255,0.06)}.nav-more-link:focus-visible{outline:2px solid #73eff7;outline-offset:-2px}'}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', padding: '8px 12px', background: '#0b0b14', borderRadius: 14 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: `11px ${TITLE_FONT}`, color: '#73eff7' }}>
          <Sprite name="gem" size={20} /> BITS
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <MegaMenu {...props} items={MENU} fontFamily={PIXEL_FONT} />
        </div>
      </div>
      <p style={{ ...hint, marginTop: 240 }}>Hover the menu and glide between triggers, or Tab to one and press ↓.</p>
    </div>
  );
}

// ---------- SideRail ----------

const icon = name => <Sprite name={name} size={20} />;
const SECTIONS = [
  {
    title: 'Play',
    items: [
      { id: 'home', label: 'Home', icon: icon('grass') },
      { id: 'quests', label: 'Quests', icon: icon('book'), badge: 3 },
      {
        id: 'inventory',
        label: 'Inventory',
        icon: icon('chest'),
        children: [
          { id: 'weapons', label: 'Weapons', icon: icon('sword') },
          { id: 'potions', label: 'Potions', icon: icon('potion') },
          { id: 'gems', label: 'Gems', icon: icon('gem') }
        ]
      },
      { id: 'map', label: 'World map', icon: icon('orb') }
    ]
  },
  {
    title: 'Workshop',
    items: [
      { id: 'crafting', label: 'Crafting', icon: icon('pickaxe') },
      { id: 'settings', label: 'Settings', icon: icon('lever') }
    ]
  }
];
const NAMES = Object.fromEntries(SECTIONS.flatMap(s => s.items).flatMap(item => [item, ...(item.children ?? [])]).map(item => [item.id, item.label]));

function RailDemo({ collapsed, ...props }) {
  const [page, setPage] = useState('potions');
  const [isCollapsed, setCollapsed] = useState(collapsed);
  const [sync, setSync] = useState(collapsed);
  if (sync !== collapsed) {
    setSync(collapsed);
    setCollapsed(collapsed);
  }
  return (
    <div style={{ display: 'flex', width: '100%', maxWidth: 720, height: 460, margin: '24px auto', overflow: 'hidden', borderRadius: 14, boxShadow: '0 0 0 2px #333c57', background: '#202640' }}>
      <SideRail
        {...props}
        sections={SECTIONS}
        value={page}
        onValueChange={setPage}
        collapsed={isCollapsed}
        onCollapsedChange={setCollapsed}
        fontFamily={PIXEL_FONT}
        brand={
          <>
            <Sprite name="gem" size={22} />
            <span style={{ font: `10px ${TITLE_FONT}`, color: '#73eff7' }}>BITS</span>
          </>
        }
      />
      <main style={{ flex: 1, minWidth: 0, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 12, padding: 16, color: '#f4f4f4', font: `16px ${PIXEL_FONT}`, textAlign: 'center' }}>
        <span style={{ font: `13px/1.6 ${TITLE_FONT}`, color: '#ffcd75' }}>{NAMES[page]}</span>
        <span style={{ color: '#94b0c2' }}>Collapse the rail with the arrow at the top. In rail mode, Inventory opens a flyout.</span>
      </main>
    </div>
  );
}

// ---------- MobileTabBar ----------

const TABS = [
  { id: 'home', label: 'Home', icon: <Sprite name="grass" size={24} /> },
  { id: 'quests', label: 'Quests', icon: <Sprite name="book" size={24} />, badge: 2 },
  { id: 'map', label: 'Map', icon: <Sprite name="orb" size={24} /> },
  { id: 'bag', label: 'Bag', icon: <Sprite name="chest" size={24} /> },
  { id: 'me', label: 'Me', icon: <PixelAvatar seed="pip" size={24} shape="circle" decorative /> }
];
const SCREENS = { home: ['grass', 'Welcome back, Pip'], quests: ['book', '2 new quests'], map: ['orb', 'The world awaits'], bag: ['chest', '12 items'], me: ['heart', 'Level 12 explorer'] };

function TabBarDemo(props) {
  const [tab, setTab] = useState('home');
  const [sprite, text] = SCREENS[tab];
  return (
    <div style={{ display: 'grid', justifyItems: 'center', gap: 16, width: '100%', padding: '24px 12px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: 'min(360px, 100%)', height: 560, overflow: 'hidden', borderRadius: 36, background: '#202640', boxShadow: '0 0 0 10px #0b0b14, 0 0 0 12px #333c57' }}>
        <div style={{ flex: 1, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 14, color: '#f4f4f4', font: `16px ${PIXEL_FONT}` }}>
          <Sprite name={sprite} size={64} />
          <span>{text}</span>
        </div>
        <MobileTabBar {...props} tabs={TABS} value={tab} onValueChange={setTab} fontFamily={PIXEL_FONT} />
      </div>
      <p style={hint}>Tap between far-apart tabs to see the blob stretch.</p>
    </div>
  );
}

// ---------- Entries ----------

export const NAV_MORE_DEMOS = {
  'mega-menu': {
    source: megaMenuSource,
    defaults: { duration: 320, openDelay: 90, closeDelay: 220, radius: 14, accentColor: '#73eff7' },
    controls: [slider('duration', 'Morph (ms)', 120, 700, 20), slider('openDelay', 'Open delay (ms)', 0, 400, 10), slider('closeDelay', 'Close delay (ms)', 0, 600, 10), slider('radius', 'Radius', 0, 28, 1), color('accentColor', 'Accent')],
    docs: [
      ['items', '{ label, content?, href? }[]', '[]', 'Items with content open the shared panel; items with href are plain links.'],
      ['openDelay / closeDelay', 'number', '90 / 220', 'Hover intent: wait before opening, and before closing after the pointer leaves.'],
      ['duration', 'number', '320', 'How long the panel takes to slide and resize between triggers.'],
      ['gap / maxPanelWidth / radius', 'number', '10 / 640 / 14', 'Panel offset, maximum width and corners.'],
      ['Keyboard', '-', '-', '↓ or Enter opens and moves into the panel; ← → walk triggers; Esc closes and returns focus.'],
      ['Layout', '-', '-', 'Under 640px (container query) the panel spans the full width.']
    ],
    usage: `import MegaMenu from "./MegaMenu";

<MegaMenu
  items={[
    { label: "Products", content: <ProductsGrid /> },
    { label: "Pricing", href: "/pricing" }
  ]}
/>`,
    render: props => <MegaDemo {...props} />
  },

  'side-rail': {
    source: sideRailSource,
    defaults: { collapsed: false, width: 248, railWidth: 68, accentColor: '#73eff7' },
    controls: [toggle('collapsed', 'Collapsed (rail)'), slider('width', 'Width', 200, 320, 4), slider('railWidth', 'Rail width', 56, 88, 2), color('accentColor', 'Accent')],
    docs: [
      ['sections', '{ title?, items }[]', '[]', 'Items: { id, label, icon?, href?, badge?, onSelect?, children? } (one level of children).'],
      ['value / defaultValue / onValueChange', 'string', '-', 'The active item (gets aria-current="page" and the sliding highlight).'],
      ['collapsed / defaultCollapsed / onCollapsedChange', 'boolean', 'false', 'Icon-rail mode, controlled or not.'],
      ['brand', 'ReactNode', '-', 'Logo area beside the collapse button.'],
      ['width / railWidth', 'number', '248 / 68', 'Expanded and rail widths.'],
      ['Rail mode', '-', '-', 'Icons show tooltips; items with children open a flyout menu (Esc closes).'],
      ['Keyboard', '-', '-', '↑ ↓ move between visible items; groups are buttons with aria-expanded.']
    ],
    usage: `import SideRail from "./SideRail";

<SideRail
  sections={[{ title: "Main", items: [{ id: "home", label: "Home", icon: <HomeIcon /> }] }]}
  value={page}
  onValueChange={setPage}
/>`,
    demoOnly: ['collapsed'],
    render: props => <RailDemo {...props} />
  },

  'mobile-tab-bar': {
    source: mobileTabBarSource,
    defaults: { labels: 'active', floating: false, stretch: 1, haptics: true, blobColor: '#73eff7' },
    controls: [select('labels', 'Labels', ['active', 'always']), toggle('floating', 'Floating pill'), slider('stretch', 'Stretch', 0.4, 2, 0.1), toggle('haptics', 'Vibrate on tap'), color('blobColor', 'Blob')],
    docs: [
      ['tabs', '{ id, label, icon, badge?, onReselect? }[]', '[]', 'onReselect fires when the active tab is tapped again (e.g. scroll to top).'],
      ['value / defaultValue / onValueChange', 'string', 'first tab', 'Active tab, controlled or not.'],
      ['labels', '"active" | "always"', '"active"', 'Show every label, or only the active one.'],
      ['floating / fixed', 'boolean', 'false', 'A floating pill, and/or fixed to the bottom of the viewport (with safe-area padding).'],
      ['stretch', 'number', '1', 'How much the blob stretches between tabs.'],
      ['haptics', 'boolean', 'false', 'A short vibration on change where supported.'],
      ['Accessibility', '-', '-', 'A nav with aria-current="page"; ← → move between tabs; badges are part of the name.']
    ],
    usage: `import MobileTabBar from "./MobileTabBar";

<MobileTabBar
  tabs={[{ id: "home", label: "Home", icon: <HomeIcon /> }]}
  value={tab}
  onValueChange={setTab}
  fixed
/>`,
    render: props => <TabBarDemo {...props} />
  }
};
