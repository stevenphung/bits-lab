import { useCallback, useEffect, useId, useInsertionEffect, useRef, useState } from 'react';

// RPG dialogue box: typewriter lines with punctuation pauses, a speaker tab, an optional portrait
// and a choice menu. Click, tap, Enter or Space skips the typing, then advances; arrow keys move
// through choices. Screen readers get each full line at once, not letter by letter.

const STYLE_ID = 'bl-quest-dialog';
const CSS = `
.bl-quest { position: relative; width: min(var(--bl-width), 100%); margin: 4px; padding: 22px 22px 20px; background: var(--bl-box); color: var(--bl-text); cursor: pointer; user-select: none;
  box-shadow: 0 -4px 0 0 var(--bl-border), 0 4px 0 0 var(--bl-border), -4px 0 0 0 var(--bl-border), 4px 0 0 0 var(--bl-border), inset 0 0 0 4px #0b0b14, 8px 8px 0 4px rgba(11,11,20,0.45); }
.bl-quest:focus-visible { outline: 4px solid #41a6f6; outline-offset: 8px; }
.bl-quest__name { position: absolute; top: -16px; left: 18px; padding: 6px 10px; background: var(--bl-name-bg); color: var(--bl-name); font: 10px/1 var(--bl-font, "Press Start 2P", ui-monospace, monospace); text-transform: uppercase;
  box-shadow: 0 -3px 0 0 #0b0b14, 0 3px 0 0 #0b0b14, -3px 0 0 0 #0b0b14, 3px 0 0 0 #0b0b14; }
.bl-quest__body { display: flex; gap: 18px; align-items: flex-start; }
.bl-quest__portrait { flex: none; display: grid; place-items: center; width: var(--bl-portrait); height: var(--bl-portrait); background: #0b0b14; box-shadow: inset 0 0 0 3px var(--bl-border); overflow: hidden; }
.bl-quest__text { flex: 1; min-height: calc(var(--bl-lines) * 1.6em); margin: 4px 0 0; font: var(--bl-size)/1.6 var(--bl-body, var(--bl-font, "Press Start 2P", ui-monospace, monospace)); white-space: pre-wrap; overflow-wrap: anywhere; }
.bl-quest__ghost { visibility: hidden; }
.bl-quest__next { position: absolute; right: 16px; bottom: 8px; color: var(--bl-accent); font: 12px/1 monospace; animation: bl-quest-bob 0.7s steps(2) infinite; }
.bl-quest__choices { display: grid; gap: 8px; margin: 14px 0 0; padding: 0 0 0 calc(var(--bl-portrait-gap)); list-style: none; }
.bl-quest__choice { display: flex; gap: 10px; width: 100%; padding: 6px 8px; border: 0; background: none; color: var(--bl-text); font: var(--bl-size)/1.3 var(--bl-body, var(--bl-font, "Press Start 2P", ui-monospace, monospace)); text-align: left; cursor: pointer; }
.bl-quest__choice::before { content: "►"; visibility: hidden; color: var(--bl-accent); }
.bl-quest__choice[data-active]::before { visibility: visible; animation: bl-quest-blink 0.8s steps(1) infinite; }
.bl-quest__choice[data-active] { color: var(--bl-accent); }
.bl-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@keyframes bl-quest-bob { 50% { transform: translateY(4px); } }
@keyframes bl-quest-blink { 50% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) { .bl-quest__next, .bl-quest__choice[data-active]::before { animation: none; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!query) return undefined;
    setReduced(query.matches);
    const onChange = event => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

const DEFAULT_LINES = [
  { speaker: 'Old Miner', text: 'Ah, a new face! These tunnels run deeper than anyone remembers.' },
  { speaker: 'Old Miner', text: 'Legend says a diamond the size of your fist waits at the bottom... Will you go?', choices: [{ label: "I'm in. Hand me a pickaxe.", value: 'yes' }, { label: 'Maybe after lunch.', value: 'no' }] }
];

const PAUSES = { '.': 8, '!': 8, '?': 8, ',': 4, ';': 4, ':': 4, '—': 4 };

export default function QuestDialog({
  lines = DEFAULT_LINES,
  speed = 40,
  width = 620,
  fontSize = 13,
  minLines = 3,
  portraitSize = 72,
  boxColor = '#1a1c2c',
  borderColor = '#f4f4f4',
  textColor = '#f4f4f4',
  nameColor = '#0b0b14',
  nameBackground = '#ffcd75',
  accentColor = '#ffcd75',
  fontFamily,
  bodyFont,
  loop = false,
  onChar,
  onAdvance,
  onChoice,
  onComplete,
  className = '',
  style
}) {
  useStyles();
  const reduced = useReducedMotion();
  const uid = useId();
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const [active, setActive] = useState(0);
  const [finished, setFinished] = useState(false);
  const callbacks = useRef({ onChar });
  callbacks.current = { onChar };

  const line = lines[Math.min(index, lines.length - 1)] ?? { text: '' };
  const text = line.text ?? '';
  const typing = shown < text.length;
  const last = index >= lines.length - 1;
  const choices = !typing && line.choices?.length ? line.choices : null;

  useEffect(() => {
    setShown(reduced ? text.length : 0);
    setActive(0);
  }, [index, text, reduced]);

  // Typewriter: one character per tick, longer holds after punctuation.
  useEffect(() => {
    if (!typing || reduced) return undefined;
    const char = text[shown];
    const delay = (1000 / Math.max(1, speed)) * (PAUSES[text[shown - 1]] ?? 1);
    const timer = setTimeout(() => {
      setShown(count => count + 1);
      if (char && char.trim()) callbacks.current.onChar?.(char);
    }, delay);
    return () => clearTimeout(timer);
  }, [typing, shown, text, speed, reduced]);

  const advance = useCallback(() => {
    if (finished) return;
    if (typing) {
      setShown(text.length);
      return;
    }
    if (choices) return;
    if (last) {
      onComplete?.();
      if (loop) setIndex(0);
      else setFinished(true);
      return;
    }
    setIndex(current => current + 1);
    onAdvance?.(index + 1);
  }, [finished, typing, text.length, choices, last, loop, onComplete, onAdvance, index]);

  const choose = useCallback(
    choiceIndex => {
      const choice = choices?.[choiceIndex];
      if (!choice) return;
      onChoice?.(choice.value ?? choice.label, choiceIndex);
      if (last) {
        onComplete?.();
        if (loop) setIndex(0);
        else setFinished(true);
      } else setIndex(current => current + 1);
    },
    [choices, onChoice, last, loop, onComplete]
  );

  const onKeyDown = event => {
    if (choices && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      setActive(current => (current + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (choices) choose(active);
      else advance();
    }
  };

  const portrait = line.portrait;
  return (
    <div
      className={`bl-quest ${className}`}
      role="group"
      aria-roledescription="dialogue"
      aria-label={line.speaker ? `${line.speaker} says` : 'Dialogue'}
      tabIndex={0}
      onClick={() => !choices && advance()}
      onKeyDown={onKeyDown}
      style={{
        '--bl-width': `${width}px`,
        '--bl-box': boxColor,
        '--bl-border': borderColor,
        '--bl-text': textColor,
        '--bl-name': nameColor,
        '--bl-name-bg': nameBackground,
        '--bl-accent': accentColor,
        '--bl-size': `${fontSize}px`,
        '--bl-lines': minLines,
        '--bl-portrait': `${portraitSize}px`,
        '--bl-portrait-gap': portrait ? `${portraitSize + 18}px` : '0px',
        ...(fontFamily ? { '--bl-font': fontFamily } : null),
        ...(bodyFont ? { '--bl-body': bodyFont } : null),
        ...style
      }}
    >
      {line.speaker && <span className="bl-quest__name">{line.speaker}</span>}
      <div className="bl-quest__body">
        {portrait && <div className="bl-quest__portrait" aria-hidden="true">{portrait}</div>}
        {/* The ghost reserves the full line's space so the box never jumps while typing. */}
        <p className="bl-quest__text" aria-hidden="true">
          {text.slice(0, shown)}
          <span className="bl-quest__ghost">{text.slice(shown)}</span>
        </p>
        <span className="bl-sr" aria-live="polite">
          {text}
        </span>
      </div>
      {choices && (
        <ul className="bl-quest__choices" role="listbox" aria-label="Choices" aria-activedescendant={`${uid}-choice-${active}`}>
          {choices.map((choice, choiceIndex) => (
            <li key={choice.label} role="presentation">
              <button
                id={`${uid}-choice-${choiceIndex}`}
                type="button"
                role="option"
                aria-selected={choiceIndex === active}
                className="bl-quest__choice"
                data-active={choiceIndex === active || undefined}
                onMouseEnter={() => setActive(choiceIndex)}
                onClick={event => {
                  event.stopPropagation();
                  choose(choiceIndex);
                }}
              >
                {choice.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {!typing && !choices && !finished && (
        <span className="bl-quest__next" aria-hidden="true">
          {last ? '■' : '▼'}
        </span>
      )}
    </div>
  );
}
