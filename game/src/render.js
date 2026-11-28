// Pardon Run — rendering. One job: everything the player sees, drawn
// with canvas shapes in a warm autumn palette — the three stages, the
// turkey, the farmer, the junk between them, the HUD, and the title
// and ending screens. No images: every picture is code.

import {
  VIEW_W, VIEW_H, GROUND_Y, PX_PER_M, GATE_X, STAGES, stageAt,
  TURKEY_DUCK_H, START_FEATHERS,
} from "./config.js";

const FONT = '"Trebuchet MS", "Segoe UI", sans-serif';

function hash(n) { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); }

export function createRenderer(ctx) {
  function skyAndBackdrop(camX, stageIdx, time) {
    const skies = [
      ["#ffd98e", "#ff9d5c"],   // barnyard dawn
      ["#ffe9b0", "#ffb877"],   // farmyard morning
      ["#a05a30", "#5f2d12"],   // kitchen lamplight
    ];
    const [top, bot] = skies[stageIdx];
    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, top); g.addColorStop(1, bot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, VIEW_W, GROUND_Y);

    if (stageIdx < 2) {
      // Sun, low and golden.
      ctx.fillStyle = "rgba(255,236,170,.9)";
      ctx.beginPath(); ctx.arc(1080 - camX * 0.02 % 300, 120, 46, 0, 7); ctx.fill();
      // Far hills.
      ctx.fillStyle = stageIdx === 0 ? "#d97b3f" : "#cf7434";
      ctx.beginPath(); ctx.moveTo(0, GROUND_Y);
      for (let sx = 0; sx <= VIEW_W; sx += 40) {
        const wx = camX * 0.15 + sx;
        ctx.lineTo(sx, GROUND_Y - 90 - Math.sin(wx * 0.004) * 34 - hash(Math.floor(wx / 300)) * 20);
      }
      ctx.lineTo(VIEW_W, GROUND_Y); ctx.fill();
      // Silhouettes: barns and a windmill, then a farmhouse and silo.
      ctx.fillStyle = "rgba(122,52,24,.55)";
      const base = Math.floor((camX * 0.35) / 700);
      for (let i = -1; i < 3; i++) {
        const bx = (base + i) * 700 - camX * 0.35 + hash(base + i) * 160;
        if (stageIdx === 0) {
          ctx.fillRect(bx, GROUND_Y - 190, 190, 110);
          ctx.beginPath(); ctx.moveTo(bx - 12, GROUND_Y - 190); ctx.lineTo(bx + 95, GROUND_Y - 252); ctx.lineTo(bx + 202, GROUND_Y - 190); ctx.fill();
          ctx.fillRect(bx + 260, GROUND_Y - 300, 10, 220);
          ctx.save(); ctx.translate(bx + 265, GROUND_Y - 305); ctx.rotate(time * 0.4);
          for (let b = 0; b < 4; b++) { ctx.rotate(Math.PI / 2); ctx.fillRect(0, -6, 64, 12); }
          ctx.restore();
        } else {
          ctx.fillRect(bx, GROUND_Y - 170, 240, 100);
          ctx.beginPath(); ctx.moveTo(bx - 10, GROUND_Y - 170); ctx.lineTo(bx + 120, GROUND_Y - 224); ctx.lineTo(bx + 250, GROUND_Y - 170); ctx.fill();
          ctx.fillRect(bx + 300, GROUND_Y - 260, 54, 190);
          ctx.beginPath(); ctx.arc(bx + 327, GROUND_Y - 260, 27, Math.PI, 0); ctx.fill();
        }
      }
    } else {
      // Kitchen wall: cabinets, a window, hanging pans.
      ctx.fillStyle = "rgba(40,16,4,.35)";
      const base = Math.floor((camX * 0.3) / 460);
      for (let i = -1; i < 4; i++) {
        const bx = (base + i) * 460 - camX * 0.3;
        ctx.fillRect(bx, 90, 300, 130);
        ctx.fillRect(bx + 138, 90, 6, 130);
        ctx.beginPath(); ctx.arc(bx + 70, 160, 6, 0, 7); ctx.arc(bx + 220, 160, 6, 0, 7); ctx.fill();
      }
      ctx.fillStyle = "rgba(255,220,150,.28)";
      ctx.fillRect(120, 60, 210, 250);
      ctx.strokeStyle = "rgba(60,26,8,.6)"; ctx.lineWidth = 8; ctx.strokeRect(120, 60, 210, 250);
      ctx.beginPath(); ctx.moveTo(225, 60); ctx.lineTo(225, 310); ctx.moveTo(120, 185); ctx.lineTo(330, 185); ctx.stroke();
      ctx.fillStyle = "rgba(30,12,2,.5)";
      for (let i = 0; i < 4; i++) {
        const px = 560 + i * 170 - (camX * 0.3 % 170);
        ctx.fillRect(px + 26, 96, 5, 44);
        ctx.beginPath(); ctx.arc(px + 28, 168, 26, 0, 7); ctx.fill();
      }
    }

    // Ground.
    ctx.fillStyle = stageIdx === 2 ? "#7a4a26" : "#9c6b3f";
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);
    ctx.fillStyle = stageIdx === 2 ? "#8f5a2e" : "#b3804d";
    ctx.fillRect(0, GROUND_Y, VIEW_W, 10);
    ctx.fillStyle = "rgba(0,0,0,.13)";
    const step = stageIdx === 2 ? 128 : 90;
    const off = -(camX % step);
    for (let sx = off; sx < VIEW_W; sx += step) ctx.fillRect(sx, GROUND_Y + 34, step * 0.5, 7);
    if (stageIdx === 2) for (let sx = off; sx < VIEW_W; sx += step) ctx.fillRect(sx, GROUND_Y + 96, step * 0.5, 7);
  }

  function drawGate(camX, time) {
    const gx = GATE_X - camX;
    if (gx < -260 || gx > VIEW_W + 260) return;
    const glow = 0.6 + Math.sin(time * 3) * 0.15;
    ctx.fillStyle = `rgba(255,214,90,${0.20 * glow})`;
    ctx.beginPath(); ctx.arc(gx + 60, GROUND_Y - 150, 190, 0, 7); ctx.fill();
    ctx.fillStyle = "#6e4520";
    ctx.fillRect(gx - 14, GROUND_Y - 300, 26, 300);
    ctx.fillRect(gx + 108, GROUND_Y - 300, 26, 300);
    ctx.fillStyle = "#8a5a28";
    ctx.fillRect(gx - 30, GROUND_Y - 322, 180, 30);
    // The pardon scroll.
    ctx.fillStyle = "#fdf3d0";
    ctx.fillRect(gx + 6, GROUND_Y - 292, 108, 74);
    ctx.fillStyle = "#b3402e";
    ctx.font = `bold 25px ${FONT}`; ctx.textAlign = "center";
    ctx.fillText("PARDON", gx + 60, GROUND_Y - 258);
    ctx.font = `bold 13px ${FONT}`; ctx.fillStyle = "#7a5a20";
    ctx.fillText("· official ·", gx + 60, GROUND_Y - 234);
    ctx.fillStyle = "#ffd34d";
    ctx.beginPath(); ctx.arc(gx + 60, GROUND_Y - 306, 10, 0, 7); ctx.fill();
  }

  function drawHiding(h, camX) {
    const x = h.x - camX; if (x < -160 || x > VIEW_W + 60) return;
    const top = GROUND_Y;
    ctx.save(); ctx.translate(x, top);
    if (h.kind === "haystack") {
      ctx.fillStyle = "#d9a441";
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(48, -128, 104, 0); ctx.fill();
      ctx.strokeStyle = "rgba(146,96,20,.6)"; ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(8 + i * 18, -6); ctx.quadraticCurveTo(48, -70 - i * 6, 88 - i * 4, -8); ctx.stroke(); }
    } else if (h.kind === "barrelrow") {
      for (let i = 0; i < 2; i++) {
        ctx.fillStyle = i ? "#9c6b34" : "#b3804d";
        ctx.fillRect(i * 50, -84, 48, 84);
        ctx.fillStyle = "rgba(70,40,10,.7)"; ctx.fillRect(i * 50, -58, 48, 6); ctx.fillRect(i * 50, -24, 48, 6);
      }
    } else if (h.kind === "curtain") {
      ctx.fillStyle = "#7a2e2e"; ctx.fillRect(-4, -150, 104, 150);
      ctx.fillStyle = "#8f3a3a";
      for (let i = 0; i < 4; i++) ctx.fillRect(4 + i * 26, -150, 12, 150);
      ctx.fillStyle = "#5f1f1f"; ctx.fillRect(-8, -158, 112, 10);
    } else { // pantry
      ctx.fillStyle = "#6e4520"; ctx.fillRect(-4, -168, 104, 168);
      ctx.fillStyle = "#835626"; ctx.fillRect(4, -158, 88, 66); ctx.fillRect(4, -82, 88, 66);
      ctx.fillStyle = "#ffd34d"; ctx.beginPath(); ctx.arc(84, -84, 5, 0, 7); ctx.fill();
    }
    ctx.restore();
  }

  function drawObstacle(o, camX, time) {
    const x = o.x - camX; if (x < -220 || x > VIEW_W + 60) return;
    const base = GROUND_Y, top = GROUND_Y - o.h;
    ctx.save(); ctx.translate(x, base);
    switch (o.kind) {
      case "hay":
        ctx.fillStyle = "#d9a441"; ctx.fillRect(0, -o.h, o.w, o.h);
        ctx.fillStyle = "#e8bc58"; ctx.fillRect(0, -o.h, o.w, 12);
        ctx.strokeStyle = "rgba(146,96,20,.55)"; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(6, -10); ctx.lineTo(o.w - 8, -o.h + 12); ctx.moveTo(6, -o.h + 12); ctx.lineTo(o.w - 8, -10); ctx.stroke();
        break;
      case "fence":
        ctx.fillStyle = "#a9743c";
        for (let i = 0; i < 3; i++) ctx.fillRect(6 + i * 38, -o.h, 12, o.h);
        ctx.fillRect(0, -o.h + 14, o.w, 10); ctx.fillRect(0, -o.h + 44, o.w, 10);
        break;
      case "barrel":
        ctx.fillStyle = "#a06a30"; ctx.fillRect(2, -o.h, o.w - 4, o.h);
        ctx.fillStyle = "rgba(70,40,10,.75)"; ctx.fillRect(0, -o.h + 12, o.w, 6); ctx.fillRect(0, -o.h + o.h - 18, o.w, 6);
        break;
      case "crate":
        ctx.fillStyle = "#b3804d"; ctx.fillRect(0, -o.h, o.w, o.h);
        ctx.strokeStyle = "rgba(90,55,16,.8)"; ctx.lineWidth = 4; ctx.strokeRect(2, -o.h + 2, o.w - 4, o.h - 4);
        ctx.beginPath(); ctx.moveTo(2, -o.h + 2); ctx.lineTo(o.w - 2, -2); ctx.moveTo(o.w - 2, -o.h + 2); ctx.lineTo(2, -2); ctx.stroke();
        break;
      case "pumpkins":
        for (const [px, r] of [[24, 24], [58, 28], [82, 20], [40, 18]]) {
          ctx.fillStyle = "#e07b24"; ctx.beginPath(); ctx.arc(px, -r + 6, r, 0, 7); ctx.fill();
          ctx.fillStyle = "#5f7a2a"; ctx.fillRect(px - 3, -r * 2 + 2, 6, 9);
        }
        break;
      case "cart":
        ctx.fillStyle = "#8a5a28"; ctx.fillRect(0, -o.h + 16, o.w, 14);
        for (let i = 0; i < 4; i++) ctx.fillRect(8 + i * 36, -o.h + 30, 8, 34);
        ctx.fillStyle = "#5f3c14";
        for (const wx of [26, o.w - 26]) { ctx.beginPath(); ctx.arc(wx, -12, 17, 0, 7); ctx.fill(); }
        ctx.fillStyle = "#d9a441"; ctx.beginPath(); ctx.arc(o.w / 2, -o.h + 8, 30, Math.PI, 0); ctx.fill();
        break;
      case "pots":
        ctx.fillStyle = "#7d7d88"; ctx.fillRect(6, -22, o.w - 12, 22);
        ctx.fillStyle = "#97979f"; ctx.fillRect(16, -42, o.w - 32, 22);
        ctx.fillStyle = "#b9b9c0"; ctx.fillRect(28, -o.h, o.w - 56, 20);
        break;
      case "table":
        ctx.fillStyle = "#7c4b21"; ctx.fillRect(0, -o.h, o.w, 12);
        ctx.fillRect(6, -o.h, 10, o.h); ctx.fillRect(o.w - 16, -o.h, 10, o.h);
        ctx.fillStyle = "#fdf3d0"; ctx.fillRect(10, -o.h - 8, o.w - 20, 9);
        ctx.fillStyle = "#c33"; ctx.beginPath(); ctx.arc(o.w / 2, -o.h - 14, 9, 0, 7); ctx.fill();
        break;
      case "oven": {
        ctx.fillStyle = "#3d3d44"; ctx.fillRect(0, -o.h, o.w, o.h);
        ctx.fillStyle = "#232328"; ctx.fillRect(10, -o.h + 26, o.w - 20, o.h - 40);
        const flick = 0.75 + Math.sin(time * 11 + o.x) * 0.25;
        ctx.fillStyle = `rgba(255,${120 + Math.floor(60 * flick)},30,${0.85 * flick})`;
        ctx.fillRect(16, -o.h + 34, o.w - 32, o.h - 56);
        ctx.fillStyle = "#ffd34d";
        ctx.beginPath(); ctx.moveTo(o.w / 2 - 12, -14); ctx.quadraticCurveTo(o.w / 2, -44 - 8 * flick, o.w / 2 + 12, -14); ctx.fill();
        ctx.fillStyle = "#c9c9d1"; ctx.fillRect(0, -o.h, o.w, 10);
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(22 + i * 30, -o.h + 5, 4, 0, 7); ctx.fill(); }
        break;
      }
      case "knifeblock":
        ctx.fillStyle = "#8a5a28"; ctx.fillRect(4, -34, o.w - 8, 34);
        ctx.fillStyle = "#5f3c14"; ctx.fillRect(0, -o.h + 22, o.w, 10);
        for (let i = 0; i < 3; i++) {
          const kx = 14 + i * 18;
          ctx.strokeStyle = "#d7d7de"; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(kx, -o.h + 24); ctx.lineTo(kx + 5, -o.h - 2); ctx.stroke();
          ctx.strokeStyle = "#333"; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.moveTo(kx + 5, -o.h - 2); ctx.lineTo(kx + 8, -o.h - 14); ctx.stroke();
        }
        break;
      case "mud":
        ctx.fillStyle = "rgba(84,50,20,.85)";
        ctx.beginPath(); ctx.ellipse(o.w / 2, -3, o.w / 2, 10, 0, 0, 7); ctx.fill();
        ctx.fillStyle = "rgba(140,95,45,.8)";
        ctx.beginPath(); ctx.ellipse(o.w / 3, -4, o.w / 5, 6, 0, 0, 7); ctx.fill();
        break;
    }
    ctx.restore();
    void top;
  }

  function drawPickup(p, camX, time) {
    if (p.taken) return;
    const x = p.x - camX; if (x < -40 || x > VIEW_W + 40) return;
    const y = GROUND_Y - 30 - p.lift + Math.sin(time * 3 + p.x) * 3;
    if (p.kind === "corn") {
      ctx.save(); ctx.translate(x, y); ctx.rotate(0.5);
      ctx.fillStyle = "#f2c230"; ctx.beginPath(); ctx.ellipse(0, 0, 8, 16, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = "rgba(160,110,10,.7)"; ctx.lineWidth = 1.5;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(-8, i * 6); ctx.lineTo(8, i * 6); ctx.stroke(); }
      ctx.fillStyle = "#5f7a2a"; ctx.beginPath(); ctx.moveTo(-4, -14); ctx.quadraticCurveTo(-16, -26, -6, -30); ctx.quadraticCurveTo(-2, -20, 2, -15); ctx.fill();
      ctx.restore();
    } else {
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = "#e8a04c"; ctx.beginPath(); ctx.moveTo(-18, 8); ctx.lineTo(16, -10); ctx.lineTo(18, 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#fdf3d0"; ctx.beginPath(); ctx.arc(4, -4, 6, 0, 7); ctx.fill();
      ctx.restore();
    }
  }

  function drawKnife(k, camX) {
    const x = k.x - camX; if (x < -60 || x > VIEW_W + 60) return;
    ctx.save(); ctx.translate(x, k.y); ctx.rotate(k.spin);
    ctx.fillStyle = "#d7d7de";
    ctx.beginPath(); ctx.moveTo(-26, 0); ctx.lineTo(10, -7); ctx.lineTo(16, 0); ctx.lineTo(10, 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#33302c"; ctx.fillRect(14, -4, 18, 8);
    ctx.restore();
  }

  function drawTurkey(t, camX, time) {
    if (t.invT > 0 && Math.floor(time * 14) % 2 === 0 && t.feathers < START_FEATHERS) { /* blink */ }
    else {
      const x = t.x - camX, feet = t.y;
      ctx.save(); ctx.translate(x, feet);
      const duck = t.ducking;
      const bodyY = duck ? -22 : -30;
      // Legs.
      ctx.strokeStyle = "#e07b24"; ctx.lineWidth = 4; ctx.lineCap = "round";
      if (!t.grounded) {
        ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(-14, 2); ctx.moveTo(8, -12); ctx.lineTo(14, 0); ctx.stroke();
      } else {
        const p = Math.sin(t.runPhase * Math.PI) * (duck ? 4 : 9);
        ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(-6 + p, 0); ctx.moveTo(8, -12); ctx.lineTo(8 - p, 0); ctx.stroke();
      }
      // Tail fan.
      ctx.fillStyle = "#6e4520";
      for (let i = 0; i < 5; i++) {
        const a = -0.5 + i * 0.25;
        ctx.save(); ctx.translate(-24, bodyY - 4); ctx.rotate(a - 0.5);
        ctx.beginPath(); ctx.ellipse(-13, 0, 15, 6.5, 0, 0, 7); ctx.fill();
        ctx.fillStyle = "#8a5a28"; ctx.restore();
      }
      // Body.
      ctx.fillStyle = "#8a5a33";
      ctx.beginPath(); ctx.ellipse(0, bodyY, 30, duck ? 17 : 21, 0, 0, 7); ctx.fill();
      ctx.fillStyle = "#a9743f";
      ctx.beginPath(); ctx.ellipse(4, bodyY + 4, 22, 13, 0, 0, 7); ctx.fill();
      // Wing.
      const flap = t.grounded ? Math.sin(t.runPhase * Math.PI) * 0.15 : Math.sin(time * 22) * 0.5 - 0.4;
      ctx.save(); ctx.translate(-2, bodyY - 2); ctx.rotate(flap);
      ctx.fillStyle = "#6e4520"; ctx.beginPath(); ctx.ellipse(0, 0, 17, 9, 0.3, 0, 7); ctx.fill();
      ctx.restore();
      // Neck and head.
      const headX = duck ? 30 : 24, headY = duck ? -34 : -52;
      ctx.strokeStyle = "#7a7d88"; ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(16, bodyY - 8); ctx.quadraticCurveTo(24, bodyY - 20, headX, headY + 6); ctx.stroke();
      ctx.fillStyle = "#8d9099"; ctx.beginPath(); ctx.arc(headX, headY, 11, 0, 7); ctx.fill();
      // Wattle and beak.
      ctx.fillStyle = "#c33"; ctx.beginPath(); ctx.ellipse(headX + 6, headY + 8, 4.5, 8, 0.3, 0, 7); ctx.fill();
      ctx.fillStyle = "#f2a81e"; ctx.beginPath(); ctx.moveTo(headX + 9, headY - 2); ctx.lineTo(headX + 22, headY + 1); ctx.lineTo(headX + 9, headY + 5); ctx.fill();
      // Eye (wide, worried) — closed when hidden.
      if (t.hidden) {
        ctx.strokeStyle = "#222"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(headX + 1, headY - 3); ctx.lineTo(headX + 8, headY - 3); ctx.stroke();
      } else {
        ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(headX + 4, headY - 3, 4.6, 0, 7); ctx.fill();
        ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(headX + 5.5, headY - 3, 2.4, 0, 7); ctx.fill();
      }
      ctx.restore();
    }
    // Dash cooldown pip.
    const x = t.x - camX;
    if (t.dashCd > 0) {
      ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(x - 22, t.y + 10, 44, 5);
      ctx.fillStyle = "#ffd34d"; ctx.fillRect(x - 22, t.y + 10, 44 * (1 - t.dashCd / 3), 5);
    }
  }

  function drawFarmer(f, camX, time, turkeyGap) {
    const x = f.x - camX; if (x < -120 || x > VIEW_W + 120) return;
    ctx.save(); ctx.translate(x, f.y);
    const running = f.speedNow > 10;
    const p = running ? Math.sin(f.runPhase * Math.PI) * 11 : 0;
    // Legs in overalls.
    ctx.strokeStyle = "#2e4a7a"; ctx.lineWidth = 9; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(-4, -44); ctx.lineTo(-4 + p, 0); ctx.moveTo(6, -44); ctx.lineTo(6 - p, 0); ctx.stroke();
    ctx.fillStyle = "#3a2a16"; ctx.fillRect(-14 + p, -4, 15, 6); ctx.fillRect(0 - p, -4, 15, 6);
    // Torso: shirt and overalls.
    ctx.fillStyle = "#2e4a7a"; ctx.fillRect(-15, -78, 32, 38);
    ctx.fillStyle = "#b3402e"; ctx.fillRect(-17, -96, 36, 22);
    // Arms.
    ctx.strokeStyle = "#b3402e"; ctx.lineWidth = 8;
    const armSwing = running ? -p : 0;
    ctx.beginPath(); ctx.moveTo(-14, -90); ctx.lineTo(-20, -64 + armSwing * 0.4); ctx.stroke();
    // Net arm reaches forward, higher as he closes in.
    const reach = turkeyGap < 260 ? -30 : -12;
    ctx.beginPath(); ctx.moveTo(16, -90); ctx.lineTo(34, -78 + reach * 0.2); ctx.stroke();
    ctx.strokeStyle = "#8a5a28"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(34, -78 + reach * 0.2); ctx.lineTo(58, -88 + reach); ctx.stroke();
    ctx.strokeStyle = "rgba(230,230,220,.85)"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(66, -92 + reach, 17, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(52, -104 + reach); ctx.lineTo(80, -80 + reach); ctx.moveTo(52, -80 + reach); ctx.lineTo(80, -104 + reach); ctx.stroke();
    // Head and hat.
    const look = f.state === "search" ? f.lookDir : 1;
    ctx.fillStyle = "#e8b088"; ctx.beginPath(); ctx.arc(2 + look * 2, -108, 12, 0, 7); ctx.fill();
    ctx.fillStyle = "#d9a441"; ctx.fillRect(-14 + look * 2, -118, 34, 6);
    ctx.fillRect(-6 + look * 2, -130, 18, 13);
    // Face.
    ctx.fillStyle = "#222";
    if (f.state === "stunned") {
      ctx.font = `bold 13px ${FONT}`; ctx.textAlign = "center";
      ctx.fillText("× ×", 2 + look * 2, -104);
    } else {
      ctx.beginPath(); ctx.arc(6 + look * 2, -109, 1.8, 0, 7); ctx.fill();
      ctx.strokeStyle = "#222"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(1 + look * 2, -115); ctx.lineTo(10 + look * 2, -113); ctx.stroke();
    }
    ctx.restore();
    // Mood marks.
    ctx.textAlign = "center";
    if (f.state === "search") {
      ctx.fillStyle = "#fff"; ctx.font = `bold 30px ${FONT}`;
      ctx.fillText("?", x + f.lookDir * 16, f.y - 148 + Math.sin(time * 4) * 3);
    } else if (f.state === "stunned") {
      ctx.fillStyle = "#ffd34d"; ctx.font = `bold 16px ${FONT}`;
      for (let i = 0; i < 3; i++) {
        const a = time * 3 + i * 2.1;
        ctx.fillText("✦", x + Math.cos(a) * 24, f.y - 138 + Math.sin(a) * 7);
      }
    } else if (turkeyGap < 380) {
      ctx.fillStyle = "#e33"; ctx.font = `bold 32px ${FONT}`;
      ctx.fillText("!", x, f.y - 146 + Math.sin(time * 9) * 3);
    }
  }

  function drawParticles(list, camX) {
    for (const p of list) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - camX - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawPopups(list, camX) {
    ctx.textAlign = "center";
    for (const p of list) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.font = `bold 21px ${FONT}`;
      ctx.fillText(p.text, p.x - camX, p.y - (1 - a) * 36);
    }
    ctx.globalAlpha = 1;
  }

  function featherIcon(x, y, alive) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.6);
    ctx.fillStyle = alive ? "#e8e2d2" : "rgba(120,110,95,.4)";
    ctx.beginPath(); ctx.ellipse(0, 0, 6, 15, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = alive ? "#b8ac8e" : "rgba(120,110,95,.4)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(0, 15); ctx.stroke();
    ctx.restore();
  }

  // The current quest step, in the turkey's own terms. It follows the
  // run: hiding beats everything, the gate beats the stage, and each
  // stage asks for its own kind of courage.
  function objectiveText(S) {
    const t = S.turkey;
    if (t.hidden) return "Stay hidden — let him lose your trail!";
    if (1500 - Math.floor(S.distM) <= 120) return "The Pardon Gate is right there — RUN!";
    const idx = STAGES.indexOf(stageAt(t.x));
    if (idx === 0) return "Escape the Barnyard — break for the Farmyard!";
    if (idx === 1) return "Cross the Farmyard — the Kitchen lies ahead!";
    return "Survive the Kitchen — duck the flying knives!";
  }

  // How the hunt stands, from the farmer's own state and the honest
  // gap between his net and the turkey's tail feathers, in metres.
  // heat runs 0 (no menace) to 1 (net practically on the tail).
  function farmerPhase(S) {
    const gapPx = Math.max(0, S.turkey.x - S.farmer.x);
    const gapM = Math.round(gapPx / PX_PER_M);
    if (S.farmer.state === "stunned") return { label: "STUNNED!", gapM, heat: 0, color: "#ffd34d" };
    if (S.farmer.state === "search") return { label: "SEARCHING — he lost you", gapM, heat: 0.25, color: "#aef2a0" };
    const heat = Math.max(0.06, Math.min(1, 1 - gapPx / 850));
    if (gapPx < 300) return { label: "ON YOUR TAIL!", gapM, heat, color: "#ff7a5c" };
    if (gapPx < 560) return { label: "CLOSING IN", gapM, heat, color: "#ffb27a" };
    return { label: "ON THE HUNT", gapM, heat, color: "#ffe1a8" };
  }

  function drawHUD(S) {
    ctx.fillStyle = "rgba(30,14,2,.55)"; ctx.fillRect(0, 0, VIEW_W, 64);
    ctx.fillStyle = "#fdf3d0"; ctx.font = `bold 25px ${FONT}`; ctx.textAlign = "left";
    ctx.fillText(`SCORE ${String(S.score).padStart(6, "0")}`, 22, 41);
    // Corn count.
    ctx.fillStyle = "#f2c230"; ctx.beginPath(); ctx.ellipse(268, 30, 7, 13, 0.4, 0, 7); ctx.fill();
    ctx.fillStyle = "#fdf3d0"; ctx.fillText(`× ${S.corn}`, 284, 41);
    // Progress: three stage segments, turkey ahead of farmer.
    const px = 400, pw = 520;
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = ["#c96a2e", "#b85c24", "#8f3a1a"][i];
      ctx.fillRect(px + (pw / 3) * i + 2, 22, pw / 3 - 4, 16);
    }
    ctx.fillStyle = "#fff";
    const tx = px + pw * S.progress;
    ctx.beginPath(); ctx.moveTo(tx, 16); ctx.lineTo(tx - 7, 6); ctx.lineTo(tx + 7, 6); ctx.fill();
    ctx.fillStyle = "#2e4a7a";
    const fx = px + pw * S.farmerProgress;
    ctx.fillRect(fx - 3, 40, 6, 12);
    ctx.fillStyle = "rgba(253,243,208,.85)"; ctx.font = `13px ${FONT}`; ctx.textAlign = "center";
    ctx.fillText(`${Math.floor(S.distM)} m of 1500 m — ${S.stageName}`, px + pw / 2, 60);
    // Feathers.
    for (let i = 0; i < START_FEATHERS; i++) featherIcon(1150 + i * 36, 30, i < S.turkey.feathers);
    ctx.fillStyle = "rgba(253,243,208,.7)"; ctx.font = `13px ${FONT}`; ctx.textAlign = "right";
    ctx.fillText(S.muted ? "MUTED (M)" : "M = mute · P = pause", 1258, 60);
    // Quest panels under the bar: the objective on the left, the
    // farmer's menace on the right — the two things a running turkey
    // needs to know at a glance.
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(30,14,2,.55)";
    ctx.beginPath(); ctx.roundRect(16, 76, 500, 52, 10); ctx.fill();
    ctx.strokeStyle = "rgba(242,194,48,.65)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(16, 76, 500, 52, 10); ctx.stroke();
    ctx.fillStyle = "#f2c230"; ctx.font = `bold 12px ${FONT}`;
    ctx.fillText("OBJECTIVE", 32, 96);
    ctx.fillStyle = "#fdf3d0"; ctx.font = `bold 17px ${FONT}`;
    ctx.fillText(objectiveText(S), 32, 119);
    const fp = farmerPhase(S);
    ctx.fillStyle = "rgba(30,14,2,.55)";
    ctx.beginPath(); ctx.roundRect(VIEW_W - 516, 76, 500, 52, 10); ctx.fill();
    ctx.strokeStyle = "rgba(242,194,48,.65)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(VIEW_W - 516, 76, 500, 52, 10); ctx.stroke();
    ctx.fillStyle = "#f2c230"; ctx.font = `bold 12px ${FONT}`;
    ctx.fillText("FARMER", VIEW_W - 500, 96);
    ctx.fillStyle = fp.color; ctx.font = `bold 17px ${FONT}`;
    ctx.fillText(`${fp.label}  ·  ${fp.gapM} m behind`, VIEW_W - 500, 119);
    // Menace meter: fills and warms as he closes in.
    ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(VIEW_W - 216, 88, 184, 12);
    ctx.fillStyle = fp.color; ctx.fillRect(VIEW_W - 216, 88, 184 * fp.heat, 12);
    // Stage banner.
    if (S.stageFlash) {
      const a = Math.min(1, S.stageFlash.t * 2, (1.6 - S.stageFlash.t) * 1.4);
      if (a > 0) {
        ctx.globalAlpha = Math.max(0, a);
        ctx.fillStyle = "#fdf3d0"; ctx.font = `bold 54px ${FONT}`; ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0,0,0,.5)"; ctx.shadowBlur = 12;
        ctx.fillText(S.stageFlash.name, VIEW_W / 2, 170);
        ctx.shadowBlur = 0; ctx.globalAlpha = 1;
      }
    }
    if (S.paused) {
      ctx.fillStyle = "rgba(20,8,0,.55)"; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.fillStyle = "#fdf3d0"; ctx.font = `bold 60px ${FONT}`; ctx.textAlign = "center";
      ctx.fillText("PAUSED", VIEW_W / 2, 400);
      ctx.font = `22px ${FONT}`; ctx.fillText("Press P to keep running", VIEW_W / 2, 446);
    }
  }

  function panel(w, h) {
    ctx.fillStyle = "rgba(24,10,0,.72)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = "#fdf3d0";
    const x = (VIEW_W - w) / 2, y = (VIEW_H - h) / 2;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.fill();
    ctx.strokeStyle = "#b3402e"; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 18); ctx.stroke();
    return { x, y };
  }

  function drawTitle(S) {
    skyAndBackdrop(0, 0, S.time);
    drawGate(900, S.time);
    // A posed turkey on a stack of hay bales, and the farmer lurking.
    drawObstacle({ kind: "hay", x: 292, w: 92, h: 54 }, 0, S.time);
    ctx.save(); ctx.translate(0, -54);
    drawObstacle({ kind: "hay", x: 292, w: 92, h: 54 }, 0, S.time);
    ctx.restore();
    const hero = { x: 338, y: GROUND_Y - 108, w: 62, h: 54, grounded: true, ducking: false,
                   hidden: false, invT: 0, feathers: 3, runPhase: 0, dashCd: 0, dashT: 0 };
    drawTurkey(hero, 0, S.time);
    const lurker = { x: 1150, y: GROUND_Y, state: "chase", speedNow: 0, runPhase: 0, lookDir: 1 };
    drawFarmer(lurker, 0, S.time, 300);
    ctx.fillStyle = "rgba(24,10,0,.30)"; ctx.fillRect(0, 60, VIEW_W, 250);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fdf3d0"; ctx.font = `bold 104px ${FONT}`;
    ctx.shadowColor = "rgba(120,40,0,.65)"; ctx.shadowBlur = 18;
    ctx.fillText("PARDON RUN", VIEW_W / 2, 185);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffe1a8"; ctx.font = `bold 27px ${FONT}`;
    ctx.fillText("Thanksgiving is coming. The farmer has a net, the oven is hot,", VIEW_W / 2, 238);
    ctx.fillText("and you are the main course — unless you reach the Pardon Gate.", VIEW_W / 2, 272);
    ctx.fillStyle = "rgba(253,243,208,.90)";
    ctx.beginPath(); ctx.roundRect(VIEW_W / 2 - 492, 528, 984, 118, 14); ctx.fill();
    ctx.font = `21px ${FONT}`; ctx.fillStyle = "#5f3c14";
    ctx.fillText("RUN  → or D · hold for speed      JUMP  Space / W      DUCK & HIDE  ↓ or S", VIEW_W / 2, 562);
    ctx.fillText("DASH  Shift      gobble corn, dodge ovens and flying knives,", VIEW_W / 2, 594);
    ctx.fillText("duck into haystacks and barrels to break the farmer's eye.", VIEW_W / 2, 626);
    ctx.fillStyle = "rgba(24,10,0,.48)"; ctx.fillRect(0, 656, VIEW_W, 52);
    if (Math.floor(S.time * 1.6) % 2 === 0) {
      ctx.fillStyle = "#ffe1a8"; ctx.font = `bold 30px ${FONT}`;
      ctx.fillText("CLICK OR PRESS ENTER TO RUN", VIEW_W / 2, 692);
    }
    if (S.best > 0) {
      ctx.fillStyle = "#7a5a20"; ctx.font = `bold 19px ${FONT}`;
      ctx.fillText(`Best escape so far: ${S.best} points`, VIEW_W / 2, 726);
    }
  }

  function drawEnd(S) {
    const st = S.endStats;
    const { x, y } = panel(640, 430);
    ctx.textAlign = "center";
    if (st.escaped) {
      ctx.fillStyle = "#2e7a2e"; ctx.font = `bold 58px ${FONT}`;
      ctx.fillText("ESCAPED!", VIEW_W / 2, y + 84);
      ctx.save();
      ctx.translate(VIEW_W / 2 + 196, y + 66); ctx.rotate(-0.22);
      ctx.strokeStyle = "#b3402e"; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(-92, -34, 184, 62, 8); ctx.stroke();
      ctx.fillStyle = "#b3402e"; ctx.font = `bold 33px ${FONT}`;
      ctx.fillText("PARDONED", 0, 10);
      ctx.restore();
      ctx.fillStyle = "#5f3c14"; ctx.font = `22px ${FONT}`;
      ctx.fillText("You burst through the Pardon Gate, feathers and all.", VIEW_W / 2, y + 138);
    } else {
      ctx.fillStyle = "#b3402e"; ctx.font = `bold 58px ${FONT}`;
      ctx.fillText("CAUGHT!", VIEW_W / 2, y + 84);
      ctx.fillStyle = "#5f3c14"; ctx.font = `22px ${FONT}`;
      ctx.fillText("The net comes down. See you at dinner, friend.", VIEW_W / 2, y + 138);
    }
    ctx.font = `bold 24px ${FONT}`; ctx.fillStyle = "#3a2408";
    ctx.fillText(`Final score  ${st.score}`, VIEW_W / 2, y + 200);
    ctx.font = `20px ${FONT}`; ctx.fillStyle = "#5f3c14";
    ctx.fillText(`Distance ${Math.floor(st.distM)} m · Corn gobbled ${st.corn} · Time ${st.time.toFixed(1)} s`, VIEW_W / 2, y + 240);
    ctx.fillText(st.escaped ? `Feathers kept ${st.feathers} — a tidy, un-plucked escape.` : `The gate stood ${Math.max(0, 1500 - Math.floor(st.distM))} m away. So close, so gravy.`, VIEW_W / 2, y + 274);
    if (Math.floor(S.time * 1.6) % 2 === 0) {
      ctx.fillStyle = "#b3402e"; ctx.font = `bold 26px ${FONT}`;
      ctx.fillText("CLICK OR PRESS R TO RUN AGAIN", VIEW_W / 2, y + 348);
    }
  }

  function draw(S) {
    if (S.mode === "title") { drawTitle(S); return; }
    const camX = S.camX;
    const stageIdx = STAGES.indexOf(stageAt(S.turkey.x));
    ctx.save();
    if (S.shake > 0) ctx.translate((Math.random() - 0.5) * S.shake * 14, (Math.random() - 0.5) * S.shake * 10);
    skyAndBackdrop(camX, stageIdx, S.time);
    drawGate(camX, S.time);
    for (const h of S.world.hidings) drawHiding(h, camX);
    for (const o of S.world.obstacles) drawObstacle(o, camX, S.time);
    for (const p of S.world.pickups) drawPickup(p, camX, S.time);
    drawFarmer(S.farmer, camX, S.time, S.turkey.x - S.farmer.x);
    drawTurkey(S.turkey, camX, S.time);
    for (const k of S.knives) drawKnife(k, camX);
    drawParticles(S.particles, camX);
    drawPopups(S.popups, camX);
    ctx.restore();
    if (S.hurtFlash > 0) {
      ctx.fillStyle = `rgba(200,30,10,${0.28 * S.hurtFlash})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    drawHUD(S);
    if (S.mode === "caught" || S.mode === "escaped") drawEnd(S);
  }

  return { draw };
}
