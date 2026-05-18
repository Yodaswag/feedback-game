import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudioController } from '../js/audio.js';

test('audio play does nothing before arm()', () => {
  let played = 0;
  const audio = createAudioController(() => ({
    play() { played++; }
  }));

  audio.play('button-click');
  assert.equal(played, 0);

  audio.arm();
  audio.play('button-click');
  assert.equal(played, 1);
});

test('audio toggleMute mutes/unmutes audio playback', () => {
  let played = 0;
  const audio = createAudioController(() => ({
    play() { played++; }
  }));

  audio.arm();
  audio.play('button-click');
  assert.equal(played, 1);

  audio.toggleMute();
  assert.equal(audio.isMuted(), true);

  audio.play('button-click');
  // Should not play while muted!
  assert.equal(played, 1);

  audio.toggleMute();
  assert.equal(audio.isMuted(), false);

  audio.play('button-click');
  assert.equal(played, 2);
});
