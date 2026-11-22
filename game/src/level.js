// Nightshift Heist — the gallery floor plan: walls, cover, loot, patrols and
// cameras. One job: where everything in the room is. The numbers that tune
// how it plays live in config.js.

// Solid rectangles that block movement and line of sight.
// The bottom wall is split so the service door (the exit) stays open.
export const WALLS = [
  { x: 0, y: 64, width: 960, height: 12 },     // top wall
  { x: 0, y: 64, width: 12, height: 576 },     // left wall
  { x: 948, y: 64, width: 12, height: 576 },   // right wall
  { x: 0, y: 628, width: 40, height: 12 },     // bottom wall, left of door
  { x: 120, y: 628, width: 840, height: 12 },  // bottom wall, right of door
];

// Display cases, pillars and the central plinth. Solid, and they block sight.
export const COVER = [
  { x: 140, y: 160, width: 60, height: 160, kind: 'case' },    // west case
  { x: 760, y: 160, width: 60, height: 160, kind: 'case' },    // east case
  { x: 300, y: 160, width: 46, height: 46, kind: 'pillar' },   // NW pillar
  { x: 614, y: 160, width: 46, height: 46, kind: 'pillar' },   // NE pillar
  { x: 300, y: 480, width: 46, height: 46, kind: 'pillar' },   // SW pillar
  { x: 614, y: 480, width: 46, height: 46, kind: 'pillar' },   // SE pillar
  { x: 420, y: 500, width: 120, height: 40, kind: 'case' },    // south bench
  { x: 430, y: 280, width: 100, height: 80, kind: 'plinth' },  // sapphire plinth
];

// Everything solid: walls plus cover, used for movement and sight checks.
export const SOLIDS = [...WALLS, ...COVER];

// Loot: id, kind, position, value. The sapphire is the win condition.
export const LOOT = [
  { id: 'sapphire', kind: 'sapphire', x: 480, y: 268, value: 500 },
  { id: 'gold1', kind: 'gold', x: 170, y: 350, value: 100 },
  { id: 'gold2', kind: 'gold', x: 120, y: 400, value: 100 },
  { id: 'gold3', kind: 'gold', x: 220, y: 410, value: 100 },
  { id: 'paint1', kind: 'painting', x: 880, y: 240, value: 150 },
  { id: 'paint2', kind: 'painting', x: 880, y: 360, value: 150 },
];

// Guards: name, patrol waypoints, speed, pause at each waypoint.
export const GUARDS = [
  {
    name: 'Marco', speed: 55, pause: 0.9,
    waypoints: [{ x: 180, y: 120 }, { x: 780, y: 120 }],
  },
  {
    name: 'Lena', speed: 50, pause: 0.9,
    waypoints: [{ x: 830, y: 220 }, { x: 830, y: 520 }],
  },
  {
    name: 'Otto', speed: 48, pause: 0.7,
    waypoints: [
      { x: 380, y: 240 }, { x: 580, y: 240 },
      { x: 580, y: 400 }, { x: 380, y: 400 },
    ],
  },
];

// Cameras: wall mount, sweep centre angle and sweep width (radians).
// Angles are measured in canvas space (0 = east, PI/2 = south).
export const CAMERAS = [
  { id: 'cam1', x: 60, y: 78, centre: 0.95, sweep: 0.75, period: 5.0, phase: 0 },
  { id: 'cam2', x: 900, y: 78, centre: 2.19, sweep: 0.75, period: 6.0, phase: 1.7 },
];
