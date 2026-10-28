import { useId, useInsertionEffect, useMemo, useState, type CSSProperties } from 'react';

type CSSVars = CSSProperties & { [key: `--${string}`]: string | number | undefined };

// Tailwind variant (needs Tailwind CSS v4). Same component as the CSS version, with its
// styles as utility classes; the keyframes ship as a small injected style.
//
// Flat dotted world map in SVG (equirectangular). All land dots are one <path>, so even the
// densest grid stays cheap. Pulsing location markers with labels, and curved routes with a
// traveling comet. Markers are focusable; reduced motion keeps everything still.

// Land data: Natural Earth (public domain), rasterized to 180×90 cells (2°) by
// scripts/build-land-mask.mjs. Row 0 = 90°N, column 0 = 180°W, MSB-first bits.
const LAND = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAf4AP/AAAAAAAAAAAAAAAAAAAAAAAAX/z///+AAAAAAAABAAAAAAAAAAAAAYd8P///wAA+AAAAAA8AAAAAAAAAAAwAnw////4AAIAAAAAAGAAAAAAAAAAADivwAf//wAAAAADAAf/wAHYAAAAAADoi3sAP//gAAAAAMAD///sAAAAgBgACfwz/AD/+gAAAwAEHf///+/8gBAP/7/nJdjwD/+AAAH/AA7f///////f4P//////h8H/gAAAf/6//f////////Mf/////9H4D8AeAA+ev///////////AP/////4A0B4AAAD5/////////////Af3////gHgA4AAAH5///////////LwAHgH///gHkAAAAAH4/////////+CIAABAB///4D+AAAAGCx/////////4A8AAIAAf///n/gAAAOCD/////////wA4AAAAAf///n/wAAAbP///////////AgAAAAAP/////wAAADf//////////9AAAAAAAF////0YAAAB///////////9AAAAAAAD////8EAAAB///////////5AAAAAAAD////2AAAAB/f5fP//////wAAAAAAAD////gAAAAfxnwPP//////jAAAAAAAD////AAAAAPCb3/n/////+CAAAAAAAD///8AAAAAfALf/n////+ECAAAAAAAB///8AAAAAGHQP/n/////mMAAAAAAAA///8AAAAAH+Ai///////E8AAAAAAAAf//wAAAAAP/AA///////BgAAAAAAAAP//gAAAAAf/73///////gAAAAAAAAAD/AQAAAAAf////f/////gAAAAAAAAAF+AQAAAAB///+/n/////AAAAAAAAAAC+AAAAAAB///+f0H////AAAAAAAAAAAeAwAAAAD////f/B///8gAAAAAAAAAAeGEAAAAH////v+B/z/AAAAAAAAAAAAPMAgAAAD////n+A/B+gAAAAAAAAAAAD8AAAAAD////n4AeB/AgAAAAAAAAAAAPAAAAAH////3gAcAfAgAAAAAAAAAAADAAAAAD////6AAcAfggAAAAAAAAAAABDwAAAD////8wAMATAIAAAAAAAAAAAAr/AAAB/////gAKASAAAAAAAAAAAAAAH/gAAA/////gACAAAIAAAAAAAAAAAAH/8AAAaH///AAAAsGAAAAAAAAAAAAAH/+AAAAB//+AAAAUOAAAAAAAAAAAAAP/+AAAAB//8AAAAYegAAAAAAAAAAAAP//gAAAD//4AAAAMeBgAAAAAAAAAAAP//8AAAB//wAAAAGdiuAAAAAAAAAAAf///AAAA//wAAAACAQHgAAAAAAAAAAP///gAAA//wAAAABwAHwgAAAAAAAAAH///AAAA//wAAAAACIDQIAAAAAAAAAH//+AAAAf/wAAAAAAAAAAAAAAAAAAAD//+AAAA//wgAAAAABxAAAAAAAAAAAD//+AAAA//wgAAAAAPxgBAAAAAAAAAA//8AAAA//jgAAAAAf5gAAAAAAAAAAAf/8AAAA//DgAAAAAf/gAAAAAAAAAAAf/8AAAAf/DAAAAAD//4CAAAAAAAAAAf/wAAAAf/DAAAAAH//4AAAAAAAAAAAf/AAAAAf+CAAAAAH//8AAAAAAAAAAAf/AAAAAP8AAAAAAH//+AAAAAAAAAAA/+AAAAAP8AAAAAAH//+AAAAAAAAAAA/+AAAAAH4AAAAAAD//+AAAAAAAAAAA/8AAAAAHwAAAAAADwf8AAAAAAAAAAA/gAAAAAAAAAAAAACAH4AIAAAAAAAAB/wAAAAAAAAAAAAAAAD4AEAAAAAAAAB+AAAAAAAAAAAAAAAAAAAGAAAAAAAAB6AAAAAAAAAAAAAAAAAwAMAAAAAAAAA8AAAAAAAAAAAAAAAAAQAYAAAAAAAAB4AAAAAAAAAAAAAAAAAAAwAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAACAAAAAAAAAAAAAAAAADgAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAeAAIP+f/gAAAAAAAAAAAMAAAAAAABP/+H//////AAAAAAAAAAA+AAAAAf////8////////AAAAAAAOEAPAAAB///////////////gAAAP//T//8AAAH//////////////+AAAH/////4AAAH///////////////8AAE//////4ABw////////////////8AAAD//////gCA////////////////wAAAf/////////////////////////+A/4A///////////////////////////////////////////////////////////////////////////////////////';

const STYLE_ID = 'bl-dot-map-tw';
const CSS = `
/* theme tokens */
.bl-map { --bl-dot: rgba(148,176,194,0.55); --bl-marker: #ef7d57; --bl-route: #ffcd75; --bl-label: #f4f4f4; }
:where(.light, [data-theme="light"]) .bl-map, .bl-map:where(.light, [data-theme="light"]) { --bl-dot: rgba(86,108,134,0.55); --bl-marker: #c4502a; --bl-route: #a86a12; --bl-label: #1a1c2c; }
:where(.light, [data-theme="light"]) :where(.dark, [data-theme="dark"]) .bl-map, :where(.light, [data-theme="light"]) .bl-map:where(.dark, [data-theme="dark"]) { --bl-dot: rgba(148,176,194,0.55); --bl-marker: #ef7d57; --bl-route: #ffcd75; --bl-label: #f4f4f4; }
@media (prefers-color-scheme: light) { :where([data-theme="system"]) .bl-map, .bl-map:where([data-theme="system"]) { --bl-dot: rgba(86,108,134,0.55); --bl-marker: #c4502a; --bl-route: #a86a12; --bl-label: #1a1c2c; } }
/* theme tokens end */
@keyframes bl-map-travel { from { stroke-dashoffset: 0.18; } to { stroke-dashoffset: -1; } }
@keyframes bl-map-pulse { from { transform: scale(1); opacity: 0.9; } to { transform: scale(4); opacity: 0; } }
`;

function useStyles() {
  useInsertionEffect(() => {
    if (typeof document === 'undefined') return;
    const style = document.getElementById(STYLE_ID) ?? Object.assign(document.createElement('style'), { id: STYLE_ID });
    style.textContent = CSS;
    if (!style.isConnected) document.head.appendChild(style);
  }, []);
}

let landBits: Uint8Array | undefined;
export function isLand(lat: number, lon: number) {
  if (!landBits) landBits = Uint8Array.from(atob(LAND), c => c.charCodeAt(0));
  const col = Math.min(179, Math.max(0, Math.floor((lon + 180) / 2)));
  const row = Math.min(89, Math.max(0, Math.floor((90 - lat) / 2)));
  const i = row * 180 + col;
  return (landBits[i >> 3] & (1 << (7 - (i & 7)))) !== 0;
}

// 1 SVG unit = 1 degree. Latitudes south of 60°S (Antarctica) are cropped by default.
/** [latitude, longitude] in degrees. */
export type LatLon = [number, number];

const project = (lat: number, lon: number): [number, number] => [lon + 180, 90 - lat];

function dotsPath(spacing: number, radius: number, square: boolean, southLimit: number) {
  let d = '';
  for (let lat = 90 - spacing / 2; lat > southLimit; lat -= spacing) {
    for (let lon = -180 + spacing / 2; lon < 180; lon += spacing) {
      if (!isLand(lat, lon)) continue;
      const [x, y] = project(lat, lon);
      d += square
        ? `M${(x - radius).toFixed(2)} ${(y - radius).toFixed(2)}h${radius * 2}v${radius * 2}h${-radius * 2}z`
        : `M${(x - radius).toFixed(2)} ${y.toFixed(2)}a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0`;
    }
  }
  return d;
}

function routePath(from: LatLon, to: LatLon) {
  const [x1, y1] = project(...from);
  let [x2, y2] = project(...to);
  // Take the short way around when a route would cross most of the map.
  if (Math.abs(x2 - x1) > 180) x2 += x2 > x1 ? -360 : 360;
  const distance = Math.hypot(x2 - x1, y2 - y1);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - distance * 0.28;
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}Q${mx.toFixed(2)} ${my.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export interface MapMarker {
  lat: number;
  lon: number;
  label?: string;
  color?: string;
}

export interface MapRoute {
  from: LatLon;
  to: LatLon;
  color?: string;
}

export interface DotMapProps {
  markers?: MapMarker[];
  routes?: MapRoute[];
  /** Grid spacing in degrees (multiples of 2). */
  dotSpacing?: number;
  /** Dot size, in map units (1 unit = 1 degree). */
  dotRadius?: number;
  /** Square dots, for a pixel look. */
  square?: boolean;
  /** Hide latitudes south of 60°S. */
  cropAntarctica?: boolean;
  dotColor?: string;
  markerColor?: string;
  routeColor?: string;
  labelColor?: string;
  /** Outline behind labels, for contrast. */
  labelHalo?: string;
  /** Label size, in map units. */
  labelSize?: number;
  /** Labels always on, or on hover and focus only. */
  showLabels?: boolean;
  /** Route comet loop length, in seconds. */
  routeSpeed?: number;
  fontFamily?: string;
  /** Makes markers buttons (click, Enter or Space). */
  onMarkerSelect?: (marker: MapMarker, index: number) => void;
  /** Accessible name of the map. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_MARKERS: MapMarker[] = [
  { lat: 37.77, lon: -122.42, label: 'San Francisco' },
  { lat: 40.71, lon: -74.0, label: 'New York' },
  { lat: 51.51, lon: -0.13, label: 'London' },
  { lat: 6.52, lon: 3.38, label: 'Lagos' },
  { lat: 19.08, lon: 72.88, label: 'Mumbai' },
  { lat: 35.68, lon: 139.69, label: 'Tokyo' },
  { lat: -33.87, lon: 151.21, label: 'Sydney' },
  { lat: -23.55, lon: -46.63, label: 'São Paulo' }
];

const DEFAULT_ROUTES: MapRoute[] = [
  { from: [37.77, -122.42], to: [40.71, -74.0] },
  { from: [40.71, -74.0], to: [51.51, -0.13] },
  { from: [51.51, -0.13], to: [6.52, 3.38] },
  { from: [51.51, -0.13], to: [19.08, 72.88] },
  { from: [19.08, 72.88], to: [35.68, 139.69] },
  { from: [35.68, 139.69], to: [-33.87, 151.21] },
  { from: [40.71, -74.0], to: [-23.55, -46.63] }
];

export default function DotMap({
  markers = DEFAULT_MARKERS,
  routes = DEFAULT_ROUTES,
  dotSpacing = 2,
  dotRadius = 0.55,
  square = false,
  cropAntarctica = true,
  dotColor,
  markerColor,
  routeColor,
  labelColor,
  labelHalo = '#1a1c2c',
  labelSize = 4,
  showLabels = true,
  routeSpeed = 3,
  fontFamily,
  onMarkerSelect,
  label = 'World map',
  className = '',
  style
}: DotMapProps) {
  useStyles();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [active, setActive] = useState<number | null>(null);
  const southLimit = cropAntarctica ? -60 : -90;
  const height = 90 - southLimit;
  const land = useMemo(() => dotsPath(Math.max(2, dotSpacing), dotRadius, square, southLimit), [dotSpacing, dotRadius, square, southLimit]);

  return (
    <figure
      className={`bl-map group/map relative w-full [font-family:var(--bl-font,ui-sans-serif,system-ui,sans-serif)] text-(--bl-dot) [&_svg]:block [&_svg]:h-auto [&_svg]:w-full [&_svg]:overflow-visible ${className}`}
      style={{
        '--bl-dot': dotColor,
        '--bl-marker': markerColor,
        '--bl-route': routeColor,
        '--bl-label': labelColor,
        '--bl-label-halo': labelHalo,
        '--bl-label-size': `${labelSize}px`,
        '--bl-label-opacity': showLabels ? 1 : 0,
        '--bl-speed': `${routeSpeed}s`,
        ...(fontFamily ? { '--bl-font': fontFamily } : null),
        margin: 0,
        ...style
      } as CSSVars}
    >
      <svg viewBox={`0 0 360 ${height}`} role="group" aria-label={label}>
        <path d={land} fill="currentColor" aria-hidden="true" />
        <g aria-hidden="true">
          {routes.map((route, index) => {
            const d = routePath(route.from, route.to);
            return (
              <g key={`${uid}-r${index}`}>
                <path className="fill-none stroke-(--bl-route) stroke-[0.5] opacity-35" d={d} />
                <path className="animate-[bl-map-travel_var(--bl-speed)_linear_infinite] fill-none stroke-(--bl-route) stroke-1 [stroke-dasharray:0.18_1] [stroke-linecap:round] motion-reduce:animate-none motion-reduce:stroke-[0.6] motion-reduce:opacity-80 motion-reduce:[stroke-dasharray:none]" d={d} pathLength="1" style={{ animationDelay: `${(-index * 0.53) % routeSpeed}s`, stroke: route.color }} />
              </g>
            );
          })}
        </g>
        {markers.map((marker, index) => {
          const [x, y] = project(marker.lat, marker.lon);
          const flip = x > 300;
          return (
            <g
              key={`${uid}-m${index}`}
              className="group/marker cursor-default text-(--bl-marker) outline-none"
              style={marker.color ? { color: marker.color } : undefined}
              tabIndex={0}
              role={onMarkerSelect ? 'button' : 'img'}
              aria-label={marker.label ?? `${marker.lat}, ${marker.lon}`}
              aria-pressed={onMarkerSelect ? active === index : undefined}
              onClick={() => {
                setActive(index);
                onMarkerSelect?.(marker, index);
              }}
              onKeyDown={event => {
                if (onMarkerSelect && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  setActive(index);
                  onMarkerSelect(marker, index);
                }
              }}
            >
              <circle className="origin-center animate-[bl-map-pulse_2.2s_ease-out_infinite] fill-none stroke-current stroke-[0.6] [transform-box:fill-box] motion-reduce:animate-none motion-reduce:opacity-0" cx={x} cy={y} r="1.6" style={{ animationDelay: `${(index * 0.37) % 2.2}s` }} />
              <circle className="group-hover/marker:stroke-(--bl-label) group-focus-visible/marker:stroke-(--bl-label) group-hover/marker:stroke-[0.6] group-focus-visible/marker:stroke-[0.6]" cx={x} cy={y} r={active === index ? 2.2 : 1.6} fill="currentColor" />
              <circle cx={x} cy={y} r="5" fill="transparent" />
              {marker.label && (
                <text className="pointer-events-none fill-(--bl-label) stroke-(--bl-label-halo) stroke-[1.2] text-(length:--bl-label-size) font-semibold opacity-(--bl-label-opacity) [paint-order:stroke] [stroke-linejoin:round] transition-opacity duration-160 ease-[ease] group-hover/marker:opacity-100 group-focus-visible/marker:opacity-100" x={flip ? x - 3.5 : x + 3.5} y={y + labelSize * 0.35} textAnchor={flip ? 'end' : 'start'}>
                  {marker.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
