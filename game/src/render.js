// Everything the eye sees: the felt table, the hands, the cards with their costs,
// suits and numbers, the health bars, the title and the win and loss screens.
// Canvas only; the game's own colours and shapes, nothing fetched.
import { CARD, FIELD, FONT, LAYOUT, PALETTE, SUIT_COLOR, SUIT_GLYPH, SUIT_NAME } from './config.js';
import {
  boardRects, endTurnRect, foeHandRects, handRects, heroRect, muteRect,
} from './geometry.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSE = 'lose';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 400} ${size}px ${FONT}`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function wrapText(ctx, str, maxWidth) {
  const words = str.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The suit's coloured disc with its letter, the mark every card carries. */
function suitDisc(ctx, suit, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = SUIT_COLOR[suit];
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.65)';
  ctx.stroke();
  text(ctx, SUIT_GLYPH[suit], x, y + 1, Math.round(r * 1.05), '#ffffff', 800, 'center');
}

/** A stat pip: a filled circle with a number in it. */
function pip(ctx, x, y, r, fill, value) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.stroke();
  text(ctx, String(value), x, y + 1, r + 4, '#ffffff', 800, 'center');
}

function drawCardFace(ctx, card, r, opts) {
  const { selected, playable, dim } = opts || {};
  ctx.save();
  if (dim) ctx.globalAlpha = 0.55;
  // Shadow and face.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, r.x + 3, r.y + 4, r.w, r.h, 10);
  ctx.fill();
  const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  grad.addColorStop(0, '#fbf6e6');
  grad.addColorStop(1, '#efe4c6');
  ctx.fillStyle = grad;
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.lineWidth = selected ? 4 : 2;
  ctx.strokeStyle = selected ? PALETTE.goldLight : playable ? PALETTE.gold : '#8a7a52';
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.stroke();
  if (playable && !selected) {
    ctx.save();
    ctx.shadowColor = PALETTE.goldLight;
    ctx.shadowBlur = 14;
    ctx.lineWidth = 2;
    ctx.strokeStyle = PALETTE.goldLight;
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.stroke();
    ctx.restore();
  }
  // Suit band.
  ctx.fillStyle = SUIT_COLOR[card.suit];
  ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, 22);
  text(ctx, SUIT_NAME[card.suit].toUpperCase(), r.x + r.w / 2, r.y + 14, 11, '#ffffff', 800, 'center');
  // Cost gem, top-left.
  pip(ctx, r.x + 16, r.y + 16, 13, '#2f6fb2', card.cost);
  // Name, one line, shrunk until it fits.
  ctx.fillStyle = PALETTE.cardInk;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let nameSize = 13;
  ctx.font = `800 ${nameSize}px ${FONT}`;
  while (nameSize > 10 && ctx.measureText(card.name).width > r.w - 12) {
    nameSize -= 1;
    ctx.font = `800 ${nameSize}px ${FONT}`;
  }
  ctx.fillText(card.name, r.x + r.w / 2, r.y + 38);
  // Suit disc in the middle.
  suitDisc(ctx, card.suit, r.x + r.w / 2, r.y + Math.round(r.h * 0.5), Math.min(22, Math.round(r.w * 0.19)));
  // Rules text, two lines, clear of the pips below.
  ctx.font = `400 ${r.w <= 106 ? 9 : 10}px ${FONT}`;
  ctx.fillStyle = '#4a3f2a';
  const lines = wrapText(ctx, card.text, r.w - 14);
  lines.slice(0, 2).forEach((line, i) => ctx.fillText(line, r.x + r.w / 2, r.y + r.h - 46 + i * 12));
  // Attack and health pips for creatures.
  if (card.kind === 'creature') {
    pip(ctx, r.x + 18, r.y + r.h - 16, 13, '#b23a2e', card.atk);
    pip(ctx, r.x + r.w - 18, r.y + r.h - 16, 13, '#2e7d46', card.hp);
    if (card.guard) {
      text(ctx, 'GUARD', r.x + r.w / 2, r.y + r.h - 16, 10, '#7a5a10', 800, 'center');
    }
  } else {
    text(ctx, 'SPELL', r.x + r.w / 2, r.y + r.h - 16, 10, '#7a5a10', 800, 'center');
  }
  ctx.restore();
}

function drawCardBack(ctx, r) {
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  roundRect(ctx, r.x + 2, r.y + 3, r.w, r.h, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.cardBack;
  roundRect(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.gold;
  roundRect(ctx, r.x + 4, r.y + 4, r.w - 8, r.h - 8, 6);
  ctx.stroke();
  suitDisc(ctx, 'tide', r.x + r.w / 2, r.y + r.h / 2, Math.min(16, r.w / 4));
}

function drawHeroPanel(ctx, side, foe) {
  const r = heroRect(foe);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = PALETTE.panelLine;
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.stroke();
  const manaLine = `MANA ${'◆'.repeat(side.mana)}${'◇'.repeat(Math.max(0, side.maxMana - side.mana))} ${side.mana}/${side.maxMana}`;
  if (foe) {
    // Compact strip: portrait, name, health bar, mana line.
    ctx.beginPath();
    ctx.arc(r.x + 30, r.y + 31, 17, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.enemy;
    ctx.fill();
    text(ctx, 'S', r.x + 30, r.y + 32, 17, '#ffffff', 800, 'center');
    text(ctx, side.name, r.x + 54, r.y + 16, 13, PALETTE.text, 700);
    const bar = { x: r.x + 54, y: r.y + 28, w: 180, h: 13 };
    ctx.fillStyle = '#3a1512';
    roundRect(ctx, bar.x, bar.y, bar.w, bar.h, 6);
    ctx.fill();
    const frac = Math.max(0, side.hp / side.maxHp);
    ctx.fillStyle = frac > 0.5 ? '#4da34d' : frac > 0.25 ? '#d9a441' : '#e5534b';
    if (frac > 0) {
      roundRect(ctx, bar.x, bar.y, Math.max(13, bar.w * frac), bar.h, 6);
      ctx.fill();
    }
    text(ctx, `${Math.max(0, side.hp)} / ${side.maxHp} HP`, bar.x + bar.w + 8, bar.y + 7, 12, PALETTE.text, 700);
    text(ctx, manaLine, r.x + 54, r.y + 52, 12, PALETTE.mana, 700);
    return;
  }
  // Tall card: portrait, name, health bar, mana line, deck and hand.
  ctx.beginPath();
  ctx.arc(r.x + 28, r.y + 30, 22, 0, Math.PI * 2);
  ctx.fillStyle = PALETTE.player;
  ctx.fill();
  text(ctx, 'Y', r.x + 28, r.y + 31, 20, '#ffffff', 800, 'center');
  text(ctx, side.name, r.x + 58, r.y + 22, 14, PALETTE.text, 700);
  const bar = { x: r.x + 58, y: r.y + 38, w: 170, h: 14 };
  ctx.fillStyle = '#3a1512';
  roundRect(ctx, bar.x, bar.y, bar.w, bar.h, 7);
  ctx.fill();
  const frac = Math.max(0, side.hp / side.maxHp);
  ctx.fillStyle = frac > 0.5 ? '#4da34d' : frac > 0.25 ? '#d9a441' : '#e5534b';
  if (frac > 0) {
    roundRect(ctx, bar.x, bar.y, Math.max(14, bar.w * frac), bar.h, 7);
    ctx.fill();
  }
  text(ctx, `${Math.max(0, side.hp)} / ${side.maxHp} HP`, bar.x + bar.w + 8, bar.y + 7, 12, PALETTE.text, 700);
  text(ctx, manaLine, r.x + 58, r.y + 72, 12, PALETTE.mana, 700);
  text(ctx, `Deck ${side.deck.length} · Hand ${side.hand.length}`, r.x + 58, r.y + 96, 12, PALETTE.muted, 400);
}

function drawTable(ctx, state) {
  // Felt table.
  const grad = ctx.createRadialGradient(640, 360, 60, 640, 360, 760);
  grad.addColorStop(0, PALETTE.feltLight);
  grad.addColorStop(1, PALETTE.feltDark);
  ctx.fillStyle = grad;
  roundRect(ctx, 8, 70, 1264, 642, 18);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = PALETTE.gold;
  ctx.globalAlpha = 0.5;
  roundRect(ctx, 8, 70, 1264, 642, 18);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawEndTurn(ctx, enabled) {
  const r = endTurnRect();
  ctx.fillStyle = enabled ? PALETTE.button : '#26332b';
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = enabled ? PALETTE.gold : '#3a4a40';
  roundRect(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.stroke();
  text(ctx, 'END TURN  [E]', r.x + r.w / 2, r.y + r.h / 2, 16, enabled ? '#ffffff' : '#7d8a80', 800, 'center');
}

function drawBoard(ctx, state) {
  const foeRects = boardRects(state.ai.board.length, true);
  state.ai.board.forEach((m, i) => {
    drawCardFace(ctx, m, foeRects[i], { dim: false });
    // A creature that cannot attack yet wears a small clock in its corner.
    if (!m.canAttack) text(ctx, '◷', foeRects[i].x + foeRects[i].w - 13, foeRects[i].y + 13, 12, '#ffffff', 800, 'center');
  });
  const myRects = boardRects(state.player.board.length, false);
  state.player.board.forEach((m, i) => {
    const selected = state.selected && state.selected.type === 'board' && state.selected.uid === m.uid;
    const ready = m.canAttack && state.phase === 'player' && !state.over;
    drawCardFace(ctx, m, myRects[i], { selected, playable: ready });
    if (!m.canAttack) text(ctx, '◷', myRects[i].x + myRects[i].w - 13, myRects[i].y + 13, 12, '#ffffff', 800, 'center');
  });
}

function drawHands(ctx, state) {
  foeHandRects(state.ai.hand.length).forEach((r) => drawCardBack(ctx, r));
  const selectedIndex = state.selected && state.selected.type === 'hand' ? state.selected.index : -1;
  handRects(state.player.hand, selectedIndex).forEach((r, i) => {
    const card = state.player.hand[i];
    const playable = state.phase === 'player' && !state.over && card.cost <= state.player.mana
      && (card.kind !== 'creature' || state.player.board.length < 6);
    drawCardFace(ctx, card, r, { selected: i === selectedIndex, playable, dim: !playable && state.phase === 'player' });
  });
}

function drawHud(ctx, state, best) {
  text(ctx, 'EMBER COURT', 640, 34, 20, PALETTE.goldLight, 800, 'center');
  text(ctx, `TURN ${state.turn}`, 640, 56, 12, PALETTE.muted, 700, 'center');
  text(ctx, `SCORE ${state.score}`, 1010, 24, 15, PALETTE.text, 800);
  text(ctx, `BEST ${best}`, 1010, 44, 12, PALETTE.muted, 700);
  const m = muteRect();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, m.x, m.y, m.w, m.h, 8);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelLine;
  ctx.stroke();
  text(ctx, '♪', m.x + m.w / 2, m.y + m.h / 2 + 1, 20, PALETTE.text, 700, 'center');
  // The log, in the middle strip between the two boards.
  ctx.font = `400 12px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  state.log.slice(0, 2).forEach((line, i) => {
    ctx.fillStyle = i === 0 ? PALETTE.text : PALETTE.muted;
    ctx.fillText(line, 40, 340 + i * 16);
  });
  text(ctx, state.message, 640, 322, 14, PALETTE.goldLight, 700, 'center');
}

function drawTitle(ctx, best) {
  // Decorative fanned cards behind the title.
  const defs = [
    { suit: 'ember', name: 'Ember Dragon', cost: 6, atk: 7, hp: 6, kind: 'creature', text: 'The court bows to old fire.' },
    { suit: 'tide', name: 'Tide Leviathan', cost: 5, atk: 6, hp: 6, kind: 'creature', text: 'The deep answers when called.' },
    { suit: 'thorn', name: 'Thorn Ancient', cost: 6, atk: 5, hp: 9, kind: 'creature', text: 'Guard. Older than the court itself.', guard: true },
    { suit: 'gale', name: 'Gale Tempest', cost: 5, atk: 6, hp: 4, kind: 'creature', text: 'The sky, given a temper.' },
  ];
  ctx.save();
  defs.forEach((card, i) => {
    ctx.save();
    ctx.translate(640 + (i - 1.5) * 150, 250);
    ctx.rotate((i - 1.5) * 0.12);
    drawCardFace(ctx, card, { x: -56, y: -76, w: 112, h: 152 }, {});
    ctx.restore();
  });
  ctx.restore();
  text(ctx, 'EMBER COURT', 640, 118, 64, PALETTE.goldLight, 800, 'center');
  text(ctx, 'A duel of four suits — outwit Sable, Tidecaller of the Far Court', 640, 160, 18, PALETTE.text, 400, 'center');
  // How to play.
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  roundRect(ctx, 340, 380, 600, 190, 12);
  ctx.fill();
  ctx.strokeStyle = PALETTE.panelLine;
  ctx.stroke();
  text(ctx, 'HOW TO PLAY', 640, 406, 15, PALETTE.goldLight, 800, 'center');
  const lines = [
    'Click a card in your hand to play it — creatures take the table, spells strike at once.',
    'Click one of your creatures, then an enemy creature or Sable, to attack.',
    'Keys: 1–7 play a card · E end turn · P pause · M mute · R restart.',
    'Suits: Ember beats Thorn, Thorn beats Gale, Gale beats Tide, Tide beats Ember (+1 attack).',
    'Guards must be attacked first. Reduce Sable to 0 health to win.',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 436 + i * 22, 13, PALETTE.text, 400, 'center'));
  text(ctx, `BEST SCORE  ${best}`, 640, 596, 15, PALETTE.muted, 700, 'center');
  const pulse = 0.65 + 0.35 * Math.sin(Date.now() / 350);
  ctx.globalAlpha = pulse;
  text(ctx, 'CLICK OR PRESS SPACE TO BEGIN', 640, 640, 20, '#ffffff', 800, 'center');
  ctx.globalAlpha = 1;
}

function drawEndScreen(ctx, state, best, won) {
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = won ? '#2c2410' : '#2c1210';
  roundRect(ctx, 390, 170, 500, 380, 16);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = won ? PALETTE.goldLight : PALETTE.danger;
  roundRect(ctx, 390, 170, 500, 380, 16);
  ctx.stroke();
  text(ctx, won ? 'VICTORY!' : 'DEFEAT', 640, 228, 56, won ? PALETTE.goldLight : PALETTE.danger, 800, 'center');
  text(ctx, won ? 'The court is yours. Sable bows and leaves.' : 'The tide takes the court. Sable keeps the crown.', 640, 272, 15, PALETTE.text, 400, 'center');
  const rows = [
    ['SCORE', String(state.score)],
    ['BEST', String(Math.max(best, state.score))],
    ['TURNS', String(state.turn)],
    ['DAMAGE DEALT', String(state.damageDealt)],
    ['MINIONS DEFEATED', String(state.kills)],
  ];
  rows.forEach(([label, value], i) => {
    const y = 322 + i * 34;
    text(ctx, label, 470, y, 15, PALETTE.muted, 700);
    text(ctx, value, 810, y, 15, PALETTE.text, 800, 'right');
  });
  text(ctx, 'CLICK OR PRESS R TO DUEL AGAIN', 640, 516, 17, '#ffffff', 800, 'center');
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = FIELD.width * dpr;
  canvas.height = FIELD.height * dpr;
  ctx.scale(dpr, dpr);

  function draw(state, screen, best, muted) {
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.backdrop;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    if (screen === SCREEN_TITLE) {
      drawTitle(ctx, best);
      return;
    }
    drawTable(ctx, state);
    drawHeroPanel(ctx, state.ai, true);
    drawHeroPanel(ctx, state.player, false);
    drawHands(ctx, state);
    drawBoard(ctx, state);
    drawHud(ctx, state, best);
    drawEndTurn(ctx, screen === SCREEN_PLAY && state.phase === 'player' && !state.over);
    if (muted) text(ctx, 'MUTED', 1216, 68, 11, PALETTE.muted, 700, 'center');
    if (screen === SCREEN_PAUSED) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      text(ctx, 'PAUSED', 640, 340, 48, PALETTE.text, 800, 'center');
      text(ctx, 'Press P or click to resume', 640, 392, 16, PALETTE.muted, 400, 'center');
    } else if (screen === SCREEN_WIN) {
      drawEndScreen(ctx, state, best, true);
    } else if (screen === SCREEN_LOSE) {
      drawEndScreen(ctx, state, best, false);
    }
  }

  return { draw };
}
