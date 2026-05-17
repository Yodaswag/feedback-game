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
