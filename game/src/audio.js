// Tiny WebAudio sound set: one short blip per event, no audio files.
// The mute button and the M key share the same switch.

let ctx = null;
let muted = false;

function ensureCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, gain, slideTo) {
  if (muted) return;
  const ac = ensureCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, ac.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
  g.gain.setValueAtTime(gain || 0.08, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  osc.connect(g).connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + dur);
}

export const sfx = {
  coinToss() { tone(1560, 0.12, 'triangle', 0.07, 980); },
  coinLand() { tone(880, 0.09, 'square', 0.05); },
  suspicionTick() { tone(660, 0.05, 'square', 0.03); },
  caught() { tone(220, 0.45, 'sawtooth', 0.11, 110); },
  gem() { tone(1046, 0.14, 'sine', 0.09); setTimeout(() => tone(1568, 0.2, 'sine', 0.09), 90); },
  exitOk() { tone(784, 0.16, 'triangle', 0.09); setTimeout(() => tone(1175, 0.26, 'triangle', 0.09), 120); },
  levelStart() { tone(523, 0.12, 'triangle', 0.07); },
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.22, 'triangle', 0.09), i * 130)); },
};

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() { return muted; }
