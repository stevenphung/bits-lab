# Bits Lab

**Game feel for real products.** 177 original React components that bring game design to everyday software: onboarding as a quest, milestones as achievements, progress bars, combos, streaks, loading screens with tips and hold-to-confirm for risky actions, plus everything around them (inputs, overlays, navigation, data and motion), in a playful 8-bit style. Every component brings its own styles, so there is nothing else to import or configure.

Play with them all, tweak their props and copy the code at **https://bits-lab.vercel.app**.

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
import { AchievementToast, HoldToConfirm, QuestLog, achievement } from "bits-lab";

const quests = [
  { id: "profile", title: "Create your profile", xp: 50 },
  { id: "invite", title: "Invite a teammate", xp: 100, requires: ["profile"] }
];

// Onboarding as a quest: finishing a task pops an achievement.
export function Onboarding({ onDeleteDraft }) {
  return (
    <>
      <QuestLog quests={quests} onQuestComplete={quest => achievement({ title: quest.title, xp: quest.xp, tier: "gold" })} />
      <HoldToConfirm onConfirm={onDeleteDraft}>Hold to delete draft</HoldToConfirm>
      <AchievementToast />
    </>
  );
}
```

Each component also has its own entry point, which is handy for components with several exports:

```jsx
import Toaster, { toast } from "bits-lab/ToastStack";
import { Switch, Checkbox } from "bits-lab/ToggleKit";
```

- **Light mode:** add `data-theme="light"` (or the `light` class) to `<html>` or any wrapper; `data-theme="system"` follows the OS. Colour props still override. Overlays render into `<body>`, so theme `<html>` or `<body>` for them.
- **Docs for AI tools:** `llms.txt` and `docs/<Name>.md` ship in the package (and at https://bits-lab.vercel.app/llms.txt), with every prop, type and default.
- **TypeScript:** types are included.
- **Next.js:** every file starts with `"use client"`, so components work in the App Router without a wrapper.
- **Accessibility:** components follow WAI-ARIA patterns, work with the keyboard and respect reduced motion.

## License

MIT © Steven Phung
