import { Fragment, useEffect, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// LLM-style streaming text. Feed it a full string (it streams word by word at `speed`) or an
// async iterable of chunks from a real model. New chunks fade in at the tail behind a cursor,
// and a small markdown subset renders as it arrives (headings, lists, quotes, code blocks,
// bold, italic, inline code, links). Half-typed markup never flashes: an unclosed **bold** is
// shown bold until it closes. Busy while streaming, announced when complete.

const STYLE_ID = 'bl-streaming-text-tw';
const CSS = `
@keyframes bl-stream-in { from { opacity: 0; filter: blur(3px); } }
@keyframes bl-stream-blink { 50% { opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// ---------- Markdown (subset), keeping source offsets on text so the tail can fade ----------

// Inline markup: **bold**, *italic*, `code`, [text](url). Unclosed markers at the very end are
// treated as open (so mid-stream text never shows raw asterisks).
type MdText = { type: 'text'; text: string; start: number };
type MdNode = MdText | { type: 'strong' | 'em' | 'code' | 'link' | 'li'; href?: string; children: MdNode[] };
type MdBlock = { type: 'p' | 'h1' | 'h2' | 'h3' | 'blockquote' | 'pre' | 'ul' | 'ol'; children: MdNode[] };
type InlineMatch = { type: 'strong' | 'em' | 'code' | 'link'; open: number; inner: string; end: number; href?: string };

function parseInline(src: string, base: number): MdNode[] {
  const nodes: MdNode[] = [];
  let i = 0;
  let textStart = 0;
  const flush = (end: number) => {
    if (end > textStart) nodes.push({ type: 'text', text: src.slice(textStart, end), start: base + textStart });
  };
  while (i < src.length) {
    const rest = src.slice(i);
    let match: InlineMatch | null = null;
    if (rest.startsWith('**')) {
      const close = src.indexOf('**', i + 2);
      match = { type: 'strong', open: 2, inner: close < 0 ? src.slice(i + 2) : src.slice(i + 2, close), end: close < 0 ? src.length : close + 2 };
    } else if (rest[0] === '`') {
      const close = src.indexOf('`', i + 1);
      match = { type: 'code', open: 1, inner: close < 0 ? src.slice(i + 1) : src.slice(i + 1, close), end: close < 0 ? src.length : close + 1 };
    } else if (rest[0] === '*' && rest[1] !== ' ' && rest[1] !== undefined) {
      const close = src.indexOf('*', i + 1);
      match = { type: 'em', open: 1, inner: close < 0 ? src.slice(i + 1) : src.slice(i + 1, close), end: close < 0 ? src.length : close + 1 };
    } else if (rest[0] === '[') {
      const link = /^\[([^\]]*)\]\(([^)\s]*)\)/.exec(rest);
      if (link) match = { type: 'link', open: 1, inner: link[1], href: link[2], end: i + link[0].length };
    }
    if (!match) {
      i++;
      continue;
    }
    flush(i);
    const innerBase = base + i + match.open;
    nodes.push(
      match.type === 'code'
        ? { type: 'code', children: [{ type: 'text', text: match.inner, start: innerBase }] }
        : { type: match.type, href: match.href, children: parseInline(match.inner, innerBase) }
    );
    i = match.end;
    textStart = i;
  }
  flush(src.length);
  return nodes;
}

function parseBlocks(src: string) {
  const blocks: MdBlock[] = [];
  const lines = src.split('\n');
  let offset = 0;
  let i = 0;
  const lineStart: number[] = [];
  for (const line of lines) {
    lineStart.push(offset);
    offset += line.length + 1;
  }
  while (i < lines.length) {
    const line = lines[i];
    const start = lineStart[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith('```')) {
      const body: string[] = [];
      const bodyStart = start + line.length + 1;
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++]);
      i++;
      blocks.push({ type: 'pre', children: [{ type: 'text', text: body.join('\n'), start: bodyStart }] });
      continue;
    }
    const heading = /^(#{1,3})\s+/.exec(line);
    if (heading) {
      blocks.push({ type: `h${heading[1].length}` as 'h1' | 'h2' | 'h3', children: parseInline(line.slice(heading[0].length), start + heading[0].length) });
      i++;
      continue;
    }
    const listItem = /^(\s*)([-*]|\d+\.)\s+/;
    if (listItem.test(line)) {
      const ordered = /\d/.test(listItem.exec(line)![2]);
      const items: MdNode[] = [];
      while (i < lines.length && listItem.test(lines[i])) {
        const m = listItem.exec(lines[i])!;
        items.push({ type: 'li', children: parseInline(lines[i].slice(m[0].length), lineStart[i] + m[0].length) });
        i++;
      }
      blocks.push({ type: ordered ? 'ol' : 'ul', children: items });
      continue;
    }
    if (line.startsWith('>')) {
      const marker = /^>\s?/.exec(line)![0];
      blocks.push({ type: 'blockquote', children: parseInline(line.slice(marker.length), start + marker.length) });
      i++;
      continue;
    }
    // Paragraph: consecutive plain lines.
    const parts: MdNode[] = [];
    while (i < lines.length && lines[i].trim() && !/^(```|#{1,3}\s|>|\s*([-*]|\d+\.)\s)/.test(lines[i])) {
      parts.push(...(parts.length ? [{ type: 'text' as const, text: ' ', start: lineStart[i] - 1 }] : []), ...parseInline(lines[i], lineStart[i]));
      i++;
    }
    blocks.push({ type: 'p', children: parts });
  }
  return blocks;
}

// ---------- Component ----------

const SAFE_HREF = /^(https?:|mailto:|\/|#)/i;

export interface StreamingTextProps {
  /** Full text to stream word by word at `speed`. */
  text?: string;
  /** A real token stream; chunks appear as they arrive. */
  stream?: AsyncIterable<string>;
  /** Characters per second when streaming `text`. */
  speed?: number;
  /** Render the markdown subset. */
  markdown?: boolean;
  showCursor?: boolean;
  /** Fade-in length of new chunks, in ms. */
  fadeDuration?: number;
  /** How many recent chunks are still fading. */
  tail?: number;
  onDone?: () => void;
  fontSize?: number;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  codeBackground?: string;
  accentColor?: string;
  cursorColor?: string;
  fontFamily?: string;
  monoFontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function StreamingText({
  text = '',
  stream,
  speed = 60,
  markdown = true,
  showCursor = true,
  fadeDuration = 420,
  tail = 6,
  onDone,
  fontSize = 16,
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = 'rgba(255,255,255,0.2)',
  codeBackground = 'rgba(255,255,255,0.07)',
  accentColor = '#73eff7',
  cursorColor = '#73eff7',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  monoFontFamily = 'ui-monospace, SFMono-Regular, Menlo, monospace',
  className = '',
  style
}: StreamingTextProps) {
  useStyles();
  const [full, setFull] = useState(stream ? '' : text);
  const [shown, setShown] = useState(0);
  const [chunks, setChunks] = useState<number[]>([]);
  const [sourceDone, setSourceDone] = useState(!stream);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Real streams: append chunks as they arrive.
  useEffect(() => {
    if (!stream) {
      setFull(text);
      setShown(0);
      setChunks([]);
      setSourceDone(true);
      return undefined;
    }
    let cancelled = false;
    setFull('');
    setShown(0);
    setChunks([]);
    setSourceDone(false);
    (async () => {
      for await (const piece of stream) {
        if (cancelled) return;
        setFull(prev => prev + piece);
      }
      if (!cancelled) setSourceDone(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [stream, text]);

  // Reveal word by word at `speed` characters per second (or instantly as stream chunks land).
  useEffect(() => {
    if (shown >= full.length) return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const nextBreak = full.slice(shown).search(/\s\S/);
    const end = stream || reduced ? full.length : nextBreak < 0 ? full.length : shown + nextBreak + 1;
    const delay = stream ? 16 : Math.max(8, ((end - shown) / Math.max(1, speed)) * 1000);
    const timer = setTimeout(() => {
      setChunks(prev => [...prev.slice(-(tail - 1)), shown]);
      setShown(end);
    }, delay);
    return () => clearTimeout(timer);
  }, [shown, full, speed, stream, tail]);

  const done = sourceDone && shown >= full.length;
  useEffect(() => {
    if (done && full) onDoneRef.current?.();
  }, [done, full]);

  const visible = full.slice(0, shown);
  const fadeFrom = chunks[0] ?? Infinity;

  // Text nodes split at chunk starts in the fading tail; each fresh piece animates in once.
  const renderText = (node: MdText, key: string) => {
    const end = node.start + node.text.length;
    if (end <= fadeFrom) return <Fragment key={key}>{node.text}</Fragment>;
    const cuts = [node.start, ...chunks.filter(c => c > node.start && c < end), end];
    return cuts.slice(0, -1).map((from, j) => {
      const piece = node.text.slice(from - node.start, cuts[j + 1] - node.start);
      // Every chunk start is a cut, so a piece is fresh exactly when it starts in the tail.
      return from >= fadeFrom ? (
        <span key={`${key}-${from}`} className="animate-[bl-stream-in_var(--bl-fade)_ease_both] motion-reduce:animate-none">
          {piece}
        </span>
      ) : (
        <Fragment key={`${key}-${from}`}>{piece}</Fragment>
      );
    });
  };

  const renderNodes = (nodes: MdNode[]): ReactNode =>
    nodes.map((node, i) => {
      if (node.type === 'text') return renderText(node, `t${node.start}-${i}`);
      const children = renderNodes(node.children);
      if (node.type === 'strong') return <strong key={i}>{children}</strong>;
      if (node.type === 'em') return <em key={i}>{children}</em>;
      if (node.type === 'code') return <code key={i}>{children}</code>;
      if (node.type === 'link') return SAFE_HREF.test(node.href ?? '') ? <a key={i} href={node.href}>{children}</a> : <span key={i}>{children}</span>;
      return <Fragment key={i}>{children}</Fragment>;
    });

  const cursor = showCursor && !done ? <span className="ml-0.5 inline-block h-[1.1em] w-[0.55em] animate-[bl-stream-blink_1s_steps(1)_infinite] rounded-[2px] bg-(--bl-cursor) align-text-bottom motion-reduce:animate-none" aria-hidden="true" /> : null;
  const blocks: MdBlock[] = markdown ? parseBlocks(visible) : [{ type: 'p', children: [{ type: 'text', text: visible, start: 0 }] }];

  return (
    <div
      className={`text-(length:--bl-size) leading-[1.65] font-(family-name:--bl-font) text-(--bl-ink) [overflow-wrap:anywhere] *:first:mt-0 *:last:mb-0 [&_p]:mt-0 [&_p]:mb-[0.8em] [&_h1]:mt-[1em] [&_h1]:mb-[0.45em] [&_h1]:leading-[1.3] [&_h1]:font-bold [&_h1]:text-[1.45em] [&_h2]:mt-[1em] [&_h2]:mb-[0.45em] [&_h2]:leading-[1.3] [&_h2]:font-bold [&_h2]:text-[1.25em] [&_h3]:mt-[1em] [&_h3]:mb-[0.45em] [&_h3]:leading-[1.3] [&_h3]:font-bold [&_h3]:text-[1.08em] [&_ul]:mt-0 [&_ul]:mb-[0.8em] [&_ul]:list-disc [&_ul]:pl-[1.4em] [&_ol]:mt-0 [&_ol]:mb-[0.8em] [&_ol]:list-decimal [&_ol]:pl-[1.4em] [&_li]:my-[0.2em] [&_blockquote]:mx-0 [&_blockquote]:mt-0 [&_blockquote]:mb-[0.8em] [&_blockquote]:border-l-3 [&_blockquote]:border-solid [&_blockquote]:border-(--bl-line) [&_blockquote]:pl-[0.9em] [&_blockquote]:text-(--bl-muted) [&_code]:rounded-[5px] [&_code]:bg-(--bl-code-bg) [&_code]:px-[0.35em] [&_code]:py-[0.1em] [&_code]:font-(family-name:--bl-mono) [&_code]:text-[0.9em] [&_pre]:mt-0 [&_pre]:mb-[0.8em] [&_pre]:overflow-x-auto [&_pre]:rounded-[10px] [&_pre]:bg-(--bl-code-bg) [&_pre]:px-3.5 [&_pre]:py-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[0.86em] [&_pre_code]:leading-[1.55] [&_pre_code]:whitespace-pre [&_a]:text-(--bl-accent) [&_a]:underline [&_a]:underline-offset-2 ${className}`}
      aria-busy={!done}
      style={{
        '--bl-size': `${fontSize}px`,
        '--bl-ink': textColor,
        '--bl-muted': mutedColor,
        '--bl-line': lineColor,
        '--bl-code-bg': codeBackground,
        '--bl-accent': accentColor,
        '--bl-cursor': cursorColor,
        '--bl-fade': `${fadeDuration}ms`,
        '--bl-font': fontFamily,
        '--bl-mono': monoFontFamily,
        ...style
      } as CSSVars}
    >
      {blocks.map((block, i) => {
        const last = i === blocks.length - 1;
        const inner = renderNodes(block.children);
        if (block.type === 'pre')
          return (
            <pre key={i}>
              <code>
                {inner}
                {last && cursor}
              </code>
            </pre>
          );
        if (block.type === 'ul' || block.type === 'ol') {
          const List = block.type;
          return (
            <List key={i}>
              {block.children.map((item, j) => (
                <li key={j}>
                  {renderNodes((item as { children: MdNode[] }).children)}
                  {last && j === block.children.length - 1 && cursor}
                </li>
              ))}
            </List>
          );
        }
        const Tag = block.type;
        return (
          <Tag key={i}>
            {inner}
            {last && cursor}
          </Tag>
        );
      })}
      {!blocks.length && cursor}
      <span className="sr-only" role="status">
        {done && full ? 'Response complete.' : ''}
      </span>
    </div>
  );
}
