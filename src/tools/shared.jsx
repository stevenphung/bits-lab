import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from '../ui/icons';

// ---------- Downloads ----------

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const downloadText = (text, filename, type = 'text/plain') => downloadBlob(new Blob([text], { type }), filename);

export const canvasToBlob = (canvas, type = 'image/png', quality) =>
  new Promise((resolve, reject) =>
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('Canvas export failed'))), type, quality)
  );

// Records a canvas for `seconds` and resolves with a WebM blob.
export function recordCanvas(canvas, seconds, fps = 60) {
  const stream = canvas.captureStream(fps);
  const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(type =>
    MediaRecorder.isTypeSupported(type)
  );
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 12_000_000 });
  const chunks = [];
  recorder.ondataavailable = event => event.data.size && chunks.push(event.data);
  return new Promise(resolve => {
    recorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };
    recorder.start();
    setTimeout(() => recorder.stop(), seconds * 1000);
  });
}

export const slugify = text =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// ---------- Hooks ----------

// State mirrored into the URL hash as base64 JSON, so a tuned tool is a shareable link.
function readHash() {
  try {
    const raw = window.location.hash.slice(1);
    return raw ? JSON.parse(decodeURIComponent(escape(atob(raw)))) : null;
  } catch {
    return null;
  }
}

export function useHashState(initial) {
  const [state, setState] = useState(() => ({ ...initial, ...readHash() }));

  useEffect(() => {
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    window.history.replaceState(null, '', `${window.location.pathname}#${encoded}`);
  }, [state]);

  return [state, setState];
}

// Runs an async export and exposes its state for the button label.
export function useTask() {
  const [state, setState] = useState({ busy: false, label: null });
  const run = useCallback(async (label, task) => {
    setState({ busy: true, label });
    try {
      await task();
    } finally {
      setState({ busy: false, label: null });
    }
  }, []);
  return [state, run];
}

export function useAnimationFrame(callback, active = true) {
  const saved = useRef(callback);
  saved.current = callback;

  useEffect(() => {
    if (!active) return undefined;
    let frame = 0;
    const start = performance.now();
    const tick = now => {
      saved.current((now - start) / 1000);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);
}

// Loads a user file (or a URL) into an <img> or <video> element.
export function loadMedia(source) {
  const isFile = source instanceof File;
  const url = isFile ? URL.createObjectURL(source) : source;
  const isVideo = isFile ? source.type.startsWith('video/') : /\.(mp4|webm|mov)$/i.test(url);

  return new Promise((resolve, reject) => {
    if (isVideo) {
      const video = document.createElement('video');
      video.src = url;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.onloadeddata = () => {
        video.play().catch(() => {});
        resolve({ element: video, kind: 'video', width: video.videoWidth, height: video.videoHeight, url });
      };
      video.onerror = () => reject(new Error('Could not load that video'));
    } else {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve({ element: image, kind: 'image', width: image.naturalWidth, height: image.naturalHeight, url });
      image.onerror = () => reject(new Error('Could not load that image'));
      image.src = url;
    }
  });
}

// ---------- Layout ----------

export function ToolPage({ title, subtitle, stage, panel, children, stageClassName = '' }) {
  return (
    <article className="listing tool-page">
      <div className="listing-head">
        <div>
          <h1>{title}</h1>
          <p className="row-sub">{subtitle}</p>
        </div>
      </div>
      {/* Grid areas: stage and extras on the left with the card beside both on desktop;
          stage → card → extras when stacked, so controls follow the preview on phones. */}
      <div className="tool-body">
        <div className={`tool-stage ${stageClassName}`}>{stage}</div>
        <aside className="booking">
          <div className="booking-card tool-card">{panel}</div>
        </aside>
        {children && <div className="tool-extra">{children}</div>}
      </div>
    </article>
  );
}

export function PanelSection({ title, aside, children }) {
  return (
    <section className="panel-section">
      <div className="panel-section-head">
        <h3>{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Cta({ children, busy, ...props }) {
  return (
    <button type="button" className="cta" disabled={busy} {...props}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, icon, ...props }) {
  return (
    <button type="button" className="secondary-button" {...props}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  );
}

export function ChipRow({ options, value, onChange, label }) {
  return (
    <div className="chips" role="radiogroup" aria-label={label}>
      {options.map(option => {
        const [key, text] = Array.isArray(option) ? option : [option, option];
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            className={`chip ${value === key ? 'active' : ''}`}
            onClick={() => onChange(key)}
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}

// A drop zone that also accepts paste (⌘V) and a file picker.
export function FileDrop({ accept, onFile, label = 'Drop a file, paste, or browse', children }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);

  useEffect(() => {
    const onPaste = event => {
      const file = [...(event.clipboardData?.files ?? [])][0];
      if (file) onFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [onFile]);

  return (
    <div
      className={`file-drop ${over ? 'over' : ''}`}
      onDragOver={event => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={event => {
        event.preventDefault();
        setOver(false);
        const file = event.dataTransfer.files[0];
        if (file) onFile(file);
      }}
    >
      <span>{label}</span>
      <div className="file-drop-actions">
        <button type="button" className="secondary-button" onClick={() => inputRef.current?.click()}>
          Browse
        </button>
        {children}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={event => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = '';
        }}
      />
    </div>
  );
}
