// Where things sit on the 1280x720 table, as rectangles. Render and input share these
// helpers, so a click lands on exactly the card the eye sees.
import { CARD, FIELD, LAYOUT } from './config.js';

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function pointInRect(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}

/** A row of `count` cards, each `w` wide with `gap` between, centred on the table. */
export function rowRects(count, w, h, y, gap) {
  const total = count * w + Math.max(0, count - 1) * gap;
  const startX = (FIELD.width - total) / 2;
  const out = [];
  for (let i = 0; i < count; i += 1) out.push({ x: startX + i * (w + gap), y, w, h });
  return out;
}

/** The player's hand, fanned along the bottom, lifted a little when selected.
 * It lives right of the player's hero panel (which owns x 16..316). */
export function handRects(hand, selectedIndex) {
  const total = hand.length * CARD.w + Math.max(0, hand.length - 1) * CARD.gap;
  const startX = 330 + Math.max(0, (950 - total) / 2);
  return hand.map((_, i) => ({
    x: startX + i * (CARD.w + CARD.gap),
    y: i === selectedIndex ? LAYOUT.myHandY - 18 : LAYOUT.myHandY,
    w: CARD.w,
    h: CARD.h,
  }));
}

/** One side's board row. */
export function boardRects(count, foe) {
  return rowRects(count, CARD.boardW, CARD.boardH, foe ? LAYOUT.foeBoardY : LAYOUT.myBoardY, 12);
}

/** The foe's hand, shown as card backs. */
export function foeHandRects(count) {
  return rowRects(count, CARD.backW, CARD.backH, LAYOUT.foeHandY, 8);
}

/** The hero panel for one side: the rival's is a compact strip across the top,
 * the player's is a tall card at the bottom left, clear of the hand. */
export function heroRect(foe) {
  return foe ? { x: 16, y: 6, w: 400, h: 62 } : { x: 16, y: 536, w: 300, h: 128 };
}

export function endTurnRect() {
  return { ...LAYOUT.endTurn };
}

export function muteRect() {
  return { ...LAYOUT.mute };
}
