import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { buildRegistry } from './scripts/build-registry.mjs';
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
  },
  async handleHotUpdate({ file }) {
    if (file.includes('/src/bits/') || file.endsWith('/src/meta.js')) await buildRegistry();
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
  plugins: [react(), tailwindcss(), twCheck(), registry(), pixelAssets()],
  // Scan the lazily imported React Bits components up front; otherwise Vite discovers their
  // deps (three, ogl, gsap, motion…) one page at a time and force-reloads the page each time.
  optimizeDeps: {
    entries: ['index.html', 'src/reactbits/*/*.jsx'],
    include: [
      'matter-js',
      'gsap/ScrambleTextPlugin',
      'gsap/ScrollTrigger',
      'gsap/SplitText',
      'three/examples/jsm/environments/RoomEnvironment.js',
      'three/examples/jsm/loaders/OBJLoader.js'
    ]
  }
});
