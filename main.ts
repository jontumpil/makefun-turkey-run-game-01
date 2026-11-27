// A working turkey-run-game-01 entry (Node 22, standard library only): the game is this directory's
// game/ folder, plain static files a desktop browser loads offline (game/index.html and its ES
// modules, no library and no network request), and the program hands it in. It copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library. A starting point, not a winner: Turkey Dodge, a
// plain 2D canvas game where a turkey dodges the carving knives falling at it and catches corn, with a
// title screen, score, lives and levels, game over and restart, flat colours and no sound. Build your
// own turkey escape game (any genre: a runner, stealth, an arcade game; any library you vendor under
// game/, or none), put your 3 or 4 PNG or JPEG screenshots
// in screenshots/ (the first by name is the cover) and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

// --- Build receipt (Pardon Run) ---------------------------------------
// A line of proof for whoever runs this entry by hand: once the kit's
// work above has had a moment to finish, walk the output directory and
// report what the entry actually produced — the dossier, the game and
// the screenshots — with a total size. It only ever reads and prints;
// wrapped so a surprise in the environment can never fail the build.
import { readdirSync, statSync } from "node:fs";
import { join as joinPath } from "node:path";

function pardonRunReceipt() {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  const found = [];
  const walk = (dir, prefix) => {
    for (const name of readdirSync(dir)) {
      const full = joinPath(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) walk(full, prefix + name + "/");
      else found.push(prefix + name + " (" + st.size + " B)");
    }
  };
  walk(outDir, "");
  const total = found.reduce((sum, line) => sum + Number(line.match(/\((\d+) B\)/)[1]), 0);
  console.log("pardon-run receipt: " + found.length + " files, " + total + " bytes total");
  for (const line of found) console.log("  " + line);
}

setTimeout(() => { try { pardonRunReceipt(); } catch { /* a receipt never fails a build */ } }, 250);
