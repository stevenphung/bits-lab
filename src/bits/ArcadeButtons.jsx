import { useEffect, useInsertionEffect, useRef, useState } from 'react';

// Buttons with a personality. "dodge" scoots out of the way when the pointer comes near, a few
// times, before giving in (the keyboard can always press it); "launch" rumbles and blasts off
// when pressed, leaving a puff of pixel smoke, then drops back in; "sling" stretches as you pull
// it and snaps back when you let go, firing if you pulled far enough. All are real buttons;
// reduced motion turns them into plain ones.

const STYLE_ID = 'bl-arcade-buttons';
const CSS = `
.bl-arcade { position: relative; display: inline-block; transform: translate(var(--dx), var(--dy)); transition: transform 260ms cubic-bezier(.3,1.5,.5,1); }
.bl-arcade__btn { position: relative; display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border: 0; border-radius: 4px; background: var(--bl-bg); color: var(--bl-ink); font: inherit; font-family: var(--bl-font); font-size: 15px; font-weight: 700; cursor: pointer; box-shadow: inset -4px -4px 0 rgba(0,0,0,0.3), inset 4px 4px 0 rgba(255,255,255,0.25), 0 4px 0 rgba(0,0,0,0.45); touch-action: none; user-select: none; transform: translate(var(--sx, 0px), var(--sy, 0px)) scale(var(--scx, 1), var(--scy, 1)); transition: transform 420ms cubic-bezier(.3,1.8,.4,1); }
.bl-arcade__btn:active { box-shadow: inset 4px 4px 0 rgba(0,0,0,0.3), 0 1px 0 rgba(0,0,0,0.45); translate: 0 3px; }
.bl-arcade__btn:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 3px; }
.bl-arcade__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.bl-arcade[data-state="rumble"] .bl-arcade__btn { animation: bl-arcade-rumble 70ms steps(2) infinite; }
.bl-arcade[data-state="flying"] .bl-arcade__btn { animation: bl-arcade-launch 520ms cubic-bezier(.5,0,.9,.4) forwards; }
.bl-arcade[data-state="landing"] .bl-arcade__btn { animation: bl-arcade-land 420ms cubic-bezier(.2,1.4,.4,1) both; }
.bl-arcade__smoke { position: absolute; left: 50%; bottom: -6px; width: 10px; height: 10px; margin-left: -5px; background: var(--bl-smoke); opacity: 0; pointer-events: none; }
.bl-arcade[data-state="flying"] .bl-arcade__smoke { animation: bl-arcade-puff 600ms steps(5) forwards; }
.bl-arcade[data-state="flying"] .bl-arcade__smoke:nth-child(2) { --side: -1; animation-delay: 60ms; }
.bl-arcade[data-state="flying"] .bl-arcade__smoke:nth-child(3) { --side: 1; animation-delay: 120ms; }
.bl-arcade[data-pulling] { transition: none; }
.bl-arcade[data-pulling] .bl-arcade__btn { transition: none; }
@keyframes bl-arcade-rumble { 50% { transform: translate(1px, -1px); } }
@keyframes bl-arcade-launch { to { transform: translateY(-140vh) scaleY(1.2); } }
@keyframes bl-arcade-land { from { transform: translateY(-60px); opacity: 0; } }
@keyframes bl-arcade-puff { 0% { opacity: 0.9; transform: scale(0.6); } 100% { opacity: 0; transform: translate(calc(var(--side, 0) * 18px), 10px) scale(2.4); } }
@media (prefers-reduced-motion: reduce) { .bl-arcade, .bl-arcade__btn { transition: none !important; animation: none !important; transform: none !important; } .bl-arcade__smoke { display: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export default function ArcadeButtons({
  children,
  behavior = 'launch',
  onClick,
  maxDodges = 5,
  dodgeRadius = 70,
  pull = 90,
  disabled = false,
  color = '#b13e53',
  textColor = '#f4f4f4',
  smokeColor = '#94b0c2',
  accentColor = '#73eff7',
  fontFamily = 'inherit',
  className = '',
  style
}) {
  useStyles();
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [state, setState] = useState('idle');
  const dodges = useRef(0);
  const timers = useRef([]);
  const clickRef = useRef(onClick);
  clickRef.current = onClick;
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Dodge: when a mouse pointer gets close, hop away (a few times), staying near home.
  useEffect(() => {
    if (behavior !== 'dodge') return undefined;
    dodges.current = 0;
    setOffset({ x: 0, y: 0 });
    const onMove = event => {
      if (event.pointerType !== 'mouse' || dodges.current >= maxDodges || reduced()) return;
      const r = btnRef.current.getBoundingClientRect();
      const dx = event.clientX - (r.left + r.width / 2);
      const dy = event.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx / (r.width / 2 + dodgeRadius), dy / (r.height / 2 + dodgeRadius)) > 1) return;
      dodges.current += 1;
      const away = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 1.2;
      setOffset(o => {
        const nx = o.x + Math.cos(away) * (r.width * 0.9);
        const ny = o.y + Math.sin(away) * (r.height * 1.6);
        // Leash it, so it never runs far from where it started.
        const len = Math.hypot(nx, ny);
        const max = r.width * 1.6;
        return len > max ? { x: (nx / len) * max * 0.5, y: (ny / len) * max * 0.5 } : { x: nx, y: ny };
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [behavior, maxDodges, dodgeRadius]);

  // Sling: drag stretches the button toward the pointer; release snaps back (and fires if far).
  useEffect(() => {
    if (behavior !== 'sling') return undefined;
    const btn = btnRef.current;
    const wrap = wrapRef.current;
    let drag = null;
    const paint = (x, y) => {
      const d = Math.min(1, Math.hypot(x, y) / pull);
      btn.style.setProperty('--sx', `${x}px`);
      btn.style.setProperty('--sy', `${y}px`);
      btn.style.setProperty('--scx', (1 + d * 0.25).toFixed(3));
      btn.style.setProperty('--scy', (1 - d * 0.18).toFixed(3));
    };
    const onDown = event => {
      if (event.button > 0 || reduced() || btn.disabled) return;
      drag = { x: event.clientX, y: event.clientY, far: false };
      btn.setPointerCapture?.(event.pointerId);
      wrap.dataset.pulling = '';
    };
    const onMove = event => {
      if (!drag) return;
      let x = event.clientX - drag.x;
      let y = event.clientY - drag.y;
      const len = Math.hypot(x, y);
      // Elastic: the further you pull, the harder it resists.
      const k = len > 0 ? (pull * (1 - Math.exp(-len / pull))) / len : 0;
      x *= k;
      y *= k;
      drag.far = len > pull * 0.8;
      paint(x, y);
    };
    const onUp = () => {
      if (!drag) return;
      const far = drag.far;
      drag = null;
      delete wrap.dataset.pulling;
      paint(0, 0);
      if (far) clickRef.current?.();
    };
    btn.addEventListener('pointerdown', onDown);
    btn.addEventListener('pointermove', onMove);
    btn.addEventListener('pointerup', onUp);
    btn.addEventListener('pointercancel', onUp);
    return () => {
      btn.removeEventListener('pointerdown', onDown);
      btn.removeEventListener('pointermove', onMove);
      btn.removeEventListener('pointerup', onUp);
      btn.removeEventListener('pointercancel', onUp);
    };
  }, [behavior, pull]);

  const handleClick = event => {
    if (behavior === 'launch' && !reduced()) {
      if (state !== 'idle') return;
      setState('rumble');
      timers.current = [
        setTimeout(() => {
          setState('flying');
          clickRef.current?.(event);
        }, 380),
        setTimeout(() => setState('landing'), 1500),
        setTimeout(() => setState('idle'), 1950)
      ];
      return;
    }
    // A pointer sling fires on release instead; clicks from the keyboard (detail 0) still count.
    if (behavior === 'sling' && event.detail > 0 && !reduced()) return;
    clickRef.current?.(event);
  };

  return (
    <span
      ref={wrapRef}
      className={`bl-arcade ${className}`}
      data-state={state}
      style={{ '--dx': `${offset.x}px`, '--dy': `${offset.y}px`, '--bl-bg': color, '--bl-ink': textColor, '--bl-smoke': smokeColor, '--bl-accent': accentColor, '--bl-font': fontFamily, ...style }}
    >
      <button ref={btnRef} type="button" className="bl-arcade__btn" disabled={disabled} onClick={handleClick}>
        {children}
      </button>
      {behavior === 'launch' && (
        <>
          <span className="bl-arcade__smoke" aria-hidden="true" />
          <span className="bl-arcade__smoke" aria-hidden="true" />
          <span className="bl-arcade__smoke" aria-hidden="true" />
        </>
      )}
    </span>
  );
}
