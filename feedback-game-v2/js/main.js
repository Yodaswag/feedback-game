import { PHASE, TRANSITION_STEP, SHIP_X, SHIP_WIDTH, SHIP_HEIGHT,
         ITEM_SPEED, ITEM_SPAWN_INTERVAL, SHIP_SPEED, POPUP_DURATION,
         CANVAS_SIZE, ITEM_HITBOX_RATIO } from './constants.js';
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
    if (state.spawnTimer <= 0) {
      const level = LEVELS[state.levelIndex];
      const type = pickItemType(level.spawnPool);
      const item = createItem(state.nextItemId, type);
      state = State.spawnItem(state, item);
      state = State.resetSpawnTimer(state, ITEM_SPAWN_INTERVAL);
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

    case PHASE.PLAYING:
    case PHASE.FEEDBACK:
      Renderer.drawBackground(ctx, Assets.images);
      if (state.levelIndex === 2) Renderer.drawWaterline(ctx);
      Renderer.drawShip(ctx, Assets.images, state.shipY);
      Renderer.drawItems(ctx, Assets.images, state.items);
      Renderer.drawCounter(ctx, Assets.images, state.consecutiveCount);
      Renderer.drawLevelIndicator(ctx, Assets.images, state.levelIndex, level.feedbackTypeName);
      Renderer.drawGameplayInstruction(ctx, Assets.images);
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

  if (state.phase === PHASE.TRANSITION && state.transition?.step === TRANSITION_STEP.REVEAL) {
    const action = Transitions.handleClick(x, y);
    if (action === 'המשך ←') state = State.advanceTransition(state);
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

initMoodOverlay();

// Wait for both assets and Rubik font before starting loop
Promise.all([Assets.load(), document.fonts.ready])
  .then(() => requestAnimationFrame(loop))
  .catch(err => {
    console.warn('Load warning:', err.message);
    requestAnimationFrame(loop);
  });
