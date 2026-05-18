import {
  PHASE, TRANSITION_STEP, CONSECUTIVE_TO_WIN, SPAWN_HISTORY_LEN,
} from './constants.js';

export function createInitialState(allUnlocked = false) {
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
    recentSpawnHistory: [],
    incorrectStreak: 0,
    avoidanceTimer: 0,
    floodTriggered: false,
    completedLevels: [false, false, false],
    allLevelsUnlockedFromStart: allUnlocked,
  };
}

export function isLevelUnlocked(state, index) {
  if (state.allLevelsUnlockedFromStart) return true;
  if (index === 0) return true;
  if (index === 1) return state.completedLevels[0] === true;
  if (index === 2) return state.completedLevels[1] === true;
  return false;
}

export function startGame(state) {
  return { ...state, phase: PHASE.LEVEL_SELECT };
}

export function selectLevel(state, levelIndex) {
  return {
    ...state,
    phase: PHASE.PLAYING,
    levelIndex: levelIndex,
    consecutiveCount: 0,
    items: [],
    activePopup: null,
    popupTimer: 0,
    transition: null,
    spawnTimer: 0,
    recentSpawnHistory: [],
    incorrectStreak: 0,
    avoidanceTimer: 0,
    floodTriggered: false,
  };
}

export function winTreasure(state) {
  return {
    ...state,
    phase: PHASE.TREASURE_WIN
  };
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
  return {
    ...state,
    items,
    consecutiveCount,
    avoidanceTimer: 0,
    floodTriggered: false,
  };
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
  const completed = [...state.completedLevels];
  completed[state.levelIndex] = true;

  return {
    ...state,
    phase: PHASE.LEVEL_SELECT,
    completedLevels: completed,
    consecutiveCount: 0,
    items: [],
    activePopup: null,
    popupTimer: 0,
    transition: null,
    spawnTimer: 0,
    recentSpawnHistory: [],
    incorrectStreak: 0,
    avoidanceTimer: 0,
    floodTriggered: false,
    levelResults: [
      ...state.levelResults,
      { levelIndex: state.levelIndex, mood: state.transition?.playerMood ?? null },
    ],
  };
}

export function resetSpawnTimer(state, interval) {
  return { ...state, spawnTimer: interval };
}

export function tickSpawnTimer(state, deltaMs) {
  return { ...state, spawnTimer: Math.max(0, state.spawnTimer - deltaMs) };
}

// Record that an item of `type` was spawned. `isCorrectType` resets/increments
// the incorrect streak used by the smart spawn algorithm.
export function recordSpawn(state, type, isCorrectType) {
  const history = [...state.recentSpawnHistory, type].slice(-SPAWN_HISTORY_LEN);
  const incorrectStreak = isCorrectType ? 0 : state.incorrectStreak + 1;
  return { ...state, recentSpawnHistory: history, incorrectStreak };
}

export function tickAvoidance(state, deltaMs) {
  return { ...state, avoidanceTimer: state.avoidanceTimer + deltaMs };
}

export function setFloodTriggered(state) {
  return { ...state, floodTriggered: true };
}

export function appendItems(state, newItems) {
  return {
    ...state,
    items: [...state.items, ...newItems],
    nextItemId: state.nextItemId + newItems.length,
  };
}
