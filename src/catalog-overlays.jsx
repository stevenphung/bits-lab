import { useState } from 'react';
import Sprite from './pixel/Sprite';
import PixelButton from './bits/PixelButton';
import MorphDialog from './bits/MorphDialog';
import MorphPopover from './bits/MorphPopover';
import Toaster, { NoticeStack, toast } from './bits/ToastStack';
import SpringDrawer from './bits/SpringDrawer';
import Confetti, { confetti } from './bits/Confetti';
import morphDialogSource from './bits/MorphDialog.jsx?raw';
import morphPopoverSource from './bits/MorphPopover.jsx?raw';
import toastStackSource from './bits/ToastStack.jsx?raw';
import springDrawerSource from './bits/SpringDrawer.jsx?raw';
import confettiSource from './bits/Confetti.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", monospace';
const pixelated = { imageRendering: 'pixelated' };
const biome = id => `/pixel/biome-${id}.png`;
const row = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14 };
const hint = { margin: 0, color: 'var(--demo-muted, #94b0c2)', font: `14px/1.4 ${PIXEL_FONT}`, textAlign: 'center' };
const field = { width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: 0, background: 'var(--demo-panel, #29366f)', color: 'var(--demo-ink, #f4f4f4)', font: `15px ${PIXEL_FONT}`, outline: 'none', boxShadow: 'inset 0 -3px 0 #1a1c2c' };

// ---------- MorphDialog ----------

const WORLDS = [
  { scene: 'cherry', icon: 'note', name: 'Blossom Hills', seed: '4417', blurb: 'Pink canopies, calm rivers and bees that hum chiptune. The gentlest start a new player can get.' },
  { scene: 'snowy', icon: 'gem', name: 'Frost Peaks', seed: '9021', blurb: 'Steep climbs and the rarest gems in the game, hidden above the snowline. Bring a warm coat.' },
  { scene: 'underworld', icon: 'potion', name: 'Ember Depths', seed: '6660', blurb: 'Lava seas and glowing fungus. Hard mode only, and the best brewing ingredients anywhere.' }
];

function MorphDialogDemo(props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, width: '100%', maxWidth: 760, margin: '0 auto', padding: '24px 0' }}>
      {WORLDS.map(world => (
        <MorphDialog
          key={world.name}
          {...props}
          fontFamily={PIXEL_FONT}
          title={world.name}
          media={<img src={biome(world.scene)} alt="" style={pixelated} />}
          card={
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, font: `10px/1.6 ${TITLE_FONT}` }}>
                <Sprite name={world.icon} size={20} />
                {world.name}
              </div>
              <div style={{ marginTop: 4, color: 'var(--demo-muted, #94b0c2)', fontSize: 14 }}>Seed {world.seed}</div>
            </div>
          }
        >
          <p style={{ margin: '0 0 16px', color: 'var(--demo-muted, #94b0c2)', lineHeight: 1.6 }}>{world.blurb}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <PixelButton variant="success" size="sm" data-autofocus>
              Play world
            </PixelButton>
            <PixelButton variant="secondary" size="sm">
              Copy seed
            </PixelButton>
          </div>
        </MorphDialog>
      ))}
    </div>
  );
}

// ---------- MorphPopover ----------

function FeedbackForm({ close }) {
  const [sent, setSent] = useState(false);
  if (sent)
    return (
      <div style={{ display: 'grid', justifyItems: 'center', gap: 10, padding: '18px 0', font: `15px ${PIXEL_FONT}` }}>
        <Sprite name="star" size={36} />
        Thanks, adventurer!
        <PixelButton size="sm" variant="secondary" onPress={close}>
          Close
        </PixelButton>
      </div>
    );
  return (
    <form
      style={{ display: 'grid', gap: 10, font: `15px ${PIXEL_FONT}` }}
      onSubmit={event => {
        event.preventDefault();
        setSent(true);
      }}
    >
      <label style={{ color: 'var(--demo-muted, #94b0c2)', fontSize: 14 }} htmlFor="bl-demo-feedback">
        What should we build next?
      </label>
      <textarea id="bl-demo-feedback" rows={4} placeholder="More biomes, please…" style={{ ...field, resize: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <PixelButton size="sm" variant="secondary" onPress={close}>
          Cancel
        </PixelButton>
        <PixelButton size="sm" variant="success" type="submit">
          Send
        </PixelButton>
      </div>
    </form>
  );
}

const SHARE = [
  ['coin', 'Copy invite link'],
  ['book', 'Export world map'],
  ['chest', 'Send to a friend']
];

function MorphPopoverDemo(props) {
  return (
    <div style={{ display: 'grid', gap: 18, justifyItems: 'center', width: '100%', minHeight: 320, padding: '32px 0', alignContent: 'start' }}>
      <div style={row}>
        <MorphPopover {...props} label="Feedback" icon={<Sprite name="note" size={18} />} fontFamily={PIXEL_FONT}>
          {({ close }) => <FeedbackForm close={close} />}
        </MorphPopover>
        <MorphPopover {...props} label="Share" icon={<Sprite name="star" size={18} />} panelWidth={240} align="end" fontFamily={PIXEL_FONT}>
          {({ close }) => (
            <div role="menu" style={{ display: 'grid', gap: 4, margin: -6 }}>
              {SHARE.map(([icon, text]) => (
                <button
                  key={text}
                  role="menuitem"
                  type="button"
                  onClick={close}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px', border: 0, background: 'transparent', color: 'var(--demo-ink, #f4f4f4)', font: `15px ${PIXEL_FONT}`, textAlign: 'left', cursor: 'pointer' }}
                >
                  <Sprite name={icon} size={20} />
                  {text}
                </button>
              ))}
            </div>
          )}
        </MorphPopover>
      </div>
      <p style={hint}>Click a button. Esc or a click outside closes it.</p>
    </div>
  );
}

// ---------- ToastStack ----------

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const NOTICES = [
  { id: 'update', title: 'Update 1.4 is out', description: 'Cherry groves and a new boss.', type: 'info', action: { label: 'Read notes' } },
  { id: 'backup', title: 'Backup finished', description: 'Your three worlds are safe.', type: 'success' },
  { id: 'storage', title: 'Storage almost full', description: '92% of 5 GB used.', type: 'error' },
  { id: 'invite', title: 'Mira invited you', description: 'Join her realm “Lantern Bay”.' }
];

function ToastDemo(props) {
  const [round, setRound] = useState(0);
  return (
    <div style={{ position: 'relative', width: '100%', height: 660, overflow: 'hidden', background: `url(${biome('plains')}) center / cover`, ...pixelated }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,28,44,0.55)' }} />
      <div style={{ position: 'relative', display: 'grid', gap: 12, justifyItems: 'center', padding: '28px 16px' }}>
        <div style={row}>
          <PixelButton size="sm" variant="secondary" onPress={() => toast('World saved', { description: 'Autosave every 5 minutes.', icon: <Sprite name="book" size={18} /> })}>
            Default
          </PixelButton>
          <PixelButton size="sm" variant="success" onPress={() => toast.success('Diamond found!', { description: '+50 XP' })}>
            Success
          </PixelButton>
          <PixelButton size="sm" variant="primary" onPress={() => toast.error('You fell in lava', { description: 'Items dropped at 120, 12, -40.' })}>
            Error
          </PixelButton>
          <PixelButton size="sm" variant="info" onPress={() => toast.info('Night is falling', { description: 'Monsters spawn in 30 seconds.' })}>
            Info
          </PixelButton>
        </div>
        <div style={row}>
          <PixelButton
            size="sm"
            variant="warning"
            onPress={() =>
              toast.promise(wait(1800).then(() => (Math.random() > 0.25 ? 'ok' : Promise.reject(new Error('timeout')))), {
                loading: 'Uploading world…',
                success: 'World uploaded to the realm',
                error: 'Upload failed. Try again.'
              })
            }
          >
            Promise
          </PixelButton>
          <PixelButton size="sm" variant="secondary" onPress={() => toast('Chest broken', { action: { label: 'Undo', onClick: () => toast.success('Chest restored') } })}>
            With action
          </PixelButton>
          <PixelButton size="sm" variant="secondary" onPress={() => toast.dismiss()}>
            Clear all
          </PixelButton>
        </div>
        <p style={{ ...hint, color: 'var(--demo-ink, #f4f4f4)' }}>Hover the stack to fan it out. Swipe a toast sideways to dismiss.</p>
        <NoticeStack key={round} notices={NOTICES} radius={props.radius} width={props.width} fontFamily={PIXEL_FONT} label="Inline notices" />
        <PixelButton size="sm" variant="ghost" onPress={() => setRound(r => r + 1)}>
          Bring the notices back
        </PixelButton>
      </div>
      <Toaster {...props} contained fontFamily={PIXEL_FONT} />
    </div>
  );
}

// ---------- SpringDrawer ----------

const BACKPACK = [
  ['sword', 'Iron sword', 'Sharp enough for most slimes.'],
  ['pickaxe', 'Stone pickaxe', 'Mines coal and iron ore.'],
  ['potion', 'Night vision potion', 'Lasts 3 minutes.'],
  ['gem', 'Diamond × 3', 'Save these for armor.'],
  ['book', 'Old tome', 'The pages are blank. For now.'],
  ['coin', 'Gold coins × 42', 'Spend them in the village.'],
  ['heart', 'Golden apple', 'Restores 4 hearts.'],
  ['chest', 'Ender pouch', 'Bigger on the inside.']
];

function DrawerDemo({ side, ...props }) {
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState(null);
  return (
    <div style={{ position: 'relative', width: '100%', height: 540, overflow: 'hidden', background: `url(${biome('forest')}) center / cover`, ...pixelated }}>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', alignContent: 'center', gap: 14 }}>
        <PixelButton variant="warning" onPress={() => setOpen(true)}>
          Open backpack
        </PixelButton>
        <p style={{ ...hint, color: '#f4f4f4', textShadow: '1px 1px 0 #1a1c2c' }}>Drag the handle, flick it, or pull it down to close.</p>
      </div>
      <SpringDrawer
        {...props}
        side={side}
        contained
        open={open}
        onOpenChange={setOpen}
        title="Backpack"
        description="8 of 27 slots used"
        fontFamily={PIXEL_FONT}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          {BACKPACK.map(([icon, name, desc]) => (
            <button
              key={name}
              type="button"
              onClick={() => setItem({ icon, name, desc })}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: 0, background: 'var(--demo-panel, #29366f)', color: 'var(--demo-ink, #f4f4f4)', font: `15px ${PIXEL_FONT}`, textAlign: 'left', cursor: 'pointer', boxShadow: 'inset 0 -3px 0 #1a1c2c' }}
            >
              <Sprite name={icon} size={26} />
              <span style={{ flex: 1 }}>{name}</span>
              <span style={{ color: 'var(--demo-muted, #94b0c2)' }}>›</span>
            </button>
          ))}
        </div>
        <SpringDrawer {...props} side={side} snapPoints={[0.55]} open={Boolean(item)} onOpenChange={next => !next && setItem(null)} title={item?.name} fontFamily={PIXEL_FONT}>
          {item && (
            <div style={{ display: 'grid', justifyItems: 'center', gap: 14, paddingTop: 8, textAlign: 'center' }}>
              <Sprite name={item.icon} size={72} />
              <p style={{ margin: 0, color: 'var(--demo-muted, #94b0c2)', font: `16px ${PIXEL_FONT}` }}>{item.desc}</p>
              <div style={row}>
                <PixelButton size="sm" variant="success" onPress={() => setItem(null)}>
                  Equip
                </PixelButton>
                <PixelButton size="sm" variant="primary" onPress={() => setItem(null)}>
                  Drop
                </PixelButton>
              </div>
            </div>
          )}
        </SpringDrawer>
      </SpringDrawer>
    </div>
  );
}

// ---------- Confetti ----------

const SPRITES = ['coin', 'gem', 'heart', 'star'].map(name => `/pixel/sprite-${name}.png`);

function ConfettiDemo({ shapes, ...props }) {
  const shapeList = shapes === 'sprites' ? SPRITES : shapes === 'mixed' ? ['square', 'strip', ...SPRITES] : ['square', 'strip', 'circle'];
  return (
    <div style={{ display: 'grid', gap: 22, justifyItems: 'center', width: '100%', padding: '40px 0' }}>
      <Confetti {...props} shapes={shapeList}>
        <PixelButton variant="success">Open the chest</PixelButton>
      </Confetti>
      <div style={row}>
        {['burst', 'cannon', 'fireworks', 'fountain', 'rain'].map(preset => (
          <PixelButton key={preset} size="sm" variant="secondary" onPress={event => confetti({ ...props, preset, shapes: shapeList, origin: event?.currentTarget ?? undefined })}>
            {preset}
          </PixelButton>
        ))}
      </div>
      <p style={hint}>Every burst shares one canvas and one particle pool.</p>
    </div>
  );
}

// ---------- Entries ----------

const DEMO_ENTRIES = {
  'morph-dialog': {
    source: morphDialogSource,
    defaults: { width: 520, radius: 4, duration: 480, backdropBlur: 6, accentColor: '#73eff7' },
    controls: [slider('width', 'Dialog width', 320, 760, 10), slider('radius', 'Radius', 0, 28, 1), slider('duration', 'Morph (ms)', 200, 1000, 20), slider('backdropBlur', 'Backdrop blur', 0, 16, 1), color('accentColor', 'Focus accent')],
    docs: [
      ['card', 'ReactNode', '-', 'Card content below the shared media. The card is a button.'],
      ['children', 'ReactNode', '-', 'Dialog content. Mark an element with data-autofocus to focus it on open.'],
      ['title', 'ReactNode', '-', 'Dialog heading; also its accessible name.'],
      ['media', 'ReactNode', '-', 'Shared image or video shown at the top of both the card and the dialog.'],
      ['cardMediaHeight / dialogMediaHeight', 'number', '160 / 260', 'Media height in each state; the morph blends between them.'],
      ['width / maxHeight', 'number / string', '560 / "85vh"', 'Dialog size. The body scrolls if content is taller.'],
      ['open / onOpenChange', 'boolean / (open) => void', '-', 'Optional controlled state.'],
      ['duration / radius', 'number', '480 / 18', 'Morph length (ms) and corner radius.'],
      ['backgroundColor / textColor / backdropColor / backdropBlur', 'string / number', 'dark', 'Colors and backdrop blur.']
    ],
    usage: `import MorphDialog from "./MorphDialog";

<MorphDialog
  title="Blossom Hills"
  media={<img src="/blossom.png" alt="" />}
  card={<p>Seed 4417</p>}
>
  <p>Pink canopies and calm rivers.</p>
</MorphDialog>`,
    render: props => <MorphDialogDemo {...props} />
  },

  'morph-popover': {
    source: morphPopoverSource,
    defaults: { radius: 4, duration: 380, height: 42, accentColor: '#73eff7', side: 'bottom' },
    controls: [slider('radius', 'Radius', 0, 24, 1), slider('duration', 'Morph (ms)', 150, 900, 10), slider('height', 'Button height', 32, 56, 1), select('side', 'Grow toward', ['bottom', 'top']), color('accentColor', 'Focus accent')],
    docs: [
      ['label / icon', 'ReactNode', '"Feedback"', 'Button content; it stays visible while the panel grows.'],
      ['children', 'ReactNode | ({ close }) => ReactNode', '-', 'Panel content. The function form gets close().'],
      ['panelWidth', 'number', '320', 'Panel width in px; its height follows the content.'],
      ['align / side', '"start" | "center" | "end" / "bottom" | "top"', '"start" / "bottom"', 'Which corner stays pinned to the button, and which way it grows.'],
      ['open / onOpenChange', 'boolean / (open) => void', '-', 'Optional controlled state.'],
      ['panelLabel', 'string', 'label', 'Accessible name of the panel.'],
      ['height / radius / duration', 'number', '42 / 14 / 380', 'Button height, corner radius and morph length.']
    ],
    usage: `import MorphPopover from "./MorphPopover";

<MorphPopover
  label="Feedback"
  panelWidth={320}
>
  {({ close }) => <FeedbackForm onDone={close} />}
</MorphPopover>`,
    render: props => <MorphPopoverDemo {...props} />
  },

  'toast-stack': {
    source: toastStackSource,
    defaults: { position: 'bottom-right', duration: 4000, visibleToasts: 3, expand: false, radius: 4, width: 340 },
    controls: [
      select('position', 'Position', ['bottom-right', 'bottom-center', 'bottom-left', 'top-right', 'top-center', 'top-left']),
      slider('duration', 'Duration (ms)', 1500, 10000, 500),
      slider('visibleToasts', 'Visible when stacked', 1, 5, 1),
      toggle('expand', 'Always expanded'),
      slider('radius', 'Radius', 0, 20, 1),
      slider('width', 'Width', 260, 420, 10)
    ],
    docs: [
      ['toast(title, options?)', 'function', 'export', 'Shows a toast; returns its id. Options: description, icon, duration, action { label, onClick }, id (to update one).'],
      ['toast.success / error / info / loading', 'function', 'export', 'Typed toasts. Errors are announced assertively.'],
      ['toast.promise(promise, { loading, success, error })', 'function', 'export', 'One toast that follows a promise. success and error can be functions of the result.'],
      ['toast.dismiss(id?)', 'function', 'export', 'Dismiss one toast, or all of them.'],
      ['<NoticeStack notices onDismiss />', 'component', 'export', 'Inline stacked notices in the page: the front card shows in full, the next ones peek behind, and dismissing one brings the next forward. Props: notices { id, title, description?, type?, icon?, action? }[], onDismiss(id, notice), peek, gap, width, emptyMessage.'],
      ['position', 'string', '"bottom-right"', 'top/bottom × left/center/right.'],
      ['duration / visibleToasts / expand', 'number / number / boolean', '4000 / 3 / false', 'Auto-dismiss time, how many show when stacked, and whether to always fan out.'],
      ['contained', 'boolean', 'false', 'Position inside the nearest positioned parent instead of the window.'],
      ['colors, radius, width, gap, offset, fontFamily', 'various', 'dark', 'Styling. Timers pause on hover, focus and hidden tabs.']
    ],
    usage: `import Toaster, { toast } from "./ToastStack";

<Toaster
  position="bottom-right"
/>

toast.success("Diamond found!", { description: "+50 XP" });`,
    render: props => <ToastDemo key={props.position} {...props} />
  },

  'spring-drawer': {
    source: springDrawerSource,
    defaults: { side: 'bottom', stiffness: 520, damping: 0.82, radius: 4, dismissible: true },
    controls: [select('side', 'Side', ['bottom', 'right', 'left']), slider('stiffness', 'Spring stiffness', 150, 1200, 10), slider('damping', 'Damping ratio', 0.4, 1.4, 0.02), slider('radius', 'Radius', 0, 28, 1), toggle('dismissible', 'Dismissible')],
    docs: [
      ['open / onOpenChange', 'boolean / (open) => void', 'required', 'Controlled open state. Drag-to-close, Esc and the backdrop call onOpenChange(false).'],
      ['side', '"bottom" | "right" | "left"', '"bottom"', 'Edge the drawer comes from.'],
      ['snapPoints / defaultSnap', 'number[] / number', '[0.5, 0.92] / 0', 'Bottom only: open heights as fractions of the viewport (or container).'],
      ['size', 'number', '380', 'Side drawers: width in px.'],
      ['stiffness / damping', 'number', '520 / 0.82', 'Spring physics. Damping below 1 bounces; 1 is critically damped.'],
      ['dismissible', 'boolean', 'true', 'Allow closing by drag, Esc and backdrop.'],
      ['contained', 'boolean', 'false', 'Render inside the parent element instead of the whole window. Nested drawers inherit it.'],
      ['title / description', 'ReactNode', '-', 'Heading and description, wired up as the accessible name and description.'],
      ['Nested drawers', '-', '-', 'Render a SpringDrawer inside another; the parent recedes while the child is open.']
    ],
    usage: `import SpringDrawer from "./SpringDrawer";

const [open, setOpen] = useState(false);

<SpringDrawer
  open={open}
  onOpenChange={setOpen}
  title="Backpack"
  snapPoints={[0.5, 0.92]}
>
  …
</SpringDrawer>`,
    render: props => <DrawerDemo key={`${props.side}-${props.dismissible}`} {...props} />
  },

  confetti: {
    source: confettiSource,
    defaults: { preset: 'burst', shapes: 'mixed', count: 90, scalar: 1, gravity: 1 },
    controls: [select('preset', 'Preset (wrapped button)', ['burst', 'cannon', 'fireworks', 'fountain', 'rain']), select('shapes', 'Shapes (demo)', ['mixed', 'sprites', 'paper']), slider('count', 'Particles', 10, 300, 10), slider('scalar', 'Scale', 0.5, 2.5, 0.1), slider('gravity', 'Gravity', 0.2, 2.5, 0.1)],
    docs: [
      ['confetti(options)', 'function', 'export', 'Fire a burst from code. Returns nothing; reuses one canvas and a particle pool.'],
      ['origin', 'Element | { x, y }', 'center', 'Element to burst from, or a point (0–1 fractions or px).'],
      ['preset', '"burst" | "cannon" | "fireworks" | "fountain" | "rain"', '"burst"', 'Starting values for the options below.'],
      ['count / spread / angle / velocity', 'number', 'per preset', 'How many, cone width (°), direction (° from right, 90 = up) and launch speed.'],
      ['gravity / decay / drift / ticks', 'number', 'per preset', 'Fall speed, air drag per frame, sideways drift and lifetime in frames.'],
      ['shapes', '("square" | "circle" | "strip" | text | imageUrl)[]', 'paper', 'Particle kinds. Text draws emoji or glyphs; image URLs draw sprites (crisp when pixelated).'],
      ['colors / size / scalar', 'string[] / number / number', 'Sweetie 16 / 7 / 1', 'Paper colors, base size and an overall scale.'],
      ['force', 'boolean', 'false', 'Fire even under reduced motion (skipped by default).'],
      ['<Confetti trigger>', '"click" | "hover" | "mount"', '"click"', 'Wrapper component: bursts from its child. Takes all the options above as props.']
    ],
    usage: `import Confetti, { confetti } from "./Confetti";

<Confetti
  preset="burst"
>
  <button>Open the chest</button>
</Confetti>

confetti({ origin: element, preset: "fireworks" });`,
    demoOnly: ['shapes'],
    render: props => <ConfettiDemo {...props} />
  }
};

export const OVERLAY_DEMOS = DEMO_ENTRIES;
