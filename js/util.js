// util.js -- RNG, dice and geometry helpers
var U = (function () {
  var s = (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0;

  function rnd() { // mulberry32
    s = (s + 0x6D2B79F5) >>> 0;
    var t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function ri(a, b) { return a + Math.floor(rnd() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(rnd() * arr.length)]; }
  function roll(n, d) { var t = 0; for (var i = 0; i < n; i++) t += ri(1, d); return t; }
  function rollStr(str) { // "2d6" or "2d6+3"
    var plus = 0, parts = String(str).split('+');
    if (parts.length > 1) plus = parseInt(parts[1], 10) || 0;
    var p = parts[0].split('d');
    return roll(parseInt(p[0], 10), parseInt(p[1], 10)) + plus;
  }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function dist(x0, y0, x1, y1) { return Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); }
  function line(x0, y0, x1, y1) { // Bresenham, includes both endpoints
    var pts = [], dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    var sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for (;;) {
      pts.push([x0, y0]);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return pts;
  }
  function pad(n, w) { var s2 = String(n); while (s2.length < w) s2 = ' ' + s2; return s2; }

  return { rnd: rnd, ri: ri, pick: pick, roll: roll, rollStr: rollStr, clamp: clamp, dist: dist, line: line, pad: pad };
})();
