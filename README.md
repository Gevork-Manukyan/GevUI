# Gevs-Components

Custom React components for Next.js (and other React apps). This repo is the place to develop and demo them; components are built with Vite + React here and can be copied into a Next.js app or consumed as a package later.

## Components

### AppSwitcher

Infinite horizontal carousel in the style of the iPhone app switcher: the center card is largest and on top; cards to the left and right scale down and sit behind. Input is via touch swipe, mouse/trackpad drag, or horizontal wheel scroll, with optional momentum and snap-to-center.

**Content (pick one)**

- **`children`** — Each direct child is one card. Use when you only need the carousel.
- **`items`** — Array of `AppSwitcherItem`: each has `content` (ReactNode) and optional `path` (string) and `component` (ReactNode). When a card is selected, `onCardSelect(index, item)` runs; if the item has a `component`, the carousel can show that view with a Back control (see `showComponentOnSelect`).

**Main props**

- **Layout**: `stepWidth`, `scaleFactor`, `cardWidth`, `cardHeight` — spacing and scaling; `scaleFactor` controls how much cards shrink away from center.
- **Scroll direction**: `invertSwipe`, `invertDrag`, `invertScroll` — flip direction per input type.
- **Scroll feel**: `scrollSpeed` (number or `{ wheel?, swipe?, pointerDrag? }`), `dragMomentum`, `dragTransition` (power, timeConstant, bounceStiffness, bounceDamping).
- **Snap**: `snapToCenter` — `true` or a config object (`delayMs`, `thresholdPx`, `duration`, `ease` or spring `stiffness`/`damping`).
- **Visual**: `fade`, `fadeStartDistance` — opacity near edges.
- **Component view** (when using `items`): `showComponentOnSelect`, `tapToEnterComponent`, `swipeDownToEnterComponent`, `scrollDownToEnterComponent`, `scrollUpToExitComponent`.
- **Callback**: `onCardSelect(index, item?)` — fired when a card is clicked (not when the user drags).

**Exports**

`AppSwitcher`, `AppSwitcherItem`, `AppSwitcherProps`, `AppSwitcherDragTransition`, `AppSwitcherSnapToCenter`, `AppSwitcherScrollSpeed` from [src/components/app-switcher/index.ts](src/components/app-switcher/index.ts). Full JSDoc is in [AppSwitcher.tsx](src/components/app-switcher/AppSwitcher.tsx).

**Examples**

With `items` (recommended when you need paths or detail views):

```tsx
import { AppSwitcher, type AppSwitcherItem } from "@/components/app-switcher"

const items: AppSwitcherItem[] = [
  { content: <MyCard label="A" />, path: "/a" },
  { content: <MyCard label="B" />, component: <SettingsView /> },
]

<AppSwitcher
  items={items}
  stepWidth={200}
  cardWidth={260}
  cardHeight={280}
  snapToCenter={{ delayMs: 300, duration: 0.25 }}
  onCardSelect={(index, item) => console.log(item?.path)}
/>
```

With `children` (simple carousel, no paths or component views):

```tsx
<AppSwitcher stepWidth={200} cardWidth={260} cardHeight={280}>
  <MyCard label="A" />
  <MyCard label="B" />
  <MyCard label="C" />
</AppSwitcher>
```

**Using in your own app (e.g. Next.js)**

1. Copy the whole `src/components/app-switcher` folder into your app (e.g. as `components/app-switcher`). Keep all files (AppSwitcher.tsx, Rail.tsx, RailView.tsx, CardSlot.tsx, constants.ts, utils.ts, index.ts).
2. Install the dependency: `npm install motion`
3. Wrap the component in a container with a defined size (it fills its parent). For example: `<div style={{ width: "100%", height: "100vh" }}><AppSwitcher ... /></div>`
4. Import from your copy: `import { AppSwitcher, type AppSwitcherItem } from "@/components/app-switcher"` (adjust the path to match your folder).

## Getting started

```bash
npm install
npm run dev
```

This runs the Vite dev server so you can try the components (e.g. the AppSwitcher demo in the default app). To use a component in another app, see the instructions in that component’s section above.

## Tech

- React, TypeScript
- [Motion](https://motion.dev/) (Framer Motion) for AppSwitcher animations

## Project structure

Components live under `src/components/<component-name>/`, for example `src/components/app-switcher/`.
