// Rasterizes Natural Earth land polygons (public domain) into a 180×90 bitmap (2° cells,
// row 0 = 90°N, column 0 = 180°W) and prints it as base64, for embedding in DotGlobe and DotMap.
//
//   curl -sLo land.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson
//   node scripts/build-land-mask.mjs land.geojson [--preview]
import fs from 'node:fs';

const WIDTH = 180;
const HEIGHT = 90;
const [file, flag] = process.argv.slice(2);
const geojson = JSON.parse(fs.readFileSync(file, 'utf8'));

const polygons = geojson.features.flatMap(feature =>
  feature.geometry.type === 'Polygon' ? [feature.geometry.coordinates] : feature.geometry.coordinates
);

function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const isLand = (lon, lat) => polygons.some(([outer, ...holes]) => inRing(lon, lat, outer) && !holes.some(hole => inRing(lon, lat, hole)));

const bits = new Uint8Array(Math.ceil((WIDTH * HEIGHT) / 8));
let land = 0;
for (let y = 0; y < HEIGHT; y++) {
  for (let x = 0; x < WIDTH; x++) {
    const lon = -180 + (x + 0.5) * (360 / WIDTH);
    const lat = 90 - (y + 0.5) * (180 / HEIGHT);
    if (isLand(lon, lat)) {
      const i = y * WIDTH + x;
      bits[i >> 3] |= 1 << (7 - (i & 7));
      land++;
    }
  }
}

if (flag === '--preview') {
  for (let y = 0; y < HEIGHT; y += 2) {
    let row = '';
    for (let x = 0; x < WIDTH; x += 2) {
      const i = y * WIDTH + x;
      row += bits[i >> 3] & (1 << (7 - (i & 7))) ? '#' : '.';
    }
    console.log(row);
  }
}
console.error(`land cells: ${land}/${WIDTH * HEIGHT}`);
console.log(Buffer.from(bits).toString('base64'));
