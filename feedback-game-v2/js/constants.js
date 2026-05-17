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
  START:      'START',
  PLAYING:    'PLAYING',
  FEEDBACK:   'FEEDBACK',
  TRANSITION: 'TRANSITION',
  END:        'END',
});

export const TRANSITION_STEP = Object.freeze({
  REVEAL: 'REVEAL',
  MOOD:   'MOOD',
});
