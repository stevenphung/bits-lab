import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { buildRegistry } from './scripts/build-registry.mjs';
import { buildDocs } from './scripts/build-docs.mjs';
import { generatePixelAssets } from './scripts/generate-pixel-assets.mjs';

const pixelAssets = () => ({
  name: 'pixel-assets',
  async buildStart() {
    await generatePixelAssets();
  },
  async handleHotUpdate({ file }) {
    if (file.endsWith('/src/pixel/art.js')) await generatePixelAssets();
  }
});

const registry = () => ({
  name: 'local-registry',
  async buildStart() {
    await buildRegistry();
    await buildDocs();
  },
  async handleHotUpdate({ file }) {
    if (file.includes('/src/bits/') || file.endsWith('/src/meta.js')) await buildRegistry();
    if (file.includes('/src/bits/') || /\/src\/(meta\.js|catalog[^/]*\.jsx)$/.test(file)) await buildDocs();
  }
});

// Tailwind's dev server only rescans sources when its stylesheet rebuilds, so a newly added
// Tailwind variant would render without its classes on /tw-check.html. Touch the stylesheet.
const twCheck = () => ({
  name: 'tw-check-rescan',
  configureServer(server) {
    server.watcher.on('add', file => {
      if (/\/src\/bits\/tw\/[^/]+\.jsx$/.test(file)) {
        const now = new Date();
        fs.utimesSync(path.resolve('src/tools/tw-check/tw.css'), now, now);
      }
    });
  }
});

export default defineConfig({
  // Tailwind only processes CSS that imports it: the Tailwind-variant check page (tw-check.html).
  plugins: [react(), tailwindcss(), twCheck(), registry(), pixelAssets()]
});
