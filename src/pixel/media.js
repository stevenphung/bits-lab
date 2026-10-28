// Demo media that can't be a static PNG: a short pixel-world video, generated in the browser
// the first time a preview needs it, then cached.
import { gridToRgba, sceneGrid } from './art';

let videoPromise = null;

function sceneCanvas(id, width, height) {
  const { width: w, height: h, data } = gridToRgba(sceneGrid(id, width, height), 1);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').putImageData(new ImageData(data, w, h), 0, 0);
  return canvas;
}

// A 4s, 640×360 WebM that pans across a wide plains world (day) and crossfades to night.
export function pixelVideoUrl() {
  if (!videoPromise) {
    videoPromise = new Promise(resolve => {
      const day = sceneCanvas('plains', 256, 64);
      const night = sceneCanvas('night', 256, 64);
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      const seconds = 4;
      const scale = 360 / 64;
      const start = performance.now();
      const draw = () => {
        const t = Math.min(1, (performance.now() - start) / (seconds * 1000));
        const x = -t * (256 * scale - 640);
        ctx.globalAlpha = 1;
        ctx.drawImage(day, x, 0, 256 * scale, 360);
        ctx.globalAlpha = Math.max(0, (t - 0.5) * 2);
        ctx.drawImage(night, x, 0, 256 * scale, 360);
      };
      draw();
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      recorder.ondataavailable = event => event.data.size && chunks.push(event.data);
      recorder.onstop = () => resolve(URL.createObjectURL(new Blob(chunks, { type: 'video/webm' })));
      // setInterval keeps drawing even if the tab is in the background.
      const timer = setInterval(draw, 1000 / 30);
      recorder.start();
      setTimeout(() => {
        clearInterval(timer);
        recorder.stop();
      }, seconds * 1000);
    });
  }
  return videoPromise;
}
