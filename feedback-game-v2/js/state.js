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
  // Constrain ship to water strip (WATER_Y_TOP + margin → canvas bottom - margin)
  const newY = Math.max(140, Math.min(555, state.shipY + dy));
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
    .filter(item => item.x + item.width > 0);
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
