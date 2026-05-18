export function createAudioController(makeAudio = () => new Audio()) {
  let armed = false;
  let muted = false;
  let audioContext = null;

  function initAudioContext() {
    if (audioContext) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioContext = new AudioCtx();
      }
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  function playSynthSound(key) {
    if (!armed || muted) return;
    initAudioContext();
    if (!audioContext) return;

    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const t = audioContext.currentTime;

    if (key === 'button-click') {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(100, t + 0.08);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(t);
      osc.stop(t + 0.08);
    } else if (key === 'collect-correct') {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, t); // B5
      osc.frequency.setValueAtTime(1318.51, t + 0.08); // E6
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    } else if (key === 'collect-wrong') {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.linearRampToValueAtTime(80, t + 0.25);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    } else if (key === 'level-complete') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.1);
        gain.gain.setValueAtTime(0.15, t + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(t + idx * 0.1);
        osc.stop(t + idx * 0.1 + 0.25);
      });
    } else if (key === 'pause-open') {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.12);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } else if (key === 'pause-close') {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.12);
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    } else if (key === 'treasure-win') {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
      notes.forEach((freq, idx) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);
        gain.gain.setValueAtTime(0.15, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.08 + 0.4);
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.4);
      });
    }
  }

  const cache = {};

  return {
    arm() {
      armed = true;
      initAudioContext();
    },
    isMuted() {
      return muted;
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    play(key) {
      if (typeof window !== 'undefined') {
        playSynthSound(key);
      }

      if (!armed) return;
      if (!cache[key]) {
        try {
          cache[key] = makeAudio(key);
        } catch (e) {
          // ignore
        }
      }
      if (cache[key] && !muted) {
        try {
          cache[key].play();
        } catch (e) {
          // ignore
        }
      }
    }
  };
}
