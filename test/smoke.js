// smoke.js -- node-based fuzz test: drives the game logic with random input
// to catch runtime errors. Run: node test/smoke.js
var fs = require('fs'), path = require('path');
var root = path.join(__dirname, '..');

global.window = global; // game guards window.AudioSys, which stays undefined
global.Terminal = { CYCLE: ['amber', 'green', 'white'] }; // menu cycles phosphors
['util', 'settings', 'data', 'dungeon', 'game'].forEach(function (f) {
  eval.call(global, fs.readFileSync(path.join(root, 'js', f + '.js'), 'utf8'));
});

var fakeTerm = { put: function () {}, str: function () {}, center: function () {}, clear: function () {} };
function key(g, k) { g.handleKey({ key: k }); g.render(); }

var g = new Game(fakeTerm);
g.render();

// title -> easter egg -> chargen
'mellon'.split('').forEach(function (c) { key(g, c); });
if (!g.mellon) throw new Error('mellon easter egg did not trigger');
key(g, ' ');
key(g, 'a'); // Human
key(g, 'm');
key(g, 'a'); // Warrior
key(g, 'r'); // reroll once
key(g, 'Enter');
'Test'.split('').forEach(function (c) { key(g, c); });
key(g, 'Enter');
if (g.state !== 'play') throw new Error('expected play state, got ' + g.state);
if (!g.p.inv.some(function (i) { return i.key === 'phial'; })) throw new Error('phial missing');

// random-input fuzz across all commands, in both key binding modes
var keys = ['h', 'j', 'k', 'l', 'y', 'u', 'b', 'n', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  '.', '5', '1', '2', '3', '4', '6', '7', '8', '9', '>', '<', 'g', ',', 'i', 'w', 't', 'd',
  'q', 'r', 'E', 'F', 'm', 'p', 'R', 's', 'x', 'o', 'c', 'e', 'M', 'L', 'C', '?', '=',
  'a', 'f', 'Escape', ' ', 'Enter'];
for (var i = 0; i < 30000; i++) {
  if (i === 15000) { SETTINGS.keys = 'roguelike'; }
  key(g, keys[Math.floor(Math.random() * keys.length)]);
  if (g.state === 'dead') { key(g, ' '); key(g, ' '); break; }
}
SETTINGS.keys = 'original';
console.log('fuzz done. state=' + g.state + ' turn=' + g.turn +
  (g.p ? ' depth=' + g.depth + ' hp=' + g.p.hp + ' lives=' + g.p.lives : ''));

// directed deep-dive: force the player down the stairs many times
if (g.state !== 'play') {
  // restart cleanly if fuzz ended the run
  g = new Game(fakeTerm);
  key(g, ' '); key(g, 'a'); key(g, 'm'); key(g, 'a'); key(g, 'Enter');
  key(g, 'X'); key(g, 'Enter');
}
var T = Dungeon.T;
for (var d = 1; d <= 50; d++) {
  // teleport player onto a down staircase and descend
  var found = null;
  for (var y = 0; y < g.level.h && !found; y++) {
    for (var x = 0; x < g.level.w && !found; x++) {
      if (g.level.map[y][x] === T.DOWN) found = { x: x, y: y };
    }
  }
  if (!found) throw new Error('no down stairs on depth ' + g.depth);
  g.p.x = found.x; g.p.y = found.y;
  g.p.hp = 9999; g.p.maxhp = 9999; g.p.food = 5000; // survive the trip
  if (g.ui) key(g, 'Escape'); // close any overlay left open by the walk
  key(g, '>');
  for (var s = 0; s < 30; s++) key(g, ['h', 'j', 'k', 'l', '.'][Math.floor(Math.random() * 5)]);
  if (g.state !== 'play' && g.state !== 'win') throw new Error('state ' + g.state + ' at depth ' + g.depth);
}
console.log('descent to depth ' + g.depth + ' ok. monsters=' + g.level.monsters.length);

// lives system: die twice, then for good
g.p.hp = 1; g.p.maxhp = 20; g.p.lives = 3;
g.die('a test harness');
if (g.state !== 'lostlife') throw new Error('expected lostlife, got ' + g.state);
key(g, ' ');
if (g.state !== 'play' || g.depth !== 0) throw new Error('respawn failed');
if (!g.p.eq.weapon || g.p.eq.weapon.key !== 'dagger') throw new Error('respawn kit wrong: no dagger');
if (!g.p.eq.shield || g.p.eq.shield.key !== 'smshield') throw new Error('respawn kit wrong: no shield');
if (g.p.gold !== 0) throw new Error('respawn kept gold');
g.die('a test harness');
key(g, ' ');
g.die('a test harness');
if (g.state !== 'dead') throw new Error('expected dead after third death, got ' + g.state);
g.render();
key(g, ' ');
if (g.state !== 'title') throw new Error('expected title after tombstone');

console.log('ALL SMOKE TESTS PASSED');
