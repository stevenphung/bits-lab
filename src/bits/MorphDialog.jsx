import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// A card that grows into a dialog. The card's box animates (position, size, corner radius)
// into the dialog's box and back, so shared media at the top looks continuous. A real modal:
// focus moves in and is trapped, Esc and the backdrop close it, page scroll is locked, and
// focus returns to the card. Under reduced motion it simply fades.

const STYLE_ID = 'bl-morph-dialog';
const CSS = `
/* theme tokens */
.bl-morph-theme { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-line: rgba(255,255,255,0.1); --bl-accent: #73eff7; --bl-backdrop: rgba(10,10,20,0.6); }
:where(.light, [data-theme="light"]) .bl-morph-theme, .bl-morph-theme:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-line: rgba(26,28,44,0.1); --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-morph-theme, :where(.light, [data-theme="light"]) .bl-morph-theme:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-line: rgba(255,255,255,0.1); --bl-accent: #73eff7; --bl-backdrop: rgba(10,10,20,0.6); }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-morph-theme, .bl-morph-theme:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-line: rgba(26,28,44,0.1); --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-md__card { display: block; width: 100%; padding: 0; border: 0; overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); font: inherit; font-family: var(--bl-font, inherit); text-align: left; cursor: pointer; box-shadow: inset 0 0 0 1px var(--bl-line); transition: transform 200ms, box-shadow 200ms; }
.bl-md__card:hover { transform: translateY(-2px); box-shadow: inset 0 0 0 1px var(--bl-line), 0 12px 30px -16px rgba(0,0,0,0.6); }
.bl-md__card:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 3px; }
.bl-md__card[data-hidden] { visibility: hidden; }
.bl-md__media { overflow: hidden; }
.bl-md__media > img, .bl-md__media > video { display: block; width: 100%; height: 100%; object-fit: cover; }
.bl-md__card .bl-md__media { height: var(--bl-card-media); }
.bl-md__backdrop { position: fixed; inset: 0; z-index: 1000; background: var(--bl-backdrop); backdrop-filter: blur(var(--bl-blur)); -webkit-backdrop-filter: blur(var(--bl-blur)); }
.bl-md__shell { font-family: var(--bl-font, inherit); position: fixed; z-index: 1001; display: flex; flex-direction: column; overflow: hidden; background: var(--bl-bg); color: var(--bl-ink); box-shadow: 0 0 0 1px var(--bl-line), 0 40px 80px -30px rgba(0,0,0,0.7); outline: none; }
.bl-md__shell .bl-md__media { flex: 0 0 auto; height: var(--bl-dialog-media); }
.bl-md__body { flex: 1; min-height: 0; overflow-y: auto; padding: 24px; }
.bl-md__close { position: absolute; top: 12px; right: 12px; z-index: 2; display: grid; place-items: center; width: 34px; height: 34px; border: 0; border-radius: var(--bl-close-radius); background: rgba(0,0,0,0.55); color: #fff; cursor: pointer; }
.bl-md__close:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function lockScroll() {
  const { body, documentElement } = document;
  const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
  const gap = window.innerWidth - documentElement.clientWidth;
  body.style.overflow = 'hidden';
  if (gap > 0) body.style.paddingRight = `${gap}px`;
  return () => {
    Object.assign(body.style, previous);
  };
}

export default function MorphDialog({
  card,
  children,
  title,
  media,
  cardMediaHeight = 160,
  dialogMediaHeight = 260,
  width = 560,
  maxHeight = '85vh',
  radius = 18,
  duration = 480,
  open: controlledOpen,
  onOpenChange,
  backgroundColor,
  textColor,
  lineColor,
  accentColor,
  backdropColor,
  backdropBlur = 6,
  fontFamily,
  className = '',
  style
}) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const cardRef = useRef(null);
  const shellRef = useRef(null);
  const backdropRef = useRef(null);
  const bodyRef = useRef(null);
  const [innerOpen, setInnerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const closing = useRef(false);

  const setOpen = next => {
    if (controlledOpen === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };

  const vars = {
    '--bl-radius': `${radius}px`,
    '--bl-close-radius': radius ? '50%' : '0',
    '--bl-bg': backgroundColor,
    '--bl-ink': textColor,
    '--bl-line': lineColor,
    '--bl-accent': accentColor,
    '--bl-backdrop': backdropColor,
    '--bl-blur': `${backdropBlur}px`,
    '--bl-card-media': `${cardMediaHeight}px`,
    '--bl-dialog-media': `${dialogMediaHeight}px`,
    ...(fontFamily ? { '--bl-font': fontFamily } : null)
  };

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // Box of the card, and of the dialog at rest, both in viewport coordinates.
  const frames = () => {
    const from = cardRef.current.getBoundingClientRect();
    const w = Math.min(width, window.innerWidth - 32);
    const shell = shellRef.current;
    shell.style.width = `${w}px`;
    shell.style.height = 'auto';
    const h = shell.offsetHeight;
    const to = { left: (window.innerWidth - w) / 2, top: Math.max(16, (window.innerHeight - h) / 2), width: w, height: h };
    return { from, to };
  };
  const box = (r, rad) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: `${rad}px` });

  // Open: morph from the card to the dialog.
  useLayoutEffect(() => {
    if (!mounted || !open) return;
    const shell = shellRef.current;
    const { from, to } = frames();
    Object.assign(shell.style, box(to, radius));
    const unlock = lockScroll();
    const easing = 'cubic-bezier(.2,.9,.25,1)';
    if (reduced()) {
      shell.animate({ opacity: [0, 1] }, { duration: 160 });
    } else {
      shell.animate([box(from, radius), box(to, radius)], { duration, easing });
      bodyRef.current.animate({ opacity: [0, 0, 1], transform: ['translateY(12px)', 'translateY(12px)', 'none'] }, { duration: duration * 1.1, easing });
    }
    backdropRef.current.animate({ opacity: [0, 1] }, { duration: duration * 0.7, fill: 'both' });
    cardRef.current.setAttribute('data-hidden', '');
    (shell.querySelector('[data-autofocus]') ?? shell).focus({ preventScroll: true });
    return unlock;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, open]);

  // Close: morph back into wherever the card is now, then unmount.
  useEffect(() => {
    if (open || !mounted || closing.current) return;
    closing.current = true;
    const shell = shellRef.current;
    const finish = () => {
      closing.current = false;
      cardRef.current?.removeAttribute('data-hidden');
      setMounted(false);
      cardRef.current?.focus({ preventScroll: true });
    };
    if (!shell) return finish();
    const current = shell.getBoundingClientRect();
    const target = cardRef.current.getBoundingClientRect();
    backdropRef.current.animate({ opacity: [1, 0] }, { duration: duration * 0.7, fill: 'forwards' });
    const animation = reduced()
      ? shell.animate({ opacity: [1, 0] }, { duration: 140, fill: 'forwards' })
      : shell.animate([box(current, radius), box(target, radius)], { duration: duration * 0.85, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    if (!reduced()) bodyRef.current.animate({ opacity: [1, 0] }, { duration: duration * 0.3, fill: 'forwards' });
    animation.onfinish = finish;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  const onKeyDown = event => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const items = [...shellRef.current.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null || el === document.activeElement);
    if (!items.length) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === shellRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className={`bl-morph-theme ${className}`} style={{ ...vars, ...style }}>
      <button ref={cardRef} type="button" className="bl-md__card" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        {media && <div className="bl-md__media">{media}</div>}
        {card}
      </button>
      {mounted &&
        createPortal(
          <div className="bl-morph-theme" style={vars}>
            <div ref={backdropRef} className="bl-md__backdrop" onClick={() => setOpen(false)} />
            <div
              ref={shellRef}
              className="bl-md__shell"
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? `${uid}-title` : undefined}
              tabIndex={-1}
              onKeyDown={onKeyDown}
              style={{ maxHeight }}
            >
              <button type="button" className="bl-md__close" aria-label="Close" onClick={() => setOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M2 2l10 10M12 2 2 12" />
                </svg>
              </button>
              {media && <div className="bl-md__media">{media}</div>}
              <div ref={bodyRef} className="bl-md__body">
                {title && (
                  <h2 id={`${uid}-title`} style={{ margin: '0 0 12px', font: 'inherit', fontSize: '1.4em', fontWeight: 700 }}>
                    {title}
                  </h2>
                )}
                {children}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
