// Pardon Run — the course. One job: lay out the whole 1,500 m escape
// from the seeded dice — obstacles to jump, hazards to dodge, mud to
// wade, hiding places to vanish into, and corn to gobble on the way.

import { WORLD_LEN, GATE_X, STAGES } from "./config.js";
import { makeRng, rngRange, rngPick } from "./random.js";

// kind -> footprint and behaviour. Solids can be landed on; running
// into one's side staggers the turkey. Hazards cost a feather.
// "duckUnder" solids only collide with a turkey that stands tall.
const KINDS = {
  hay:        { w: 92,  h: 54,  solid: true },
  fence:      { w: 110, h: 76,  solid: true },
  barrel:     { w: 56,  h: 68,  solid: true },
  crate:      { w: 62,  h: 50,  solid: true },
  pumpkins:   { w: 96,  h: 44,  solid: true },
  cart:       { w: 150, h: 84,  solid: true },
  pots:       { w: 84,  h: 60,  solid: true },
  table:      { w: 170, h: 96,  solid: true, duckUnder: true },
  oven:       { w: 92,  h: 98,  hazard: true },
  knifeblock: { w: 60,  h: 62,  hazard: true },
  mud:        { w: 190, h: 0,   zone: "slow" },
};

const STAGE_POOLS = [
  ["hay", "fence", "hay", "pumpkins", "mud", "fence"],
  ["barrel", "crate", "cart", "pumpkins", "mud", "table", "crate"],
  ["oven", "knifeblock", "pots", "table", "oven", "pots", "knifeblock"],
];

const HIDING_KINDS = ["haystack", "barrelrow", "curtain", "pantry"];

export function buildWorld(seed) {
  const rng = makeRng(seed);
  const obstacles = [];
  const pickups = [];
  const hidings = [];

  for (let s = 0; s < STAGES.length; s++) {
    const stage = STAGES[s];
    let x = stage.from + (s === 0 ? 750 : 260);
    const end = Math.min(stage.to - 320, GATE_X - 500);
    while (x < end) {
      const kind = rngPick(rng, STAGE_POOLS[s]);
      const spec = KINDS[kind];
      obstacles.push({ kind, x, w: spec.w, h: spec.h,
                       solid: !!spec.solid, hazard: !!spec.hazard,
                       zone: spec.zone || null, duckUnder: !!spec.duckUnder,
                       stumbled: false, passed: false });
      // Corn trails in the clear ground after an obstacle.
      if (rng() < 0.55) {
        const n = 3 + Math.floor(rng() * 3);
        const arc = rng() < 0.5;
        for (let i = 0; i < n; i++)
          pickups.push({ kind: "corn", x: x + spec.w + 60 + i * 44,
                         lift: arc ? Math.sin((i / (n - 1)) * Math.PI) * 74 : 0,
                         taken: false });
      }
      if (rng() < 0.10)
        pickups.push({ kind: "pie", x: x + spec.w + 130, lift: 0, taken: false });
      // A hiding place a little further on, never inside an obstacle.
      if (rng() < 0.42)
        hidings.push({ kind: HIDING_KINDS[s] || "pantry",
                       x: x + spec.w + rngRange(rng, 200, 330), w: 96 });
      const tightness = 1 - s * 0.11;   // the kitchen crowds the turkey
      // A table needs extra room behind it: the turkey comes out low
      // and deserves a fair stride to stand up and jump what follows.
      const afterTable = kind === "table" ? 190 : 0;
      x += spec.w + rngRange(rng, 300, 560) * tightness + afterTable;
    }
  }

  obstacles.sort((a, b) => a.x - b.x);
  pickups.sort((a, b) => a.x - b.x);
  hidings.sort((a, b) => a.x - b.x);
  return { length: WORLD_LEN, gateX: GATE_X, obstacles, pickups, hidings };
}

// Is the turkey's centre inside a hiding place while it ducks?
export function hidingAt(world, centreX) {
  for (const h of world.hidings)
    if (centreX >= h.x && centreX <= h.x + h.w) return h;
  return null;
}
