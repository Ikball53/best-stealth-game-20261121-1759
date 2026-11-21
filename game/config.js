// Night Vault layout data: floor plan, cover blocks, patrol routes, cameras and loot.
"use strict";

var VAULT_W = 960;
var VAULT_H = 600;
var WALL = 14;

var THIEF_START = { x: 52, y: 548 };
var EXIT_VAN = { x: 872, y: 548, w: 74, h: 40 };
var CROWN_SPOT = { x: 872, y: 66 };

var GEM_SPOTS = [
  { x: 150, y: 120 },
  { x: 330, y: 300 },
  { x: 520, y: 130 },
  { x: 640, y: 420 },
  { x: 240, y: 470 }
];

// Solid blocks: walls and cover. kind "wall" is tall stone, "crate" is low cover,
// "case" is a glass display. All block movement and sight.
var BLOCKS = [
  { x: 0, y: 0, w: 960, h: WALL, kind: "wall" },
  { x: 0, y: 586, w: 960, h: WALL, kind: "wall" },
  { x: 0, y: 0, w: WALL, h: 600, kind: "wall" },
  { x: 946, y: 0, w: WALL, h: 600, kind: "wall" },
  { x: 300, y: 14, w: 16, h: 210, kind: "wall" },
  { x: 300, y: 300, w: 16, h: 180, kind: "wall" },
  { x: 620, y: 120, w: 16, h: 230, kind: "wall" },
  { x: 620, y: 430, w: 16, h: 156, kind: "wall" },
  { x: 316, y: 224, w: 180, h: 16, kind: "wall" },
  { x: 636, y: 350, w: 210, h: 16, kind: "wall" },
  { x: 120, y: 200, w: 56, h: 40, kind: "crate" },
  { x: 420, y: 90, w: 56, h: 40, kind: "crate" },
  { x: 430, y: 430, w: 56, h: 40, kind: "crate" },
  { x: 700, y: 200, w: 56, h: 40, kind: "crate" },
  { x: 180, y: 380, w: 56, h: 40, kind: "crate" },
  { x: 520, y: 250, w: 64, h: 34, kind: "case" },
  { x: 140, y: 60, w: 64, h: 34, kind: "case" },
  { x: 740, y: 460, w: 64, h: 34, kind: "case" },
  { x: 800, y: 40, w: 120, h: 14, kind: "wall" },
  { x: 800, y: 40, w: 14, h: 90, kind: "wall" }
];

// Guard patrols: waypoint loops the player can learn and time.
var PATROLS = [
  { speed: 52, route: [{ x: 90, y: 280 }, { x: 250, y: 280 }, { x: 250, y: 150 }, { x: 90, y: 150 }] },
  { speed: 60, route: [{ x: 380, y: 520 }, { x: 560, y: 520 }, { x: 560, y: 300 }, { x: 380, y: 300 }] },
  { speed: 66, route: [{ x: 700, y: 90 }, { x: 900, y: 90 }, { x: 900, y: 300 }, { x: 700, y: 300 }] }
];

// Sweeping cameras: fixed mounts, rotating cones.
var CAMERAS = [
  { x: 308, y: 232, baseAngle: 0.6, sweep: 0.9, period: 5.2 },
  { x: 628, y: 358, baseAngle: -1.2, sweep: 1.0, period: 6.4 }
];

var TUNING = {
  thiefWalkSpeed: 168,
  thiefSneakSpeed: 92,
  thiefRadius: 11,
  guardRadius: 12,
  coneRange: 168,
  coneHalfAngle: 0.52,
  cameraRange: 150,
  cameraHalfAngle: 0.42,
  alarmFillSeen: 0.62,
  alarmFillCamera: 0.4,
  alarmDecay: 0.3,
  crownChannelSeconds: 1.4,
  coinDistractSeconds: 3.2,
  startCoins: 3
};
