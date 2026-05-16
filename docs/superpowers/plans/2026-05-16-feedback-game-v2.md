# Feedback Game V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pirate-themed HTML5 canvas game (new directory `feedback-game-v2/`) that teaches private tutors the difference between Outcome, Corrective, and Constructive feedback through 3 escalating levels with progressively better in-game feedback.

**Architecture:** Vanilla JS ES6 modules + HTML5 Canvas. All state is a plain object updated by pure functions — no mutations. Level definitions are pure data (rules, spawn pools, feedback text) in `levels.js`. Game loop via `requestAnimationFrame`. Rendering, state, and level logic are fully separated.

**Tech Stack:** HTML5 Canvas, Vanilla JS ES6 modules, Node.js built-in test runner (`node --test` with `.mjs` test files)

---

## Feedback Type Research Summary

These three types inform all feedback text in the game:

**Level 1 — Outcome Feedback (Knowledge of Results, KR)**
Only tells the learner whether a response was correct or incorrect. Contains no explanation of what went wrong or why. Learner must use pure trial-and-error. Highest frustration, lowest transfer. Examples: ✓ / ✗ / "Right" / "Wrong".

**Level 2 — Corrective Feedback (Knowledge of Correct Response, KCR)**
Tells the learner *what* the correct response was. Names the error specifically but doesn't explain the underlying rule. Reduces trial-and-error but learner still can't fully strategize. Examples: "שגיאה! ארגז ירוק — מלכודת." / "נכון! פצצה כבויה — בטוח."

**Level 3 — Constructive / Elaborated Feedback (Elaborated Feedback, EF)**
Explains *why* the answer is right or wrong, articulates the underlying rule, and gives the learner a strategy for next time. Highest transfer and understanding, lowest frustration. Examples: "טעות! ארגז סגור מסתיר מה שבפנים — רק ארגז פתוח בטוח! כלל: אם אתה רואה את האוצר — זה אמיתי."

---

## Level Design

| Level | Feedback Type | Correct Item(s) | Wrong Items | Win Condition |
|-------|--------------|-----------------|-------------|---------------|
| 1 | Outcome (✓/✗ only) | `chest-ribbon` (red ribbon) | `chest-plain` (no ribbon), `bomb-lit` | 3 consecutive `chest-ribbon` |
| 2 | Corrective (names the error) | `bomb-unlit` (cold fuse) | `chest-green` (all green chests), `bomb-lit` | 3 consecutive `bomb-unlit` |
| 3 | Constructive (explains why + strategy) | `chest-open` OR `bomb-unlit` | `chest-closed`, `bomb-lit` | 3 consecutive correct (either `chest-open` or `bomb-unlit`) |

**Counter rule:** Any wrong item collected (or `bomb-lit` collision) resets consecutive count to 0. Correct item = count +1. Items that scroll past without collision do NOT affect the counter.

**Rule revealed:** The full rule for each level is revealed on the inter-level TRANSITION screen AFTER the level ends — not during play.

---

## Required Assets

Place all PNGs in `assets/` before starting development. These are the exact filenames the code expects:

| Filename | Source game | Description |
|---|---|---|
| `water-bg.png` | feedback-game | Scrolling water background |
| `ship.png` | feedback-game | Player pirate ship |
| `chest-ribbon.png` | feedback-game | Level 1: red ribbon = SAFE (collect) |
| `chest-plain.png` | feedback-game (variant) | Level 1: no ribbon = TRAP (avoid) |
| `chest-green.png` | feedback-game (variant) | Level 2: green = ALL DANGEROUS (avoid) |
| `chest-open.png` | feedback-game (variant) | Level 3: open lid = SAFE (collect) |
| `chest-closed.png` | feedback-game (variant) | Level 3: closed lid = DANGEROUS (avoid) |
| `bomb-lit.png` | feedback-game | All levels: lit fuse = DANGEROUS (avoid) |
| `bomb-unlit.png` | feedback-game (variant) | Levels 2+3: cold fuse = SAFE (collect) |
| `pirate-happy.png` | hook-game | Transition screen emotion |
| `pirate-neutral.png` | hook-game | Transition screen emotion |
| `pirate-frustrated.png` | hook-game | Transition screen emotion |
| `pirate-confused.png` | hook-game | Transition screen emotion |
| `tattered-page.png` | provided | Feedback popup background overlay |

---

## File Structure

```
feedback-game-v2/
├── index.html
├── style.css
├── assets/              ← paste PNGs here
├── js/
│   ├── constants.js     ← canvas size, timing, item type strings, phase strings
│   ├── levels.js        ← all level rules, spawn pools, and feedback text
│   ├── state.js         ← pure state transition functions (no side effects)
│   ├── assets.js        ← image preloading
│   ├── input.js         ← keyboard/touch ship control
│   ├── items.js         ← item spawning + collision detection
│   ├── renderer.js      ← all canvas draw calls
│   ├── feedback.js      ← feedback popup draw
│   ├── transitions.js   ← inter-level screens + button hit-testing
│   └── main.js          ← game loop, wires all modules, handles events
└── tests/
    ├── state.test.mjs
    ├── levels.test.mjs
    └── items.test.mjs
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `feedback-game-v2/index.html`
- Create: `feedback-game-v2/style.css`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>עולים שלב — משוב בפעולה</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="game-wrapper">
    <canvas id="game-canvas" width="600" height="600"></canvas>
  </div>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `style.css`**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  font-family: 'Segoe UI', Arial, sans-serif;
}

#game-wrapper {
  position: relative;
  width: 600px;
  height: 600px;
}

#game-canvas {
  display: block;
  width: 600px;
  height: 600px;
  cursor: pointer;
}
```

- [ ] **Step 3: Create `package.json`**

Node.js needs `"type": "module"` to treat `.js` files as ES modules when running `node --test`.

```json
{
  "type": "module"
}
```

- [ ] **Step 4: Open `index.html` in browser — should show black/dark square, no errors in console**

- [ ] **Step 5: Commit**

```bash
git add feedback-game-v2/index.html feedback-game-v2/style.css feedback-game-v2/package.json
git commit -m "feat: scaffold feedback-game-v2 with canvas"
```

---

## Task 2: Constants

**Files:**
- Create: `feedback-game-v2/js/constants.js`

No tests needed — pure configuration.

- [ ] **Step 1: Create `js/constants.js`**

```js
export const CANVAS_SIZE = 600;

export const SHIP_X = 90;          // fixed horizontal position
export const SHIP_WIDTH = 80;
export const SHIP_HEIGHT = 60;
export const SHIP_SPEED = 5;       // pixels per frame

export const ITEM_WIDTH = 58;
export const ITEM_HEIGHT = 58;
export const ITEM_SPEED = 2.8;     // pixels per frame (16.67ms baseline)
export const ITEM_SPAWN_INTERVAL = 1800; // ms between spawns

export const CONSECUTIVE_TO_WIN = 3;

// Popup display durations per feedback type (ms)
export const POPUP_DURATION = {
  outcome: 1300,
  corrective: 2800,
  constructive: 5000,
};

export const ITEM = Object.freeze({
  CHEST_RIBBON: 'chest-ribbon',
  CHEST_PLAIN:  'chest-plain',
  CHEST_GREEN:  'chest-green',
  CHEST_OPEN:   'chest-open',
  CHEST_CLOSED: 'chest-closed',
  BOMB_LIT:     'bomb-lit',
  BOMB_UNLIT:   'bomb-unlit',
});

export const PHASE = Object.freeze({
  START:      'START',
  PLAYING:    'PLAYING',
  FEEDBACK:   'FEEDBACK',
  TRANSITION: 'TRANSITION',
  END:        'END',
});

export const TRANSITION_STEP = Object.freeze({
  REVEAL: 'REVEAL',
  MOOD:   'MOOD',
});
```

- [ ] **Step 2: Commit**

```bash
git add feedback-game-v2/js/constants.js
git commit -m "feat: add game constants"
```

---

## Task 3: Level Definitions

**Files:**
- Create: `feedback-game-v2/js/levels.js`
- Create: `feedback-game-v2/tests/levels.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
// tests/levels.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import LEVELS from '../js/levels.js';

test('LEVELS has exactly 3 entries', () => {
  assert.equal(LEVELS.length, 3);
});

// Level 0 — Outcome
test('level 0: chest-ribbon is correct', () => {
  assert.equal(LEVELS[0].isCorrect('chest-ribbon'), true);
});
test('level 0: chest-plain is not correct', () => {
  assert.equal(LEVELS[0].isCorrect('chest-plain'), false);
});
test('level 0: bomb-lit is a hazard', () => {
  assert.equal(LEVELS[0].isHazard('bomb-lit'), true);
});
test('level 0: correct feedback is ✓', () => {
  assert.equal(LEVELS[0].getFeedbackText('chest-ribbon', true), '✓');
});
test('level 0: wrong feedback is ✗', () => {
  assert.equal(LEVELS[0].getFeedbackText('chest-plain', false), '✗');
});

// Level 1 — Corrective
test('level 1: bomb-unlit is correct', () => {
  assert.equal(LEVELS[1].isCorrect('bomb-unlit'), true);
});
test('level 1: chest-green is not correct', () => {
  assert.equal(LEVELS[1].isCorrect('chest-green'), false);
});
test('level 1: bomb-lit is a hazard', () => {
  assert.equal(LEVELS[1].isHazard('bomb-lit'), true);
});
test('level 1: chest-green is not a hazard (hazard = bomb-lit only)', () => {
  assert.equal(LEVELS[1].isHazard('chest-green'), false);
});
test('level 1: correct feedback names the item', () => {
  const text = LEVELS[1].getFeedbackText('bomb-unlit', true);
  assert.ok(text.includes('כבויה'), `expected "כבויה" in "${text}"`);
});
test('level 1: wrong chest-green feedback names the chest', () => {
  const text = LEVELS[1].getFeedbackText('chest-green', false);
  assert.ok(text.includes('ירוק'), `expected "ירוק" in "${text}"`);
});
test('level 1: wrong bomb-lit feedback names the bomb', () => {
  const text = LEVELS[1].getFeedbackText('bomb-lit', false);
  assert.ok(text.includes('דולקת'), `expected "דולקת" in "${text}"`);
});

// Level 2 — Constructive
test('level 2: chest-open is correct', () => {
  assert.equal(LEVELS[2].isCorrect('chest-open'), true);
});
test('level 2: bomb-unlit is correct', () => {
  assert.equal(LEVELS[2].isCorrect('bomb-unlit'), true);
});
test('level 2: chest-closed is not correct', () => {
  assert.equal(LEVELS[2].isCorrect('chest-closed'), false);
});
test('level 2: bomb-lit is a hazard', () => {
  assert.equal(LEVELS[2].isHazard('bomb-lit'), true);
});
test('level 2: chest-open feedback explains the rule', () => {
  const text = LEVELS[2].getFeedbackText('chest-open', true);
  assert.ok(text.length > 30, 'constructive feedback should be long');
  assert.ok(text.includes('פתוח'), `expected "פתוח" in "${text}"`);
});
test('level 2: chest-closed feedback explains why and gives strategy', () => {
  const text = LEVELS[2].getFeedbackText('chest-closed', false);
  assert.ok(text.includes('סגור'), `expected "סגור" in "${text}"`);
  assert.ok(text.includes('כלל') || text.includes('זכור') || text.includes('חפש'),
    'constructive feedback should include strategy hint');
});
test('each level has a non-empty transitionReveal', () => {
  for (const level of LEVELS) {
    assert.ok(level.transitionReveal.length > 0, `level ${level.index} transitionReveal is empty`);
  }
});
test('each level has exactly 4 moodOptions', () => {
  for (const level of LEVELS) {
    assert.equal(level.moodOptions.length, 4, `level ${level.index} needs 4 mood options`);
  }
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```
cd feedback-game-v2
node --test tests/levels.test.mjs
```

Expected: `Cannot find module '../js/levels.js'`

- [ ] **Step 3: Create `js/levels.js`**

```js
// js/levels.js
import { ITEM } from './constants.js';

const LEVELS = [
  {
    index: 0,
    feedbackType: 'outcome',
    feedbackTypeName: 'משוב תוצאה',
    feedbackTypeNameEn: 'Outcome Feedback',
    feedbackTypeDesc: 'נכון או לא נכון — ללא שום הסבר.',
    spawnPool: [
      { type: ITEM.CHEST_RIBBON, weight: 3 },
      { type: ITEM.CHEST_PLAIN,  weight: 3 },
      { type: ITEM.BOMB_LIT,     weight: 2 },
    ],
    isCorrect(type) { return type === ITEM.CHEST_RIBBON; },
    isHazard(type)  { return type === ITEM.BOMB_LIT; },
    getFeedbackText(_type, correct) { return correct ? '✓' : '✗'; },
    transitionReveal:
      'הכלל היה: ארגז עם סרט אדום = בטוח לאסוף. ארגז ללא סרט = מלכודת. פצצה דולקת = סכנה.',
    pirateTransitionMood: 'frustrated',
    moodQuestion: 'איך הרגשת?',
    moodOptions: ['מתוסכל 😤', 'מבולבל 😕', 'בסדר 😐', 'מרוצה 😊'],
    nextLevelIntro: 'בשלב הבא תקבל הסבר קצר על מה שטעית.',
  },
  {
    index: 1,
    feedbackType: 'corrective',
    feedbackTypeName: 'משוב מתקן',
    feedbackTypeNameEn: 'Corrective Feedback',
    feedbackTypeDesc: 'מסביר מה היה שגוי — אבל לא למה.',
    spawnPool: [
      { type: ITEM.CHEST_GREEN, weight: 3 },
      { type: ITEM.BOMB_LIT,    weight: 2 },
      { type: ITEM.BOMB_UNLIT,  weight: 3 },
    ],
    isCorrect(type) { return type === ITEM.BOMB_UNLIT; },
    isHazard(type)  { return type === ITEM.BOMB_LIT; },
    getFeedbackText(type, correct) {
      if (correct)                    return 'נכון! פצצה כבויה — בטוח לאסוף.';
      if (type === ITEM.CHEST_GREEN)  return 'שגיאה! ארגז ירוק — מלכודת.';
      if (type === ITEM.BOMB_LIT)     return 'שגיאה! פצצה דולקת — מסוכנת!';
      return 'שגיאה!';
    },
    transitionReveal:
      'הכלל היה: כל הארגזים הירוקים מסוכנים. פצצות דולקות — סכנה. פצצות כבויות — בטוח לאסוף.',
    pirateTransitionMood: 'neutral',
    moodQuestion: 'איך הרגשת לעומת השלב הקודם?',
    moodOptions: ['עדיין מתוסכל 😤', 'קצת יותר טוב 😐', 'הרבה יותר טוב 🙂', 'מרוצה 😊'],
    nextLevelIntro: 'בשלב הבא תקבל הסבר מלא — כולל למה ואיך להצליח.',
  },
  {
    index: 2,
    feedbackType: 'constructive',
    feedbackTypeName: 'משוב בונה',
    feedbackTypeNameEn: 'Constructive Feedback',
    feedbackTypeDesc: 'מסביר למה ונותן אסטרטגיה לפעם הבאה.',
    spawnPool: [
      { type: ITEM.CHEST_OPEN,   weight: 2 },
      { type: ITEM.CHEST_CLOSED, weight: 2 },
      { type: ITEM.BOMB_LIT,     weight: 2 },
      { type: ITEM.BOMB_UNLIT,   weight: 2 },
    ],
    isCorrect(type) {
      return type === ITEM.CHEST_OPEN || type === ITEM.BOMB_UNLIT;
    },
    isHazard(type) { return type === ITEM.BOMB_LIT; },
    getFeedbackText(type, _correct) {
      if (type === ITEM.CHEST_OPEN)
        return 'מצוין! ארגז פתוח — האוצר גלוי = אמיתי. כלל: ארגז עם מכסה פתוח תמיד בטוח!';
      if (type === ITEM.CHEST_CLOSED)
        return 'טעות! ארגז סגור מסתיר מה שבפנים. זכור: רק ארגז פתוח בטוח — חפש את המכסה הפתוח!';
      if (type === ITEM.BOMB_UNLIT)
        return 'נהדר! פצצה עם פתיל קר — לא דולקת = בטוחה. כלל: חפש פתיל ללא אש!';
      if (type === ITEM.BOMB_LIT)
        return 'טעות! פצצה דולקת — הפתיל בוער = מתפוצצת! רק פצצות עם פתיל קר בטוחות לאיסוף.';
      return '';
    },
    transitionReveal:
      'הכלל היה: ארגז פתוח = בטוח. ארגז סגור = מלכודת. פצצה כבויה = בטוח לאסוף. פצצה דולקת = סכנה.',
    pirateTransitionMood: 'happy',
    moodQuestion: 'איך הרגשת לעומת השלבים הקודמים?',
    moodOptions: ['לא שינה כלום 😑', 'קצת יותר טוב 😐', 'הרבה יותר טוב 🙂', 'זה היה כיף! 😄'],
    nextLevelIntro: null,
  },
];

export default LEVELS;
```

- [ ] **Step 4: Run tests — confirm they pass**

```
node --test tests/levels.test.mjs
```

Expected: all tests pass (✓)

- [ ] **Step 5: Commit**

```bash
git add feedback-game-v2/js/levels.js feedback-game-v2/tests/levels.test.mjs
git commit -m "feat: add level definitions and feedback text"
```

---

## Task 4: State Machine

**Files:**
- Create: `feedback-game-v2/js/state.js`
- Create: `feedback-game-v2/tests/state.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
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
```

- [ ] **Step 2: Run tests — confirm they fail**

```
node --test tests/state.test.mjs
```

Expected: `Cannot find module '../js/state.js'`

- [ ] **Step 3: Create `js/state.js`**

```js
// js/state.js
import { PHASE, TRANSITION_STEP, CONSECUTIVE_TO_WIN } from './constants.js';

export function createInitialState() {
  return {
    phase: PHASE.START,
    levelIndex: 0,
    consecutiveCount: 0,
    shipY: 300,
    items: [],
    activePopup: null,
    popupTimer: 0,
    transition: null,
    levelResults: [],
    spawnTimer: 0,
    nextItemId: 0,
  };
}

export function startGame(state) {
  return { ...state, phase: PHASE.PLAYING };
}

export function moveShip(state, dy) {
  const newY = Math.max(40, Math.min(560, state.shipY + dy));
  return { ...state, shipY: newY };
}

export function spawnItem(state, item) {
  return {
    ...state,
    items: [...state.items, item],
    nextItemId: state.nextItemId + 1,
    spawnTimer: 0,
  };
}

export function updateItems(state, deltaX) {
  const items = state.items
    .map(item => ({ ...item, x: item.x - deltaX }))
    .filter(item => item.x > -100);
  return { ...state, items };
}

export function collectItem(state, itemId, isCorrect) {
  const items = state.items.filter(i => i.id !== itemId);
  const consecutiveCount = isCorrect ? state.consecutiveCount + 1 : 0;
  return { ...state, items, consecutiveCount };
}

export function showPopup(state, text, isCorrect, duration) {
  return {
    ...state,
    phase: PHASE.FEEDBACK,
    activePopup: { text, isCorrect },
    popupTimer: duration,
  };
}

export function tickPopup(state, deltaMs) {
  const remaining = state.popupTimer - deltaMs;
  if (remaining > 0) {
    return { ...state, popupTimer: remaining };
  }
  const isLevelComplete = state.consecutiveCount >= CONSECUTIVE_TO_WIN;
  return {
    ...state,
    phase: isLevelComplete ? PHASE.TRANSITION : PHASE.PLAYING,
    activePopup: null,
    popupTimer: 0,
    transition: isLevelComplete
      ? { step: TRANSITION_STEP.REVEAL, playerMood: null }
      : null,
  };
}

export function advanceTransition(state) {
  return {
    ...state,
    transition: { ...state.transition, step: TRANSITION_STEP.MOOD },
  };
}

export function setPlayerMood(state, mood) {
  return {
    ...state,
    transition: { ...state.transition, playerMood: mood },
  };
}

export function advanceLevel(state) {
  const nextLevelIndex = state.levelIndex + 1;
  const isEnd = nextLevelIndex >= 3;
  return {
    ...state,
    phase: isEnd ? PHASE.END : PHASE.PLAYING,
    levelIndex: isEnd ? state.levelIndex : nextLevelIndex,
    consecutiveCount: 0,
    items: [],
    activePopup: null,
    popupTimer: 0,
    transition: null,
    spawnTimer: 0,
    levelResults: [
      ...state.levelResults,
      { mood: state.transition?.playerMood ?? null },
    ],
  };
}

export function resetSpawnTimer(state, interval) {
  return { ...state, spawnTimer: interval };
}

export function tickSpawnTimer(state, deltaMs) {
  return { ...state, spawnTimer: Math.max(0, state.spawnTimer - deltaMs) };
}
```

- [ ] **Step 4: Run tests — confirm they all pass**

```
node --test tests/state.test.mjs
```

Expected: all tests pass

- [ ] **Step 5: Commit**

```bash
git add feedback-game-v2/js/state.js feedback-game-v2/tests/state.test.mjs
git commit -m "feat: add pure state machine with full test coverage"
```

---

## Task 5: Asset Loading

**Files:**
- Create: `feedback-game-v2/js/assets.js`

No unit tests — image loading requires a browser. Verify manually in Task 11.

- [ ] **Step 1: Create `js/assets.js`**

```js
// js/assets.js
const IMAGE_PATHS = [
  'water-bg',
  'ship',
  'chest-ribbon',
  'chest-plain',
  'chest-green',
  'chest-open',
  'chest-closed',
  'bomb-lit',
  'bomb-unlit',
  'pirate-happy',
  'pirate-neutral',
  'pirate-frustrated',
  'pirate-confused',
  'tattered-page',
];

export const images = {};

export function load() {
  const promises = IMAGE_PATHS.map(name =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        images[name] = img;
        resolve();
      };
      img.onerror = () => reject(new Error(`Failed to load assets/${name}.png`));
      img.src = `assets/${name}.png`;
    })
  );
  return Promise.all(promises);
}
```

- [ ] **Step 2: Commit**

```bash
git add feedback-game-v2/js/assets.js
git commit -m "feat: add asset preloader"
```

---

## Task 6: Input Handling

**Files:**
- Create: `feedback-game-v2/js/input.js`

- [ ] **Step 1: Create `js/input.js`**

```js
// js/input.js
// Tracks which keys are currently held down.
// Returns the ship's Y delta each frame so caller can scale by speed.

const held = new Set();

export function onKeyDown(e) {
  held.add(e.key);
}

export function onKeyUp(e) {
  held.delete(e.key);
}

// Returns -1 (up), +1 (down), or 0 (no vertical movement)
export function getShipDelta() {
  const up   = held.has('ArrowUp')   || held.has('w') || held.has('W');
  const down = held.has('ArrowDown') || held.has('s') || held.has('S');
  if (up && !down) return -1;
  if (down && !up) return 1;
  return 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add feedback-game-v2/js/input.js
git commit -m "feat: add keyboard input module"
```

---

## Task 7: Item Spawning and Collision

**Files:**
- Create: `feedback-game-v2/js/items.js`
- Create: `feedback-game-v2/tests/items.test.mjs`

- [ ] **Step 1: Write the failing tests**

```js
// tests/items.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickItemType, createItem, checkCollision } from '../js/items.js';
import { ITEM, CANVAS_SIZE, ITEM_WIDTH, ITEM_HEIGHT } from '../js/constants.js';

// pickItemType
test('pickItemType returns one of the types in pool', () => {
  const pool = [
    { type: ITEM.CHEST_RIBBON, weight: 3 },
    { type: ITEM.CHEST_PLAIN,  weight: 3 },
    { type: ITEM.BOMB_LIT,     weight: 2 },
  ];
  const validTypes = pool.map(e => e.type);
  for (let i = 0; i < 100; i++) {
    const result = pickItemType(pool);
    assert.ok(validTypes.includes(result), `unexpected type: ${result}`);
  }
});

test('pickItemType with weight-0 entry never returns that type', () => {
  const pool = [
    { type: ITEM.CHEST_RIBBON, weight: 0 },
    { type: ITEM.BOMB_LIT,     weight: 10 },
  ];
  for (let i = 0; i < 50; i++) {
    assert.equal(pickItemType(pool), ITEM.BOMB_LIT);
  }
});

// createItem
test('createItem returns item with given id and type', () => {
  const item = createItem(5, ITEM.CHEST_RIBBON);
  assert.equal(item.id, 5);
  assert.equal(item.type, ITEM.CHEST_RIBBON);
});

test('createItem spawns at right edge of canvas', () => {
  const item = createItem(0, ITEM.BOMB_LIT);
  assert.ok(item.x >= CANVAS_SIZE, `x ${item.x} should be >= CANVAS_SIZE ${CANVAS_SIZE}`);
});

test('createItem y is within canvas bounds', () => {
  for (let i = 0; i < 30; i++) {
    const item = createItem(i, ITEM.CHEST_RIBBON);
    assert.ok(item.y >= ITEM_HEIGHT,              `y ${item.y} too small`);
    assert.ok(item.y <= CANVAS_SIZE - ITEM_HEIGHT, `y ${item.y} too large`);
  }
});

test('createItem has correct width and height', () => {
  const item = createItem(0, ITEM.CHEST_RIBBON);
  assert.equal(item.width,  ITEM_WIDTH);
  assert.equal(item.height, ITEM_HEIGHT);
});

// checkCollision — center-based rectangles
test('checkCollision returns true when ship and item overlap', () => {
  const ship = { x: 100, y: 200, width: 80, height: 60 };
  const item = { x: 110, y: 205, width: 58, height: 58 };
  assert.equal(checkCollision(ship, item), true);
});

test('checkCollision returns false when ship is to the left of item', () => {
  const ship = { x: 50,  y: 200, width: 80, height: 60 };
  const item = { x: 300, y: 200, width: 58, height: 58 };
  assert.equal(checkCollision(ship, item), false);
});

test('checkCollision returns false when ship Y does not overlap', () => {
  const ship = { x: 100, y: 100, width: 80, height: 60 };
  const item = { x: 110, y: 400, width: 58, height: 58 };
  assert.equal(checkCollision(ship, item), false);
});

test('checkCollision returns false when items are exactly touching (not overlapping)', () => {
  // ship center=100, halfWidth=40 → right edge at 140
  // item center=200, halfWidth=29 → left edge at 171
  // gap = 31px → no overlap
  const ship = { x: 100, y: 200, width: 80, height: 60 };
  const item = { x: 200, y: 200, width: 58, height: 58 };
  assert.equal(checkCollision(ship, item), false);
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```
node --test tests/items.test.mjs
```

Expected: `Cannot find module '../js/items.js'`

- [ ] **Step 3: Create `js/items.js`**

```js
// js/items.js
import { CANVAS_SIZE, ITEM_WIDTH, ITEM_HEIGHT } from './constants.js';

// Weighted random pick from spawnPool entries { type, weight }
export function pickItemType(spawnPool) {
  const totalWeight = spawnPool.reduce((sum, e) => sum + e.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const entry of spawnPool) {
    rand -= entry.weight;
    if (rand <= 0) return entry.type;
  }
  return spawnPool[spawnPool.length - 1].type;
}

// Create a new item at the right edge, random Y within canvas
export function createItem(id, type) {
  const minY = ITEM_HEIGHT;
  const maxY = CANVAS_SIZE - ITEM_HEIGHT;
  const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
  return {
    id,
    type,
    x: CANVAS_SIZE + ITEM_WIDTH / 2,
    y,
    width: ITEM_WIDTH,
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
```

- [ ] **Step 4: Run tests — confirm all pass**

```
node --test tests/items.test.mjs
```

Expected: all tests pass

- [ ] **Step 5: Run all tests together**

```
node --test tests/state.test.mjs tests/levels.test.mjs tests/items.test.mjs
```

Expected: all tests pass

- [ ] **Step 6: Commit**

```bash
git add feedback-game-v2/js/items.js feedback-game-v2/tests/items.test.mjs
git commit -m "feat: add item spawning and collision detection"
```

---

## Task 8: Renderer

**Files:**
- Create: `feedback-game-v2/js/renderer.js`

No unit tests — visual output. Verify manually when main.js is wired up (Task 11).

- [ ] **Step 1: Create `js/renderer.js`**

```js
// js/renderer.js
import { CANVAS_SIZE, SHIP_X, CONSECUTIVE_TO_WIN } from './constants.js';

export function drawBackground(ctx, images) {
  if (images['water-bg']) {
    ctx.drawImage(images['water-bg'], 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  } else {
    ctx.fillStyle = '#4a90c4';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }
}

export function drawShip(ctx, images, shipY) {
  const img = images['ship'];
  const w = 90, h = 70;
  if (img) {
    ctx.drawImage(img, SHIP_X - w / 2, shipY - h / 2, w, h);
  } else {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(SHIP_X - w / 2, shipY - h / 2, w, h);
  }
}

export function drawItems(ctx, images, items) {
  for (const item of items) {
    const img = images[item.type];
    if (img) {
      ctx.drawImage(img, item.x - item.width / 2, item.y - item.height / 2, item.width, item.height);
    } else {
      // Fallback color-coded rectangles during development
      const colors = {
        'chest-ribbon':  '#DAA520',
        'chest-plain':   '#8B6914',
        'chest-green':   '#228B22',
        'chest-open':    '#FFD700',
        'chest-closed':  '#A0522D',
        'bomb-lit':      '#DC143C',
        'bomb-unlit':    '#708090',
      };
      ctx.fillStyle = colors[item.type] ?? '#888';
      ctx.fillRect(item.x - item.width / 2, item.y - item.height / 2, item.width, item.height);
    }
  }
}

// 3-slot consecutive counter at top-center of canvas
export function drawCounter(ctx, count) {
  const slotSize = 28;
  const gap = 10;
  const totalW = CONSECUTIVE_TO_WIN * (slotSize + gap) - gap;
  const startX = (CANVAS_SIZE - totalW) / 2;
  const y = 18;

  for (let i = 0; i < CONSECUTIVE_TO_WIN; i++) {
    const x = startX + i * (slotSize + gap);
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, slotSize, slotSize);
    if (i < count) {
      ctx.fillStyle = '#FFD700';
      ctx.fillRect(x + 3, y + 3, slotSize - 6, slotSize - 6);
      // Star
      ctx.fillStyle = '#FFF';
      ctx.font = `${slotSize - 8}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('★', x + slotSize / 2, y + slotSize / 2);
    }
  }
}

// Level badge at top-right
export function drawLevelIndicator(ctx, levelIndex, feedbackTypeName) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(CANVAS_SIZE - 180, 10, 170, 36);
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 13px Arial';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillText(`שלב ${levelIndex + 1}: ${feedbackTypeName}`, CANVAS_SIZE - 18, 28);
}

export function drawStartScreen(ctx, images) {
  drawBackground(ctx, images);

  // Semi-transparent overlay
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(60, 120, CANVAS_SIZE - 120, 360);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 30px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('עולים שלב', CANVAS_SIZE / 2, 195);

  ctx.fillStyle = '#FFF';
  ctx.font = '16px Arial';
  ctx.fillText('3 שלבים. אותו אתגר. משוב שונה.', CANVAS_SIZE / 2, 240);
  ctx.fillText('אסוף 3 פריטים נכונים ברצף.', CANVAS_SIZE / 2, 268);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('לחץ להתחלה', CANVAS_SIZE / 2, 340);
}
```

- [ ] **Step 2: Commit**

```bash
git add feedback-game-v2/js/renderer.js
git commit -m "feat: add canvas renderer with fallback colors"
```

---

## Task 9: Feedback Popup

**Files:**
- Create: `feedback-game-v2/js/feedback.js`

- [ ] **Step 1: Create `js/feedback.js`**

The popup renders the `tattered-page.png` as background, then draws feedback text over it. For Level 1 (outcome), the text is just "✓" or "✗" in large font. For Levels 2 and 3, it draws wrapped Hebrew text.

```js
// js/feedback.js
import { CANVAS_SIZE } from './constants.js';

const POPUP_W = 340;
const POPUP_H = 180;
const POPUP_X = (CANVAS_SIZE - POPUP_W) / 2;
const POPUP_Y = (CANVAS_SIZE - POPUP_H) / 2;

export function drawPopup(ctx, images, popup) {
  const { text, isCorrect } = popup;

  // Tattered page background
  const bg = images['tattered-page'];
  if (bg) {
    ctx.drawImage(bg, POPUP_X, POPUP_Y, POPUP_W, POPUP_H);
  } else {
    ctx.fillStyle = '#f5e6c8';
    ctx.fillRect(POPUP_X, POPUP_Y, POPUP_W, POPUP_H);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 3;
    ctx.strokeRect(POPUP_X, POPUP_Y, POPUP_W, POPUP_H);
  }

  // Colored indicator strip at top
  ctx.fillStyle = isCorrect ? 'rgba(80,200,80,0.35)' : 'rgba(220,80,80,0.35)';
  ctx.fillRect(POPUP_X, POPUP_Y, POPUP_W, 36);

  // Symbol (✓/✗) for outcome level or short prefix for others
  const symbol = isCorrect ? '✓' : '✗';
  ctx.fillStyle = isCorrect ? '#2d8a2d' : '#b02020';
  ctx.font = 'bold 26px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, POPUP_X + POPUP_W / 2, POPUP_Y + 18);

  // Feedback text — wrapped
  if (text !== '✓' && text !== '✗') {
    ctx.fillStyle = '#3a2600';
    ctx.font = '15px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    drawWrappedText(ctx, text, POPUP_X + 20, POPUP_Y + 46, POPUP_W - 40, 22);
  }
}

// Wraps text to fit within maxWidth, drawing line by line
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  // Hebrew text: split by spaces, build lines
  const words = text.split(' ');
  let line = '';
  let lineY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    const { width } = ctx.measureText(testLine);
    if (width > maxWidth && line) {
      ctx.fillText(line, x + maxWidth / 2, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, x + maxWidth / 2, lineY);
}
```

- [ ] **Step 2: Commit**

```bash
git add feedback-game-v2/js/feedback.js
git commit -m "feat: add feedback popup renderer"
```

---

## Task 10: Level Transitions and End Screen

**Files:**
- Create: `feedback-game-v2/js/transitions.js`

The transition module renders two screens (REVEAL and MOOD) directly on the canvas and exposes `handleClick` for button hit-testing. It uses a module-level `activeButtons` array that is rebuilt each render frame.

- [ ] **Step 1: Create `js/transitions.js`**

```js
// js/transitions.js
import { CANVAS_SIZE, TRANSITION_STEP } from './constants.js';

// Rebuilt every render frame. Hit-tested on click events.
let activeButtons = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function drawPanel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(10,20,50,0.82)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,100,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawButton(ctx, label, x, y, w, h, highlight) {
  ctx.fillStyle = highlight ? '#FFD700' : 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.fillStyle = highlight ? '#1a1a2e' : '#FFF';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x + w / 2, y + h / 2);
  activeButtons.push({ label, rect: { x, y, w, h } });
}

function drawPirate(ctx, images, mood, cx, cy, size) {
  const img = images[`pirate-${mood}`] ?? images['pirate-neutral'];
  if (img) {
    ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
  } else {
    ctx.fillStyle = '#DDD';
    ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    ctx.fillStyle = '#333';
    ctx.font = `${size * 0.5}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const emoji = { happy: '😄', neutral: '😐', frustrated: '😤', confused: '😕' }[mood] ?? '🏴‍☠️';
    ctx.fillText(emoji, cx, cy);
  }
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let lineY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, lineY);
      line = word;
      lineY += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, lineY);
  return lineY + lineHeight;
}

// ─── Public draw functions ────────────────────────────────────────────────────

export function drawRevealScreen(ctx, images, level) {
  activeButtons = [];

  const px = 40, py = 60, pw = CANVAS_SIZE - 80, ph = CANVAS_SIZE - 120;
  drawPanel(ctx, px, py, pw, ph);

  // Feedback type label
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(`שלב הסתיים! סוג המשוב: ${level.feedbackTypeName}`, CANVAS_SIZE / 2, py + 24);

  // Feedback type description
  ctx.fillStyle = '#cce';
  ctx.font = '15px Arial';
  ctx.fillText(level.feedbackTypeDesc, CANVAS_SIZE / 2, py + 62);

  // Divider
  ctx.strokeStyle = 'rgba(255,220,100,0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(px + 30, py + 90); ctx.lineTo(px + pw - 30, py + 90);
  ctx.stroke();

  // Rule reveal
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 14px Arial';
  ctx.fillText('הכלל שהיה בשלב זה:', CANVAS_SIZE / 2, py + 104);
  ctx.font = '14px Arial';
  ctx.fillStyle = '#adf';
  wrapText(ctx, level.transitionReveal, CANVAS_SIZE / 2, py + 128, pw - 80, 22);

  // Continue button
  drawButton(ctx, 'המשך ←', CANVAS_SIZE / 2 - 70, py + ph - 58, 140, 42, true);
}

export function drawMoodScreen(ctx, images, level, selectedMood) {
  activeButtons = [];

  const px = 40, py = 60, pw = CANVAS_SIZE - 80, ph = CANVAS_SIZE - 120;
  drawPanel(ctx, px, py, pw, ph);

  // Pirate image
  drawPirate(ctx, images, level.pirateTransitionMood, CANVAS_SIZE / 2, py + 100, 120);

  // Mood question
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(level.moodQuestion, CANVAS_SIZE / 2, py + 174);

  // 4 mood buttons (2x2 grid)
  const btnW = 120, btnH = 44, gap = 12;
  const gridW = 2 * btnW + gap;
  const startX = (CANVAS_SIZE - gridW) / 2;
  level.moodOptions.forEach((opt, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const bx = startX + col * (btnW + gap);
    const by = py + 210 + row * (btnH + gap);
    drawButton(ctx, opt, bx, by, btnW, btnH, opt === selectedMood);
  });
}

export function drawEndScreen(ctx, images, levelResults) {
  activeButtons = [];

  const px = 40, py = 40, pw = CANVAS_SIZE - 80, ph = CANVAS_SIZE - 80;
  drawPanel(ctx, px, py, pw, ph);

  // Happy pirate
  drawPirate(ctx, images, 'happy', CANVAS_SIZE / 2, py + 80, 100);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 22px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('סיימתם את כל השלבים! 🏴‍☠️', CANVAS_SIZE / 2, py + 146);

  ctx.fillStyle = '#FFF';
  ctx.font = '14px Arial';
  ctx.fillText('ניסיתם 3 סוגי משוב:', CANVAS_SIZE / 2, py + 180);

  const summaries = [
    { name: 'משוב תוצאה', desc: 'נכון/לא נכון בלבד' },
    { name: 'משוב מתקן', desc: 'מסביר מה שגוי' },
    { name: 'משוב בונה', desc: 'מסביר למה ונותן אסטרטגיה' },
  ];
  summaries.forEach((s, i) => {
    const mood = levelResults[i]?.mood ?? '—';
    ctx.fillStyle = '#adf';
    ctx.font = 'bold 13px Arial';
    ctx.fillText(`שלב ${i + 1}: ${s.name}`, CANVAS_SIZE / 2, py + 210 + i * 52);
    ctx.fillStyle = '#FFF';
    ctx.font = '12px Arial';
    ctx.fillText(s.desc, CANVAS_SIZE / 2, py + 228 + i * 52);
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`הרגשת: ${mood}`, CANVAS_SIZE / 2, py + 244 + i * 52);
  });

  // Restart button
  drawButton(ctx, 'שחק שוב', CANVAS_SIZE / 2 - 60, py + ph - 58, 120, 42, true);
}

// ─── Click handler ────────────────────────────────────────────────────────────

// Returns the label of the clicked button, or null if none matched.
export function handleClick(x, y) {
  for (const btn of activeButtons) {
    const { rect } = btn;
    if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
      return btn.label;
    }
  }
  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add feedback-game-v2/js/transitions.js
git commit -m "feat: add level transition and end screen renderer"
```

---

## Task 11: Game Loop (Wire Everything Together)

**Files:**
- Create: `feedback-game-v2/js/main.js`

- [ ] **Step 1: Create `js/main.js`**

```js
// js/main.js
import { PHASE, TRANSITION_STEP, SHIP_X, SHIP_WIDTH, SHIP_HEIGHT,
         ITEM_SPEED, ITEM_SPAWN_INTERVAL, SHIP_SPEED, POPUP_DURATION,
         CANVAS_SIZE } from './constants.js';
import LEVELS from './levels.js';
import * as State from './state.js';
import * as Assets from './assets.js';
import * as Input from './input.js';
import { pickItemType, createItem, checkCollision } from './items.js';
import * as Renderer from './renderer.js';
import * as Feedback from './feedback.js';
import * as Transitions from './transitions.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let state = State.createInitialState();
let lastTimestamp = null;

// ─── Update ──────────────────────────────────────────────────────────────────

function update(deltaMs) {
  if (state.phase === PHASE.PLAYING) {
    // Ship movement
    const dy = Input.getShipDelta() * SHIP_SPEED;
    if (dy !== 0) state = State.moveShip(state, dy);

    // Items scroll left
    const deltaX = ITEM_SPEED * (deltaMs / 16.67);
    state = State.updateItems(state, deltaX);

    // Spawn timer
    state = State.tickSpawnTimer(state, deltaMs);
    if (state.spawnTimer <= 0) {
      const level = LEVELS[state.levelIndex];
      const type = pickItemType(level.spawnPool);
      const item = createItem(state.nextItemId, type);
      state = State.spawnItem(state, item);
      state = State.resetSpawnTimer(state, ITEM_SPAWN_INTERVAL);
    }

    // Collision detection — evaluate first collision only per frame
    const level = LEVELS[state.levelIndex];
    const ship = { x: SHIP_X, y: state.shipY, width: SHIP_WIDTH, height: SHIP_HEIGHT };
    for (const item of state.items) {
      if (checkCollision(ship, item)) {
        const correct = level.isCorrect(item.type);
        const hazard  = level.isHazard(item.type);
        // Hazard = always wrong. Wrong chest = collected but incorrect.
        const isCorrect = correct && !hazard;
        const text = level.getFeedbackText(item.type, correct);
        const duration = POPUP_DURATION[level.feedbackType];

        state = State.collectItem(state, item.id, isCorrect);
        state = State.showPopup(state, text, isCorrect, duration);
        break;
      }
    }
  }

  if (state.phase === PHASE.FEEDBACK) {
    state = State.tickPopup(state, deltaMs);
  }
}

// ─── Render ──────────────────────────────────────────────────────────────────

function render() {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const level = LEVELS[state.levelIndex];

  switch (state.phase) {
    case PHASE.START:
      Renderer.drawStartScreen(ctx, Assets.images);
      break;

    case PHASE.PLAYING:
    case PHASE.FEEDBACK:
      Renderer.drawBackground(ctx, Assets.images);
      Renderer.drawShip(ctx, Assets.images, state.shipY);
      Renderer.drawItems(ctx, Assets.images, state.items);
      Renderer.drawCounter(ctx, state.consecutiveCount);
      Renderer.drawLevelIndicator(ctx, state.levelIndex, level.feedbackTypeName);
      if (state.phase === PHASE.FEEDBACK && state.activePopup) {
        Feedback.drawPopup(ctx, Assets.images, state.activePopup);
      }
      break;

    case PHASE.TRANSITION:
      Renderer.drawBackground(ctx, Assets.images);
      if (state.transition.step === TRANSITION_STEP.REVEAL) {
        Transitions.drawRevealScreen(ctx, Assets.images, level);
      } else {
        Transitions.drawMoodScreen(ctx, Assets.images, level, state.transition.playerMood);
      }
      break;

    case PHASE.END:
      Renderer.drawBackground(ctx, Assets.images);
      Transitions.drawEndScreen(ctx, Assets.images, state.levelResults);
      break;
  }
}

// ─── Game Loop ────────────────────────────────────────────────────────────────

function loop(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp;
  const delta = Math.min(timestamp - lastTimestamp, 50); // cap spike frames
  lastTimestamp = timestamp;
  update(delta);
  render();
  requestAnimationFrame(loop);
}

// ─── Input wiring ─────────────────────────────────────────────────────────────

document.addEventListener('keydown', Input.onKeyDown);
document.addEventListener('keyup', Input.onKeyUp);

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_SIZE / rect.width;
  const scaleY = CANVAS_SIZE / rect.height;
  const x = (e.clientX - rect.left) * scaleX;
  const y = (e.clientY - rect.top)  * scaleY;

  if (state.phase === PHASE.START) {
    state = State.startGame(state);
    return;
  }

  if (state.phase === PHASE.TRANSITION) {
    const action = Transitions.handleClick(x, y);
    if (!action) return;
    if (state.transition.step === TRANSITION_STEP.REVEAL && action === 'המשך ←') {
      state = State.advanceTransition(state);
    } else if (state.transition.step === TRANSITION_STEP.MOOD) {
      state = State.setPlayerMood(state, action);
      state = State.advanceLevel(state);
    }
    return;
  }

  if (state.phase === PHASE.END) {
    const action = Transitions.handleClick(x, y);
    if (action === 'שחק שוב') {
      state = State.createInitialState();
      state = State.startGame(state);
    }
  }
});

// ─── Boot ────────────────────────────────────────────────────────────────────

Assets.load()
  .then(() => requestAnimationFrame(loop))
  .catch(err => {
    console.warn('Asset load warning:', err.message);
    // Start anyway — renderer falls back to colored rectangles
    requestAnimationFrame(loop);
  });
```

- [ ] **Step 2: Open `index.html` in browser**

Verify:
- Start screen visible (title "עולים שלב", click prompt)
- Click → ship appears, items scroll from right
- Arrow Up / Arrow Down moves ship
- Collecting an item shows feedback popup on tattered page
- After 3 correct consecutive: transition screen appears naming the feedback type
- "המשך" button → mood screen with pirate image
- Clicking a mood → next level starts
- After level 3 mood → end screen with summary
- "שחק שוב" restarts from level 1

- [ ] **Step 3: Verify in browser console — no JS errors**

- [ ] **Step 4: Commit**

```bash
git add feedback-game-v2/js/main.js
git commit -m "feat: wire game loop — all phases functional"
```

---

## Task 12: Final Polish and Asset Verification

**Files:**
- Modify: `feedback-game-v2/style.css` (minor responsive tweak)

- [ ] **Step 1: Verify all 14 PNG assets load without 404 errors**

Open browser DevTools → Network tab → reload. Check that all `assets/*.png` requests return 200. If any return 404, the filename in `js/assets.js`'s `IMAGE_PATHS` array must match the actual file in `assets/`.

- [ ] **Step 2: Add responsive canvas scaling to `style.css`**

Append to end of `style.css`:

```css
@media (max-width: 640px) {
  #game-wrapper {
    width: 100vw;
    height: 100vw;
  }
  #game-canvas {
    width: 100%;
    height: 100%;
  }
}
```

- [ ] **Step 3: Smoke-test complete gameplay**

Play through all 3 levels manually:
1. Level 1: collect 3 red-ribbon chests in a row → REVEAL screen shows "משוב תוצאה" + rule → MOOD screen → Level 2 starts
2. Level 2: collect 3 unlit bombs in a row → REVEAL shows "משוב מתקן" + rule → MOOD → Level 3 starts
3. Level 3: collect 3 correct items (open chests or unlit bombs) → REVEAL shows "משוב בונה" → MOOD → END screen with all 3 mood responses shown

- [ ] **Step 4: Run full test suite one final time**

```
node --test tests/state.test.mjs tests/levels.test.mjs tests/items.test.mjs
```

Expected: all tests pass, no failures

- [ ] **Step 5: Final commit**

```bash
git add feedback-game-v2/style.css
git commit -m "feat: complete feedback-game-v2 — 3-level feedback progression game"
```

---

## Appendix: Game Logic Summary

| Scenario | State Change |
|---|---|
| Collect correct item | `consecutiveCount++`, popup shows for level's duration |
| Collect wrong item | `consecutiveCount = 0`, popup shows "wrong" feedback |
| Hit `bomb-lit` | `consecutiveCount = 0`, popup shows "wrong" feedback |
| Item scrolls off left | Removed from items array, no counter effect |
| `consecutiveCount` reaches 3 | After popup closes → TRANSITION (REVEAL step) |
| Click "המשך" on REVEAL | → TRANSITION (MOOD step) |
| Click mood option | → next level PLAYING, or END if level 2 was just finished |
| Click "שחק שוב" on END | → fresh state, PLAYING from level 0 |

## Appendix: Feedback Text Reference

| Level | Item | Correct? | Text shown in popup |
|---|---|---|---|
| 1 (Outcome) | any | ✓ | `✓` |
| 1 (Outcome) | any | ✗ | `✗` |
| 2 (Corrective) | bomb-unlit | ✓ | `נכון! פצצה כבויה — בטוח לאסוף.` |
| 2 (Corrective) | chest-green | ✗ | `שגיאה! ארגז ירוק — מלכודת.` |
| 2 (Corrective) | bomb-lit | ✗ | `שגיאה! פצצה דולקת — מסוכנת!` |
| 3 (Constructive) | chest-open | ✓ | `מצוין! ארגז פתוח — האוצר גלוי = אמיתי. כלל: ארגז עם מכסה פתוח תמיד בטוח!` |
| 3 (Constructive) | chest-closed | ✗ | `טעות! ארגז סגור מסתיר מה שבפנים. זכור: רק ארגז פתוח בטוח — חפש את המכסה הפתוח!` |
| 3 (Constructive) | bomb-unlit | ✓ | `נהדר! פצצה עם פתיל קר — לא דולקת = בטוחה. כלל: חפש פתיל ללא אש!` |
| 3 (Constructive) | bomb-lit | ✗ | `טעות! פצצה דולקת — הפתיל בוער = מתפוצצת! רק פצצות עם פתיל קר בטוחות לאיסוף.` |
