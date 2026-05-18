import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  createCanvasLayout,
  getCursorForTarget,
  isPointInsideExpandedRect,
  resolveCanvasTarget,
  shouldHideSpeedTray,
  toCanvasPoint,
} from '../js/ui.js';

const layout = createCanvasLayout(680);

test('createCanvasLayout returns a 680 shared parchment layout', () => {
  assert.equal(layout.canvasSize, 680);
  assert.equal(layout.targetResolution, 680);
  assert.ok(layout.sharedPage.w >= 600);
  assert.ok(layout.sharedPage.h >= 560);
});

test('createCanvasLayout clamps small canvas inputs to non-negative actionable rects', () => {
  const compactLayout = createCanvasLayout(220);

  assert.equal(compactLayout.sharedPage.w >= 0, true);
  assert.equal(compactLayout.sharedPage.h >= 0, true);
  assert.equal(compactLayout.startButton.w >= 0, true);
  assert.equal(compactLayout.startButton.h >= 0, true);
  assert.equal(compactLayout.treasureButton.w >= 0, true);
  assert.equal(compactLayout.treasureButton.h >= 0, true);
  assert.equal(compactLayout.levelCards.length, 0);
  for (const point of [
    { x: compactLayout.sharedPage.x + 20, y: compactLayout.sharedPage.y + 260 },
    { x: compactLayout.sharedPage.x + compactLayout.sharedPage.w / 2, y: compactLayout.sharedPage.y + 260 },
    { x: compactLayout.sharedPage.x + compactLayout.sharedPage.w - 20, y: compactLayout.sharedPage.y + 260 },
  ]) {
    const target = resolveCanvasTarget(
      compactLayout,
      { phase: 'LEVEL_SELECT', completedLevels: [true, true, true], allLevelsUnlockedFromStart: true },
      point.x,
      point.y,
    );
    assert.equal(target.id.startsWith('level-'), false);
  }
});

test('degenerate compact CTA rects do not resolve to clickable targets', () => {
  const tinyLayout = createCanvasLayout(100);

  assert.equal(resolveCanvasTarget(tinyLayout, { phase: 'START' }, tinyLayout.startButton.cx, tinyLayout.startButton.cy).id, 'none');
  assert.equal(
    resolveCanvasTarget(
      tinyLayout,
      { phase: 'LEVEL_SELECT', completedLevels: [true, true, true], allLevelsUnlockedFromStart: true },
      tinyLayout.treasureButton.cx,
      tinyLayout.treasureButton.cy,
    ).id,
    'none',
  );
});

test('resolveCanvasTarget finds the start button on the parchment', () => {
  const target = resolveCanvasTarget(layout, { phase: 'START' }, layout.startButton.cx, layout.startButton.cy);
  assert.equal(target.id, 'start-button');
});

test('resolveCanvasTarget marks locked levels as locked targets', () => {
  const state = {
    phase: 'LEVEL_SELECT',
    completedLevels: [false, false, false],
    allLevelsUnlockedFromStart: false,
  };

  const target = resolveCanvasTarget(layout, state, layout.levelCards[1].cx, layout.levelCards[1].cy);
  assert.equal(target.id, 'level-1-locked');
});

test('resolveCanvasTarget returns unlocked level ids for clickable thumbnails', () => {
  const state = {
    phase: 'LEVEL_SELECT',
    completedLevels: [true, false, false],
    allLevelsUnlockedFromStart: false,
  };

  const target = resolveCanvasTarget(layout, state, layout.levelCards[1].cx, layout.levelCards[1].cy);
  assert.equal(target.id, 'level-1');
});

test('resolveCanvasTarget finds the treasure button target', () => {
  const state = {
    phase: 'LEVEL_SELECT',
    completedLevels: [true, true, true],
    allLevelsUnlockedFromStart: false,
  };

  const target = resolveCanvasTarget(layout, state, layout.treasureButton.cx, layout.treasureButton.cy);
  assert.equal(target.id, 'treasure-button');
});

test('resolveCanvasTarget does not expose an active treasure button before all levels are complete', () => {
  const state = {
    phase: 'LEVEL_SELECT',
    completedLevels: [true, false, true],
    allLevelsUnlockedFromStart: false,
  };

  const target = resolveCanvasTarget(layout, state, layout.treasureButton.cx, layout.treasureButton.cy);
  assert.equal(target.id, 'treasure-button-locked');
});

test('getCursorForTarget maps canvas targets to cursor states', () => {
  assert.equal(getCursorForTarget({ id: 'level-2-locked' }), 'not-allowed');
  assert.equal(getCursorForTarget({ id: 'treasure-button-locked' }), 'not-allowed');
  assert.equal(getCursorForTarget({ id: 'level-0' }), 'pointer');
  assert.equal(getCursorForTarget({ id: 'none' }), 'default');
  assert.equal(getCursorForTarget({}), 'default');
  assert.equal(getCursorForTarget({ id: 42 }), 'default');
  assert.equal(getCursorForTarget({ id: 'mystery-target' }), 'default');
});

test('toCanvasPoint maps client coordinates into the target canvas resolution', () => {
  const point = toCanvasPoint(
    { clientX: 270, clientY: 390 },
    {
      getBoundingClientRect() {
        return { left: 100, top: 50, width: 340, height: 680 };
      },
    },
    680,
  );

  assert.deepEqual(point, { x: 340, y: 340 });
});

test('toCanvasPoint scales x and y independently for non-square logical dimensions', () => {
  const point = toCanvasPoint(
    { clientX: 330, clientY: 170 },
    {
      width: 800,
      height: 400,
      getBoundingClientRect() {
        return { left: 10, top: 20, width: 160, height: 80 };
      },
    },
  );

  assert.deepEqual(point, { x: 1600, y: 750 });
});

test('toCanvasPoint returns safe finite coordinates for zero-size or invalid DOM rects', () => {
  const point = toCanvasPoint(
    { clientX: 330, clientY: 170 },
    {
      width: 800,
      height: 400,
      getBoundingClientRect() {
        return { left: 10, top: 20, width: 0, height: Number.NaN };
      },
    },
  );

  assert.deepEqual(point, { x: 0, y: 0 });
  assert.equal(Number.isFinite(point.x), true);
  assert.equal(Number.isFinite(point.y), true);
});

test('isPointInsideExpandedRect respects proximity padding', () => {
  const rect = { x: 10, y: 10, w: 100, h: 40 };

  assert.equal(isPointInsideExpandedRect(rect, 0, 0, 24), true);
  assert.equal(isPointInsideExpandedRect(rect, 220, 120, 24), false);
});

test('shouldHideSpeedTray keeps tray open inside expanded bounds and hides it outside', () => {
  const bounds = { x: 20, y: 30, w: 120, h: 50 };

  assert.equal(shouldHideSpeedTray(bounds, { x: 12, y: 24 }), false);
  assert.equal(shouldHideSpeedTray(bounds, { x: 200, y: 120 }), true);
});
