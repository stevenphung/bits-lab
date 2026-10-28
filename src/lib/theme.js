// Pixel-adventure demo content for the React Bits previews. Props that have a Customize control
// become the new defaults (and are written into the usage snippet); the rest only change the
// preview. Stock photos are swapped separately by public/pixel-sw.js.
import { BIOMES } from '../pixel/art';

// Biome postcards generated into public/pixel/ by scripts/generate-pixel-assets.mjs.
const postcards = map => BIOMES.map(biome => map(`/pixel/biome-${biome.id}.png`, biome.name));

export const THEMED_PROPS = {
  // Text animations
  AsciiText: { text: 'GG!' },
  BlurText: { text: 'Achievement unlocked!' },
  CircularText: { text: 'PRESS*START*TO*PLAY*' },
  DecryptedText: { text: 'Loading world... generating terrain...' },
  DepthText: { text: 'Level Up' },
  EchoText: { text: 'Echo Cave' },
  FallingText: { text: 'Gravity works on blocks too. Watch them fall apart on contact.', highlightWords: ['blocks', 'fall'] },
  FoldText: { text: 'Fold space, find loot' },
  MaskedHeading: { text: 'Shot in the Overworld' },
  ParticleText: { text: 'Level Up' },
  RotatingText: { texts: ['Dig', 'Build', 'Explore', 'Repeat!'] },
  ScrollVelocity: { texts: ['Press Start ✦', 'Insert Coin ✦'] },
  ShinyText: { text: 'Shiny Loot' },
  Shuffle: { text: 'New World' },
  SplitFlapText: { words: ['PLAYER 1 READY', 'LEVEL 99', 'INSERT COIN'] },
  SplitText: { text: 'Hello, Player!' },
  StrokeText: { text: 'Draw Your Map' },
  TechText: { text: 'Bits Lab' },
  TextCursor: { text: '♥' },
  TextLoop: { text: 'Dig ✦ Build ✦ Explore' },
  TextPressure: { text: 'Boing!' },
  TextType: { text: ['Loading world…', 'Generating terrain', 'Press any key!'] },
  VariableProximity: { label: 'Hover me, adventurer! Then go dig up something shiny.' },
  WarpText: { text: 'Bend the World' },

  // Galleries: biome postcards with matching captions
  AccordionGallery: { items: postcards((image, label) => ({ image, label, link: '#' })).slice(0, 6) },
  CircularGallery: { items: postcards((image, text) => ({ image, text })) },
  DepthCarousel: { items: postcards((image, alt) => ({ image, alt })).slice(0, 8) },
  FlexCarousel: { items: postcards((src, title) => ({ src, alt: `${title} biome`, title })).slice(0, 8) },

  // Components and micro-interactions
  CallChip: { name: 'mine' },
  CurvedInput: { placeholder: 'player@bitslab.dev' },
  ElasticMesh: { text: 'Boing' },
  Folder: { label: 'Inventory' },
  FolderFloat: { label: 'Quest log', items: ['Need more torches', 'Build a bigger base', 'Found diamonds!', 'Home by sunset'] },
  FluidGlass: { text: 'Look closer, adventurer.' },
  FuseButton: { label: 'Light fuse', doneLabel: 'Boom!' },
  GlideSelect: { placeholder: 'Pick a biome…' },
  JellyRadio: { items: ['Peaceful', 'Easy', 'Normal', 'Hard'] },
  LatticeLoader: { label: 'Generating' },
  LineSidebar: { items: ['Inventory', 'Crafting', 'Map', 'Settings'] },
  OptionWheel: { items: ['Plains', 'Desert', 'Tundra', 'Jungle'] },
  PeekRating: { labels: ['Wood', 'Stone', 'Iron', 'Diamond'] },
  ProfileCard: { title: 'Master Builder', name: 'Pixel Pat', status: 'In game' },
  PromptBar: { placeholder: 'Ask the shopkeeper anything', efforts: ['Wood', 'Stone', 'Iron', 'Diamond'] },
  PulseHeart: { label: 'Extra life' },
  ReflectiveCard: { name: 'Robin Cobble', status: 'Exploring' },
  RubberSegment: { items: ['Dawn', 'Day', 'Dusk', 'Night'] },
  ScrollExpand: { title: 'Built block by block' },
  ScrubField: { label: 'Render distance' },
  ShapeWaves: { text: 'XP' },
  SquishSwitch: { label: 'Peaceful mode' },
  SwipeRow: { label: 'Rotten loot' },
  ThoughtLine: { label: 'Planning…', doneLabel: 'Planned for', steps: ['Gathering wood', 'Crafting a pickaxe', 'Mining for diamonds'] }
};

export const THEMED_CHILDREN = {
  FlyingButton: 'Launch rocket',
  FuzzyText: 'GAME OVER',
  GlitchText: 'Glitch World',
  GradientText: 'Add a splash of pixels!',
  HoldButton: 'Hold to mine',
  ScrambledText:
    'Long ago the blocks were scattered across twelve biomes. Only those who dig deep, craft wisely and get home before nightfall will find the diamonds hidden below.',
  ScrollFloat: 'Bits Lab',
  ScrollReveal:
    'When does a world end? When the last torch goes out? No. A world ends when nobody remembers the tunnels they dug, the castles they built and the friends they found along the way.',
  SpecularButton: 'New world',
  StarBorder: 'Press start'
};
