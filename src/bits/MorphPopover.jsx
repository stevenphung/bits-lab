import { useEffect, useId, useInsertionEffect, useLayoutEffect, useRef, useState } from 'react';

// A button that grows into a panel (a feedback form, a quick menu, a share sheet) from the
// spot where it sits, then shrinks back into the button. The panel is a labelled dialog:
// focus moves into it, Esc or a click outside closes it, and focus returns to the button.

const STYLE_ID = 'bl-morph-popover';
const CSS = `
/* theme tokens */
.bl-mp { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-line: rgba(255,255,255,0.14); --bl-accent: #73eff7; }
:where(.light, [data-theme="light"]) .bl-mp, .bl-mp:where(.light, [data-theme="light"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-line: rgba(26,28,44,0.14); --bl-accent: #167f8f; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-mp, :where(.light, [data-theme="light"]) .bl-mp:where(.dark, [data-theme="dark"]) { --bl-bg: #1a1c2c; --bl-ink: #f4f4f4; --bl-line: rgba(255,255,255,0.14); --bl-accent: #73eff7; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-mp, .bl-mp:where([data-theme="system"]) { --bl-bg: #f4f1e8; --bl-ink: #1a1c2c; --bl-line: rgba(26,28,44,0.14); --bl-accent: #167f8f; } }
/* theme tokens end */
.bl-mp { position: relative; display: inline-block; vertical-align: top; font-family: var(--bl-font); }
.bl-mp__button { display: inline-flex; align-items: center; gap: 8px; height: var(--bl-h); padding: 0 18px; border: 0; border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); font: inherit; font-weight: 600; cursor: pointer; box-shadow: inset 0 0 0 1px var(--bl-line); white-space: nowrap; }
.bl-mp__button:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-mp__button[data-hidden] { visibility: hidden; }
.bl-mp__shell { position: absolute; z-index: 50; overflow: hidden; border-radius: var(--bl-radius); background: var(--bl-bg); color: var(--bl-ink); box-shadow: inset 0 0 0 1px var(--bl-line), 0 24px 50px -20px rgba(0,0,0,0.65); outline: none; }
.bl-mp[data-align="start"] .bl-mp__shell { left: 0; }
.bl-mp[data-align="end"] .bl-mp__shell { right: 0; }
.bl-mp[data-align="center"] .bl-mp__shell { left: 50%; transform: translateX(-50%); }
.bl-mp[data-side="bottom"] .bl-mp__shell { top: 0; }
.bl-mp[data-side="top"] .bl-mp__shell { bottom: 0; }
.bl-mp__ghost { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600; white-space: nowrap; pointer-events: none; }
.bl-mp__panel { width: var(--bl-panel-w); padding: 16px; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

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
  backgroundColor,
  textColor,
  lineColor,
  accentColor,
  fontFamily = 'ui-sans-serif, system-ui, sans-serif',
  className = '',
  style
}) {
  useStyles();
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
      className={`bl-mp ${className}`}
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
      <button ref={buttonRef} type="button" className="bl-mp__button" aria-haspopup="dialog" aria-expanded={open} aria-controls={mounted ? `${uid}-panel` : undefined} onClick={() => setOpen(!open)}>
        {icon}
        {label}
      </button>
      {mounted && (
        <div
          ref={shellRef}
          id={`${uid}-panel`}
          className="bl-mp__shell"
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
          <div ref={ghostRef} className="bl-mp__ghost" aria-hidden="true">
            {icon}
            {label}
          </div>
          <div ref={panelRef} className="bl-mp__panel">
            {typeof children === 'function' ? children({ close }) : children}
          </div>
        </div>
      )}
    </div>
  );
}
