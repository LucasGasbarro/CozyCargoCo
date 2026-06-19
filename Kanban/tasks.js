/*
 * MVP task board data for the cozy train game.
 * VIEW-ONLY: this file is the single source of truth the kanban renders.
 *
 * STRICT WORKFLOW (see BasePrompt.md §15):
 *   - When you START a task: set status to 'in-progress' AND stamp startedAt (ISO string).
 *   - When you FINISH a task: set status to 'done' (leave startedAt as-is).
 *   - Keep this file updated in REAL TIME, before moving on to the next step.
 *
 * Task shape:
 *   { id, title, description, milestone, status, etaMinutes, startedAt }
 *   status: 'backlog' | 'todo' | 'in-progress' | 'done'
 *   etaMinutes: estimated effort in minutes
 *   startedAt: ISO timestamp set when work begins (null otherwise) -> drives live time-left
 */
window.KANBAN_META = {
  project: "Cozy Cargo Co. — MVP",
  updatedAt: "2026-06-19T17:50:00-03:00",
};

window.KANBAN_TASKS = [
  // ── M1 · Scaffold ─────────────────────────────────────────────
  { id: "scaffold-init", title: "Init Vite + React + TS", milestone: "M1 · Scaffold", status: "done", etaMinutes: 20, startedAt: "2026-06-19T11:45:11-03:00",
    description: "Create the project with Vite (React + TypeScript template), verify dev server runs." },
  { id: "scaffold-tooling", title: "ESLint + Prettier + strict TS", milestone: "M1 · Scaffold", status: "done", etaMinutes: 20, startedAt: null,
    description: "Enable TS strict mode, add ESLint + Prettier configs and scripts." },
  { id: "scaffold-vitest", title: "Set up Vitest", milestone: "M1 · Scaffold", status: "done", etaMinutes: 15, startedAt: null,
    description: "Add Vitest with a sample passing test and a `test` script." },
  { id: "scaffold-pwa", title: "PWA plugin + manifest + SW", milestone: "M1 · Scaffold", status: "done", etaMinutes: 30, startedAt: null,
    description: "Add vite-plugin-pwa, web manifest, icons, and an offline-capable service worker." },
  { id: "scaffold-structure", title: "Create repo folder structure", milestone: "M1 · Scaffold", status: "done", etaMinutes: 10, startedAt: null,
    description: "Set up src/game, src/ui, src/render, src/audio, src/assets per BasePrompt §13." },

  // ── M2 · Model & Engine ───────────────────────────────────────
  { id: "model-types", title: "Define core types", milestone: "M2 · Model & Engine", status: "done", etaMinutes: 30, startedAt: "2026-06-19T12:02:00-03:00",
    description: "Town, TrackSegment, Train, CargoJob, GameState (TS, strict) per §13." },
  { id: "engine-jobgen", title: "Cargo job generation", milestone: "M2 · Model & Engine", status: "done", etaMinutes: 40, startedAt: null,
    description: "Generate available cargo jobs at towns (kind, destination, payout)." },
  { id: "engine-dispatch", title: "dispatch() loading + send", milestone: "M2 · Model & Engine", status: "done", etaMinutes: 30, startedAt: null,
    description: "Load chosen jobs onto a train respecting car slots; depart toward a destination." },
  { id: "engine-tick", title: "tick() real-time travel", milestone: "M2 · Model & Engine", status: "done", etaMinutes: 45, startedAt: null,
    description: "Timestamp-based travel (departAtMs/arriveAtMs); advance/settle arrivals on tick." },
  { id: "engine-collect", title: "collect() payouts on arrival", milestone: "M2 · Model & Engine", status: "done", etaMinutes: 20, startedAt: null,
    description: "On arrival, award coins, free car slots, make train dispatchable again." },
  { id: "engine-economy", title: "Economy / payout formulas", milestone: "M2 · Model & Engine", status: "done", etaMinutes: 30, startedAt: null,
    description: "Payout scaling by distance and cargo type; tune for cozy pacing." },
  { id: "engine-tests", title: "Engine unit tests", milestone: "M2 · Model & Engine", status: "done", etaMinutes: 40, startedAt: null,
    description: "Vitest for economy payouts and travel/tick determinism." },

  // ── M3 · Save & Offline ───────────────────────────────────────
  { id: "save-serialize", title: "Versioned (de)serialize", milestone: "M3 · Save & Offline", status: "done", etaMinutes: 30, startedAt: "2026-06-19T12:10:00-03:00",
    description: "Serialize/deserialize GameState with a schema version for future migrations." },
  { id: "save-localstorage", title: "localStorage adapter", milestone: "M3 · Save & Offline", status: "done", etaMinutes: 20, startedAt: "2026-06-19T12:10:00-03:00",
    description: "Abstracted save adapter (localStorage now; IndexedDB/cloud later) + autosave." },
  { id: "save-offline", title: "Offline-progress reconciliation", milestone: "M3 · Save & Offline", status: "done", etaMinutes: 45, startedAt: "2026-06-19T12:10:00-03:00",
    description: "On load, replay elapsed real time so in-transit trains settle correctly." },
  { id: "save-tests", title: "Save & offline tests", milestone: "M3 · Save & Offline", status: "done", etaMinutes: 30, startedAt: "2026-06-19T12:10:00-03:00",
    description: "Vitest for round-trip save/load and offline reconciliation math." },

  // ── M4 · Map Rendering ────────────────────────────────────────
  { id: "render-canvas", title: "Canvas + integer scaling", milestone: "M4 · Map Rendering", status: "done", etaMinutes: 30, startedAt: "2026-06-19T12:28:00-03:00",
    description: "Canvas setup with pixel-perfect integer scaling (image-rendering: pixelated)." },
  { id: "assets-load", title: "Load CC0 sprites + attribution", milestone: "M4 · Map Rendering", status: "done", etaMinutes: 30, startedAt: "2026-06-19T12:28:00-03:00",
    description: "Source/import placeholder pixel-art packs; record licenses/attribution." },
  { id: "render-towns", title: "Render towns", milestone: "M4 · Map Rendering", status: "done", etaMinutes: 25, startedAt: "2026-06-19T12:28:00-03:00",
    description: "Draw town sprites at map coordinates; locked vs unlocked states." },
  { id: "render-track", title: "Render track", milestone: "M4 · Map Rendering", status: "done", etaMinutes: 25, startedAt: "2026-06-19T12:28:00-03:00",
    description: "Draw track segments between connected towns." },
  { id: "render-trains", title: "Render moving trains", milestone: "M4 · Map Rendering", status: "done", etaMinutes: 40, startedAt: "2026-06-19T12:28:00-03:00",
    description: "Interpolate train position along a segment using depart/arrive timestamps." },

  // ── M5 · Core UI ──────────────────────────────────────────────
  { id: "ui-hud", title: "HUD (coins)", milestone: "M5 · Core UI", status: "done", etaMinutes: 20, startedAt: "2026-06-19T12:28:00-03:00",
    description: "Persistent coin balance display." },
  { id: "ui-townpanel", title: "Town panel (jobs + loadout)", milestone: "M5 · Core UI", status: "done", etaMinutes: 60, startedAt: "2026-06-19T12:28:00-03:00",
    description: "Tap a town to see available jobs and load them onto a train's car slots." },
  { id: "ui-dispatch", title: "Dispatch flow", milestone: "M5 · Core UI", status: "done", etaMinutes: 40, startedAt: "2026-06-19T12:28:00-03:00",
    description: "Pick destination and send the train; show travel state." },
  { id: "ui-roster", title: "Train roster view", milestone: "M5 · Core UI", status: "done", etaMinutes: 30, startedAt: "2026-06-19T12:28:00-03:00",
    description: "List trains with status (idle/en route), capacity, and location." },
  { id: "ui-welcomeback", title: "Welcome-back summary", milestone: "M5 · Core UI", status: "done", etaMinutes: 30, startedAt: "2026-06-19T12:28:00-03:00",
    description: "On return, show what arrived and coins earned while away." },

  // ── M6 · Network Growth ───────────────────────────────────────
  { id: "grow-track", title: "Build track with coins", milestone: "M6 · Network Growth", status: "done", etaMinutes: 40, startedAt: "2026-06-19T12:30:00-03:00",
    description: "Spend coins to connect a new pair of towns; cost scales with distance. (Track is laid automatically when unlocking a town.)" },
  { id: "grow-unlock", title: "Unlock new town with coins", milestone: "M6 · Network Growth", status: "done", etaMinutes: 30, startedAt: "2026-06-19T12:30:00-03:00",
    description: "Spend coins to unlock a reachable town and open its jobs." },

  // ── M7 · Content ──────────────────────────────────────────────
  { id: "content-towns", title: "Design ~8 towns", milestone: "M7 · Content", status: "done", etaMinutes: 30, startedAt: "2026-06-19T12:21:00-03:00",
    description: "Original cozy town names + map coordinates for the starter region." },
  { id: "content-trains", title: "Design 2–3 trains", milestone: "M7 · Content", status: "done", etaMinutes: 20, startedAt: "2026-06-19T12:21:00-03:00",
    description: "Original train names with speed and car-slot stats." },
  { id: "content-cargo", title: "Design 4–6 cargo types", milestone: "M7 · Content", status: "done", etaMinutes: 20, startedAt: "2026-06-19T12:21:00-03:00",
    description: "Original cargo types with relative value for payout formulas." },

  // ── M8 · Audio ────────────────────────────────────────────────
  { id: "audio-manager", title: "SFX manager", milestone: "M8 · Audio", status: "done", etaMinutes: 20, startedAt: "2026-06-19T12:55:00-03:00",
    description: "Tiny preloaded SFX manager that respects a mute toggle." },
  { id: "audio-wire", title: "Wire SFX (click/chime/coin)", milestone: "M8 · Audio", status: "done", etaMinutes: 20, startedAt: "2026-06-19T12:55:00-03:00",
    description: "Hook UI click, train chime/whistle, and coin-collect sounds." },

  // ── M9 · Polish & Responsive ──────────────────────────────────
  { id: "polish-responsive", title: "Responsive phone + desktop", milestone: "M9 · Polish", status: "done", etaMinutes: 45, startedAt: "2026-06-19T13:00:00-03:00",
    description: "Layout works comfortably on both phone and desktop." },
  { id: "polish-input", title: "Touch + mouse interactions", milestone: "M9 · Polish", status: "done", etaMinutes: 30, startedAt: "2026-06-19T13:00:00-03:00",
    description: "Ensure all interactions work with touch and mouse." },
  { id: "polish-pwa", title: "Verify PWA install", milestone: "M9 · Polish", status: "done", etaMinutes: 20, startedAt: "2026-06-19T13:00:00-03:00",
    description: "Confirm installability and offline shell on mobile + desktop." },
  { id: "polish-perf", title: "Performance check", milestone: "M9 · Polish", status: "done", etaMinutes: 30, startedAt: "2026-06-19T13:00:00-03:00",
    description: "Smooth rendering and low memory on low-end phones." },

  // ── M10 · QA & Ship ───────────────────────────────────────────
  { id: "qa-dod", title: "QA against Definition of Done", milestone: "M10 · QA & Ship", status: "done", etaMinutes: 45, startedAt: "2026-06-19T13:05:00-03:00",
    description: "Verify every §12 acceptance criterion; log issues." },
  { id: "qa-fix", title: "Fix bugs", milestone: "M10 · QA & Ship", status: "done", etaMinutes: 60, startedAt: "2026-06-19T13:05:00-03:00",
    description: "Resolve issues found in QA; no crashes/console errors in core loop." },
  { id: "ship-deploy", title: "Deploy to static hosting", milestone: "M10 · QA & Ship", status: "done", etaMinutes: 30, startedAt: "2026-06-19T13:05:00-03:00",
    description: "Build and deploy the PWA to Netlify/Vercel/GitHub Pages." },

  // ── M11 · Visual Overhaul (Pixel-Art Retro) ───────────────────
  { id: "px-foundation", title: "Pixel rendering foundation", milestone: "M11 · Visual Overhaul", status: "done", etaMinutes: 40, startedAt: "2026-06-19T13:42:00-03:00",
    description: "Low-res offscreen buffer, integer upscale, imageSmoothing off, sprite drawing system (pixel bitmaps + palette)." },
  { id: "px-sprites", title: "Sprite library", milestone: "M11 · Visual Overhaul", status: "done", etaMinutes: 60, startedAt: "2026-06-19T13:42:00-03:00",
    description: "Procedural pixel sprites: locomotive (per kind) + cargo cars, station depot (unlocked/locked), trees & decorations." },
  { id: "px-world", title: "Tile-based world", milestone: "M11 · Visual Overhaul", status: "done", etaMinutes: 45, startedAt: "2026-06-19T13:42:00-03:00",
    description: "Deterministic grass/water/forest tilemap behind the network; cohesive retro palette; stable across frames." },
  { id: "px-track", title: "Pixel track & rails", milestone: "M11 · Visual Overhaul", status: "done", etaMinutes: 30, startedAt: "2026-06-19T13:42:00-03:00",
    description: "Chunky rails + sleepers between towns in pixel style, sitting in the world (keeps the connection lines the user likes)." },
  { id: "px-train", title: "Animated locomotive", milestone: "M11 · Visual Overhaul", status: "done", etaMinutes: 45, startedAt: "2026-06-19T13:42:00-03:00",
    description: "Train faces travel direction, gentle bob, chimney smoke puffs while en route (keeps the visible travel the user likes)." },
  { id: "px-effects", title: "Juice & effects", milestone: "M11 · Visual Overhaul", status: "done", etaMinutes: 35, startedAt: "2026-06-19T13:42:00-03:00",
    description: "Coin '+$' pop on delivery, sparkle on town unlock, job indicator bubbles above stations." },
  { id: "px-ui", title: "Retro UI chrome", milestone: "M11 · Visual Overhaul", status: "done", etaMinutes: 50, startedAt: "2026-06-19T14:05:00-03:00",
    description: "Pixel display font (Press Start 2P, OFL) for HUD/titles/buttons, chunky bordered panels, retro palette, button press feedback." },
  { id: "px-qa", title: "QA + responsive + commit", milestone: "M11 · Visual Overhaul", status: "done", etaMinutes: 30, startedAt: "2026-06-19T14:20:00-03:00",
    description: "Lint, tests, verify crisp pixels on mobile + desktop viewports, no perf regressions; commit & push." },

  // ── M12 · HD Glow-up + Train Systems + Bottom-Menu UX ─────────
  { id: "hd-renderer", title: "HD illustrated renderer", milestone: "M12 · HD Glow-up", status: "done", etaMinutes: 90, startedAt: "2026-06-19T15:00:00-03:00",
    description: "Rewrite render/map.ts: full-res, imageSmoothing on, gradients/soft shading/shadows/vignette; rounded stations, soft track, gradient locos + tinted cars + radial smoke. Drop the pixel sprite system." },
  { id: "hd-trainsys", title: "Train fuel/damage systems (engine)", milestone: "M12 · HD Glow-up", status: "done", etaMinutes: 60, startedAt: "2026-06-19T15:00:00-03:00",
    description: "New engine/trains.ts: fuel (+1/sec passive regen + 100-coin Fill), damage % + paid Repair (ceil(value*0.2*dmg%/100)), cargo/fuel-cart stats. Dispatch burns fuel + adds wear. New Train fields; SAVE_VERSION 1→2; tests." },
  { id: "hd-fullscreen", title: "Full-screen map + bottom menu", milestone: "M12 · HD Glow-up", status: "done", etaMinutes: 50, startedAt: "2026-06-19T15:30:00-03:00",
    description: "Map fills the viewport; floating top HUD (coins/mute/reset); bottom menu bar with Jobs / Station / Train. Reusable bottom-Sheet wrapper; tapping a town opens the Jobs sheet." },
  { id: "hd-trainsheet", title: "Train stats sheet", milestone: "M12 · HD Glow-up", status: "done", etaMinutes: 40, startedAt: "2026-06-19T15:30:00-03:00",
    description: "Per-train popup: fuel meter + live time-to-full, Fill button; damage meter + Repair button (with cost); cargo + fuel-cart stats. Wire refuel/repair store actions." },
  { id: "hd-theme", title: "HD cozy UI theme", milestone: "M12 · HD Glow-up", status: "done", etaMinutes: 40, startedAt: "2026-06-19T15:50:00-03:00",
    description: "Rewrite index.css tokens + App.css: rounded HD chrome, system rounded font (drop Press Start 2P), soft shadows, sheet/menu/card styling." },
  { id: "hd-qa", title: "QA + build + docs + commit", milestone: "M12 · HD Glow-up", status: "done", etaMinutes: 40, startedAt: "2026-06-19T16:05:00-03:00",
    description: "Typecheck/lint/57 tests, prod build (default + BASE_PATH), browser screenshot QA, update BasePrompt/README/GUIDE/Kanban; commit & push." },

  // ── M13 · Bigger Map + Selectable Lines ───────────────────────
  { id: "ln-world", title: "Bigger, spread-out world", milestone: "M13 · Bigger Map + Lines", status: "done", etaMinutes: 35, startedAt: "2026-06-19T17:00:00-03:00",
    description: "Grow to 12 towns (add Willowmere/Thornbury/Hazelmere/Pinecrest), respace so the four opening lines have clearly different lengths (longer line = more fuel)." },
  { id: "ln-pick", title: "Selectable track lines", milestone: "M13 · Bigger Map + Lines", status: "done", etaMinutes: 40, startedAt: "2026-06-19T17:00:00-03:00",
    description: "render/map.ts pickSegment + segKey + glowing golden highlight; drawMap gains selectedSegId; MapView falls back from town-pick to line-pick on tap." },
  { id: "ln-sheet", title: "Lines sheet + bottom button", milestone: "M13 · Bigger Map + Lines", status: "done", etaMinutes: 40, startedAt: "2026-06-19T17:20:00-03:00",
    description: "Fourth bottom-menu button 'Lines'; LinesSheet lists every segment (longest first) with length, per-trip fuel cost and fastest travel-time estimate; tap a row to highlight on the map." },
  { id: "ln-qa", title: "QA + docs + commit", milestone: "M13 · Bigger Map + Lines", status: "done", etaMinutes: 30, startedAt: "2026-06-19T17:40:00-03:00",
    description: "Typecheck/lint/57 tests, browser screenshot QA, update BasePrompt/README/GUIDE/Kanban; commit & push." },
];







