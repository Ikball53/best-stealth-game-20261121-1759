// Game state, patrols, detection, tools and the main loop.
(function () {
  var Levels = window.MapVaultLevels;
  var AudioKit = window.MapVaultAudio;
  var Input = window.MapVaultInput;
  var Vision = window.MapVaultVision;
  var Render = window.MapVaultRender;

  var canvas = document.getElementById('stage');
  var ctx = canvas.getContext('2d');
  var W = canvas.width, H = canvas.height;
  Input.bind(canvas);

  var muteBtn = document.getElementById('muteBtn');
  muteBtn.addEventListener('click', function () {
    AudioKit.unlock();
    muteBtn.textContent = AudioKit.toggleMute() ? 'Sound: off' : 'Sound: on';
  });

  var GUARD_RANGE = 152, GUARD_HALF = 0.56;
  var CAM_HALF = 0.42;

  var levelIndex = 0;
  var mode = 'start'; // start | play | caught | cleared | finished
  var player = null, guards = [], cameras = [], loot = [], walls = [];
  var door = null, doorOpen = false;
  var alarm = 0, seenNow = false, seenFlash = 0;
  var coinsLeft = 0, smokeLeft = 0;
  var thrownCoins = [], smokes = [];
  var elapsed = 0, totalTime = 0, totalScore = 0;
  var peakAlarm = 0, stepTimer = 0;
  var buttonRect = null;
  var frozen = false;

  function cloneLoot(list) {
    return list.map(function (it) { return { x: it.x, y: it.y, label: it.label, taken: false }; });
  }

  function makeGuard(def) {
    return {
      x: def.path[0][0], y: def.path[0][1], angle: 0,
      path: def.path, speed: def.speed, pause: def.pause,
      wp: 1, waitLeft: 0, state: 'patrol', tx: 0, ty: 0, lookLeft: 0,
      range: GUARD_RANGE, halfAngle: GUARD_HALF, seesPlayer: false
    };
  }

  function makeCamera(def) {
    return {
      x: def.x, y: def.y, base: def.base, sweep: def.sweep, speed: def.speed,
      range: def.range, halfAngle: CAM_HALF, angle: def.base, phase: Math.random() * 6,
      seesPlayer: false
    };
  }

  function loadLevel(idx) {
    levelIndex = idx;
    var def = Levels[idx];
    walls = def.walls;
    door = def.exitDoor;
    doorOpen = false;
    loot = cloneLoot(def.loot);
    guards = def.guards.map(makeGuard);
    cameras = def.cameras.map(makeCamera);
    player = { x: def.spawn.x, y: def.spawn.y, angle: 0, crouching: false, sprinting: false, r: 11 };
    coinsLeft = def.coins;
    smokeLeft = def.smokePuffs;
    thrownCoins = [];
    smokes = [];
    alarm = 0; peakAlarm = 0; elapsed = 0; seenNow = false;
    mode = 'play';
  }

  function collides(x, y, r) {
    if (x < r + 4 || x > W - r - 4 || y < r + 4 || y > H - r - 4) return true;
    for (var i = 0; i < walls.length; i++) {
      var w = walls[i];
      var nx = Math.max(w.x, Math.min(x, w.x + w.w));
      var ny = Math.max(w.y, Math.min(y, w.y + w.h));
      if (Math.hypot(x - nx, y - ny) < r) return true;
    }
    return false;
  }

  function moveToward(ent, tx, ty, speed, dt) {
    var dx = tx - ent.x, dy = ty - ent.y;
    var dist = Math.hypot(dx, dy);
    if (dist < 3) return true;
    var step = Math.min(dist, speed * dt);
    var nx = ent.x + (dx / dist) * step;
    var ny = ent.y + (dy / dist) * step;
    if (!collides(nx, ny, 10)) { ent.x = nx; ent.y = ny; }
    else if (!collides(nx, ent.y, 10)) { ent.x = nx; }
    else if (!collides(ent.x, ny, 10)) { ent.y = ny; }
    else return true;
    ent.angle = Math.atan2(dy, dx);
    return Math.hypot(tx - ent.x, ty - ent.y) < 5;
  }

  function updateGuard(g, dt) {
    if (g.state === 'investigate') {
      if (moveToward(g, g.tx, g.ty, g.speed * 1.25, dt)) {
        g.state = 'look';
        g.lookLeft = 2.0;
      }
    } else if (g.state === 'look') {
      g.angle += dt * 1.6;
      g.lookLeft -= dt;
      if (g.lookLeft <= 0) g.state = 'return';
    } else if (g.state === 'return') {
      var home = g.path[g.wp % g.path.length];
      if (moveToward(g, home[0], home[1], g.speed, dt)) g.state = 'patrol';
    } else {
      if (g.waitLeft > 0) {
        g.waitLeft -= dt;
      } else {
        var target = g.path[g.wp % g.path.length];
        if (moveToward(g, target[0], target[1], g.speed, dt)) {
          g.wp++;
          g.waitLeft = g.pause;
        }
      }
    }
    // A sprinting thief is heard: nearby guards turn toward the noise.
    if (player.sprinting && Math.hypot(player.x - g.x, player.y - g.y) < 85) {
      g.angle = Math.atan2(player.y - g.y, player.x - g.x);
    }
  }

  function throwCoin() {
    if (coinsLeft <= 0) { AudioKit.denied(); return; }
    var mx = Input.mouse.x, my = Input.mouse.y;
    var dx = mx - player.x, dy = my - player.y;
    var dist = Math.hypot(dx, dy);
    var maxThrow = 230;
    if (dist > maxThrow) { mx = player.x + (dx / dist) * maxThrow; my = player.y + (dy / dist) * maxThrow; }
    coinsLeft--;
    thrownCoins.push({ x: mx, y: my, ring: 1 });
    AudioKit.coinClink();
    guards.forEach(function (g) {
      if (Math.hypot(mx - g.x, my - g.y) < 175) {
        g.state = 'investigate'; g.tx = mx; g.ty = my;
      }
    });
  }

  function puffSmoke() {
    if (smokeLeft <= 0) { AudioKit.denied(); return; }
    smokeLeft--;
    smokes.push({ x: player.x, y: player.y, r: 72, left: 4.5 });
    AudioKit.smokePuff();
  }

  function updatePlayer(dt) {
    var mx = 0, my = 0;
    if (Input.pressed('a') || Input.pressed('arrowleft')) mx -= 1;
    if (Input.pressed('d') || Input.pressed('arrowright')) mx += 1;
    if (Input.pressed('w') || Input.pressed('arrowup')) my -= 1;
    if (Input.pressed('s') || Input.pressed('arrowdown')) my += 1;
    player.crouching = Input.pressed('c') || Input.pressed('control');
    player.sprinting = Input.pressed('shift') && !player.crouching;
    if (mx !== 0 || my !== 0) {
      var len = Math.hypot(mx, my);
      var speed = player.crouching ? 86 : (player.sprinting ? 232 : 152);
      var nx = player.x + (mx / len) * speed * dt;
      var ny = player.y + (my / len) * speed * dt;
      if (!collides(nx, player.y, player.r)) player.x = nx;
      if (!collides(player.x, ny, player.r)) player.y = ny;
      player.angle = Math.atan2(my, mx);
      stepTimer -= dt;
      if (stepTimer <= 0) { AudioKit.step(); stepTimer = player.sprinting ? 0.18 : 0.32; }
    }
    if (Input.consumeKey(' ') || Input.consumeClick()) throwCoin();
    if (Input.consumeKey('q')) puffSmoke();
    if (Input.consumeKey('r')) loadLevel(levelIndex);
    // Pick up atlas pages by walking over them.
    loot.forEach(function (item) {
      if (!item.taken && Math.hypot(player.x - item.x, player.y - item.y) < 20) {
        item.taken = true;
        AudioKit.pickup();
        if (loot.every(function (it) { return it.taken; })) {
          doorOpen = true;
          AudioKit.doorOpen();
        }
      }
    });
    if (doorOpen && Vision.pointInRect(player.x, player.y, door)) {
      var ghost = peakAlarm < 35 ? 300 : (peakAlarm < 70 ? 120 : 0);
      var gained = 500 + ghost + coinsLeft * 40 + smokeLeft * 40 - Math.floor(elapsed);
      totalScore += Math.max(50, gained);
      totalTime += elapsed;
      AudioKit.win();
      mode = levelIndex >= Levels.length - 1 ? 'finished' : 'cleared';
    }
  }

  function updateDetection(dt) {
    seenNow = false;
    var strongest = 0;
    guards.forEach(function (g) {
      var res = Vision.canSee(g, player, walls, smokes, player.crouching);
      g.seesPlayer = res.seen;
      if (res.seen) {
        seenNow = true;
        var rate = 34 * (1.25 - res.dist / g.range);
        if (player.crouching) rate *= 0.45;
        if (player.sprinting) rate *= 1.6;
        strongest = Math.max(strongest, rate);
      }
    });
    cameras.forEach(function (cam) {
      var res = Vision.canSee(cam, player, walls, smokes, player.crouching);
      cam.seesPlayer = res.seen;
      if (res.seen) {
        seenNow = true;
        var rate = 26 * (1.25 - res.dist / cam.range);
        if (player.crouching) rate *= 0.5;
        if (player.sprinting) rate *= 1.5;
        strongest = Math.max(strongest, rate);
      }
    });
    if (seenNow) {
      alarm += strongest * dt;
      seenFlash -= dt;
      if (seenFlash <= 0) { AudioKit.spotted(); seenFlash = 0.45; }
    } else {
      alarm -= 20 * dt;
    }
    alarm = Math.max(0, Math.min(100, alarm));
    peakAlarm = Math.max(peakAlarm, alarm);
    if (alarm >= 100) {
      AudioKit.caught();
      mode = 'caught';
    }
  }

  function fmtTime(sec) {
    var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function update(dt) {
    if (mode === 'play') {
      elapsed += dt;
      updatePlayer(dt);
      guards.forEach(function (g) { updateGuard(g, dt); });
      cameras.forEach(function (cam) {
        cam.phase += dt * cam.speed;
        cam.angle = cam.base + Math.sin(cam.phase) * cam.sweep;
      });
      thrownCoins.forEach(function (c) { c.ring = Math.max(0, c.ring - dt * 0.8); });
      thrownCoins = thrownCoins.filter(function (c) { return c.ring > 0; });
      smokes.forEach(function (s) { s.left -= dt; });
      smokes = smokes.filter(function (s) { return s.left > 0; });
      updateDetection(dt);
    }
    if (Input.consumeKey('m')) muteBtn.textContent = AudioKit.toggleMute() ? 'Sound: off' : 'Sound: on';
    if (buttonRect && Input.consumeClick()) {
      var m = Input.mouse;
      if (m.x >= buttonRect.x && m.x <= buttonRect.x + buttonRect.w && m.y >= buttonRect.y && m.y <= buttonRect.y + buttonRect.h) {
        AudioKit.unlock();
        if (mode === 'start') { loadLevel(0); }
        else if (mode === 'caught') { loadLevel(levelIndex); }
        else if (mode === 'cleared') { levelIndex++; loadLevel(levelIndex); }
        else if (mode === 'finished') { levelIndex = 0; totalScore = 0; totalTime = 0; loadLevel(0); }
        buttonRect = null;
      }
    }
    if (Input.consumeKey('enter')) {
      AudioKit.unlock();
      if (mode === 'start') loadLevel(0);
      else if (mode === 'caught') loadLevel(levelIndex);
      else if (mode === 'cleared') { levelIndex++; loadLevel(levelIndex); }
      else if (mode === 'finished') { levelIndex = 0; totalScore = 0; totalTime = 0; loadLevel(0); }
    }
  }

  function render(t) {
    Render.drawFloor(ctx, W, H);
    // The first room is already loaded behind the start panel, so even the
    // title frame shows guards, cones, cover, loot and the exit door.
    cameras.forEach(function (cam) {
      Render.drawCone(ctx, cam, walls, smokes, cam.seesPlayer ? 'rgba(227,75,94,0.34)' : 'rgba(227,75,94,0.20)');
    });
    guards.forEach(function (g) {
      Render.drawCone(ctx, g, walls, smokes, g.seesPlayer ? 'rgba(255,200,70,0.42)' : 'rgba(255,214,110,0.26)');
    });
    Render.drawSmokes(ctx, smokes);
    Render.drawWalls(ctx, walls);
    Render.drawDoor(ctx, door, doorOpen, t);
    Render.drawLoot(ctx, loot, t);
    Render.drawCoins(ctx, thrownCoins);
    cameras.forEach(function (cam) { Render.drawCamera(ctx, cam); });
    guards.forEach(function (g) { Render.drawGuard(ctx, g, g.seesPlayer && alarm > 45); });
    Render.drawPlayer(ctx, player);
    var got = loot.filter(function (it) { return it.taken; }).length;
    Render.drawHud(ctx, {
      levelName: Levels[levelIndex].name,
      lootGot: got, lootTotal: loot.length,
      coins: coinsLeft, smokeLeft: smokeLeft,
      timeText: fmtTime(elapsed), doorOpen: doorOpen,
      alarm: alarm, seenNow: seenNow
    });
    buttonRect = null;
    if (mode === 'start') {
      buttonRect = Render.drawStartPanel(ctx, W, H);
    } else if (mode === 'caught') {
      buttonRect = Render.drawPanel(ctx, W, H, 'Caught!', [
        'The alarm filled and the archivists grabbed you.',
        'Pages stolen: ' + got + ' of ' + loot.length + '   Time: ' + fmtTime(elapsed),
        'Tip: break the cone, crouch low, let the alarm cool.'
      ], 'Try again (Enter)');
    } else if (mode === 'cleared') {
      buttonRect = Render.drawPanel(ctx, W, H, 'Room cleared!', [
        'You slipped out unseen. Peak alarm: ' + Math.round(peakAlarm) + '%',
        'Time: ' + fmtTime(elapsed) + '   Score so far: ' + totalScore,
        'Next: ' + Levels[levelIndex + 1].name
      ], 'Next room (Enter)');
    } else if (mode === 'finished') {
      buttonRect = Render.drawPanel(ctx, W, H, 'The vault is yours!', [
        'All three rooms emptied. Total time: ' + fmtTime(totalTime),
        'Final score: ' + totalScore,
        'Ghost bonus needs peak alarm under 35% each room.'
      ], 'Play again (Enter)');
    }
  }

  // Staged frames for screenshots: ?shot=1..4 freezes a readable moment.
  function stageShot(n) {
    frozen = true;
    if (n === 1) {
      loadLevel(1);
      player.x = 452; player.y = 368; player.angle = -0.4; player.crouching = false;
      guards[0].x = 640; guards[0].y = 180; guards[0].angle = 2.2;
      guards[1].x = 260; guards[1].y = 300; guards[1].angle = 0.4;
      guards[2].x = 760; guards[2].y = 480; guards[2].angle = -1.8;
      cameras[0].angle = 0.5; cameras[1].angle = 0.2;
      loot[1].taken = true;
      alarm = 54; peakAlarm = 54; elapsed = 38; seenNow = true;
      guards[0].seesPlayer = true;
      thrownCoins.push({ x: 560, y: 250, ring: 0.7 });
      mode = 'play';
    } else if (n === 2) {
      loadLevel(0);
      player.x = 150; player.y = 500; player.angle = -0.9;
      guards[0].x = 600; guards[0].y = 240; guards[0].angle = 2.6;
      guards[1].x = 200; guards[1].y = 430; guards[1].angle = -0.5;
      cameras[0].angle = 1.9;
      alarm = 12; peakAlarm = 12; elapsed = 9;
      mode = 'play';
    } else if (n === 3) {
      loadLevel(2);
      player.x = 480; player.y = 470; player.angle = -1.5; player.crouching = true;
      guards[0].x = 480; guards[0].y = 210; guards[0].angle = 1.57;
      guards[1].x = 300; guards[1].y = 420; guards[1].angle = 0.2;
      guards[2].x = 140; guards[2].y = 320; guards[2].angle = 0.6;
      guards[3].x = 820; guards[3].y = 320; guards[3].angle = 2.5;
      cameras[0].angle = -0.6; cameras[1].angle = 0.9; cameras[2].angle = 2.2;
      loot[1].taken = true; loot[2].taken = true;
      smokes.push({ x: 480, y: 470, r: 72, left: 4 });
      alarm = 78; peakAlarm = 78; elapsed = 71; seenNow = false;
      mode = 'play';
    } else if (n === 4) {
      loadLevel(0);
      loot.forEach(function (it) { it.taken = true; });
      doorOpen = true;
      player.x = 840; player.y = 140; player.angle = -1.2;
      guards[0].x = 600; guards[0].y = 300; guards[0].angle = 3.0;
      guards[1].x = 180; guards[1].y = 480; guards[1].angle = 0.1;
      cameras[0].angle = 1.2;
      alarm = 22; peakAlarm = 41; elapsed = 64;
      mode = 'play';
    }
  }

  var shotParam = new URLSearchParams(window.location.search).get('shot');
  if (shotParam) {
    stageShot(parseInt(shotParam, 10) || 1);
  } else {
    loadLevel(0);
    mode = 'start';
  }

  var last = performance.now();
  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!frozen) update(dt);
    render(now / 1000);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
