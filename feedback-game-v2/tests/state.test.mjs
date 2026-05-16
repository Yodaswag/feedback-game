// tests/state.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState,
  startGame,
  moveShip,
  spawnItem,
  updateItems,
  collectItem,
  showPopup,
  tickPopup,
  advanceTransition,
  setPlayerMood,
  advanceLevel,
  resetSpawnTimer,
  tickSpawnTimer,
} from '../js/state.js';
import { PHASE, TRANSITION_STEP, CONSECUTIVE_TO_WIN, CANVAS_SIZE, SHIP_SPEED } from '../js/constants.js';

// createInitialState
test('initial state phase is START', () => {
  assert.equal(createInitialState().phase, PHASE.START);
});
test('initial consecutiveCount is 0', () => {
  assert.equal(createInitialState().consecutiveCount, 0);
});
test('initial items array is empty', () => {
  assert.deepEqual(createInitialState().items, []);
});

// startGame
test('startGame sets phase to PLAYING', () => {
  const s = startGame(createInitialState());
  assert.equal(s.phase, PHASE.PLAYING);
});

// moveShip
test('moveShip moves ship Y by delta', () => {
  const s = { ...createInitialState(), shipY: 300 };
  const moved = moveShip(s, 10);
  assert.equal(moved.shipY, 310);
});
test('moveShip clamps shipY to canvas bounds', () => {
  const s = { ...createInitialState(), shipY: 10 };
  const moved = moveShip(s, -100);
  assert.ok(moved.shipY >= 40, `shipY ${moved.shipY} should be >= 40`);
});
test('moveShip does not mutate original state', () => {
  const s = { ...createInitialState(), shipY: 300 };
  moveShip(s, 50);
  assert.equal(s.shipY, 300);
});

// spawnItem
test('spawnItem adds item to items array', () => {
  const s = createInitialState();
  const item = { id: 0, type: 'chest-ribbon', x: 620, y: 200, width: 58, height: 58 };
  const next = spawnItem(s, item);
  assert.equal(next.items.length, 1);
  assert.equal(next.items[0].id, 0);
});
test('spawnItem increments nextItemId', () => {
  const s = createInitialState();
  const item = { id: 0, type: 'chest-ribbon', x: 620, y: 200, width: 58, height: 58 };
  const next = spawnItem(s, item);
  assert.equal(next.nextItemId, 1);
});

// updateItems
test('updateItems moves items left by deltaX', () => {
  const s = {
    ...createInitialState(),
    items: [{ id: 0, type: 'chest-ribbon', x: 300, y: 200, width: 58, height: 58 }],
  };
  const next = updateItems(s, 5);
  assert.equal(next.items[0].x, 295);
});
test('updateItems removes items that go off-screen left', () => {
  const s = {
    ...createInitialState(),
    items: [{ id: 0, type: 'chest-ribbon', x: -80, y: 200, width: 58, height: 58 }],
  };
  const next = updateItems(s, 1);
  assert.equal(next.items.length, 0);
});

// collectItem
test('collectItem removes item from items', () => {
  const s = {
    ...createInitialState(),
    items: [{ id: 7, type: 'chest-ribbon', x: 100, y: 200, width: 58, height: 58 }],
    consecutiveCount: 1,
  };
  const next = collectItem(s, 7, true);
  assert.equal(next.items.length, 0);
});
test('collectItem increments count on correct', () => {
  const s = { ...createInitialState(), consecutiveCount: 1 };
  const next = collectItem(s, 0, true);
  assert.equal(next.consecutiveCount, 2);
});
test('collectItem resets count to 0 on wrong', () => {
  const s = { ...createInitialState(), consecutiveCount: 2 };
  const next = collectItem(s, 0, false);
  assert.equal(next.consecutiveCount, 0);
});

// showPopup
test('showPopup sets phase to FEEDBACK', () => {
  const s = { ...createInitialState(), phase: PHASE.PLAYING };
  const next = showPopup(s, '✓', true, 1200);
  assert.equal(next.phase, PHASE.FEEDBACK);
});
test('showPopup stores text and isCorrect', () => {
  const s = createInitialState();
  const next = showPopup(s, 'נכון!', true, 2000);
  assert.equal(next.activePopup.text, 'נכון!');
  assert.equal(next.activePopup.isCorrect, true);
});
test('showPopup sets popupTimer to duration', () => {
  const s = createInitialState();
  const next = showPopup(s, 'X', false, 1500);
  assert.equal(next.popupTimer, 1500);
});

// tickPopup — timer not expired
test('tickPopup decrements popupTimer', () => {
  const s = { ...createInitialState(), phase: PHASE.FEEDBACK, popupTimer: 1000, activePopup: { text: '✓', isCorrect: true }, consecutiveCount: 1 };
  const next = tickPopup(s, 200);
  assert.equal(next.popupTimer, 800);
  assert.equal(next.phase, PHASE.FEEDBACK);
});

// tickPopup — timer expired, not level-complete
test('tickPopup transitions to PLAYING when timer expires and count < 3', () => {
  const s = { ...createInitialState(), phase: PHASE.FEEDBACK, popupTimer: 100, activePopup: { text: '✓', isCorrect: true }, consecutiveCount: 1 };
  const next = tickPopup(s, 200);
  assert.equal(next.phase, PHASE.PLAYING);
  assert.equal(next.activePopup, null);
});

// tickPopup — timer expired, level complete
test('tickPopup transitions to TRANSITION when consecutiveCount == CONSECUTIVE_TO_WIN', () => {
  const s = {
    ...createInitialState(),
    phase: PHASE.FEEDBACK,
    popupTimer: 50,
    activePopup: { text: '✓', isCorrect: true },
    consecutiveCount: CONSECUTIVE_TO_WIN,
  };
  const next = tickPopup(s, 200);
  assert.equal(next.phase, PHASE.TRANSITION);
  assert.equal(next.transition.step, TRANSITION_STEP.REVEAL);
});

// advanceTransition
test('advanceTransition moves step from REVEAL to MOOD', () => {
  const s = { ...createInitialState(), transition: { step: TRANSITION_STEP.REVEAL, playerMood: null } };
  const next = advanceTransition(s);
  assert.equal(next.transition.step, TRANSITION_STEP.MOOD);
});

// setPlayerMood
test('setPlayerMood records mood', () => {
  const s = { ...createInitialState(), transition: { step: TRANSITION_STEP.MOOD, playerMood: null } };
  const next = setPlayerMood(s, 'מרוצה');
  assert.equal(next.transition.playerMood, 'מרוצה');
});

// advanceLevel
test('advanceLevel increments levelIndex if not last level', () => {
  const s = {
    ...createInitialState(),
    levelIndex: 0,
    transition: { step: TRANSITION_STEP.MOOD, playerMood: 'מרוצה' },
  };
  const next = advanceLevel(s);
  assert.equal(next.levelIndex, 1);
  assert.equal(next.phase, PHASE.PLAYING);
});
test('advanceLevel sets phase to END on last level', () => {
  const s = {
    ...createInitialState(),
    levelIndex: 2,
    transition: { step: TRANSITION_STEP.MOOD, playerMood: 'מרוצה' },
  };
  const next = advanceLevel(s);
  assert.equal(next.phase, PHASE.END);
});
test('advanceLevel resets consecutiveCount and items', () => {
  const s = {
    ...createInitialState(),
    levelIndex: 0,
    consecutiveCount: 3,
    items: [{ id: 0, type: 'chest-ribbon', x: 100, y: 200, width: 58, height: 58 }],
    transition: { step: TRANSITION_STEP.MOOD, playerMood: 'בסדר' },
  };
  const next = advanceLevel(s);
  assert.equal(next.consecutiveCount, 0);
  assert.deepEqual(next.items, []);
});
test('advanceLevel records levelResult with mood', () => {
  const s = {
    ...createInitialState(),
    levelIndex: 0,
    levelResults: [],
    transition: { step: TRANSITION_STEP.MOOD, playerMood: 'מתוסכל' },
  };
  const next = advanceLevel(s);
  assert.equal(next.levelResults.length, 1);
  assert.equal(next.levelResults[0].mood, 'מתוסכל');
});

// resetSpawnTimer / tickSpawnTimer
test('resetSpawnTimer sets spawnTimer to interval', () => {
  const s = createInitialState();
  const next = resetSpawnTimer(s, 1800);
  assert.equal(next.spawnTimer, 1800);
});
test('tickSpawnTimer decrements spawnTimer', () => {
  const s = { ...createInitialState(), spawnTimer: 500 };
  const next = tickSpawnTimer(s, 100);
  assert.equal(next.spawnTimer, 400);
});
test('tickSpawnTimer does not go below 0', () => {
  const s = { ...createInitialState(), spawnTimer: 50 };
  const next = tickSpawnTimer(s, 200);
  assert.equal(next.spawnTimer, 0);
});
