// Canvas drawing: floor, cover, vision cones, cameras, loot, thief, guards, exit van.
"use strict";

function drawFloor(ctx) {
  ctx.fillStyle = "#1a2138";
  ctx.fillRect(0, 0, VAULT_W, VAULT_H);
  ctx.strokeStyle = "rgba(90,110,170,0.14)";
  ctx.lineWidth = 1;
  for (var x = 0; x <= VAULT_W; x += 48) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VAULT_H); ctx.stroke();
  }
  for (var y = 0; y <= VAULT_H; y += 48) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VAULT_W, y); ctx.stroke();
  }
  // Room labels, tiny and in corners of each area.
  ctx.fillStyle = "rgba(174,186,221,0.5)";
  ctx.font = "10px Arial";
  ctx.fillText("ENTRY HALL", 24, 40);
  ctx.fillText("GALLERY", 340, 40);
  ctx.fillText("VAULT", 820, 160);
  ctx.fillText("LOADING BAY", 660, 560);
}

function drawBlocks(ctx) {
  for (var i = 0; i < BLOCKS.length; i++) {
    var b = BLOCKS[i];
    if (b.kind === "wall") {
      ctx.fillStyle = "#3d4a73";
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = "#55648f";
      ctx.fillRect(b.x, b.y, b.w, 3);
    } else if (b.kind === "crate") {
      ctx.fillStyle = "#7a5a33";
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = "#4c381e";
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
      ctx.beginPath();
      ctx.moveTo(b.x + 2, b.y + 2); ctx.lineTo(b.x + b.w - 2, b.y + b.h - 2);
      ctx.moveTo(b.x + b.w - 2, b.y + 2); ctx.lineTo(b.x + 2, b.y + b.h - 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#2c5f6e";
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.strokeStyle = "#9fd8e8";
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x + 2, b.y + 2, b.w - 4, b.h - 4);
      ctx.fillStyle = "rgba(200,240,255,0.35)";
      ctx.fillRect(b.x + 6, b.y + 5, b.w - 12, 6);
    }
  }
}

function drawCone(ctx, observer, fillStyle) {
  ctx.beginPath();
  ctx.moveTo(observer.x, observer.y);
  ctx.arc(observer.x, observer.y, observer.range, observer.angle - observer.halfAngle, observer.angle + observer.halfAngle);
  ctx.closePath();
  ctx.fillStyle = fillStyle;
  ctx.fill();
}

function drawGem(ctx, x, y, big) {
  var s = big ? 13 : 8;
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.8, y - s * 0.15);
  ctx.lineTo(x, y + s);
  ctx.lineTo(x - s * 0.8, y - s * 0.15);
  ctx.closePath();
  ctx.fillStyle = big ? "#ffd76a" : "#6ae8ff";
  ctx.fill();
  ctx.strokeStyle = big ? "#fff3c4" : "#d6fbff";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (big) {
    ctx.fillStyle = "#fff3c4";
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.fillText("CROWN", x, y - s - 5);
    ctx.textAlign = "left";
  }
}

function drawExitVan(ctx, crownTaken) {
  ctx.fillStyle = crownTaken ? "#2e7d4f" : "#33415e";
  ctx.fillRect(EXIT_VAN.x, EXIT_VAN.y, EXIT_VAN.w, EXIT_VAN.h);
  ctx.strokeStyle = crownTaken ? "#8dffb8" : "#7d8fb8";
  ctx.lineWidth = 2;
  ctx.strokeRect(EXIT_VAN.x, EXIT_VAN.y, EXIT_VAN.w, EXIT_VAN.h);
  ctx.fillStyle = "#e8ecf5";
  ctx.font = "bold 10px Arial";
  ctx.textAlign = "center";
  ctx.fillText("EXIT VAN", EXIT_VAN.x + EXIT_VAN.w / 2, EXIT_VAN.y + 17);
  ctx.font = "8px Arial";
  ctx.fillText(crownTaken ? "GET IN!" : "NEED CROWN", EXIT_VAN.x + EXIT_VAN.w / 2, EXIT_VAN.y + 30);
  ctx.textAlign = "left";
}

function drawThief(ctx, thief) {
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, TUNING.thiefRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#12141c";
  ctx.fill();
  ctx.strokeStyle = "#ffd76a";
  ctx.lineWidth = 2;
  ctx.stroke();
  // Hood point shows facing.
  var fx = thief.x + Math.cos(thief.facing) * 15;
  var fy = thief.y + Math.sin(thief.facing) * 15;
  ctx.beginPath();
  ctx.moveTo(thief.x, thief.y);
  ctx.lineTo(fx, fy);
  ctx.strokeStyle = "#ffd76a";
  ctx.stroke();
  ctx.fillStyle = "#ffd76a";
  ctx.font = "bold 8px Arial";
  ctx.textAlign = "center";
  ctx.fillText("YOU", thief.x, thief.y - 16);
  ctx.textAlign = "left";
  if (thief.sneaking) {
    ctx.strokeStyle = "rgba(255,215,106,0.45)";
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, 17, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawGuard(ctx, guard) {
  var seen = guard.alert > 0.05;
  drawCone(ctx, guard, seen ? "rgba(255,70,60,0.30)" : "rgba(255,205,70,0.22)");
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, TUNING.guardRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#b03030";
  ctx.fill();
  ctx.strokeStyle = "#ffd9d9";
  ctx.lineWidth = 2;
  ctx.stroke();
  var fx = guard.x + Math.cos(guard.angle) * 16;
  var fy = guard.y + Math.sin(guard.angle) * 16;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(fx, fy);
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  if (guard.distracted > 0) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.fillText("?", guard.x, guard.y - 18);
    ctx.textAlign = "left";
  } else if (seen) {
    ctx.fillStyle = "#ff5040";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText("!", guard.x, guard.y - 18);
    ctx.textAlign = "left";
  }
}

function drawCamera(ctx, cam) {
  drawCone(ctx, cam, cam.alert > 0.05 ? "rgba(255,70,60,0.26)" : "rgba(90,200,255,0.16)");
  ctx.fillStyle = "#d7e6ff";
  ctx.fillRect(cam.x - 6, cam.y - 6, 12, 12);
  ctx.strokeStyle = "#5aa0ff";
  ctx.lineWidth = 2;
  ctx.strokeRect(cam.x - 6, cam.y - 6, 12, 12);
  ctx.fillStyle = "#5aa0ff";
  ctx.font = "bold 7px Arial";
  ctx.textAlign = "center";
  ctx.fillText("CAM", cam.x, cam.y + 2.5);
  ctx.textAlign = "left";
}

function drawCoinMark(ctx, coin) {
  if (!coin) return;
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = "#ffd76a";
  ctx.fill();
  ctx.strokeStyle = "#fff3c4";
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,215,106,0.5)";
  ctx.beginPath();
  ctx.arc(coin.x, coin.y, 12 + Math.sin(coin.age * 6) * 3, 0, Math.PI * 2);
  ctx.stroke();
}

function drawChannelRing(ctx, thief, progress) {
  if (progress <= 0) return;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 22, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  ctx.strokeStyle = "#ffd76a";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function renderScene(ctx, state) {
  drawFloor(ctx);
  drawExitVan(ctx, state.crownTaken);
  for (var i = 0; i < state.gems.length; i++) {
    if (!state.gems[i].taken) drawGem(ctx, state.gems[i].x, state.gems[i].y, false);
  }
  if (!state.crownTaken) drawGem(ctx, CROWN_SPOT.x, CROWN_SPOT.y, true);
  drawCoinMark(ctx, state.coin);
  for (var c = 0; c < state.cameras.length; c++) drawCamera(ctx, state.cameras[c]);
  for (var g = 0; g < state.guards.length; g++) drawGuard(ctx, state.guards[g]);
  drawBlocks(ctx);
  drawThief(ctx, state.thief);
  drawChannelRing(ctx, state.thief, state.channelProgress);
  if (state.alarm > 0.55) {
    ctx.fillStyle = "rgba(255,40,30," + ((state.alarm - 0.55) * 0.22).toFixed(3) + ")";
    ctx.fillRect(0, 0, VAULT_W, VAULT_H);
  }
}
