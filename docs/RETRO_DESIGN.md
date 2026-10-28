# Bits Lab retro design — 8-bit game UI

The app's look. Every token lives in `:root` in `src/styles.css`.

## Palette — Sweetie 16

A well-known 16-color pixel-art palette, so every color comes from one set.

| Token | Hex | Used for |
|---|---|---|
| `--night` | `#1a1c2c` | Page background (with a navy dot pattern) |
| `--void` / `--ink` | `#11121e` / `#0b0b14` | Header, sidebar, code wells / every outline |
| `--deep` / `--slate` | `#333c57` / `#566c86` | Dividers, hover rows, muted chrome |
| `--mist` | `#94b0c2` | Secondary text |
| `--paper` | `#f4f4f4` | Body text on dark, dialog-box panels |
| `--yellow` | `#ffcd75` | Titles, the ► cursor, badges, slider handles |
| `--red` / `--orange` | `#b13e53` / `#ef7d57` | Primary button and its hover, logo shadow |
| `--blue` / `--sky` / `--cyan` | `#3b5dc9` / `#41a6f6` / `#73eff7` | Selected chips / secondary buttons / links |
| `--lime` / `--green` | `#a7f070` / `#38b764` | Code text, counts / slider fill, toggles |
| `--plum`, `--navy`, `--teal` | | Avatars, selected nav row, accents |

## Type

| Font | Role |
|---|---|
| **Press Start 2P** | Logo, headings, tabs, buttons, field labels. Always uppercase, 8–24px. |
| **Pixelify Sans** | Body text and descriptions (16–20px), readable at length. |
| **VT323** | Code, numbers, search input (19–22px). |

All three are free Google Fonts, loaded in `index.html`.

## Pixel rules

- **Notched borders.** `--notch` draws a 4px outline with four box-shadows, which leaves the corners empty for pixel-rounded corners. It's used on panels, buttons, stages and cards.
- **Hard shadows only.** `--drop` is an 8px offset with no blur.
- **Bevels.** `--bevel` puts a light edge top-left and a dark edge bottom-right. Pressing a button swaps to `--bevel-pressed` and moves the button down 2–3px.
- **Square everything.** No border radius anywhere: sliders are bars with block handles, toggles are block switches, color swatches are squares.
- **Menu cursor.** The selected sidebar item and tab get a blinking `►`, and so do selected chips and the primary button.
- **Screens.** Preview stages are black "screens" with faint scanlines (`::after`, `pointer-events: none`).
- **Cartridges.** Tool cards use flat palette colors with a dither overlay, and their icons hop on hover.
- **Stepped motion.** Animations use `steps()` timing so they move in 8-bit style. Blinking and hopping turn off under `prefers-reduced-motion`.
- **Pixel cursor** across the whole page.

## Layout

The layout is unchanged from before: header with tabs and search; level-select sidebar; preview stage with details on the left and a sticky control dialog on the right; tool pages with the stage, control dialog and extras. Responsive steps:

- **Below 1360px:** the menu tabs move to their own row.
- **Below 1080px:** single column, with the control panel right after the preview.
- **Below 760px:** the sidebar becomes a sideways-scrolling row of menu chips.

## Demo world: pixel adventure

All demo content follows one theme: a nostalgic, blocky voxel-adventure world. Every asset is original, generated in code. No game textures, logos or characters are copied, and no game is named.

| Piece | Where | What |
|---|---|---|
| Pixel-art kit | `src/pixel/art.js` | 15 hand-placed 16×16 sprites (heart, gem, pickaxe, sword, chest, potion, book, star, XP orb, coin, note, painting, lever, grass block, workbench) with automatic ink outlines, plus 12 procedurally generated biome scenes (plains, forest, desert, snowy peaks, ocean, jungle, mesa, night plains, underworld, void isles, deep cave, blossom hills). Pure JS, so it runs in both Node and the browser. |
| Generated files | `scripts/generate-pixel-assets.mjs` → `public/pixel/` | 768×512 PNG postcard per biome, 128px PNG per sprite, and the gem `favicon.svg`. Regenerated on dev start and build; git-ignored. |
| `<Sprite>` | `src/pixel/Sprite.jsx` | Crisp SVG sprites for the header tabs, logo, hearts HUD, avatars and template cards. |

UI copy gets a light game flavor while labels stay clear: "Crafting table" (Customize), "Craft & copy usage", "Respawn" (replay), "Loot: install & code", "Recipe: props", "Search the inventory", and "Workbench" for the tools.
