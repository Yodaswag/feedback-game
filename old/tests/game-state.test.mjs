import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialState,
  applyCollision,
  setFeedbackMode,
  setSpeedMultiplier,
  isMissionComplete,
} from '../js/game-state.js';

test('positive collision increments score and records selected positive feedback experience', () => {
  const state = setFeedbackMode(createInitialState(), 'corrective');
  const next = applyCollision(state, { isGood: true });

  assert.equal(next.itemsCollected, 1);
  assert.equal(next.checklist.corrective.pos, true);
});

test('negative collision decrements score but never below zero', () => {
  const next = applyCollision(createInitialState(), { isGood: false });
  assert.equal(next.itemsCollected, 0);
});

test('mission completes only after all six feedback experiences are recorded', () => {
  let state = createInitialState();
  for (const mode of ['outcome', 'corrective', 'elaborative']) {
    state = setFeedbackMode(state, mode);
    state = applyCollision(state, { isGood: true });
    state = applyCollision(state, { isGood: false });
  }

  assert.equal(isMissionComplete(state), true);
});

test('speed multiplier clamps to supported range', () => {
  assert.equal(setSpeedMultiplier(createInitialState(), 0.1).speedMultiplier, 0.5);
  assert.equal(setSpeedMultiplier(createInitialState(), 9).speedMultiplier, 3);
});
