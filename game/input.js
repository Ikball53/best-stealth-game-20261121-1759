// Keyboard and mouse state: held keys, sneak modifier, coin-toss aim point.
"use strict";

var InputState = (function () {
  var held = {};
  var mouseX = 480;
  var mouseY = 300;
  var tossQueued = false;
  var restartQueued = false;
  var muteQueued = false;

  function onKeyDown(ev) {
    var k = ev.key.toLowerCase();
    held[k] = true;
    if (k === "q") tossQueued = true;
    if (k === "r") restartQueued = true;
    if (k === "m") muteQueued = true;
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].indexOf(k) >= 0) ev.preventDefault();
  }
  function onKeyUp(ev) {
    held[ev.key.toLowerCase()] = false;
  }
  function onMouseMove(ev, canvas) {
    var rect = canvas.getBoundingClientRect();
    mouseX = (ev.clientX - rect.left) * (canvas.width / rect.width);
    mouseY = (ev.clientY - rect.top) * (canvas.height / rect.height);
  }
  function onMouseDown(ev) {
    if (ev.button === 0) tossQueued = true;
  }

  function attach(canvas) {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousemove", function (ev) { onMouseMove(ev, canvas); });
    canvas.addEventListener("mousedown", onMouseDown);
  }

  function moveVector() {
    var dx = 0;
    var dy = 0;
    if (held["a"] || held["arrowleft"]) dx -= 1;
    if (held["d"] || held["arrowright"]) dx += 1;
    if (held["w"] || held["arrowup"]) dy -= 1;
    if (held["s"] || held["arrowdown"]) dy += 1;
    var len = Math.hypot(dx, dy);
    if (len > 0) { dx /= len; dy /= len; }
    return { x: dx, y: dy };
  }

  function sneaking() { return !!held["shift"]; }
  function takeToss() { var t = tossQueued; tossQueued = false; return t; }
  function takeRestart() { var t = restartQueued; restartQueued = false; return t; }
  function takeMute() { var t = muteQueued; muteQueued = false; return t; }
  function aimPoint() { return { x: mouseX, y: mouseY }; }

  return {
    attach: attach,
    moveVector: moveVector,
    sneaking: sneaking,
    takeToss: takeToss,
    takeRestart: takeRestart,
    takeMute: takeMute,
    aimPoint: aimPoint
  };
})();
