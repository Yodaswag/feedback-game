// tests/levels.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import LEVELS from '../js/levels.js';
import { WATERLINE_Y } from '../js/constants.js';

const item = (type, y = 200) => ({ type, x: 400, y, width: 58, height: 58 });

test('LEVELS has exactly 3 entries', () => {
  assert.equal(LEVELS.length, 3);
});

// Level 0 — Outcome
test('level 0: chest-ribbon is correct', () => {
  assert.equal(LEVELS[0].isCorrect(item('chest-ribbon')), true);
});
test('level 0: chest-plain is not correct', () => {
  assert.equal(LEVELS[0].isCorrect(item('chest-plain')), false);
});
test('level 0: bomb-lit is a hazard', () => {
  assert.equal(LEVELS[0].isHazard(item('bomb-lit')), true);
});
test('level 0: correct feedback is נכון', () => {
  assert.equal(LEVELS[0].getFeedbackText(item('chest-ribbon'), true), 'נכון');
});
test('level 0: wrong feedback is לא נכון', () => {
  assert.equal(LEVELS[0].getFeedbackText(item('chest-plain'), false), 'לא נכון');
});
test('level 0: has non-empty revealCardText', () => {
  assert.ok(LEVELS[0].revealCardText.length > 30);
});

// Level 1 — Corrective
test('level 1: bomb-unlit is correct', () => {
  assert.equal(LEVELS[1].isCorrect(item('bomb-unlit')), true);
});
test('level 1: chest-green is not correct', () => {
  assert.equal(LEVELS[1].isCorrect(item('chest-green')), false);
});
test('level 1: bomb-lit is a hazard', () => {
  assert.equal(LEVELS[1].isHazard(item('bomb-lit')), true);
});
test('level 1: chest-green is not a hazard', () => {
  assert.equal(LEVELS[1].isHazard(item('chest-green')), false);
});
test('level 1: correct feedback names the item', () => {
  const text = LEVELS[1].getFeedbackText(item('bomb-unlit'), true);
  assert.ok(text.includes('כבויה'), `expected "כבויה" in "${text}"`);
});
test('level 1: wrong chest-green feedback names the chest', () => {
  const text = LEVELS[1].getFeedbackText(item('chest-green'), false);
  assert.ok(text.includes('ירוק'), `expected "ירוק" in "${text}"`);
});
test('level 1: wrong bomb-lit feedback names the bomb', () => {
  const text = LEVELS[1].getFeedbackText(item('bomb-lit'), false);
  assert.ok(text.includes('דולקת'), `expected "דולקת" in "${text}"`);
});
test('level 1: has non-empty revealCardText', () => {
  assert.ok(LEVELS[1].revealCardText.length > 30);
});

// Level 2 — Constructive (positional rule)
test('level 2: chest-ribbon ABOVE waterline is correct', () => {
  assert.equal(LEVELS[2].isCorrect(item('chest-ribbon', WATERLINE_Y - 1)), true);
});
test('level 2: chest-ribbon BELOW waterline is NOT correct', () => {
  assert.equal(LEVELS[2].isCorrect(item('chest-ribbon', WATERLINE_Y + 1)), false);
});
test('level 2: chest-ribbon AT waterline is NOT correct', () => {
  assert.equal(LEVELS[2].isCorrect(item('chest-ribbon', WATERLINE_Y)), false);
});
test('level 2: bomb-unlit BELOW waterline is correct', () => {
  assert.equal(LEVELS[2].isCorrect(item('bomb-unlit', WATERLINE_Y + 1)), true);
});
test('level 2: bomb-unlit AT waterline is correct', () => {
  assert.equal(LEVELS[2].isCorrect(item('bomb-unlit', WATERLINE_Y)), true);
});
test('level 2: bomb-unlit ABOVE waterline is NOT correct', () => {
  assert.equal(LEVELS[2].isCorrect(item('bomb-unlit', WATERLINE_Y - 1)), false);
});
test('level 2: bomb-lit is a hazard regardless of position', () => {
  assert.equal(LEVELS[2].isHazard(item('bomb-lit', 100)), true);
  assert.equal(LEVELS[2].isHazard(item('bomb-lit', 500)), true);
});
test('level 2: correct chest-ribbon feedback mentions waterline and gives rule', () => {
  const text = LEVELS[2].getFeedbackText(item('chest-ribbon', 100), true);
  assert.ok(text.length > 30, 'constructive feedback should be long');
  assert.ok(text.includes('קו המים') || text.includes('עליון') || text.includes('צף'),
    `expected waterline reference in "${text}"`);
  assert.ok(text.includes('כלל') || text.includes('חפש'),
    'should include strategy hint');
});
test('level 2: wrong chest-ribbon feedback explains position error and rule', () => {
  const text = LEVELS[2].getFeedbackText(item('chest-ribbon', 400), false);
  assert.ok(text.includes('קו המים') || text.includes('תחתון') || text.includes('מתחת'),
    `expected below-waterline reference in "${text}"`);
  assert.ok(text.includes('כלל') || text.includes('מעל'),
    'should redirect player to correct zone');
});
test('level 2: correct bomb-unlit feedback explains position and rule', () => {
  const text = LEVELS[2].getFeedbackText(item('bomb-unlit', 400), true);
  assert.ok(text.includes('קו המים') || text.includes('תחתון') || text.includes('מתחת'),
    `expected below-waterline reference in "${text}"`);
});
test('level 2: wrong bomb-unlit feedback explains position error', () => {
  const text = LEVELS[2].getFeedbackText(item('bomb-unlit', 100), false);
  assert.ok(text.includes('קו המים') || text.includes('עליון') || text.includes('מעל'),
    `expected above-waterline reference in "${text}"`);
});
test('level 2: has non-empty revealCardText', () => {
  assert.ok(LEVELS[2].revealCardText.length > 30);
});

// All levels
test('each level has a non-empty transitionReveal', () => {
  for (const level of LEVELS) {
    assert.ok(level.transitionReveal.length > 0, `level ${level.index} transitionReveal is empty`);
  }
});
test('each level has a non-empty revealCardText', () => {
  for (const level of LEVELS) {
    assert.ok(level.revealCardText && level.revealCardText.length > 30,
      `level ${level.index} revealCardText missing or too short`);
  }
});
