// Writes the pixel-art kit to public/pixel/: one 768×512 PNG postcard per biome, a 128px PNG
// per sprite, and the favicon. Runs on dev start and build (see vite.config.js).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng({ width, height, data }) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    Buffer.from(data.buffer, y * width * 4, width * 4).copy(raw, y * (width * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

export async function generatePixelAssets() {
  // Cache-bust so edits to art.js are picked up while the dev server runs.
  const art = await import(`${pathToFileURL(path.join(root, 'src/pixel/art.js')).href}?t=${Date.now()}`);
  const outDir = path.join(root, 'public/pixel');
  fs.mkdirSync(outDir, { recursive: true });

  for (const biome of art.BIOMES) {
    fs.writeFileSync(path.join(outDir, `biome-${biome.id}.png`), encodePng(art.gridToRgba(art.sceneGrid(biome.id, 96, 64), 8)));
  }
  for (const name of art.SPRITE_NAMES) {
    fs.writeFileSync(path.join(outDir, `sprite-${name}.png`), encodePng(art.gridToRgba(art.spriteGrid(name), 8)));
  }
  fs.writeFileSync(path.join(root, 'public/favicon.svg'), art.spriteSvg('gem', 64));
  return art.BIOMES.length + art.SPRITE_NAMES.length;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const count = await generatePixelAssets();
  console.log(`pixel: wrote ${count} images to public/pixel`);
}
