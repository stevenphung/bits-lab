import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A card that grows into a dialog. The card's box animates (position, size, corner radius)
// into the dialog's box and back, so shared media at the top looks continuous. A real modal:
// focus moves in and is trapped, Esc and the backdrop close it, page scroll is locked, and
// focus returns to the card. Under reduced motion it simply fades.

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

export interface MorphDialogProps {
  /** Card content below the shared media. The card is a button. */
  card?: ReactNode;
  /** Dialog content. Mark an element with data-autofocus to focus it on open. */
  children?: ReactNode;
  /** Dialog heading; also its accessible name. */
  title?: ReactNode;
  /** Shared image or video at the top of both the card and the dialog. */
  media?: ReactNode;
  cardMediaHeight?: number;
  dialogMediaHeight?: number;
  /** Dialog width, in px. */
  width?: number;
  /** Dialog max height (any CSS length); the body scrolls beyond it. */
  maxHeight?: string;
  radius?: number;
  /** Morph length, in ms. */
  duration?: number;
  /** Controlled open state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  backgroundColor?: string;
  textColor?: string;
  lineColor?: string;
  accentColor?: string;
  backdropColor?: string;
  /** Backdrop blur, in px. */
  backdropBlur?: number;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

interface Frame {
  left: number;
  top: number;
  width: number;
  height: number;
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
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  lineColor = 'rgba(255,255,255,0.1)',
  accentColor = '#73eff7',
  backdropColor = 'rgba(10,10,20,0.6)',
  backdropBlur = 6,
  fontFamily,
  className = '',
  style
}: MorphDialogProps) {
  
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const cardRef = useRef<HTMLButtonElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [innerOpen, setInnerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const closing = useRef(false);

  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };

  const vars: CSSVars = {
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
    const from = cardRef.current!.getBoundingClientRect();
    const w = Math.min(width, window.innerWidth - 32);
    const shell = shellRef.current!;
    shell.style.width = `${w}px`;
    shell.style.height = 'auto';
    const h = shell.offsetHeight;
    const to = { left: (window.innerWidth - w) / 2, top: Math.max(16, (window.innerHeight - h) / 2), width: w, height: h };
    return { from, to };
  };
  const box = (r: Frame, rad: number) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`, borderRadius: `${rad}px` });

  // Open: morph from the card to the dialog.
  useLayoutEffect(() => {
    if (!mounted || !open) return;
    const shell = shellRef.current!;
    const { from, to } = frames();
    Object.assign(shell.style, box(to, radius));
    const unlock = lockScroll();
    const easing = 'cubic-bezier(.2,.9,.25,1)';
    if (reduced()) {
      shell.animate({ opacity: [0, 1] }, { duration: 160 });
    } else {
      shell.animate([box(from, radius), box(to, radius)], { duration, easing });
      bodyRef.current!.animate({ opacity: [0, 0, 1], transform: ['translateY(12px)', 'translateY(12px)', 'none'] }, { duration: duration * 1.1, easing });
    }
    backdropRef.current!.animate({ opacity: [0, 1] }, { duration: duration * 0.7, fill: 'both' });
    cardRef.current!.setAttribute('data-hidden', '');
    (shell.querySelector<HTMLElement>('[data-autofocus]') ?? shell).focus({ preventScroll: true });
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
    const target = cardRef.current!.getBoundingClientRect();
    backdropRef.current!.animate({ opacity: [1, 0] }, { duration: duration * 0.7, fill: 'forwards' });
    const animation = reduced()
      ? shell.animate({ opacity: [1, 0] }, { duration: 140, fill: 'forwards' })
      : shell.animate([box(current, radius), box(target, radius)], { duration: duration * 0.85, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    if (!reduced()) bodyRef.current!.animate({ opacity: [1, 0] }, { duration: duration * 0.3, fill: 'forwards' });
    animation.onfinish = finish;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      setOpen(false);
      return;
    }
    if (event.key !== 'Tab') return;
    const items = [...shellRef.current!.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null || el === document.activeElement);
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
    <div className={className} style={{ ...vars, ...style }}>
      <button ref={cardRef} type="button" className="block w-full cursor-pointer overflow-hidden rounded-(--bl-radius) border-0 bg-(--bl-bg) p-0 text-left [font-family:var(--bl-font,inherit)] text-(--bl-ink) shadow-[inset_0_0_0_1px_var(--bl-line)] [transition:transform_200ms,box-shadow_200ms] hover:[transform:translateY(-2px)] hover:shadow-[inset_0_0_0_1px_var(--bl-line),0_12px_30px_-16px_rgba(0,0,0,0.6)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--bl-accent) data-[hidden]:invisible" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
        {media && <div className="h-(--bl-card-media) overflow-hidden [&>img]:block [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>video]:block [&>video]:h-full [&>video]:w-full [&>video]:object-cover">{media}</div>}
        {card}
      </button>
      {mounted &&
        createPortal(
          <div style={vars}>
            <div ref={backdropRef} className="fixed inset-0 z-1000 bg-(--bl-backdrop) backdrop-blur-(--bl-blur)" onClick={() => setOpen(false)} />
            <div
              ref={shellRef}
              className="fixed z-1001 flex flex-col overflow-hidden bg-(--bl-bg) [font-family:var(--bl-font,inherit)] text-(--bl-ink) shadow-[0_0_0_1px_var(--bl-line),0_40px_80px_-30px_rgba(0,0,0,0.7)] outline-none"
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? `${uid}-title` : undefined}
              tabIndex={-1}
              onKeyDown={onKeyDown}
              style={{ maxHeight }}
            >
              <button type="button" className="absolute top-3 right-3 z-2 grid size-[34px] cursor-pointer place-items-center rounded-(--bl-close-radius) border-0 bg-[rgba(0,0,0,0.55)] text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent)" aria-label="Close" onClick={() => setOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M2 2l10 10M12 2 2 12" />
                </svg>
              </button>
              {media && <div className="h-(--bl-dialog-media) flex-none overflow-hidden [&>img]:block [&>img]:h-full [&>img]:w-full [&>img]:object-cover [&>video]:block [&>video]:h-full [&>video]:w-full [&>video]:object-cover">{media}</div>}
              <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto p-6">
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
