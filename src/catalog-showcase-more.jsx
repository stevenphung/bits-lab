import { useRef, useState } from 'react';
import Sprite from './pixel/Sprite';
import PixelAvatar from './bits/PixelAvatar';
import LogoOrbit from './bits/LogoOrbit';
import ChangelogTimeline from './bits/ChangelogTimeline';
import TestimonialWall from './bits/TestimonialWall';
import CodeShowcase from './bits/CodeShowcase';
import PricingFlip from './bits/PricingFlip';
import logoOrbitSource from './bits/LogoOrbit.jsx?raw';
import changelogTimelineSource from './bits/ChangelogTimeline.jsx?raw';
import testimonialWallSource from './bits/TestimonialWall.jsx?raw';
import codeShowcaseSource from './bits/CodeShowcase.jsx?raw';
import pricingFlipSource from './bits/PricingFlip.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const stack = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18, justifyItems: 'center', width: '100%', padding: '28px 16px', boxSizing: 'border-box' };
const hint = { margin: 0, color: 'var(--demo-muted, #94b0c2)', font: `14px/1.4 ${PIXEL_FONT}`, textAlign: 'center' };

// ---------- LogoOrbit ----------

const LOGOS = [
  ['heart', 'Health sync'],
  ['gem', 'Gem vault'],
  ['pickaxe', 'Mining API'],
  ['sword', 'Arena'],
  ['chest', 'Storage'],
  ['potion', 'Alchemy'],
  ['book', 'Docs'],
  ['star', 'Achievements'],
  ['orb', 'Portals'],
  ['coin', 'Payments'],
  ['note', 'Sound'],
  ['lever', 'Webhooks']
].map(([sprite, label]) => ({ id: sprite, label, icon: <Sprite name={sprite} size={28} /> }));

function OrbitDemo({ count, ...props }) {
  const [focus, setFocus] = useState('');
  return (
    <div style={stack} onPointerOver={event => setFocus(event.target.closest('[role="img"]')?.getAttribute('aria-label') ?? '')}>
      <LogoOrbit {...props} logos={LOGOS.slice(0, count)} center={<Sprite name="gem" size={52} />} fontFamily={PIXEL_FONT} />
      <p style={hint} aria-hidden="true">
        {focus ? `${focus} connects to Bits Lab` : 'Hover to pause the orbit and name a logo.'}
      </p>
    </div>
  );
}

// ---------- ChangelogTimeline ----------

const biome = id => <img src={`/pixel/biome-${id}.png`} alt="" width={640} height={240} style={{ imageRendering: 'pixelated', aspectRatio: '8 / 3', objectFit: 'cover' }} />;
const ENTRIES = [
  { date: 'Oct 27, 2026', dateTime: '2026-10-27', title: 'Quest log and boot screens', tag: 'v3.2', body: [<p key="a">Eight new pixel components, including a quest log that pays out XP and a BIOS boot screen that powers on your app.</p>, <p key="b">Every one ships with a TypeScript twin.</p>], media: biome('cherry') },
  { date: 'Oct 12, 2026', dateTime: '2026-10-12', title: 'Snowy biome', tag: 'v3.1', body: 'A brand-new snowy biome for every scene, plus softer shadows on the parallax layers.', media: biome('snowy') },
  { date: 'Sep 30, 2026', dateTime: '2026-09-30', title: 'Faster installs', tag: 'v3.0', body: [<p key="a">The registry now serves TypeScript variants side by side, and installs are about twice as fast.</p>, <p key="b">Breaking: the old <code>/r/v1</code> paths are gone.</p>] },
  { date: 'Sep 2, 2026', dateTime: '2026-09-02', title: 'Underworld theme', tag: 'v2.4', body: 'Glowing lava palettes and a crumbling-stone loader.', media: biome('underworld') },
  { date: 'Aug 14, 2026', dateTime: '2026-08-14', title: 'Hello, Bits Lab', tag: 'v2.0', body: 'The first public release: pixel buttons, health bars and an inventory grid.' }
];

function ChangelogDemo(props) {
  const ref = useRef(null);
  return (
    <div ref={ref} style={{ width: '100%', height: 460, overflowY: 'auto', padding: '32px 16px 160px', boxSizing: 'border-box' }} tabIndex={0} aria-label="Changelog demo (scrolls)">
      <ChangelogTimeline {...props} entries={ENTRIES} scrollRoot={ref} fontFamily={PIXEL_FONT} />
    </div>
  );
}

// ---------- TestimonialWall ----------

const QUOTES = [
  ['pip', 'Pip', 'Cave explorer', 'Swapped our whole HUD for Bits Lab in an afternoon. The health bar alone got more compliments than the game.'],
  ['ada', 'Ada', 'Indie dev', 'Finally, pixel UI that is actually accessible.'],
  ['grace', 'Grace', 'Design lead', 'The quest log turned our onboarding into something people finish. Completion went way up and nobody complained about the fanfare, not even legal.'],
  ['linus', 'Linus', 'Engineer', 'Copy, paste, ship. No dependencies to fight with.'],
  ['margaret', 'Margaret', 'Studio founder', 'Our launch page uses five of these components and it still loads instantly.'],
  ['tim', 'Tim', 'Web developer', 'The keyboard support is better than in most "serious" component libraries I have used, which is a little embarrassing for them.'],
  ['hedy', 'Hedy', 'Sound designer', 'ChiptuneKit plus PixelButton is a dangerous amount of fun.'],
  ['alan', 'Alan', 'Researcher', 'Deterministic avatars for every user, generated on the fly. Lovely.'],
  ['katherine', 'Katherine', 'Product manager', 'We shipped the GameOver screen as our 404 page and support tickets now start with "I loved the 404".']
].map(([seed, name, role, quote]) => ({ name, role, quote, avatar: <PixelAvatar seed={seed} size={36} background decorative /> }));

// ---------- CodeShowcase ----------

const FILES = [
  {
    name: 'App.jsx',
    code: `import QuestLog from "./QuestLog";
import { quests } from "./quests";

export default function App() {
  const [done, setDone] = useState(["create"]);
  return (
    <QuestLog
      quests={quests}
      completed={done}
      onCompletedChange={setDone}
    />
  );
}`
  },
  {
    name: 'App.tsx',
    highlight: [4, 5],
    code: `import QuestLog from "./QuestLog";
import { quests } from "./quests";

export default function App(): JSX.Element {
  const [done, setDone] = useState<string[]>(["create"]);
  return (
    <QuestLog
      quests={quests}
      completed={done}
      onCompletedChange={setDone}
    />
  );
}`
  },
  {
    name: 'quests.diff',
    diff: true,
    code: ` export const quests = [
   { id: "create", title: "Create your character", xp: 50 },
-  { id: "equip", title: "Equip a pickaxe", xp: 20 },
+  { id: "equip", title: "Equip a pickaxe", xp: 30, requires: ["create"] },
+  { id: "mine", title: "Mine your first gem", xp: 80, requires: ["equip"] },
 ];`
  }
];

// ---------- PricingFlip ----------

const PLANS = [
  { id: 'free', name: 'Wanderer', description: 'For trying things out.', monthly: 0, yearly: 0, features: ['10 components', 'Community support'], cta: 'Start free' },
  { id: 'pro', name: 'Adventurer', description: 'For solo makers shipping real apps.', monthly: 12, yearly: 10, features: ['Every component', 'TypeScript variants', 'Email support'], cta: 'Go Adventurer', featured: true, badge: 'Most popular' },
  { id: 'team', name: 'Guild', description: 'For teams who share a design system.', monthly: 49, yearly: 39, features: ['Everything in Adventurer', 'Shared registry', 'Priority support', 'Custom themes'], cta: 'Form a guild' }
];

function PricingDemo(props) {
  const [picked, setPicked] = useState('');
  return (
    <div style={stack}>
      <PricingFlip {...props} plans={PLANS} fontFamily={PIXEL_FONT} onSelect={(plan, period) => setPicked(`${plan.name}, billed ${period}`)} />
      <p style={hint} aria-live="polite">
        {picked ? `Selected: ${picked}` : 'Flip to yearly and watch the digits roll.'}
      </p>
    </div>
  );
}

// ---------- Entries ----------

export const SHOWCASE_MORE_DEMOS = {
  'logo-orbit': {
    source: logoOrbitSource,
    defaults: { count: 12, rings: 2, duration: 40, itemSize: 52, innerRadius: 24, ringGap: 17, showTracks: true, pauseOnHover: true, accentColor: '#73eff7' },
    controls: [slider('count', 'Logos', 1, 12, 1), slider('rings', 'Rings', 1, 3, 1), slider('duration', 'Seconds per turn', 10, 120, 5), slider('itemSize', 'Logo size', 32, 80, 2), slider('innerRadius', 'Inner radius (%)', 14, 40, 1), slider('ringGap', 'Ring gap (%)', 8, 24, 1), toggle('showTracks', 'Tracks'), toggle('pauseOnHover', 'Pause on hover'), color('accentColor', 'Accent')],
    docs: [
      ['logos', '{ id?, label, icon }[]', '[]', 'Shared across the rings by circumference. label names it on hover and for screen readers.'],
      ['center', 'ReactNode', '-', 'Your brand mark in the middle.'],
      ['rings / innerRadius / ringGap', 'number', '2 / 24 / 16', 'Ring count and radii as a percentage of the box width.'],
      ['duration', 'number', '40', 'Seconds per turn for the inner ring; outer rings are slower and alternate direction.'],
      ['size / itemSize / centerSize', 'number', '480 / 52 / 96', 'Box (scales down to its container), logo tile and center sizes in px.'],
      ['pauseOnHover / showTracks', 'boolean', 'true / true', 'Hover or focus pauses; dashed ring tracks.'],
      ['Motion', '-', '-', 'Pauses off-screen; still under reduced motion.']
    ],
    usage: `import LogoOrbit from "./LogoOrbit";

<LogoOrbit
  center={<Logo />}
  logos={[{ label: "Stripe", icon: <StripeIcon /> }]}
/>`,
    demoOnly: ['count'],
    render: props => <OrbitDemo {...props} />
  },

  'changelog-timeline': {
    source: changelogTimelineSource,
    defaults: { anchor: 0.6, dateColumn: 140, stickyTop: 24, accentColor: '#73eff7' },
    controls: [slider('anchor', 'Beam tip (viewport %)', 0.2, 0.9, 0.05), slider('dateColumn', 'Date column', 80, 220, 10), slider('stickyTop', 'Sticky offset', 0, 120, 4), color('accentColor', 'Beam')],
    docs: [
      ['entries', '{ id?, date, dateTime?, title, tag?, body?, media?, mediaAlt? }[]', '[]', 'body is text or nodes; media is an image URL or any node (video, embed).'],
      ['scrollRoot', 'RefObject<HTMLElement>', 'window', 'The scroller the beam measures against, when it is not the page.'],
      ['anchor', 'number', '0.6', 'Where the beam tip sits, as a share of the viewport height.'],
      ['dateColumn / stickyTop', 'number', '140 / 24', 'Date column width and how far from the top dates stick.'],
      ['Layout', '-', '-', 'Under 600px wide (container query) dates move above their entry.'],
      ['Accessibility', '-', '-', 'An ordered list with <time> elements and headings; reduced motion shows everything lit.']
    ],
    usage: `import ChangelogTimeline from "./ChangelogTimeline";

<ChangelogTimeline
  entries={[{ date: "Oct 27", title: "Quest log", tag: "v3.2", body: "…" }]}
/>`,
    fullBleed: true,
    render: props => <ChangelogDemo {...props} />
  },

  'testimonial-wall': {
    source: testimonialWallSource,
    defaults: { rows: 3, speed: 30, cardWidth: 300, lines: 4, showPause: true, accentColor: '#73eff7' },
    controls: [slider('rows', 'Rows', 1, 4, 1), slider('speed', 'Speed (px/s)', 5, 120, 5), slider('cardWidth', 'Card width', 200, 420, 10), slider('lines', 'Lines before "more"', 2, 8, 1), toggle('showPause', 'Pause button'), color('accentColor', 'Accent')],
    docs: [
      ['testimonials', '{ quote, name, role?, avatar? }[]', '[]', 'avatar is an image URL or any node. Dealt across the rows, each starting at a different quote.'],
      ['rows / speed', 'number', '3 / 30', 'Marquee rows (alternating direction) and px per second; rows vary their speed slightly.'],
      ['cardWidth / lines', 'number', '300 / 4', 'Card width, and lines shown until the card is hovered or focused.'],
      ['showPause', 'boolean', 'true', 'A Pause/Play button, so moving content can always be stopped.'],
      ['Interaction', '-', '-', 'Hover or focus pauses a row and expands the card. Reduced motion turns rows into scrollers.']
    ],
    usage: `import TestimonialWall from "./TestimonialWall";

<TestimonialWall
  testimonials={[{ quote: "Shipped in a day.", name: "Ada", role: "Indie dev" }]}
/>`,
    render: props => (
      <div style={{ width: '100%' }}>
        <TestimonialWall {...props} testimonials={QUOTES} fontFamily={PIXEL_FONT} />
      </div>
    )
  },

  'code-showcase': {
    source: codeShowcaseSource,
    defaults: { autoPlay: 4000, stagger: 45, morphDuration: 260, showLineNumbers: true, showChrome: true, accentColor: '#73eff7' },
    controls: [slider('autoPlay', 'Auto-advance (ms, 0 off)', 0, 8000, 500), slider('stagger', 'Reveal stagger (ms)', 0, 120, 5), slider('morphDuration', 'Morph (ms)', 100, 800, 20), toggle('showLineNumbers', 'Line numbers'), toggle('showChrome', 'Window dots'), color('accentColor', 'Accent')],
    docs: [
      ['files', '{ name, code, diff?, highlight? }[]', '[]', 'diff marks lines starting with + / -; highlight lists line numbers to emphasise.'],
      ['file / defaultFile / onFileChange', 'number', '0', 'Controlled or uncontrolled active tab.'],
      ['autoPlay', 'number', '0', 'Advance to the next file every N ms (with a progress bar) until a tab is clicked; pauses on hover/focus.'],
      ['reveal / stagger', 'boolean / number', 'true / 45', 'Line-by-line reveal on first view.'],
      ['morphDuration', 'number', '260', 'Fold-out then fold-in time for changed lines between files.'],
      ['copyable / showLineNumbers / showChrome', 'boolean', 'true', 'Copy button (diffs copy the "after" version), numbers, window dots.'],
      ['Theme', 'string', 'Sweetie 16', 'keywordColor, stringColor, numberColor, tagColor, functionColor, addColor, removeColor…']
    ],
    usage: `import CodeShowcase from "./CodeShowcase";

<CodeShowcase
  files={[{ name: "App.jsx", code: source }]}
  autoPlay={4000}
/>`,
    render: props => (
      <div style={{ ...stack, padding: '28px 12px' }}>
        <CodeShowcase {...props} files={FILES} />
      </div>
    )
  },

  'pricing-flip': {
    source: pricingFlipSource,
    defaults: { priceSize: 44, accentColor: '#73eff7', saveColor: '#ffcd75', radius: 18 },
    controls: [slider('priceSize', 'Price size', 28, 64, 2), slider('radius', 'Radius', 0, 28, 1), color('accentColor', 'Accent'), color('saveColor', 'Save badge')],
    docs: [
      ['plans', '{ id?, name, description?, monthly, yearly?, features?, cta?, featured?, badge? }[]', '[]', 'yearly is the per-month price when billed yearly; 0 shows freeLabel.'],
      ['period / defaultPeriod / onPeriodChange', '"monthly" | "yearly"', '"monthly"', 'Controlled or uncontrolled billing period.'],
      ['onSelect', '(plan, period) => void', '-', 'The plan button.'],
      ['currency / locale', 'string', '"USD" / "en-US"', 'Formatting through Intl.NumberFormat.'],
      ['monthlyLabel / yearlyLabel / perLabel / freeLabel / billedYearly', 'string / function', 'English', 'All text is replaceable.'],
      ['Save badge', '-', '-', 'The best saving across plans, computed from your prices.'],
      ['Accessibility', '-', '-', 'The switch is a radio group with arrow keys; prices read as "$12 per month"; the change is announced once.']
    ],
    usage: `import PricingFlip from "./PricingFlip";

<PricingFlip
  plans={[{ name: "Pro", monthly: 12, yearly: 10, cta: "Buy" }]}
/>`,
    render: props => <PricingDemo {...props} />
  }
};
