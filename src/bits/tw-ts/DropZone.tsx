import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type DragEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// File drop zone. The card leans toward the cursor while files are dragged over it, validates
// type, size and count, shows thumbnails for images, and tracks per-file progress through your
// own `upload(file, { onProgress, signal })` function (removing a file aborts its upload).
// Clicking or pressing Enter/Space opens the file picker; results are announced politely.

const STYLE_ID = 'bl-dropzone-tw';
const CSS = `
/* theme tokens */
.bl-drop { --bl-bg: #1a1c2c; --bl-over: #202a4a; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: rgba(255,255,255,0.22); --bl-chip: rgba(255,255,255,0.07); --bl-success: #38b764; --bl-error: #ef7d57; }
:where(.light, [data-theme="light"]) .bl-drop, .bl-drop:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-over: #dfe6f2; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: rgba(26,28,44,0.22); --bl-chip: rgba(26,28,44,0.07); --bl-success: #2b8a4a; --bl-error: #c4502a; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-drop, :where(.light, [data-theme="light"]) .bl-drop:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-over: #202a4a; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: rgba(255,255,255,0.22); --bl-chip: rgba(255,255,255,0.07); --bl-success: #38b764; --bl-error: #ef7d57; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-drop, .bl-drop:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-over: #dfe6f2; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: rgba(26,28,44,0.22); --bl-chip: rgba(26,28,44,0.07); --bl-success: #2b8a4a; --bl-error: #c4502a; } }
/* theme tokens end */
@keyframes bl-drop-in { from { opacity: 0; transform: translateY(-6px); } }
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
  backgroundColor,
  overColor,
  textColor,
  mutedColor,
  lineColor,
  chipColor,
  accentColor = '#73eff7',
  successColor,
  errorColor,
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
      className={`bl-drop group/drop grid w-full max-w-(--bl-w) gap-3.5 font-(family-name:--bl-font) text-(--bl-ink) ${className}`}
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
        className="group/zone relative block w-full cursor-pointer border-0 bg-none p-0 text-center text-inherit perspective-[800px] focus-visible:outline-none"
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
        <span ref={cardRef} className="grid justify-items-center gap-2.5 rounded-(--bl-radius) border-[1.5px] border-dashed border-(--bl-line) bg-(--bl-bg) px-5 py-[34px] [transform:translate(var(--bl-mx,0px),var(--bl-my,0px))_rotateX(var(--bl-rx,0deg))_rotateY(var(--bl-ry,0deg))] [transition:transform_220ms_cubic-bezier(.2,.9,.25,1),box-shadow_200ms,border-color_200ms,background-color_200ms] group-focus-visible/zone:border-(--bl-accent) group-focus-visible/zone:shadow-[0_0_0_4px_var(--bl-ring)] group-data-[dragging]/drop:border-solid group-data-[dragging]/drop:border-(--bl-accent) group-data-[dragging]/drop:bg-(--bl-over) group-data-[dragging]/drop:shadow-[0_18px_40px_-18px_var(--bl-accent)] group-data-[dragging]/drop:duration-120 motion-reduce:[transition:none] motion-reduce:[transform:none]!">
          <span className="grid size-[52px] place-items-center rounded-[50%] bg-(--bl-chip) text-(--bl-accent) [transition:transform_300ms_cubic-bezier(.2,.9,.25,1.4)] group-data-[dragging]/drop:[transform:translateY(-6px)_scale(1.12)] motion-reduce:[transition:none] motion-reduce:[transform:none]!" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
            </svg>
          </span>
          <span className="m-0 text-[16px] font-bold">{dragging ? 'Release to add' : title}</span>
          <span id={`${uid}-hint`} className="m-0 text-[13px] text-(--bl-muted)">
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
        <ul className="m-0 list-none rounded-[10px] bg-[color-mix(in_srgb,var(--bl-error)_14%,transparent)] px-3 py-2.5 text-[13px] text-(--bl-error)">
          {rejected.map(({ file, reason }, i) => (
            <li key={`${file.name}-${i}`}>
              {file.name}: {reason}
            </li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <ul className="m-0 grid list-none gap-2 p-0" aria-label="Files">
          {files.map(entry => (
            <li key={entry.id} className="group/file grid animate-[bl-drop-in_260ms_cubic-bezier(.2,.9,.25,1)] grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-[calc(var(--bl-radius)*0.7)] bg-(--bl-bg) px-3 py-2.5 shadow-[inset_0_0_0_1px_var(--bl-line)] motion-reduce:animate-none" data-status={entry.status}>
              <span className="grid size-11 place-items-center overflow-hidden rounded-[8px] bg-(--bl-chip) text-[10px] font-extrabold text-(--bl-accent) uppercase [&_img]:h-full [&_img]:w-full [&_img]:object-cover" aria-hidden="true">
                {entry.preview ? <img src={entry.preview} alt="" /> : extension(entry.name)}
              </span>
              <span style={{ minWidth: 0 }}>
                <span className="overflow-hidden text-[14px] font-semibold text-ellipsis whitespace-nowrap" style={{ display: 'block' }}>
                  {entry.name}
                </span>
                <span className="mt-0.5 text-[12px] text-(--bl-muted) group-data-[status=done]/file:text-(--bl-success) group-data-[status=error]/file:text-(--bl-error)" style={{ display: 'block' }}>
                  {formatBytes(entry.size)} · {entry.status === 'uploading' ? `${Math.round(entry.progress * 100)}%` : entry.status === 'done' ? 'Done' : entry.error}
                </span>
                {upload && (
                  <span
                    className="mt-1.5 h-1 overflow-hidden rounded-[2px] bg-(--bl-chip)"
                    style={{ display: 'block' }}
                    role="progressbar"
                    aria-label={`${entry.name} upload`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(entry.progress * 100)}
                  >
                    <span className="h-full origin-left rounded-[2px] bg-(--bl-accent) [transition:transform_200ms_linear,background-color_200ms] group-data-[status=done]/file:bg-(--bl-success) group-data-[status=error]/file:bg-(--bl-error) motion-reduce:[transition:none] motion-reduce:[transform:none]!" style={{ display: 'block', transform: `scaleX(${entry.progress})` }} />
                  </span>
                )}
              </span>
              <button type="button" className="grid size-[30px] cursor-pointer place-items-center rounded-[50%] border-0 bg-transparent text-(--bl-muted) hover:bg-(--bl-chip) hover:text-(--bl-ink) focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--bl-accent)" aria-label={`Remove ${entry.name}`} onClick={() => remove(entry.id)}>
                <svg width="12" height="12" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M2 2l8 8M10 2 2 10" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </div>
  );
}
