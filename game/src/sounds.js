// Sounds, synthesised with WebAudio: no audio files, no network, nothing to load.
// The context is created on the first user gesture; M toggles the mute.
export function createSounds() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) return context;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      context = new AC();
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freq, dur, type, gain, when) {
    const ctx = ensure();
    if (!ctx || muted) return;
    try {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(gain, ctx.currentTime + when);
      amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + dur);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(ctx.currentTime + when);
      osc.stop(ctx.currentTime + when + dur + 0.02);
    } catch {
      // Audio is decoration: a failure here never stops the game.
    }
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    click() {
      tone(660, 0.06, 'sine', 0.08, 0);
    },
    play() {
      tone(392, 0.09, 'triangle', 0.12, 0);
      tone(523, 0.12, 'triangle', 0.12, 0.07);
    },
    hit() {
      tone(180, 0.14, 'sawtooth', 0.10, 0);
      tone(90, 0.18, 'square', 0.08, 0.02);
    },
    draw() {
      tone(880, 0.05, 'sine', 0.06, 0);
    },
    turn() {
      tone(523, 0.08, 'sine', 0.08, 0);
    },
    win() {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.12, i * 0.12));
    },
    lose() {
      [392, 330, 262, 196].forEach((f, i) => tone(f, 0.25, 'sine', 0.10, i * 0.14));
    },
  };
}
