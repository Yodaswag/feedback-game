import {
  PHASE,
  TRANSITION_STEP,
  SHIP_X,
  SHIP_WIDTH,
  SHIP_HEIGHT,
  ITEM_SPEED,
  ITEM_SPAWN_INTERVAL,
  SHIP_SPEED,
  POPUP_DURATION,
  CANVAS_SIZE,
  ITEM_HITBOX_RATIO,
  ITEM_WIDTH,
  ITEM_SPAWN_MIN_Y,
  ITEM_SPAWN_MAX_Y,
  NUDGE_DELAY_MS,
  FLOOD_DELAY_MS,
  FLOOD_ITEM_COUNT,
  FLOOD_Y_JITTER,
  FLOOD_X_STAGGER,
} from './constants.js';
import LEVELS from './levels.js';
import * as State from './state.js';
import * as Assets from './assets.js';
import * as Input from './input.js';
import { pickItemType, createItem, createItemAt, checkCollision } from './items.js';
import * as Renderer from './renderer.js';
import * as Feedback from './feedback.js';
import * as Transitions from './transitions.js';
import {
  createCanvasLayout,
  getCursorForTarget,
  resolveCanvasTarget,
  toCanvasPoint,
} from './ui.js';
import { createAudioController } from './audio.js';

const audio = createAudioController();

// Arm audio controller on first click/keydown to bypass browser autoplay policy
document.addEventListener('click', () => audio.arm(), { once: true });
document.addEventListener('keydown', () => audio.arm(), { once: true });

function isCorrectType(level, type) {
  return level.correctSpawnOptions?.some(option => option.type === type) ?? false;
}

function spawnContext(state, level) {
  return {
    recentSpawnHistory: state.recentSpawnHistory,
    incorrectStreak: state.incorrectStreak,
    level,
    levelElapsedMs: state.levelElapsedMs,
  };
}

function floodSpawn(state, level) {
  const minY = ITEM_SPAWN_MIN_Y;
  const maxY = ITEM_SPAWN_MAX_Y;
  const span = maxY - minY;
  const slot = span / (FLOOD_ITEM_COUNT - 1);

  const order = Array.from({ length: FLOOD_ITEM_COUNT }, (_, index) => index);
  for (let index = order.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
  }

  const baseX = CANVAS_SIZE + ITEM_WIDTH / 2;
  const newItems = [];
  let working = state;

  for (let index = 0; index < FLOOD_ITEM_COUNT; index++) {
    const pick = pickItemType(level.spawnPool, spawnContext(working, level));
    const slotIndex = order[index];
    const baseY = minY + slotIndex * slot;
    const jitter = (Math.random() * 2 - 1) * FLOOD_Y_JITTER;
    let y = Math.round(baseY + jitter);
    if (pick.yRange) {
      y = Math.max(pick.yRange[0], Math.min(pick.yRange[1], y));
    }
    y = Math.max(minY, Math.min(maxY, y));

    const item = createItemAt(working.nextItemId + index, pick.type, y);
    item.x = baseX + index * FLOOD_X_STAGGER;
    newItems.push(item);
    working = State.recordSpawn(working, pick.type, isCorrectType(level, pick.type));
  }

  return State.setFloodTriggered(State.appendItems(working, newItems));
}

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const layout = createCanvasLayout(CANVAS_SIZE);

let state = State.createInitialState();
let lastTimestamp = null;
let moodOverlayVisible = false;

// Register utility cluster event listeners
const pauseBtn = document.getElementById('pauseBtn');
const muteBtn = document.getElementById('muteBtn');
const speedBtn = document.getElementById('speedBtn');
const speedTray = document.getElementById('speedTray');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');

if (pauseBtn) {
  pauseBtn.addEventListener('click', () => {
    state = State.setPaused(state, !state.isPaused);
    if (state.isPaused) {
      audio.play('pause-open');
      pauseBtn.textContent = '▶';
    } else {
      audio.play('pause-close');
      pauseBtn.textContent = '⏸';
    }
  });
}

if (muteBtn) {
  muteBtn.addEventListener('click', () => {
    const muted = audio.toggleMute();
    muteBtn.textContent = muted ? '🔇' : '🔊';
  });
}

if (speedBtn) {
  speedBtn.addEventListener('click', () => {
    if (speedTray) {
      speedTray.classList.toggle('hidden');
    }
  });
}

if (speedSlider) {
  speedSlider.addEventListener('input', () => {
    const val = parseFloat(speedSlider.value);
    state = State.setSpeedMultiplier(state, val);
    if (speedValue) {
      speedValue.textContent = `×${val.toFixed(1)}`;
    }
  });
}

// Proximity checker to auto-close the speed tray when cursor leaves it
window.addEventListener('pointermove', event => {
  if (speedTray && speedBtn && !speedTray.classList.contains('hidden')) {
    const rect = speedTray.getBoundingClientRect();
    const btnRect = speedBtn.getBoundingClientRect();
    const pad = 24;
    
    const xMin = Math.min(rect.left, btnRect.left) - pad;
    const xMax = Math.max(rect.right, btnRect.right) + pad;
    const yMin = Math.min(rect.top, btnRect.top) - pad;
    const yMax = Math.max(rect.bottom, btnRect.bottom) + pad;

    const x = event.clientX;
    const y = event.clientY;

    if (x < xMin || x > xMax || y < yMin || y > yMax) {
      speedTray.classList.add('hidden');
    }
  }
});

function clearCanvasHover() {
  state = State.setHoverTarget(state, { id: 'none' });
  canvas.style.cursor = 'default';
}

function syncCanvasHover(event) {
  if (state.phase !== PHASE.START && state.phase !== PHASE.LEVEL_SELECT && state.phase !== PHASE.FEEDBACK) {
    clearCanvasHover();
    return;
  }

  const point = toCanvasPoint(event, canvas, CANVAS_SIZE);
  const hoverTarget = resolveCanvasTarget(layout, state, point.x, point.y);
  state = State.setHoverTarget(state, hoverTarget);
  canvas.style.cursor = getCursorForTarget(hoverTarget);
}

function initMoodOverlay() {
  const submitBtn = document.getElementById('mood-submit-btn');
  const faceBtns = document.querySelectorAll('#mood-overlay .face-choice');

  faceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      audio.play('button-click');
      faceBtns.forEach(faceBtn => faceBtn.classList.remove('selected'));
      btn.classList.add('selected');
      document.getElementById('mood-selected-display').textContent = btn.getAttribute('aria-label');
      submitBtn.disabled = false;
    });
  });

  submitBtn.addEventListener('click', () => {
    audio.play('button-click');
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
  document.querySelectorAll('#mood-overlay .face-choice').forEach(btn => btn.classList.remove('selected'));
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
  // Sync the pauseBtn visibility based on the phase
  if (pauseBtn) {
    if (state.phase === PHASE.PLAYING) {
      pauseBtn.classList.remove('hidden');
    } else {
      pauseBtn.classList.add('hidden');
    }
  }

  // Freeze updates if paused
  if (state.isPaused) return;

  if (state.phase === PHASE.PLAYING) {
    state = State.tickLevelTimer(state, deltaMs);

    const dy = Input.getShipDelta() * SHIP_SPEED * state.speedMultiplier;
    if (dy !== 0) state = State.moveShip(state, dy);

    const deltaX = ITEM_SPEED * (deltaMs / 16.67) * state.speedMultiplier;
    state = State.updateItems(state, deltaX);

    state = State.tickSpawnTimer(state, deltaMs * state.speedMultiplier);
    state = State.tickAvoidance(state, deltaMs * state.speedMultiplier);
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
      const itemHitbox = {
        ...item,
        width: item.width * ITEM_HITBOX_RATIO,
        height: item.height * ITEM_HITBOX_RATIO,
      };
      if (!checkCollision(ship, itemHitbox)) continue;

      const correct = level.isCorrect(item);
      const hazard = level.isHazard(item);
      const itemIsCorrect = correct && !hazard;
      const text = level.getFeedbackText(item, correct);
      const duration = POPUP_DURATION[level.feedbackType];

      if (itemIsCorrect) {
        audio.play('collect-correct');
      } else {
        audio.play('collect-wrong');
      }

      const nextState = State.collectItem(state, item.id, itemIsCorrect);
      
      // Play level complete if consecutive count reached win limit
      const nextConsecCount = nextState.consecutiveCount;
      if (nextConsecCount >= 3) {
        audio.play('level-complete');
      }

      state = State.showPopup(nextState, text, itemIsCorrect, duration);
      break;
    }
  }

  if (state.phase === PHASE.FEEDBACK) {
    state = State.tickPopup(state, deltaMs * state.speedMultiplier);
  }
}

function render() {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  const level = LEVELS[state.levelIndex];

  switch (state.phase) {
    case PHASE.START:
      Renderer.drawStartScreen(ctx, Assets.images, layout, state.hoverTarget);
      break;

    case PHASE.LEVEL_SELECT:
      Renderer.drawLevelSelectScreen(ctx, Assets.images, state, layout, state.hoverTarget);
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
        Feedback.drawPopup(ctx, Assets.images, state.activePopup, state.hoverTarget);
      }
      if (state.isPaused) {
        Renderer.drawPauseOverlay(ctx);
      }
      break;

    case PHASE.TRANSITION:
      Renderer.drawBackground(ctx, Assets.images);
      if (state.transition.step === TRANSITION_STEP.REVEAL) {
        Transitions.drawRevealScreen(ctx, Assets.images, level);
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

document.addEventListener('keydown', event => {
  if (state.isPaused) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      state = State.setPaused(state, false);
      audio.play('pause-close');
      if (pauseBtn) {
        pauseBtn.textContent = '⏸';
      }
      event.preventDefault();
      return;
    }
  }
  Input.onKeyDown(event);
});

document.addEventListener('keyup', Input.onKeyUp);
canvas.addEventListener('pointermove', syncCanvasHover);
canvas.addEventListener('mouseleave', clearCanvasHover);

canvas.addEventListener('click', event => {
  const { x, y } = toCanvasPoint(event, canvas, CANVAS_SIZE);

  if (state.isPaused) {
    state = State.setPaused(state, false);
    audio.play('pause-close');
    if (pauseBtn) {
      pauseBtn.textContent = '⏸';
    }
    return;
  }

  if (state.phase === PHASE.START || state.phase === PHASE.LEVEL_SELECT) {
    const target = resolveCanvasTarget(layout, state, x, y);
    if (target.id === 'start-button') {
      audio.play('button-click');
      state = State.startGame(state);
      clearCanvasHover();
      return;
    }
    if (target.id === 'treasure-button' && state.completedLevels.every(levelComplete => levelComplete === true)) {
      audio.play('treasure-win');
      state = State.winTreasure(state);
      clearCanvasHover();
      return;
    }
    if (/^level-\d+$/.test(target.id)) {
      audio.play('button-click');
      state = State.selectLevel(state, target.levelIndex);
      clearCanvasHover();
    }
    return;
  }

  if (state.phase === PHASE.FEEDBACK) {
    const target = resolveCanvasTarget(layout, state, x, y);
    if (target.id === 'feedback-close') {
      audio.play('button-click');
      state = State.dismissPopup(state);
      clearCanvasHover();
    }
    return;
  }

  if (state.phase === PHASE.TRANSITION && state.transition?.step === TRANSITION_STEP.REVEAL) {
    const clicked = Transitions.handleClick(x, y);
    if (clicked === 'reveal-continue' || clicked === 'המשך ←') {
      audio.play('button-click');
      state = State.advanceTransition(state);
    }
    return;
  }

  if (state.phase === PHASE.END) {
    const clicked = Transitions.handleClick(x, y);
    if (clicked === 'end-restart' || clicked === 'שחק שוב') {
      audio.play('button-click');
      state = {
        ...state,
        phase: PHASE.LEVEL_SELECT,
        completedLevels: [true, true, true],
        hasSeenReflection: true,
        hoverTarget: { id: 'none' }
      };
      clearCanvasHover();
    }
    return;
  }
});

initMoodOverlay();

Promise.all([Assets.load(), document.fonts.ready])
  .then(() => requestAnimationFrame(loop))
  .catch(err => {
    console.warn('Load warning:', err.message);
    requestAnimationFrame(loop);
  });
