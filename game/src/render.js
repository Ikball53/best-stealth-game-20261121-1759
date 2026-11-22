// All canvas drawing: floor, cover, cones, people, loot, door and HUD.
window.MapVaultRender = (function () {
  var Vision = window.MapVaultVision;

  function drawFloor(ctx, W, H) {
    ctx.fillStyle = '#1c2436';
    ctx.fillRect(0, 0, W, H);
    var tile = 48;
    for (var y = 0; y < H / tile; y++) {
      for (var x = 0; x < W / tile; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.025)';
          ctx.fillRect(x * tile, y * tile, tile, tile);
        }
      }
    }
    ctx.strokeStyle = 'rgba(120,140,180,0.10)';
    ctx.lineWidth = 1;
    for (var gx = 0; gx <= W; gx += tile) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 0; gy <= H; gy += tile) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
    ctx.strokeStyle = '#46557a';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, W - 4, H - 4);
  }

  function drawWalls(ctx, walls) {
    walls.forEach(function (w) {
      var fill = w.kind === 'stone' ? '#5a6378' : (w.kind === 'low' ? '#7a5c38' : '#8a6a42');
      var top = w.kind === 'stone' ? '#77819c' : (w.kind === 'low' ? '#9a7a4e' : '#a8835a');
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(w.x + 3, w.y + 4, w.w, w.h);
      ctx.fillStyle = fill;
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = top;
      ctx.fillRect(w.x, w.y, w.w, Math.min(6, w.h));
      ctx.strokeStyle = 'rgba(10,12,20,0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.w - 1, w.h - 1);
      if (w.kind !== 'stone') {
        ctx.strokeStyle = 'rgba(30,20,10,0.35)';
        for (var x = w.x + 14; x < w.x + w.w - 4; x += 18) {
          ctx.beginPath(); ctx.moveTo(x, w.y + 3); ctx.lineTo(x, w.y + w.h - 3); ctx.stroke();
        }
      }
    });
  }

  function drawCone(ctx, viewer, walls, smokes, fillStyle) {
    var pts = Vision.conePolygon(viewer, walls, smokes);
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  function drawDoor(ctx, door, open, t) {
    ctx.fillStyle = open ? '#1f6b3a' : '#6b2430';
    ctx.fillRect(door.x, door.y, door.w, door.h);
    ctx.fillStyle = open ? '#2f9e57' : '#8a3242';
    ctx.fillRect(door.x + 4, door.y + 4, door.w - 8, door.h - 8);
    ctx.fillStyle = '#f2d492';
    ctx.beginPath();
    ctx.arc(door.x + door.w - 10, door.y + door.h / 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 9px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(open ? 'EXIT' : 'LOCKED', door.x + door.w / 2, door.y + 14);
    if (open) {
      ctx.strokeStyle = 'rgba(120,255,170,' + (0.5 + 0.3 * Math.sin(t * 4)) + ')';
      ctx.lineWidth = 2;
      ctx.strokeRect(door.x - 3, door.y - 3, door.w + 6, door.h + 6);
    }
  }

  function drawLoot(ctx, loot, t) {
    loot.forEach(function (item, i) {
      if (item.taken) return;
      var bob = Math.sin(t * 2.4 + i * 1.7) * 2;
      ctx.fillStyle = 'rgba(255,210,90,0.18)';
      ctx.beginPath();
      ctx.arc(item.x, item.y + bob, 17, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e8c15a';
      ctx.fillRect(item.x - 9, item.y - 11 + bob, 18, 22);
      ctx.fillStyle = '#fff3c4';
      ctx.fillRect(item.x - 6, item.y - 8 + bob, 12, 16);
      ctx.strokeStyle = '#8a6a1f';
      ctx.lineWidth = 1;
      ctx.strokeRect(item.x - 9.5, item.y - 11.5 + bob, 19, 23);
      ctx.strokeStyle = 'rgba(120,90,20,0.7)';
      ctx.beginPath(); ctx.moveTo(item.x - 4, item.y - 3 + bob); ctx.lineTo(item.x + 4, item.y - 3 + bob); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(item.x - 4, item.y + 2 + bob); ctx.lineTo(item.x + 4, item.y + 2 + bob); ctx.stroke();
    });
  }

  function drawPerson(ctx, x, y, angle, body, trim, radius) {
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.arc(x + 2, y + 3, radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = trim;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = trim;
    ctx.beginPath();
    ctx.arc(x + Math.cos(angle) * (radius - 3), y + Math.sin(angle) * (radius - 3), 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGuard(ctx, g, alerted) {
    drawPerson(ctx, g.x, g.y, g.angle, '#7a2436', '#f0d9a0', 11);
    ctx.fillStyle = '#f0d9a0';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 13, g.y + Math.sin(g.angle) * 13, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 8px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd9de';
    ctx.fillText('GUARD', g.x, g.y - 16);
    if (alerted) {
      ctx.font = 'bold 16px Georgia, serif';
      ctx.fillStyle = '#ffdf5e';
      ctx.strokeStyle = '#5a3a00';
      ctx.lineWidth = 3;
      ctx.strokeText('!', g.x, g.y - 26);
      ctx.fillText('!', g.x, g.y - 26);
    }
  }

  function drawCamera(ctx, cam) {
    ctx.fillStyle = '#3a3f52';
    ctx.fillRect(cam.x - 9, cam.y - 9, 18, 18);
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 2;
    ctx.strokeRect(cam.x - 9, cam.y - 9, 18, 18);
    ctx.fillStyle = '#e34b5e';
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(cam.angle) * 5, cam.y + Math.sin(cam.angle) * 5, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 7px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e8d9b0';
    ctx.fillText('CAM', cam.x, cam.y - 14);
  }

  function drawPlayer(ctx, p) {
    drawPerson(ctx, p.x, p.y, p.angle, p.crouching ? '#175c5c' : '#1f7a7a', '#d9fff7', p.crouching ? 9 : 11);
    ctx.font = 'bold 8px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#d9fff7';
    ctx.fillText(p.crouching ? 'YOU (low)' : 'YOU', p.x, p.y - 17);
    if (p.sprinting) {
      ctx.strokeStyle = 'rgba(160,220,255,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(p.x, p.y, 80, 0, Math.PI * 2); ctx.stroke();
    }
  }

  function drawSmokes(ctx, smokes) {
    smokes.forEach(function (s) {
      ctx.fillStyle = 'rgba(200,205,220,0.35)';
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(230,235,245,0.25)';
      ctx.beginPath(); ctx.arc(s.x - 12, s.y - 8, s.r * 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s.x + 14, s.y + 6, s.r * 0.55, 0, Math.PI * 2); ctx.fill();
    });
  }

  function drawCoins(ctx, coins) {
    coins.forEach(function (c) {
      ctx.fillStyle = '#ffd75e';
      ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#8a6a1f';
      ctx.stroke();
      if (c.ring > 0) {
        ctx.strokeStyle = 'rgba(255,215,94,' + (c.ring * 0.6) + ')';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(c.x, c.y, 10 + (1 - c.ring) * 34, 0, Math.PI * 2); ctx.stroke();
      }
    });
  }

  function drawHud(ctx, state) {
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(10,13,22,0.72)';
    ctx.fillRect(8, 8, 252, 78);
    ctx.strokeStyle = 'rgba(150,170,220,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(8.5, 8.5, 251, 77);
    ctx.font = 'bold 11px Georgia, serif';
    ctx.fillStyle = '#eef1fb';
    ctx.fillText(state.levelName, 14, 24);
    ctx.font = '11px Georgia, serif';
    ctx.fillStyle = '#c8d2ea';
    ctx.fillText('Pages: ' + state.lootGot + '/' + state.lootTotal + '   Coins: ' + state.coins + '   Smoke: ' + state.smokeLeft, 14, 40);
    ctx.fillText('Time: ' + state.timeText + (state.doorOpen ? '   Door: OPEN' : '   Door: locked'), 14, 54);
    ctx.fillStyle = '#39445f';
    ctx.fillRect(14, 62, 150, 10);
    var alarmColor = state.alarm > 70 ? '#e34b5e' : (state.alarm > 35 ? '#e8a33d' : '#3fae6a');
    ctx.fillStyle = alarmColor;
    ctx.fillRect(14, 62, 150 * Math.min(1, state.alarm / 100), 10);
    ctx.strokeStyle = '#aab6d4';
    ctx.strokeRect(14.5, 62.5, 149, 9);
    ctx.font = 'bold 10px Georgia, serif';
    ctx.fillStyle = '#eef1fb';
    ctx.fillText('ALARM ' + Math.round(state.alarm) + '%', 170, 71);
    if (state.seenNow) {
      ctx.font = 'bold 11px Georgia, serif';
      ctx.fillStyle = '#ffdf5e';
      ctx.fillText('SEEN!', 170, 54);
    }
  }

  function drawPanel(ctx, W, H, title, lines, buttonLabel) {
    var pw = 330, ph = 150;
    var px = (W - pw) / 2, py = (H - ph) / 2;
    ctx.fillStyle = 'rgba(8,10,18,0.55)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#232b3f';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillStyle = '#f2d492';
    ctx.fillText(title, W / 2, py + 34);
    ctx.font = '13px Georgia, serif';
    ctx.fillStyle = '#dfe6f5';
    lines.forEach(function (line, i) { ctx.fillText(line, W / 2, py + 60 + i * 18); });
    var bw = 170, bh = 30;
    var bx = (W - bw) / 2, by = py + ph - 44;
    ctx.fillStyle = '#1f6b3a';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#9fe8b8';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.font = 'bold 13px Georgia, serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(buttonLabel, W / 2, by + 20);
    return { x: bx, y: by, w: bw, h: bh };
  }

  function drawStartPanel(ctx, W, H) {
    var pw = 430, ph = 210;
    var px = (W - pw) / 2, py = (H - ph) / 2;
    ctx.fillStyle = 'rgba(8,10,18,0.45)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#232b3f';
    ctx.fillRect(px, py, pw, ph);
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px Georgia, serif';
    ctx.fillStyle = '#f2d492';
    ctx.fillText('Ink & Ivory: The Map Vault', W / 2, py + 38);
    ctx.font = '13px Georgia, serif';
    ctx.fillStyle = '#dfe6f5';
    var lines = [
      'Steal every golden atlas page, then slip out the green door.',
      'Yellow cones are guard lanterns. Red cones are cameras.',
      'Crouch behind low cabinets. Sprinting is loud.',
      'Click to toss a coin. Press Q for smoke. Do not fill the alarm.'
    ];
    lines.forEach(function (line, i) { ctx.fillText(line, W / 2, py + 66 + i * 20); });
    var bw = 180, bh = 32;
    var bx = (W - bw) / 2, by = py + ph - 52;
    ctx.fillStyle = '#1f6b3a';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#9fe8b8';
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
    ctx.font = 'bold 14px Georgia, serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Begin the heist', W / 2, by + 21);
    return { x: bx, y: by, w: bw, h: bh };
  }

  return {
    drawFloor: drawFloor, drawWalls: drawWalls, drawCone: drawCone, drawDoor: drawDoor,
    drawLoot: drawLoot, drawGuard: drawGuard, drawCamera: drawCamera, drawPlayer: drawPlayer,
    drawSmokes: drawSmokes, drawCoins: drawCoins, drawHud: drawHud, drawPanel: drawPanel,
    drawStartPanel: drawStartPanel
  };
})();
