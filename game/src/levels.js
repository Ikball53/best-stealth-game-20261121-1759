// The three museum floors. Walls block sight and movement; cover (display
// cases, pillars, planters) blocks sight too, so hiding behind it breaks a
// guard's line of sight. Patrol routes are fixed loops the player can learn.

function wall(x, y, w, h) { return { x, y, w, h, kind: 'wall' }; }
function cover(x, y, w, h, kind) { return { x, y, w, h, kind }; }
function patrol(points, speedScale) { return { points, speedScale: speedScale || 1 }; }

export const LEVELS = [
  {
    name: 'Main Gallery',
    coins: 3,
    needGem: false,
    spawn: { x: 70, y: 520 },
    exit: { x: 872, y: 36, w: 52, h: 44 },
    gem: null,
    walls: [
      wall(0, 0, 960, 16), wall(0, 584, 960, 16), wall(0, 0, 16, 600), wall(944, 0, 16, 600),
      wall(300, 16, 18, 210), wall(300, 380, 18, 204),
      wall(620, 16, 18, 150), wall(620, 330, 18, 254),
      wall(318, 290, 180, 16), wall(460, 440, 160, 16),
    ],
    covers: [
      cover(120, 120, 90, 34, 'case'), cover(120, 300, 90, 34, 'case'),
      cover(420, 110, 90, 34, 'case'), cover(740, 220, 90, 34, 'case'),
      cover(200, 440, 34, 34, 'pillar'), cover(520, 200, 34, 34, 'pillar'),
      cover(800, 420, 34, 34, 'pillar'), cover(660, 480, 90, 34, 'case'),
    ],
    guards: [
      patrol([[140, 200], [250, 200], [250, 420], [140, 420]]),
      patrol([[760, 120], [880, 120], [880, 320], [700, 320], [700, 160]]),
    ],
  },
  {
    name: 'Gem Vault',
    coins: 4,
    needGem: true,
    spawn: { x: 70, y: 70 },
    exit: { x: 36, y: 512, w: 52, h: 44 },
    gem: { x: 866, y: 512 },
    walls: [
      wall(0, 0, 960, 16), wall(0, 584, 960, 16), wall(0, 0, 16, 600), wall(944, 0, 16, 600),
      wall(16, 200, 260, 16), wall(430, 200, 260, 16),
      wall(270, 380, 260, 16), wall(680, 380, 264, 16),
      wall(470, 16, 16, 120), wall(470, 470, 16, 114),
    ],
    covers: [
      cover(150, 90, 90, 34, 'case'), cover(700, 90, 90, 34, 'case'),
      cover(330, 270, 90, 34, 'case'), cover(560, 270, 90, 34, 'case'),
      cover(150, 470, 90, 34, 'case'), cover(420, 470, 34, 34, 'pillar'),
      cover(620, 470, 90, 34, 'case'), cover(240, 120, 34, 34, 'planter'),
      cover(760, 300, 34, 34, 'planter'),
    ],
    guards: [
      patrol([[120, 150], [400, 150], [400, 60], [120, 60]]),
      patrol([[600, 300], [860, 300], [860, 440], [600, 440]]),
      patrol([[180, 300], [180, 500], [420, 500], [420, 300]], 0.9),
    ],
  },
  {
    name: 'Night Wing',
    coins: 5,
    needGem: true,
    spawn: { x: 480, y: 540 },
    exit: { x: 454, y: 24, w: 52, h: 44 },
    gem: { x: 480, y: 300 },
    walls: [
      wall(0, 0, 960, 16), wall(0, 584, 960, 16), wall(0, 0, 16, 600), wall(944, 0, 16, 600),
      wall(180, 16, 16, 180), wall(180, 400, 16, 184),
      wall(764, 16, 16, 180), wall(764, 400, 16, 184),
      wall(16, 292, 220, 16), wall(724, 292, 220, 16),
      wall(330, 150, 300, 14), wall(330, 436, 300, 14),
    ],
    covers: [
      cover(300, 230, 90, 34, 'case'), cover(570, 230, 90, 34, 'case'),
      cover(300, 340, 90, 34, 'case'), cover(570, 340, 90, 34, 'case'),
      cover(90, 120, 34, 34, 'pillar'), cover(836, 120, 34, 34, 'pillar'),
      cover(90, 450, 34, 34, 'planter'), cover(836, 450, 34, 34, 'planter'),
      cover(440, 90, 80, 30, 'case'), cover(440, 480, 80, 30, 'case'),
    ],
    guards: [
      patrol([[90, 90], [90, 500], [150, 500], [150, 90]]),
      patrol([[870, 90], [870, 500], [810, 500], [810, 90]]),
      patrol([[260, 200], [700, 200], [700, 110], [260, 110]], 1.05),
      patrol([[260, 400], [700, 400], [700, 490], [260, 490]], 1.05),
    ],
  },
];
