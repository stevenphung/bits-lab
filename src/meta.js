// Plain metadata (no JSX) so both the app and scripts/build-registry.mjs can import it.

export const CATEGORIES = [
  { slug: 'ai', name: 'Agent Interfaces' },
  { slug: 'text-animations', name: 'Text Animations' },
  { slug: 'backgrounds', name: 'Backgrounds' },
  { slug: 'pixel-game', name: 'Pixel & Game UI' },
  { slug: 'showcase', name: 'Product Showcase' },
  { slug: 'scroll', name: 'Scroll Storytelling' },
  { slug: 'overlays', name: 'Overlays & Feedback' },
  { slug: 'navigation', name: 'Navigation' },
  { slug: 'inputs', name: 'Forms & Inputs' },
  { slug: 'data', name: 'Data & Numbers' },
  { slug: 'cards', name: 'Cards & Media' },
  { slug: 'playful', name: 'Physics & Playful' },
  { slug: 'primitives', name: 'Primitives' }
];

export const COMPONENTS = [
  {
    slug: 'focus-pull',
    name: 'FocusPull',
    category: 'text-animations',
    file: 'src/bits/FocusPull.jsx',
    dependencies: [],
    description: 'A camera focus pull on a line of text: soft, colour-fringed letters rack into sharp focus.'
  },
  {
    slug: 'tally-up',
    name: 'TallyUp',
    category: 'data',
    file: 'src/bits/TallyUp.jsx',
    dependencies: [],
    description: 'A number that climbs to its value while a pixel block bar fills toward a goal, flashing milestones.'
  },
  {
    slug: 'peg-board',
    name: 'PegBoard',
    category: 'backgrounds',
    file: 'src/bits/PegBoard.jsx',
    dependencies: [],
    description: 'A pin-art board of pixel pegs that rise under the pointer, sink back slowly and hold an imprinted word.'
  },
  {
    slug: 'quest-dialog',
    name: 'QuestDialog',
    category: 'pixel-game',
    file: 'src/bits/QuestDialog.jsx',
    dependencies: [],
    description: 'RPG dialogue box: typewriter lines with punctuation pauses, a speaker tab, portrait and a keyboard-driven choice menu.'
  },
  {
    slug: 'health-bar',
    name: 'HealthBar',
    category: 'pixel-game',
    file: 'src/bits/HealthBar.jsx',
    dependencies: [],
    description: 'Segmented HP/XP/mana bar with a lagging damage ghost, heal preview, hit flash and a critical pulse.'
  },
  {
    slug: 'inventory-grid',
    name: 'InventoryGrid',
    category: 'pixel-game',
    file: 'src/bits/InventoryGrid.jsx',
    dependencies: [],
    description: 'Drag-and-drop inventory with stacking, rarity glows, tooltips and full keyboard pick-up and drop.'
  },
  {
    slug: 'achievement-toast',
    name: 'AchievementToast',
    category: 'pixel-game',
    file: 'src/bits/AchievementToast.jsx',
    dependencies: [],
    description: '"Achievement unlocked" toasts: queued, tiered, with sparkle bursts, XP badges and hover-to-pause timers.'
  },
  {
    slug: 'press-start',
    name: 'PressStart',
    category: 'pixel-game',
    file: 'src/bits/PressStart.jsx',
    dependencies: [],
    description: 'Blinking title-screen prompt that starts on any key, click or tap, flashes, then hands off.'
  },
  {
    slug: 'crt-power',
    name: 'CRTPower',
    category: 'pixel-game',
    file: 'src/bits/CRTPower.jsx',
    dependencies: [],
    description: 'Wraps any content in a CRT that powers on from a bright line and collapses to a fading dot when off.'
  },
  {
    slug: 'pixel-loader',
    name: 'PixelLoader',
    category: 'pixel-game',
    file: 'src/bits/PixelLoader.jsx',
    dependencies: [],
    description: 'Retro loading screen with a chunked progress bar, pixel spinner, rotating tips and a COMPLETE flash.'
  },
  {
    slug: 'sprite-animator',
    name: 'SpriteAnimator',
    category: 'pixel-game',
    file: 'src/bits/SpriteAnimator.jsx',
    dependencies: [],
    description: 'Plays sprite-sheet animations on a crisp canvas, with named animations, ping-pong, and off-screen pausing.'
  },
  {
    slug: 'pixel-parallax',
    name: 'PixelParallax',
    category: 'pixel-game',
    file: 'src/bits/PixelParallax.jsx',
    dependencies: [],
    description: 'Multi-layer pixel scene moving with time, mouse or scroll, with pixel-snapped offsets and a day-night cycle.'
  },
  {
    slug: 'level-map',
    name: 'LevelMap',
    category: 'pixel-game',
    file: 'src/bits/LevelMap.jsx',
    dependencies: [],
    description: 'Game world map for onboarding or roadmaps: a winding trail of cleared, current, available and locked levels.'
  },
  {
    slug: 'pixel-button',
    name: 'PixelButton',
    category: 'pixel-game',
    file: 'src/bits/PixelButton.jsx',
    dependencies: [],
    description: 'Chunky 8-bit button with a notched border, bevel, press-down, loading pips and a cracked disabled state.'
  },
  {
    slug: 'chiptune-kit',
    name: 'ChiptuneKit',
    category: 'pixel-game',
    file: 'src/bits/ChiptuneKit.jsx',
    dependencies: [],
    description: 'Chiptune sound effects for UI events: playChip(), a shared mute provider, a hook and a mute toggle.'
  },
  {
    slug: 'device-frame',
    name: 'DeviceFrame',
    category: 'showcase',
    file: 'src/bits/DeviceFrame.jsx',
    dependencies: [],
    description: 'Phone, tablet, laptop, browser and watch frames in pure CSS, with finishes and pointer tilt.'
  },
  {
    slug: 'screen-scroller',
    name: 'ScreenScroller',
    category: 'showcase',
    file: 'src/bits/ScreenScroller.jsx',
    dependencies: [],
    description: 'Scroll-driven device that rises from a tilt to flat, then scrolls the page on its screen.'
  },
  {
    slug: 'dot-globe',
    name: 'DotGlobe',
    category: 'showcase',
    file: 'src/bits/DotGlobe.jsx',
    dependencies: [],
    description: 'Dotted canvas globe with drag inertia, auto-rotate, pulsing markers and great-circle arcs.'
  },
  {
    slug: 'dot-map',
    name: 'DotMap',
    category: 'showcase',
    file: 'src/bits/DotMap.jsx',
    dependencies: [],
    description: 'Flat dotted world map in a single SVG path, with pulsing locations and animated routes.'
  },
  {
    slug: 'connect-beams',
    name: 'ConnectBeams',
    category: 'showcase',
    file: 'src/bits/ConnectBeams.jsx',
    dependencies: [],
    description: 'Animated beams between any DOM nodes, with traveling gradient pulses that follow layout changes.'
  },
  {
    slug: 'bento-grid',
    name: 'BentoGrid',
    category: 'showcase',
    file: 'src/bits/BentoGrid.jsx',
    dependencies: [],
    description: 'Responsive bento grid with spanning cards, a cursor spotlight border and hover-reveal calls to action.'
  },
  {
    slug: 'feature-tabs',
    name: 'FeatureTabs',
    category: 'showcase',
    file: 'src/bits/FeatureTabs.jsx',
    dependencies: [],
    description: 'Auto-advancing feature tour: progress-bar tabs and a crossfading media panel.'
  },
  {
    slug: 'compare-slider',
    name: 'CompareSlider',
    category: 'showcase',
    file: 'src/bits/CompareSlider.jsx',
    dependencies: [],
    description: 'Before/after slider for any content, with drag, hover, keyboard and vertical modes.'
  },
  {
    slug: 'terminal-demo',
    name: 'TerminalDemo',
    category: 'showcase',
    file: 'src/bits/TerminalDemo.jsx',
    dependencies: [],
    description: 'Scripted terminal session: typed commands, spinners, success and error lines, looping.'
  },
  {
    slug: 'sticky-reveal',
    name: 'StickyReveal',
    category: 'scroll',
    file: 'src/bits/StickyReveal.jsx',
    dependencies: [],
    description: 'Scroll story with a sticky media column that fades, zooms or wipes as each text section passes.'
  },
  {
    slug: 'scroll-tilt',
    name: 'ScrollTilt',
    category: 'scroll',
    file: 'src/bits/ScrollTilt.jsx',
    dependencies: [],
    description: 'Hero shot that tilts back in 3D and settles flat with a light sweep as it scrolls into view.'
  },
  {
    slug: 'tracing-line',
    name: 'TracingLine',
    category: 'scroll',
    file: 'src/bits/TracingLine.jsx',
    dependencies: [],
    description: 'A line that draws down the side of the content as you scroll, lighting a marker at each entry.'
  },
  {
    slug: 'horizontal-track',
    name: 'HorizontalTrack',
    category: 'scroll',
    file: 'src/bits/HorizontalTrack.jsx',
    dependencies: [],
    description: 'Vertical scroll drives a pinned horizontal gallery, with item snapping, a counter and progress.'
  },
  {
    slug: 'morph-dialog',
    name: 'MorphDialog',
    category: 'overlays',
    file: 'src/bits/MorphDialog.jsx',
    dependencies: [],
    description: 'A card that grows into a modal dialog and back, with shared media, focus trap, Esc and scroll lock.'
  },
  {
    slug: 'morph-popover',
    name: 'MorphPopover',
    category: 'overlays',
    file: 'src/bits/MorphPopover.jsx',
    dependencies: [],
    description: 'A button that grows into a panel or form where it sits, then shrinks back into the button.'
  },
  {
    slug: 'toast-stack',
    name: 'ToastStack',
    category: 'overlays',
    file: 'src/bits/ToastStack.jsx',
    dependencies: [],
    description: 'Stacked toasts that fan out on hover, swipe to dismiss, follow promises and pause while read.'
  },
  {
    slug: 'spring-drawer',
    name: 'SpringDrawer',
    category: 'overlays',
    file: 'src/bits/SpringDrawer.jsx',
    dependencies: [],
    description: 'Spring-physics bottom sheet or side drawer with snap points, velocity flicks and nested drawers.'
  },
  {
    slug: 'confetti',
    name: 'Confetti',
    category: 'overlays',
    file: 'src/bits/Confetti.jsx',
    dependencies: [],
    description: 'Pooled canvas confetti bursts from any element: presets, paper shapes, emoji and pixel sprites.'
  },
  {
    slug: 'dynamic-island',
    name: 'DynamicIsland',
    category: 'navigation',
    file: 'src/bits/DynamicIsland.jsx',
    dependencies: [],
    description: 'A pill that morphs between states (music, call, timer, alert) with springy size changes and blurred crossfades.'
  },
  {
    slug: 'slide-tabs',
    name: 'SlideTabs',
    category: 'navigation',
    file: 'src/bits/SlideTabs.jsx',
    dependencies: [],
    description: 'Tabs with a stretching pill or underline indicator, scrolling overflow with edge fades, and full keyboard support.'
  },
  {
    slug: 'command-palette',
    name: 'CommandPalette',
    category: 'navigation',
    file: 'src/bits/CommandPalette.jsx',
    dependencies: [],
    description: '⌘K palette with fuzzy search, highlighted matches, groups, nested pages, recents and an animated list height.'
  },
  {
    slug: 'smart-navbar',
    name: 'SmartNavbar',
    category: 'navigation',
    file: 'src/bits/SmartNavbar.jsx',
    dependencies: [],
    description: 'Navbar that shrinks into a floating blurred pill, hides on scroll down and returns on scroll up or focus.'
  },
  {
    slug: 'otp-input',
    name: 'OTPInput',
    category: 'inputs',
    file: 'src/bits/OTPInput.jsx',
    dependencies: [],
    description: 'One-time code input with paste and autofill, a shake on error and cells that fuse on success.'
  },
  {
    slug: 'vanish-input',
    name: 'VanishInput',
    category: 'inputs',
    file: 'src/bits/VanishInput.jsx',
    dependencies: [],
    description: 'Input with rotating placeholder ideas; on submit the text dissolves into drifting particles.'
  },
  {
    slug: 'drop-zone',
    name: 'DropZone',
    category: 'inputs',
    file: 'src/bits/DropZone.jsx',
    dependencies: [],
    description: 'File drop zone that leans toward the cursor, validates files, shows thumbnails and per-file progress.'
  },
  {
    slug: 'toggle-group',
    name: 'ToggleGroup',
    category: 'inputs',
    file: 'src/bits/ToggleGroup.jsx',
    dependencies: [],
    description: 'Segmented control with a sliding thumb, or multi-select toggles that fuse into one pill.'
  },
  {
    slug: 'rolling-number',
    name: 'RollingNumber',
    category: 'data',
    file: 'src/bits/RollingNumber.jsx',
    dependencies: [],
    description: 'Odometer number: each digit rolls to its new value, with Intl formatting for any locale or currency.'
  },
  {
    slug: 'spark-chart',
    name: 'SparkChart',
    category: 'data',
    file: 'src/bits/SparkChart.jsx',
    dependencies: [],
    description: 'Tiny SVG trend chart that draws itself in, with an end label and a snapping hover and keyboard scrubber.'
  },
  {
    slug: 'ring-progress',
    name: 'RingProgress',
    category: 'data',
    file: 'src/bits/RingProgress.jsx',
    dependencies: [],
    description: 'Concentric goal rings with same-hue gradients, a legend of meters and a centre readout on focus.'
  },
  {
    slug: 'expand-card',
    name: 'ExpandCard',
    category: 'cards',
    file: 'src/bits/ExpandCard.jsx',
    dependencies: [],
    description: 'Cards that open in place into a full article while the rest of the grid glides to make room.'
  },
  {
    slug: 'video-hero',
    name: 'VideoHero',
    category: 'cards',
    file: 'src/bits/VideoHero.jsx',
    dependencies: [],
    description: 'Video thumbnail with a magnetic, pulsing play button that grows into a lightbox player.'
  },
  {
    slug: 'text-on-path',
    name: 'TextOnPath',
    category: 'text-animations',
    file: 'src/bits/TextOnPath.jsx',
    dependencies: [],
    description: 'Text flowing along a wave, arc, circle or any SVG path, scrolling seamlessly.'
  },
  {
    slug: 'morph-words',
    name: 'MorphWords',
    category: 'text-animations',
    file: 'src/bits/MorphWords.jsx',
    dependencies: [],
    description: 'Words that melt into each other through a gooey blur-and-threshold morph.'
  },
  {
    slug: 'sketch-highlight',
    name: 'SketchHighlight',
    category: 'text-animations',
    file: 'src/bits/SketchHighlight.jsx',
    dependencies: [],
    description: 'Hand-drawn underlines, circles, boxes, highlights and brackets that draw themselves on view.'
  },
  {
    slug: 'streaming-text',
    name: 'StreamingText',
    category: 'text-animations',
    file: 'src/bits/StreamingText.jsx',
    dependencies: [],
    description: 'LLM-style streaming with a fading tail, a cursor and markdown that renders as it arrives.'
  },
  {
    slug: 'gravity-box',
    name: 'GravityBox',
    category: 'playful',
    file: 'src/bits/GravityBox.jsx',
    dependencies: ['matter-js'],
    description: 'Turns any children into rigid bodies that fall, stack and can be grabbed and thrown.'
  },
  {
    slug: 'voice-orb',
    name: 'VoiceOrb',
    category: 'ai',
    file: 'src/bits/VoiceOrb.jsx',
    dependencies: [],
    description: 'Voice-assistant orb reacting to a microphone or simulated voice, with listening, thinking and speaking states.'
  },
  {
    slug: 'thinking-shimmer',
    name: 'ThinkingShimmer',
    category: 'ai',
    file: 'src/bits/ThinkingShimmer.jsx',
    dependencies: [],
    description: 'Shimmering "Thinking…" header with an elapsed timer and a disclosure of live steps.'
  },
  {
    slug: 'chat-bubbles',
    name: 'ChatBubbles',
    category: 'ai',
    file: 'src/bits/ChatBubbles.jsx',
    dependencies: [],
    description: 'Chat thread with springy bubbles, grouping, a typing indicator and emoji reactions.'
  },
  {
    slug: 'retro-horizon',
    name: 'RetroHorizon',
    category: 'backgrounds',
    file: 'src/bits/RetroHorizon.jsx',
    dependencies: [],
    description: 'Synthwave horizon in crisp pixels: striped sun, mountains, stars and a perspective grid rolling toward you.'
  },
  {
    slug: 'flicker-grid',
    name: 'FlickerGrid',
    category: 'backgrounds',
    file: 'src/bits/FlickerGrid.jsx',
    dependencies: [],
    description: 'Grid of flickering squares; a word or logo glows out of the noise.'
  },
  {
    slug: 'accordion',
    name: 'Accordion',
    category: 'primitives',
    file: 'src/bits/Accordion.jsx',
    dependencies: [],
    description: 'Accordion that opens on a real spring curve, with staggered content and full keyboard support.'
  },
  {
    slug: 'overlay-kit',
    name: 'OverlayKit',
    category: 'primitives',
    file: 'src/bits/OverlayKit.jsx',
    dependencies: [],
    description: 'Dialog, Sheet, Tooltip, Popover and Dropdown sharing one motion language and full accessibility.'
  },
  {
    slug: 'toggle-kit',
    name: 'ToggleKit',
    category: 'primitives',
    file: 'src/bits/ToggleKit.jsx',
    dependencies: [],
    description: 'Switch, Checkbox and Radio with bouncy states, built on real native inputs.'
  },
  {
    slug: 'boot-sequence',
    name: 'BootSequence',
    category: 'pixel-game',
    file: 'src/bits/BootSequence.jsx',
    dependencies: [],
    description: 'Retro BIOS boot: POST checks type out with OK tags, memory counts up, then your app powers on.'
  },
  {
    slug: 'voxel-tiles',
    name: 'VoxelTiles',
    category: 'pixel-game',
    file: 'src/bits/VoxelTiles.jsx',
    dependencies: [],
    description: 'Isometric voxel island from a heightmap; tiles rise in, water bobs, hover lifts.'
  },
  {
    slug: 'game-over',
    name: 'GameOver',
    category: 'pixel-game',
    file: 'src/bits/GameOver.jsx',
    dependencies: [],
    description: 'End screen with letter-drop title, score tally and CONTINUE? countdown; doubles as a 404 page.'
  },
  {
    slug: 'score-ticker',
    name: 'ScoreTicker',
    category: 'pixel-game',
    file: 'src/bits/ScoreTicker.jsx',
    dependencies: [],
    description: 'Arcade odometer score with forward-rolling drums, combo popups and a high-score flash.'
  },
  {
    slug: 'pixel-explode',
    name: 'PixelExplode',
    category: 'pixel-game',
    file: 'src/bits/PixelExplode.jsx',
    dependencies: [],
    description: 'Disintegrates any element into flying pixel tiles, and puts it back together.'
  },
  {
    slug: 'minimap',
    name: 'Minimap',
    category: 'pixel-game',
    file: 'src/bits/Minimap.jsx',
    dependencies: [],
    description: 'Pixel overview of a long page or scroller with a draggable viewport box.'
  },
  {
    slug: 'quest-log',
    name: 'QuestLog',
    category: 'pixel-game',
    file: 'src/bits/QuestLog.jsx',
    dependencies: [],
    description: 'Onboarding checklist as a quest log: locked quests, XP bar and a completion fanfare.'
  },
  {
    slug: 'pixel-avatar',
    name: 'PixelAvatar',
    category: 'pixel-game',
    file: 'src/bits/PixelAvatar.jsx',
    dependencies: [],
    description: 'Deterministic pixel creature avatar from any seed or username.'
  },
  {
    slug: 'logo-orbit',
    name: 'LogoOrbit',
    category: 'showcase',
    file: 'src/bits/LogoOrbit.jsx',
    dependencies: [],
    description: 'Logos orbiting your brand mark on concentric rings; pauses and names a logo on hover.'
  },
  {
    slug: 'changelog-timeline',
    name: 'ChangelogTimeline',
    category: 'showcase',
    file: 'src/bits/ChangelogTimeline.jsx',
    dependencies: [],
    description: 'Changelog timeline whose beam fills as you scroll, with sticky dates and media entries.'
  },
  {
    slug: 'testimonial-wall',
    name: 'TestimonialWall',
    category: 'showcase',
    file: 'src/bits/TestimonialWall.jsx',
    dependencies: [],
    description: 'Testimonial wall in drifting marquee rows; hover pauses a row and expands the quote.'
  },
  {
    slug: 'code-showcase',
    name: 'CodeShowcase',
    category: 'showcase',
    file: 'src/bits/CodeShowcase.jsx',
    dependencies: [],
    description: 'Animated code window: line-by-line reveal, diff marks and code that morphs between file tabs.'
  },
  {
    slug: 'pricing-flip',
    name: 'PricingFlip',
    category: 'showcase',
    file: 'src/bits/PricingFlip.jsx',
    dependencies: [],
    description: 'Pricing cards with a monthly/yearly switch, rolling price digits and a computed save badge.'
  },
  {
    slug: 'scroll-zoom',
    name: 'ScrollZoom',
    category: 'scroll',
    file: 'src/bits/ScrollZoom.jsx',
    dependencies: [],
    description: 'Image opens from a small framed card to full-bleed as you scroll, then reveals content on top.'
  },
  {
    slug: 'parallax-collage',
    name: 'ParallaxCollage',
    category: 'scroll',
    file: 'src/bits/ParallaxCollage.jsx',
    dependencies: [],
    description: 'Layered collage whose pieces drift at their own depths as you scroll, and lean toward the pointer.'
  },
  {
    slug: 'chapter-progress',
    name: 'ChapterProgress',
    category: 'scroll',
    file: 'src/bits/ChapterProgress.jsx',
    dependencies: [],
    description: 'Reading progress bar with chapter ticks, the current chapter, time left and jump links.'
  },
  {
    slug: 'link-peek',
    name: 'LinkPeek',
    category: 'overlays',
    file: 'src/bits/LinkPeek.jsx',
    dependencies: [],
    description: 'Link that springs up a preview card (image, title, site) on hover or focus, with lazy loading.'
  },
  {
    slug: 'avatar-tooltips',
    name: 'AvatarTooltips',
    category: 'overlays',
    file: 'src/bits/AvatarTooltips.jsx',
    dependencies: [],
    description: 'Overlapping avatar stack that fans out on hover, with name tags that sway toward the pointer.'
  },
  {
    slug: 'context-orb',
    name: 'ContextOrb',
    category: 'overlays',
    file: 'src/bits/ContextOrb.jsx',
    dependencies: [],
    description: 'Radial right-click / long-press menu: flick toward an action and release, or click.'
  },
  {
    slug: 'step-loader',
    name: 'StepLoader',
    category: 'overlays',
    file: 'src/bits/StepLoader.jsx',
    dependencies: [],
    description: 'Multi-step progress panel with check-offs, a filling rail, cancel, retry and announcements.'
  },
  {
    slug: 'skeleton-shimmer',
    name: 'SkeletonShimmer',
    category: 'overlays',
    file: 'src/bits/SkeletonShimmer.jsx',
    dependencies: [],
    description: 'Skeletons traced from your real layout, line by line, crossfading into the content.'
  },
  {
    slug: 'spotlight-tour',
    name: 'SpotlightTour',
    category: 'overlays',
    file: 'src/bits/SpotlightTour.jsx',
    dependencies: [],
    description: 'Product tour with a gliding spotlight cutout, springy step bubbles and full keyboard support.'
  },
  {
    slug: 'mega-menu',
    name: 'MegaMenu',
    category: 'navigation',
    file: 'src/bits/MegaMenu.jsx',
    dependencies: [],
    description: 'Navigation whose dropdowns share one panel that slides, resizes and crossfades between triggers.'
  },
  {
    slug: 'side-rail',
    name: 'SideRail',
    category: 'navigation',
    file: 'src/bits/SideRail.jsx',
    dependencies: [],
    description: 'App sidebar that collapses to an icon rail, with tooltips, nested groups and a sliding highlight.'
  },
  {
    slug: 'mobile-tab-bar',
    name: 'MobileTabBar',
    category: 'navigation',
    file: 'src/bits/MobileTabBar.jsx',
    dependencies: [],
    description: 'Mobile bottom tab bar with a stretchy liquid blob, icon bounce, badges and optional haptics.'
  },
  {
    slug: 'tag-input',
    name: 'TagInput',
    category: 'inputs',
    file: 'src/bits/TagInput.jsx',
    dependencies: [],
    description: 'Tag field with springy chips, autocomplete, paste-to-split and duplicate shakes.'
  },
  {
    slug: 'password-meter',
    name: 'PasswordMeter',
    category: 'inputs',
    file: 'src/bits/PasswordMeter.jsx',
    dependencies: [],
    description: 'Password field with a segmented strength meter, ticking requirements and a reveal toggle.'
  },
  {
    slug: 'date-range',
    name: 'DateRange',
    category: 'inputs',
    file: 'src/bits/DateRange.jsx',
    dependencies: [],
    description: 'Date-range calendar with sliding months, hover preview, presets and full keyboard grid.'
  },
  {
    slug: 'color-dial',
    name: 'ColorDial',
    category: 'inputs',
    file: 'src/bits/ColorDial.jsx',
    dependencies: [],
    description: 'Color picker: hue ring around a saturation/brightness square, hex field, swatches and eyedropper.'
  },
  {
    slug: 'range-dual',
    name: 'RangeDual',
    category: 'inputs',
    file: 'src/bits/RangeDual.jsx',
    dependencies: [],
    description: 'Two-thumb range slider over a histogram, with value bubbles and draggable selection.'
  },
  {
    slug: 'stepper-form',
    name: 'StepperForm',
    category: 'inputs',
    file: 'src/bits/StepperForm.jsx',
    dependencies: [],
    description: 'Multi-step form shell with a filling progress rail and sync or async validation gates.'
  },
  {
    slug: 'bar-race',
    name: 'BarRace',
    category: 'data',
    file: 'src/bits/BarRace.jsx',
    dependencies: [],
    description: 'Animated ranking bar chart over time: smooth values, sliding ranks, labelled bars, scrubber.'
  },
  {
    slug: 'heatmap',
    name: 'Heatmap',
    category: 'data',
    file: 'src/bits/Heatmap.jsx',
    dependencies: [],
    description: 'Contribution calendar heatmap with a staggered fill, single-hue ramp, tooltips and keyboard grid.'
  },
  {
    slug: 'stat-card',
    name: 'StatCard',
    category: 'data',
    file: 'src/bits/StatCard.jsx',
    dependencies: [],
    description: 'KPI card with a rolling value, signed delta vs a period, and a hoverable sparkline.'
  },
  {
    slug: 'gauge-meter',
    name: 'GaugeMeter',
    category: 'data',
    file: 'src/bits/GaugeMeter.jsx',
    dependencies: [],
    description: 'Analog gauge with a springy needle, labelled ticks and severity zones with icons.'
  },
  {
    slug: 'direction-hover',
    name: 'DirectionHover',
    category: 'cards',
    file: 'src/bits/DirectionHover.jsx',
    dependencies: [],
    description: 'Card overlay that slides in from the side the pointer entered and leaves toward where it exited.'
  },
  {
    slug: 'pin-card',
    name: 'PinCard',
    category: 'cards',
    file: 'src/bits/PinCard.jsx',
    dependencies: [],
    description: 'Card that tips back in 3D and lifts off a glowing map pin on hover or focus.'
  },
  {
    slug: 'cipher-card',
    name: 'CipherCard',
    category: 'cards',
    file: 'src/bits/CipherCard.jsx',
    dependencies: [],
    description: 'Card whose surface reveals reshuffling cipher characters under a pointer spotlight.'
  },
  {
    slug: 'focus-grid',
    name: 'FocusGrid',
    category: 'cards',
    file: 'src/bits/FocusGrid.jsx',
    dependencies: [],
    description: 'Card grid where hovering or focusing one blurs and dims the rest, in pure CSS.'
  },
  {
    slug: 'story-viewer',
    name: 'StoryViewer',
    category: 'cards',
    file: 'src/bits/StoryViewer.jsx',
    dependencies: [],
    description: 'Instagram-style stories with progress bars, tap zones, hold to pause and keyboard support.'
  },
  {
    slug: 'lightbox-gallery',
    name: 'LightboxGallery',
    category: 'cards',
    file: 'src/bits/LightboxGallery.jsx',
    dependencies: [],
    description: 'Thumbnail grid that opens into a zoomable, swipeable viewer growing out of the thumbnail.'
  },
  {
    slug: 'letter-swap',
    name: 'LetterSwap',
    category: 'text-animations',
    file: 'src/bits/LetterSwap.jsx',
    dependencies: [],
    description: 'Text whose letters roll over in 3D on hover, one after another, optionally to a different word.'
  },
  {
    slug: 'cut-reveal',
    name: 'CutReveal',
    category: 'text-animations',
    file: 'src/bits/CutReveal.jsx',
    dependencies: [],
    description: 'Lines of text that reveal through opening vertical cuts, measured from the real layout.'
  },
  {
    slug: 'spoiler',
    name: 'Spoiler',
    category: 'text-animations',
    file: 'src/bits/Spoiler.jsx',
    dependencies: [],
    description: 'Inline spoiler hidden under drifting particles that scatter when clicked.'
  },
  {
    slug: 'elastic-string',
    name: 'ElasticString',
    category: 'playful',
    file: 'src/bits/ElasticString.jsx',
    dependencies: [],
    description: 'Strings that bend under the pointer and twang back with a damped wobble, reporting each pluck.'
  },
  {
    slug: 'sticker-board',
    name: 'StickerBoard',
    category: 'playful',
    file: 'src/bits/StickerBoard.jsx',
    dependencies: [],
    description: 'Draggable stickers that peel, slap down, rotate and stack, with keyboard moves and a saved layout.'
  },
  {
    slug: 'agent-card',
    name: 'AgentCard',
    category: 'ai',
    file: 'src/bits/AgentCard.jsx',
    dependencies: [],
    description: 'Tool-call card for an agent run: status, live timer, streaming logs and the result or error.'
  },
  {
    slug: 'suggestion-chips',
    name: 'SuggestionChips',
    category: 'ai',
    file: 'src/bits/SuggestionChips.jsx',
    dependencies: [],
    description: 'Prompt suggestion chips that stagger in and reshuffle into a fresh set.'
  },
  {
    slug: 'diff-reveal',
    name: 'DiffReveal',
    category: 'ai',
    file: 'src/bits/DiffReveal.jsx',
    dependencies: [],
    description: 'Animated word-level diff: deletions strike and fold away, then insertions type in highlighted.'
  },
  {
    slug: 'interactive-grid',
    name: 'InteractiveGrid',
    category: 'backgrounds',
    file: 'src/bits/InteractiveGrid.jsx',
    dependencies: [],
    description: 'Grid cells that light up under the pointer and cool through a colour ramp, with click ripples and an idle autopilot.'
  },
  {
    slug: 'meteor-shower',
    name: 'MeteorShower',
    category: 'backgrounds',
    file: 'src/bits/MeteorShower.jsx',
    dependencies: [],
    description: 'Meteors streaking on a shared heading over twinkling stars, in crisp pixels or smooth glowing streaks.'
  },
  {
    slug: 'webcam-pixels',
    name: 'WebcamPixels',
    category: 'backgrounds',
    file: 'src/bits/WebcamPixels.jsx',
    dependencies: [],
    description: 'Live camera redrawn as pixel art, ASCII or halftone dots, with clear permission states and a palette snap.'
  },
  {
    slug: 'wobble-card',
    name: 'WobbleCard',
    category: 'cards',
    file: 'src/bits/WobbleCard.jsx',
    dependencies: [],
    description: 'Jelly card that leans and stretches toward the pointer and wobbles back into shape.'
  },
  {
    slug: 'cursor-attractor',
    name: 'CursorAttractor',
    category: 'playful',
    file: 'src/bits/CursorAttractor.jsx',
    dependencies: [],
    description: 'Items that lean toward (or shy away from) the pointer on springs and snap back when it leaves.'
  },
  {
    slug: 'jelly-blob',
    name: 'JellyBlob',
    category: 'playful',
    file: 'src/bits/JellyBlob.jsx',
    dependencies: [],
    description: 'Soft-body button whose outline bulges toward the pointer, squashes on press and bounces back.'
  },
  {
    slug: 'screensaver',
    name: 'Screensaver',
    category: 'playful',
    file: 'src/bits/Screensaver.jsx',
    dependencies: [],
    description: 'Bouncing-logo screensaver that recolours on every wall and celebrates exact corner hits.'
  },
  {
    slug: 'polaroids',
    name: 'Polaroids',
    category: 'cards',
    file: 'src/bits/Polaroids.jsx',
    dependencies: [],
    description: 'Pile of instant photos you can fling across the table, with momentum, spin and edge bounces.'
  },
  {
    slug: 'hex-field',
    name: 'HexField',
    category: 'backgrounds',
    file: 'src/bits/HexField.jsx',
    dependencies: [],
    description: 'Hexagon field with a drifting wave, a pointer glow and ripple rings on click.'
  },
  {
    slug: 'cloud-sky',
    name: 'CloudSky',
    category: 'backgrounds',
    file: 'src/bits/CloudSky.jsx',
    dependencies: [],
    description: 'Ray-marched WebGL clouds lit by the sun, with quality presets and an optional pixel-art mode.'
  },
  {
    slug: 'breadcrumb-trail',
    name: 'BreadcrumbTrail',
    category: 'navigation',
    file: 'src/bits/BreadcrumbTrail.jsx',
    dependencies: [],
    description: 'Breadcrumbs that fold their middle crumbs into an animated “…” menu when space runs out.'
  },
  {
    slug: 'inline-edit',
    name: 'InlineEdit',
    category: 'inputs',
    file: 'src/bits/InlineEdit.jsx',
    dependencies: [],
    description: 'Click-to-edit text whose field grows with what you type, with save, cancel, validation and async saves.'
  },
  {
    slug: 'funnel-flow',
    name: 'FunnelFlow',
    category: 'data',
    file: 'src/bits/FunnelFlow.jsx',
    dependencies: [],
    description: 'Funnel chart with particles streaming between stages; the share that drops out falls away.'
  },
  {
    slug: 'scroll-typography',
    name: 'ScrollTypography',
    category: 'scroll',
    file: 'src/bits/ScrollTypography.jsx',
    dependencies: [],
    description: 'Words that get heavier, stretch, lean and recolour with scroll speed, rippling word by word.'
  },
  {
    slug: 'kinetic-headline',
    name: 'KineticHeadline',
    category: 'text-animations',
    file: 'src/bits/KineticHeadline.jsx',
    dependencies: [],
    description: 'Variable-font headline whose letters breathe in a wave, pulse to a tempo or follow the scroll.'
  },
  {
    slug: 'signal-text',
    name: 'SignalText',
    category: 'text-animations',
    file: 'src/bits/SignalText.jsx',
    dependencies: [],
    description: 'Text with a bad signal: noise that locks in, a split-flap board, or colour-split glitch bursts.'
  },
  {
    slug: 'ink-text',
    name: 'InkText',
    category: 'text-animations',
    file: 'src/bits/InkText.jsx',
    dependencies: [],
    description: 'Text filled with a sweeping glint, flowing pixel-band colours, a flooding outline or a panning picture.'
  },
  {
    slug: 'pixel-type',
    name: 'PixelType',
    category: 'text-animations',
    file: 'src/bits/PixelType.jsx',
    dependencies: [],
    description: 'Words built from pixel blocks that fly together, crumble under gravity and scatter from the pointer.'
  },
  {
    slug: 'proximity-type',
    name: 'ProximityType',
    category: 'text-animations',
    file: 'src/bits/ProximityType.jsx',
    dependencies: [],
    description: 'Letters that swell in weight and width toward the pointer, pushing a soft bulge along the line.'
  },
  {
    slug: 'shadow-stack',
    name: 'ShadowStack',
    category: 'text-animations',
    file: 'src/bits/ShadowStack.jsx',
    dependencies: [],
    description: 'Chunky retro titles with a stepped extruded block or fading echoes that follow the pointer and squash on press.'
  },
  {
    slug: 'marquee-line',
    name: 'MarqueeLine',
    category: 'text-animations',
    file: 'src/bits/MarqueeLine.jsx',
    dependencies: [],
    description: 'An endless banner that surges, leans and reverses with page scroll, with drag to scrub and a pause button.'
  },
  {
    slug: 'pointer-kit',
    name: 'PointerKit',
    category: 'playful',
    file: 'src/bits/PointerKit.jsx',
    dependencies: [],
    description: 'A custom pointer layer: pixel trail, HUD crosshair, target brackets on buttons, click sparks and a squashy blob.'
  },
  {
    slug: 'footprints',
    name: 'Footprints',
    category: 'playful',
    file: 'src/bits/Footprints.jsx',
    dependencies: [],
    description: 'Leaves pixel footprints (or your own stamps) along the pointer path that turn to follow you and fade.'
  },
  {
    slug: 'edge-fx',
    name: 'EdgeFX',
    category: 'cards',
    file: 'src/bits/EdgeFX.jsx',
    dependencies: [],
    description: 'A live card edge: marching pixel ants, a circling energy band, a pointer-following glow or a glare sweep.'
  },
  {
    slug: 'reveal',
    name: 'Reveal',
    category: 'scroll',
    file: 'src/bits/Reveal.jsx',
    dependencies: [],
    description: 'Entrances on scroll or mount: fade, rise, zoom, stepped wipe or a pixel block dissolve, with cascading children.'
  },
  {
    slug: 'marquee',
    name: 'Marquee',
    category: 'showcase',
    file: 'src/bits/Marquee.jsx',
    dependencies: [],
    description: 'A moving wall of logos or cards in lanes that alternate direction; hovering slows the lane and spotlights the item.'
  },
  {
    slug: 'grain-fx',
    name: 'GrainFX',
    category: 'backgrounds',
    file: 'src/bits/GrainFX.jsx',
    dependencies: [],
    description: 'Stackable texture overlays: live pixel grain, 8-bit dither, fading halftone, scanlines and an edge blur.'
  },
  {
    slug: 'aurora-bands',
    name: 'AuroraBands',
    category: 'backgrounds',
    file: 'src/bits/AuroraBands.jsx',
    dependencies: [],
    description: 'Northern lights drawn in flat pixel bands: rippling curtains with a sharp lower edge over a starry sky.'
  },
  {
    slug: 'warp-field',
    name: 'WarpField',
    category: 'backgrounds',
    file: 'src/bits/WarpField.jsx',
    dependencies: [],
    description: 'Pixel stars streaking out of a vanishing point that leans toward the pointer; hold to jump to hyperspace.'
  },
  {
    slug: 'light-shafts',
    name: 'LightShafts',
    category: 'backgrounds',
    file: 'src/bits/LightShafts.jsx',
    dependencies: [],
    description: 'Shafts of pixel light: swaying rays from a source, flickering floor pillars, or forked lightning with a flash.'
  },
  {
    slug: 'lava-lamp',
    name: 'LavaLamp',
    category: 'backgrounds',
    file: 'src/bits/LavaLamp.jsx',
    dependencies: [],
    description: 'A pixel lava lamp: metaball blobs rise, merge and sink with a lit rim, and the pointer is a blob too.'
  },
  {
    slug: 'code-rain',
    name: 'CodeRain',
    category: 'backgrounds',
    file: 'src/bits/CodeRain.jsx',
    dependencies: [],
    description: 'Columns of falling glyphs with bright heads, fading tails, glyph flips and glitch rows; hot near the pointer.'
  },
  {
    slug: 'dither-field',
    name: 'DitherField',
    category: 'backgrounds',
    file: 'src/bits/DitherField.jsx',
    dependencies: [],
    description: 'A drifting colour field drawn with a few colours and ordered 8-bit dithering, with a pointer glow.'
  },
  {
    slug: 'contour-lines',
    name: 'ContourLines',
    category: 'backgrounds',
    file: 'src/bits/ContourLines.jsx',
    dependencies: [],
    description: 'A breathing topographic map traced in pixels, with brighter index lines, atlas tints and a pointer hill.'
  },
  {
    slug: 'scan-scope',
    name: 'ScanScope',
    category: 'backgrounds',
    file: 'src/bits/ScanScope.jsx',
    dependencies: [],
    description: 'A radar sweep or scanning bar over a pixel grid that lights, pings and fades blips as it passes.'
  },
  {
    slug: 'card-deck',
    name: 'CardDeck',
    category: 'cards',
    file: 'src/bits/CardDeck.jsx',
    dependencies: [],
    description: 'A fanned deck you deal through: throw the top card off and it spins away and slides under the pile.'
  },
  {
    slug: 'coverflow',
    name: 'Coverflow',
    category: 'showcase',
    file: 'src/bits/Coverflow.jsx',
    dependencies: [],
    description: 'A 3D shelf: the chosen item faces you while neighbours turn away and recede; drag, scroll, click or use keys.'
  },
  {
    slug: 'masonry-wall',
    name: 'MasonryWall',
    category: 'cards',
    file: 'src/bits/MasonryWall.jsx',
    dependencies: [],
    description: 'A masonry layout that glides items to their new places on resize or change, with a stepped pop for arrivals.'
  },
  {
    slug: 'feed-list',
    name: 'FeedList',
    category: 'data',
    file: 'src/bits/FeedList.jsx',
    dependencies: [],
    description: 'A live activity feed: new entries slide in with a flash, old ones fold away, times stay fresh; optionally selectable.'
  },
  {
    slug: 'hotbar-dock',
    name: 'HotbarDock',
    category: 'navigation',
    file: 'src/bits/HotbarDock.jsx',
    dependencies: [],
    description: 'A game hotbar dock: slots swell near the pointer, number keys and the wheel pick a slot, stacks show counts.'
  },
  {
    slug: 'overlay-menu',
    name: 'OverlayMenu',
    category: 'navigation',
    file: 'src/bits/OverlayMenu.jsx',
    dependencies: [],
    description: 'A full-screen menu that wipes in in pixel steps with big numbered links dropping in one by one.'
  },
  {
    slug: 'trading-card',
    name: 'TradingCard',
    category: 'cards',
    file: 'src/bits/TradingCard.jsx',
    dependencies: [],
    description: 'A collectible card that tilts to the pointer with glare, rarity frames, stepped holo foil and a flip side.'
  },
  {
    slug: 'glass-panel',
    name: 'GlassPanel',
    category: 'primitives',
    file: 'src/bits/GlassPanel.jsx',
    dependencies: [],
    description: 'A frosted glass surface with a lit edge, a pointer sheen and an optional 8-bit dither over the frost.'
  },
  {
    slug: 'wheel-picker',
    name: 'WheelPicker',
    category: 'inputs',
    file: 'src/bits/WheelPicker.jsx',
    dependencies: [],
    description: 'A spinning drum picker that coasts and clicks into place, with wheel and full keyboard control.'
  },
  {
    slug: 'hold-to-confirm',
    name: 'HoldToConfirm',
    category: 'inputs',
    file: 'src/bits/HoldToConfirm.jsx',
    dependencies: [],
    description: 'A press-and-hold button: a pixel fuse burns across it and rewinds if you let go early.'
  },
  {
    slug: 'swipe-actions',
    name: 'SwipeActions',
    category: 'cards',
    file: 'src/bits/SwipeActions.jsx',
    dependencies: [],
    description: 'A row you swipe to reveal actions, with full-swipe to fire, plus a keyboard menu with the same actions.'
  },
  {
    slug: 'discard',
    name: 'Discard',
    category: 'playful',
    file: 'src/bits/Discard.jsx',
    dependencies: [],
    description: 'Throw content away with style: shredded into strips, crumpled and tossed, or torn in two.'
  },
  {
    slug: 'rating-pips',
    name: 'RatingPips',
    category: 'inputs',
    file: 'src/bits/RatingPips.jsx',
    dependencies: [],
    description: 'Pixel heart containers for ratings or health, with halves, hover preview, pickup pops and a slider for keyboards.'
  },
  {
    slug: 'scrub-number',
    name: 'ScrubNumber',
    category: 'inputs',
    file: 'src/bits/ScrubNumber.jsx',
    dependencies: [],
    description: 'A number field you can scrub by dragging its label, with a sliding pixel ruler, typing and arrow keys.'
  },
  {
    slug: 'pixel-spinners',
    name: 'PixelSpinners',
    category: 'pixel-game',
    file: 'src/bits/PixelSpinners.jsx',
    dependencies: [],
    description: 'Five CSS pixel loaders: chasing blocks, a bouncing bar, hopping dots, a flipping hourglass and an orbit.'
  },
  {
    slug: 'arcade-buttons',
    name: 'ArcadeButtons',
    category: 'pixel-game',
    file: 'src/bits/ArcadeButtons.jsx',
    dependencies: [],
    description: 'Buttons with tricks: one launches with smoke, one dodges the pointer, one stretches like a slingshot.'
  }
];
