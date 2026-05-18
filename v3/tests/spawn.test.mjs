import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickItemType } from '../js/items.js';
import LEVELS from '../js/levels.js';

test('pickItemType normal spawn behavior before 50 seconds assist mode', () => {
  const level = LEVELS[1]; // Level 2
  const pool = level.spawnPool;
  
  // High weight count of spawned correct/wrong items
  let correctCount = 0;
  let wrongCount = 0;
  
  const ctx = {
    level,
    levelElapsedMs: 10000, // 10 seconds (no assist!)
    recentSpawnHistory: [],
    incorrectStreak: 0,
    random: Math.random,
  };

  for (let i = 0; i < 100; i++) {
    const pick = pickItemType(pool, ctx);
    const correct = level.correctSpawnOptions.some(opt => opt.type === pick.type);
    if (correct) {
      correctCount++;
    } else {
      wrongCount++;
    }
  }

  // Under normal weighting, wrong items should definitely spawn sometimes
  assert.ok(wrongCount > 0, 'Normal spawn must spawn wrong items under normal conditions');
});

test('pickItemType engagement assist mode after 50 seconds', () => {
  const level = LEVELS[1]; // Level 2
  const pool = level.spawnPool;
  
  // Set elapsed to 50 seconds (assist mode active!)
  const ctx = {
    level,
    levelElapsedMs: 50000, // active!
    recentSpawnHistory: [],
    incorrectStreak: 0,
  };

  // 1. Force a correct choice (78% probability)
  // Let's mock random to return 0.5 (which is < 0.78, so correct choice must be forced!)
  ctx.random = () => 0.5;
  const pickCorrect = pickItemType(pool, ctx);
  assert.ok(
    level.correctSpawnOptions.some(opt => opt.type === pickCorrect.type),
    'Assist mode must force a correct item when random < 0.78'
  );

  // 2. Force a wrong choice (22% probability) but constrain Y coordinate to the lower edge
  // Let's mock random to return 0.9 (which is > 0.78, forcing a wrong item)
  ctx.random = () => 0.9;
  const pickWrong = pickItemType(pool, ctx);
  
  // Verify it picked a wrong item type
  const isCorrect = level.correctSpawnOptions.some(opt => opt.type === pickWrong.type);
  assert.equal(isCorrect, false, 'Assist mode must pick a wrong item when random >= 0.78');

  // Verify the Y coordinate is constrained to the bottom edge range
  assert.ok(pickWrong.yRange, 'Spawn must contain yRange restriction');
  assert.equal(pickWrong.yRange[0], 471, 'Wrong item bottom edge min Y must be 471');
  assert.equal(pickWrong.yRange[1], 555, 'Wrong item bottom edge max Y must be 555');
});
