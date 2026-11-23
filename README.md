[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/goperek48/cardgame-entry/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/goperek48/cardgame-entry/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

# Ember Court — best-card-game-20261122-1826

A complete, original card duel that plays offline in a desktop browser from
static files. You face Sable, Tidecaller of the Far Court, across a green felt
table with a 24-card deck of your own: Ember, Tide, Thorn and Gale suits in a
four-way cycle (Ember beats Thorn, Thorn beats Gale, Gale beats Tide, Tide
beats Ember — +1 attack when your suit beats theirs).

- **Mana** grows one crystal a turn (up to 10); cards cost mana to play.
- **Creatures** take the table and attack on later turns; **spells** strike,
  heal, or draw at once. **Guards** must be attacked first.
- **Win** by reducing Sable to 0 health; **lose** the same way. Score counts
  damage dealt, minions defeated, and a win bonus; the best score is kept
  between visits.

## Play

- Mouse: click a card in your hand to play it; click one of your creatures,
  then an enemy creature or Sable, to attack; click END TURN.
- Keyboard: `1–7` play a card · `E` or `Space` end turn · `P` pause ·
  `M` mute · `R` restart after a win or a loss.
- Sounds are synthesised with WebAudio — no audio files, no network.

## Run it

```sh
node serve.ts        # game/ on http://localhost:8080
```

Screenshots are staged by the game itself (`?shot=title|play|win|lose&seed=7`,
see `shots.json`): each scene plays the real rules forward from a fresh world,
so every frame is a real game. `main.ts` hands the game in with the vendored
make.fun library (`vendor/makefun-game.ts`, kit copy, unchanged).

## Layout

- `game/index.html` — the page; `game/src/main.js` — boot and loop
- `game/src/world.js` — decks, turns, combat, the rival's greedy plan
- `game/src/render.js` — table, cards, health bars, title/win/loss screens
- `game/src/cards.js` — the card pool · `game/src/config.js` — tuning
- `game/src/input.js` — keyboard + pointer · `game/src/sounds.js` — WebAudio
- `game/src/geometry.js` — shared table layout · `game/src/shots.js` — scenes
- `game/src/random.js` — seeded shuffle

License: MIT (`LICENSE`).
