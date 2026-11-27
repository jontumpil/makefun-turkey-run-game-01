// Pardon Run — a tiny seeded random generator. One job: give the world
// builder dice that roll the same way on every machine, so the course
// a player practises is the course the screenshots show.

export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngRange(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}

export function rngPick(rng, list) {
  return list[Math.floor(rng() * list.length) % list.length];
}
