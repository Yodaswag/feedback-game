# Smart Spawn + Avoidance Nudge — Design

Date: 2026-05-17
Branch: feat/feedback-game-v2-overhaul
Component: feedback-game-v2

## Problem

Current item spawning is pure weighted random. Two failure modes:

1. **Bad streaks** — players may see many consecutive incorrect items, never reaching the win condition (3 correct in a row) within a reasonable time.
2. **Avoidance** — a player can dodge all items indefinitely. They never collide, never trigger feedback, and the game stalls without teaching.

## Goals

1. Guarantee the player encounters a correct item within a bounded streak.
2. Detect player avoidance and surface a Hebrew prompt encouraging engagement.
3. If avoidance persists, force a choice by spawning many items at once across the Y axis (but without a full wall — gaps remain).
4. Keep all tunable values centralized in `constants.js`; nudge text position must be configurable via enum + offset.

## Non-Goals

- Changing collision detection, levels, feedback content, or asset pipeline.
- Difficulty curve tuning across levels.
- Localization beyond the single Hebrew nudge string.

## Approach

### 1. Smarter Generation (adaptive weighting + streak cap)

`pickItemType(spawnPool, ctx)` becomes context-aware. `ctx` carries:
- `recentSpawnHistory: string[]` — last N spawned types
- `incorrectStreak: number` — count of consecutive incorrect items spawned

Algorithm:
1. If `incorrectStreak >= MAX_INCORRECT_STREAK` → pick from the level's correct-spawn options instead of `spawnPool`. Return `{type, y?}` where `y` is constrained for positional levels (e.g., Level 2's waterline rule).
2. Otherwise — copy `spawnPool`, multiply each entry's weight by `ADAPTIVE_BOOST` if its type is absent from `recentSpawnHistory`, divide by `ADAPTIVE_PENALTY` if it appears more than `(history.length / poolSize)` times. Pick weighted random.

After each spawn, the caller appends to `recentSpawnHistory` (capped at `SPAWN_HISTORY_LEN`) and updates `incorrectStreak`.

Each level gains `correctSpawnOptions: [{type, yRange?: [min, max]}]` describing how to spawn a guaranteed-correct item under that level's rules.

### 2. Avoidance Nudge

State adds:
- `avoidanceTimer: number` (ms accumulated during PLAYING phase since last pickup)

Update tick (PLAYING phase only): `avoidanceTimer += deltaMs`. On any item pickup (collision): `avoidanceTimer = 0`. On level advance / level start: `avoidanceTimer = 0`.

Renderer: when `avoidanceTimer >= NUDGE_DELAY_MS`, draw `NUDGE_TEXT` at the configured anchor. Stays visible until next pickup (which zeroes the timer).

Position config in `constants.js`:
```js
NUDGE_POSITION = {
  axisX: 'center',   // 'left' | 'center' | 'right'
  axisY: 'top',      // 'top' | 'middle' | 'bottom'
  offsetX: 0,
  offsetY: 60,
}
```

Renderer has `resolveNudgeAnchor(ctx)` mapping enum → pixel position based on `CANVAS_SIZE`.

### 3. Flood Burst at 30s

State adds:
- `floodTriggered: boolean` — set when burst fires, cleared on any pickup, level advance, or game reset.

Update tick: when `avoidanceTimer >= FLOOD_DELAY_MS && !floodTriggered`:
- Spawn `FLOOD_ITEM_COUNT` items at right edge, Y values evenly spread across `[ITEM_HEIGHT, CANVAS_SIZE - ITEM_HEIGHT]` with `±FLOOD_Y_JITTER` randomness.
- Each item's type chosen via the smart `pickItemType` (so streak cap and adaptive weights apply).
- `floodTriggered = true`.

Pickup resets `floodTriggered` and `avoidanceTimer`, so the cycle can repeat if the player keeps avoiding.

## Data / API Changes

**`js/constants.js`** — new exports:
```
MAX_INCORRECT_STREAK = 3
SPAWN_HISTORY_LEN = 5
ADAPTIVE_BOOST = 2.0
ADAPTIVE_PENALTY = 1.5
NUDGE_DELAY_MS = 15000
FLOOD_DELAY_MS = 30000
FLOOD_ITEM_COUNT = 6
FLOOD_Y_JITTER = 20
NUDGE_TEXT = 'אל תתחמקו מהפריטים! נסו לאסוף ותלמדו מטעויות'
NUDGE_POSITION = { axisX:'center', axisY:'top', offsetX:0, offsetY:60 }
NUDGE_FONT_SIZE = 18
NUDGE_COLOR = '#ffdd55'
NUDGE_STROKE_COLOR = '#1a3f6f'
```

**`js/items.js`** — signature change:
- `pickItemType(spawnPool, ctx)` where `ctx = { recentSpawnHistory, incorrectStreak, level }`. Returns `{ type, yRange? }`.
- New `createItemAt(id, type, y)` for flood (and reused internally by `createItem`).
- `createItem(id, type, yRange?)` accepts optional Y range.

**`js/levels.js`** — each level gets `correctSpawnOptions: [{type, yRange?}]`.

**`js/state.js`** — `createInitialState`, `advanceLevel`, `collectItem` extended:
- new fields: `recentSpawnHistory: []`, `incorrectStreak: 0`, `avoidanceTimer: 0`, `floodTriggered: false`
- `collectItem(state, itemId, isCorrect)` zeros `avoidanceTimer`, `floodTriggered` (existing reset semantics preserved). The streak/history are spawn-side state, not pickup-side, so `collectItem` leaves them alone.
- New helpers: `recordSpawn(state, type, wasCorrectType)`, `tickAvoidance(state, deltaMs)`, `setFloodTriggered(state)`.

**`js/main.js`** — `update()`:
- After tickSpawnTimer / before pickup loop: `state = State.tickAvoidance(state, deltaMs)`.
- Spawn path uses smart `pickItemType` with context; calls `recordSpawn`.
- After spawn check: if `avoidanceTimer >= FLOOD_DELAY_MS && !floodTriggered` → spawn flood burst.
- Pickup path: existing `collectItem` already zeros the right fields per updated semantics.

**`js/renderer.js`** — new `drawAvoidanceNudge(ctx)` called from main render when condition holds.

**`tests/levels.test.mjs`** — add `correctSpawnOptions` checks per level.
**`tests/spawn.test.mjs`** (new) — streak cap, adaptive weighting, flood spawn count + Y spread.

## Behavior Summary

| Time idle | Effect |
|-----------|--------|
| 0–15s | Normal spawning, smart algorithm |
| 15s+ | Hebrew nudge appears at configured position |
| 30s+ | One-time burst of `FLOOD_ITEM_COUNT` items across Y axis; nudge still showing |
| On pickup | Timer + nudge + flood flag reset |

## Risks / Trade-offs

- Streak-cap "force correct" can feel artificial if it fires repeatedly. `MAX_INCORRECT_STREAK = 3` gives random variance for at most a few items before intervention.
- Flood at 30s spawns 6 items simultaneously; if `ITEM_SPAWN_INTERVAL` (1800ms) hasn't elapsed, normal spawn timer remains intact (flood is additive). Verified: items collection is just appended.
- Adaptive weighting uses `Math.random()`; deterministic tests pass injected RNG via `ctx.random`.

## Out of Scope

- Persistence of avoidance metrics across sessions.
- Player-facing analytics or telemetry.
- Visual animation of the nudge (static text only).
