// Every tuning number, colour and layout constant for Ember Court in one place.
// The table is a fixed 1280x720 logical area; the renderer scales it to the window,
// so no rule depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display rate. */
export const STEP = 1 / 60;

export const HERO = { maxHp: 30, startHand: 3, maxHand: 7, maxMana: 10, deckSize: 24 };

export const MANA = { start: 1, perTurn: 1 };

/** A turn in which a deck runs out costs 1 more fatigue than the last. */
export const FATIGUE = { first: 1 };

/** Suits and their cycle: each beats the next one round the ring. */
export const SUITS = ['ember', 'tide', 'thorn', 'gale'];
export const SUIT_BEATS = { ember: 'thorn', thorn: 'gale', gale: 'tide', tide: 'ember' };
export const SUIT_NAME = { ember: 'Ember', tide: 'Tide', thorn: 'Thorn', gale: 'Gale' };
export const SUIT_COLOR = { ember: '#e8632c', tide: '#2f9be8', thorn: '#4da34d', gale: '#c9a227' };
export const SUIT_GLYPH = { ember: 'E', tide: 'T', thorn: 'H', gale: 'G' };

/** Score: damage dealt, minions defeated, and the win bonus. */
export const SCORE = { perDamage: 10, perKill: 25, winBonus: 500 };

/** How many cards may stand on one side of the table. */
export const BOARD_MAX = 6;

/** Milliseconds the AI waits between its actions, so its turn is watchable. */
export const AI_PAUSE_MS = 550;

export const PALETTE = {
  backdrop: '#0e1a14',
  felt: '#173626',
  feltLight: '#1e4530',
  feltDark: '#10251b',
  gold: '#d9a441',
  goldLight: '#f2c94c',
  panel: '#101d16',
  panelLine: '#2c4a38',
  text: '#f2ead8',
  muted: '#9db3a4',
  danger: '#e5534b',
  mana: '#4fc3f7',
  player: '#f2c94c',
  enemy: '#e5534b',
  cardBack: '#7a2e2e',
  cardFace: '#f7f1de',
  cardInk: '#241d12',
  button: '#2c5a3c',
  buttonHover: '#3a7350',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'ember-court.best';

/** Card geometry. */
export const CARD = { w: 112, h: 152, gap: 10, boardW: 104, boardH: 136, backW: 58, backH: 80 };

/** Fixed layout slots, in logical pixels. */
export const LAYOUT = {
  headerH: 64,
  foeHandY: 78,
  foeBoardY: 166,
  middleY: 308,
  myBoardY: 368,
  myHandY: 512,
  endTurn: { x: 1072, y: 312, w: 176, h: 52 },
  mute: { x: 1216, y: 12, w: 48, h: 40 },
};
