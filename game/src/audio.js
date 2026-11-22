// Tiny WebAudio sound kit: every event gets its own short tone.
window.MapVaultAudio = (function () {
  var ctx = null;
  var muted = false;

  function ensureContext() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    var c = ensureContext();
    if (!c) return;
    var t = c.currentTime;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t + dur);
    gain.gain.setValueAtTime(vol || 0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  return {
    unlock: function () { ensureContext(); },
    toggleMute: function () { muted = !muted; return muted; },
    isMuted: function () { return muted; },
    step: function () { tone(180 + Math.random() * 40, 0.05, 'triangle', 0.03); },
    coinClink: function () { tone(1560, 0.12, 'square', 0.05); tone(2090, 0.18, 'sine', 0.05); },
    smokePuff: function () { tone(320, 0.3, 'sine', 0.06, 90); },
    pickup: function () { tone(880, 0.1, 'sine', 0.07); setTimeout(function () { tone(1318, 0.16, 'sine', 0.07); }, 70); },
    doorOpen: function () { tone(523, 0.12, 'triangle', 0.07); setTimeout(function () { tone(784, 0.2, 'triangle', 0.07); }, 90); },
    spotted: function () { tone(660, 0.09, 'square', 0.05, 880); },
    caught: function () { tone(392, 0.25, 'sawtooth', 0.09, 130); },
    win: function () {
      [523, 659, 784, 1046].forEach(function (f, i) {
        setTimeout(function () { tone(f, 0.22, 'triangle', 0.08); }, i * 110);
      });
    },
    denied: function () { tone(220, 0.12, 'square', 0.05, 180); }
  };
})();
