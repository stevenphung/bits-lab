import { Suspense, lazy } from 'react';
import Sprite from '../pixel/Sprite';

// The tools are local-only for now (their names match the React Bits tools, which that license
// covers), so their folders are git-ignored. A build without them simply has no Tools tab.
const TOOL_MODULES = import.meta.glob(['./background-studio/BackgroundStudio.jsx', './shape-magic/ShapeMagic.jsx', './texture-lab/TextureLab.jsx', './center-stage/CenterStage.jsx', './sound-lab/SoundLab.jsx']);

const ALL_TOOLS = [
  {
    slug: 'background-studio',
    sprite: 'grass',
    tagline: 'Paint the sky',
    name: 'Background Studio',
    blurb: 'Pick an animated shader background, start from a preset, tune it live, then export a React component, a 4K image or a video.',
    meta: '6 backgrounds · React, PNG, WebM',
    tint: '#b13e53',
    file: './background-studio/BackgroundStudio.jsx'
  },
  {
    slug: 'shape-magic',
    sprite: 'gem',
    tagline: 'Forge a logo',
    name: 'Shape Magic',
    blurb: 'Design a logo mark from parametric shapes or your own SVG, give it a material, then export SVG, PNG, a favicon pack or React.',
    meta: '8 shapes · 15 sprites · SVG, PNG, ICO',
    tint: '#ef7d57',
    file: './shape-magic/ShapeMagic.jsx'
  },
  {
    slug: 'texture-lab',
    sprite: 'potion',
    tagline: 'Brew a look',
    name: 'Texture Lab',
    blurb: 'Stack animated effects on a photo, video or your camera, then export an image, a video, a GIF or a shareable style.',
    meta: '11 effects · PNG, WebM, GIF',
    tint: '#3b5dc9',
    file: './texture-lab/TextureLab.jsx'
  },
  {
    slug: 'center-stage',
    sprite: 'frame',
    tagline: 'Frame your world',
    name: 'Center Stage',
    blurb: 'Turn screenshots and screen recordings into polished product shots for launch posts and demos.',
    meta: 'Frames, backdrops, 3D tilt · PNG, WebM',
    tint: '#5d275d',
    file: './center-stage/CenterStage.jsx'
  },
  {
    slug: 'sound-lab',
    sprite: 'note',
    tagline: 'Score the game',
    name: 'Sound Lab',
    blurb: 'Interface sounds synthesized live: tune one, then download a WAV or copy a dependency-free play function.',
    meta: '15 chiptune sounds · WAV, JS',
    tint: '#38b764',
    file: './sound-lab/SoundLab.jsx'
  }
];

export const TOOLS = ALL_TOOLS.filter(tool => TOOL_MODULES[tool.file]);

const lazyTools = new Map(TOOLS.map(tool => [tool.slug, lazy(TOOL_MODULES[tool.file])]));

export function ToolsIndex({ onOpen }) {
  return (
    <article className="listing tools-index">
      <div className="listing-head">
        <div>
          <h1>Workbench</h1>
          <p className="row-sub">Five tools for crafting motion, shapes, textures and sounds. Pick one to start. All original Bits Lab code.</p>
        </div>
      </div>
      <div className="card-grid">
        {TOOLS.map(tool => (
          <a key={tool.slug} className="tool-card-link" href={`/tools/${tool.slug}`} onClick={event => onOpen(event, `/tools/${tool.slug}`)}>
            <div className="card-photo" style={{ background: tool.tint }}>
              <span className="stage-badge">{tool.tagline}</span>
              <Sprite name={tool.sprite} size={112} className="card-photo-icon" />
            </div>
            <div className="card-text">
              <p className="card-title">{tool.name}</p>
              <p className="card-sub">{tool.blurb}</p>
              <p className="card-meta">{tool.meta}</p>
            </div>
          </a>
        ))}
      </div>
    </article>
  );
}

export function ToolRoute({ slug }) {
  const Tool = lazyTools.get(slug);
  if (!Tool) return null;
  return (
    <Suspense fallback={<p className="muted-text tool-loading">Loading chunks…</p>}>
      <Tool />
    </Suspense>
  );
}
