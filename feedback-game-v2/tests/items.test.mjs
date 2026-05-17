// tests/items.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickItemType, createItem, checkCollision } from '../js/items.js';
import { ITEM, CANVAS_SIZE, ITEM_WIDTH, ITEM_HEIGHT, ITEM_SPAWN_MIN_Y, ITEM_SPAWN_MAX_Y } from '../js/constants.js';

// pickItemType
test('pickItemType returns one of the types in pool', () => {
  const pool = [
    { type: ITEM.CHEST_RIBBON, weight: 3 },
    { type: ITEM.CHEST_PLAIN,  weight: 3 },
    { type: ITEM.BOMB_LIT,     weight: 2 },
  ];
  const validTypes = pool.map(e => e.type);
  for (let i = 0; i < 100; i++) {
    const result = pickItemType(pool);
    assert.ok(validTypes.includes(result.type), `unexpected type: ${result.type}`);
  }
});

test('pickItemType with weight-0 entry never returns that type', () => {
  const pool = [
    { type: ITEM.CHEST_RIBBON, weight: 0 },
    { type: ITEM.BOMB_LIT,     weight: 10 },
  ];
  for (let i = 0; i < 50; i++) {
    assert.equal(pickItemType(pool).type, ITEM.BOMB_LIT);
  }
});

// createItem
test('createItem returns item with given id and type', () => {
  const item = createItem(5, ITEM.CHEST_RIBBON);
  assert.equal(item.id, 5);
  assert.equal(item.type, ITEM.CHEST_RIBBON);
});

test('createItem spawns at right edge of canvas', () => {
  const item = createItem(0, ITEM.BOMB_LIT);
  assert.ok(item.x >= CANVAS_SIZE, `x ${item.x} should be >= CANVAS_SIZE ${CANVAS_SIZE}`);
});

test('createItem y is within spawn bounds', () => {
  for (let i = 0; i < 30; i++) {
    const item = createItem(i, ITEM.CHEST_RIBBON);
    assert.ok(item.y >= ITEM_SPAWN_MIN_Y, `y ${item.y} too small`);
    assert.ok(item.y <= ITEM_SPAWN_MAX_Y, `y ${item.y} too large`);
  }
});

test('createItem has correct width and height', () => {
  const item = createItem(0, ITEM.CHEST_RIBBON);
  assert.equal(item.width,  ITEM_WIDTH);
  assert.equal(item.height, ITEM_HEIGHT);
});

// checkCollision — center-based rectangles
test('checkCollision returns true when ship and item overlap', () => {
  const ship = { x: 100, y: 200, width: 80, height: 60 };
  const item = { x: 110, y: 205, width: 58, height: 58 };
  assert.equal(checkCollision(ship, item), true);
});

test('checkCollision returns false when ship is to the left of item', () => {
  const ship = { x: 50,  y: 200, width: 80, height: 60 };
  const item = { x: 300, y: 200, width: 58, height: 58 };
  assert.equal(checkCollision(ship, item), false);
});

test('checkCollision returns false when ship Y does not overlap', () => {
  const ship = { x: 100, y: 100, width: 80, height: 60 };
  const item = { x: 110, y: 400, width: 58, height: 58 };
  assert.equal(checkCollision(ship, item), false);
});

test('checkCollision returns false when items are exactly touching (not overlapping)', () => {
  // ship center=100, halfWidth=40 → right edge at 140
  // item center=200, halfWidth=29 → left edge at 171
  // gap = 31px → no overlap
  const ship = { x: 100, y: 200, width: 80, height: 60 };
  const item = { x: 200, y: 200, width: 58, height: 58 };
  assert.equal(checkCollision(ship, item), false);
});
