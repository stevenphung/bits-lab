// Line icons in the Airbnb style: 24px grid, 1.75 stroke, round caps.
const Svg = ({ children, size = 24, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
);

export const icons = {
  all: props => (
    <Svg {...props}>
      <rect x="4" y="4" width="7" height="7" rx="1.5" />
      <rect x="13" y="4" width="7" height="7" rx="1.5" />
      <rect x="4" y="13" width="7" height="7" rx="1.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.5" />
    </Svg>
  ),
  lab: props => (
    <Svg {...props}>
      <path d="M12 3 21 12 12 21 3 12Z" />
      <path d="M12 8 16 12 12 16 8 12Z" />
    </Svg>
  ),
  'text-animations': props => (
    <Svg {...props}>
      <path d="M3 19 8 5l5 14" />
      <path d="M5 14h6" />
      <path d="M15 11.5c.6-1 1.6-1.5 2.8-1.5 1.8 0 3.2 1.1 3.2 3v6" />
      <path d="M21 15.5c-1-.6-2-.8-3-.8-1.6 0-3 .9-3 2.2S16.2 19 17.6 19c1.5 0 2.8-.9 3.4-2" />
    </Svg>
  ),
  animations: props => (
    <Svg {...props}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="m6 6 2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />
    </Svg>
  ),
  components: props => (
    <Svg {...props}>
      <path d="m12 3 9 5-9 5-9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </Svg>
  ),
  backgrounds: props => (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2.5" />
      <path d="m3 16 5-5 4 4 3-3 6 6" />
      <circle cx="16" cy="9" r="1.5" />
    </Svg>
  ),
  micro: props => (
    <Svg {...props}>
      <rect x="2.5" y="7" width="19" height="10" rx="5" />
      <circle cx="16.5" cy="12" r="3" />
    </Svg>
  ),
  tools: props => (
    <Svg {...props}>
      <path d="M14.5 6.5a4 4 0 0 0 5 5L21 13l-8 8-3-3 1.5-1.5a4 4 0 0 1-5-5L4 9l3-3 2.5 2.5" />
      <path d="m3 21 6-6" />
    </Svg>
  ),
  search: props => (
    <Svg strokeWidth="3" {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5" />
    </Svg>
  ),
  share: props => (
    <Svg {...props}>
      <path d="M12 15V3M7.5 7.5 12 3l4.5 4.5" />
      <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
    </Svg>
  ),
  reset: props => (
    <Svg {...props}>
      <path d="M3 4v6h6" />
      <path d="M3.5 13a8.5 8.5 0 1 0 2-6.5L3 10" />
    </Svg>
  ),
  replay: props => (
    <Svg {...props}>
      <path d="M21 4v6h-6" />
      <path d="M20.5 13a8.5 8.5 0 1 1-2-6.5L21 10" />
    </Svg>
  ),
  copy: props => (
    <Svg {...props}>
      <rect x="8" y="8" width="13" height="13" rx="2.5" />
      <path d="M16 8V5.5A2.5 2.5 0 0 0 13.5 3h-8A2.5 2.5 0 0 0 3 5.5v8A2.5 2.5 0 0 0 5.5 16H8" />
    </Svg>
  ),
  check: props => (
    <Svg {...props}>
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </Svg>
  ),
  external: props => (
    <Svg {...props}>
      <path d="M14 4h6v6M20 4l-9 9" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </Svg>
  )
};

export function Icon({ name, ...props }) {
  const Glyph = icons[name] ?? icons.all;
  return <Glyph {...props} />;
}
