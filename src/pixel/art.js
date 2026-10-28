// Bits Lab pixel-art kit. Pure JS (no DOM), so the same code renders sprites and biome
// "postcards" in the browser and writes PNGs from Node (scripts/generate-pixel-assets.mjs).
// All art is original: hand-placed 16×16 sprites and procedurally generated landscapes.

export const PALETTE = {
  ink: '#0b0b14',
  night: '#1a1c2c',
  plum: '#5d275d',
  red: '#b13e53',
  orange: '#ef7d57',
  yellow: '#ffcd75',
  lime: '#a7f070',
  green: '#38b764',
  teal: '#257179',
  navy: '#29366f',
  blue: '#3b5dc9',
  sky: '#41a6f6',
  cyan: '#73eff7',
  paper: '#f4f4f4',
  mist: '#94b0c2',
  slate: '#566c86',
  deep: '#333c57'
};

// ---------- Sprites ----------
// Fill-only maps; an ink outline is added automatically around every filled pixel.

const SPRITES = {
  heart: {
    colors: { r: PALETTE.red, l: '#e8758a', d: '#7a2338' },
    rows: [
      '', '', '',
      '...rrrr..rrrr',
      '..rllrrrrrrrrr',
      '..rlrrrrrrrrrr',
      '..rrrrrrrrrrrr',
      '..rrrrrrrrrrrd',
      '...rrrrrrrrrd',
      '....rrrrrrrd',
      '.....rrrrrd',
      '......rrrd',
      '.......rd'
    ]
  },
  gem: {
    colors: { w: PALETTE.paper, c: PALETTE.cyan, b: PALETTE.sky, n: PALETTE.blue },
    rows: [
      '', '', '',
      '....wwccccbb',
      '...wwccccccbb',
      '..wccccccccccbb',
      '..bbbbbbbbbbbb',
      '...ccccccccbn',
      '....ccccccbn',
      '.....ccccbn',
      '......ccbn',
      '.......cn'
    ]
  },
  pickaxe: {
    colors: { c: PALETTE.cyan, w: PALETTE.paper, b: PALETTE.sky, h: '#a0703c', H: '#6b4423' },
    rows: [
      '', '',
      '.....ccccc',
      '....cwcccccb',
      '...cc....hcbb',
      '..cb....hH..bb',
      '..b....hH....b',
      '......hH',
      '.....hH',
      '....hH',
      '...hH',
      '..hH',
      '.hH'
    ]
  },
  sword: {
    colors: { w: PALETTE.paper, c: PALETTE.cyan, g: PALETTE.yellow, h: '#a0703c', p: PALETTE.slate },
    rows: [
      '',
      '............ww',
      '...........wcw',
      '..........wcw',
      '.........wcw',
      '........wcw',
      '.......wcw',
      '..g...wcw',
      '...g.wcw',
      '....gcw',
      '....hgg',
      '...hh..g',
      '..hh',
      '.pp'
    ]
  },
  chest: {
    colors: { o: '#6b4423', y: '#c98b45', l: '#e0a862', g: PALETTE.yellow, G: '#b8862e' },
    rows: [
      '', '', '',
      '..oooooooooooo',
      '..olllllllllyo',
      '..oyyyyyyyyyyo',
      '..oooooooooooo',
      '..oyyyyggyyyyo',
      '..oyyyygGyyyyo',
      '..oyyyyyyyyyyo',
      '..oyyyyyyyyyyo',
      '..oooooooooooo'
    ]
  },
  potion: {
    colors: { h: '#a0703c', g: PALETTE.mist, w: PALETTE.paper, p: '#c447a6', P: PALETTE.plum },
    rows: [
      '', '',
      '.......hh',
      '......gggg',
      '.......gg',
      '.......gg',
      '......gggg',
      '.....gppppg',
      '....gwpppppg',
      '....gwpppppg',
      '....gppppPPg',
      '.....gPPPPg',
      '......gggg'
    ]
  },
  book: {
    colors: { n: PALETTE.navy, b: PALETTE.blue, y: PALETTE.yellow, w: PALETTE.paper },
    rows: [
      '', '',
      '...nnnnnnnnnw',
      '...nbbbbbbbnw',
      '...nbbbbbbbnw',
      '...nyyyyyyynw',
      '...nbbbbbbbnw',
      '...nbbbbbbbnw',
      '...nbbbbbbbnw',
      '...nbbbbbbbnw',
      '...nbbbbbbbnw',
      '...nnnnnnnnnw',
      '....wwwwwwwww'
    ]
  },
  star: {
    colors: { y: PALETTE.yellow, l: PALETTE.paper, o: PALETTE.orange },
    rows: [
      '', '',
      '.......y',
      '.......y',
      '......yly',
      '......yly',
      '..yyyyylyyyyy',
      '....yyyyyyy',
      '.....yyyyy',
      '.....yyoyy',
      '....yyo.oyy',
      '....yo...oy'
    ]
  },
  orb: {
    colors: { g: PALETTE.green, l: PALETTE.lime, w: PALETTE.paper, d: PALETTE.teal },
    rows: [
      '', '', '',
      '......gggg',
      '....gglllgg',
      '....glwllggd',
      '...gglwlllgd',
      '...glllllggd',
      '...gglllggdd',
      '....gggggdd',
      '.....dddd'
    ]
  },
  coin: {
    colors: { y: PALETTE.yellow, l: PALETTE.paper, o: PALETTE.orange },
    rows: [
      '', '', '',
      '......yyyy',
      '....yyllyyyy',
      '...yylyyyyyoy',
      '...ylyyooyyyo',
      '...yyyyooyyyo',
      '...yyyyooyyyo',
      '...yyyyyyyyoo',
      '....yyyyyyoo',
      '......oooo'
    ]
  },
  note: {
    colors: { y: PALETTE.yellow, o: PALETTE.orange },
    rows: [
      '', '',
      '.........yyy',
      '.........yyyy',
      '.........y..yy',
      '.........y...y',
      '.........y',
      '.........y',
      '.........y',
      '......yyyy',
      '.....yyyyo',
      '.....yyyo',
      '......oo'
    ]
  },
  frame: {
    colors: { h: '#8a5a2b', b: PALETTE.sky, y: PALETTE.yellow, g: PALETTE.green, G: PALETTE.teal },
    rows: [
      '', '',
      '..hhhhhhhhhhhh',
      '..hbbbbbbbbyyh',
      '..hbbbbbbbbyyh',
      '..hbbbbbbbbbbh',
      '..hbbbbbgbbbbh',
      '..hbbbbgggbbbh',
      '..hbggggggggbh',
      '..hggggggggggh',
      '..hGGGGGGGGGGh',
      '..hhhhhhhhhhhh'
    ]
  },
  lever: {
    colors: { y: PALETTE.red, h: '#a0703c', s: PALETTE.mist, S: PALETTE.slate },
    rows: [
      '', '', '',
      '..........yy',
      '.........yyy',
      '........hh',
      '.......hh',
      '......hh',
      '.....hh',
      '...ssssssssss',
      '...sSSSSSSSSs',
      '...ssssssssss'
    ]
  },
  grass: {
    // Filled procedurally in spriteGrid: grass top with drips, dirt with specks.
    colors: { g: PALETTE.green, G: PALETTE.teal, l: PALETTE.lime, d: '#8a5a2b', D: '#5e3b1c' },
    rows: null
  },
  bench: {
    colors: { y: '#c98b45', o: '#6b4423', l: '#e0a862' },
    rows: null
  }
};

export const SPRITE_NAMES = Object.keys(SPRITES);

function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function proceduralRows(name) {
  const grid = Array.from({ length: 16 }, () => Array(16).fill('.'));
  const next = rng(name === 'grass' ? 3 : 9);
  for (let y = 2; y < 14; y++) {
    for (let x = 2; x < 14; x++) {
      if (name === 'grass') {
        const drip = y === 5 && next() < 0.5;
        if (y < 5 || drip) grid[y][x] = next() < 0.18 ? 'l' : next() < 0.15 ? 'G' : 'g';
        else grid[y][x] = next() < 0.16 ? 'D' : 'd';
      } else {
        const line = y === 2 || y === 13 || x === 2 || x === 13 || y === 6 || y === 10 || x === 6 || x === 10;
        grid[y][x] = line ? 'o' : next() < 0.12 ? 'l' : 'y';
      }
    }
  }
  return grid.map(row => row.join(''));
}

// Returns a 16×16 grid of hex colors (or null) with the outline applied.
export function spriteGrid(name) {
  const sprite = SPRITES[name] ?? SPRITES.gem;
  const rows = (sprite.rows ?? proceduralRows(name)).map(row => row.padEnd(16, '.').slice(0, 16));
  while (rows.length < 16) rows.push('.'.repeat(16));
  const grid = rows.map(row => [...row].map(char => (char === '.' ? null : sprite.colors[char] ?? PALETTE.ink)));
  const outlined = grid.map(row => [...row]);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (grid[y][x]) continue;
      const touches = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1]
      ].some(([nx, ny]) => grid[ny]?.[nx]);
      if (touches) outlined[y][x] = PALETTE.ink;
    }
  }
  return outlined;
}

// SVG markup for a sprite (crisp at any size).
export function spriteSvg(name, size = 16) {
  const grid = spriteGrid(name);
  let rects = '';
  grid.forEach((row, y) => {
    let x = 0;
    while (x < 16) {
      const color = row[x];
      if (!color) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < 16 && row[x + run] === color) run++;
      rects += `<rect x="${x}" y="${y}" width="${run}" height="1" fill="${color}"/>`;
      x += run;
    }
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="${size}" height="${size}" shape-rendering="crispEdges">${rects}</svg>`;
}

// ---------- Biome postcards ----------

export const BIOMES = [
  { id: 'plains', name: 'Plains', sky: ['#41a6f6', '#a6dcff'], sun: 'sun', clouds: 4, top: PALETTE.green, topAlt: PALETTE.lime, sub: '#8a5a2b', water: '#3b5dc9', trees: 'oak', ground: 40, amp: 5 },
  { id: 'forest', name: 'Forest', sky: ['#3b5dc9', '#73eff7'], sun: 'sun', clouds: 2, top: PALETTE.teal, topAlt: PALETTE.green, sub: '#6b4423', water: '#29366f', trees: 'oak-dense', ground: 42, amp: 6 },
  { id: 'desert', name: 'Desert', sky: ['#ef7d57', '#ffcd75'], sun: 'sun-big', clouds: 0, top: '#f3d38c', topAlt: '#e9bf6c', sub: '#d9a75a', water: null, trees: 'cactus', ground: 44, amp: 4 },
  { id: 'snowy', name: 'Snowy Peaks', sky: ['#94b0c2', '#f4f4f4'], sun: 'sun-pale', clouds: 3, top: PALETTE.paper, topAlt: '#dfe9f0', sub: PALETTE.slate, water: '#73eff7', trees: 'pine', ground: 36, amp: 12 },
  { id: 'ocean', name: 'Ocean', sky: ['#41a6f6', '#c3f2ff'], sun: 'sun', clouds: 5, top: '#f3d38c', topAlt: '#e9bf6c', sub: '#d9a75a', water: '#3b5dc9', trees: 'none', ground: 54, amp: 6, waterLevel: 44 },
  { id: 'jungle', name: 'Jungle', sky: ['#38b764', '#a7f070'], sun: 'none', clouds: 0, top: '#2e8b46', topAlt: PALETTE.lime, sub: '#5e3b1c', water: '#257179', trees: 'jungle', ground: 46, amp: 4 },
  { id: 'mesa', name: 'Mesa', sky: ['#ef7d57', '#ffcd75'], sun: 'sun-big', clouds: 1, top: '#d9a75a', topAlt: '#c98b45', sub: 'stripes', water: null, trees: 'none', ground: 34, amp: 10 },
  { id: 'night', name: 'Night Plains', sky: ['#1a1c2c', '#29366f'], sun: 'moon', clouds: 2, stars: true, top: PALETTE.teal, topAlt: PALETTE.green, sub: '#5e3b1c', water: '#29366f', trees: 'oak', ground: 42, amp: 5 },
  { id: 'underworld', name: 'Underworld', sky: ['#2a0d14', '#7a2338'], sun: 'none', clouds: 0, top: '#7a2338', topAlt: PALETTE.red, sub: '#4a1622', water: '#ef7d57', lava: true, trees: 'none', ground: 50, amp: 8, waterLevel: 47, ceiling: true, stone: ['#4a1622', '#5e1c2b'], ores: ['#ffcd75', '#ef7d57'] },
  { id: 'void', name: 'Void Isles', sky: ['#0b0b14', '#5d275d'], sun: 'planet', clouds: 0, stars: true, islands: true },
  { id: 'cave', name: 'Deep Cave', cave: true },
  { id: 'cherry', name: 'Blossom Hills', sky: ['#c447a6', '#ffd1e8'], sun: 'sun-pale', clouds: 3, top: '#e8758a', topAlt: '#ffd1e8', sub: '#6b4423', water: '#41a6f6', trees: 'blossom', ground: 42, amp: 7 }
];

const hex = value => {
  const n = parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const mix = (a, b, t) => {
  const [r1, g1, b1] = hex(a);
  const [r2, g2, b2] = hex(b);
  const c = [r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t].map(v => Math.round(v).toString(16).padStart(2, '0'));
  return `#${c.join('')}`;
};

const MESA_STRIPES = ['#d9a75a', '#b13e53', '#ef7d57', '#f3d38c', '#c98b45', '#7a2338'];

// Renders a biome into a width × height grid of hex colors.
export function sceneGrid(id, width = 96, height = 64, seed = 1) {
  const biome = BIOMES.find(entry => entry.id === id) ?? BIOMES[0];
  const next = rng(seed * 7919 + id.length * 31 + id.charCodeAt(0));
  const grid = Array.from({ length: height }, () => Array(width).fill(PALETTE.ink));
  const set = (x, y, color) => {
    if (x >= 0 && y >= 0 && x < width && y < height) grid[y][x] = color;
  };
  const scaleY = height / 64;

  if (biome.cave) {
    // Rock everywhere, a winding tunnel carved by noise, glowing ores and a torch.
    const center = x => height * 0.5 + Math.sin(x * 0.09) * height * 0.16 + Math.sin(x * 0.21 + 2) * height * 0.06;
    const half = x => height * 0.17 + Math.sin(x * 0.13 + 1) * height * 0.06;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const inTunnel = Math.abs(y - center(x)) < half(x);
        if (inTunnel) set(x, y, y > center(x) + half(x) - 3 ? '#262a3d' : '#14162a');
        else set(x, y, next() < 0.1 ? PALETTE.slate : next() < 0.5 ? PALETTE.deep : '#2a3048');
      }
    }
    for (let i = 0; i < 26; i++) {
      const x = Math.floor(next() * width);
      const y = Math.floor(next() * height);
      if (Math.abs(y - center(x)) < half(x)) continue;
      const color = [PALETTE.cyan, PALETTE.yellow, PALETTE.red, PALETTE.lime][i % 4];
      set(x, y, color);
      set(x + 1, y, color);
      set(x, y + 1, mix(color, PALETTE.ink, 0.3));
    }
    const tx = Math.floor(width * 0.6);
    const ty = Math.floor(center(tx) + half(tx)) - 1;
    for (let y = ty - 5; y < ty; y++) set(tx, y, '#a0703c');
    set(tx, ty - 6, PALETTE.yellow);
    set(tx, ty - 7, PALETTE.orange);
    return grid;
  }

  // Sky in dithered bands.
  const bands = 7;
  for (let y = 0; y < height; y++) {
    const t = y / (height * 0.75);
    const band = Math.min(bands - 1, Math.floor(t * bands));
    for (let x = 0; x < width; x++) {
      const dither = (x + y) % 2 === 0 && t * bands - band > 0.5 ? 1 : 0;
      set(x, y, mix(biome.sky[0], biome.sky[1], Math.min(1, (band + dither) / (bands - 1))));
    }
  }

  if (biome.stars) {
    for (let i = 0; i < width * 0.6; i++) set(Math.floor(next() * width), Math.floor(next() * height * 0.6), next() < 0.3 ? PALETTE.yellow : PALETTE.paper);
  }

  // Sun, moon or planet.
  const sx = Math.floor(width * 0.72);
  const sy = Math.floor(10 * scaleY);
  if (biome.sun === 'sun' || biome.sun === 'sun-big' || biome.sun === 'sun-pale') {
    const r = biome.sun === 'sun-big' ? 6 : 4;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) set(sx + x, sy + y, Math.abs(x) === r || Math.abs(y) === r ? PALETTE.orange : biome.sun === 'sun-pale' ? PALETTE.paper : PALETTE.yellow);
  } else if (biome.sun === 'moon') {
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) set(sx + x, sy + y, (x + y) % 3 === 0 && Math.abs(x) < 2 ? PALETTE.mist : PALETTE.paper);
  } else if (biome.sun === 'planet') {
    for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) if (x * x + y * y < 81) set(sx + x, sy + 4 + y, x + y < -4 ? '#f3d38c' : (x * 3 + y) % 5 === 0 ? '#c98b45' : '#e0a862');
  }

  for (let i = 0; i < biome.clouds; i++) {
    const cx = Math.floor(next() * width);
    const cy = Math.floor((4 + next() * 14) * scaleY);
    const length = 8 + Math.floor(next() * 12);
    for (let x = 0; x < length; x++) {
      set((cx + x) % width, cy, PALETTE.paper);
      set((cx + x) % width, cy + 1, x > 1 && x < length - 2 ? PALETTE.paper : mix(PALETTE.paper, biome.sky[1], 0.5));
      if (x > 2 && x < length - 4) set((cx + x) % width, cy - 1, PALETTE.paper);
    }
  }

  if (biome.islands) {
    for (let i = 0; i < 3; i++) {
      const ix = Math.floor(width * (0.18 + i * 0.3));
      const iy = Math.floor(height * (0.55 + (i % 2) * 0.12));
      const w = 12 + i * 3;
      for (let row = 0; row < w / 2; row++) {
        for (let x = -w / 2 + row; x < w / 2 - row; x++) set(ix + Math.round(x), iy + row, row === 0 ? '#c447a6' : row < 2 ? '#f3d38c' : next() < 0.2 ? PALETTE.slate : '#d9c48a');
      }
      for (let y = 1; y < 6; y++) set(ix, iy - y, PALETTE.plum);
      for (let x = -2; x <= 2; x++) set(ix + x, iy - 6, '#c447a6');
    }
    return grid;
  }

  if (biome.ceiling) {
    for (let x = 0; x < width; x++) {
      const depth = 4 + Math.floor(Math.abs(Math.sin(x * 0.3)) * 5 + next() * 3);
      for (let y = 0; y < depth; y++) set(x, y, next() < 0.2 ? PALETTE.red : '#4a1622');
    }
  }

  // Terrain heightmap from a few seeded sine waves, rounded to whole blocks.
  const phase = [next() * 10, next() * 10, next() * 10];
  const ground = biome.ground * scaleY;
  const heightAt = x => Math.round(ground - biome.amp * scaleY * (0.55 * Math.sin(x * 0.07 + phase[0]) + 0.3 * Math.sin(x * 0.17 + phase[1]) + 0.15 * Math.sin(x * 0.41 + phase[2])));
  const waterLevel = biome.waterLevel ? Math.round(biome.waterLevel * scaleY) : Math.round((biome.ground + biome.amp * 0.6) * scaleY);
  const tops = [];

  for (let x = 0; x < width; x++) {
    const h = heightAt(x);
    tops.push(h);
    for (let y = h; y < height; y++) {
      const depth = y - h;
      let color;
      if (depth < 1) color = next() < 0.2 ? biome.topAlt : biome.top;
      else if (depth < 5) color = biome.sub === 'stripes' ? MESA_STRIPES[Math.floor(y / 3) % MESA_STRIPES.length] : next() < 0.15 ? mix(biome.sub, PALETTE.ink, 0.25) : biome.sub;
      else if (biome.sub === 'stripes') color = MESA_STRIPES[Math.floor(y / 3) % MESA_STRIPES.length];
      else {
        const [stone, stoneAlt] = biome.stone ?? ['#7d8ea3', PALETTE.slate];
        const ores = biome.ores ?? [PALETTE.cyan, PALETTE.yellow, PALETTE.red];
        color = next() < 0.04 ? ores[Math.floor(next() * ores.length)] : next() < 0.3 ? stoneAlt : stone;
      }
      set(x, y, color);
    }
    if (biome.water && h > waterLevel) {
      for (let y = waterLevel; y < h; y++) set(x, y, y === waterLevel ? mix(biome.water, PALETTE.paper, biome.lava ? 0.4 : 0.35) : biome.water);
    }
  }

  // Plants on dry land.
  const drawTree = (x, kind) => {
    const base = tops[x];
    if (base === undefined || (biome.water && base > waterLevel)) return;
    if (kind === 'cactus') {
      const h = 4 + Math.floor(next() * 4);
      for (let y = 1; y <= h; y++) set(x, base - y, PALETTE.green);
      set(x - 1, base - h + 1, PALETTE.green);
      set(x - 1, base - h, PALETTE.green);
      set(x + 1, base - h + 2, PALETTE.teal);
      return;
    }
    const trunk = kind === 'jungle' ? 9 + Math.floor(next() * 5) : 4 + Math.floor(next() * 3);
    for (let y = 1; y <= trunk; y++) set(x, base - y, kind === 'blossom' ? '#5e3b1c' : '#6b4423');
    const leaf = kind === 'blossom' ? '#e8758a' : kind === 'pine' ? PALETTE.teal : PALETTE.green;
    const leafDark = kind === 'blossom' ? '#b13e53' : PALETTE.teal;
    const top = base - trunk;
    if (kind === 'pine') {
      for (let row = 0; row < 6; row++) for (let dx = -Math.floor(row / 2) - 1; dx <= Math.floor(row / 2) + 1; dx++) set(x + dx, top - 4 + row, row % 2 ? leafDark : leaf);
      if (biome.top === PALETTE.paper) set(x, top - 4, PALETTE.paper);
      return;
    }
    const radius = kind === 'jungle' ? 4 : 2;
    for (let dy = -radius - 1; dy <= 1; dy++) {
      for (let dx = -radius - 1; dx <= radius + 1; dx++) {
        if (next() < 0.12) continue;
        set(x + dx, top + dy, next() < 0.3 ? leafDark : leaf);
      }
    }
  };

  const treeKind = biome.trees === 'oak-dense' ? 'oak' : biome.trees;
  if (treeKind && treeKind !== 'none') {
    const spacing = biome.trees === 'oak-dense' ? 7 : treeKind === 'jungle' ? 12 : 16;
    for (let x = 4 + Math.floor(next() * 6); x < width - 3; x += spacing + Math.floor(next() * spacing * 0.6)) drawTree(x, treeKind);
  }

  if (biome.lava) {
    for (let i = 0; i < 18; i++) set(Math.floor(next() * width), waterLevel - 1 - Math.floor(next() * 3), next() < 0.5 ? PALETTE.yellow : PALETTE.orange);
  }
  return grid;
}

// Writes a color grid into an RGBA buffer, each cell scaled to `scale` × `scale` pixels.
export function gridToRgba(grid, scale = 1) {
  const height = grid.length * scale;
  const width = grid[0].length * scale;
  const data = new Uint8ClampedArray(width * height * 4);
  grid.forEach((row, gy) =>
    row.forEach((color, gx) => {
      if (!color) return;
      const [r, g, b] = hex(color);
      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const i = ((gy * scale + sy) * width + gx * scale + sx) * 4;
          data[i] = r;
          data[i + 1] = g;
          data[i + 2] = b;
          data[i + 3] = 255;
        }
      }
    })
  );
  return { width, height, data };
}
