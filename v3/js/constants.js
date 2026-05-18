export const CANVAS_SIZE = 600;

// Water strip: background-texture fills canvas, water-bg drawn on top from this Y down
export const WATER_Y_TOP = 80;

export const SHIP_X = 90;
export const SHIP_WIDTH = 60;   // hitbox
export const SHIP_HEIGHT = 45;  // hitbox
export const SHIP_SPEED = 5;

export const ITEM_WIDTH = 109;
export const ITEM_HEIGHT = 109;
export const ITEM_HITBOX_RATIO = 0.65; // collision box is 65% of visual size
export const ITEM_SPEED = 2.8;
export const ITEM_SPAWN_INTERVAL = 1800;

// Spawnable Y range — aligned to ship's reachable Y so player cannot park
// at an edge and dodge everything indefinitely.
export const ITEM_SPAWN_MIN_Y = 140;
export const ITEM_SPAWN_MAX_Y = 555;

// Minimum vertical gap between two recently-spawned items so the player
// always has a navigable lane.
export const ITEM_MIN_Y_SPACING = 80;
export const ITEM_SPACING_LOOKBACK_X = 250; // only check items still near right edge
export const ITEM_Y_PLACEMENT_RETRIES = 8;

export const CONSECUTIVE_TO_WIN = 3;

export const WATERLINE_Y = 300;

export const POPUP_DURATION = {
  outcome: 1300,
  corrective: 2800,
  constructive: 5000,
};

export const ITEM = Object.freeze({
  CHEST_RIBBON: 'chest-ribbon',
  CHEST_PLAIN:  'chest-plain',
  CHEST_GREEN:  'chest-green',
  BOMB_LIT:     'bomb-lit',
  BOMB_UNLIT:   'bomb-unlit',
});

export const PHASE = Object.freeze({
  START:        'START',
  LEVEL_SELECT: 'LEVEL_SELECT',
  PLAYING:      'PLAYING',
  FEEDBACK:     'FEEDBACK',
  TRANSITION:   'TRANSITION',
  END:          'END',
  TREASURE_WIN: 'TREASURE_WIN',
});

export const TRANSITION_STEP = Object.freeze({
  REVEAL: 'REVEAL',
  MOOD:   'MOOD',
});

// --- Smart spawn ---
export const MAX_INCORRECT_STREAK = 3;
export const SPAWN_HISTORY_LEN    = 5;
export const ADAPTIVE_BOOST       = 2.0;
export const ADAPTIVE_PENALTY     = 1.5;

// --- Avoidance nudge ---
export const NUDGE_DELAY_MS    = 15000;
export const NUDGE_TEXT        = 'אל תתחמקו מהפריטים! נסו לאסוף ותלמדו מטעויות';
export const NUDGE_POSITION    = Object.freeze({
  axisX:   'center',  // 'left' | 'center' | 'right'
  axisY:   'top',     // 'top'  | 'middle' | 'bottom'
  offsetX: 0,
  offsetY: 95,        // below the consecutive-counter strip
});
export const NUDGE_FONT_SIZE     = 16;

// --- Flood burst ---
// Staggered: items spawn over a short window, spread across Y.
export const FLOOD_DELAY_MS     = 30000;
export const FLOOD_ITEM_COUNT   = 7;
export const FLOOD_Y_JITTER     = 16;
export const FLOOD_X_STAGGER    = 90;  // px gap between sequential flood items on X axis
