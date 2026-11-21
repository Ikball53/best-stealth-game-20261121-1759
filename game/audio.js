// Tiny WebAudio sound kit: one short synth blip per game event, with a mute switch.
"use strict";

var SoundKit = (function () {
  var ctx = null;
  var muted = false;

  function ensureContext() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  function tone(freq, dur, type, gain, slideTo) {
    if (muted) return;
    var ac = ensureContext();
    if (!ac) return;
    if (ac.state === "suspended") ac.resume();
    var osc = ac.createOscillator();
    var amp = ac.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, ac.currentTime);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, ac.currentTime + dur);
    amp.gain.setValueAtTime(gain || 0.08, ac.currentTime);
    amp.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
    osc.connect(amp);
    amp.connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + dur);
  }

  function playStep() { tone(180, 0.05, "triangle", 0.02); }
  function playPickup() { tone(880, 0.12, "sine", 0.09, 1320); }
  function playCrown() { tone(660, 0.16, "sine", 0.1, 990); setTimeout(function () { tone(990, 0.2, "sine", 0.1, 1480); }, 90); }
  function playCoin() { tone(1560, 0.09, "square", 0.05, 1180); }
  function playSpotted() { tone(520, 0.14, "sawtooth", 0.07, 740); }
  function playCaught() { tone(300, 0.4, "sawtooth", 0.12, 110); }
  function playWin() { tone(523, 0.14, "triangle", 0.1); setTimeout(function () { tone(659, 0.14, "triangle", 0.1); }, 110); setTimeout(function () { tone(784, 0.26, "triangle", 0.11); }, 220); }
  function playClick() { tone(440, 0.05, "sine", 0.05); }

  function toggleMute() {
    muted = !muted;
    return muted;
  }
  function isMuted() { return muted; }
  function unlock() { ensureContext(); }

  return {
    playStep: playStep,
    playPickup: playPickup,
    playCrown: playCrown,
    playCoin: playCoin,
    playSpotted: playSpotted,
    playCaught: playCaught,
    playWin: playWin,
    playClick: playClick,
    toggleMute: toggleMute,
    isMuted: isMuted,
    unlock: unlock
  };
})();
