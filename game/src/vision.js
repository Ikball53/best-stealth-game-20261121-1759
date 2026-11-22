// Vision cones and line-of-sight checks, blocked by walls and smoke.
window.MapVaultVision = (function () {
  function pointInRect(x, y, r) {
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  }

  function segmentHitsCircle(x1, y1, x2, y2, cx, cy, rad) {
    var dx = x2 - x1, dy = y2 - y1;
    var len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(cx - x1, cy - y1) <= rad;
    var t = Math.max(0, Math.min(1, ((cx - x1) * dx + (cy - y1) * dy) / len2));
    var px = x1 + t * dx, py = y1 + t * dy;
    return Math.hypot(cx - px, cy - py) <= rad;
  }

  // Low cabinets only hide a crouching thief; shelves and stone always block.
  function lineBlocked(x1, y1, x2, y2, walls, smokes, viewerSeesLow) {
    var dist = Math.hypot(x2 - x1, y2 - y1);
    var steps = Math.max(2, Math.ceil(dist / 7));
    for (var i = 1; i < steps; i++) {
      var t = i / steps;
      var x = x1 + (x2 - x1) * t;
      var y = y1 + (y2 - y1) * t;
      for (var w = 0; w < walls.length; w++) {
        var wall = walls[w];
        if (wall.kind === 'low' && !viewerSeesLow) continue;
        if (pointInRect(x, y, wall)) return true;
      }
    }
    for (var s = 0; s < smokes.length; s++) {
      var sm = smokes[s];
      if (segmentHitsCircle(x1, y1, x2, y2, sm.x, sm.y, sm.r)) return true;
    }
    return false;
  }

  function angleDiff(a, b) {
    var d = a - b;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return d;
  }

  function canSee(viewer, target, walls, smokes, targetCrouching) {
    var dx = target.x - viewer.x, dy = target.y - viewer.y;
    var dist = Math.hypot(dx, dy);
    if (dist > viewer.range) return { seen: false, dist: dist };
    var ang = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(ang, viewer.angle)) > viewer.halfAngle) return { seen: false, dist: dist };
    // A guard sees over low cabinets unless the thief is crouched behind one.
    var blocked = lineBlocked(viewer.x, viewer.y, target.x, target.y, walls, smokes, targetCrouching);
    return { seen: !blocked, dist: dist };
  }

  // Cast a fan of rays so the drawn cone stops at cover, readable at a glance.
  function conePolygon(viewer, walls, smokes) {
    var pts = [{ x: viewer.x, y: viewer.y }];
    var rays = 26;
    for (var i = 0; i <= rays; i++) {
      var a = viewer.angle - viewer.halfAngle + (2 * viewer.halfAngle * i) / rays;
      var ex = viewer.x + Math.cos(a) * viewer.range;
      var ey = viewer.y + Math.sin(a) * viewer.range;
      var steps = 22;
      var hitX = ex, hitY = ey;
      for (var s = 1; s <= steps; s++) {
        var t = s / steps;
        var x = viewer.x + (ex - viewer.x) * t;
        var y = viewer.y + (ey - viewer.y) * t;
        var stop = false;
        for (var w = 0; w < walls.length; w++) {
          if (walls[w].kind === 'low') continue;
          if (pointInRect(x, y, walls[w])) { stop = true; break; }
        }
        if (!stop) {
          for (var k = 0; k < smokes.length; k++) {
            if (Math.hypot(x - smokes[k].x, y - smokes[k].y) <= smokes[k].r) { stop = true; break; }
          }
        }
        if (stop) { hitX = x; hitY = y; break; }
      }
      pts.push({ x: hitX, y: hitY });
    }
    return pts;
  }

  return { canSee: canSee, conePolygon: conePolygon, lineBlocked: lineBlocked, pointInRect: pointInRect };
})();
