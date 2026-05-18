import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as State from '../js/state.js';

test('createInitialState creates standard game state', () => {
  const state = State.createInitialState();
  assert.equal(state.phase, 'START');
  assert.equal(state.isPaused, false);
  assert.equal(state.pausedFromPhase, null);
  assert.equal(state.levelElapsedMs, 0);
  assert.equal(state.speedMultiplier, 1);
});

test('setPaused pauses and resumes state correctly', () => {
  let state = State.createInitialState();
  state.phase = 'PLAYING';

  state = State.setPaused(state, true);
  assert.equal(state.isPaused, true);
  assert.equal(state.pausedFromPhase, 'PLAYING');

  state = State.setPaused(state, false);
  assert.equal(state.isPaused, false);
  assert.equal(state.pausedFromPhase, null);
});

test('tickLevelTimer increments levelElapsedMs', () => {
  let state = State.createInitialState();
  state = State.tickLevelTimer(state, 500);
  assert.equal(state.levelElapsedMs, 500);

  state = State.tickLevelTimer(state, 1200);
  assert.equal(state.levelElapsedMs, 1700);
});

test('setSpeedMultiplier constrains multiplier values between 0.5 and 3.0', () => {
  let state = State.createInitialState();
  state = State.setSpeedMultiplier(state, 1.5);
  assert.equal(state.speedMultiplier, 1.5);

  state = State.setSpeedMultiplier(state, 0.2); // too low!
  assert.equal(state.speedMultiplier, 0.5);

  state = State.setSpeedMultiplier(state, 5.0); // too high!
  assert.equal(state.speedMultiplier, 3.0);
});

test('dismissPopup routes to transition if level complete, otherwise to playing', () => {
  let state = State.createInitialState();
  state.consecutiveCount = 1; // not yet completed!

  state = State.dismissPopup(state);
  assert.equal(state.phase, 'PLAYING');

  state.consecutiveCount = 3; // level completed!
  state = State.dismissPopup(state);
  assert.equal(state.phase, 'TRANSITION');
  assert.equal(state.transition?.step, 'REVEAL');
});
