// Pardon Run — the game itself. One job: hold the state of a run and
// move it forward — the title screen, the chase, the knives the kitchen
// throws, the scoring, and the two endings. Physics belongs to the
// turkey, pursuit to the farmer, pictures to the renderer.

import {
  VIEW_W, WORLD_LEN, GATE_X, GROUND_Y, PX_PER_M, WORLD_SEED,
  SCORE_CORN, SCORE_PIE, SCORE_NEAR_MISS, SCORE_FEATHER_LEFT, stageAt, STAGES,
} from "./config.js";
import { createInput } from "./input.js";
import { createAudio } from "./audio.js";
import { buildWorld } from "./world.js";
import { createTurkey, updateTurkey } from "./turkey.js";
import { createFarmer, updateFarmer, stunFarmer } from "./farmer.js";
import { createRenderer } from "./render.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const input = createInput(canvas);
const audio = createAudio();
const renderer = createRenderer(ctx);

const START_X = 300;

let S;
function freshState() {
  const world = buildWorld(WORLD_SEED);
  return {
    mode: "title", time: 0, runTime: 0, camX: 0,
    world, turkey: createTurkey(START_X), farmer: createFarmer(START_X),
    knives: [], knifeTimer: 2.2, particles: [], popups: [],
    score: 0, corn: 0, distBanked: 0, stageIdx: 0, stageFlash: null,
    paused: false, muted: false, hurtFlash: 0, shake: 0,
    best: S ? S.best : 0, endStats: null, dustTimer: 0,
  };
}
S = freshState();

function popup(x, y, text, color) {
  S.popups.push({ x, y, text, color, life: 1.1, maxLife: 1.1 });
}

function burst(x, y, n, color, size, spread = 130, up = -160) {
  for (let i = 0; i < n; i++)
    S.particles.push({
      x: x + (Math.random() - 0.5) * 20, y,
      vx: (Math.random() - 0.5) * spread * 2, vy: up + Math.random() * 120,
      life: 0.5 + Math.random() * 0.5, maxLife: 1, color, size, grav: 620,
    });
}

function loseFeather(kind) {
  const t = S.turkey;
  t.feathers -= 1;
  S.hurtFlash = 1; S.shake = 0.8;
  burst(t.x, t.y - 40, 10, "#e8e2d2", 6);
  audio.hit();
  if (t.feathers <= 0) { caught(); return; }
  if (kind === "grab") {
    popup(t.x, t.y - 110, "WRENCHED FREE!", "#ffd34d");
    t.x += 250; t.vy = -320; t.grounded = false; t.invT = 1.6;
    stunFarmer(S.farmer, 2.2);
  } else {
    popup(t.x, t.y - 110, "OUCH!", "#ff7a5c");
  }
}

function start() {
  const best = S.best;
  S = freshState();
  S.best = best;
  S.mode = "play";
  S.stageFlash = { name: STAGES[0].name, t: 0 };
  audio.unlock(); audio.startMusic();
  audio.gobble();
}

function caught() {
  S.mode = "caught";
  audio.stopMusic(); audio.caught();
  S.endStats = { escaped: false, score: S.score, distM: S.turkey.x / PX_PER_M,
                 corn: S.corn, time: S.runTime, feathers: 0 };
  S.best = Math.max(S.best, S.score);
}

function escaped() {
  const t = S.turkey;
  S.score += t.feathers * SCORE_FEATHER_LEFT + Math.max(0, 3000 - Math.floor(S.runTime) * 10);
  S.mode = "escaped";
  audio.stopMusic(); audio.win();
  S.endStats = { escaped: true, score: S.score, distM: 1500,
                 corn: S.corn, time: S.runTime, feathers: t.feathers };
  S.best = Math.max(S.best, S.score);
  for (let i = 0; i < 46; i++)
    S.particles.push({ x: GATE_X + (Math.random() - 0.5) * 260, y: GROUND_Y - 200 + Math.random() * 120,
      vx: (Math.random() - 0.5) * 160, vy: -60 - Math.random() * 160,
      life: 1.2 + Math.random(), maxLife: 2.2,
      color: ["#e33", "#ffd34d", "#2e7a2e", "#f2c230"][i % 4], size: 7, grav: 190 });
}

function handleTurkeyEvents(events) {
  const t = S.turkey;
  for (const e of events) {
    if (e.type === "jump") audio.jump();
    else if (e.type === "dash") { audio.dash(); burst(t.x - 20, t.y - 16, 6, "#d8c49a", 5, 60, -40); }
    else if (e.type === "stumble") { audio.stumble(); burst(t.x, t.y - 6, 7, "#b3804d", 5); popup(t.x, t.y - 100, "STUMBLE!", "#ffb27a"); }
    else if (e.type === "hazard") loseFeather("hazard");
    else if (e.type === "nearmiss") { S.score += SCORE_NEAR_MISS; audio.nearMiss(); popup(t.x, t.y - 104, `CLOSE! +${SCORE_NEAR_MISS}`, "#aef2a0"); }
    else if (e.type === "pickup") {
      if (e.kind === "corn") { S.corn++; S.score += SCORE_CORN; audio.pickup(); popup(e.x, e.y - 30, `+${SCORE_CORN}`, "#f2c230"); }
      else { S.score += SCORE_PIE; audio.pie(); popup(e.x, e.y - 30, `PIE! +${SCORE_PIE}`, "#ffb27a"); }
    }
    if (S.mode !== "play") return;
  }
}

function updateKnives(dt) {
  const t = S.turkey;
  if (t.x > STAGES[2].from) {
    S.knifeTimer -= dt;
    if (S.knifeTimer <= 0) {
      S.knifeTimer = 2.3 + Math.random() * 0.9;
      const high = Math.random() < 0.5;
      S.knives.push({ x: S.camX + VIEW_W + 50, y: high ? GROUND_Y - 118 : GROUND_Y - 34,
                      vx: -478, spin: 0, high });
    }
  }
  for (const k of S.knives) {
    k.x += k.vx * dt; k.spin -= dt * 9;
    if (t.invT <= 0 && Math.abs(k.x - t.x) < 36 && k.y > t.y - t.h - 6 && k.y < t.y + 4) {
      k.x = -9999;
      loseFeather("knife");
      if (S.mode !== "play") return;
    }
  }
  S.knives = S.knives.filter((k) => k.x > S.camX - 80);
}

function update(dt) {
  S.time += dt;
  S.hurtFlash = Math.max(0, S.hurtFlash - dt * 2.4);
  S.shake = Math.max(0, S.shake - dt * 2.2);
  for (const p of S.particles) {
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.grav || 0) * dt;
  }
  S.particles = S.particles.filter((p) => p.life > 0);
  for (const p of S.popups) p.life -= dt;
  S.popups = S.popups.filter((p) => p.life > 0);
  if (S.stageFlash) { S.stageFlash.t += dt; if (S.stageFlash.t > 1.6) S.stageFlash = null; }

  if (S.mode !== "play" || S.paused) return;
  S.runTime += dt;

  const events = updateTurkey(S.turkey, dt, input, S.world);
  handleTurkeyEvents(events);
  if (S.mode !== "play") return;

  const fevents = updateFarmer(S.farmer, dt, S.turkey);
  for (const e of fevents) {
    if (e.type === "grab") { loseFeather("grab"); if (S.mode !== "play") return; }
    else if (e.type === "spotted") audio.spotted();
  }

  updateKnives(dt);
  if (S.mode !== "play") return;

  // Honest distance points tick in with the metres.
  const dm = Math.floor(S.turkey.x / PX_PER_M);
  if (dm > S.distBanked) { S.score += dm - S.distBanked; S.distBanked = dm; }
  const idx = STAGES.indexOf(stageAt(S.turkey.x));
  if (idx !== S.stageIdx) {
    S.stageIdx = idx;
    S.stageFlash = { name: STAGES[idx].name, t: 0 };
    audio.gobble();
  }

  // Dust at the heels of a running bird.
  S.dustTimer -= dt;
  if (S.turkey.grounded && S.dustTimer <= 0) {
    S.dustTimer = 0.07;
    S.particles.push({ x: S.turkey.x - 26, y: S.turkey.y - 3, vx: -40 - Math.random() * 40,
      vy: -26 - Math.random() * 30, life: 0.4, maxLife: 0.4, color: "#c49a5e", size: 5, grav: -60 });
  }

  S.camX = Math.max(0, Math.min(S.turkey.x - 420, WORLD_LEN - VIEW_W + 420));
  if (S.turkey.x >= GATE_X) escaped();
}

// --- Screen-level input -------------------------------------------------
const prev = new Set();
function edge(code) {
  const now = input.down(code);
  const was = prev.has(code);
  if (now) prev.add(code); else prev.delete(code);
  return now && !was;
}

function frameClicks() {
  const clicks = input.takeClicks();
  if (!clicks.length) return;
  audio.unlock();
  if (S.mode === "title") start();
  else if (S.mode === "caught" || S.mode === "escaped") start();
  else if (S.mode === "play" && S.turkey.grounded && !S.paused) {
    // A click is a hop for mouse players.
    S.turkey.vy = -880; S.turkey.grounded = false; audio.jump();
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  frameClicks();
  if (S.mode === "title" && edge("Enter")) start();
  else if ((S.mode === "caught" || S.mode === "escaped") && (edge("KeyR") || edge("Enter"))) start();
  if (S.mode === "play" && edge("KeyP")) S.paused = !S.paused;
  if (edge("KeyM")) { S.muted = audio.toggleMute(); }
  update(dt);
  renderer.draw(viewState());
  requestAnimationFrame(loop);
}

function viewState() {
  return {
    mode: S.mode, time: S.time, camX: S.camX, world: S.world,
    turkey: S.turkey, farmer: S.farmer, knives: S.knives,
    particles: S.particles, popups: S.popups,
    score: S.score, corn: S.corn,
    distM: S.turkey.x / PX_PER_M, progress: S.turkey.x / WORLD_LEN,
    farmerProgress: S.farmer.x / WORLD_LEN,
    stageName: stageAt(S.turkey.x).name, stageFlash: S.stageFlash,
    paused: S.paused, muted: S.muted, hurtFlash: S.hurtFlash, shake: S.shake,
    best: S.best, endStats: S.endStats,
  };
}

// --- Screenshot posing and a self-test, used by the maker ---------------
function poseScene(name) {
  S = freshState();
  if (name === "title") { S.mode = "title"; return; }
  S.mode = "play";
  if (name === "barnyard") {
    S.turkey.x = 2600; S.farmer.x = 2280;
    S.turkey.y = GROUND_Y - 128; S.turkey.grounded = false;
    S.score = 1240; S.corn = 9; S.runTime = 21;
  } else if (name === "kitchen") {
    S.turkey.x = 12400; S.farmer.x = 11990;
    S.turkey.ducking = true; S.turkey.h = 32;
    S.knives.push({ x: 12620, y: GROUND_Y - 118, vx: -478, spin: 2.2, high: true });
    S.score = 8620; S.corn = 31; S.runTime = 74;
    popup(12400, GROUND_Y - 130, "DUCK!", "#aef2a0");
  } else if (name === "escaped") {
    S.turkey.x = GATE_X + 40; S.farmer.x = GATE_X - 700;
    S.score = 12480; S.corn = 37; S.runTime = 96.4; S.turkey.feathers = 2;
    escaped();
  } else if (name === "caught") {
    S.turkey.x = 10420; S.farmer.x = 10380; S.turkey.feathers = 0;
    S.score = 6930; S.corn = 22; S.runTime = 71.2;
    caught();
  }
  S.camX = Math.max(0, Math.min(S.turkey.x - 420, WORLD_LEN - VIEW_W + 420));
}

function autotest() {
  // A scripted pilot: hold right, jump what is close, duck the high
  // knives, dash when the farmer breathes down the neck.
  const sim = freshState();
  sim.mode = "play";
  const fake = {
    right: () => true, left: () => false,
    jump: () => fake._j, duck: () => fake._d, dash: () => fake._s,
    _j: false, _d: false, _s: false,
  };
  const realS = S; S = sim;
  const losses = [];
  const dt = 1 / 60;
  let steps = 0;
  while (S.mode === "play" && steps < 60 * 300) {
    const t = S.turkey;
    fake._j = false; fake._d = false; fake._s = false;
    for (const o of S.world.obstacles) {
      const ahead = o.x - (t.x + t.w / 2);
      if (ahead > 0 && ahead < 155 && (o.solid || o.hazard) && t.grounded && !o.duckUnder) fake._j = true;
      if (o.duckUnder && ahead > -20 && ahead < 150) fake._d = true;
    }
    for (const k of S.knives) {
      const ahead = k.x - t.x;
      if (k.high && ahead > 30 && ahead < 330) fake._d = true;
      if (!k.high && ahead > 60 && ahead < 185 && t.grounded) fake._j = true;
    }
    if (t.x - S.farmer.x < 230) fake._s = true;
    const ev = updateTurkey(S.turkey, dt, fake, S.world);
    for (const e of ev) {
      if (e.type === "hazard") { losses.push(`hazard:${e.ob.kind}@${Math.floor(S.turkey.x / 10)}m`); S.turkey.feathers--; if (S.turkey.feathers <= 0) S.mode = "caught"; }
      else if (e.type === "pickup") { if (e.kind === "corn") { S.corn++; } }
    }
    if (S.mode === "play") {
      const fe = updateFarmer(S.farmer, dt, S.turkey);
      for (const e of fe) if (e.type === "grab") {
        losses.push(`grab@${Math.floor(S.turkey.x / 10)}m`);
        S.turkey.feathers--;
        if (S.turkey.feathers <= 0) S.mode = "caught";
        else { S.turkey.x += 250; S.turkey.invT = 1.6; stunFarmer(S.farmer, 2.2); }
      }
    }
    // Knives, simplified to match updateKnives' kitchen band.
    if (S.mode === "play" && S.turkey.x > STAGES[2].from) {
      S.knifeTimer -= dt;
      if (S.knifeTimer <= 0) {
        S.knifeTimer = 2.7;
        const high = (steps % 2 === 0);
        S.knives.push({ x: S.turkey.x + 700, y: high ? GROUND_Y - 118 : GROUND_Y - 34, vx: -478, spin: 0, high });
      }
      for (const k of S.knives) {
        k.x += k.vx * dt;
        if (S.turkey.invT <= 0 && Math.abs(k.x - S.turkey.x) < 36 && k.y > S.turkey.y - S.turkey.h - 6 && k.y < S.turkey.y + 4) {
          k.x = -9999; losses.push(`knife@${Math.floor(S.turkey.x / 10)}m`); S.turkey.feathers--;
          if (S.turkey.feathers <= 0) S.mode = "caught";
        }
      }
      S.knives = S.knives.filter((k) => k.x > S.turkey.x - 900);
    }
    if (S.mode === "play" && S.turkey.x >= GATE_X) S.mode = "escaped";
    steps++;
  }
  const verdict = `AUTOTEST mode=${S.mode} dist=${Math.floor(S.turkey.x / PX_PER_M)}m feathers=${S.turkey.feathers} corn=${S.corn} steps=${steps} losses=[${losses.join(", ")}]`;
  document.title = verdict;
  const div = document.createElement("div");
  div.textContent = verdict;
  div.style.cssText = "position:fixed;top:8px;left:8px;background:#000;color:#0f0;font:20px monospace;padding:8px;z-index:9";
  document.body.appendChild(div);
  S = realS;
}

const params = new URLSearchParams(location.search);
const hash = new URLSearchParams(location.hash.slice(1));
const shot = hash.get("shot") || params.get("shot");
if (params.get("autotest") === "1" || hash.get("autotest") === "1") {
  autotest();
} else if (shot) {
  poseScene(shot);
  renderer.draw(viewState());
} else {
  requestAnimationFrame(loop);
}
