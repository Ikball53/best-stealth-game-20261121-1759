// The thief: free movement with wall/cover collision, a slower sneak
// that fills suspicion more slowly, and a facing angle for drawing.

import { PLAYER_RADIUS, PLAYER_SPEED, SNEAK_SPEED } from './config.js';

export function makePlayer(spawn) {
  return { x: spawn.x, y: spawn.y, angle: -Math.PI / 2, sneaking: false, moving: false };
}

function circleHitsRect(x, y, r, rect) {
  const nx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return Math.hypot(x - nx, y - ny) < r;
}

function blocked(x, y, solids) {
  return solids.some((s) => circleHitsRect(x, y, PLAYER_RADIUS, s));
}

// Move with axis-separated collision so the player slides along walls.
export function updatePlayer(player, vec, solids, dt) {
  player.sneaking = vec.sneaking;
  player.moving = vec.x !== 0 || vec.y !== 0;
  if (!player.moving) return;
  player.angle = Math.atan2(vec.y, vec.x);
  const speed = player.sneaking ? SNEAK_SPEED : PLAYER_SPEED;
  const nx = player.x + vec.x * speed * dt;
  const ny = player.y + vec.y * speed * dt;
  if (!blocked(nx, player.y, solids)) player.x = nx;
  if (!blocked(player.x, ny, solids)) player.y = ny;
}

export function playerRadius() { return PLAYER_RADIUS; }
