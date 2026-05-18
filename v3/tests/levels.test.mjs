import { test } from 'node:test';
import assert from 'node:assert/strict';
import LEVELS from '../js/levels.js';

test('levels.js does not contain the forbidden word ארגז or ארגזים', () => {
  const serialized = JSON.stringify(LEVELS);
  assert.equal(serialized.includes('ארגז'), false, 'Forbidden word ארגז found in levels config!');
  assert.equal(serialized.includes('ארגזים'), false, 'Forbidden word ארגזים found in levels config!');
});

test('levels.js uses correct Hebrew feminine descriptors for chests (תיבה)', () => {
  // Check L1
  assert.ok(LEVELS[0].transitionReveal.includes('תיבה'), 'Level 1 must refer to chest as תיבה');

  // Check L2 green chest description is feminine "תיבה ירוקה" and NOT "תיבה ירוק"
  const l2Feedback = LEVELS[1].getFeedbackText({ type: 'chest-green' }, false);
  assert.ok(l2Feedback.includes('תיבה ירוקה'), 'Level 2 must use feminine תיבה ירוקה');
  assert.ok(!l2Feedback.includes('תיבה ירוק '), 'Level 2 must not use masculine תיבה ירוק');
  assert.ok(LEVELS[1].transitionReveal.includes('כל התיבות הירוקות מסוכנות'), 'Level 2 transition text must use feminine plural התיבות הירוקות מסוכנות');

  // Check L3 chest descriptors are feminine: "תיבה צפה", "תיבה בטוחה", etc.
  const l3CorrectFeedback = LEVELS[2].getFeedbackText({ type: 'chest-ribbon' }, true);
  assert.ok(l3CorrectFeedback.includes('תיבה צפה'), 'Level 3 correct feedback must use feminine תיבה צפה');
  assert.ok(l3CorrectFeedback.includes('תיבת אוצר אמיתית'), 'Level 3 correct feedback must use feminine תיבת אוצר אמיתית');
  
  const l3Transition = LEVELS[2].transitionReveal;
  assert.ok(l3Transition.includes('תיבה בטוחה'), 'Level 3 transition must use feminine תיבה בטוחה');
});
