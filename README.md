# Pardon Run — a turkey escape game

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/jontumpil/makefun-turkey-run-game-01/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/jontumpil/makefun-turkey-run-game-01/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

Thanksgiving is coming, the farmer has a net, the oven is hot — and you are the main course. **Pardon Run** is a side-scrolling escape game: one very determined turkey, 1,500 metres of barnyard, farmyard and kitchen, and a presidential pardon waiting at the gate at the far end.

Run, jump the hay bales and fences, duck under the kitchen tables, vanish into haystacks and pantry cupboards to break the farmer's eye, gobble corn for points, and whatever you do, do not let the net come down. Three feathers is all you get: ovens burn, carving knives fly, and every grab costs one.

## How to play

- **→ / D** hold to run faster, **← / A** to ease off
- **Space / W / ↑** jump — a running leap clears the hot and sharp things
- **↓ / S** duck: slip under tables, hide in haystacks, barrels, curtains and the pantry
- **Shift** dash — a short burst, then it needs three seconds to catch its breath
- **Click** the mouse works too: menus, and a hop while running
- **P** pause, **M** mute

The farmer is no fool. He runs faster the further behind he falls, he loses your trail when you hide, he searches, and he grabs whatever comes within reach of the net. Stages grow harder as you go: the barnyard teaches, the farmyard tests, the kitchen throws knives.

## Run it

The game is plain HTML, CSS and JavaScript modules — no build step, no network, every picture drawn in code.

```sh
node serve.ts          # then open http://localhost:8000
# or simply open game/index.html in a browser
```

`main.ts` is the make.fun entry point: it copies `game/` and `screenshots/` into the output directory and writes the entry dossier.

## Layout

- `game/index.html` — the page and the canvas
- `game/src/config.js` — every tuning number in one place
- `game/src/world.js` — the seeded course: obstacles, hazards, hiding places, corn
- `game/src/turkey.js` — the bird: running, jumping, ducking, dashing, stumbling
- `game/src/farmer.js` — the pursuer: chase pressure, searching, the grab
- `game/src/render.js` — all drawing, HUD, title and ending screens
- `game/src/audio.js` — WebAudio-synthesized gobbles, jingles and a music loop
- `game/src/input.js`, `game/src/random.js` — controls and the seeded dice
- `game/src/main.js` — the state machine that ties it together

The course is generated from a fixed seed, so the run you practise is the run you get. Tuning was verified with a scripted pilot player: a clean, fast run escapes with feathers to spare; a sloppy one ends in the net.

---

<sub>Entered on [make.fun](https://make.fun/bounty/turkey-run-game-01) by @jontumpil.</sub>
