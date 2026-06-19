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
  updatedAt: "2026-06-19T12:51:00-03:00",
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
  { id: "audio-manager", title: "SFX manager", milestone: "M8 · Audio", status: "todo", etaMinutes: 20, startedAt: null,
    description: "Tiny preloaded SFX manager that respects a mute toggle." },
  { id: "audio-wire", title: "Wire SFX (click/chime/coin)", milestone: "M8 · Audio", status: "todo", etaMinutes: 20, startedAt: null,
    description: "Hook UI click, train chime/whistle, and coin-collect sounds." },

  // ── M9 · Polish & Responsive ──────────────────────────────────
  { id: "polish-responsive", title: "Responsive phone + desktop", milestone: "M9 · Polish", status: "todo", etaMinutes: 45, startedAt: null,
    description: "Layout works comfortably on both phone and desktop." },
  { id: "polish-input", title: "Touch + mouse interactions", milestone: "M9 · Polish", status: "todo", etaMinutes: 30, startedAt: null,
    description: "Ensure all interactions work with touch and mouse." },
  { id: "polish-pwa", title: "Verify PWA install", milestone: "M9 · Polish", status: "todo", etaMinutes: 20, startedAt: null,
    description: "Confirm installability and offline shell on mobile + desktop." },
  { id: "polish-perf", title: "Performance check", milestone: "M9 · Polish", status: "todo", etaMinutes: 30, startedAt: null,
    description: "Smooth rendering and low memory on low-end phones." },

  // ── M10 · QA & Ship ───────────────────────────────────────────
  { id: "qa-dod", title: "QA against Definition of Done", milestone: "M10 · QA & Ship", status: "todo", etaMinutes: 45, startedAt: null,
    description: "Verify every §12 acceptance criterion; log issues." },
  { id: "qa-fix", title: "Fix bugs", milestone: "M10 · QA & Ship", status: "todo", etaMinutes: 60, startedAt: null,
    description: "Resolve issues found in QA; no crashes/console errors in core loop." },
  { id: "ship-deploy", title: "Deploy to static hosting", milestone: "M10 · QA & Ship", status: "todo", etaMinutes: 30, startedAt: null,
    description: "Build and deploy the PWA to Netlify/Vercel/GitHub Pages." },
];

