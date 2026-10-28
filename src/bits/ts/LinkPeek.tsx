import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

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

const STYLE_ID = 'bl-link-peek';
const CSS = `
.bl-peek-link { color: var(--bl-link, inherit); text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 3px; }
.bl-peek-link:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; border-radius: 2px; }
.bl-peek { position: fixed; top: 0; left: 0; z-index: 1700; width: var(--bl-w); pointer-events: none; font-family: var(--bl-font); }
.bl-peek__card { overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); box-shadow: 0 0 0 1px var(--bl-line), 0 24px 50px -20px rgba(0,0,0,0.8); transform-origin: var(--bl-origin); animation: bl-peek-in 320ms cubic-bezier(.3,1.4,.5,1) backwards; transform: rotate(var(--bl-tilt, 0deg)); transition: transform 200ms ease-out; }
.bl-peek[data-closing] .bl-peek__card { animation: bl-peek-out 140ms ease-in both; }
.bl-peek__image { display: block; width: 100%; height: var(--bl-img-h); object-fit: cover; background: var(--bl-line); }
.bl-peek__body { display: grid; gap: 4px; padding: 12px 14px 14px; }
.bl-peek__site { color: var(--bl-accent); font-size: 12px; font-weight: 600; }
.bl-peek__title { font-size: 15px; font-weight: 700; line-height: 1.3; }
.bl-peek__desc { color: var(--bl-muted); font-size: 13px; line-height: 1.45; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; overflow: hidden; }
.bl-peek__shimmer { background: linear-gradient(90deg, var(--bl-line) 0 40%, color-mix(in srgb, var(--bl-line) 60%, var(--bl-ink)) 50%, var(--bl-line) 60% 100%); background-size: 300% 100%; animation: bl-peek-shimmer 1.2s linear infinite; border-radius: 4px; }
.bl-peek__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-peek-in { from { opacity: 0; transform: translateY(var(--bl-from)) scale(0.92) rotate(0deg); } }
@keyframes bl-peek-out { to { opacity: 0; transform: translateY(var(--bl-from)) scale(0.96); } }
@keyframes bl-peek-shimmer { from { background-position: 100% 0; } to { background-position: 0 0; } }
@media (prefers-reduced-motion: reduce) { .bl-peek__card { animation-name: bl-peek-fade; transition: none; transform: none; } .bl-peek[data-closing] .bl-peek__card { animation-name: bl-peek-fade-out; } .bl-peek__shimmer { animation: none; } }
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
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  lineColor = '#333c57',
  accentColor = '#73eff7',
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
        className={`bl-peek-link ${className}`}
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
            className="bl-peek"
            data-closing={phase === 'closing' || undefined}
            aria-hidden="true"
            style={{ ...vars, transform: `translate(${placement.x}px, ${placement.y}px)`, '--bl-from': placement.below ? '-8px' : '8px', '--bl-origin': placement.below ? 'top center' : 'bottom center' } as CSSVars}
          >
            <div ref={cardRef} className="bl-peek__card" onAnimationEnd={() => phase === 'closing' && setPhase('closed')}>
              {data ? (
                <>
                  {data.image && <img className="bl-peek__image" src={data.image} alt="" style={data.imageStyle} />}
                  <div className="bl-peek__body">
                    <span className="bl-peek__site">{site}</span>
                    <span className="bl-peek__title">{data.title}</span>
                    {data.description && <span className="bl-peek__desc">{data.description}</span>}
                  </div>
                </>
              ) : (
                <>
                  <div className="bl-peek__image bl-peek__shimmer" style={{ borderRadius: 0 }} />
                  <div className="bl-peek__body">
                    <span className="bl-peek__shimmer" style={{ height: 12, width: '40%' }} />
                    <span className="bl-peek__shimmer" style={{ height: 16, width: '80%' }} />
                    <span className="bl-peek__shimmer" style={{ height: 12, width: '95%' }} />
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
      {data && (
        <span id={`${uid}-desc`} className="bl-peek__sr">
          {`Preview: ${data.title ?? site}. ${data.description ?? ''}`}
        </span>
      )}
    </>
  );
}
