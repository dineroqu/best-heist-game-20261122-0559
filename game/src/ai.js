// Nightshift Heist — guard patrols, camera sweeps and the eyes of the room.
// One job: decide who can see the thief, and how fast the alarm rises.

import { TUNE } from './config.js';
import { SOLIDS } from './level.js';

export function makeGuard(def) {
  return {
    name: def.name,
    waypoints: def.waypoints.map((w) => ({ x: w.x, y: w.y })),
    speed: def.speed,
    pause: def.pause,
    x: def.waypoints[0].x,
    y: def.waypoints[0].y,
    waypointIndex: 1,
    wait: 0,
    angle: 0,
    mode: 'patrol', // patrol | investigate | alert
    investigateTarget: null,
    investigateTimer: 0,
    alertTimer: 0,
    seeing: false,
  };
}

export function makeCamera(def) {
  return {
    id: def.id,
    x: def.x,
    y: def.y,
    centre: def.centre,
    sweep: def.sweep,
    period: def.period,
    phase: def.phase,
    angle: def.centre,
    seeing: false,
  };
}

// True when the straight segment between two points crosses no solid rect.
export function hasLineOfSight(x0, y0, x1, y1) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / 7));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    for (const s of SOLIDS) {
      if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) return false;
    }
  }
  return true;
}

// True when a point lies inside any smoke cloud.
export function insideSmoke(x, y, smokes) {
  for (const s of smokes) {
    if (Math.hypot(x - s.x, y - s.y) < s.radius) return true;
  }
  return false;
}

// Cone test: target within range, inside the half-angle, with clear sight.
function inCone(ox, oy, angle, range, halfAngle, tx, ty, smokes) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return { seen: false, dist };
  let diff = Math.atan2(dy, dx) - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > halfAngle) return { seen: false, dist };
  if (insideSmoke(tx, ty, smokes)) return { seen: false, dist };
  if (!hasLineOfSight(ox, oy, tx, ty)) return { seen: false, dist };
  return { seen: true, dist };
}

// How fast the alarm climbs for a sighting at this distance.
export function alarmRateFor(dist, sneaking) {
  let rate = dist < 70 ? TUNE.alarmClose : dist < 130 ? TUNE.alarmMid : TUNE.alarmFar;
  if (sneaking) rate *= TUNE.sneakFactor;
  return rate;
}

function moveToward(e, tx, ty, speed, dt) {
  const dx = tx - e.x;
  const dy = ty - e.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.5) return true;
  const step = Math.min(dist, speed * dt);
  e.x += (dx / dist) * step;
  e.y += (dy / dist) * step;
  e.angle = Math.atan2(dy, dx);
  return dist - step < 0.5;
}

// One guard tick: patrol, walk to a tossed coin, or stare at the thief.
export function updateGuard(g, dt, thief, smokes, coins) {
  g.seeing = false;
  if (g.mode === 'investigate') {
    const target = g.investigateTarget;
    if (target && moveToward(g, target.x, target.y, g.speed * 1.15, dt)) {
      g.investigateTimer -= dt;
      g.angle += dt * 1.8; // look around while searching
      if (g.investigateTimer <= 0) {
        g.mode = 'patrol';
        g.investigateTarget = null;
      }
    }
    return;
  }

  if (g.mode === 'alert') {
    g.angle = Math.atan2(thief.y - g.y, thief.x - g.x);
    g.alertTimer -= dt;
    if (g.alertTimer <= 0) g.mode = 'patrol';
    return;
  }

  // Patrol: walk the waypoints, pausing at each one.
  if (g.wait > 0) {
    g.wait -= dt;
    return;
  }
  const wp = g.waypoints[g.waypointIndex];
  if (moveToward(g, wp.x, wp.y, g.speed, dt)) {
    g.waypointIndex = (g.waypointIndex + 1) % g.waypoints.length;
    g.wait = g.pause;
  }
}

// A tossed coin pulls the nearest guard in earshot toward it.
export function sendGuardToCoin(guards, coin) {
  let best = null;
  let bestDist = TUNE.coinRange;
  for (const g of guards) {
    if (g.mode === 'alert') continue;
    const d = Math.hypot(g.x - coin.x, g.y - coin.y);
    if (d < bestDist) { best = g; bestDist = d; }
  }
  if (!best) return null;
  best.mode = 'investigate';
  best.investigateTarget = { x: coin.x, y: coin.y };
  best.investigateTimer = 2.5;
  best.wait = 0;
  return best;
}

// Sweep a camera back and forth across its arc.
export function updateCamera(c, time) {
  const phase = (time / c.period) * Math.PI * 2 + c.phase;
  c.angle = c.centre + Math.sin(phase) * c.sweep;
}

// Test one watcher (guard or camera) against the thief. Returns the alarm
// rate it contributes, or 0 when the thief is unseen.
export function watchThief(w, isCamera, thief, smokes) {
  const range = isCamera ? TUNE.cameraRange : TUNE.guardRange;
  const half = isCamera ? TUNE.cameraHalfAngle : TUNE.coneHalfAngle;
  const effRange = thief.sneaking ? range * 0.75 : range;
  const { seen, dist } = inCone(w.x, w.y, w.angle, effRange, half, thief.x, thief.y, smokes);
  w.seeing = seen;
  if (!seen) return 0;
  if (!isCamera) {
    w.mode = 'alert';
    w.alertTimer = 2.0;
  }
  return alarmRateFor(dist, thief.sneaking);
}
