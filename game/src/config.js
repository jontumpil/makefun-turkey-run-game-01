// Pardon Run — shared tuning constants. One job: every number the other
// files agree on lives here, so the game can be balanced from one place.

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const GROUND_Y = 648;            // top edge of the ground strip
export const PX_PER_M = 10;             // world scale: 10 px = 1 metre
export const WORLD_LEN = 15000;         // the run is 1,500 m long
export const GATE_X = 14820;            // the Pardon Gate stands here

// The three stages of the escape, by world x.
export const STAGES = [
  { name: "THE BARNYARD", from: 0,     to: 5000  },
  { name: "THE FARMYARD", from: 5000,  to: 10000 },
  { name: "THE KITCHEN",  from: 10000, to: 15000 },
];

export function stageAt(x) {
  for (const s of STAGES) if (x >= s.from && x < s.to) return s;
  return STAGES[STAGES.length - 1];
}

// Turkey movement.
export const TURKEY_W = 62;
export const TURKEY_H = 54;
export const TURKEY_DUCK_H = 32;
export const CRUISE_SPEED = 238;        // px/s, no keys held
export const FAST_SPEED = 338;          // px/s, holding right
export const SLOW_SPEED = 120;          // px/s, holding left
export const DASH_SPEED = 545;          // px/s during a dash
export const DASH_TIME = 0.7;           // seconds a dash lasts
export const DASH_COOLDOWN = 3.0;       // seconds before the next dash
export const GRAVITY = 1850;            // px/s^2
export const JUMP_VEL = 880;            // px/s upward — a full-speed leap
                                        // clears every hazard with room
export const START_FEATHERS = 3;
export const INVINCIBLE_TIME = 1.6;     // seconds of grace after a hit

// Farmer movement.
export const FARMER_W = 52;
export const FARMER_H = 98;
export const FARMER_BASE = 196;         // px/s before catch-up pressure
export const FARMER_MAX_EXTRA = 96;     // most the rubber band may add
export const GRAB_RANGE = 30;           // px between the two to be grabbed
export const START_GAP = 430;           // px the farmer starts behind

// Scoring.
export const SCORE_CORN = 50;
export const SCORE_PIE = 250;
export const SCORE_NEAR_MISS = 25;
export const SCORE_FEATHER_LEFT = 500;  // per feather kept on an escape
export const WORLD_SEED = 20261127;     // the layout is the same every run
