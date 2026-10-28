import { useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// A suggestion from an advisor (a person, an agent, a rule) that a person decides on. It shows
// how sure the advisor is as pixel signal bars, lets you switch to one of the alternatives, and
// accepts with a grace period: an Undo button and a draining fuse, after which the choice is
// final (onCommit). Options are a radio group; the result and the undo window are announced.

const STYLE_ID = 'bl-advisor-card';
const CSS = `
.bl-advisor { display: grid; gap: 12px; width: min(var(--bl-w), 100%); padding: 16px; box-sizing: border-box; background: var(--bl-bg); color: var(--bl-ink); font-family: var(--bl-font); font-size: 14px; box-shadow: inset 0 0 0 3px var(--bl-line), 6px 6px 0 rgba(0,0,0,0.45); }
.bl-advisor__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.bl-advisor__from { display: inline-flex; align-items: center; gap: 8px; margin: 0; color: var(--bl-muted); font-size: 12px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase; }
.bl-advisor__signal { display: inline-flex; align-items: flex-end; gap: 2px; height: 16px; }
.bl-advisor__bar { width: 4px; background: var(--bl-track); }
.bl-advisor__bar[data-on] { background: var(--tone); }
.bl-advisor__sure { font-size: 12px; font-weight: 800; color: var(--tone); }
.bl-advisor__title { margin: 0; font-size: 17px; font-weight: 800; }
.bl-advisor__body { margin: 0; color: var(--bl-muted); line-height: 1.5; }
.bl-advisor__alts { display: grid; gap: 4px; margin: 0; padding: 0; border: 0; }
.bl-advisor__alts legend { margin-bottom: 4px; padding: 0; color: var(--bl-muted); font-size: 12px; font-weight: 800; text-transform: uppercase; }
.bl-advisor__alt { display: flex; align-items: center; gap: 10px; padding: 8px 10px; background: var(--bl-chip); cursor: pointer; }
.bl-advisor__alt:has(input:checked) { box-shadow: inset 3px 0 0 var(--bl-accent); }
.bl-advisor__alt input { margin: 0; accent-color: var(--bl-accent); }
.bl-advisor__alt span:last-child { margin-left: auto; color: var(--bl-muted); font-size: 12px; font-variant-numeric: tabular-nums; }
.bl-advisor__alt:focus-within { outline: 2px solid var(--bl-accent); outline-offset: 1px; }
.bl-advisor__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; }
.bl-advisor__btn { padding: 8px 14px; border: 0; background: var(--bl-accent); color: #0b0b14; font: inherit; font-weight: 800; cursor: pointer; box-shadow: inset -3px -3px 0 rgba(0,0,0,0.25); }
.bl-advisor__btn[data-kind="ghost"] { background: transparent; color: var(--bl-ink); box-shadow: inset 0 0 0 2px var(--bl-line); }
.bl-advisor__btn:focus-visible { outline: 2px solid var(--bl-accent); outline-offset: 2px; }
.bl-advisor__accepted { display: grid; gap: 8px; padding: 10px 12px; background: var(--bl-chip); }
.bl-advisor__accepted p { margin: 0; font-weight: 700; }
.bl-advisor__fuse { height: 4px; background: var(--bl-track); }
.bl-advisor__fuse span { display: block; height: 100%; background: var(--bl-ok); transform-origin: left; animation: bl-advisor-fuse var(--bl-undo) linear forwards; }
.bl-advisor__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-advisor-fuse { from { transform: scaleX(1); } to { transform: scaleX(0); } }
@media (prefers-reduced-motion: reduce) { .bl-advisor__fuse span { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

const sureness = (confidence: number) => (confidence >= 0.75 ? 'Very sure' : confidence >= 0.5 ? 'Fairly sure' : 'Unsure');

export interface AdvisorOption {
  id: string;
  title: string;
  body?: ReactNode;
  /** 0–1. */
  confidence?: number;
}

export interface AdvisorCardProps {
  suggestion?: AdvisorOption;
  alternatives?: AdvisorOption[];
  /** Who is suggesting. */
  advisor?: string;
  icon?: ReactNode;
  onAccept?: (option: AdvisorOption) => void;
  onUndo?: (option: AdvisorOption) => void;
  /** Fires when the undo window ends. */
  onCommit?: (option: AdvisorOption) => void;
  onDismiss?: (option: AdvisorOption) => void;
  /** Grace period in ms. */
  undoWindow?: number;
  acceptLabel?: string;
  dismissLabel?: string;
  width?: number;
  backgroundColor?: string;
  chipColor?: string;
  lineColor?: string;
  textColor?: string;
  mutedColor?: string;
  trackColor?: string;
  accentColor?: string;
  okColor?: string;
  highColor?: string;
  midColor?: string;
  lowColor?: string;
  fontFamily?: string;
  className?: string;
  style?: CSSProperties;
}

export default function AdvisorCard({
  suggestion,
  alternatives = [],
  advisor = 'Suggestion',
  icon,
  onAccept,
  onUndo,
  onCommit,
  onDismiss,
  undoWindow = 5000,
  acceptLabel = 'Accept',
  dismissLabel = 'Not now',
  width = 400,
  backgroundColor = '#1a1c2c',
  chipColor = '#262b44',
  lineColor = '#333c57',
  textColor = '#f4f4f4',
  mutedColor = '#94b0c2',
  trackColor = '#0b0b14',
  accentColor = '#73eff7',
  okColor = '#a7f070',
  highColor = '#a7f070',
  midColor = '#ffcd75',
  lowColor = '#ef7d57',
  fontFamily = 'inherit',
  className = '',
  style
}: AdvisorCardProps) {
  useStyles();
  const uid = useId();
  const options = suggestion ? [suggestion, ...alternatives] : alternatives;
  const [chosen, setChosen] = useState(options[0]?.id);
  const [state, setState] = useState<'open' | 'accepted' | 'committed'>('open');
  const [said, setSaid] = useState('');
  const timer = useRef<number>(0);
  const pick = options.find(o => o.id === chosen) ?? options[0];

  useEffect(() => () => clearTimeout(timer.current), []);

  if (!pick) return null;
  const confidence = Math.max(0, Math.min(1, pick.confidence ?? 0));
  const tone = confidence >= 0.75 ? highColor : confidence >= 0.5 ? midColor : lowColor;
  const bars = Math.max(1, Math.round(confidence * 5));

  const accept = () => {
    setState('accepted');
    setSaid(`Accepted: ${pick.title}. You can undo for ${Math.round(undoWindow / 1000)} seconds.`);
    onAccept?.(pick);
    timer.current = setTimeout(() => {
      setState('committed');
      setSaid(`${pick.title} is final.`);
      onCommit?.(pick);
    }, undoWindow);
  };
  const undo = () => {
    clearTimeout(timer.current);
    setState('open');
    setSaid('Undone. Pick again whenever you like.');
    onUndo?.(pick);
  };

  return (
    <section
      className={`bl-advisor ${className}`}
      aria-label={`${advisor}: ${pick.title}`}
      style={{ '--bl-w': `${width}px`, '--bl-bg': backgroundColor, '--bl-chip': chipColor, '--bl-line': lineColor, '--bl-ink': textColor, '--bl-muted': mutedColor, '--bl-track': trackColor, '--bl-accent': accentColor, '--bl-ok': okColor, '--bl-undo': `${undoWindow}ms`, '--bl-font': fontFamily, '--tone': tone, ...style } as CSSVars}
    >
      <div className="bl-advisor__head">
        <p className="bl-advisor__from">
          {icon}
          {advisor}
        </p>
        <span className="bl-advisor__sure">
          <span className="bl-advisor__signal" aria-hidden="true">
            {[1, 2, 3, 4, 5].map(n => (
              <span key={n} className="bl-advisor__bar" data-on={n <= bars || undefined} style={{ height: `${n * 3 + 1}px` }} />
            ))}
          </span>{' '}
          {sureness(confidence)} · {Math.round(confidence * 100)}%
        </span>
      </div>
      <p className="bl-advisor__title">{pick.title}</p>
      {pick.body && <p className="bl-advisor__body">{pick.body}</p>}

      {state === 'open' && options.length > 1 && (
        <fieldset className="bl-advisor__alts">
          <legend>Options</legend>
          {options.map(option => (
            <label key={option.id} className="bl-advisor__alt">
              <input type="radio" name={uid} value={option.id} checked={option.id === pick.id} onChange={() => setChosen(option.id)} />
              <span>{option.title}</span>
              {option.confidence !== undefined && <span>{Math.round(option.confidence * 100)}%</span>}
            </label>
          ))}
        </fieldset>
      )}

      {state === 'open' && (
        <div className="bl-advisor__foot">
          <button type="button" className="bl-advisor__btn" data-kind="ghost" onClick={() => onDismiss?.(pick)}>
            {dismissLabel}
          </button>
          <button type="button" className="bl-advisor__btn" onClick={accept}>
            {acceptLabel}
          </button>
        </div>
      )}
      {state === 'accepted' && (
        <div className="bl-advisor__accepted">
          <div className="bl-advisor__foot">
            <p>Accepted: {pick.title}</p>
            <button type="button" className="bl-advisor__btn" data-kind="ghost" onClick={undo}>
              Undo
            </button>
          </div>
          <div className="bl-advisor__fuse" aria-hidden="true">
            <span />
          </div>
        </div>
      )}
      {state === 'committed' && (
        <div className="bl-advisor__accepted">
          <p>✓ Done: {pick.title}</p>
        </div>
      )}
      <span className="bl-advisor__sr" aria-live="polite">
        {said}
      </span>
    </section>
  );
}
