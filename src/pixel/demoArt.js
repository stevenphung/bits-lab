// Generated demo art for the Pixel & Game UI previews: a sprite sheet and tileable parallax
// layers, all built from the pixel kit in ./art (no image files).
import { PALETTE, spriteGrid } from './art';

const SIZE = 16;
const FRAMES = 8;

// Nearest-neighbor resample of a 16×16 sprite with scale and offset, so frames stay crisp.
function transformGrid(grid, { scaleX = 1, scaleY = 1, dy = 0 }) {
  return Array.from({ length: SIZE }, (_, y) =>
    Array.from({ length: SIZE }, (_, x) => {
      if (Math.abs(scaleX) < 0.06) return null;
      const sx = Math.floor((x + 0.5 - SIZE / 2) / scaleX + SIZE / 2);
      const sy = Math.floor((y + 0.5 - SIZE / 2 - dy) / scaleY + SIZE / 2);
      return grid[sy]?.[sx] ?? null;
    })
  );
}

// Each row is one animation: [sprite, frame → transform].
export const SHEET_ANIMATIONS = {
  coin: { row: 0, frames: FRAMES, fps: 12, sprite: 'coin', at: f => ({ scaleX: Math.cos((f / FRAMES) * Math.PI * 2) }) },
  heart: { row: 1, frames: 6, fps: 8, sprite: 'heart', at: f => ({ scaleX: [1, 0.92, 0.84, 0.92, 1, 1][f], scaleY: [1, 0.92, 0.84, 0.92, 1, 1][f] }) },
  gem: { row: 2, frames: 8, fps: 8, sprite: 'gem', at: f => ({ dy: Math.round(Math.sin((f / 8) * Math.PI * 2) * 2) }) },
  orb: { row: 3, frames: 6, fps: 10, sprite: 'orb', at: f => ({ scaleX: [1, 1.12, 1.2, 1.12, 1, 0.92][f], scaleY: [1, 0.9, 0.82, 0.9, 1, 1.08][f], dy: [0, 1, 2, 1, 0, -1][f] }) },
  chest: { row: 4, frames: 4, fps: 6, sprite: 'chest', at: f => ({ dy: [0, -1, 0, 1][f] }) }
};

let sheetUrl = null;

export function demoSpriteSheet() {
  if (sheetUrl) return sheetUrl;
  const rows = Object.values(SHEET_ANIMATIONS);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE * FRAMES;
  canvas.height = SIZE * rows.length;
  const ctx = canvas.getContext('2d');
  rows.forEach(animation => {
    const base = spriteGrid(animation.sprite);
    for (let f = 0; f < animation.frames; f++) {
      transformGrid(base, animation.at(f)).forEach((row, y) =>
        row.forEach((color, x) => {
          if (!color) return;
          ctx.fillStyle = color;
          ctx.fillRect(f * SIZE + x, animation.row * SIZE + y, 1, 1);
        })
      );
    }
  });
  sheetUrl = canvas.toDataURL('image/png');
  return sheetUrl;
}

// Tileable layers: every shape uses periods that divide the layer width, so edges meet.
function layer(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  return canvas.toDataURL('image/png');
}

const wave = (x, width, parts) => parts.reduce((sum, [amp, freq, phase]) => sum + amp * Math.sin(((x / width) * Math.PI * 2 * freq) + phase), 0);

let layersCache = null;

export function demoParallaxLayers() {
  if (layersCache) return layersCache;
  const W = 320;
  layersCache = [
    {
      depth: 0.05,
      height: '100%',
      src: layer(W, 120, ctx => {
        ctx.fillStyle = PALETTE.paper;
        [[30, 18, 26], [130, 30, 34], [230, 12, 22], [280, 40, 18]].forEach(([x, y, len]) => {
          ctx.fillRect(x, y, len, 4);
          ctx.fillRect(x + 4, y - 3, len - 10, 3);
        });
      })
    },
    {
      depth: 0.15,
      height: '62%',
      src: layer(W, 80, (ctx, w, h) => {
        for (let x = 0; x < w; x++) {
          const top = Math.round(h * 0.25 + wave(x, w, [[14, 2, 0.4], [6, 5, 1.2]]));
          ctx.fillStyle = PALETTE.slate;
          ctx.fillRect(x, top, 1, h - top);
          if (top < h * 0.22) {
            ctx.fillStyle = PALETTE.paper;
            ctx.fillRect(x, top, 1, 3);
          }
        }
      })
    },
    {
      depth: 0.35,
      height: '46%',
      src: layer(W, 60, (ctx, w, h) => {
        for (let x = 0; x < w; x++) {
          const top = Math.round(h * 0.35 + wave(x, w, [[8, 3, 2], [4, 7, 0.3]]));
          ctx.fillStyle = PALETTE.teal;
          ctx.fillRect(x, top, 1, h - top);
        }
      })
    },
    {
      depth: 0.6,
      height: '34%',
      src: layer(W, 44, (ctx, w, h) => {
        for (let i = 0; i < 8; i++) {
          const x = Math.round((i / 8) * w + 10);
          ctx.fillStyle = '#6b4423';
          ctx.fillRect(x + 4, h - 16, 3, 16);
          ctx.fillStyle = i % 2 ? PALETTE.green : '#2e8b46';
          ctx.fillRect(x, h - 26, 11, 10);
          ctx.fillRect(x + 2, h - 30, 7, 4);
        }
      })
    },
    {
      depth: 1,
      height: '16%',
      src: layer(W, 20, (ctx, w, h) => {
        ctx.fillStyle = '#8a5a2b';
        ctx.fillRect(0, 4, w, h - 4);
        ctx.fillStyle = PALETTE.green;
        ctx.fillRect(0, 2, w, 4);
        ctx.fillStyle = PALETTE.lime;
        for (let x = 0; x < w; x += 7) ctx.fillRect(x, 1, 2, 2);
        ctx.fillStyle = PALETTE.yellow;
        for (let x = 3; x < w; x += 23) ctx.fillRect(x, 0, 2, 2);
      })
    }
  ];
  return layersCache;
}
