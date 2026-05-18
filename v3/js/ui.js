export function createCanvasLayout(canvasSize) {
  const safeCanvasSize = Number.isFinite(canvasSize) ? Math.max(0, canvasSize) : 0;
  const sharedPage = {
    x: 24,
    y: 18,
    w: Math.max(0, safeCanvasSize - 48),
    h: Math.max(0, safeCanvasSize - 36),
  };
  const startButtonWidth = Math.max(0, sharedPage.w - 300);
  const treasureButtonWidth = Math.max(0, sharedPage.w - 140);
  const supportsLevelCards = sharedPage.w >= 450 && sharedPage.h >= 355;

  return {
    canvasSize: safeCanvasSize,
    targetResolution: safeCanvasSize,
    sharedPage,
    startButton: toCenterRect({
      x: sharedPage.x + Math.max(0, (sharedPage.w - startButtonWidth) / 2),
      y: sharedPage.y + Math.max(0, sharedPage.h - 118),
      w: startButtonWidth,
      h: Math.min(56, sharedPage.h),
    }),
    levelCards: supportsLevelCards
      ? [
          { index: 0, cx: sharedPage.x + sharedPage.w - 120, cy: sharedPage.y + 260, w: 150, h: 190 },
          { index: 1, cx: sharedPage.x + sharedPage.w / 2, cy: sharedPage.y + 260, w: 150, h: 190 },
          { index: 2, cx: sharedPage.x + 120, cy: sharedPage.y + 260, w: 150, h: 190 },
        ]
      : [],
    treasureButton: toCenterRect({
      x: sharedPage.x + Math.max(0, Math.min(70, sharedPage.w / 2)),
      y: sharedPage.y + Math.max(0, sharedPage.h - 92),
      w: treasureButtonWidth,
      h: Math.min(54, sharedPage.h),
    }),
  };
}

export function resolveCanvasTarget(layout, state, x, y) {
  if (state.phase === 'START' && isPointInsideRect(layout.startButton, x, y)) {
    return { id: 'start-button' };
  }

  if (state.phase === 'LEVEL_SELECT') {
    for (const card of layout.levelCards) {
      if (!isPointInsideExpandedRect(centeredRect(card), x, y, 6)) continue;
      const unlocked = isLevelUnlocked(state, card.index);
      return {
        id: unlocked ? `level-${card.index}` : `level-${card.index}-locked`,
        levelIndex: card.index,
      };
    }

    if (isPointInsideRect(layout.treasureButton, x, y)) {
      return { id: isTreasureUnlocked(state) ? 'treasure-button' : 'treasure-button-locked' };
    }
  }

  if (state.phase === 'FEEDBACK') {
    const POPUP_W = 340;
    const POPUP_H = 205;
    const POPUP_X = (layout.canvasSize - POPUP_W) / 2;
    const POPUP_Y = (layout.canvasSize - POPUP_H) / 2;
    const closeRect = {
      x: POPUP_X + POPUP_W - 40,
      y: POPUP_Y + 12,
      w: 28,
      h: 28,
    };
    if (isPointInsideRect(closeRect, x, y)) {
      return { id: 'feedback-close' };
    }
  }

  return { id: 'none' };
}

export function getCursorForTarget(target) {
  const id = typeof target?.id === 'string' ? target.id : '';
  if (!id || id === 'none') return 'default';
  if (id.endsWith('-locked')) return 'not-allowed';
  if (id === 'start-button' || id === 'treasure-button' || id === 'feedback-close' || /^level-\d+$/.test(id)) return 'pointer';
  return 'default';
}

export function toCanvasPoint(event, canvas, targetResolution = { width: canvas.width, height: canvas.height }) {
  const rect = canvas.getBoundingClientRect();
  const logicalSize = normalizeTargetResolution(targetResolution, canvas);
  const scaleX = getSafeScale(logicalSize.width, rect.width);
  const scaleY = getSafeScale(logicalSize.height, rect.height);

  return {
    x: getSafeCanvasCoordinate(event.clientX, rect.left, scaleX),
    y: getSafeCanvasCoordinate(event.clientY, rect.top, scaleY),
  };
}

export function isPointInsideExpandedRect(rect, x, y, pad = 0) {
  return isPointInsideRect({
    x: rect.x - pad,
    y: rect.y - pad,
    w: rect.w + pad * 2,
    h: rect.h + pad * 2,
  }, x, y);
}

export function shouldHideSpeedTray(bounds, point, pad = 18) {
  return !isPointInsideExpandedRect(bounds, point.x, point.y, pad);
}

function isLevelUnlocked(state, levelIndex) {
  if (levelIndex === 0) return true;
  if (state.allLevelsUnlockedFromStart) return true;
  return state.completedLevels?.[levelIndex - 1] === true;
}

function isTreasureUnlocked(state) {
  if (state.hasSeenReflection === true) return true;
  return Array.isArray(state.completedLevels)
    && state.completedLevels.length >= 3
    && state.completedLevels.slice(0, 3).every(levelComplete => levelComplete === true);
}

function isPointInsideRect(rect, x, y) {
  if (rect.w <= 0 || rect.h <= 0) return false;
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function centeredRect(rect) {
  return {
    x: rect.cx - rect.w / 2,
    y: rect.cy - rect.h / 2,
    w: rect.w,
    h: rect.h,
  };
}

function toCenterRect(rect) {
  return {
    ...rect,
    cx: rect.x + rect.w / 2,
    cy: rect.y + rect.h / 2,
  };
}

function normalizeTargetResolution(targetResolution, canvas) {
  if (typeof targetResolution === 'number') {
    return { width: targetResolution, height: targetResolution };
  }

  return {
    width: Number.isFinite(targetResolution?.width) ? Math.max(0, targetResolution.width) : Math.max(0, canvas.width),
    height: Number.isFinite(targetResolution?.height) ? Math.max(0, targetResolution.height) : Math.max(0, canvas.height),
  };
}

function getSafeScale(logicalSize, rectSize) {
  if (!Number.isFinite(logicalSize) || !Number.isFinite(rectSize) || rectSize <= 0) {
    return 0;
  }

  return logicalSize / rectSize;
}

function getSafeCanvasCoordinate(clientCoord, rectStart, scale) {
  if (!Number.isFinite(clientCoord) || !Number.isFinite(rectStart) || !Number.isFinite(scale) || scale === 0) {
    return 0;
  }

  const value = (clientCoord - rectStart) * scale;
  return Number.isFinite(value) ? value : 0;
}
