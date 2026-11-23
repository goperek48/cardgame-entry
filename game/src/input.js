// Keyboard and pointer input. One-shot presses (start, end turn, pause, restart)
// are queued as bit flags and taken once by the loop, so a press between two frames
// is never lost and never counted twice. Pointer clicks carry their position, so
// the loop can work out which card or button the player meant.
import { endTurnRect, muteRect } from './geometry.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_END_TURN = 4;
export const ACTION_RESTART = 8;
export const ACTION_MUTE = 16;

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const END_TURN = new Set(['KeyE']);
const RESTART = new Set(['KeyR']);
const MUTE = new Set(['KeyM']);
const HAND_KEYS = new Set(['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7']);

export function createInput(target) {
  let actions = 0;
  let handKey = -1;
  let click = null;

  window.addEventListener('keydown', (event) => {
    if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (END_TURN.has(event.code)) {
      if (!event.repeat) actions |= ACTION_END_TURN;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (HAND_KEYS.has(event.code)) {
      if (!event.repeat) handKey = Number(event.code.slice(5)) - 1;
    } else {
      return;
    }
    event.preventDefault();
  });

  target.addEventListener('pointerdown', (event) => {
    const rect = target.getBoundingClientRect();
    click = {
      x: (event.clientX - rect.left) * (target.width / rect.width),
      y: (event.clientY - rect.top) * (target.height / rect.height),
    };
  });

  return {
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The hand index (0-based) of a number key pressed since the last call, else -1. */
    takeHandKey() {
      const taken = handKey;
      handKey = -1;
      return taken;
    },
    /** The last pointer click in canvas pixels since the last call, else null. */
    takeClick() {
      const taken = click;
      click = null;
      return taken;
    },
    /** True when the click fell on the End Turn button. */
    isEndTurnClick(click) {
      return click !== null && pointIn(click, endTurnRect());
    },
    /** True when the click fell on the mute button. */
    isMuteClick(click) {
      return click !== null && pointIn(click, muteRect());
    },
  };
}

function pointIn(p, r) {
  return p.x >= r.x && p.x < r.x + r.w && p.y >= r.y && p.y < r.y + r.h;
}
