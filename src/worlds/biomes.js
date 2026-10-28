// The planet types. Each biome reuses one of the pixel-art kit's biome scenes and brings its
// own palettes, the backgrounds that suit it, survey ranges and words for its descriptions.
// Palette keys: skyTop/skyBottom (backdrop), accent/accent2/accent3 (light colours that read
// on the backdrop), ink (text), panel (card backing) and dim (quiet details).

export const BIOMES = [
  {
    id: 'plains',
    kind: 'grassland',
    palettes: [
      { skyTop: '#1d3a6e', skyBottom: '#41a6f6', accent: '#a7f070', accent2: '#ffcd75', accent3: '#73eff7', ink: '#f4f4f4', panel: 'rgba(17, 30, 52, 0.82)', dim: '#566c86' },
      { skyTop: '#0f2a3a', skyBottom: '#257179', accent: '#a7f070', accent2: '#f4f4f4', accent3: '#ffcd75', ink: '#f4f4f4', panel: 'rgba(10, 24, 30, 0.82)', dim: '#3b7a72' }
    ],
    backgrounds: ['RetroHorizon', 'CloudSky', 'ContourLines', 'MeteorShower'],
    survey: { flora: [60, 95], fauna: [40, 85], hazard: [5, 30] },
    words: { adj: ['Rolling', 'Verdant', 'Windswept', 'Golden', 'Quiet'], noun: ['Meadows', 'Downs', 'Prairie', 'Fields', 'Steppe'], feature: ['grass hums when the wind turns', 'herds migrate under two moons', 'every hill hides a burrow', 'wildflowers bloom in perfect spirals'] }
  },
  {
    id: 'forest',
    kind: 'forest',
    palettes: [
      { skyTop: '#0b1f1c', skyBottom: '#257179', accent: '#38b764', accent2: '#a7f070', accent3: '#ffcd75', ink: '#f4f4f4', panel: 'rgba(8, 22, 20, 0.84)', dim: '#2e6b5e' },
      { skyTop: '#14122a', skyBottom: '#29366f', accent: '#a7f070', accent2: '#73eff7', accent3: '#ef7d57', ink: '#f4f4f4', panel: 'rgba(14, 14, 34, 0.84)', dim: '#3b5dc9' }
    ],
    backgrounds: ['LightShafts', 'ContourLines', 'DitherField', 'CloudSky'],
    survey: { flora: [80, 100], fauna: [55, 95], hazard: [15, 45] },
    words: { adj: ['Whispering', 'Ancient', 'Mossy', 'Tangled', 'Emerald'], noun: ['Woods', 'Thicket', 'Canopy', 'Grove', 'Weald'], feature: ['trees trade light through their roots', 'the canopy glows after rain', 'paths rearrange themselves overnight', 'owls the size of houses keep watch'] }
  },
  {
    id: 'desert',
    kind: 'desert',
    palettes: [
      { skyTop: '#5d275d', skyBottom: '#ef7d57', accent: '#ffcd75', accent2: '#f4f4f4', accent3: '#73eff7', ink: '#f4f4f4', panel: 'rgba(48, 18, 30, 0.82)', dim: '#b13e53' },
      { skyTop: '#29366f', skyBottom: '#ef7d57', accent: '#ffcd75', accent2: '#a7f070', accent3: '#f4f4f4', ink: '#f4f4f4', panel: 'rgba(30, 20, 40, 0.82)', dim: '#94585a' }
    ],
    backgrounds: ['RetroHorizon', 'LightShafts', 'DitherField', 'MeteorShower'],
    survey: { flora: [2, 20], fauna: [5, 35], hazard: [45, 80] },
    words: { adj: ['Amber', 'Scorched', 'Shifting', 'Singing', 'Endless'], noun: ['Dunes', 'Wastes', 'Flats', 'Shallows', 'Expanse'], feature: ['the dunes sing at dusk', 'glass forms wherever lightning lands', 'buried towers surface after storms', 'mirages show cities that once stood here'] }
  },
  {
    id: 'snowy',
    kind: 'ice',
    palettes: [
      { skyTop: '#1a1c2c', skyBottom: '#566c86', accent: '#f4f4f4', accent2: '#73eff7', accent3: '#a7f070', ink: '#f4f4f4', panel: 'rgba(20, 24, 40, 0.84)', dim: '#94b0c2' },
      { skyTop: '#29366f', skyBottom: '#94b0c2', accent: '#f4f4f4', accent2: '#41a6f6', accent3: '#ffcd75', ink: '#f4f4f4', panel: 'rgba(24, 32, 60, 0.84)', dim: '#73a0c8' }
    ],
    backgrounds: ['AuroraBands', 'CloudSky', 'ContourLines', 'MeteorShower'],
    survey: { flora: [5, 30], fauna: [10, 45], hazard: [40, 75] },
    words: { adj: ['Frozen', 'Silent', 'Glacial', 'Pale', 'Crystal'], noun: ['Peaks', 'Tundra', 'Icefields', 'Spires', 'Reach'], feature: ['the ice remembers footprints for a century', 'auroras hang low enough to touch', 'snow falls upward at dawn', 'frozen waterfalls ring like bells'] }
  },
  {
    id: 'ocean',
    kind: 'ocean',
    palettes: [
      { skyTop: '#0b2a52', skyBottom: '#41a6f6', accent: '#73eff7', accent2: '#f4f4f4', accent3: '#ffcd75', ink: '#f4f4f4', panel: 'rgba(8, 26, 50, 0.82)', dim: '#3b5dc9' },
      { skyTop: '#11121e', skyBottom: '#257179', accent: '#73eff7', accent2: '#a7f070', accent3: '#ef7d57', ink: '#f4f4f4', panel: 'rgba(8, 20, 28, 0.84)', dim: '#257179' }
    ],
    backgrounds: ['ContourLines', 'LavaLamp', 'CloudSky', 'AuroraBands'],
    survey: { flora: [35, 75], fauna: [60, 100], hazard: [20, 55] },
    words: { adj: ['Endless', 'Tidal', 'Glimmering', 'Deep', 'Azure'], noun: ['Seas', 'Shoals', 'Reefs', 'Archipelago', 'Depths'], feature: ['the tides follow songs instead of moons', 'whole islands drift like rafts', 'reefs glow in slow pulses', 'the sea is warm enough to sleep in'] }
  },
  {
    id: 'jungle',
    kind: 'jungle',
    palettes: [
      { skyTop: '#0d2216', skyBottom: '#38b764', accent: '#a7f070', accent2: '#ffcd75', accent3: '#ef7d57', ink: '#f4f4f4', panel: 'rgba(8, 26, 14, 0.84)', dim: '#2e8b46' },
      { skyTop: '#1a1c2c', skyBottom: '#2e8b46', accent: '#ffcd75', accent2: '#73eff7', accent3: '#a7f070', ink: '#f4f4f4', panel: 'rgba(16, 24, 22, 0.84)', dim: '#38b764' }
    ],
    backgrounds: ['LightShafts', 'LavaLamp', 'DitherField', 'CodeRain'],
    survey: { flora: [85, 100], fauna: [70, 100], hazard: [35, 70] },
    words: { adj: ['Humming', 'Overgrown', 'Steaming', 'Wild', 'Lush'], noun: ['Jungle', 'Vines', 'Basin', 'Hollows', 'Wilds'], feature: ['vines move when no one is looking', 'flowers bloom in time with heartbeats', 'rain falls warm and never stops', 'the trees are older than the stars above'] }
  },
  {
    id: 'mesa',
    kind: 'canyon',
    palettes: [
      { skyTop: '#2a0d14', skyBottom: '#ef7d57', accent: '#ffcd75', accent2: '#f4f4f4', accent3: '#a7f070', ink: '#f4f4f4', panel: 'rgba(40, 14, 18, 0.84)', dim: '#b13e53' },
      { skyTop: '#5d275d', skyBottom: '#d9a75a', accent: '#ffcd75', accent2: '#73eff7', accent3: '#f4f4f4', ink: '#f4f4f4', panel: 'rgba(44, 20, 34, 0.84)', dim: '#c98b45' }
    ],
    backgrounds: ['RetroHorizon', 'DitherField', 'LightShafts', 'ContourLines'],
    survey: { flora: [10, 35], fauna: [15, 50], hazard: [30, 60] },
    words: { adj: ['Crimson', 'Layered', 'Sunbaked', 'Towering', 'Rust'], noun: ['Mesas', 'Canyons', 'Badlands', 'Buttes', 'Terraces'], feature: ['every canyon wall is a history book', 'wind carves new arches each season', 'echoes come back in other voices', 'sunsets last half a day'] }
  },
  {
    id: 'night',
    kind: 'twilight',
    palettes: [
      { skyTop: '#0b0b14', skyBottom: '#29366f', accent: '#73eff7', accent2: '#ffcd75', accent3: '#f4f4f4', ink: '#f4f4f4', panel: 'rgba(10, 12, 28, 0.84)', dim: '#3b5dc9' },
      { skyTop: '#1a1c2c', skyBottom: '#5d275d', accent: '#ffcd75', accent2: '#73eff7', accent3: '#ef7d57', ink: '#f4f4f4', panel: 'rgba(20, 14, 32, 0.84)', dim: '#7a4f8a' }
    ],
    backgrounds: ['MeteorShower', 'AuroraBands', 'WarpField', 'RetroHorizon'],
    survey: { flora: [25, 60], fauna: [30, 70], hazard: [20, 50] },
    words: { adj: ['Starlit', 'Moonbound', 'Dusky', 'Velvet', 'Midnight'], noun: ['Plains', 'Moors', 'Heights', 'Fields', 'Vale'], feature: ['night never quite ends', 'stars fall often enough to collect', 'fireflies spell out warnings', 'the moons take turns lighting the land'] }
  },
  {
    id: 'underworld',
    kind: 'volcanic',
    palettes: [
      { skyTop: '#0b0b14', skyBottom: '#7a2338', accent: '#ef7d57', accent2: '#ffcd75', accent3: '#f4f4f4', ink: '#f4f4f4', panel: 'rgba(26, 8, 14, 0.86)', dim: '#b13e53' },
      { skyTop: '#2a0d14', skyBottom: '#b13e53', accent: '#ffcd75', accent2: '#ef7d57', accent3: '#73eff7', ink: '#f4f4f4', panel: 'rgba(32, 10, 16, 0.86)', dim: '#7a2338' }
    ],
    backgrounds: ['LavaLamp', 'LightShafts', 'CodeRain', 'DitherField'],
    survey: { flora: [0, 12], fauna: [5, 30], hazard: [75, 100] },
    words: { adj: ['Molten', 'Smouldering', 'Ashen', 'Restless', 'Infernal'], noun: ['Caldera', 'Forge', 'Rifts', 'Embers', 'Furnace'], feature: ['rivers of lava run uphill', 'the ground is warm enough to cook on', 'volcanoes erupt on a perfect schedule', 'ash falls like snow, but glowing'] }
  },
  {
    id: 'void',
    kind: 'void',
    palettes: [
      { skyTop: '#0b0b14', skyBottom: '#5d275d', accent: '#73eff7', accent2: '#ef7d57', accent3: '#ffcd75', ink: '#f4f4f4', panel: 'rgba(14, 8, 24, 0.86)', dim: '#7a4f8a' },
      { skyTop: '#11121e', skyBottom: '#29366f', accent: '#a7f070', accent2: '#73eff7', accent3: '#f4f4f4', ink: '#f4f4f4', panel: 'rgba(10, 12, 26, 0.86)', dim: '#3b5dc9' }
    ],
    backgrounds: ['WarpField', 'CodeRain', 'AuroraBands', 'MeteorShower'],
    survey: { flora: [0, 15], fauna: [0, 25], hazard: [50, 90] },
    words: { adj: ['Drifting', 'Hollow', 'Weightless', 'Strange', 'Shattered'], noun: ['Isles', 'Fragments', 'Shards', 'Expanse', 'Rim'], feature: ['islands float and sometimes leave', 'gravity changes direction at noon', 'the horizon curves the wrong way', 'nothing casts a shadow here'] }
  },
  {
    id: 'cave',
    kind: 'subterranean',
    palettes: [
      { skyTop: '#0b0b14', skyBottom: '#333c57', accent: '#73eff7', accent2: '#a7f070', accent3: '#ffcd75', ink: '#f4f4f4', panel: 'rgba(12, 14, 22, 0.86)', dim: '#566c86' },
      { skyTop: '#11121e', skyBottom: '#29366f', accent: '#ffcd75', accent2: '#73eff7', accent3: '#ef7d57', ink: '#f4f4f4', panel: 'rgba(12, 12, 24, 0.86)', dim: '#3b5dc9' }
    ],
    backgrounds: ['CodeRain', 'ContourLines', 'DitherField', 'LightShafts'],
    survey: { flora: [10, 40], fauna: [20, 55], hazard: [30, 65] },
    words: { adj: ['Echoing', 'Hidden', 'Glowing', 'Deep', 'Crystal'], noun: ['Caverns', 'Hollows', 'Depths', 'Grottoes', 'Tunnels'], feature: ['crystals hum when you walk past', 'underground rivers run in circles', 'the walls glow brighter as you go deeper', 'every tunnel ends somewhere new'] }
  },
  {
    id: 'cherry',
    kind: 'blossom',
    palettes: [
      { skyTop: '#5d275d', skyBottom: '#c447a6', accent: '#ffd1e8', accent2: '#ffcd75', accent3: '#a7f070', ink: '#f4f4f4', panel: 'rgba(44, 16, 44, 0.84)', dim: '#e8758a' },
      { skyTop: '#29366f', skyBottom: '#e8758a', accent: '#ffd1e8', accent2: '#73eff7', accent3: '#f4f4f4', ink: '#f4f4f4', panel: 'rgba(30, 20, 50, 0.84)', dim: '#c447a6' }
    ],
    backgrounds: ['CloudSky', 'AuroraBands', 'LavaLamp', 'RetroHorizon'],
    survey: { flora: [70, 100], fauna: [30, 70], hazard: [0, 20] },
    words: { adj: ['Blooming', 'Gentle', 'Rose', 'Dreaming', 'Petal'], noun: ['Hills', 'Gardens', 'Groves', 'Terraces', 'Valley'], feature: ['petals fall all year round', 'the rivers smell of tea', 'the wind writes poems in the blossoms', 'nobody here has ever been in a hurry'] }
  }
];
