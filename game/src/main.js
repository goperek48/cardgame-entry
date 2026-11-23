// Boot and the one loop: input is read every frame, the world advances in fixed
// 1/60 s steps, the rival takes one planned action per beat of its turn, and the
// renderer paints what is there. The game moves between five screens: title, play,
// paused, win and loss.
//
// ?seed=N fixes the shuffle. ?shot=title|play|win|lose (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady
// for a screenshot. window.__ember exposes the live state for play-testing.
import { AI_PAUSE_MS, BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_HIT, EVENT_OVER, EVENT_PLAY } from './world.js';
import {
  ACTION_CONFIRM, ACTION_END_TURN, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput,
} from './input.js';
import {
  boardRects, endTurnRect, handRects, heroRect, muteRect, pointInRect,
} from './geometry.js';
import {
  createRenderer, SCREEN_LOSE, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN,
} from './render.js';
import { createSounds } from './sounds.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const sounds = createSounds();

// The live state, for play-testing from the console or a driver.
window.__ember = { world, get screen() { return screen; } };
let screen = SCREEN_TITLE;

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  screen = scene.screen;
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, false);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let aiQueue = [];
  let aiTimer = 0;

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    aiQueue = [];
    screen = SCREEN_PLAY;
    announce(`Playing. ${world.state.player.hp} health. Your turn.`);
  }

  function endGame(won) {
    screen = won ? SCREEN_WIN : SCREEN_LOSE;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    if (won) sounds.win();
    else sounds.lose();
    announce(won ? `Victory. Score ${world.state.score}.` : `Defeat. Score ${world.state.score}.`);
  }

  function planAiTurn() {
    aiQueue = world.planTurn('ai');
    aiTimer = AI_PAUSE_MS;
  }

  function stepAi(dt) {
    if (screen !== SCREEN_PLAY || world.state.phase !== 'ai' || world.state.over) return;
    if (aiQueue.length === 0) {
      planAiTurn();
      return;
    }
    aiTimer -= dt * 1000;
    if (aiTimer > 0) return;
    aiTimer = AI_PAUSE_MS;
    const action = aiQueue.shift();
    const events = world.applyAction('ai', action);
    if (events & EVENT_HIT) sounds.hit();
    if (events & EVENT_PLAY) sounds.play();
    if (events & EVENT_OVER) endGame(world.state.over === 'win');
    else if (world.state.phase === 'player') {
      sounds.turn();
      announce('Your turn.');
    }
  }

  /** Resolve a click on the table: cards, creatures, heroes, buttons. */
  function handleClick(click) {
    if (!click) return;
    sounds.unlock();
    if (pointInRect(click.x, click.y, muteRect())) {
      const muted = sounds.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
      return;
    }
    if (screen === SCREEN_TITLE || screen === SCREEN_WIN || screen === SCREEN_LOSE) {
      sounds.click();
      startGame();
      return;
    }
    if (screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
      return;
    }
    if (screen !== SCREEN_PLAY || world.state.over) return;
    if (pointInRect(click.x, click.y, endTurnRect())) {
      if (world.state.phase === 'player') {
        world.endTurn();
        sounds.turn();
        announce(`${world.state.ai.name} is thinking…`);
      }
      return;
    }
    if (world.state.phase !== 'player') return;
    const st = world.state;
    // A selected attacker picks its target: an enemy creature, or the rival hero.
    if (st.selected && st.selected.type === 'board') {
      const foeRects = boardRects(st.ai.board.length, true);
      for (let i = 0; i < foeRects.length; i += 1) {
        if (pointInRect(click.x, click.y, foeRects[i])) {
          const events = world.attack('player', st.selected.uid, st.ai.board[i].uid);
          if (events & EVENT_HIT) sounds.hit();
          if (events & EVENT_OVER) endGame(st.over === 'win');
          st.selected = null;
          return;
        }
      }
      if (pointInRect(click.x, click.y, heroRect(true))) {
        const events = world.attack('player', st.selected.uid, 'hero');
        if (events & EVENT_HIT) sounds.hit();
        if (events & EVENT_OVER) endGame(st.over === 'win');
        st.selected = null;
        return;
      }
      // Clicking elsewhere drops the selection.
      st.selected = null;
      return;
    }
    // Your hand: play the card, or take it back by clicking it again.
    const rects = handRects(st.player.hand, st.selected && st.selected.type === 'hand' ? st.selected.index : -1);
    for (let i = 0; i < rects.length; i += 1) {
      if (pointInRect(click.x, click.y, rects[i])) {
        const card = st.player.hand[i];
        if (card.cost > st.player.mana) {
          announce(`Not enough mana for ${card.name}.`);
          return;
        }
        const events = world.playCard('player', i);
        if (events & EVENT_PLAY) sounds.play();
        if (events & EVENT_HIT) sounds.hit();
        if (events & EVENT_OVER) endGame(st.over === 'win');
        return;
      }
    }
    // Your board: pick an attacker.
    const myRects = boardRects(st.player.board.length, false);
    for (let i = 0; i < myRects.length; i += 1) {
      if (pointInRect(click.x, click.y, myRects[i])) {
        const m = st.player.board[i];
        if (m.canAttack) {
          st.selected = { type: 'board', uid: m.uid };
          sounds.click();
          announce(`${m.name} selected — click an enemy to attack.`);
        } else {
          announce(`${m.name} cannot attack yet.`);
        }
        return;
      }
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = sounds.toggleMute();
      announce(muted ? 'Muted.' : 'Sound on.');
    }
    if (actions & ACTION_RESTART && (screen === SCREEN_WIN || screen === SCREEN_LOSE)) {
      startGame();
      return;
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_WIN || screen === SCREEN_LOSE)) {
      startGame();
      return;
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (screen !== SCREEN_PLAY || world.state.over) return;
    if ((actions & ACTION_END_TURN) && world.state.phase === 'player') {
      world.endTurn();
      sounds.turn();
      announce(`${world.state.ai.name} is thinking…`);
      return;
    }
    if ((actions & ACTION_CONFIRM) && world.state.phase === 'player') {
      world.endTurn();
      sounds.turn();
      announce(`${world.state.ai.name} is thinking…`);
      return;
    }
    // Number keys play a card straight from the hand.
    const handKey = input.takeHandKey();
    if (handKey >= 0 && world.state.phase === 'player') {
      const card = world.state.player.hand[handKey];
      if (card) {
        if (card.cost > world.state.player.mana) announce(`Not enough mana for ${card.name}.`);
        else {
          const events = world.playCard('player', handKey);
          if (events & EVENT_PLAY) sounds.play();
          if (events & EVENT_HIT) sounds.hit();
          if (events & EVENT_OVER) endGame(world.state.over === 'win');
        }
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.25);
    last = now;
    handleActions();
    handleClick(input.takeClick());
    if (screen === SCREEN_TITLE) {
      // The title idles on a fresh table behind the cards.
    } else if (screen === SCREEN_PLAY) {
      accumulator += dt;
      while (accumulator >= STEP) {
        stepAi(STEP);
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, sounds.isMuted());
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Ember Court. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
