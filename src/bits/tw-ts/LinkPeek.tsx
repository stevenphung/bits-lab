import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// A link that previews where it goes. Hovering (after a short delay) or focusing it springs
// up a card with an image, title, description and site, tilted gently toward the pointer.
// Pass the preview directly or a `load(href)` function (results are cached); a shimmer
// shows while it loads. The card describes the link for screen readers, Esc hides it, and
// it flips below the link when there's no room above.

export interface LinkPreview {
  title?: string;
  description?: string;
  image?: string;
  imageStyle?: CSSProperties;
  /** Defaults to the link's hostname. */
  site?: string;
}

export interface LinkPeekProps {
  href: string;
  children?: ReactNode;
  /** The card content, when you already have it. */
  preview?: LinkPreview;
  /** Fetches the preview on first open; results are cached per href. */
  load?: (href: string) => Promise<LinkPreview> | LinkPreview;
  /** Hover delay in ms (focus shows at once). */
  delay?: number;
  width?: number;
  imageHeight?: number;
  /** Lean toward the pointer, in degrees. */
  tilt?: number;
  target?: string;
  rel?: string;
  backgroundColor?: string;
  textColor?: string;
  mutedColor?: string;
  lineColor?: string;
  accentColor?: string;
  linkColor?: string;
  radius?: number;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

const STYLE_ID = 'bl-link-peek-tw';
const CSS = `
/* theme tokens */
:is(.bl-peek-link, .bl-peek) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) :is(.bl-peek-link, .bl-peek), :is(.bl-peek-link, .bl-peek):where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) :is(.bl-peek-link, .bl-peek), :where(.light, [data-theme="light"]) :is(.bl-peek-link, .bl-peek):where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-muted: #94b0c2; --bl-line: #333c57; --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) :is(.bl-peek-link, .bl-peek), :is(.bl-peek-link, .bl-peek):where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-muted: #566c86; --bl-line: #cfc4ad; --bl-accent: #167f8f; } }
/* theme tokens end */
@keyframes bl-peek-in { from { opacity: 0; transform: translateY(var(--bl-from)) scale(0.92) rotate(0deg); } }
@keyframes bl-peek-out { to { opacity: 0; transform: translateY(var(--bl-from)) scale(0.96); } }
@keyframes bl-peek-shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }
@keyframes bl-peek-fade { from { opacity: 0; } }
@keyframes bl-peek-fade-out { to { opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const cache = new Map<string, LinkPreview>();
const siteOf = (href: string) => {
  try {
    return new URL(href, window.location.href).hostname.replace(/^www\./, '');
  } catch {
    return href;
  }
};

export default function LinkPeek({
  href,
  children,
  preview,
  load,
  delay = 350,
  width = 280,
  imageHeight = 140,
  tilt = 4,
  target,
  rel,
  backgroundColor,
  textColor,
  mutedColor,
  lineColor,
  accentColor,
  linkColor,
  radius = 12,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}: LinkPeekProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const linkRef = useRef<HTMLAnchorElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | number>(0);
  const [phase, setPhase] = useState<'closed' | 'open' | 'closing'>('closed');
  const [data, setData] = useState<LinkPreview | null>(preview ?? cache.get(href) ?? null);
  const [placement, setPlacement] = useState({ x: 0, y: 0, below: false });

  useEffect(() => setData(preview ?? cache.get(href) ?? null), [preview, href]);

  // Fetch lazily the first time it opens.
  useEffect(() => {
    if (phase !== 'open' || data || !load) return undefined;
    let alive = true;
    Promise.resolve(load(href))
      .then(result => {
        cache.set(href, result);
        if (alive) setData(result);
      })
      .catch(() => alive && setData({ title: siteOf(href), description: 'Preview unavailable.' }));
    return () => {
      alive = false;
    };
  }, [phase, data, load, href]);

  const show = (wait: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPhase('open'), wait);
  };
  const hide = (wait: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPhase(p => (p === 'open' ? 'closing' : p)), wait);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  // Place the card above the link (or below when there's no room), inside the viewport.
  useLayoutEffect(() => {
    if (phase !== 'open') return undefined;
    const place = () => {
      const link = linkRef.current?.getBoundingClientRect();
      const card = cardRef.current;
      if (!link || !card) return;
      const h = card.offsetHeight;
      const below = link.top - h - 12 < 8;
      const x = Math.max(8, Math.min(window.innerWidth - width - 8, link.left + link.width / 2 - width / 2));
      const y = below ? link.bottom + 10 : link.top - h - 10;
      setPlacement({ x, y, below });
    };
    place();
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    const resize = new ResizeObserver(place);
    if (cardRef.current) resize.observe(cardRef.current);
    return () => {
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
      resize.disconnect();
    };
  }, [phase, width]);

  useEffect(() => {
    if (phase !== 'open') return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPhase('closing');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase]);

  const onMove = (event: ReactPointerEvent<HTMLAnchorElement>) => {
    if (phase !== 'open' || !cardRef.current) return;
    const rect = linkRef.current!.getBoundingClientRect();
    const offset = (event.clientX - (rect.left + rect.width / 2)) / Math.max(40, rect.width / 2);
    cardRef.current.style.setProperty('--bl-tilt', `${(Math.max(-1, Math.min(1, offset)) * tilt).toFixed(2)}deg`);
  };

  const site = data?.site ?? siteOf(href);
  const vars: CSSVars = {
    '--bl-w': `${width}px`,
    '--bl-img-h': `${imageHeight}px`,
    '--bl-bg': backgroundColor,
    '--bl-ink': textColor,
    '--bl-muted': mutedColor,
    '--bl-line': lineColor,
    '--bl-accent': accentColor,
    '--bl-link': linkColor,
    '--bl-radius': `${radius}px`,
    '--bl-font': fontFamily
  };

  return (
    <>
      <a
        ref={linkRef}
        href={href}
        target={target}
        rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
        className={`bl-peek-link text-[var(--bl-link,inherit)] underline decoration-1 underline-offset-3 focus-visible:rounded-[2px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) ${className}`}
        aria-describedby={phase === 'open' && data ? `${uid}-desc` : undefined}
        style={{ ...vars, ...style }}
        onPointerEnter={event => event.pointerType === 'mouse' && show(delay)}
        onPointerMove={onMove}
        onPointerLeave={() => hide(120)}
        onFocus={() => show(0)}
        onBlur={() => hide(0)}
      >
        {children}
      </a>
      {phase !== 'closed' &&
        createPortal(
          <div
            className="bl-peek group/peek pointer-events-none fixed top-0 left-0 z-1700 w-(--bl-w) font-(family-name:--bl-font)"
            data-closing={phase === 'closing' || undefined}
            aria-hidden="true"
            style={{ ...vars, transform: `translate(${placement.x}px, ${placement.y}px)`, '--bl-from': placement.below ? '-8px' : '8px', '--bl-origin': placement.below ? 'top center' : 'bottom center' } as CSSVars}
          >
            <div ref={cardRef} className="animate-[bl-peek-in_320ms_cubic-bezier(.3,1.4,.5,1)_backwards] overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line),0_24px_50px_-20px_rgba(0,0,0,0.8)] [transform-origin:var(--bl-origin)] [transform:rotate(var(--bl-tilt,0deg))] [transition:transform_200ms_ease-out] group-data-[closing]/peek:animate-[bl-peek-out_140ms_ease-in_both] motion-reduce:[animation-name:bl-peek-fade] motion-reduce:[transform:none] motion-reduce:[transition:none] motion-reduce:group-data-[closing]/peek:[animation-name:bl-peek-fade-out]" onAnimationEnd={() => phase === 'closing' && setPhase('closed')}>
              {data ? (
                <>
                  {data.image && <img className="block h-(--bl-img-h) w-full bg-(--bl-line) object-cover" src={data.image} alt="" style={data.imageStyle} />}
                  <div className="grid gap-1 px-3.5 pt-3 pb-3.5">
                    <span className="text-[12px] font-semibold text-(--bl-accent)">{site}</span>
                    <span className="text-[15px] leading-[1.3] font-bold">{data.title}</span>
                    {data.description && <span className="line-clamp-3 text-[13px] leading-[1.45] text-(--bl-muted)">{data.description}</span>}
                  </div>
                </>
              ) : (
                <>
                  <div className="block h-(--bl-img-h) w-full object-cover animate-[bl-peek-shimmer_1.2s_linear_infinite] rounded-[4px] [background:linear-gradient(90deg,var(--bl-line)_0_40%,color-mix(in_srgb,var(--bl-line)_60%,var(--bl-ink))_50%,var(--bl-line)_60%_100%)_0_0/300%_100%] motion-reduce:animate-none" style={{ borderRadius: 0 }} />
                  <div className="grid gap-1 px-3.5 pt-3 pb-3.5">
                    <span className="animate-[bl-peek-shimmer_1.2s_linear_infinite] rounded-[4px] [background:linear-gradient(90deg,var(--bl-line)_0_40%,color-mix(in_srgb,var(--bl-line)_60%,var(--bl-ink))_50%,var(--bl-line)_60%_100%)_0_0/300%_100%] motion-reduce:animate-none" style={{ height: 12, width: '40%' }} />
                    <span className="animate-[bl-peek-shimmer_1.2s_linear_infinite] rounded-[4px] [background:linear-gradient(90deg,var(--bl-line)_0_40%,color-mix(in_srgb,var(--bl-line)_60%,var(--bl-ink))_50%,var(--bl-line)_60%_100%)_0_0/300%_100%] motion-reduce:animate-none" style={{ height: 16, width: '80%' }} />
                    <span className="animate-[bl-peek-shimmer_1.2s_linear_infinite] rounded-[4px] [background:linear-gradient(90deg,var(--bl-line)_0_40%,color-mix(in_srgb,var(--bl-line)_60%,var(--bl-ink))_50%,var(--bl-line)_60%_100%)_0_0/300%_100%] motion-reduce:animate-none" style={{ height: 12, width: '95%' }} />
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
      {data && (
        <span id={`${uid}-desc`} className="sr-only">
          {`Preview: ${data.title ?? site}. ${data.description ?? ''}`}
        </span>
      )}
    </>
  );
}
