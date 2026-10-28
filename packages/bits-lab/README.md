# Bits Lab

**The foundation for agent–human interfaces.** 159 original React components for the moments that matter when software can think: chat, streaming answers, live progress, tool calls, diffs, approvals and undo, plus everything around them (inputs, overlays, navigation, data and motion), in a playful 8-bit style. Every component brings its own styles, so there is nothing else to import or configure.

Try them all, tweak their props and copy the code at **https://bits-lab.vercel.app**.

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
import { AgentCard, DiffReveal, HoldToConfirm, ThinkingShimmer } from "bits-lab";

// One turn of an agent: think, act, show the change, wait for a yes.
export function AgentTurn({ run, onApprove }) {
  return (
    <>
      <ThinkingShimmer thinking={run.thinking} steps={run.steps} />
      <AgentCard tool={run.tool} args={run.args} status={run.status} logs={run.logs} />
      <DiffReveal before={run.before} after={run.after} />
      <HoldToConfirm onConfirm={onApprove}>Hold to approve</HoldToConfirm>
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
