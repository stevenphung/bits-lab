import { useId, useInsertionEffect, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A comment with its replies, joined by a pixel trail. An agent's comment can carry folded
// details ("What I did": the steps behind it) that open in place; @mentions stand out; a reply
// box at the end adds your reply to the trail. Comments are articles with real times and
// authors; the details toggle is a disclosure button; new replies are announced.

const STYLE_ID = 'bl-thread-trail';
const CSS = `
.bl-thread { display: grid; gap: 0; width: min(var(--bl-w), 100%); color: var(--bl-ink); font-family: var(--bl-font); font-size: 14px; }
.bl-thread__item { position: relative; display: grid; grid-template-columns: 36px 1fr; gap: 10px; padding-bottom: 14px; }
.bl-thread__item:not(:last-child)::before { content: ''; position: absolute; top: 38px; bottom: 0; left: 16px; width: 4px; background: repeating-linear-gradient(var(--bl-line) 0 4px, transparent 4px 8px); }
.bl-thread__item[data-reply] { margin-left: 46px; }
.bl-thread__avatar { display: grid; place-items: center; width: 36px; height: 36px; overflow: hidden; background: var(--bl-chip); color: var(--bl-muted); font-weight: 800; box-shadow: inset 0 0 0 2px var(--bl-line); }
.bl-thread__avatar img { width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; }
.bl-thread__item[data-agent] .bl-thread__avatar { box-shadow: inset 0 0 0 2px var(--bl-accent); }
.bl-thread__bubble { display: grid; gap: 6px; min-width: 0; padding: 10px 12px; background: var(--bl-bg); box-shadow: inset 0 0 0 2px var(--bl-line); }
.bl-thread__meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; }
.bl-thread__author { font-weight: 800; }
.bl-thread__badge { padding: 1px 6px; background: var(--bl-accent); color: #0b0b14; font-size: 10px; font-weight: 900; letter-spacing: 0.06em; }
.bl-thread__time { color: var(--bl-muted); font-size: 12px; }
.bl-thread__text { margin: 0; line-height: 1.5; overflow-wrap: anywhere; }
.bl-thread__mention { padding: 0 3px; background: var(--bl-mention); color: var(--bl-mention-ink); font-weight: 700; }
.bl-thread__toggle { justify-self: start; padding: 2px 0; border: 0; background: transparent; color: var(--bl-accent); font: inherit; font-size: 12px; font-weight: 800; cursor: pointer; }
.bl-thread__toggle::before { content: '▸ '; display: inline-block; transition: transform 160ms steps(2); }
.bl-thread__toggle[aria-expanded="true"]::before { transform: rotate(90deg); }
.bl-thread__details { display: grid; gap: 4px; margin: 0; padding: 8px 10px; background: var(--bl-chip); color: var(--bl-muted); font-size: 13px; list-style: none; animation: bl-thread-open 200ms steps(3) both; }
.bl-thread__details li::before { content: '✓ '; color: var(--bl-ok); }
.bl-thread__form { display: flex; gap: 8px; margin-left: 46px; }
.bl-thread__input { flex: 1; min-width: 0; padding: 8px 10px; border: 0; background: var(--bl-bg); color: inherit; font: inherit; box-shadow: inset 0 0 0 2px var(--bl-line); }
.bl-thread__input:focus { outline: none; box-shadow: inset 0 0 0 2px var(--bl-accent); }
.bl-thread__send { padding: 8px 12px; border: 0; background: var(--bl-accent); color: #0b0b14; font: inherit; font-weight: 800; cursor: pointer; }
.bl-thread__send:disabled { opacity: 0.4; cursor: default; }
.bl-thread button:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-thread__item[data-new] .bl-thread__bubble { animation: bl-thread-open 240ms steps(3) both; }
.bl-thread__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-thread-open { from { opacity: 0; transform: translateY(-4px); } }
@media (prefers-reduced-motion: reduce) { .bl-thread__details, .bl-thread__item[data-new] .bl-thread__bubble { animation: none; } .bl-thread__toggle::before { transition: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// Split text into plain runs and @mentions.
function withMentions(text: string) {
  return String(text)
    .split(/(@[A-Za-z][\w-]*)/g)
    .map((part, i) =>
      part.startsWith('@') ? (
        <span key={i} className="bl-thread__mention">
          {part}
        </span>
      ) : (
        part
      )
    );
}

const initials = (name: string) => String(name).split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();

export interface ThreadComment {
  id: string;
  author: string;
  text: string;
  /** An image URL or any node (defaults to initials). */
  avatar?: ReactNode;
  time?: string;
  dateTime?: string;
  /** Marks an agent's comment. */
  agent?: boolean;
  /** The steps behind it, folded under a disclosure. */
  details?: string[];
  detailsLabel?: string;
  isNew?: boolean;
}

export interface ThreadTrailProps {
  comment?: ThreadComment;
  replies?: ThreadComment[];
  you?: { name: string; avatar?: ReactNode };
  onReply?: (text: string) => void;
  placeholder?: string;
  replyLabel?: string;
  detailsLabel?: string;
  agentBadge?: string;
  width?: number;
  backgroundColor?: string;
  chipColor?: string;
  lineColor?: string;
  textColor?: string;
  mutedColor?: string;
  accentColor?: string;
  mentionColor?: string;
  mentionTextColor?: string;
  okColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function ThreadTrail({
  comment,
  replies: initialReplies = [],
  you = { name: 'You' },
  onReply,
  placeholder = 'Reply… use @ to mention',
  replyLabel = 'Reply',
  detailsLabel = 'What I did',
  agentBadge = 'AGENT',
  width = 520,
  backgroundColor = '#1a1c2c',
  chipColor = '#262b44',
  lineColor = '#333c57',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  accentColor = '#73eff7',
  mentionColor = 'rgba(115,239,247,0.18)',
  mentionTextColor = '#73eff7',
  okColor = '#a7f070',
  fontFamily = 'inherit',
  className = '',
  style
}: ThreadTrailProps) {
  useStyles();
  const uid = useId();
  const [replies, setReplies] = useState(initialReplies);
  const [open, setOpen] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [said, setSaid] = useState('');

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    const reply: ThreadComment = { id: `${uid}-${replies.length}`, author: you.name, avatar: you.avatar, time: 'just now', text, isNew: true };
    setReplies(list => [...list, reply]);
    setDraft('');
    setSaid(`Reply added: ${text}`);
    onReply?.(text);
  };

  const render = (item: ThreadComment, isReply: boolean) => {
    const isOpen = open.includes(item.id);
    const detailsId = `${uid}-details-${item.id}`;
    return (
      <article key={item.id} className="bl-thread__item" data-reply={isReply || undefined} data-agent={item.agent || undefined} data-new={item.isNew || undefined}>
        <span className="bl-thread__avatar" aria-hidden="true">
          {typeof item.avatar === 'string' ? <img src={item.avatar} alt="" /> : (item.avatar ?? initials(item.author))}
        </span>
        <div className="bl-thread__bubble">
          <div className="bl-thread__meta">
            <span className="bl-thread__author">{item.author}</span>
            {item.agent && <span className="bl-thread__badge">{agentBadge}</span>}
            {item.time && <time className="bl-thread__time" dateTime={item.dateTime}>{item.time}</time>}
          </div>
          <p className="bl-thread__text">{withMentions(item.text)}</p>
          {(item.details?.length ?? 0) > 0 && (
            <>
              <button type="button" className="bl-thread__toggle" aria-expanded={isOpen} aria-controls={detailsId} onClick={() => setOpen(list => (isOpen ? list.filter(id => id !== item.id) : [...list, item.id]))}>
                {item.detailsLabel ?? detailsLabel} ({item.details?.length})
              </button>
              {isOpen && (
                <ul id={detailsId} className="bl-thread__details">
                  {item.details?.map(step => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </article>
    );
  };

  return (
    <section
      className={`bl-thread ${className}`}
      aria-label="Comment thread"
      style={{ '--bl-w': `${width}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-mention': mentionColor, '--bl-mention-ink': mentionTextColor, '--bl-ok': okColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      {comment && render(comment, false)}
      {replies.map(reply => render(reply, true))}
      <form
        className="bl-thread__form"
        onSubmit={event => {
          event.preventDefault();
          send();
        }}
      >
        <input className="bl-thread__input" aria-label="Write a reply" placeholder={placeholder} value={draft} onChange={event => setDraft(event.target.value)} />
        <button type="submit" className="bl-thread__send" disabled={!draft.trim()}>
          {replyLabel}
        </button>
      </form>
      <span className="bl-thread__sr" aria-live="polite">
        {said}
      </span>
    </section>
  );
}
