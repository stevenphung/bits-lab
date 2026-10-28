import { useEffect, useRef, type CSSProperties } from 'react';

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes.
//
// Plays sprite-sheet animations on a canvas with crisp pixel scaling.
// Frames are laid out left-to-right; each animation can use its own row, frame count and fps:
//   animations={{ idle: { row: 0, frames: 4, fps: 6 }, walk: { row: 1, frames: 8, fps: 12 } }}
// Pauses off-screen, and shows a still frame for users who prefer reduced motion.

export interface SpriteAnimation {
  /** Row of the sheet this animation lives on (0 is the top). */
  row?: number;
  /** Number of frames in the row. */
  frames?: number;
  /** Frames per second. */
  fps?: number;
  loop?: boolean;
  /** Play forward then backward instead of jumping back to frame 0. */
  pingPong?: boolean;
}

export interface SpriteAnimatorProps {
  /** Sprite sheet image URL. */
  src?: string;
  /** Size of one frame on the sheet, in px. */
  frameWidth?: number;
  frameHeight?: number;
  /** Named animations; pick one with `animation`. */
  animations?: Record<string, SpriteAnimation>;
  /** Key of the animation to play. Without it, `row`, `frames` and `fps` are used. */
  animation?: string;
  row?: number;
  frames?: number;
  fps?: number;
  /** Integer upscaling factor (pixels stay crisp). */
  scale?: number;
  loop?: boolean;
  pingPong?: boolean;
  /** Pause on the current frame when false. */
  playing?: boolean;
  /** Mirror horizontally. */
  flipX?: boolean;
  /** Accessible description of the sprite. */
  label?: string;
  /** Called when a non-looping animation reaches its last frame. */
  onEnd?: () => void;
  className?: string;
  style?: CSSProperties;
}

interface PlaybackState {
  image: HTMLImageElement | null;
  frame: number;
  direction: number;
  elapsed: number;
}

export default function SpriteAnimator({
  src,
  frameWidth = 16,
  frameHeight = 16,
  animations,
  animation,
  row = 0,
  frames = 8,
  fps = 10,
  scale = 6,
  loop = true,
  pingPong = false,
  playing = true,
  flipX = false,
  label = 'Animated sprite',
  onEnd,
  className = '',
  style
}: SpriteAnimatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef<PlaybackState>({ image: null, frame: 0, direction: 1, elapsed: 0 });
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  const current: SpriteAnimation = (animations && animations[animation!]) || { row, frames, fps };
  const config = { row: current.row ?? 0, frames: Math.max(1, current.frames ?? 1), fps: current.fps ?? fps, loop: current.loop ?? loop, pingPong: current.pingPong ?? pingPong };

  useEffect(() => {
    if (!src) return undefined;
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      state.current.image = image;
      draw();
    };
    image.src = src;
    return () => {
      cancelled = true;
    };
    // draw is stable enough for a load callback; config changes redraw via the loop effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  function draw() {
    const canvas = canvasRef.current;
    const { image, frame } = state.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (flipX) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(image, frame * frameWidth, config.row * frameHeight, frameWidth, frameHeight, 0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  // Reset to the first frame whenever the animation changes.
  useEffect(() => {
    state.current.frame = 0;
    state.current.direction = 1;
    state.current.elapsed = 0;
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animation, config.row, config.frames, flipX, scale]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!canvas || !playing || reduced || config.frames < 2) return undefined;

    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(canvas);

    let frameId = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const s = state.current;
      const dt = Math.min(250, now - last);
      last = now;
      if (visible && s.image) {
        s.elapsed += dt;
        const step = 1000 / Math.max(1, config.fps);
        while (s.elapsed >= step) {
          s.elapsed -= step;
          let next = s.frame + s.direction;
          if (config.pingPong && (next >= config.frames || next < 0)) {
            s.direction *= -1;
            next = s.frame + s.direction;
          }
          if (!config.pingPong && next >= config.frames) {
            if (!config.loop) {
              onEndRef.current?.();
              draw();
              return;
            }
            next = 0;
          }
          s.frame = Math.max(0, Math.min(config.frames - 1, next));
        }
        draw();
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, config.fps, config.frames, config.row, config.loop, config.pingPong, src]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      width={frameWidth * scale}
      height={frameHeight * scale}
      className={`max-w-full [image-rendering:pixelated] ${className}`}
      style={{ width: frameWidth * scale, height: frameHeight * scale, ...style }}
    />
  );
}
