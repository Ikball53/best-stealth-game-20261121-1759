// Actor behaviour: the thief's movement and each guard's patrol / distraction walk.
"use strict";

function makeThief() {
  return {
    x: THIEF_START.x,
    y: THIEF_START.y,
    facing: -Math.PI / 2,
    sneaking: false,
    moving: false,
    stepClock: 0
  };
}

function makeGuards() {
  var guards = [];
  for (var i = 0; i < PATROLS.length; i++) {
    var p = PATROLS[i];
    guards.push({
      x: p.route[0].x,
      y: p.route[0].y,
      angle: 0,
      range: TUNING.coneRange,
      halfAngle: TUNING.coneHalfAngle,
      speed: p.speed,
      route: p.route,
      waypoint: 1,
      distracted: 0,
      distractX: 0,
      distractY: 0,
      alert: 0
    });
  }
  return guards;
}

function makeCameras() {
  var cams = [];
  for (var i = 0; i < CAMERAS.length; i++) {
    var c = CAMERAS[i];
    cams.push({
      x: c.x,
      y: c.y,
      baseAngle: c.baseAngle,
      sweep: c.sweep,
      period: c.period,
      angle: c.baseAngle,
      range: TUNING.cameraRange,
      halfAngle: TUNING.cameraHalfAngle,
      alert: 0
    });
  }
  return cams;
}

function updateThief(thief, dt) {
  var vec = InputState.moveVector();
  thief.sneaking = InputState.sneaking();
  thief.moving = (vec.x !== 0 || vec.y !== 0);
  if (!thief.moving) return;
  var speed = thief.sneaking ? TUNING.thiefSneakSpeed : TUNING.thiefWalkSpeed;
  thief.facing = Math.atan2(vec.y, vec.x);
  moveCircleWithSlide(thief, vec.x * speed * dt, vec.y * speed * dt, TUNING.thiefRadius);
  thief.stepClock += dt;
  if (thief.stepClock > 0.34 && !thief.sneaking) {
    thief.stepClock = 0;
    SoundKit.playStep();
  }
}

function steerGuardToward(guard, tx, ty, dt, speedScale) {
  var dx = tx - guard.x;
  var dy = ty - guard.y;
  var dist = Math.hypot(dx, dy);
  if (dist < 4) return true;
  var want = Math.atan2(dy, dx);
  var turn = angleGap(want, guard.angle);
  var dir = ((want - guard.angle + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
  guard.angle += Math.max(-3.2 * dt, Math.min(3.2 * dt, dir));
  var step = guard.speed * speedScale * dt;
  moveCircleWithSlide(guard, Math.cos(guard.angle) * step, Math.sin(guard.angle) * step, TUNING.guardRadius);
  return dist < 14;
}

function updateGuard(guard, dt) {
  if (guard.distracted > 0) {
    guard.distracted -= dt;
    steerGuardToward(guard, guard.distractX, guard.distractY, dt, 1.15);
    return;
  }
  var target = guard.route[guard.waypoint];
  if (steerGuardToward(guard, target.x, target.y, dt, 1)) {
    guard.waypoint = (guard.waypoint + 1) % guard.route.length;
  }
}

function updateCamera(cam, elapsed) {
  cam.angle = cam.baseAngle + Math.sin((elapsed / cam.period) * Math.PI * 2) * cam.sweep;
}

function distractNearestGuard(guards, px, py) {
  var best = null;
  var bestDist = 1e9;
  for (var i = 0; i < guards.length; i++) {
    var d = Math.hypot(guards[i].x - px, guards[i].y - py);
    if (d < bestDist) { bestDist = d; best = guards[i]; }
  }
  if (best) {
    best.distracted = TUNING.coinDistractSeconds;
    best.distractX = px;
    best.distractY = py;
  }
  return best;
}
