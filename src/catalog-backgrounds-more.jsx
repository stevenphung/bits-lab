import InteractiveGrid from './bits/InteractiveGrid';
import MeteorShower from './bits/MeteorShower';
import WebcamPixels from './bits/WebcamPixels';
import interactiveGridSource from './bits/InteractiveGrid.jsx?raw';
import meteorShowerSource from './bits/MeteorShower.jsx?raw';
import webcamPixelsSource from './bits/WebcamPixels.jsx?raw';

const slider = (name, label, min, max, step) => ({ name, type: 'slider', label, min, max, step });
const color = (name, label) => ({ name, type: 'color', label });
const toggle = (name, label) => ({ name, type: 'switch', label });
const select = (name, label, options) => ({ name, type: 'select', label, options });

const PIXEL_FONT = '"Pixelify Sans", system-ui, sans-serif';
const TITLE_FONT = '"Press Start 2P", monospace';
const overlay = { position: 'absolute', inset: 0, display: 'grid', placeContent: 'center', justifyItems: 'center', gap: 12, padding: 16, textAlign: 'center', pointerEvents: 'none' };

// The 16-colour palette the whole lab is drawn in, and a four-shade handheld green.
const PALETTES = {
  none: undefined,
  lab16: ['#1a1c2c', '#5d275d', '#b13e53', '#ef7d57', '#ffcd75', '#a7f070', '#38b764', '#257179', '#29366f', '#3b5dc9', '#41a6f6', '#73eff7', '#f4f4f4', '#94b0c2', '#566c86', '#333c57'],
  handheld: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f']
};

// ---------- Entries ----------

export const BACKGROUNDS_MORE_DEMOS = {
  'interactive-grid': {
    source: interactiveGridSource,
    defaults: { cellSize: 28, gap: 2, trail: 700, brush: 0, ripple: true, autopilot: true, cellColor: '#1f2236', backgroundColor: '#14151f' },
    controls: [slider('cellSize', 'Cell size', 10, 60, 1), slider('gap', 'Gap', 0, 8, 1), slider('trail', 'Trail (ms)', 100, 3000, 50), slider('brush', 'Brush radius (cells)', 0, 4, 1), toggle('ripple', 'Ripple on click'), toggle('autopilot', 'Autopilot when idle'), color('cellColor', 'Cells'), color('backgroundColor', 'Lines')],
    docs: [
      ['cellSize / gap', 'number', '28 / 2', 'Cell pitch and the gap (grid line) between cells, in px.'],
      ['colors', 'string[]', 'cyan → blue → indigo → navy', 'The ramp a lit cell cools through as it fades.'],
      ['cellColor / backgroundColor', 'string', 'dark slate', 'Resting cell and grid-line colours.'],
      ['trail / brush', 'number', '700 / 0', 'Fade time in ms, and how many cells around the pointer light up.'],
      ['ripple / rippleSpeed', 'boolean / number', 'true / 24', 'A click sends a ring across the grid (cells per second).'],
      ['autopilot', 'boolean', 'true', 'A wandering trail while nobody is pointing.'],
      ['Layout', '-', '-', 'Fills its parent; listens on the window so overlaid content doesn’t block it. Decorative; reduced motion lights cells without trails.']
    ],
    usage: `import InteractiveGrid from "./InteractiveGrid";

<div style={{ position: "relative", height: 400 }}>
  <InteractiveGrid />
</div>`,
    fullBleed: true,
    render: props => (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <InteractiveGrid {...props} />
        <div style={overlay}>
          <span style={{ font: `clamp(14px, 3vw, 26px) ${TITLE_FONT}`, color: '#f4f4f4', textShadow: '3px 3px 0 #3b5dc9' }}>MOVE TO PAINT</span>
          <span style={{ font: `16px ${PIXEL_FONT}`, color: 'var(--demo-muted, #94b0c2)' }}>Click for a ripple</span>
        </div>
      </div>
    )
  },

  'meteor-shower': {
    source: meteorShowerSource,
    defaults: { rate: 2.5, angle: 135, minSpeed: 500, maxSpeed: 1000, tail: 180, thickness: 2, pixelSize: 4, stars: 90, headColor: '#f4f4f4', tailColor: '#73eff7' },
    controls: [slider('rate', 'Meteors per second', 0.2, 12, 0.1), slider('angle', 'Heading (°)', 0, 360, 5), slider('maxSpeed', 'Top speed (px/s)', 200, 2400, 50), slider('tail', 'Tail length', 40, 400, 10), slider('thickness', 'Thickness', 1, 6, 0.5), slider('pixelSize', 'Pixel size (0 = smooth)', 0, 10, 1), slider('stars', 'Stars', 0, 300, 10), color('headColor', 'Head'), color('tailColor', 'Tail')],
    docs: [
      ['rate', 'number', '2.5', 'Average meteors per second.'],
      ['angle', 'number (deg)', '135', 'Shared heading: 0 is right, 90 is down, 135 is down-left.'],
      ['minSpeed / maxSpeed', 'number (px/s)', '500 / 1000', 'Each meteor picks a speed in this range.'],
      ['tail / thickness', 'number', '180 / 2', 'Tail length (varies ±40%) and stroke width.'],
      ['pixelSize', 'number', '4', 'Snap to blocks of this size; 0 draws smooth streaks with a glow.'],
      ['stars / starColor', 'number / string', '90 / grey-blue', 'Twinkling background stars.'],
      ['headColor / tailColor / backgroundColor', 'string', 'white / cyan / transparent', 'Colours.'],
      ['Layout', '-', '-', 'Fills its parent; decorative. Pauses off-screen; reduced motion freezes a few meteors mid-flight.']
    ],
    usage: `import MeteorShower from "./MeteorShower";

<div style={{ position: "relative", height: 400, background: "#14151f" }}>
  <MeteorShower />
</div>`,
    fullBleed: true,
    render: props => (
      <div style={{ position: 'relative', width: '100%', height: '100%', background: 'linear-gradient(#0b0b14, #1a1c2c 70%, #29366f)' }}>
        <MeteorShower {...props} />
        <div style={overlay}>
          <span style={{ font: `clamp(14px, 3vw, 26px) ${TITLE_FONT}`, color: '#f4f4f4', textShadow: '3px 3px 0 #5d275d' }}>MAKE A WISH</span>
        </div>
      </div>
    )
  },

  'webcam-pixels': {
    source: webcamPixelsSource,
    defaults: { source: 'camera', mode: 'pixels', cellSize: 10, palette: 'lab16', contrast: 1.1, fps: 24, monochrome: false, inkColor: '#73eff7' },
    controls: [select('source', 'Source', ['camera', 'sample image']), select('mode', 'Style', ['pixels', 'ascii', 'dots']), slider('cellSize', 'Cell size', 4, 32, 1), select('palette', 'Palette', ['none', 'lab16', 'handheld']), slider('contrast', 'Contrast', 0.5, 2, 0.05), slider('fps', 'Frames per second', 4, 60, 1), toggle('monochrome', 'Single ink colour'), color('inkColor', 'Ink')],
    docs: [
      ['src', 'string', '-', 'Render this image or video URL instead of the camera (no permission needed).'],
      ['mode', '"pixels" | "ascii" | "dots"', '"pixels"', 'Square cells, characters by brightness, or halftone dots.'],
      ['cellSize / contrast / fps', 'number', '10 / 1.1 / 24', 'Grid pitch, contrast boost and redraw rate.'],
      ['palette / monochrome / inkColor', 'string[] / boolean / string', '- / false / cyan', 'Snap colours to a palette, or draw everything in one ink.'],
      ['mirror', 'boolean', 'true for the camera', 'Flip horizontally, like a mirror.'],
      ['autoStart', 'boolean', 'false', 'Ask for the camera on mount instead of waiting for a click (avoid: prompts without context).'],
      ['title / description / label', 'string', '-', 'Start-screen copy, and the canvas’s accessible name (defaults to e.g. “Live camera rendered as pixel art”).'],
      ['onStatusChange', '(status) => void', '-', '"idle" | "requesting" | "live" | "denied" | "missing" | "busy" | "unsupported" | "error".'],
      ['Privacy', '-', '-', 'Asks only after a click, shows LIVE while on, Stop turns it off, and it turns off on unmount. Frames never leave the page.']
    ],
    usage: `import WebcamPixels from "./WebcamPixels";

<div style={{ height: 420 }}>
  <WebcamPixels mode="ascii" />
</div>`,
    fullBleed: true,
    render: ({ source, palette, ...props }) => <WebcamPixels {...props} src={source === 'sample image' ? '/pixel/biome-cherry.png' : undefined} palette={PALETTES[palette]} radius={0} fontFamily={PIXEL_FONT} />
  }
};
