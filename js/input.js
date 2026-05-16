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
