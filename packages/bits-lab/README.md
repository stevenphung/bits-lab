# Bits Lab

159 original React components with an 8-bit soul: text effects, animated backgrounds, game UI, inputs, data displays, overlays, navigation and playful toys. Every component brings its own styles, so there is nothing else to import or configure.

Browse them all, tweak their props and copy the code at **https://bits-lab.vercel.app**.

## Install

```bash
npm install bits-lab
```

Needs React 19. Nothing else has dependencies, except `GravityBox`, which uses `matter-js` for its physics. Install it and import GravityBox from its own entry point:

```bash
npm install matter-js
```

```jsx
import GravityBox from "bits-lab/GravityBox";
```

## Use

```jsx
import { FocusPull, HoldToConfirm, PixelSpinners } from "bits-lab";

export default function Page() {
  return (
    <>
      <FocusPull as="h1" text="Every pixel snaps into focus" />
      <HoldToConfirm onConfirm={() => console.log("Deleted")}>Hold to delete</HoldToConfirm>
      <PixelSpinners type="hourglass" label="Loading" showLabel />
    </>
  );
}
```

Each component also has its own entry point, which is handy for components with several exports:

```jsx
import Toaster, { toast } from "bits-lab/ToastStack";
import { Switch, Checkbox } from "bits-lab/ToggleKit";
```

- **TypeScript:** types are included.
- **Next.js:** every file starts with `"use client"`, so components work in the App Router without a wrapper.
- **Accessibility:** components follow WAI-ARIA patterns, work with the keyboard and respect reduced motion.

## License

MIT © Steven Phung
