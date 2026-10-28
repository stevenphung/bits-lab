import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type DragEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// File drop zone. The card leans toward the cursor while files are dragged over it, validates
// type, size and count, shows thumbnails for images, and tracks per-file progress through your
// own `upload(file, { onProgress, signal })` function (removing a file aborts its upload).
// Clicking or pressing Enter/Space opens the file picker; results are announced politely.

const STYLE_ID = 'bl-dropzone';
const CSS = `
.bl-drop { display: grid; gap: 14px; width: 100%; max-width: var(--bl-w); font-family: var(--bl-font); color: var(--bl-ink); }
.bl-drop__zone { position: relative; display: block; width: 100%; padding: 0; border: 0; background: none; color: inherit; font: inherit; text-align: center; cursor: pointer; perspective: 800px; }
.bl-drop__zone:focus-visible { outline: none; }
.bl-drop__zone:focus-visible .bl-drop__card { border-color: var(--bl-accent); box-shadow: 0 0 0 4px var(--bl-ring); }
.bl-drop__card { display: grid; justify-items: center; gap: 10px; padding: 34px 20px; border-radius: var(--bl-radius); background: var(--bl-bg); border: 1.5px dashed var(--bl-line); transform: translate(var(--bl-mx, 0px), var(--bl-my, 0px)) rotateX(var(--bl-rx, 0deg)) rotateY(var(--bl-ry, 0deg)); transition: transform 220ms cubic-bezier(.2,.9,.25,1), box-shadow 200ms, border-color 200ms, background-color 200ms; }
.bl-drop[data-dragging] .bl-drop__card { background: var(--bl-over); border-color: var(--bl-accent); border-style: solid; box-shadow: 0 18px 40px -18px var(--bl-accent); transition-duration: 120ms; }
.bl-drop__icon { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 50%; background: var(--bl-chip); color: var(--bl-accent); transition: transform 300ms cubic-bezier(.2,.9,.25,1.4); }
.bl-drop[data-dragging] .bl-drop__icon { transform: translateY(-6px) scale(1.12); }
.bl-drop__title { margin: 0; font-weight: 700; font-size: 16px; }
.bl-drop__hint { margin: 0; color: var(--bl-muted); font-size: 13px; }
.bl-drop__list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.bl-drop__file { display: grid; grid-template-columns: 44px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 10px 12px; border-radius: calc(var(--bl-radius) * 0.7); background: var(--bl-bg); box-shadow: inset 0 0 0 1px var(--bl-line); animation: bl-drop-in 260ms cubic-bezier(.2,.9,.25,1); }
.bl-drop__thumb { display: grid; place-items: center; width: 44px; height: 44px; overflow: hidden; border-radius: 8px; background: var(--bl-chip); color: var(--bl-accent); font-size: 10px; font-weight: 800; text-transform: uppercase; }
.bl-drop__thumb img { width: 100%; height: 100%; object-fit: cover; }
.bl-drop__name { overflow: hidden; font-size: 14px; font-weight: 600; white-space: nowrap; text-overflow: ellipsis; }
.bl-drop__meta { margin-top: 2px; color: var(--bl-muted); font-size: 12px; }
.bl-drop__file[data-status="error"] .bl-drop__meta { color: var(--bl-error); }
.bl-drop__file[data-status="done"] .bl-drop__meta { color: var(--bl-success); }
.bl-drop__bar { height: 4px; margin-top: 6px; border-radius: 2px; background: var(--bl-chip); overflow: hidden; }
.bl-drop__fill { height: 100%; border-radius: 2px; background: var(--bl-accent); transform-origin: left; transition: transform 200ms linear, background-color 200ms; }
.bl-drop__file[data-status="done"] .bl-drop__fill { background: var(--bl-success); }
.bl-drop__file[data-status="error"] .bl-drop__fill { background: var(--bl-error); }
.bl-drop__remove { display: grid; place-items: center; width: 30px; height: 30px; border: 0; border-radius: 50%; background: transparent; color: var(--bl-muted); cursor: pointer; }
.bl-drop__remove:hover { background: var(--bl-chip); color: var(--bl-ink); }
.bl-drop__remove:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 1px; }
.bl-drop__rejects { margin: 0; padding: 10px 12px; border-radius: 10px; background: color-mix(in srgb, var(--bl-error) 14%, transparent); color: var(--bl-error); font-size: 13px; list-style: none; }
.bl-drop__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-drop-in { from { opacity: 0; transform: translateY(-6px); } }
@media (prefers-reduced-motion: reduce) { .bl-drop__card, .bl-drop__icon, .bl-drop__fill { transition: none; transform: none !important; } .bl-drop__file { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface DropFile {
  id: number;
  file: File;
  name: string;
  size: number;
  type: string;
  /** Object URL for image thumbnails (revoked on remove and unmount). */
  preview: string | null;
  /** 0–1. */
  progress: number;
  status: 'uploading' | 'done' | 'error';
  error: string | null;
}

export interface DropRejection {
  file: File;
  reason: string;
}

export type UploadFn = (file: File, context: { onProgress: (fraction: number) => void; signal: AbortSignal }) => unknown;

export interface DropZoneProps {
  /** Same syntax as <input accept>: MIME types, wildcards like image/*, or .extensions. */
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  /** Max size per file, in bytes. */
  maxSize?: number;
  /** Your uploader: call onProgress(0–1); removing the file aborts via signal. Without it, files are just collected. */
  upload?: UploadFn;
  onFilesChange?: (files: DropFile[]) => void;
  onReject?: (rejections: DropRejection[]) => void;
  title?: ReactNode;
  /** Defaults to a summary of the rules. */
  hint?: ReactNode;
  disabled?: boolean;
  /** Lean toward the cursor while files are dragged over. */
  magnetic?: boolean;
  width?: number;
  radius?: number;
  backgroundColor?: string;
  /** Card color while files are dragged over. */
  overColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  chipColor?: string;
  accentColor?: string;
  successColor?: string;
  errorColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

// Same rules as the <input accept> attribute: MIME types, wildcards like image/*, or .extensions.
function accepts(file: File, accept?: string) {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return accept
    .split(',')
    .map(rule => rule.trim().toLowerCase())
    .filter(Boolean)
    .some(rule => (rule.startsWith('.') ? name.endsWith(rule) : rule.endsWith('/*') ? type.startsWith(rule.slice(0, -1)) : type === rule));
}

const extension = (name: string) => (name.includes('.') ? name.split('.').pop()!.slice(0, 4) : 'file');
let nextId = 1;

export default function DropZone({
  accept,
  multiple = true,
  maxFiles = 10,
  maxSize,
  upload,
  onFilesChange,
  onReject,
  title = 'Drop files here',
  hint,
  disabled = false,
  magnetic = true,
  width = 520,
  radius = 16,
  backgroundColor = '#1a1c2c',
  overColor = '#202a4a',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = 'rgba(255,255,255,0.22)',
  chipColor = 'rgba(255,255,255,0.07)',
  accentColor = '#73eff7',
  successColor = '#38b764',
  errorColor = '#ef7d57',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: DropZoneProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLSpanElement>(null);
  const depth = useRef(0);
  const controllers = useRef(new Map<number, AbortController>());
  const [files, setFiles] = useState<DropFile[]>([]);
  const [rejected, setRejected] = useState<DropRejection[]>([]);
  const [dragging, setDragging] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const filesRef = useRef(files);
  filesRef.current = files;

  const patch = (id: number, change: Partial<DropFile>) => setFiles(prev => prev.map(f => (f.id === id ? { ...f, ...change } : f)));

  useEffect(() => {
    onFilesChange?.(files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  // Free object URLs and stop uploads when the component goes away.
  useEffect(
    () => () => {
      filesRef.current.forEach(f => f.preview && URL.revokeObjectURL(f.preview));
      controllers.current.forEach(controller => controller.abort());
    },
    []
  );

  const start = (entry: DropFile) => {
    if (!upload) {
      patch(entry.id, { status: 'done', progress: 1 });
      return;
    }
    const controller = new AbortController();
    controllers.current.set(entry.id, controller);
    const onProgress = (fraction: number) => patch(entry.id, { progress: Math.max(0, Math.min(1, fraction)) });
    Promise.resolve()
      .then(() => upload(entry.file, { onProgress, signal: controller.signal }))
      .then(
        () => {
          if (controller.signal.aborted) return;
          patch(entry.id, { status: 'done', progress: 1 });
          setAnnouncement(`${entry.name} uploaded.`);
        },
        error => {
          if (controller.signal.aborted) return;
          patch(entry.id, { status: 'error', error: (error as Error | undefined)?.message ?? 'Upload failed' });
          setAnnouncement(`${entry.name} failed to upload.`);
        }
      )
      .finally(() => controllers.current.delete(entry.id));
  };

  const addFiles = (list: FileList | null) => {
    const incoming = Array.from(list ?? []);
    const room = Math.max(0, (multiple ? maxFiles : 1) - filesRef.current.length);
    const accepted: File[] = [];
    const rejects: DropRejection[] = [];
    for (const file of incoming) {
      if (!accepts(file, accept)) rejects.push({ file, reason: 'File type not allowed' });
      else if (maxSize && file.size > maxSize) rejects.push({ file, reason: `Larger than ${formatBytes(maxSize)}` });
      else if (accepted.length >= room) rejects.push({ file, reason: multiple ? `Limit of ${maxFiles} files` : 'Only one file allowed' });
      else accepted.push(file);
    }
    const entries = accepted.map((file): DropFile => ({
      id: nextId++,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      progress: 0,
      status: upload ? 'uploading' : 'done',
      error: null
    }));
    setRejected(rejects);
    if (rejects.length) onReject?.(rejects);
    if (entries.length) {
      setFiles(prev => [...prev, ...entries]);
      entries.forEach(start);
    }
    setAnnouncement(
      [entries.length ? `${entries.length} file${entries.length === 1 ? '' : 's'} added.` : '', rejects.length ? `${rejects.length} rejected.` : ''].filter(Boolean).join(' ')
    );
  };

  const remove = (id: number) => {
    const entry = filesRef.current.find(f => f.id === id);
    controllers.current.get(id)?.abort();
    controllers.current.delete(id);
    if (entry?.preview) URL.revokeObjectURL(entry.preview);
    setFiles(prev => prev.filter(f => f.id !== id));
    if (entry) setAnnouncement(`${entry.name} removed.`);
  };

  const lean = (event: DragEvent<HTMLButtonElement>) => {
    const card = cardRef.current;
    if (!magnetic || !card || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty('--bl-mx', `${x * 14}px`);
    card.style.setProperty('--bl-my', `${y * 10}px`);
    card.style.setProperty('--bl-rx', `${-y * 6}deg`);
    card.style.setProperty('--bl-ry', `${x * 8}deg`);
  };
  const settle = () => {
    for (const name of ['--bl-mx', '--bl-my', '--bl-rx', '--bl-ry']) cardRef.current?.style.removeProperty(name);
  };

  const hasFiles = (event: DragEvent<HTMLButtonElement>) => Array.from(event.dataTransfer?.types ?? []).includes('Files');

  return (
    <div
      className={`bl-drop ${className}`}
      data-dragging={dragging || undefined}
      style={{
        '--bl-w': `${width}px`,
        '--bl-radius': `${radius}px`,
        '--bl-bg': backgroundColor,
        '--bl-over': overColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-line': lineColor,
        '--bl-chip': chipColor,
        '--bl-accent': accentColor,
        '--bl-ring': `color-mix(in srgb, ${accentColor} 22%, transparent)`,
        '--bl-success': successColor,
        '--bl-error': errorColor,
        '--bl-font': fontFamily,
        ...style
      } as CSSVars}
    >
      <button
        type="button"
        className="bl-drop__zone"
        disabled={disabled}
        aria-describedby={`${uid}-hint`}
        onClick={() => inputRef.current?.click()}
        onDragEnter={event => {
          if (!hasFiles(event) || disabled) return;
          event.preventDefault();
          depth.current += 1;
          setDragging(true);
        }}
        onDragOver={event => {
          if (!hasFiles(event) || disabled) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = 'copy';
          lean(event);
        }}
        onDragLeave={() => {
          depth.current = Math.max(0, depth.current - 1);
          if (!depth.current) {
            setDragging(false);
            settle();
          }
        }}
        onDrop={event => {
          event.preventDefault();
          depth.current = 0;
          setDragging(false);
          settle();
          if (!disabled) addFiles(event.dataTransfer.files);
        }}
      >
        <span ref={cardRef} className="bl-drop__card">
          <span className="bl-drop__icon" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
            </svg>
          </span>
          <span className="bl-drop__title">{dragging ? 'Release to add' : title}</span>
          <span id={`${uid}-hint`} className="bl-drop__hint">
            {hint ?? [`Click or press Enter to browse`, accept && `· ${accept}`, maxSize && `· up to ${formatBytes(maxSize)}`].filter(Boolean).join(' ')}
          </span>
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        hidden
        accept={accept}
        multiple={multiple}
        onChange={event => {
          addFiles(event.target.files);
          event.target.value = '';
        }}
      />
      {rejected.length > 0 && (
        <ul className="bl-drop__rejects">
          {rejected.map(({ file, reason }, i) => (
            <li key={`${file.name}-${i}`}>
              {file.name}: {reason}
            </li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <ul className="bl-drop__list" aria-label="Files">
          {files.map(entry => (
            <li key={entry.id} className="bl-drop__file" data-status={entry.status}>
              <span className="bl-drop__thumb" aria-hidden="true">
                {entry.preview ? <img src={entry.preview} alt="" /> : extension(entry.name)}
              </span>
              <span style={{ minWidth: 0 }}>
                <span className="bl-drop__name" style={{ display: 'block' }}>
                  {entry.name}
                </span>
                <span className="bl-drop__meta" style={{ display: 'block' }}>
                  {formatBytes(entry.size)} · {entry.status === 'uploading' ? `${Math.round(entry.progress * 100)}%` : entry.status === 'done' ? 'Done' : entry.error}
                </span>
                {upload && (
                  <span
                    className="bl-drop__bar"
                    style={{ display: 'block' }}
                    role="progressbar"
                    aria-label={`${entry.name} upload`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(entry.progress * 100)}
                  >
                    <span className="bl-drop__fill" style={{ display: 'block', transform: `scaleX(${entry.progress})` }} />
                  </span>
                )}
              </span>
              <button type="button" className="bl-drop__remove" aria-label={`Remove ${entry.name}`} onClick={() => remove(entry.id)}>
                <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M2 2l8 8M10 2 2 10" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      <span className="bl-drop__sr" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
