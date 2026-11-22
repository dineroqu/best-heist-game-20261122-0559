# best-heist-game-20261122-0559

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/dineroqu/best-heist-game-20261122-0559/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/dineroqu/best-heist-game-20261122-0559/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

Nightshift Heist — The Meridian Gallery. A complete top-down stealth heist game that runs offline in a desktop browser. You are Rook, a thief slipping through the Meridian Gallery after hours to steal the Star Sapphire and get back out through the green service door.

## The job

- **Three patrolling guards** — Marco, Lena and Otto — each with a vision cone
  you have to read before you move. Being seen raises the alarm.
- **Two rotating security cameras** sweeping the north lanes.
- **An alarm meter** that climbs while you are spotted and falls while you stay
  hidden. At 100% the gallery locks down and you are caught.
- **Loot to weigh against the risk**: the Star Sapphire ($500, required to win),
  three gold bars and two paintings, plus a time bonus and a ghost bonus for
  finishing with the alarm under 30.
- **Tools at a cost**: smoke pellets (Q, 2 uses) that blind every cone, and
  tossed coins (E, 3 uses, −$25 each) that pull the nearest guard off patrol.
- **Three routes** through the gallery — west lane, carpet centre, east lane —
  behind display cases and pillars that block sight and movement.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows | Move |
| Shift | Sneak (slower, harder to spot) |
| Mouse click | Walk to that spot |
| Q | Smoke pellet |
| E | Toss a coin |
| P | Pause |
| M | Mute |
| R | Restart |
| Enter / click | Start |

## Run it

Serve `game/` with any static server and open `game/index.html` in desktop
Chrome. No build step, no network requests: every script, style and sound is
a file under `game/` (sounds are synthesized with WebAudio).

```sh
node serve.ts   # serves game/ on http://localhost:8080
```

Or with any static server, for example:

```sh
python3 -m http.server 8080 --directory game
```

## Layout

- `game/index.html` — page shell, canvas, verification hook
- `game/style.css` — page chrome
- `game/src/main.js` — state, loop, movement, loot, tools, win/lose rules
- `game/src/config.js` — tuning constants (speeds, cone ranges, alarm rates)
- `game/src/level.js` — the gallery floor plan: walls, cover, loot, patrols, cameras
- `game/src/ai.js` — guard patrols, camera sweeps, cones, line of sight
- `game/src/render.js` — every pixel: room, cones, HUD, screens
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesized sound effects (WebAudio, no files)
- `game/src/shots.js` — staged screenshot scenes (`?shot=cover`, `alarm`, `win`, `start`)
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the kit's `vendor/makefun-game.ts`
- `screenshots/` — 3–4 real renders of the game in a browser

## Screenshots

The cover and the other shots are real renders of this game's own code in a
headless browser, staged with `?shot=` so one frame shows the room, the
guards with their cones, the cameras, the loot and the alarm meter together.

---

<sub>Entered on [make.fun](https://make.fun/?ref=tvfbjxfd&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
