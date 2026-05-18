const held = new Set();

export function onKeyDown(e) {
  held.add(e.key);
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    if (e.target && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  }
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
