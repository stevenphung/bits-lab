import { memo, useId, useInsertionEffect, useMemo, type CSSProperties, type ReactElement } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Deterministic pixel avatar. The same seed (a username, an email, an id) always draws the
// same little creature: a mirrored body grown from a seeded random walk, a two-tone palette,
// an outline, eyes and sometimes a mouth. Set variant="identicon" for classic mirrored
// blocks instead. Optional idle blink, offset per seed so a grid of avatars never syncs.

export type AvatarVariant = 'creature' | 'identicon';

export interface AvatarGrid {
  /** 10×10 colors, row by row; null cells are empty. */
  grid: (string | null)[][];
  /** [x, y] cells that form the eyes (empty for identicons). */
  eyes: [number, number][];
  body: string;
  shade: string;
  backdrop: string;
}

export interface PixelAvatarProps {
  /** Any string; the same seed always draws the same avatar. */
  seed?: string | number;
  /** Rendered size in px. */
  size?: number;
  variant?: AvatarVariant;
  shape?: 'rounded' | 'square' | 'circle';
  /** true for a seeded backdrop, a color of your own, or false for none. */
  background?: boolean | string;
  /** Idle blink, offset per seed. */
  blink?: boolean;
  /** Accessible name; defaults to "Avatar for {seed}". */
  title?: string;
  /** Hide from assistive tech (when a name sits next to it). */
  decorative?: boolean;
  className?: string;
  style?: CSSProperties;
}

const STYLE_ID = 'bl-pixel-avatar-tw';
const CSS = `
@keyframes bl-ava-blink { 0%, 95%, 100% { transform: none; } 96%, 98% { transform: scaleY(0.2); } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

// cyrb53-style string hash and mulberry32 PRNG: tiny, fast and stable across platforms.
function hash(text: string) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  return h1 >>> 0;
}

function random(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Body and shade pairs from the Sweetie 16 palette.
const PALETTES = [
  ['#b13e53', '#5d275d'],
  ['#ef7d57', '#b13e53'],
  ['#ffcd75', '#ef7d57'],
  ['#a7f070', '#38b764'],
  ['#38b764', '#257179'],
  ['#73eff7', '#41a6f6'],
  ['#41a6f6', '#3b5dc9'],
  ['#94b0c2', '#566c86']
];
const BACKDROPS = ['#333c57', '#29366f', '#5d275d', '#257179', '#1a1c2c'];
const INK = '#0b0b14';
const WHITE = '#f4f4f4';
const G = 10;

// Returns a 10×10 grid of colors (null = empty) plus the eye cells, for any seed.
export function avatarGrid(seed: string | number, variant: AvatarVariant = 'creature'): AvatarGrid {
  const rand = random(hash(String(seed)));
  const [body, shade] = PALETTES[Math.floor(rand() * PALETTES.length)];
  const backdrop = BACKDROPS[Math.floor(rand() * BACKDROPS.length)];
  const cells = Array.from({ length: G }, () => Array(G).fill(0));
  const eyes: [number, number][] = [];

  if (variant === 'identicon') {
    for (let y = 1; y < G - 1; y++) for (let x = 1; x < G / 2; x++) cells[y][x] = rand() < 0.5 ? 1 : 0;
  } else {
    // Denser toward the middle column and middle rows, so it reads as a body, not noise.
    for (let y = 1; y < G - 1; y++) {
      for (let x = 1; x < G / 2; x++) {
        const towardCenter = (x - 1) / (G / 2 - 2);
        const towardMiddle = 1 - Math.abs((y - 4.5) / 4.5);
        cells[y][x] = rand() < 0.12 + 0.8 * Math.min(1, towardCenter * 0.7 + towardMiddle * 0.6) ? 1 : 0;
      }
    }
    for (let y = 3; y <= 6; y++) cells[y][3] = cells[y][4] = 1;
  }
  // Mirror the left half onto the right.
  for (let y = 0; y < G; y++) for (let x = 0; x < G / 2; x++) cells[y][G - 1 - x] = cells[y][x];

  const grid = cells.map((row, y) => row.map(on => (on ? (variant !== 'identicon' && y >= 7 ? shade : body) : null)));
  if (variant !== 'identicon') {
    // Outline every empty cell that touches the body.
    const outline = (x: number, y: number) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => cells[y + dy]?.[x + dx]);
    for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) if (!cells[y][x] && outline(x, y)) grid[y][x] = INK;
    // Eyes: a white cell over a pupil, mirrored; a mouth on some seeds.
    const ey = 3 + Math.floor(rand() * 2);
    const ex = rand() < 0.5 ? 3 : 2;
    for (const x of [ex, G - 1 - ex]) {
      grid[ey][x] = WHITE;
      grid[ey + 1][x] = INK;
      eyes.push([x, ey], [x, ey + 1]);
    }
    if (rand() < 0.6) grid[ey + 3][4] = grid[ey + 3][5] = INK;
  }
  return { grid, eyes, body, shade, backdrop };
}

function PixelAvatar({ seed = 'bits', size = 64, variant = 'creature', shape = 'rounded', background = true, blink = false, title, decorative = false, className = '', style }: PixelAvatarProps) {
  useStyles();
  const clip = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const { grid, eyes, backdrop } = useMemo(() => avatarGrid(seed, variant), [seed, variant]);
  const eyeSet = new Set(eyes.map(([x, y]) => `${x},${y}`));

  // Merge runs of equal color per row into single rects (eyes kept separate so they can blink).
  const body: ReactElement[] = [];
  const eyeRects: ReactElement[] = [];
  grid.forEach((row, y) => {
    let x = 0;
    while (x < G) {
      const color = row[x];
      if (!color) {
        x++;
        continue;
      }
      if (eyeSet.has(`${x},${y}`)) {
        eyeRects.push(<rect key={`e${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />);
        x++;
        continue;
      }
      let run = 1;
      while (x + run < G && row[x + run] === color && !eyeSet.has(`${x + run},${y}`)) run++;
      body.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={color} />);
      x += run;
    }
  });

  const fill = background === true ? backdrop : background || 'none';
  const radius = shape === 'circle' ? 6 : shape === 'rounded' ? 2 : 0;
  const delay = `${-(hash(String(seed)) % 5000) / 1000}s`;
  const label = title ?? `Avatar for ${seed}`;

  return (
    <svg
      className={`inline-block flex-none align-middle ${className}`}
      viewBox="-1 -1 12 12"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      style={{ '--bl-blink-delay': delay, ...style } as CSSVars}
    >
      <defs>
        <clipPath id={`${clip}-shape`}>
          <rect x={-1} y={-1} width={12} height={12} rx={radius} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip}-shape)`}>
        <rect x={-1} y={-1} width={12} height={12} fill={fill} />
        {body}
        <g className={blink && eyeRects.length ? 'origin-center animate-[bl-ava-blink_5s_steps(1)_infinite] [animation-delay:var(--bl-blink-delay,0s)] [transform-box:fill-box] motion-reduce:animate-none' : undefined}>{eyeRects}</g>
      </g>
    </svg>
  );
}

export default memo(PixelAvatar);
