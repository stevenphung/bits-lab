// Bits Lab demo-asset swap: stock-photo requests made by component previews (picsum,
// unsplash, pexels, twimg) are answered with the local pixel-art biome postcards instead.
// Every other request passes through untouched.

const STOCK_HOSTS = ['picsum.photos', 'fastly.picsum.photos', 'images.unsplash.com', 'plus.unsplash.com', 'images.pexels.com', 'pbs.twimg.com'];
const BIOMES = ['plains', 'forest', 'desert', 'snowy', 'ocean', 'jungle', 'mesa', 'night', 'underworld', 'void', 'cave', 'cherry'];

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (!STOCK_HOSTS.includes(url.hostname)) return;
  // The same stock URL always maps to the same biome, so galleries stay stable.
  const biome = BIOMES[hash(url.pathname + url.search) % BIOMES.length];
  event.respondWith(fetch(`/pixel/biome-${biome}.png`));
});
