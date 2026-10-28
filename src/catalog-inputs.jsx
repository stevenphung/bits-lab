import { useState } from 'react';
import Sprite from './pixel/Sprite';
import PixelButton from './bits/PixelButton';
import OTPInput from './bits/OTPInput';
import VanishInput from './bits/VanishInput';
import DropZone from './bits/DropZone';
import ToggleGroup from './bits/ToggleGroup';
import otpInputSource from './bits/OTPInput.jsx?raw';
import vanishInputSource from './bits/VanishInput.jsx?raw';
import dropZoneSource from './bits/DropZone.jsx?raw';
import toggleGroupSource from './bits/ToggleGroup.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", monospace';
// One shrinkable column, so wide rows (8-cell codes, long toggle groups) fit narrow screens.
const stack = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18, justifyItems: 'center', width: '100%', padding: '32px 0' };
const hint = { margin: 0, color: '#94b0c2', font: `14px/1.4 ${PIXEL_FONT}`, textAlign: 'center' };

// ---------- OTPInput ----------

function OTPDemo(props) {
  const secret = props.type === 'alphanumeric' ? 'A1B2C3D4'.slice(0, props.length) : '4242424242'.slice(0, props.length);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle');
  const messages = { idle: `Enter the code from your pager. (Psst: ${secret})`, error: 'That code is wrong. Try again.', success: 'Vault unlocked!' };
  return (
    <div style={stack}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ffcd75', font: `10px ${TITLE_FONT}` }}>
        <Sprite name="chest" size={28} /> VAULT CODE
      </div>
      <OTPInput
        {...props}
        value={code}
        status={status}
        message={messages[status]}
        fontFamily={PIXEL_FONT}
        onChange={next => {
          setCode(next);
          if (status === 'error') setStatus('idle');
        }}
        onComplete={full => setStatus(full === secret ? 'success' : 'error')}
      />
      <PixelButton
        size="sm"
        variant="secondary"
        onPress={() => {
          setCode('');
          setStatus('idle');
        }}
      >
        Reset
      </PixelButton>
    </div>
  );
}

// ---------- VanishInput ----------

function VanishDemo(props) {
  const [log, setLog] = useState([]);
  return (
    <div style={{ ...stack, padding: '40px 16px' }}>
      <VanishInput
        {...props}
        fontFamily={PIXEL_FONT}
        placeholders={['Search the overworld…', 'Try "diamond pickaxe"', 'Where do slimes spawn?', 'How do I tame a wolf?']}
        onSubmit={text => setLog(prev => [text, ...prev].slice(0, 4))}
      />
      <div style={{ minHeight: 96, display: 'grid', gap: 6, justifyItems: 'center' }}>
        {log.length ? (
          log.map((entry, i) => (
            <span key={`${entry}-${i}`} style={{ ...hint, opacity: 1 - i * 0.22 }}>
              ↳ {entry}
            </span>
          ))
        ) : (
          <p style={hint}>Type something and press Enter.</p>
        )}
      </div>
    </div>
  );
}

// ---------- DropZone ----------

// Demo-only: pretends to upload, with a random speed and an occasional failure.
const fakeUpload = failRate => (file, { onProgress, signal }) =>
  new Promise((resolve, reject) => {
    let progress = 0;
    const speed = 0.04 + Math.random() * 0.1;
    const fail = Math.random() < failRate;
    const timer = setInterval(() => {
      progress += speed * (0.5 + Math.random());
      if (fail && progress > 0.6) {
        clearInterval(timer);
        reject(new Error('Connection lost'));
        return;
      }
      onProgress(Math.min(1, progress));
      if (progress >= 1) {
        clearInterval(timer);
        resolve();
      }
    }, 120);
    signal.addEventListener('abort', () => clearInterval(timer));
  });

function DropDemo({ failRate, ...props }) {
  return (
    <div style={{ ...stack, padding: '28px 16px' }}>
      <DropZone
        {...props}
        fontFamily={PIXEL_FONT}
        title="Drop your world files"
        accept="image/*,.pdf,.txt,.json"
        maxSize={5 * 1024 * 1024}
        upload={fakeUpload(failRate)}
      />
      <p style={hint}>Images get thumbnails. Uploads are simulated; some fail on purpose.</p>
    </div>
  );
}

// ---------- ToggleGroup ----------

function ToggleDemo(props) {
  const [view, setView] = useState('grid');
  const [filters, setFilters] = useState(['weapons', 'gems']);
  const label = { display: 'block', marginBottom: 8, color: '#94b0c2', font: `9px ${TITLE_FONT}` };
  return (
    <div style={{ ...stack, gap: 26, justifyItems: 'stretch', maxWidth: 520, margin: '0 auto', padding: '32px 16px' }}>
      <div>
        <span style={label}>VIEW</span>
        <ToggleGroup
          {...props}
          fontFamily={PIXEL_FONT}
          label="View"
          value={view}
          onChange={setView}
          items={[
            { value: 'grid', label: 'Grid', icon: <Sprite name="chest" size={16} /> },
            { value: 'list', label: 'List', icon: <Sprite name="book" size={16} /> },
            { value: 'map', label: 'Map', icon: <Sprite name="orb" size={16} /> }
          ]}
        />
      </div>
      <div>
        <span style={label}>FILTER LOOT (MULTI)</span>
        <ToggleGroup
          {...props}
          type="multiple"
          fontFamily={PIXEL_FONT}
          label="Loot filters"
          value={filters}
          onChange={setFilters}
          items={[
            { value: 'weapons', label: 'Weapons', icon: <Sprite name="sword" size={16} /> },
            { value: 'potions', label: 'Potions', icon: <Sprite name="potion" size={16} /> },
            { value: 'gems', label: 'Gems', icon: <Sprite name="gem" size={16} /> },
            { value: 'tools', label: 'Tools', icon: <Sprite name="pickaxe" size={16} /> }
          ]}
        />
        <p style={{ ...hint, textAlign: 'left', marginTop: 8 }}>Showing: {filters.length ? filters.join(', ') : 'nothing'}</p>
      </div>
      <div>
        <span style={label}>DIFFICULTY (FULL WIDTH)</span>
        <ToggleGroup
          {...props}
          fullWidth
          fontFamily={PIXEL_FONT}
          label="Difficulty"
          defaultValue="normal"
          items={[
            { value: 'peaceful', label: 'Peaceful' },
            { value: 'easy', label: 'Easy' },
            { value: 'normal', label: 'Normal' },
            { value: 'hard', label: 'Hard' },
            { value: 'hardcore', label: 'Hardcore', disabled: true }
          ]}
        />
      </div>
    </div>
  );
}

// ---------- Entries ----------

const DEMO_ENTRIES = {
  'otp-input': {
    source: otpInputSource,
    defaults: { length: 6, groupSize: 3, type: 'numeric', mask: false, radius: 6, accentColor: '#73eff7' },
    controls: [slider('length', 'Length', 4, 8, 1), slider('groupSize', 'Group size (0 = none)', 0, 4, 1), select('type', 'Characters', ['numeric', 'alphanumeric']), toggle('mask', 'Mask characters'), slider('radius', 'Radius', 0, 24, 1), color('accentColor', 'Accent')],
    docs: [
      ['length', 'number', '6', 'Number of characters.'],
      ['value / defaultValue / onChange', 'string', '""', 'Controlled or uncontrolled code.'],
      ['onComplete', '(code) => void', '-', 'Called once per complete code (typed, pasted or autofilled).'],
      ['status', '"idle" | "error" | "success"', '"idle"', 'error shakes and turns red (reset it on the next change); success fuses the cells and locks the input.'],
      ['message', 'ReactNode', '-', 'Line under the cells; announced as an alert on error.'],
      ['type', '"numeric" | "alphanumeric"', '"numeric"', 'Allowed characters; alphanumeric is uppercased. Sets the mobile keyboard.'],
      ['mask / groupSize', 'boolean / number', 'false / 3', 'Hide characters, and add a separator every N cells (0 for none).'],
      ['cellWidth / cellHeight / gap / radius / colors', 'number / string', '48 / 58 / 8 / 12', 'Styling.']
    ],
    usage: `import OTPInput from "./OTPInput";

<OTPInput
  length={6}
  status={status}
  onComplete={verify}
/>`,
    render: props => <OTPDemo key={`${props.length}-${props.type}`} {...props} />
  },

  'vanish-input': {
    source: vanishInputSource,
    defaults: { particleSize: 2, duration: 900, interval: 3000, radius: 26, accentColor: '#73eff7' },
    controls: [slider('particleSize', 'Particle size', 1, 6, 1), slider('duration', 'Vanish length (ms)', 400, 2000, 50), slider('interval', 'Placeholder interval (ms)', 1500, 6000, 250), slider('radius', 'Radius', 0, 30, 1), color('accentColor', 'Accent')],
    docs: [
      ['placeholders', 'string[]', 'search ideas', 'Suggestions that rotate while the field is empty.'],
      ['interval', 'number', '3000', 'Time per placeholder, in ms.'],
      ['onSubmit / onChange', '(text) => void', '-', 'Submit gets the trimmed text; the field then clears.'],
      ['particleSize / duration', 'number', '2 / 900', 'Particle size in px and how long the dissolve takes.'],
      ['label / submitLabel', 'string', '"Search" / "Submit"', 'Accessible names for the field and button.'],
      ['width / height / radius / fontSize / padding / colors', 'number / string', '560 / 52 / 26', 'Styling. Under reduced motion the text simply clears.']
    ],
    usage: `import VanishInput from "./VanishInput";

<VanishInput
  placeholders={["Search the overworld…", "Try \\"diamond pickaxe\\""]}
  onSubmit={search}
/>`,
    render: props => <VanishDemo {...props} />
  },

  'drop-zone': {
    source: dropZoneSource,
    defaults: { multiple: true, maxFiles: 6, magnetic: true, radius: 6, accentColor: '#73eff7', failRate: 0.2 },
    controls: [toggle('multiple', 'Multiple files'), slider('maxFiles', 'Max files', 1, 12, 1), toggle('magnetic', 'Lean toward cursor'), slider('radius', 'Radius', 0, 24, 1), color('accentColor', 'Accent'), slider('failRate', 'Demo failure rate', 0, 1, 0.05)],
    docs: [
      ['upload', '(file, { onProgress, signal }) => Promise', '-', 'Your uploader. Call onProgress(0–1); removing the file aborts via signal. Without it, files are just collected.'],
      ['onFilesChange', '(files) => void', '-', 'Current list: { id, file, name, size, type, preview, progress, status, error }.'],
      ['onReject', '(rejections) => void', '-', 'Files refused by accept, maxSize or maxFiles, each with a reason.'],
      ['accept / maxSize / maxFiles / multiple', 'string / number / number / boolean', '- / - / 10 / true', 'Validation, using the same accept syntax as <input type="file">.'],
      ['title / hint', 'ReactNode', '"Drop files here"', 'Zone text; the hint defaults to a summary of the rules.'],
      ['magnetic', 'boolean', 'true', 'Lean toward the cursor while files are dragged over (off under reduced motion).'],
      ['formatBytes(bytes)', 'function', 'export', 'The size formatter used in the list.']
    ],
    usage: `import DropZone from "./DropZone";

<DropZone
  accept="image/*,.pdf"
  maxSize={5 * 1024 * 1024}
  upload={(file, { onProgress, signal }) => uploadWithProgress(file, onProgress, signal)}
/>`,
    demoOnly: ['failRate'],
    render: props => <DropDemo key={`${props.multiple}-${props.maxFiles}`} {...props} />
  },

  'toggle-group': {
    source: toggleGroupSource,
    defaults: { size: 'md', radius: 10, duration: 340, thumbColor: '#f4f4f4', accentColor: '#73eff7' },
    controls: [select('size', 'Size', ['sm', 'md', 'lg']), slider('radius', 'Radius', 0, 24, 1), slider('duration', 'Slide (ms)', 120, 800, 10), color('thumbColor', 'Thumb'), color('accentColor', 'Focus ring')],
    docs: [
      ['items', '{ value, label?, icon?, disabled?, ariaLabel? }[]', '[]', 'Options. Use ariaLabel for icon-only options.'],
      ['type', '"single" | "multiple"', '"single"', 'A radio group with a sliding thumb, or toggle buttons whose neighbouring selections fuse.'],
      ['value / defaultValue / onChange', 'string | string[]', 'first option / []', 'Controlled or uncontrolled; multiple mode uses arrays, kept in item order.'],
      ['fullWidth / size', 'boolean / "sm" | "md" | "lg"', 'false / "md"', 'Stretch options to fill the row; option height.'],
      ['label', 'string', '"Options"', 'Accessible name of the group.'],
      ['duration / radius / gap / padding / colors', 'number / string', '340 / 12', 'Styling.']
    ],
    usage: `import ToggleGroup from "./ToggleGroup";

<ToggleGroup
  items={[{ value: "grid", label: "Grid" }, { value: "list", label: "List" }]}
  value={view}
  onChange={setView}
/>`,
    render: props => <ToggleDemo {...props} />
  }
};

export const INPUT_DEMOS = DEMO_ENTRIES;
