import { PHASE, TRANSITION_STEP, SHIP_X, SHIP_WIDTH, SHIP_HEIGHT,
         ITEM_SPEED, ITEM_SPAWN_INTERVAL, SHIP_SPEED, POPUP_DURATION,
         CANVAS_SIZE, ITEM_HITBOX_RATIO, ITEM_WIDTH,
         ITEM_SPAWN_MIN_Y, ITEM_SPAWN_MAX_Y,
         NUDGE_DELAY_MS, FLOOD_DELAY_MS, FLOOD_ITEM_COUNT, FLOOD_Y_JITTER,
         FLOOD_X_STAGGER } from './constants.js';
import LEVELS from './levels.js';
import * as State from './state.js';
import * as Assets from './assets.js';
import * as Input from './input.js';
import { pickItemType, createItem, createItemAt, checkCollision } from './items.js';
import * as Renderer from './renderer.js';
import * as Feedback from './feedback.js';
import * as Transitions from './transitions.js';

function isCorrectType(level, type) {
  return level.correctSpawnOptions?.some(o => o.type === type) ?? false;
}

function spawnContext(state, level) {
  return {
    recentSpawnHistory: state.recentSpawnHistory,
    incorrectStreak:    state.incorrectStreak,
    level,
  };
}

function floodSpawn(state, level) {
  const minY = ITEM_SPAWN_MIN_Y;
  const maxY = ITEM_SPAWN_MAX_Y;
  const span = maxY - minY;
  const slot = span / (FLOOD_ITEM_COUNT - 1);

  // Shuffle Y-slot order so item types don't correlate with vertical position.
  const order = Array.from({ length: FLOOD_ITEM_COUNT }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const baseX = CANVAS_SIZE + ITEM_WIDTH / 2;
  const newItems = [];
  let working = state;
  for (let i = 0; i < FLOOD_ITEM_COUNT; i++) {
    const pick = pickItemType(level.spawnPool, spawnContext(working, level));
    const slotIdx = order[i];
    const baseY = minY + slotIdx * slot;
    const jitter = (Math.random() * 2 - 1) * FLOOD_Y_JITTER;
    let y = Math.round(baseY + jitter);
    if (pick.yRange) {
      y = Math.max(pick.yRange[0], Math.min(pick.yRange[1], y));
    }
    y = Math.max(minY, Math.min(maxY, y));
    const x = baseX + i * FLOOD_X_STAGGER;
    const item = createItemAt(working.nextItemId + i, pick.type, y);
    item.x = x;
    newItems.push(item);
    working = State.recordSpawn(working, pick.type, isCorrectType(level, pick.type));
  }
  return State.setFloodTriggered(State.appendItems(working, newItems));
}

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let state = State.createInitialState();
let lastTimestamp = null;
let moodOverlayVisible = false;

function initMoodOverlay() {
  const submitBtn = document.getElementById('mood-submit-btn');
  const faceBtns = document.querySelectorAll('#mood-overlay .face-choice');

  faceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      faceBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('mood-selected-display').textContent = btn.getAttribute('aria-label');
      submitBtn.disabled = false;
    });
  });

  submitBtn.addEventListener('click', () => {
    const selected = document.querySelector('#mood-overlay .face-choice.selected');
    if (!selected) return;
    hideMoodOverlay();
    state = State.setPlayerMood(state, selected.getAttribute('aria-label'));
    state = State.advanceLevel(state);
  });
}

function showMoodOverlay(level) {
  document.getElementById('mood-title').textContent = `שלב ${level.index + 1} הושלם!`;
  document.getElementById('mood-question').textContent = level.moodQuestion;
  document.querySelectorAll('#mood-overlay .face-choice').forEach(b => b.classList.remove('selected'));
  document.getElementById('mood-selected-display').textContent = '';
  document.getElementById('mood-submit-btn').disabled = true;
  document.getElementById('mood-overlay').classList.remove('hidden');
  moodOverlayVisible = true;
}

function hideMoodOverlay() {
  document.getElementById('mood-overlay').classList.add('hidden');
  moodOverlayVisible = false;
}

function update(deltaMs) {
  if (state.phase === PHASE.PLAYING) {
    const dy = Input.getShipDelta() * SHIP_SPEED;
    if (dy !== 0) state = State.moveShip(state, dy);

    const deltaX = ITEM_SPEED * (deltaMs / 16.67);
    state = State.updateItems(state, deltaX);

    state = State.tickSpawnTimer(state, deltaMs);
    state = State.tickAvoidance(state, deltaMs);
    const levelForSpawn = LEVELS[state.levelIndex];
    if (state.spawnTimer <= 0) {
      const pick = pickItemType(levelForSpawn.spawnPool, spawnContext(state, levelForSpawn));
      const item = createItem(state.nextItemId, pick.type, pick.yRange, state.items);
      state = State.spawnItem(state, item);
      state = State.recordSpawn(state, pick.type, isCorrectType(levelForSpawn, pick.type));
      state = State.resetSpawnTimer(state, ITEM_SPAWN_INTERVAL);
    }

    if (state.avoidanceTimer >= FLOOD_DELAY_MS && !state.floodTriggered) {
      state = floodSpawn(state, levelForSpawn);
    }

    const level = LEVELS[state.levelIndex];
    const ship = { x: SHIP_X, y: state.shipY, width: SHIP_WIDTH, height: SHIP_HEIGHT };
    for (const item of state.items) {
      // Use reduced hitbox for collectibles (ITEM_HITBOX_RATIO of visual size)
      const itemHitbox = {
        ...item,
        width:  item.width  * ITEM_HITBOX_RATIO,
        height: item.height * ITEM_HITBOX_RATIO,
      };
      if (checkCollision(ship, itemHitbox)) {
        const correct = level.isCorrect(item);
        const hazard  = level.isHazard(item);
        const isCorrect = correct && !hazard;
        const text = level.getFeedbackText(item, correct);
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

function render() {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const level = LEVELS[state.levelIndex];

  switch (state.phase) {
    case PHASE.START:
      Renderer.drawStartScreen(ctx, Assets.images);
      break;

    case PHASE.LEVEL_SELECT:
      Renderer.drawLevelSelectScreen(ctx, Assets.images, state);
      break;

    case PHASE.PLAYING:
    case PHASE.FEEDBACK:
      Renderer.drawBackground(ctx, Assets.images);
      if (state.levelIndex === 2) Renderer.drawWaterline(ctx);
      Renderer.drawShip(ctx, Assets.images, state.shipY);
      Renderer.drawItems(ctx, Assets.images, state.items);
      Renderer.drawCounter(ctx, Assets.images, state.consecutiveCount);
      Renderer.drawLevelIndicator(ctx, Assets.images, state.levelIndex, level.feedbackTypeName);
      Renderer.drawGameplayInstruction(ctx, Assets.images);
      if (state.avoidanceTimer >= NUDGE_DELAY_MS) {
        Renderer.drawAvoidanceNudge(ctx, Assets.images);
      }
      if (state.phase === PHASE.FEEDBACK && state.activePopup) {
        Feedback.drawPopup(ctx, Assets.images, state.activePopup);
      }
      break;

    case PHASE.TRANSITION:
      Renderer.drawBackground(ctx, Assets.images);
      if (state.transition.step === TRANSITION_STEP.REVEAL) {
        Transitions.drawRevealScreen(ctx, Assets.images, level);
      }
      // MOOD step: DOM overlay handles UI, canvas shows background only
      break;

    case PHASE.END:
      Renderer.drawBackground(ctx, Assets.images);
      Transitions.drawEndScreen(ctx, Assets.images, state.levelResults);
      break;

    case PHASE.TREASURE_WIN:
      Renderer.drawTreasureWinScreen(ctx, Assets.images);
      break;
  }
}

function loop(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp;
  const delta = Math.min(timestamp - lastTimestamp, 50);
  lastTimestamp = timestamp;

  const inMoodStep = state.phase === PHASE.TRANSITION && state.transition?.step === TRANSITION_STEP.MOOD;
  if (inMoodStep && !moodOverlayVisible) {
    showMoodOverlay(LEVELS[state.levelIndex]);
  } else if (!inMoodStep && moodOverlayVisible) {
    hideMoodOverlay();
  }

  update(delta);
  render();
  requestAnimationFrame(loop);
}

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

  if (state.phase === PHASE.LEVEL_SELECT) {
    const thumbY = 150;
    const thumbH = 180;
    
    // Check level selection thumbnails clicks
    if (y >= thumbY && y <= thumbY + thumbH) {
      // Level 1: Right (x: 400 to 540)
      if (x >= 400 && x <= 540) {
        state = State.selectLevel(state, 0);
        return;
      }
      // Level 2: Center (x: 230 to 370)
      if (x >= 230 && x <= 370 && State.isLevelUnlocked(state, 1)) {
        state = State.selectLevel(state, 1);
        return;
      }
      // Level 3: Left (x: 60 to 200)
      if (x >= 60 && x <= 200 && State.isLevelUnlocked(state, 2)) {
        state = State.selectLevel(state, 2);
        return;
      }
    }

    // Check click for disabled/enabled treasure button (x: 50 to 550, y: 460 to 510)
    const allCompleted = state.completedLevels.every(c => c === true);
    if (allCompleted && x >= 50 && x <= 550 && y >= 460 && y <= 510) {
      state = State.winTreasure(state);
      return;
    }
    return;
  }

  if (state.phase === PHASE.TRANSITION && state.transition?.step === TRANSITION_STEP.REVEAL) {
    const action = Transitions.handleClick(x, y);
    if (action === 'המשך ←') state = State.advanceTransition(state);
    return;
  }

  if (state.phase === PHASE.END) {
    const action = Transitions.handleClick(x, y);
    if (action === 'שחק שוב') {
      state = State.createInitialState(true);
      state = State.startGame(state);
    }
    return;
  }

  if (state.phase === PHASE.TREASURE_WIN) {
    // Check play again button inside treasure win card
    // Button is at btnX = 300 - 90 = 210, width = 180, btnY = 30 + 450 = 480, height = 42
    if (x >= 210 && x <= 390 && y >= 480 && y <= 522) {
      state = State.createInitialState(true);
      state = State.startGame(state);
    }
    return;
  }
});

initMoodOverlay();

// Wait for both assets and Rubik font before starting loop
Promise.all([Assets.load(), document.fonts.ready])
  .then(() => requestAnimationFrame(loop))
  .catch(err => {
    console.warn('Load warning:', err.message);
    requestAnimationFrame(loop);
  });
