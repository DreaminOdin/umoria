// data.js -- game tables: races, classes, monsters, items, stores, spells
var DATA = (function () {

  var RACES = [
    { name: 'Human',      mods: { str: 0, int: 0, wis: 0, dex: 0, con: 0, chr: 0 },     hd: 10 },
    { name: 'Half-Elf',   mods: { str: -1, int: 1, wis: 0, dex: 1, con: -1, chr: 1 },   hd: 9 },
    { name: 'Elf',        mods: { str: -1, int: 2, wis: 1, dex: 1, con: -2, chr: 1 },   hd: 8 },
    { name: 'Halfling',   mods: { str: -2, int: 2, wis: 1, dex: 3, con: 1, chr: 1 },    hd: 7 },
    { name: 'Gnome',      mods: { str: -1, int: 2, wis: 0, dex: 2, con: 1, chr: -2 },   hd: 8 },
    { name: 'Dwarf',      mods: { str: 2, int: -3, wis: 1, dex: -2, con: 2, chr: -3 },  hd: 9 },
    { name: 'Half-Orc',   mods: { str: 2, int: -1, wis: 0, dex: 0, con: 1, chr: -4 },   hd: 10 },
    { name: 'Half-Troll', mods: { str: 4, int: -4, wis: -2, dex: -4, con: 3, chr: -6 }, hd: 12 }
  ];

  var CLASSES = [
    { name: 'Warrior', hd: 9, atk: 1.0,  spell: null },
    { name: 'Mage',    hd: 1, atk: 0.55, spell: 'int' },
    { name: 'Priest',  hd: 3, atk: 0.7,  spell: 'wis' },
    { name: 'Rogue',   hd: 6, atk: 0.85, spell: null }
  ];

  // flags: stationary, poison, paralyze, drain, drainstr, steal, caster, breath, boss
  var MONSTERS = [
    { name: 'Giant Rat',          ch: 'r', lvl: 1,  hp: '2d3',    ac: 3,  dmg: '1d3',  exp: 2,    verb: 'bites',   flags: [] },
    { name: 'Fruit Bat',          ch: 'b', lvl: 1,  hp: '1d4',    ac: 4,  dmg: '1d2',  exp: 1,    verb: 'bites',   flags: [] },
    { name: 'Kobold',             ch: 'k', lvl: 1,  hp: '2d4',    ac: 5,  dmg: '1d4',  exp: 3,    verb: 'hits',    flags: [] },
    { name: 'Grey Mold',          ch: 'm', lvl: 1,  hp: '4d4',    ac: 1,  dmg: '1d3',  exp: 3,    verb: 'touches', flags: ['stationary'] },
    { name: 'Giant White Ant',    ch: 'a', lvl: 2,  hp: '2d4',    ac: 6,  dmg: '1d4',  exp: 4,    verb: 'bites',   flags: [] },
    { name: 'Skeleton Kobold',    ch: 's', lvl: 2,  hp: '2d5',    ac: 7,  dmg: '1d4',  exp: 5,    verb: 'hits',    flags: [] },
    { name: 'Cave Spider',        ch: 'S', lvl: 2,  hp: '1d6',    ac: 6,  dmg: '1d3',  exp: 5,    verb: 'bites',   flags: ['poison'] },
    { name: 'Floating Eye',       ch: 'e', lvl: 3,  hp: '3d4',    ac: 4,  dmg: '1d2',  exp: 7,    verb: 'gazes at', flags: ['stationary', 'paralyze'] },
    { name: 'Wild Dog',           ch: 'C', lvl: 3,  hp: '2d6',    ac: 6,  dmg: '1d5',  exp: 6,    verb: 'bites',   flags: [] },
    { name: 'Yellow Jelly',       ch: 'j', lvl: 4,  hp: '8d4',    ac: 1,  dmg: '1d4',  exp: 12,   verb: 'touches', flags: ['stationary', 'poison'] },
    { name: 'Orc',                ch: 'o', lvl: 4,  hp: '2d8',    ac: 8,  dmg: '1d8',  exp: 10,   verb: 'hits',    flags: [] },
    { name: 'Zombie',             ch: 'z', lvl: 5,  hp: '4d6',    ac: 6,  dmg: '1d6',  exp: 12,   verb: 'claws',   flags: [] },
    { name: 'Kobold Shaman',      ch: 'k', lvl: 5,  hp: '3d6',    ac: 6,  dmg: '1d4',  exp: 15,   verb: 'hits',    flags: ['caster'], rdmg: '2d5' },
    { name: 'Hobgoblin',          ch: 'H', lvl: 6,  hp: '3d8',    ac: 9,  dmg: '1d8',  exp: 18,   verb: 'hits',    flags: [] },
    { name: 'Apprentice Mage',    ch: 'p', lvl: 7,  hp: '3d8',    ac: 8,  dmg: '1d4',  exp: 25,   verb: 'hits',    flags: ['caster'], rdmg: '2d6' },
    { name: 'Bandit',             ch: 'p', lvl: 8,  hp: '4d8',    ac: 10, dmg: '1d6',  exp: 25,   verb: 'touches', flags: ['steal'] },
    { name: 'Orc Chieftain',      ch: 'o', lvl: 8,  hp: '5d8',    ac: 12, dmg: '2d6',  exp: 30,   verb: 'hits',    flags: [] },
    { name: 'Giant Spider',       ch: 'S', lvl: 9,  hp: '6d8',    ac: 10, dmg: '1d10', exp: 40,   verb: 'bites',   flags: ['poison'] },
    { name: 'Ghoul',              ch: 'G', lvl: 9,  hp: '5d8',    ac: 10, dmg: '1d8',  exp: 40,   verb: 'claws',   flags: ['paralyze'] },
    { name: 'Ogre',               ch: 'O', lvl: 11, hp: '8d8',    ac: 12, dmg: '2d8',  exp: 70,   verb: 'pounds',  flags: [] },
    { name: 'Wight',              ch: 'W', lvl: 12, hp: '6d8',    ac: 14, dmg: '1d10', exp: 80,   verb: 'touches', flags: ['drain'] },
    { name: 'Giant Scorpion',     ch: 'c', lvl: 12, hp: '7d8',    ac: 14, dmg: '1d8',  exp: 75,   verb: 'stings',  flags: ['poison', 'drainstr'] },
    { name: 'Werewolf',           ch: 'C', lvl: 13, hp: '9d8',    ac: 12, dmg: '2d6',  exp: 90,   verb: 'claws',   flags: [] },
    { name: 'Troll',              ch: 'T', lvl: 15, hp: '12d8',   ac: 16, dmg: '3d6',  exp: 150,  verb: 'claws',   flags: [] },
    { name: 'Stone Golem',        ch: 'g', lvl: 16, hp: '14d10',  ac: 22, dmg: '2d10', exp: 220,  verb: 'pounds',  flags: [] },
    { name: 'Wraith',             ch: 'W', lvl: 17, hp: '10d10',  ac: 18, dmg: '2d8',  exp: 250,  verb: 'touches', flags: ['drain'] },
    { name: 'Young Red Dragon',   ch: 'd', lvl: 17, hp: '14d10',  ac: 20, dmg: '2d10', exp: 350,  verb: 'claws',   flags: ['breath'], rdmg: '5d8' },
    { name: 'Vampire',            ch: 'V', lvl: 18, hp: '12d10',  ac: 18, dmg: '2d8',  exp: 300,  verb: 'bites',   flags: ['drain'] },
    { name: 'Hill Giant',         ch: 'P', lvl: 19, hp: '16d10',  ac: 18, dmg: '3d8',  exp: 320,  verb: 'pounds',  flags: [] },
    { name: 'Frost Giant',        ch: 'P', lvl: 24, hp: '20d10',  ac: 22, dmg: '3d10', exp: 600,  verb: 'pounds',  flags: ['breath'], rdmg: '4d8' },
    { name: 'Lich',               ch: 'L', lvl: 26, hp: '18d10',  ac: 28, dmg: '2d10', exp: 900,  verb: 'touches', flags: ['caster', 'drain'], rdmg: '6d8' },
    { name: 'Fire Giant',         ch: 'P', lvl: 30, hp: '24d10',  ac: 26, dmg: '4d10', exp: 1200, verb: 'pounds',  flags: ['breath'], rdmg: '5d8' },
    { name: 'Ancient Red Dragon', ch: 'D', lvl: 32, hp: '30d10',  ac: 32, dmg: '3d12', exp: 2000, verb: 'claws',   flags: ['breath'], rdmg: '10d8' },
    { name: 'Greater Demon',      ch: 'U', lvl: 36, hp: '30d12',  ac: 32, dmg: '4d10', exp: 2500, verb: 'claws',   flags: ['breath'], rdmg: '8d8' },
    { name: 'Dread Lich',         ch: 'L', lvl: 40, hp: '30d12',  ac: 36, dmg: '3d10', exp: 3000, verb: 'touches', flags: ['caster', 'drain'], rdmg: '9d8' },
    { name: 'Great Wyrm',         ch: 'D', lvl: 45, hp: '40d12',  ac: 38, dmg: '4d12', exp: 5000, verb: 'claws',   flags: ['breath'], rdmg: '12d8' },
    { name: 'The Balrog',         ch: 'B', lvl: 50, hp: '55d12',  ac: 40, dmg: '5d12', exp: 25000, verb: 'strikes', flags: ['boss', 'breath', 'drain'], rdmg: '10d10' }
  ];

  var TOWNSFOLK = { name: 'Townsperson', ch: 'p', lvl: 0, hp: '2d4', ac: 2, dmg: '1d2', exp: 0, verb: 'shoves', flags: [] };

  var ITEMS = {
    // weapons
    dagger:    { kind: 'weapon', name: 'Dagger',           dmg: '1d4', price: 10 },
    shortsw:   { kind: 'weapon', name: 'Short Sword',      dmg: '1d6', price: 30 },
    mace:      { kind: 'weapon', name: 'Mace',             dmg: '2d3', price: 35 },
    spear:     { kind: 'weapon', name: 'Spear',            dmg: '1d8', price: 40 },
    broadsw:   { kind: 'weapon', name: 'Broad Sword',      dmg: '2d5', price: 120 },
    battleaxe: { kind: 'weapon', name: 'Battle Axe',       dmg: '2d6', price: 180 },
    warhammer: { kind: 'weapon', name: 'War Hammer',       dmg: '3d3', price: 200 },
    twohander: { kind: 'weapon', name: 'Two-Handed Sword', dmg: '3d6', price: 450 },
    // body armor
    robe:      { kind: 'armor', slot: 'body', name: 'Robe',                 ac: 1,  price: 5 },
    softleath: { kind: 'armor', slot: 'body', name: 'Soft Leather Armour',  ac: 2,  price: 20 },
    hardleath: { kind: 'armor', slot: 'body', name: 'Hard Leather Armour',  ac: 4,  price: 60 },
    ringmail:  { kind: 'armor', slot: 'body', name: 'Ring Mail',            ac: 6,  price: 150 },
    chainmail: { kind: 'armor', slot: 'body', name: 'Chain Mail',           ac: 8,  price: 300 },
    platemail: { kind: 'armor', slot: 'body', name: 'Plate Mail',           ac: 12, price: 800 },
    // shields / helms
    smshield:  { kind: 'armor', slot: 'shield', name: 'Small Metal Shield', ac: 2, price: 25 },
    lgshield:  { kind: 'armor', slot: 'shield', name: 'Large Metal Shield', ac: 4, price: 90 },
    cap:       { kind: 'armor', slot: 'helm', name: 'Hard Leather Cap',     ac: 1, price: 10 },
    ironhelm:  { kind: 'armor', slot: 'helm', name: 'Iron Helm',            ac: 3, price: 75 },
    // potions (key doubles as effect id)
    p_clw:     { kind: 'potion', name: 'Cure Light Wounds',   price: 15 },
    p_csw:     { kind: 'potion', name: 'Cure Serious Wounds', price: 40 },
    p_heal:    { kind: 'potion', name: 'Healing',             price: 200 },
    p_str:     { kind: 'potion', name: 'Gain Strength',       price: 300 },
    p_rstr:    { kind: 'potion', name: 'Restore Strength',    price: 80 },
    p_hero:    { kind: 'potion', name: 'Heroism',             price: 35 },
    p_speed:   { kind: 'potion', name: 'Speed',               price: 75 },
    p_poison:  { kind: 'potion', name: 'Poison',              price: 5 },
    p_blind:   { kind: 'potion', name: 'Blindness',           price: 5 },
    // scrolls
    s_map:     { kind: 'scroll', name: 'Magic Mapping',    price: 40 },
    s_tele:    { kind: 'scroll', name: 'Teleport',         price: 60 },
    s_ident:   { kind: 'scroll', name: 'Identify',         price: 50 },
    s_enchw:   { kind: 'scroll', name: 'Enchant Weapon',   price: 125 },
    s_encha:   { kind: 'scroll', name: 'Enchant Armour',   price: 125 },
    s_light:   { kind: 'scroll', name: 'Light',            price: 15 },
    s_aggr:    { kind: 'scroll', name: 'Aggravate Monster', price: 1 },
    // food
    ration:    { kind: 'food', name: 'Ration of Food', food: 3500, price: 3 },
    biscuit:   { kind: 'food', name: 'Hard Biscuit',   food: 1000, price: 1 },
    jerky:     { kind: 'food', name: 'Strip of Jerky', food: 1750, price: 2 },
    // light sources
    torch:     { kind: 'light', name: 'Wooden Torch',  radius: 1, fuel: 4000,  price: 2 },
    lantern:   { kind: 'light', name: 'Brass Lantern', radius: 2, fuel: 7500, cap: 15000, price: 120 },
    oil:       { kind: 'oil',  name: 'Flask of Oil',   fuel: 7500, price: 3 }
  };

  var STORES = [
    { name: 'General Store',    sellKinds: ['food', 'light', 'oil'],  stock: ['ration', 'biscuit', 'jerky', 'torch', 'oil', 'lantern'] },
    { name: 'Armoury',          sellKinds: ['armor'],                 stock: ['softleath', 'hardleath', 'ringmail', 'chainmail', 'smshield', 'lgshield', 'cap', 'ironhelm'] },
    { name: 'Weapon Smith',     sellKinds: ['weapon'],                stock: ['dagger', 'shortsw', 'mace', 'spear', 'broadsw', 'battleaxe', 'warhammer', 'twohander'] },
    { name: 'Temple',           sellKinds: ['potion'],                stock: ['p_clw', 'p_csw', 'mace', 'warhammer'] },
    { name: 'Alchemy Shop',     sellKinds: ['potion', 'scroll'],      stock: ['p_clw', 'p_hero', 'p_rstr', 's_ident', 's_light'] },
    { name: 'Magic Shop',       sellKinds: ['scroll'],                stock: ['s_map', 's_tele', 's_enchw', 's_encha', 'p_speed'] }
  ];

  var SPELLS = {
    Mage: [
      { key: 'missile', name: 'Magic Missile', lvl: 1,  mana: 1, dmg: '2d6' },
      { key: 'light',   name: 'Light Area',    lvl: 1,  mana: 2 },
      { key: 'phase',   name: 'Phase Door',    lvl: 3,  mana: 3 },
      { key: 'frost',   name: 'Frost Bolt',    lvl: 5,  mana: 4, dmg: '4d8' },
      { key: 'fire',    name: 'Fire Bolt',     lvl: 9,  mana: 7, dmg: '6d8' },
      { key: 'tele',    name: 'Teleport Self', lvl: 12, mana: 9 }
    ],
    Priest: [
      { key: 'clw',   name: 'Cure Light Wounds',   lvl: 1,  mana: 1, heal: '3d8' },
      { key: 'light', name: 'Light Area',          lvl: 1,  mana: 2 },
      { key: 'orb',   name: 'Orb of Draining',     lvl: 5,  mana: 4, dmg: '5d8' },
      { key: 'csw',   name: 'Cure Serious Wounds', lvl: 7,  mana: 6, heal: '6d8' },
      { key: 'tele',  name: 'Word of Passage',     lvl: 10, mana: 8 }
    ]
  };

  var POTION_COLORS = ['Azure', 'Crimson', 'Ebony', 'Golden', 'Misty', 'Silver', 'Smoky',
    'Violet', 'Emerald', 'Cloudy', 'Bubbling', 'Murky', 'Glowing', 'Oily'];

  var ident = { labels: {}, known: {} };

  function scrollLabel() {
    var syll = ['xag', 'nyr', 'mor', 'ish', 'gob', 'ple', 'zun', 'kra', 'vex', 'ulm', 'tha', 'rii', 'odo', 'bek'];
    var n = U.ri(2, 3), out = [];
    for (var i = 0; i < n; i++) out.push(U.pick(syll));
    return out.join(' ');
  }

  function initIdentities() {
    ident.labels = {}; ident.known = {};
    var colors = POTION_COLORS.slice();
    for (var k in ITEMS) {
      if (ITEMS[k].kind === 'potion') {
        var ci = Math.floor(U.rnd() * colors.length);
        ident.labels[k] = colors.splice(ci, 1)[0];
      } else if (ITEMS[k].kind === 'scroll') {
        ident.labels[k] = scrollLabel();
      }
    }
  }

  function identify(key) { ident.known[key] = true; }
  function isKnown(key) { return !!ident.known[key]; }

  function makeItem(key) {
    var t = ITEMS[key];
    var it = { key: key, kind: t.kind, name: t.name, price: t.price, count: 1, bonus: 0 };
    if (t.dmg) it.dmg = t.dmg;
    if (t.ac) it.ac = t.ac;
    if (t.slot) it.slot = t.slot;
    if (t.food) it.food = t.food;
    if (t.radius) it.radius = t.radius;
    if (t.fuel) it.fuel = t.fuel;
    if (t.cap) it.cap = t.cap;
    return it;
  }

  function displayName(it) {
    var n;
    if (it.kind === 'potion') {
      n = isKnown(it.key) ? 'Potion of ' + it.name : ident.labels[it.key] + ' Potion';
    } else if (it.kind === 'scroll') {
      n = isKnown(it.key) ? 'Scroll of ' + it.name : 'Scroll titled "' + ident.labels[it.key] + '"';
    } else if (it.kind === 'weapon') {
      n = it.name + ' (' + it.dmg + ')' + (it.bonus ? ' (+' + it.bonus + ')' : '');
    } else if (it.kind === 'armor') {
      n = it.name + ' [' + it.ac + (it.bonus ? ',+' + it.bonus : '') + ']';
    } else {
      n = it.name;
    }
    if (it.count > 1) n = it.count + ' ' + n + 's';
    return n;
  }

  function itemChar(it) {
    switch (it.kind) {
      case 'potion': return '!';
      case 'scroll': return '?';
      case 'weapon': return '|';
      case 'armor':  return '[';
      case 'food':   return ',';
      case 'light':  return '~';
      case 'oil':    return '~';
      case 'gold':   return '$';
    }
    return '*';
  }

  function keysOfKind(kinds) {
    var out = [];
    for (var k in ITEMS) if (kinds.indexOf(ITEMS[k].kind) >= 0) out.push(k);
    return out;
  }

  function randomItem(depth) {
    var r = U.rnd();
    var it;
    if (r < 0.22) {
      it = makeItem(U.pick(keysOfKind(['potion'])));
    } else if (r < 0.38) {
      it = makeItem(U.pick(keysOfKind(['scroll'])));
    } else if (r < 0.50) {
      it = makeItem(U.pick(['dagger', 'shortsw', 'mace', 'spear', 'broadsw', 'battleaxe', 'warhammer', 'twohander']));
      if (U.rnd() < depth / 40) it.bonus = 1 + Math.floor(U.rnd() * depth / 12);
    } else if (r < 0.62) {
      it = makeItem(U.pick(['softleath', 'hardleath', 'ringmail', 'chainmail', 'platemail', 'smshield', 'lgshield', 'cap', 'ironhelm']));
      if (U.rnd() < depth / 40) it.bonus = 1 + Math.floor(U.rnd() * depth / 12);
    } else if (r < 0.76) {
      it = makeItem(U.pick(['ration', 'biscuit', 'jerky']));
    } else if (r < 0.88) {
      it = makeItem(U.pick(['torch', 'oil']));
    } else {
      it = { kind: 'gold', name: 'gold', amount: U.roll(2, 8) * (depth + 2), count: 1 };
    }
    return it;
  }

  function randomMonster(depth) {
    var lo = Math.max(1, depth - 4), hi = depth + 3;
    if (U.rnd() < 0.08) hi = depth + U.ri(4, 10); // out-of-depth scare
    var pool = MONSTERS.filter(function (m) {
      return m.lvl >= lo && m.lvl <= hi && m.flags.indexOf('boss') < 0;
    });
    if (!pool.length) {
      pool = MONSTERS.filter(function (m) { return m.lvl <= hi && m.flags.indexOf('boss') < 0; });
    }
    return U.pick(pool);
  }

  return {
    RACES: RACES, CLASSES: CLASSES, MONSTERS: MONSTERS, TOWNSFOLK: TOWNSFOLK,
    ITEMS: ITEMS, STORES: STORES, SPELLS: SPELLS,
    initIdentities: initIdentities, identify: identify, isKnown: isKnown,
    makeItem: makeItem, displayName: displayName, itemChar: itemChar,
    randomItem: randomItem, randomMonster: randomMonster
  };
})();
