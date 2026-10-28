import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// A button that grows into a panel (a feedback form, a quick menu, a share sheet) from the
// spot where it sits, then shrinks back into the button. The panel is a labelled dialog:
// focus moves into it, Esc or a click outside closes it, and focus returns to the button.

export default function MorphPopover({
  label = 'Feedback',
  icon,
  children,
  panelLabel,
  panelWidth = 320,
  align = 'start',
  side = 'bottom',
  height = 42,
  radius = 14,
  duration = 380,
  open: controlledOpen,
  onOpenChange,
  backgroundColor = '#1a1c2c',
  textColor = '#f4f4f4',
  lineColor = 'rgba(255,255,255,0.14)',
  accentColor = '#73eff7',
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const shellRef = useRef(null);
  const panelRef = useRef(null);
  const ghostRef = useRef(null);
  const [innerOpen, setInnerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const open = controlledOpen ?? innerOpen;
  const closing = useRef(false);

  const setOpen = next => {
    if (controlledOpen === undefined) setInnerOpen(next);
    onOpenChange?.(next);
  };
  const close = () => setOpen(false);

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const size = (w, h) => ({ width: `${w}px`, height: `${h}px` });

  useLayoutEffect(() => {
    if (!mounted || !open) return;
    const button = buttonRef.current;
    const panel = panelRef.current;
    const from = [button.offsetWidth, button.offsetHeight];
    const width = Math.min(panelWidth, window.innerWidth - 32);
    panel.style.width = `${width}px`;
    const to = [width, panel.offsetHeight];
    Object.assign(shellRef.current.style, size(...to));
    button.setAttribute('data-hidden', '');
    if (!reduced()) {
      const easing = 'cubic-bezier(.2,.9,.25,1.05)';
      shellRef.current.animate([size(...from), size(...to)], { duration, easing });
      panel.animate({ opacity: [0, 0, 1], filter: ['blur(4px)', 'blur(4px)', 'none'] }, { duration, easing: 'ease-out' });
      ghostRef.current.animate({ opacity: [1, 0, 0] }, { duration: duration * 0.6, fill: 'forwards' });
    } else {
      ghostRef.current.style.opacity = '0';
    }
    (panel.querySelector('input, textarea, select, button, [href], [tabindex]:not([tabindex="-1"])') ?? shellRef.current).focus({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, open]);

  useEffect(() => {
    if (open || !mounted || closing.current) return;
    closing.current = true;
    const shell = shellRef.current;
    const button = buttonRef.current;
    const finish = () => {
      closing.current = false;
      button.removeAttribute('data-hidden');
      setMounted(false);
      if (rootRef.current?.contains(document.activeElement) || document.activeElement === document.body) button.focus({ preventScroll: true });
    };
    if (reduced()) return finish();
    const from = [shell.offsetWidth, shell.offsetHeight];
    const to = [button.offsetWidth, button.offsetHeight];
    panelRef.current.animate({ opacity: [1, 0] }, { duration: duration * 0.35, fill: 'forwards' });
    ghostRef.current.animate({ opacity: [0, 1] }, { duration: duration * 0.5, delay: duration * 0.4, fill: 'forwards' });
    shell.animate([size(...from), size(...to)], { duration: duration * 0.9, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' }).onfinish = finish;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  // Close on a pointer press outside.
  useEffect(() => {
    if (!open) return;
    const onDown = event => {
      if (!rootRef.current.contains(event.target)) close();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`group/mp relative inline-block align-top font-(family-name:--bl-font) ${className}`}
      data-align={align}
      data-side={side}
      style={{
        '--bl-h': `${height}px`,
        '--bl-radius': `${radius}px`,
        '--bl-bg': backgroundColor,
        '--bl-ink': textColor,
        '--bl-line': lineColor,
        '--bl-accent': accentColor,
        '--bl-font': fontFamily,
        '--bl-panel-w': `${panelWidth}px`,
        ...style
      }}
    >
      <button ref={buttonRef} type="button" className="inline-flex h-(--bl-h) cursor-pointer items-center gap-2 rounded-(--bl-radius) border-0 bg-(--bl-bg) px-[18px] font-semibold whitespace-nowrap text-(--bl-ink) shadow-[inset_0_0_0_1px_var(--bl-line)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--bl-accent) data-[hidden]:invisible" aria-haspopup="dialog" aria-expanded={open} aria-controls={mounted ? `${uid}-panel` : undefined} onClick={() => setOpen(!open)}>
        {icon}
        {label}
      </button>
      {mounted && (
        <div
          ref={shellRef}
          id={`${uid}-panel`}
          className="absolute z-50 overflow-hidden rounded-(--bl-radius) bg-(--bl-bg) text-(--bl-ink) shadow-[inset_0_0_0_1px_var(--bl-line),0_24px_50px_-20px_rgba(0,0,0,0.65)] outline-none group-data-[align=center]/mp:left-1/2 group-data-[align=center]/mp:[transform:translateX(-50%)] group-data-[align=end]/mp:right-0 group-data-[align=start]/mp:left-0 group-data-[side=bottom]/mp:top-0 group-data-[side=top]/mp:bottom-0"
          role="dialog"
          aria-label={panelLabel ?? (typeof label === 'string' ? label : undefined)}
          tabIndex={-1}
          onKeyDown={event => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              close();
            }
          }}
        >
          <div ref={ghostRef} className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 font-semibold whitespace-nowrap" aria-hidden="true">
            {icon}
            {label}
          </div>
          <div ref={panelRef} className="w-(--bl-panel-w) p-4">
            {typeof children === 'function' ? children({ close }) : children}
          </div>
        </div>
      )}
    </div>
  );
}
