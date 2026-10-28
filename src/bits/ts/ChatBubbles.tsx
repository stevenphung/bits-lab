import { useEffect, useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Chat thread. New messages spring out of their tail corner; consecutive messages from the
// same sender group together with one tail and one avatar; a typing indicator bounces while
// the other side writes. Hover or focus a bubble to react from a small picker (double-click
// or double-tap adds a heart). The thread is a polite live log and sticks to the bottom
// unless you've scrolled up to read.

const STYLE_ID = 'bl-chat';
const CSS = `
/* theme tokens */
.bl-chat { --bl-bg: #11131c; --bl-me: #3987e5; --bl-me-ink: #ffffff; --bl-them: #29366f; --bl-them-ink: #f4f4f4; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-chip: rgba(255,255,255,0.1); --bl-picker: #1f2335; --bl-line: rgba(255,255,255,0.1); --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-chat, .bl-chat:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-them: #e3dccd; --bl-them-ink: #1a1c2c; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-chip: rgba(26,28,44,0.1); --bl-picker: #ebe5d8; --bl-line: rgba(26,28,44,0.1); --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-chat, :where(.light, [data-theme="light"]) .bl-chat:where(.dark, [data-theme="dark"]) { --bl-bg: #11131c; --bl-me: #3987e5; --bl-me-ink: #ffffff; --bl-them: #29366f; --bl-them-ink: #f4f4f4; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-chip: rgba(255,255,255,0.1); --bl-picker: #1f2335; --bl-line: rgba(255,255,255,0.1); --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-chat, .bl-chat:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-them: #e3dccd; --bl-them-ink: #1a1c2c; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-chip: rgba(26,28,44,0.1); --bl-picker: #ebe5d8; --bl-line: rgba(26,28,44,0.1); --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-chat { display: flex; flex-direction: column; gap: 2px; height: var(--bl-h); overflow-y: auto; padding: 16px 14px; border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); font-size: 15px; scrollbar-width: thin; overscroll-behavior: contain; }
.bl-chat__row { position: relative; display: flex; align-items: flex-end; gap: 8px; max-width: 100%; }
.bl-chat__row[data-from="me"] { flex-direction: row-reverse; }
.bl-chat__row[data-last] { margin-bottom: 10px; }
.bl-chat__avatar { flex: 0 0 auto; display: grid; place-items: center; width: 30px; height: 30px; overflow: hidden; border-radius: 50%; background: var(--bl-them); font-size: 13px; font-weight: 700; }
.bl-chat__avatar[data-hidden] { visibility: hidden; }
.bl-chat__stack { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; max-width: min(78%, 480px); }
.bl-chat__row[data-from="me"] .bl-chat__stack { align-items: flex-end; }
.bl-chat__author { margin: 0 0 3px 12px; color: var(--bl-muted); font-size: 12px; }
.bl-chat__bubble { position: relative; padding: 9px 13px; border-radius: 18px; background: var(--bl-them); color: var(--bl-them-ink); line-height: 1.45; overflow-wrap: anywhere; outline: none; transform-origin: bottom left; }
.bl-chat__row[data-from="me"] .bl-chat__bubble { background: var(--bl-me); color: var(--bl-me-ink); transform-origin: bottom right; }
.bl-chat__row[data-from="them"]:not([data-first]) .bl-chat__bubble { border-top-left-radius: 6px; }
.bl-chat__row[data-from="them"]:not([data-last]) .bl-chat__bubble { border-bottom-left-radius: 6px; }
.bl-chat__row[data-from="me"]:not([data-first]) .bl-chat__bubble { border-top-right-radius: 6px; }
.bl-chat__row[data-from="me"]:not([data-last]) .bl-chat__bubble { border-bottom-right-radius: 6px; }
.bl-chat__row[data-from="them"][data-last] .bl-chat__bubble { border-bottom-left-radius: 4px; }
.bl-chat__row[data-from="me"][data-last] .bl-chat__bubble { border-bottom-right-radius: 4px; }
.bl-chat__bubble:focus-visible { box-shadow: 0 0 0 2px var(--bl-accent); }
.bl-chat__bubble[data-new] { animation: bl-chat-in 520ms cubic-bezier(.2,1.5,.4,1) both; }
.bl-chat__time { margin: 3px 6px 0; color: var(--bl-muted); font-size: 11px; }
.bl-chat__react-btn { position: absolute; top: 50%; display: grid; place-items: center; width: 28px; height: 28px; border: 0; border-radius: 50%; background: var(--bl-chip); color: var(--bl-muted); cursor: pointer; opacity: 0; transform: translateY(-50%); transition: opacity 150ms; }
.bl-chat__row[data-from="them"] .bl-chat__react-btn { right: -36px; }
.bl-chat__row[data-from="me"] .bl-chat__react-btn { left: -36px; }
.bl-chat__bubble-wrap { position: relative; }
.bl-chat__bubble-wrap:hover .bl-chat__react-btn, .bl-chat__bubble-wrap:focus-within .bl-chat__react-btn { opacity: 1; }
.bl-chat__react-btn:focus-visible { outline: 2px solid var(--bl-accent); }
.bl-chat__picker { position: absolute; bottom: calc(100% + 6px); z-index: 3; display: flex; gap: 2px; padding: 4px; border-radius: 999px; background: var(--bl-picker); box-shadow: 0 0 0 1px var(--bl-line), 0 10px 24px -10px rgba(0,0,0,0.7); animation: bl-chat-pop 220ms cubic-bezier(.2,1.5,.4,1); }
.bl-chat__row[data-from="them"] .bl-chat__picker { left: 0; }
.bl-chat__row[data-from="me"] .bl-chat__picker { right: 0; }
.bl-chat__picker button { width: 34px; height: 34px; border: 0; border-radius: 50%; background: transparent; font-size: 19px; cursor: pointer; transition: transform 150ms; }
.bl-chat__picker button:hover, .bl-chat__picker button:focus-visible { transform: scale(1.25); background: var(--bl-chip); outline: none; }
.bl-chat__picker button[aria-pressed="true"] { background: var(--bl-chip); }
.bl-chat__reactions { display: flex; gap: 4px; margin: -6px 8px 0; position: relative; z-index: 1; }
.bl-chat__reaction { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 999px; background: var(--bl-picker); box-shadow: 0 0 0 2px var(--bl-bg); font-size: 13px; animation: bl-chat-pop 300ms cubic-bezier(.2,1.6,.4,1); }
.bl-chat__typing { display: inline-flex; gap: 4px; padding: 13px 14px; border-radius: 18px 18px 18px 4px; background: var(--bl-them); }
.bl-chat__typing i { width: 7px; height: 7px; border-radius: 50%; background: var(--bl-muted); animation: bl-chat-dot 1.2s ease-in-out infinite; }
.bl-chat__typing i:nth-child(2) { animation-delay: 0.15s; }
.bl-chat__typing i:nth-child(3) { animation-delay: 0.3s; }
.bl-chat__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-chat-in { from { opacity: 0; transform: scale(0.5) translateY(12px); } }
@keyframes bl-chat-pop { from { opacity: 0; transform: scale(0.4); } }
@keyframes bl-chat-dot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5; } 30% { transform: translateY(-5px); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .bl-chat__bubble[data-new], .bl-chat__picker, .bl-chat__reaction { animation: none; } .bl-chat__typing i { animation: none; opacity: 0.8; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export interface ChatMessage {
  id: string | number;
  from: 'me' | 'them';
  text: ReactNode;
  author?: string;
  /** Avatar content (image, sprite or initials); defaults to the author's initial. */
  avatar?: ReactNode;
  time?: string;
  /** Reactions already on the message. */
  reactions?: string[];
}

export interface ChatBubblesProps {
  messages?: ChatMessage[];
  /** Show the typing indicator. */
  typing?: boolean;
  typingName?: string;
  /** Picker options; double-click adds the first. */
  reactions?: string[];
  /** Called when you toggle a reaction. */
  onReact?: (id: ChatMessage['id'], emoji: string, on: boolean) => void;
  /** Thread height (px or any CSS length). */
  height?: number | string;
  radius?: number;
  /** Accessible name of the live log. */
  label?: string;
  backgroundColor?: string;
  meColor?: string;
  meTextColor?: string;
  themColor?: string;
  themTextColor?: string;
  textColor?: string;
  mutedColor?: string;
  chipColor?: string;
  pickerColor?: string;
  lineColor?: string;
  accentColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_REACTIONS = ['❤️', '😂', '👍', '😮', '😢'];
const REACTION_NAMES: Record<string, string> = { '❤️': 'heart', '😂': 'laughing', '👍': 'thumbs up', '😮': 'surprised', '😢': 'sad' };

export default function ChatBubbles({
  messages = [],
  typing = false,
  typingName,
  reactions = DEFAULT_REACTIONS,
  onReact,
  height = 420,
  radius = 18,
  label = 'Conversation',
  backgroundColor,
  meColor,
  meTextColor,
  themColor,
  themTextColor,
  textColor,
  mutedColor,
  chipColor,
  pickerColor,
  lineColor,
  accentColor,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: ChatBubblesProps) {
  useStyles();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useRef<Set<ChatMessage['id']> | null>(null);
  const [picker, setPicker] = useState<ChatMessage['id'] | null>(null);
  const [mine, setMine] = useState<Record<string, string[]>>({});
  const pinned = useRef(true);

  // Only messages that arrive after the first render animate in.
  if (seen.current === null) seen.current = new Set(messages.map(m => m.id));
  const fresh = new Set(messages.filter(m => !seen.current!.has(m.id)).map(m => m.id));
  useEffect(() => {
    messages.forEach(m => seen.current!.add(m.id));
  });

  // Stay pinned to the newest message unless the reader scrolled up.
  useLayoutEffect(() => {
    const node = ref.current;
    if (node && pinned.current) node.scrollTop = node.scrollHeight;
  }, [messages.length, typing]);

  useEffect(() => {
    if (picker === null) return undefined;
    const close = (event: PointerEvent) => {
      if (!(event.target as Element).closest?.('.bl-chat__picker, .bl-chat__react-btn')) setPicker(null);
    };
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setPicker(null);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [picker]);

  const toggleReaction = (id: ChatMessage['id'], emoji: string) => {
    const current = mine[id] ?? [];
    const on = current.includes(emoji);
    setMine({ ...mine, [id]: on ? current.filter(e => e !== emoji) : [...current, emoji] });
    onReact?.(id, emoji, !on);
    setPicker(null);
  };

  return (
    <div
      ref={ref}
      className={`bl-chat ${className}`}
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
      } as CSSVars}
    >
      {messages.map((message, i) => {
        const from = message.from === 'me' ? 'me' : 'them';
        const prev = messages[i - 1];
        const next = messages[i + 1];
        const first = !prev || (prev.from === 'me') !== (from === 'me') || prev.author !== message.author;
        const last = !next || (next.from === 'me') !== (from === 'me') || next.author !== message.author;
        const all = [...new Set([...(message.reactions ?? []), ...(mine[message.id] ?? [])])];
        return (
          <div key={message.id} className="bl-chat__row" data-from={from} data-first={first || undefined} data-last={last || undefined}>
            {from === 'them' && (
              <span className="bl-chat__avatar" data-hidden={!last || undefined} aria-hidden="true">
                {message.avatar ?? (message.author ?? '?').slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="bl-chat__stack">
              {first && from === 'them' && message.author && <p className="bl-chat__author">{message.author}</p>}
              <div className="bl-chat__bubble-wrap">
                <div
                  className="bl-chat__bubble"
                  data-new={fresh.has(message.id) || undefined}
                  tabIndex={0}
                  onDoubleClick={() => toggleReaction(message.id, reactions[0])}
                  aria-label={`${from === 'me' ? 'You' : message.author ?? 'Them'}: ${typeof message.text === 'string' ? message.text : ''}${message.time ? `, ${message.time}` : ''}`}
                >
                  {message.text}
                </div>
                {reactions.length > 0 && (
                  <button type="button" className="bl-chat__react-btn" aria-label="Add reaction" aria-expanded={picker === message.id} onClick={() => setPicker(picker === message.id ? null : message.id)}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                      <circle cx="8" cy="8" r="6.2" />
                      <path d="M5.5 9.5c.6.9 1.5 1.4 2.5 1.4s1.9-.5 2.5-1.4M6 6.3h.01M10 6.3h.01" />
                    </svg>
                  </button>
                )}
                {picker === message.id && (
                  <div className="bl-chat__picker" role="group" aria-label="Reactions">
                    {reactions.map(emoji => (
                      <button key={emoji} type="button" aria-label={REACTION_NAMES[emoji] ?? emoji} aria-pressed={(mine[message.id] ?? []).includes(emoji)} onClick={() => toggleReaction(message.id, emoji)}>
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {all.length > 0 && (
                <div className="bl-chat__reactions" aria-label={`Reactions: ${all.map(e => REACTION_NAMES[e] ?? e).join(', ')}`}>
                  {all.map(emoji => (
                    <span key={emoji} className="bl-chat__reaction" aria-hidden="true">
                      {emoji}
                    </span>
                  ))}
                </div>
              )}
              {last && message.time && <span className="bl-chat__time">{message.time}</span>}
            </div>
          </div>
        );
      })}
      {typing && (
        <div className="bl-chat__row" data-from="them" data-first data-last>
          <span className="bl-chat__avatar" aria-hidden="true">
            {(typingName ?? '?').slice(0, 1).toUpperCase()}
          </span>
          <span className="bl-chat__typing" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="bl-chat__sr">{`${typingName ?? 'Someone'} is typing`}</span>
        </div>
      )}
    </div>
  );
}
