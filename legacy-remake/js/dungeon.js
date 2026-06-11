// dungeon.js -- level generation: rooms-and-corridors dungeon plus the town
var Dungeon = (function () {

  var T = {
    ROCK: 0, FLOOR: 1, CORR: 2, DOORC: 3, DOORO: 4, UP: 5, DOWN: 6,
    STORE: 10 // store doors are STORE+0 .. STORE+5
  };

  function makeLevel(w, h, fill) {
    var map = [], explored = [];
    for (var y = 0; y < h; y++) {
      map.push(new Array(w).fill(fill));
      explored.push(new Array(w).fill(false));
    }
    return {
      w: w, h: h, map: map, explored: explored,
      rooms: [], traps: [], items: [], monsters: [],
      depth: 0, isTown: false
    };
  }

  function carveRoom(lvl, x, y, w, h, lit) {
    for (var yy = y; yy < y + h; yy++) {
      for (var xx = x; xx < x + w; xx++) lvl.map[yy][xx] = T.FLOOR;
    }
    lvl.rooms.push({ x: x, y: y, w: w, h: h, lit: lit });
  }

  function overlaps(lvl, x, y, w, h, gap) {
    for (var i = 0; i < lvl.rooms.length; i++) {
      var r = lvl.rooms[i];
      if (x - gap < r.x + r.w && x + w + gap > r.x &&
          y - gap < r.y + r.h && y + h + gap > r.y) return true;
    }
    return false;
  }

  function carveCorridor(lvl, x0, y0, x1, y1) {
    var x = x0, y = y0;
    var horizFirst = U.rnd() < 0.5;
    function dig(xx, yy) {
      if (lvl.map[yy][xx] === T.ROCK) lvl.map[yy][xx] = T.CORR;
    }
    if (horizFirst) {
      while (x !== x1) { x += x < x1 ? 1 : -1; dig(x, y); }
      while (y !== y1) { y += y < y1 ? 1 : -1; dig(x, y); }
    } else {
      while (y !== y1) { y += y < y1 ? 1 : -1; dig(x, y); }
      while (x !== x1) { x += x < x1 ? 1 : -1; dig(x, y); }
    }
  }

  function placeDoors(lvl) {
    for (var y = 1; y < lvl.h - 1; y++) {
      for (var x = 1; x < lvl.w - 1; x++) {
        if (lvl.map[y][x] !== T.CORR) continue;
        var floorN = (lvl.map[y - 1][x] === T.FLOOR) + (lvl.map[y + 1][x] === T.FLOOR) +
                     (lvl.map[y][x - 1] === T.FLOOR) + (lvl.map[y][x + 1] === T.FLOOR);
        var rockN = (lvl.map[y - 1][x] === T.ROCK) + (lvl.map[y + 1][x] === T.ROCK) +
                    (lvl.map[y][x - 1] === T.ROCK) + (lvl.map[y][x + 1] === T.ROCK);
        var doorAdj = [lvl.map[y - 1][x], lvl.map[y + 1][x], lvl.map[y][x - 1], lvl.map[y][x + 1]]
          .some(function (t) { return t === T.DOORC || t === T.DOORO; });
        if (floorN >= 1 && rockN >= 2 && !doorAdj && U.rnd() < 0.6) {
          lvl.map[y][x] = U.rnd() < 0.6 ? T.DOORC : T.DOORO;
        }
      }
    }
  }

  function randomFloor(lvl) {
    for (var tries = 0; tries < 500; tries++) {
      var r = U.pick(lvl.rooms);
      var x = U.ri(r.x, r.x + r.w - 1), y = U.ri(r.y, r.y + r.h - 1);
      if (lvl.map[y][x] === T.FLOOR) return { x: x, y: y };
    }
    return { x: lvl.rooms[0].x, y: lvl.rooms[0].y };
  }

  function generate(depth) {
    var lvl = makeLevel(132, 44, T.ROCK);
    lvl.depth = depth;
    var target = U.ri(9, 14);
    for (var tries = 0; tries < 300 && lvl.rooms.length < target; tries++) {
      var w = U.ri(6, 14), h = U.ri(4, 8);
      var x = U.ri(1, lvl.w - w - 2), y = U.ri(1, lvl.h - h - 2);
      if (!overlaps(lvl, x, y, w, h, 2)) {
        var lit = U.rnd() < (depth < 15 ? 0.85 : 0.5);
        carveRoom(lvl, x, y, w, h, lit);
      }
    }
    for (var i = 1; i < lvl.rooms.length; i++) {
      var a = lvl.rooms[i - 1], b = lvl.rooms[i];
      carveCorridor(lvl,
        Math.floor(a.x + a.w / 2), Math.floor(a.y + a.h / 2),
        Math.floor(b.x + b.w / 2), Math.floor(b.y + b.h / 2));
    }
    // an extra loop for connectivity variety
    if (lvl.rooms.length > 3) {
      var r1 = U.pick(lvl.rooms), r2 = U.pick(lvl.rooms);
      carveCorridor(lvl,
        Math.floor(r1.x + r1.w / 2), Math.floor(r1.y + r1.h / 2),
        Math.floor(r2.x + r2.w / 2), Math.floor(r2.y + r2.h / 2));
    }
    placeDoors(lvl);

    var p;
    for (i = 0; i < U.ri(1, 2); i++) { p = randomFloor(lvl); lvl.map[p.y][p.x] = T.UP; }
    for (i = 0; i < U.ri(1, 2); i++) { p = randomFloor(lvl); lvl.map[p.y][p.x] = T.DOWN; }

    var nTraps = U.ri(2, 4 + Math.floor(depth / 3));
    for (i = 0; i < nTraps; i++) {
      p = randomFloor(lvl);
      if (lvl.map[p.y][p.x] !== T.FLOOR) continue;
      lvl.traps.push({
        x: p.x, y: p.y, found: false,
        type: U.pick(['dart', 'pit', 'gas', 'teleport', 'trapdoor'])
      });
    }
    return lvl;
  }

  function town() {
    var lvl = makeLevel(67, 22, T.FLOOR);
    lvl.isTown = true;
    var x, y;
    for (x = 0; x < lvl.w; x++) { lvl.map[0][x] = T.ROCK; lvl.map[lvl.h - 1][x] = T.ROCK; }
    for (y = 0; y < lvl.h; y++) { lvl.map[y][0] = T.ROCK; lvl.map[y][lvl.w - 1] = T.ROCK; }

    // six store buildings, doors face the central plaza
    var spots = [
      { x: 5,  y: 3,  doorY: 7,  store: 0 },
      { x: 27, y: 3,  doorY: 7,  store: 1 },
      { x: 49, y: 3,  doorY: 7,  store: 2 },
      { x: 5,  y: 14, doorY: 14, store: 3 },
      { x: 27, y: 14, doorY: 14, store: 4 },
      { x: 49, y: 14, doorY: 14, store: 5 }
    ];
    for (var i = 0; i < spots.length; i++) {
      var s = spots[i];
      for (y = s.y; y < s.y + 5; y++) {
        for (x = s.x; x < s.x + 13; x++) lvl.map[y][x] = T.ROCK;
      }
      lvl.map[s.doorY][s.x + 6] = T.STORE + s.store;
    }
    lvl.map[11][33] = T.DOWN;

    // town is in daylight: everything starts explored
    for (y = 0; y < lvl.h; y++) {
      for (x = 0; x < lvl.w; x++) lvl.explored[y][x] = true;
    }
    lvl.rooms.push({ x: 1, y: 1, w: lvl.w - 2, h: lvl.h - 2, lit: true });
    return lvl;
  }

  return { T: T, generate: generate, town: town, randomFloor: randomFloor };
})();
