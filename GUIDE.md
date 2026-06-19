# 🛠️ Cozy Cargo Co. — Configuration & Modding Guide

This guide shows how to tweak and extend the game: add towns, trains, cargo types, sound effects,
and tune the economy. Almost everything that defines the *content* of the game lives in a handful of
small, plain-data files — you rarely need to touch the React UI.

After any change: run `npm run test:run` (logic stays correct) and `npm run build` (types stay
sound), then `npm run dev` to play it.

> 💡 **Save compatibility:** the running game is saved to `localStorage` under the key
> `cozy-cargo-co/save`. If you change content (towns, trains, cargo) the old save may no longer
> match. During development, just hit the **↺ reset** button in the top bar (or clear site data) to
> start a fresh game. For shipped changes that alter the save *shape*, bump `SAVE_VERSION` — see
> [Changing the save format](#changing-the-save-format).

---

## 🏘️ Add or edit a town

**File:** `src/game/content/world.ts`

Towns are listed in `TOWN_SEEDS`. Each seed is just data:

```ts
const TOWN_SEEDS: TownSeed[] = [
  { id: 'ashford', name: 'Ashford', x: 200, y: 500, unlocked: true },
  // …
  { id: 'gull', name: 'Gull Harbour', x: 980, y: 470, unlocked: false },
]
```

| Field      | Meaning                                                                          |
| ---------- | -------------------------------------------------------------------------------- |
| `id`       | Unique slug (lowercase, no spaces). Used everywhere to reference the town.        |
| `name`     | Display name shown on the map and in panels.                                      |
| `x`, `y`   | Position in **world units** (~0–1000). The camera auto-fits all towns on screen.  |
| `unlocked` | `true` = playable from the start; `false` = the player pays coins to unlock it.   |

**To add a town**, append a new seed with a fresh `id`. That's it — the map camera re-fits
automatically, and a locked town becomes unlockable once any unlocked town is nearby (track is laid
automatically on unlock; see [Network growth](#tune-network-growth-unlock-costs)).

**To start it already connected**, also add a track segment in `STARTER_TRACK`:

```ts
const STARTER_TRACK: [TownId, TownId][] = [
  ['ashford', 'brook'],
  ['ashford', 'cedar'],
  // add your new connection:
  ['gull', 'elder'],
]
```

Track length (and therefore travel time + payout) is derived automatically from the two towns'
coordinates, so you only list the pair of ids.

> Towns that start `unlocked: true` are auto-seeded with jobs on a new game; locked towns get jobs
> when unlocked.

---

## 🚂 Add or edit a train

**File:** `src/game/content/world.ts`

Trains live in `TRAIN_SEEDS`:

```ts
const TRAIN_SEEDS: TrainSeed[] = [
  {
    id: 'puffer',
    name: 'Little Puffer',
    kind: 'steam',
    speedUnitsPerMs: 0.0016,
    carSlots: 2,
    startTown: 'ashford',
  },
  // add another:
  {
    id: 'sparky',
    name: 'Sparky',
    kind: 'electric',
    speedUnitsPerMs: 0.003,
    carSlots: 4,
    startTown: 'brook',
  },
]
```

| Field             | Meaning                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| `id`              | Unique slug.                                                                   |
| `name`            | Display name.                                                                  |
| `kind`            | `'steam' \| 'diesel' \| 'electric'` — only affects its colour on the map.      |
| `speedUnitsPerMs` | World units travelled per millisecond. Higher = faster trips. (See pacing.)    |
| `carSlots`        | How many cargo jobs it can carry at once.                                      |
| `startTown`       | `id` of the town it's parked at when a new game begins (must be `unlocked`).   |

**Pacing reference:** towns sit ~250 world units apart. `travelTimeMs = lengthUnits / speedUnitsPerMs`,
so `0.0016` ≈ a ~2.5-minute hop; `0.0024` ≈ ~1.7 min. Pick a speed for the feel you want.

**Train colours** (the little loco rectangle) are mapped by `kind` in `src/render/map.ts`:

```ts
const TRAIN_COLORS: Record<Train['kind'], string> = {
  steam: '#b5651d',
  diesel: '#2f6f7e',
  electric: '#6a4c93',
}
```

To add a brand-new locomotive *kind*, add it to the `TrainKind` union in
`src/game/model/types.ts`, then add a matching colour here.

---

## 📦 Add or edit a cargo type

Cargo lives in three places — update all three:

1. **The type + relative value** — `src/game/model/types.ts`

   ```ts
   export type CargoKind = 'passengers' | 'mail' | 'produce' | 'timber' | 'machinery' | 'livestock'

   export const CARGO_VALUE: Record<CargoKind, number> = {
     passengers: 1.0,
     mail: 1.1,
     produce: 1.2,
     livestock: 1.4,
     timber: 1.6,
     machinery: 2.0,
     // flowers: 1.3,   // ← add here
   }
   ```

   `CARGO_VALUE` is a payout multiplier: higher = more coins per delivery.

2. **The display label** — `src/game/content/world.ts`

   ```ts
   export const CARGO_LABEL: Record<CargoKind, string> = {
     passengers: 'Passengers',
     // …
     // flowers: 'Flowers',   // ← add here
   }
   ```

Because `CARGO_VALUE` and `CARGO_LABEL` are typed as `Record<CargoKind, …>`, TypeScript will **fail
the build** if you add a kind to the union but forget a value or label — a helpful safety net. Job
generation automatically picks from all cargo kinds, so new types appear in-game with no further
wiring.

---

## 💰 Tune the economy & pacing

**File:** `src/game/engine/economy.ts`

```ts
export const PAYOUT_BASE = 5        // flat coins per delivery
export const PAYOUT_PER_UNIT = 0.5  // coins per world-unit of distance (before cargo multiplier)

// payout = round(PAYOUT_BASE + lengthUnits * PAYOUT_PER_UNIT * CARGO_VALUE[kind])
// travelTimeMs = lengthUnits / speedUnitsPerMs
```

- Want **richer** deliveries? Raise `PAYOUT_BASE` / `PAYOUT_PER_UNIT` or a cargo's `CARGO_VALUE`.
- Want **faster/slower** trips globally? Adjust train `speedUnitsPerMs` (per-train) — distance comes
  from town coordinates.

**Starting coins** — `src/game/content/world.ts`:

```ts
export const STARTING_COINS = 75
```

**How many jobs a town offers:**

- New-game / per-visit generation — `src/game/engine/jobs.ts`:
  ```ts
  export function jobsToOffer(rng: Rng): number {
    return randInt(rng, 2, 4) // cozy small numbers
  }
  ```
- Ongoing top-up target (the loop refills towns up to this many) — `src/game/engine/replenish.ts`:
  ```ts
  export const JOBS_TARGET = 3
  ```

---

## 🌱 Tune network growth (unlock costs)

**File:** `src/game/engine/growth.ts`

Unlocking a town automatically lays track to the nearest already-unlocked town; the cost scales with
that distance:

```ts
export const UNLOCK_BASE = 30       // flat cost to unlock any town
export const UNLOCK_PER_UNIT = 0.25 // extra coins per world-unit of new track

// unlockCost(lengthUnits) = round(UNLOCK_BASE + lengthUnits * UNLOCK_PER_UNIT)
```

Raise these to make expansion feel more earned; lower them for a breezier pace.

---

## 🎨 Change the look (map art)

**File:** `src/render/map.ts` — `drawMap()` paints the whole scene on a 2D canvas (no image assets).

- **Background:** the `sky` gradient at the top of `drawMap`.
- **Track:** the `ctx.strokeStyle` / `lineWidth` in the track loop (rail + sleeper dashes).
- **Towns:** the town loop draws the circle, little red roof, name label and job count. Tweak radius
  `r`, fill colours (`#e9b44c` unlocked / `#b9b9b9` locked), and fonts here.
- **Trains:** the train loop draws a rounded rectangle tinted by `TRAIN_COLORS` plus white cargo pips.

**UI styling** (panels, buttons, colours) lives in `src/App.css`, driven by CSS variables at the top
of `src/index.css` (`--cozy-cream`, `--cozy-green`, `--cozy-amber`, …). Change those to re-theme the
whole interface in one place.

---

## 🔊 Add sound effects (planned — Milestone M8)

The `src/audio/` folder is reserved for a tiny SFX manager. Audio is intentionally **light** (a few
gentle cues — a click, a delivery chime, a coin sound) and **off by default-respectful** (a mute
toggle). When wiring it up, follow this pattern:

1. **Drop audio files** in `public/sfx/` (e.g. `click.mp3`, `chime.mp3`, `coin.mp3`). Files in
   `public/` are served from the site root, so they're reachable as `/sfx/click.mp3`.

2. **Create a manager** at `src/audio/sfx.ts` that preloads the clips and respects a mute flag:

   ```ts
   const SOUNDS = {
     click: '/sfx/click.mp3',
     chime: '/sfx/chime.mp3',
     coin: '/sfx/coin.mp3',
   } as const
   export type SoundName = keyof typeof SOUNDS

   const cache = new Map<SoundName, HTMLAudioElement>()
   let muted = false

   export function setMuted(value: boolean): void {
     muted = value
   }

   export function play(name: SoundName): void {
     if (muted) return
     let el = cache.get(name)
     if (!el) {
       el = new Audio(SOUNDS[name])
       cache.set(name, el)
     }
     el.currentTime = 0
     void el.play().catch(() => undefined) // ignore autoplay rejections
   }
   ```

3. **Trigger sounds from the UI**, e.g. `play('coin')` when an arrival pays out (in `WelcomeBack` or
   the tick handler), `play('click')` on dispatch in `TownPanel.tsx`.

4. **Record licenses:** if you use third-party clips, note their source/license in a
   `public/sfx/CREDITS.md`. Prefer CC0 / public-domain sound packs to keep attribution simple.

> Keep it subtle — the game's whole vibe is *cozy and low-pressure*. A couple of soft cues go a long
> way; avoid loops or anything that nags.

---

## 🧩 Add a new player action (advanced)

The data flow is: **pure engine function → store action → UI button.**

1. **Engine** (`src/game/engine/…`): write a pure function `(state, …args) => GameState` (or a
   `{ ok, reason, state }` result for actions that can fail). Add a unit test next to it. Export it
   from `src/game/engine/index.ts`.
2. **Store** (`src/ui/store.tsx`): add a `useCallback` that calls your engine function inside
   `setState`, returning an error string (or `null`) for the UI. Expose it on the `GameStore`
   interface and the `value` object.
3. **UI** (`src/ui/…`): call `useGame()` and wire your function to a button.

The store already runs a **1-second tick loop** (settle arrivals → replenish jobs → autosave) and a
separate **requestAnimationFrame clock** (`useAnimationClock`) for smooth canvas motion — you don't
need to manage time yourself.

---

## 🗃️ Changing the save format

**File:** `src/game/model/types.ts`

If you change the **shape** of `GameState` (add/rename/remove fields), bump the version so old saves
are handled deliberately:

```ts
export const SAVE_VERSION = 1 // ← increment when GameState shape changes
```

Saving/loading goes through `src/game/save/serialize.ts` and the swappable `SaveStorage` adapter in
`src/game/save/storage.ts` (`localStorage` today; IndexedDB/cloud later). Corrupt or version-mismatch
saves load as `null`, which starts a fresh game — so worst case a player just gets a new world.

---

## ✅ Before you commit

```bash
npm run test:run   # all unit tests pass
npm run build      # type-check + production build succeed
npm run lint       # (optional) lint clean
```

Then update the kanban (`Kanban/tasks.js`) if your change maps to a tracked task, and commit. Happy
railroading! 🚂
