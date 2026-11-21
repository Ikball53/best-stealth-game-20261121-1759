// All drawing: night-museum floor, walls, readable cover, the exit door,
// wall-clipped vision cones, guards, the thief, and a tiny top-left HUD.
// Panels (start / level clear / caught / win) stay small and centred.

import { VIEW_W, VIEW_H } from './config.js';
import { conePoints } from './guards.js';
import { guardRadius } from './guards.js';
import { playerRadius } from './player.js';

function drawFloor(ctx) {
  ctx.fillStyle = '#1a2233';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#1e2739';
  const tile = 48;
  for (let y = 0; y < VIEW_H / tile; y++) {
    for (let x = 0; x < VIEW_W / tile; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * tile, y * tile, tile, tile);
    }
  }
}

function drawWall(ctx, r) {
  ctx.fillStyle = '#33415e';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#42537a';
  ctx.fillRect(r.x, r.y, r.w, 3);
}

function drawCover(ctx, r) {
  if (r.kind === 'case') {
    ctx.fillStyle = '#5d4028';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = '#8fd0e4';
    ctx.fillRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);
    ctx.fillStyle = '#e8b64c';
    ctx.fillRect(r.x + r.w / 2 - 4, r.y + r.h / 2 - 3, 8, 6);
  } else if (r.kind === 'pillar') {
    ctx.fillStyle = '#4a5878';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = '#5f7099';
    ctx.fillRect(r.x + 4, r.y + 4, r.w - 8, r.h - 8);
  } else {
    ctx.fillStyle = '#3c2f22';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = '#3f7a4d';
    ctx.beginPath();
    ctx.arc(r.x + r.w / 2, r.y + r.h / 2, Math.min(r.w, r.h) / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawExit(ctx, exit, unlocked) {
  ctx.fillStyle = unlocked ? '#2e8b57' : '#555f6e';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = unlocked ? '#7fe0ae' : '#8b96a8';
  ctx.lineWidth = 2;
  ctx.strokeRect(exit.x + 2, exit.y + 2, exit.w - 4, exit.h - 4);
  ctx.fillStyle = '#eafff2';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', exit.x + exit.w / 2, exit.y + exit.h / 2 + 3);
  ctx.textAlign = 'left';
}

function drawGem(ctx, gem, t) {
  const bob = Math.sin(t * 3) * 3;
  ctx.save();
  ctx.translate(gem.x, gem.y + bob);
  ctx.fillStyle = '#57e6ff';
  ctx.beginPath();
  ctx.moveTo(0, -11); ctx.lineTo(8, 0); ctx.lineTo(0, 11); ctx.lineTo(-8, 0);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d9fbff';
  ctx.beginPath();
  ctx.moveTo(0, -11); ctx.lineTo(4, -2); ctx.lineTo(-4, -2);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function coneColour(suspicion) {
  if (suspicion > 0.66) return 'rgba(255, 70, 60, 0.34)';
  if (suspicion > 0.3) return 'rgba(255, 160, 60, 0.30)';
  return 'rgba(255, 220, 110, 0.24)';
}

function drawCone(ctx, guard, solids) {
  const pts = conePoints(guard, solids);
  ctx.fillStyle = coneColour(guard.suspicion);
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.fill();
}

function drawGuard(ctx, guard) {
  const r = guardRadius();
  ctx.fillStyle = '#2b3f66';
  ctx.beginPath(); ctx.arc(guard.x, guard.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2c98a';
  ctx.beginPath(); ctx.arc(guard.x, guard.y, r * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffd76a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.angle) * (r + 5), guard.y + Math.sin(guard.angle) * (r + 5));
  ctx.stroke();
  if (guard.suspicion > 0.05) {
    ctx.fillStyle = '#0b0f18';
    ctx.fillRect(guard.x - 12, guard.y - r - 9, 24, 4);
    ctx.fillStyle = guard.suspicion > 0.66 ? '#ff5040' : '#ffb340';
    ctx.fillRect(guard.x - 12, guard.y - r - 9, 24 * guard.suspicion, 4);
  }
  if (guard.mode !== 'patrol') {
    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('?', guard.x, guard.y - r - 12);
    ctx.textAlign = 'left';
  }
}

function drawPlayer(ctx, player) {
  const r = playerRadius();
  ctx.fillStyle = player.sneaking ? '#1f7a6d' : '#2aa198';
  ctx.beginPath(); ctx.arc(player.x, player.y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0d2b26';
  ctx.beginPath(); ctx.arc(player.x, player.y, r * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#b8fff2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + Math.cos(player.angle) * (r + 4), player.y + Math.sin(player.angle) * (r + 4));
  ctx.stroke();
}

function drawCoin(ctx, coin, t) {
  const age = t - coin.born;
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath(); ctx.arc(coin.x, coin.y, 4, 0, Math.PI * 2); ctx.fill();
  if (age < 0.8) {
    ctx.strokeStyle = 'rgba(255, 215, 106, ' + (0.8 - age) + ')';
    ctx.beginPath(); ctx.arc(coin.x, coin.y, 6 + age * 46, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawHud(ctx, state) {
  ctx.font = '10px monospace';
  ctx.fillStyle = 'rgba(10, 14, 24, 0.72)';
  ctx.fillRect(6, 6, 252, 30);
  ctx.fillStyle = '#cfe3ff';
  const goal = state.level.needGem && !state.hasGem ? 'take the gem' : 'reach the exit';
  ctx.fillText(
    'L' + (state.levelIndex + 1) + ' ' + state.level.name + ' · ' + goal +
    ' · coins ' + state.coins + ' · strikes ' + state.strikes,
    11, 18,
  );
  ctx.fillStyle = '#22304d';
  ctx.fillRect(11, 24, 120, 5);
  ctx.fillStyle = state.maxSuspicion > 0.66 ? '#ff5040' : '#ffb340';
  ctx.fillRect(11, 24, 120 * state.maxSuspicion, 5);
  ctx.fillStyle = '#8fa8cc';
  ctx.fillText('WASD move · Shift sneak · click: toss coin', 140, 29);
}

function drawPanel(ctx, lines) {
  const w = 340, h = 34 + lines.length * 16;
  const x = (VIEW_W - w) / 2, y = (VIEW_H - h) / 2;
  ctx.fillStyle = 'rgba(8, 12, 22, 0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#3a4d73';
  ctx.strokeRect(x, y, w, h);
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  lines.forEach((line, i) => {
    ctx.fillStyle = i === 0 ? '#ffe9a8' : '#cfe3ff';
    ctx.fillText(line, VIEW_W / 2, y + 26 + i * 16);
  });
  ctx.textAlign = 'left';
}

export function drawScene(ctx, state, t) {
  drawFloor(ctx);
  for (const w of state.level.walls) drawWall(ctx, w);
  for (const c of state.level.covers) drawCover(ctx, c);
  drawExit(ctx, state.level.exit, !state.level.needGem || state.hasGem);
  if (state.level.gem && !state.hasGem) drawGem(ctx, state.level.gem, t);
  for (const coin of state.coinsOnFloor) drawCoin(ctx, coin, t);
  for (const g of state.guards) drawCone(ctx, g, state.solids);
  for (const g of state.guards) drawGuard(ctx, g);
  drawPlayer(ctx, state.player);
  drawHud(ctx, state);
  if (state.mode === 'title') {
    drawPanel(ctx, [
      'MOONLIGHT MUSEUM',
      '3 levels · 9 patrols · steal unseen',
      'WASD / arrows move · Shift sneak',
      'Click: toss a coin to distract a guard',
      'Break sight to let suspicion drain.',
      'Press Enter to start',
    ]);
  } else if (state.mode === 'caught') {
    drawPanel(ctx, ['Spotted!', 'Back to the door. Press Enter.']);
  } else if (state.mode === 'clear') {
    drawPanel(ctx, ['Level clear — unseen enough.', 'Press Enter for the next floor.']);
  } else if (state.mode === 'win') {
    drawPanel(ctx, [
      'The Moon Gem is yours.',
      'Strikes: ' + state.totalStrikes + ' · Time: ' + Math.round(state.elapsed) + 's',
      'Press Enter to play again.',
    ]);
  }
}
