import { useMemo, useState } from 'react';
import Sprite from './pixel/Sprite';
import PixelButton from './bits/PixelButton';
import RollingNumber from './bits/RollingNumber';
import SparkChart from './bits/SparkChart';
import RingProgress from './bits/RingProgress';
import rollingNumberSource from './bits/RollingNumber.jsx?raw';
import sparkChartSource from './bits/SparkChart.jsx?raw';
import ringProgressSource from './bits/RingProgress.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", monospace';
const stack = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 20, justifyItems: 'center', width: '100%', padding: '32px 0' };
const row = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 };
const hint = { margin: 0, color: 'var(--demo-muted, #94b0c2)', font: `14px/1.4 ${PIXEL_FONT}`, textAlign: 'center' };
const card = { display: 'grid', gap: 6, minWidth: 0, padding: '14px 16px', background: 'var(--demo-bg, #1a1c2c)', boxShadow: '0 0 0 1px var(--demo-hair, rgba(255,255,255,0.08))' };
const cardLabel = { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--demo-muted, #94b0c2)', font: `13px ${PIXEL_FONT}` };

// ---------- RollingNumber ----------

const FORMATS = {
  plain: undefined,
  currency: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 },
  compact: { notation: 'compact', maximumFractionDigits: 1 },
  decimal: { minimumFractionDigits: 2, maximumFractionDigits: 2 }
};

function RollingDemo({ format, fontSize, ...props }) {
  const [coins, setCoins] = useState(1284);
  const add = n => setCoins(c => Math.max(0, c + n));
  return (
    <div style={stack}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Sprite name="coin" size={Math.round(fontSize * 0.9)} />
        <RollingNumber {...props} value={format === 'decimal' ? coins / 100 : coins} format={FORMATS[format]} style={{ fontSize, fontFamily: PIXEL_FONT, fontWeight: 700 }} />
      </div>
      <div style={row}>
        <PixelButton size="sm" variant="success" onPress={() => add(1)}>
          +1
        </PixelButton>
        <PixelButton size="sm" variant="success" onPress={() => add(37)}>
          +37
        </PixelButton>
        <PixelButton size="sm" variant="warning" onPress={() => add(1000)}>
          +1,000
        </PixelButton>
        <PixelButton size="sm" variant="info" onPress={() => add(98765)}>
          +98,765
        </PixelButton>
        <PixelButton size="sm" variant="primary" onPress={() => add(-500)}>
          −500
        </PixelButton>
      </div>
      <p style={hint}>New columns slide in when the number grows; units always stay in place.</p>
    </div>
  );
}

// ---------- SparkChart ----------

// Seeded random walk so the demo looks the same on every visit until you reroll.
function walk(seed, count, start, volatility) {
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  let v = start;
  return Array.from({ length: count }, () => {
    v = Math.max(0, v + (rand() - 0.45) * volatility);
    return Math.round(v);
  });
}

const DAYS = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2026, 8, 28 + i);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
});

function SparkDemo(props) {
  const [seed, setSeed] = useState(7);
  const players = useMemo(() => walk(seed, 30, 1200, 180), [seed]);
  const minis = useMemo(
    () => [
      { icon: 'gem', label: 'Gems mined', data: walk(seed + 11, 14, 40, 14) },
      { icon: 'coin', label: 'Coins traded', data: walk(seed + 23, 14, 900, 160) },
      { icon: 'heart', label: 'Respawns', data: walk(seed + 37, 14, 30, 10) }
    ],
    [seed]
  );
  return (
    <div style={{ ...stack, maxWidth: 720, margin: '0 auto', padding: '28px 16px', justifyItems: 'stretch' }}>
      <div style={card}>
        <span style={cardLabel}>
          <Sprite name="star" size={16} /> Players online · last 30 days
        </span>
        <SparkChart key={`main-${seed}`} {...props} data={players.map((value, i) => ({ value, label: DAYS[i] }))} label="Players online, last 30 days" fontFamily={PIXEL_FONT} formatValue={v => v.toLocaleString('en-US')} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        {minis.map(mini => (
          <div key={mini.label} style={card}>
            <span style={cardLabel}>
              <Sprite name={mini.icon} size={16} /> {mini.label}
            </span>
            <SparkChart key={`${mini.label}-${seed}`} {...props} height={56} data={mini.data} labels={DAYS.slice(-14)} label={`${mini.label}, last 14 days`} fontFamily={PIXEL_FONT} formatValue={v => v.toLocaleString('en-US')} />
          </div>
        ))}
      </div>
      <div style={row}>
        <PixelButton size="sm" variant="secondary" onPress={() => setSeed(s => s + 1)}>
          New data
        </PixelButton>
      </div>
      <p style={hint}>Hover, drag or use arrow keys on a chart to scrub.</p>
    </div>
  );
}

// ---------- RingProgress ----------

const QUESTS = [
  { label: 'Mine ore', value: 72, max: 100 },
  { label: 'Craft tools', value: 45, max: 60 },
  { label: 'Explore biomes', value: 8, max: 10 }
];

function RingDemo({ ringCount, ...props }) {
  const [rings, setRings] = useState(QUESTS);
  const shown = rings.slice(0, ringCount);
  return (
    <div style={stack}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--demo-gold, #ffcd75)', font: `10px ${TITLE_FONT}` }}>
        <Sprite name="book" size={22} /> DAILY QUESTS
      </div>
      <RingProgress {...props} rings={shown} fontFamily={PIXEL_FONT} formatValue={ring => `${ring.value}/${ring.max}`} centerLabel={shown.length > 1 ? 'Mine ore' : undefined} />
      <div style={row}>
        <PixelButton size="sm" variant="success" onPress={() => setRings(rs => rs.map(r => ({ ...r, value: Math.min(r.max, r.value + Math.ceil(r.max * 0.1)) })))}>
          Make progress
        </PixelButton>
        <PixelButton size="sm" variant="secondary" onPress={() => setRings(rs => rs.map(r => ({ ...r, value: 0 })))}>
          New day
        </PixelButton>
      </div>
      <p style={hint}>Hover or tab to a ring's legend row to read it in the centre.</p>
    </div>
  );
}

// ---------- Entries ----------

const DEMO_ENTRIES = {
  'rolling-number': {
    source: rollingNumberSource,
    defaults: { format: 'plain', duration: 900, stagger: 40, fontSize: 56, from: 0 },
    controls: [select('format', 'Format (demo)', ['plain', 'currency', 'compact', 'decimal']), slider('duration', 'Roll (ms)', 200, 2000, 50), slider('stagger', 'Stagger per digit (ms)', 0, 150, 5), slider('fontSize', 'Font size (demo)', 20, 96, 2)],
    docs: [
      ['value', 'number', '0', 'The number to show. Changes roll each digit to its new place.'],
      ['from', 'number', '-', 'Start here and roll to `value` when the number scrolls into view.'],
      ['locale / format', 'string / Intl.NumberFormatOptions', 'browser / -', 'Any Intl formatting: currency, percent, compact, fraction digits.'],
      ['prefix / suffix', 'string', '""', 'Text around the number (also read aloud).'],
      ['duration / stagger', 'number', '900 / 40', 'Roll length, and the delay added per digit from the left (ms).'],
      ['startOnView', 'boolean', 'true', 'With `from`, wait until visible before rolling.'],
      ['announce', 'boolean', 'false', 'Announce changes politely to screen readers (off by default to avoid chatter).'],
      ['lineHeight / color', 'number / string', '1.1 / currentColor', 'Digit cell height and color. Font size and family are inherited.']
    ],
    usage: `import RollingNumber from "./RollingNumber";

<RollingNumber
  value={coins}
  from={0}
  format={{ style: "currency", currency: "USD" }}
/>`,
    demoOnly: ['format', 'fontSize'],
    render: props => <RollingDemo {...props} />
  },

  'spark-chart': {
    source: sparkChartSource,
    defaults: { smooth: true, area: true, showEndLabel: true, height: 120, color: '#3987e5' },
    controls: [toggle('smooth', 'Smooth curve'), toggle('area', 'Area wash'), toggle('showEndLabel', 'End label'), slider('height', 'Height', 60, 220, 4), color('color', 'Series color')],
    docs: [
      ['data', '(number | { value, label })[]', '[]', 'One series. Labels appear in the tooltip and the screen-reader table.'],
      ['labels', 'string[]', '-', 'Labels for a plain number array.'],
      ['height', 'number', '96', 'Chart height in px; the width follows the container.'],
      ['smooth / area', 'boolean', 'true / true', 'Monotone curve (never overshoots the data) and a ~10% area wash.'],
      ['showEndLabel / showBaseline', 'boolean', 'true / true', 'Direct label on the last value, and a hairline baseline.'],
      ['formatValue', '(value) => string', 'locale number', 'Formats the end label, tooltip and table.'],
      ['label', 'string', '"Trend"', 'Names the chart for screen readers, with an automatic summary (range, low, high, direction).'],
      ['color / surfaceColor / textColor / mutedColor / gridColor', 'string', 'blue on dark', 'Series color, plus the surface used for the dot ring. Text stays in text colors.'],
      ['animate / drawDuration', 'boolean / number', 'true / 900', 'Draw the line in on mount (skipped under reduced motion).']
    ],
    usage: `import SparkChart from "./SparkChart";

<SparkChart
  data={[{ value: 1200, label: "Sep 28" }, { value: 1340, label: "Sep 29" }]}
  label="Players online"
/>`,
    render: props => <SparkDemo {...props} />
  },

  'ring-progress': {
    source: ringProgressSource,
    defaults: { ringCount: 3, size: 200, thickness: 16, gap: 6, gradient: true, duration: 1100 },
    controls: [slider('ringCount', 'Rings (demo)', 1, 3, 1), slider('size', 'Size', 120, 280, 4), slider('thickness', 'Thickness', 6, 28, 1), slider('gap', 'Gap', 2, 14, 1), toggle('gradient', 'Same-hue gradient'), slider('duration', 'Fill (ms)', 300, 2500, 50)],
    docs: [
      ['rings', '{ value, max?, label?, color? }[]', '1 ring', 'Outer ring first. Values clamp to 0–max (default 100).'],
      ['size / thickness / gap', 'number', '180 / 14 / 6', 'Diameter, ring width and spacing in px.'],
      ['colors', 'string[]', 'blue, orange, aqua', 'Ring colors in order; the default three are validated for a dark surface. A ring color overrides.'],
      ['gradient / trackOpacity', 'boolean / number', 'true / 0.18', 'Lighter-to-full gradient of the ring\'s own hue, over a track of the same hue.'],
      ['formatValue', '(ring) => string', 'percent', 'Text in the centre and the legend.'],
      ['centerLabel', 'ReactNode', 'ring label', 'Centre caption while nothing is focused.'],
      ['showLegend', 'boolean', 'rings > 1', 'Legend rows are focusable meters; hovering or focusing one highlights its ring.'],
      ['duration / stagger / startAngle', 'number', '1100 / 120 / 0', 'Fill animation, delay between rings, and where rings start (0 = top).']
    ],
    usage: `import RingProgress from "./RingProgress";

<RingProgress
  rings={[{ label: "Mine ore", value: 72 }, { label: "Craft tools", value: 45, max: 60 }]}
/>`,
    demoOnly: ['ringCount'],
    render: props => <RingDemo {...props} />
  }
};

export const DATA_DEMOS = DEMO_ENTRIES;
