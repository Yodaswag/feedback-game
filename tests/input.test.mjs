import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SHIP_X,
  clampShipY,
  shouldTrackMouse,
  resolveShipY,
} from '../js/input.js';

test('ship x position is fixed for the whole game', () => {
  assert.equal(SHIP_X, 120);
});

test('mouse tracking is ignored inside the reserved left control lane', () => {
  assert.equal(shouldTrackMouse(40, 90), false);
  assert.equal(shouldTrackMouse(120, 90), true);
});

test('keyboard input wins over mouse input while arrow keys are active', () => {
  const nextY = resolveShipY({
    currentY: 200,
    mouseY: 450,
    keyboardDirection: -1,
    dt: 1,
    speed: 220,
    canvasHeight: 600,
  });

  assert.equal(nextY, 60);
});

test('mouse input updates y when outside the control lane and no key is held', () => {
  const nextY = resolveShipY({
    currentY: 200,
    mouseY: 450,
    keyboardDirection: 0,
    dt: 1,
    speed: 220,
    canvasHeight: 600,
  });

  assert.equal(nextY, 450);
});

test('ship y stays within playable bounds', () => {
  assert.equal(clampShipY(-10, 600), 60);
  assert.equal(clampShipY(999, 600), 540);
});
