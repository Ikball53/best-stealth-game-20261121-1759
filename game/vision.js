// Sight geometry: vision-cone tests and line-of-sight blocked by cover blocks.
"use strict";

function angleGap(a, b) {
  var d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

function pointInBlock(px, py, block, pad) {
  return px >= block.x - pad && px <= block.x + block.w + pad &&
         py >= block.y - pad && py <= block.y + block.h + pad;
}

function segmentHitsBlock(x1, y1, x2, y2, block) {
  // Sample along the sight line; cover blocks are chunky so coarse steps are safe.
  var steps = 24;
  for (var i = 1; i < steps; i++) {
    var t = i / steps;
    var px = x1 + (x2 - x1) * t;
    var py = y1 + (y2 - y1) * t;
    if (pointInBlock(px, py, block, 0)) return true;
  }
  return false;
}

function lineOfSightClear(x1, y1, x2, y2) {
  for (var i = 0; i < BLOCKS.length; i++) {
    if (segmentHitsBlock(x1, y1, x2, y2, BLOCKS[i])) return false;
  }
  return true;
}

// Is the thief inside this cone right now (range, angle and clear sight)?
function coneSeesThief(observer, thief) {
  var dx = thief.x - observer.x;
  var dy = thief.y - observer.y;
  var dist = Math.hypot(dx, dy);
  if (dist > observer.range) return false;
  var toThief = Math.atan2(dy, dx);
  if (angleGap(toThief, observer.angle) > observer.halfAngle) return false;
  return lineOfSightClear(observer.x, observer.y, thief.x, thief.y);
}

function circleHitsBlocks(cx, cy, radius) {
  for (var i = 0; i < BLOCKS.length; i++) {
    var b = BLOCKS[i];
    var nx = Math.max(b.x, Math.min(cx, b.x + b.w));
    var ny = Math.max(b.y, Math.min(cy, b.y + b.h));
    if (Math.hypot(cx - nx, cy - ny) < radius) return true;
  }
  return false;
}

// Slide a circle along walls: try full move, then axis-separated fallbacks.
function moveCircleWithSlide(body, dx, dy, radius) {
  if (!circleHitsBlocks(body.x + dx, body.y + dy, radius)) {
    body.x += dx; body.y += dy; return;
  }
  if (!circleHitsBlocks(body.x + dx, body.y, radius)) { body.x += dx; return; }
  if (!circleHitsBlocks(body.x, body.y + dy, radius)) { body.y += dy; return; }
}
