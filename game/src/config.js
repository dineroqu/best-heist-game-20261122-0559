// Nightshift Heist — tuning constants: the numbers that define how the game
// feels. The floor plan itself (walls, loot, patrols) lives in level.js.

export const VIEW = { width: 960, height: 640 };
export const HUD_HEIGHT = 64;

// The playable room sits below the HUD bar.
export const ROOM = { x: 0, y: 64, width: 960, height: 576 };

// Movement and detection tuning.
export const TUNE = {
  walkSpeed: 150,      // px per second
  sneakSpeed: 85,      // px per second while Shift is held
  thiefRadius: 11,
  guardRadius: 13,
  guardRange: 185,     // vision cone reach, guards
  cameraRange: 215,    // vision cone reach, cameras
  coneHalfAngle: 0.61, // ~35 degrees
  cameraHalfAngle: 0.52, // ~30 degrees
  alarmClose: 34,      // alarm points per second, thief closer than 70px
  alarmMid: 20,        // alarm points per second, 70..130px
  alarmFar: 10,        // alarm points per second, beyond 130px
  alarmDecay: 6,       // alarm points per second while unseen
  alarmMax: 100,
  sneakFactor: 0.5,    // sneaking halves how fast the alarm rises
  smokeRadius: 78,
  smokeSeconds: 4.5,
  coinRange: 260,      // guards nearer than this hear a tossed coin
  coinCost: 25,
  lootPickupRadius: 26,
  exitZone: { x: 40, y: 600, width: 80, height: 40 },
};

export const THIEF_START = { x: 80, y: 580 };
export const START_TOOLS = { smoke: 2, coins: 3 };
