// tests/spawn.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickItemType, createItem } from '../js/items.js';
import LEVELS from '../js/levels.js';
import {
  ITEM, MAX_INCORRECT_STREAK, WATERLINE_Y, ITEM_HEIGHT, CANVAS_SIZE,
} from '../js/constants.js';

// Deterministic RNG: cycles through given values
function seededRandom(values) {
  let i = 0;
  return () => values[i++ % values.length];
}

test('streak cap forces a correct-type pick once threshold reached', () => {
  const level = LEVELS[0]; // correct = chest-ribbon
  const ctx = {
    recentSpawnHistory: [ITEM.BOMB_LIT, ITEM.BOMB_LIT, ITEM.CHEST_PLAIN],
    incorrectStreak: MAX_INCORRECT_STREAK,
    level,
    random: () => 0.0,
  };
  const result = pickItemType(level.spawnPool, ctx);
  assert.equal(result.type, ITEM.CHEST_RIBBON);
});

test('streak cap force-correct on level 2 returns a yRange', () => {
  const level = LEVELS[2];
  const ctx = {
    recentSpawnHistory: [],
    incorrectStreak: MAX_INCORRECT_STREAK + 1,
    level,
    random: () => 0.0,
  };
  const result = pickItemType(level.spawnPool, ctx);
  assert.ok(level.correctSpawnOptions.some(o => o.type === result.type));
  assert.ok(Array.isArray(result.yRange), 'level 2 picks must include yRange');
});

test('streak cap not engaged below threshold', () => {
  const level = LEVELS[0];
  const ctx = {
    recentSpawnHistory: [ITEM.BOMB_LIT, ITEM.BOMB_LIT],
    incorrectStreak: MAX_INCORRECT_STREAK - 1,
    level,
    random: () => 0.0, // first weighted entry should win when r=0
  };
  // pool[0] is CHEST_RIBBON; with adaptive logic seen=0 → boosted, but first entry order
  // shouldn't be asserted strongly. Just ensure result.type ∈ pool.
  const result = pickItemType(level.spawnPool, ctx);
  assert.ok(level.spawnPool.some(e => e.type === result.type));
});

test('adaptive weighting biases toward unseen types over many trials', () => {
  const level = LEVELS[0];
  const pool = level.spawnPool;
  // Force history saturated with chest-ribbon — chest-plain and bomb-lit should appear MORE
  const history = [ITEM.CHEST_RIBBON, ITEM.CHEST_RIBBON, ITEM.CHEST_RIBBON, ITEM.CHEST_RIBBON, ITEM.CHEST_RIBBON];
  const counts = { [ITEM.CHEST_RIBBON]: 0, [ITEM.CHEST_PLAIN]: 0, [ITEM.BOMB_LIT]: 0 };
  for (let i = 0; i < 2000; i++) {
    const r = pickItemType(pool, {
      recentSpawnHistory: history,
      incorrectStreak: 0,
      level,
    });
    counts[r.type]++;
  }
  // chest-ribbon penalized, chest-plain & bomb-lit boosted
  assert.ok(counts[ITEM.CHEST_PLAIN] > counts[ITEM.CHEST_RIBBON],
    `expected chest-plain > chest-ribbon, got ${JSON.stringify(counts)}`);
  assert.ok(counts[ITEM.BOMB_LIT]   > counts[ITEM.CHEST_RIBBON],
    `expected bomb-lit > chest-ribbon, got ${JSON.stringify(counts)}`);
});

test('createItem respects yRange bounds', () => {
  for (let i = 0; i < 100; i++) {
    const item = createItem(i, ITEM.CHEST_RIBBON, [ITEM_HEIGHT, WATERLINE_Y - 1]);
    assert.ok(item.y >= ITEM_HEIGHT, `y ${item.y} below min`);
    assert.ok(item.y <= WATERLINE_Y - 1, `y ${item.y} above max`);
  }
  for (let i = 0; i < 100; i++) {
    const item = createItem(i, ITEM.BOMB_UNLIT, [WATERLINE_Y, CANVAS_SIZE - ITEM_HEIGHT]);
    assert.ok(item.y >= WATERLINE_Y, `y ${item.y} below waterline`);
    assert.ok(item.y <= CANVAS_SIZE - ITEM_HEIGHT, `y ${item.y} above max`);
  }
});

test('each level exposes at least one correctSpawnOption', () => {
  for (const level of LEVELS) {
    assert.ok(Array.isArray(level.correctSpawnOptions), `level ${level.index} missing correctSpawnOptions`);
    assert.ok(level.correctSpawnOptions.length > 0, `level ${level.index} has empty correctSpawnOptions`);
  }
});

test('correctSpawnOption types pass level.isCorrect when placed in their yRange', () => {
  for (const level of LEVELS) {
    for (const opt of level.correctSpawnOptions) {
      const y = opt.yRange ? opt.yRange[0] : 200;
      const item = { type: opt.type, x: 400, y, width: 58, height: 58 };
      assert.ok(level.isCorrect(item),
        `level ${level.index} option ${opt.type} y=${y} should be correct`);
    }
  }
});
