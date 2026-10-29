import { useEffect, useRef, useState } from 'react';
import Sprite from './pixel/Sprite';
import PixelButton from './bits/PixelButton';
import PixelAvatar from './bits/PixelAvatar';
import LinkPeek from './bits/LinkPeek';
import AvatarTooltips from './bits/AvatarTooltips';
import ContextOrb from './bits/ContextOrb';
import StepLoader from './bits/StepLoader';
import SkeletonShimmer from './bits/SkeletonShimmer';
import SpotlightTour from './bits/SpotlightTour';
import linkPeekSource from './bits/LinkPeek.jsx?raw';
import avatarTooltipsSource from './bits/AvatarTooltips.jsx?raw';
import contextOrbSource from './bits/ContextOrb.jsx?raw';
import stepLoaderSource from './bits/StepLoader.jsx?raw';
import skeletonShimmerSource from './bits/SkeletonShimmer.jsx?raw';
import spotlightTourSource from './bits/SpotlightTour.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", monospace';
const pixelated = { imageRendering: 'pixelated' };
const stack = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 20, justifyItems: 'center', width: '100%', padding: '28px 16px', boxSizing: 'border-box' };
const row = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 };
const hint = { margin: 0, color: 'var(--demo-muted, #94b0c2)', font: `14px/1.4 ${PIXEL_FONT}`, textAlign: 'center' };
const panel = { width: '100%', maxWidth: 520, padding: 18, boxSizing: 'border-box', background: 'var(--demo-bg, #1a1c2c)', boxShadow: '0 0 0 2px var(--demo-line, #333c57)', borderRadius: 10, color: 'var(--demo-ink, #f4f4f4)', font: `16px/1.6 ${PIXEL_FONT}` };

// ---------- LinkPeek ----------

const PREVIEWS = {
  horizon: { site: 'Bits Lab', title: 'RetroHorizon', description: 'Synthwave horizon in crisp pixels: a striped sun, mountains and a grid rolling toward you.', image: '/pixel/biome-night.png', imageStyle: pixelated },
  quest: { site: 'Bits Lab', title: 'QuestLog', description: 'Onboarding checklist as a quest log, with locked quests, an XP bar and a fanfare at the end.', image: '/pixel/biome-plains.png', imageStyle: pixelated }
};
const slowLoad = () => new Promise(resolve => setTimeout(() => resolve({ site: 'Bits Lab', title: 'VoxelTiles', description: 'An isometric voxel island built from a heightmap. Tiles rise in, water bobs.', image: '/pixel/biome-ocean.png', imageStyle: pixelated }), 900));

function PeekDemo(props) {
  const peek = { ...props, fontFamily: PIXEL_FONT, linkColor: '#73eff7' };
  return (
    <div style={stack}>
      <p style={{ ...panel, margin: 0 }}>
        New this week: a <LinkPeek {...peek} href="/backgrounds/retro-horizon" preview={PREVIEWS.horizon}>synthwave horizon</LinkPeek>, a{' '}
        <LinkPeek {...peek} href="/pixel-game/quest-log" preview={PREVIEWS.quest}>quest log for onboarding</LinkPeek>, and an{' '}
        <LinkPeek {...peek} href="/pixel-game/voxel-tiles" load={slowLoad}>island made of voxels</LinkPeek> (this one loads its preview).
      </p>
      <p style={hint}>Hover a link, or Tab to it. Esc hides the card.</p>
    </div>
  );
}

// ---------- AvatarTooltips ----------

const PEOPLE = [
  ['pip', 'Pip', 'Explorer'],
  ['ada', 'Ada', 'Engineer'],
  ['grace', 'Grace', 'Design lead'],
  ['linus', 'Linus', 'Kernel wizard'],
  ['hedy', 'Hedy', 'Sound'],
  ['alan', 'Alan', 'Research'],
  ['tim', 'Tim', 'Web'],
  ['margaret', 'Margaret', 'Flight software']
].map(([seed, name, role]) => ({ id: seed, name, role, avatar: <PixelAvatar seed={seed} size={48} decorative /> }));

// ---------- ContextOrb ----------

function OrbDemo(props) {
  const [last, setLast] = useState('');
  const items = [
    { label: 'Copy', icon: <Sprite name="book" size={22} /> },
    { label: 'Pin', icon: <Sprite name="star" size={22} /> },
    { label: 'Craft', icon: <Sprite name="pickaxe" size={22} /> },
    { label: 'Share', icon: <Sprite name="heart" size={22} /> },
    { label: 'Enchant', icon: <Sprite name="potion" size={22} />, disabled: true },
    { label: 'Destroy', icon: <Sprite name="sword" size={22} />, danger: true }
  ];
  return (
    <div style={stack}>
      <ContextOrb {...props} items={items} onSelect={item => setLast(item.label)} fontFamily={PIXEL_FONT} style={{ width: '100%', maxWidth: 520 }}>
        <div style={{ ...panel, maxWidth: 'none', display: 'grid', placeItems: 'center', gap: 12, minHeight: 220, textAlign: 'center' }}>
          <Sprite name="chest" size={56} />
          <span>Right-click (or long-press) anywhere in this box.</span>
          <span style={{ color: 'var(--demo-muted, #94b0c2)', fontSize: 14 }}>Hold the button, flick toward an action and let go, or click one. Keyboard: Tab here, then Shift+F10.</span>
        </div>
      </ContextOrb>
      <p style={hint} aria-live="polite">
        {last ? `You chose: ${last}` : 'No action yet.'}
      </p>
    </div>
  );
}

// ---------- StepLoader ----------

const STEPS = [
  { label: 'Gathering wood', description: 'Punching trees, politely.' },
  { label: 'Crafting planks' },
  { label: 'Building the workbench' },
  { label: 'Forging a pickaxe', description: 'Needs a hot furnace.' },
  { label: 'Packing your inventory' }
];

function StepsDemo({ failAtFour, stepMs, ...props }) {
  const [run, setRun] = useState(null);
  useEffect(() => {
    if (!run || run.status !== 'running') return undefined;
    const timer = setTimeout(() => {
      if (failAtFour && run.current === 3 && !run.retried) setRun({ ...run, status: 'error' });
      else if (run.current >= STEPS.length - 1) setRun({ ...run, status: 'done' });
      else setRun({ ...run, current: run.current + 1 });
    }, stepMs);
    return () => clearTimeout(timer);
  }, [run, failAtFour, stepMs]);
  const start = fixed => setRun({ current: 0, status: 'running', fixed, retried: false });
  return (
    <div style={stack}>
      <div style={row}>
        <PixelButton size="sm" variant="success" onPress={() => start(false)}>
          Run here
        </PixelButton>
        <PixelButton size="sm" variant="info" onPress={() => start(true)}>
          Run as overlay
        </PixelButton>
      </div>
      {run ? (
        <StepLoader
          {...props}
          steps={STEPS}
          current={run.current}
          status={run.status}
          fixed={run.fixed}
          title="Setting up your world"
          fontFamily={PIXEL_FONT}
          onCancel={() => setRun(null)}
          onDone={() => setRun(null)}
          onRetry={() => setRun({ ...run, status: 'running', retried: true })}
        />
      ) : (
        <p style={hint}>Press Run. Turn on “Fail at step 4” to see the error state and Retry.</p>
      )}
    </div>
  );
}

// ---------- SkeletonShimmer ----------

function ProfileCard({ data }) {
  return (
    <div style={{ ...panel, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <PixelAvatar seed={data.seed} size={56} title={data.name} />
        <div style={{ minWidth: 0 }}>
          <div style={{ font: `13px/1.6 ${TITLE_FONT}`, color: 'var(--demo-gold, #ffcd75)' }}>{data.name}</div>
          <div style={{ color: 'var(--demo-muted, #94b0c2)' }}>{data.role}</div>
        </div>
      </div>
      <img src={data.image} alt="" style={{ width: '100%', aspectRatio: '8 / 3', objectFit: 'cover', borderRadius: 8, ...pixelated }} />
      <p style={{ margin: 0 }}>{data.bio}</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" style={{ padding: '8px 14px', border: 0, borderRadius: 8, background: '#73eff7', color: '#0b0b14', font: 'inherit', fontWeight: 700 }}>
          Follow
        </button>
        <button type="button" style={{ padding: '8px 14px', border: 0, borderRadius: 8, background: 'var(--demo-line, #333c57)', color: 'var(--demo-ink, #f4f4f4)', font: 'inherit' }}>
          Message
        </button>
      </div>
    </div>
  );
}

const PROFILES = [
  { seed: 'grace', name: 'Grace', role: 'Design lead · Snowy biome', bio: 'Builds igloos with working lights and refuses to use any block that is not perfectly white. Ask about the ice palace.', image: '/pixel/biome-snowy.png' },
  { seed: 'linus', name: 'Linus', role: 'Engineer · Desert biome', bio: 'Automated the entire cactus farm in one afternoon. Now working on a sandstone computer that can run a tiny game.', image: '/pixel/biome-desert.png' }
];

function SkeletonDemo({ hold, ...props }) {
  const [loading, setLoading] = useState(true);
  const [which, setWhich] = useState(0);
  useEffect(() => {
    if (!loading || hold) return undefined;
    const timer = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(timer);
  }, [loading, hold]);
  return (
    <div style={stack}>
      <SkeletonShimmer {...props} loading={loading || hold} style={{ width: '100%', maxWidth: 520 }}>
        <ProfileCard data={PROFILES[which]} />
      </SkeletonShimmer>
      <PixelButton
        size="sm"
        variant="secondary"
        onPress={() => {
          setWhich(w => (w + 1) % PROFILES.length);
          setLoading(true);
        }}
      >
        Load next profile
      </PixelButton>
    </div>
  );
}

// ---------- SpotlightTour ----------

function TourDemo(props) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const refs = { logo: useRef(null), search: useRef(null), quests: useRef(null), craft: useRef(null), me: useRef(null) };
  const steps = [
    { target: refs.logo, title: 'Welcome to Bits Lab', body: 'This quick tour shows you around. Use the arrow keys or the buttons.' },
    { target: refs.search, title: 'Find anything', body: 'Search every component, block and biome from here.', side: 'bottom' },
    { target: refs.quests, title: 'Your quests', body: 'Onboarding tasks live here, and they pay out XP.' },
    { target: refs.craft, title: 'Craft something', body: 'Press Craft to make your first item. That completes the tour quest.' },
    { target: refs.me, title: 'Your profile', body: 'Settings, sounds and your avatar live behind this face.' }
  ];
  const chip = { padding: '6px 10px', borderRadius: 6, background: 'var(--demo-chip, #262b44)' };
  return (
    <div style={stack}>
      <div style={{ ...panel, padding: 0, overflow: 'hidden', maxWidth: 560 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--demo-field, #0b0b14)' }}>
          <span ref={refs.logo} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, font: `11px ${TITLE_FONT}`, color: 'var(--demo-accent, #73eff7)' }}>
            <Sprite name="gem" size={20} /> BITS
          </span>
          <span ref={refs.search} style={{ ...chip, flex: 1, minWidth: 0, color: '#566c86' }}>
            Search…
          </span>
          <span ref={refs.me} style={{ display: 'inline-flex' }}>
            <PixelAvatar seed="pip" size={32} title="Your profile" shape="circle" />
          </span>
        </div>
        <div style={{ display: 'flex', gap: 14, padding: 14, flexWrap: 'wrap' }}>
          <div ref={refs.quests} style={{ display: 'grid', gap: 6, flex: '1 1 140px' }}>
            {['Create character', 'Equip pickaxe', 'Finish the tour'].map(q => (
              <span key={q} style={chip}>
                {q}
              </span>
            ))}
          </div>
          <div style={{ display: 'grid', placeItems: 'center', gap: 10, flex: '1 1 160px', padding: 12, background: 'var(--demo-chip, #262b44)', borderRadius: 8 }}>
            <Sprite name="pickaxe" size={40} />
            <span ref={refs.craft} style={{ display: 'inline-flex' }}>
              <PixelButton size="sm" variant="success" onPress={() => setNote('Crafted a pickaxe!')}>
                Craft
              </PixelButton>
            </span>
          </div>
        </div>
      </div>
      <PixelButton size="sm" variant="primary" onPress={() => setOpen(true)}>
        Start the tour
      </PixelButton>
      <p style={hint} aria-live="polite">
        {note || 'The tour dims the page and walks through five spots.'}
      </p>
      <SpotlightTour
        {...props}
        steps={steps}
        open={open}
        fontFamily={PIXEL_FONT}
        onClose={completed => {
          setOpen(false);
          setNote(completed ? 'Tour complete. Quest unlocked!' : 'Tour skipped.');
        }}
      />
    </div>
  );
}

// ---------- Entries ----------

export const OVERLAY_MORE_DEMOS = {
  'link-peek': {
    source: linkPeekSource,
    defaults: { delay: 350, width: 280, imageHeight: 140, tilt: 4, accentColor: '#73eff7' },
    controls: [slider('delay', 'Hover delay (ms)', 0, 1000, 50), slider('width', 'Card width', 200, 380, 10), slider('imageHeight', 'Image height', 0, 220, 10), slider('tilt', 'Tilt toward pointer (°)', 0, 12, 1), color('accentColor', 'Accent')],
    docs: [
      ['href / children', 'string / ReactNode', '-', 'A normal link; target and rel pass through (rel defaults safely for _blank).'],
      ['preview', '{ title, description?, image?, imageStyle?, site? }', '-', 'The card content, when you already have it.'],
      ['load', '(href) => Promise<preview>', '-', 'Fetch the preview on first open (cached per href); a shimmer shows meanwhile.'],
      ['delay / width / imageHeight', 'number', '350 / 280 / 140', 'Hover delay (focus shows at once), card width and image height.'],
      ['tilt', 'number', '4', 'How far the card leans toward the pointer, in degrees.'],
      ['Accessibility', '-', '-', 'The preview describes the link (aria-describedby); Esc hides; flips below when there is no room above.']
    ],
    usage: `import LinkPeek from "./LinkPeek";

<LinkPeek href="/docs" preview={{ title: "Docs", description: "Start here.", image: "/docs.png" }}>
  the docs
</LinkPeek>`,
    render: props => <PeekDemo {...props} />
  },

  'avatar-tooltips': {
    source: avatarTooltipsSource,
    defaults: { max: 6, size: 48, overlap: 14, spread: 6, sway: 12, accentColor: '#73eff7' },
    controls: [slider('max', 'Max shown', 2, 8, 1), slider('size', 'Size', 28, 72, 2), slider('overlap', 'Overlap', 0, 30, 1), slider('spread', 'Spread on hover', 0, 20, 1), slider('sway', 'Tag sway (°)', 0, 30, 1), color('accentColor', 'Accent')],
    docs: [
      ['people', '{ id?, name, role?, avatar? }[]', '[]', 'avatar is an image URL or any node; initials are used otherwise.'],
      ['max', 'number', '5', 'Visible avatars; the rest fold into a "+N" chip that lists them.'],
      ['size / overlap / spread / ring', 'number', '48 / 14 / 6 / 3', 'Avatar size, overlap at rest, gap when fanned out, and the ring.'],
      ['sway', 'number', '12', 'How far the name tag swings toward the pointer, in degrees.'],
      ['Accessibility', '-', '-', 'Each avatar is focusable with its name; tags show on focus too.']
    ],
    usage: `import AvatarTooltips from "./AvatarTooltips";

<AvatarTooltips people={[{ name: "Ada", role: "Engineer", avatar: "/ada.png" }]} />`,
    render: props => (
      <div style={stack}>
        <AvatarTooltips {...props} people={PEOPLE} fontFamily={PIXEL_FONT} label="Guild members" />
        <p style={hint}>Hover the stack, then move across the faces.</p>
      </div>
    )
  },

  'context-orb': {
    source: contextOrbSource,
    defaults: { radius: 78, itemSize: 48, deadZone: 26, accentColor: '#73eff7' },
    controls: [slider('radius', 'Ring radius', 50, 130, 2), slider('itemSize', 'Action size', 32, 64, 2), slider('deadZone', 'Dead zone', 8, 60, 2), color('accentColor', 'Accent')],
    docs: [
      ['items', '{ label, icon?, onSelect?, disabled?, danger? }[]', '[]', 'Actions, clockwise from the top.'],
      ['children', 'ReactNode', '-', 'The area that opens the menu on right-click or long-press.'],
      ['onSelect', '(item, index) => void', '-', 'Fires for any choice (alongside the item’s own onSelect).'],
      ['radius / itemSize / hubSize', 'number', '78 / 48 / 64', 'Ring geometry; it is kept fully on screen.'],
      ['deadZone / longPress', 'number', '26 / 450', 'Pointer distance before aiming starts; touch hold time in ms.'],
      ['Keyboard', '-', '-', 'ContextMenu key or Shift+F10 opens it; arrows go round; Enter picks; Esc closes and returns focus.']
    ],
    usage: `import ContextOrb from "./ContextOrb";

<ContextOrb items={[{ label: "Copy", icon: <CopyIcon />, onSelect: copy }]}>
  <Canvas />
</ContextOrb>`,
    render: props => <OrbDemo {...props} />
  },

  'step-loader': {
    source: stepLoaderSource,
    defaults: { stepMs: 1100, failAtFour: false, accentColor: '#38b764', radius: 16 },
    controls: [slider('stepMs', 'Time per step (ms)', 300, 3000, 100), toggle('failAtFour', 'Fail at step 4'), slider('radius', 'Radius', 0, 28, 1), color('accentColor', 'Accent')],
    docs: [
      ['steps', '{ id?, label, description? }[]', '[]', 'The steps, in order.'],
      ['current / status', 'number / "running" | "done" | "error"', '0 / "running"', 'You drive it: advance current as work finishes.'],
      ['onCancel / onDone / onRetry', '() => void', '-', 'Cancel while running (and Esc as an overlay); Done at the end; Retry after an error.'],
      ['fixed', 'boolean', 'false', 'Show as a modal overlay that takes focus.'],
      ['title / successMessage / errorMessage', 'string', 'English', 'Heading text for each phase.'],
      ['Accessibility', '-', '-', 'Ordered list with aria-current="step"; every change is announced; a progressbar on top.']
    ],
    usage: `import StepLoader from "./StepLoader";

<StepLoader steps={steps} current={index} status={status} onCancel={abort} />`,
    demoOnly: ['stepMs', 'failAtFour'],
    render: props => <StepsDemo {...props} />
  },

  'skeleton-shimmer': {
    source: skeletonShimmerSource,
    defaults: { hold: false, lineScale: 0.62, speed: 1400, fade: 320 },
    controls: [toggle('hold', 'Hold the skeleton'), slider('lineScale', 'Line thickness', 0.3, 1, 0.02), slider('speed', 'Shimmer (ms)', 600, 3000, 100), slider('fade', 'Crossfade (ms)', 0, 1000, 20)],
    docs: [
      ['loading', 'boolean', 'false', 'While true, the content is hidden and traced into a skeleton.'],
      ['children', 'ReactNode', '-', 'Your real component, rendered with placeholder data while loading.'],
      ['lineScale', 'number', '0.62', 'Bar thickness as a share of each text line.'],
      ['speed / fade', 'number', '1400 / 320', 'Shimmer cycle and crossfade, in ms.'],
      ['baseColor / shineColor', 'string', 'slate', 'Skeleton colors.'],
      ['data-skeleton', 'attribute', '-', 'Add to any element to make it a block; data-skeleton="skip" leaves it out.'],
      ['Accessibility', '-', '-', 'aria-busy plus a "Loading…" status; hidden content is inert until it loads.']
    ],
    usage: `import SkeletonShimmer from "./SkeletonShimmer";

<SkeletonShimmer loading={!user}>
  <ProfileCard user={user ?? placeholderUser} />
</SkeletonShimmer>`,
    demoOnly: ['hold'],
    render: props => <SkeletonDemo {...props} />
  },

  'spotlight-tour': {
    source: spotlightTourSource,
    defaults: { padding: 8, radius: 12, width: 320, accentColor: '#73eff7', closeOnBackdrop: false },
    controls: [slider('padding', 'Spotlight padding', 0, 24, 1), slider('radius', 'Spotlight radius', 0, 28, 1), slider('width', 'Bubble width', 240, 420, 10), toggle('closeOnBackdrop', 'Click outside to close'), color('accentColor', 'Accent')],
    docs: [
      ['steps', '{ target, title, body, side? }[]', '[]', 'target is a CSS selector or a ref; with no target the bubble centres.'],
      ['open / onClose', 'boolean / (completed: boolean) => void', 'false', 'Controlled; onClose says whether the user finished or skipped.'],
      ['startAt / onStepChange', 'number / (index) => void', '0', 'Starting step and step changes.'],
      ['padding / radius / gap / width', 'number', '8 / 12 / 14 / 320', 'Spotlight geometry and bubble size.'],
      ['backLabel / nextLabel / doneLabel / skipLabel', 'string', 'English', 'Button text.'],
      ['Accessibility', '-', '-', 'The bubble is a modal dialog: focus moves in and stays, arrows step, Esc skips, focus returns at the end.']
    ],
    usage: `import SpotlightTour from "./SpotlightTour";

<SpotlightTour
  open={open}
  onClose={() => setOpen(false)}
  steps={[{ target: "#search", title: "Search", body: "Find anything here." }]}
/>`,
    render: props => <TourDemo {...props} />
  }
};
