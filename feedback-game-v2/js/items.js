import { CANVAS_SIZE, ITEM_WIDTH, ITEM_HEIGHT } from './constants.js';

// Weighted random pick from spawnPool entries { type, weight }
export function pickItemType(spawnPool) {
  const totalWeight = spawnPool.reduce((sum, e) => sum + e.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const entry of spawnPool) {
    rand -= entry.weight;
    if (rand <= 0) return entry.type;
  }
  return spawnPool[spawnPool.length - 1].type;
}

// Create a new item at the right edge, random Y within canvas
export function createItem(id, type) {
  const minY = ITEM_HEIGHT;
  const maxY = CANVAS_SIZE - ITEM_HEIGHT;
  const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
  return {
    id,
    type,
    x: CANVAS_SIZE + ITEM_WIDTH / 2,
    y,
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
  };
}

// AABB collision using center-based positions
export function checkCollision(a, b) {
  return (
    Math.abs(a.x - b.x) < (a.width  + b.width)  / 2 &&
    Math.abs(a.y - b.y) < (a.height + b.height) / 2
  );
}
