// Night Vault game loop: state machine, detection/alarm, loot, win and caught endings.
"use strict";

var canvasEl = document.getElementById("vaultCanvas");
var ctx2d = canvasEl.getContext("2d");
var hudGems = document.getElementById("hudGems");
var hudCoins = document.getElementById("hudCoins");
var hudClock = document.getElementById("hudClock");
var hudGoal = document.getElementById("hudGoal");
var alarmFill = document.getElementById("alarmFill");
var endPanel = document.getElementById("endPanel");
var endTitle = document.getElementById("endTitle");
var endDetail = document.getElementById("endDetail");
var muteButton = document.getElementById("muteButton");

function freshState() {
  var gems = [];
  for (var i = 0; i < GEM_SPOTS.length; i++) {
    gems.push({ x: GEM_SPOTS[i].x, y: GEM_SPOTS[i].y, taken: false });
  }
  return {
    thief: makeThief(),
    guards: makeGuards(),
    cameras: makeCameras(),
    gems: gems,
    crownTaken: false,
    channelProgress: 0,
    coinsLeft: TUNING.startCoins,
    coin: null,
    alarm: 0,
    spots: 0,
    elapsed: 0,
    over: false,
    won: false,
    spottedCooldown: 0,
    frozen: false
  };
}

var game = freshState();
var lastStamp = 0;

function formatClock(seconds) {
  var m = Math.floor(seconds / 60);
  var s = Math.floor(seconds % 60);
  return m + ":" + (s < 10 ? "0" : "") + s;
}

function gemsCollected(state) {
  var n = state.crownTaken ? 1 : 0;
  for (var i = 0; i < state.gems.length; i++) if (state.gems[i].taken) n++;
  return n;
}

function finalScore(state) {
  var small = 0;
  for (var i = 0; i < state.gems.length; i++) if (state.gems[i].taken) small++;
  var raw = small * 100 + (state.crownTaken ? 500 : 0) - Math.floor(state.elapsed) * 2 - state.spots * 150 + state.coinsLeft * 25;
  return Math.max(0, raw);
}

function refreshHud(state) {
  hudGems.textContent = "GEMS " + gemsCollected(state) + "/6";
  hudCoins.textContent = "COINS " + state.coinsLeft;
  hudClock.textContent = formatClock(state.elapsed);
  hudGoal.textContent = state.crownTaken ? "Crown secured - reach the EXIT VAN" : "Steal the Vault Crown, then reach the van";
  alarmFill.style.width = Math.round(state.alarm * 100) + "%";
  alarmFill.style.background = state.alarm > 0.66 ? "#ff5040" : (state.alarm > 0.33 ? "#ff9a3d" : "#ffcf4d");
}

function endRun(won) {
  game.over = true;
  game.won = won;
  endPanel.hidden = false;
  if (won) {
    endTitle.textContent = "CLEAN GETAWAY";
    endDetail.textContent = "Score " + finalScore(game) + " - " + gemsCollected(game) + "/6 gems - " + formatClock(game.elapsed) + " - spotted " + game.spots + "x";
    SoundKit.playWin();
  } else {
    endTitle.textContent = "CAUGHT";
    endDetail.textContent = "The alarm hit 100%. Score " + finalScore(game) + " - " + gemsCollected(game) + "/6 gems";
    SoundKit.playCaught();
  }
}

function tossCoin(state) {
  if (state.coinsLeft <= 0 || state.over) return;
  var aim = InputState.aimPoint();
  state.coinsLeft--;
  state.coin = { x: aim.x, y: aim.y, age: 0 };
  distractNearestGuard(state.guards, aim.x, aim.y);
  SoundKit.playCoin();
}

function updateDetection(state, dt) {
  var seenByGuard = false;
  var seenByCamera = false;
  var i;
  for (i = 0; i < state.guards.length; i++) {
    var sees = coneSeesThief(state.guards[i], state.thief);
    state.guards[i].alert = sees ? 1 : Math.max(0, state.guards[i].alert - dt * 2);
    if (sees) seenByGuard = true;
  }
  for (i = 0; i < state.cameras.length; i++) {
    var camSees = coneSeesThief(state.cameras[i], state.thief);
    state.cameras[i].alert = camSees ? 1 : Math.max(0, state.cameras[i].alert - dt * 2);
    if (camSees) seenByCamera = true;
  }
  var fillRate = 0;
  if (seenByGuard) fillRate = Math.max(fillRate, TUNING.alarmFillSeen);
  if (seenByCamera) fillRate = Math.max(fillRate, TUNING.alarmFillCamera);
  if (state.thief.sneaking && fillRate > 0) fillRate *= 0.5;
  if (fillRate > 0) {
    var before = state.alarm;
    state.alarm = Math.min(1, state.alarm + fillRate * dt);
    if (before < 0.35 && state.alarm >= 0.35 && state.spottedCooldown <= 0) {
      state.spots++;
      state.spottedCooldown = 4;
      SoundKit.playSpotted();
    }
  } else {
    state.alarm = Math.max(0, state.alarm - TUNING.alarmDecay * dt);
  }
  if (state.spottedCooldown > 0) state.spottedCooldown -= dt;
  if (state.alarm >= 1 && !state.over) endRun(false);
  // A guard's hands on you ends the run at once.
  for (i = 0; i < state.guards.length; i++) {
    if (Math.hypot(state.guards[i].x - state.thief.x, state.guards[i].y - state.thief.y) < 20 && !state.over) {
      state.alarm = 1;
      endRun(false);
    }
  }
}

function updateLoot(state, dt) {
  var i;
  for (i = 0; i < state.gems.length; i++) {
    var gem = state.gems[i];
    if (!gem.taken && Math.hypot(gem.x - state.thief.x, gem.y - state.thief.y) < 18) {
      gem.taken = true;
      SoundKit.playPickup();
    }
  }
  if (!state.crownTaken) {
    var nearCrown = Math.hypot(CROWN_SPOT.x - state.thief.x, CROWN_SPOT.y - state.thief.y) < 24;
    if (nearCrown) {
      state.channelProgress += dt / TUNING.crownChannelSeconds;
      if (state.channelProgress >= 1) {
        state.crownTaken = true;
        state.channelProgress = 0;
        SoundKit.playCrown();
      }
    } else {
      state.channelProgress = Math.max(0, state.channelProgress - dt * 0.8);
    }
  }
  var inVan = state.thief.x > EXIT_VAN.x && state.thief.x < EXIT_VAN.x + EXIT_VAN.w &&
              state.thief.y > EXIT_VAN.y && state.thief.y < EXIT_VAN.y + EXIT_VAN.h;
  if (inVan && state.crownTaken && !state.over) endRun(true);
}

function stepGame(dt) {
  if (InputState.takeRestart()) {
    game = freshState();
    endPanel.hidden = true;
    SoundKit.playClick();
    return;
  }
  if (InputState.takeMute()) {
    var nowMuted = SoundKit.toggleMute();
    muteButton.textContent = nowMuted ? "SOUND OFF" : "SOUND ON";
  }
  if (game.over || game.frozen) return;
  game.elapsed += dt;
  updateThief(game.thief, dt);
  var i;
  for (i = 0; i < game.guards.length; i++) updateGuard(game.guards[i], dt);
  for (i = 0; i < game.cameras.length; i++) updateCamera(game.cameras[i], game.elapsed);
  if (InputState.takeToss()) tossCoin(game);
  if (game.coin) {
    game.coin.age += dt;
    if (game.coin.age > TUNING.coinDistractSeconds) game.coin = null;
  }
  updateDetection(game, dt);
  updateLoot(game, dt);
}

function frameLoop(stamp) {
  var dt = Math.min(0.05, (stamp - lastStamp) / 1000 || 0.016);
  lastStamp = stamp;
  stepGame(dt);
  renderScene(ctx2d, game);
  refreshHud(game);
  requestAnimationFrame(frameLoop);
}

// Screenshot staging: ?shot=cover|alarm|vault|win freezes a readable mid-game tableau.
function stageShotMode() {
  var params = new URLSearchParams(window.location.search);
  var mode = params.get("shot");
  if (!mode) return;
  game.frozen = true;
  game.elapsed = 47;
  if (mode === "cover") {
    game.thief.x = 470; game.thief.y = 340; game.thief.facing = -0.6;
    game.guards[0].x = 205; game.guards[0].y = 215; game.guards[0].angle = 0.2;
    game.guards[1].x = 470; game.guards[1].y = 410; game.guards[1].angle = -1.4;
    game.guards[2].x = 800; game.guards[2].y = 195; game.guards[2].angle = 2.4;
    game.cameras[0].angle = 0.9; game.cameras[1].angle = -0.8;
    game.gems[1].taken = true; game.gems[3].taken = true;
    game.alarm = 0.42;
    game.coin = { x: 545, y: 290, age: 1 };
    game.guards[1].distracted = 2; game.guards[1].distractX = 545; game.guards[1].distractY = 290;
  } else if (mode === "alarm") {
    game.thief.x = 458; game.thief.y = 505; game.thief.facing = 0.4;
    game.guards[1].x = 470; game.guards[1].y = 380; game.guards[1].angle = 1.5; game.guards[1].alert = 1;
    game.guards[0].x = 120; game.guards[0].y = 320; game.guards[0].angle = 0;
    game.guards[2].x = 760; game.guards[2].y = 120; game.guards[2].angle = 3.0;
    game.cameras[1].angle = -1.4; game.cameras[1].alert = 1;
    game.alarm = 0.82;
    game.spots = 1;
  } else if (mode === "vault") {
    game.thief.x = 845; game.thief.y = 105; game.thief.facing = -1.2;
    game.channelProgress = 0.6;
    game.guards[2].x = 720; game.guards[2].y = 260; game.guards[2].angle = -0.5;
    game.guards[0].x = 200; game.guards[0].y = 180; game.guards[0].angle = 1.2;
    game.guards[1].x = 420; game.guards[1].y = 500; game.guards[1].angle = 0.3;
    game.cameras[0].angle = 1.3;
    game.gems[0].taken = true; game.gems[2].taken = true; game.gems[4].taken = true;
    game.alarm = 0.18;
  } else if (mode === "win") {
    game.thief.x = 909; game.thief.y = 568; game.thief.facing = 0;
    game.crownTaken = true;
    game.gems[0].taken = true; game.gems[1].taken = true; game.gems[2].taken = true; game.gems[3].taken = true;
    game.guards[0].x = 150; game.guards[0].y = 250; game.guards[0].angle = 0.8;
    game.guards[1].x = 500; game.guards[1].y = 350; game.guards[1].angle = 2.2;
    game.guards[2].x = 820; game.guards[2].y = 280; game.guards[2].angle = 1.8;
    game.elapsed = 83;
    game.coinsLeft = 1;
    endRun(true);
  }
}

muteButton.addEventListener("click", function () {
  SoundKit.unlock();
  var nowMuted = SoundKit.toggleMute();
  muteButton.textContent = nowMuted ? "SOUND OFF" : "SOUND ON";
});
window.addEventListener("pointerdown", function () { SoundKit.unlock(); }, { once: true });
window.addEventListener("keydown", function () { SoundKit.unlock(); }, { once: true });

InputState.attach(canvasEl);
stageShotMode();
refreshHud(game);
renderScene(ctx2d, game);
requestAnimationFrame(frameLoop);
