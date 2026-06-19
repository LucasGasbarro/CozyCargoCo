# 🚂 Cozy Cargo Co.

A **cozy, low-pressure train-management game** for the browser — built mobile-first and installable
as a PWA. Set up your little rail network, load cargo, dispatch your trains, and check back later to
collect the coins they earned while you were away. No timers nagging you, no fail states — just a few
relaxing minutes of planning whenever you feel like it.

Inspired by NimbleBit's _Pocket Trains_, but deliberately gentler and simpler: think **5-minute
set-and-forget sessions** rather than a demanding tycoon sim.

> Full design spec & decision log live in [`BasePrompt.md`](./BasePrompt.md).
> Want to tweak or extend the game? See the [**Configuration & Modding Guide**](./GUIDE.md).

---

## ✨ What you can do

- **Tap a town** on the map to see the cargo jobs waiting there.
- **Load a train** (respecting its car slots) and **dispatch** it to a connected town.
- Trains travel in **real time** — coins are paid out automatically on delivery.
- Progress keeps running while the tab is closed: a **"Welcome back"** summary tallies everything
  that arrived while you were away (exact, timestamp-based offline reconciliation).
- **Grow your network**: spend coins to unlock new towns; track is laid automatically to the
  nearest connected stop.
- Everything **auto-saves** to your browser (`localStorage`).

---

## 🧱 Tech stack

| Concern        | Choice                                            |
| -------------- | ------------------------------------------------- |
| Language       | TypeScript (strict)                               |
| UI             | React 19                                          |
| Rendering      | HTML5 Canvas (procedural cartoon art, no assets)  |
| Build / dev    | Vite                                              |
| Offline / PWA  | `vite-plugin-pwa` (manifest + service worker)     |
| Tests          | Vitest                                            |
| Lint / format  | ESLint + Prettier                                 |
| Persistence    | `localStorage` (abstracted, swappable adapter)    |

The **game engine is pure and framework-agnostic** (`src/game/`) — no React or DOM. The same
`tick()` that advances live play also powers offline progress, so earnings are always exact.

---

## 🚀 Getting started

Requires **Node 20+** and npm.

```bash
npm install        # install dependencies
npm run dev        # start the dev server (http://localhost:5173)
```

Then open the printed URL in a desktop or mobile browser.

### Other scripts

| Command              | What it does                                              |
| -------------------- | -------------------------------------------------------- |
| `npm run dev`        | Start Vite dev server with hot reload.                   |
| `npm run build`      | Type-check (`tsc -b`) and build a production bundle.     |
| `npm run preview`    | Serve the production build locally.                      |
| `npm run test`       | Run Vitest in watch mode.                                |
| `npm run test:run`   | Run the full test suite once (CI-style).                 |
| `npm run lint`       | Lint the codebase with ESLint.                           |
| `npm run format`     | Format the codebase with Prettier.                       |

---

## 📁 Project structure

```
src/
  game/                 # Pure, testable game core (no React/DOM)
    model/types.ts      # Domain types + constants (Town, Train, CargoJob, GameState…)
    engine/             # Pure logic: rng, economy, jobs, dispatch, tick, replenish, growth
    save/               # serialize · localStorage adapter · offline reconciliation
    content/world.ts    # Starter world: towns, trains, cargo labels, new-game factory
    util.ts             # clamp, formatCoins
  render/map.ts         # Canvas drawing (camera fit, towns, track, interpolated trains)
  ui/                   # React layer
    store.tsx           # Game store: load, 1s tick loop, autosave, actions
    MapView.tsx         # Canvas component + tap-to-select
    Hud.tsx             # Coin balance + reset
    TownPanel.tsx       # Jobs, loadout, destination, dispatch, unlock
    Roster.tsx          # All trains + live arrival countdowns
    WelcomeBack.tsx     # Offline-earnings summary modal
  audio/                # (reserved for SFX — see GUIDE.md)
Kanban/                 # View-only progress board (index.html + tasks.js)
BasePrompt.md           # Living design spec & decision log
GUIDE.md                # How to edit/configure the game
```

---

## 🗺️ Milestones

Build progress is tracked on a simple **view-only kanban board** in [`Kanban/`](./Kanban) — open
`Kanban/index.html` in a browser (it auto-refreshes every 20 s and shows live ETAs for in-progress
tasks).

| #   | Milestone        | Status | Summary                                                            |
| --- | ---------------- | ------ | ----------------------------------------------------------------- |
| M1  | Scaffold         | ✅     | Vite + React + TS (strict), ESLint/Prettier, Vitest, PWA.         |
| M2  | Model & Engine   | ✅     | Domain types, job generation, dispatch/travel/collect, economy.   |
| M3  | Save & Offline   | ✅     | Versioned save, `localStorage`, offline reconciliation.           |
| M4  | Map Rendering    | ✅     | Canvas towns/track/interpolated trains, camera fit.               |
| M5  | Core UI          | ✅     | HUD, town panel, dispatch, roster, welcome-back.                  |
| M6  | Network Growth   | ✅     | Unlock towns with coins; auto-lay connecting track.               |
| M7  | Content          | ✅     | 8 towns, 2 trains, 6 cargo types; deterministic new-game.         |
| M8  | Audio            | ⏳     | Light SFX (click/chime/coin).                                     |
| M9  | Polish           | ⏳     | Responsive + touch pass, PWA install, perf.                       |
| M10 | QA & Ship        | ⏳     | Verify Definition of Done; deploy to static hosting.              |

---

## 🎮 How a turn plays

1. A town on the map shows how many **jobs** are waiting.
2. Tap it → pick an **idle train** parked there → tick the cargo you want (up to its car slots).
3. Choose a connected **destination** and hit **Dispatch**. The train rolls off in real time.
4. Cargo bound for that town is delivered on arrival (coins credited); anything bound further stays
   loaded for the next hop.
5. Spend coins to **unlock new towns** and grow the network. Come back whenever — your trains keep
   working, and the **Welcome back** screen sums up what you earned.

---

## 📦 Deployment

`npm run build` emits a fully static site to `dist/` (including the PWA service worker). Host it on
any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages, S3, …) — no backend required.

---

## 📝 License & assets

All in-game art is **drawn procedurally on canvas** — there are no third-party image/audio assets to
attribute in the MVP. If you add real sprites or sound, record their licenses (see `GUIDE.md`).
