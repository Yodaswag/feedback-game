import {
  CANVAS_SIZE, ITEM_WIDTH, ITEM_HEIGHT,
  ITEM_SPAWN_MIN_Y, ITEM_SPAWN_MAX_Y,
  ITEM_MIN_Y_SPACING, ITEM_SPACING_LOOKBACK_X, ITEM_Y_PLACEMENT_RETRIES,
  MAX_INCORRECT_STREAK, ADAPTIVE_BOOST, ADAPTIVE_PENALTY,
} from './constants.js';

// Pick an item type using a smart algorithm:
//   1. If incorrectStreak >= MAX_INCORRECT_STREAK and the level exposes
//      correctSpawnOptions, force-pick a guaranteed-correct option.
//   2. Otherwise apply adaptive weighting: boost types absent from recent
//      history, penalize over-represented types, then weighted-random pick.
// Returns { type, yRange? } — yRange constrains spawn Y so positional
// correctness (e.g. Level 2 waterline rule) is respected when forced.
//
// ctx defaults make this back-compatible with single-arg callers.
export function pickItemType(spawnPool, ctx = {}) {
  const {
    recentSpawnHistory = [],
    incorrectStreak    = 0,
    level              = null,
    random             = Math.random,
    levelElapsedMs     = 0,
  } = ctx;

  // Assist Mode after 50 seconds:
  const LEVEL_ASSIST_DELAY_MS = 50000;
  const ASSIST_CORRECT_WEIGHT = 0.78;
  const ASSIST_WRONG_EDGE_HEIGHT = 84;
  const ASSIST_WRONG_EDGE_MIN_Y = ITEM_SPAWN_MAX_Y - ASSIST_WRONG_EDGE_HEIGHT;

  if (levelElapsedMs >= LEVEL_ASSIST_DELAY_MS && level) {
    const correctOptions = level.correctSpawnOptions ?? [];
    const wrongOptions = spawnPool.filter(entry => !correctOptions.some(opt => opt.type === entry.type));

    if (random() < ASSIST_CORRECT_WEIGHT && correctOptions.length > 0) {
      const forced = correctOptions[Math.floor(random() * correctOptions.length)];
      return { type: forced.type, yRange: forced.yRange };
    }

    if (wrongOptions.length > 0) {
      const wrong = wrongOptions[Math.floor(random() * wrongOptions.length)];
      return {
        type: wrong.type,
        yRange: [ASSIST_WRONG_EDGE_MIN_Y, ITEM_SPAWN_MAX_Y],
      };
    }
  }

  if (incorrectStreak >= MAX_INCORRECT_STREAK
      && level && level.correctSpawnOptions && level.correctSpawnOptions.length > 0) {
    const opts = level.correctSpawnOptions;
    const pick = opts[Math.floor(random() * opts.length)];
    return { type: pick.type, yRange: pick.yRange };
  }

  const poolSize = spawnPool.length;
  const histLen = recentSpawnHistory.length;
  const avgSeen = histLen > 0 ? histLen / poolSize : 0;
  const counts = {};
  for (const t of recentSpawnHistory) counts[t] = (counts[t] || 0) + 1;

  const weighted = spawnPool.map(e => {
    let w = e.weight;
    const seen = counts[e.type] || 0;
    if (seen === 0)             w *= ADAPTIVE_BOOST;
    else if (seen > avgSeen)    w /= ADAPTIVE_PENALTY;
    return { type: e.type, weight: w };
  });

  const total = weighted.reduce((s, e) => s + e.weight, 0);
  let r = random() * total;
  for (const e of weighted) {
    r -= e.weight;
    if (r <= 0) return { type: e.type };
  }
  return { type: weighted[weighted.length - 1].type };
}

// Create a new item at the right edge.
// yRange (optional) constrains the Y coordinate to [min, max].
// existingItems (optional) is used to keep new spawn from clustering too
// close in Y to items still near the right edge.
export function createItem(id, type, yRange, existingItems = []) {
  const minY = yRange ? Math.max(ITEM_SPAWN_MIN_Y, yRange[0]) : ITEM_SPAWN_MIN_Y;
  const maxY = yRange ? Math.min(ITEM_SPAWN_MAX_Y, yRange[1]) : ITEM_SPAWN_MAX_Y;
  const y = pickSpacedY(minY, maxY, existingItems);
  return createItemAt(id, type, y);
}

function pickSpacedY(minY, maxY, existingItems) {
  const nearby = existingItems.filter(
    it => it.x >= CANVAS_SIZE - ITEM_SPACING_LOOKBACK_X
  );
  for (let attempt = 0; attempt < ITEM_Y_PLACEMENT_RETRIES; attempt++) {
    const candidate = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
    if (nearby.every(it => Math.abs(it.y - candidate) >= ITEM_MIN_Y_SPACING)) {
      return candidate;
    }
  }
  // Fallback: find the Y in range that maximizes distance to nearest nearby item.
  let bestY = minY;
  let bestDist = -1;
  const samples = 16;
  for (let i = 0; i <= samples; i++) {
    const cand = minY + Math.round((maxY - minY) * (i / samples));
    const nearest = nearby.reduce(
      (d, it) => Math.min(d, Math.abs(it.y - cand)),
      Infinity
    );
    if (nearest > bestDist) {
      bestDist = nearest;
      bestY = cand;
    }
  }
  return bestY;
}

// Create an item at a specific Y (used by flood spawn).
export function createItemAt(id, type, y) {
  return {
    id,
    type,
    x: CANVAS_SIZE + ITEM_WIDTH / 2,
    y,
    width:  ITEM_WIDTH,
    height: ITEM_HEIGHT,
  };
}

// AABB collision using center-based positions
export function checkCollision(a, b) {
  return (
    Math.abs(a.x - b.x) < (a.width  + b.width)  / 2 &&
    Math.abs(a.y - b.y) < (a.height + b.height) / 2
  );
}
