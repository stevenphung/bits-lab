import { useCallback, useEffect, useId, useInsertionEffect, useRef, useState, type CSSProperties, type ReactNode, type KeyboardEvent } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// RPG dialogue box: typewriter lines with punctuation pauses, a speaker tab, an optional portrait
// and a choice menu. Click, tap, Enter or Space skips the typing, then advances; arrow keys move
// through choices. Screen readers get each full line at once, not letter by letter.

const STYLE_ID = 'bl-quest-dialog-tw';
const CSS = `
@keyframes bl-quest-bob { 50% { transform: translateY(4px); } }
@keyframes bl-quest-blink { 50% { opacity: 0; } }
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
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export interface DialogueChoice {
  label: string;
  /** Passed to onChoice; defaults to the label. */
  value?: string;
}

export interface DialogueLine {
  /** Name shown in the tab above the box. */
  speaker?: string;
  text: string;
  /** Image or sprite shown at the left of the box. */
  portrait?: ReactNode;
  /** Choices shown once the line finishes typing. */
  choices?: DialogueChoice[];
}

export interface QuestDialogProps {
  /** The conversation, in order. */
  lines?: DialogueLine[];
  /** Characters per second. */
  speed?: number;
  /** Max width, in px. */
  width?: number;
  fontSize?: number;
  /** Minimum text lines the box reserves. */
  minLines?: number;
  portraitSize?: number;
  boxColor?: string;
  borderColor?: string;
  textColor?: string;
  nameColor?: string;
  nameBackground?: string;
  accentColor?: string;
  /** Font for the name tab and choices. */
  fontFamily?: string;
  /** Font for the dialogue text. */
  bodyFont?: string;
  /** Start over after the last line. */
  loop?: boolean;
  /** Called for each typed (non-space) character, e.g. to play a blip. */
  onChar?: (char: string) => void;
  /** Called with the new line index after advancing. */
  onAdvance?: (index: number) => void;
  /** Called with the chosen value and its index. */
  onChoice?: (value: string, index: number) => void;
  /** Called after the last line. */
  onComplete?: () => void;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_LINES: DialogueLine[] = [
  { speaker: 'Old Miner', text: 'Ah, a new face! These tunnels run deeper than anyone remembers.' },
  { speaker: 'Old Miner', text: 'Legend says a diamond the size of your fist waits at the bottom... Will you go?', choices: [{ label: "I'm in. Hand me a pickaxe.", value: 'yes' }, { label: 'Maybe after lunch.', value: 'no' }] }
];

const PAUSES: Record<string, number> = { '.': 8, '!': 8, '?': 8, ',': 4, ';': 4, ':': 4, '—': 4 };

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
}: QuestDialogProps) {
  useStyles();
  const reduced = useReducedMotion();
  const uid = useId();
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState(0);
  const [active, setActive] = useState(0);
  const [finished, setFinished] = useState(false);
  const callbacks = useRef({ onChar });
  callbacks.current = { onChar };

  const line: DialogueLine = lines[Math.min(index, lines.length - 1)] ?? { text: '' };
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
    (choiceIndex: number) => {
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

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
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
      className={`relative m-1 w-[min(var(--bl-width),100%)] cursor-pointer bg-(--bl-box) px-[22px] pt-[22px] pb-5 text-(--bl-text) shadow-[0_-4px_0_0_var(--bl-border),0_4px_0_0_var(--bl-border),-4px_0_0_0_var(--bl-border),4px_0_0_0_var(--bl-border),inset_0_0_0_4px_#0b0b14,8px_8px_0_4px_rgba(11,11,20,0.45)] select-none focus-visible:outline-4 focus-visible:outline-offset-8 focus-visible:outline-[#41a6f6] focus-visible:outline-solid ${className}`}
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
      } as CSSVars}
    >
      {line.speaker && <span className="absolute -top-4 left-[18px] bg-(--bl-name-bg) px-2.5 py-1.5 [font:10px/1_var(--bl-font,'Press_Start_2P',ui-monospace,monospace)] text-(--bl-name) uppercase shadow-[0_-3px_0_0_#0b0b14,0_3px_0_0_#0b0b14,-3px_0_0_0_#0b0b14,3px_0_0_0_#0b0b14]">{line.speaker}</span>}
      <div className="flex items-start gap-[18px]">
        {portrait && <div className="grid size-(--bl-portrait) flex-none place-items-center overflow-hidden bg-[#0b0b14] shadow-[inset_0_0_0_3px_var(--bl-border)]" aria-hidden="true">{portrait}</div>}
        {/* The ghost reserves the full line's space so the box never jumps while typing. */}
        <p className="mt-1 mb-0 min-h-[calc(var(--bl-lines)*1.6em)] flex-1 [font:var(--bl-size)/1.6_var(--bl-body,var(--bl-font,'Press_Start_2P',ui-monospace,monospace))] whitespace-pre-wrap [overflow-wrap:anywhere]" aria-hidden="true">
          {text.slice(0, shown)}
          <span className="invisible">{text.slice(shown)}</span>
        </p>
        <span className="sr-only" aria-live="polite">
          {text}
        </span>
      </div>
      {choices && (
        <ul className="mt-3.5 mb-0 grid list-none gap-2 p-0 pl-[calc(var(--bl-portrait-gap))]" role="listbox" aria-label="Choices" aria-activedescendant={`${uid}-choice-${active}`}>
          {choices.map((choice, choiceIndex) => (
            <li key={choice.label} role="presentation">
              <button
                id={`${uid}-choice-${choiceIndex}`}
                type="button"
                role="option"
                aria-selected={choiceIndex === active}
                className="flex w-full cursor-pointer gap-2.5 border-0 bg-none px-2 py-1.5 text-left [font:var(--bl-size)/1.3_var(--bl-body,var(--bl-font,'Press_Start_2P',ui-monospace,monospace))] text-(--bl-text) before:invisible before:text-(--bl-accent) before:content-['►'] data-[active]:text-(--bl-accent) data-[active]:before:visible data-[active]:before:animate-[bl-quest-blink_0.8s_steps(1)_infinite] motion-reduce:data-[active]:before:animate-none"
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
        <span className="absolute right-4 bottom-2 animate-[bl-quest-bob_0.7s_steps(2)_infinite] [font:12px/1_monospace] text-(--bl-accent) motion-reduce:animate-none" aria-hidden="true">
          {last ? '■' : '▼'}
        </span>
      )}
    </div>
  );
}
