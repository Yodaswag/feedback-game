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
      if (checkCollision(ship, item)) {
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

function loop(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp;
  const delta = Math.min(timestamp - lastTimestamp, 50);
  lastTimestamp = timestamp;
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

Assets.load()
  .then(() => requestAnimationFrame(loop))
  .catch(err => {
    console.warn('Asset load warning:', err.message);
    requestAnimationFrame(loop);
  });
