import { BIOMES } from './biomes.js';
import { createRng, makeWord } from './rng.js';

// generateWorld(seed) → a plain description of one world: its biome, palette, words, survey
// readings and, for each slot, which component to render with which props. Every prop is
// picked inside a range that looks good, so any seed gives a world worth looking at.
// Each slot draws from its own forked generator, so adding a slot later keeps old worlds intact.

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const sentence = text => text.charAt(0).toUpperCase() + text.slice(1);

// Backgrounds: (palette, rng) → props.
const BACKGROUNDS = {
  RetroHorizon: (p, r) => ({
    skyTop: p.skyTop,
    skyBottom: p.skyBottom,
    sunTop: p.accent2,
    sunBottom: p.dim,
    mountainColor: p.skyTop,
    gridColor: p.accent,
    floorColor: '#0b0b14',
    horizon: r.range(0.52, 0.64, 0.01),
    speed: r.range(0.6, 1.4, 0.1),
    showMountains: r.chance(0.8),
    stars: r.int(30, 90)
  }),
  CloudSky: (p, r) => ({ topColor: p.skyTop, bottomColor: p.skyBottom, cloudColor: p.ink, shadeColor: p.dim, coverage: r.range(0.35, 0.65, 0.05), pixelSize: r.pick([3, 4, 5]), speed: r.range(0.04, 0.1, 0.01), sunAngle: r.int(15, 75) }),
  ContourLines: (p, r) => ({ lineColor: p.dim, majorColor: p.accent, bandColors: [p.skyTop, p.skyBottom], levels: r.int(10, 18), speed: r.range(0.6, 1.4, 0.1) }),
  MeteorShower: (p, r) => ({ headColor: p.accent, tailColor: p.accent3, starColor: p.ink, backgroundColor: p.skyTop, rate: r.range(1.5, 4, 0.5), angle: r.int(115, 155) }),
  LightShafts: (p, r) => ({ mode: r.weighted([['rays', 3], ['beams', 2], ['lightning', 1]]), colors: [p.accent2, p.accent], backgroundColor: p.skyTop, count: r.int(5, 9), originX: r.range(0.3, 0.7, 0.05) }),
  DitherField: (p, r) => ({ pattern: r.pick(['noise', 'waves', 'radial']), palette: [p.skyTop, p.dim, p.skyBottom, p.accent], scale: r.range(0.8, 1.6, 0.1), speed: r.range(0.6, 1.3, 0.1) }),
  AuroraBands: (p, r) => ({ colors: [p.accent, p.accent3, p.accent2], skyTop: p.skyTop, skyBottom: p.skyBottom, ribbons: r.int(2, 4), bands: r.int(4, 6), speed: r.range(0.7, 1.3, 0.1) }),
  WarpField: (p, r) => ({ colors: [p.ink, p.accent, p.accent2], backgroundColor: p.skyTop, speed: r.range(0.2, 0.45, 0.05) }),
  LavaLamp: (p, r) => ({ topColor: p.accent2, bottomColor: p.accent, rimColor: p.ink, backgroundTop: p.skyBottom, backgroundBottom: p.skyTop, blobs: r.int(5, 8) }),
  CodeRain: (p, r) => ({ color: p.accent, headColor: p.ink, hotColor: p.accent2, backgroundColor: p.skyTop, glyphs: r.pick(['hex', 'binary', 'blocks', 'arrows']), density: r.range(0.5, 0.9, 0.1) })
};

// Title effects: (name, palette, rng) → props. The planet's name is the headline.
const TITLES = {
  SignalText: (text, p, r) => ({ text, as: 'h3', mode: r.pick(['scramble', 'glitch']), charset: r.pick(['blocks', 'alpha']), textColor: p.ink, noiseColor: p.accent, splitColors: [p.accent2, p.accent3], trigger: 'mount' }),
  ShadowStack: (text, p, r) => ({ text, as: 'h3', mode: r.pick(['extrude', 'echo']), depth: r.int(6, 10), faceColor: p.accent2, colors: [p.dim, p.skyTop], fontSize: 'clamp(30px, 6vw, 60px)' }),
  // Pixel letters don't shrink to fit, so longer names get smaller pixels.
  PixelType: (text, p) => ({ text: text.toUpperCase(), effect: 'assemble', pixelSize: text.length <= 6 ? 5 : text.length <= 9 ? 4 : 3, colors: [p.ink, p.accent, p.accent2], trigger: 'mount', align: 'start' }),
  InkText: (text, p, r) => ({ text, as: 'h3', fill: r.pick(['shimmer', 'gradient', 'outline']), colors: [p.accent, p.accent2, p.accent3], baseColor: p.ink }),
  KineticHeadline: (text, p, r) => ({ text, as: 'h3', mode: r.pick(['breathe', 'beat']), textColor: p.ink, accentColor: p.accent, fontSize: 64 }),
  FocusPull: (text, p, r) => ({ text, as: 'h3', rack: r.pick(['sweep', 'center', 'snap']), textColor: p.ink, fringeColors: [p.accent2, p.accent], trigger: 'mount' })
};

const RARITIES = [['common', 50], ['rare', 30], ['epic', 15], ['legendary', 5]];
const GUIDES = ['Surveyor', 'Cartographer', 'Archivist', 'Hermit', 'Ranger', 'Stargazer'];
const PORTRAITS = ['book', 'bench', 'orb', 'note', 'lever', 'potion'];

export function generateWorld(seed) {
  const root = createRng(`world:${seed}`);
  const slots = ['biome', 'palette', 'name', 'background', 'title', 'survey', 'card', 'guide'].reduce((map, label) => ({ ...map, [label]: root.fork(label) }), {});

  const biome = slots.biome.pick(BIOMES);
  const palette = slots.palette.pick(biome.palettes);

  const n = slots.name;
  const name = `${makeWord(n, n.chance(0.7) ? 2 : 3)} ${n.chance(0.35) ? makeWord(n, 1) : n.int(2, 99)}`.replace(/ (\d+)$/, '-$1');
  const epithet = `the ${n.pick(biome.words.adj)} ${n.pick(biome.words.noun)}`;
  const feature = n.pick(biome.words.feature);
  const description = `A ${biome.kind} world where ${feature}.`;

  const bgName = slots.background.pick(biome.backgrounds);
  const background = { component: bgName, props: BACKGROUNDS[bgName](palette, slots.background) };
  const titleName = slots.title.pick(Object.keys(TITLES));
  const title = { component: titleName, props: TITLES[titleName](name, palette, slots.title) };

  const s = slots.survey;
  const survey = {
    flora: s.int(...biome.survey.flora),
    fauna: s.int(...biome.survey.fauna),
    hazard: s.int(...biome.survey.hazard),
    minerals: s.int(10, 95)
  };
  // Habitability, 0–5 in halves: life helps, hazard hurts.
  survey.habitability = clamp(Math.round(((survey.flora + survey.fauna) / 2 - survey.hazard / 2 + 30) / 10) / 2, 0.5, 5);

  const c = slots.card;
  const rarity = c.weighted(RARITIES);
  const card = {
    name,
    image: `/pixel/biome-${biome.id}.png`,
    rarity,
    stats: [
      { label: 'LIFE', value: Math.round((survey.flora + survey.fauna) / 20) },
      { label: 'ORE', value: Math.round(survey.minerals / 10) },
      { label: 'RISK', value: Math.round(survey.hazard / 10) }
    ]
  };

  const g = slots.guide;
  const guide = {
    speaker: `${g.pick(GUIDES)} ${makeWord(g, 2)}`,
    portrait: g.pick(PORTRAITS),
    lines: [
      `Welcome to ${name}, traveller. Here, ${feature}.`,
      `Sensors read ${survey.flora}% flora and a hazard level of ${survey.hazard}. ${survey.hazard > 60 ? 'Mind your step.' : 'You can breathe easy.'}`,
      'Safe travels. There are endless worlds out there.'
    ]
  };

  return { seed, name, epithet, description, biome: biome.id, kind: biome.kind, palette, rarity, background, title, survey, card, guide };
}

// The code for a world's components, ready to paste (imports from the bits-lab package).
export function worldCode(world) {
  const value = v => (typeof v === 'string' ? JSON.stringify(v) : `{${JSON.stringify(v)}}`);
  const jsx = (name, props, indent = '      ') => `${indent}<${name}${Object.entries(props).map(([k, v]) => ` ${k}=${value(v)}`).join('')} />`;
  const names = [world.background.component, world.title.component, 'TradingCard', 'RatingPips', 'HealthBar'];
  return `import { ${[...new Set(names)].sort().join(', ')} } from "bits-lab";

// World "${world.seed}": ${world.name}, ${world.epithet}.
export function World() {
  return (
    <section style={{ position: "relative", minHeight: 560, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }}>
${jsx(world.background.component, world.background.props, '        ')}
      </div>
${jsx(world.title.component, world.title.props)}
${jsx('TradingCard', { ...world.card, image: `https://bits-lab.vercel.app${world.card.image}` })}
${jsx('RatingPips', { value: world.survey.habitability, readOnly: true, label: 'Habitability' })}
${jsx('HealthBar', { value: world.survey.hazard, label: 'HAZARD' })}
    </section>
  );
}
`;
}
