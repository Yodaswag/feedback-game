import test from 'node:test';
import assert from 'node:assert/strict';
import { ASSET_URLS } from '../js/assets.js';

test('asset manifest exposes every supplied visual asset', () => {
  assert.deepEqual(Object.keys(ASSET_URLS).sort(), [
    'arrow',
    'backgroundTexture',
    'bomb',
    'colorPalette',
    'ship',
    'treasureChest',
    'waterBackground',
  ]);
});
