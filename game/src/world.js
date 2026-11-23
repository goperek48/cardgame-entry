// The duel itself: decks, hands, mana, the table, combat, the rival's brain, and the
// autopilot that stages the screenshot scenes. No rendering here, no input: the world
// only knows cards, health and whose turn it is.
import { AI_NAME, CARDS, DECK_LIST, PLAYER_NAME } from './cards.js';
import {
  BOARD_MAX, FATIGUE, HERO, MANA, SCORE, SUIT_BEATS,
} from './config.js';
import { shuffle } from './random.js';

export const EVENT_NONE = 0;
export const EVENT_PLAY = 1;
export const EVENT_HIT = 2;
export const EVENT_OVER = 4;
export const EVENT_TURN = 8;
export const EVENT_DRAW = 16;

let nextUid = 1;

function makeSide(name, random) {
  return {
    name,
    hp: HERO.maxHp,
    maxHp: HERO.maxHp,
    mana: 0,
    maxMana: 0,
    deck: shuffle([...DECK_LIST], random),
    hand: [],
    board: [],
    fatigue: 0,
    drawn: 0,
  };
}

function makeCard(defId) {
  const def = CARDS[defId];
  return {
    uid: nextUid++,
    defId,
    kind: def.kind,
    name: def.name,
    suit: def.suit,
    cost: def.cost,
    atk: def.atk ?? 0,
    hp: def.hp ?? 0,
    maxHp: def.hp ?? 0,
    guard: def.guard ?? false,
    text: def.text,
    canAttack: false,
  };
}

export function createWorld(random) {
  const state = {
    turn: 0,
    phase: 'player',
    player: null,
    ai: null,
    over: null,
    score: 0,
    damageDealt: 0,
    kills: 0,
    log: [],
    selected: null,
    message: '',
  };

  function log(text) {
    state.log.unshift(text);
    if (state.log.length > 4) state.log.length = 4;
  }

  function other(sideKey) {
    return sideKey === 'player' ? 'ai' : 'player';
  }

  function drawCard(sideKey, count) {
    const side = state[sideKey];
    let events = EVENT_NONE;
    for (let i = 0; i < count; i += 1) {
      if (side.deck.length === 0) {
        side.fatigue += FATIGUE.first;
        side.hp -= side.fatigue;
        log(`${side.name} takes ${side.fatigue} fatigue damage.`);
        events |= EVENT_HIT;
        continue;
      }
      const defId = side.deck.pop();
      side.drawn += 1;
      if (side.hand.length >= HERO.maxHand) {
        log(`${side.name} burns ${CARDS[defId].name} (hand full).`);
        continue;
      }
      side.hand.push(makeCard(defId));
      events |= EVENT_DRAW;
    }
    return events;
  }

  function startTurn(sideKey) {
    const side = state[sideKey];
    if (sideKey === 'player') state.turn += 1;
    side.maxMana = Math.min(HERO.maxMana, MANA.start + (state.turn - 1) * MANA.perTurn);
    side.mana = side.maxMana;
    for (const m of side.board) m.canAttack = true;
    state.phase = sideKey;
    state.selected = null;
    state.message = sideKey === 'player' ? 'Your turn — play a card, then attack.' : `${side.name} is thinking…`;
    const events = drawCard(sideKey, 1);
    log(`${side.name} draws a card.`);
    // Fatigue can kill: an empty deck ends the duel here, not in a later step.
    return events | EVENT_TURN | checkOver();
  }

  function removeDead(sideKey) {
    const side = state[sideKey];
    const before = side.board.length;
    side.board = side.board.filter((m) => m.hp > 0);
    return before - side.board.length;
  }

  function checkOver() {
    if (state.ai.hp <= 0) {
      state.over = 'win';
      state.score += SCORE.winBonus;
      state.message = 'Victory! The court is yours.';
      log('You win the duel.');
      return EVENT_OVER;
    }
    if (state.player.hp <= 0) {
      state.over = 'lose';
      state.message = 'Defeat. The tide takes the court.';
      log('You lose the duel.');
      return EVENT_OVER;
    }
    return EVENT_NONE;
  }

  function dealDamageToMinion(sideKey, minion, amount) {
    minion.hp -= amount;
    if (sideKey === 'ai') state.damageDealt += amount;
  }

  function castSpell(sideKey, card) {
    const me = state[sideKey];
    const foe = state[other(sideKey)];
    const def = CARDS[card.defId];
    let events = EVENT_NONE;
    if (def.allEnemies) {
      for (const m of [...foe.board]) dealDamageToMinion(other(sideKey), m, def.damage);
      log(`${me.name} casts ${def.name}: ${def.damage} to all enemy creatures.`);
      const died = removeDead(other(sideKey));
      if (sideKey === 'player') {
        state.kills += died;
        state.score += died * SCORE.perKill + foe.board.length * 0;
      }
      events |= EVENT_HIT;
    } else if (def.damage) {
      let target = null;
      for (const m of foe.board) {
        if (target === null || m.hp < target.hp) target = m;
      }
      if (target) {
        dealDamageToMinion(other(sideKey), target, def.damage);
        log(`${me.name} casts ${def.name}: ${def.damage} to ${target.name}.`);
        const died = removeDead(other(sideKey));
        if (sideKey === 'player') {
          state.kills += died;
          state.score += died * SCORE.perKill + def.damage * SCORE.perDamage;
        }
      } else {
        foe.hp -= def.damage;
        if (sideKey === 'player') {
          state.damageDealt += def.damage;
          state.score += def.damage * SCORE.perDamage;
        }
        log(`${me.name} casts ${def.name}: ${def.damage} to ${foe.name}.`);
      }
      events |= EVENT_HIT;
    } else if (def.heal) {
      me.hp = Math.min(me.maxHp, me.hp + def.heal);
      log(`${me.name} casts ${def.name}: +${def.heal} health.`);
    } else if (def.draw) {
      events |= drawCard(sideKey, def.draw);
      log(`${me.name} casts ${def.name}: draws ${def.draw}.`);
    }
    return events;
  }

  function playCard(sideKey, handIndex) {
    if (state.over || state.phase !== sideKey) return EVENT_NONE;
    const me = state[sideKey];
    const card = me.hand[handIndex];
    if (!card || card.cost > me.mana) return EVENT_NONE;
    if (card.kind === 'creature' && me.board.length >= BOARD_MAX) {
      state.message = 'Your side of the table is full.';
      return EVENT_NONE;
    }
    me.mana -= card.cost;
    me.hand.splice(handIndex, 1);
    let events = EVENT_PLAY;
    if (card.kind === 'creature') {
      card.canAttack = false;
      me.board.push(card);
      log(`${me.name} plays ${card.name} (${card.atk}/${card.hp}).`);
    } else {
      events |= castSpell(sideKey, card);
    }
    if (sideKey === 'player') state.selected = null;
    return events | checkOver();
  }

  /** The rival's guards: while one stands, attacks may only hit a guard. */
  function guardOnBoard(sideKey) {
    return state[sideKey].board.some((m) => m.guard);
  }

  function attack(sideKey, attackerUid, targetUid) {
    if (state.over || state.phase !== sideKey) return EVENT_NONE;
    const me = state[sideKey];
    const foe = state[other(sideKey)];
    const attacker = me.board.find((m) => m.uid === attackerUid);
    if (!attacker || !attacker.canAttack) return EVENT_NONE;
    let events = EVENT_NONE;
    if (targetUid === 'hero') {
      if (guardOnBoard(other(sideKey))) return EVENT_NONE;
      let dmg = attacker.atk;
      foe.hp -= dmg;
      if (sideKey === 'player') {
        state.damageDealt += dmg;
        state.score += dmg * SCORE.perDamage;
      }
      attacker.canAttack = false;
      log(`${attacker.name} hits ${foe.name} for ${dmg}.`);
      events |= EVENT_HIT;
      return events | checkOver();
    }
    const target = foe.board.find((m) => m.uid === targetUid);
    if (!target) return EVENT_NONE;
    if (target.guard === false && guardOnBoard(other(sideKey))) return EVENT_NONE;
    let atkDmg = attacker.atk + (SUIT_BEATS[attacker.suit] === target.suit ? 1 : 0);
    let backDmg = target.atk + (SUIT_BEATS[target.suit] === attacker.suit ? 1 : 0);
    dealDamageToMinion(other(sideKey), target, atkDmg);
    dealDamageToMinion(sideKey, attacker, backDmg);
    attacker.canAttack = false;
    if (sideKey === 'player') state.score += atkDmg * SCORE.perDamage;
    const died = removeDead(other(sideKey));
    removeDead(sideKey);
    if (died > 0 && sideKey === 'player') {
      state.kills += died;
      state.score += died * SCORE.perKill;
    }
    log(`${attacker.name} strikes ${target.name} (${atkDmg} vs ${backDmg}).`);
    events |= EVENT_HIT;
    return events | checkOver();
  }

  function endTurn() {
    if (state.over) return EVENT_NONE;
    return startTurn(other(state.phase));
  }

  /**
   * One greedy plan for the side to move: play the dearest playable cards first,
   * spend removal on real threats, heal when hurt, then send every ready creature
   * at the best target — lethal first, a winning trade second, the hero last.
   * Returns actions the caller executes one at a time, or at once for a staged scene.
   */
  function planTurn(sideKey) {
    const me = state[sideKey];
    const foe = state[other(sideKey)];
    const actions = [];
    let mana = me.mana;
    const hand = [...me.hand];
    const playable = hand
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.cost <= mana)
      .sort((a, b) => b.c.cost - a.c.cost);
    for (const { c, i } of playable) {
      const def = CARDS[c.defId];
      if (c.kind === 'spell' && def.heal && me.hp >= me.maxHp - 2) continue;
      if (c.kind === 'spell' && def.draw && me.hand.length >= 6) continue;
      if (c.kind === 'creature' && me.board.length >= BOARD_MAX) continue;
      if (c.cost > mana) continue;
      mana -= c.cost;
      actions.push({ type: 'play', uid: c.uid });
    }
    // Attackers are named by uid; board order is stable while planning.
    for (const m of me.board.filter((x) => x.canAttack)) {
      const faceDmg = me.board.filter((x) => x.canAttack).reduce((s, x) => s + x.atk, 0);
      if (faceDmg >= foe.hp && !guardOnBoard(other(sideKey))) {
        actions.push({ type: 'attack', uid: m.uid, target: 'hero' });
        continue;
      }
      let best = null;
      for (const t of foe.board) {
        if (!t.guard && guardOnBoard(other(sideKey))) continue;
        const myDmg = m.atk + (SUIT_BEATS[m.suit] === t.suit ? 1 : 0);
        const back = t.atk + (SUIT_BEATS[t.suit] === m.suit ? 1 : 0);
        const kills = myDmg >= t.hp;
        const survives = back < m.hp;
        const score = (kills ? 100 : 0) + (survives ? 50 : 0) + (t.atk * 4 - back);
        if (best === null || score > best.score) best = { target: t.uid, score };
      }
      if (best && best.score >= 50) actions.push({ type: 'attack', uid: m.uid, target: best.target });
      // A guard in the way must be broken: any trade that hurts it beats passing,
      // or two full boards stare at each other forever.
      else if (best && guardOnBoard(other(sideKey)) && best.score >= 0) actions.push({ type: 'attack', uid: m.uid, target: best.target });
      else if (!guardOnBoard(other(sideKey))) actions.push({ type: 'attack', uid: m.uid, target: 'hero' });
    }
    actions.push({ type: 'end' });
    return actions;
  }

  function applyAction(sideKey, action) {
    if (action.type === 'play') {
      // The plan was made from a snapshot: find the card by uid, not by an
      // index that earlier plays have already shifted.
      const index = state[sideKey].hand.findIndex((c) => c.uid === action.uid);
      if (index === -1) return EVENT_NONE;
      return playCard(sideKey, index);
    }
    if (action.type === 'attack') return attack(sideKey, action.uid, action.target);
    if (action.type === 'end') return endTurn();
    return EVENT_NONE;
  }

  /**
   * Play both sides forward without pauses: `playerSkill` and `aiSkill` are
   * 'smart' (the greedy plan) or 'dumb' (pass at once). Used to stage the
   * screenshots; a smart side against a dumb one wins inside a dozen turns.
   * `stopAfterTurn` ends the staging at a mid-game table instead of a result.
   */
  function autoplay(playerSkill, aiSkill, maxTurns, stopAfterTurn = Infinity) {
    let guard = 0;
    while (!state.over && guard < maxTurns) {
      guard += 1;
      if (state.turn > stopAfterTurn && state.phase === 'player') break;
      const sideKey = state.phase;
      const skill = sideKey === 'player' ? playerSkill : aiSkill;
      if (skill === 'dumb') {
        endTurn();
        continue;
      }
      const actions = planTurn(sideKey);
      for (const action of actions) {
        if (state.over) break;
        // Re-plan attacks after each play: the board changed.
        if (action.type === 'attack') {
          const again = planTurn(sideKey).find((a) => a.type === 'attack' && a.uid === action.uid);
          if (!again) continue;
          applyAction(sideKey, again);
        } else {
          applyAction(sideKey, action);
        }
      }
    }
    return state.over;
  }

  function reset() {
    nextUid = 1;
    state.turn = 0;
    state.phase = 'player';
    state.over = null;
    state.score = 0;
    state.damageDealt = 0;
    state.kills = 0;
    state.log = [];
    state.selected = null;
    state.player = makeSide(PLAYER_NAME, random);
    state.ai = makeSide(AI_NAME, random);
    state.message = 'Welcome to the Ember Court.';
    drawCard('player', HERO.startHand);
    drawCard('ai', HERO.startHand);
    startTurn('player');
    log('The duel begins. Your move.');
  }

  reset();

  return {
    state,
    reset,
    playCard,
    attack,
    endTurn,
    planTurn,
    applyAction,
    autoplay,
    guardOnBoard,
  };
}
