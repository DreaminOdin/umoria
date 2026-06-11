// game.js -- UMORIA game logic: character creation, dungeon play, combat,
// items, stores, spells, multiple lives, death & victory.
var MAP_X = 13, MAP_Y = 1, MAP_W = 67, MAP_H = 22;
var INV_MAX = 22;

function Game(term) {
  this.term = term;
  this.state = 'title'; // title | chargen | play | store | lostlife | dead | win
  this.dirty = true;
  this.blinkOn = true;
  this.msgQ = [];
  this.ui = null;        // overlay: {mode:'inv'|'help'|'pick'|'spell'|'takeoff', ...}
  this.p = null;
  this.level = null;
  this.depth = 0;
  this.turn = 0;
  this.hasteFlip = 0;
  this.storeIdx = -1;
  this.storeUI = null;   // null | 'buy' | 'sell'
  this.sellList = [];
  this.cg = null;
  this.deathCause = '';
  this.vis = {};
  this.titleBuf = '';
  this.mellon = false;   // Doors of Durin easter egg
  this.menuReturn = 'title';
  this.onToggleFullscreen = null; // wired up by main.js
  DATA.initIdentities();
}

Game.prototype.sfx = function (name) { if (window.AudioSys) AudioSys.sfx(name); };
Game.prototype.msg = function (s) { this.msgQ.push(s); };
Game.prototype.wantsBlink = function () {
  return this.state === 'title' || this.state === 'dead' || this.state === 'lostlife' ||
    (this.state === 'chargen' && this.cg && this.cg.step === 'name');
};

// ---------------------------------------------------------------- helpers
var TT = null; // Dungeon tile constants, bound lazily
function tiles() { if (!TT) TT = Dungeon.T; return TT; }

Game.prototype.tileAt = function (x, y) {
  var l = this.level;
  if (x < 0 || y < 0 || x >= l.w || y >= l.h) return tiles().ROCK;
  return l.map[y][x];
};
Game.prototype.walkable = function (t) {
  var T = tiles();
  return t === T.FLOOR || t === T.CORR || t === T.DOORO || t === T.UP || t === T.DOWN;
};
Game.prototype.transparent = function (t) {
  var T = tiles();
  return t !== T.ROCK && t !== T.DOORC && t < T.STORE;
};
Game.prototype.los = function (x0, y0, x1, y1) {
  var pts = U.line(x0, y0, x1, y1);
  for (var i = 1; i < pts.length - 1; i++) {
    if (!this.transparent(this.tileAt(pts[i][0], pts[i][1]))) return false;
  }
  return true;
};
Game.prototype.roomAt = function (x, y) {
  var rs = this.level.rooms;
  for (var i = 0; i < rs.length; i++) {
    var r = rs[i];
    if (x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h) return r;
  }
  return null;
};
Game.prototype.monsterAt = function (x, y) {
  var ms = this.level.monsters;
  for (var i = 0; i < ms.length; i++) if (ms[i].x === x && ms[i].y === y) return ms[i];
  return null;
};
Game.prototype.itemIdxAt = function (x, y) {
  var its = this.level.items;
  for (var i = 0; i < its.length; i++) if (its[i].x === x && its[i].y === y) return i;
  return -1;
};
Game.prototype.trapAt = function (x, y) {
  var ts = this.level.traps;
  for (var i = 0; i < ts.length; i++) if (ts[i].x === x && ts[i].y === y) return ts[i];
  return null;
};

// ------------------------------------------------------------- stat math
Game.prototype.conB = function () { var c = this.p.st.con; return c >= 17 ? 2 : c >= 15 ? 1 : c < 8 ? -1 : 0; };
Game.prototype.dexB = function () { var d = this.p.st.dex; return d >= 16 ? 2 : d >= 13 ? 1 : d < 8 ? -1 : 0; };
Game.prototype.strHit = function () { var s = this.p.st.str; return s >= 18 ? 2 : s >= 16 ? 1 : s < 8 ? -1 : 0; };
Game.prototype.strDmg = function () { var s = this.p.st.str; return s >= 18 ? 2 : s >= 16 ? 1 : 0; };
Game.prototype.hitDie = function () { return this.p.race.hd + this.p.cls.hd; };
Game.prototype.casterMana = function () {
  var c = this.p.cls;
  if (!c.spell) return 0;
  return Math.max(1, Math.floor((this.p.st[c.spell] - 8) * this.p.lvl / 3));
};
Game.prototype.playerAC = function () {
  var ac = this.dexB(), eq = this.p.eq;
  ['body', 'shield', 'helm'].forEach(function (s) {
    if (eq[s]) ac += eq[s].ac + (eq[s].bonus || 0);
  });
  return ac;
};
Game.prototype.expNeeded = function (l) { return (l - 1) * (l - 1) * 10; };
Game.prototype.lightRadius = function () {
  if (this.p.timers.blind > 0) return -1;
  var lt = this.p.eq.light;
  if (!lt || lt.fuel <= 0) return 0;
  return lt.radius;
};

// --------------------------------------------------------- character gen
Game.prototype.startCharGen = function () {
  this.cg = { step: 'race', race: null, sex: null, cls: null, st: null, name: '' };
  this.state = 'chargen';
};
Game.prototype.rollStats = function () {
  var st = {}, names = ['str', 'int', 'wis', 'dex', 'con', 'chr'];
  var mods = this.cg.race.mods;
  names.forEach(function (n) {
    var d = [U.ri(1, 6), U.ri(1, 6), U.ri(1, 6), U.ri(1, 6)].sort(function (a, b) { return b - a; });
    st[n] = U.clamp(d[0] + d[1] + d[2] + mods[n], 3, 25);
  });
  return st;
};
Game.prototype.createPlayer = function () {
  var cg = this.cg;
  var p = {
    name: cg.name || 'Adventurer', sex: cg.sex, race: cg.race, cls: cg.cls,
    st: cg.st, maxStr: cg.st.str,
    lvl: 1, exp: 0, gold: 0, x: 0, y: 0,
    inv: [], eq: { weapon: null, body: null, shield: null, helm: null, light: null },
    food: 4500, regen: 0, mregen: 0,
    timers: { poison: 0, blind: 0, para: 0, haste: 0, hero: 0 },
    lives: 3, won: false, maxDepth: 0
  };
  this.p = p;
  p.maxhp = this.hitDie() + this.conB() * 2;
  if (p.maxhp < 6) p.maxhp = 6;
  p.hp = p.maxhp;
  p.maxmana = this.casterMana();
  p.mana = p.maxmana;

  // starting kit
  var addI = this.addItem.bind(this);
  function mk(k) { return DATA.makeItem(k); }
  var torches = mk('torch'); torches.count = 4;
  var rations = mk('ration'); rations.count = 3;
  switch (p.cls.name) {
    case 'Warrior':
      p.eq.weapon = mk('shortsw'); p.eq.body = mk('softleath'); p.eq.shield = mk('smshield');
      p.gold = 120 + U.roll(2, 20); break;
    case 'Mage':
      p.eq.weapon = mk('dagger'); p.eq.body = mk('robe');
      p.gold = 130 + U.roll(2, 20); break;
    case 'Priest':
      p.eq.weapon = mk('mace'); p.eq.body = mk('robe');
      var cl = mk('p_clw'); cl.count = 2; addI(cl); DATA.identify('p_clw');
      p.gold = 110 + U.roll(2, 20); break;
    case 'Rogue':
      p.eq.weapon = mk('dagger'); p.eq.body = mk('softleath');
      p.gold = 180 + U.roll(2, 20); break;
  }
  p.eq.light = mk('torch');
  addI(torches); addI(rations);

  if (this.mellon) { // "speak, friend, and enter"
    var sting = { key: 'sting', kind: 'weapon', name: 'Sting', dmg: '1d6', bonus: 2, price: 1000, count: 1 };
    var phial = {
      key: 'phial', kind: 'light', name: 'Phial of Galadriel', radius: 3,
      fuel: Number.POSITIVE_INFINITY, price: 5000, count: 1, bonus: 0
    };
    addI(sting); addI(phial);
  }
};
Game.prototype.startGame = function () {
  this.createPlayer();
  this.turn = 0;
  this.gotoLevel(0, 'new');
  this.state = 'play';
  this.msgQ = [];
  this.msg('Welcome to the town of Moria, ' + this.p.name + '.' +
    (this.mellon ? ' The Doors of Durin have opened for you, friend.' : ''));
};

// ------------------------------------------------------- levels & spawns
Game.prototype.findTiles = function (t) {
  var out = [], l = this.level;
  for (var y = 0; y < l.h; y++) for (var x = 0; x < l.w; x++) {
    if (l.map[y][x] === t) out.push({ x: x, y: y });
  }
  return out;
};
Game.prototype.gotoLevel = function (depth, dir) {
  var T = tiles();
  this.depth = depth;
  this.level = depth === 0 ? Dungeon.town() : Dungeon.generate(depth);
  var p = this.p;
  if (depth > p.maxDepth) {
    p.maxDepth = depth;
    if (depth % 5 === 0 && window.AudioSys && AudioSys.voice) AudioSys.voice();
  }

  var spot = null;
  if (depth === 0) {
    spot = dir === 'new' ? { x: 33, y: 10 } : this.findTiles(T.DOWN)[0];
    if (!spot) spot = { x: 33, y: 10 };
  } else if (dir === 'down') {
    spot = U.pick(this.findTiles(T.UP)) || Dungeon.randomFloor(this.level);
  } else if (dir === 'up') {
    spot = U.pick(this.findTiles(T.DOWN)) || Dungeon.randomFloor(this.level);
  } else {
    spot = Dungeon.randomFloor(this.level);
  }
  p.x = spot.x; p.y = spot.y;

  this.populate();
  this.computeVisible();
  if (depth > 0) this.msg('You enter a maze of twisty passages. (' + depth * 50 + ' feet)');
};
Game.prototype.populate = function () {
  var l = this.level, p = this.p, i, spot;
  if (l.isTown) {
    for (i = 0; i < 4; i++) {
      spot = Dungeon.randomFloor(l);
      if (!this.monsterAt(spot.x, spot.y) && !(spot.x === p.x && spot.y === p.y)) {
        l.monsters.push(this.makeMonster(DATA.TOWNSFOLK, spot.x, spot.y, true));
      }
    }
    return;
  }
  var n = Math.min(20, 6 + Math.floor(this.depth * 0.4) + U.ri(0, 3));
  for (i = 0; i < n; i++) {
    spot = Dungeon.randomFloor(l);
    if (U.dist(spot.x, spot.y, p.x, p.y) < 8) continue;
    if (this.monsterAt(spot.x, spot.y)) continue;
    l.monsters.push(this.makeMonster(DATA.randomMonster(this.depth), spot.x, spot.y, false));
  }
  if (this.depth === 50 && !p.won) { // the Balrog awaits at 2500 feet
    var boss = DATA.MONSTERS[DATA.MONSTERS.length - 1];
    spot = Dungeon.randomFloor(l);
    l.monsters.push(this.makeMonster(boss, spot.x, spot.y, false));
  }
  var nIt = U.ri(6, 12);
  for (i = 0; i < nIt; i++) {
    spot = Dungeon.randomFloor(l);
    if (this.itemIdxAt(spot.x, spot.y) >= 0) continue;
    l.items.push({ x: spot.x, y: spot.y, item: DATA.randomItem(this.depth), seen: false });
  }
};
Game.prototype.makeMonster = function (def, x, y, peaceful) {
  var boss = def.flags.indexOf('boss') >= 0;
  return { d: def, x: x, y: y, hp: U.rollStr(def.hp), asleep: !boss && U.rnd() < 0.7, peaceful: !!peaceful };
};

// --------------------------------------------------------- lives system
Game.prototype.die = function (cause) {
  this.deathCause = cause;
  this.sfx('death');
  if (this.p.lives > 1) {
    this.p.lives--;
    this.state = 'lostlife';
  } else {
    this.p.lives = 0;
    this.state = 'dead';
  }
};
Game.prototype.respawn = function () {
  var p = this.p;
  // you lose everything but a dagger, a shield and a few torches
  p.gold = 0;
  p.inv = [];
  p.eq = { weapon: DATA.makeItem('dagger'), body: null, shield: DATA.makeItem('smshield'), helm: null, light: DATA.makeItem('torch') };
  var torches = DATA.makeItem('torch'); torches.count = 3;
  var food = DATA.makeItem('ration'); food.count = 2;
  this.addItem(torches); this.addItem(food);
  p.hp = p.maxhp; p.mana = p.maxmana;
  p.food = 4500;
  p.timers = { poison: 0, blind: 0, para: 0, haste: 0, hero: 0 };
  this.hasteFlip = 0;
  this.gotoLevel(0, 'new');
  this.state = 'play';
  this.msgQ = [];
  this.msg('You awaken at the town square, stripped of your possessions. (Lives: ' + p.lives + ')');
};
Game.prototype.resetToTitle = function () {
  this.state = 'title';
  this.p = null;
  this.titleBuf = '';
  this.mellon = false;
  DATA.initIdentities();
};

// ------------------------------------------------------------ visibility
Game.prototype.computeVisible = function () {
  var vis = {}, l = this.level, p = this.p, T = tiles();
  function add(x, y) {
    if (x < 0 || y < 0 || x >= l.w || y >= l.h) return;
    vis[x + ',' + y] = true;
    l.explored[y][x] = true;
  }
  add(p.x, p.y);
  var r = this.lightRadius();
  if (r >= 0) {
    if (l.isTown) {
      for (var y = 0; y < l.h; y++) for (var x = 0; x < l.w; x++) add(x, y);
    } else {
      for (var dy = -r; dy <= r; dy++) {
        for (var dx = -r; dx <= r; dx++) {
          var nx = p.x + dx, ny = p.y + dy;
          if (this.los(p.x, p.y, nx, ny)) add(nx, ny);
        }
      }
      var room = this.roomAt(p.x, p.y);
      if (room && room.lit) {
        for (var ry = room.y - 1; ry <= room.y + room.h; ry++) {
          for (var rx = room.x - 1; rx <= room.x + room.w; rx++) add(rx, ry);
        }
      }
    }
  }
  this.vis = vis;
  for (var i = 0; i < l.items.length; i++) {
    var it = l.items[i];
    if (vis[it.x + ',' + it.y]) it.seen = true;
  }
};

// ------------------------------------------------------------- input
Game.prototype.handleKey = function (e) {
  var k = e.key;
  switch (this.state) {
    case 'title': this.titleKey(k); break;
    case 'chargen': this.chargenKey(k, e); break;
    case 'play': this.playKey(k); break;
    case 'store': this.storeKey(k); break;
    case 'menu': this.menuKey(k); break;
    case 'help': this.state = this.menuReturn; break;
    case 'lostlife': if (k === ' ' || k === 'Enter') this.respawn(); break;
    case 'dead': if (k === ' ' || k === 'Enter') this.resetToTitle(); break;
    case 'win': this.state = 'play'; break;
  }
};
Game.prototype.titleKey = function (k) {
  if (k === ' ' || k === 'Enter') { this.startCharGen(); return; }
  if (k === 'Escape' || k === '=') { this.openMenu(); return; }
  if (k === '?') { this.menuReturn = 'title'; this.state = 'help'; return; }
  if (/^[a-z]$/i.test(k)) {
    this.titleBuf = (this.titleBuf + k.toLowerCase()).slice(-12);
    if (this.titleBuf.indexOf('mellon') >= 0 && !this.mellon) {
      this.mellon = true; this.sfx('win');
    }
  }
};
Game.prototype.chargenKey = function (k, e) {
  var cg = this.cg, i;
  switch (cg.step) {
    case 'race':
      i = 'abcdefgh'.indexOf(k.toLowerCase());
      if (i >= 0 && i < DATA.RACES.length) { cg.race = DATA.RACES[i]; cg.step = 'sex'; }
      break;
    case 'sex':
      if (k === 'm' || k === 'M') { cg.sex = 'Male'; cg.step = 'class'; }
      if (k === 'f' || k === 'F') { cg.sex = 'Female'; cg.step = 'class'; }
      break;
    case 'class':
      i = 'abcd'.indexOf(k.toLowerCase());
      if (i >= 0) { cg.cls = DATA.CLASSES[i]; cg.st = this.rollStats(); cg.step = 'stats'; }
      break;
    case 'stats':
      if (k === 'r' || k === 'R') cg.st = this.rollStats();
      if (k === 'Enter' || k === ' ') cg.step = 'name';
      break;
    case 'name':
      if (k === 'Enter') { this.startGame(); return; }
      if (k === 'Backspace') { cg.name = cg.name.slice(0, -1); return; }
      if (k.length === 1 && /[a-zA-Z0-9 \-]/.test(k) && cg.name.length < 14) cg.name += k;
      break;
  }
};

// arrows and number keys move in both key modes (Umoria "original" commands);
// hjklyubn move only in rogue-like mode, where they shadow some commands.
var DIRS_COMMON = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
  '4': [-1, 0], '6': [1, 0], '8': [0, -1], '2': [0, 1],
  '7': [-1, -1], '9': [1, -1], '1': [-1, 1], '3': [1, 1]
};
var DIRS_ROGUE = {
  h: [-1, 0], l: [1, 0], k: [0, -1], j: [0, 1],
  y: [-1, -1], u: [1, -1], b: [-1, 1], n: [1, 1]
};

Game.prototype.moveDir = function (k) {
  if (DIRS_COMMON[k]) return DIRS_COMMON[k];
  if (SETTINGS.keys === 'roguelike' && DIRS_ROGUE[k]) return DIRS_ROGUE[k];
  return null;
};

Game.prototype.playKey = function (k) {
  if (this.ui) { this.overlayKey(k); return; }
  if (k === 'Escape' || k === '=') { this.openMenu(); return; }
  this.msgQ = [];
  var p = this.p;
  var rogue = SETTINGS.keys === 'roguelike';

  if (p.timers.para > 0) {
    this.msg('You are paralyzed!');
    this.passTurn();
    return;
  }
  var acted = false;
  var dir = this.moveDir(k);
  if (dir) {
    acted = this.tryMove(dir[0], dir[1]);
  } else {
    switch (k) {
      case '5': case '.': acted = true; break; // wait
      case '>': this.takeStairs(1); break;
      case '<': this.takeStairs(-1); break;
      case 'g': case ',': acted = this.pickup(); break;
      case 'i': this.ui = { mode: 'inv' }; break;
      case 'e': this.ui = { mode: 'equip' }; break;
      case '?': this.ui = { mode: 'help' }; break;
      case 'M': this.ui = { mode: 'map' }; break;
      case 'L': this.locate(); break;
      case 'C': this.ui = { mode: 'char' }; break;
      case 'o': this.ui = { mode: 'dir', action: 'open', title: 'Open -- which direction?' }; break;
      case 'c': this.ui = { mode: 'dir', action: 'close', title: 'Close -- which direction?' }; break;
      case 'w': this.pickItem('Wear or wield which item?', function (it) {
        return it.kind === 'weapon' || it.kind === 'armor' || it.kind === 'light';
      }, this.wieldFromInv.bind(this)); break;
      case 't': this.ui = { mode: 'takeoff' }; break;
      case 'd': this.pickItem('Drop which item?', function () { return true; }, this.dropItem.bind(this)); break;
      case 'q': this.pickItem('Quaff which potion?', function (it) { return it.kind === 'potion'; }, this.quaffItem.bind(this)); break;
      case 'r': this.pickItem('Read which scroll?', function (it) { return it.kind === 'scroll'; }, this.readItem.bind(this)); break;
      case 'E': this.pickItem('Eat what?', function (it) { return it.kind === 'food'; }, this.eatItem.bind(this)); break;
      case 'F': acted = this.refuel(); break;
      case 'm': // cast magic spell (mages); priests pray with 'p'
        if (this.p.cls.name === 'Priest') this.msg('Pray for guidance instead. (p)');
        else this.openSpells();
        break;
      case 'p':
        if (this.p.cls.name === 'Priest') this.openSpells();
        else this.msg('Your prayers go unanswered.');
        break;
      case 'R': this.rest(); break;
      case 's': acted = this.search(); break;
      case 'x': if (rogue) this.lookAround(); break;
    }
    if (k === 'l' && !rogue) this.lookAround(); // original keys: l = look
  }
  if (acted && this.state === 'play') this.passTurn();
};
Game.prototype.locate = function () {
  var p = this.p;
  if (this.depth === 0) { this.msg('You are in the town of Moria.'); return; }
  this.msg('You are at level position (' + p.x + ',' + p.y + '), ' +
    (this.depth * 50) + ' feet below the surface.');
};
Game.prototype.lookAround = function () {
  var seen = [], p = this.p, i;
  var ms = this.level.monsters;
  for (i = 0; i < ms.length; i++) {
    var m = ms[i];
    if (this.vis[m.x + ',' + m.y]) seen.push(m.d.name + ' (' + m.d.ch + ')');
  }
  var its = this.level.items;
  for (i = 0; i < its.length; i++) {
    var en = its[i];
    if (this.vis[en.x + ',' + en.y] && !(en.x === p.x && en.y === p.y)) {
      seen.push(en.item.kind === 'gold' ? 'some gold ($)' :
        DATA.displayName(en.item) + ' (' + DATA.itemChar(en.item) + ')');
    }
  }
  if (!seen.length) { this.msg('You see nothing of interest.'); return; }
  this.ui = { mode: 'look', list: seen };
};
Game.prototype.pickItem = function (title, filter, cb) {
  var list = [];
  for (var i = 0; i < this.p.inv.length; i++) {
    if (filter(this.p.inv[i])) list.push(i);
  }
  if (!list.length) { this.msg('You have nothing suitable.'); return; }
  this.ui = { mode: 'pick', title: title, list: list, cb: cb };
};
Game.prototype.overlayKey = function (k) {
  var ui = this.ui;
  if (k === 'Escape') { this.ui = null; return; }
  if (ui.mode === 'inv' && k === 'i') { this.ui = null; return; }
  if (['map', 'char', 'equip', 'look'].indexOf(ui.mode) >= 0) { this.ui = null; return; }
  if (ui.mode === 'dir') {
    this.ui = null;
    var d = DIRS_COMMON[k] || DIRS_ROGUE[k];
    if (d) {
      this.msgQ = [];
      var actedD = ui.action === 'open' ? this.doOpen(d[0], d[1]) : this.doClose(d[0], d[1]);
      if (actedD && this.state === 'play') this.passTurn();
    }
    return;
  }
  if (ui.mode === 'help' || ui.mode === 'inv') return;
  this.msgQ = [];
  var i = 'abcdefghijklmnopqrstuv'.indexOf(k);
  var acted = false;
  if (ui.mode === 'pick') {
    if (i >= 0 && i < ui.list.length) {
      this.ui = null;
      acted = ui.cb(ui.list[i]);
    }
  } else if (ui.mode === 'takeoff') {
    var slots = this.equippedSlots();
    if (i >= 0 && i < slots.length) {
      this.ui = null;
      acted = this.takeoffSlot(slots[i]);
    }
  } else if (ui.mode === 'spell') {
    var sps = DATA.SPELLS[this.p.cls.name] || [];
    if (i >= 0 && i < sps.length) {
      this.ui = null;
      acted = this.castSpell(sps[i]);
    }
  }
  if (acted && this.state === 'play') this.passTurn();
};
Game.prototype.equippedSlots = function () {
  var out = [], eq = this.p.eq;
  ['weapon', 'body', 'shield', 'helm', 'light'].forEach(function (s) { if (eq[s]) out.push(s); });
  return out;
};

// ------------------------------------------------------------- actions
Game.prototype.doOpen = function (dx, dy) {
  var T = tiles(), x = this.p.x + dx, y = this.p.y + dy, t = this.tileAt(x, y);
  if (t === T.DOORC) { this.level.map[y][x] = T.DOORO; this.msg('You open the door.'); return true; }
  if (t === T.DOORO) { this.msg('It is already open.'); return false; }
  this.msg('You see nothing there to open.');
  return false;
};
Game.prototype.doClose = function (dx, dy) {
  var T = tiles(), x = this.p.x + dx, y = this.p.y + dy, t = this.tileAt(x, y);
  if (t === T.DOORO) {
    if (this.monsterAt(x, y) || this.itemIdxAt(x, y) >= 0) { this.msg('Something is in the way.'); return false; }
    this.level.map[y][x] = T.DOORC;
    this.msg('You close the door.');
    this.computeVisible();
    return true;
  }
  if (t === T.DOORC) { this.msg('It is already closed.'); return false; }
  this.msg('You see nothing there to close.');
  return false;
};

// ----------------------------------------------------------- options menu
Game.prototype.openMenu = function () {
  this.menuReturn = this.state;
  this.state = 'menu';
};
Game.prototype.menuKey = function (k) {
  switch (k) {
    case 'Escape': case '=': this.state = this.menuReturn; return;
    case 'a':
      SETTINGS.display = SETTINGS.display === 'crt' ? 'sharp' : 'crt';
      SETTINGS.changed(); break;
    case 'b':
      var cyc = Terminal.CYCLE;
      SETTINGS.phosphor = cyc[(cyc.indexOf(SETTINGS.phosphor) + 1) % cyc.length];
      SETTINGS.changed(); break;
    case 'c':
      SETTINGS.lifeColors = !SETTINGS.lifeColors;
      SETTINGS.changed(); break;
    case 'd':
      SETTINGS.theme = SETTINGS.theme === 'dark' ? 'light' : 'dark';
      SETTINGS.changed(); break;
    case 'e':
      SETTINGS.music = !SETTINGS.music;
      SETTINGS.changed(); break;
    case 'f':
      SETTINGS.keys = SETTINGS.keys === 'original' ? 'roguelike' : 'original';
      SETTINGS.changed(); break;
    case 'g':
      if (this.onToggleFullscreen) this.onToggleFullscreen();
      break;
  }
};
Game.prototype.drawMenu = function () {
  var t = this.term;
  this.panel(14, 2, 52, 20, 'OPTIONS');
  var rows = [
    ['a', 'Display', SETTINGS.display === 'crt' ? 'CRT (authentic 1983)' : 'Sharp (modern, crisp)'],
    ['b', 'Phosphor colour', SETTINGS.phosphor.charAt(0).toUpperCase() + SETTINGS.phosphor.slice(1)],
    ['c', 'Screen colour per life', SETTINGS.lifeColors ? 'Per life (purple/red)' : 'Classic (always same)'],
    ['d', 'Theme', SETTINGS.theme === 'dark' ? 'Dark room' : 'Light room'],
    ['e', 'Music', SETTINGS.music ? 'On' : 'Off'],
    ['f', 'Key bindings', SETTINGS.keys === 'original' ? 'Original Umoria' : 'Rogue-like (hjkl)'],
    ['g', 'Fullscreen', 'toggle (or press F11)']
  ];
  for (var i = 0; i < rows.length; i++) {
    var y = 4 + i * 2;
    t.str(17, y, rows[i][0] + ') ' + rows[i][1]);
    t.str(44, y, rows[i][2], false);
  }
  t.str(17, 19, 'Shortcuts: F2 phosphor  F3 display  F4 music', true);
  t.str(17, 20, 'ESC) back', true);
};

Game.prototype.tryMove = function (dx, dy) {
  var p = this.p, T = tiles();
  var nx = p.x + dx, ny = p.y + dy;
  var m = this.monsterAt(nx, ny);
  if (m) return this.attackMonster(m);
  var t = this.tileAt(nx, ny);
  if (t >= T.STORE) { this.enterStore(t - T.STORE); return false; }
  if (t === T.DOORC) {
    this.level.map[ny][nx] = T.DOORO;
    this.msg('You open the door.');
    return true;
  }
  if (!this.walkable(t)) { this.msg('There is a wall in your way.'); return false; }
  p.x = nx; p.y = ny;

  var ii = this.itemIdxAt(nx, ny);
  if (ii >= 0) {
    var ent = this.level.items[ii];
    if (ent.item.kind === 'gold') {
      p.gold += ent.item.amount;
      this.level.items.splice(ii, 1);
      this.msg('You have found ' + ent.item.amount + ' gold pieces.');
      this.sfx('gold');
    } else {
      this.msg('You see ' + DATA.displayName(ent.item) + ' here.');
    }
  }
  var tr = this.trapAt(nx, ny);
  if (tr && !tr.found) this.triggerTrap(tr);
  if (t === T.UP) this.msg('There is a staircase up here.');
  if (t === T.DOWN) this.msg('There is a staircase down here.');
  return true;
};
Game.prototype.triggerTrap = function (tr) {
  tr.found = true;
  switch (tr.type) {
    case 'dart':
      this.msg('A small dart hits you!');
      this.damagePlayer(U.roll(1, 6), 'a dart trap'); break;
    case 'pit':
      this.msg('You fall into a pit!');
      this.damagePlayer(U.roll(2, 6), 'a pit trap'); break;
    case 'gas':
      this.msg('A cloud of green gas surrounds you!');
      this.p.timers.poison += U.ri(5, 15);
      this.damagePlayer(U.roll(1, 4), 'a gas trap'); break;
    case 'teleport':
      this.msg('You are teleported across the level!');
      this.teleportPlayer(); break;
    case 'trapdoor':
      this.msg('You fall through a trap door!');
      this.sfx('stairs');
      this.gotoLevel(this.depth + 1, 'fall'); break;
  }
};
Game.prototype.teleportPlayer = function () {
  var l = this.level;
  for (var t = 0; t < 200; t++) {
    var s = Dungeon.randomFloor(l);
    if (!this.monsterAt(s.x, s.y)) { this.p.x = s.x; this.p.y = s.y; break; }
  }
  this.computeVisible();
};
Game.prototype.takeStairs = function (dir) {
  var T = tiles(), t = this.tileAt(this.p.x, this.p.y);
  if (dir > 0) {
    if (t !== T.DOWN) { this.msg('I see no down staircase here.'); return; }
    this.sfx('stairs');
    this.gotoLevel(this.depth + 1, 'down');
  } else {
    if (t !== T.UP) { this.msg('I see no up staircase here.'); return; }
    this.sfx('stairs');
    this.gotoLevel(this.depth - 1, 'up');
    if (this.depth === 0) this.msg('You emerge into the daylight of town.');
  }
};
Game.prototype.pickup = function () {
  var ii = this.itemIdxAt(this.p.x, this.p.y);
  if (ii < 0) { this.msg('There is nothing here to pick up.'); return false; }
  var ent = this.level.items[ii];
  if (!this.addItem(ent.item)) { this.msg('You cannot carry any more.'); return false; }
  this.level.items.splice(ii, 1);
  this.msg('You have ' + DATA.displayName(ent.item) + '.');
  return true;
};
Game.prototype.stackable = function (it) {
  if (['potion', 'scroll', 'food', 'oil'].indexOf(it.kind) >= 0) return true;
  return it.key === 'torch' && it.fuel === DATA.ITEMS.torch.fuel;
};
Game.prototype.addItem = function (it) {
  var inv = this.p.inv;
  if (this.stackable(it)) {
    for (var i = 0; i < inv.length; i++) {
      if (inv[i].key === it.key && this.stackable(inv[i])) {
        inv[i].count += it.count;
        return true;
      }
    }
  }
  if (inv.length >= INV_MAX) return false;
  inv.push(it);
  return true;
};
Game.prototype.removeOne = function (idx) {
  var it = this.p.inv[idx];
  if (it.count > 1) {
    it.count--;
    var copy = {};
    for (var k in it) copy[k] = it[k];
    copy.count = 1;
    return copy;
  }
  this.p.inv.splice(idx, 1);
  return it;
};
Game.prototype.wieldFromInv = function (idx) {
  var it = this.p.inv[idx], slot;
  if (it.kind === 'weapon') slot = 'weapon';
  else if (it.kind === 'armor') slot = it.slot;
  else if (it.kind === 'light') slot = 'light';
  else { this.msg('You cannot wear or wield that.'); return false; }
  var item = this.removeOne(idx);
  if (item.key === 'torch') item.fuel = DATA.ITEMS.torch.fuel;
  var prev = this.p.eq[slot];
  this.p.eq[slot] = item;
  if (prev) this.addItem(prev);
  this.msg('You are now using ' + DATA.displayName(item) + '.');
  this.computeVisible();
  return true;
};
Game.prototype.takeoffSlot = function (slot) {
  var it = this.p.eq[slot];
  if (!it) return false;
  if (this.p.inv.length >= INV_MAX && !this.stackable(it)) { this.msg('Your pack is full.'); return false; }
  this.p.eq[slot] = null;
  this.addItem(it);
  this.msg('You were using ' + DATA.displayName(it) + '.');
  this.computeVisible();
  return true;
};
Game.prototype.dropItem = function (idx) {
  if (this.itemIdxAt(this.p.x, this.p.y) >= 0) { this.msg('There is already something here.'); return false; }
  var it = this.removeOne(idx);
  this.level.items.push({ x: this.p.x, y: this.p.y, item: it, seen: true });
  this.msg('You drop ' + DATA.displayName(it) + '.');
  return true;
};
Game.prototype.heal = function (n) {
  this.p.hp = Math.min(this.p.maxhp, this.p.hp + n);
};
Game.prototype.quaffItem = function (idx) {
  var it = this.p.inv[idx], key = it.key, p = this.p;
  var known = DATA.isKnown(key);
  this.removeOne(idx);
  this.sfx('potion');
  switch (key) {
    case 'p_clw': this.heal(U.roll(3, 8)); p.timers.poison = Math.max(0, p.timers.poison - 10); this.msg('You feel better.'); break;
    case 'p_csw': this.heal(U.roll(6, 8)); p.timers.poison = 0; p.timers.blind = 0; this.msg('You feel much better.'); break;
    case 'p_heal': this.heal(U.roll(10, 10)); p.timers.poison = 0; p.timers.blind = 0; this.msg('You feel very good.'); break;
    case 'p_str': p.st.str = Math.min(25, p.st.str + 1); p.maxStr = Math.max(p.maxStr, p.st.str); this.msg('Wow! What bulging muscles!'); break;
    case 'p_rstr': p.st.str = p.maxStr; this.msg('You feel warm all over.'); break;
    case 'p_hero': this.heal(U.roll(2, 8)); p.timers.hero += U.ri(25, 50); this.msg('You feel like a hero!'); break;
    case 'p_speed': p.timers.haste += U.ri(20, 40); this.msg('You feel yourself moving faster!'); break;
    case 'p_poison': this.msg('You feel very sick!'); p.timers.poison += 15; this.damagePlayer(U.roll(3, 6), 'a potion of poison'); break;
    case 'p_blind': p.timers.blind += U.ri(20, 40); this.msg('You are covered by a veil of darkness!'); this.computeVisible(); break;
  }
  DATA.identify(key);
  if (!known && this.state === 'play') this.msg('(It was a Potion of ' + DATA.ITEMS[key].name + '.)');
  return true;
};
Game.prototype.readItem = function (idx) {
  var p = this.p;
  if (p.timers.blind > 0) { this.msg('You cannot see to read!'); return false; }
  var it = p.inv[idx], key = it.key;
  var known = DATA.isKnown(key);
  this.removeOne(idx);
  var l = this.level, x, y;
  switch (key) {
    case 's_map':
      for (y = 1; y < l.h - 1; y++) for (x = 1; x < l.w - 1; x++) {
        if (l.map[y][x] !== tiles().ROCK) {
          for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) {
            l.explored[y + dy][x + dx] = true;
          }
        }
      }
      this.msg('Knowledge of the maze flows into your mind!'); break;
    case 's_tele': this.msg('You are whisked away!'); this.teleportPlayer(); break;
    case 's_ident':
      p.inv.forEach(function (i2) { DATA.identify(i2.key); });
      this.msg('Your possessions reveal their true nature!'); break;
    case 's_enchw':
      if (p.eq.weapon) { p.eq.weapon.bonus = (p.eq.weapon.bonus || 0) + 1; this.msg('Your ' + p.eq.weapon.name + ' glows brightly!'); }
      else this.msg('Your hands glow briefly.');
      break;
    case 's_encha':
      if (p.eq.body) { p.eq.body.bonus = (p.eq.body.bonus || 0) + 1; this.msg('Your ' + p.eq.body.name + ' glows brightly!'); }
      else this.msg('Your skin tingles briefly.');
      break;
    case 's_light': this.lightArea(); break;
    case 's_aggr':
      this.level.monsters.forEach(function (m) { m.asleep = false; });
      this.msg('There is a high-pitched humming noise!'); break;
  }
  DATA.identify(key);
  if (!known) this.msg('(It was a Scroll of ' + DATA.ITEMS[key].name + '.)');
  return true;
};
Game.prototype.lightArea = function () {
  var room = this.roomAt(this.p.x, this.p.y);
  if (room) {
    room.lit = true;
  }
  this.msg('You are surrounded by a white light.');
  this.computeVisible();
};
Game.prototype.eatItem = function (idx) {
  var it = this.p.inv[idx];
  this.p.food = Math.min(6000, this.p.food + it.food);
  this.removeOne(idx);
  this.msg('That tasted good.');
  return true;
};
Game.prototype.refuel = function () {
  var lt = this.p.eq.light;
  if (!lt) { this.msg('You are not using a light source.'); return false; }
  if (lt.key !== 'lantern') { this.msg('Only a lantern can be refueled. Wield a fresh torch instead.'); return false; }
  for (var i = 0; i < this.p.inv.length; i++) {
    if (this.p.inv[i].kind === 'oil') {
      this.removeOne(i);
      lt.fuel = Math.min(lt.cap || 15000, lt.fuel + 7500);
      this.msg('You fill your lamp with oil.');
      return true;
    }
  }
  this.msg('You have no oil.');
  return false;
};
Game.prototype.rest = function () {
  var p = this.p, n = 0;
  while (n < 999) {
    if (p.hp >= p.maxhp && p.mana >= p.maxmana) break;
    if (p.food <= 100) break;
    if (this.visibleAwakeMonster()) break;
    this.passTurn();
    n++;
    if (this.state !== 'play') return;
  }
  if (n > 0) this.msg('You rest for ' + n + ' turns.');
  else this.msg('You feel no need to rest.');
};
Game.prototype.visibleAwakeMonster = function () {
  var ms = this.level.monsters;
  for (var i = 0; i < ms.length; i++) {
    var m = ms[i];
    if (!m.peaceful && !m.asleep && this.vis[m.x + ',' + m.y]) return true;
  }
  return false;
};
Game.prototype.search = function () {
  var found = false, p = this.p;
  var chance = 30 + p.lvl * 2 + (p.cls.name === 'Rogue' ? 25 : 0);
  for (var dy = -1; dy <= 1; dy++) {
    for (var dx = -1; dx <= 1; dx++) {
      var tr = this.trapAt(p.x + dx, p.y + dy);
      if (tr && !tr.found && U.rnd() * 100 < chance) {
        tr.found = true; found = true;
        this.msg('You have found a trap!');
      }
    }
  }
  if (!found) this.msg('You search the area.');
  return true;
};

// ---------------------------------------------------------------- magic
Game.prototype.openSpells = function () {
  if (!this.p.cls.spell) { this.msg('You know no magic.'); return; }
  this.ui = { mode: 'spell' };
};
Game.prototype.castSpell = function (sp) {
  var p = this.p;
  if (p.lvl < sp.lvl) { this.msg('You are not experienced enough to cast that.'); return false; }
  if (p.mana < sp.mana) { this.msg('You do not have enough mana.'); return false; }
  if (sp.dmg) {
    var m = this.nearestTarget(8);
    if (!m) { this.msg('You see nothing to aim at.'); return false; }
    p.mana -= sp.mana;
    this.msg('A bolt of energy strikes the ' + m.d.name + '!');
    this.sfx('hit');
    this.damageMonster(m, U.rollStr(sp.dmg));
    return true;
  }
  p.mana -= sp.mana;
  switch (sp.key) {
    case 'light': this.lightArea(); break;
    case 'phase':
      var l = this.level;
      for (var t = 0; t < 100; t++) {
        var nx = p.x + U.ri(-10, 10), ny = p.y + U.ri(-10, 10);
        if (this.walkable(this.tileAt(nx, ny)) && !this.monsterAt(nx, ny)) { p.x = nx; p.y = ny; break; }
      }
      this.msg('You blink away!');
      this.computeVisible(); break;
    case 'tele': this.msg('You are whisked away!'); this.teleportPlayer(); break;
    case 'clw': this.heal(U.roll(3, 8)); this.msg('You feel better.'); break;
    case 'csw': this.heal(U.roll(6, 8)); this.msg('You feel much better.'); break;
  }
  return true;
};
Game.prototype.nearestTarget = function (maxd) {
  var best = null, bestD = maxd + 1, p = this.p, ms = this.level.monsters;
  for (var i = 0; i < ms.length; i++) {
    var m = ms[i];
    if (m.peaceful) continue;
    if (!this.vis[m.x + ',' + m.y]) continue;
    var d = U.dist(m.x, m.y, p.x, p.y);
    if (d < bestD && this.los(p.x, p.y, m.x, m.y)) { best = m; bestD = d; }
  }
  return best;
};

// --------------------------------------------------------------- combat
Game.prototype.attackMonster = function (m) {
  var p = this.p;
  m.asleep = false;
  var w = p.eq.weapon;
  var chance = U.clamp(
    60 + p.lvl * 2 * p.cls.atk + this.strHit() * 4 +
    (w ? (w.bonus || 0) * 5 : 0) + (p.timers.hero > 0 ? 8 : 0) -
    (p.food <= 600 ? 5 : 0) - m.d.ac * 1.5,
    10, 95);
  if (U.rnd() * 100 < chance) {
    var dmg = (w ? U.rollStr(w.dmg) + (w.bonus || 0) : U.ri(1, 2)) + this.strDmg();
    this.msg('You hit the ' + m.d.name + '.');
    this.sfx('hit');
    this.damageMonster(m, dmg);
  } else {
    this.msg('You miss the ' + m.d.name + '.');
  }
  return true;
};
Game.prototype.damageMonster = function (m, dmg) {
  m.hp -= dmg;
  m.asleep = false;
  if (m.hp <= 0) this.killMonster(m);
};
Game.prototype.killMonster = function (m) {
  var ms = this.level.monsters;
  ms.splice(ms.indexOf(m), 1);
  this.msg('You have slain the ' + m.d.name + '!');
  this.p.exp += m.d.exp;
  this.checkLevelUp();
  if (m.d.flags.indexOf('boss') >= 0) {
    this.p.won = true;
    this.state = 'win';
    this.sfx('win');
    if (window.AudioSys && AudioSys.voice) AudioSys.voice();
  }
};
Game.prototype.checkLevelUp = function () {
  var p = this.p;
  while (p.exp >= this.expNeeded(p.lvl + 1) && p.lvl < 99) {
    p.lvl++;
    var gain = Math.max(1, U.ri(1, this.hitDie()) + this.conB());
    p.maxhp += gain; p.hp += gain;
    var nm = this.casterMana();
    p.mana += Math.max(0, nm - p.maxmana);
    p.maxmana = nm;
    this.msg('Welcome to level ' + p.lvl + '.');
    this.sfx('level');
  }
};
Game.prototype.damagePlayer = function (n, source) {
  if (this.state !== 'play') return;
  this.p.hp -= n;
  this.sfx('hurt');
  if (this.p.hp <= 0) this.die(source);
};

// --------------------------------------------------------- monster turns
Game.prototype.monstersAct = function () {
  var p = this.p, ms = this.level.monsters.slice();
  for (var i = 0; i < ms.length; i++) {
    var m = ms[i];
    if (m.hp <= 0) continue;
    var f = m.d.flags;
    var boss = f.indexOf('boss') >= 0;
    var d = U.dist(m.x, m.y, p.x, p.y);
    if (m.peaceful) {
      if (U.rnd() < 0.5) this.randomStep(m);
      continue;
    }
    if (m.asleep) {
      if (d <= 6 && U.rnd() < 0.25) m.asleep = false;
      else continue;
    }
    if (d <= 1) { this.monsterMelee(m); if (this.state !== 'play') return; continue; }
    if (f.indexOf('stationary') >= 0) continue;
    var seesMe = (d <= 14 || boss) && this.los(m.x, m.y, p.x, p.y);
    if ((f.indexOf('caster') >= 0 || f.indexOf('breath') >= 0) && seesMe && d <= 7 && U.rnd() < 0.35) {
      var isBreath = f.indexOf('breath') >= 0;
      this.msg('The ' + m.d.name + (isBreath ? ' breathes at you!' : ' casts a bolt at you!'));
      if (U.rnd() * 100 < 75 - this.dexB() * 5) {
        this.damagePlayer(U.rollStr(m.d.rdmg), 'the ' + m.d.name);
        if (this.state !== 'play') return;
      } else {
        this.msg('It misses you.');
      }
      continue;
    }
    if (seesMe || boss) this.stepToward(m);
    else if (U.rnd() < 0.5) this.randomStep(m);
  }
};
Game.prototype.stepToward = function (m) {
  var p = this.p;
  var dx = Math.sign(p.x - m.x), dy = Math.sign(p.y - m.y);
  var opts = [[dx, dy], [dx, 0], [0, dy]];
  for (var i = 0; i < opts.length; i++) {
    var nx = m.x + opts[i][0], ny = m.y + opts[i][1];
    if (opts[i][0] === 0 && opts[i][1] === 0) continue;
    if (nx === p.x && ny === p.y) continue;
    if (!this.walkable(this.tileAt(nx, ny))) continue;
    if (this.monsterAt(nx, ny)) continue;
    m.x = nx; m.y = ny;
    return;
  }
};
Game.prototype.randomStep = function (m) {
  var dx = U.ri(-1, 1), dy = U.ri(-1, 1);
  if (!dx && !dy) return;
  var nx = m.x + dx, ny = m.y + dy;
  if (nx === this.p.x && ny === this.p.y) return;
  if (!this.walkable(this.tileAt(nx, ny))) return;
  if (this.monsterAt(nx, ny)) return;
  m.x = nx; m.y = ny;
};
Game.prototype.monsterMelee = function (m) {
  var p = this.p, f = m.d.flags;
  var chance = U.clamp(40 + m.d.lvl * 3 - this.playerAC() * 1.8, 5, 95);
  if (U.rnd() * 100 >= chance) {
    this.msg('The ' + m.d.name + ' misses you.');
    return;
  }
  this.msg('The ' + m.d.name + ' ' + m.d.verb + ' you!');
  if (f.indexOf('steal') >= 0 && p.gold > 0 && U.rnd() < 0.7) {
    var amt = Math.min(p.gold, U.ri(20, 200) + Math.floor(p.gold * 0.1));
    p.gold -= amt;
    this.msg('Your purse feels lighter! The ' + m.d.name + ' flees laughing.');
    var ms = this.level.monsters;
    ms.splice(ms.indexOf(m), 1);
    return;
  }
  if (f.indexOf('poison') >= 0 && U.rnd() < 0.5) {
    p.timers.poison += U.ri(3, 8);
    this.msg('You feel poison coursing through your veins!');
  }
  if (f.indexOf('paralyze') >= 0 && p.timers.para === 0 && U.rnd() < 0.4) {
    p.timers.para = U.ri(2, 4);
    this.msg('You are paralyzed!');
  }
  if (f.indexOf('drain') >= 0 && U.rnd() < 0.3) {
    p.exp = Math.max(0, p.exp - (50 + this.depth * 15));
    this.msg('You feel your life force draining away!');
  }
  if (f.indexOf('drainstr') >= 0 && U.rnd() < 0.5 && p.st.str > 3) {
    p.st.str--;
    this.msg('You feel weaker.');
  }
  var art = m.d.flags.indexOf('boss') >= 0 ? '' : 'a ';
  this.damagePlayer(U.rollStr(m.d.dmg), art + m.d.name);
};

// ----------------------------------------------------------- turn upkeep
Game.prototype.passTurn = function () {
  var p = this.p;
  this.turn++;

  p.food--;
  if (p.food <= 0) {
    p.food = 0;
    if (this.turn % 5 === 0) this.msg('You are starving!');
    this.damagePlayer(1, 'starvation');
    if (this.state !== 'play') return;
  }
  var lt = p.eq.light;
  if (lt && isFinite(lt.fuel)) {
    lt.fuel--;
    if (lt.fuel === 100) this.msg('Your light is growing faint!');
    if (lt.fuel <= 0) {
      if (lt.key === 'torch') {
        p.eq.light = null;
        this.msg('Your torch has burnt out!');
      } else {
        lt.fuel = 0;
        this.msg('Your lamp has run out of oil!');
      }
      this.computeVisible();
    }
  }
  var tm = p.timers;
  if (tm.poison > 0) {
    tm.poison--;
    this.damagePlayer(1, 'poison');
    if (this.state !== 'play') return;
  }
  if (tm.blind > 0) { tm.blind--; if (tm.blind === 0) { this.msg('You can see again.'); } }
  if (tm.para > 0) tm.para--;
  if (tm.haste > 0) { tm.haste--; if (tm.haste === 0) this.msg('You feel yourself slow down.'); }
  if (tm.hero > 0) tm.hero--;

  p.regen += p.lvl + 8 + this.conB() * 4;
  if (p.regen >= 160) { p.regen -= 160; if (p.hp < p.maxhp) p.hp++; }
  if (p.maxmana > 0) {
    p.mregen += 10 + p.lvl;
    if (p.mregen >= 140) { p.mregen -= 140; if (p.mana < p.maxmana) p.mana++; }
  }

  var skipMonsters = false;
  if (tm.haste > 0) {
    this.hasteFlip ^= 1;
    if (this.hasteFlip === 1) skipMonsters = true;
  }
  if (!skipMonsters) {
    this.monstersAct();
    if (this.state !== 'play' && this.state !== 'win') return;
  }
  if (!this.level.isTown && U.rnd() < 1 / 120 && this.level.monsters.length < 25) {
    var s = Dungeon.randomFloor(this.level);
    if (U.dist(s.x, s.y, p.x, p.y) > 10 && !this.monsterAt(s.x, s.y)) {
      this.level.monsters.push(this.makeMonster(DATA.randomMonster(this.depth), s.x, s.y, false));
    }
  }
  if (window.AudioSys && AudioSys.voice && U.rnd() < 1 / 2500) AudioSys.voice();
  this.computeVisible();
};

// ---------------------------------------------------------------- stores
Game.prototype.enterStore = function (i) {
  this.storeIdx = i;
  this.storeUI = null;
  this.state = 'store';
  this.msgQ = [];
  this.msg('Welcome to the ' + DATA.STORES[i].name + '!');
};
Game.prototype.chrFactor = function () {
  return U.clamp(1.32 - this.p.st.chr * 0.02, 0.85, 1.3);
};
Game.prototype.buyPrice = function (key) {
  return Math.max(1, Math.round(DATA.ITEMS[key].price * this.chrFactor()));
};
Game.prototype.sellPrice = function (it) {
  return Math.max(1, Math.floor((it.price || 1) * 0.4) + (it.bonus || 0) * 50);
};
Game.prototype.storeKey = function (k) {
  var st = DATA.STORES[this.storeIdx];
  if (k === 'Escape' || (k === 'q' && !this.storeUI)) {
    if (this.storeUI) { this.storeUI = null; return; }
    this.state = 'play';
    this.msgQ = [];
    return;
  }
  var i = 'abcdefghijklmnopqrstuv'.indexOf(k);
  if (this.storeUI === 'buy') {
    if (i >= 0 && i < st.stock.length) {
      this.msgQ = [];
      var key = st.stock[i], price = this.buyPrice(key);
      if (this.p.gold < price) { this.msg('You do not have enough gold.'); }
      else {
        var it = DATA.makeItem(key);
        if (!this.addItem(it)) { this.msg('You cannot carry any more.'); }
        else {
          this.p.gold -= price;
          DATA.identify(key);
          this.msg('You bought ' + DATA.displayName(it) + ' for ' + price + ' gold.');
          this.sfx('gold');
        }
      }
      this.storeUI = null;
    }
    return;
  }
  if (this.storeUI === 'sell') {
    if (i >= 0 && i < this.sellList.length) {
      this.msgQ = [];
      var idx = this.sellList[i];
      var sit = this.p.inv[idx];
      var val = this.sellPrice(sit);
      this.removeOne(idx);
      this.p.gold += val;
      this.msg('You sold ' + sit.name + ' for ' + val + ' gold.');
      this.sfx('gold');
      this.storeUI = null;
    }
    return;
  }
  if (k === 'p' || k === 'b') { this.msgQ = []; this.storeUI = 'buy'; }
  if (k === 's') {
    this.msgQ = [];
    this.sellList = [];
    for (var j = 0; j < this.p.inv.length; j++) {
      if (st.sellKinds.indexOf(this.p.inv[j].kind) >= 0) this.sellList.push(j);
    }
    if (!this.sellList.length) { this.msg('You have nothing this store wants.'); return; }
    this.storeUI = 'sell';
  }
};

// ================================================================ DRAWING
Game.prototype.render = function () {
  // screen colour: classic phosphor, or tinted by remaining lives
  var ph = SETTINGS.phosphor;
  if (SETTINGS.lifeColors && this.p) {
    if (this.p.lives === 2) ph = 'purple';
    else if (this.p.lives <= 1) ph = 'red';
  }
  this.term.phosphor = ph;
  this.term.theme = SETTINGS.theme;

  this.term.clear();
  switch (this.state) {
    case 'title': this.drawTitle(); break;
    case 'chargen': this.drawCharGen(); break;
    case 'play': this.drawPlay(); break;
    case 'win': this.drawPlay(); this.drawWin(); break;
    case 'store': this.drawStore(); break;
    case 'menu':
      if (this.menuReturn === 'play') this.drawPlay();
      this.drawMenu(); break;
    case 'help': this.drawHelp(); break;
    case 'lostlife': this.drawLostLife(); break;
    case 'dead': this.drawTomb(); break;
  }
};
Game.prototype.drawTitle = function () {
  var t = this.term;
  var banner = [
    ' _   _ __  __  ___  ____  ___    _    ',
    '| | | |  \\/  |/ _ \\|  _ \\|_ _|  / \\   ',
    '| | | | |\\/| | | | | |_) || |  / _ \\  ',
    '| |_| | |  | | |_| |  _ < | | / ___ \\ ',
    ' \\___/|_|  |_|\\___/|_| \\_\\___/_/   \\_\\'
  ];
  for (var i = 0; i < banner.length; i++) t.center(3 + i, banner[i]);
  t.center(10, 'The Dungeons of Moria');
  t.center(12, 'Based on Moria (1983) by Robert A. Koeneke', true);
  t.center(13, 'and Umoria by Jim E. Wilson', true);
  t.center(16, 'Slay the Balrog that lurks 2500 feet below the town.');
  t.center(17, 'You have three lives. Use them wisely.', true);
  if (this.blinkOn) t.center(19, '*** PRESS SPACE TO ENTER THE MINES ***');
  if (this.mellon) t.center(21, 'The Doors of Durin swing open for you, friend.');
  else t.center(21, 'pedo mellon a minno', true);
  t.center(23, 'ESC options   ? help & keys   F11 fullscreen', true);
};
Game.prototype.drawCharGen = function () {
  var t = this.term, cg = this.cg, i, y;
  t.center(1, '=== CHARACTER CREATION ===');
  if (cg.race) t.str(4, 3, 'Race  : ' + cg.race.name);
  if (cg.sex) t.str(4, 4, 'Sex   : ' + cg.sex);
  if (cg.cls) t.str(4, 5, 'Class : ' + cg.cls.name);
  switch (cg.step) {
    case 'race':
      t.str(4, 8, 'Choose a race:');
      for (i = 0; i < DATA.RACES.length; i++) {
        t.str(8, 10 + i, String.fromCharCode(97 + i) + ') ' + DATA.RACES[i].name);
      }
      break;
    case 'sex':
      t.str(4, 8, 'Choose thy sex:');
      t.str(8, 10, 'm) Male');
      t.str(8, 11, 'f) Female');
      break;
    case 'class':
      t.str(4, 8, 'Choose a class:');
      for (i = 0; i < DATA.CLASSES.length; i++) {
        t.str(8, 10 + i, String.fromCharCode(97 + i) + ') ' + DATA.CLASSES[i].name);
      }
      break;
    case 'stats':
      t.str(4, 8, 'Thy attributes:');
      var names = ['STR', 'INT', 'WIS', 'DEX', 'CON', 'CHR'];
      var keys = ['str', 'int', 'wis', 'dex', 'con', 'chr'];
      for (i = 0; i < 6; i++) {
        t.str(8, 10 + i, names[i] + ' : ' + U.pad(cg.st[keys[i]], 2));
      }
      t.str(4, 18, 'r) reroll    ENTER) accept');
      break;
    case 'name':
      t.str(4, 8, 'Enter thy name:');
      t.str(8, 10, cg.name + (this.blinkOn ? '_' : ' '));
      t.str(4, 18, 'ENTER) begin thy quest');
      break;
  }
};
Game.prototype.tileChar = function (tv) {
  var T = tiles();
  if (tv >= T.STORE) return String(tv - T.STORE + 1);
  switch (tv) {
    case T.ROCK: return '#';
    case T.FLOOR: case T.CORR: return '.';
    case T.DOORC: return '+';
    case T.DOORO: return "'";
    case T.UP: return '<';
    case T.DOWN: return '>';
  }
  return ' ';
};
Game.prototype.drawPlay = function () {
  var t = this.term, p = this.p, l = this.level;
  t.str(0, 0, this.msgQ.join(' ').slice(0, 80));

  this.drawSidebar();

  var cx = U.clamp(p.x - Math.floor(MAP_W / 2), 0, Math.max(0, l.w - MAP_W));
  var cy = U.clamp(p.y - Math.floor(MAP_H / 2), 0, Math.max(0, l.h - MAP_H));

  var mDict = {}, i;
  for (i = 0; i < l.monsters.length; i++) {
    var m = l.monsters[i];
    mDict[m.x + ',' + m.y] = m;
  }
  var iDict = {};
  for (i = 0; i < l.items.length; i++) {
    var en = l.items[i];
    if (en.seen) iDict[en.x + ',' + en.y] = en;
  }
  var tDict = {};
  for (i = 0; i < l.traps.length; i++) {
    var tr = l.traps[i];
    if (tr.found) tDict[tr.x + ',' + tr.y] = tr;
  }

  for (var vy = 0; vy < MAP_H; vy++) {
    for (var vx = 0; vx < MAP_W; vx++) {
      var wx = cx + vx, wy = cy + vy;
      if (wx >= l.w || wy >= l.h) continue;
      var key = wx + ',' + wy;
      var isVis = !!this.vis[key];
      if (!isVis && !l.explored[wy][wx]) continue;
      var ch = this.tileChar(l.map[wy][wx]);
      var dim = !isVis;
      if (tDict[key]) ch = '^';
      if (iDict[key]) ch = DATA.itemChar(iDict[key].item);
      if (isVis && mDict[key]) { ch = mDict[key].d.ch; dim = false; }
      if (wx === p.x && wy === p.y) { ch = '@'; dim = false; }
      t.put(MAP_X + vx, MAP_Y + vy, ch, dim);
    }
  }

  var flags = [];
  if (p.food <= 0) flags.push('Starving!');
  else if (p.food <= 600) flags.push('Weak');
  else if (p.food <= 1500) flags.push('Hungry');
  if (p.timers.poison > 0) flags.push('Poisoned');
  if (p.timers.blind > 0) flags.push('Blind');
  if (p.timers.para > 0) flags.push('Paralyzed');
  if (p.timers.haste > 0) flags.push('Fast');
  if (p.timers.hero > 0) flags.push('Hero');
  t.str(0, 23, flags.join(' '));
  var dstr = this.depth === 0 ? 'Town' : (this.depth * 50) + ' feet';
  t.str(80 - dstr.length - 1, 23, dstr);

  if (this.ui) this.drawOverlay();
};
Game.prototype.drawSidebar = function () {
  var t = this.term, p = this.p;
  t.str(0, 1, p.name.slice(0, 13));
  t.str(0, 2, p.race.name, true);
  t.str(0, 3, p.cls.name, true);
  var names = ['STR', 'INT', 'WIS', 'DEX', 'CON', 'CHR'];
  var keys = ['str', 'int', 'wis', 'dex', 'con', 'chr'];
  for (var i = 0; i < 6; i++) {
    t.str(0, 5 + i, names[i] + ' : ' + U.pad(p.st[keys[i]], 2));
  }
  t.str(0, 12, 'LEV : ' + U.pad(p.lvl, 5));
  t.str(0, 13, 'EXP : ' + U.pad(p.exp, 5));
  t.str(0, 14, 'HP  : ' + p.hp + '/' + p.maxhp);
  if (p.maxmana > 0) t.str(0, 15, 'MANA: ' + p.mana + '/' + p.maxmana);
  t.str(0, 16, 'AC  : ' + U.pad(this.playerAC(), 5));
  t.str(0, 17, 'AU  : ' + U.pad(p.gold, 5));
  var lt = p.eq.light;
  if (lt && isFinite(lt.fuel)) t.str(0, 19, 'Fuel: ' + U.pad(lt.fuel, 5), lt.fuel < 300 ? false : true);
  else if (lt) t.str(0, 19, 'Fuel: *****', true);
  t.str(0, 20, 'LIVES : ' + p.lives);
  if (p.won) t.str(0, 22, '*WINNER*');
};
Game.prototype.panel = function (x0, y0, w, h, title) {
  var t = this.term, x, y;
  for (y = y0; y < y0 + h; y++) for (x = x0; x < x0 + w; x++) t.put(x, y, ' ');
  for (x = x0; x < x0 + w; x++) { t.put(x, y0, '-'); t.put(x, y0 + h - 1, '-'); }
  for (y = y0; y < y0 + h; y++) { t.put(x0, y, '|'); t.put(x0 + w - 1, y, '|'); }
  t.put(x0, y0, '+'); t.put(x0 + w - 1, y0, '+');
  t.put(x0, y0 + h - 1, '+'); t.put(x0 + w - 1, y0 + h - 1, '+');
  if (title) t.str(x0 + 2, y0, ' ' + title + ' ');
};
Game.prototype.drawOverlay = function () {
  var t = this.term, ui = this.ui, p = this.p, y, i;
  var x0 = 26, w = 53;
  if (ui.mode === 'inv') {
    this.panel(x0, 1, w, 22, 'Inventory  (' + p.inv.length + '/' + INV_MAX + ')');
    y = 2;
    t.str(x0 + 2, y++, 'Using:', true);
    var slots = ['weapon', 'body', 'shield', 'helm', 'light'];
    for (i = 0; i < slots.length; i++) {
      if (p.eq[slots[i]]) {
        t.str(x0 + 3, y++, (slots[i] + '     ').slice(0, 7) + DATA.displayName(p.eq[slots[i]]).slice(0, 42));
      }
    }
    y++;
    t.str(x0 + 2, y++, 'Carrying:', true);
    for (i = 0; i < p.inv.length && y < 22; i++) {
      t.str(x0 + 3, y++, String.fromCharCode(97 + i) + ') ' + DATA.displayName(p.inv[i]).slice(0, 45));
    }
    t.str(x0 + 2, 22, 'ESC to close', true);
  } else if (ui.mode === 'pick') {
    var h = Math.min(20, ui.list.length + 4);
    this.panel(x0, 1, w, h, ui.title);
    y = 3;
    for (i = 0; i < ui.list.length && y < 1 + h - 1; i++) {
      t.str(x0 + 3, y++, String.fromCharCode(97 + i) + ') ' + DATA.displayName(p.inv[ui.list[i]]).slice(0, 45));
    }
  } else if (ui.mode === 'takeoff') {
    var sl = this.equippedSlots();
    this.panel(x0, 1, w, sl.length + 4, 'Take off what?');
    y = 3;
    for (i = 0; i < sl.length; i++) {
      t.str(x0 + 3, y++, String.fromCharCode(97 + i) + ') ' + DATA.displayName(p.eq[sl[i]]).slice(0, 45));
    }
  } else if (ui.mode === 'spell') {
    var sps = DATA.SPELLS[p.cls.name] || [];
    this.panel(x0, 1, w, sps.length + 4, 'Cast which spell?');
    y = 3;
    for (i = 0; i < sps.length; i++) {
      var sp = sps[i];
      var locked = p.lvl < sp.lvl;
      t.str(x0 + 3, y++, String.fromCharCode(97 + i) + ') ' + sp.name +
        '  (mana ' + sp.mana + ', lvl ' + sp.lvl + ')', locked);
    }
  } else if (ui.mode === 'equip') {
    var sl2 = this.equippedSlots();
    this.panel(x0, 1, w, Math.max(6, sl2.length + 5), 'Equipment');
    y = 3;
    if (!sl2.length) t.str(x0 + 3, y, 'You are using nothing at all.');
    for (i = 0; i < sl2.length; i++) {
      t.str(x0 + 3, y++, (sl2[i] + '       ').slice(0, 8) + DATA.displayName(p.eq[sl2[i]]).slice(0, 40));
    }
  } else if (ui.mode === 'char') {
    this.drawCharSheet();
  } else if (ui.mode === 'map') {
    this.drawMap();
  } else if (ui.mode === 'look') {
    var n = Math.min(16, ui.list.length);
    this.panel(x0, 1, w, n + 4, 'You can see:');
    for (i = 0; i < n; i++) t.str(x0 + 3, 3 + i, ui.list[i].slice(0, 46));
  } else if (ui.mode === 'dir') {
    this.panel(20, 10, 40, 3, '');
    t.str(22, 11, ui.title);
  } else if (ui.mode === 'help') {
    this.drawHelp();
  }
};
Game.prototype.drawHelp = function () {
  var t = this.term;
  this.panel(6, 0, 68, 24, 'Commands  (' +
    (SETTINGS.keys === 'original' ? 'original Umoria keys' : 'rogue-like keys') + ')');
  var L;
  if (SETTINGS.keys === 'original') {
    L = [
      'MOVE     arrows or number keys (numpad):  7 8 9',
      '                                          4   6',
      '                                          1 2 3',
      '5 or .   wait one turn',
      '>  <     descend / ascend stairs   M  map of the level',
      'L        locate yourself           l  look around',
      'o  c     open / close a door       s  search for traps',
      'i        inventory                 e  equipment list',
      'w        wear / wield              t  take something off',
      'g or ,   pick up                   d  drop',
      'q        quaff potion              r  read scroll',
      'E        eat food                  F  fill lamp with oil',
      'm        cast magic spell (Mage)   p  pray (Priest)',
      'R        rest                      C  character sheet',
      '=  ESC   options menu              ?  this help',
      '',
      'F2 phosphor  F3 display mode  F4 music  F11 fullscreen',
      'Walk into a numbered town door to enter a store.',
      'Your torch burns down -- buy spares. Eat or starve.',
      'The Balrog waits at 2500 feet. Good luck.'
    ];
  } else {
    L = [
      'MOVE     hjkl, diagonals yubn, arrows or numpad',
      '5 or .   wait one turn',
      '>  <     descend / ascend stairs   M  map of the level',
      'L        locate yourself           x  look around',
      'o  c     open / close a door       s  search for traps',
      'i        inventory                 e  equipment list',
      'w        wear / wield              t  take something off',
      'g or ,   pick up                   d  drop',
      'q        quaff potion              r  read scroll',
      'E        eat food                  F  fill lamp with oil',
      'm        cast magic spell (Mage)   p  pray (Priest)',
      'R        rest                      C  character sheet',
      '=  ESC   options menu              ?  this help',
      '',
      'F2 phosphor  F3 display mode  F4 music  F11 fullscreen',
      'Walk into a numbered town door to enter a store.',
      'Your torch burns down -- buy spares. Eat or starve.',
      'The Balrog waits at 2500 feet. Good luck.'
    ];
  }
  for (var i = 0; i < L.length; i++) t.str(8, 2 + i, L[i]);
};
Game.prototype.drawCharSheet = function () {
  var t = this.term, p = this.p;
  this.panel(14, 1, 52, 22, 'Character');
  var y = 3, x = 17;
  t.str(x, y++, p.name + ', ' + p.sex + ' ' + p.race.name + ' ' + p.cls.name);
  y++;
  var names = ['STR', 'INT', 'WIS', 'DEX', 'CON', 'CHR'];
  var keys = ['str', 'int', 'wis', 'dex', 'con', 'chr'];
  for (var i = 0; i < 6; i++) t.str(x, y++, names[i] + ' : ' + U.pad(p.st[keys[i]], 3));
  y++;
  t.str(x, y++, 'Level      : ' + p.lvl + '   (next at ' + this.expNeeded(p.lvl + 1) + ' exp)');
  t.str(x, y++, 'Experience : ' + p.exp);
  t.str(x, y++, 'Hit points : ' + p.hp + ' / ' + p.maxhp);
  if (p.maxmana > 0) t.str(x, y++, 'Mana       : ' + p.mana + ' / ' + p.maxmana);
  t.str(x, y++, 'Armour     : ' + this.playerAC());
  t.str(x, y++, 'Gold       : ' + p.gold);
  t.str(x, y++, 'Weapon     : ' + (p.eq.weapon ? DATA.displayName(p.eq.weapon) : 'bare hands'));
  t.str(x, y++, 'Deepest    : ' + (p.maxDepth * 50) + ' feet');
  t.str(x, y++, 'Lives left : ' + p.lives);
};
Game.prototype.drawMap = function () {
  var t = this.term, l = this.level, p = this.p;
  t.clear();
  var title = this.depth === 0 ? 'Map of the town' : 'Map of the level (' + this.depth * 50 + ' feet)';
  t.center(0, '=== ' + title + ' ===');
  // scale the level down to fit the 67x22 view (dungeon levels are 132x44)
  var sx = Math.max(1, Math.ceil(l.w / MAP_W)), sy = Math.max(1, Math.ceil(l.h / MAP_H));
  var T = tiles();
  for (var my = 0; my < Math.ceil(l.h / sy); my++) {
    for (var mx = 0; mx < Math.ceil(l.w / sx); mx++) {
      var best = -1, bestPr = -1;
      for (var oy = 0; oy < sy; oy++) {
        for (var ox = 0; ox < sx; ox++) {
          var wx = mx * sx + ox, wy = my * sy + oy;
          if (wx >= l.w || wy >= l.h || !l.explored[wy][wx]) continue;
          var tv = l.map[wy][wx], pr;
          if (tv === T.UP || tv === T.DOWN) pr = 5;
          else if (tv >= T.STORE) pr = 5;
          else if (tv === T.DOORC || tv === T.DOORO) pr = 3;
          else if (tv === T.FLOOR || tv === T.CORR) pr = 2;
          else pr = 1;
          if (pr > bestPr) { bestPr = pr; best = tv; }
        }
      }
      if (bestPr < 0) continue;
      t.put(7 + mx, 1 + my, this.tileChar(best), bestPr < 3);
    }
  }
  t.put(7 + Math.floor(p.x / sx), 1 + Math.floor(p.y / sy), '@');
  t.center(23, 'You are at @ -- press any key to continue', true);
};
Game.prototype.drawStore = function () {
  var t = this.term, st = DATA.STORES[this.storeIdx], p = this.p, i;
  t.str(0, 0, this.msgQ.join(' ').slice(0, 80));
  t.center(2, '=== ' + st.name.toUpperCase() + ' ===');
  t.str(4, 4, 'Gold remaining: ' + p.gold);
  if (this.storeUI === 'sell') {
    t.str(4, 6, 'Sell which item?');
    for (i = 0; i < this.sellList.length && i < 14; i++) {
      var sit = p.inv[this.sellList[i]];
      t.str(6, 8 + i, String.fromCharCode(97 + i) + ') ' +
        DATA.displayName(sit).slice(0, 40) + ' ... ' + this.sellPrice(sit) + ' au');
    }
    t.str(4, 23, 'ESC) back');
  } else {
    for (i = 0; i < st.stock.length; i++) {
      var key = st.stock[i], tm = DATA.ITEMS[key];
      var label = tm.kind === 'potion' ? 'Potion of ' + tm.name :
                  tm.kind === 'scroll' ? 'Scroll of ' + tm.name : tm.name;
      var dots = new Array(Math.max(2, 42 - label.length)).join('.');
      t.str(6, 7 + i, String.fromCharCode(97 + i) + ') ' + label + ' ' + dots + ' ' +
        U.pad(this.buyPrice(key), 5) + ' au', this.storeUI !== 'buy');
    }
    if (this.storeUI === 'buy') t.str(4, 21, 'Purchase which item? (ESC to cancel)');
    else t.str(4, 21, 'p) purchase   s) sell   ESC) leave the store');
  }
};
Game.prototype.drawLostLife = function () {
  var t = this.term, p = this.p;
  t.center(4, 'Y O U   H A V E   D I E D');
  t.center(7, 'Slain by ' + this.deathCause + '.');
  t.center(10, 'But the Fates are not yet done with you...');
  t.center(11, 'Temple acolytes drag your body back to the town square.');
  t.center(13, 'All your gold and goods are gone. You keep only', true);
  t.center(14, 'a dagger, a small shield, some torches and a little food.', true);
  t.center(17, 'Lives remaining: ' + p.lives);
  if (this.blinkOn) t.center(20, '*** PRESS SPACE TO CARRY ON ***');
};
Game.prototype.drawTomb = function () {
  var t = this.term, p = this.p;
  var date = new Date();
  var dstr = date.getFullYear() + '-' + (date.getMonth() + 101 + '').slice(1) + '-' + (date.getDate() + 100 + '').slice(1);
  var lines = [
    '           ________________________',
    '          /                        \\',
    '         /                          \\',
    '        /      REST IN PEACE         \\',
    '       /                              \\',
    '       |                              |',
    '       |' + ctr(p.name, 30) + '|',
    '       |' + ctr('the ' + p.cls.name + ' (Level ' + p.lvl + ')', 30) + '|',
    '       |                              |',
    '       |' + ctr('Killed by', 30) + '|',
    '       |' + ctr(this.deathCause, 30) + '|',
    '       |' + ctr(dstr, 30) + '|',
    '       |                              |',
    '      *|     *      *      *         |*',
    '  ____)/\\\\_//(\\/(/\\)/\\//\\/|_)_______'
  ];
  function ctr(s, w) {
    s = String(s).slice(0, w);
    var l = Math.floor((w - s.length) / 2);
    return new Array(l + 1).join(' ') + s + new Array(w - s.length - l + 1).join(' ');
  }
  for (var i = 0; i < lines.length; i++) t.center(2 + i, lines[i]);
  t.center(18, 'EXP: ' + p.exp + '   AU: ' + p.gold + '   Deepest: ' + (p.maxDepth * 50) + ' feet');
  if (this.blinkOn) t.center(21, '*** PRESS SPACE FOR A NEW ADVENTURE ***');
};
Game.prototype.drawWin = function () {
  var t = this.term;
  this.panel(15, 7, 50, 9, '');
  t.center(9, '*** CONGRATULATIONS ***');
  t.center(11, 'You have slain the Balrog of Moria!');
  t.center(12, 'Your name shall be sung in the halls of Durin.');
  t.center(14, 'Press any key to keep exploring.');
};
