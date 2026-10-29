# Bits Lab component roadmap

**Mission (from 2026-10-29):** game feel for real products. Games solved feedback, progress and reward long ago; Bits Lab brings those patterns to everyday software. New work is judged first by how well it turns a flat product moment (onboarding, saving, waiting, deleting, coming back) into one that answers back, shows progress or rewards a real milestone, while staying accessible and calm under reduced motion.

Original goal: turn Bits Lab into the largest library of highly polished React components. Researched 2026-10-27.

## Status

**Wave 1 complete: all 56 items shipped (2026-10-27). Wave 2 complete: all 52 items shipped (2026-10-27). Wave 3 complete: all 12 items shipped (2026-10-28), so every proposal on this roadmap is built. Shipped items are marked ✅ below.**

**Wave 4 complete (2026-10-28):** 37 more originals for effects, backgrounds, cards and micro-interactions, in six phases plus a launch phase. See section 6. All phases are done: 159 originals, published at bits-lab.vercel.app and on npm as `bits-lab`.

**Wave 5 planned (2026-10-29):** fill the gaps found by comparing Bits Lab with affectUI: light mode and AI-tool docs across the library, 10 game-feel product components, a new Scenes & Mascots category of 8 pixel scenes, and 6 upgrades to existing components. See section 7. Phase B done (169 originals); A1 light mode done (109 components, follow-ups included); Phase C done (177 originals); A2 and D next.

- **Pixel & game set (12 items):** shipped 2026-10-26. They live in the Pixel & Game UI category, at `/pixel-game/<slug>`.
- **Product showcase set (9 items, #21–25, 27–29, 34):** shipped 2026-10-26. They live in the Product Showcase category, at `/showcase/<slug>`.
- **Scroll storytelling set (4 items, #35–38):** shipped 2026-10-26. They live in the Scroll Storytelling category, at `/scroll/<slug>`. Each one tracks the nearest scroll box or the window.
- **Overlays & feedback set (5 items, #43–46, 50):** shipped 2026-10-26. They live in the Overlays & Feedback category, at `/overlays/<slug>`. MorphDialog and SpringDrawer use `react-dom` portals.
- **Navigation set (4 items, #54–57):** shipped 2026-10-26. They live in the Navigation category, at `/navigation/<slug>`. CommandPalette uses a `react-dom` portal.
- **Forms & inputs set (4 items, #62–64, 72):** shipped 2026-10-27. They live in the Forms & Inputs category, at `/inputs/<slug>`, with TypeScript variants from day one.
- **Data & numbers set (3 items, #73, 74, 76):** shipped 2026-10-27, at `/data/<slug>`. Charts follow the dataviz rules: 2px lines, ~10% area wash, ringed end dots, value-first tooltips, keyboard scrubbing, and a screen-reader summary plus data table. RingProgress defaults to three categorical steps validated for the dark surface (`#1a1c2c`).
- **Cards, text & AI set (10 items, #81, 88, 91–93, 96, 99, 105, 106, 108):** shipped 2026-10-27. Cards & Media at `/cards/<slug>`, the four text pieces in Text Animations, GravityBox in Physics & Playful (`/playful/gravity-box`, the one original with a dependency: `matter-js`), and the AI surfaces at `/ai/<slug>`.
- **Backgrounds & primitives set (5 items, #111, 112, 118–120):** shipped 2026-10-27. RetroHorizon and FlickerGrid in Backgrounds (`/backgrounds/<slug>`); Accordion, OverlayKit (Dialog, Sheet, Tooltip, Popover, Dropdown with shared `MOTION` tokens) and ToggleKit (Switch, Checkbox, Radio, RadioGroup on native inputs) in the new Primitives category (`/primitives/<slug>`). TypeScript variants from day one.
- **Wave 2 · Pixel & game set (8 items, #11, 12, 14–19):** shipped 2026-10-27, in Pixel & Game UI (`/pixel-game/<slug>`): BootSequence, VoxelTiles, GameOver, ScoreTicker, PixelExplode, Minimap, QuestLog and PixelAvatar, each with a TypeScript variant. Sounds stay opt-in: BootSequence has a built-in beep, the others expose callbacks (`onQuestComplete`, `onComplete`) for ChiptuneKit.
- **Wave 2 · Product showcase set (5 items, #26, 30–33):** shipped 2026-10-27, in Product Showcase (`/showcase/<slug>`): LogoOrbit, ChangelogTimeline, TestimonialWall (with a Pause button, since its motion runs past 5 seconds), CodeShowcase (an LCS line diff drives the morph between file tabs) and PricingFlip (the save badge is computed from the plans' own prices). Each has a TypeScript variant.
- **Wave 2 · Scroll storytelling set (3 items, #39–41):** shipped 2026-10-27, in Scroll Storytelling (`/scroll/<slug>`): ScrollZoom (a clip-path frame over a full-size image, so it stays sharp), ParallaxCollage and ChapterProgress (the chapter list is the keyboard path and moves focus to the heading). Like the Wave 1 scroll pieces, each finds its own scroll container, and each has a TypeScript variant.
- **Wave 2 · Overlays & feedback set (6 items, #47–49, 51–53):** shipped 2026-10-27, in Overlays & Feedback (`/overlays/<slug>`): LinkPeek, AvatarTooltips, ContextOrb (flick-to-select radial menu with a full keyboard path), StepLoader, SkeletonShimmer (traces skeletons from the real layout with `Range.getClientRects`, one bar per rendered line) and SpotlightTour. Each has a TypeScript variant.
- **Wave 2 · Navigation set (3 items, #58, 60, 61):** shipped 2026-10-27, in Navigation (`/navigation/<slug>`): MegaMenu (one shared panel that slides and resizes between triggers, clamped to the viewport), SideRail (icon-rail mode with tooltips and flyouts) and MobileTabBar (a blob whose leading edge moves first, so it stretches between tabs). Each has a TypeScript variant.
- **Wave 2 · Forms & inputs set (6 items, #65–70):** shipped 2026-10-27, in Forms & Inputs (`/inputs/<slug>`): TagInput (combobox autocomplete, paste-to-split), PasswordMeter, DateRange (full keyboard grid, Intl locale, presets), ColorDial (hue ring + SV square, eyedropper where supported), RangeDual (histogram, draggable selection) and StepperForm (native validity first, then sync or async validate). Each has a TypeScript variant.
- **Wave 2 · Data & numbers set (4 items, #75, 77, 78, 80):** shipped 2026-10-27, at `/data/<slug>`, following the dataviz rules: BarRace uses the 8-slot categorical palette validated on the dark surface (#1a1c2c, all checks pass), color follows the entity not the rank, and every bar is direct-labeled because ranks reorder; Heatmap uses the single-hue blue ramp with quiet days receding toward the surface; StatCard follows the stat-tile contract (sentence-case label, proportional figures, signed delta vs a named period colored by direction × good-direction with an arrow, 12-point sparkline); GaugeMeter colors its fill by severity with status colors always paired with an icon and label. Each has a TypeScript variant.
- **Wave 2 · Cards & media set (6 items, #82–84, 86, 87, 89):** shipped 2026-10-27, in Cards & Media (`/cards/<slug>`): DirectionHover, PinCard, CipherCard, FocusGrid (pure CSS via `:has`), StoryViewer (tap zones, hold to pause, keyboard) and LightboxGallery (grows from the thumbnail; swipe, wheel/pinch/double-click zoom, pan; modal focus handling). Each has a TypeScript variant, which brings Bits Lab to 100 originals.
- **Wave 2 · Text set (3 items, #94, 95, 98):** shipped 2026-10-27, in Text Animations: LetterSwap (3D letter cubes, word read once by screen readers), CutReveal (lines measured from the real layout, revealed through vertical cuts driven by a registered `@property`) and Spoiler (a particle field that scatters; a button while hidden, plain text once revealed). Each has a TypeScript variant.
- **Wave 2 · Playful & AI set (5 items, #100, 101, 107, 109, 110):** shipped 2026-10-27. In Physics & Playful: ElasticString (strings that bend under the pointer and ring back on a spring, with an `onPluck` hook for sound) and StickerBoard (drag, peel, slap-down, Shift+scroll rotate, full keyboard moves, layout saved to localStorage). In AI Surfaces: AgentCard (tool-call status, live timer, streaming logs, result or error), SuggestionChips (staggered prompt chips that reshuffle without repeats) and DiffReveal (word-level diff merged into phrases; deletions strike and fold, insertions type in; exports `diffWords`). Each has a TypeScript variant.
- **Wave 2 · Backgrounds set (3 items, #113, 114, 117):** shipped 2026-10-27, in Backgrounds: InteractiveGrid (cells light under the pointer and cool through a colour ramp, unbroken trails on fast moves, click ripples, idle autopilot; listens on the window so overlaid content doesn't block it), MeteorShower (meteors on a shared heading over twinkling stars, pixel-snapped or smooth) and WebcamPixels (camera as pixel art, ASCII or halftone dots with palette snapping; asks only after a click, explains blocked, missing, busy and unsupported cameras, shows LIVE with a Stop button and releases the camera on unmount; `src` renders an image or video instead). Each has a TypeScript variant. This completes Wave 2.
- **Wave 3 (12 items, #42, 59, 71, 79, 85, 90, 97, 102–104, 115, 116):** shipped 2026-10-28, the first set built in all four variants (JS, TS, CSS, Tailwind) from day one:
  - Scroll and text: ScrollTypography (words react to scroll velocity, rippling word by word) and KineticHeadline (letters breathe in a wave, pulse to a tempo or follow the scroll). Both are made for variable fonts; the demos use Roboto Flex, now loaded with the app's other Google Fonts.
  - Navigation, inputs and data: BreadcrumbTrail (folds middle crumbs into an animated "…" menu when space runs out), InlineEdit (click-to-edit with a field that grows with its text, validation and async saves) and FunnelFlow (single-hue funnel with particles; the share that drops out falls away; summary, arrow-key readout and a table for screen readers).
  - Cards and playful: WobbleCard, Polaroids (fling photos with momentum, spin and edge bounces), CursorAttractor, JellyBlob (a soft-body button built from a ring of springs) and Screensaver (bouncing logo, corner-hit celebration, optional idle mode).
  - Backgrounds: HexField (canvas hex grid with a rest wave, pointer glow and click ripples) and CloudSky (a small WebGL ray-marched cloud shader with quality presets, a pixel-art mode and a gradient fallback).
- **What every shipped item meets so far:**
  - a single file with zero dependencies, installable from the Bits Lab registry;
  - keyboard and screen-reader support;
  - a reduced-motion fallback;
  - touch support;
  - pausing off-screen where it animates;
  - themeable colors.
- **Land data:** DotGlobe and DotMap embed a 2° land bitmap from Natural Earth (public domain). `scripts/build-land-mask.mjs` regenerates it.
- **TypeScript variants:** done for all 123 Bits Lab originals (2026-10-27; Wave 3 on 2026-10-28). Each lives in `src/bits/ts/<Name>.tsx` with an exported, documented `Props` interface, installs as `<Name>-TS`, and is selectable on every page with the JavaScript/TypeScript toggle. `npm run check:ts` runs a strict type check and confirms each variant compiles to exactly the same code as its `.jsx`, so the two can't drift.
- **Tailwind variants:** started and finished 2026-10-27; 123 of 123 done (Wave 3 shipped with its Tailwind variants on 2026-10-28).
  - Batch 1: the 13 canvas and inline-styled originals, plus SuggestionChips and PixelButton.
  - Batch 2: the 16 originals with the smallest stylesheets (TextOnPath, VoiceOrb, DotGlobe, GravityBox, Minimap, SketchHighlight, CipherCard, ParallaxCollage, ConnectBeams, MorphWords, PixelAvatar, ScrollTilt, FocusGrid, PressStart, TracingLine, CutReveal).
  - Batch 3: CRTPower, DirectionHover, DynamicIsland, ScrollZoom, Spoiler, MorphPopover, RollingNumber, GaugeMeter, LetterSwap, MorphDialog, SkeletonShimmer, HorizontalTrack, VoxelTiles, LogoOrbit, StatCard, VanishInput.
  - Batch 4: AvatarTooltips, ScreenScroller, SlideTabs, SmartNavbar, CompareSlider, DotMap, ToggleGroup, PixelLoader, SpringDrawer, StickerBoard, LevelMap, QuestDialog, RingProgress, ColorDial, ContextOrb, WebcamPixels.
  - Batch 5: BarRace, PinCard, ExpandCard, HealthBar, Heatmap, RangeDual, SparkChart, StoryViewer, TerminalDemo, TestimonialWall, VideoHero, ChapterProgress, DiffReveal, StreamingText, ToastStack, MobileTabBar.
  - Batch 6: LinkPeek, PasswordMeter, ChangelogTimeline, CommandPalette, ScoreTicker, BootSequence, DeviceFrame, InventoryGrid, SpotlightTour, BentoGrid, GameOver, LightboxGallery, ThinkingShimmer, DropZone, FeatureTabs, StepperForm.
  - Batch 7: MegaMenu, PricingFlip, AgentCard, OTPInput, ToggleKit, TagInput, DateRange, AchievementToast, QuestLog, SideRail, StepLoader, ChatBubbles, CodeShowcase, OverlayKit, StickyReveal, Accordion.
  - Breakpoints use exact arbitrary variants (`[@container(max-width:560px)]:`, `[@media(max-width:640px)]:`), because Tailwind's `@max-*` and `max-*` are strict `<` while the originals' `max-width` queries are inclusive. Overlapping breakpoints become ranges (`[@container(560px<width<=860px)]:`), since Tailwind doesn't keep the source order that decides between them in CSS.
  - Classes the code looks up (`querySelector('.bl-x')`, `closest`, `classList`) stay on the Tailwind markup as unstyled hooks; `check:tw` fails if one goes missing.
  - Class prefixes and keyframe names are unique across the library (LevelMap is `bl-lvl`, ContextOrb `bl-corb`, StickyReveal `bl-sreveal`), so any components can share a page.
  - Each lives in `src/bits/tw/<Name>.jsx` with a TypeScript twin in `src/bits/tw-ts/<Name>.tsx`. They install as `<Name>-TW` and `<Name>-TS-TW` and show on the page through a CSS / Tailwind switch beside JavaScript / TypeScript.
  - Styling is Tailwind v4 utilities. Theme props still set `--bl-*` variables, which the classes read (`bg-(--bl-face)`), and states use the same data attributes (`data-[size=sm]:`). Only `@keyframes` (and any `@property` they animate) ship as a small injected style, so a pasted component needs no CSS edits. Group variants are always named (`group/cut`), so they can't collide with groups in content passed in.
  - `npm run check:tw` checks that each Tailwind variant matches its original exactly beyond `className`, `style` and the CSS injection. It also type-checks the tw-ts twins and confirms each one compiles to its tw source. `node scripts/make-tw-ts.mjs <Name>` builds a twin from the TypeScript original.
  - `/tw-check.html` renders the original and the Tailwind version side by side and diffs every computed style, including `::before` and `::after`. Fixtures live in `src/tools/tw-check/fixtures.jsx`. It covers static states only: `:hover` and `:focus` aren't exercised.
- **Done:** every original has CSS and Tailwind variants in JS and TS (quality bar item 1). `npm run check:tw` passes 123/123, and `/tw-check.html` shows computed-style parity for every fixture.

## 1. The landscape

| Library | Size (approx.) | Known for | License | Takeaway for Bits Lab |
|---|---|---|---|---|
| **Magic UI** | ~250 (incl. community) | Landing-page polish: Animated Beam, Globe, Marquee, Bento, device mocks, text animations | MIT | Strong at "product launch" pieces we lack |
| **Aceternity UI** | 200+ | Bold hero effects, 3D cards, scroll storytelling, Lamp/Spotlight, Pro blocks | Pro licence bars redistributing source; free-tier terms not stated on the licence page | Huge reach; we must design originals, not ports |
| **Cult UI** | ~150 | App-grade interactive pieces: Dynamic Island, Family Drawer, Floating Panel, device mocks, "Halo" form kit, illustrations | shadcn convention (copy-paste) | Proves demand for polished *app* UI, not just effects |
| **Motion Primitives** | ~35 | Small composable building blocks: Morphing Dialog, Text Effect, In View, Sliding Number | Copy-paste | Model for a "primitives" tier |
| **Fancy Components** | ~40 | Physics (gravity, elastic line), variable-font and letter-swap text, SVG filters | Free, open source | Playful physics and typography niche |
| **Kokonut UI / Skiper UI / Animate UI / 21st.dev** | Varies | AI surfaces, "uncommon" components, animated Radix/Base UI primitives, community registry with shadcn CLI install | Mostly MIT | The shadcn-CLI registry is now table stakes, and Bits Lab already has one |

What the leaders share:
- copy-paste source with one-command install (shadcn CLI),
- Motion and Tailwind under the hood,
- live demos with editable props.

Where they're weak:
- **Consistent quality across the whole catalog.** Many are demo-grade: weak accessibility, no `prefers-reduced-motion`, little mobile or touch support.
- **Variants:** few ship JS, TS, CSS and Tailwind versions.
- **Pixel and game UI:** none owns it.

## 2. Gaps at the start (2026-10-27)

| Area | Competitors offer | Gap |
|---|---|---|
| Backgrounds / shaders | Grids, beams, meteors, retro grid | Small |
| Text animation | Number tickers, morphing text, text-on-path, hand-drawn highlights | Medium |
| Cursor & hover effects | Lens, pointer highlight, direction-aware hover | Small |
| Cards & galleries | Expandable/morphing cards, 3D pin, evervault | Medium |
| **Product showcase** (device mocks, browser frames, globe, beams, maps) | Magic UI, Aceternity, Cult UI | **Large** |
| **Scroll storytelling** (sticky reveal, container scroll, tracing beam) | Aceternity, Fancy | **Large** |
| **Overlays** (morphing dialog/popover, link preview, toasts, drawers) | Motion Primitives, Cult UI | **Large** |
| **Navigation** (dynamic island, sliding tabs, ⌘K palette, mega menu) | Cult UI, Aceternity | **Large** |
| **Forms & inputs** (OTP, file drop, tag input, vanish input, date picker) | Aceternity, Cult UI "Halo" kit | **Large** |
| **Data & feedback** (animated charts, rolling numbers, confetti, multi-step loader) | Magic UI, Aceternity | **Large** |
| **Physics** (gravity drop, elastic line, draggable stickers) | Fancy Components | Medium |
| **AI-era surfaces** (voice orb, streaming text, thinking states) | Kokonut UI, Cult UI | Medium |
| **Pixel & game UI** | Nobody | **Open niche** |

## 3. The Bits Lab quality bar

Every new component ships only when it passes all of these. This is what "highly polished" means in practice, and it's the moat against bigger but uneven catalogs.

1. **Four variants:** JS, TS, CSS and Tailwind, from one source of truth, installable via the Bits Lab registry.
2. **Accessible:**
   - keyboard operable with visible focus;
   - correct ARIA roles;
   - announced state changes;
   - 4.5:1 text contrast in the demo theme.
3. **Motion-safe:** honors `prefers-reduced-motion` with a meaningful static fallback, never just "off".
4. **Touch and mobile:** pointer events, no hover-only functionality, and it works at 375px.
5. **Performance budget:**
   - 60fps on a mid-range laptop and holds up on phones;
   - pauses when off-screen;
   - cleans up every listener, rAF loop and WebGL context;
   - no layout thrash.
6. **Robust:**
   - SSR-safe (Next.js App Router);
   - StrictMode-safe;
   - fully controlled and uncontrolled modes where relevant;
   - no global CSS leaks (scoped class prefix).
7. **Themeable:** colors via props or CSS variables. Good defaults in light and dark.
8. **Documented:**
   - full prop table, generated Customize controls and usage snippet;
   - one "recipe" showing it in a real layout;
   - passes the smoke sweep and visual check.
9. **Minimal dependencies:** none where possible; otherwise only `motion`, `gsap`, `three`/`ogl` or `matter-js`, which are already in the catalog.
10. **Original:** designed and written from scratch. No ported code from other libraries. Ideas only, credited as "inspired by a pattern seen in X" where a pattern is well known.

## 4. Proposed new components (120)

Legend:
- **Effort:** S (≤1 day), M (2–4 days), L (1–2 weeks).
- **Priority:** P1 = Wave 1 (fills the biggest gap or is a signature piece), P2 = Wave 2, P3 = later.

### 4.1 Pixel & game UI: the signature collection (no competitor has this)

| # | Component | What it does | Effort | Pri |
|---|---|---|---|---|
| 1 | **QuestDialog** ✅ | RPG text box: typewriter text with per-character sound, speaker portrait, skippable, choice buttons, keyboard advance | M | P1 |
| 2 | **HealthBar** ✅ | Segmented HP/XP/mana bar with damage flash, a lagging "ghost" bar, heal shimmer and critical pulse | S | P1 |
| 3 | **InventoryGrid** ✅ | Drag-and-drop item slots with stack counts, rarity glows, tooltips, keyboard moving and swap animations | L | P1 |
| 4 | **AchievementToast** ✅ | Slide-in achievement popup with sprite icon, chiptune sting and a queue | S | P1 |
| 5 | **PressStart** ✅ | Blinking title-screen prompt with an attract-mode timeout and any-key / tap to start | S | P1 |
| 6 | **CRTPower** ✅ | CRT power on/off transition (line collapse, glow, flicker) wrapping any content | M | P1 |
| 7 | **PixelLoader** ✅ | Retro loading screen: chunk-based progress, rotating tips and spinner sprites | S | P1 |
| 8 | **SpriteAnimator** ✅ | Plays sprite-sheet animations (idle, walk, jump) with fps, loop and ping-pong; canvas or CSS steps | M | P1 |
| 9 | **PixelParallax** ✅ | Multi-layer pixel scene with scroll or mouse parallax and a day-night cycle | M | P1 |
| 10 | **LevelMap** ✅ | World-map path: nodes unlock along an animated dotted trail, with locked/cleared/current states (onboarding, roadmaps) | L | P1 |
| 11 | **BootSequence** ✅ | Retro BIOS/terminal boot text with POST checks, beeps and a final reveal | S | P2 |
| 12 | **VoxelTiles** ✅ | Isometric voxel tile map; hover lifts tiles; data-driven heightmap | L | P2 |
| 13 | **PixelButton** ✅ | Chunky 8-bit button family: press-down bevel, sound, loading pips, disabled crack | S | P1 |
| 14 | **GameOver** ✅ | Full-screen end state: continue countdown, score tally and retry (fun 404/500 pages) | S | P2 |
| 15 | **ScoreTicker** ✅ | Arcade odometer for scores with combo multiplier popups | S | P2 |
| 16 | **PixelExplode** ✅ | Disintegrates any element into pixels (delete/dismiss), with optional reassemble | M | P2 |
| 17 | **Minimap** ✅ | Scaled live overview of a long page with a draggable viewport box | M | P2 |
| 18 | **QuestLog** ✅ | Checklist with quest states, XP rewards and "quest complete" fanfare (onboarding) | M | P2 |
| 19 | **PixelAvatar** ✅ | Deterministic pixel avatar from a seed/username (identicon-style, original art) | S | P2 |
| 20 | **ChiptuneKit** ✅ | Hook + components to attach synthesized chiptune sounds to any UI event, with a global mute | S | P1 |

### 4.2 Product showcase

| # | Component | What it does | Effort | Pri |
|---|---|---|---|---|
| 21 | **DeviceFrame** ✅ | Original phone / tablet / laptop / browser / watch frames wrapping any content or video; light/dark; tilt | M | P1 |
| 22 | **ScreenScroller** ✅ | Scroll-driven device: the screen content scrolls while the device rotates into place | M | P1 |
| 23 | **DotGlobe** ✅ | Interactive dotted globe (2D canvas, no deps) with arcs between points, markers, drag to spin, auto-rotate | L | P1 |
| 24 | **DotMap** ✅ | Flat dotted world map with pulsing locations and animated routes | M | P1 |
| 25 | **ConnectBeams** ✅ | Animated beams connecting DOM nodes (integration diagrams), with gradient pulses along SVG paths | M | P1 |
| 26 | **LogoOrbit** ✅ | Logos orbiting a central brand mark on concentric rings, with pause on hover | S | P2 |
| 27 | **BentoGrid** ✅ | Responsive bento layout with hover reveals, media tiles and a spotlight border | M | P1 |
| 28 | **FeatureTabs** ✅ | Feature switcher with an auto-advancing progress bar and a crossfading media panel | M | P1 |
| 29 | **CompareSlider** ✅ | Before/after image or component comparison with drag, keyboard and vertical/horizontal modes | S | P1 |
| 30 | **ChangelogTimeline** ✅ | Vertical timeline whose beam fills on scroll, with sticky dates and media entries | M | P2 |
| 31 | **TestimonialWall** ✅ | Masonry wall of quotes in multi-row marquees; pauses and expands on hover | M | P2 |
| 32 | **CodeShowcase** ✅ | Animated code block: line-by-line reveal, diff highlight and tab morphing between files | M | P2 |
| 33 | **PricingFlip** ✅ | Monthly/yearly toggle with rolling price numbers and a "save %" badge | S | P2 |
| 34 | **TerminalDemo** ✅ | Scripted terminal session with typing, outputs and spinner for CLI products | S | P1 |

### 4.3 Scroll storytelling

| # | Component | What it does | Effort | Pri |
|---|---|---|---|---|
| 35 | **StickyReveal** ✅ | Sticky media column whose content swaps as text sections scroll past | M | P1 |
| 36 | **ScrollTilt** ✅ | Card that tilts from 3D perspective to flat as it scrolls into view (hero product shots) | S | P1 |
| 37 | **TracingLine** ✅ | A line that draws itself alongside the content as you scroll, with dot markers | M | P1 |
| 38 | **HorizontalTrack** ✅ | Vertical scroll drives a horizontal gallery with snap points and progress | M | P1 |
| 39 | **ScrollZoom** ✅ | Image zooms from a small frame to full-bleed, then reveals the next section | M | P2 |
| 40 | **ParallaxCollage** ✅ | Layered collage whose pieces drift at different depths | M | P2 |
| 41 | **ChapterProgress** ✅ | Reading progress with chapter ticks, current-section label and jump links | S | P2 |
| 42 | **ScrollTypography** ✅ | Words scale, weight-shift and recolor with scroll velocity (variable fonts) | M | P3 |

### 4.4 Overlays & feedback

| # | Component | What it does | Effort | Pri |
|---|---|---|---|---|
| 43 | **MorphDialog** ✅ | Card morphs into a dialog (shared layout); focus trap, Esc, scroll lock, a11y | M | P1 |
| 44 | **MorphPopover** ✅ | Button morphs into a popover/form and back | M | P1 |
| 45 | **ToastStack** ✅ | Stacked toasts that expand on hover, swipe to dismiss, promise states, queue | M | P1 |
| 46 | **SpringDrawer** ✅ | Bottom/side drawer with snap points, velocity flicks and nested drawers | L | P1 |
| 47 | **LinkPeek** ✅ | Hovering a link shows a live preview card (image/metadata) | S | P2 |
| 48 | **AvatarTooltips** ✅ | Overlapping avatar stack; hover springs a tooltip and spreads the stack | S | P2 |
| 49 | **ContextOrb** ✅ | Radial right-click/long-press menu with gesture selection | M | P2 |
| 50 | **Confetti** ✅ | Physics confetti/emoji/sprite bursts from any element, with presets; canvas, pooled | S | P1 |
| 51 | **StepLoader** ✅ | Multi-step progress overlay with check-off animations and cancel | S | P2 |
| 52 | **SkeletonShimmer** ✅ | Skeletons generated from children's layout, crossfading into real content | M | P2 |
| 53 | **SpotlightTour** ✅ | Product tour: spotlight cutout, animated step bubbles, keyboard nav | L | P2 |

### 4.5 Navigation

| # | Component | What it does | Effort | Pri |
|---|---|---|---|---|
| 54 | **DynamicIsland** ✅ | Pill that morphs between states (music, call, timer, notification) | M | P1 |
| 55 | **SlideTabs** ✅ | Tabs with a sliding/stretching indicator, overflow scroll and keyboard support | S | P1 |
| 56 | **CommandPalette** ✅ | ⌘K palette: fuzzy search, groups, nested pages, recent items, animated height | L | P1 |
| 57 | **SmartNavbar** ✅ | Navbar that hides on scroll down, shrinks to a pill and blurs over content | S | P1 |
| 58 | **MegaMenu** ✅ | Morphing dropdown whose panel resizes and slides between triggers | M | P2 |
| 59 | **Breadcrumb Trail** ✅ | Breadcrumbs that collapse into an animated overflow menu | S | P3 |
| 60 | **SideRail** ✅ | Collapsible app sidebar with icon rail mode, tooltips and nested groups | M | P2 |
| 61 | **MobileTabBar** ✅ | Bottom tab bar with a morphing active blob and haptic-style bounce | S | P2 |

### 4.6 Forms & inputs

| # | Component | What it does | Effort | Pri |
|---|---|---|---|---|
| 62 | **OTPInput** ✅ | One-time code input: paste handling, shake on error, success morph | S | P1 |
| 63 | **VanishInput** ✅ | Rotating placeholders; on submit the text dissolves into particles | S | P1 |
| 64 | **DropZone** ✅ | File drop with magnetic drag-over, per-file progress and thumbnails | M | P1 |
| 65 | **TagInput** ✅ | Chips with spring add/remove, autocomplete, paste-to-split | M | P2 |
| 66 | **PasswordMeter** ✅ | Strength meter with requirement checklist ticks and reveal toggle | S | P2 |
| 67 | **DateRange** ✅ | Calendar date-range picker with morphing month transitions and presets | L | P2 |
| 68 | **ColorDial** ✅ | Color picker: hue ring, saturation/brightness square, swatches, eyedropper | M | P2 |
| 69 | **RangeDual** ✅ | Dual-thumb slider with histogram backdrop and tooltips (price filters) | M | P2 |
| 70 | **StepperForm** ✅ | Multi-step form shell with an animated progress rail and validation gates | M | P2 |
| 71 | **InlineEdit** ✅ | Click-to-edit text with smooth width animation and save/cancel | S | P3 |
| 72 | **ToggleGroup** ✅ | Segmented control with a sliding thumb (single and multi select) | S | P1 |

### 4.7 Data & numbers

| # | Component | What it does | Effort | Pri |
|---|---|---|---|---|
| 73 | **RollingNumber** ✅ | Per-digit rolling (odometer) number with locale formatting and tabular figures | S | P1 |
| 74 | **SparkChart** ✅ | Animated sparkline/area chart with hover scrubber and tooltip; tiny SVG, no deps | M | P1 |
| 75 | **BarRace** ✅ | Animated ranking bar chart over time | M | P2 |
| 76 | **RingProgress** ✅ | Circular progress/goal rings with gradient stroke and stacked rings | S | P1 |
| 77 | **Heatmap** ✅ | Contribution-style heatmap with staggered fill and tooltips | S | P2 |
| 78 | **StatCard** ✅ | KPI card with rolling value, delta arrow and mini chart | S | P2 |
| 79 | **FunnelFlow** ✅ | Animated funnel/flow diagram with particles flowing between stages | M | P3 |
| 80 | **GaugeMeter** ✅ | Analog gauge with springy needle and tick labels | S | P2 |

### 4.8 Cards & media

| # | Component | What it does | Effort | Pri |
|---|---|---|---|---|
| 81 | **ExpandCard** ✅ | Card expands into a full article view (shared layout) | M | P1 |
| 82 | **DirectionHover** ✅ | Overlay slides in from the side the cursor entered | S | P2 |
| 83 | **PinCard** ✅ | 3D perspective pin: hover lifts the card with a beam to a map pin | M | P2 |
| 84 | **CipherCard** ✅ | Card whose surface reveals scrambled characters under the cursor | S | P2 |
| 85 | **WobbleCard** ✅ | Jelly card that deforms toward the cursor | S | P3 |
| 86 | **FocusGrid** ✅ | Hovering one card blurs and dims the rest | S | P2 |
| 87 | **StoryViewer** ✅ | Instagram-style stories: progress bars, tap zones, hold to pause | M | P2 |
| 88 | **VideoHero** ✅ | Click-to-expand video with animated play button and lightbox | S | P1 |
| 89 | **LightboxGallery** ✅ | Thumbnail to fullscreen with pinch zoom, swipe and keyboard | M | P2 |
| 90 | **Polaroids** ✅ | Draggable photo pile with physics tossing and drop shadows | M | P3 |

### 4.9 Text

| # | Component | What it does | Effort | Pri |
|---|---|---|---|---|
| 91 | **TextOnPath** ✅ | Text flowing along any SVG path, animated offset, responsive | S | P1 |
| 92 | **MorphWords** ✅ | Words morph into each other via blur/threshold (gooey) | S | P1 |
| 93 | **SketchHighlight** ✅ | Hand-drawn underline/circle/box annotations drawn on view | M | P1 |
| 94 | **LetterSwap** ✅ | Hover swaps letters with a staggered 3D roll | S | P2 |
| 95 | **CutReveal** ✅ | Lines reveal through vertical cuts with staggered masks | S | P2 |
| 96 | **StreamingText** ✅ | LLM-style token streaming with a cursor, markdown-aware and fading tail | S | P1 |
| 97 | **KineticHeadline** ✅ | Variable-font headline whose weight/width breathe to the beat or scroll | M | P3 |
| 98 | **Spoiler** ✅ | Hidden text with an animated particle mask, revealed on click | S | P2 |

### 4.10 Physics & playful

| # | Component | What it does | Effort | Pri |
|---|---|---|---|---|
| 99 | **GravityBox** ✅ | Any children become rigid bodies you can throw (matter-js); auto-sleep for performance | M | P1 |
| 100 | **ElasticString** ✅ | A line that bends and wobbles under the cursor like a guitar string | S | P2 |
| 101 | **StickerBoard** ✅ | Draggable stickers with peel, rotate and stacking; persists layout | M | P2 |
| 102 | **CursorAttractor** ✅ | Elements are pulled toward the cursor with springs and release | S | P3 |
| 103 | **JellyBlob** ✅ | Soft-body blob CTA that squishes on press | M | P3 |
| 104 | **Screensaver** ✅ | Bouncing-logo screensaver with corner-hit celebration (idle state) | S | P3 |

### 4.11 AI-era surfaces

| # | Component | What it does | Effort | Pri |
|---|---|---|---|---|
| 105 | **VoiceOrb** ✅ | Audio-reactive orb (mic or simulated) with listening, thinking and speaking states | M | P1 |
| 106 | **ThinkingShimmer** ✅ | Shimmering "Thinking…" with step disclosure and elapsed time | S | P1 |
| 107 | **AgentCard** ✅ | Tool-call card: running, success and error states with collapsible logs | M | P2 |
| 108 | **ChatBubbles** ✅ | Chat thread with spring entry, typing indicator and reactions | M | P1 |
| 109 | **SuggestionChips** ✅ | Prompt suggestion chips that shuffle and stagger in | S | P2 |
| 110 | **DiffReveal** ✅ | Animated text/code diff showing AI edits word by word | M | P2 |

### 4.12 Backgrounds (only distinct additions)

| # | Component | What it does | Effort | Pri |
|---|---|---|---|---|
| 111 | **RetroHorizon** ✅ | Synthwave perspective grid with a sun and scanline sky; fits the pixel identity | S | P1 |
| 112 | **FlickerGrid** ✅ | Grid of cells flickering randomly, optionally masked by text or a logo | S | P1 |
| 113 | **InteractiveGrid** ✅ | Cells light up and trail under the cursor | S | P2 |
| 114 | **MeteorShower** ✅ | Diagonal meteors with tails | S | P2 |
| 115 | **HexField** ✅ | Animated hexagon pattern with ripple on click | S | P3 |
| 116 | **CloudSky** ✅ | Volumetric-looking cloud shader, cheap ray-march with quality presets | M | P3 |
| 117 | **WebcamPixels** ✅ | Live camera turned into a pixel/ASCII grid, with permission UX | M | P2 |

### 4.13 Animated primitives (a fast "foundation" tier)

Accessible base components (on Radix UI or Base UI) with signature motion, so people can build whole apps from Bits Lab:

| # | Component | Effort | Pri |
|---|---|---|---|
| 118 | **Accordion** ✅ with height spring and staggered content | S | P1 |
| 119 | **Dialog / Sheet / Tooltip / Popover / Dropdown** set ✅ (OverlayKit) with shared motion tokens | M | P1 |
| 120 | **Switch / Checkbox / Radio** set ✅ (ToggleKit) with bouncy states (pairs with the Micro category) | S | P1 |

## 5. Rollout plan

| Wave | Contents | Count | Why first |
|---|---|---|---|
| **Wave 1** (P1) | Pixel & game core (1–10, 13, 20); showcase core (21–25, 27–29, 34); scroll (35–38); overlays (43–46, 50); nav (54–57); inputs (62–64, 72); data (73, 74, 76); cards/text/AI (81, 88, 91–93, 96, 99, 105, 106, 108); backgrounds (111, 112); primitives (118–120) | 58 | Closes the biggest gaps and launches the signature pixel collection |
| **Wave 2** (P2) | Remaining P2 items | 52 | Depth across every category |
| **Wave 3** (P3) | Remaining P3 items | 12 | Long tail and delight |
| **Wave 4** | Effects, backgrounds, cards and micro-interactions (section 6) | ~37 | Breadth across the most-wanted kinds of animated UI |
| **Wave 5** | Light mode, product moments, pixel scenes and upgrades (section 7) | 18 + 6 upgrades | Fills the gaps against affectUI and takes the library to 177 |

Shipping all 120 originals takes Bits Lab's catalog from 3 to 123.

To become the largest library, three multipliers matter more than headcount:

- **Variants count as reach.** Four language/styling variants turn every component into four installable items.
- **Blocks on top of components.** Hero, pricing, feature, testimonial, footer, 404 and onboarding sections assembled from the components. Every leader monetizes or grows through blocks.
- **Community pipeline.** A contribution template that enforces the quality bar: generated prop docs, the smoke and visual check from this session as CI, and a review checklist. Scale comes from contributors, but only the quality bar keeps it polished.

## 6. Wave 4: effects, backgrounds and micro-interactions

**Status:** planned 2026-10-28. Phases 0–6 done 2026-10-28.

**Why:** after Wave 3 the catalog was strong on app UI but thin on the effects people reach for most: text animations, animated backgrounds, cursor and border effects, card stacks and small delightful interactions. Wave 4 adds about 37 originals, most of them merging several common ideas into one Bits Lab component with its own name, API and pixel-game twist.

### 6.1 Rules for every phase

- **Original on purpose:** a new name, its own API, usually several ideas merged into one component, and the Bits Lab pixel style.
- **Same quality bar (section 3):** JS, TS, CSS and Tailwind variants from day one, a parity fixture in `/tw-check.html`, a catalog demo and a roadmap entry.

### 6.2 Phases

**Phase 0: redesigns and a public build** ✅ done 2026-10-28

- The first three originals were replaced by new designs, written from scratch with new props; their old pages redirect:
  - **FocusPull** (text animations): a camera focus pull. Soft, colour-fringed letters rack into focus by sweeping across the line, opening from the centre, or snapping in with a lens "breathe"; it can rack again on hover.
  - **TallyUp** (data): a figure climbs to its value while a pixel block bar fills toward a goal; milestone notches flash as they pass, with an optional stepped "arcade" count.
  - **PegBoard** (backgrounds): a pin-art board. Pixel pegs rise under the pointer and sink back slowly, and a word can be imprinted into the pegs at rest.
- `vercel.json` added (Vite build, single-page rewrites). Publishing itself is Phase 6.

**Phase 1: text effects** (6) ✅ done 2026-10-28, in Text Animations, each with JS, TS, CSS and Tailwind variants and parity fixtures:

- SignalText: scramble locks in left to right; flap runs a split-flap board (tiles wrap only between words); glitch tears the text in colour-split bursts. Triggers: view, mount, hover, loop.
- InkText: shimmer, gradient (stepped into hard pixel bands by default), outline that floods via a registered `@property`, and a panning image fill. Plain inline text.
- PixelType: text rasterised into pixel blocks on a canvas; assemble or crumble-and-rebuild, with pointer scatter on springs.
- ProximityType: weight, width, lift and tint follow pointer distance, with smooth, linear or sharp falloff; listens only while on screen.
- ShadowStack: a stair-stepped extrude (a whole pixel per layer along the main axis) or breathing echoes; depth can fall away from the pointer, and a press squashes it.
- MarqueeLine: an endless banner whose speed surges, leans and reverses with page scroll; drag to scrub, hover to pause, and a pause button.

Planned:

| Component | Idea |
|---|---|
| SignalText | Scramble, glitch and split-flap modes with an arcade feel |
| InkText | Shimmer, gradient, outline and image-mask fills |
| PixelType | Letters built from pixels that scatter, fall and re-form |
| ProximityType | Weight and width follow the pointer |
| ShadowStack | Chunky retro extruded and echo titles |
| MarqueeLine | An endless banner that speeds up with scroll |

**Phase 2: pointer and animation effects** (6) ✅ done 2026-10-28, each with JS, TS, CSS and Tailwind variants and parity fixtures:

- PointerKit (Physics & Playful): one canvas pointer layer combining trail, HUD crosshair, target brackets that snap to links and buttons, click sparks and a squashy blob; area or whole-window; sparks only on touch-only devices.
- Footprints (Physics & Playful): pixel footprints that alternate left and right and turn to face the direction of travel, or cycled image stamps.
- EdgeFX (Cards & Media): marching pixel ants, a stepped energy band (a registered `@property` angle), a pointer-following glow, or a glare sweep; always on or hover/focus only.
- Reveal (Scroll Storytelling): fade, rise, zoom, stepped wipe, or a scattered pixel block dissolve; optional cascade over direct children.
- Marquee (Product Showcase): a multi-lane wall that alternates direction per lane, runs across or vertically, and slows the hovered lane while spotlighting the item. Kept distinct from Phase 1's MarqueeLine (a single banner driven by scroll speed).
- GrainFX (Backgrounds): stackable live pixel grain, Bayer 8×8 dither, fading halftone, scanlines and an edge blur; covers its parent when used without children.

Planned:

| Component | Idea |
|---|---|
| PointerKit | One cursor component with trail, crosshair, target-lock, spark and blob modes |
| Footprints | Pixel and image trails behind the pointer |
| EdgeFX | Border effects: marching ants, pixel glow, energy |
| Reveal | Scroll and mount reveal primitive |
| Marquee | Logo and content loop with drag |
| GrainFX | Dither, halftone, noise and blur overlays |

**Phase 3: backgrounds** (8) ✅ done 2026-10-28, in Backgrounds, each with JS, TS, CSS and Tailwind variants and parity fixtures. All are canvas-drawn, fill their parent, pause off-screen and in hidden tabs, and hold one still frame under reduced motion; most render at low resolution and scale up crisply (`pixelSize`):

- AuroraBands: rippling curtains with a sharp lower edge, their glow stepped into flat bands, over twinkling stars.
- WarpField: pixel streaks from a vanishing point that leans toward the pointer; hold the pointer (or Space) for hyperspace.
- LightShafts: swaying rays from a source, flickering floor pillars, or forked lightning with a double flash.
- LavaLamp: a metaball lava lamp with a lit rim and hot pool; the pointer is a blob too.
- CodeRain: glyph columns (hex, binary, blocks, arrows or custom) with bright heads, frame-rate-independent tails, flips and glitch rows; hot near the pointer.
- DitherField: noise, waves or a radial pulse drawn through an 8×8 Bayer dither into a small palette, with a pointer glow.
- ContourLines: a drifting topographic map traced in single pixels, with index lines, optional atlas tints and a pointer hill.
- ScanScope: a radar sweep with range rings, or a scanning bar, over a pixel grid; blips light, ping and fade as the beam passes.

Planned:

| Component | Idea |
|---|---|
| AuroraBands | Pixel-banded aurora light |
| WarpField | Stars streaking into hyperspace |
| LightShafts | Beams, rays and lightning |
| LavaLamp | Pixelated lava-lamp blobs |
| CodeRain | Falling glyph columns |
| DitherField | Ordered-dither colour field |
| ContourLines | Drifting topographic lines |
| ScanScope | Radar-style sweep over a grid |

**Phase 4: UI components** (9) ✅ done 2026-10-28, each with JS, TS, CSS and Tailwind variants and parity fixtures:

- CardDeck (Cards & Media): a fanned pile; throw the top card and it spins off and slides under the deck; arrows and Left/Right deal; only the top card is reachable.
- Coverflow (Product Showcase): a 3D shelf with drag, sideways wheel, click-to-focus and keyboard; side items inert; a drag never doubles as a click.
- MasonryWall (Cards & Media): shortest-column layout that glides items to new places on resize or change and pops new arrivals; DOM order is reading order.
- FeedList (Data & Numbers): new entries slide in with a flash, removed ones fold away, relative times refresh; with `onSelect` it is a keyboard listbox.
- HotbarDock (Navigation): pointer-proximity magnify, number keys 1–9 (ignored while typing), wheel cycling, stack counts and labels; a toolbar with one tab stop.
- OverlayMenu (Navigation): a portal dialog that wipes in in pixel steps, with staggered numbered links, a focus trap, Escape and scroll lock; the toggle morphs into a cross.
- TradingCard (Cards & Media): pointer tilt, glare, rarity frames and a stepped holo foil; with a back it is a flip toggle button (stats are spans, as a button only takes inline content).
- GlassPanel (Primitives): backdrop blur and saturation, a lit edge, a pointer sheen, an optional 8-bit dither, and a stronger tint where backdrop blur is unsupported.
- WheelPicker (Forms & Inputs): a 3D drum that coasts and springs into place; wheel and full keyboard control; a spin button for screen readers.

Planned:

| Component | Idea |
|---|---|
| CardDeck | A swipeable deck, like a hand in a card game |
| Coverflow | 3D carousel |
| MasonryWall | Masonry layout with animated reflow |
| FeedList | Animated list with keyboard selection |
| HotbarDock | A dock styled like a game item hotbar, magnifying on hover |
| OverlayMenu | Full-screen menu that staggers in |
| TradingCard | Holographic foil card with tilt and glare |
| GlassPanel | Frosted-glass surface |
| WheelPicker | Spinning option wheel and spring slider |

**Phase 5: micro-interactions** (8) ✅ done 2026-10-28, each with JS, TS, CSS and Tailwind variants and parity fixtures:

- HoldToConfirm (Forms & Inputs): a pixel fuse burns across while held (pointer, Space or Enter) and rewinds if let go; timed in real time, so slow frames don't stretch the hold; a quick tap never confirms.
- SwipeActions (Cards & Media): swipe to reveal left or right actions, full swipe fires the first and slides the row away; every action is also in a keyboard "⋯" menu.
- Discard (Physics & Playful): shred into strips, crumple and toss, or tear in two, then onDiscarded.
- RatingPips (Forms & Inputs): pixel heart/star/gem pips with halves, hover preview and pickup pops; a slider for keyboards, an image when read-only.
- ScrubNumber (Forms & Inputs): drag the label to scrub (Shift ×10, Alt ×0.1) with a sliding pixel ruler; a labelled text input with Up/Down.
- PixelSpinners (Pixel & Game UI): blocks, bar, dots, hourglass and orbit, all CSS, as a status with a label.
- ArcadeButtons (Pixel & Game UI): launch (rumble, smoke, lift-off, landing), dodge (mouse only, a few times) and sling (stretch and snap, fires on a far pull); keyboard presses always work.
- ToggleKit additions: the Switch already squishes and the Checkbox already draws its check, so the gap was a bell: NotifyBell, a toggle button whose pixel bell rings when switched on and wears a slash when off, added to all four ToggleKit variants.

Planned:

| Component | Idea |
|---|---|
| HoldToConfirm | A fuse that burns down while held |
| SwipeActions | Swipe a row or toast to act on it |
| Discard | Shred, crumple or tear-ticket delete effects |
| RatingPips | Heart containers, Zelda-style |
| ScrubNumber | Drag a number to change it |
| PixelSpinners | A set of loading spinners |
| ArcadeButtons | Buttons that dodge, fly or sling |
| ToggleKit additions | Bell, squish and spring variants for the existing kit |

**Phase 6: launch** ✅ done 2026-10-28

- **Published:** GitHub repo `stevenphung/bits-lab` (public since 2026-10-28), deployed by Vercel to https://bits-lab.vercel.app on every push to `main`, and the `bits-lab` npm package (MIT) built from `packages/bits-lab`.
- **ToggleKit's bell** is named NotifyBell.
- **Taken off the site for now (2026-10-28):** the templates are no longer routed from `App.jsx`; their code stays in the repo to bring back later.
- **Templates** (`/templates`): Questboard (SaaS landing page, 56 components), Emberfall (game page, 49) and Pocket Tavern (app launch page, 54). Between them they use all 159 components, which `npm run check:templates` enforces. Each is a full page without the library's header, loaded as its own chunk.

### 6.3 Outcome

About 37 new originals take Bits Lab from 123 to about 160. Phases 1–5 are each about the size of a Wave 2 batch; Phase 0 is short.

## 7. Wave 5: filling the gaps

**Status:** planned 2026-10-29. Phase B done 2026-10-29.

**Why:** a comparison with [affectUI](https://github.com/flohoeller/affectui) (MIT, 57 free items: calm components, blocks, illustrations and motion for AI and SaaS products, one file each, light and dark mode built in). About half of its items are already covered by Bits Lab. The rest point to real gaps: light mode, a handful of everyday product components, and animated illustrations for empty states and explainers, a category Bits Lab doesn't have yet.

### 7.1 Rules

- **Ideas only.** Only affectUI's README and item list were read, never its source. Every Wave 5 component has its own name, its own API and the Bits Lab pixel style, and turns the idea into game feel.
- **Same quality bar (section 3):** JS, TS, CSS and Tailwind variants, a parity fixture in `/tw-check.html`, a catalog demo, accessibility and reduced motion.
- **Light mode from day one** for every new component, once Phase A1 lands.

### 7.2 Already covered (no work needed)

| affectUI item | Bits Lab |
|---|---|
| OTP Input | OTPInput |
| Progress Tracker | QuestLog |
| Tool Call Card | AgentCard |
| Segmented Control | SlideTabs, ToggleGroup |
| Thinking Loader | ThinkingShimmer, PixelSpinners |
| Logo Marquee, Testimonial Wall | Marquee, TestimonialWall |
| Cover Flow | Coverflow |
| Integration Beam, Enrichment Orbit | ConnectBeams, LogoOrbit |
| Region map | DotMap |
| Model Wheel | WheelPicker |
| Number Ticker, Shimmer Loader | RollingNumber, TallyUp, SkeletonShimmer |
| Text Reveal, Grid Background | CutReveal, FocusPull, InteractiveGrid, FlickerGrid |

### 7.3 Phases

**Phase A: across the whole library** (3)

1. **Light mode.** ✅ done 2026-10-29. 89 components now carry theme tokens: a light Sweetie 16 palette (paper `#f4f1e8`, ink `#1a1c2c`, accent `#167f8f`) applied under `.light` or `data-theme="light"`, with `data-theme="system"` following `prefers-color-scheme` and a nested `.dark` switching back. Colour props still override. Done with `scripts/theme-tokens.py`, which removes literal colour defaults and writes the token CSS into all four variants; check:ts, check:tw and the parity suite pass in both themes (277/278, the miss is the known flaky VoxelTiles timing fixture). The site preview has a Light/Dark switch and tw-check takes `?theme=light`.
   - *Dark by design (not converted):* screen and device objects such as BootSequence, CRTPower, CodeShowcase, TerminalDemo, GameOver, Screensaver, DynamicIsland, StoryViewer, Minimap, CipherCard, PressStart, VideoHero, ScreenScroller, Polaroids, StickerBoard, DraftScroll, CompareSlider, ScrollTilt, LightboxGallery, ArcadeButtons, JellyBlob, VoxelTiles, ParallaxCollage and DirectionHover. Backgrounds and effects already take colours from props.
   - *Follow-ups:* CommandPalette and MorphDialog (colours read in JS), WebcamPixels, ScrollZoom and VanishInput (canvas or JS colours), and components whose colours are fixed in CSS rather than props: ToggleKit, OverlayKit, AchievementToast, BentoGrid, FeatureTabs, LinkPeek, OverlayMenu, SpringDrawer, StickyReveal, PixelButton and RollingNumber. Some demos also wrap components in hard-coded dark frames (ChatBubbles' input, MobileTabBar's phone).
   - *Follow-ups finished 2026-10-29:* 109 components now switch. CommandPalette and MorphDialog got a theme class on their variable holders; VanishInput reads its colour from the input when it draws; BentoGrid, FeatureTabs, SpringDrawer, StickyReveal, LinkPeek and OverlayMenu were converted once the script learnt about inner elements and portals (which also fixed ContextOrb's portal accent); ToggleKit, OverlayKit and AchievementToast got light overrides from `scripts/theme-fixed.py`; and the site's demo wrappers use `--demo-*` stage variables. WebcamPixels and ScrollZoom stay dark by design; PixelButton and RollingNumber already work in both (coloured faces, inherited text).
2. **Docs for AI coding tools.** An `llms.txt` plus a markdown doc per component (props, usage, accessibility), generated from the catalog, so assistants can use the library well.
3. **A calmer skin (parked).** A quieter pixel style could widen the audience but dilutes the identity. Revisit after light mode.

**Phase B: product moments with game feel** (10) ✅ done 2026-10-29, each with JS, TS, CSS and Tailwind variants, a catalog demo and parity fixtures (20/20 match). CharacterSheet, BountyBoard and SideQuests went to Pixel & Game UI, ReactionCombo to Physics & Playful, LevelUpStats to Data & Numbers, LootFilter to Forms & Inputs, and ReplyActions, DraftScroll, ThreadTrail and AdvisorCard to AI Surfaces.

| Gap | Component | Idea |
|---|---|---|
| Profile menu | **CharacterSheet** | The account card as an RPG sheet: avatar, level, XP bar, setup progress and menu actions |
| Reaction bar | **ReactionCombo** | Like, comment, repost and share: icons pop and fill, counts roll, quick reactions build a combo burst |
| Decision inbox | **BountyBoard** | Pinned decisions with two answers each, stamped Accepted or Declined before they fold away |
| Tips panel | **SideQuests** | Tips as side quests, one action each, with a Done stamp and XP |
| Change summary | **LevelUpStats** | "What changed" as a level-up screen: ▲ +12 Revenue, ▼ −3 Churn, coloured by direction |
| Filter menu | **LootFilter** | Grouped filters with removable chips, rarity-style checkbox groups, Clear all and full keyboard control |
| Message actions | **ReplyActions** | The bar under a reply: copy turns into a check, regenerate shows a 1/3 version switcher, thumbs up and down |
| Draft review | **DraftScroll** | An agent-written draft to review: switch tone and recipient, edit inline, remove attachments, send or discard |
| Comment thread | **ThreadTrail** | A comment with replies, @mentions and folded "what I did" details |
| Recommendation | **AdvisorCard** | A suggestion with a confidence meter, alternatives to switch to, and accept with undo |

**Phase C: Scenes & Mascots, a new category** (8) ✅ done 2026-10-29, each with JS, TS, CSS and Tailwind variants, light mode from day one, a catalog demo and parity fixtures (21/21 match in dark and light). The pixel art is drawn inside each component (rect lists or row maps), so they stay copy-paste friendly instead of importing `src/pixel/art.js`.

Animated pixel vignettes for empty states, onboarding and feature explainers, built on the pixel-art kit (`src/pixel/art.js`).

| Gap | Component | Idea |
|---|---|---|
| Mascot | **PixelPet** | A creature that floats, blinks, follows the pointer and reacts: idle, happy, thinking, sad |
| Empty states | **EmptyScenes** | Empty chest (no items), quiet campfire (no messages), closed shop (no results), unplugged cable (offline), lost map (404) |
| Team invite | **PartyInvite** | Drag a new party member into the empty slot; the link turns solid and they come online |
| Agent team | **PartyFormation** | A quest splits into party members, each with a role and their gear |
| Layer stack | **LayerTower** | An isometric voxel stack beside a list; the chosen layer lifts out in colour |
| Tab overload | **WindowPile** | Overlapping retro windows; the highlight follows the pointer |
| Side folder | **ChestReveal** | A chest swings open and items slide out on hover |
| Logo cluster | **LogoBurst** | Logos burst out of a centre tile and settle around it |

**Phase D: upgrades to existing components** (6)

- **PixelButton:** ghost and destructive variants, icon-only buttons, a shimmering loading state.
- **SlideTabs:** drag the pill to switch.
- **ThinkingShimmer:** a compact pill mode whose label rolls through phases.
- **ToastStack:** an inline "stacked notices" mode, dismissing the front card to reveal the next.
- **Marquee:** drag to scrub with momentum, easing to a stop on hover.
- **WheelPicker:** a curved drum look.

### 7.4 Order and outcome

Phase B first (most of the new value), then light mode (A1), then Phase C; Phase D fits in alongside. A2 can run any time. The wave takes Bits Lab from 159 to 177 components, makes it usable in light-themed products, and adds the illustration category it lacks, all in the game-feel style that sets it apart.

## Sources

- [Best React Animation Libraries in 2026 — SmoothUI](https://smoothui.dev/blog/best-react-animation-libraries)
- [Top Animated UI Component Libraries for React — DEV Community](https://dev.to/codedthemes/top-animated-ui-component-libraries-for-react-1383)
- [Best Animated React Component Libraries (2026) — Spectrum UI](https://ui.spectrumhq.in/best-animated-react-component-libraries)
- [Magic UI alternatives — 21st.dev](https://21st.dev/blog/magic-ui-alternatives) and [Motion Primitives alternatives — 21st.dev](https://21st.dev/blog/motion-primitives-alternatives)
- [shadcn awesome registries](https://www.shadcn.io/awesome/registries)
- [21st.dev help: community (MIT licensing)](https://help.21st.dev/community)
- Component catalogs read directly: [Magic UI](https://magicui.design/docs/components), [Aceternity UI](https://ui.aceternity.com/components), [Motion Primitives](https://motion-primitives.com/docs), [Cult UI](https://www.cult-ui.com/docs/components), [Fancy Components](https://www.fancycomponents.dev/docs/introduction)
- [Aceternity UI licence](https://ui.aceternity.com/licence)
- [affectUI](https://github.com/flohoeller/affectui): README and item list, read 2026-10-29 for Wave 5
