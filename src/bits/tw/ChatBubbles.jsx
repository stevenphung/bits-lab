import { useEffect, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Chat thread. New messages spring out of their tail corner; consecutive messages from the
// same sender group together with one tail and one avatar; a typing indicator bounces while
// the other side writes. Hover or focus a bubble to react from a small picker (double-click
// or double-tap adds a heart). The thread is a polite live log and sticks to the bottom
// unless you've scrolled up to read.

const STYLE_ID = 'bl-chat-tw';
const CSS = `
@keyframes bl-chat-in { from { opacity: 0; transform: scale(0.5) translateY(12px); } }
@keyframes bl-chat-pop { from { opacity: 0; transform: scale(0.4); } }
@keyframes bl-chat-dot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-5px); opacity: 1; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const DEFAULT_REACTIONS = ['❤️', '😂', '👍', '😮', '😢'];
const REACTION_NAMES = { '❤️': 'heart', '😂': 'laughing', '👍': 'thumbs up', '😮': 'surprised', '😢': 'sad' };

export default function ChatBubbles({
  messages = [],
  typing = false,
  typingName,
  reactions = DEFAULT_REACTIONS,
  onReact,
  height = 420,
  radius = 18,
  label = 'Conversation',
  backgroundColor = '#11131c',
  meColor = '#3987e5',
  meTextColor = '#ffffff',
  themColor = '#29366f',
  themTextColor = '#f4f4f4',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  chipColor = 'rgba(255,255,255,0.1)',
  pickerColor = '#1f2335',
  lineColor = 'rgba(255,255,255,0.1)',
  accentColor = '#73eff7',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
  const ref = useRef(null);
  const seen = useRef(null);
  const [picker, setPicker] = useState(null);
  const [mine, setMine] = useState({});
  const pinned = useRef(true);

  // Only messages that arrive after the first render animate in.
  if (seen.current === null) seen.current = new Set(messages.map(m => m.id));
  const fresh = new Set(messages.filter(m => !seen.current.has(m.id)).map(m => m.id));
  useEffect(() => {
    messages.forEach(m => seen.current.add(m.id));
  });

  // Stay pinned to the newest message unless the reader scrolled up.
  useLayoutEffect(() => {
    const node = ref.current;
    if (node && pinned.current) node.scrollTop = node.scrollHeight;
  }, [messages.length, typing]);

  useEffect(() => {
    if (picker === null) return undefined;
    const close = event => {
      if (!event.target.closest?.('.bl-chat__picker, .bl-chat__react-btn')) setPicker(null);
    };
    const onKey = event => event.key === 'Escape' && setPicker(null);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [picker]);

  const toggleReaction = (id, emoji) => {
    const current = mine[id] ?? [];
    const on = current.includes(emoji);
    setMine({ ...mine, [id]: on ? current.filter(e => e !== emoji) : [...current, emoji] });
    onReact?.(id, emoji, !on);
    setPicker(null);
  };

  return (
    <div
      ref={ref}
      className={`flex h-(--bl-h) flex-col gap-0.5 overflow-y-auto overscroll-contain rounded-(--bl-radius) bg-(--bl-bg) px-3.5 py-4 font-(family-name:--bl-font) text-[15px] text-(--bl-ink) [scrollbar-width:thin] ${className}`}
      role="log"
      aria-live="polite"
      aria-label={label}
      onScroll={event => {
        const node = event.currentTarget;
        pinned.current = node.scrollHeight - node.scrollTop - node.clientHeight < 40;
      }}
      style={{
        '--bl-h': typeof height === 'number' ? `${height}px` : height,
        '--bl-radius': `${radius}px`,
        '--bl-bg': backgroundColor,
        '--bl-me': meColor,
        '--bl-me-ink': meTextColor,
        '--bl-them': themColor,
        '--bl-them-ink': themTextColor,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-chip': chipColor,
        '--bl-picker': pickerColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-font': fontFamily,
        ...style
      }}
    >
      {messages.map((message, i) => {
        const from = message.from === 'me' ? 'me' : 'them';
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const first = !prev || (prev.from === 'me') !== (from === 'me') || prev.author !== message.author;
        const last = !next || (next.from === 'me') !== (from === 'me') || next.author !== message.author;
        const all = [...new Set([...(message.reactions ?? []), ...(mine[message.id] ?? [])])];
        return (
          <div key={message.id} className="group/row relative flex max-w-full items-end gap-2 data-[from=me]:flex-row-reverse data-[last]:mb-2.5" data-from={from} data-first={first || undefined} data-last={last || undefined}>
            {from === 'them' && (
              <span className="grid size-[30px] flex-none place-items-center overflow-hidden rounded-[50%] bg-(--bl-them) text-[13px] font-bold data-[hidden]:invisible" data-hidden={!last || undefined} aria-hidden="true">
                {message.avatar ?? (message.author ?? '?').slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="flex max-w-[min(78%,480px)] min-w-0 flex-col items-start group-data-[from=me]/row:items-end">
              {first && from === 'them' && message.author && <p className="mt-0 mr-0 mb-[3px] ml-3 text-[12px] text-(--bl-muted)">{message.author}</p>}
              <div className="group/wrap relative">
                <div
                  className="relative origin-bottom-left rounded-[18px] bg-(--bl-them) px-[13px] py-[9px] leading-[1.45] text-(--bl-them-ink) [overflow-wrap:anywhere] outline-none focus-visible:shadow-[0_0_0_2px_var(--bl-accent)] group-data-[from=me]/row:origin-bottom-right group-data-[from=me]/row:bg-(--bl-me) group-data-[from=me]/row:text-(--bl-me-ink) group-[[data-from=them]:not([data-first])]/row:rounded-tl-[6px] group-[[data-from=them]:not([data-last])]/row:rounded-bl-[6px] group-[[data-from=me]:not([data-first])]/row:rounded-tr-[6px] group-[[data-from=me]:not([data-last])]/row:rounded-br-[6px] group-[[data-from=them][data-last]]/row:rounded-bl-[4px] group-[[data-from=me][data-last]]/row:rounded-br-[4px] data-[new]:animate-[bl-chat-in_520ms_cubic-bezier(.2,1.5,.4,1)_both] motion-reduce:data-[new]:animate-none"
                  data-new={fresh.has(message.id) || undefined}
                  tabIndex={0}
                  onDoubleClick={() => toggleReaction(message.id, reactions[0])}
                  aria-label={`${from === 'me' ? 'You' : message.author ?? 'Them'}: ${typeof message.text === 'string' ? message.text : ''}${message.time ? `, ${message.time}` : ''}`}
                >
                  {message.text}
                </div>
                {reactions.length > 0 && (
                  <button type="button" className="bl-chat__react-btn absolute top-1/2 grid size-7 cursor-pointer place-items-center rounded-[50%] border-0 bg-(--bl-chip) text-(--bl-muted) opacity-0 [transform:translateY(-50%)] transition-opacity duration-150 ease-[ease] group-focus-within/wrap:opacity-100 group-hover/wrap:opacity-100 focus-visible:outline-2 focus-visible:outline-(--bl-accent) focus-visible:outline-solid group-data-[from=them]/row:-right-9 group-data-[from=me]/row:-left-9" aria-label="Add reaction" aria-expanded={picker === message.id} onClick={() => setPicker(picker === message.id ? null : message.id)}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                      <circle cx="8" cy="8" r="6.2" />
                      <path d="M5.5 9.5c.6.9 1.5 1.4 2.5 1.4s1.9-.5 2.5-1.4M6 6.3h.01M10 6.3h.01" />
                    </svg>
                  </button>
                )}
                {picker === message.id && (
                  <div className="bl-chat__picker absolute bottom-[calc(100%_+_6px)] z-3 flex animate-[bl-chat-pop_220ms_cubic-bezier(.2,1.5,.4,1)] gap-0.5 rounded-full bg-(--bl-picker) p-1 shadow-[0_0_0_1px_var(--bl-line),0_10px_24px_-10px_rgba(0,0,0,0.7)] group-data-[from=them]/row:left-0 group-data-[from=me]/row:right-0 [&_button]:size-[34px] [&_button]:cursor-pointer [&_button]:rounded-[50%] [&_button]:border-0 [&_button]:bg-transparent [&_button]:text-[19px] [&_button]:[transition:transform_150ms] [&_button:hover]:bg-(--bl-chip) [&_button:hover]:[transform:scale(1.25)] [&_button:focus-visible]:bg-(--bl-chip) [&_button:focus-visible]:outline-none [&_button:focus-visible]:[transform:scale(1.25)] [&_button[aria-pressed=true]]:bg-(--bl-chip) motion-reduce:animate-none" role="group" aria-label="Reactions">
                    {reactions.map(emoji => (
                      <button key={emoji} type="button" aria-label={REACTION_NAMES[emoji] ?? emoji} aria-pressed={(mine[message.id] ?? []).includes(emoji)} onClick={() => toggleReaction(message.id, emoji)}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {all.length > 0 && (
                <div className="relative z-1 mx-2 -mt-1.5 mb-0 flex gap-1" aria-label={`Reactions: ${all.map(e => REACTION_NAMES[e] ?? e).join(', ')}`}>
                  {all.map(emoji => (
                    <span key={emoji} className="inline-flex animate-[bl-chat-pop_300ms_cubic-bezier(.2,1.6,.4,1)] items-center gap-[3px] rounded-full bg-(--bl-picker) px-[7px] py-0.5 text-[13px] shadow-[0_0_0_2px_var(--bl-bg)] motion-reduce:animate-none" aria-hidden="true">
                      {emoji}
                    </span>
                  ))}
                </div>
              )}
              {last && message.time && <span className="mx-1.5 mt-[3px] mb-0 text-[11px] text-(--bl-muted)">{message.time}</span>}
            </div>
          </div>
        );
      })}
      {typing && (
        <div className="group/row relative flex max-w-full items-end gap-2 data-[from=me]:flex-row-reverse data-[last]:mb-2.5" data-from="them" data-first data-last>
          <span className="grid size-[30px] flex-none place-items-center overflow-hidden rounded-[50%] bg-(--bl-them) text-[13px] font-bold data-[hidden]:invisible" aria-hidden="true">
            {(typingName ?? '?').slice(0, 1).toUpperCase()}
          </span>
          <span className="inline-flex gap-1 rounded-[18px_18px_18px_4px] bg-(--bl-them) px-3.5 py-[13px] [&_i]:size-[7px] [&_i]:animate-[bl-chat-dot_1.2s_ease-in-out_infinite] [&_i]:rounded-[50%] [&_i]:bg-(--bl-muted) [&_i:nth-child(2)]:[animation-delay:0.15s] [&_i:nth-child(3)]:[animation-delay:0.3s] motion-reduce:[&_i]:animate-none motion-reduce:[&_i]:opacity-80" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="sr-only">{`${typingName ?? 'Someone'} is typing`}</span>
        </div>
      )}
    </div>
  );
}
