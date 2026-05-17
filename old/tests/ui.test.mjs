import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { updateChecklist } from '../js/ui.js';

function createFakeChecklistItem() {
  const statusIcon = { textContent: '⬜' };
  const classes = new Set(['mode-check-item', 'is-pending']);

  return {
    querySelector(selector) {
      return selector === '.status-icon' ? statusIcon : null;
    },
    classList: {
      toggle(name, force) {
        if (force) classes.add(name);
        else classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
    statusIcon,
  };
}

test('updateChecklist updates inline mode-card checklist items', () => {
  const elements = {
    'mode-outcome-pos': createFakeChecklistItem(),
    'mode-outcome-neg': createFakeChecklistItem(),
    'mode-corrective-pos': createFakeChecklistItem(),
    'mode-corrective-neg': createFakeChecklistItem(),
    'mode-elaborative-pos': createFakeChecklistItem(),
    'mode-elaborative-neg': createFakeChecklistItem(),
  };

  global.document = {
    getElementById(id) {
      return elements[id] ?? null;
    },
  };

  updateChecklist({
    outcome: { pos: true, neg: false },
    corrective: { pos: false, neg: true },
    elaborative: { pos: true, neg: true },
  });

  assert.equal(elements['mode-outcome-pos'].classList.contains('is-complete'), true);
  assert.equal(elements['mode-outcome-pos'].classList.contains('is-pending'), false);
  assert.equal(elements['mode-outcome-pos'].statusIcon.textContent, '✅');

  assert.equal(elements['mode-outcome-neg'].classList.contains('is-complete'), false);
  assert.equal(elements['mode-outcome-neg'].classList.contains('is-pending'), true);
  assert.equal(elements['mode-outcome-neg'].statusIcon.textContent, '⬜');

  assert.equal(elements['mode-corrective-neg'].classList.contains('is-complete'), true);
  assert.equal(elements['mode-elaborative-pos'].classList.contains('is-complete'), true);
  assert.equal(elements['mode-elaborative-neg'].classList.contains('is-complete'), true);
});

test('old index embeds checklist inside mode cards and removes duplicate progress UI', () => {
  const html = fs.readFileSync(path.resolve('old/index.html'), 'utf8');

  assert.equal(html.includes('id="chestProgress"'), false);
  assert.equal(html.includes('משימות לביצוע'), false);
  assert.match(html, /id="mode-outcome"[\s\S]*id="mode-outcome-pos"[\s\S]*id="mode-outcome-neg"/);
  assert.match(html, /id="mode-corrective"[\s\S]*id="mode-corrective-pos"[\s\S]*id="mode-corrective-neg"/);
  assert.match(html, /id="mode-elaborative"[\s\S]*id="mode-elaborative-pos"[\s\S]*id="mode-elaborative-neg"/);
});

test('old index includes startup spotlight and disabled start gate until first mode selection', () => {
  const html = fs.readFileSync(path.resolve('old/index.html'), 'utf8');

  assert.match(html, /id="modeSpotlight"/);
  assert.match(html, /id="spotlightStartHint"/);
  assert.match(html, /id="overlayStartBtn"[^>]*disabled/);
});
