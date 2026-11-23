// The card pool: every card Ember Court can deal, with its own name, suit, cost and
// rules text. Creatures stand on the table; spells resolve at once. Nothing here is
// borrowed from another game: names, suits and effects are the court's own.
export const CARDS = {
  // -- Ember creatures --
  ember_imp: { id: 'ember_imp', kind: 'creature', name: 'Ember Imp', suit: 'ember', cost: 1, atk: 2, hp: 1, text: 'A spark with teeth.' },
  ember_hound: { id: 'ember_hound', kind: 'creature', name: 'Ember Hound', suit: 'ember', cost: 2, atk: 3, hp: 2, text: 'It hunts in pairs of flame.' },
  ember_phoenix: { id: 'ember_phoenix', kind: 'creature', name: 'Ember Phoenix', suit: 'ember', cost: 4, atk: 5, hp: 4, text: 'It falls, and rises brighter.' },
  ember_dragon: { id: 'ember_dragon', kind: 'creature', name: 'Ember Dragon', suit: 'ember', cost: 6, atk: 7, hp: 6, text: 'The court bows to old fire.' },
  // -- Tide creatures --
  tide_sprite: { id: 'tide_sprite', kind: 'creature', name: 'Tide Sprite', suit: 'tide', cost: 1, atk: 1, hp: 2, text: 'Small, quick, everywhere at once.' },
  tide_serpent: { id: 'tide_serpent', kind: 'creature', name: 'Tide Serpent', suit: 'tide', cost: 3, atk: 3, hp: 4, text: 'It coils where the river bends.' },
  tide_leviathan: { id: 'tide_leviathan', kind: 'creature', name: 'Tide Leviathan', suit: 'tide', cost: 5, atk: 6, hp: 6, text: 'The deep answers when called.' },
  tide_kraken: { id: 'tide_kraken', kind: 'creature', name: 'Tide Kraken', suit: 'tide', cost: 7, atk: 8, hp: 8, text: 'Eight arms, one verdict.' },
  // -- Thorn creatures (guards must be attacked first) --
  thorn_sprout: { id: 'thorn_sprout', kind: 'creature', name: 'Thorn Sprout', suit: 'thorn', cost: 1, atk: 1, hp: 3, guard: true, text: 'Guard. It stands in the way.' },
  thorn_bramble: { id: 'thorn_bramble', kind: 'creature', name: 'Thorn Bramble', suit: 'thorn', cost: 3, atk: 2, hp: 5, guard: true, text: 'Guard. No one passes uncut.' },
  thorn_golem: { id: 'thorn_golem', kind: 'creature', name: 'Thorn Golem', suit: 'thorn', cost: 4, atk: 3, hp: 7, guard: true, text: 'Guard. Roots deeper than fear.' },
  thorn_ancient: { id: 'thorn_ancient', kind: 'creature', name: 'Thorn Ancient', suit: 'thorn', cost: 6, atk: 5, hp: 9, guard: true, text: 'Guard. Older than the court itself.' },
  // -- Gale creatures --
  gale_wisp: { id: 'gale_wisp', kind: 'creature', name: 'Gale Wisp', suit: 'gale', cost: 2, atk: 2, hp: 2, text: 'It is gone before you swing.' },
  gale_falcon: { id: 'gale_falcon', kind: 'creature', name: 'Gale Falcon', suit: 'gale', cost: 3, atk: 4, hp: 2, text: 'It strikes from above the clouds.' },
  gale_stormrider: { id: 'gale_stormrider', kind: 'creature', name: 'Gale Stormrider', suit: 'gale', cost: 4, atk: 5, hp: 3, text: 'It rides the weather itself.' },
  gale_tempest: { id: 'gale_tempest', kind: 'creature', name: 'Gale Tempest', suit: 'gale', cost: 5, atk: 6, hp: 4, text: 'The sky, given a temper.' },
  // -- Spells --
  ember_burst: { id: 'ember_burst', kind: 'spell', name: 'Ember Burst', suit: 'ember', cost: 2, text: 'Deal 3 damage to the weakest enemy creature, or the enemy hero.', damage: 3 },
  tide_mend: { id: 'tide_mend', kind: 'spell', name: 'Tide Mend', suit: 'tide', cost: 2, text: 'Restore 5 health to your hero.', heal: 5 },
  gale_insight: { id: 'gale_insight', kind: 'spell', name: 'Gale Insight', suit: 'gale', cost: 2, text: 'Draw 2 cards.', draw: 2 },
  ember_nova: { id: 'ember_nova', kind: 'spell', name: 'Ember Nova', suit: 'ember', cost: 4, text: 'Deal 2 damage to all enemy creatures.', damage: 2, allEnemies: true },
};

/** The deck every duellist shuffles: two copies of each of twelve cards. */
export const DECK_LIST = [
  'ember_imp', 'ember_imp', 'ember_hound', 'ember_hound', 'ember_phoenix', 'ember_dragon',
  'tide_sprite', 'tide_sprite', 'tide_serpent', 'tide_leviathan',
  'thorn_sprout', 'thorn_sprout', 'thorn_bramble', 'thorn_golem',
  'gale_wisp', 'gale_wisp', 'gale_falcon', 'gale_stormrider',
  'ember_burst', 'ember_burst', 'tide_mend', 'gale_insight', 'ember_nova', 'thorn_ancient',
];

export const AI_NAME = 'Sable, Tidecaller of the Far Court';
export const PLAYER_NAME = 'You, Ember Challenger';
