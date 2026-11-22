// Nightshift Heist — every pixel the player sees, drawn on one canvas.
// One job: turn the game state into the room, the cones, the HUD and the screens.

import { VIEW, HUD_HEIGHT, ROOM, TUNE } from './config.js';
import { WALLS, COVER } from './level.js';

const INK = '#e8e4d8';
const DIM = '#8a90a8';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function conePath(ctx, x, y, angle, range, half) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
}

function drawFloor(ctx) {
  ctx.fillStyle = '#10142a';
  ctx.fillRect(ROOM.x, ROOM.y, ROOM.width, ROOM.height);
  // Checker tiles, faint enough to read as a gallery floor.
  ctx.fillStyle = '#141a38';
  const tile = 48;
  for (let ty = ROOM.y; ty < ROOM.y + ROOM.height; ty += tile) {
    for (let tx = ROOM.x; tx < ROOM.x + ROOM.width; tx += tile) {
      const odd = ((tx - ROOM.x) / tile + (ty - ROOM.y) / tile) % 2 === 0;
      if (odd) ctx.fillRect(tx, ty, tile, tile);
    }
  }
  // Red carpet runner down the middle of the room.
  ctx.fillStyle = '#4a1620';
  ctx.fillRect(ROOM.x + 440, ROOM.y, 80, ROOM.height);
  ctx.fillStyle = '#5d1d28';
  ctx.fillRect(ROOM.x + 444, ROOM.y, 72, ROOM.height);
  ctx.strokeStyle = '#8a6d2f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ROOM.x + 444, ROOM.y);
  ctx.lineTo(ROOM.x + 444, ROOM.y + ROOM.height);
  ctx.moveTo(ROOM.x + 516, ROOM.y);
  ctx.lineTo(ROOM.x + 516, ROOM.y + ROOM.height);
  ctx.stroke();
}

function drawWallsAndDoor(ctx, state) {
  ctx.fillStyle = '#232a45';
  for (const w of WALLS) ctx.fillRect(w.x, w.y, w.width, w.height);
  ctx.strokeStyle = '#8a6d2f';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, ROOM.y + 1, ROOM.width - 2, ROOM.height - 2);
  // The service door: green exit zone at the bottom wall.
  const e = TUNE.exitZone;
  const blink = state.mode === 'play' && Math.floor(state.time * 2) % 2 === 0;
  ctx.fillStyle = blink ? '#1f7a44' : '#27a35c';
  ctx.fillRect(e.x, e.y, e.width, e.height);
  ctx.fillStyle = '#e8f5e9';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('EXIT', e.x + e.width / 2, e.y + e.height / 2);
}

function drawCover(ctx) {
  for (const c of COVER) {
    if (c.kind === 'pillar') {
      ctx.fillStyle = '#2c3557';
      ctx.beginPath();
      ctx.arc(c.x + c.width / 2, c.y + c.height / 2, c.width / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#8a6d2f';
      ctx.lineWidth = 2;
      ctx.stroke();
      continue;
    }
    if (c.kind === 'plinth') {
      ctx.fillStyle = '#3a2f1c';
      roundRect(ctx, c.x, c.y, c.width, c.height, 6);
      ctx.fill();
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 3;
      ctx.stroke();
      continue;
    }
    // Display case: dark base, glassy top, gold trim.
    ctx.fillStyle = '#1a2340';
    roundRect(ctx, c.x, c.y, c.width, c.height, 5);
    ctx.fill();
    ctx.fillStyle = 'rgba(140, 190, 255, 0.16)';
    roundRect(ctx, c.x + 5, c.y + 5, c.width - 10, c.height - 10, 4);
    ctx.fill();
    ctx.strokeStyle = '#8a6d2f';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawLoot(ctx, state) {
  for (const item of state.loot) {
    if (item.taken) continue;
    const bob = Math.sin(state.time * 3 + item.x) * 2;
    if (item.kind === 'sapphire') {
      ctx.save();
      ctx.translate(item.x, item.y + bob);
      ctx.fillStyle = '#37d6e0';
      ctx.beginPath();
      ctx.moveTo(0, -14); ctx.lineTo(11, 0); ctx.lineTo(0, 14); ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#b8f4f8';
      ctx.beginPath();
      ctx.moveTo(0, -14); ctx.lineTo(6, 0); ctx.lineTo(0, 14); ctx.lineTo(-6, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      continue;
    }
    if (item.kind === 'gold') {
      ctx.fillStyle = '#f2c230';
      roundRect(ctx, item.x - 10, item.y - 6 + bob, 20, 12, 3);
      ctx.fill();
      ctx.fillStyle = '#ffe27a';
      ctx.fillRect(item.x - 10, item.y - 6 + bob, 20, 4);
      continue;
    }
    // Painting: framed canvas with a tiny landscape.
    ctx.fillStyle = '#6d4c1f';
    ctx.fillRect(item.x - 13, item.y - 17 + bob, 26, 34);
    ctx.fillStyle = '#274b73';
    ctx.fillRect(item.x - 10, item.y - 14 + bob, 20, 14);
    ctx.fillStyle = '#3f7a4d';
    ctx.fillRect(item.x - 10, item.y + bob, 20, 14);
    ctx.fillStyle = '#f2c230';
    ctx.beginPath();
    ctx.arc(item.x + 4, item.y - 7 + bob, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCones(ctx, state) {
  // Camera cones first (under guard cones), amber while calm, red when seeing.
  for (const c of state.cameras) {
    const grad = ctx.createRadialGradient(c.x, c.y, 8, c.x, c.y, TUNE.cameraRange);
    const col = c.seeing ? '255, 60, 60' : '255, 190, 60';
    grad.addColorStop(0, `rgba(${col}, 0.34)`);
    grad.addColorStop(1, `rgba(${col}, 0.03)`);
    ctx.fillStyle = grad;
    conePath(ctx, c.x, c.y, c.angle, TUNE.cameraRange, TUNE.cameraHalfAngle);
    ctx.fill();
  }
  for (const g of state.guards) {
    const grad = ctx.createRadialGradient(g.x, g.y, 10, g.x, g.y, TUNE.guardRange);
    const col = g.seeing || g.mode === 'alert' ? '255, 60, 60' : '255, 220, 90';
    grad.addColorStop(0, `rgba(${col}, 0.30)`);
    grad.addColorStop(1, `rgba(${col}, 0.02)`);
    ctx.fillStyle = grad;
    conePath(ctx, g.x, g.y, g.angle, TUNE.guardRange, TUNE.coneHalfAngle);
    ctx.fill();
  }
}

function drawWatcher(ctx, x, y, angle, kind, seeing) {
  if (kind === 'camera') {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = seeing ? '#ff3b3b' : '#3a435f';
    roundRect(ctx, -4, -6, 16, 12, 3);
    ctx.fill();
    ctx.fillStyle = seeing ? '#ff8080' : '#ffd23e';
    ctx.beginPath();
    ctx.arc(13, 0, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  // Guard: navy body, pale face, direction tick.
  ctx.fillStyle = '#1d2b52';
  ctx.beginPath();
  ctx.arc(x, y, TUNE.guardRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = seeing ? '#ff3b3b' : '#7e86a3';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.arc(x + Math.cos(angle) * 5, y + Math.sin(angle) * 5, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8dcc0';
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle) * (TUNE.guardRadius + 5), y + Math.sin(angle) * (TUNE.guardRadius + 5));
  ctx.stroke();
}

function drawThief(ctx, thief) {
  ctx.save();
  ctx.translate(thief.x, thief.y);
  const r = thief.sneaking ? 9 : TUNE.thiefRadius;
  // Faint gold ring so the thief always reads against the dark floor.
  ctx.strokeStyle = 'rgba(201, 162, 39, 0.55)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
  ctx.stroke();
  // Hooded figure: dark cloak, pale mask glint, facing tick.
  ctx.fillStyle = '#151312';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = '#e8e4d8';
  ctx.beginPath();
  ctx.arc(Math.cos(thief.angle) * 4, Math.sin(thief.angle) * 4, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8e4d8';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(thief.angle) * (r + 4), Math.sin(thief.angle) * (r + 4));
  ctx.stroke();
  ctx.restore();
}

function drawEffects(ctx, state) {
  for (const s of state.smokes) {
    const alpha = Math.max(0, s.life / TUNE.smokeSeconds) * 0.55;
    ctx.fillStyle = `rgba(180, 185, 200, ${alpha})`;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(210, 214, 226, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(s.x - 18, s.y + 8, s.radius * 0.55, 0, Math.PI * 2);
    ctx.arc(s.x + 20, s.y - 10, s.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const c of state.coins) {
    ctx.strokeStyle = `rgba(242, 194, 48, ${Math.max(0, c.life / 3)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 8 + (3 - c.life) * 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f2c230';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Red vignette while the alarm is hot.
  if (state.alarm > 55 && state.mode === 'play') {
    const a = (state.alarm - 55) / 45;
    const grad = ctx.createRadialGradient(480, 352, 180, 480, 352, 520);
    grad.addColorStop(0, 'rgba(255, 40, 40, 0)');
    grad.addColorStop(1, `rgba(255, 40, 40, ${0.28 * a})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, HUD_HEIGHT, VIEW.width, VIEW.height - HUD_HEIGHT);
  }
}

function alarmColor(alarm) {
  if (alarm < 35) return '#37c978';
  if (alarm < 70) return '#f2c230';
  return '#ff3b3b';
}

function drawHud(ctx, state) {
  ctx.fillStyle = '#0a0d1c';
  ctx.fillRect(0, 0, VIEW.width, HUD_HEIGHT);
  ctx.strokeStyle = '#2b3350';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, HUD_HEIGHT);
  ctx.lineTo(VIEW.width, HUD_HEIGHT);
  ctx.stroke();

  ctx.textBaseline = 'middle';
  ctx.fillStyle = INK;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('NIGHTSHIFT HEIST', 14, 24);
  ctx.fillStyle = DIM;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('The Meridian Gallery', 14, 46);

  // Alarm meter, centre of the bar.
  const barX = 330;
  const barW = 300;
  ctx.fillStyle = DIM;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', barX, 18);
  ctx.fillStyle = '#1a2036';
  roundRect(ctx, barX, 28, barW, 18, 4);
  ctx.fill();
  ctx.fillStyle = alarmColor(state.alarm);
  const w = Math.max(0, Math.min(1, state.alarm / TUNE.alarmMax)) * barW;
  if (w > 2) { roundRect(ctx, barX, 28, w, 18, 4); ctx.fill(); }
  ctx.strokeStyle = '#3a435f';
  ctx.lineWidth = 1;
  roundRect(ctx, barX, 28, barW, 18, 4);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(`${Math.round(state.alarm)}%`, barX + barW + 10, 37);

  // Loot, tools and time, right side.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#f2c230';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(`$${state.score}`, 946, 20);
  ctx.fillStyle = INK;
  ctx.font = '12px system-ui, sans-serif';
  const mins = Math.floor(state.time / 60);
  const secs = Math.floor(state.time % 60).toString().padStart(2, '0');
  ctx.fillText(`Loot ${state.collected} / ${state.lootTotal}   ${mins}:${secs}`, 946, 38);
  ctx.fillStyle = DIM;
  ctx.fillText(`Q smoke ×${state.tools.smoke}    E coin ×${state.tools.coins}${state.muted ? '    M muted' : ''}`, 946, 56);
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(5, 7, 15, 0.82)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText(title, VIEW.width / 2, 210);
  ctx.fillStyle = INK;
  ctx.font = '16px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW.width / 2, 268 + i * 28));
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#07080f';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawFloor(ctx);
  drawWallsAndDoor(ctx, state);
  drawCover(ctx);
  drawLoot(ctx, state);
  drawCones(ctx, state);
  for (const c of state.cameras) drawWatcher(ctx, c.x, c.y, c.angle, 'camera', c.seeing);
  for (const g of state.guards) drawWatcher(ctx, g.x, g.y, g.angle, 'guard', g.seeing);
  drawThief(ctx, state.thief);
  drawEffects(ctx, state);
  drawHud(ctx, state);

  if (state.banner) {
    ctx.textAlign = 'center';
    ctx.fillStyle = state.banner === 'SPOTTED!' ? '#ff3b3b' : '#f2c230';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText(state.banner, VIEW.width / 2, 110);
  }

  if (state.mode === 'title') {
    overlay(ctx, 'NIGHTSHIFT HEIST', [
      'The Meridian Gallery, after hours. The Star Sapphire waits on its plinth.',
      'Slip past Marco, Lena and Otto. Dodge the sweeping cameras. Grab the sapphire',
      'and get back to the green EXIT door — without letting the alarm hit 100%.',
      '',
      'WASD / arrows move · Shift sneak · Q smoke pellet · E toss a coin · P pause',
      'Collect the sapphire to win. Gold and paintings are worth extra.',
      '',
      'Press ENTER or click to start',
    ], '#f2c230');
  } else if (state.mode === 'paused') {
    overlay(ctx, 'PAUSED', ['Press P to keep sneaking.', 'R restarts the job.'], '#e8e4d8');
  } else if (state.mode === 'win') {
    overlay(ctx, 'CLEAN GETAWAY', [
      `You slipped out with the Star Sapphire. Loot $${state.score}.`,
      `Time ${Math.floor(state.time / 60)}:${Math.floor(state.time % 60).toString().padStart(2, '0')} · ${state.collected} of ${state.lootTotal} pieces taken.`,
      state.ghostBonus ? 'Ghost bonus: +100 — the alarm never passed 30.' : 'The guards never knew what hit them.',
      '',
      'Press R to run the job again.',
    ], '#37c978');
  } else if (state.mode === 'lose') {
    overlay(ctx, 'CAUGHT!', [
      state.loseReason || 'The alarm hit 100%.',
      `You carried $${state.score} of loot when they got you.`,
      '',
      'Press R to try the job again.',
    ], '#ff3b3b');
  }
}
