// Level layouts for Ink & Ivory: The Map Vault.
// Coordinates are pixels on a 960x640 stage. Walls are solid rectangles;
// "low" walls are map cabinets you can crouch behind to break a sightline.
window.MapVaultLevels = [
  {
    name: 'Room 1 - The Reading Hall',
    spawn: { x: 70, y: 560 },
    exitDoor: { x: 884, y: 36, w: 44, h: 58 },
    coins: 3,
    smokePuffs: 2,
    walls: [
      { x: 180, y: 120, w: 150, h: 26, kind: 'shelf' },
      { x: 180, y: 300, w: 150, h: 26, kind: 'shelf' },
      { x: 180, y: 470, w: 150, h: 26, kind: 'low' },
      { x: 430, y: 90, w: 26, h: 170, kind: 'stone' },
      { x: 430, y: 380, w: 26, h: 170, kind: 'stone' },
      { x: 560, y: 210, w: 170, h: 26, kind: 'shelf' },
      { x: 560, y: 430, w: 170, h: 26, kind: 'low' },
      { x: 760, y: 120, w: 26, h: 150, kind: 'stone' },
      { x: 760, y: 380, w: 26, h: 150, kind: 'stone' },
      { x: 90, y: 230, w: 26, h: 110, kind: 'low' },
      { x: 620, y: 60, w: 110, h: 22, kind: 'low' }
    ],
    guards: [
      { path: [[500, 150], [700, 150], [700, 330], [500, 330]], speed: 62, pause: 0.7 },
      { path: [[250, 520], [250, 380], [90, 380]], speed: 55, pause: 0.9 }
    ],
    cameras: [
      { x: 480, y: 30, base: Math.PI / 2, sweep: 0.85, speed: 0.55, range: 175 }
    ],
    loot: [
      { x: 480, y: 300, label: 'Atlas page I' },
      { x: 835, y: 520, label: 'Atlas page II' },
      { x: 110, y: 90, label: 'Atlas page III' }
    ]
  },
  {
    name: 'Room 2 - The Observatory',
    spawn: { x: 70, y: 70 },
    exitDoor: { x: 884, y: 546, w: 44, h: 58 },
    coins: 3,
    smokePuffs: 2,
    walls: [
      { x: 150, y: 180, w: 190, h: 26, kind: 'shelf' },
      { x: 150, y: 420, w: 190, h: 26, kind: 'low' },
      { x: 420, y: 60, w: 26, h: 190, kind: 'stone' },
      { x: 420, y: 390, w: 26, h: 190, kind: 'stone' },
      { x: 540, y: 280, w: 200, h: 26, kind: 'shelf' },
      { x: 540, y: 500, w: 200, h: 26, kind: 'low' },
      { x: 800, y: 140, w: 26, h: 170, kind: 'stone' },
      { x: 620, y: 90, w: 120, h: 22, kind: 'low' },
      { x: 250, y: 290, w: 120, h: 22, kind: 'low' },
      { x: 60, y: 300, w: 26, h: 120, kind: 'stone' },
      { x: 700, y: 380, w: 26, h: 90, kind: 'low' }
    ],
    guards: [
      { path: [[520, 120], [770, 120], [770, 250], [520, 250]], speed: 70, pause: 0.6 },
      { path: [[200, 520], [200, 250], [380, 250]], speed: 64, pause: 0.8 },
      { path: [[640, 560], [850, 560], [850, 420]], speed: 74, pause: 0.5 }
    ],
    cameras: [
      { x: 480, y: 320, base: 0, sweep: 1.0, speed: 0.7, range: 180 },
      { x: 30, y: 320, base: 0, sweep: 0.8, speed: 0.6, range: 170 }
    ],
    loot: [
      { x: 700, y: 180, label: 'Star chart I' },
      { x: 240, y: 340, label: 'Star chart II' },
      { x: 850, y: 80, label: 'Star chart III' },
      { x: 480, y: 560, label: 'Star chart IV' }
    ]
  },
  {
    name: 'Room 3 - The Vault of Charts',
    spawn: { x: 480, y: 585 },
    exitDoor: { x: 458, y: 24, w: 44, h: 58 },
    coins: 4,
    smokePuffs: 3,
    walls: [
      { x: 120, y: 140, w: 170, h: 26, kind: 'shelf' },
      { x: 670, y: 140, w: 170, h: 26, kind: 'shelf' },
      { x: 120, y: 460, w: 170, h: 26, kind: 'low' },
      { x: 670, y: 460, w: 170, h: 26, kind: 'low' },
      { x: 300, y: 260, w: 360, h: 26, kind: 'stone' },
      { x: 300, y: 380, w: 360, h: 26, kind: 'stone' },
      { x: 467, y: 286, w: 26, h: 94, kind: 'stone' },
      { x: 200, y: 300, w: 26, h: 80, kind: 'low' },
      { x: 734, y: 300, w: 26, h: 80, kind: 'low' },
      { x: 90, y: 290, w: 90, h: 22, kind: 'low' },
      { x: 780, y: 290, w: 90, h: 22, kind: 'low' },
      { x: 410, y: 120, w: 140, h: 22, kind: 'low' }
    ],
    guards: [
      { path: [[180, 210], [780, 210]], speed: 78, pause: 0.5 },
      { path: [[180, 420], [780, 420]], speed: 78, pause: 0.5 },
      { path: [[120, 90], [120, 540], [330, 540]], speed: 68, pause: 0.7 },
      { path: [[840, 90], [840, 540], [630, 540]], speed: 68, pause: 0.7 }
    ],
    cameras: [
      { x: 480, y: 330, base: -Math.PI / 2, sweep: 1.1, speed: 0.8, range: 185 },
      { x: 30, y: 30, base: Math.PI / 4, sweep: 0.7, speed: 0.65, range: 175 },
      { x: 930, y: 30, base: Math.PI * 0.75, sweep: 0.7, speed: 0.65, range: 175 }
    ],
    loot: [
      { x: 390, y: 333, label: 'The Golden Atlas' },
      { x: 90, y: 90, label: 'Vault chart I' },
      { x: 870, y: 90, label: 'Vault chart II' },
      { x: 90, y: 550, label: 'Vault chart III' },
      { x: 870, y: 550, label: 'Vault chart IV' }
    ]
  }
];
