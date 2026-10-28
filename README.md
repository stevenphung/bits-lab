# Bits Lab

An 8-bit component library: 159 original React components, each in four variants (JavaScript or TypeScript, styled with plain CSS or Tailwind), with live previews, Customize controls and copy-paste code.

```bash
npm install
npm run dev   # http://localhost:5173
```

The UI is an 8-bit game theme: Sweetie 16 palette, pixel fonts, notched pixel borders and a blinking ► menu cursor. See [docs/RETRO_DESIGN.md](docs/RETRO_DESIGN.md). Each component page has this layout:

- the preview is a "screen" stage;
- details and code sit on the left;
- Customize is a sticky dialog box with a "► Copy usage" button.

Demo content is a nostalgic pixel-adventure world: original sprites and biome scenes from `src/pixel/art.js`, game-flavored preview text, and a service worker (`public/pixel-sw.js`) that swaps stock photos in component previews for local pixel art. See "Demo world" in the design doc.

## What it does

Each component page has:

- **Preview**: the live component with a replay button.
- **Customize**: sliders, segmented selects, text and color inputs. Every value is stored in the query string (non-defaults only), so a tuned page is a shareable link.
- **Props**: a prop table.
- **Code**:
  - Install command for pnpm / npm / yarn / bun.
  - A usage snippet rewritten to match the current props.
  - The full source, loaded with Vite `?raw` from the same file that renders the preview.

The install command uses a shadcn-compatible registry that `scripts/build-registry.mjs` writes to `public/r/` on dev start, on build and when a component changes:

```bash
npx shadcn@latest add http://localhost:5173/r/FocusPull.json
```

Live at **https://bits-lab.vercel.app**. Two more pages sit beside the components:

- **Templates** (`/templates`): three full pages (a SaaS landing page, a game page and an app launch page) made only from Bits Lab components. Between them they use every component; `npm run check:templates` keeps it that way. Sources are in `src/templates/`.
- **React Bits** (`/react-bits`): a link directory of every React Bits component, with the Bits Lab originals that cover the same idea. Names and links only (`src/lib/reactbits-directory.js`).

## Layout

| Path | Role |
|---|---|
| `src/bits/` | The components, JavaScript + CSS (standalone, zero dependencies) |
| `src/bits/ts/`, `src/bits/tw/`, `src/bits/tw-ts/` | TypeScript + CSS, JavaScript + Tailwind, TypeScript + Tailwind |
| `src/meta.js` | Name, slug, category, file and deps for each component (shared with the registry script) |
| `src/catalog.jsx` | Demo config for each component: defaults, controls, prop docs, usage template |
| `src/lib/useUrlProps.js` | Query-string-backed prop state, parsed by default type |
| `src/lib/injectProps.js` | Rewrites the usage snippet from changed props |
| `src/lib/cli.js` | Install commands for each package manager |
| `src/ui/` | Page, controls, code blocks |

## Local-only parts

Two parts of the dev setup are not in this repository, and the app builds without them:

- **A private React Bits catalog** (`src/reactbits/`). React Bits is MIT + Commons Clause, which forbids redistributing its components, so it stays on the author's machine. Bits Lab components are written from scratch, and `npm run check:originals` checks that none shares a name or a prop set with a React Bits component. The site links to [reactbits.dev](https://reactbits.dev) instead.
- **Five tool studios** (`src/tools/*`), kept local until they are redesigned under their own names. Without them there is no Tools tab.

## Publishing

What git contains is what gets published: the local-only parts above are git-ignored. `vercel.json` builds with `npm run build` and serves the single-page app for every path; pixel art and the `/r` registry are generated during the build. Vercel deploys every push to `main` of the GitHub repo.

Before publishing, run the checks:

```bash
npm run check:ts         # TypeScript variants: strict types, no drift from the .jsx
npm run check:tw         # Tailwind variants: types, logic and drift
npm run check:originals  # no Bits Lab component shares a name or its props with a React Bits one
npm run check:templates  # the three templates use every component
```

## Adding a component

1. Put the component in `src/bits/Name.jsx`.
2. Add an entry to `COMPONENTS` in `src/meta.js`.
3. Add its demo config to `DEMOS` in `src/catalog.jsx`, keyed by slug.
