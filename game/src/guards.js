// Guards: fixed patrol loops, wall-clipped vision cones, and a suspicion
// meter that fills while the player is seen and drains once hidden, so a
// near miss can still be recovered by breaking line of sight.

import {
  GUARD_RADIUS, GUARD_SPEED, GUARD_INVESTIGATE_SPEED,
  CONE_RANGE, CONE_HALF_ANGLE, CONE_RAYS,
  SUSPICION_FILL_NEAR, SUSPICION_FILL_FAR, SUSPICION_DECAY, SNEAK_FILL_FACTOR,
  COIN_NOISE_RADIUS, COIN_LOOK_SECONDS,
} from './config.js';

export function makeGuard(route) {
  const [x, y] = route.points[0];
  return {
    x, y, angle: 0, waypoint: 1 % route.points.length,
    route, speedScale: route.speedScale || 1,
    suspicion: 0, mode: 'patrol', // patrol | investigate | look
    target: null, lookTimer: 0, tickTimer: 0,
  };
}

function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

function angleGap(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

// Distance from (x,y) along angle until the first solid rect, capped at range.
export function raycast(x, y, angle, solids, range) {
  const dx = Math.cos(angle), dy = Math.sin(angle);
  let best = range;
  for (const r of solids) {
    // Slab test against the rect.
    let tmin = 0, tmax = best;
    if (Math.abs(dx) < 1e-9) { if (x < r.x || x > r.x + r.w) continue; }
    else {
      let t1 = (r.x - x) / dx, t2 = (r.x + r.w - x) / dx;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }
    if (Math.abs(dy) < 1e-9) { if (y < r.y || y > r.y + r.h) continue; }
    else {
      let t1 = (r.y - y) / dy, t2 = (r.y + r.h - y) / dy;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) continue;
    }
    if (tmin > 0 && tmin < best) best = tmin;
  }
  return best;
}

// True when the guard can see the point: inside the cone and no solid between.
export function guardSees(guard, px, py, solids) {
  const d = dist(guard.x, guard.y, px, py);
  if (d > CONE_RANGE) return false;
  const toPlayer = Math.atan2(py - guard.y, px - guard.x);
  if (angleGap(toPlayer, guard.angle) > CONE_HALF_ANGLE) return false;
  return raycast(guard.x, guard.y, toPlayer, solids, d) >= d - 1;
}

// Cone outline points for drawing, clipped by walls and cover.
export function conePoints(guard, solids) {
  const pts = [{ x: guard.x, y: guard.y }];
  for (let i = 0; i <= CONE_RAYS; i++) {
    const a = guard.angle - CONE_HALF_ANGLE + (2 * CONE_HALF_ANGLE * i) / CONE_RAYS;
    const d = raycast(guard.x, guard.y, a, solids, CONE_RANGE);
    pts.push({ x: guard.x + Math.cos(a) * d, y: guard.y + Math.sin(a) * d });
  }
  return pts;
}

function moveToward(guard, tx, ty, speed, dt) {
  const d = dist(guard.x, guard.y, tx, ty);
  if (d < 4) return true;
  const step = Math.min(d, speed * dt);
  guard.x += ((tx - guard.x) / d) * step;
  guard.y += ((ty - guard.y) / d) * step;
  guard.angle = Math.atan2(ty - guard.y, tx - guard.x);
  return d - step < 4;
}

// A tossed coin: the nearest guard in earshot leaves patrol to investigate.
export function hearCoin(guards, cx, cy) {
  let best = null, bestD = COIN_NOISE_RADIUS;
  for (const g of guards) {
    const d = dist(g.x, g.y, cx, cy);
    if (d < bestD) { best = g; bestD = d; }
  }
  if (best) {
    best.mode = 'investigate';
    best.target = { x: cx, y: cy };
  }
  return best;
}

// Advance one guard; returns 'seen' | 'caught' | null for this frame.
export function updateGuard(guard, player, solids, dt, onTick) {
  if (guard.mode === 'patrol') {
    const [tx, ty] = guard.route.points[guard.waypoint];
    if (moveToward(guard, tx, ty, GUARD_SPEED * guard.speedScale, dt)) {
      guard.waypoint = (guard.waypoint + 1) % guard.route.points.length;
    }
  } else if (guard.mode === 'investigate') {
    if (moveToward(guard, guard.target.x, guard.target.y, GUARD_INVESTIGATE_SPEED, dt)) {
      guard.mode = 'look';
      guard.lookTimer = COIN_LOOK_SECONDS;
    }
  } else if (guard.mode === 'look') {
    guard.angle += Math.sin(guard.lookTimer * 5) * 1.6 * dt;
    guard.lookTimer -= dt;
    if (guard.lookTimer <= 0) guard.mode = 'patrol';
  }

  const seen = guardSees(guard, player.x, player.y, solids);
  if (seen) {
    const d = dist(guard.x, guard.y, player.x, player.y);
    const closeness = 1 - d / CONE_RANGE;
    let fill = SUSPICION_FILL_FAR + (SUSPICION_FILL_NEAR - SUSPICION_FILL_FAR) * closeness;
    if (player.sneaking) fill *= SNEAK_FILL_FACTOR;
    guard.suspicion = Math.min(1, guard.suspicion + fill * dt);
    guard.tickTimer -= dt;
    if (guard.tickTimer <= 0) { guard.tickTimer = 0.28; if (onTick) onTick(); }
    if (guard.suspicion >= 1) return 'caught';
    return 'seen';
  }
  guard.suspicion = Math.max(0, guard.suspicion - SUSPICION_DECAY * dt);
  return null;
}

export function guardRadius() { return GUARD_RADIUS; }
