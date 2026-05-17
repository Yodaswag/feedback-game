# Implementation Plan — Smart Spawn + Avoidance Nudge

Spec: `docs/superpowers/specs/2026-05-17-smart-spawn-avoidance-nudge-design.md`

## Task 1 — Constants

Edit `feedback-game-v2/js/constants.js`. Append:
- `MAX_INCORRECT_STREAK`, `SPAWN_HISTORY_LEN`, `ADAPTIVE_BOOST`, `ADAPTIVE_PENALTY`
- `NUDGE_DELAY_MS`, `NUDGE_TEXT`, `NUDGE_POSITION`, `NUDGE_FONT_SIZE`, `NUDGE_COLOR`, `NUDGE_STROKE_COLOR`
- `FLOOD_DELAY_MS`, `FLOOD_ITEM_COUNT`, `FLOOD_Y_JITTER`

## Task 2 — Levels: correctSpawnOptions

Edit `feedback-game-v2/js/levels.js`. Add per-level `correctSpawnOptions`:
- L0: `[{type: CHEST_RIBBON}]`
- L1: `[{type: BOMB_UNLIT}]`
- L2: `[{type: CHEST_RIBBON, yRange:[ITEM_HEIGHT, WATERLINE_Y-1]}, {type: BOMB_UNLIT, yRange:[WATERLINE_Y, CANVAS_SIZE-ITEM_HEIGHT]}]`

## Task 3 — items.js: smart pickItemType + createItem y range

Edit `feedback-game-v2/js/items.js`:
- `pickItemType(spawnPool, ctx)` — ctx default `{recentSpawnHistory: [], incorrectStreak: 0, level: null, random: Math.random}`.
  - If `incorrectStreak >= MAX_INCORRECT_STREAK && level?.correctSpawnOptions` → pick random option, return `{type, yRange}`.
  - Else compute adaptive weights, return `{type}`.
- `createItem(id, type, yRange)` — pick y within yRange if provided, else default full canvas.
- Keep backward-compatible return shape: `pickItemType` now returns object not bare string.

## Task 4 — state.js: new fields + helpers

Edit `feedback-game-v2/js/state.js`:
- `createInitialState`: add `recentSpawnHistory: []`, `incorrectStreak: 0`, `avoidanceTimer: 0`, `floodTriggered: false`.
- `collectItem`: also set `avoidanceTimer: 0`, `floodTriggered: false`.
- `advanceLevel`: reset all 4 new fields.
- New: `recordSpawn(state, type, isCorrectType)` — push type to history (cap `SPAWN_HISTORY_LEN`), update `incorrectStreak`.
- New: `tickAvoidance(state, deltaMs)`.
- New: `setFloodTriggered(state)`.

## Task 5 — main.js: integrate avoidance + flood

Edit `feedback-game-v2/js/main.js` update() PLAYING branch:
- Tick avoidance every PLAYING frame.
- On spawn: call `pickItemType(level.spawnPool, {history, streak, level, random})` → handle returned `{type, yRange}` → `recordSpawn(state, type, isCorrectType)`.
- Determine `isCorrectType`: type matches any `level.correctSpawnOptions[*].type`. (At spawn time, position-dependence is collapsed to type-only for streak purposes; OK because positional correctness is decided at pickup, and we only fire force-correct path when streak hits cap.)
- After spawn check, if `avoidanceTimer >= FLOOD_DELAY_MS && !floodTriggered` → loop `FLOOD_ITEM_COUNT` times: pick type via smart algorithm, compute even Y slot ±jitter, append items; then `setFloodTriggered`.

## Task 6 — renderer.js: drawAvoidanceNudge

Edit `feedback-game-v2/js/renderer.js`:
- New `resolveNudgeAnchor(ctx, pos)` → `{x, y, textAlign}`.
- New `drawAvoidanceNudge(ctx)` — draws stroked + filled text at anchor.
- Call from `main.js` render PLAYING/FEEDBACK branch when `state.avoidanceTimer >= NUDGE_DELAY_MS`.

## Task 7 — tests/spawn.test.mjs

New file. Cases:
- streak cap forces correct type after MAX_INCORRECT_STREAK
- adaptive weight: absent types appear more often than recently-seen ones over many trials (with seeded RNG)
- createItem with yRange respects bounds

## Task 8 — Run + verify

`npm test` from `feedback-game-v2/`. Confirm pass. Open `index.html` in browser is manual; skip if no browser available — flag verification status to user.
