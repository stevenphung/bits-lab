import { memo } from 'react';
import { spriteGrid } from './art';

// A 16×16 pixel-art sprite as crisp SVG rects (runs of equal color merged per row).
function Sprite({ name, size = 24, className, title }) {
  const rects = [];
  spriteGrid(name).forEach((row, y) => {
    let x = 0;
    while (x < 16) {
      const color = row[x];
      if (!color) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < 16 && row[x + run] === color) run++;
      rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={run} height={1} fill={color} />);
      x += run;
    }
  });
  return (
    <svg
      className={`sprite ${className ?? ''}`}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {rects}
    </svg>
  );
}

export default memo(Sprite);
