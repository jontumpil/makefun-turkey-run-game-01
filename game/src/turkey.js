// Pardon Run — the turkey. One job: the player's body and physics —
// running, jumping, ducking, dashing, stumbling over farm junk and
// burning a feather on the hot and sharp things. It reports what
// happened as events; scoring and sound live elsewhere.

import {
  TURKEY_W, TURKEY_H, TURKEY_DUCK_H, CRUISE_SPEED, FAST_SPEED, SLOW_SPEED,
  DASH_SPEED, DASH_TIME, DASH_COOLDOWN, GRAVITY, JUMP_VEL,
  START_FEATHERS, INVINCIBLE_TIME, GROUND_Y,
} from "./config.js";
import { hidingAt } from "./world.js";

export function createTurkey(startX) {
  return {
    x: startX, y: GROUND_Y, vy: 0, w: TURKEY_W, h: TURKEY_H,
    grounded: true, ducking: false, hidden: false, inMud: false,
    dashT: 0, dashCd: 0, invT: 0, stumbleT: 0,
    feathers: START_FEATHERS, runPhase: 0, speedNow: 0,
  };
}

const overlapsX = (t, o) => t.x + t.w / 2 > o.x && t.x - t.w / 2 < o.x + o.w;

export function updateTurkey(t, dt, input, world) {
  const events = [];
  const prevFeet = t.y;

  // Timers.
  t.dashT = Math.max(0, t.dashT - dt);
  t.dashCd = Math.max(0, t.dashCd - dt);
  t.invT = Math.max(0, t.invT - dt);
  t.stumbleT = Math.max(0, t.stumbleT - dt);

  // Ducking only counts on the ground. A turkey already underneath a
  // duck-under obstacle stays low until it is clear of it — standing
  // up mid-table must never teleport it back out the way it came in.
  t.ducking = input.duck() && t.grounded;
  t.under = false;
  if (!t.ducking && t.grounded)
    for (const o of world.obstacles)
      if (o.duckUnder && overlapsX(t, o)) { t.ducking = true; t.under = true; break; }
  t.h = t.ducking ? TURKEY_DUCK_H : TURKEY_H;

  // Dash.
  if (input.dash() && t.dashCd <= 0 && t.dashT <= 0 && t.stumbleT <= 0) {
    t.dashT = DASH_TIME; t.dashCd = DASH_COOLDOWN;
    events.push({ type: "dash" });
  }

  // Forward speed.
  let speed = input.right() ? FAST_SPEED : input.left() ? SLOW_SPEED : CRUISE_SPEED;
  if (t.ducking) speed = 175;   // a scurry, not a crawl: ducking under
                                // furniture must not hand the farmer a free grab
  if (t.stumbleT > 0) speed = Math.min(speed, 60);
  if (t.dashT > 0) speed = DASH_SPEED;
  if (t.inMud && t.grounded) speed *= 0.55;
  t.speedNow = speed;
  t.x += speed * dt;
  t.runPhase += (speed * dt) / 26;

  // Jump and gravity. A ducking turkey may still jump — it stands
  // into the leap — unless it is physically underneath furniture.
  if (input.jump() && t.grounded && !t.under) {
    t.vy = -JUMP_VEL; t.grounded = false; t.ducking = false; t.h = TURKEY_H;
    events.push({ type: "jump" });
  }
  if (!t.grounded || t.y < GROUND_Y) {
    t.vy += GRAVITY * dt;
    t.y += t.vy * dt;
  }

  // Ground and obstacle tops.
  let floor = GROUND_Y;
  for (const o of world.obstacles) {
    if (!o.solid || !overlapsX(t, o)) continue;
    if (o.duckUnder && t.ducking) continue;
    const top = GROUND_Y - o.h;
    if (t.y >= top && prevFeet <= top + 14 && t.vy >= 0) floor = Math.min(floor, top);
  }
  if (t.y >= floor) {
    t.y = floor; t.vy = 0; t.grounded = true;
  } else if (t.y < GROUND_Y - 2) {
    t.grounded = false;
  }

  // Side hits on solids: a stagger, once per obstacle. The turkey's
  // feet must already have been below the obstacle's top last frame —
  // a bird dropping off the top it just ran across is not "beside" it.
  if (t.grounded || t.y > GROUND_Y - 120) {
    for (const o of world.obstacles) {
      if (!o.solid || o.hazard || !overlapsX(t, o)) continue;
      if (o.duckUnder && t.ducking) continue;
      const top = GROUND_Y - o.h;
      if (t.y > top + 12 && prevFeet > top + 12) {
        t.x = o.x - t.w / 2 - 1;
        if (!o.stumbled) { o.stumbled = true; t.stumbleT = 0.45; events.push({ type: "stumble", ob: o }); }
      }
    }
  }

  // Mud and hiding.
  t.inMud = false;
  if (t.grounded && t.y === GROUND_Y)
    for (const o of world.obstacles)
      if (o.zone === "slow" && t.x > o.x && t.x < o.x + o.w) t.inMud = true;
  t.hidden = t.ducking && !!hidingAt(world, t.x);

  // Hazards. The hot and sharp things judge a fair graze kindly:
  // the turkey must dip well into the hazard's box, not brush its
  // edge, to burn a feather — a brush is a near miss, scored below.
  for (const o of world.obstacles) {
    if (!o.hazard) continue;
    const top = GROUND_Y - o.h;
    const grazesX = t.x + t.w / 2 - 6 > o.x && t.x - t.w / 2 + 6 < o.x + o.w;
    const hit = grazesX && t.y > top + 16 && t.y - t.h < GROUND_Y - 4;
    if (hit && t.invT <= 0) {
      t.invT = INVINCIBLE_TIME;
      t.vy = -430; t.grounded = false; t.x -= 26;
      events.push({ type: "hazard", ob: o });
    }
    if (!o.passed && t.x - t.w / 2 > o.x + o.w) {
      o.passed = true;
      if (!o.stumbled && Math.abs(t.y - (GROUND_Y - o.h)) < 130)
        events.push({ type: "nearmiss", ob: o });
    }
  }

  // Pickups.
  for (const p of world.pickups) {
    if (p.taken) continue;
    const py = GROUND_Y - 30 - p.lift;
    if (Math.abs(t.x - p.x) < 42 && t.y > py - 58 && t.y - t.h < py + 20) {
      p.taken = true;
      events.push({ type: "pickup", kind: p.kind, x: p.x, y: py });
    }
  }

  return events;
}
