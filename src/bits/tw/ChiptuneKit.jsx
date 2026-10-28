import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Chiptune sound effects for UI events, synthesized with Web Audio (no audio files).
//   playChip('coin')                       fire-and-forget, respects the global mute
//   <ChiptuneProvider> + useChiptune()     shared mute/volume, persisted per browser
//   <MuteToggle />                         accessible speaker button
// Browsers only allow audio after a user gesture, so call play() from click/key handlers.

export const CHIPS = {
  select: { wave: 'square', from: 1320, to: 1320, duration: 0.05, volume: 0.25 },
  confirm: { wave: 'square', from: 660, to: 660, duration: 0.07, notes: 2, interval: 7, gap: 0.06, volume: 0.25 },
  cancel: { wave: 'square', from: 520, to: 520, duration: 0.07, notes: 2, interval: -5, gap: 0.06, volume: 0.25 },
  blip: { wave: 'square', from: 880, to: 880, duration: 0.025, volume: 0.12 },
  coin: { wave: 'square', from: 988, to: 988, duration: 0.1, notes: 2, interval: 5, gap: 0.07, volume: 0.28 },
  jump: { wave: 'square', from: 300, to: 900, duration: 0.16, volume: 0.28 },
  powerUp: { wave: 'square', from: 330, to: 660, duration: 0.09, notes: 4, interval: 4, gap: 0.06, volume: 0.22 },
  levelUp: { wave: 'triangle', from: 523, to: 523, duration: 0.16, notes: 4, interval: 4, gap: 0.1, volume: 0.45 },
  hit: { wave: 'sawtooth', from: 400, to: 120, duration: 0.14, noise: 0.3, volume: 0.35 },
  error: { wave: 'sawtooth', from: 220, to: 150, duration: 0.16, notes: 2, interval: -1, gap: 0.12, volume: 0.3 },
  explosion: { wave: 'noise', duration: 0.55, volume: 0.7 }
};

const STORAGE_KEY = 'bl-chiptune';
let context = null;
let globalMuted = false;
let globalVolume = 1;

function audio() {
  if (typeof window === 'undefined') return null;
  if (!context) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    context = new Ctx();
  }
  if (context.state === 'suspended') context.resume();
  return context;
}

function noiseBuffer(ctx, seconds) {
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function playChip(sound, { volume = 1 } = {}) {
  if (globalMuted) return;
  const recipe = typeof sound === 'string' ? CHIPS[sound] : sound;
  const ctx = recipe && audio();
  if (!ctx) return;
  const master = ctx.createGain();
  master.gain.value = (recipe.volume ?? 0.3) * volume * globalVolume;
  master.connect(ctx.destination);

  const notes = recipe.notes ?? 1;
  for (let i = 0; i < notes; i++) {
    const start = ctx.currentTime + i * (recipe.gap ?? 0.08);
    const end = start + recipe.duration;
    const ratio = 2 ** ((i * (recipe.interval ?? 0)) / 12);
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(1, start + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    envelope.connect(master);

    if (recipe.wave === 'noise' || recipe.noise) {
      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer(ctx, recipe.duration + 0.05);
      const level = ctx.createGain();
      level.gain.value = recipe.wave === 'noise' ? 1 : recipe.noise;
      source.connect(level).connect(envelope);
      source.start(start);
      source.stop(end + 0.02);
    }
    if (recipe.wave !== 'noise') {
      const osc = ctx.createOscillator();
      osc.type = recipe.wave ?? 'square';
      osc.frequency.setValueAtTime(recipe.from * ratio, start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, (recipe.to ?? recipe.from) * ratio), end);
      osc.connect(envelope);
      osc.start(start);
      osc.stop(end + 0.02);
    }
  }
}

const ChiptuneContext = createContext(null);

function readStored() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
  } catch {
    return {};
  }
}

export function ChiptuneProvider({ children, defaultMuted = false, defaultVolume = 1, persist = true }) {
  const [state, setState] = useState(() => ({ muted: defaultMuted, volume: defaultVolume, ...(persist ? readStored() : null) }));

  useEffect(() => {
    globalMuted = state.muted;
    globalVolume = state.volume;
    if (!persist) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable (private mode); sound settings just won't persist.
    }
  }, [state, persist]);

  const value = useMemo(
    () => ({
      ...state,
      play: (sound, options) => playChip(sound, options),
      setMuted: muted => setState(prev => ({ ...prev, muted })),
      toggleMuted: () => setState(prev => ({ ...prev, muted: !prev.muted })),
      setVolume: volume => setState(prev => ({ ...prev, volume: Math.min(1, Math.max(0, volume)) }))
    }),
    [state]
  );

  return <ChiptuneContext.Provider value={value}>{children}</ChiptuneContext.Provider>;
}

// Works with or without a provider; without one, mute isn't shared or persisted.
export function useChiptune() {
  const shared = useContext(ChiptuneContext);
  const [localMuted, setLocalMuted] = useState(false);
  const play = useCallback((sound, options) => !localMuted && playChip(sound, options), [localMuted]);
  return (
    shared ?? {
      muted: localMuted,
      volume: 1,
      play,
      setMuted: setLocalMuted,
      toggleMuted: () => setLocalMuted(muted => !muted),
      setVolume: () => {}
    }
  );
}

export function MuteToggle({ size = 32, color = '#f4f4f4', background = '#333c57', className = '', style }) {
  const { muted, toggleMuted } = useChiptune();
  const px = size / 16;
  return (
    <button
      type="button"
      className={`grid cursor-pointer place-items-center border-0 ${className}`}
      onClick={toggleMuted}
      aria-pressed={muted}
      aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
      title={muted ? 'Sound off' : 'Sound on'}
      style={{
        width: size + 12,
        height: size + 12,
        background,
        color,
        boxShadow: `0 -${px * 2}px 0 0 #0b0b14, 0 ${px * 2}px 0 0 #0b0b14, -${px * 2}px 0 0 0 #0b0b14, ${px * 2}px 0 0 0 #0b0b14`,
        ...style
      }}
    >
      <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true" fill="currentColor">
        <rect x="2" y="6" width="3" height="4" />
        <rect x="5" y="5" width="1" height="6" />
        <rect x="6" y="4" width="1" height="8" />
        <rect x="7" y="3" width="1" height="10" />
        {muted ? (
          <>
            <rect x="10" y="5" width="1" height="1" />
            <rect x="11" y="6" width="1" height="1" />
            <rect x="12" y="7" width="1" height="2" />
            <rect x="11" y="9" width="1" height="1" />
            <rect x="10" y="10" width="1" height="1" />
            <rect x="13" y="6" width="1" height="1" />
            <rect x="14" y="5" width="1" height="1" />
            <rect x="13" y="9" width="1" height="1" />
            <rect x="14" y="10" width="1" height="1" />
          </>
        ) : (
          <>
            <rect x="10" y="6" width="1" height="4" />
            <rect x="12" y="4" width="1" height="8" />
            <rect x="14" y="2" width="1" height="12" />
          </>
        )}
      </svg>
    </button>
  );
}

// A small soundboard, handy for previewing the presets.
export default function ChiptuneKit({ sounds = Object.keys(CHIPS), volume = 1, columns = 4, accentColor = '#ffcd75' }) {
  const { play } = useChiptune();
  return (
    <div
      role="group"
      aria-label="Chiptune sounds"
      className="grid w-[min(560px,100%)] gap-3"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {sounds.map(name => (
        <button
          key={name}
          type="button"
          onClick={() => play(name, { volume })}
          className="cursor-pointer border-3 border-solid border-[#0b0b14] bg-[#1a1c2c] px-2 py-3.5 font-['Press_Start_2P',ui-monospace,monospace] text-[9px] leading-[1.2] font-normal uppercase"
          style={{ color: accentColor }}
        >
          ♪ {name}
        </button>
      ))}
    </div>
  );
}
