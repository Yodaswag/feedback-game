# Feedback Game Light Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unpack the monolithic game into maintainable ES modules, integrate the supplied watercolor art assets, and ship the redesigned feedback-learning loop with six required experiences and richer controls.

**Architecture:** Keep the existing educational loop, but split state, input, rendering, assets, UI, and bootstrapping into focused modules. Render all gameplay from local image assets, keep the ship on a fixed X coordinate, and expose compact utility controls through the DOM while keeping pure game behavior testable with Node’s built-in test runner.

**Tech Stack:** HTML, CSS, browser ES modules, Canvas 2D, Node built-in test runner

---

## Game Design and Purpose

The game teaches the difference among outcome, corrective, and elaborative feedback by making the player experience each feedback type after both good and bad choices. The player loop is:

1. choose feedback mode
2. sail vertically through the scene
3. collect treasure or collide with a bomb
4. read the selected feedback style
5. complete all six feedback-event combinations
6. unlock the final mission completion screen

The redesign is intentionally light: preserve the learning mechanic, replace placeholder visuals with supplied watercolor art, and improve maintainability without inventing a new game.

## File Structure

Create:

- `package.json` — ESM + test script
- `css/style.css` — extracted styling and redesigned UI tokens
- `js/assets.js` — asset URLs and preload helper
- `js/game-state.js` — pure state transitions
- `js/input.js` — input precedence and control-lane rules
- `js/renderer.js` — canvas drawing
- `js/ui.js` — DOM updates and utility-control wiring
- `js/main.js` — initialization and animation loop
- `tests/game-state.test.mjs` — checklist, score, speed tests
- `tests/input.test.mjs` — dead-zone, precedence, fixed-X tests

Modify:

- `index.html` — slim markup, local assets, module entrypoint
- `.gitignore` — ignore `.superpowers/`

Move/copy supplied assets into:

- `assets/images/arrow.png`
- `assets/images/background-texture.png`
- `assets/images/bomb.png`
- `assets/images/color-palette.png`
- `assets/images/ship.png`
- `assets/images/treasure-chest.png`
- `assets/images/water-background.png`

## UI Direction

Use the supplied art and restrained parchment styling:

- watercolor sea backdrop plus subtle paper texture
- ship locked to one X coordinate, moving only on Y
- positive item uses treasure chest art
- negative item uses bomb art
- left-side arrow controls reserve a non-mouse control lane
- bottom-left utility cluster:
  - circular amber mute button
  - circular amber lightning button
  - compact parchment-gold speed tray along the bottom edge
  - teal-filled horizontal slider track with gold thumb

`ColorPallete.png` becomes the reference source for CSS custom properties; it is not rendered in active gameplay.

### Task 1: Establish testable pure game state

**Files:**
- Create: `package.json`
- Create: `js/game-state.js`
- Create: `tests/game-state.test.mjs`

- [ ] **Step 1: Write failing tests for score, six-slot checklist, completion, and speed clamping**

```js
// tests/game-state.test.mjs
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/game-state.test.mjs`  
Expected: FAIL because `js/game-state.js` does not exist yet.

- [ ] **Step 3: Implement minimal pure state module**

```js
// js/game-state.js
export const FEEDBACK_MODES = ['outcome', 'corrective', 'elaborative'];
export const GOAL = 5;
export const MIN_SPEED = 0.5;
export const MAX_SPEED = 3;

export function createInitialState() {
  return {
    feedbackMode: 'outcome',
    itemsCollected: 0,
    speedMultiplier: 1,
    checklist: {
      outcome: { pos: false, neg: false },
      corrective: { pos: false, neg: false },
      elaborative: { pos: false, neg: false },
    },
  };
}

export function setFeedbackMode(state, feedbackMode) {
  if (!FEEDBACK_MODES.includes(feedbackMode)) return state;
  return { ...state, feedbackMode };
}

export function applyCollision(state, item) {
  const key = item.isGood ? 'pos' : 'neg';
  const delta = item.isGood ? 1 : -1;
  return {
    ...state,
    itemsCollected: Math.max(0, Math.min(GOAL, state.itemsCollected + delta)),
    checklist: {
      ...state.checklist,
      [state.feedbackMode]: {
        ...state.checklist[state.feedbackMode],
        [key]: true,
      },
    },
  };
}

export function setSpeedMultiplier(state, speedMultiplier) {
  return {
    ...state,
    speedMultiplier: Math.max(MIN_SPEED, Math.min(MAX_SPEED, speedMultiplier)),
  };
}

export function isMissionComplete(state) {
  return FEEDBACK_MODES.every((mode) => state.checklist[mode].pos && state.checklist[mode].neg);
}
```

```json
// package.json
{
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`  
Expected: PASS with 4 passing tests.

- [ ] **Step 5: Commit**

```bash
git add package.json js/game-state.js tests/game-state.test.mjs
git commit -m "feat: add pure game state model"
```

### Task 2: Add tested input policy for dual controls

**Files:**
- Create: `js/input.js`
- Create: `tests/input.test.mjs`

- [ ] **Step 1: Write failing tests for dead zone, keyboard precedence, clamping, and fixed X**

```js
// tests/input.test.mjs
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test tests/input.test.mjs`  
Expected: FAIL because `js/input.js` does not exist yet.

- [ ] **Step 3: Implement minimal input policy helpers**

```js
// js/input.js
export const SHIP_X = 120;
export const CONTROL_LANE_WIDTH = 90;
export const SHIP_PADDING = 60;

export function clampShipY(y, canvasHeight) {
  return Math.max(SHIP_PADDING, Math.min(canvasHeight - SHIP_PADDING, y));
}

export function shouldTrackMouse(mouseX, controlLaneWidth = CONTROL_LANE_WIDTH) {
  return mouseX > controlLaneWidth;
}

export function resolveShipY({
  currentY,
  mouseY,
  keyboardDirection,
  dt,
  speed,
  canvasHeight,
}) {
  if (keyboardDirection !== 0) {
    return clampShipY(currentY + keyboardDirection * speed * dt, canvasHeight);
  }
  return clampShipY(mouseY ?? currentY, canvasHeight);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`  
Expected: PASS with all game-state and input tests green.

- [ ] **Step 5: Commit**

```bash
git add js/input.js tests/input.test.mjs
git commit -m "feat: add dual input policy"
```

### Task 3: Localize and preload supplied visual assets

**Files:**
- Create: `js/assets.js`
- Create: `assets/images/*`
- Modify: `.gitignore`

- [ ] **Step 1: Write failing test for asset manifest completeness**

```js
// Add to tests/assets.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSET_URLS } from '../js/assets.js';

test('asset manifest exposes every supplied visual asset', () => {
  assert.deepEqual(Object.keys(ASSET_URLS).sort(), [
    'arrow',
    'backgroundTexture',
    'bomb',
    'colorPalette',
    'ship',
    'treasureChest',
    'waterBackground',
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/assets.test.mjs`  
Expected: FAIL because `js/assets.js` does not exist yet.

- [ ] **Step 3: Copy and normalize asset filenames**

```powershell
New-Item -ItemType Directory -Force assets/images | Out-Null
Copy-Item 'FeedbackGameAssets/Arrow.png' 'assets/images/arrow.png'
Copy-Item 'FeedbackGameAssets/background texture.png' 'assets/images/background-texture.png'
Copy-Item 'FeedbackGameAssets/Bomb.png' 'assets/images/bomb.png'
Copy-Item 'FeedbackGameAssets/ColorPallete.png' 'assets/images/color-palette.png'
Copy-Item 'FeedbackGameAssets/Ship.png' 'assets/images/ship.png'
Copy-Item 'FeedbackGameAssets/TreasureChest.png' 'assets/images/treasure-chest.png'
Copy-Item 'FeedbackGameAssets/Water background.png' 'assets/images/water-background.png'
```

- [ ] **Step 4: Implement asset manifest and preload helper**

```js
// js/assets.js
export const ASSET_URLS = {
  arrow: 'assets/images/arrow.png',
  backgroundTexture: 'assets/images/background-texture.png',
  bomb: 'assets/images/bomb.png',
  colorPalette: 'assets/images/color-palette.png',
  ship: 'assets/images/ship.png',
  treasureChest: 'assets/images/treasure-chest.png',
  waterBackground: 'assets/images/water-background.png',
};

export function preloadImages(urls = ASSET_URLS) {
  return Promise.all(Object.entries(urls).map(([key, src]) => new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve([key, image]);
    image.onerror = () => resolve([key, null]);
    image.src = src;
  }))).then((entries) => Object.fromEntries(entries));
}
```

- [ ] **Step 5: Ignore visual-companion scratch files**

```gitignore
.superpowers/
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test`  
Expected: PASS including the asset manifest test.

- [ ] **Step 7: Commit**

```bash
git add .gitignore js/assets.js tests/assets.test.mjs assets/images
git commit -m "feat: add local art asset manifest"
```

### Task 4: Unpack markup, styling, and UI behavior

**Files:**
- Modify: `index.html`
- Create: `css/style.css`
- Create: `js/ui.js`

- [ ] **Step 1: Replace inline styling and script hooks with external files**

```html
<!-- index.html head additions -->
<link rel="stylesheet" href="css/style.css">
```

```html
<!-- index.html body additions -->
<button id="muteBtn" class="utility-btn mute-btn" type="button" aria-pressed="false">...</button>
<button id="speedBtn" class="utility-btn speed-btn" type="button" aria-pressed="false">...</button>
<div id="speedTray" class="speed-tray hidden">
  <span class="speed-symbol">⚡</span>
  <input id="speedSlider" type="range" min="0.5" max="3" step="0.1" value="1">
  <span id="speedValue">×1.0</span>
</div>
<script type="module" src="js/main.js"></script>
```

- [ ] **Step 2: Move presentational rules into `css/style.css` and define art-led tokens**

```css
:root {
  --ink: #53352a;
  --gold: #d69e2e;
  --sea-deep: #6f9fbc;
  --sea-light: #aac7da;
  --paper: #f4ece1;
}

.utility-btn {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: linear-gradient(180deg, #fff2c7, #d89a38);
  border: 2px solid rgba(75, 47, 31, 0.75);
  color: #2b1b11;
}

.speed-tray {
  position: absolute;
  left: 1rem;
  bottom: 1rem;
  background: linear-gradient(180deg, rgba(255,246,218,.97), rgba(229,192,124,.96));
  border: 2px solid rgba(88,55,29,.72);
  border-radius: 12px;
}
```

- [ ] **Step 3: Implement UI helpers**

```js
// js/ui.js
export function updateChecklist(checklist) {
  for (const [mode, entries] of Object.entries(checklist)) {
    for (const [key, done] of Object.entries(entries)) {
      const el = document.getElementById(`check-${mode}-${key}`);
      if (!el) continue;
      el.classList.toggle('done', done);
      el.querySelector('.status-icon').textContent = done ? '✅' : '⬜';
    }
  }
}

export function updateProgress(count, goal) {
  document.querySelectorAll('#chestProgress span').forEach((el, index) => {
    el.classList.toggle('active', index < count);
  });
}

export function wireUtilityControls({ onSpeedChange, onMuteToggle }) {
  const muteBtn = document.getElementById('muteBtn');
  const speedBtn = document.getElementById('speedBtn');
  const speedTray = document.getElementById('speedTray');
  const speedSlider = document.getElementById('speedSlider');
  const speedValue = document.getElementById('speedValue');

  muteBtn.addEventListener('click', () => onMuteToggle?.());
  speedBtn.addEventListener('click', () => speedTray.classList.toggle('hidden'));
  speedSlider.addEventListener('input', () => {
    const value = Number(speedSlider.value);
    speedValue.textContent = `×${value.toFixed(1)}`;
    onSpeedChange?.(value);
  });
}
```

- [ ] **Step 4: Manually verify static layout**

Run: `python -m http.server 8000`  
Open: `http://localhost:8000`  
Expected:
- no inline `<style>` or `<script>` game logic remains
- six checklist rows are visible
- bottom-left mute/speed controls appear
- speed tray opens and updates text

- [ ] **Step 5: Commit**

```bash
git add index.html css/style.css js/ui.js
git commit -m "feat: unpack markup and utility ui"
```

### Task 5: Render the watercolor scene with local assets

**Files:**
- Create: `js/renderer.js`

- [ ] **Step 1: Implement renderer around preloaded assets**

```js
// js/renderer.js
import { SHIP_X } from './input.js';

export function drawScene(ctx, canvas, assets, model) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (assets.waterBackground) {
    ctx.drawImage(assets.waterBackground, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = '#aac7da';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (assets.backgroundTexture) {
    ctx.globalAlpha = 0.18;
    ctx.drawImage(assets.backgroundTexture, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }

  if (assets.ship) {
    ctx.drawImage(assets.ship, SHIP_X - 70, model.shipY - 70, 140, 156);
  }

  for (const item of model.items) {
    const asset = item.isGood ? assets.treasureChest : assets.bomb;
    if (asset) ctx.drawImage(asset, item.x - 36, item.y - 36, 72, 72);
  }
}
```

- [ ] **Step 2: Manually verify asset layering**

Run: `python -m http.server 8000`  
Open: `http://localhost:8000`  
Expected:
- water background fills the game area
- paper texture is subtle, not dominant
- ship image stays on one X line
- bomb and chest art replace emoji items

- [ ] **Step 3: Commit**

```bash
git add js/renderer.js
git commit -m "feat: render local watercolor assets"
```

### Task 6: Wire gameplay loop and ship controls

**Files:**
- Create: `js/main.js`
- Modify: `index.html`

- [ ] **Step 1: Wire modules together**

```js
// js/main.js
import { preloadImages } from './assets.js';
import {
  createInitialState,
  applyCollision,
  setFeedbackMode,
  setSpeedMultiplier,
  isMissionComplete,
} from './game-state.js';
import {
  SHIP_X,
  CONTROL_LANE_WIDTH,
  shouldTrackMouse,
  resolveShipY,
} from './input.js';
import { drawScene } from './renderer.js';
import { updateChecklist, updateProgress, wireUtilityControls } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let state = createInitialState();
let shipY = 0;
let keyboardDirection = 0;
let mouseY = null;
let lastTime = performance.now();
let assets = {};
let items = [];

function resize() {
  canvas.width = canvas.parentElement.clientWidth;
  canvas.height = canvas.parentElement.clientHeight;
  shipY ||= canvas.height / 2;
}

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  shipY = resolveShipY({
    currentY: shipY,
    mouseY,
    keyboardDirection,
    dt,
    speed: 220,
    canvasHeight: canvas.height,
  });

  drawScene(ctx, canvas, assets, { shipY, shipX: SHIP_X, items });
  requestAnimationFrame(loop);
}

window.addEventListener('resize', resize);
canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  if (shouldTrackMouse(x, CONTROL_LANE_WIDTH) && keyboardDirection === 0) {
    mouseY = event.clientY - rect.top;
  }
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowUp') keyboardDirection = -1;
  if (event.key === 'ArrowDown') keyboardDirection = 1;
});
window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowUp' || event.key === 'ArrowDown') keyboardDirection = 0;
});

wireUtilityControls({
  onSpeedChange(value) {
    state = setSpeedMultiplier(state, value);
  },
});

resize();
assets = await preloadImages();
updateChecklist(state.checklist);
updateProgress(state.itemsCollected, 5);
requestAnimationFrame(loop);
```

- [ ] **Step 2: Expand integration to preserve existing gameplay behaviors**

Add:
- start overlay hide/show flow
- feedback-mode card selection
- item spawning and movement scaled by `state.speedMultiplier`
- positive/negative collisions calling `applyCollision`
- feedback bubble text by current mode
- six-row checklist refresh after each collision
- final button visibility driven by `isMissionComplete(state)`

- [ ] **Step 3: Manually verify gameplay**

Run: `python -m http.server 8000`  
Open: `http://localhost:8000`  
Expected:
- mouse does not move ship inside left control lane
- mouse moves ship outside control lane
- keyboard arrows override mouse while held
- ship never changes X position
- speed tray changes spawn/item movement pace
- all three feedback modes record positive and negative outcomes
- mission completes only after six combinations

- [ ] **Step 4: Run automated tests**

Run: `npm test`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/main.js index.html
git commit -m "feat: wire redesigned gameplay loop"
```

### Task 7: Final verification and cleanup

**Files:**
- Modify as needed from review findings only

- [ ] **Step 1: Run automated verification**

Run: `npm test`  
Expected: PASS.

- [ ] **Step 2: Run browser smoke test**

Run: `python -m http.server 8000`  
Open: `http://localhost:8000`  
Verify:
- no console errors
- all supplied visuals load
- layout remains usable on desktop viewport resize
- progress, checklist, and victory state work
- controls stay readable over art

- [ ] **Step 3: Review against design**

Confirm:
- purpose remains centered on feedback types
- all six learning experiences required
- no remote icon artwork remains
- local assets are used consistently
- CSS/JS are split into focused files

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "chore: verify feedback game redesign"
```

## Self-Review

- **Spec coverage:** tasks cover modularization, asset integration, fixed-X ship, left control lane, keyboard precedence, six-check completion, and mute/speed control styling.
- **Placeholder scan:** no TBD/TODO placeholders remain.
- **Type consistency:** shared names remain consistent across tasks: `speedMultiplier`, `feedbackMode`, `checklist`, `SHIP_X`, `CONTROL_LANE_WIDTH`.
