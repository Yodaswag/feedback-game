# Feedback Game V3 Modifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `v3/` so the game uses a larger square canvas, a unified parchment-first UI flow, clearer feedback popups, a late-level assist mode, pause/audio controls, and the `v2`-style end screen.

**Architecture:** Keep `v3` as a standalone canvas game, but move interaction math out of `main.js` into a small `v3/js/ui.js` helper so canvas hit-testing, hover states, and utility-panel behavior are deterministic and testable. Add a small `v3/js/audio.js` module for SFX + mute state, and route final completion through a single `END` screen instead of the current split `END` / `TREASURE_WIN` flow.

**Tech Stack:** Vanilla JS ES modules, HTML5 Canvas, DOM utility controls, Node.js built-in test runner (`node --test`)

---

## File Structure

- Modify: `v3/index.html`
  Adds larger canvas dimensions, utility controls (`pause`, `mute`, `speed`), and leaves the mood overlay intact.
- Modify: `v3/style.css`
  Expands the square shell, ports the utility-cluster styling from `old/`, and adds hover/pause/utility tray presentation.
- Create: `v3/js/ui.js`
  Owns canvas layout math, hit-testing, cursor mapping, and speed-tray proximity logic.
- Create: `v3/js/audio.js`
  Owns SFX loading, mute state, and safe playback after the first user gesture.
- Modify: `v3/js/constants.js`
  Increases `CANVAS_SIZE`, adds assist-mode timing/bias constants, and adds utility layout constants.
- Modify: `v3/js/state.js`
  Adds per-level elapsed time, hover target, pause state, and end-flow cleanup.
- Modify: `v3/js/main.js`
  Wires pointer movement, pause/audio controls, assist mode, popup close clicks, and final screen routing.
- Modify: `v3/js/renderer.js`
  Rebuilds the start / level-select parchment shell, shared primary button styling, hover growth, pause overlay, and removes the bespoke treasure-win screen.
- Modify: `v3/js/feedback.js`
  Moves the compass to the right of `המצפן אומר`, adds inline status icons, and adds a true close `X`.
- Modify: `v3/js/levels.js`
  Normalizes all chest wording to `תיבה/תיבות/תיבת אוצר`, fixes feminine Hebrew, and keeps popup bodies aligned with the new popup layout.
- Modify: `v3/js/items.js`
  Adds late-level assist spawning so wrong items hug the lower edge while correct items dominate after 50 seconds.
- Modify: `v3/js/transitions.js`
  Keeps the `v2` reflective end screen as the only final screen used after treasure completion.
- Modify: `package.json`
  Adds a `test:v3` script.
- Create: `v3/tests/ui.test.mjs`
  Covers hitboxes, hover targets, locked-level cursor behavior, and speed-tray proximity.
- Create: `v3/tests/audio.test.mjs`
  Covers mute toggling and gesture-armed playback guards.
- Create: `v3/tests/state.test.mjs`
  Covers pause state, elapsed-time tracking, and end-state routing.
- Create: `v3/tests/spawn.test.mjs`
  Covers the 50-second assist mode and lower-edge wrong-item placement.
- Create: `v3/tests/levels.test.mjs`
  Guards the Hebrew text rules so `ארגז` does not return.
- Create: `assets/sfx/`
  Place exact SFX files here: `button-click.mp3`, `collect-correct.mp3`, `collect-wrong.mp3`, `level-complete.mp3`, `pause-open.mp3`, `pause-close.mp3`, `treasure-win.mp3`.
- Create: `assets/sfx/ATTRIBUTION.md`
  Records the free-license source for every downloaded sound.

---

### Task 1: Add a V3 Test Harness and Centralized UI Layout Helpers

**Files:**
- Create: `v3/js/ui.js`
- Create: `v3/tests/ui.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing UI helper tests**

```js
// v3/tests/ui.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createCanvasLayout,
  resolveCanvasTarget,
  getCursorForTarget,
  isPointInsideExpandedRect,
} from '../js/ui.js';

const layout = createCanvasLayout(680);

test('createCanvasLayout returns a larger shared parchment card', () => {
  assert.equal(layout.canvasSize, 680);
  assert.ok(layout.sharedPage.w >= 600);
  assert.ok(layout.sharedPage.h >= 560);
});

test('resolveCanvasTarget finds the start button on the parchment', () => {
  const target = resolveCanvasTarget(layout, { phase: 'START' }, layout.startButton.cx, layout.startButton.cy);
  assert.equal(target.id, 'start-button');
});

test('resolveCanvasTarget marks locked levels as locked targets', () => {
  const state = { phase: 'LEVEL_SELECT', completedLevels: [false, false, false], allLevelsUnlockedFromStart: false };
  const target = resolveCanvasTarget(layout, state, layout.levelCards[1].cx, layout.levelCards[1].cy);
  assert.equal(target.id, 'level-1-locked');
});

test('getCursorForTarget returns not-allowed for locked levels', () => {
  assert.equal(getCursorForTarget({ id: 'level-2-locked' }), 'not-allowed');
  assert.equal(getCursorForTarget({ id: 'level-0' }), 'pointer');
});

test('isPointInsideExpandedRect uses expanded tray proximity', () => {
  const rect = { x: 10, y: 10, w: 100, h: 40 };
  assert.equal(isPointInsideExpandedRect(rect, 0, 0, 24), true);
  assert.equal(isPointInsideExpandedRect(rect, 220, 120, 24), false);
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `node --test v3/tests/ui.test.mjs`

Expected: FAIL with `Cannot find module '../js/ui.js'`

- [ ] **Step 3: Create `v3/js/ui.js`**

```js
// v3/js/ui.js
export function createCanvasLayout(canvasSize) {
  const sharedPage = {
    x: 24,
    y: 18,
    w: canvasSize - 48,
    h: canvasSize - 36,
  };

  const startButton = {
    x: sharedPage.x + 150,
    y: sharedPage.y + sharedPage.h - 118,
    w: sharedPage.w - 300,
    h: 56,
  };

  const levelCards = [
    { index: 0, cx: sharedPage.x + sharedPage.w - 120, cy: sharedPage.y + 260, w: 150, h: 190 },
    { index: 1, cx: sharedPage.x + sharedPage.w / 2,   cy: sharedPage.y + 260, w: 150, h: 190 },
    { index: 2, cx: sharedPage.x + 120,                cy: sharedPage.y + 260, w: 150, h: 190 },
  ];

  const treasureButton = {
    x: sharedPage.x + 70,
    y: sharedPage.y + sharedPage.h - 92,
    w: sharedPage.w - 140,
    h: 54,
  };

  return {
    canvasSize,
    sharedPage,
    startButton: toCenterRect(startButton),
    levelCards,
    treasureButton: toCenterRect(treasureButton),
  };
}

export function resolveCanvasTarget(layout, state, x, y) {
  if (state.phase === 'START' && inside(layout.startButton, x, y)) {
    return { id: 'start-button' };
  }

  if (state.phase === 'LEVEL_SELECT') {
    for (const card of layout.levelCards) {
      const rect = centered(card);
      if (!inside(rect, x, y)) continue;
      const unlocked = card.index === 0 || state.allLevelsUnlockedFromStart || state.completedLevels[card.index - 1] === true;
      return { id: unlocked ? `level-${card.index}` : `level-${card.index}-locked`, levelIndex: card.index };
    }
    if (inside(layout.treasureButton, x, y)) return { id: 'treasure-button' };
  }

  return { id: 'none' };
}

export function getCursorForTarget(target) {
  if (!target || target.id === 'none') return 'default';
  if (target.id.endsWith('-locked')) return 'not-allowed';
  return 'pointer';
}

export function isPointInsideExpandedRect(rect, x, y, pad = 0) {
  return x >= rect.x - pad && x <= rect.x + rect.w + pad && y >= rect.y - pad && y <= rect.y + rect.h + pad;
}

function inside(rect, x, y) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function centered(card) {
  return { x: card.cx - card.w / 2, y: card.cy - card.h / 2, w: card.w, h: card.h };
}

function toCenterRect(rect) {
  return { ...rect, cx: rect.x + rect.w / 2, cy: rect.y + rect.h / 2 };
}
```

- [ ] **Step 4: Add a dedicated v3 test script**

```json
{
  "type": "module",
  "scripts": {
    "test": "node --test",
    "test:v3": "node --test v3/tests/*.test.mjs"
  }
}
```

- [ ] **Step 5: Re-run the tests**

Run: `npm run test:v3 -- --test-name-pattern="ui"`

Expected: PASS for all tests in `v3/tests/ui.test.mjs`

- [ ] **Step 6: Commit**

```bash
git add package.json v3/js/ui.js v3/tests/ui.test.mjs
git commit -m "test: add v3 ui layout helpers"
```

---

### Task 2: Enlarge the Square Canvas and Unify the Start / Level-Select Parchment

**Files:**
- Modify: `v3/index.html`
- Modify: `v3/style.css`
- Modify: `v3/js/constants.js`
- Modify: `v3/js/renderer.js`
- Modify: `v3/js/main.js`

- [ ] **Step 1: Increase the canvas and wrapper size**

```html
<!-- v3/index.html -->
<div id="game-wrapper">
  <canvas id="game-canvas" width="680" height="680"></canvas>
  <div id="mood-overlay" class="ui-layer hidden">
```

```css
/* v3/style.css */
#game-wrapper {
  position: relative;
  width: 680px;
  height: 680px;
}

#game-canvas {
  display: block;
  width: 680px;
  height: 680px;
  cursor: default;
}
```

```js
// v3/js/constants.js
export const CANVAS_SIZE = 680;
export const UI_PROXIMITY_PAD = 24;
```

- [ ] **Step 2: Create a shared parchment-shell renderer**

```js
// v3/js/renderer.js
function drawSharedPage(ctx, images, layout) {
  const page = images['tattered-page'];
  const { x, y, w, h } = layout.sharedPage;
  if (page) {
    ctx.drawImage(page, x, y, w, h);
  } else {
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(x, y, w, h);
  }
  return layout.sharedPage;
}
```

- [ ] **Step 3: Rebuild the start screen to live entirely on the shared page**

```js
// v3/js/renderer.js
export function drawStartScreen(ctx, images, layout, hoverTarget) {
  drawBackground(ctx, images);
  const page = drawSharedPage(ctx, images, layout);
  const cx = page.x + page.w / 2;

  ctx.fillStyle = BLUE_DARK;
  ctx.font = FONT(34, true);
  ctx.textAlign = 'center';
  ctx.fillText('הפלגת המשובים', cx, page.y + 150);

  ctx.fillStyle = BLUE_MID;
  ctx.font = FONT(18);
  ctx.fillText('בחרו שלב, אספו את הפריט הנכון 3 פעמים ברצף, ולמדו מן המשוב.', cx, page.y + 220);

  drawPrimaryButton(ctx, layout.startButton, 'לחץ להתחלה', hoverTarget?.id === 'start-button');
}
```

- [ ] **Step 4: Rebuild the level-select screen to reuse the same parchment**

```js
// v3/js/renderer.js
export function drawLevelSelectScreen(ctx, images, state, layout, hoverTarget) {
  drawBackground(ctx, images);
  const page = drawSharedPage(ctx, images, layout);

  ctx.fillStyle = BLUE_DARK;
  ctx.font = FONT(26, true);
  ctx.textAlign = 'center';
  ctx.fillText('בחירת שלב', page.x + page.w / 2, page.y + 54);

  ctx.fillStyle = '#3c2716';
  ctx.font = FONT(16, true);
  ctx.fillText('כל בחירת שלב והאינטראקציות שלה נשארות על גבי הדף הקרוע', page.x + page.w / 2, page.y + 92);
}
```

- [ ] **Step 5: Route renderer calls through the new layout**

```js
// v3/js/main.js
import { createCanvasLayout } from './ui.js';

const layout = createCanvasLayout(CANVAS_SIZE);

case PHASE.START:
  Renderer.drawStartScreen(ctx, Assets.images, layout, state.hoverTarget);
  break;

case PHASE.LEVEL_SELECT:
  Renderer.drawLevelSelectScreen(ctx, Assets.images, state, layout, state.hoverTarget);
  break;
```

- [ ] **Step 6: Verify the larger shell manually**

Run: `start v3/index.html`

Expected:
- The square is visibly larger than the current 600×600 game.
- The parchment fills almost the whole screen in both `START` and `LEVEL_SELECT`.
- No background swap happens between the first screen and level select.

- [ ] **Step 7: Commit**

```bash
git add v3/index.html v3/style.css v3/js/constants.js v3/js/renderer.js v3/js/main.js
git commit -m "feat: enlarge v3 canvas and unify parchment shell"
```

---

### Task 3: Make the Start CTA and Treasure CTA Use the Same Button Language, and Add Hover / Cursor Feedback

**Files:**
- Modify: `v3/js/renderer.js`
- Modify: `v3/js/main.js`
- Modify: `v3/js/state.js`
- Modify: `v3/tests/ui.test.mjs`

- [ ] **Step 1: Add failing hover-target tests**

```js
test('resolveCanvasTarget returns unlocked level ids for clickable thumbnails', () => {
  const state = { phase: 'LEVEL_SELECT', completedLevels: [true, false, false], allLevelsUnlockedFromStart: false };
  const target = resolveCanvasTarget(layout, state, layout.levelCards[1].cx, layout.levelCards[1].cy);
  assert.equal(target.id, 'level-1');
});

test('treasure button remains clickable even when styled like the primary button', () => {
  const state = { phase: 'LEVEL_SELECT', completedLevels: [true, true, true], allLevelsUnlockedFromStart: false };
  const target = resolveCanvasTarget(layout, state, layout.treasureButton.cx, layout.treasureButton.cy);
  assert.equal(target.id, 'treasure-button');
});
```

- [ ] **Step 2: Track the current hover target in state**

```js
// v3/js/state.js
export function createInitialState(allUnlocked = false) {
  return {
    phase: PHASE.START,
    hoverTarget: { id: 'none' },
    // ...
  };
}

export function setHoverTarget(state, hoverTarget) {
  return { ...state, hoverTarget };
}
```

- [ ] **Step 3: Add a shared primary button painter**

```js
// v3/js/renderer.js
function drawPrimaryButton(ctx, rect, label, hovered, disabled = false) {
  const scale = hovered && !disabled ? 1.035 : 1;
  const w = rect.w * scale;
  const h = rect.h * scale;
  const x = rect.cx - w / 2;
  const y = rect.cy - h / 2;

  ctx.save();
  ctx.fillStyle = disabled ? 'rgba(119, 146, 171, 0.45)' : '#4a90c4';
  ctx.strokeStyle = disabled ? 'rgba(26, 63, 111, 0.45)' : '#1a3f6f';
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, x, y, w, h, 14, true, true);
  ctx.fillStyle = '#ffffff';
  ctx.font = FONT(18, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.cx, rect.cy);
  ctx.restore();
}
```

- [ ] **Step 4: Reuse that button for both CTAs**

```js
// v3/js/renderer.js
drawPrimaryButton(ctx, layout.startButton, 'לחץ להתחלה', hoverTarget?.id === 'start-button');

const treasureDisabled = !state.completedLevels.every(Boolean);
drawPrimaryButton(
  ctx,
  layout.treasureButton,
  'השלימו את כל 3 השלבים על מנת לקבל את האוצר',
  hoverTarget?.id === 'treasure-button',
  treasureDisabled,
);
```

- [ ] **Step 5: Add hover growth and cursor switching for level cards**

```js
// v3/js/main.js
canvas.addEventListener('pointermove', (e) => {
  const point = toCanvasPoint(e, canvas, CANVAS_SIZE);
  const hoverTarget = resolveCanvasTarget(layout, state, point.x, point.y);
  state = State.setHoverTarget(state, hoverTarget);
  canvas.style.cursor = getCursorForTarget(hoverTarget);
});

canvas.addEventListener('mouseleave', () => {
  state = State.setHoverTarget(state, { id: 'none' });
  canvas.style.cursor = 'default';
});
```

```js
// v3/js/renderer.js
const hovered = hoverTarget?.id === `level-${t.index}`;
const thumbScale = hovered ? 1.04 : 1;
const thumbW = 150 * thumbScale;
const thumbH = 190 * thumbScale;
```

- [ ] **Step 6: Re-run v3 UI tests**

Run: `npm run test:v3 -- --test-name-pattern="resolveCanvasTarget|getCursorForTarget"`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add v3/js/renderer.js v3/js/main.js v3/js/state.js v3/tests/ui.test.mjs
git commit -m "feat: add shared button styling and level hover states"
```

---

### Task 4: Rework the Feedback Popup Layout and Normalize Chest Terminology

**Files:**
- Modify: `v3/js/feedback.js`
- Modify: `v3/js/levels.js`
- Modify: `v3/js/state.js`
- Create: `v3/tests/levels.test.mjs`
- Modify: `v3/js/main.js`

- [ ] **Step 1: Write failing copy-regression tests**

```js
// v3/tests/levels.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import LEVELS from '../js/levels.js';

const allStrings = LEVELS.flatMap(level => [
  level.feedbackTypeDesc,
  level.revealCardText,
  level.transitionReveal,
  level.getFeedbackText({ type: 'chest-green', y: 200 }, false),
  level.getFeedbackText({ type: 'chest-ribbon', y: 120 }, true),
  level.getFeedbackText({ type: 'bomb-unlit', y: 420 }, true),
]);

test('no gameplay string contains the forbidden chest term', () => {
  for (const text of allStrings) {
    assert.equal(text.includes('ארגז'), false, text);
    assert.equal(text.includes('ארגזים'), false, text);
  }
});

test('feminine chest grammar is preserved', () => {
  const joined = allStrings.join(' ');
  assert.equal(joined.includes('תיבה ירוקה'), true);
  assert.equal(joined.includes('תיבה צפה'), true);
  assert.equal(joined.includes('תיבה בטוחה'), true);
});
```

- [ ] **Step 2: Run the tests to confirm current copy fails**

Run: `node --test v3/tests/levels.test.mjs`

Expected: FAIL because current strings still contain `הארגז` / `הארגזים`

- [ ] **Step 3: Rebuild the popup header and status row**

```js
// v3/js/feedback.js
export function drawPopup(ctx, images, popup, hoverTarget) {
  const { text, isCorrect } = popup;
  const titleText = 'המצפן אומר';
  const statusLabel = isCorrect ? 'נכון' : 'לא נכון';
  const statusIcon = isCorrect ? '✓' : '✕';

  drawPopupCard(ctx, images);
  drawCloseGlyph(ctx, hoverTarget?.id === 'feedback-close');

  // Compass sits visually to the right of the text in RTL layout.
  drawPopupTitle(ctx, images['compass'], titleText);
  drawStatusRow(ctx, statusLabel, statusIcon, isCorrect);
  drawPopupBody(ctx, stripStatusPrefix(text, statusLabel));
}
```

- [ ] **Step 4: Add a real close target for the popup**

```js
// v3/js/feedback.js
export function getPopupCloseRect() {
  return {
    x: POPUP_X + POPUP_W - 42,
    y: POPUP_Y + 12,
    w: 28,
    h: 28,
  };
}
```

```js
// v3/js/state.js
export function dismissPopup(state) {
  return {
    ...state,
    phase: PHASE.PLAYING,
    activePopup: null,
    popupTimer: 0,
  };
}
```

```js
// v3/js/main.js
if (state.phase === PHASE.FEEDBACK && state.activePopup && state.hoverTarget?.id === 'feedback-close') {
  state = State.dismissPopup(state);
  return;
}
```

- [ ] **Step 5: Normalize all chest strings in `v3/js/levels.js`**

```js
// examples in v3/js/levels.js
if (item.type === ITEM.CHEST_GREEN) return 'שגיאה! תיבה ירוקה — מלכודת.';

return 'מצוין! תיבה מעל קו המים — כלל: תיבה צפה מעל = תיבת אוצר אמיתית. חפשו תיבות בחצי העליון!';

return 'טעות! התיבה הייתה מתחת לקו המים — שם היא מלכודת. כלל: תיבה מעל קו המים בלבד!';

transitionReveal:
  'מעל קו המים — תיבה בטוחה, פצצה מסוכנת. מתחת לקו המים — פצצה כבויה בטוחה, תיבה היא מלכודת. המיקום קובע הכול!',
```

- [ ] **Step 6: Re-run the popup/copy tests**

Run: `npm run test:v3 -- --test-name-pattern="forbidden chest term|feminine chest grammar"`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add v3/js/feedback.js v3/js/levels.js v3/js/state.js v3/tests/levels.test.mjs v3/js/main.js
git commit -m "feat: refine popup semantics and normalize chest wording"
```

---

### Task 5: Add the 50-Second Assist Mode That Biases Toward Correct Items

**Files:**
- Modify: `v3/js/constants.js`
- Modify: `v3/js/state.js`
- Modify: `v3/js/items.js`
- Modify: `v3/js/main.js`
- Create: `v3/tests/spawn.test.mjs`

- [ ] **Step 1: Write failing assist-mode tests**

```js
// v3/tests/spawn.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import LEVELS from '../js/levels.js';
import { pickItemType } from '../js/items.js';
import {
  ITEM,
  LEVEL_ASSIST_DELAY_MS,
  ASSIST_WRONG_EDGE_MIN_Y,
  ITEM_SPAWN_MAX_Y,
} from '../js/constants.js';

test('assist mode biases toward correct items after 50 seconds', () => {
  const level = LEVELS[0];
  let correct = 0;
  let wrong = 0;

  for (let i = 0; i < 600; i++) {
    const pick = pickItemType(level.spawnPool, {
      recentSpawnHistory: [],
      incorrectStreak: 0,
      level,
      levelElapsedMs: LEVEL_ASSIST_DELAY_MS + 1,
    });
    if (level.correctSpawnOptions.some(opt => opt.type === pick.type)) correct++;
    else wrong++;
  }

  assert.ok(correct > wrong * 2, `correct=${correct}, wrong=${wrong}`);
});

test('assist mode pushes wrong items to the lower edge', () => {
  const level = LEVELS[1];
  const pick = pickItemType(level.spawnPool, {
    recentSpawnHistory: [],
    incorrectStreak: 0,
    level,
    levelElapsedMs: LEVEL_ASSIST_DELAY_MS + 1,
    random: () => 0.99,
  });

  if (!level.correctSpawnOptions.some(opt => opt.type === pick.type)) {
    assert.deepEqual(pick.yRange, [ASSIST_WRONG_EDGE_MIN_Y, ITEM_SPAWN_MAX_Y]);
  }
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test v3/tests/spawn.test.mjs`

Expected: FAIL because `levelElapsedMs` and assist constants do not exist yet

- [ ] **Step 3: Add explicit assist-mode constants**

```js
// v3/js/constants.js
export const LEVEL_ASSIST_DELAY_MS = 50000;
export const ASSIST_CORRECT_WEIGHT = 0.78;
export const ASSIST_WRONG_EDGE_HEIGHT = 84;
export const ASSIST_WRONG_EDGE_MIN_Y = ITEM_SPAWN_MAX_Y - ASSIST_WRONG_EDGE_HEIGHT;
```

- [ ] **Step 4: Track per-level elapsed time in state**

```js
// v3/js/state.js
export function createInitialState(allUnlocked = false) {
  return {
    // ...
    levelElapsedMs: 0,
  };
}

export function tickLevelTimer(state, deltaMs) {
  return { ...state, levelElapsedMs: state.levelElapsedMs + deltaMs };
}
```

- [ ] **Step 5: Update `pickItemType` to support assist mode**

```js
// v3/js/items.js
if (levelElapsedMs >= LEVEL_ASSIST_DELAY_MS) {
  const correctOptions = level.correctSpawnOptions ?? [];
  const wrongOptions = spawnPool.filter(entry => !correctOptions.some(opt => opt.type === entry.type));

  if (random() < ASSIST_CORRECT_WEIGHT && correctOptions.length > 0) {
    const forced = correctOptions[Math.floor(random() * correctOptions.length)];
    return { type: forced.type, yRange: forced.yRange };
  }

  const wrong = wrongOptions[Math.floor(random() * wrongOptions.length)];
  return {
    type: wrong.type,
    yRange: [ASSIST_WRONG_EDGE_MIN_Y, ITEM_SPAWN_MAX_Y],
  };
}
```

- [ ] **Step 6: Advance the level timer from the main loop**

```js
// v3/js/main.js
if (state.phase === PHASE.PLAYING && !state.isPaused) {
  state = State.tickLevelTimer(state, deltaMs);
}

function spawnContext(state, level) {
  return {
    recentSpawnHistory: state.recentSpawnHistory,
    incorrectStreak: state.incorrectStreak,
    level,
    levelElapsedMs: state.levelElapsedMs,
  };
}
```

- [ ] **Step 7: Re-run assist tests**

Run: `npm run test:v3 -- --test-name-pattern="assist mode"`

Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add v3/js/constants.js v3/js/state.js v3/js/items.js v3/js/main.js v3/tests/spawn.test.mjs
git commit -m "feat: add 50-second assist spawning"
```

---

### Task 6: Add a Pause Button and Pause Overlay That Resumes on Click or Arrow-Key Touch

**Files:**
- Modify: `v3/index.html`
- Modify: `v3/style.css`
- Modify: `v3/js/state.js`
- Modify: `v3/js/main.js`
- Modify: `v3/js/renderer.js`
- Create: `v3/tests/state.test.mjs`

- [ ] **Step 1: Write failing pause-state tests**

```js
// v3/tests/state.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, setPaused, resumeFromPause } from '../js/state.js';

test('setPaused stores a paused flag and source phase', () => {
  const paused = setPaused({ ...createInitialState(), phase: 'PLAYING' }, true);
  assert.equal(paused.isPaused, true);
  assert.equal(paused.pausedFromPhase, 'PLAYING');
});

test('resumeFromPause clears paused flag and restores phase', () => {
  const paused = {
    ...createInitialState(),
    phase: 'PLAYING',
    isPaused: true,
    pausedFromPhase: 'PLAYING',
  };
  const resumed = resumeFromPause(paused);
  assert.equal(resumed.isPaused, false);
  assert.equal(resumed.pausedFromPhase, null);
  assert.equal(resumed.phase, 'PLAYING');
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `node --test v3/tests/state.test.mjs`

Expected: FAIL because pause helpers do not exist yet

- [ ] **Step 3: Add pause state helpers**

```js
// v3/js/state.js
export function setPaused(state, paused) {
  if (paused) {
    return { ...state, isPaused: true, pausedFromPhase: state.phase };
  }
  return resumeFromPause(state);
}

export function resumeFromPause(state) {
  return {
    ...state,
    isPaused: false,
    pausedFromPhase: null,
  };
}
```

- [ ] **Step 4: Add the pause button to the DOM utility cluster**

```html
<!-- v3/index.html -->
<div class="utility-cluster">
  <button id="pauseBtn" class="utility-btn" type="button" aria-pressed="false" aria-label="השהיה">⏸</button>
  <button id="muteBtn" class="utility-btn mute-btn" type="button" aria-pressed="false" aria-label="השתק">🔊</button>
  <button id="speedBtn" class="utility-btn speed-btn" type="button" aria-pressed="false" aria-label="מהירות">⚡</button>
</div>
```

- [ ] **Step 5: Freeze gameplay while paused and resume from click / arrows**

```js
// v3/js/main.js
document.addEventListener('keydown', (e) => {
  Input.onKeyDown(e);
  if (state.isPaused && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    state = State.resumeFromPause(state);
  }
});

canvas.addEventListener('click', (e) => {
  if (state.isPaused) {
    state = State.resumeFromPause(state);
    return;
  }
});

function update(deltaMs) {
  if (state.isPaused) return;
  // existing update logic...
}
```

- [ ] **Step 6: Draw a full pause overlay on top of the frozen frame**

```js
// v3/js/renderer.js
export function drawPauseOverlay(ctx) {
  ctx.save();
  ctx.fillStyle = 'rgba(20, 15, 10, 0.55)';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillStyle = '#f5e6c8';
  ctx.font = FONT(34, true);
  ctx.textAlign = 'center';
  ctx.fillText('המשחק בהשהיה', CANVAS_SIZE / 2, CANVAS_SIZE / 2 - 20);
  ctx.font = FONT(18, false);
  ctx.fillText('לחצו בכל מקום או געו בחצי המקלדת כדי להמשיך', CANVAS_SIZE / 2, CANVAS_SIZE / 2 + 28);
  ctx.restore();
}
```

- [ ] **Step 7: Re-run pause tests and a quick manual smoke test**

Run: `npm run test:v3 -- --test-name-pattern="Paused|pause"`

Expected:
- PASS in `v3/tests/state.test.mjs`
- Manual: clicking `⏸` freezes items immediately; any canvas click or arrow key resumes

- [ ] **Step 8: Commit**

```bash
git add v3/index.html v3/style.css v3/js/state.js v3/js/main.js v3/js/renderer.js v3/tests/state.test.mjs
git commit -m "feat: add pause overlay and resume gestures"
```

---

### Task 7: Add Free SFX, a Mute Button, and an Auto-Closing Speed Tray

**Files:**
- Create: `v3/js/audio.js`
- Modify: `v3/js/constants.js`
- Modify: `v3/index.html`
- Modify: `v3/style.css`
- Modify: `v3/js/state.js`
- Modify: `v3/js/main.js`
- Modify: `v3/js/ui.js`
- Create: `v3/tests/audio.test.mjs`
- Modify: `v3/tests/state.test.mjs`
- Create: `assets/sfx/ATTRIBUTION.md`

- [ ] **Step 1: Write failing audio tests**

```js
// v3/tests/audio.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudioController } from '../js/audio.js';

test('mute toggle flips state', () => {
  const audio = createAudioController(() => ({ play() {} }));
  assert.equal(audio.isMuted(), false);
  audio.toggleMute();
  assert.equal(audio.isMuted(), true);
});

test('play does nothing before arm()', () => {
  let played = 0;
  const audio = createAudioController(() => ({ play() { played++; } }));
  audio.play('button-click');
  assert.equal(played, 0);
  audio.arm();
  audio.play('button-click');
  assert.equal(played, 1);
});
```

```js
// v3/tests/state.test.mjs
import { setSpeedMultiplier } from '../js/state.js';

test('setSpeedMultiplier clamps to supported range', () => {
  const base = createInitialState();
  assert.equal(setSpeedMultiplier(base, 0.1).speedMultiplier, 0.5);
  assert.equal(setSpeedMultiplier(base, 9).speedMultiplier, 3);
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `node --test v3/tests/audio.test.mjs`

Expected: FAIL with `Cannot find module '../js/audio.js'`

- [ ] **Step 3: Create the audio controller**

```js
// v3/js/audio.js
const SOUND_FILES = Object.freeze({
  'button-click': 'assets/sfx/button-click.mp3',
  'collect-correct': 'assets/sfx/collect-correct.mp3',
  'collect-wrong': 'assets/sfx/collect-wrong.mp3',
  'level-complete': 'assets/sfx/level-complete.mp3',
  'pause-open': 'assets/sfx/pause-open.mp3',
  'pause-close': 'assets/sfx/pause-close.mp3',
  'treasure-win': 'assets/sfx/treasure-win.mp3',
});

export function createAudioController(makeAudio = (src) => new Audio(src)) {
  let muted = false;
  let armed = false;

  return {
    arm() { armed = true; },
    isMuted() { return muted; },
    toggleMute() { muted = !muted; return muted; },
    play(key) {
      if (!armed || muted || !SOUND_FILES[key]) return;
      const node = makeAudio(SOUND_FILES[key]);
      node.currentTime = 0;
      node.volume = 0.7;
      node.play?.().catch?.(() => {});
    },
  };
}
```

- [ ] **Step 4: Add explicit speed multiplier state and constants**

```js
// v3/js/constants.js
export const MIN_SPEED_MULTIPLIER = 0.5;
export const MAX_SPEED_MULTIPLIER = 3;
```

```js
// v3/js/state.js
import { MIN_SPEED_MULTIPLIER, MAX_SPEED_MULTIPLIER } from './constants.js';

export function createInitialState(allUnlocked = false) {
  return {
    // ...
    speedMultiplier: 1,
  };
}

export function setSpeedMultiplier(state, speedMultiplier) {
  return {
    ...state,
    speedMultiplier: Math.max(MIN_SPEED_MULTIPLIER, Math.min(MAX_SPEED_MULTIPLIER, speedMultiplier)),
  };
}
```

- [ ] **Step 5: Port the old utility cluster and add an expanded speed-tray hit area**

```html
<!-- v3/index.html -->
<div id="speedTrayProximity" class="speed-tray-proximity hidden">
  <div id="speedTray" class="speed-tray hidden">
    <span class="speed-symbol">⚡</span>
    <input id="speedSlider" type="range" min="0.5" max="3" step="0.1" value="1">
    <span id="speedValue">×1.0</span>
  </div>
</div>
```

```css
/* v3/style.css */
.speed-tray-proximity {
  position: absolute;
  left: 0.5rem;
  bottom: 0.5rem;
  width: 340px;
  height: 120px;
  z-index: 21;
}
```

- [ ] **Step 6: Add speed-tray proximity logic**

```js
// v3/js/ui.js
export function shouldHideSpeedTray(bounds, point) {
  return !isPointInsideExpandedRect(bounds, point.x, point.y, 18);
}
```

```js
// v3/js/main.js
document.addEventListener('pointermove', (e) => {
  if (speedTray.classList.contains('hidden')) return;
  const rect = speedTray.getBoundingClientRect();
  if (shouldHideSpeedTray(
    { x: rect.left, y: rect.top, w: rect.width, h: rect.height },
    { x: e.clientX, y: e.clientY },
  )) {
    speedTray.classList.add('hidden');
    speedTrayProximity.classList.add('hidden');
  }
});
```

- [ ] **Step 7: Make the speed slider actually affect gameplay**

```js
// v3/js/main.js
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');

speedSlider.addEventListener('input', () => {
  const next = Number(speedSlider.value);
  state = State.setSpeedMultiplier(state, next);
  speedValue.textContent = `×${state.speedMultiplier.toFixed(1)}`;
});

const deltaX = ITEM_SPEED * state.speedMultiplier * (deltaMs / 16.67);
state = State.updateItems(state, deltaX);

state = State.tickSpawnTimer(state, deltaMs * state.speedMultiplier);

const dy = Input.getShipDelta() * SHIP_SPEED * state.speedMultiplier;
```

- [ ] **Step 8: Wire pause/mute/speed sounds and controls from `main.js`**

```js
// v3/js/main.js
const audio = createAudioController();

canvas.addEventListener('pointerdown', () => audio.arm(), { once: true });

pauseBtn.addEventListener('click', () => {
  const nowPaused = !state.isPaused;
  state = State.setPaused(state, nowPaused);
  audio.play(nowPaused ? 'pause-open' : 'pause-close');
});

muteBtn.addEventListener('click', () => {
  const muted = audio.toggleMute();
  muteBtn.textContent = muted ? '🔇' : '🔊';
  muteBtn.setAttribute('aria-pressed', String(muted));
});

speedBtn.addEventListener('click', () => {
  speedTray.classList.toggle('hidden');
  speedTrayProximity.classList.toggle('hidden');
  audio.play('button-click');
});
```

- [ ] **Step 9: Place the sound files and attribution record**

```md
<!-- assets/sfx/ATTRIBUTION.md -->
# Feedback Game V3 SFX Attribution

- `button-click.mp3` — free SFX, commercial-use allowed
- `collect-correct.mp3` — free SFX, commercial-use allowed
- `collect-wrong.mp3` — free SFX, commercial-use allowed
- `level-complete.mp3` — free SFX, commercial-use allowed
- `pause-open.mp3` — free SFX, commercial-use allowed
- `pause-close.mp3` — free SFX, commercial-use allowed
- `treasure-win.mp3` — free SFX, commercial-use allowed
```

- [ ] **Step 10: Re-run tests and do a manual browser pass**

Run: `npm run test:v3 -- --test-name-pattern="mute|arm|speed|tray"`

Expected:
- PASS in `v3/tests/audio.test.mjs`
- PASS in `v3/tests/state.test.mjs` for speed clamping
- Manual: `⚡` tray closes when the pointer leaves the slightly larger proximity zone
- Manual: `🔊` toggles to `🔇`
- Manual: item motion, ship motion, and spawn cadence visibly react to the speed slider

- [ ] **Step 11: Commit**

```bash
git add v3/js/audio.js v3/js/constants.js v3/index.html v3/style.css v3/js/state.js v3/js/main.js v3/js/ui.js v3/tests/audio.test.mjs v3/tests/state.test.mjs assets/sfx/ATTRIBUTION.md
git commit -m "feat: add v3 audio controls and speed tray"
```

---

### Task 8: Replace the Current Treasure Screen with the V2-Style Reflective End Screen

**Files:**
- Modify: `v3/js/state.js`
- Modify: `v3/js/main.js`
- Modify: `v3/js/transitions.js`
- Modify: `v3/js/renderer.js`
- Modify: `v3/tests/state.test.mjs`

- [ ] **Step 1: Add failing end-flow tests**

```js
test('winTreasure routes to END instead of TREASURE_WIN', () => {
  const state = {
    ...createInitialState(),
    phase: 'LEVEL_SELECT',
    completedLevels: [true, true, true],
    levelResults: [
      { levelIndex: 0, mood: 'שמח' },
      { levelIndex: 1, mood: 'לא בטוח' },
      { levelIndex: 2, mood: 'מתרגש מאוד' },
    ],
  };
  const next = winTreasure(state);
  assert.equal(next.phase, 'END');
});
```

- [ ] **Step 2: Run the tests to confirm the current flow is wrong**

Run: `node --test v3/tests/state.test.mjs`

Expected: FAIL because `winTreasure()` still returns `TREASURE_WIN`

- [ ] **Step 3: Collapse the final reward flow into `PHASE.END`**

```js
// v3/js/state.js
export function winTreasure(state) {
  return {
    ...state,
    phase: PHASE.END,
  };
}
```

```js
// v3/js/constants.js
export const PHASE = Object.freeze({
  START: 'START',
  LEVEL_SELECT: 'LEVEL_SELECT',
  PLAYING: 'PLAYING',
  FEEDBACK: 'FEEDBACK',
  TRANSITION: 'TRANSITION',
  END: 'END',
});
```

- [ ] **Step 4: Remove the bespoke treasure-win renderer path**

```js
// v3/js/main.js
case PHASE.END:
  Renderer.drawBackground(ctx, Assets.images);
  Transitions.drawEndScreen(ctx, Assets.images, state.levelResults);
  break;
```

```js
// v3/js/renderer.js
// delete drawTreasureWinScreen()
```

- [ ] **Step 5: Keep the v2-style reflective screen as the only final screen**

```js
// v3/js/transitions.js
// port the v2 screen from docs/superpowers/plans/2026-05-16-feedback-game-v2.md:
// - draw the parchment card with a dark translucent wash
// - place a fixed happy pirate hero near the top-right
// - restore the compact dark summary strip near the bottom
// - keep the restart button inside that v2 layout
```

- [ ] **Step 6: Re-run end-flow tests and do a manual treasure-path smoke test**

Run: `npm run test:v3 -- --test-name-pattern="winTreasure|END"`

Expected:
- PASS in `v3/tests/state.test.mjs`
- Manual: after all 3 levels and clicking the treasure CTA, the `v2` reflective end screen appears instead of the current chest-only reward screen

- [ ] **Step 7: Commit**

```bash
git add v3/js/state.js v3/js/main.js v3/js/transitions.js v3/js/renderer.js v3/tests/state.test.mjs v3/js/constants.js
git commit -m "feat: restore v2-style final end screen"
```

---

### Task 9: Full Verification

**Files:**
- Verify: `v3/index.html`
- Verify: `v3/tests/*.test.mjs`

- [ ] **Step 1: Run the full v3 automated suite**

Run: `npm run test:v3`

Expected: PASS for `audio`, `levels`, `spawn`, `state`, and `ui`

- [ ] **Step 2: Run the legacy root suite to confirm no accidental spillover**

Run: `npm test`

Expected: PASS for the existing root tests

- [ ] **Step 3: Manual browser verification**

Run: `start v3/index.html`

Expected:
- Canvas is 680×680 and still square on desktop + mobile scaling
- Start parchment and level-select parchment share the same full-page look
- `לחץ להתחלה` looks like a rounded blue-white button
- Locked levels show `not-allowed`; unlocked levels grow slightly on hover
- Compass sits to the right of `המצפן אומר`
- `נכון` shows a nearby checkmark, `לא נכון` shows a nearby big red `X`
- Popup close `X` in top-right is brownish and clearly secondary
- No on-screen string uses `ארגז` / `ארגזים`
- After 50 seconds, wrong items hug the bottom edge and correct items dominate
- Pause opens and closes correctly by click or arrow-key touch
- `🔊` mute and `⚡` speed controls work, and the tray auto-closes when the pointer leaves the expanded zone
- The speed slider changes ship speed, item speed, and spawn cadence
- Final treasure action opens the reflective `v2`-style end screen

- [ ] **Step 4: Final commit**

```bash
git add .
git commit -m "feat: complete v3 polish, assist mode, and utility controls"
```

---

## Self-Review

**Spec coverage:** Covered canvas size, start / level-select parchment continuity, primary-button styling parity, level hover/cursor behavior, popup icon placement, close `X`, Hebrew terminology cleanup, 50-second assist mode, pause overlay, free SFX + mute/speed controls, tray auto-close, and end-screen replacement.

**Placeholder scan:** No `TODO`, `TBD`, or “implement later” markers remain. Every task names exact files, commands, and code targets.

**Type consistency:** `hoverTarget`, `levelElapsedMs`, `isPaused`, `pausedFromPhase`, `LEVEL_ASSIST_DELAY_MS`, `createAudioController`, `resolveCanvasTarget`, and `winTreasure()` use the same names across tasks.

Execution options, when requested later:
1. Subagent-driven implementation using `superpowers:subagent-driven-development`
2. Inline implementation using `superpowers:executing-plans`
