// Moonlight Museum — game loop and level flow.
// Title -> play each floor -> reach the exit unseen -> win panel.
// Getting caught costs a strike and returns the thief to the door;
// three strikes restart the floor. Suspicion always drains when hidden.

import { LEVELS } from './levels.js';
import { createInput, moveVector } from './input.js';
import { makePlayer, updatePlayer } from './player.js';
import { makeGuard, updateGuard, hearCoin } from './guards.js';
import { drawScene } from './render.js';
import { sfx, toggleMute, isMuted } from './audio.js';
import { MAX_STRIKES } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const muteBtn = document.getElementById('muteBtn');

function refreshMuteLabel() {
  muteBtn.textContent = isMuted() ? 'sound: off (M)' : 'sound: on (M)';
}
muteBtn.addEventListener('click', () => { toggleMute(); refreshMuteLabel(); });

const state = {
  mode: 'title', // title | play | caught | clear | win
  levelIndex: 0,
  level: LEVELS[0],
  solids: [],
  player: null,
  guards: [],
  coins: 0,
  coinsOnFloor: [],
  hasGem: false,
  strikes: 0,
  totalStrikes: 0,
  maxSuspicion: 0,
  elapsed: 0,
};

function loadLevel(index) {
  state.levelIndex = index;
  state.level = LEVELS[index];
  state.solids = [...state.level.walls, ...state.level.covers];
  state.player = makePlayer(state.level.spawn);
  state.guards = state.level.guards.map(makeGuard);
  state.coins = state.level.coins;
  state.coinsOnFloor = [];
  state.hasGem = false;
  state.strikes = 0;
  state.maxSuspicion = 0;
}

function resetToDoor() {
  state.player = makePlayer(state.level.spawn);
  for (const g of state.guards) { g.suspicion = 0; g.mode = 'patrol'; }
  state.maxSuspicion = 0;
}

function tossCoin(click) {
  if (state.coins <= 0) return;
  state.coins -= 1;
  state.coinsOnFloor.push({ x: click.x, y: click.y, born: state.elapsed });
  sfx.coinToss();
  setTimeout(() => sfx.coinLand(), 140);
  hearCoin(state.guards, click.x, click.y);
}

function onCaught() {
  sfx.caught();
  state.strikes += 1;
  state.totalStrikes += 1;
  if (state.strikes >= MAX_STRIKES) {
    loadLevel(state.levelIndex);
    state.mode = 'play';
  } else {
    state.mode = 'caught';
  }
}

function checkGoals() {
  const p = state.player;
  if (state.level.gem && !state.hasGem) {
    if (Math.hypot(p.x - state.level.gem.x, p.y - state.level.gem.y) < 18) {
      state.hasGem = true;
      sfx.gem();
    }
  }
  const e = state.level.exit;
  const inside = p.x > e.x && p.x < e.x + e.w && p.y > e.y && p.y < e.y + e.h;
  if (inside && (!state.level.needGem || state.hasGem)) {
    if (state.levelIndex + 1 < LEVELS.length) {
      sfx.exitOk();
      state.mode = 'clear';
    } else {
      sfx.win();
      state.mode = 'win';
    }
  }
}

function stepPlay(dt) {
  state.elapsed += dt;
  updatePlayer(state.player, moveVector(input), state.solids, dt);
  if (input.coinClick) { tossCoin(input.coinClick); input.coinClick = null; }
  state.maxSuspicion = 0;
  for (const g of state.guards) {
    const result = updateGuard(g, state.player, state.solids, dt, () => sfx.suspicionTick());
    state.maxSuspicion = Math.max(state.maxSuspicion, g.suspicion);
    if (result === 'caught') { onCaught(); return; }
  }
  checkGoals();
}

function handlePanels() {
  if (!input.pressedEnter) return;
  input.pressedEnter = false;
  if (state.mode === 'title') {
    state.elapsed = 0;
    state.totalStrikes = 0;
    loadLevel(0);
    state.mode = 'play';
    sfx.levelStart();
  } else if (state.mode === 'caught') {
    resetToDoor();
    state.mode = 'play';
  } else if (state.mode === 'clear') {
    loadLevel(state.levelIndex + 1);
    state.mode = 'play';
    sfx.levelStart();
  } else if (state.mode === 'win') {
    state.elapsed = 0;
    state.totalStrikes = 0;
    loadLevel(0);
    state.mode = 'title';
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (input.pressedMute) { input.pressedMute = false; toggleMute(); refreshMuteLabel(); }
  handlePanels();
  if (state.mode === 'play') stepPlay(dt);
  drawScene(ctx, state, now / 1000);
  requestAnimationFrame(frame);
}

loadLevel(0);

// Screenshot staging: ?shot=1|2|3 starts that floor mid-patrol with the
// thief placed in view; ?alert=1 stands the thief at a cone edge so the
// suspicion colour shows. Plain play is unaffected without the params.
function stageShot() {
  const q = new URLSearchParams(location.search);
  const shot = Number(q.get('shot') || 0);
  if (!shot || shot < 1 || shot > LEVELS.length) return;
  loadLevel(shot - 1);
  state.mode = 'play';
  const spots = [
    { x: 470, y: 250 }, { x: 480, y: 320 }, { x: 480, y: 380 },
  ];
  state.player.x = spots[shot - 1].x;
  state.player.y = spots[shot - 1].y;
  for (let i = 0; i < 90; i++) {
    for (const g of state.guards) updateGuard(g, state.player, state.solids, 1 / 30, null);
  }
  if (q.get('alert') === '1' && state.guards.length) {
    const g = state.guards[0];
    state.player.x = g.x + Math.cos(g.angle) * 120;
    state.player.y = g.y + Math.sin(g.angle) * 120;
    for (let i = 0; i < 14; i++) updateGuard(g, state.player, state.solids, 1 / 30, null);
    state.maxSuspicion = g.suspicion;
  }
}
stageShot();

refreshMuteLabel();
requestAnimationFrame(frame);
