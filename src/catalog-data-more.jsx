import { useMemo, useState } from 'react';
import Sprite from './pixel/Sprite';
import PixelButton from './bits/PixelButton';
import BarRace from './bits/BarRace';
import Heatmap from './bits/Heatmap';
import StatCard from './bits/StatCard';
import GaugeMeter from './bits/GaugeMeter';
import barRaceSource from './bits/BarRace.jsx?raw';
import heatmapSource from './bits/Heatmap.jsx?raw';
import statCardSource from './bits/StatCard.jsx?raw';
import gaugeMeterSource from './bits/GaugeMeter.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const stack = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 18, justifyItems: 'center', width: '100%', padding: '28px 16px', boxSizing: 'border-box' };
const row = { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 };
const hint = { margin: 0, color: '#94b0c2', font: `14px/1.4 ${PIXEL_FONT}`, textAlign: 'center' };

function random(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- BarRace ----------

const YEARS = Array.from({ length: 11 }, (_, i) => String(2016 + i));
// Each ore grows on its own curve, so ranks change several times.
const ORES = [
  ['Coal', 900, 1.07, 0],
  ['Iron', 500, 1.16, 0],
  ['Copper', 300, 1.24, 0],
  ['Gold', 220, 1.2, 0.3],
  ['Gems', 80, 1.42, 0],
  ['Quartz', 400, 1.04, 0],
  ['Amethyst', 20, 1.62, 0.2],
  ['Obsidian', 160, 1.15, 0],
  ['Tin', 260, 1.02, 0],
  ['Silver', 120, 1.18, 0.1]
].map(([name, base, growth, wobble], k) => {
  const rand = random(k + 11);
  return { name, values: YEARS.map((_, i) => Math.round(base * growth ** i * (1 + wobble * Math.sin(i * 1.3 + k)) * (0.94 + rand() * 0.12))) };
});

// ---------- Heatmap ----------

function useActivity() {
  return useMemo(() => {
    const rand = random(42);
    const today = new Date();
    return Array.from({ length: 371 }, (_, i) => {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      const weekend = date.getDay() === 0 || date.getDay() === 6;
      const season = 0.6 + 0.4 * Math.sin(i / 40);
      const value = rand() < (weekend ? 0.45 : 0.18) ? 0 : Math.round(rand() * 14 * season * (weekend ? 0.6 : 1));
      return { date, value };
    });
  }, []);
}

function HeatDemo({ weekStart, ...props }) {
  const data = useActivity();
  const [picked, setPicked] = useState(null);
  return (
    <div style={stack}>
      <Heatmap {...props} data={data} weekStartsOn={Number(weekStart)} title="Blocks placed this year" unit="block" fontFamily={PIXEL_FONT} onSelect={setPicked} />
      <p style={hint}>{picked ? `${picked.value} blocks on ${picked.date.toDateString()}` : 'Hover a day, or Tab in and use the arrow keys.'}</p>
    </div>
  );
}

// ---------- StatCard ----------

const WEEKS = ['8 weeks ago', '7 weeks ago', '6 weeks ago', '5 weeks ago', '4 weeks ago', '3 weeks ago', '2 weeks ago', 'Last week'];

function StatsDemo(props) {
  const [day, setDay] = useState(0);
  const rand = random(day + 3);
  const revenue = [12.1, 13.4, 12.8, 14.9, 15.2, 16.8, 17.1, 18.4 + day * 0.9].map(v => v * 1000);
  const players = [2310, 2480, 2440, 2710, 2990, 3120, 3080, 3390 + Math.round(rand() * 400)];
  const crashes = [0.021, 0.018, 0.019, 0.016, 0.017, 0.013, 0.014, 0.012 - day * 0.0006];
  const cards = [
    { label: 'Revenue', icon: <Sprite name="coin" size={18} />, trend: revenue, format: 'currency', goodDirection: 'up' },
    { label: 'Active players', icon: <Sprite name="heart" size={18} />, trend: players, format: 'compact', goodDirection: 'up' },
    { label: 'Crash rate', icon: <Sprite name="sword" size={18} />, trend: crashes, format: 'percent', goodDirection: 'down' }
  ];
  return (
    <div style={stack}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, width: '100%', maxWidth: 920 }}>
        {cards.map(card => (
          <StatCard
            key={card.label}
            {...props}
            label={card.label}
            icon={card.icon}
            value={card.trend[card.trend.length - 1]}
            previous={card.trend[card.trend.length - 2]}
            period="vs last week"
            format={card.format}
            goodDirection={card.goodDirection}
            trend={card.trend}
            trendLabels={WEEKS}
            fontFamily={PIXEL_FONT}
            width={400}
          />
        ))}
      </div>
      <PixelButton size="sm" variant="secondary" onPress={() => setDay(d => d + 1)}>
        Next day
      </PixelButton>
      <p style={hint}>Crash rate going down counts as good, so it shows green.</p>
    </div>
  );
}

// ---------- GaugeMeter ----------

function GaugeDemo({ value, ...props }) {
  const [heat, setHeat] = useState(value);
  const [sync, setSync] = useState(value);
  if (sync !== value) {
    setSync(value);
    setHeat(value);
  }
  return (
    <div style={stack}>
      <GaugeMeter {...props} value={heat} unit="°C" label="Furnace heat" fontFamily={PIXEL_FONT} />
      <div style={row}>
        <PixelButton size="sm" variant="info" onPress={() => setHeat(h => Math.max(0, h - 25))}>
          Cool down
        </PixelButton>
        <PixelButton size="sm" variant="primary" onPress={() => setHeat(h => Math.min(100, h + 25))}>
          Stoke the fire
        </PixelButton>
        <PixelButton size="sm" variant="secondary" onPress={() => setHeat(Math.round(Math.random() * 100))}>
          Random
        </PixelButton>
      </div>
    </div>
  );
}

// ---------- Entries ----------

export const DATA_MORE_DEMOS = {
  'bar-race': {
    source: barRaceSource,
    defaults: { stepDuration: 1200, top: 8, loop: true, autoPlay: true },
    controls: [slider('stepDuration', 'Time per year (ms)', 300, 3000, 100), slider('top', 'Bars shown', 3, 10, 1), toggle('loop', 'Loop'), toggle('autoPlay', 'Autoplay')],
    docs: [
      ['series', '{ name, values: number[], color? }[]', '[]', 'One value per step. Color follows the entity (its position here), never its rank.'],
      ['steps', 'string[]', '[]', 'Labels for the time steps (years, months…), shown large in the corner.'],
      ['top', 'number', '8', 'Bars shown; the rest wait off the bottom.'],
      ['stepDuration / autoPlay / loop', 'number / boolean', '1200 / true / false', 'Speed and playback. Reduced motion never autoplays.'],
      ['format', '(v) => string', 'locale integer', 'Bar values and the scale.'],
      ['colors', 'string[]', '8 validated slots', 'RACE_COLORS (exported) is validated for the dark surface; entities past eight share a grey and rely on their labels.'],
      ['Accessibility', '-', '-', 'Every bar is labelled; play/pause and a time scrubber; a hidden table of the current step.']
    ],
    usage: `import BarRace from "./BarRace";

<BarRace
  title="Most-mined ores"
  steps={["2024", "2025", "2026"]}
  series={[{ name: "Coal", values: [900, 960, 1030] }]}
/>`,
    render: props => (
      <div style={{ ...stack, padding: '24px 16px' }}>
        <BarRace {...props} key={`${props.top}-${props.autoPlay}`} series={ORES} steps={YEARS} title="Most-mined ores" subtitle="Thousands of blocks per year, fictional data" fontFamily={PIXEL_FONT} />
      </div>
    )
  },

  heatmap: {
    source: heatmapSource,
    defaults: { cellSize: 12, gap: 3, radius: 2, weekStart: '0' },
    controls: [slider('cellSize', 'Cell size', 8, 18, 1), slider('gap', 'Gap', 1, 6, 1), slider('radius', 'Radius', 0, 6, 1), select('weekStart', 'Week starts on', ['0', '1'])],
    docs: [
      ['data', '{ date, value }[]', '[]', 'Values per day (dates may repeat; they add up).'],
      ['end / weeks', 'Date / number', 'today / 53', 'The last day shown and how many weeks back.'],
      ['thresholds', 'number[3]', 'quartiles', 'Cut-offs between the four non-zero levels.'],
      ['colors', 'string[5]', 'HEAT_RAMP', 'Empty plus four steps of one hue; quiet days recede toward the surface.'],
      ['unit / unitPlural / locale', 'string', '"contribution"', 'Wording in tooltips and the total; Intl dates.'],
      ['onSelect', '(day) => void', '-', 'Click, or Enter on the keyboard cursor.'],
      ['Accessibility', '-', '-', 'One tab stop; arrows walk the days; each day is described ("12 blocks, Tue Oct 6, 2026").']
    ],
    usage: `import Heatmap from "./Heatmap";

<Heatmap data={commits} title="Contributions" onSelect={day => open(day.date)} />`,
    demoOnly: ['weekStart'],
    render: props => <HeatDemo {...props} />
  },

  'stat-card': {
    source: statCardSource,
    defaults: { duration: 900, valueSize: 34 },
    controls: [slider('duration', 'Roll (ms)', 0, 2000, 50), slider('valueSize', 'Value size', 24, 48, 2)],
    docs: [
      ['label / value / icon', 'string / number / ReactNode', '-', 'The metric; the value rolls on change.'],
      ['previous / delta', 'number', '-', 'Delta is computed from previous, or pass it (0.12 = +12%).'],
      ['period / goodDirection', 'string / "up" | "down" | "neutral"', '"vs last period" / "up"', 'What the delta compares to, and whether up is good (sets green/red).'],
      ['format / currency / locale', '"compact" | "currency" | "percent" | "number" | fn', '"compact"', 'Auto-compacts large values (12.9K, $4.2M).'],
      ['trend / trendLabels', 'number[] / string[]', '[]', 'Sparkline points (12 is ideal) and their tooltip labels.'],
      ['formatStat', 'function', 'export', 'The same formatting for your own UI.'],
      ['Accessibility', '-', '-', 'Value, signed delta with "Up/Down", and a one-line trend summary for screen readers.']
    ],
    usage: `import StatCard from "./StatCard";

<StatCard label="Revenue" value={18400} previous={17100} format="currency" trend={weekly} />`,
    render: props => <StatsDemo {...props} />
  },

  'gauge-meter': {
    source: gaugeMeterSource,
    defaults: { value: 42, sweep: 240, stiffness: 140, damping: 11, majorTicks: 5 },
    controls: [slider('value', 'Value', 0, 100, 1), slider('sweep', 'Sweep (°)', 180, 300, 10), slider('stiffness', 'Spring stiffness', 40, 400, 10), slider('damping', 'Spring damping', 3, 40, 1), slider('majorTicks', 'Major ticks', 2, 10, 1)],
    docs: [
      ['value / min / max', 'number', '0 / 0 / 100', 'The reading.'],
      ['zones', '{ to, color, label, icon? }[]', 'Normal · High · Critical', 'Severity bands; the fill and the status chip follow the current zone.'],
      ['unit / label / format', 'string / string / fn', '-', 'Readout text and the gauge’s name.'],
      ['sweep / majorTicks / minorTicks', 'number', '240 / 5 / 4', 'Dial geometry.'],
      ['stiffness / damping', 'number', '140 / 11', 'The needle’s spring (lower damping overshoots more).'],
      ['Accessibility', '-', '-', 'A meter with value text and zone name; the zone also shows an icon and label, never color alone.']
    ],
    usage: `import GaugeMeter from "./GaugeMeter";

<GaugeMeter value={cpu} unit="%" label="CPU" />`,
    render: props => <GaugeDemo {...props} />
  }
};
