import { useEffect, useInsertionEffect, useRef, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Voice-assistant orb on a canvas. Four states: idle (slow breathing), listening (reacts to
// the microphone or a simulated voice), thinking (round, with a fast-turning gradient and
// orbiting sparks) and speaking (bursts like syllables). The microphone is only opened when
// you ask for it (source="mic" while listening) and is released as soon as listening stops.
// State changes are announced; the animation pauses off-screen.

const STYLE_ID = 'bl-voice-orb';
const CSS = `
.bl-orb { position: relative; display: inline-grid; place-items: center; width: var(--bl-size); max-width: 100%; aspect-ratio: 1; }
.bl-orb canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
.bl-orb__sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

export type OrbState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface VoiceOrbProps {
  state?: OrbState;
  /** With "mic", the microphone opens only while listening and is released right after. */
  source?: 'simulated' | 'mic';
  /** Drive the orb yourself (0–1), e.g. from your TTS audio. Overrides the source. */
  level?: number;
  /** Diameter, in px. */
  size?: number;
  /** Gradient stops; they rotate. */
  colors?: string[];
  glowColor?: string;
  /** Level gain. */
  sensitivity?: number;
  /** Accessible name, combined with the state. */
  label?: string;
  /** Called if the microphone is denied or missing (falls back to a simulated voice). */
  onMicError?: (error: unknown) => void;
  className?: string;
  style?: CSSProperties;
}

const STATE_TEXT: Record<string, string> = { idle: 'Idle', listening: 'Listening', thinking: 'Thinking', speaking: 'Speaking' };

// Fake voice: overlapping sine "syllables" gated on and off, so pauses feel natural.
function simulatedLevel(state: OrbState, t: number) {
  if (state === 'idle') return 0.05 + Math.sin(t * 1.4) * 0.03;
  if (state === 'thinking') return 0.08;
  const gate = Math.sin(t * 0.9) + Math.sin(t * 2.3 + 1) > -0.2 ? 1 : 0.15;
  const syllables = Math.abs(Math.sin(t * (state === 'speaking' ? 9 : 6))) * 0.6 + Math.abs(Math.sin(t * 3.7 + 2)) * 0.4;
  return gate * syllables * (state === 'speaking' ? 0.95 : 0.7);
}

export default function VoiceOrb({
  state = 'idle',
  source = 'simulated',
  level,
  size = 220,
  colors = ['#41a6f6', '#73eff7', '#b13e53'],
  glowColor = 'rgba(115,239,247,0.45)',
  sensitivity = 1,
  label = 'Voice assistant',
  onMicError,
  className = '',
  style
}: VoiceOrbProps) {
  useStyles();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const live = useRef({ state, level, colors, glowColor, sensitivity });
  live.current = { state, level, colors, glowColor, sensitivity };
  const micLevel = useRef<number | null>(null);
  const onMicErrorRef = useRef(onMicError);
  onMicErrorRef.current = onMicError;

  // Microphone: open only while listening with source="mic"; always release it afterwards.
  useEffect(() => {
    if (source !== 'mic' || state !== 'listening' || !navigator.mediaDevices?.getUserMedia) return undefined;
    let cancelled = false;
    let stream: MediaStream | undefined;
    let ctx: AudioContext | undefined;
    let frame = 0;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(media => {
        if (cancelled) {
          media.getTracks().forEach(track => track.stop());
          return;
        }
        stream = media;
        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(media).connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        const read = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (const v of data) sum += ((v - 128) / 128) ** 2;
          micLevel.current = Math.min(1, Math.sqrt(sum / data.length) * 4);
          frame = requestAnimationFrame(read);
        };
        read();
      })
      .catch(error => {
        micLevel.current = null;
        onMicErrorRef.current?.(error);
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      micLevel.current = null;
      stream?.getTracks().forEach(track => track.stop());
      ctx?.close();
    };
  }, [source, state]);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let frame = 0;
    let visible = true;
    let smooth = 0;
    let spinAngle = 0;
    let last = performance.now();
    const start = last;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      width = wrap.clientWidth;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(width * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      frame = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = (now - start) / 1000;
      const { state: s, level: external, colors: palette, glowColor: glow, sensitivity: gain } = live.current;
      const target = Math.min(1, (external ?? micLevel.current ?? simulatedLevel(s, t)) * gain);
      // Fast attack, slow release, like a VU meter.
      smooth += (target - smooth) * (target > smooth ? 0.35 : 0.08);
      spinAngle += dt * (s === 'thinking' ? 2.6 : 0.5) * (reduced ? 0 : 1);

      const c = width / 2;
      // Under reduced motion the orb keeps its size; the level shows only through the glow.
      const base = width * 0.3 * (1 + (reduced ? 0 : smooth * 0.14));
      ctx.clearRect(0, 0, width, width);

      // Glow
      const halo = ctx.createRadialGradient(c, c, base * 0.6, c, c, base * 1.65);
      halo.addColorStop(0, glow);
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = halo;
      ctx.globalAlpha = 0.5 + smooth * 0.5;
      ctx.fillRect(0, 0, width, width);
      ctx.globalAlpha = 1;

      // Blob outline: sum of slow waves, scaled by the level (round while thinking).
      const wobble = reduced ? 0 : s === 'thinking' ? 0.02 : 0.05 + smooth * 0.2;
      const points = 72;
      ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const a = (i / points) * Math.PI * 2;
        const n = Math.sin(a * 3 + t * 1.7) * 0.5 + Math.sin(a * 5 - t * 2.3 + 1) * 0.3 + Math.sin(a * 2 + t * 0.9 + 2) * 0.2;
        const r = base * (1 + n * wobble);
        const x = c + Math.cos(a) * r;
        const y = c + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      const fill = ctx.createConicGradient ? ctx.createConicGradient(spinAngle, c, c) : ctx.createLinearGradient(0, 0, width, width);
      palette.forEach((color, i) => fill.addColorStop(i / palette.length, color));
      fill.addColorStop(1, palette[0]);
      ctx.fillStyle = fill;
      ctx.fill();

      // Soft inner highlight for depth.
      const shine = ctx.createRadialGradient(c - base * 0.35, c - base * 0.4, 0, c, c, base * 1.1);
      shine.addColorStop(0, 'rgba(255,255,255,0.45)');
      shine.addColorStop(0.5, 'rgba(255,255,255,0.05)');
      shine.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = shine;
      ctx.fill();

      // Thinking: three sparks orbiting just outside the orb.
      if (s === 'thinking' && !reduced) {
        for (let k = 0; k < 3; k++) {
          const a = spinAngle * 1.4 + (k * Math.PI * 2) / 3;
          ctx.beginPath();
          ctx.arc(c + Math.cos(a) * base * 1.28, c + Math.sin(a) * base * 1.28, width * 0.014, 0, Math.PI * 2);
          ctx.fillStyle = palette[k % palette.length];
          ctx.fill();
        }
      }
      if (visible) frame = requestAnimationFrame(draw);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(wrap);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !frame) {
        last = performance.now();
        frame = requestAnimationFrame(draw);
      }
    });
    io.observe(wrap);
    resize();
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={wrapRef} className={`bl-orb ${className}`} role="img" aria-label={`${label}: ${STATE_TEXT[state] ?? state}`} style={{ '--bl-size': `${size}px`, ...style } as CSSVars}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="bl-orb__sr" aria-live="polite">
        {STATE_TEXT[state] ?? state}
      </span>
    </div>
  );
}
