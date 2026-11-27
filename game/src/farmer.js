// Pardon Run — the farmer. One job: the pursuer's brain. He chases
// what he can see, rubber-bands so a clean run stays tense but fair,
// loses the trail when the turkey hides, searches, and grabs whatever
// comes within reach of his net.

import {
  FARMER_BASE, FARMER_MAX_EXTRA, GRAB_RANGE, START_GAP, GROUND_Y, stageAt,
} from "./config.js";

export function createFarmer(turkeyX) {
  return {
    x: turkeyX - START_GAP, y: GROUND_Y,
    state: "chase",          // chase | search | stunned
    unseenT: 0, searchT: 0, stunT: 0, lookDir: 1,
    speedNow: 0, runPhase: 0, sawTurkey: true,
  };
}

export function stunFarmer(f, seconds) {
  f.state = "stunned";
  f.stunT = seconds;
  f.speedNow = 0;
}

export function updateFarmer(f, dt, turkey) {
  const events = [];
  const gap = turkey.x - f.x;
  const canSee = !turkey.hidden;

  if (f.state === "stunned") {
    f.stunT -= dt;
    f.speedNow = 0;
    if (f.stunT <= 0) { f.state = "chase"; f.unseenT = 0; }
    return events;
  }

  if (!canSee) {
    f.unseenT += dt;
    if (f.unseenT > 1.1 && f.state !== "search") {
      f.state = "search"; f.searchT = 0;
      events.push({ type: "lost" });
    }
  } else {
    if (f.state === "search" || f.unseenT > 0.4) events.push({ type: "spotted" });
    f.unseenT = 0;
    f.state = "chase";
  }

  if (f.state === "search") {
    f.searchT += dt;
    if (f.searchT > 1.2) { f.searchT = 0; f.lookDir = -f.lookDir; }
    // Creep toward where the turkey vanished, then wait and peer about.
    f.speedNow = gap > 170 ? 58 : 0;
  } else {
    // Chase: base pace plus pressure that grows with the gap, plus a
    // little more in each later stage. A dashing turkey still gains,
    // and a ducking one costs the farmer too — he has to stoop and
    // shove past the same furniture the turkey slips under.
    const stageBonus = stageAt(turkey.x).from / 5000 * 14;
    const pressure = Math.max(0, Math.min(FARMER_MAX_EXTRA, (gap - 300) * 0.10));
    f.speedNow = FARMER_BASE + pressure + stageBonus;
    if (turkey.dashT > 0) f.speedNow = Math.min(f.speedNow, 300);
    if (turkey.ducking) f.speedNow *= 0.72;
  }

  f.x += f.speedNow * dt;
  f.runPhase += (f.speedNow * dt) / 30;

  // The grab.
  if (f.state === "chase" && gap < GRAB_RANGE + 26 && turkey.invT <= 0 && !turkey.hidden)
    events.push({ type: "grab" });

  return events;
}
