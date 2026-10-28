import { useId, useInsertionEffect, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A comment with its replies, joined by a pixel trail. An agent's comment can carry folded
// details ("What I did": the steps behind it) that open in place; @mentions stand out; a reply
// box at the end adds your reply to the trail. Comments are articles with real times and
// authors; the details toggle is a disclosure button; new replies are announced.

const STYLE_ID = 'bl-thread-trail-tw';
const CSS = `
/* theme tokens */
.bl-thread { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-mention: rgba(115,239,247,0.18); --bl-mention-ink: #73eff7; --bl-ok: #a7f070; }
:where(.light, [data-theme="light"]) .bl-thread, .bl-thread:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-mention: rgba(22,127,143,0.18); --bl-mention-ink: #167f8f; --bl-ok: #2f7d22; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-thread, :where(.light, [data-theme="light"]) .bl-thread:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-chip: #262b44; --bl-line: #333c57; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-accent: #73eff7; --bl-mention: rgba(115,239,247,0.18); --bl-mention-ink: #73eff7; --bl-ok: #a7f070; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-thread, .bl-thread:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-chip: #ebe5d8; --bl-line: #cfc4ad; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-accent: #167f8f; --bl-mention: rgba(22,127,143,0.18); --bl-mention-ink: #167f8f; --bl-ok: #2f7d22; } }
/* theme tokens end */
@keyframes bl-thread-open { from { opacity: 0; transform: translateY(-4px); } }
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
        <span key={i} className="bg-(--bl-mention) px-[3px] py-0 font-bold text-(--bl-mention-ink)">
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
  backgroundColor,
  chipColor,
  lineColor,
  textColor,
  mutedColor,
  accentColor,
  mentionColor,
  mentionTextColor,
  okColor,
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
      <article key={item.id} className="group/ti relative grid grid-cols-[36px_1fr] gap-2.5 pb-[14px] not-last:before:absolute not-last:before:top-[38px] not-last:before:bottom-0 not-last:before:left-4 not-last:before:w-1 not-last:before:bg-[repeating-linear-gradient(var(--bl-line)_0_4px,transparent_4px_8px)] not-last:before:content-[''] data-[reply]:ml-[46px]" data-reply={isReply || undefined} data-agent={item.agent || undefined} data-new={item.isNew || undefined}>
        <span className="grid size-9 place-items-center overflow-hidden bg-(--bl-chip) font-extrabold text-(--bl-muted) shadow-[inset_0_0_0_2px_var(--bl-line)] group-data-[agent]/ti:shadow-[inset_0_0_0_2px_var(--bl-accent)] [&_img]:size-full [&_img]:object-cover [&_img]:[image-rendering:pixelated]" aria-hidden="true">
          {typeof item.avatar === 'string' ? <img src={item.avatar} alt="" /> : (item.avatar ?? initials(item.author))}
        </span>
        <div className="grid min-w-0 gap-1.5 bg-(--bl-bg) px-3 py-2.5 shadow-[inset_0_0_0_2px_var(--bl-line)] group-data-[new]/ti:animate-[bl-thread-open_240ms_steps(3)_both] motion-reduce:animate-none">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="font-extrabold">{item.author}</span>
            {item.agent && <span className="bg-(--bl-accent) px-1.5 py-px text-[10px] font-black tracking-[0.06em] text-[#0b0b14]">{agentBadge}</span>}
            {item.time && <time className="text-[12px] text-(--bl-muted)" dateTime={item.dateTime}>{item.time}</time>}
          </div>
          <p className="m-0 leading-[1.5] [overflow-wrap:anywhere]">{withMentions(item.text)}</p>
          {(item.details?.length ?? 0) > 0 && (
            <>
              <button type="button" className="cursor-pointer [justify-self:start] border-0 bg-transparent px-0 py-0.5 text-[12px] font-extrabold text-(--bl-accent) before:inline-block before:[transition:transform_160ms_steps(2)] before:content-['▸_'] aria-expanded:before:[transform:rotate(90deg)] motion-reduce:before:[transition:none]" aria-expanded={isOpen} aria-controls={detailsId} onClick={() => setOpen(list => (isOpen ? list.filter(id => id !== item.id) : [...list, item.id]))}>
                {item.detailsLabel ?? detailsLabel} ({item.details?.length})
              </button>
              {isOpen && (
                <ul id={detailsId} className="m-0 grid animate-[bl-thread-open_200ms_steps(3)_both] list-none gap-1 bg-(--bl-chip) px-2.5 py-2 text-[13px] text-(--bl-muted) motion-reduce:animate-none [&_li]:before:text-(--bl-ok) [&_li]:before:content-['✓_']">
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
      className={`bl-thread grid w-[min(var(--bl-w),100%)] gap-0 font-(family-name:--bl-font) text-[14px] text-(--bl-ink) [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-(--bl-accent) [&_button:focus-visible]:outline-solid ${className}`}
      aria-label="Comment thread"
      style={{ '--bl-w': `${width}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-accent': accentColor, '--bl-mention': mentionColor, '--bl-mention-ink': mentionTextColor, '--bl-ok': okColor, '--bl-font': fontFamily, ...style } as CSSVars}
    >
      {comment && render(comment, false)}
      {replies.map(reply => render(reply, true))}
      <form
        className="ml-[46px] flex gap-2"
        onSubmit={event => {
          event.preventDefault();
          send();
        }}
      >
        <input className="min-w-0 flex-1 border-0 bg-(--bl-bg) px-2.5 py-2 text-inherit shadow-[inset_0_0_0_2px_var(--bl-line)] focus:shadow-[inset_0_0_0_2px_var(--bl-accent)] focus:outline-none" aria-label="Write a reply" placeholder={placeholder} value={draft} onChange={event => setDraft(event.target.value)} />
        <button type="submit" className="cursor-pointer border-0 bg-(--bl-accent) px-3 py-2 font-extrabold text-[#0b0b14] disabled:cursor-default disabled:opacity-40" disabled={!draft.trim()}>
          {replyLabel}
        </button>
      </form>
      <span className="sr-only" aria-live="polite">
        {said}
      </span>
    </section>
  );
}
