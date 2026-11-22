// Nightshift Heist — the game itself: state, the loop, movement, loot, tools
// and the win/lose rules. Rendering lives in render.js, the eyes in ai.js.

import { VIEW, TUNE, THIEF_START, START_TOOLS } from './config.js';
import { SOLIDS, LOOT, GUARDS, CAMERAS } from './level.js';
import { createInput, moveDirection, takePressed } from './input.js';
import { createAudio } from './audio.js';
import { makeGuard, makeCamera, updateGuard, updateCamera, watchThief, sendGuardToCoin, insideSmoke } from './ai.js';
import { render } from './render.js';
import { applyShot, shotFromUrl } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();

function freshState() {
  return {
    mode: 'title', // title | play | paused | win | lose
    paused: false,
    time: 0,
    alarm: 0,
    score: 0,
    collected: 0,
    lootTotal: LOOT.length,
    tools: { ...START_TOOLS },
    muted: false,
    banner: null,
    bannerTimer: 0,
    loseReason: '',
    ghostBonus: false,
    thief: {
      x: THIEF_START.x, y: THIEF_START.y,
      angle: -Math.PI / 2, sneaking: false,
    },
    guards: GUARDS.map(makeGuard),
    cameras: CAMERAS.map(makeCamera),
    loot: LOOT.map((l) => ({ ...l, taken: false })),
    smokes: [],
    coins: [],
  };
}

let state = freshState();

function circleHitsSolid(x, y, radius) {
  for (const s of SOLIDS) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.width));
    const cy = Math.max(s.y, Math.min(y, s.y + s.height));
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < radius * radius) return true;
  }
  return false;
}

function moveThief(dt) {
  const dir = moveDirection(input);
  const thief = state.thief;
  thief.sneaking = input.keys.has('sneak');
  let mx = dir.x;
  let my = dir.y;
  if (mx === 0 && my === 0 && input.moveTarget) {
    const dx = input.moveTarget.x - thief.x;
    const dy = input.moveTarget.y - thief.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      input.moveTarget = null;
    } else {
      mx = dx / dist;
      my = dy / dist;
      thief.sneaking = false;
    }
  }
  if (mx === 0 && my === 0) return;
  const speed = thief.sneaking ? TUNE.sneakSpeed : TUNE.walkSpeed;
  thief.angle = Math.atan2(my, mx);
  const nx = thief.x + mx * speed * dt;
  if (!circleHitsSolid(nx, thief.y, TUNE.thiefRadius)) thief.x = nx;
  const ny = thief.y + my * speed * dt;
  if (!circleHitsSolid(thief.x, ny, TUNE.thiefRadius)) thief.y = ny;
  thief.x = Math.max(12 + TUNE.thiefRadius, Math.min(948 - TUNE.thiefRadius, thief.x));
  thief.y = Math.max(76 + TUNE.thiefRadius, Math.min(628 - TUNE.thiefRadius, thief.y));
}

function pickUpLoot() {
  for (const item of state.loot) {
    if (item.taken) continue;
    const d = Math.hypot(state.thief.x - item.x, state.thief.y - item.y);
    if (d < TUNE.lootPickupRadius + 4) {
      item.taken = true;
      state.collected += 1;
      state.score += item.value;
      if (item.kind === 'sapphire') {
        audio.sapphire();
        state.banner = 'STAR SAPPHIRE — GET OUT!';
        state.bannerTimer = 2.5;
      } else {
        audio.pickup();
      }
    }
  }
}

function useSmoke() {
  if (state.tools.smoke <= 0) return;
  state.tools.smoke -= 1;
  state.smokes.push({
    x: state.thief.x, y: state.thief.y,
    radius: TUNE.smokeRadius, life: TUNE.smokeSeconds,
  });
  audio.smoke();
}

function useCoin() {
  if (state.tools.coins <= 0) return;
  state.tools.coins -= 1;
  state.score = Math.max(0, state.score - TUNE.coinCost);
  const cx = state.thief.x + Math.cos(state.thief.angle) * 90;
  const cy = state.thief.y + Math.sin(state.thief.angle) * 90;
  const coin = { x: cx, y: cy, life: 3 };
  state.coins.push(coin);
  audio.coin();
  sendGuardToCoin(state.guards, coin);
}

function checkWinLose() {
  const sapphire = state.loot.find((l) => l.id === 'sapphire');
  const e = TUNE.exitZone;
  const t = state.thief;
  if (sapphire.taken && t.x >= e.x && t.x <= e.x + e.width && t.y >= e.y - 8 && t.y <= e.y + e.height) {
    const timeBonus = Math.max(0, 400 - Math.floor(state.time) * 2);
    state.ghostBonus = state.alarm < 30;
    state.score += timeBonus + (state.ghostBonus ? 100 : 0);
    state.mode = 'win';
    audio.win();
    return;
  }
  if (state.alarm >= TUNE.alarmMax) {
    state.mode = 'lose';
    state.loseReason = 'The alarm hit 100% — the gallery locked down.';
    audio.caught();
    return;
  }
  for (const g of state.guards) {
    const d = Math.hypot(t.x - g.x, t.y - g.y);
    if (d < TUNE.thiefRadius + TUNE.guardRadius - 2) {
      state.mode = 'lose';
      state.loseReason = `${g.name} grabbed you by the collar.`;
      audio.caught();
      return;
    }
  }
}

function update(dt) {
  if (state.mode !== 'play' || state.paused) return;
  state.time += dt;

  // One-shot actions.
  if (takePressed(input, 'smoke')) useSmoke();
  if (takePressed(input, 'coin')) useCoin();
  if (takePressed(input, 'pause')) { state.paused = true; state.mode = 'paused'; }
  if (takePressed(input, 'mute')) state.muted = audio.toggleMute();
  if (takePressed(input, 'restart')) state = freshState();

  moveThief(dt);
  pickUpLoot();

  // Timers: smoke clouds fade, tossed coins stop ringing.
  for (const s of state.smokes) s.life -= dt;
  state.smokes = state.smokes.filter((s) => s.life > 0);
  for (const c of state.coins) c.life -= dt;
  state.coins = state.coins.filter((c) => c.life > 0);
  if (state.bannerTimer > 0) {
    state.bannerTimer -= dt;
    if (state.bannerTimer <= 0) state.banner = null;
  }

  // The eyes: guards patrol and cameras sweep, then each one tests its cone.
  for (const g of state.guards) updateGuard(g, dt, state.thief, state.smokes, state.coins);
  for (const c of state.cameras) updateCamera(c, state.time);
  let seenRate = 0;
  for (const g of state.guards) seenRate += watchThief(g, false, state.thief, state.smokes);
  for (const c of state.cameras) seenRate += watchThief(c, true, state.thief, state.smokes);
  if (seenRate > 0) {
    state.alarm = Math.min(TUNE.alarmMax, state.alarm + seenRate * dt);
    if (!state.banner) state.banner = 'SPOTTED!';
  } else {
    state.alarm = Math.max(0, state.alarm - TUNE.alarmDecay * dt);
    if (state.banner === 'SPOTTED!') state.banner = null;
  }
  audio.updateAlarm(dt, state.alarm);

  checkWinLose();
}

function frame(now) {
  const dt = Math.min(0.05, (now - frame.last) / 1000 || 0.016);
  frame.last = now;

  if (state.mode === 'title') {
    if (takePressed(input, 'confirm')) {
      audio.unlock();
      audio.click();
      state.mode = 'play';
    }
  } else if (state.mode === 'paused') {
    if (takePressed(input, 'pause')) { state.paused = false; state.mode = 'play'; }
    if (takePressed(input, 'restart')) state = freshState();
  } else if (state.mode === 'win' || state.mode === 'lose') {
    if (takePressed(input, 'restart') || takePressed(input, 'confirm')) state = freshState();
  } else {
    update(dt);
  }

  render(ctx, state);
  requestAnimationFrame(frame);
}
frame.last = 0;

// Debug hook for automated playtests (read-only from the outside): exposes
// the live state so a test driver can move the thief and read the alarm,
// the loot and the mode without touching the game. It changes no gameplay.
window.__heist = { getState: () => state };

// A staged screenshot (?shot=...) renders one frozen frame and stops.
const shot = shotFromUrl();
if (shot && applyShot(state, shot)) {
  render(ctx, state);
} else {
  requestAnimationFrame(frame);
}
