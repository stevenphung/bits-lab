import { useState } from 'react';
import Sprite from './pixel/Sprite';
import TagInput from './bits/TagInput';
import PasswordMeter from './bits/PasswordMeter';
import DateRange from './bits/DateRange';
import ColorDial from './bits/ColorDial';
import RangeDual from './bits/RangeDual';
import StepperForm from './bits/StepperForm';
import tagInputSource from './bits/TagInput.jsx?raw';
import passwordMeterSource from './bits/PasswordMeter.jsx?raw';
import dateRangeSource from './bits/DateRange.jsx?raw';
import colorDialSource from './bits/ColorDial.jsx?raw';
import rangeDualSource from './bits/RangeDual.jsx?raw';
import stepperFormSource from './bits/StepperForm.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", monospace';
const stack = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18, justifyItems: 'center', width: '100%', padding: '28px 16px', boxSizing: 'border-box' };
const hint = { margin: 0, color: 'var(--demo-muted, #94b0c2)', font: `14px/1.4 ${PIXEL_FONT}`, textAlign: 'center' };
const field = { width: '100%', height: 40, padding: '0 12px', boxSizing: 'border-box', border: 0, borderRadius: 10, background: 'var(--demo-field, #0b0b14)', color: 'var(--demo-ink, #f4f4f4)', font: `15px ${PIXEL_FONT}`, boxShadow: 'inset 0 0 0 1px var(--demo-line, #333c57)' };
const fieldLabel = { display: 'grid', gap: 6, color: 'var(--demo-muted, #94b0c2)', font: `13px ${PIXEL_FONT}` };

// ---------- TagInput ----------

const ITEMS = ['Pickaxe', 'Torch', 'Bread', 'Rope', 'Map', 'Compass', 'Shield', 'Bow', 'Arrows', 'Potion of healing', 'Potion of leaping', 'Lantern', 'Bucket', 'Saddle', 'Fishing rod'];

// ---------- DateRange ----------

function DateDemo({ weekStart, ...props }) {
  const [range, setRange] = useState({ start: null, end: null });
  const fmt = d => (d ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '…');
  return (
    <div style={stack}>
      <DateRange {...props} weekStartsOn={Number(weekStart)} value={range} onValueChange={setRange} fontFamily={PIXEL_FONT} label="Trip dates" />
      <p style={hint}>
        Trip: {fmt(range.start)} → {fmt(range.end)}
      </p>
    </div>
  );
}

// ---------- ColorDial ----------

function ColorDemo(props) {
  const [hex, setHex] = useState('#73eff7');
  return (
    <div style={{ ...stack, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', alignItems: 'center', maxWidth: 640, margin: '0 auto' }}>
      <ColorDial {...props} value={hex} onValueChange={setHex} fontFamily={PIXEL_FONT} label="Banner color" />
      <div style={{ display: 'grid', placeItems: 'center', gap: 12, padding: 24, borderRadius: 16, background: hex, color: '#0b0b14', boxShadow: '0 0 0 2px #333c57', transition: 'background-color 120ms' }}>
        <Sprite name="star" size={48} />
        <span style={{ font: `11px/1.6 ${TITLE_FONT}`, mixBlendMode: 'difference', color: '#f4f4f4' }}>YOUR BANNER</span>
        <code style={{ font: '13px ui-monospace, monospace', mixBlendMode: 'difference', color: '#f4f4f4' }}>{hex}</code>
      </div>
    </div>
  );
}

// ---------- RangeDual ----------

// A bumpy, deterministic price distribution for the demo histogram.
const BINS = Array.from({ length: 32 }, (_, i) => Math.round(18 + 40 * Math.exp(-((i - 9) ** 2) / 30) + 24 * Math.exp(-((i - 22) ** 2) / 12) + ((i * 37) % 11)));

function RangeDemo(props) {
  const [range, setRange] = useState([120, 420]);
  const matches = Math.round(BINS.reduce((sum, count, i) => (i * 16 >= range[0] && i * 16 < range[1] ? sum + count : sum), 0));
  return (
    <div style={stack}>
      <RangeDual {...props} min={0} max={512} value={range} onValueChange={setRange} histogram={BINS} format={v => `${v}g`} label="Price" fontFamily={PIXEL_FONT} />
      <p style={hint}>
        <Sprite name="potion" size={16} /> {matches} potions in your price range
      </p>
    </div>
  );
}

// ---------- StepperForm ----------

function StepperDemo(props) {
  const [summary, setSummary] = useState('');
  const steps = [
    {
      id: 'hero',
      title: 'Your hero',
      description: 'Every adventure needs a name.',
      content: (
        <div style={{ display: 'grid', gap: 14 }}>
          <label style={fieldLabel}>
            Name
            <input name="name" required minLength={2} style={field} placeholder="Try “taken” to see the async check" />
          </label>
          <label style={fieldLabel}>
            Class
            <select name="class" required defaultValue="" style={field}>
              <option value="" disabled>
                Choose one
              </option>
              <option>Explorer</option>
              <option>Builder</option>
              <option>Alchemist</option>
            </select>
          </label>
        </div>
      ),
      // An async check, like asking a server whether the name is free.
      validate: data => new Promise(resolve => setTimeout(() => resolve(String(data.get('name')).trim().toLowerCase() === 'taken' ? 'That name is taken. Try another.' : true), 700))
    },
    {
      id: 'world',
      title: 'Your world',
      description: 'Pick how hard the nights will be.',
      content: (
        <fieldset style={{ display: 'grid', gap: 8, margin: 0, padding: 0, border: 0, font: `15px ${PIXEL_FONT}` }}>
          <legend style={{ ...fieldLabel, marginBottom: 6 }}>Difficulty</legend>
          {['Peaceful', 'Normal', 'Hard'].map(level => (
            <label key={level} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input type="radio" name="difficulty" value={level} required defaultChecked={level === 'Normal'} /> {level}
            </label>
          ))}
        </fieldset>
      )
    },
    {
      id: 'ready',
      title: 'Ready?',
      description: 'One last thing before you spawn.',
      content: (
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', font: `15px ${PIXEL_FONT}` }}>
          <input type="checkbox" name="ready" required /> I packed a torch
        </label>
      )
    }
  ];
  return (
    <div style={stack}>
      <StepperForm
        {...props}
        steps={steps}
        fontFamily={PIXEL_FONT}
        label="New world"
        onComplete={data => setSummary(`${data.get('name')} the ${data.get('class')}, ${data.get('difficulty')} mode`)}
        doneContent={
          <>
            <Sprite name="star" size={40} />
            <strong>World created!</strong>
            <span style={{ color: 'var(--demo-muted, #94b0c2)' }}>{summary}</span>
          </>
        }
      />
    </div>
  );
}

// ---------- Entries ----------

export const INPUT_MORE_DEMOS = {
  'tag-input': {
    source: tagInputSource,
    defaults: { max: 8, allowCustom: true, accentColor: '#73eff7' },
    controls: [slider('max', 'Max tags', 1, 15, 1), toggle('allowCustom', 'Allow custom tags'), color('accentColor', 'Accent')],
    docs: [
      ['value / defaultValue / onValueChange', 'string[]', '[]', 'The tags, controlled or not.'],
      ['suggestions', 'string[]', '[]', 'Autocomplete options (a combobox: ↑ ↓ Enter Esc); matches are highlighted.'],
      ['allowCustom / max', 'boolean / number', 'true / ∞', 'Free-text tags, and a limit.'],
      ['validate', '(tag) => boolean | string', '-', 'Reject a tag; a string becomes the message.'],
      ['Adding', '-', '-', 'Enter or comma adds; paste "a, b, c" (commas, semicolons, new lines) to add many.'],
      ['Removing', '-', '-', 'The × on a chip, or Backspace twice on an empty field (← → move the selection).'],
      ['Accessibility', '-', '-', 'Each change is announced; duplicates shake their twin and explain why.']
    ],
    usage: `import TagInput from "./TagInput";

<TagInput label="Skills" suggestions={["React", "Rust"]} onValueChange={setSkills} />`,
    render: props => (
      <div style={stack}>
        <TagInput {...props} label="Pack your bag" suggestions={ITEMS} defaultValue={['Pickaxe', 'Torch']} fontFamily={PIXEL_FONT} />
      </div>
    )
  },

  'password-meter': {
    source: passwordMeterSource,
    defaults: { showChecklist: true, accentColor: '#73eff7' },
    controls: [toggle('showChecklist', 'Checklist'), color('accentColor', 'Accent')],
    docs: [
      ['value / defaultValue / onValueChange', 'string', '""', 'onValueChange also receives { level, label }.'],
      ['requirements', '{ id?, label, test: RegExp | (v) => boolean }[]', '8+ chars, cases, number, symbol', 'Your rules; DEFAULT_REQUIREMENTS is exported.'],
      ['levels', '{ label, color }[]', 'Too weak → Strong', 'Meter segments and their names.'],
      ['scorePassword(pw, reqs, levels)', 'function', 'export', 'The scoring, for server-side or other UI.'],
      ['name / autoComplete', 'string', '- / "new-password"', 'Form integration; password managers suggest strong passwords.'],
      ['Accessibility', '-', '-', 'The checklist and level describe the field; strength is announced after a pause; the eye is a toggle button.']
    ],
    usage: `import PasswordMeter from "./PasswordMeter";

<PasswordMeter name="password" onValueChange={(pw, { level }) => setOk(level >= 3)} />`,
    render: props => (
      <div style={stack}>
        <PasswordMeter {...props} label="Choose a password" fontFamily={PIXEL_FONT} />
      </div>
    )
  },

  'date-range': {
    source: dateRangeSource,
    defaults: { months: 2, weekStart: '1', accentColor: '#73eff7', cellSize: 38 },
    controls: [slider('months', 'Months', 1, 2, 1), select('weekStart', 'Week starts on', ['0', '1']), slider('cellSize', 'Day size', 30, 48, 2), color('accentColor', 'Accent')],
    docs: [
      ['value / defaultValue / onValueChange', '{ start: Date | null, end: Date | null }', 'empty', 'The range, controlled or not.'],
      ['presets', '{ label, range: () => { start, end } }[]', 'Today, 7 / 30 days, month, weekend', 'DEFAULT_PRESETS is exported; [] hides them.'],
      ['months', 'number', '2', 'Months side by side; one below narrowAt (620px of container).'],
      ['minDate / maxDate', 'Date', '-', 'Days outside are disabled.'],
      ['weekStartsOn / locale', 'number / string', '1 / browser', 'First weekday and Intl locale for names.'],
      ['Keyboard', '-', '-', 'Arrows by day/week, Home/End week edges, Page Up/Down month (+Shift: year), Enter picks.']
    ],
    usage: `import DateRange from "./DateRange";

<DateRange value={range} onValueChange={setRange} minDate={new Date()} />`,
    demoOnly: ['weekStart'],
    render: props => <DateDemo {...props} />
  },

  'color-dial': {
    source: colorDialSource,
    defaults: { size: 240, ringWidth: 22, eyedropper: true, accentColor: '#73eff7' },
    controls: [slider('size', 'Size', 180, 320, 10), slider('ringWidth', 'Ring width', 12, 36, 1), toggle('eyedropper', 'Eyedropper (where supported)'), color('accentColor', 'Accent')],
    docs: [
      ['value / defaultValue / onValueChange', 'string (hex)', '"#73eff7"', 'Always emits #rrggbb.'],
      ['swatches', 'string[]', 'Sweetie 16', 'Quick picks; [] hides them.'],
      ['size / ringWidth', 'number', '240 / 22', 'Wheel size and hue ring thickness.'],
      ['eyedropper', 'boolean', 'true', 'Screen sampling via the EyeDropper API, shown only where supported.'],
      ['parseHex / hsvToRgb / rgbToHsv', 'functions', 'export', 'The conversions, reusable.'],
      ['Keyboard', '-', '-', 'Hue thumb: ← → (Shift ×10), Home/End. Square thumb: ← → saturation, ↑ ↓ brightness.']
    ],
    usage: `import ColorDial from "./ColorDial";

<ColorDial value={color} onValueChange={setColor} />`,
    render: props => <ColorDemo {...props} />
  },

  'range-dual': {
    source: rangeDualSource,
    defaults: { step: 1, minGap: 16, showInputs: true, accentColor: '#73eff7' },
    controls: [slider('step', 'Step', 1, 32, 1), slider('minGap', 'Minimum gap', 0, 128, 4), toggle('showInputs', 'Number fields'), color('accentColor', 'Accent')],
    docs: [
      ['min / max / step', 'number', '0 / 100 / 1', 'Bounds and snapping.'],
      ['value / defaultValue / onValueChange', '[number, number]', '[min, max]', 'The two ends.'],
      ['minGap', 'number', '0', 'Smallest allowed distance between the ends.'],
      ['histogram', 'number[]', '-', 'Bin counts drawn behind the track; bars inside the range light up.'],
      ['format', '(v) => string', 'String', 'Text for bubbles, labels and screen readers ("120g", "$45").'],
      ['Interaction', '-', '-', 'Drag thumbs or the selected stretch; click the track; each thumb is a keyboard slider (Page Up/Down, Home/End).']
    ],
    usage: `import RangeDual from "./RangeDual";

<RangeDual min={0} max={500} value={price} onValueChange={setPrice} histogram={counts} format={v => "$" + v} />`,
    render: props => <RangeDemo {...props} />
  },

  'stepper-form': {
    source: stepperFormSource,
    defaults: { accentColor: '#73eff7', radius: 16 },
    controls: [slider('radius', 'Radius', 0, 28, 1), color('accentColor', 'Accent')],
    docs: [
      ['steps', '{ id?, title, description?, content, validate? }[]', '[]', 'content is nodes or ({ index, go }) => nodes.'],
      ['validate', '(data: FormData) => true | string | Promise<…>', '-', 'Runs after the native field rules; a string is shown as the error.'],
      ['onComplete', '(data: FormData) => void', '-', 'All steps’ fields together (every step stays mounted).'],
      ['doneContent', 'ReactNode', '"All done!"', 'Shown after finishing.'],
      ['backLabel / nextLabel / finishLabel / checkingLabel', 'string', 'English', 'Button text.'],
      ['Accessibility', '-', '-', 'Steps list with aria-current; errors are alerts that focus the field; focus moves to each step’s heading.']
    ],
    usage: `import StepperForm from "./StepperForm";

<StepperForm
  steps={[{ title: "Account", content: <AccountFields />, validate: checkEmail }]}
  onComplete={data => save(Object.fromEntries(data))}
/>`,
    render: props => <StepperDemo {...props} />
  }
};
