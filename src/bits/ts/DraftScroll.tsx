import { useId, useInsertionEffect, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A message an agent drafted, laid out on a parchment scroll for a person to review. Pick the
// recipient, switch the tone (each tone has its own draft), edit the subject and body in place,
// drop attachments, then send or discard. Sending seals the scroll with a wax stamp; discarding
// rolls it up. All fields are labelled form controls; the outcome is announced.

const STYLE_ID = 'bl-draft-scroll';
const CSS = `
.bl-draft { position: relative; display: grid; gap: 12px; width: min(var(--bl-w), 100%); padding: 22px 20px; box-sizing: border-box; background: var(--bl-paper); color: var(--bl-ink); font-family: var(--bl-font); font-size: 14px; box-shadow: 0 -8px 0 -2px var(--bl-roll), 0 8px 0 -2px var(--bl-roll), 6px 10px 0 rgba(0,0,0,0.35); }
.bl-draft[data-status="discarded"] { animation: bl-draft-roll 320ms steps(4) both; }
.bl-draft__by { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; opacity: 0.75; }
.bl-draft__row { display: grid; grid-template-columns: 64px 1fr; align-items: center; gap: 10px; }
.bl-draft__row label, .bl-draft__label { font-size: 12px; font-weight: 800; opacity: 0.75; }
.bl-draft__field { width: 100%; box-sizing: border-box; padding: 6px 8px; border: 0; border-bottom: 2px dashed var(--bl-line); background: transparent; color: inherit; font: inherit; }
.bl-draft__field:focus { outline: none; border-bottom-style: solid; border-bottom-color: var(--bl-accent); background: rgba(255,255,255,0.35); }
.bl-draft__tones { display: flex; flex-wrap: wrap; gap: 4px; }
.bl-draft__tone { padding: 4px 10px; border: 0; background: transparent; color: inherit; font: inherit; font-size: 12px; font-weight: 700; box-shadow: inset 0 0 0 2px var(--bl-line); cursor: pointer; }
.bl-draft__tone[aria-pressed="true"] { background: var(--bl-ink); color: var(--bl-paper); box-shadow: none; }
.bl-draft__body { min-height: 130px; resize: vertical; line-height: 1.55; border: 2px dashed var(--bl-line); }
.bl-draft__body:focus { border-style: solid; border-color: var(--bl-accent); }
.bl-draft__files { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
.bl-draft__file { display: inline-flex; align-items: center; gap: 6px; padding: 4px 4px 4px 8px; background: rgba(0,0,0,0.08); font-size: 12px; font-weight: 700; }
.bl-draft__file button { display: grid; place-items: center; width: 18px; height: 18px; padding: 0; border: 0; background: transparent; color: inherit; font: inherit; cursor: pointer; }
.bl-draft__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 8px; }
.bl-draft__btn { padding: 8px 14px; border: 0; background: var(--bl-send); color: #f4f4f4; font: inherit; font-weight: 800; cursor: pointer; box-shadow: inset -3px -3px 0 rgba(0,0,0,0.25); }
.bl-draft__btn[data-kind="discard"] { background: transparent; color: inherit; box-shadow: inset 0 0 0 2px currentColor; }
.bl-draft button:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-draft__seal { position: absolute; right: 18px; bottom: 18px; display: grid; place-items: center; width: 74px; height: 74px; border-radius: 50%; background: var(--bl-wax); color: #f4f4f4; font-size: 11px; font-weight: 900; letter-spacing: 0.08em; box-shadow: inset -4px -4px 0 rgba(0,0,0,0.25), 0 0 0 4px rgba(177,62,83,0.35); transform: rotate(-10deg); animation: bl-draft-seal 260ms steps(3) both; }
.bl-draft__done { margin: 0; font-weight: 800; }
.bl-draft__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-draft-seal { from { opacity: 0; transform: rotate(-10deg) scale(2.4); } }
@keyframes bl-draft-roll { to { opacity: 0.6; transform: scaleY(0.85); } }
@media (prefers-reduced-motion: reduce) { .bl-draft, .bl-draft__seal { animation: none !important; } }
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
      className={`bl-draft ${className}`}
      data-status={status}
      aria-label="Draft for review"
      onSubmit={event => {
        event.preventDefault();
        if (!done) send();
      }}
      style={{ '--bl-w': `${width}px`, '--bl-paper': paperColor, '--bl-roll': rollColor, '--bl-ink': textColor, '--bl-line': lineColor, '--bl-accent': accentColor, '--bl-send': sendColor, '--bl-wax': waxColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      <p className="bl-draft__by">
        <span>{author}</span>
        {tone && <span>{tone}</span>}
      </p>
      {recipients.length > 0 && (
        <div className="bl-draft__row">
          <label htmlFor={`${uid}-to`}>To</label>
          <select id={`${uid}-to`} className="bl-draft__field" value={to} disabled={done} onChange={event => setTo(event.target.value)}>
            {recipients.map(r => (
              <option key={r.id} value={r.id}>
                {r.name}
                {r.email ? ` <${r.email}>` : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="bl-draft__row">
        <label htmlFor={`${uid}-subject`}>Subject</label>
        <input id={`${uid}-subject`} className="bl-draft__field" value={subject} disabled={done} onChange={event => setSubject(event.target.value)} />
      </div>
      {tones.length > 1 && (
        <div className="bl-draft__row">
          <span className="bl-draft__label">Tone</span>
          <div className="bl-draft__tones" role="group" aria-label="Tone">
            {tones.map(t => (
              <button key={t} type="button" className="bl-draft__tone" aria-pressed={t === tone} disabled={done} onClick={() => pickTone(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
      <textarea className="bl-draft__field bl-draft__body" aria-label="Message" value={body} disabled={done} onChange={event => setBody(event.target.value)} />
      {files.length > 0 && (
        <ul className="bl-draft__files" aria-label="Attachments">
          {files.map(file => (
            <li key={file.id ?? file.name} className="bl-draft__file">
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
      <div className="bl-draft__foot">
        {status === 'draft' ? (
          <>
            <button type="button" className="bl-draft__btn" data-kind="discard" onClick={discard}>
              {discardLabel}
            </button>
            <button type="submit" className="bl-draft__btn">
              {sendLabel}
            </button>
          </>
        ) : (
          <p className="bl-draft__done">{status === 'sent' ? 'Sent. Nice and tidy.' : 'Discarded.'}</p>
        )}
      </div>
      {status === 'sent' && (
        <span className="bl-draft__seal" aria-hidden="true">
          {sentLabel}
        </span>
      )}
      <span className="bl-draft__sr" aria-live="polite">
        {said}
      </span>
    </form>
  );
}
