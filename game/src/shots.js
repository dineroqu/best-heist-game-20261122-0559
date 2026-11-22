// Nightshift Heist — staged scenes for the entry's screenshots.
// One job: given a shot name, freeze the game in a readable, complete frame
// (room, guards with cones, cameras, loot, alarm meter and HUD all visible).

import { TUNE } from './config.js';

// Stage the state for one named shot. Returns true when the name is known.
export function applyShot(state, name) {
  if (name === 'start') {
    state.mode = 'title';
    state.time = 0;
    return true;
  }

  if (name === 'cover') {
    // Mid-heist: the thief creeps along the carpet toward the plinth while a
    // guard cone sweeps past and a camera watches the east lane.
    state.mode = 'play';
    state.paused = true;
    state.time = 47;
    state.thief.x = 430;
    state.thief.y = 400;
    state.thief.angle = -Math.PI / 2;
    state.thief.sneaking = true;
    state.guards[0].x = 640; state.guards[0].y = 120; state.guards[0].angle = Math.PI;
    state.guards[1].x = 830; state.guards[1].y = 420; state.guards[1].angle = Math.PI / 2;
    state.guards[2].x = 560; state.guards[2].y = 400; state.guards[2].angle = Math.PI;
    state.cameras[0].angle = 0.7;
    state.cameras[1].angle = 2.4;
    state.alarm = 35;
    takeLoot(state, 'gold1');
    takeLoot(state, 'paint1');
    return true;
  }

  if (name === 'alarm') {
    // The hot moment: the thief is inside Marco's cone, the alarm is nearly
    // full, and the SPOTTED banner is up.
    state.mode = 'play';
    state.paused = true;
    state.time = 83;
    state.thief.x = 500;
    state.thief.y = 170;
    state.thief.angle = Math.PI / 2;
    state.thief.sneaking = false;
    state.guards[0].x = 500; state.guards[0].y = 120; state.guards[0].angle = Math.PI / 2;
    state.guards[0].seeing = true;
    state.guards[0].mode = 'alert';
    state.guards[1].x = 830; state.guards[1].y = 300; state.guards[1].angle = -Math.PI / 2;
    state.guards[2].x = 420; state.guards[2].y = 380; state.guards[2].angle = 0;
    state.cameras[0].angle = 1.1;
    state.cameras[1].angle = 2.0;
    state.alarm = 72;
    state.banner = 'SPOTTED!';
    takeLoot(state, 'gold1');
    takeLoot(state, 'gold2');
    return true;
  }

  if (name === 'win') {
    // The getaway: every piece taken, alarm low, win screen with the score.
    state.mode = 'win';
    state.time = 96;
    state.alarm = 18;
    state.ghostBonus = true;
    for (const item of state.loot) takeLoot(state, item.id);
    // The win rule pays a time bonus plus the ghost bonus on top of the loot.
    state.score += Math.max(0, 400 - Math.floor(state.time) * 2) + 100;
    state.thief.x = 80;
    state.thief.y = 580;
    return true;
  }

  return false;
}

function takeLoot(state, id) {
  const item = state.loot.find((l) => l.id === id);
  if (item && !item.taken) {
    item.taken = true;
    state.collected += 1;
    state.score += item.value;
  }
}

// The shot parameter, if the page was opened with one: ?shot=cover&seed=1.
export function shotFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('shot');
  } catch (err) {
    return null;
  }
}
