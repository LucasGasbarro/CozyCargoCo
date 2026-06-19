# BasePrompt — *Cozy Cargo Co.* (Browser Train Game, inspired by *Pocket Trains*)

> Foundational reference document for building a browser-based, mobile-friendly train
> management game inspired by NimbleBit's **Pocket Trains** (2013). This captures the
> reference game's features, systems, and monetization so we can design our own original
> implementation. We will build an **original game** — names, art, cities, and trains
> must be our own; this document describes the *genre conventions and mechanics* to learn
> from, not assets to copy.

---

## 0. Our Game's Vision & Design Pillars

> **This is the most important section. Every feature decision must serve this vision.**

We are building a **cozy, low-pressure railway game** — calm, satisfying, and respectful of
the player's time. The fantasy is being a relaxed railway dispatcher who tends a little
network: you sit down for ~5 minutes, thoughtfully **set up your train lines and plan your
routes**, then **walk away and let time pass**. Later you come back to a network that has been
quietly working, collect your earnings, tweak the plan, and leave again.

**Design pillars (non-negotiable):**
1. **Cozy & calm.** Warm, gentle tone. No stress, no fail states, no punishing timers, no FOMO
   pressure. Losing is not a thing; the worst case is "slower progress."
2. **Set-and-forget, ~5-minute sessions.** A session is: review network → adjust lines & routes
   → set it running → leave. The game plays itself while you're gone (offline progress).
3. **Planning is the fun.** The joy is in *thoughtful route/line planning and small
   optimizations*, not twitch reactions or grinding taps. Reward clever setups.
4. **Always rewarding to return.** Coming back should feel good — earnings accrued, gentle
   progress made, something small to tend to. Never a wall of chores or anxiety.
5. **Lean, not bloated.** Keep the Pocket-Trains-style minimal scope (see §8 MVP). Add depth only
   if it deepens *planning satisfaction* without adding stress or busywork.
6. **Mobile-web first, one-handed, glanceable.** Works beautifully in a phone browser.

**Explicitly NOT the goal:** the heavy, always-on complexity of *Rail Nation* (competitive MMO,
markets, multi-week eras) or *TrainStation* (production chains, hundreds of collectibles, live-op
treadmills). Those demand constant attention and backends — the opposite of cozy. We borrow
Pocket Trains' lean loop and dial *down* pressure, *up* coziness.

**Implications of the cozy pillar (tune the reference mechanics accordingly):**
- Soften or reframe stressful systems: **breakdowns/repairs** become gentle "maintenance," not
  punishment; **fuel** is a planning input, not an anxiety timer (consider making it optional/light).
- Favor a **quick, satisfying manual dispatch loop**: when you check in, trains have arrived,
  you collect, pick the cargo jobs you want, load, and send them off again — the planning and
  job-selection *is* the fun. (Decided core loop: **manual dispatch per trip**, see §11.)
- Offline/idle progress is **core**, not a bonus — the network earns while you're away.
- Monetization (if any) stays purely convenience/cosmetic and never creates pressure (see §5).

---

## 1. Reference Game Overview

**Pocket Trains** is a free-to-play railroad management / tycoon simulation by NimbleBit
(the studio behind *Tiny Tower* and *Pocket Planes*). The player builds and runs a railway
empire: connecting cities with track, dispatching trains, hauling cargo and passengers for
profit, and gradually expanding across real-world regions.

- **Genre:** Idle / management / time-management / tycoon sim with light strategy and collecting.
- **Session style:** Designed for short, frequent sessions ("snackable"). Real-time jobs
  run for minutes to hours, so players check in, dispatch, collect, and leave.
- **Tone:** Charming, pixel-art, lighthearted.
- **Core loop hook:** Optimize routes → earn currency → expand network & collect rarer trains.

---

## 2. Core Gameplay Loop

```
Pick up jobs at a city  →  Load cargo onto a train  →  Dispatch along the track
        →  Train travels in real time  →  Arrive & deliver  →  Earn Coins / Bux / Crates
        →  Reinvest: lay new track, unlock cities, buy/upgrade/build trains
        →  Repeat at larger scale across new regions
```

The compulsion loop blends:
1. **Logistics puzzle** — which cargo on which train to which city for max payout.
2. **Resource management** — coins, premium currency, fuel, train capacity.
3. **Collection** — assembling and upgrading a roster of trains from parts.
4. **Time management** — staggering real-time journeys, repairs, and refuels.

---

## 3. Feature & System Breakdown

### 3.1 Map, Cities & Track
- A world map divided into **regions** (reference game: Europe, USA, Asia/Japan, etc.).
- **Cities** are nodes on the map. The player starts with a few connected cities.
- **Track** must be built between adjacent cities, costing **coins** (longer/harder
  connections cost more; cross-water or cross-region links cost premium currency).
- **Unlocking cities** expands reachable jobs and revenue. Costs scale with distance/remoteness.
- **Regions** are unlocked with premium currency; special "world" trains can cross regions
  via expensive bridges/tunnels.

### 3.2 Trains (Engines)
- Trains have stats: **speed**, **fuel capacity / efficiency**, and **number of cars** (cargo slots).
- Train **classes** (reference): **Steam**, **Diesel**, **Electric**, plus **Event/Legacy** trains.
- Train **rarities**: Common, Rare, Limited, Special/Legendary — rarer = better stats and scarcer parts.
- Trains can be **upgraded** to improve speed, capacity, or fuel.
- Players manage a **roster/yard** of multiple trains running in parallel.

### 3.3 Jobs & Cargo
- Cities continuously offer **jobs**: deliver a piece of **cargo** (passengers or freight)
  to a specific destination city.
- Each job shows: cargo type, destination, and reward (coins, sometimes **Bux**, or a **crate**).
- Reward scales with **distance** and **cargo rarity**.
- Cargo occupies a car slot; player chooses which jobs to load given limited capacity and route.
- **Bux jobs** (green) reward premium currency — high value, prioritized by players.
- **Crate jobs** reward loot crates containing train parts.

### 3.4 Routing & Layovers
- A delivery may require multiple hops across the network.
- **Layover** mechanic: drop cargo at an intermediate city to be picked up later by another
  train heading toward the final destination — enables multi-stage and cross-region logistics.
- Encourages building a coordinated network rather than isolated point-to-point runs.

### 3.5 Fuel, Repairs & Real-Time
- Trains consume **fuel** per journey; refuel over real time for free or instantly with Bux.
- Trains can randomly **break down** and need a real-time repair wait (or instant Bux fix).
- Journeys take **real-world minutes to hours**, driving the check-in cadence.

### 3.6 Crates, Parts & Building Trains
- **Crates** (loot boxes) drop from crate-jobs, events, and daily rewards, or are bought with Bux.
- Crates come in tiers (Common / Rare / Limited) and must be **unlocked** (timer, key, or Bux).
- Opening a crate yields a random **train part**.
- Collect **3 matching parts** → **build** that train (no extra cost beyond the parts).
- **Legacy trains**: retired/limited trains re-offered through special events/crates.

### 3.7 Events & Leagues
- **Seasonal events** (Halloween, Christmas, etc.): unique cargo, challenges, and exclusive
  train/car/crate rewards for hitting goals.
- **Leagues / competitive brackets** (Local → Regional → National → World): players are ranked
  by performance; higher leagues unlock better event rewards and more lucrative jobs.

### 3.8 Progression & Meta
- **Leveling / city expansion** grants Bux and unlocks.
- **Achievements** grant Bux.
- Long-term goals: complete every region, collect all trains, top the leagues.

---

## 4. Currencies & Economy

| Currency | Type | Earned by | Spent on |
|---|---|---|---|
| **Coins** | Soft (gameplay) | Completing jobs | Building track, unlocking nearby cities, basic upgrades |
| **Bux** | Hard (premium) | Bux jobs, watching ads, events, level-ups, achievements, **IAP** | Speed-ups, opening crates, unlocking regions, premium upgrades, instant refuel/repair |

**Economy design notes:**
- Soft currency flows steadily; hard currency is scarce and gates convenience + premium content.
- The economy is a **soft paywall**: everything is *achievable* free, but slow. Money buys time.

---

## 5. Monetization Model

The reference game is **free-to-play with optional in-app purchases**, centered on convenience
rather than hard content-gating ("not pay-to-win, but pay-to-skip-the-grind").

1. **Premium currency IAP** — buy **Bux** in tiered bundles (e.g., small/medium/large/mega)
   with bulk-discount pricing. This is the primary revenue driver.
2. **Time skips / convenience** — spend Bux to: instantly refuel, instantly repair,
   instantly finish/unlock crates, speed up jobs.
3. **Loot crates** — randomized train parts create a collection chase; crates can be bought
   or opened faster with Bux.
4. **Region / expansion unlocks** — premium currency unlocks new regions and cross-region links.
5. **Rewarded ads (optional)** — players *choose* to watch ads for free Bux or boosts.
   No forced/interstitial ads interrupting play.
6. **Seasonal/event monetization** — limited-time trains and crates spur event-driven spending.

**Ethical/UX guardrails the reference game follows (worth keeping):**
- Fully playable and enjoyable for non-payers.
- No mandatory ads.
- Convenience over coercion; respect the player's time.

---

## 6. UX / Presentation Principles
- **Pixel-art / clean stylized** visuals, readable at small sizes.
- **One-handed, touch-first** interactions: tap a city, drag cargo to cars, tap dispatch.
- **Map-centric** main screen with clear job indicators and train positions.
- **Glanceable state**: timers, ready-to-collect badges, idle trains surfaced immediately.
- **Short sessions**: everything important reachable in 1–2 taps from the map.
- **Push/local notifications** when a train arrives or fuel/repair completes (re-engagement).

---

## 7. Implications for Our Browser Build

Target: **browser game that works great on mobile web** (responsive, touch-first, offline-tolerant).

### 7.1 Decided Tech Stack (committed)

> **MVP stack: TypeScript + React + SVG/Canvas, shipped as a PWA.** Chosen for the largest
> ecosystem/community and safest long-term support. TypeScript also maps closely to C#
> (types, classes, generics, `async/await`), aiding maintainability.

- **Language:** **TypeScript** (strict mode). All game logic strongly typed.
- **UI framework:** **React** (function components + hooks).
- **Map/world rendering:** pixel-art art direction (see §10) favors **Canvas + sprite sheets**
  with integer scaling (`image-rendering: pixelated`) for crisp pixels; **SVG/DOM** is fine for
  HUD/menus/overlays. No heavy game engine for the MVP — add **PixiJS** later only if visuals
  demand it (PixiJS also handles pixel-perfect sprite rendering well if we outgrow raw Canvas).
- **Build tool:** **Vite** (fast dev server, simple PWA plugin).
- **State management:** a single authoritative, serializable game-state store (e.g. **Zustand**
  or React context + reducer) driven by a tick/update loop; persisted on change.
- **Styling:** lightweight, mobile-first CSS (CSS Modules or a small utility approach); cozy
  visual theme.
- **PWA:** installable, offline-capable shell (`vite-plugin-pwa` / service worker).
- **Persistence:** `localStorage` for MVP saves → migrate to **IndexedDB** as state grows;
  optional backend account sync later.
- **Testing:** **Vitest** for game-logic units (economy, offline-progress math, routing).

### 7.2 Other technical considerations
- **Real-time mechanics in a web context:** persist timestamps (job start/end, route ticks)
  so progress continues while the tab is closed; compute elapsed time on load ("offline progress").
- **State management:** authoritative game state with a tick/update loop; serialize on change.
- **Notifications:** Web Push / Notifications API (where supported) for arrival/return alerts.
- **Performance:** lightweight assets, sprite atlases, capped frame work for low-end phones.
- **Monetization adaptation for web:** since native IAP isn't available, consider web payment
  (Stripe) for premium currency, and/or rewarded video via a web ad SDK — all **optional** and
  designed as convenience, mirroring the soft-paywall ethic above. (Keep integrations
  mock/plug-ready until real credentials exist.)

### Original-content checklist (avoid IP infringement)
- Our **own game name**, logo, and art style (no NimbleBit assets, no "Pocket Trains" branding).
- Our **own train names/designs** and currency names (not "Bux").
- Our **own city/region naming** (real-world geography is fine as factual data).
- Mechanics and genre conventions are not copyrightable — reimplement, don't copy assets/text.

---

## 8. Minimum Viable Product (MVP) Scope

A first playable slice should embody the **cozy, set-and-forget** vision (§0):
1. A single calm region map with ~6–10 cities and buildable track.
2. One or two gentle starter trains with cars and speed (fuel kept light/optional).
3. Job generation at cities (cargo + destination + coin reward).
4. **Manual dispatch loop:** the player picks available cargo jobs at a city, loads them onto a
   train (limited car slots), chooses a destination, and dispatches. The train travels in real
   time; when it arrives the player collects payment and dispatches again. Planning *which*
   jobs on *which* train to *which* city is the core fun.
5. Real-time travel with **offline progress** so the network earns while the player is away.
6. Spend coins to build track / unlock a new city (cozy progression, no fail states).
7. Local save with offline-progress calculation.
8. Responsive, touch-first UI; runs well on a phone browser; a satisfying "welcome back,
   here's what you earned" moment on return.

**Phase 2+:** premium currency, crates/parts/train-building, light maintenance, regions,
gentle events, notifications, PWA, optional convenience monetization.

---

## 9. Open Questions to Resolve Before Building

**Resolved:**
- ✅ **Game title:** **Cozy Cargo Co.** (see §11).
- ✅ **Tech stack:** TypeScript + React + SVG/Canvas, PWA, Vite build (see §7.1).
- ✅ **Art & world:** cartoon pixel-art, cozy invented world (see §10).
- ✅ **Core loop:** manual dispatch per trip (see §11).
- ✅ **Persistence:** local-only first (see §11).
- ✅ **Monetization:** none in MVP, plug-ready later (see §11).

All MVP-blocking questions are resolved. Remaining items are later-phase (cloud sync,
real monetization, additional regions/events).

---

## 10. Art Direction & World (decided)

- **Visual style:** **cartoon pixel-art** — nostalgic, warm, cozy charm (Pocket Trains-like).
  Crisp integer-scaled sprites (`image-rendering: pixelated`); cohesive soft, friendly palette.
- **World/setting:** a **cozy invented world** — fictional towns dotted across a charming
  island/continent. Full creative freedom; no real geography, no IP or geo concerns.
- **Mood:** calm, friendly, unhurried — soft colors, gentle day feel; pixel trains with
  personality. Visuals reinforce the cozy, low-pressure pillar (§0).
- **Naming:** all town names, train names, and currency names are original and on-theme.

---

## 11. Decisions Log (running)

Concrete, committed decisions as we define them (newest context wins; supersedes general
reference text above where they conflict):

- **Game title:** **Cozy Cargo Co.** — the official name of the game (use across the app,
  PWA manifest, page title, and store/marketing copy).
- **Core loop:** **manual dispatch per trip** — at a city the player selects available cargo
  jobs, loads them onto a train's car slots, picks a destination, and dispatches. Real-time
  travel; on arrival the player collects coins and dispatches again. Matches the "come back and
  do it all again" cozy session.
- **Art assets:** start with **free/open-source pixel-art packs** (Kenney.nl, itch.io CC0, etc.)
  as placeholders for the MVP; polish/replace with custom art later. Track asset licenses.
- **Audio:** **light SFX only** for the MVP (UI clicks, train chime/whistle, coin-collect).
  Background music deferred to a later phase. **Implementation:** synthesised **procedurally with the
  Web Audio API** (no audio files / no licensing), matching our procedural canvas art; gentle, with a
  persisted mute toggle.
- **Persistence:** **local-only first** — game state saved in the browser (no accounts/server).
  Fully playable offline. Cloud account sync deferred to a later phase.
- **Monetization:** **none in the MVP** (gameplay-first). Design the economy/state so optional
  *convenience* monetization (premium currency, rewarded ads, web payments) can plug in later
  without rework. Keep any future integration mock/plug-ready until real credentials exist.
- **MVP content scale:** ~**8 towns**, **2–3 trains**, **1 currency (coins)**, **4–6 cargo types**.
- **Hosting/deploy:** **static hosting** (Netlify / Vercel / GitHub Pages) — free & simple,
  ideal for a local-only PWA. **Implementation:** **GitHub Pages** via a GitHub Actions workflow
  (`.github/workflows/deploy.yml`) that builds + tests on every push to `main`; production build uses
  `BASE_PATH=/CozyCargoCo/`. (Repo owner must enable Pages → source "GitHub Actions" once.)
- **Target devices/browsers:** **desktop and mobile equally**; modern evergreen browsers
  (latest Chrome, Safari/iOS, Firefox, Edge). Responsive + touch-friendly *and* mouse-friendly.
- **Visual overhaul (post-MVP, committed):** after the logic MVP, the look gets a major upgrade to
  **pixel-art retro** — chunky 16-bit sprites, a **tile-based world** (grass/water/forest tiles),
  nostalgic charm. Approach: keep the **pure-canvas procedural** renderer (no asset licensing) but
  render to a **low-res offscreen buffer that is integer-scaled up** with image smoothing **off** for
  crisp pixels. Sprites are defined as in-repo pixel bitmaps (rows of palette keys) — locomotive
  (faces travel direction) + cargo cars, station depots, trees/decorations. Add **juice**: chimney
  smoke puffs while en route, a coin "+$" pop on delivery, a sparkle on town unlock. UI chrome goes
  retro too (pixel display font for HUD/titles/buttons via the OFL-licensed **Press Start 2P**;
  chunky bordered panels). The two things the user explicitly likes are preserved: **town-to-town
  connection lines** and **the train visibly travelling** to its dispatched destination.
- **HD glow-up + train systems (M12, committed — supersedes the pixel-art direction above):** the
  user found the 16-bit pixel reskin too chunky and asked for a **smooth HD illustrated look**
  (PS2-era: gradients, soft shading, lighting, drop shadows, anti-aliasing). The renderer now draws
  at **full resolution with `imageSmoothingEnabled = true`** (no low-res buffer / integer scaling):
  grass gradient + hills/ponds/trees + vignette background, rounded station buildings, soft
  roadbed/rails/sleepers track, gradient locomotive + tinted cargo cars + radial smoke, name pills,
  job bubbles, selection glow, coin pops, unlock sparkles. The bundled **Press Start 2P** font is
  dropped — UI chrome uses a rounded **system font stack**. **UX restructure:** the map fills the
  whole viewport with a **floating top HUD** (coins/mute/reset) and a **bottom menu bar** with three
  buttons — **Jobs** (opens the selected-town dispatch sheet; tapping a town also opens it),
  **Station** (placeholder for now), and **Train** (per-train stats sheet). Popups use a reusable
  bottom-`Sheet` wrapper. **Train systems added:** each train has **fuel** (regenerates **+1
  unit/sec** passively via timestamp math so it refuels offline too; **Fill = flat 100 coins** →
  full; sheet shows live **time-to-full**), **damage %** (**Repair cost = ceil(value × 0.20 ×
  damage%/100)** → 0%), and **cargo / fuel-cart** stats (`fuelCarts` / `fuelCartSlots`). Dispatch
  **burns fuel by distance and adds small wear** so both systems are alive, but does **not block
  dispatch yet** (further gating rules to come). Tunable constants live in `src/game/engine/trains.ts`.
  `SAVE_VERSION` bumped **1 → 2** (legacy saves lacking fuel fields are discarded → fresh game). The
  two things the user likes — town connection lines + visibly travelling trains — are still preserved.
- **Bigger map + selectable lines (M13, committed):** the world grows from 8 to **12 towns**, spaced
  further apart so the **four opening lines all have clearly different lengths** (≈311 / 397 / 466 /
  522 units). Because dispatch already burns fuel by distance, **longer lines cost more fuel** — now
  visible and meaningful. New towns: Willowmere, Thornbury, Hazelmere, Pinecrest (locked, unlocked
  via the existing growth flow). **Lines are now selectable:** tapping a track segment on the map (or
  a row in the new sheet) highlights it with a glowing golden overlay. A **fourth bottom-menu button,
  "Lines" (🛤️)**, opens a sheet listing every segment — sorted longest-first — with its **length
  (units), fuel burned per trip (`round(lengthUnits × FUEL_PER_UNIT)`), and fastest-train travel-time
  estimate**. Renderer adds `pickSegment` + `segKey` + a selected-segment highlight; `drawMap` gains a
  `selectedSegId` arg. No engine/economy changes — purely content + UI/render.

---

## 12. MVP Definition of Done (acceptance criteria)

The MVP is "done" when **all** of the following hold:

1. **Playable end-to-end core loop:** at a town the player can pick available cargo jobs, load
   them onto a train (respecting car-slot capacity), choose a destination, and dispatch; the
   train travels in real time; on arrival the player collects coins; loop repeats.
2. **Network growth:** the player can spend coins to build track / unlock a new town.
3. **Content present:** ~8 towns, 2–3 trains, 4–6 cargo types, coins as the only currency.
4. **Persistence & offline progress:** state saves locally and correctly resumes after the tab
   is closed/reopened; in-transit trains advance/complete based on real elapsed time.
5. **Responsive UX:** works well and is comfortably usable on both phone (touch) and desktop (mouse).
6. **Installable PWA:** meets installability criteria; offline-capable shell.
7. **Audio:** light SFX wired (clicks, train chime, coin collect).
8. **Tested:** Vitest unit tests cover the economy (job payouts) and offline-progress math.
9. **Stable:** no crashes or console errors during the core loop.

---

## 13. Proposed Architecture & Data Model (engineering)

> Initial shape for the agent to implement; refine during build. TypeScript strict throughout.

**High-level structure**
- `src/game/` — framework-agnostic **game logic & state** (pure TS, fully unit-testable):
  - `model/` — types: `Town`, `TrackSegment`, `Train`, `CargoJob`, `GameState`.
  - `engine/` — `tick(state, nowMs)` advancing trips by elapsed time; `dispatch()`, `collect()`,
    `buildTrack()`, `unlockTown()`, job generation, payout/economy formulas.
  - `save/` — serialize/deserialize `GameState` (versioned schema), `localStorage` adapter
    (abstracted so IndexedDB/cloud can swap in later), offline-progress reconciliation on load.
- `src/ui/` — **React** components: map view (Canvas/sprites), HUD (coins), town panel
  (job list + train loadout), train roster, dispatch flow, "welcome back" summary.
- `src/render/` — pixel-art Canvas rendering of the map (towns, track, moving trains), integer
  scaling; sprite-sheet loading; abstracted so it can move to PixiJS later.
- `src/audio/` — tiny SFX manager (preloaded, respects mute).
- `src/assets/` — placeholder CC0 pixel-art sprites + license attributions.

**Core model sketch (illustrative)**
```ts
type TownId = string;
interface Town { id: TownId; name: string; x: number; y: number; unlocked: boolean; jobs: CargoJob[]; }
interface TrackSegment { a: TownId; b: TownId; lengthKm: number; }
interface CargoJob { id: string; kind: CargoKind; destination: TownId; payout: number; }
interface Train {
  id: string; name: string; type: 'steam'|'diesel'|'electric';
  speed: number; carSlots: number; cars: CargoJob[];
  location: TownId | { from: TownId; to: TownId; departAtMs: number; arriveAtMs: number };
}
interface GameState {
  version: number; coins: number; towns: Town[]; track: TrackSegment[];
  trains: Train[]; lastSeenMs: number;
}
```

**Key technical rules**
- **Time is timestamp-based**, never frame-count-based: store `departAtMs`/`arriveAtMs`; compute
  arrivals from `Date.now()` so closing the tab never loses or fabricates progress.
- **Offline reconciliation on load:** replay elapsed time to settle arrivals before first render;
  show a "welcome back" summary of what arrived/earned.
- **Pure, deterministic engine** functions → easy Vitest coverage (economy + offline math).
- **No real money / network calls** in MVP; economy designed to accept a premium layer later.

---

## 14. Build Plan / Milestones

1. **Scaffold:** Vite + React + TS (strict), ESLint/Prettier, Vitest, PWA plugin; repo structure (§13).
2. **Game model & engine:** types, job generation, dispatch/travel/collect, economy formulas + unit tests.
3. **Save system:** versioned serialize + `localStorage` + offline-progress reconciliation + tests.
4. **Map rendering:** Canvas pixel-art towns/track/trains with integer scaling; placeholder CC0 assets.
5. **Core UI:** HUD, town panel (jobs + loadout), dispatch flow, train roster, "welcome back" summary.
6. **Network growth:** build track / unlock town with coins.
7. **Audio:** wire light SFX.
8. **Polish & responsive pass:** phone + desktop, touch + mouse; PWA install; perf check.
9. **QA against §12 Definition of Done;** fix; ship to static hosting.
10. **Visual Overhaul (M11 · post-MVP):** pixel-art retro reskin — pixel rendering foundation
    (offscreen low-res buffer, integer scaling, smoothing off, sprite system), tile-based world,
    pixel track/rails, animated direction-facing locomotive + smoke, juice (coin pop / unlock
    sparkle), retro UI chrome. Logic engine untouched; all changes in `render/` + UI/CSS.
11. **HD Glow-up + Train Systems (M12 · post-MVP):** replace the chunky pixel reskin with a **smooth
    HD illustrated** renderer (full-res, `imageSmoothingEnabled`, gradients/soft shading/shadows/
    vignette; no offscreen buffer). Restructure UX to a **full-screen map + bottom menu** (Jobs /
    Station / Train sheets) with a floating HUD. Add **train systems**: fuel (passive +1/sec regen +
    100-coin fill), damage % + paid repair, cargo/fuel-cart stats; dispatch burns fuel + adds wear
    (not gating yet). New `engine/trains.ts` (pure); `SAVE_VERSION → 2`. Drops the Press Start 2P
    font for a system stack. Engine stays pure/timestamp-driven; the user's liked features preserved.
12. **Bigger Map + Selectable Lines (M13 · post-MVP):** grow the world to **12 towns** spread further
    apart so the opening lines have **clearly different lengths** (longer line ⇒ more fuel, which the
    economy already models). Make track segments **selectable** (tap a line on the map → golden
    highlight) and add a **"Lines" bottom-menu button** opening a sheet that lists every segment with
    its length, per-trip fuel cost and fastest travel-time estimate. Content + UI/render only
    (`pickSegment`/`segKey`/highlight in `render/map.ts`, `LinesSheet`); no engine changes.

---

## 15. Progress Tracking — Kanban Board (STRICTLY REQUIRED)

A simple, **view-only** kanban board is the canonical way the user tracks build progress.

- **Files:** `Kanban/index.html` (the board page) + `Kanban/tasks.js` (all MVP tasks as data).
- **`tasks.js`** holds every task required to complete the MVP (derived from §12 & §14), each
  with: `id`, `title`, `description`, `milestone`, `status`
  (`backlog` | `todo` | `in-progress` | `done`), **`etaMinutes`** (estimated effort), and
  **`startedAt`** (ISO timestamp, set when work begins; `null` otherwise).
- **ETA & live time-left:** every task carries an **ETA**. When a task is `in-progress`, the
  board shows a **live countdown of how much time is left** (computed from
  `startedAt + etaMinutes` vs. now, updating each second; shows "overdue" if it runs past ETA).
  Set `startedAt` when moving a task to `in-progress` so the countdown is accurate.
- **The board is view-only:** the user only needs to *see* progress. **No** add/edit/move/drag
  features — it just renders `tasks.js` into columns (Backlog · To Do · In Progress · Done).
- **STRICT RULE:** **every step/task that is started or completed MUST be reflected in
  `Kanban/tasks.js` in real time** — set a task to `in-progress` (and stamp `startedAt`) when
  work begins, and `done` when finished, *before* moving on. Keeping the board current is a
  non-negotiable part of the workflow, not an afterthought.
- The page auto-refreshes **every 20 seconds** so the user sees status changes and live countdowns without manual reloads.

---

## 16. Version Control & Delivery (REQUIRED)

- **Remote:** `origin` → `https://github.com/LucasGasbarro/CozyCargoCo.git` (branch `main`).
- **Commit + push on every completed milestone:** whenever a milestone (M1…M10 in §14/§15) is
  fully reached, **stage the touched files, commit with a clear message, and push to `origin`**.
  This is the agreed cadence — milestone-level, not per-tiny-edit.
- Suggested message style: `M1: scaffold Vite + React + TS PWA` (include milestone id + summary).
- Keep `node_modules/`, `dist/` out of commits (already in `.gitignore`).
- Include the standard `Co-authored-by: Copilot` trailer on commits.

---

*Source basis: public descriptions of NimbleBit's Pocket Trains gameplay, economy, and
monetization. This document is a design reference for building an original game in the same
genre — not a clone spec.*
