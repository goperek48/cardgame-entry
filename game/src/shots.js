// The screenshot scenes behind ?shot=title|play|win|lose. Each one plays the real
// rules forward from a fresh world, steered by the same greedy plan the rival uses,
// so every frame is what a real game looks like and the same seed always gives the
// same frame. A smart side against a dumb one wins inside a dozen turns.
import { SCREEN_LOSE, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

/**
 * Set `world` to the named scene and return the screen to draw over it and the
 * best score to show. Unknown names stage the title.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'play') {
    // A mid-game table: both sides developed, health mostly intact.
    world.autoplay('smart', 'smart', 40, 6);
    return { screen: SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'win') {
    world.autoplay('smart', 'dumb', 80);
    return { screen: world.state.over === 'win' ? SCREEN_WIN : SCREEN_PLAY, best: world.state.score };
  }
  if (name === 'lose') {
    world.autoplay('dumb', 'smart', 80);
    return { screen: world.state.over === 'lose' ? SCREEN_LOSE : SCREEN_PLAY, best: world.state.score };
  }
  return { screen: SCREEN_TITLE, best: 0 };
}
