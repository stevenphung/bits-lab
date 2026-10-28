import { useId, useInsertionEffect, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A message an agent drafted, laid out on a parchment scroll for a person to review. Pick the
// recipient, switch the tone (each tone has its own draft), edit the subject and body in place,
// drop attachments, then send or discard. Sending seals the scroll with a wax stamp; discarding
// rolls it up. All fields are labelled form controls; the outcome is announced.

const STYLE_ID = 'bl-draft-scroll-tw';
const CSS = `
@keyframes bl-draft-seal { from { opacity: 0; transform: rotate(-10deg) scale(2.4); } }
@keyframes bl-draft-roll { to { opacity: 0.6; transform: scaleY(0.85); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface DraftRecipient {
  id: string;
  name: string;
  email?: string;
}

export interface DraftAttachment {
  name: string;
  size?: string;
  id?: string;
}

export interface DraftResult {
  to: string;
  subject: string;
  body: string;
  tone: string;
  attachments: DraftAttachment[];
}

export interface DraftScrollProps {
  recipients?: DraftRecipient[];
  defaultRecipient?: string;
  subject?: string;
  /** One draft body per tone, e.g. { Friendly: "…", Formal: "…" }. */
  drafts?: Record<string, string>;
  defaultTone?: string;
  attachments?: DraftAttachment[];
  author?: ReactNode;
  onSend?: (draft: DraftResult) => void;
  onDiscard?: () => void;
  sendLabel?: string;
  discardLabel?: string;
  sentLabel?: string;
  width?: number;
  paperColor?: string;
  rollColor?: string;
  textColor?: string;
  lineColor?: string;
  accentColor?: string;
  sendColor?: string;
  waxColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function DraftScroll({
  recipients = [],
  defaultRecipient,
  subject: initialSubject = '',
  drafts = {},
  defaultTone,
  attachments: initialAttachments = [],
  author = 'Drafted by your agent',
  onSend,
  onDiscard,
  sendLabel = 'Send',
  discardLabel = 'Discard',
  sentLabel = 'SENT',
  width = 460,
  paperColor = '#f4e4c1',
  rollColor = '#c9a46a',
  textColor = '#2b2233',
  lineColor = 'rgba(43,34,51,0.35)',
  accentColor = '#3b5dc9',
  sendColor = '#3b5dc9',
  waxColor = '#b13e53',
  fontFamily = 'inherit',
  className = '',
  style
}: DraftScrollProps) {
  useStyles();
  const uid = useId();
  const tones = Object.keys(drafts);
  const [tone, setTone] = useState(defaultTone ?? tones[0]);
  const [to, setTo] = useState(defaultRecipient ?? recipients[0]?.id ?? '');
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(drafts[defaultTone ?? tones[0]] ?? '');
  const [files, setFiles] = useState(initialAttachments);
  const [status, setStatus] = useState<'draft' | 'sent' | 'discarded'>('draft');
  const [said, setSaid] = useState('');

  const pickTone = (next: string) => {
    setTone(next);
    setBody(drafts[next] ?? '');
    setSaid(`Rewritten in a ${next.toLowerCase()} tone`);
  };
  const send = () => {
    setStatus('sent');
    setSaid('Sent');
    onSend?.({ to, subject, body, tone, attachments: files });
  };
  const discard = () => {
    setStatus('discarded');
    setSaid('Draft discarded');
    onDiscard?.();
  };
  const done = status !== 'draft';

  return (
    <form
      className={`relative box-border grid w-[min(var(--bl-w),100%)] gap-3 bg-(--bl-paper) px-5 py-[22px] font-(family-name:--bl-font) text-[14px] text-(--bl-ink) shadow-[0_-8px_0_-2px_var(--bl-roll),0_8px_0_-2px_var(--bl-roll),6px_10px_0_rgba(0,0,0,0.35)] data-[status=discarded]:animate-[bl-draft-roll_320ms_steps(4)_both] motion-reduce:animate-none! [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-(--bl-accent) [&_button:focus-visible]:outline-solid ${className}`}
      data-status={status}
      aria-label="Draft for review"
      onSubmit={event => {
        event.preventDefault();
        if (!done) send();
      }}
      style={{ '--bl-w': `${width}px`, '--bl-paper': paperColor, '--bl-roll': rollColor, '--bl-ink': textColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-send': sendColor, '--bl-wax': waxColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <p className="m-0 flex items-center justify-between gap-2 text-[11px] font-extrabold tracking-[0.06em] uppercase opacity-75">
        <span>{author}</span>
        {tone && <span>{tone}</span>}
      </p>
      {recipients.length > 0 && (
        <div className="grid grid-cols-[64px_1fr] items-center gap-2.5 [&_label]:text-[12px] [&_label]:font-extrabold [&_label]:opacity-75">
          <label htmlFor={`${uid}-to`}>To</label>
          <select id={`${uid}-to`} className="box-border w-full bg-transparent px-2 py-1.5 text-inherit [border-width:0_0_2px] [border-style:none_none_dashed] [border-color:currentColor_currentColor_var(--bl-line)] focus:bg-[rgba(255,255,255,0.35)] focus:outline-none focus:[border-bottom-color:var(--bl-accent)] focus:[border-bottom-style:solid]" value={to} disabled={done} onChange={event => setTo(event.target.value)}>
            {recipients.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.email ? ` <${r.email}>` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="grid grid-cols-[64px_1fr] items-center gap-2.5 [&_label]:text-[12px] [&_label]:font-extrabold [&_label]:opacity-75">
        <label htmlFor={`${uid}-subject`}>Subject</label>
        <input id={`${uid}-subject`} className="box-border w-full bg-transparent px-2 py-1.5 text-inherit [border-width:0_0_2px] [border-style:none_none_dashed] [border-color:currentColor_currentColor_var(--bl-line)] focus:bg-[rgba(255,255,255,0.35)] focus:outline-none focus:[border-bottom-color:var(--bl-accent)] focus:[border-bottom-style:solid]" value={subject} disabled={done} onChange={event => setSubject(event.target.value)} />
      </div>
      {tones.length > 1 && (
        <div className="grid grid-cols-[64px_1fr] items-center gap-2.5 [&_label]:text-[12px] [&_label]:font-extrabold [&_label]:opacity-75">
          <span className="text-[12px] font-extrabold opacity-75">Tone</span>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Tone">
            {tones.map(t => (
              <button key={t} type="button" className="cursor-pointer border-0 bg-transparent px-2.5 py-1 text-[12px] font-bold text-inherit shadow-[inset_0_0_0_2px_var(--bl-line)] aria-pressed:bg-(--bl-ink) aria-pressed:text-(--bl-paper) aria-pressed:shadow-none" aria-pressed={t === tone} disabled={done} onClick={() => pickTone(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
      <textarea className="box-border min-h-[130px] w-full resize-y bg-transparent px-2 py-1.5 leading-[1.55] text-inherit [border:2px_dashed_var(--bl-line)] focus:bg-[rgba(255,255,255,0.35)] focus:outline-none focus:[border-color:var(--bl-accent)] focus:[border-style:solid]" aria-label="Message" value={body} disabled={done} onChange={event => setBody(event.target.value)} />
      {files.length > 0 && (
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Attachments">
          {files.map(file => (
            <li key={file.id ?? file.name} className="inline-flex items-center gap-1.5 bg-[rgba(0,0,0,0.08)] py-1 pr-1 pl-2 text-[12px] font-bold [&_button]:grid [&_button]:size-[18px] [&_button]:cursor-pointer [&_button]:place-items-center [&_button]:border-0 [&_button]:bg-transparent [&_button]:p-0 [&_button]:text-inherit">
              📎 {file.name}
              {file.size ? ` · ${file.size}` : ''}
              {!done && (
                <button type="button" aria-label={`Remove ${file.name}`} onClick={() => (setFiles(list => list.filter(f => f !== file)), setSaid(`${file.name} removed`))}>
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2">
        {status === 'draft' ? (
          <>
            <button type="button" className="cursor-pointer border-0 bg-(--bl-send) px-3.5 py-2 font-extrabold text-[#f4f4f4] shadow-[inset_-3px_-3px_0_rgba(0,0,0,0.25)] data-[kind=discard]:bg-transparent data-[kind=discard]:text-inherit data-[kind=discard]:shadow-[inset_0_0_0_2px_currentColor]" data-kind="discard" onClick={discard}>
              {discardLabel}
            </button>
            <button type="submit" className="cursor-pointer border-0 bg-(--bl-send) px-3.5 py-2 font-extrabold text-[#f4f4f4] shadow-[inset_-3px_-3px_0_rgba(0,0,0,0.25)] data-[kind=discard]:bg-transparent data-[kind=discard]:text-inherit data-[kind=discard]:shadow-[inset_0_0_0_2px_currentColor]">
              {sendLabel}
            </button>
          </>
        ) : (
          <p className="m-0 font-extrabold">{status === 'sent' ? 'Sent. Nice and tidy.' : 'Discarded.'}</p>
        )}
      </div>
      {status === 'sent' && (
        <span className="absolute right-[18px] bottom-[18px] grid size-[74px] animate-[bl-draft-seal_260ms_steps(3)_both] place-items-center rounded-[50%] bg-(--bl-wax) text-[11px] font-black tracking-[0.08em] text-[#f4f4f4] shadow-[inset_-4px_-4px_0_rgba(0,0,0,0.25),0_0_0_4px_rgba(177,62,83,0.35)] [transform:rotate(-10deg)] motion-reduce:animate-none!" aria-hidden="true">
          {sentLabel}
        </span>
      )}
      <span className="sr-only" aria-live="polite">
        {said}
      </span>
    </form>
  );
}
