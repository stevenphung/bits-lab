// Seeded randomness: the same seed always grows the same world. A seed is a readable string
// ("kepra-417"); it is hashed to 32 bits and fed to mulberry32, a small, fast PRNG that is
// plenty for picking props (not for anything secure).

export function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function createRng(seed) {
  let state = typeof seed === 'number' ? seed >>> 0 : hashSeed(String(seed));
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  // Warm up: the first outputs of closely related seeds are correlated.
  for (let i = 0; i < 4; i++) next();
  const rng = {
    next,
    // A float in [min, max), rounded to `step` when given.
    range: (min, max, step) => {
      const value = min + next() * (max - min);
      return step ? Number((Math.round(value / step) * step).toFixed(4)) : value;
    },
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    chance: p => next() < p,
    pick: list => list[Math.floor(next() * list.length)],
    // Pick by weight: [[item, weight], …].
    weighted: entries => {
      let roll = next() * entries.reduce((sum, [, w]) => sum + w, 0);
      for (const [item, w] of entries) if ((roll -= w) < 0) return item;
      return entries[entries.length - 1][0];
    },
    shuffle: list => {
      const out = [...list];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
      }
      return out;
    },
    // A child generator, so adding a new slot later doesn't reshuffle the others.
    fork: label => createRng(`${state}:${label}`)
  };
  return rng;
}

const CONSONANTS = ['k', 'v', 'z', 'th', 'r', 'l', 'm', 'n', 's', 't', 'dr', 'qu', 'x', 'sh', 'p', 'b', 'g'];
const VOWELS = ['a', 'e', 'i', 'o', 'u', 'ae', 'io', 'y', 'ia', 'ou'];

// A pronounceable made-up word: two or three consonant–vowel syllables.
export function makeWord(rng, syllables = rng.int(2, 3)) {
  let word = '';
  for (let i = 0; i < syllables; i++) word += rng.pick(CONSONANTS) + rng.pick(VOWELS);
  if (rng.chance(0.4)) word += rng.pick(['n', 'r', 's', 'x', 'th', 'l']);
  return word.charAt(0).toUpperCase() + word.slice(1);
}

// A fresh, shareable seed like "kepra-417", from real randomness.
export function newSeed() {
  const rng = createRng(Math.floor(Math.random() * 4294967296));
  return `${makeWord(rng, 2).toLowerCase()}-${rng.int(100, 999)}`;
}
